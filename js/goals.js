// v0.9 STAGE GOALS (the son's idea, owner's ruling: gates only, no upgrade requirement).
// Every world has 10 numbered GOAL GATES — a permanent collection, each checked off once ever —
// and ONE GOAL that only appears once all 10 are flown. Fly through it = the world is TRULY
// COMPLETE (a permanent ★, a one-time prize). Gates and the goal are fly-throughs: no colliders,
// no physics effect. NOT the DIVE skill's dive gates (posts + banner, +15 per flight).
// Pure data + maths (no DOM / three.js).
import { FLIGHT } from './config.js';

export const GATE_COUNT = 10;
export const GOAL_PRIZE = 250;

// ───────────────────────── placement (lap-free absolute distances) ─────────────────────────
// gate = { n, at (m from the slingshot), x, height (m above the floor at that spot), size (ring radius),
//          special?: 'pocket' | 'signature', note }. Numbers run in distance order.
// Spread 8 % → 80 % of each world's scripted MAXED corner; the goal sits at ≈ 88 %.
// (Authored with tools-side validation; the table is printed in BALANCE.md.)
const G = (n, at, x, height, size, note, special) => ({ n, at, x, height, size, note, ...(special ? { special } : {}) });
export const GOALS = {};
GOALS.plains = {
  gates: [
    G(1, 230, -12, 7, 5.5, 'skimming low'),
    G(2, 480, -8, 16, 5.5, 'mid'),
    G(3, 690, 6, 30, 5.5, 'high'),
    G(4, 1095, 20, 5, 3.5, 'through ROCK TUNNEL #2', 'signature'),
    G(5, 1185, -72, 5, 4.5, 'inside the MUSHROOM GROTTO pocket', 'pocket'),
    G(6, 1385, 0, 7, 5.5, 'skimming low'),
    G(7, 1615, 6, 24, 5.5, 'mid'),
    G(8, 1845, 4, 44, 5.5, 'high'),
    G(9, 2075, 8, 14, 5.5, 'mid'),
    G(10, 2305, -6, 34, 5.5, 'high'),
  ],
  goal: { at: 2535, x: 0, height: 22, size: 9 },
};
GOALS.canyon = {
  gates: [
    G(1, 240, 0, 7, 5.5, 'skimming low'),
    G(2, 485, -8, 16, 5.5, 'mid'),
    G(3, 820, 0, 7, 5, 'under the NATURAL ROCK BRIDGE', 'signature'),
    G(4, 965, -12, 10, 5.5, 'mid'),
    G(5, 1260, -4, 40, 5.5, 'high'),
    G(6, 1350, 72, 5, 4.5, 'inside the HIDDEN CANYON pocket', 'pocket'),
    G(7, 1690, -12, 24, 5.5, 'mid'),
    G(8, 1935, 4, 44, 5.5, 'high'),
    G(9, 2175, 8, 14, 5.5, 'mid'),
    G(10, 2420, -6, 34, 5.5, 'high'),
  ],
  goal: { at: 2660, x: 0, height: 22, size: 9 },
};
GOALS.city = {
  gates: [
    G(1, 300, 0, 7, 5.5, 'skimming low'),
    G(2, 600, -8, 16, 5.5, 'mid'),
    G(3, 905, 6, 30, 5.5, 'high'),
    G(4, 1170, -12, 10, 5.5, 'mid'),
    G(5, 1505, -4, 40, 5.5, 'high'),
    G(6, 1805, 0, 7, 5.5, 'skimming low'),
    G(7, 2105, -12, 24, 5.5, 'mid'),
    G(8, 2375, -72, 5, 4.5, 'inside the ROOFTOP GARDEN pocket', 'pocket'),
    G(9, 2700, -10, 5, 4, 'under the stone bridge', 'signature'),
    G(10, 3010, -6, 34, 5.5, 'high'),
  ],
  goal: { at: 3330, x: 0, height: 22, size: 9 },
};
GOALS.snow = {
  gates: [
    G(1, 360, 0, 7, 5.5, 'skimming low'),
    G(2, 715, -8, 16, 5.5, 'mid'),
    G(3, 1075, 6, 30, 5.5, 'high'),
    G(4, 1610, 20, 5, 3.5, 'through ICE CAVE #2', 'signature'),
    G(5, 1795, -4, 40, 5.5, 'high'),
    G(6, 2150, -8, 7, 5.5, 'skimming low'),
    G(7, 2385, 72, 5, 4.5, 'inside the AURORA CAVE pocket', 'pocket'),
    G(8, 2835, 10, 44, 5.5, 'high'),
    G(9, 3230, 8, 14, 5.5, 'mid'),
    G(10, 3585, -6, 34, 5.5, 'high'),
  ],
  goal: { at: 3945, x: 0, height: 22, size: 9 },
};
GOALS.desert = {
  gates: [
    G(1, 435, 0, 7, 5.5, 'skimming low'),
    G(2, 885, -8, 16, 5.5, 'mid'),
    G(3, 1255, 72, 5, 4.5, 'inside the LOST OASIS pocket', 'pocket'),
    G(4, 1750, 10, 10, 5.5, 'mid'),
    G(5, 2165, -4, 40, 5.5, 'high'),
    G(6, 2600, 0, 7, 5.5, 'skimming low'),
    G(7, 3030, -12, 24, 5.5, 'mid'),
    G(8, 3425, -20, 5, 3.5, 'through the PYRAMID tunnel', 'signature'),
    G(9, 3900, 8, 14, 5.5, 'mid'),
    G(10, 4350, -6, 34, 5.5, 'high'),
  ],
  goal: { at: 4765, x: 0, height: 22, size: 9 },
};
GOALS.ocean = {
  gates: [
    G(1, 505, 0, 7, 5.5, 'skimming low'),
    G(2, 990, -8, 16, 5.5, 'mid'),
    G(3, 1515, 6, 30, 5.5, 'high'),
    G(4, 2015, 10, 10, 5.5, 'mid'),
    G(5, 2520, -4, 40, 5.5, 'high'),
    G(6, 3245, -72, 5, 4.5, 'inside the CORAL COVE pocket', 'pocket'),
    G(7, 3530, -12, 24, 5.5, 'mid'),
    G(8, 4035, 4, 44, 5.5, 'high'),
    G(9, 4560, -14, 6, 4.5, 'through the ROCK SEA ARCH', 'signature'),
    G(10, 5040, 8, 34, 5.5, 'high'),
  ],
  goal: { at: 5545, x: 0, height: 22, size: 9 },
};
GOALS.space = {
  gates: [
    G(1, 605, 0, 7, 5.5, 'skimming low'),
    G(2, 1145, 72, 5, 4.5, 'inside the NEBULA POCKET pocket', 'pocket'),
    G(3, 1820, 6, 30, 5.5, 'high'),
    G(4, 2430, 10, 10, 5.5, 'mid'),
    G(5, 3035, -4, 40, 5.5, 'high'),
    G(6, 3570, 8, 10, 3.5, 'threading the ASTEROID RING TUNNEL', 'signature'),
    G(7, 4250, -12, 24, 5.5, 'mid'),
    G(8, 4855, 4, 44, 5.5, 'high'),
    G(9, 5460, 8, 14, 5.5, 'mid'),
    G(10, 6070, -6, 34, 5.5, 'high'),
  ],
  goal: { at: 6675, x: 0, height: 22, size: 9 },
};
GOALS.jetstream = {
  gates: [
    G(1, 1035, 0, 10.5, 9, 'skimming low'),
    G(2, 2050, -8, 16, 9, 'mid'),
    G(3, 3075, 6, 30, 9, 'high'),
    G(4, 4100, 10, 10.5, 9, 'skimming low'),
    G(5, 5075, -4, 40, 9, 'high'),
    G(6, 6130, 0, 10.5, 9, 'skimming low'),
    G(7, 7155, -12, 24, 9, 'mid'),
    G(8, 8385, -72, 7, 6, 'inside the EYE OF THE STORM pocket', 'pocket'),
    G(9, 9480, 20, 5.5, 4, 'through the CLOUD TUNNEL', 'signature'),
    G(10, 10230, -6, 34, 9, 'high'),
  ],
  goal: { at: 11365, x: 0, height: 28, size: 13 },
};

// ───────────────────────── geometry ─────────────────────────
// The ring's centre height (absolute y). In a tunnel lane the floor is the lane floor.
export const gateY = (terrain, g) => terrain.surfaceAt(g.x, g.at, -Infinity) + g.height;

// Is (x, local d) inside this world's pocket lane?
function inPocket(stage, x, dl) {
  return (stage.pockets ?? []).find((p) => dl >= p.start && dl <= p.end && Math.abs(x - p.cx) <= p.half - 1) ?? null;
}

// Why a gate (or the goal) is badly placed, or null when it is fine: inside the flyable corridor
// (or the pocket lane), the whole ring above the floor and under the ceiling / tunnel roof, and
// neither its centre nor its rim inside anything solid.
export function placementProblem(stage, terrain, g) {
  const dl = terrain.local(g.at);
  const pocket = inPocket(stage, g.x, dl);
  if (!pocket && Math.abs(g.x) > FLIGHT.corridorHalfWidth - 2) return 'outside the corridor';
  if (pocket && Math.abs(g.x - pocket.cx) + 1 > pocket.half) return 'outside the pocket lane';
  const y = gateY(terrain, g);
  if (g.height < 2) return 'too low';
  if (y > FLIGHT.ceiling - 3) return 'above the ceiling';
  const roof = terrain.ceilingAt(g.x, g.at);
  if (y > roof - 1.5) return 'in the tunnel roof';
  if (terrain.hitTest(g.x, y, g.at, 1.2)) return 'centre inside a solid';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, px = g.x + Math.cos(a) * g.size, py = y + Math.sin(a) * g.size;
    const floor = terrain.surfaceAt(px, g.at, py);
    if (py < floor + 0.3) return 'rim in the ground';
    if (py > Math.min(terrain.ceilingAt(px, g.at), FLIGHT.ceiling + 6)) return 'rim in the roof';
    if (terrain.hitTest(px, py, g.at, 0.3)) return 'rim inside a solid';
  }
  return null;
}

// Did the plane fly through this ring between two positions? (crossing its plane, within its radius)
export const crossesRing = (g, gy, d0, x1, y1, d1) => d0 < g.at && d1 >= g.at && Math.hypot(x1 - g.x, y1 - gy) < g.size;

// ───────────────────────── progress (records keep these sparse: absent = none / not complete) ─────────────────────────
export const gatesOf = (rec) => (Array.isArray(rec?.gates) ? rec.gates : []);
export const isComplete = (rec) => rec?.complete === true;

// Save validation: known numbers only, no duplicates, sorted; `complete` must be a real `true`
// AND have all 10 gates behind it (else it is dropped).
export function cleanGates(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((n) => Number.isInteger(n) && n >= 1 && n <= GATE_COUNT))].sort((a, b) => a - b);
}
export const cleanComplete = (raw, gates) => raw === true && gates.length === GATE_COUNT;

// ───────────────────────── one flight ─────────────────────────
// run = what this flight knows: the gates already owned, the ones collected now, whether the goal
// is in the world, and whether the world was completed now.
export function createGoalRun(rec) {
  const owned = gatesOf(rec);
  return { owned: new Set(owned), fresh: [], open: owned.length >= GATE_COUNT, completeBefore: isComplete(rec), completedNow: false };
}
export const goalVisible = (run) => run.open;
export const gateCount = (run) => run.owned.size;

// Step the plane from (d0) to (x1, y1, d1). `flying` = the plane itself is being flown (not the
// eject glide, not after the flight ended). ys = each gate's centre height; goalY = the goal's.
// Returns events: { type: 'gate', n, count } · { type: 'gateRepass', n } · { type: 'goalOpen' } ·
// { type: 'complete' } · { type: 'goalRepass' }.
export function stepGoalRun(run, goals, ys, goalY, d0, x1, y1, d1, flying, out = []) {
  if (!flying || !goals) return out;
  for (let i = 0; i < goals.gates.length; i++) {
    const g = goals.gates[i];
    if (!crossesRing(g, ys[i], d0, x1, y1, d1)) continue;
    if (run.owned.has(g.n)) { out.push({ type: 'gateRepass', n: g.n }); continue; }
    run.owned.add(g.n);
    run.fresh.push(g.n);
    out.push({ type: 'gate', n: g.n, count: run.owned.size });
    if (run.owned.size >= GATE_COUNT && !run.open) { run.open = true; out.push({ type: 'goalOpen' }); }
  }
  if (run.open && crossesRing(goals.goal, goalY, d0, x1, y1, d1)) {
    if (!run.completeBefore && !run.completedNow) { run.completedNow = true; out.push({ type: 'complete' }); }
    else out.push({ type: 'goalRepass' });
  }
  return out;
}

// Credit a flight's goal progress to the FLOWN WORLD's record: new gates join the collection;
// completing the world (first time only) adds the prize to its wallet.
export function applyGoals(rec, freshGates = [], completed = false) {
  const gates = cleanGates([...gatesOf(rec), ...freshGates]);
  const out = { ...rec };
  if (gates.length) out.gates = gates;
  if (completed && !isComplete(rec) && gates.length === GATE_COUNT) { out.complete = true; out.coins = rec.coins + GOAL_PRIZE; }
  return out;
}

// Results lines (null when nothing happened).
export function goalLines(run) {
  return {
    gates: run.fresh.length ? `Goal gates +${run.fresh.length} (${run.owned.size}/${GATE_COUNT})` : null,
    complete: run.completedNow ? `★ STAGE COMPLETE! +${GOAL_PRIZE}` : null,
  };
}

export const goalsFor = (stageId) => GOALS[stageId] ?? null;
