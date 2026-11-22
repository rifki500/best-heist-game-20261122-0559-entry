// The Gilded Vault — game state. One clear job: the rules. It owns the
// thief, the guards, the cameras, the loot, the tools, the alarm meter and
// the win/lose flow, and answers the renderer's questions about them.
//
// Flow: title -> playing -> won | caught. Pause overlays playing. The exit
// opens once LOOT_GOAL pieces are pocketed; reaching it then wins the run.
// The alarm meter rises while any guard or camera sees the thief and drains
// while hidden; at 100 the museum locks down for a few seconds and every
// guard runs at the thief. A run with the alarm never rising is a GHOST run.
import {
  ALARM_DRAIN, ALARM_FILL, ALARM_FILL_CAMERA, COLS, EMP_SECONDS, GHOST_BONUS,
  GRAB_SECONDS, GRAB_SECONDS_VAULT, LOCKDOWN_SECONDS, LOOT_GOAL, ROWS,
  SMOKE_SECONDS, THIEF_SNEAK_SPEED, THIEF_SPEED, TILE,
} from './config.js';
import { Camera } from './camera.js';
import { Guard } from './guard.js';
import {
  CAMERA_SPOTS, GUARD_PATROLS, LOOT_SPOTS, blocksMove, exitSpot,
  thiefStart, tileCenter, tileKindAt, TILE_KIND,
} from './level.js';
import { Tools } from './tools.js';

export const PHASE = {
  TITLE: 'title',
  PLAYING: 'playing',
  PAUSED: 'paused',
  WON: 'won',
  CAUGHT: 'caught',
};

export class World {
  constructor(sound) {
    this.sound = sound;
    this.rngSeed = 7;
    this.reset();
  }

  reset() {
    const start = thiefStart();
    this.phase = PHASE.TITLE;
    this.thief = { x: start.x, y: start.y, r: 13, angle: -Math.PI / 2, sneaking: false, moving: false };
    this.guards = GUARD_PATROLS.map((p) => new Guard(p));
    this.cameras = CAMERA_SPOTS.map((s) => new Camera(s));
    this.loot = LOOT_SPOTS.map((s) => ({ ...s, taken: false, ...tileCenter(s.col, s.row) }));
    this.tools = new Tools();
    this.alarm = 0;
    this.lockdownTimer = 0;
    this.everSeen = false; // any suspicion or camera sighting, ever: kills GHOST
    this.grabTarget = null;
    this.grabProgress = 0;
    this.time = 0;
    this.message = '';
    this.messageTimer = 0;
    this.bestGhost = this.loadBest();
  }

  loadBest() {
    try {
      const v = window.localStorage.getItem('gilded-vault-best-ghost');
      return v ? Number(v) : null;
    } catch {
      return null;
    }
  }

  saveBest(seconds) {
    try {
      window.localStorage.setItem('gilded-vault-best-ghost', String(seconds));
    } catch {
      // Best time is a nicety, never a failure.
    }
  }

  get lootTaken() {
    return this.loot.filter((l) => l.taken);
  }

  get lootValue() {
    return this.lootTaken.reduce((sum, l) => sum + l.value, 0);
  }

  get score() {
    let s = this.lootValue - this.tools.spent;
    if (this.isGhost) s += GHOST_BONUS;
    return Math.max(0, s);
  }

  get isGhost() {
    return !this.everSeen;
  }

  get exitOpen() {
    return this.lootTaken.length >= LOOT_GOAL;
  }

  get exit() {
    return exitSpot();
  }

  get inLockdown() {
    return this.lockdownTimer > 0;
  }

  // Hidden means: standing in a plant, or inside a smoke cloud. Cones
  // cannot see a hidden thief at all.
  thiefHidden() {
    const col = Math.floor(this.thief.x / TILE);
    const row = Math.floor(this.thief.y / TILE);
    if (tileKindAt(col, row) === TILE_KIND.PLANT) return true;
    return this.tools.inSmoke(this.thief.x, this.thief.y);
  }

  onGuardAlarm(guard) {
    this.everSeen = true;
    this.setMessage(`${guard.name} raised the alarm!`);
    this.sound.alarm();
  }

  setMessage(text, seconds = 2.5) {
    this.message = text;
    this.messageTimer = seconds;
  }

  start() {
    this.reset();
    this.phase = PHASE.PLAYING;
  }

  // One fixed step of the simulation. Input is read here so the same step
  // drives both live play and the staged screenshot scenes.
  update(dt, input) {
    if (this.phase === PHASE.PLAYING) this.time += dt;
    if (this.messageTimer > 0) this.messageTimer -= dt;

    // One-shot actions, in every phase that allows them.
    if (input.wasPressed(' ')) {
      if (this.phase === PHASE.TITLE || this.phase === PHASE.WON || this.phase === PHASE.CAUGHT) {
        this.start();
        input.consume();
        return;
      }
    }
    if (input.wasPressed('click')) {
      if (this.phase === PHASE.TITLE || this.phase === PHASE.WON || this.phase === PHASE.CAUGHT) {
        this.start();
        input.consume();
        return;
      }
    }
    if (input.wasPressed('p') || input.wasPressed('escape')) {
      if (this.phase === PHASE.PLAYING) this.phase = PHASE.PAUSED;
      else if (this.phase === PHASE.PAUSED) this.phase = PHASE.PLAYING;
    }
    if (input.wasPressed('m')) this.sound.muted = !this.sound.muted;
    if (this.phase !== PHASE.PLAYING) {
      input.consume();
      return;
    }

    if (input.wasPressed('1')) {
      if (this.tools.dropSmoke(this.thief.x, this.thief.y)) {
        this.setMessage('Smoke bomb! Cones cannot see through it. (-$150)');
        this.sound.smoke();
      } else this.setMessage('No smoke bombs left.');
    }
    if (input.wasPressed('2')) {
      if (this.tools.fireEmp(this.cameras)) {
        this.setMessage(`EMP! All cameras offline for ${EMP_SECONDS}s. (-$300)`);
        this.sound.emp();
      } else this.setMessage('EMP already used.');
    }

    this.moveThief(dt, input);
    this.tools.update(dt);
    for (const cam of this.cameras) cam.update(dt);

    // Sensing: guards and cameras look, suspicion and the alarm meter move.
    let spotted = false;
    for (const guard of this.guards) {
      guard.sense(dt, this.thief, this);
      guard.update(dt, this.thief, this);
      if (guard.suspicion > 0) spotted = true;
      if (guard.suspicion >= 55) this.everSeen = true;
      if (guard.alarmed && guard.touches(this.thief)) {
        this.phase = PHASE.CAUGHT;
        this.sound.caught();
        input.consume();
        return;
      }
    }
    for (const cam of this.cameras) {
      cam.sense(this.thief, this);
      if (cam.seeing) {
        spotted = true;
        this.everSeen = true;
      }
    }
    if (spotted) {
      const rate = this.cameras.some((c) => c.seeing) ? ALARM_FILL_CAMERA : ALARM_FILL;
      this.alarm = Math.min(100, this.alarm + rate * dt);
    } else {
      this.alarm = Math.max(0, this.alarm - ALARM_DRAIN * dt);
    }
    if (this.alarm >= 100 && this.lockdownTimer <= 0) {
      this.lockdownTimer = LOCKDOWN_SECONDS;
      this.setMessage('LOCKDOWN! Every guard is hunting you!', 3);
      this.sound.alarm();
      for (const g of this.guards) {
        g.alarmed = true;
        g.calmTimer = LOCKDOWN_SECONDS;
        g.lastSeen = { x: this.thief.x, y: this.thief.y };
      }
    }
    if (this.lockdownTimer > 0) this.lockdownTimer -= dt;

    this.updateGrab(dt);
    this.checkExit();
    input.consume();
  }

  moveThief(dt, input) {
    const t = this.thief;
    t.sneaking = input.sneaking;
    let vx = 0;
    let vy = 0;
    const keys = input.keyVector();
    if (keys) {
      vx = keys.x;
      vy = keys.y;
      input.clearClickTarget();
    } else if (input.clickTarget) {
      const dx = input.clickTarget.x - t.x;
      const dy = input.clickTarget.y - t.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 6) {
        input.clearClickTarget();
      } else {
        vx = dx / dist;
        vy = dy / dist;
      }
    }
    t.moving = vx !== 0 || vy !== 0;
    if (t.moving) {
      const speed = t.sneaking ? THIEF_SNEAK_SPEED : THIEF_SPEED;
      t.angle = Math.atan2(vy, vx);
      this.slide(t, vx * speed * dt, vy * speed * dt);
    }
  }

  // Move with wall sliding: try x then y separately, so the thief glides
  // along walls instead of sticking on corners.
  slide(t, dx, dy) {
    const r = t.r;
    const tryX = t.x + dx;
    if (!this.hitsSolid(tryX - r, t.y - r) && !this.hitsSolid(tryX + r, t.y - r)
      && !this.hitsSolid(tryX - r, t.y + r) && !this.hitsSolid(tryX + r, t.y + r)) {
      t.x = tryX;
    }
    const tryY = t.y + dy;
    if (!this.hitsSolid(t.x - r, tryY - r) && !this.hitsSolid(t.x + r, tryY - r)
      && !this.hitsSolid(t.x - r, tryY + r) && !this.hitsSolid(t.x + r, tryY + r)) {
      t.y = tryY;
    }
    t.x = Math.max(r + 1, Math.min(COLS * TILE - r - 1, t.x));
    t.y = Math.max(r + 1, Math.min(ROWS * TILE - r - 1, t.y));
  }

  hitsSolid(px, py) {
    const col = Math.floor(px / TILE);
    const row = Math.floor(py / TILE);
    return blocksMove(col, row);
  }

  // Standing still next to a loot piece channels the grab. Moving cancels
  // it; the vault crown takes longer than the rest.
  updateGrab(dt) {
    const t = this.thief;
    let near = null;
    for (const l of this.loot) {
      if (l.taken) continue;
      if (Math.hypot(l.x - t.x, l.y - t.y) < 34) { near = l; break; }
    }
    if (near && !t.moving) {
      if (this.grabTarget !== near) {
        this.grabTarget = near;
        this.grabProgress = 0;
      }
      const need = near.id === 'crown' ? GRAB_SECONDS_VAULT : GRAB_SECONDS;
      this.grabProgress += dt / need;
      if (this.grabProgress >= 1) {
        near.taken = true;
        this.grabTarget = null;
        this.grabProgress = 0;
        this.setMessage(`${near.name} pocketed! +$${near.value.toLocaleString()}`);
        this.sound.pickup();
      }
    } else {
      this.grabTarget = null;
      this.grabProgress = 0;
    }
  }

  checkExit() {
    if (!this.exitOpen) return;
    const e = this.exit;
    const t = this.thief;
    if (Math.hypot(e.x - t.x, e.y - t.y) < 30) {
      this.phase = PHASE.WON;
      this.sound.win();
      if (this.isGhost) {
        if (this.bestGhost === null || this.time < this.bestGhost) {
          this.bestGhost = this.time;
          this.saveBest(this.time);
        }
      }
    }
  }
}
