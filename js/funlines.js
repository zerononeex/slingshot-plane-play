// v1.0 FIVE FUN UPGRADES (owner picked all five): SECRET RADAR · PARTY HORN · MEGA CHUTE ·
// SPOILER BRAKES · HELIUM BALLOONS. Per plane record like every line, 5 levels each (0 = none).
// Records keep them sparse (absent = 0), so older saves read as "not bought". Pure (no DOM).

// costs[i] = the price of level i + 1. Effects are indexed by level (0..5).
export const FUN = {
  radar:    { icon: '🔍', costs: [80, 150, 300, 500, 800], range: [0, 60, 100, 150, 220, 320] },  // m; Lv5 adds an arrow
  horn:     { icon: '🎉', costs: [40, 80, 150, 250, 400], sound: [null, 'squeak', 'car', 'truck', 'air', 'klaxon'], confetti: [null, 'puff', 'puff', 'puff', 'colour', 'rainbow'] },
  chute:    { icon: '🪂', costs: [60, 120, 220, 380, 600], sinkMul: [1, 0.9, 0.8, 0.7, 0.6, 0.5], steerMul: [1, 1.06, 1.12, 1.18, 1.24, 1.3] },
  brakes:   { icon: '🛬', costs: [80, 150, 300, 500, 800], decel: [0, 4, 6, 8, 10, 13] },            // m/s² while held
  balloons: { icon: '🎈', costs: [80, 150, 300, 500, 800], sink: [0, 0.05, 0.1, 0.15, 0.2, 0.25] },  // glide sink cut
};
export const FUN_IDS = Object.keys(FUN);
export const FUN_MAX = 5;
export const HORN_COOLDOWN = 0.8;        // s between honks
export const BRAKE_FLOOR_OVER_STALL = 2; // m/s: braking never takes you below stall + this

const intIn = (n, lo, hi) => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : lo);
export const funLevel = (rec, id) => intIn(rec?.[id], 0, FUN_MAX);
export const cleanFun = (raw) => intIn(raw, 0, FUN_MAX);
export const nextFunCost = (id, level) => (level >= FUN_MAX ? null : FUN[id].costs[level]);
export const canBuyFun = (rec, id) => { const c = nextFunCost(id, funLevel(rec, id)); return c !== null && rec.coins >= c; };
export function buyFun(rec, id) {
  const lv = funLevel(rec, id), cost = nextFunCost(id, lv);
  if (cost === null || rec.coins < cost) return null;
  return { ...rec, coins: rec.coins - cost, [id]: lv + 1 };
}
export const funTotal = (id) => FUN[id].costs.reduce((a, c) => a + c, 0);

// SECRET RADAR: the nearest UNFOUND secret of the world flown, within the level's range.
// → null (silent: no radar, none left, or out of range) | { dist, k (0 far → 1 on top), arrow? (rad, Lv5 only) }
export function radarReading(secrets, found, pos, level, heightOf = (s) => s.y) {
  const range = FUN.radar.range[intIn(level, 0, FUN_MAX)];
  if (!range) return null;
  let best = null, bestD = Infinity;
  for (const s of secrets) {
    if (found.has(s.id)) continue;
    const dd = Math.hypot(s.x - pos.x, heightOf(s) - pos.y, s.d - pos.d);
    if (dd < bestD) { bestD = dd; best = s; }
  }
  if (!best || bestD > range) return null;
  const out = { id: best.id, dist: bestD, k: 1 - bestD / range };
  // Lv5: which way to turn — 0 = straight ahead, + = to the right, ± π = behind you.
  if (level >= FUN_MAX) out.arrow = Math.atan2(best.x - pos.x, best.d - pos.d);
  return out;
}
// Blink period: slow far away, quick close in.
export const radarBlinkPeriod = (k) => 1.1 - 0.95 * Math.max(0, Math.min(1, k));

// PARTY HORN: pure show — the sound + confetti for a level (no physics, no coins, ever).
export const hornShow = (level) => ({ sound: FUN.horn.sound[intIn(level, 0, FUN_MAX)], confetti: FUN.horn.confetti[intIn(level, 0, FUN_MAX)] });

// MEGA CHUTE: the parachute's sink and steering for a level.
export const chuteSinkMul = (level) => FUN.chute.sinkMul[intIn(level, 0, FUN_MAX)];
export const chuteSteerMul = (level) => FUN.chute.steerMul[intIn(level, 0, FUN_MAX)];

// SPOILER BRAKES: the speed you can never brake below.
export const brakeFloor = (P) => P.stallSpeed + BRAKE_FLOOR_OVER_STALL;
