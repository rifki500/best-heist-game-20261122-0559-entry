# The Gilded Vault

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/rifki500/best-heist-game-20261122-0559-entry/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/rifki500/best-heist-game-20261122-0559-entry/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A make.fun entry for **best-heist-game-20261122-0559**: an original
top-down heist game. You are the thief in a midnight museum — the Gilded
Vault. Pocket 3 of the 5 treasures, read the guards' vision cones and the
cameras' sweeps before you move, and reach the green EXIT stairwell.
Entered on [make.fun](https://make.fun/bounty/best-heist-game-20261122-0559).

## How to play

- **Move:** WASD or arrow keys, or click anywhere to walk there.
- **Sneak:** hold Shift — slower, but guards' suspicion fills half as fast.
- **Grab loot:** stand still next to a treasure to pocket it (the Duchess
  Crown, locked in the vault, takes longer). 3 pieces open the EXIT.
- **Guards:** Marlow, Vera and Otto patrol fixed loops with raycast vision
  cones. Walls and crates block sight; plants hide you. A cone fills your
  suspicion — "?" past half, "!" at full, when the guard chases you. If an
  alarmed guard touches you, you are caught.
- **Cameras:** three wall cameras sweep the halls and feed the ALARM meter
  faster than guards do. At 100 the museum locks down and every guard hunts.
- **Tools (they cost score):** smoke bomb [1] — 2 charges, $150 each, a
  cloud no cone can see through; EMP [2] — 1 charge, $300, cameras offline
  for 8 seconds.
- **Win:** reach the EXIT with 3+ treasures. Finish without ever being
  spotted for a GHOST run and a $500 bonus; the best ghost time is kept.
- **Pause:** P or Escape. **Restart:** Space or click on the end screens.
  **Mute:** M.

## How it runs

`main.ts` (standard library only) copies `game/` and `screenshots/` to the
output directory and writes `dossier.json` with the vendored make.fun
library. Serve it locally with `node serve.ts`, then open
http://localhost:8080. The game is plain static files under `game/` — no
library, no network request, every asset a file under `game/`. Sound is
WebAudio bleeps, no audio files.

## Files

- `game/index.html` — the page shell.
- `game/src/config.js` — sizes, speeds, detection rates, colours.
- `game/src/random.js` — a tiny seeded random source.
- `game/src/level.js` — the museum floor: rooms, doors, vault, loot spots,
  guard patrols, camera spots.
- `game/src/guard.js` — guard patrol, raycast vision cone, suspicion, chase.
- `game/src/camera.js` — sweeping wall cameras and EMP shutdown.
- `game/src/tools.js` — smoke bombs and EMP: charges, costs, clouds.
- `game/src/world.js` — game state: thief, loot grabs, alarm meter,
  lockdown, win/lose, ghost runs.
- `game/src/render.js` — all canvas drawing: floor, cones, loot, HUD, menus.
- `game/src/input.js` — keyboard and mouse (click-to-move).
- `game/src/audio.js` — WebAudio bleeps, no sound files.
- `game/src/shots.js` — staged screenshot scenes (`?shot=name`).
- `game/src/main.js` — bootstrap and game loop.
