// Keyboard and mouse input. One clear job: turn keys and clicks into a
// movement intent the world can read, and expose the one-shot actions
// (start, pause, smoke, EMP, mute) as edge-triggered flags.
//
// Move: WASD or arrow keys. Click (or tap) anywhere to walk there: the
// thief steers toward the point and the world slides it along walls.
// Shift: sneak — slower, harder to spot. Space: start / restart.
// P or Escape: pause. 1: smoke bomb. 2: EMP. M: mute.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.clickTarget = null;
    this.pressed = new Set(); // one-shot keys, consumed by the world each frame
    this.canvas = canvas;

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (!e.repeat) this.pressed.add(e.key.toLowerCase());
      this.keys.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.clickTarget = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
      this.pressed.add('click');
    });
  }

  wasPressed(key) {
    return this.pressed.has(key);
  }

  consume() {
    this.pressed.clear();
  }

  // A unit movement vector from keys, or null when no key is held.
  keyVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (x === 0 && y === 0) return null;
    const len = Math.hypot(x, y);
    return { x: x / len, y: y / len };
  }

  get sneaking() {
    return this.keys.has('shift');
  }

  clearClickTarget() {
    this.clickTarget = null;
  }
}
