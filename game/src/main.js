// The Gilded Hour — one thief, two jobs, one alarm between you and the van.
// Loop and rules: who sees the thief, how fast the alarm climbs, when the
// night is won and when it ends in handcuffs.
import { SIGHT, ALARM, TOOLS, GHOST_BONUS, LASER } from './config.js';
import { JOBS } from './levels.js';
import { World } from './world.js';
import { Guard } from './guards.js';
import { Camera } from './cameras.js';
import { Thief } from './player.js';
import { Input } from './input.js';
import { Sound } from './audio.js';
import { throwCoin, fireEMP, workLock } from './tools.js';
import { visionPolygon } from './vision.js';
import { drawWorld, drawCones, drawActors, drawHUD, drawCard } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const sound = new Sound();

const state = {
  screen: 'title', // title | brief | play | busted | getaway | final
  jobIndex: 0,
  world: null,
  thief: null,
  guards: [],
  cameras: [],
  cones: [],
  meter: 0,
  tripped: false,
  countdown: 0,
  coinsLeft: TOOLS.coins,
  empsLeft: TOOLS.emps,
  coin: null,
  empFlash: 0,
  pickingDoor: null,
  floaters: [],
  message: '',
  messageT: 0,
  noiseT: 0,
  heartT: 0,
  shake: 0,
  laserHit: false,
  totalScore: 0,
  lastTake: 0,
  lastGhost: false,
  bustedWhy: '',
  time: 0,
  frozen: false,
  sound,
  input,
};

function startJob(index) {
  const job = JOBS[index];
  state.jobIndex = index;
  state.world = new World(job);
  state.thief = new Thief(job.thief);
  state.guards = job.guards.map((g) => new Guard(g));
  state.cameras = job.cameras.map((c) => new Camera(c));
  state.meter = 0;
  state.tripped = false;
  state.countdown = 0;
  state.coinsLeft = TOOLS.coins;
  state.empsLeft = TOOLS.emps;
  state.coin = null;
  state.floaters = [];
  state.message = '';
  state.screen = 'brief';
  sound.alarmStop();
}

function tripAlarm() {
  state.tripped = true;
  state.meter = 100;
  state.countdown = ALARM.getawaySeconds;
  state.shake = 0.4;
  sound.alarmStart();
  say('The alarm trips! Get to the van!', 3);
}

function say(text, seconds = 2.4) {
  state.message = text;
  state.messageT = seconds;
}

function bust(why) {
  state.screen = 'busted';
  state.bustedWhy = why;
  sound.alarmStop();
  sound.sting();
}

function update(dt) {
  state.time += dt;
  if (state.empFlash > 0) state.empFlash -= dt;
  if (state.messageT > 0) {
    state.messageT -= dt;
    if (state.messageT <= 0) state.message = '';
  }
  if (state.screen !== 'play' || state.frozen) return;

  const { world, thief } = state;
  thief.update(world, input, dt);

  // The bag fills itself when the thief brushes past a prize.
  for (const piece of thief.grab(world)) {
    state.floaters.push({ x: piece.x, y: piece.y - 10, text: `+$${piece.value.toLocaleString()}`, t: 0 });
    sound.pickup();
  }
  state.floaters = state.floaters.filter((f) => (f.t += dt) < 1.1);
  if (state.coin) {
    state.coin.ring += dt;
    if (state.coin.ring > 2.5) state.coin = null;
  }

  // Sprinting is loud: guards turn toward the steps.
  if (thief.sprinting) {
    state.noiseT -= dt;
    if (state.noiseT <= 0) {
      state.noiseT = 0.34;
      for (const g of state.guards) {
        if (Math.hypot(g.x - thief.x, g.y - thief.y) < 130) g.hearNoise(thief.x, thief.y);
      }
    }
  }

  // Tools.
  const pressed = input.drainPressed();
  if (pressed.has('KeyQ')) fireEMP(state);
  if (pressed.has('KeyE')) throwCoin(state, input.mouse.x, input.mouse.y);
  for (const click of input.clicks.splice(0)) throwCoin(state, click.x, click.y);
  workLock(state, dt);
  if (state.pickingDoor) say(`Picking the vault lock… ${Math.round(state.pickingDoor.picking * 100)}%`, 0.2);

  // Eyes.
  let exposure = 0;
  for (const g of state.guards) {
    const seen = g.update(world, thief, dt, state.time, state.tripped);
    if (seen > 0) exposure = Math.max(exposure, seen * (thief.sneaking ? SIGHT.sneakFactor : 1));
    if (g.touches(thief)) return bust('A guard got his hands on you.');
  }
  let cameraExposure = 0;
  for (const cam of state.cameras) {
    cam.update(dt, state.time);
    const seen = cam.sees(world, thief);
    if (seen > 0) cameraExposure = Math.max(cameraExposure, seen);
  }

  // A live laser the thief is standing in sings straight into the meter.
  state.laserHit = !!world.laserBrokenBy(thief.x, thief.y, state.time);

  // The meter: guards fill it by closeness, cameras steadily, quiet sheds it.
  if (!state.tripped) {
    let fill = 0;
    if (exposure > 0) fill += SIGHT.fillFar + (SIGHT.fillNear - SIGHT.fillFar) * exposure;
    if (cameraExposure > 0) fill += SIGHT.cameraFill * cameraExposure;
    if (state.laserHit) fill += LASER.fill;
    if (fill > 0) state.meter += fill * dt;
    else state.meter = Math.max(0, state.meter - SIGHT.decay * dt);
    if (state.meter >= ALARM.tripAt) tripAlarm();
    // A heartbeat under the floorboards once the meter runs hot.
    if (state.meter > 55) {
      state.heartT -= dt;
      if (state.heartT <= 0) {
        sound.thump();
        state.heartT = state.meter > 82 ? 0.55 : 0.85;
      }
    }
  } else {
    state.countdown -= dt;
    if (state.countdown <= 0) return bust('The net closed in before you reached the van.');
  }

  // The van.
  if (world.onVan(thief.x, thief.y)) {
    if (thief.carried >= world.job.quota) {
      state.lastTake = thief.carried;
      state.lastGhost = !state.tripped;
      state.totalScore += thief.carried + (state.lastGhost ? GHOST_BONUS : 0);
      sound.alarmStop();
      sound.win();
      state.screen = 'getaway';
    } else if (state.messageT <= 0) {
      say(`The driver shakes his head — $${(world.job.quota - thief.carried).toLocaleString()} short of the quota.`, 1.6);
    }
  }

  buildCones();
}

function buildCones() {
  state.cones = [];
  for (const g of state.guards) {
    const color = g.mode === 'chase'
      ? 'rgba(255,70,55,0.40)'
      : g.mode === 'patrol'
        ? 'rgba(255,205,90,0.31)'
        : 'rgba(255,150,60,0.36)';
    state.cones.push({ pts: visionPolygon(state.world, g.x, g.y, g.angle, SIGHT.guardHalfAngle, SIGHT.guardRange), color });
  }
  for (const cam of state.cameras) {
    const color = cam.disabledLeft > 0 ? 'rgba(120,140,160,0.12)' : 'rgba(90,200,255,0.24)';
    state.cones.push({ pts: visionPolygon(state.world, cam.x, cam.y, cam.angle, SIGHT.cameraHalfAngle, SIGHT.cameraRange), color });
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (state.shake > 0) {
    const s = state.shake * 9;
    ctx.save();
    ctx.translate(Math.sin(state.time * 71) * s, Math.cos(state.time * 59) * s * 0.7);
  }
  if (!state.world) {
    drawCard(ctx, {
      title: 'THE GILDED HOUR',
      lines: [
        'Two buildings. One bag. A single alarm between you and the van.',
        '',
        'Slip past the guards and the cameras, time the vault laser, pick the lock,',
        'take the quota — and if the alarm trips, you have 45 seconds to be gone.',
      ],
      foot: 'Click or press Enter to plan the first job',
    });
    if (state.shake > 0) ctx.restore();
    return;
  }
  drawWorld(ctx, state);
  drawCones(ctx, state);
  drawActors(ctx, state);
  drawHUD(ctx, state);
  const job = state.world.job;
  if (state.screen === 'brief') {
    drawCard(ctx, {
      title: job.name,
      lines: [
        job.sub,
        `Quota: $${job.quota.toLocaleString()} of $${state.world.totalLoot.toLocaleString()} on the floor.`,
        'Guards fill the alarm when they see you; cameras feed it steadily.',
        'A laser guards the vault gold — cross it in its blink, or not at all.',
        'Coins lure, EMP blinds cameras, F picks the vault — all in short supply.',
      ],
      foot: 'Click or press Enter to go in',
    });
  } else if (state.screen === 'busted') {
    drawCard(ctx, {
      title: 'BUSTED',
      lines: [state.bustedWhy, `The bag held $${state.thief.carried.toLocaleString()} — the house keeps it.`],
      foot: 'Click or press Enter to try the job again',
    });
  } else if (state.screen === 'getaway') {
    drawCard(ctx, {
      title: 'CLEAN GETAWAY',
      lines: [
        `${job.name}: $${state.lastTake.toLocaleString()} in the bag.`,
        state.lastGhost ? `Ghost bonus +$${GHOST_BONUS.toLocaleString()} — the alarm never sang.` : 'The alarm sang, but you outran it.',
        `Running total: $${state.totalScore.toLocaleString()}.`,
      ],
      foot: state.jobIndex + 1 < JOBS.length ? 'Click or press Enter for the next job' : 'Click or press Enter for the final reckoning',
    });
  } else if (state.screen === 'final') {
    const rank = state.totalScore >= 38000 ? 'LEGEND OF THE GILDED HOUR'
      : state.totalScore >= 30000 ? 'MASTER THIEF'
        : state.totalScore >= 22000 ? 'PROFESSIONAL' : 'CAT BURGLAR';
    drawCard(ctx, {
      title: 'THE NIGHT IS YOURS',
      lines: [`Total take across both jobs: $${state.totalScore.toLocaleString()}.`, `The underworld calls you: ${rank}.`],
      foot: 'Click or press Enter to run the night again',
    });
  }
  if (state.shake > 0) ctx.restore();
}

function advance() {
  sound.ensure();
  sound.click();
  input.clicks.length = 0; // the click that opens a card is not a coin throw
  if (state.screen === 'title') startJob(0);
  else if (state.screen === 'brief') state.screen = 'play';
  else if (state.screen === 'busted') startJob(state.jobIndex);
  else if (state.screen === 'getaway') {
    if (state.jobIndex + 1 < JOBS.length) startJob(state.jobIndex + 1);
    else state.screen = 'final';
  } else if (state.screen === 'final') {
    state.totalScore = 0;
    startJob(0);
  }
}

canvas.addEventListener('mousedown', () => {
  if (state.screen !== 'play') advance();
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'Enter' && state.screen !== 'play') advance();
});

// Screenshot hooks: deterministic scenes for the entry's screenshots.
window.__GH = {
  state,
  startJob,
  play() { state.screen = 'play'; },
  freeze(v) { state.frozen = v; },
  pose(fn) { fn(state); buildCones(); },
};

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
  if (!state.frozen) update(dt);
  else buildCones();
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
