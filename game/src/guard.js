// Guards: patrol, vision cone, suspicion and the chase. One clear job:
// everything a patrolling guard does, and nothing else.
//
// A guard walks a fixed waypoint loop at patrol speed, facing where it
// walks. Its vision cone is a wedge: range, half-angle, and a line of sight
// that walls and crates block. While the thief stands inside the cone and
// in sight, suspicion fills; hidden, it drains. Past 55 the guard is
// suspicious ("?"), at 100 it is alarmed ("!") and chases the thief's last
// seen spot. An alarmed guard that touches the thief catches them. After
// losing sight for a while an alarmed guard calms back to patrol.
import {
  CONE_HALF_ANGLE, CONE_RANGE, DETECT_DRAIN, DETECT_FILL, DETECT_FILL_SNEAK,
  GUARD_CATCH_RADIUS, GUARD_CHASE_SPEED, GUARD_SPEED, TILE,
} from './config.js';
import { blocksSight, tileCenter } from './level.js';

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// True when nothing solid stands between (x0, y0) and (x1, y1): sample the
// segment every 8 px and ask the level whether that tile blocks sight.
export function hasLineOfSight(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const col = Math.floor((x0 + dx * t) / TILE);
    const row = Math.floor((y0 + dy * t) / TILE);
    if (blocksSight(col, row)) return false;
  }
  return true;
}

export class Guard {
  constructor(patrol) {
    this.name = patrol.name;
    this.waypoints = patrol.waypoints.map(([col, row]) => tileCenter(col, row));
    this.pos = { ...this.waypoints[0] };
    this.next = 1 % this.waypoints.length;
    this.angle = 0;
    this.suspicion = 0; // 0..100
    this.alarmed = false;
    this.calmTimer = 0;
    this.lastSeen = null;
    this.walkPhase = 0;
  }

  // Move along the patrol loop, or chase the last seen spot while alarmed.
  update(dt, thief, world) {
    const speed = this.alarmed ? GUARD_CHASE_SPEED : GUARD_SPEED;
    const target = this.alarmed && this.lastSeen ? this.lastSeen : this.waypoints[this.next];
    const dx = target.x - this.pos.x;
    const dy = target.y - this.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) {
      if (!this.alarmed) this.next = (this.next + 1) % this.waypoints.length;
      else this.lastSeen = null; // reached the spot, look around, then resume
    } else {
      const step = Math.min(dist, speed * dt);
      this.pos.x += (dx / dist) * step;
      this.pos.y += (dy / dist) * step;
      this.angle = Math.atan2(dy, dx);
      this.walkPhase += dt * 9;
    }
    if (this.alarmed) {
      this.calmTimer -= dt;
      if (this.calmTimer <= 0 && !this.canSee(thief, world)) {
        this.alarmed = false;
        this.suspicion = 55; // stays wary, does not forget at once
      }
    }
  }

  // Is the thief inside this guard's cone and in line of sight right now?
  // Plants and smoke hide the thief even inside the cone.
  canSee(thief, world) {
    const dx = thief.x - this.pos.x;
    const dy = thief.y - this.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > CONE_RANGE) return false;
    if (Math.abs(angleDiff(Math.atan2(dy, dx), this.angle)) > CONE_HALF_ANGLE) return false;
    if (world.thiefHidden()) return false;
    return hasLineOfSight(this.pos.x, this.pos.y, thief.x, thief.y);
  }

  // Fill or drain suspicion from what the guard sees this frame.
  sense(dt, thief, world) {
    if (this.canSee(thief, world)) {
      const rate = thief.sneaking ? DETECT_FILL_SNEAK : DETECT_FILL;
      this.suspicion = Math.min(100, this.suspicion + rate * dt);
      this.lastSeen = { x: thief.x, y: thief.y };
      if (this.suspicion >= 100 && !this.alarmed) {
        this.alarmed = true;
        this.calmTimer = 4;
        world.onGuardAlarm(this);
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - DETECT_DRAIN * dt);
    }
  }

  get suspicious() {
    return !this.alarmed && this.suspicion >= 55;
  }

  get catching() {
    return this.alarmed;
  }

  touches(thief) {
    return Math.hypot(thief.x - this.pos.x, thief.y - this.pos.y) < GUARD_CATCH_RADIUS;
  }
}
