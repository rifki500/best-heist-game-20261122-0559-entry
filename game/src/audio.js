// Tiny WebAudio bleeps: alarm, pickup, win, caught. One clear job: sound
// with no audio files, built from oscillators, so the game stays offline
// and file-free. Silent until the first user gesture, as browsers require.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  blip(freq, seconds, type = 'sine', volume = 0.08) {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + seconds);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  pickup() { this.blip(880, 0.12, 'sine', 0.07); setTimeout(() => this.blip(1318, 0.14, 'sine', 0.06), 70); }
  alarm() { this.blip(220, 0.25, 'square', 0.05); setTimeout(() => this.blip(180, 0.25, 'square', 0.05), 140); }
  caught() { this.blip(160, 0.4, 'sawtooth', 0.07); setTimeout(() => this.blip(90, 0.5, 'sawtooth', 0.07), 160); }
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.blip(f, 0.18, 'sine', 0.07), i * 110)); }
  smoke() { this.blip(300, 0.2, 'triangle', 0.05); }
  emp() { this.blip(1200, 0.08, 'square', 0.04); setTimeout(() => this.blip(500, 0.15, 'square', 0.04), 60); }
}
