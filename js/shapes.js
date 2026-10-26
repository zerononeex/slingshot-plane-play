// v1.0 BOOST SHAPES (the owner's addition): chunky neon frames in five shapes — the SAME five in
// every world — that give an instant speed burst when you fly through the opening. Each one works
// once per flight (it dims, and respawns next flight); passing another within 6 s CHAINS (+2 m/s a
// step, up to × 4). Pure velocity: no save fields, no coins, nothing to do with gates or secrets.
// The scripted sim pilot ignores them. Pure data + maths (no DOM / three.js).

// boost = m/s added; aperture = the opening the plane must be inside (metres, before world scale):
//   circle r · square half · oval rx × ry (tall) · rectangle hw × hh (wide) · triangle side (equilateral,
//   point up; the tightest opening — still kid-fair). bound = the frame's outer radius (placement).
// v1.9 BOOSTS SCALE: the gain = max(the flat boost, round(pct × the flown plane's CURRENT top-speed cap)) —
// flat wins at low caps (Plains is exactly as before), the percentage at endgame speeds.
import { setPiecesFor } from './longrun.js';

export const SHAPES = {
  circle:    { label: 'CIRCLE', boost: 6, pct: 0.04, r: 4.2, bound: 4.8 },
  square:    { label: 'SQUARE', boost: 7, pct: 0.045, half: 3.6, bound: 5.4 },
  oval:      { label: 'OVAL', boost: 7, pct: 0.045, rx: 3, ry: 4.8, bound: 5.3 },
  rectangle: { label: 'RECTANGLE', boost: 8, pct: 0.05, hw: 5.5, hh: 2.4, bound: 6.4 },
  triangle:  { label: 'TRIANGLE', boost: 9, pct: 0.06, side: 8.4, bound: 5.6 },
};
export const SHAPE_IDS = Object.keys(SHAPES);
export const CHAIN_WINDOW = 6;   // s
export const CHAIN_STEP = 2;     // m/s per chain step
export const CHAIN_CAP = 4;      // × 4 at most

// Is the point (dx, dy) — relative to the frame's centre, in world metres — inside the opening?
export function inAperture(kind, dx, dy, scale = 1) {
  const s = SHAPES[kind], x = dx / scale, y = dy / scale;
  if (kind === 'circle') return Math.hypot(x, y) < s.r;
  if (kind === 'square') return Math.abs(x) < s.half && Math.abs(y) < s.half;
  if (kind === 'oval') return (x / s.rx) ** 2 + (y / s.ry) ** 2 < 1;
  if (kind === 'rectangle') return Math.abs(x) < s.hw && Math.abs(y) < s.hh;
  // triangle: equilateral, point up, centred on its centroid
  const h = (s.side * Math.sqrt(3)) / 2, top = (2 * h) / 3, base = -h / 3;
  if (y < base || y > top) return false;
  return Math.abs(x) < ((top - y) / h) * (s.side / 2);
}

// Crossing the frame's plane (between d0 and d1) inside the opening.
export const crossesShape = (sh, cy, d0, x1, y1, d1, scale = 1) => d0 < sh.at && d1 >= sh.at && inAperture(sh.kind, x1 - sh.x, y1 - cy, scale);

// One flight's state: which frames are used up, and the running chain.
export const createShapeRun = () => ({ used: new Set(), chain: 0, lastT: -Infinity });

// v1.9 a shape's base gain for a plane whose current top-speed cap is `cap` m/s.
export const shapeGain = (kind, cap = 0) => Math.max(SHAPES[kind].boost, Math.round(SHAPES[kind].pct * cap));

// The boost for a pass at time t (and the chain step it makes): base + 2 per chain step, capped at × 4.
// v2.2 abilities (the flight params): SHAPE CHARGE gain × 1.5 (shapeGainMul); SHAPE HUNTER window 10 s, cap × 6.
export function chainedBoost(run, kind, t, cap = 0, ab = {}) {
  run.chain = t - run.lastT <= (ab.chainWindow ?? CHAIN_WINDOW) ? Math.min(ab.chainCap ?? CHAIN_CAP, run.chain + 1) : 1;
  run.lastT = t;
  const gain = shapeGain(kind, cap) + CHAIN_STEP * (run.chain - 1);
  return ab.shapeGainMul ? Math.round(gain * ab.shapeGainMul) : gain;
}

// Step: returns events { type: 'boost', index, kind, gain, chain }. Only the plane itself, flying.
export function stepShapeRun(run, shapes, ys, d0, x1, y1, d1, t, flying, scale = 1, out = [], cap = 0, ab = {}) {
  if (!flying || !shapes) return out;
  if (t - run.lastT > (ab.chainWindow ?? CHAIN_WINDOW)) run.chain = 0; // the chain resets after 6 s without a shape
  for (let i = 0; i < shapes.length; i++) {
    const sh = shapes[i];
    if (run.used.has(i) || !crossesShape(sh, ys[i], d0, x1, y1, d1, scale)) continue;
    run.used.add(i);
    const gain = chainedBoost(run, sh.kind, t, cap, ab);
    out.push({ type: 'boost', index: i, kind: sh.kind, gain, chain: run.chain });
  }
  return out;
}

// World scale: Jetstream's frames are bigger (140 m/s passes).
export const shapeScale = (stageId) => (stageId === 'jetstream' || stageId === 'neonvoid' || stageId === 'dragonwar' || stageId === 'starfox' || stageId === 'starwars' ? 1.6 : 1); // the fast worlds
// Centre height (absolute y): `height` metres above the floor there.
export const shapeY = (terrain, sh) => terrain.surfaceAt(sh.x, sh.at, -Infinity) + sh.height;

// ───────────────────────── placement (absolute distances; authored + validated) ─────────────────────────
// { at, x, height, kind, note }: four on the open fast lines, one inside EACH pocket, two on the
// goal approach. 8 per world, all five shapes in every world. Table in BALANCE.md.
const S = (at, x, height, kind, note) => ({ at, x, height, kind, note });
export const SHAPE_SPOTS = {};
SHAPE_SPOTS.plains = [
  S(450, 6, 12, 'circle', 'open fast line'),
  S(1145, -72, 6.2, 'triangle', 'inside MUSHROOM GROTTO'),
  S(1170, 0, 12, 'square', 'open fast line'),
  S(1875, 10, 12, 'oval', 'open fast line'),
  S(2565, 72, 7, 'rectangle', 'inside SUNFLOWER MAZE'),
  S(2580, 0, 12, 'rectangle', 'open fast line'),
  S(3240, 12, 22, 'circle', 'goal approach'),
  S(3360, 0, 22, 'square', 'goal approach'),
];
SHAPE_SPOTS.canyon = [
  S(515, 0, 12, 'circle', 'open fast line'),
  S(1185, -10, 12, 'square', 'open fast line'),
  S(1415, 72, 6.2, 'triangle', 'inside HIDDEN CANYON'),
  S(1975, 0, 12, 'oval', 'open fast line'),
  S(2655, 72, 7, 'rectangle', 'inside OLD GOLD MINE'),
  S(2720, 0, 12, 'rectangle', 'open fast line'),
  S(3465, 0, 22, 'circle', 'goal approach'),
  S(3545, 0, 22, 'square', 'goal approach'),
];
SHAPE_SPOTS.city = [
  S(630, 0, 12, 'circle', 'open fast line'),
  S(1450, -10, 12, 'square', 'open fast line'),
  S(2335, -72, 6.2, 'triangle', 'inside ROOFTOP GARDEN'),
  S(2380, 0, 12, 'oval', 'open fast line'),
  S(2440, 72, 7, 'rectangle', 'inside NEON ALLEY'),
  S(3320, 0, 12, 'rectangle', 'open fast line'),
  S(4225, 12, 22, 'circle', 'goal approach'),
  S(4285, 0, 22, 'square', 'goal approach'),
];
SHAPE_SPOTS.snow = [
  S(745, 0, 12, 'circle', 'open fast line'),
  S(1825, 10, 12, 'square', 'open fast line'),
  S(2345, 72, 6.2, 'triangle', 'inside AURORA CAVE'),
  S(3025, 0, 12, 'oval', 'open fast line'),
  S(3675, -72, 7, 'rectangle', 'inside CRYSTAL GLACIER'),
  S(4040, 0, 12, 'rectangle', 'open fast line'),
  S(5235, 0, 22, 'circle', 'goal approach'),
  S(5295, 0, 22, 'square', 'goal approach'),
];
SHAPE_SPOTS.desert = [
  S(915, -10, 12, 'circle', 'open fast line'),
  S(2240, 0, 12, 'square', 'open fast line'),
  S(3215, 72, 6.2, 'triangle', 'inside LOST OASIS'),
  S(3530, 0, 12, 'oval', 'open fast line'),
  S(4360, 72, 7, 'rectangle', 'inside SANDSTONE TEMPLE'),
  S(4840, 0, 12, 'rectangle', 'open fast line'),
  S(6310, 0, 22, 'circle', 'goal approach'),
  S(6390, 0, 22, 'square', 'goal approach'),
];
SHAPE_SPOTS.ocean = [
  S(1035, 10, 12, 'circle', 'open fast line'),
  S(2625, 0, 12, 'square', 'open fast line'),
  S(4145, 0, 12, 'oval', 'open fast line'),
  S(5195, 72, 7, 'rectangle', 'inside SHIPWRECK BAY'),
  S(5205, -72, 6.2, 'triangle', 'inside CORAL COVE'),
  S(5675, 0, 12, 'rectangle', 'open fast line'),
  S(7435, 12, 22, 'circle', 'goal approach'),
  S(7515, 0, 22, 'square', 'goal approach'),
];
SHAPE_SPOTS.space = [
  S(1215, 6, 12, 'circle', 'open fast line'),
  S(3000, 0, 12, 'square', 'open fast line'),
  S(4890, 0, 12, 'oval', 'open fast line'),
  S(5105, 72, 6.2, 'triangle', 'inside NEBULA POCKET'),
  S(5695, -72, 7, 'rectangle', 'inside COMET TRAIL'),
  S(6675, 0, 12, 'rectangle', 'open fast line'),
  S(8730, 0, 22, 'circle', 'goal approach'),
  S(8810, 0, 22, 'square', 'goal approach'),
];
SHAPE_SPOTS.jetstream = [
  S(2085, 0, 12, 'circle', 'open fast line'),
  S(5130, 10, 12, 'square', 'open fast line'),
  S(8190, -10, 12, 'oval', 'open fast line'),
  S(8345, -72, 9.6, 'triangle', 'inside EYE OF THE STORM'),
  S(8450, 72, 10.8, 'rectangle', 'inside RAINBOW BRIDGE'),
  S(11380, 0, 12, 'rectangle', 'open fast line'),
  S(14875, 0, 28, 'circle', 'goal approach'),
  S(14955, 0, 28, 'square', 'goal approach'),
];
// v1.3 new worlds: one in each pocket + two on the goal approach; their long-run frames come from the set pieces.
SHAPE_SPOTS.volcano = [
  S(205, -72, 6.6, 'triangle', 'inside LAVA TUBE'),
  S(1065, 72, 7.4, 'rectangle', 'inside MAGMA VAULT'),
  S(10410, 0, 22, 'circle', 'goal approach'),
  S(10485, 0, 22, 'square', 'goal approach'),
];
SHAPE_SPOTS.jungle = [
  S(225, -72, 6.6, 'triangle', 'inside TEMPLE RUINS'),
  S(1235, 72, 7.4, 'rectangle', 'inside PARROT HOLLOW'),
  S(12170, 0, 22, 'circle', 'goal approach'),
  S(12245, 0, 22, 'square', 'goal approach'),
];
SHAPE_SPOTS.skyislands = [
  S(265, 72, 6.6, 'triangle', 'inside WATERFALL GROTTO'),
  S(1485, -72, 7.4, 'rectangle', 'inside RAINBOW ROOF'),
  S(13940, 0, 22, 'circle', 'goal approach'),
  S(14005, 0, 22, 'square', 'goal approach'),
];
// v1.2 Neon Void: one in each pocket and two on the goal approach; its ten long-run frames (mostly
// triangles + rectangles, on the fast lines) come from the long-run set pieces below.
SHAPE_SPOTS.neonvoid = [
  S(265, -72, 10, 'triangle', 'inside THE GRID CORE'),
  S(725, 72, 11.2, 'rectangle', 'inside PRISM VAULT'),
  S(33300, 0, 28, 'triangle', 'goal approach'), // (v1.9: the goal moved 33,290 → 33,450; was 33,140)
  S(33375, 0, 28, 'rectangle', 'goal approach'), // (was 33,215)
];
// v1.5 Dragon War: one in each pocket and two on the goal approach; its eight long-run frames (the high
// lines) come from the long-run set pieces below — twelve in all.
SHAPE_SPOTS.dragonwar = [
  S(265, -72, 10, 'triangle', 'inside DRAGON ROOST'),
  S(1265, 72, 11.2, 'rectangle', 'inside WAR CHEST VAULT'),
  S(40450, 0, 28, 'triangle', 'goal approach'),
  S(40505, 0, 28, 'rectangle', 'goal approach'),
];
// v1.6 Star Fox: one in each of its THREE pockets and two on the approach to the Fortress Gates (the goal);
// its eight long-run frames (the high lines) come from the long-run set pieces below — thirteen in all.
SHAPE_SPOTS.starfox = [
  S(265, -72, 10, 'triangle', 'inside the WATERFALL HIDEOUT'),
  S(1265, 72, 11.2, 'rectangle', 'inside the MINERS\' CACHE'),
  S(1385, -72, 10, 'oval', 'inside the BURIED TOMB'),
  S(60890, 0, 28, 'triangle', 'goal approach'),
  S(60945, 0, 28, 'rectangle', 'goal approach'),
];
// v1.7 Star Wars: one in each of its THREE pockets and two on the approach to the Station Gates (the goal);
// its eight long-run frames (the high lines) come from the long-run set pieces below — thirteen in all.
SHAPE_SPOTS.starwars = [
  S(265, -72, 10, 'triangle', 'inside the HIDDEN HANGAR'),
  S(1265, 72, 11.2, 'rectangle', 'inside the BUNKER CACHE'),
  S(1385, -72, 10, 'oval', 'inside THE SMUGGLER\'S MOON'),
  S(60790, 0, 28, 'triangle', 'goal approach'),
  S(60845, 0, 28, 'rectangle', 'goal approach'),
];
// v1.1 FAIRNESS RULE: the two goal-approach frames follow the relocated goal.
const APPROACH_V11 = { plains: [{ at: 1630, x: 0, height: 22 }, { at: 1685, x: -6, height: 26 }], canyon: [{ at: 2490, x: 0, height: 22 }, { at: 2565, x: 0, height: 22 }], city: [{ at: 3370, x: -12, height: 22 }, { at: 3445, x: 0, height: 22 }], snow: [{ at: 4270, x: 0, height: 22 }, { at: 4325, x: 0, height: 22 }], desert: [{ at: 5130, x: 0, height: 22 }, { at: 5205, x: -6, height: 22 }], ocean: [{ at: 6010, x: 0, height: 22 }, { at: 6085, x: 0, height: 22 }], space: [{ at: 8650, x: 0, height: 22 }, { at: 8725, x: 0, height: 22 }], jetstream: [{ at: 14865, x: 0, height: 28 }, { at: 14940, x: 0, height: 28 }] };
for (const [id, list] of Object.entries(APPROACH_V11)) SHAPE_SPOTS[id].filter((s) => s.note === 'goal approach').forEach((s, i) => Object.assign(s, list[i]));
// v1.1 LONG STAGES: the long runs' set-piece shapes join each world's list (same rules, same chain).
for (const id of Object.keys(SHAPE_SPOTS)) {
  const extra = setPiecesFor(id).filter((p) => p.kind === 'shape').map((p) => S(p.d, p.x, p.y, p.shape, 'long run'));
  SHAPE_SPOTS[id] = [...SHAPE_SPOTS[id], ...extra].sort((a, b) => a.at - b.at);
}
// v2.2 MORE BOOST SHAPES (owner 2026-10-25: "add more boost shapes throughout the stages"): ≈ + 50 % in every stage,
// spread early → late over the completion zone on each stage's own racing / detour lines (x, height as its open-line
// frames). Authored with tools-side validation: placementProblem, clear of the pockets' passages and their audit
// lanes, the key-ring runways + Loop Door doorways, tilt sectors, interiors, caves, rows, wild flyers, shooters,
// Neon Void's walls / lasers, the goal gates and every other frame; inside Z. [at, x, height, kind]
const MORE_SHAPES_V22 = {
  plains: [[342, 6, 12, 'circle'], [636, 0, 14, 'square'], [1050, 0, 12, 'oval'], [1344, 10, 12, 'rectangle'], [1498, 6, 12, 'triangle']],
  canyon: [[418, 0, 12, 'circle'], [954, -12, 14, 'square'], [1490, -10, 12, 'oval'], [2046, 0, 12, 'rectangle'], [2222, 0, 14, 'triangle']],
  city: [[497, 0, 12, 'circle'], [1100, -12, 14, 'square'], [1673, -10, 12, 'oval'], [2247, 0, 14, 'rectangle'], [2820, 12, 14, 'triangle'], [3243, 0, 12, 'circle']],
  snow: [[628, 0, 12, 'circle'], [1365, 10, 12, 'square'], [2082, 0, 14, 'oval'], [2808, 12, 14, 'rectangle'], [3525, 0, 12, 'triangle'], [4112, 0, 14, 'circle']],
  desert: [[689, 0, 14, 'circle'], [1466, -10, 12, 'square'], [2163, 0, 14, 'oval'], [2940, 0, 12, 'rectangle'], [3677, 0, 14, 'triangle'], [4434, 0, 12, 'circle'], [4981, -8, 14, 'square']],
  ocean: [[850, 0, 14, 'circle'], [1710, 10, 12, 'square'], [2550, -8, 14, 'oval'], [3430, -6, 14, 'rectangle'], [4290, 0, 12, 'triangle'], [5120, 12, 14, 'circle'], [5830, 0, 12, 'square']],
  space: [[1078, -12, 14, 'circle'], [2063, 6, 12, 'square'], [3079, 0, 14, 'oval'], [3994, 6, 14, 'rectangle'], [4820, 0, 12, 'triangle'], [5846, 0, 14, 'circle'], [6811, 0, 12, 'square'], [7767, 0, 14, 'oval'], [8482, 0, 14, 'rectangle']],
  jetstream: [[1753, 0, 14, 'circle'], [3235, 0, 14, 'square'], [4647, 0, 12, 'oval'], [6119, 6, 14, 'rectangle'], [7651, 10, 12, 'triangle'], [9123, 0, 14, 'circle'], [10585, 0, 14, 'square'], [11977, -10, 12, 'oval'], [13539, 0, 14, 'rectangle'], [14641, 0, 14, 'triangle']],
  volcano: [[2080, 0, 14, 'circle'], [4590, 0, 14, 'square'], [7170, 0, 14, 'oval'], [9720, 0, 14, 'rectangle']],
  jungle: [[2044, 0, 14, 'circle'], [4452, 0, 14, 'square'], [6860, -8, 14, 'oval'], [9268, -8, 26, 'rectangle'], [11676, -12, 14, 'triangle']],
  skyislands: [[2336, -12, 14, 'circle'], [4988, 0, 14, 'square'], [7840, 0, 14, 'oval'], [10522, 0, 14, 'rectangle'], [13344, 0, 14, 'triangle']],
  neonvoid: [[4680, 6, 14, 'triangle'], [9416, 0, 14, 'rectangle'], [14072, 0, 14, 'circle'], [18917, 0, 14, 'triangle'], [23613, 0, 14, 'rectangle'], [28358, 0, 14, 'oval'], [33094, 0, 14, 'square']],
  dragonwar: [[6135, 6, 46, 'circle'], [12815, 0, 50, 'square'], [19556, 6, 44, 'oval'], [26256, 0, 48, 'rectangle'], [33027, -6, 46, 'triangle'], [39657, 0, 50, 'circle']],
  starfox: [[8500, 0, 46, 'circle'], [17120, -6, 50, 'square'], [24770, 0, 44, 'oval'], [34300, 0, 48, 'rectangle'], [42940, -6, 46, 'triangle'], [51500, 0, 50, 'circle'], [60300, 0, 44, 'square']],
  starwars: [[8435, 0, 46, 'circle'], [17120, -6, 50, 'square'], [25625, 6, 44, 'oval'], [34221, 0, 48, 'rectangle'], [42776, -6, 46, 'triangle'], [51361, 0, 50, 'circle'], [59696, -6, 44, 'square']],
};
for (const [id, list] of Object.entries(MORE_SHAPES_V22)) SHAPE_SPOTS[id] = [...SHAPE_SPOTS[id], ...list.map(([at, x, h, kind]) => S(at, x, h, kind, 'more shapes'))].sort((a, b) => a.at - b.at);
export const shapesFor = (stageId) => SHAPE_SPOTS[stageId] ?? null;
