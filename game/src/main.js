// The Gilded Vault — bootstrap and game loop. One clear job: wire the
// canvas, the world, the input and the renderer together, and run the loop.
//
// Normal play runs on requestAnimationFrame with a clamped dt. With
// ?shot=name in the URL the game stages one frozen scene instead (see
// shots.js) so screenshots are exact, repeatable frames of real gameplay.
import { VIEW_H, VIEW_W } from './config.js';
import { Input } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import { SoundBank } from './audio.js';
import { World } from './world.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const sound = new SoundBank();
const world = new World(sound);
const input = new Input(canvas);
// A handle for play-testing from the console; the game never reads it.
window.__vault = { world, input };

function announce() {
  if (!statusEl) return;
  const taken = world.lootTaken.length;
  statusEl.textContent =
    `The Gilded Vault. Loot ${taken} of 5, alarm ${Math.round(world.alarm)} percent. ` +
    (world.exitOpen ? 'The exit is open.' : 'Pocket 3 loot pieces to open the exit.');
}

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  // Screenshot mode: one deterministic frame, no animation loop.
  stageShot(world, shot);
  render(ctx, world);
  document.title = `The Gilded Vault — ${shot}`;
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (input.wasPressed(' ') || input.wasPressed('click')) sound.ensure();
    world.update(dt, input);
    render(ctx, world);
    announce();
    requestAnimationFrame(frame);
  }
  render(ctx, world);
  requestAnimationFrame(frame);
}
