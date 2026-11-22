// Thief tools: smoke bombs and the EMP. One clear job: what each tool
// costs, how many charges are left, and what it does to the world.
//
// Both tools cost loot money, deducted from the final score: a smoke bomb
// hides the thief in a cloud no cone can see through, an EMP shuts every
// camera down. Spending on tools is the trade-off against a bigger haul.
import { EMP_CHARGES, EMP_COST, EMP_SECONDS, SMOKE_CHARGES, SMOKE_COST, SMOKE_RADIUS, SMOKE_SECONDS } from './config.js';

export class Tools {
  constructor() {
    this.smokeCharges = SMOKE_CHARGES;
    this.empCharges = EMP_CHARGES;
    this.smokes = []; // { x, y, radius, timer }
    this.spent = 0; // money spent on tools, deducted from the score
  }

  dropSmoke(x, y) {
    if (this.smokeCharges <= 0) return false;
    this.smokeCharges -= 1;
    this.spent += SMOKE_COST;
    this.smokes.push({ x, y, radius: SMOKE_RADIUS, timer: SMOKE_SECONDS });
    return true;
  }

  fireEmp(cameras) {
    if (this.empCharges <= 0) return false;
    this.empCharges -= 1;
    this.spent += EMP_COST;
    for (const cam of cameras) cam.disable(EMP_SECONDS);
    return true;
  }

  update(dt) {
    for (const s of this.smokes) s.timer -= dt;
    this.smokes = this.smokes.filter((s) => s.timer > 0);
  }

  // Is a point inside any live smoke cloud?
  inSmoke(x, y) {
    for (const s of this.smokes) {
      if (Math.hypot(x - s.x, y - s.y) < s.radius) return true;
    }
    return false;
  }
}
