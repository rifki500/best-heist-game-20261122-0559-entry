// The Gilded Vault — all canvas drawing. One clear job: turn the world
// into a picture. Floor, walls, cones, loot, people, HUD and menus.
//
// Vision cones are raycast: each cone is a polygon of short rays that stop
// at the first wall or crate, so light pools around cover instead of
// bleeding through it. The whole museum fits in one 1280 by 800 frame, so
// the cover screenshot shows the room, the thief, the guards and their
// cones, the cameras, the loot and the alarm meter at once.
import {
  CAMERA_HALF_ANGLE, CAMERA_RANGE, COLORS, COLS, CONE_HALF_ANGLE, CONE_RANGE,
  HUD_H, LOOT_GOAL, ROWS, TILE, VIEW_H, VIEW_W,
} from './config.js';
import { blocksSight, tileKindAt, TILE_KIND } from './level.js';
import { PHASE } from './world.js';

function fmtMoney(n) {
  return '$' + n.toLocaleString('en-US');
}

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Cast rays across a cone and return the polygon of where the light lands.
function conePolygon(x, y, angle, halfAngle, range) {
  const rays = 26;
  const pts = [{ x, y }];
  for (let i = 0; i <= rays; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let d = 0;
    while (d < range) {
      d += 6;
      const px = x + dx * d;
      const py = y + dy * d;
      if (px < 0 || py < 0 || px >= VIEW_W || py >= VIEW_H) break;
      if (blocksSight(Math.floor(px / TILE), Math.floor(py / TILE))) break;
    }
    pts.push({ x: x + dx * Math.min(d, range), y: y + dy * Math.min(d, range) });
  }
  return pts;
}

function drawCone(ctx, x, y, angle, halfAngle, range, fill) {
  const pts = conePolygon(x, y, angle, halfAngle, range);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  // Flat fill first so the cone reads at a glance, then a radial fade so
  // its far edge dissolves instead of ending in a hard line.
  ctx.fillStyle = fill;
  ctx.fill();
  const grad = ctx.createRadialGradient(x, y, range * 0.25, x, y, range);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.30)');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawFloor(ctx, world) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = col * TILE;
      const y = row * TILE;
      const k = tileKindAt(col, row);
      if (k === TILE_KIND.WALL) continue;
      ctx.fillStyle = (col + row) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, TILE, TILE);
      // Central hall carpet runner, down the middle of the vault hall.
      if (col >= 15 && col <= 16 && row >= 1 && row <= 18) {
        ctx.fillStyle = COLORS.carpet;
        ctx.fillRect(x + 3, y, TILE - 6, TILE);
        ctx.fillStyle = COLORS.carpetTrim;
        ctx.fillRect(x + 3, y, 2, TILE);
        ctx.fillRect(x + TILE - 5, y, 2, TILE);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    }
  }
}

function drawWallsAndProps(ctx) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const k = tileKindAt(col, row);
      const x = col * TILE;
      const y = row * TILE;
      if (k === TILE_KIND.WALL) {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(x, y, TILE, 4);
        ctx.fillStyle = COLORS.wallGold;
        ctx.fillRect(x, y + TILE - 3, TILE, 2);
      } else if (k === TILE_KIND.CRATE) {
        ctx.fillStyle = COLORS.crate;
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.strokeStyle = COLORS.crateEdge;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 3);
        ctx.lineTo(x + TILE - 3, y + TILE - 3);
        ctx.moveTo(x + TILE - 3, y + 3);
        ctx.lineTo(x + 3, y + TILE - 3);
        ctx.stroke();
      } else if (k === TILE_KIND.PEDESTAL) {
        ctx.fillStyle = COLORS.pedestal;
        ctx.fillRect(x + 8, y + 8, TILE - 16, TILE - 16);
        ctx.fillStyle = COLORS.pedestalTop;
        ctx.fillRect(x + 6, y + 6, TILE - 12, 6);
      } else if (k === TILE_KIND.PLANT) {
        ctx.fillStyle = COLORS.plant;
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.plantLight;
        ctx.beginPath();
        ctx.arc(x + TILE / 2 - 6, y + TILE / 2 - 5, 7, 0, Math.PI * 2);
        ctx.arc(x + TILE / 2 + 7, y + TILE / 2 + 4, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawLootIcon(ctx, loot) {
  const { x, y } = loot;
  ctx.save();
  ctx.translate(x, y);
  // Glow so loot reads at a glance.
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
  glow.addColorStop(0, COLORS.lootGlow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#e8c85a';
  ctx.fillStyle = '#f4d878';
  if (loot.kind === 'painting') {
    ctx.fillStyle = '#7a4a2b';
    ctx.fillRect(-13, -10, 26, 20);
    ctx.strokeStyle = '#e8c85a';
    ctx.strokeRect(-13, -10, 26, 20);
    ctx.fillStyle = '#e87a3a';
    ctx.beginPath();
    ctx.arc(-3, -2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4d878';
    ctx.beginPath();
    ctx.arc(5, 4, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (loot.kind === 'gem') {
    ctx.fillStyle = '#54d8e8';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(11, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-11, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#bff4ff';
    ctx.stroke();
  } else if (loot.kind === 'gold') {
    ctx.fillStyle = '#e8b93a';
    ctx.fillRect(-13, 2, 26, 8);
    ctx.fillRect(-9, -6, 18, 8);
    ctx.fillRect(-5, -13, 10, 7);
    ctx.strokeStyle = '#f4d878';
    ctx.strokeRect(-13, 2, 26, 8);
  } else if (loot.kind === 'crown') {
    ctx.fillStyle = '#f4d878';
    ctx.beginPath();
    ctx.moveTo(-13, 8);
    ctx.lineTo(-13, -8);
    ctx.lineTo(-6, 0);
    ctx.lineTo(0, -12);
    ctx.lineTo(6, 0);
    ctx.lineTo(13, -8);
    ctx.lineTo(13, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e8b93a';
    ctx.stroke();
    ctx.fillStyle = '#e05252';
    ctx.beginPath();
    ctx.arc(0, 2, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // vase
    ctx.fillStyle = '#5a8ae8';
    ctx.beginPath();
    ctx.moveTo(-5, -12);
    ctx.lineTo(5, -12);
    ctx.lineTo(8, -4);
    ctx.lineTo(10, 4);
    ctx.lineTo(5, 12);
    ctx.lineTo(-5, 12);
    ctx.lineTo(-10, 4);
    ctx.lineTo(-8, -4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#bcd4ff';
    ctx.stroke();
  }
  ctx.restore();
  // Value label under the loot.
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4d878';
  ctx.fillText(fmtMoney(loot.value), x, y + 30);
}

function drawExit(ctx, world) {
  const e = world.exit;
  const open = world.exitOpen;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = open ? 'rgba(55, 201, 120, 0.25)' : 'rgba(90, 106, 122, 0.20)';
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = open ? COLORS.exit : COLORS.exitLocked;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = open ? COLORS.exit : COLORS.exitLocked;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCKED', 0, -38);
  if (!open) {
    ctx.fillStyle = '#9aa0b0';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(`need ${LOOT_GOAL} loot`, 0, 40);
  }
  ctx.restore();
}

function drawGuard(ctx, guard) {
  const { x, y } = guard.pos;
  // Suspicion arc over the guard's head.
  if (guard.suspicion > 2) {
    ctx.strokeStyle = guard.alarmed ? '#e05252' : '#e8c85a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y - 20, 12, -Math.PI / 2, -Math.PI / 2 + (guard.suspicion / 100) * Math.PI * 2);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(guard.angle);
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.guardTrim;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cap brim + nose show facing.
  ctx.fillStyle = COLORS.guardTrim;
  ctx.fillRect(8, -6, 7, 12);
  ctx.restore();
  // "?" while suspicious, "!" while alarmed.
  if (guard.alarmed || guard.suspicious) {
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = guard.alarmed ? '#ff6a5e' : '#f4c542';
    ctx.fillText(guard.alarmed ? '!' : '?', x, y - 32);
  }
}

function drawCamera(ctx, cam) {
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.rotate(cam.angle);
  ctx.fillStyle = cam.disabled ? '#4a4f5e' : '#8a94a8';
  ctx.fillRect(-4, -4, 14, 8);
  ctx.fillStyle = cam.disabled ? '#333' : '#ff5a4e';
  ctx.beginPath();
  ctx.arc(11, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = cam.disabled ? '#8a94a8' : '#9fc8ff';
  const labelX = Math.max(34, Math.min(VIEW_W - 34, cam.x));
  ctx.fillText(cam.disabled ? 'OFFLINE' : cam.name, labelX, cam.y - 16);
}

function drawThief(ctx, thief, world) {
  const { x, y } = thief;
  ctx.save();
  ctx.translate(x, y);
  // Soft shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 9, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(thief.angle);
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.thiefTrim;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Mask band + eyes.
  ctx.fillStyle = COLORS.thiefTrim;
  ctx.fillRect(2, -7, 9, 14);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(4, -4, 2, 0, Math.PI * 2);
  ctx.arc(4, 4, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Grab progress ring while pocketing loot.
  if (world.grabTarget) {
    ctx.strokeStyle = '#f4d878';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 20, -Math.PI / 2, -Math.PI / 2 + world.grabProgress * Math.PI * 2);
    ctx.stroke();
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4d878';
    ctx.fillText('GRABBING…', x, y - 28);
  }
  if (thief.sneaking) {
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9aa0b0';
    ctx.fillText('sneaking', x, y + 28);
  }
}

function drawHud(ctx, world) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = COLORS.wallGold;
  ctx.fillRect(0, HUD_H, VIEW_W, 2);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#e8c85a';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('THE GILDED VAULT', 16, 26);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '12px system-ui, sans-serif';
  const taken = world.lootTaken.length;
  ctx.fillText(`Loot ${taken}/5  ·  goal ${LOOT_GOAL} to open the exit`, 16, 46);

  // Loot value, centre.
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(fmtMoney(world.lootValue), VIEW_W / 2, 26);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(world.exitOpen ? 'EXIT OPEN — run for it!' : 'pocket loot, then reach the EXIT', VIEW_W / 2, 46);

  // Alarm meter, right of centre.
  const ax = VIEW_W - 430;
  ctx.textAlign = 'left';
  ctx.fillStyle = world.alarm > 70 ? COLORS.alarmHigh : world.alarm > 35 ? COLORS.alarmMid : COLORS.hudDim;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(world.inLockdown ? 'LOCKDOWN!' : 'ALARM', ax, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(ax, 30, 190, 12);
  const alarmColor = world.alarm > 70 ? COLORS.alarmHigh : world.alarm > 35 ? COLORS.alarmMid : COLORS.alarmLow;
  ctx.fillStyle = alarmColor;
  ctx.fillRect(ax, 30, 190 * (world.alarm / 100), 12);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax + 0.5, 30.5, 190, 12);

  // Tools, far right.
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(`SMOKE [1] ×${world.tools.smokeCharges}  −$${150}`, VIEW_W - 16, 24);
  ctx.fillText(`EMP [2] ×${world.tools.empCharges}  −$${300}`, VIEW_W - 16, 44);
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`TIME ${fmtTime(world.time)}`, ax, 54);
}

function drawObjectiveBar(ctx, world) {
  const y = VIEW_H - 26;
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, y, VIEW_W, 26);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const goal = world.exitOpen
    ? 'EXIT IS OPEN — reach the green stairwell before the guards close in!'
    : `Pocket ${LOOT_GOAL - world.lootTaken.length} more loot to open the exit  ·  WASD/arrows or click to move  ·  Shift sneak  ·  1 smoke  ·  2 EMP  ·  P pause`;
  ctx.fillText(goal, VIEW_W / 2, y + 17);
  if (world.message && world.messageTimer > 0) {
    ctx.fillStyle = '#f4d878';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(world.message, VIEW_W / 2, y - 12);
  }
}

function drawOverlay(ctx, world) {
  ctx.fillStyle = 'rgba(8, 10, 16, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  if (world.phase === PHASE.TITLE) {
    ctx.fillStyle = '#e8c85a';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText('THE GILDED VAULT', VIEW_W / 2, 240);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '20px Georgia, serif';
    ctx.fillText('A midnight museum heist — in, out, and never seen.', VIEW_W / 2, 285);
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = '#c8ccd8';
    const lines = [
      'Pocket 3 of the 5 treasures, then reach the green EXIT stairwell.',
      'Guards patrol with vision cones — read them before you move.',
      'Cameras sweep the halls and feed the ALARM meter. Plants and smoke hide you.',
      'Smoke bombs [1] cost $150, the EMP [2] costs $300 — tools eat your score.',
      'Shift sneaks (slower, harder to spot). Stand still by loot to grab it.',
      'Finish unseen for a GHOST run and a $500 bonus.',
    ];
    lines.forEach((l, i) => ctx.fillText(l, VIEW_W / 2, 340 + i * 28));
    ctx.fillStyle = '#f4d878';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('CLICK OR PRESS SPACE TO START', VIEW_W / 2, 540);
    if (world.bestGhost !== null) {
      ctx.fillStyle = COLORS.hudDim;
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(`Best GHOST run: ${fmtTime(world.bestGhost)}`, VIEW_W / 2, 575);
    }
  } else if (world.phase === PHASE.PAUSED) {
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 48px Georgia, serif';
    ctx.fillText('PAUSED', VIEW_W / 2, 380);
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Press P or Escape to keep sneaking.', VIEW_W / 2, 425);
  } else if (world.phase === PHASE.WON) {
    ctx.fillStyle = COLORS.exit;
    ctx.font = 'bold 56px Georgia, serif';
    ctx.fillText(world.isGhost ? 'GHOST GETAWAY!' : 'CLEAN GETAWAY!', VIEW_W / 2, 260);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '20px system-ui, sans-serif';
    const lines = [
      `Loot: ${fmtMoney(world.lootValue)}   Tools spent: −${fmtMoney(world.tools.spent)}`,
      world.isGhost ? `GHOST bonus: +${fmtMoney(500)} — never once spotted!` : 'Spotted along the way — no ghost bonus this time.',
      `Score: ${fmtMoney(world.score)}   Time: ${fmtTime(world.time)}`,
    ];
    if (world.isGhost && world.bestGhost !== null) lines.push(`Best GHOST run: ${fmtTime(world.bestGhost)}`);
    lines.forEach((l, i) => ctx.fillText(l, VIEW_W / 2, 320 + i * 34));
    ctx.fillStyle = '#f4d878';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('PRESS SPACE TO STEAL AGAIN', VIEW_W / 2, 480);
  } else if (world.phase === PHASE.CAUGHT) {
    ctx.fillStyle = '#e05252';
    ctx.font = 'bold 56px Georgia, serif';
    ctx.fillText('CAUGHT!', VIEW_W / 2, 260);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('A guard laid hands on you under the alarm.', VIEW_W / 2, 315);
    ctx.fillText(`You kept ${fmtMoney(world.lootValue)} of loot — but the night is over.`, VIEW_W / 2, 355);
    ctx.fillStyle = '#f4d878';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('PRESS SPACE TO TRY AGAIN', VIEW_W / 2, 430);
  }
}

export function render(ctx, world) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#10121a';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx, world);
  for (const loot of world.loot) {
    if (!loot.taken) drawLootIcon(ctx, loot);
  }
  drawExit(ctx, world);
  // Vision cones: cameras first (pale blue), then guards (gold/orange/red).
  for (const cam of world.cameras) {
    drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA_HALF_ANGLE, CAMERA_RANGE,
      cam.disabled ? COLORS.coneCameraOff : COLORS.coneCamera);
  }
  for (const guard of world.guards) {
    const fill = guard.alarmed ? COLORS.coneAlarm
      : guard.suspicious ? COLORS.coneSuspicious : COLORS.coneCalm;
    drawCone(ctx, guard.pos.x, guard.pos.y, guard.angle, CONE_HALF_ANGLE, CONE_RANGE, fill);
  }
  // Smoke clouds sit above the cones and hide what is inside them.
  for (const s of world.tools.smokes) {
    ctx.fillStyle = COLORS.smoke;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220,220,230,0.25)';
    ctx.beginPath();
    ctx.arc(s.x - 20, s.y + 10, s.radius * 0.5, 0, Math.PI * 2);
    ctx.arc(s.x + 25, s.y - 12, s.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  drawWallsAndProps(ctx);
  for (const cam of world.cameras) drawCamera(ctx, cam);
  for (const guard of world.guards) drawGuard(ctx, guard);
  drawThief(ctx, world.thief, world);
  // Vignette for the night-museum mood.
  const vg = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.45, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.95);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawHud(ctx, world);
  drawObjectiveBar(ctx, world);
  if (world.phase !== PHASE.PLAYING) drawOverlay(ctx, world);
}
