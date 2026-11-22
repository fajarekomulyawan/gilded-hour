// The Gilded Hour — tuning for one night of burglary.
// Everything the game balances on lives here: speeds, sight, alarm, tools.

export const TILE = 40;
export const VIEW_W = 1280;
export const VIEW_H = 800;

export const THIEF = {
  walk: 148, // px per second on foot
  sneak: 82, // crouched: slower, quieter, harder to see
  sprint: 208, // loud: nearby guards hear the steps
  radius: 13,
  weightDrag: 0.035, // each loot item carried slows the thief by this share
  weightDragMax: 0.32,
};

export const SIGHT = {
  guardRange: 218, // how far a guard's lamp of vision reaches, px
  guardHalfAngle: 0.62, // radians either side of the facing
  cameraRange: 196,
  cameraHalfAngle: 0.5,
  fillNear: 95, // alarm points per second when seen point blank
  fillFar: 26, // ... and at the cone's edge
  cameraFill: 34, // cameras feed the meter steadily
  decay: 9, // meter points per second shed while nobody sees the thief
  sneakFactor: 0.45, // sneaking is seen this slowly
};

export const ALARM = {
  tripAt: 100,
  getawaySeconds: 45, // the countdown to reach the van once it trips
};

export const TOOLS = {
  coins: 3, // decoy coins per job: Space or click throws one, guards go look
  coinRange: 260, // px a coin can be thrown
  coinLureRadius: 190, // guards within this of the landing spot investigate
  emps: 2, // EMP charges per job: Q blacks out nearby cameras
  empRadius: 300,
  empSeconds: 12,
  pickSeconds: 2.6, // holding F at a vault door, in the open, while it opens
};

export const LOOT_VALUES = { gold: 2000, jewel: 1500, cash: 750, art: 2500 };

export const GHOST_BONUS = 2000; // the alarm never trips all job
