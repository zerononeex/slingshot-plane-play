// v1.9 HANDLING (the owner's playtest: "turning feels so slow"): a main upgrade line like the rubber
// band and the engine — 10 levels, each plane's record, the ENGINE's prices — that multiplies how hard
// the plane answers the stick (lateral + pitch response), on top of the everyone-gets-it base raise
// (× 1.15). Lv1 × 1.00 → Lv10 × 1.60 in even steps. Records keep it sparse (absent = Lv1), exactly like
// the fun lines, so older saves and SP1 codes read unchanged. The roll, the loop and the tilt-slot
// rules are not touched: this is input gain, not new moves. Pure (no DOM).
import { ENGINE } from './config.js';

export const STEER_BASE = 1.15;          // the floor raise for every plane, every world
export const HANDLING_MAX = 10;
export const HANDLING = ENGINE.map((e) => ({ level: e.level, cost: e.cost, gain: Math.round((1 + (0.6 * (e.level - 1)) / 9) * 1000) / 1000 }));

const intIn = (n, lo, hi, dflt) => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : dflt);
export const handlingLevel = (rec) => intIn(rec?.handling, 1, HANDLING_MAX, 1);
// Validation: a stored level 2–10 is kept; anything else reads as absent (Lv1).
export const cleanHandling = (raw) => { const v = intIn(raw, 1, HANDLING_MAX, 1); return v > 1 ? v : 0; };
export const handlingGain = (level) => HANDLING[intIn(level, 1, HANDLING_MAX, 1) - 1].gain;
// The whole steering multiplier a flight uses: the base raise × the line's gain.
export const steerGain = (level = 1) => STEER_BASE * handlingGain(level);
export const nextHandlingCost = (level) => (level >= HANDLING_MAX ? null : HANDLING[level].cost);
export const canBuyHandling = (rec) => { const c = nextHandlingCost(handlingLevel(rec)); return c !== null && rec.coins >= c; };
export function buyHandling(rec) {
  const lv = handlingLevel(rec), cost = nextHandlingCost(lv);
  if (cost === null || rec.coins < cost) return null;
  return { ...rec, coins: rec.coins - cost, handling: lv + 1 };
}
export const handlingTotal = () => HANDLING.reduce((a, l) => a + l.cost, 0);

// The line's name: a plane's own wins (the Starship borrowed elsewhere keeps its), else the world's.
const NAMES = {
  plains: 'CONTROL STICK', canyon: 'CANYON RUDDER', city: 'CITY STEERING', snow: 'SKI RUDDER', desert: 'SAND FINS', ocean: 'SEA RUDDER',
  space: 'GYRO THRUSTERS', jetstream: 'STORM AILERONS', volcano: 'HEAT VANES', jungle: 'VINE RUDDER', skyislands: 'BREEZE AILERONS',
  neonvoid: 'VECTOR NOZZLES', dragonwar: 'KNIGHT\'S REINS', starfox: 'G-VECTORING', starwars: 'S-FOIL CONTROL',
};
export const HANDLING_NAMES = NAMES;
export const handlingName = (planeId, worldId) => NAMES[planeId] ?? NAMES[worldId] ?? 'HANDLING';
