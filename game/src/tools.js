// The Gilded Hour — the thief's tools, each at a cost: decoy coins and
// EMP charges are few, and a lockpick needs both hands and time in the open.
import { TOOLS } from './config.js';

// Throws a coin to (x, y) — a click, or E to throw at the cursor. Guards
// close enough to hear it land go and look.
// Returns the landing point when the throw is legal, else null.
export function throwCoin(state, x, y) {
  if (state.coinsLeft <= 0) return null;
  const dx = x - state.thief.x;
  const dy = y - state.thief.y;
  if (Math.hypot(dx, dy) > TOOLS.coinRange) return null;
  if (state.world.blockedAt(x, y)) return null;
  state.coinsLeft -= 1;
  state.coin = { x, y, ring: 0 };
  for (const guard of state.guards) {
    if (Math.hypot(guard.x - x, guard.y - y) < TOOLS.coinLureRadius) guard.hearNoise(x, y);
  }
  state.sound.coin();
  return state.coin;
}

// Fires an EMP charge: every camera near the thief blacks out for a while.
export function fireEMP(state) {
  if (state.empsLeft <= 0) return false;
  state.empsLeft -= 1;
  for (const camera of state.cameras) {
    if (Math.hypot(camera.x - state.thief.x, camera.y - state.thief.y) < TOOLS.empRadius) {
      camera.blackout(TOOLS.empSeconds);
    }
  }
  state.empFlash = 0.35;
  state.sound.emp();
  return true;
}

// Works the lock of the vault door beside the thief while F is held and the
// thief stands still. Returns the door on the frame it springs open.
export function workLock(state, dt) {
  const door = state.world.doorNear(state.thief.x, state.thief.y);
  state.pickingDoor = null;
  if (!door) return null;
  if (!state.input.pick || state.thief.moving) {
    door.picking = Math.max(0, door.picking - dt * 1.5);
    return null;
  }
  state.pickingDoor = door;
  door.picking += dt / TOOLS.pickSeconds;
  if (Math.random() < dt * 6) state.sound.tick();
  if (door.picking >= 1) {
    door.open = true;
    door.picking = 0;
    state.sound.unlock();
    return door;
  }
  return null;
}
