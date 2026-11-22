// The Gilded Hour — drawing: floors, cover, cones, cameras, the crew and
// the HUD with its alarm meter. Flat shapes, strong silhouettes: cover is
// furniture-height and warm, danger is a cone, loot glitters.
import { TILE, VIEW_W, VIEW_H } from './config.js';

const THEMES = {
  bank: {
    wall: '#2c3550', wallTop: '#46538a', floor: '#d3bd8d', floorAlt: '#c6ab74',
    carpet: '#7e1d2c', carpetEdge: '#5f1521', trim: '#c9a227',
  },
  gallery: {
    wall: '#4a2436', wallTop: '#6e3a52', floor: '#b98d5f', floorAlt: '#ad8355',
    carpet: '#5d2a4a', carpetEdge: '#46203a', trim: '#d8b45a',
  },
};

function poly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

export function drawWorld(ctx, state) {
  const { world } = state;
  const theme = THEMES[world.job.theme];
  // Tiles.
  for (let ty = 0; ty < world.rows; ty++) {
    for (let tx = 0; tx < world.cols; tx++) {
      const ch = world.charAt(tx, ty);
      const x = tx * TILE;
      const y = ty * TILE;
      if (ch === '~') {
        ctx.fillStyle = (tx + ty) % 2 ? '#33363e' : '#383b44';
        ctx.fillRect(x, y, TILE, TILE);
      } else if (ch === '#') {
        ctx.fillStyle = theme.wall;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = theme.wallTop;
        ctx.fillRect(x, y, TILE, 7);
        ctx.fillStyle = theme.trim;
        ctx.fillRect(x, y + TILE - 4, TILE, 2);
      } else if (ch === '=') {
        ctx.fillStyle = '#5a6a7d';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#77879c';
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = '#46536a';
        ctx.beginPath(); ctx.arc(x + 8, y + 8, 2.4, 0, 7); ctx.arc(x + TILE - 8, y + 8, 2.4, 0, 7);
        ctx.arc(x + 8, y + TILE - 8, 2.4, 0, 7); ctx.arc(x + TILE - 8, y + TILE - 8, 2.4, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = ch === ','
          ? theme.carpet
          : ((tx + ty) % 2 ? theme.floor : theme.floorAlt);
        ctx.fillRect(x, y, TILE, TILE);
        if (ch === ',') {
          ctx.fillStyle = 'rgba(0,0,0,0.08)';
          if ((tx + ty) % 2) ctx.fillRect(x, y, TILE, TILE);
        } else {
          ctx.strokeStyle = 'rgba(90,70,40,0.16)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
        }
      }
    }
  }
  // Furniture (cover).
  for (let ty = 0; ty < world.rows; ty++) {
    for (let tx = 0; tx < world.cols; tx++) {
      const ch = world.charAt(tx, ty);
      const x = tx * TILE;
      const y = ty * TILE;
      if (ch === 'D') {
        ctx.fillStyle = '#7a5230';
        ctx.fillRect(x + 2, y + 7, TILE - 4, TILE - 14);
        ctx.fillStyle = '#96683e';
        ctx.fillRect(x + 5, y + 10, TILE - 10, TILE - 20);
        ctx.fillStyle = '#e8e2d2';
        ctx.fillRect(x + 13, y + 15, 12, 9); // papers on the desk
      } else if (ch === 'P') {
        ctx.fillStyle = '#e6ddc8';
        ctx.fillRect(x + 9, y + 3, TILE - 18, TILE - 6);
        ctx.fillStyle = '#cbbfa4';
        ctx.fillRect(x + 6, y + 3, TILE - 12, 6);
        ctx.fillRect(x + 6, y + TILE - 9, TILE - 12, 6);
      } else if (ch === 'S') {
        ctx.fillStyle = '#3d4c63';
        ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = 'rgba(170,215,255,0.55)';
        ctx.fillRect(x + 7, y + 7, TILE - 14, TILE - 14);
        ctx.fillStyle = '#d8b45a';
        ctx.fillRect(x + 15, y + 24, 10, 6); // the treasure inside the case
      }
    }
  }
  drawVan(ctx, world);
  for (const door of world.doors) drawVaultDoor(ctx, door);
  for (const piece of world.loot) if (!piece.taken) drawLoot(ctx, piece, state.time);
}

function drawVan(ctx, world) {
  if (!world.van.length) return;
  const xs = world.van.map((v) => v.tx);
  const ys = world.van.map((v) => v.ty);
  const x = Math.min(...xs) * TILE;
  const y = Math.min(...ys) * TILE;
  const w = (Math.max(...xs) - Math.min(...xs) + 1) * TILE;
  const h = (Math.max(...ys) - Math.min(...ys) + 1) * TILE;
  ctx.fillStyle = '#1d2126';
  ctx.fillRect(x + 3, y + 8, w - 6, h - 14);
  ctx.fillStyle = '#2c3540';
  ctx.fillRect(x + 3, y + 8, w - 6, 12);
  ctx.fillStyle = '#9fc4d8';
  ctx.fillRect(x + w - 34, y + 12, 24, 14); // windshield
  ctx.fillStyle = '#ffd977';
  ctx.beginPath(); ctx.arc(x + w - 8, y + 16, 4, 0, 7); ctx.arc(x + w - 8, y + h - 12, 4, 0, 7); ctx.fill();
  ctx.fillStyle = '#0c0e11';
  ctx.beginPath(); ctx.arc(x + 22, y + h - 4, 7, 0, 7); ctx.arc(x + w - 22, y + h - 4, 7, 0, 7); ctx.fill();
  ctx.fillStyle = '#e8e2d2';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GETAWAY', x + w / 2 - 8, y + h / 2 + 4);
}

function drawVaultDoor(ctx, door) {
  const x = door.tx * TILE;
  const y = door.ty * TILE;
  if (door.open) {
    ctx.fillStyle = '#22262e';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = '#7d8ea3';
    ctx.fillRect(x + 1, y + 1, 8, TILE - 2); // swung-open leaf
    return;
  }
  ctx.fillStyle = '#8b9bb2';
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = '#6d7f99';
  ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
  ctx.strokeStyle = '#e8c85a';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x + TILE / 2, y + TILE / 2, 8, 0, 7); ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    ctx.moveTo(x + TILE / 2, y + TILE / 2);
    ctx.lineTo(x + TILE / 2 + Math.cos(a) * 8, y + TILE / 2 + Math.sin(a) * 8);
  }
  ctx.stroke();
  if (door.picking > 0) {
    ctx.strokeStyle = '#7dff9a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x + TILE / 2, y + TILE / 2, 15, -Math.PI / 2, -Math.PI / 2 + door.picking * Math.PI * 2);
    ctx.stroke();
  }
}

function drawLoot(ctx, piece, time) {
  const bob = Math.sin(time * 2.4 + piece.x * 0.05) * 1.5;
  const { x, y } = piece;
  // A halo of lamplight so a prize reads from across the room at a glance.
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 24);
  glow.addColorStop(0, 'rgba(255,224,130,0.40)');
  glow.addColorStop(1, 'rgba(255,224,130,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 24, y - 24, 48, 48);
  ctx.save();
  ctx.translate(x, y + bob);
  if (piece.kind === 'gold') {
    ctx.fillStyle = '#e8c85a';
    ctx.fillRect(-11, 1, 10, 5); ctx.fillRect(1, 1, 10, 5); ctx.fillRect(-5, -5, 10, 5);
    ctx.fillStyle = '#fff0b3';
    ctx.fillRect(-11, 1, 10, 2); ctx.fillRect(-5, -5, 10, 2);
  } else if (piece.kind === 'cash') {
    ctx.fillStyle = '#3f9e58';
    ctx.fillRect(-10, -4, 20, 10);
    ctx.fillStyle = '#e8e2d2';
    ctx.fillRect(-2, -4, 4, 10);
  } else if (piece.kind === 'jewel') {
    ctx.fillStyle = '#67e8f9';
    ctx.beginPath();
    ctx.moveTo(0, -9); ctx.lineTo(7, -2); ctx.lineTo(0, 9); ctx.lineTo(-7, -2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(3.5, -2); ctx.lineTo(-3.5, -2); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = '#8a6a34';
    ctx.fillRect(-11, -12, 22, 24);
    ctx.fillStyle = '#b8433a';
    ctx.fillRect(-8, -9, 16, 18);
    ctx.fillStyle = '#e8c85a';
    ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, 7); ctx.fill();
  }
  ctx.restore();
}

export function drawCones(ctx, state) {
  for (const cone of state.cones) {
    poly(ctx, cone.pts);
    ctx.fillStyle = cone.color;
    ctx.fill();
  }
}

export function drawActors(ctx, state) {
  // Cameras: a wall box, a lens, and a tell-tale lamp.
  for (const cam of state.cameras) {
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.fillStyle = '#22262e';
    ctx.fillRect(-9, -7, 18, 14);
    ctx.rotate(cam.angle);
    ctx.fillStyle = cam.disabledLeft > 0 ? '#4a5058' : '#e8c85a';
    ctx.fillRect(4, -3.5, 9, 7);
    ctx.restore();
    if (cam.disabledLeft > 0) {
      ctx.fillStyle = '#9fb4c8';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OFF', cam.x, cam.y - 13);
    }
  }
  // The coin, still glinting where it landed.
  if (state.coin) {
    ctx.strokeStyle = `rgba(255,217,119,${Math.max(0, 1 - state.coin.ring / 1.2)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(state.coin.x, state.coin.y, 4 + state.coin.ring * 22, 0, 7); ctx.stroke();
    ctx.fillStyle = '#ffd977';
    ctx.beginPath(); ctx.arc(state.coin.x, state.coin.y, 3.4, 0, 7); ctx.fill();
  }
  // Guards.
  for (const g of state.guards) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(0, 5, 12, 5.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = g.mode === 'chase' ? '#a12633' : '#31456e';
    ctx.beginPath(); ctx.arc(0, 0, 13.5, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(232,200,90,0.8)';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(0, 0, 13.5, 0, 7); ctx.stroke();
    ctx.rotate(g.angle);
    ctx.fillStyle = '#e8d9b0';
    ctx.fillRect(4, -4, 9, 8); // lamp hand
    ctx.fillStyle = '#1d2a47';
    ctx.fillRect(-9, -9, 13, 5); // cap
    ctx.restore();
    if (g.alert > 0.35 || g.mode === 'chase') {
      ctx.fillStyle = g.mode === 'chase' ? '#ff5347' : '#ffb340';
      ctx.font = 'bold 17px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(g.mode === 'chase' ? '!' : '?', g.x, g.y - 19);
    }
  }
  // The thief, bag swelling with the take.
  const t = state.thief;
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(0, 5, 11, 5, 0, 0, 7); ctx.fill();
  const back = -Math.cos(t.angle);
  const backY = -Math.sin(t.angle);
  if (t.items > 0) {
    ctx.fillStyle = '#8a6a34';
    ctx.beginPath();
    ctx.arc(back * 11, backY * 11 + 2, 5 + Math.min(6, t.items * 0.8), 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = t.sneaking ? '#15181d' : '#1f232b';
  ctx.beginPath(); ctx.arc(0, 0, t.sneaking ? 12 : 14, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(232,226,210,0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(0, 0, t.sneaking ? 12 : 14, 0, 7); ctx.stroke();
  ctx.rotate(t.angle);
  ctx.fillStyle = '#e8e2d2';
  ctx.fillRect(6, -5, 5, 3); // the mask's eye slit
  ctx.fillRect(6, 2, 5, 3);
  ctx.restore();
  // Floating gains.
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const f of state.floaters) {
    ctx.fillStyle = `rgba(126,255,154,${Math.max(0, 1 - f.t / 1.1)})`;
    ctx.fillText(f.text, f.x, f.y - f.t * 26);
  }
  if (state.empFlash > 0) {
    ctx.fillStyle = `rgba(160,220,255,${state.empFlash * 0.5})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

export function drawHUD(ctx, state) {
  const { world, thief } = state;
  ctx.fillStyle = 'rgba(10,12,18,0.88)';
  ctx.fillRect(0, 0, VIEW_W, 46);
  ctx.fillStyle = '#e8c85a';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(world.job.name, 14, 29);
  // The alarm meter: the one number that ends the night.
  const mx = VIEW_W / 2 - 150;
  ctx.fillStyle = '#e8e2d2';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('ALARM', mx - 8, 29);
  ctx.fillStyle = '#2a2f3a';
  ctx.fillRect(mx, 14, 300, 17);
  const frac = state.meter / 100;
  ctx.fillStyle = state.tripped ? '#ff5347' : frac > 0.66 ? '#ff7a3c' : frac > 0.33 ? '#ffb340' : '#ffd977';
  ctx.fillRect(mx + 2, 16, 296 * frac, 13);
  ctx.strokeStyle = '#565e6e';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx + 0.5, 14.5, 300, 17);
  if (state.tripped) {
    const label = `GET TO THE VAN — ${Math.ceil(state.countdown)}s`;
    ctx.font = 'bold 15px system-ui, sans-serif';
    const w = ctx.measureText(label).width + 30;
    ctx.fillStyle = 'rgba(120,16,12,0.92)';
    ctx.fillRect(VIEW_W / 2 - w / 2, 52, w, 30);
    ctx.fillStyle = '#ffd9d4';
    ctx.textAlign = 'center';
    ctx.fillText(label, VIEW_W / 2, 73);
  }
  // Loot and tools, right side.
  ctx.textAlign = 'right';
  ctx.fillStyle = thief.carried >= world.job.quota ? '#7eff9a' : '#e8e2d2';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`LOOT $${thief.carried.toLocaleString()} / $${world.job.quota.toLocaleString()}`, VIEW_W - 190, 29);
  ctx.fillStyle = '#ffd977';
  ctx.beginPath(); ctx.arc(VIEW_W - 168, 22, 6, 0, 7); ctx.fill();
  ctx.fillStyle = '#e8e2d2';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(`×${state.coinsLeft}`, VIEW_W - 148, 27);
  ctx.fillStyle = '#9fd8ff';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(`EMP ×${state.empsLeft}`, VIEW_W - 92, 27);
  ctx.fillStyle = '#9fb4c8';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(`BAG ×${thief.items}`, VIEW_W - 14, 27);
  // Controls and messages along the bottom.
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(232,226,210,0.66)';
  ctx.font = '11.5px system-ui, sans-serif';
  ctx.fillText('WASD move · Shift sneak · Space sprint (loud) · Click/E coin · Q EMP · F pick lock', 12, VIEW_H - 10);
  if (state.message) {
    ctx.fillStyle = 'rgba(10,12,18,0.78)';
    const w = ctx.measureText(state.message).width + 28;
    ctx.fillRect(VIEW_W / 2 - w / 2, VIEW_H - 78, w, 30);
    ctx.fillStyle = '#ffd977';
    ctx.font = 'bold 14.5px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, VIEW_W / 2, VIEW_H - 58);
  }
  if (state.tripped) {
    const pulse = 0.16 + 0.1 * Math.sin(state.time * 7);
    ctx.strokeStyle = `rgba(255,60,50,${pulse + 0.25})`;
    ctx.lineWidth = 16;
    ctx.strokeRect(0, 0, VIEW_W, VIEW_H);
  }
  // Lamplight vignette: the room's edges fall off into night.
  const vg = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.42, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.86);
  vg.addColorStop(0, 'rgba(4,6,10,0)');
  vg.addColorStop(1, 'rgba(4,6,10,0.34)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

export function drawCard(ctx, { title, lines, foot }) {
  ctx.fillStyle = 'rgba(6,8,12,0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#141a26';
  ctx.fillRect(VIEW_W / 2 - 330, 190, 660, 330);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.strokeRect(VIEW_W / 2 - 330, 190, 660, 330);
  ctx.fillStyle = '#e8c85a';
  ctx.font = 'bold 37px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_W / 2, 268);
  ctx.fillStyle = '#e8e2d2';
  ctx.font = '16.5px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 322 + i * 27));
  if (foot) {
    ctx.fillStyle = '#9fb4c8';
    ctx.font = '13.5px system-ui, sans-serif';
    ctx.fillText(foot, VIEW_W / 2, 486);
  }
}
