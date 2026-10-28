// v0.9 STAGE GOALS (the son's idea, owner's ruling: gates only, no upgrade requirement).
// Every world has 20 numbered GOAL GATES (v1.0; 10 in v0.9) — a permanent collection, each checked off once ever —
// and ONE GOAL that only appears once all 20 are flown (or the world is already complete). Fly through it = the world is TRULY
// COMPLETE (a permanent ★, a one-time prize). Gates and the goal are fly-throughs: no colliders,
// no physics effect. NOT the DIVE skill's dive gates (posts + banner, +15 per flight).
// Pure data + maths (no DOM / three.js).
import { FLIGHT } from './config.js';
import { STAGE_ORDER } from './stages.js';

export const GATE_COUNT = 20;           // v1.0 (was 10 in v0.9)
export const V09_GATES = 10;             // gates 1–10: the v0.9 collection, grandfathered
export const MAX_GATES = 70;             // v1.1: Space + Jetstream carry 30 (the others keep 20); v1.2 Neon Void 50; v1.5 Dragon War 60; v1.6 Star Fox 70
export const GOAL_PRIZE = 250;

// ───────────────────────── placement (lap-free absolute distances) ─────────────────────────
// gate = { n, at (m from the slingshot), x, height (m above the floor at that spot), size (ring radius),
//          special?: 'pocket' | 'signature', note }. n is the gate's identity (the save stores it); the number a player
//          sees is its rank by distance (v2.3 gateRanks).
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

// v1.0 LEVEL 10: gates 11–20 join each world (30 % → 92 % of the NEW full-maxed corner; one inside the
// world's SECOND pocket). Gates 1–10 above are untouched. Numbers are identity, not order: a gate 11+
// may sit between earlier gates. The GOAL moves out to ≈ 88 % of the new corner (v0.9 spot kept as v09Goal).
const V10 = {
  plains: {
    gates: [
      G(11, 1135, 6, 20, 5.5, 'mid'),
      G(12, 1320, -10, 8, 5.5, 'mid'),
      G(13, 1710, 0, 36, 5.5, 'high'),
      G(14, 1980, 12, 14, 5.5, 'mid'),
      G(15, 2250, -6, 42, 5.5, 'high'),
      G(16, 2525, 72, 5, 4.5, 'inside the SUNFLOWER MAZE pocket', 'pocket2'),
      G(17, 2785, 10, 28, 5.5, 'mid'),
      G(18, 3055, 2, 46, 5.5, 'high'),
      G(19, 3325, -4, 12, 5.5, 'mid'),
      G(20, 3595, 10, 32, 5.5, 'high'),
    ],
    goal: { at: 3400, x: 0, height: 22, size: 9 },
  },
  canyon: {
    gates: [
      G(11, 1215, -12, 20, 5.5, 'mid'),
      G(12, 1520, -10, 8, 5.5, 'mid'),
      G(13, 1805, 0, 36, 5.5, 'high'),
      G(14, 2085, 12, 14, 5.5, 'mid'),
      G(15, 2360, -6, 42, 5.5, 'high'),
      G(16, 2615, 72, 5, 4.5, 'inside the OLD GOLD MINE pocket', 'pocket2'),
      G(17, 2935, -12, 28, 5.5, 'mid'),
      G(18, 3220, -12, 46, 5.5, 'high'),
      G(19, 3505, -10, 12, 5.5, 'mid'),
      G(20, 3790, 10, 32, 5.5, 'high'),
    ],
    goal: { at: 3625, x: 0, height: 22, size: 9 },
  },
  city: {
    gates: [
      G(11, 1465, 12, 20, 5.5, 'mid'),
      G(12, 1850, -10, 8, 5.5, 'mid'),
      G(13, 2170, 8, 36, 5.5, 'high'),
      G(14, 2400, 72, 5, 4.5, 'inside the NEON ALLEY pocket', 'pocket2'),
      G(15, 2855, -6, 42, 5.5, 'high'),
      G(16, 3175, -10, 7, 5.5, 'skimming low'),
      G(17, 3535, -12, 28, 5.5, 'mid'),
      G(18, 3880, 2, 46, 5.5, 'high'),
      G(19, 4220, -10, 12, 5.5, 'mid'),
      G(20, 4560, 10, 32, 5.5, 'high'),
    ],
    goal: { at: 4365, x: 0, height: 22, size: 9 },
  },
  snow: {
    gates: [
      G(11, 1835, -12, 20, 5.5, 'mid'),
      G(12, 2255, -10, 8, 5.5, 'mid'),
      G(13, 2680, 0, 36, 5.5, 'high'),
      G(14, 3100, 12, 14, 5.5, 'mid'),
      G(15, 3635, -72, 5, 4.5, 'inside the CRYSTAL GLACIER pocket', 'pocket2'),
      G(16, 3945, 8, 7, 5.5, 'skimming low'),
      G(17, 4365, -12, 28, 5.5, 'mid'),
      G(18, 4785, 2, 46, 5.5, 'high'),
      G(19, 5205, -4, 12, 5.5, 'mid'),
      G(20, 5630, 8, 32, 5.5, 'high'),
    ],
    goal: { at: 5375, x: 0, height: 22, size: 9 },
  },
  desert: {
    gates: [
      G(11, 2205, 6, 20, 5.5, 'mid'),
      G(12, 2710, -10, 8, 5.5, 'mid'),
      G(13, 3220, 0, 36, 5.5, 'high'),
      G(14, 3725, 12, 14, 5.5, 'mid'),
      G(15, 4230, -6, 42, 5.5, 'high'),
      G(16, 4735, 8, 7, 5.5, 'skimming low'),
      G(17, 5245, -12, 28, 5.5, 'mid'),
      G(18, 5750, 2, 46, 5.5, 'high'),
      G(19, 6320, 72, 5, 4.5, 'inside the SANDSTONE TEMPLE pocket', 'pocket2'),
      G(20, 6760, 10, 32, 5.5, 'high'),
    ],
    goal: { at: 6470, x: 0, height: 22, size: 9 },
  },
  ocean: {
    gates: [
      G(11, 2590, 6, 20, 5.5, 'mid'),
      G(12, 3155, 72, 5, 4.5, 'inside the SHIPWRECK BAY pocket', 'pocket2'),
      G(13, 3780, 0, 36, 5.5, 'high'),
      G(14, 4375, 12, 14, 5.5, 'mid'),
      G(15, 4965, -6, 42, 5.5, 'high'),
      G(16, 5560, 8, 7, 5.5, 'skimming low'),
      G(17, 6155, -12, 28, 5.5, 'mid'),
      G(18, 6750, 2, 46, 5.5, 'high'),
      G(19, 7345, -10, 12, 5.5, 'mid'),
      G(20, 7940, 10, 32, 5.5, 'high'),
    ],
    goal: { at: 7595, x: 0, height: 22, size: 9 },
  },
  space: {
    gates: [
      G(11, 3085, 12, 20, 5.5, 'mid'),
      G(12, 3655, -72, 5, 4.5, 'inside the COMET TRAIL pocket', 'pocket2'),
      G(13, 4425, 0, 36, 5.5, 'high'),
      G(14, 5125, -12, 14, 5.5, 'mid'),
      G(15, 5820, -6, 42, 5.5, 'high'),
      G(16, 6515, 8, 7, 5.5, 'skimming low'),
      G(17, 7205, 10, 28, 5.5, 'mid'),
      G(18, 7910, 2, 46, 5.5, 'high'),
      G(19, 8605, -4, 12, 5.5, 'mid'),
      G(20, 9325, 10, 32, 5.5, 'high'),
    ],
    goal: { at: 8890, x: 0, height: 22, size: 9 },
  },
  jetstream: {
    gates: [
      G(11, 5140, -12, 20, 9, 'mid'),
      G(12, 6295, -10, 10.5, 9, 'skimming low'),
      G(13, 7470, 0, 36, 9, 'high'),
      G(14, 8645, 12, 14, 9, 'mid'),
      G(15, 9855, -6, 42, 9, 'high'),
      G(16, 11030, 8, 10.5, 9, 'skimming low'),
      G(17, 12170, 10, 28, 9, 'mid'),
      G(18, 13365, 2, 46, 9, 'high'),
      G(19, 14410, 72, 7, 6, 'inside the RAINBOW BRIDGE pocket', 'pocket2'),
      G(20, 15690, 10, 32, 9, 'high'),
    ],
    goal: { at: 15035, x: 0, height: 28, size: 13 },
  },
};
for (const [id, x] of Object.entries(V10)) {
  GOALS[id].gates.push(...x.gates);
  GOALS[id].v09Goal = GOALS[id].goal;
  GOALS[id].goal = x.goal;
}

// v1.1 FAIRNESS RULE: every gate and the goal re-spread inside the world's COMPLETION ZONE
// (min(unique run, v1.0 FULL-maxed corner)). Positions move; identities never do — numbers, roles
// (pocket / signature / pocket2) and sizes are kept, so collected state (stored by number) is untouched.
// Regular gates run 5 % → 84 % of the zone in number order, the goal sits at 88 %; the special gates
// sit exactly in their structures (lap occurrence nearest their slot). (v1.0 goal kept as v10Goal.)
const V11 = {
  plains: { goal: { at: 1760, x: 0, height: 22, size: 9 }, gates: { 1: [100, -12, 7, 'skimming low'], 2: [185, -8, 16, 'mid'], 3: [265, 6, 30, 'high'], 4: [1095, 20, 5, 'through ROCK TUNNEL #2'], 5: [1175, -72, 5, 'inside the MUSHROOM GROTTO pocket'], 6: [515, 0, 7, 'skimming low'], 7: [600, -6, 24, 'mid'], 8: [680, 4, 44, 'high'], 9: [765, 8, 14, 'mid'], 10: [850, -6, 34, 'high'], 11: [930, -6, 20, 'mid'], 12: [1015, -10, 8, 'mid'], 13: [1135, -10, 36, 'high'], 14: [1225, 14, 14, 'mid'], 15: [1305, -6, 42, 'high'], 16: [565, 72, 5, 'inside the SUNFLOWER MAZE pocket'], 17: [1410, 0, 28, 'mid'], 18: [1565, -6, 46, 'high'], 19: [1605, 0, 12, 'mid'], 20: [1680, 14, 32, 'high'] } },
  canyon: { goal: { at: 2640, x: 0, height: 22, size: 9 }, gates: { 1: [150, 0, 7, 'skimming low'], 2: [275, 14, 16, 'mid'], 3: [820, 0, 7, 'under the NATURAL ROCK BRIDGE'], 4: [525, 14, 10, 'mid'], 5: [650, 14, 40, 'high'], 6: [1445, 72, 5, 'inside the HIDDEN CANYON pocket'], 7: [900, 0, 24, 'mid'], 8: [1025, 0, 44, 'high'], 9: [1150, -10, 14, 'mid'], 10: [1275, -6, 34, 'high'], 11: [1395, -12, 20, 'mid'], 12: [1520, -10, 8, 'mid'], 13: [1645, 14, 36, 'high'], 14: [1770, 12, 14, 'mid'], 15: [1895, 14, 42, 'high'], 16: [455, 72, 5, 'inside the OLD GOLD MINE pocket'], 17: [2145, -12, 28, 'mid'], 18: [2270, -12, 46, 'high'], 19: [2395, -10, 12, 'mid'], 20: [2520, 10, 32, 'high'] } },
  city: { goal: { at: 3520, x: 0, height: 22, size: 9 }, gates: { 1: [200, -10, 16, 'mid'], 2: [365, -8, 16, 'mid'], 3: [535, 6, 30, 'high'], 4: [635, 14, 10, 'mid'], 5: [880, 10, 40, 'high'], 6: [1030, 14, 7, 'skimming low'], 7: [1165, -12, 24, 'mid'], 8: [395, -72, 5, 'inside the ROOFTOP GARDEN pocket'], 9: [561, -10, 5, 'under the stone bridge'], /* v1.9: the bridge moved 700 → 560 */ 10: [1705, -10, 34, 'high'], 11: [1865, -6, 20, 'mid'], 12: [2030, -10, 8, 'mid'], 13: [2195, -10, 36, 'high'], 14: [2400, 72, 5, 'inside the NEON ALLEY pocket'], 15: [2530, 6, 42, 'high'], 16: [2695, -14, 7, 'skimming low'], 17: [2875, -12, 28, 'mid'], 18: [3025, 2, 46, 'high'], 19: [3175, -10, 12, 'mid'], 20: [3360, 10, 32, 'high'] } },
  snow: { goal: { at: 4400, x: 0, height: 22, size: 9 }, gates: { 1: [250, 14, 7, 'skimming low'], 2: [460, -8, 16, 'mid'], 3: [665, 14, 30, 'high'], 4: [1610, 20, 5, 'through ICE CAVE #2'], 5: [1080, 6, 40, 'high'], 6: [1290, 0, 7, 'skimming low'], 7: [2375, 72, 5, 'inside the AURORA CAVE pocket'], 8: [1705, 10, 44, 'high'], 9: [1915, 8, 14, 'mid'], 10: [2120, -6, 34, 'high'], 11: [2330, -12, 20, 'mid'], 12: [2535, -10, 8, 'mid'], 13: [2745, 0, 36, 'high'], 14: [2990, 12, 14, 'mid'], 15: [3635, -72, 5, 'inside the CRYSTAL GLACIER pocket'], 16: [3370, 8, 7, 'skimming low'], 17: [3575, -12, 28, 'mid'], 18: [3785, 2, 46, 'high'], 19: [3990, 6, 12, 'mid'], 20: [4200, 8, 32, 'high'] } },
  desert: { goal: { at: 5280, x: 0, height: 22, size: 9 }, gates: { 1: [300, 0, 7, 'skimming low'], 2: [550, 10, 16, 'mid'], 3: [1235, 72, 5, 'inside the LOST OASIS pocket'], 4: [1050, -10, 10, 'mid'], 5: [1300, -4, 40, 'high'], 6: [1545, 0, 7, 'skimming low'], 7: [1795, -12, 24, 'mid'], 8: [3425, -20, 5, 'through the PYRAMID tunnel'], 9: [2295, 8, 14, 'mid'], 10: [2545, 10, 34, 'high'], 11: [2795, 14, 20, 'mid'], 12: [3045, -10, 8, 'mid'], 13: [3295, 0, 36, 'high'], 14: [3545, 14, 14, 'mid'], 15: [3795, -6, 42, 'high'], 16: [4040, 8, 7, 'skimming low'], 17: [4290, -12, 28, 'mid'], 18: [4540, 2, 46, 'high'], 19: [4330, 72, 5, 'inside the SANDSTONE TEMPLE pocket'], 20: [5040, -10, 32, 'high'] } },
  ocean: { goal: { at: 6160, x: 0, height: 22, size: 9 }, gates: { 1: [350, 0, 7, 'skimming low'], 2: [650, 10, 16, 'mid'], 3: [950, -10, 30, 'high'], 4: [1225, 10, 10, 'mid'], 5: [1515, -4, 40, 'high'], 6: [1265, -72, 5, 'inside the CORAL COVE pocket'], 7: [2095, -12, 24, 'mid'], 8: [2385, 4, 44, 'high'], 9: [4560, -14, 6, 'through the ROCK SEA ARCH'], 10: [2970, 8, 34, 'high'], 11: [3260, 6, 20, 'mid'], 12: [3195, 72, 5, 'inside the SHIPWRECK BAY pocket'], 13: [3845, 0, 36, 'high'], 14: [4135, 14, 14, 'mid'], 15: [4425, -6, 42, 'high'], 16: [4715, 8, 7, 'skimming low'], 17: [5025, 10, 28, 'mid'], 18: [5300, -14, 46, 'high'], 19: [5590, -10, 12, 'mid'], 20: [5880, -6, 32, 'high'] } },
  space: { goal: { at: 8800, x: 0, height: 22, size: 9 }, gates: { 1: [500, 0, 7, 'skimming low'], 2: [1125, 72, 5, 'inside the NEBULA POCKET pocket'], 3: [1045, 6, 30, 'high'], 4: [1325, 10, 10, 'mid'], 5: [1610, 14, 40, 'high'], 6: [1570, 8, 10, 'threading the ASTEROID RING TUNNEL'], 7: [2135, 14, 24, 'mid'], 8: [2405, 10, 44, 'high'], 9: [2680, 8, 14, 'mid'], 10: [2950, -6, 34, 'high'], 11: [3345, 12, 20, 'mid'], 12: [3655, -72, 5, 'inside the COMET TRAIL pocket'], 13: [3770, 10, 36, 'high'], 14: [4040, 14, 14, 'mid'], 15: [4315, -6, 42, 'high'], 16: [4585, 8, 7, 'skimming low'], 17: [4860, 10, 28, 'mid'], 18: [5120, -10, 46, 'high'], 19: [5405, 14, 12, 'mid'], 20: [5675, 10, 32, 'high'], 21: [5950, 0, 7, 'skimming low'], 22: [6220, 14, 16, 'mid'], 23: [6495, 0, 30, 'high'], 24: [6765, 0, 10, 'mid'], 25: [7040, 0, 40, 'high'], 26: [7320, 0, 24, 'mid'], 27: [7585, 0, 44, 'high'], 28: [7855, 14, 14, 'mid'], 29: [8130, 0, 34, 'high'], 30: [8400, 0, 20, 'mid'] } },
  jetstream: { goal: { at: 15015, x: 0, height: 28, size: 13 }, gates: { 1: [865, 0, 10.5, 'skimming low'], 2: [1370, -8, 16, 'mid'], 3: [1785, 6, 30, 'high'], 4: [2230, -10, 10.5, 'skimming low'], 5: [2710, -4, 40, 'high'], 6: [3155, -14, 10.5, 'skimming low'], 7: [3675, 14, 24, 'mid'], 8: [4365, -72, 7, 'inside the EYE OF THE STORM pocket'], 9: [5480, 20, 5.5, 'through the CLOUD TUNNEL'], 10: [5035, -14, 34, 'high'], 11: [5530, -12, 20, 'mid'], 12: [5965, 10, 10.5, 'skimming low'], 13: [6430, 0, 36, 'high'], 14: [6915, 0, 14, 'mid'], 15: [7370, -6, 42, 'high'], 16: [7805, -14, 10.5, 'skimming low'], 17: [8290, -10, 28, 'mid'], 18: [8790, 2, 46, 'high'], 19: [8420, 72, 7, 'inside the RAINBOW BRIDGE pocket'], 20: [9685, 10, 32, 'high'], 21: [10150, 10, 10.5, 'skimming low'], 22: [10615, 0, 16, 'mid'], 23: [11080, 14, 30, 'high'], 24: [11545, 14, 10.5, 'skimming low'], 25: [12010, 0, 40, 'high'], 26: [12475, 0, 24, 'mid'], 27: [12920, 0, 44, 'high'], 28: [13405, 0, 14, 'mid'], 29: [13870, 6, 34, 'high'], 30: [14355, 0, 20, 'mid'] } },
};
for (const [id, x] of Object.entries(V11)) {
  // v1.1 §3: the two longest worlds (Space, Jetstream) get gates 21–30 — regular gates, the world's own size
  const size = id === 'jetstream' ? 9 : 5.5;
  for (let n = GOALS[id].gates.length + 1; x.gates[n]; n++) GOALS[id].gates.push({ n, at: 0, x: 0, height: 0, size, note: '' });
  for (const g of GOALS[id].gates) { const p = x.gates[g.n]; if (p) Object.assign(g, { at: p[0], x: p[1], height: p[2], note: g.special ? g.note : p[3] }); }
  GOALS[id].v10Goal = GOALS[id].goal;
  GOALS[id].goal = x.goal;
}

// ───────────────────────── v1.3 NEW WORLDS: 30 gates each, authored into each world's completion zone ─────────────────────────
// Regular gates 5 % → 84 % of Z in number order; pocket / signature / pocket2 specials in their structures; the goal at 88 % of Z.
GOALS.volcano = {
  gates: [
    G(1, 600, 14, 16, 5.5, 'mid'),
    G(2, 925, 14, 30, 5.5, 'high'),
    G(3, 1270, 0, 10, 5.5, 'mid'),
    G(4, 2315, -72, 5, 4.5, 'inside the LAVA TUBE pocket', 'pocket'),
    G(5, 2010, 6, 24, 5.5, 'mid'),
    G(6, 2250, 6, 44, 5.5, 'high'),
    G(7, 2590, 0, 14, 5.5, 'mid'),
    G(8, 2860, 14, 34, 5.5, 'high'),
    G(9, 2900, 0, 7, 5, 'through the ERUPTION ARCH', 'signature'),
    G(10, 3540, 0, 7, 5.5, 'skimming low'),
    G(11, 3820, 6, 16, 5.5, 'mid'),
    G(12, 4195, 0, 30, 5.5, 'high'),
    G(13, 4525, 6, 10, 5.5, 'mid'),
    G(14, 4850, 14, 40, 5.5, 'high'),
    G(15, 5195, 72, 5, 4.5, 'inside the MAGMA VAULT', 'pocket2'),
    G(16, 5505, 10, 44, 5.5, 'high'),
    G(17, 5815, 6, 14, 5.5, 'mid'),
    G(18, 6155, 0, 34, 5.5, 'high'),
    G(19, 6485, 0, 20, 5.5, 'mid'),
    G(20, 6810, 0, 7, 5.5, 'skimming low'),
    G(21, 7140, 0, 16, 5.5, 'mid'),
    G(22, 7465, 0, 30, 5.5, 'high'),
    G(23, 7790, 0, 10, 5.5, 'mid'),
    G(24, 8120, 10, 40, 5.5, 'high'),
    G(25, 8445, 0, 24, 5.5, 'mid'),
    G(26, 8770, 0, 44, 5.5, 'high'),
    G(27, 9100, 0, 14, 5.5, 'mid'),
    G(28, 9425, 0, 34, 5.5, 'high'),
    G(29, 9755, 0, 20, 5.5, 'mid'),
    G(30, 10110, 10, 7, 5.5, 'skimming low'),
  ],
  goal: { at: 10560, x: 0, height: 22, size: 9 },
};
GOALS.jungle = {
  gates: [
    G(1, 700, 0, 16, 5.5, 'mid'),
    G(2, 1065, 0, 30, 5.5, 'high'),
    G(3, 1465, 0, 10, 5.5, 'mid'),
    G(4, 2335, -72, 5, 4.5, 'inside the TEMPLE RUINS pocket', 'pocket'),
    G(5, 2225, 14, 24, 5.5, 'mid'),
    G(6, 2605, 14, 44, 5.5, 'high'),
    G(7, 2990, 0, 14, 5.5, 'mid'),
    G(8, 3370, 0, 34, 5.5, 'high'),
    G(9, 1020, 20, 5.5, 4, 'through the CANOPY TUNNEL', 'signature'),
    G(10, 4130, 10, 7, 5.5, 'skimming low'),
    G(11, 4515, 0, 16, 5.5, 'mid'),
    G(12, 4895, 0, 30, 5.5, 'high'),
    G(13, 5275, 0, 10, 5.5, 'mid'),
    G(14, 5675, 0, 40, 5.5, 'high'),
    G(15, 5425, 72, 5, 4.5, 'inside the PARROT HOLLOW', 'pocket2'),
    G(16, 6420, 0, 44, 5.5, 'high'),
    G(17, 6800, 14, 14, 5.5, 'mid'),
    G(18, 7235, 14, 34, 5.5, 'high'),
    G(19, 7565, -6, 20, 5.5, 'mid'),
    G(20, 7945, 6, 7, 5.5, 'skimming low'),
    G(21, 8330, 0, 16, 5.5, 'mid'),
    G(22, 8710, 0, 30, 5.5, 'high'),
    G(23, 9075, 0, 10, 5.5, 'mid'),
    G(24, 9470, 0, 40, 5.5, 'high'),
    G(25, 9855, -10, 24, 5.5, 'mid'),
    G(26, 10235, 14, 44, 5.5, 'high'),
    G(27, 10615, 6, 14, 5.5, 'mid'),
    G(28, 10995, 0, 34, 5.5, 'high'),
    G(29, 11380, 0, 20, 5.5, 'mid'),
    G(30, 11760, -10, 7, 5.5, 'skimming low'),
  ],
  goal: { at: 12320, x: 0, height: 22, size: 9 },
};
GOALS.skyislands = {
  gates: [
    G(1, 800, 0, 16, 5.5, 'mid'),
    G(2, 1160, -6, 30, 5.5, 'high'),
    G(3, 1670, -10, 10, 5.5, 'mid'),
    G(4, 2375, 72, 5, 4.5, 'inside the WATERFALL GROTTO pocket', 'pocket'),
    G(5, 2545, 0, 24, 5.5, 'mid'),
    G(6, 2980, 0, 44, 5.5, 'high'),
    G(7, 3415, 10, 14, 5.5, 'mid'),
    G(8, 3850, 14, 34, 5.5, 'high'),
    G(9, 3100, -20, 5, 4, 'through the ISLAND GROTTO', 'signature'),
    G(10, 4725, 0, 7, 5.5, 'skimming low'),
    G(11, 5160, -6, 16, 5.5, 'mid'),
    G(12, 5595, 6, 30, 5.5, 'high'),
    G(13, 6000, 0, 10, 5.5, 'mid'),
    G(14, 6465, 0, 40, 5.5, 'high'),
    G(15, 7615, -72, 5, 4.5, 'inside the RAINBOW ROOF', 'pocket2'),
    G(16, 7340, 14, 44, 5.5, 'high'),
    G(17, 7775, 0, 14, 5.5, 'mid'),
    G(18, 8210, -10, 34, 5.5, 'high'),
    G(19, 8660, 0, 20, 5.5, 'mid'),
    G(20, 9080, 0, 7, 5.5, 'skimming low'),
    G(21, 9515, 0, 16, 5.5, 'mid'),
    G(22, 9970, 0, 30, 5.5, 'high'),
    G(23, 10390, 0, 10, 5.5, 'mid'),
    G(24, 10825, 14, 40, 5.5, 'high'),
    G(25, 11335, 14, 24, 5.5, 'mid'),
    G(26, 11695, 0, 44, 5.5, 'high'),
    G(27, 12130, 0, 14, 5.5, 'mid'),
    G(28, 12570, 0, 34, 5.5, 'high'),
    G(29, 13005, 0, 20, 5.5, 'mid'),
    G(30, 13440, 10, 7, 5.5, 'skimming low'),
  ],
  goal: { at: 14080, x: 0, height: 22, size: 9 },
};
// ───────────────────────── v1.2 NEON VOID: 50 gates (the most in the game) ─────────────────────────
// Authored straight into its completion zone (Z = 37,829 m, its FULL-maxed corner): regular gates run
// 5 % → 84 % of Z in number order, each ≥ 50 m from every neon wall / laser row / sliding wall and
// reachable from the openings either side; the specials sit in their structures; the goal at 88 % of Z.
GOALS.neonvoid = {
  gates: [
    G(1, 1890, 0, 40, 9, 'high'),
    G(2, 2500, 0, 30, 9, 'high'),
    G(3, 3160, 0, 12, 9, 'mid'),
    G(4, 4375, -72, 7, 6, 'inside THE GRID CORE', 'pocket'),
    G(5, 4460, 0, 24, 9, 'mid'),
    G(6, 4890, 0, 44, 9, 'high'),
    G(7, 5550, -6, 34, 9, 'high'),
    G(8, 6145, 0, 34, 9, 'high'),
    G(9, 7180, 20, 5.5, 4, 'through the GRID TUNNEL', 'signature'),
    G(10, 7430, -6, 30, 9, 'high'),
    G(11, 7990, -6, 40, 9, 'high'),
    G(12, 8600, 14, 30, 9, 'high'),
    G(13, 9210, 0, 12, 9, 'mid'),
    G(14, 9870, 0, 40, 9, 'high'),
    G(15, 10445, 0, 24, 9, 'mid'),
    G(16, 10940, 0, 44, 9, 'high'),
    G(17, 11575, 14, 14, 9, 'mid'),
    G(18, 12160, 10, 34, 9, 'high'),
    G(19, 12870, 0, 30, 9, 'high'),
    G(20, 13465, -10, 30, 9, 'high'),
    G(21, 14105, 0, 30, 9, 'high'),
    G(22, 14700, 10, 30, 9, 'high'),
    G(23, 15210, 0, 40, 9, 'high'),
    G(24, 15890, 0, 40, 9, 'high'),
    G(25, 16530, 0, 24, 9, 'mid'),
    G(26, 17155, 0, 44, 9, 'high'),
    G(27, 16915, 72, 7, 6, 'inside the PRISM VAULT', 'pocket2'),
    G(28, 18375, 0, 34, 9, 'high'),
    G(29, 18955, 0, 20, 9, 'mid'),
    G(30, 19565, 0, 10.5, 9, 'skimming low'),
    G(31, 20160, 10, 16, 9, 'mid'),
    G(32, 20875, 0, 30, 9, 'high'),
    G(33, 21410, 0, 12, 9, 'mid'),
    G(34, 22070, 0, 40, 9, 'high'),
    G(35, 22680, 0, 24, 9, 'mid'),
    G(36, 23270, 0, 44, 9, 'high'),
    G(37, 23880, 0, 34, 9, 'high'),
    G(38, 24460, 0, 34, 9, 'high'),
    G(39, 25170, 0, 20, 9, 'mid'),
    G(40, 25725, 0, 40, 9, 'high'),
    G(41, 26385, 0, 30, 9, 'high'),
    G(42, 26895, 0, 30, 9, 'high'),
    G(43, 27535, 0, 40, 9, 'high'),
    G(44, 28115, 0, 34, 9, 'high'),
    G(45, 28725, 0, 24, 9, 'mid'),
    G(46, 29205, 0, 44, 9, 'high'),
    G(47, 29960, 0, 34, 9, 'high'),
    G(48, 30555, 6, 34, 9, 'high'),
    G(49, 31165, 0, 20, 9, 'mid'),
    G(50, 31745, 0, 40, 9, 'high'),
  ],
  goal: { at: 33450, x: 0, height: 28, size: 13 }, // v1.9: 33,290 → 33,450 (Z moved to 38,491 with the steering raise; still ≈ 87 % of Z)
};

// ───────────────────────── v1.5 DRAGON WAR: 60 gates (the first mega-stage) ─────────────────────────
// Z = min(50,000, FULL corner 46,455) = 46,455 m (v1.5 §6; was 46,636). Regular gates run 5 % → 84 % of Z in number order (jumbo
// rings, size 9 — 270 m/s passes), each ≥ 45 m clear of every weave row and wild dragon, clear of the
// tilt sectors' run-in and of the loop doors' circles; the specials sit in their structures (gate 4 in
// the DRAGON ROOST, gate 9 on the Deep Forest's signature weave line, gate 15 in the WAR CHEST VAULT).
// The goal at 87 % of Z, ahead of the Sky Gate's key circle. (Authored with tools-side validation.)
GOALS.dragonwar = {
  gates: [
    G(1, 2335, 0, 10.5, 9, 'skimming low'),
    G(2, 3025, -8, 24, 9, 'mid'),
    G(3, 3600, 6, 40, 9, 'high'),
    G(4, 4405, -72, 7, 6, 'inside the DRAGON ROOST', 'pocket'),
    G(5, 4305, 0, 16, 9, 'mid'),
    G(6, 4860, 10, 34, 9, 'high'),
    G(7, 5600, -6, 44, 9, 'high'),
    G(8, 6285, 4, 20, 9, 'mid'),
    G(9, 10480, 8, 30, 5, 'through the SIGNATURE WEAVE (the Deep Forest)', 'signature'),
    G(10, 6940, -10, 30, 9, 'high'),
    G(11, 7410, 0, 12, 9, 'skimming low'),
    G(12, 8260, 8, 38, 9, 'high'),
    G(13, 8860, -4, 26, 9, 'mid'),
    G(14, 9600, 12, 44, 9, 'high'),
    G(15, 15305, 72, 7, 6, 'inside the WAR CHEST VAULT', 'pocket2'),
    G(16, 10285, 0, 10.5, 9, 'skimming low'),
    G(17, 10860, -8, 30, 9, 'high'),
    G(18, 11600, 6, 18, 9, 'mid'),
    G(19, 12150, 0, 36, 9, 'high'),
    G(20, 12850, 10, 10.5, 9, 'skimming low'),
    G(21, 13600, -6, 24, 9, 'mid'),
    G(22, 14150, 4, 40, 9, 'high'),
    G(23, 14845, -10, 16, 9, 'mid'),
    G(24, 15410, 0, 34, 9, 'high'),
    G(25, 16140, 8, 44, 9, 'high'),
    G(26, 16755, -4, 20, 9, 'mid'),
    G(27, 17410, 12, 30, 9, 'high'),
    G(28, 18110, 0, 12, 9, 'skimming low'),
    G(29, 18755, -8, 38, 9, 'high'),
    G(30, 19410, 6, 26, 9, 'mid'),
    G(31, 20085, 0, 44, 9, 'high'),
    G(32, 20740, 10, 10.5, 9, 'skimming low'),
    G(33, 21400, -6, 30, 9, 'high'),
    G(34, 22085, 4, 18, 9, 'mid'),
    G(35, 22730, -10, 36, 9, 'high'),
    G(36, 23405, 0, 10.5, 9, 'skimming low'),
    G(37, 24030, 8, 24, 9, 'mid'),
    G(38, 24670, -4, 40, 9, 'high'),
    G(39, 25345, 12, 16, 9, 'mid'),
    G(40, 25995, 0, 34, 9, 'high'),
    G(41, 26660, -8, 44, 9, 'high'),
    G(42, 27315, 6, 20, 9, 'mid'),
    G(43, 27985, 0, 30, 9, 'high'),
    G(44, 28630, 10, 12, 9, 'skimming low'),
    G(45, 29290, -6, 38, 9, 'high'),
    G(46, 29985, 4, 26, 9, 'mid'),
    G(47, 30625, -10, 44, 9, 'high'),
    G(48, 31265, 0, 10.5, 9, 'skimming low'),
    G(49, 31895, 8, 30, 9, 'high'),
    G(50, 32625, -4, 18, 9, 'mid'),
    G(51, 33260, 12, 36, 9, 'high'),
    G(52, 33895, 0, 10.5, 9, 'skimming low'),
    G(53, 34535, -8, 24, 9, 'mid'),
    G(54, 34860, 6, 40, 9, 'high'),
    G(55, 35885, 0, 16, 9, 'mid'),
    G(56, 36850, 6, 34, 9, 'high'),   // v1.5 §6: out of THE SHELTER's rock (was 36,525)
    G(57, 37260, -6, 44, 9, 'high'),
    G(58, 37885, 4, 20, 9, 'mid'),
    G(59, 38525, -10, 30, 9, 'high'),
    G(60, 39100, 0, 12, 9, 'skimming low'),
  ],
  goal: { at: 40560, x: 0, height: 28, size: 13 },
};

// ───────────────────────── v1.6 STAR FOX: 70 gates (the planet-hopping mega-stage) ─────────────────────────
// Z = min(70,000, FULL corner 69,570) = 69,570 m. Regular gates run 5 % → 84 % of Z in number order
// (jumbo rings, size 9 — 270 m/s passes): each ≥ 45 m clear of every weave row, wild flyer and mine,
// clear of the tilt sectors' run-in, the loop doors' circles, the caves, THE DROP's splash curtain and
// the interiors — except the one INSIDE THE GREAT PYRAMID (over its raised floor). Five underwater.
// The specials sit in their structures: gate 4 in the WATERFALL HIDEOUT, gate 9 behind the falls INSIDE
// THE WATERFALL CAVE (under its roof), gate 15 in the MINERS' CACHE, gate 50 in the BURIED TOMB and gate 70
// on the FORTRESS APPROACH. The goal at 88 % of Z — THE FORTRESS GATES. (Authored with tools-side validation.)
GOALS.starfox = {
  gates: [
    G(1, 3834, 0, 10.5, 9, 'skimming low'),
    G(2, 4338, -8, 24, 9, 'mid'),
    G(3, 5197, 6, 40, 9, 'high'),
    G(4, 4405, -72, 7, 6, 'inside the WATERFALL HIDEOUT', 'pocket'),
    G(5, 6055, 0, 16, 9, 'mid'),
    G(6, 6859, 10, 34, 9, 'high'),
    G(7, 7773, -6, 44, 9, 'high'),
    G(8, 8632, 4, 20, 9, 'mid'),
    G(9, 3970, -16, 5, 4, 'inside THE WATERFALL CAVE (behind the falls)', 'signature'), // (v1.9: the cave moved 3,660 → 3,900)
    G(10, 9420, -10, 30, 9, 'high'),
    G(11, 10349, 0, 12, 9, 'skimming low'),
    G(12, 11208, 8, 38, 9, 'high'),
    G(13, 12067, -4, 26, 9, 'mid'),
    G(14, 12860, 12, 44, 9, 'high'),
    G(15, 15305, 72, 7, 6, 'inside the MINERS\' CACHE', 'pocket2'),
    G(16, 13784, 0, 10.5, 9, 'skimming low'),
    G(17, 14643, -8, 24, 9, 'mid'),
    G(18, 15417, 6, 40, 9, 'high'),
    G(19, 16385, 0, 16, 9, 'mid'),
    G(20, 17219, 10, 34, 9, 'high'),
    G(21, 18088, -6, 44, 9, 'high'),
    G(22, 18857, 4, 20, 9, 'mid'),
    G(23, 19795, -10, 30, 9, 'high'),
    G(24, 20654, 0, 12, 9, 'skimming low'),
    G(25, 21418, 8, 38, 9, 'high'),
    G(26, 22372, -4, 26, 9, 'mid'),
    G(27, 23230, 12, 44, 9, 'high'),
    G(28, 24089, 0, 10.5, 9, 'skimming low'),
    G(29, 25028, -8, 24, 9, 'mid (underwater)'),
    G(30, 25792, 6, 40, 9, 'high (underwater)'),
    G(31, 26665, 0, 16, 9, 'mid (underwater)'),
    G(32, 27419, 10, 34, 9, 'high (underwater)'),
    G(33, 28383, -6, 44, 9, 'high (underwater)'),
    G(34, 29242, 4, 20, 9, 'mid'),
    G(35, 30100, -10, 30, 9, 'high'),
    G(36, 31029, 0, 12, 9, 'skimming low'),
    G(37, 31818, 8, 38, 9, 'high'),
    G(38, 32677, -4, 26, 9, 'mid'),
    G(39, 33600, 12, 44, 9, 'high'),
    G(40, 34394, 0, 10.5, 9, 'skimming low'),
    G(41, 35253, -8, 24, 9, 'mid'),
    G(42, 36112, 6, 40, 9, 'high'),
    G(43, 37025, 0, 16, 9, 'mid'),
    G(44, 37794, 10, 34, 9, 'high'),
    G(45, 38688, -6, 44, 9, 'high'),
    G(46, 39417, 4, 20, 9, 'mid'),
    G(47, 40400, -10, 30, 9, 'high'),
    G(48, 41264, 0, 12, 9, 'skimming low'),
    G(49, 42123, 8, 38, 9, 'high'),
    G(50, 45505, -72, 7, 6, 'inside the BURIED TOMB', 'pocket3'),
    G(51, 43027, -4, 26, 9, 'mid'),
    G(52, 44520, 0, 12, 9, 'inside THE GREAT PYRAMID'),
    G(53, 45304, 0, 10.5, 9, 'skimming low'),
    G(54, 45683, -8, 24, 9, 'mid'),
    G(55, 46397, 6, 40, 9, 'high'),
    G(56, 47275, 0, 16, 9, 'mid'),
    G(57, 48134, 10, 34, 9, 'high'),
    G(58, 49028, -6, 44, 9, 'high'),
    G(59, 49852, 4, 20, 9, 'mid'),
    G(60, 50710, -10, 30, 9, 'high'),
    G(61, 51684, 0, 12, 9, 'skimming low'),
    G(62, 52398, 8, 38, 9, 'high'),
    G(63, 53267, -4, 26, 9, 'mid'),
    G(64, 54145, 12, 44, 9, 'high'),
    G(65, 55029, 0, 10.5, 9, 'skimming low'),
    G(66, 55963, -8, 24, 9, 'mid'),
    G(67, 56702, 6, 40, 9, 'high'),
    G(68, 57600, 0, 16, 9, 'mid'),
    G(69, 58399, 10, 34, 9, 'high'),
    G(70, 60600, -4, 24, 9, 'on the FORTRESS APPROACH', 'approach'),
  ],
  goal: { at: 61000, x: 0, height: 28, size: 13 },
};

// ───────────────────────── v1.7 STAR WARS: 70 gates (the final mega-stage) ─────────────────────────
// Z = min(70,000, FULL corner 68,478) = 68,478 m. Regular gates run 5 % → 84 % of Z in number order
// (jumbo rings, size 9 — 270 m/s passes): each ≥ 45 m clear of every weave row, wild flyer and mine,
// clear of the tilt sectors' run-in, the loop doors' circles and the interiors — except the one INSIDE
// THE SHIELD BUNKER (over its raised floor). The specials sit in their structures: gate 26 in the HIDDEN
// HANGAR, gate 30 INSIDE THE ICE CAVE (the signature), gate 53 in the BUNKER CACHE, gate 64 in THE
// SMUGGLER'S MOON and gate 70 on the STATION APPROACH (the run to the gates; the trench lies beyond the
// goal, the victory lap). Every gate is numbered in distance order. The goal at 88 % of Z — THE STATION
// GATES. (Authored with tools-side validation.)
GOALS.starwars = {
  gates: [
    G(1, 3684, 0, 10.5, 9, 'skimming low'),
    G(2, 4289, -8, 24, 9, 'mid'),
    G(3, 5125, 6, 40, 9, 'high'),
    G(4, 5985, 0, 16, 9, 'mid'),
    G(5, 6805, 10, 34, 9, 'high'),
    G(6, 7681, -6, 44, 9, 'high'),
    G(7, 8526, 4, 20, 9, 'mid'),
    G(8, 9342, -10, 30, 9, 'high'),
    G(9, 10187, 0, 12, 9, 'skimming low'),
    G(10, 11032, 8, 38, 9, 'high'),
    G(11, 11853, -4, 26, 9, 'mid'),
    G(12, 12698, 12, 44, 9, 'high'),
    G(13, 13683, 0, 10.5, 9, 'skimming low'),
    G(14, 14399, -8, 24, 9, 'mid'),
    G(15, 15254, 6, 40, 9, 'high'),
    G(16, 16104, 0, 16, 9, 'mid'),
    G(17, 17025, 10, 34, 9, 'high'),
    G(18, 17795, -6, 44, 9, 'high'),
    G(19, 18640, 4, 20, 9, 'mid'),
    G(20, 19416, -10, 30, 9, 'high'),
    G(21, 20331, 0, 12, 9, 'skimming low'),
    G(22, 21177, 8, 38, 9, 'high'),
    G(23, 22022, -4, 26, 9, 'mid'),
    G(24, 22857, 12, 44, 9, 'high'),
    G(25, 23713, 0, 10.5, 9, 'skimming low'),
    G(26, 24405, -72, 7, 6, 'inside the HIDDEN HANGAR', 'pocket'),
    G(27, 24533, -8, 24, 9, 'mid'),
    G(28, 25403, 6, 40, 9, 'high'),
    G(29, 26009, 0, 16, 9, 'mid'),
    G(30, 26570, 0, 12, 9, 'inside THE ICE CAVE', 'signature'),
    G(31, 27354, 10, 34, 9, 'high'),
    G(32, 27894, -6, 44, 9, 'high'),
    G(33, 28795, 4, 20, 9, 'mid'),
    G(34, 29600, -10, 30, 9, 'high'),
    G(35, 30526, 0, 12, 9, 'skimming low'),
    G(36, 31321, 8, 38, 9, 'high'),
    G(37, 32166, -4, 26, 9, 'mid'),
    G(38, 33027, 12, 44, 9, 'high'),
    G(39, 33887, 0, 10.5, 9, 'skimming low'),
    G(40, 34702, -8, 24, 9, 'mid'),
    G(41, 35418, 6, 40, 9, 'high'),
    G(42, 36393, 0, 16, 9, 'mid'),
    G(43, 37238, 10, 34, 9, 'high'),
    G(44, 38089, -6, 44, 9, 'high'),
    G(45, 38859, 4, 20, 9, 'mid'),
    G(46, 39774, -10, 30, 9, 'high'),
    G(47, 40625, 0, 12, 9, 'skimming low'),
    G(48, 41460, 8, 38, 9, 'high'),
    G(49, 42291, -4, 26, 9, 'mid'),
    G(50, 43156, 12, 44, 9, 'high'),
    G(51, 43991, 0, 10.5, 9, 'skimming low'),
    G(52, 44847, -8, 24, 9, 'mid'),
    G(53, 45305, 72, 7, 6, 'inside the BUNKER CACHE', 'pocket2'),
    G(54, 45687, 6, 40, 9, 'high'),
    G(55, 46570, 0, 12, 9, 'inside THE SHIELD BUNKER'),
    G(56, 47383, 10, 34, 9, 'high'),
    G(57, 48193, -6, 44, 9, 'high'),
    G(58, 49033, 4, 20, 9, 'mid'),
    G(59, 49919, -10, 30, 9, 'high'),
    G(60, 50764, 0, 12, 9, 'skimming low'),
    G(61, 51684, 8, 38, 9, 'high'),
    G(62, 52400, -4, 26, 9, 'mid'),
    G(63, 53300, 12, 44, 9, 'high'),
    G(64, 53505, -72, 7, 6, 'inside THE SMUGGLER\'S MOON', 'pocket3'),
    G(65, 54146, 0, 10.5, 9, 'skimming low'),
    G(66, 55250, -8, 24, 9, 'mid'), // (2026-10-25: 66–69 re-spaced to the key-ring Z, 69,828 m)
    G(67, 56380, 6, 40, 9, 'high'),
    G(68, 57510, 0, 16, 9, 'mid'),
    G(69, 58640, 10, 34, 9, 'high'),
    G(70, 60600, -4, 24, 9, 'on the STATION APPROACH', 'approach'),
  ],
  goal: { at: 60900, x: 0, height: 28, size: 13 },
};

// ───────────────────────── v2.3 §2 THE UNREACHABLE GATES (owner playtest 2026-10-27) ─────────────────────────
// The route audit (gateroutes.js) found two gates whose container route could not be flown on the same run as a
// neighbour's. Each moves onto the main line near where it was; its id (the save's identity) is kept, and the
// container keeps its secret / stash, just not the gate.
//   Star Fox 50: was inside THE BURIED TOMB (45,505 m, x −72) — the tomb's portal (45,300 m) is 20 m after THE GREAT
//     PYRAMID's exit (45,280 m), so a flight leaving the pyramid (gate 52 inside it) can never line up for it.
//   Plains 5: was inside THE MUSHROOM GROTTO (1,175 m, x −72) — the grotto's span (portal 960 m → 1,460 m) swallows
//     ROCK TUNNEL #2 (1,030 → 1,130 m, gate 4 inside it): one flight can be in one or the other, never both.
export const MOVED_V23 = {
  starfox: { 50: { at: 45505, x: -6, height: 14, size: 9, note: 'mid, after THE GREAT PYRAMID (v2.3: out of the BURIED TOMB)' } },
  plains: { 5: { at: 1175, x: 0, height: 7, size: 5.5, note: 'skimming low (v2.3: out of the MUSHROOM GROTTO pocket)' } },
};
for (const [id, moves] of Object.entries(MOVED_V23)) {
  for (const [n, to] of Object.entries(moves)) {
    const g = GOALS[id].gates.find((x) => x.n === Number(n));
    Object.assign(g, to);
    delete g.special; // a main-line gate now
  }
}

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

// Save validation: known numbers only (1–the world's total; v1.1: 30 in Space + Jetstream), no duplicates, sorted; `complete` must be a real `true`
// with at least the v0.9 ten behind it (else it is dropped).
export function cleanGates(raw, total = GATE_COUNT) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((n) => Number.isInteger(n) && n >= 1 && n <= total))].sort((a, b) => a - b);
}
// v1.0: a v0.9 completion (gates 1–10) stays complete forever; anything less is dropped.
export const cleanComplete = (raw, gates) => raw === true && V09_GATES_DONE(gates);
const V09_GATES_DONE = (gates) => Array.from({ length: V09_GATES }, (_, i) => i + 1).every((n) => gates.includes(n));

// ───────────────────────── one flight ─────────────────────────
// run = what this flight knows: the gates already owned, the ones collected now, whether the goal
// is in the world, and whether the world was completed now.
export function createGoalRun(rec, total = GATE_COUNT) {
  const owned = gatesOf(rec);
  // v1.0: the goal is there at 20/20 (v1.1: at the world's own total) — or for a world already complete (a v0.9 star keeps its goal).
  return { total, owned: new Set(owned), fresh: [], open: owned.length >= total || isComplete(rec), completeBefore: isComplete(rec), completedNow: false };
}
export const goalVisible = (run) => run.open;

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
    if (run.owned.size >= run.total && !run.open) { run.open = true; out.push({ type: 'goalOpen' }); }
  }
  if (run.open && crossesRing(goals.goal, goalY, d0, x1, y1, d1)) {
    if (!run.completeBefore && !run.completedNow) { run.completedNow = true; out.push({ type: 'complete' }); }
    else out.push({ type: 'goalRepass' });
  }
  return out;
}

// Credit a flight's goal progress to the FLOWN WORLD's record: new gates join the collection;
// completing the world (first time only) adds the prize to its wallet.
export function applyGoals(rec, freshGates = [], completed = false, total = GATE_COUNT) {
  const gates = cleanGates([...gatesOf(rec), ...freshGates], total);
  const out = { ...rec };
  if (gates.length) out.gates = gates;
  if (completed && !isComplete(rec) && gates.length === total) { out.complete = true; out.coins = rec.coins + GOAL_PRIZE; }
  return out;
}

// Results lines (null when nothing happened).
export function goalLines(run) {
  return {
    gates: run.fresh.length ? `Goal gates +${run.fresh.length} (${run.owned.size}/${run.total})` : null,
    complete: run.completedNow ? `★ STAGE COMPLETE! +${GOAL_PRIZE}` : null,
  };
}

export const goalsFor = (stageId) => GOALS[stageId] ?? null;

// v2.3 SEQUENTIAL NUMBERS (owner playtest 2026-10-27: "make sure these rings are in sequential order"): the number a
// player SEES on a gate is its rank by distance — the first gate a flight meets is 1, the next 2, … Display only: the
// gate ids (`n`) stay the save's identity (stored gates[], SP1 codes, completion), so no profile is touched.
// gateRanks(goals) → Map(id → rank), a pure function of the stage's gate list (ties: the lower id first).
export function gateRanks(goals) {
  const order = [...(goals?.gates ?? [])].sort((a, b) => a.at - b.at || a.n - b.n);
  return new Map(order.map((g, i) => [g.n, i + 1]));
}
const RANKS = new Map();
export const gateRank = (stageId, n) => {
  if (!RANKS.has(stageId)) RANKS.set(stageId, gateRanks(GOALS[stageId]));
  return RANKS.get(stageId).get(n) ?? n;
};

// v2.3 §3 SEEING WHAT YOU MISSED: the stage's still-missing gates as their sequential numbers (ascending), read from
// a record's collected ids — and the one line the results and stage screens show. Up to MISSING_SHOWN numbers are
// listed; beyond that, the count and the first MISSING_SHOWN with "…".
export const MISSING_SHOWN = 8;
export function missingGates(stageId, rec) {
  const owned = new Set(gatesOf(rec));
  return (GOALS[stageId]?.gates ?? []).filter((g) => !owned.has(g.n)).map((g) => gateRank(stageId, g.n)).sort((a, b) => a - b);
}
export function missingLine(stageId, rec) {
  const m = missingGates(stageId, rec);
  if (!m.length) return 'ALL GATES!';
  return m.length <= MISSING_SHOWN ? `STILL TO GET: ${m.join(' · ')}` : `STILL TO GET (${m.length}): ${m.slice(0, MISSING_SHOWN).join(' · ')} …`;
}

// v1.2 THE FINAL FLOURISH: the flight that completes NEON VOID while every other world is already ★
// beats the game — once ever (the save's gameComplete flag; the stars stay the permanent record).
export const FINALE = 'neonvoid';
export const BEAT_LINE = '🏆 YOU BEAT SLINGSHOT PLANE! 🏆';
export const beatsTheGame = (before, after) =>
  !before.gameComplete && !isComplete(before.stages[FINALE]) && STAGE_ORDER.every((id) => isComplete(after.stages[id]));
// v1.1: each world's own gate total, read from its data (20; Space + Jetstream 30). Every displayed
// total and the goal's activation use this — never a fixed 20.
export const gateTotal = (stageId) => GOALS[stageId]?.gates.length ?? GATE_COUNT;
