// The Gilded Hour — security cameras: mounted eyes that sweep their arc
// and feed the alarm meter. They cannot chase, but an EMP blacks them out
// and a thief who reads the sweep walks under them untouched.
import { TILE, SIGHT } from './config.js';
import { canSee } from './vision.js';

export class Camera {
  constructor(spec) {
    this.x = spec.tx * TILE + TILE / 2;
    this.y = spec.ty * TILE + TILE / 2;
    this.base = spec.base;
    this.sweep = spec.sweep;
    this.speed = spec.speed;
    this.phase = spec.phase ?? 0;
    this.angle = spec.base;
    this.disabledLeft = 0; // seconds of EMP blackout remaining
  }

  update(dt, time) {
    this.angle = this.base + Math.sin(time * this.speed + this.phase) * this.sweep;
    if (this.disabledLeft > 0) this.disabledLeft -= dt;
  }

  blackout(seconds) {
    this.disabledLeft = Math.max(this.disabledLeft, seconds);
  }

  // 0 when the thief is unseen (or the camera is dead), else 0..1 by depth.
  sees(world, thief) {
    if (this.disabledLeft > 0) return 0;
    return canSee(world, this.x, this.y, this.angle, SIGHT.cameraHalfAngle, SIGHT.cameraRange, thief.x, thief.y);
  }
}
