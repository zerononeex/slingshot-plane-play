// Pure shop + coin rules. Everything works on ONE stage record (see save.js
// getStage/setStage), so every stage has its own wallet and upgrades.
import { ENGINE, BAND, TANK, RAMP, MAGNET, WHEELS, PARTS, PAINTS, EJECT, COINS } from './config.js';
import { FUN_IDS, funTotal } from './funlines.js';
import { handlingTotal } from './handling.js';

// Level tracks: each table's first row is the starting level (1, or 0 = "none").
export const TRACKS = { band: BAND, engine: ENGINE, tank: TANK, ramp: RAMP, magnet: MAGNET, wheels: WHEELS };
export const TRACK_IDS = Object.keys(TRACKS);
export const PART_IDS = PARTS.map((p) => p.id);
export const PAINT_IDS = PAINTS.map((p) => p.id);

export const minLevel = (id) => TRACKS[id][0].level;
export const maxLevel = (id) => TRACKS[id][TRACKS[id].length - 1].level;

export function trackStats(id, level) {
  const t = TRACKS[id];
  const i = Math.min(t.length - 1, Math.max(0, (level | 0) - t[0].level));
  return t[i];
}

// Cost of the NEXT level of a track, or null when maxed.
export function nextCost(id, level) {
  return level >= maxLevel(id) ? null : trackStats(id, level + 1).cost;
}

export function canBuyTrack(rec, id) {
  const cost = nextCost(id, rec[id]);
  return cost !== null && rec.coins >= cost;
}

// Purchases return a NEW record, or null if not allowed.
export function buyTrack(rec, id) {
  if (!canBuyTrack(rec, id)) return null;
  return { ...rec, coins: rec.coins - nextCost(id, rec[id]), [id]: rec[id] + 1 };
}

// Plane parts: one-time, fixed order.
export function nextPart(parts) {
  return PARTS.find((p) => !parts[p.id]) ?? null;
}
export function canBuyPart(rec, id) {
  const next = nextPart(rec.parts);
  return !!next && next.id === id && rec.coins >= next.cost;
}
export function buyPart(rec, id) {
  if (!canBuyPart(rec, id)) return null;
  const part = nextPart(rec.parts);
  return { ...rec, coins: rec.coins - part.cost, parts: { ...rec.parts, [id]: true } };
}

// Ejector seat: one-time.
export const canBuyEject = (rec) => !rec.eject && rec.coins >= EJECT.cost;
export function buyEject(rec) {
  return canBuyEject(rec) ? { ...rec, coins: rec.coins - EJECT.cost, eject: true } : null;
}

// Paint jobs: buying one also puts it on; owned ones can be switched for free.
// planeId: whose record this is (a plane-only paint like Nebula only fits its own plane).
export const paintFits = (paint, planeId) => !paint.only || paint.only === planeId;
export function buyOrWearPaint(rec, id, planeId = null) {
  const paint = PAINTS.find((p) => p.id === id);
  if (!paint || !paintFits(paint, planeId)) return null;
  if (rec.paints.owned.includes(id)) return { ...rec, paints: { ...rec.paints, current: id } };
  if (rec.coins < paint.cost) return null;
  return { ...rec, coins: rec.coins - paint.cost, paints: { owned: [...rec.paints.owned, id], current: id } };
}

// Total cost of everything in the shop (for BALANCE.md).
export function completionTotals() {
  const track = (id) => TRACKS[id].slice(1).reduce((a, l) => a + l.cost, 0);
  const t = Object.fromEntries(TRACK_IDS.map((id) => [id, track(id)]));
  t.parts = PARTS.reduce((a, p) => a + p.cost, 0);
  t.eject = EJECT.cost;
  for (const id of FUN_IDS) t[id] = funTotal(id); // v1.0: the five fun lines
  t.handling = handlingTotal(); // v1.9: HANDLING (the engine's prices)
  t.core = Object.values(t).reduce((a, v) => a + v, 0);
  t.paints = PAINTS.filter((p) => !p.only).reduce((a, p) => a + p.cost, 0); // shared paints (Nebula is Starship-only)
  t.allIn = t.core + t.paints;
  return t;
}

export function runPayout(distance, coinsCollected, landingBonus = 0) {
  const bonus = Math.floor(Math.max(0, distance) / COINS.metersPerBonusCoin);
  const collected = coinsCollected * COINS.perCoin;
  return { collected, bonus, landing: landingBonus, total: collected + bonus + landingBonus };
}

// Apply a finished run to a stage record. Returns a NEW record.
export function applyRun(rec, distance, coinsCollected, landingBonus = 0, secretsFound = []) {
  const pay = runPayout(distance, coinsCollected, landingBonus);
  const dist = Math.floor(Math.max(0, distance));
  const secrets = [...rec.secrets, ...secretsFound.filter((id) => !rec.secrets.includes(id))];
  return { ...rec, coins: rec.coins + pay.total, best: Math.max(rec.best, dist), secrets };
}

// Secrets reached this flight that earn the once-ever "SECRET FOUND!" banner.
export function newSecrets(rec, reachedIds) {
  return reachedIds.filter((id, i) => !rec.secrets.includes(id) && reachedIds.indexOf(id) === i);
}
