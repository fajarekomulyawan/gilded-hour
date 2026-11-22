// The Gilded Hour — procedural sound: every effect is an oscillator or a
// noise burst shaped in code. No audio files, nothing loads over a network.

export class Sound {
  constructor() {
    this.ctx = null;
    this.alarmNodes = null;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  tone(freq, dur, type = 'sine', gain = 0.08, slideTo = null, delay = 0) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  click() { this.tone(660, 0.05, 'square', 0.03); }
  coin() { this.tone(1560, 0.07, 'sine', 0.07); this.tone(2090, 0.12, 'sine', 0.06, null, 0.06); }
  pickup() { this.tone(880, 0.06, 'triangle', 0.07); this.tone(1320, 0.09, 'triangle', 0.06, null, 0.05); }
  tick() { this.tone(1900 + Math.random() * 500, 0.02, 'square', 0.02); }
  unlock() { this.tone(340, 0.09, 'square', 0.06); this.tone(520, 0.14, 'square', 0.06, null, 0.09); }
  emp() { this.tone(1200, 0.3, 'sawtooth', 0.05, 90); }

  alarmStart() {
    const ctx = this.ensure();
    if (!ctx || this.alarmNodes) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 720;
    lfo.frequency.value = 2.2;
    lfoGain.gain.value = 190;
    lfo.connect(lfoGain).connect(osc.frequency);
    g.gain.value = 0.016;
    osc.connect(g).connect(ctx.destination);
    osc.start();
    lfo.start();
    this.alarmNodes = { osc, lfo };
  }

  alarmStop() {
    if (!this.alarmNodes) return;
    try { this.alarmNodes.osc.stop(); this.alarmNodes.lfo.stop(); } catch { /* already silent */ }
    this.alarmNodes = null;
  }

  sting() { this.tone(220, 0.35, 'sawtooth', 0.09, 110); this.tone(233, 0.4, 'sawtooth', 0.07, 98, 0.03); }
  win() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.07, null, i * 0.09)); }
}
