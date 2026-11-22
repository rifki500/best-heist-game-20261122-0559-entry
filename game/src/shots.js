// Staged screenshot scenes (?shot=name). One clear job: put the world in
// a photogenic, deterministic state for the screenshots, then freeze it.
//
// Each scene starts a fresh run, places the thief and the guards, steps the
// simulation a fixed number of frames at a fixed dt, and leaves the world
// paused on that exact frame. The scenes never run during normal play:
// main.js only calls stageShot when the URL carries ?shot=.
//
//   start — the cover: thief at the door, all three guards and their cones,
//           all three cameras, every loot piece, alarm at zero.
//   sneak — the thief slips past Marlow's cone at half suspicion, "?" up.
//   alarm — the alarm meter high, Vera alarmed and chasing, cone red.
//   win   — the getaway: exit open, loot pocketed, win screen up.
import { PHASE } from './world.js';

function stepWorld(world, input, frames, dt = 1 / 60) {
  for (let i = 0; i < frames; i++) world.update(dt, input);
}

// A do-nothing input for staged scenes: no keys, no clicks.
function stillInput() {
  return {
    keys: new Set(),
    clickTarget: null,
    pressed: new Set(),
    wasPressed: () => false,
    consume: () => {},
    keyVector: () => null,
    get sneaking() { return false; },
    clearClickTarget: () => {},
  };
}

export function stageShot(world, name) {
  const input = stillInput();
  world.start();
  if (name === 'start') {
    // Thief just inside the south-west door, guards mid-patrol.
    world.thief.x = 3.5 * 40;
    world.thief.y = 16.5 * 40;
    world.thief.angle = -Math.PI / 2;
    stepWorld(world, input, 240); // 4 s of patrol so cones spread out
  } else if (name === 'sneak') {
    // Thief hugging the west gallery wall, inside Marlow's cone edge.
    world.thief.x = 7.2 * 40;
    world.thief.y = 3.4 * 40;
    world.thief.angle = Math.PI / 2;
    world.thief.sneaking = true;
    stepWorld(world, input, 200);
    // Freeze Marlow mid-turn with suspicion half full, thief in his cone.
    const marlow = world.guards[0];
    marlow.pos.x = 6.4 * 40;
    marlow.pos.y = 2.6 * 40;
    marlow.angle = Math.PI * 0.32;
    marlow.suspicion = 62;
    world.alarm = 18;
  } else if (name === 'alarm') {
    // Vera spotted the thief by the vault: full alarm, red cone, chase.
    world.thief.x = 15.5 * 40;
    world.thief.y = 12.5 * 40;
    world.thief.angle = Math.PI;
    const vera = world.guards[1];
    vera.pos.x = 15.5 * 40;
    vera.pos.y = 15.2 * 40;
    vera.angle = -Math.PI / 2;
    vera.suspicion = 100;
    vera.alarmed = true;
    vera.calmTimer = 4;
    vera.lastSeen = { x: world.thief.x, y: world.thief.y };
    world.alarm = 86;
    world.everSeen = true;
    world.lockdownTimer = 3.5;
    stepWorld(world, input, 12);
    world.alarm = 86;
  } else if (name === 'win') {
    // Three treasures pocketed, thief at the open exit, getaway screen up.
    for (const id of ['painting', 'gem', 'gold']) {
      world.loot.find((l) => l.id === id).taken = true;
    }
    world.thief.x = 28 * 40 + 4;
    world.thief.y = 17 * 40;
    world.thief.angle = 0;
    world.time = 174;
    world.phase = PHASE.WON;
  } else {
    stepWorld(world, input, 120);
  }
  // Freeze: the screenshot is one exact frame, never a moving game. The
  // phase stays PLAYING on purpose — main.js never runs the loop in shot
  // mode, so nothing moves, and no PAUSED overlay covers the scene.
  return world;
}
