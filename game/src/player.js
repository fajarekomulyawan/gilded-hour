// The Gilded Hour — the thief: movement, the weight of the bag, picking.
import { TILE, THIEF } from './config.js';

export class Thief {
  constructor(start) {
    this.x = start.tx * TILE + TILE / 2;
    this.y = start.ty * TILE + TILE / 2;
    this.angle = -Math.PI / 2;
    this.sneaking = false;
    this.sprinting = false;
    this.moving = false;
    this.carried = 0; // loot value in the bag
    this.items = 0; // pieces carried: the bag's weight
    this.stepPhase = 0;
  }

  get speedFactor() {
    return 1 - Math.min(THIEF.weightDragMax, this.items * THIEF.weightDrag);
  }

  update(world, input, dt) {
    let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let mz = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    this.moving = mx !== 0 || mz !== 0;
    this.sneaking = !!input.sneak;
    this.sprinting = this.moving && !!input.sprint;
    if (!this.moving) return;
    const len = Math.hypot(mx, mz);
    mx /= len;
    mz /= len;
    this.angle = Math.atan2(mz, mx);
    const base = this.sneaking ? THIEF.sneak : this.sprinting ? THIEF.sprint : THIEF.walk;
    const speed = base * this.speedFactor;
    world.moveCircle(this, THIEF.radius, mx * speed * dt, 0);
    world.moveCircle(this, THIEF.radius, 0, mz * speed * dt);
    this.stepPhase += dt * (this.sprinting ? 13 : this.sneaking ? 6 : 9);
  }

  // Grab every loose piece within reach. Returns what was taken.
  grab(world) {
    const taken = world.lootNear(this.x, this.y, 24);
    for (const piece of taken) {
      piece.taken = true;
      this.carried += piece.value;
      this.items += 1;
    }
    return taken;
  }
}
