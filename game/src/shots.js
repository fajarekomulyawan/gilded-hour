// The Gilded Hour — screenshot scenes. With ?shot=1..4 the game poses a
// deterministic moment from the real systems (positions, cones, meter),
// freezes time, and the maker's script photographs the canvas.
const SCENES = {
  // The cover: the thief crosses the Meridian lobby mid-patrol — two guard
  // cones, a camera sweep, loot in the vault behind its picked door, and
  // the alarm meter already warm. Everything the game is, in one frame.
  1(gh) {
    gh.startJob(0);
    gh.pose((s) => {
      s.world.doors[0].open = true;
      s.thief.x = 15.5 * 40; s.thief.y = 13.5 * 40; s.thief.angle = 0.4;
      s.thief.carried = 2750; s.thief.items = 3;
      // A thrown coin glints by the carpet: the lobby guard has left his
      // round to look at it — the lure tool, caught in the act.
      s.coin = { x: 20.5 * 40, y: 13 * 40, ring: 0.45 };
      s.coinsLeft = 2;
      const [lobby, hall, vault] = s.guards;
      lobby.x = 17.5 * 40; lobby.y = 12.2 * 40; lobby.angle = 0.5; lobby.mode = 'investigate'; lobby.alert = 0.5;
      hall.x = 21 * 40; hall.y = 8 * 40; hall.angle = Math.PI; hall.mode = 'patrol';
      vault.x = 16 * 40; vault.y = 7 * 40; vault.angle = Math.PI / 2; vault.mode = 'patrol';
      s.cameras[0].angle = 0.9;
      s.cameras[1].angle = Math.PI - 0.9;
      s.cameras[2].angle = Math.PI * 0.85;
      s.meter = 46;
      s.coinsLeft = 2;
    });
    gh.play();
  },
  // Inside the vault: gold in reach, the door guard's cone sweeping past.
  2(gh) {
    gh.startJob(0);
    gh.pose((s) => {
      s.world.doors[0].open = true;
      s.thief.x = 15 * 40; s.thief.y = 3.4 * 40; s.thief.angle = 0.2;
      s.thief.carried = 6750; s.thief.items = 5;
      const [, , vault] = s.guards;
      vault.x = 16 * 40; vault.y = 7 * 40; vault.angle = -Math.PI / 2; vault.mode = 'investigate';
      vault.alert = 0.8;
      s.guards[0].x = 8 * 40; s.guards[0].y = 13 * 40; s.guards[0].angle = 0;
      s.guards[1].x = 24 * 40; s.guards[1].y = 8 * 40; s.guards[1].angle = Math.PI;
      s.meter = 78;
      s.message = 'The vault guard is coming back…';
      s.messageT = 999;
    });
    gh.play();
  },
  // The alarm has tripped: 31 seconds, a chase, and the van across the street.
  3(gh) {
    gh.startJob(0);
    gh.pose((s) => {
      s.world.doors[0].open = true;
      s.tripped = true; s.meter = 100; s.countdown = 31;
      s.thief.x = 10.5 * 40; s.thief.y = 17.4 * 40; s.thief.angle = Math.PI; s.thief.sprinting = true;
      s.thief.carried = 11750; s.thief.items = 8;
      const [lobby, hall] = s.guards;
      lobby.x = 14.5 * 40; lobby.y = 16.4 * 40; lobby.angle = Math.PI * 0.94; lobby.mode = 'chase'; lobby.alert = 1;
      hall.x = 22 * 40; hall.y = 8 * 40; hall.angle = Math.PI;
      s.guards[2].x = 17 * 40; s.guards[2].y = 7 * 40; s.guards[2].angle = Math.PI / 2;
      s.message = 'The alarm trips! Get to the van!';
      s.messageT = 999;
    });
    gh.play();
  },
  // Job two: the Aurelia Gallery — cases of jewels, four guards, more eyes.
  4(gh) {
    gh.startJob(1);
    gh.pose((s) => {
      s.thief.x = 10.5 * 40; s.thief.y = 11.5 * 40; s.thief.angle = -0.5;
      s.thief.carried = 4500; s.thief.items = 3;
      const [a, b, c, d] = s.guards;
      a.x = 17 * 40; a.y = 9 * 40; a.angle = Math.PI * 0.8; a.mode = 'patrol';
      b.x = 24 * 40; b.y = 6 * 40; b.angle = Math.PI; b.mode = 'patrol';
      c.x = 15 * 40; c.y = 6 * 40; c.angle = Math.PI / 2; c.mode = 'patrol';
      d.x = 8 * 40; d.y = 15 * 40; d.angle = 0.3; d.mode = 'patrol';
      s.cameras[0].angle = 0.8;
      s.cameras[1].angle = Math.PI - 0.8;
      s.cameras[2].angle = -Math.PI / 2 + 0.5;
      s.meter = 32;
      s.empsLeft = 1;
    });
    gh.play();
  },
};

const shot = new URLSearchParams(location.search).get('shot');
if (shot && SCENES[shot]) {
  const wait = setInterval(() => {
    if (window.__GH) {
      clearInterval(wait);
      SCENES[shot](window.__GH);
      window.__GH.freeze(true);
    }
  }, 30);
}
