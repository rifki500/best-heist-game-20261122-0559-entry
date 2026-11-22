// The Gilded Vault — the museum floor. One clear job: the map, what each
// tile does, and where the loot, the exit and the thief start. The plan is a
// 32 by 20 tile grid (40 px tiles, 1280 by 800): a west gallery, an east
// gallery, a central vault hall with a walled vault in its middle, and a
// south corridor. Every room has at least two doors, so there is always
// more than one route through.
//
// Map letters:
//   # wall (blocks movement and sight)   . floor
//   C crate (blocks movement and sight)  P plant (hides the thief, walkable)
//   D pedestal (blocks movement only)    T thief start   E exit stairwell
import { COLS, ROWS, TILE } from './config.js';

export const MAP = [
  '################################',
  '#.........#..........#.........#',
  '#..C......#..........#......C..#',
  '#.........#..........#.........#',
  '#..............................#',
  '#..P......#..........#......P..#',
  '#.........#..........#.........#',
  '#..D......#..........#......D..#',
  '#.........#...####...#.........#',
  '#....#....#...#..#...#....#....#',
  '#.........#...#..#...#.........#',
  '#.........#...#.##...#.........#',
  '#.........#..........#.........#',
  '#..D......#..........#......D..#',
  '#.........#..........#.........#',
  '#..............................#',
  '#..P......#..........#...P.....#',
  '#..T......#..........#......E..#',
  '#.........#..........#.........#',
  '################################',
];

export const TILE_KIND = {
  WALL: 'wall',
  FLOOR: 'floor',
  CRATE: 'crate',
  PLANT: 'plant',
  PEDESTAL: 'pedestal',
};

// Loot pieces: name, value, tile, and how long the grab channel takes.
// The crown sits inside the walled vault (grabbed slower); the rest are on
// pedestals and display cases around the galleries.
export const LOOT_SPOTS = [
  { id: 'painting', name: 'Sunset Portrait', kind: 'painting', value: 1200, col: 5, row: 2, grab: 0.6 },
  { id: 'gem', name: 'Star Sapphire', kind: 'gem', value: 900, col: 26, row: 6, grab: 0.6 },
  { id: 'gold', name: 'Gold Bars', kind: 'gold', value: 1500, col: 18, row: 14, grab: 0.6 },
  { id: 'crown', name: 'Duchess Crown', kind: 'crown', value: 2000, col: 15, row: 9, grab: 1.6 },
  { id: 'vase', name: 'Ming Vase', kind: 'vase', value: 700, col: 4, row: 13, grab: 0.6 },
];

// Guard patrol loops: named guards, each walking a fixed loop the player
// can learn. Waypoints are tile centres.
export const GUARD_PATROLS = [
  {
    name: 'Marlow',
    waypoints: [
      [4, 2], [8, 2], [8, 7], [4, 7],
    ],
  },
  {
    name: 'Vera',
    waypoints: [
      [12, 3], [19, 3], [19, 16], [12, 16],
    ],
  },
  {
    name: 'Otto',
    waypoints: [
      [23, 14], [29, 14], [29, 17], [23, 17],
    ],
  },
];

// Wall cameras: fixed to a wall, sweeping a cone back and forth.
export const CAMERA_SPOTS = [
  { name: 'Cam A', col: 16, row: 0, baseAngle: Math.PI / 2, sweep: 0.85, speed: 0.55 },
  { name: 'Cam B', col: 31, row: 9, baseAngle: Math.PI, sweep: 0.7, speed: 0.45 },
  { name: 'Cam C', col: 16, row: 19, baseAngle: -Math.PI / 2, sweep: 0.85, speed: 0.5 },
];

export function tileAt(col, row) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return '#';
  return MAP[row][col];
}

export function tileKindAt(col, row) {
  const ch = tileAt(col, row);
  if (ch === '#') return TILE_KIND.WALL;
  if (ch === 'C') return TILE_KIND.CRATE;
  if (ch === 'P') return TILE_KIND.PLANT;
  if (ch === 'D') return TILE_KIND.PEDESTAL;
  return TILE_KIND.FLOOR;
}

// A tile blocks movement: walls, crates and pedestals.
export function blocksMove(col, row) {
  const k = tileKindAt(col, row);
  return k === TILE_KIND.WALL || k === TILE_KIND.CRATE || k === TILE_KIND.PEDESTAL;
}

// A tile blocks sight: walls and crates only. Pedestals are low, plants hide
// the thief instead of blocking the cone.
export function blocksSight(col, row) {
  const k = tileKindAt(col, row);
  return k === TILE_KIND.WALL || k === TILE_KIND.CRATE;
}

export function tileCenter(col, row) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

export function findTile(ch) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (MAP[row][col] === ch) return { col, row };
    }
  }
  return null;
}

export function thiefStart() {
  const t = findTile('T');
  return tileCenter(t.col, t.row);
}

export function exitSpot() {
  const t = findTile('E');
  return { ...tileCenter(t.col, t.row), col: t.col, row: t.row };
}
