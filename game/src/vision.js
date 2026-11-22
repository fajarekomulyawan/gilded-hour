// The Gilded Hour — sight: line of sight and the visible cone polygon.
// Desks, pillars, cases and walls all block sight, so the cone a guard or
// camera throws is clipped by the room: stand behind a desk and you are in
// shadow even inside the cone's sweep.

// Casts one ray from (x, y) along angle; returns the distance it travels
// before it meets a blocking tile (world.blockedAt works in pixels).
export function rayDistance(world, x, y, angle, maxDist) {
  const step = 4;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let d = 0;
  while (d < maxDist) {
    d += step;
    if (world.blockedAt(x + dx * d, y + dy * d)) return d;
  }
  return maxDist;
}

// True when nothing solid stands between two points.
export function lineOfSight(world, x0, y0, x1, y1) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (world.blockedAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
  }
  return true;
}

// The polygon a watcher at (x, y) facing `angle` can actually see: rays at a
// fine fan plus extra rays aimed at nearby tile corners, so straight edges
// of cover clip the cone cleanly instead of scalloping it.
export function visionPolygon(world, x, y, angle, halfAngle, range) {
  const angles = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) angles.push(angle - halfAngle + (2 * halfAngle * i) / steps);
  const tile = world.tile;
  const tx = Math.floor(x / tile);
  const ty = Math.floor(y / tile);
  const span = Math.ceil(range / tile) + 1;
  for (let cy = ty - span; cy <= ty + span; cy++) {
    for (let cx = tx - span; cx <= tx + span; cx++) {
      for (const [ox, oy] of [[0, 0], [tile, 0], [0, tile], [tile, tile]]) {
        const px = cx * tile + ox;
        const py = cy * tile + oy;
        const a = Math.atan2(py - y, px - x);
        let diff = a - angle;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        if (Math.abs(diff) <= halfAngle + 0.02 && Math.hypot(px - x, py - y) <= range + tile) {
          angles.push(a - 0.002, a + 0.002);
        }
      }
    }
  }
  angles.sort((a, b) => a - b);
  const pts = [[x, y]];
  for (const a of angles) {
    const d = rayDistance(world, x, y, a, range);
    pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]);
  }
  return pts;
}

// Can the watcher see the target point? In range, inside the cone, unblocked.
export function canSee(world, x, y, angle, halfAngle, range, tx, ty) {
  const dx = tx - x;
  const dy = ty - y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return 0;
  let diff = Math.atan2(dy, dx) - angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > halfAngle) return 0;
  if (!lineOfSight(world, x, y, tx, ty)) return 0;
  return 1 - dist / range; // 0 at the edge, near 1 at the watcher's feet
}
