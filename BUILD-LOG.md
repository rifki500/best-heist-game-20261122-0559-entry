# BUILD-LOG — The Gilded Vault (best-heist-game-20261122-0559)

## The game

The Gilded Vault is an original top-down heist game, written from scratch
in vanilla JavaScript on a 2D canvas (no library). One level: a midnight
museum, 32 by 20 tiles, seen from above in a single 1280 by 800 frame. The
thief must pocket 3 of the 5 treasures (Sunset Portrait $1,200, Star
Sapphire $900, Gold Bars $1,500, Duchess Crown $2,000 inside the walled
vault, Ming Vase $700), then reach the green EXIT stairwell. Three named
guards — Marlow, Vera, Otto — patrol fixed loops with raycast vision cones
that stop at walls and crates; three wall cameras sweep the halls and feed
the ALARM meter faster than guards do. Plants hide the thief, crates block
sight and movement, pedestals block movement only. Suspicion fills while a
guard sees the thief ("?" past half) and drains while hidden; at full the
guard raises the alarm ("!", red cone) and chases, and an alarmed guard
that touches the thief catches them. At 100 alarm the museum locks down
for 6 seconds and every guard hunts. Tools cost score: smoke bomb [1]
(2 charges, $150, a cloud no cone can see through) and EMP [2] (1 charge,
$300, cameras offline 8 s). Shift sneaks (slower, suspicion fills half as
fast). Standing still by loot channels the grab (the crown takes longer).
A run finished without ever being spotted is a GHOST run (+$500, best time
kept). Controls: WASD/arrows or click-to-move, Space start/restart,
P/Escape pause, M mute. Sound is WebAudio bleeps, no audio files.

## Screenshots (real renders, Playwright Chromium headless)

- 1-cover.jpg — `?shot=start`: the full museum, thief at the door, all
  three guards and their cones, all three cameras, every loot piece, alarm
  meter at zero.
- 2-sneak.jpg — `?shot=sneak`: the thief slipping past Marlow's cone at
  62% suspicion, "?" overhead, alarm at 18.
- 3-alarm.jpg — `?shot=alarm`: Vera alarmed, red cone, LOCKDOWN, alarm
  meter at 86.
- 4-win.jpg — `?shot=win`: the GHOST GETAWAY screen, $3,600 loot, $500
  ghost bonus, score $4,100, time 2:54.

## Verification

- Playtest in headless Chromium: 19/19 checks passed (title -> start,
  keyboard move, click-to-move, guard patrol, smoke + EMP charges and
  effects, loot grab by standing still, suspicion filling in a cone,
  caught by an alarmed guard, restart, exit opening with 3 loot, win,
  score with ghost bonus, pause/unpause, no page errors).
- `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` run twice; the
  two outputs compared byte for byte with `diff -r` (identical).
- Screenshots checked: 4 JPEGs, each within the 256 KiB cap (69–103 KiB),
  long side 1280, short side 800.

## Commit

- Repo: https://github.com/rifki500/best-heist-game-20261122-0559-entry
