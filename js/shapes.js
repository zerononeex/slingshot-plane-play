// v1.0 BOOST SHAPES (the owner's addition): chunky neon frames in five shapes — the SAME five in
// every world — that give an instant speed burst when you fly through the opening. Each one works
// once per flight (it dims, and respawns next flight); passing another within 6 s CHAINS (+2 m/s a
// step, up to × 4). Pure velocity: no save fields, no coins, nothing to do with gates or secrets.
// The scripted sim pilot ignores them. Pure data + maths (no DOM / three.js).

// boost = m/s added; aperture = the opening the plane must be inside (metres, before world scale):
//   circle r · square half · oval rx × ry (tall) · rectangle hw × hh (wide) · triangle side (equilateral,
//   point up; the tightest opening — still kid-fair). bound = the frame's outer radius (placement).
import { setPiecesFor } from './longrun.js';

export const SHAPES = {
  circle:    { label: 'CIRCLE', boost: 6, r: 4.2, bound: 4.8 },
  square:    { label: 'SQUARE', boost: 7, half: 3.6, bound: 5.4 },
  oval:      { label: 'OVAL', boost: 7, rx: 3, ry: 4.8, bound: 5.3 },
  rectangle: { label: 'RECTANGLE', boost: 8, hw: 5.5, hh: 2.4, bound: 6.4 },
  triangle:  { label: 'TRIANGLE', boost: 9, side: 8.4, bound: 5.6 },
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

// The boost for a pass at time t (and the chain step it makes): base + 2 per chain step, capped at × 4.
export function chainedBoost(run, kind, t) {
  run.chain = t - run.lastT <= CHAIN_WINDOW ? Math.min(CHAIN_CAP, run.chain + 1) : 1;
  run.lastT = t;
  return SHAPES[kind].boost + CHAIN_STEP * (run.chain - 1);
}

// Step: returns events { type: 'boost', index, kind, gain, chain }. Only the plane itself, flying.
export function stepShapeRun(run, shapes, ys, d0, x1, y1, d1, t, flying, scale = 1, out = []) {
  if (!flying || !shapes) return out;
  if (t - run.lastT > CHAIN_WINDOW) run.chain = 0; // the chain resets after 6 s without a shape
  for (let i = 0; i < shapes.length; i++) {
    const sh = shapes[i];
    if (run.used.has(i) || !crossesShape(sh, ys[i], d0, x1, y1, d1, scale)) continue;
    run.used.add(i);
    const gain = chainedBoost(run, sh.kind, t);
    out.push({ type: 'boost', index: i, kind: sh.kind, gain, chain: run.chain });
  }
  return out;
}

// World scale: Jetstream's frames are bigger (140 m/s passes).
export const shapeScale = (stageId) => (stageId === 'jetstream' ? 1.6 : 1);
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
// v1.1 FAIRNESS RULE: the two goal-approach frames follow the relocated goal.
const APPROACH_V11 = { plains: [{ at: 1630, x: 0, height: 22 }, { at: 1685, x: -6, height: 26 }], canyon: [{ at: 2490, x: 0, height: 22 }, { at: 2565, x: 0, height: 22 }], city: [{ at: 3370, x: -12, height: 22 }, { at: 3445, x: 0, height: 22 }], snow: [{ at: 4270, x: 0, height: 22 }, { at: 4325, x: 0, height: 22 }], desert: [{ at: 5130, x: 0, height: 22 }, { at: 5205, x: -6, height: 22 }], ocean: [{ at: 6010, x: 0, height: 22 }, { at: 6085, x: 0, height: 22 }], space: [{ at: 8650, x: 0, height: 22 }, { at: 8725, x: 0, height: 22 }], jetstream: [{ at: 14865, x: 0, height: 28 }, { at: 14940, x: 0, height: 28 }] };
for (const [id, list] of Object.entries(APPROACH_V11)) SHAPE_SPOTS[id].filter((s) => s.note === 'goal approach').forEach((s, i) => Object.assign(s, list[i]));
// v1.1 LONG STAGES: the long runs' set-piece shapes join each world's list (same rules, same chain).
for (const id of Object.keys(SHAPE_SPOTS)) {
  const extra = setPiecesFor(id).filter((p) => p.kind === 'shape').map((p) => S(p.d, p.x, p.y, p.shape, 'long run'));
  SHAPE_SPOTS[id] = [...SHAPE_SPOTS[id], ...extra].sort((a, b) => a.at - b.at);
}
export const shapesFor = (stageId) => SHAPE_SPOTS[stageId] ?? null;
