// The Gilded Hour — the guards: patrol, pause and sweep, chase a noise,
// hunt the thief. A guard who loses the thief searches where he last saw
// him, then gives up and walks back to his round.
import { TILE, SIGHT } from './config.js';
import { canSee } from './vision.js';

const PATROL_SPEED = 74;
const HUNT_SPEED = 138;
const CHASE_SPEED = 168;

export class Guard {
  constructor(spec) {
    this.waypoints = spec.waypoints.map(([tx, ty]) => ({
      x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2,
    }));
    this.x = this.waypoints[0].x;
    this.y = this.waypoints[0].y;
    this.wpIndex = 1 % this.waypoints.length;
    this.pauseLeft = 0;
    this.pauseTime = spec.pause ?? 1.2;
    this.angle = 0;
    this.sweepPhase = Math.random() * Math.PI * 2;
    this.mode = 'patrol'; // patrol | investigate | chase | search | return
    this.target = null; // point of interest in pixels
    this.loseTimer = 0;
    this.searchTimer = 0;
    this.alert = 0; // 0 calm .. 1 has seen the thief clearly
  }

  get speed() {
    if (this.mode === 'chase') return CHASE_SPEED;
    if (this.mode === 'investigate' || this.mode === 'search' || this.mode === 'return') return HUNT_SPEED;
    return PATROL_SPEED;
  }

  moveToward(world, tx, ty, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 3) return true;
    const step = Math.min(dist, this.speed * dt);
    const before = { x: this.x, y: this.y };
    world.moveCircle(this, 12, (dx / dist) * step, 0);
    world.moveCircle(this, 12, 0, (dy / dist) * step);
    this.angle = Math.atan2(dy, dx);
    if (Math.hypot(this.x - before.x, this.y - before.y) < step * 0.25 && dist > 14) {
      // Shouldered into cover: sidestep around it rather than grinding.
      world.moveCircle(this, 12, -Math.sin(this.angle) * step, Math.cos(this.angle) * step);
    }
    return dist < 16;
  }

  hearNoise(x, y) {
    if (this.mode === 'chase') return;
    this.mode = 'investigate';
    this.target = { x, y };
  }

  update(world, thief, dt, time, alarmed) {
    // What do I see?
    const seen = canSee(world, this.x, this.y, this.angle, SIGHT.guardHalfAngle, SIGHT.guardRange, thief.x, thief.y);
    if (seen > 0) {
      this.alert = Math.min(1, this.alert + dt * (0.6 + seen * 1.6));
      this.loseTimer = 0;
      if (this.alert > 0.35 || alarmed) {
        this.mode = 'chase';
        this.target = { x: thief.x, y: thief.y };
      }
    } else {
      this.alert = Math.max(0, this.alert - dt * 0.25);
      if (this.mode === 'chase') {
        this.loseTimer += dt;
        if (this.loseTimer > 2.6) {
          this.mode = 'search';
          this.searchTimer = 3.2;
        }
      }
    }

    if (this.mode === 'chase') {
      if (seen > 0) this.target = { x: thief.x, y: thief.y };
      this.moveToward(world, this.target.x, this.target.y, dt);
    } else if (this.mode === 'search') {
      this.searchTimer -= dt;
      this.angle += Math.sin(time * 1.7 + this.sweepPhase) * dt * 1.5;
      if (this.target) this.moveToward(world, this.target.x, this.target.y, dt * 0.4);
      if (this.searchTimer <= 0) this.mode = 'return';
    } else if (this.mode === 'investigate') {
      if (this.moveToward(world, this.target.x, this.target.y, dt)) {
        this.mode = 'search';
        this.searchTimer = 1.6;
      }
    } else if (this.mode === 'return') {
      const wp = this.waypoints[this.wpIndex];
      if (this.moveToward(world, wp.x, wp.y, dt)) this.mode = 'patrol';
    } else {
      // Patrol: walk the round, pause at each post and sweep the room.
      const wp = this.waypoints[this.wpIndex];
      if (this.pauseLeft > 0) {
        this.pauseLeft -= dt;
        this.angle += Math.sin(time * 0.9 + this.sweepPhase) * dt * 0.85;
      } else if (this.moveToward(world, wp.x, wp.y, dt)) {
        this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
        this.pauseLeft = this.pauseTime;
      }
    }
    return seen;
  }

  touches(thief) {
    return Math.hypot(this.x - thief.x, this.y - thief.y) < 24;
  }
}
