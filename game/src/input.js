// The Gilded Hour — keyboard and mouse state, read once per frame.

export class Input {
  constructor(canvas) {
    this.up = this.down = this.left = this.right = false;
    this.sneak = false;
    this.sprint = false;
    this.pick = false;
    this.mouse = { x: 0, y: 0 };
    this.clicks = []; // queued {x, y} canvas clicks, drained by the game
    this.pressed = new Set(); // key codes that went down this frame
    const keymap = {
      ArrowUp: 'up', KeyW: 'up',
      ArrowDown: 'down', KeyS: 'down',
      ArrowLeft: 'left', KeyA: 'left',
      ArrowRight: 'right', KeyD: 'right',
    };
    window.addEventListener('keydown', (e) => {
      if (keymap[e.code]) { this[keymap[e.code]] = true; e.preventDefault(); }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') this.sneak = true;
      if (e.code === 'Space') { this.sprint = true; e.preventDefault(); }
      if (e.code === 'KeyF') this.pick = true;
      this.pressed.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      if (keymap[e.code]) this[keymap[e.code]] = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') this.sneak = false;
      if (e.code === 'Space') this.sprint = false;
      if (e.code === 'KeyF') this.pick = false;
    });
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', (e) => {
      const r = canvas.getBoundingClientRect();
      this.clicks.push({
        x: (e.clientX - r.left) * (canvas.width / r.width),
        y: (e.clientY - r.top) * (canvas.height / r.height),
      });
    });
  }

  drainPressed() {
    const out = new Set(this.pressed);
    this.pressed.clear();
    return out;
  }
}
