// The Gilded Vault — tuning, sizes and colours. One clear job: every number
// the game balances on lives here, so a tweak never means hunting through logic.
export const TILE = 40;
export const COLS = 32;
export const ROWS = 20;
export const VIEW_W = COLS * TILE; // 1280
export const VIEW_H = ROWS * TILE; // 800
export const HUD_H = 58;

export const THIEF_SPEED = 168; // px per second, walking
export const THIEF_SNEAK_SPEED = 96; // holding Shift: slower, harder to spot
export const GUARD_SPEED = 92; // patrol walk
export const GUARD_CHASE_SPEED = 178; // alarmed run
export const GUARD_CATCH_RADIUS = 20;

export const CONE_RANGE = 175;
export const CONE_HALF_ANGLE = 0.56; // radians, ~32 degrees each side
export const CAMERA_RANGE = 205;
export const CAMERA_HALF_ANGLE = 0.49;

export const DETECT_FILL = 58; // suspicion per second while seen
export const DETECT_FILL_SNEAK = 26; // while the thief sneaks
export const DETECT_DRAIN = 30; // suspicion per second while hidden
export const ALARM_FILL = 34; // alarm meter per second while anyone spots the thief
export const ALARM_FILL_CAMERA = 44; // a camera spots faster than a guard
export const ALARM_DRAIN = 13;
export const LOCKDOWN_SECONDS = 6;

export const LOOT_GOAL = 3; // loot pieces needed before the exit opens
export const GRAB_SECONDS = 0.6; // channel time to pocket a loot piece
export const GRAB_SECONDS_VAULT = 1.6; // the crown, inside the vault, takes longer
export const GHOST_BONUS = 500;

export const SMOKE_CHARGES = 2;
export const SMOKE_COST = 150;
export const SMOKE_SECONDS = 6;
export const SMOKE_RADIUS = 78;
export const EMP_CHARGES = 1;
export const EMP_COST = 300;
export const EMP_SECONDS = 8;

export const COLORS = {
  floorA: '#3a4050',
  floorB: '#333947',
  carpet: '#6e2733',
  carpetTrim: '#a8843a',
  wall: '#2b3040',
  wallTop: '#5d6780',
  wallGold: '#a8843a',
  crate: '#6b4a26',
  crateEdge: '#8a6136',
  plant: '#1e4d2e',
  plantLight: '#2f7a44',
  pedestal: '#4a4f5e',
  pedestalTop: '#6a7080',
  thief: '#14101f',
  thiefTrim: '#e8c85a',
  guard: '#1d2f57',
  guardTrim: '#d8dee9',
  coneCalm: 'rgba(232, 200, 90, 0.34)',
  coneSuspicious: 'rgba(240, 140, 40, 0.42)',
  coneAlarm: 'rgba(220, 50, 50, 0.46)',
  coneCamera: 'rgba(140, 200, 255, 0.32)',
  coneCameraOff: 'rgba(120, 120, 120, 0.12)',
  lootGlow: 'rgba(232, 200, 90, 0.55)',
  exit: '#37c978',
  exitLocked: '#5a6a7a',
  alarmLow: '#37c978',
  alarmMid: '#e8c85a',
  alarmHigh: '#e05252',
  smoke: 'rgba(190, 190, 200, 0.42)',
  hudBg: 'rgba(10, 12, 18, 0.86)',
  hudText: '#e8e4d8',
  hudDim: '#9aa0b0',
};
