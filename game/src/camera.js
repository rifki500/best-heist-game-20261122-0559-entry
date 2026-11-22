// Security cameras: fixed to a wall, sweeping a cone back and forth. One
// clear job: the sweep, the cone, and whether the camera sees the thief.
//
// A camera never catches the thief itself; it feeds the alarm meter, faster
// than a guard does. An EMP shuts every camera down for a while (its cone
// goes grey and it sees nothing). Plants and smoke hide the thief from a
// camera exactly as they do from a guard.
import { CAMERA_HALF_ANGLE, CAMERA_RANGE } from './config.js';
import { angleDiff, hasLineOfSight } from './guard.js';

export class Camera {
  constructor(spot) {
    this.name = spot.name;
    this.x = spot.col * 40 + 20;
    this.y = spot.row * 40 + 20;
    this.baseAngle = spot.baseAngle;
    this.sweep = spot.sweep;
    this.speed = spot.speed;
    this.phase = 0;
    this.angle = spot.baseAngle;
    this.disabledTimer = 0;
    this.seeing = false;
  }

  get disabled() {
    return this.disabledTimer > 0;
  }

  update(dt) {
    if (this.disabledTimer > 0) this.disabledTimer -= dt;
    this.phase += dt * this.speed;
    this.angle = this.baseAngle + Math.sin(this.phase) * this.sweep;
  }

  canSee(thief, world) {
    if (this.disabled) return false;
    const dx = thief.x - this.x;
    const dy = thief.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > CAMERA_RANGE) return false;
    if (Math.abs(angleDiff(Math.atan2(dy, dx), this.angle)) > CAMERA_HALF_ANGLE) return false;
    if (world.thiefHidden()) return false;
    return hasLineOfSight(this.x, this.y, thief.x, thief.y);
  }

  sense(thief, world) {
    this.seeing = this.canSee(thief, world);
  }

  disable(seconds) {
    this.disabledTimer = Math.max(this.disabledTimer, seconds);
  }
}
