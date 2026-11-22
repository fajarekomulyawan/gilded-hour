// The Gilded Hour — the world: one job's floor as tiles, loot and doors.
import { TILE, LOOT_VALUES, LASER } from './config.js';

// Where a laser stands in its blink cycle: live, or in the gap.
export function laserState(laser, time) {
  const t = (time + laser.phase) % LASER.period;
  return { on: t < LASER.onTime, untilSwitch: (t < LASER.onTime ? LASER.onTime : LASER.period) - t };
}

// Distance from a point to a segment, for beam-breaking tests.
export function pointSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
}

const SOLID = new Set(['#', '=', 'D', 'P', 'S']);
const LOOT_KIND = { G: 'gold', J: 'jewel', A: 'art', C: 'cash' };

export class World {
  constructor(job) {
    this.job = job;
    this.tile = TILE;
    this.rows = job.rows.length;
    this.cols = job.rows[0].length;
    this.grid = job.rows.map((r) => r.split(''));
    this.loot = []; // {x, y, kind, value, taken} in pixels
    this.doors = []; // vault doors: {tx, ty, open, picking}
    this.van = []; // getaway tiles {tx, ty}
    for (let ty = 0; ty < this.rows; ty++) {
      for (let tx = 0; tx < this.cols; tx++) {
        const ch = this.grid[ty][tx];
        if (LOOT_KIND[ch]) {
          this.loot.push({
            x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2,
            kind: LOOT_KIND[ch], value: LOOT_VALUES[LOOT_KIND[ch]], taken: false,
          });
          this.grid[ty][tx] = '.';
        } else if (ch === 'V') {
          this.doors.push({ tx, ty, open: false, picking: 0 });
        } else if (ch === 'E') {
          this.van.push({ tx, ty });
          this.grid[ty][tx] = '~';
        } else if (ch === '@') {
          this.grid[ty][tx] = '.';
        }
      }
    }
    this.totalLoot = this.loot.reduce((s, l) => s + l.value, 0);
    // Laser beams, in pixels, emitter centre to emitter centre.
    this.lasers = (job.lasers ?? []).map((l) => ({
      x1: l.from[0] * TILE + TILE / 2, y1: l.from[1] * TILE + TILE / 2,
      x2: l.to[0] * TILE + TILE / 2, y2: l.to[1] * TILE + TILE / 2,
      phase: l.phase ?? 0,
    }));
  }

  // The live laser the thief is breaking right now, if any.
  laserBrokenBy(x, y, time) {
    for (const laser of this.lasers) {
      if (!laserState(laser, time).on) continue;
      if (pointSegmentDistance(x, y, laser.x1, laser.y1, laser.x2, laser.y2) < 9) return laser;
    }
    return null;
  }

  charAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return '#';
    return this.grid[ty][tx];
  }

  doorAt(tx, ty) {
    return this.doors.find((d) => d.tx === tx && d.ty === ty) || null;
  }

  // Sight and bodies are stopped by the same things: walls and furniture.
  blockedTile(tx, ty) {
    const ch = this.charAt(tx, ty);
    if (SOLID.has(ch)) return true;
    if (ch === 'V') {
      const door = this.doorAt(tx, ty);
      return !(door && door.open);
    }
    return false;
  }

  blockedAt(x, y) {
    return this.blockedTile(Math.floor(x / TILE), Math.floor(y / TILE));
  }

  // Circle-versus-tiles movement: try each axis on its own so the thief
  // slides along desks and walls instead of sticking to them.
  moveCircle(pos, radius, dx, dy) {
    const tryAxis = (nx, ny) => {
      const corners = [
        [nx - radius, ny - radius], [nx + radius, ny - radius],
        [nx - radius, ny + radius], [nx + radius, ny + radius],
      ];
      return !corners.some(([cx, cy]) => this.blockedAt(cx, cy));
    };
    if (dx !== 0 && tryAxis(pos.x + dx, pos.y)) pos.x += dx;
    if (dy !== 0 && tryAxis(pos.x, pos.y + dy)) pos.y += dy;
  }

  lootNear(x, y, radius) {
    return this.loot.filter((l) => !l.taken && Math.hypot(l.x - x, l.y - y) < radius);
  }

  onVan(x, y) {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    return this.van.some((v) => v.tx === tx && v.ty === ty);
  }

  // The closed vault door beside a point, if any (for lockpicking).
  doorNear(x, y) {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    for (const [ox, oy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const door = this.doorAt(tx + ox, ty + oy);
      if (door && !door.open) return door;
    }
    return null;
  }
}
