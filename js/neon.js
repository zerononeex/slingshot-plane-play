// v1.2 NEON VOID — the physics layer of the 40,000 m authored run, at ABSOLUTE distances (not per
// lap): neon BARRIER WALLS (one fly-through gap each; you can't overfly them), LASER SLALOMS (rows of
// posts — the posts bonk, the beams between them are light), SLIDING WALLS (late in the run only: the
// gap glides side to side on a fixed clock, so the same flight always meets the same wall) and the
// SLIPSTREAM lanes (a strong forward push — the tailwind mechanic, in a box). Everything is a bonk at
// worst: nothing is one-hit. Authored offline, validated against the terrain (BALANCE.md "Neon Void").
// Pure data + maths (no DOM / three.js).
import { STAGES } from './stages.js';
import { shiftOutOfPockets } from './pockets.js';

export const NEON_RUN = 40000;
export const WALL_HALF = 32;      // walls span the corridor (±26) with a margin; pocket lanes (±72) pass
export const WALL_TOP = 80;       // above the 60 m ceiling: no flying over
export const WALL_DEPTH = 2;
export const POST_R = 0.5;
export const POST_GAP = 16;       // laser posts are 16 m apart; rows alternate by 8 m, leaving straight lines at x = 4 + 8k
export const LANE_PUSH = 10;      // m/s² forward inside a slipstream (never past the boost cap, like a tailwind)…
export const LANE_MIN = 50;       // …and only for a plane flying at least this fast (a slow plane drops out of the stream)

// Gap centre x of a wall at time t (sliders glide; walls stand still).
export const gapX = (o, t = 0) => (o.amp ? o.x + o.amp * Math.sin((2 * Math.PI * t) / o.period + o.phase) : o.x);

// The run, per stage id (only Neon Void has one).
const RUNS = {};

function build(data, stage = null) {
  // v1.9 POCKET AUDIT: walls / sliders / laser rows standing in a pocket's entry or exit lane move
  // forward, just past it (with what follows them), so a pocket never drops you straight into one.
  if (stage) {
    const tagged = [...data.walls.map((v) => ({ d: v[0], v, k: 'walls', r: 2 })), ...data.sliders.map((v) => ({ d: v[0], v, k: 'sliders', r: 2 })), ...data.lasers.map((v) => ({ d: v[0], v, k: 'lasers', r: 2 }))];
    const moved = shiftOutOfPockets(tagged, stage, stage.cycle);
    data = { ...data, walls: [], sliders: [], lasers: [] };
    for (const m of moved) data[m.k].push([m.d, ...m.v.slice(1)]);
  }
  const walls = data.walls.map(([d, x, y, w, h]) => ({ kind: 'wall', d, x, y, w, h }));
  const sliders = data.sliders.map(([d, x, y, w, h, amp, period, phase]) => ({ kind: 'slider', d, x, y, w, h, amp, period, phase }));
  const lasers = data.lasers.map(([d, offset]) => {
    const posts = [];
    for (let px = offset - POST_GAP * 3; px <= WALL_HALF; px += POST_GAP) if (px >= -WALL_HALF) posts.push({ kind: 'laserPost', d, x: px, r: POST_R });
    return { kind: 'laser', d, offset, posts };
  });
  const lanes = data.lanes.map(([d0, d1, x, y, w, h]) => ({ d0, d1, x, y, w, h, x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2 }));
  const obstacles = [...walls, ...sliders, ...lasers].sort((a, b) => a.d - b.d);
  // 50 m buckets so a step only looks at what is near.
  const B = 50, buckets = new Map(), laneBuckets = new Map();
  for (const o of obstacles) { const k = Math.floor(o.d / B); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(o); }
  for (const l of lanes) for (let k = Math.floor(l.d0 / B); k <= Math.floor(l.d1 / B); k++) { if (!laneBuckets.has(k)) laneBuckets.set(k, []); laneBuckets.get(k).push(l); }

  // The obstacle hit at (x, y, d) at time t, or null. `span` = the plane's half-width (wings), like the
  // slots. Walls and sliders answer like an arch (they carry the gap as w / cx / y0abs / h, so a bonk
  // pushes straight back and coins slide into the gap).
  function hit(x, y, d, radius = 0.6, span = radius, t = 0) {
    if (d > NEON_RUN + 10 || y > WALL_TOP + radius) return null;
    const k = Math.floor(d / B);
    for (let kk = k - 1; kk <= k + 1; kk++) {
      const list = buckets.get(kk);
      if (list) for (const o of list) {
        if (o.kind === 'laser') {
          if (Math.abs(d - o.d) > POST_R + radius) continue;
          for (const p of o.posts) if (Math.abs(x - p.x) < POST_R + span) return p;
          continue;
        }
        if (Math.abs(d - o.d) > WALL_DEPTH / 2 + radius || Math.abs(x) > WALL_HALF + radius) continue;
        const cx = gapX(o, t);
        if (Math.abs(x - cx) < o.w / 2 - span && Math.abs(y - o.y) < o.h / 2 - radius) continue; // through the gap
        o.cx = cx; o.y0abs = o.y - o.h / 2;
        return o;
      }
    }
    return null;
  }

  // The slipstream lane at a point, or null.
  function laneAt(x, y, d) {
    const list = laneBuckets.get(Math.floor(d / B));
    if (list) for (const l of list) if (d >= l.d0 && d <= l.d1 && x >= l.x0 && x <= l.x1 && y >= l.y0 && y <= l.y1) return l;
    return null;
  }

  // The next obstacle's opening within `reach` metres ahead: { d, x, y } (a slider's gap where it
  // will be when you get there at `speed`; a laser row's nearest gap to x). For the scripted pilot.
  function openingAhead(x, d, reach, t = 0, speed = 30) {
    for (let k = Math.floor(d / B); k <= Math.floor((d + reach) / B); k++) {
      const list = buckets.get(k);
      if (list) for (const o of list) {
        if (o.d <= d + 1 || o.d > d + reach) continue;
        if (o.kind === 'laser') { // the nearest straight line through the slalom (x = 4 + 8k)
          const q = POST_GAP / 2;
          return { d: o.d, x: Math.max(-20, Math.min(20, Math.round((x - q / 2) / q) * q + q / 2)), y: null };
        }
        return { d: o.d, x: gapX(o, t + (o.d - d) / Math.max(speed, 5)), y: o.y };
      }
    }
    return null;
  }
  return { walls, sliders, lasers, lanes, obstacles, hit, laneAt, openingAhead };
}

export function neonRunFor(stageId) {
  if (!(stageId in NEON_DATA)) return null;
  return (RUNS[stageId] ??= build(NEON_DATA[stageId], STAGES[stageId]));
}

// ───────────────────────── the authored run (absolute metres) ─────────────────────────
// walls:   [d, gapX, gapY, gapW, gapH]       (gap centre height above 0; the floor is ~0–6 m)
// sliders: [d, gapX, gapY, gapW, gapH, amp, period s, phase]
// lasers:  [d, offset]                       (offset 0 or 8: posts at offset + k·16 m across the corridor)
// lanes:   [d0, d1, x, y, w, h]              (a box: centre x / y, width, height; push = LANE_PUSH). The last
//          one ends by 32,000 m: from there every plane glides out on its own (the FULL corner).
const NEON_DATA = {
  neonvoid: {
    walls: [
      [940,0,34,18,16], [1685,-8,30,18,16], [1825,-2,44,18,16], [4540,-4,22,18,16], [4775,7,40,18,16], [5660,-10,42,18,16], [5800,-4,36,18,16], [6040,6,44,18,16],
      [6265,-4,34,18,16], [7365,-8,36,18,16], [7660,5,46,18,16], [7800,-1,40,18,16], [8040,-12,46,18,16], [9660,4,22,18,16], [9800,-2,34,18,16], [12500,-6,30,16,14],
      [12775,0,36,16,14], [13660,-8,46,16,14], [13800,-2,40,16,14], [13980,6,46,16,14], [14230,-5,48,16,14], [14470,6,24,16,14], [15365,-4,42,16,14], [15660,9,44,16,14],
      [15800,3,46,16,14], [16040,-8,34,16,14], [17660,-6,36,16,14], [17800,0,22,16,14], [17980,0,40,16,14], [20500,4,42,16,14], [20775,-4,44,16,14], [21660,10,34,16,14],
      [21800,4,46,16,14], [21980,-4,30,16,14], [22230,6,36,16,14], [22470,-5,46,16,14], [23365,-8,48,16,14], [23660,5,22,16,14], [23800,-1,34,16,14], [24040,-12,40,16,14],
      [25660,4,44,16,14], [25800,-2,46,16,14], [25980,-4,34,16,14], [28230,-8,22,16,14], [29365,8,40,16,14], [30470,10,36,16,14], [31660,6,46,16,14], [31800,0,42,16,14],
      [32775,-6,48,16,14], [32915,0,44,16,14], [35660,4,30,16,14], [36040,-4,36,16,14], [37900,0,40,16,14], [38775,8,44,16,14], [38915,2,46,16,14], [39660,-12,34,16,14],
      [39800,-6,46,16,14],
    ],
    sliders: [
      [26470,0,40,20,18,8,6,4.8], [27365,0,40,20,18,8,7,6.1], [27660,0,40,20,18,8,5,1.12], [28040,0,40,20,18,8,6,2.42], [29660,0,40,20,18,8,6,0.04],
      [30060,0,40,20,18,8,5,2.64], [31365,0,40,20,18,8,5,0.26], [33900,0,40,20,18,8,6,5.46], [34055,0,40,20,18,8,7,0.48], [34230,0,40,20,18,8,5,1.78],
      [35365,0,40,20,18,8,6,3.08], [36230,0,40,20,18,8,6,0.7], [37365,0,40,20,18,8,5,3.3], [38055,0,40,20,18,8,5,0.92], [39950,0,40,20,18,8,5,4.82],
    ],
    lasers: [
      [2230,0], [2275,8], [2320,0], [2775,8], [2820,0], [2865,8], [3660,0], [3705,8], [3750,0], [4230,8],
      [4275,0], [4320,8], [6775,8], [6820,0], [6865,8], [8265,8], [8310,0], [8355,8], [10230,8], [10275,0],
      [10320,8], [10775,0], [10820,8], [10865,0], [11660,8], [11705,0], [11750,8], [12230,0], [12275,8], [12320,0],
      [14775,8], [14820,0], [14865,8], [16230,8], [16275,0], [16320,8], [18230,0], [18275,8], [18320,0], [18775,8],
      [18820,0], [18865,8], [19660,0], [19705,8], [19750,0], [20230,8], [20275,0], [20320,8], [22775,0], [22820,8],
      [22865,0], [24230,0], [24275,8], [24320,0], [26230,8], [26275,0], [26320,8], [29815,8], [29860,0], [29905,8],
      [30230,8], [30275,0], [30320,8], [33660,0], [33705,8], [33750,0], [36775,0], [36820,8], [36865,0], [37660,0],
      [37705,8], [37750,0],
    ],
    lanes: [
      [100,620,0,52,20,18], [984,1504,0,52,20,18], [1865,2190,-14,30,14,14], [2360,2735,0,52,20,18], [2905,3425,14,16,14,12], [3790,4190,0,52,20,18],
      [4360,4500,0,52,20,18], [4584,4735,0,52,20,18], [4819,5339,-14,30,14,14], [5840,6000,0,52,20,18], [6084,6225,14,16,14,12], [6309,6735,0,52,20,18],
      [6905,7325,0,52,20,18], [7409,7620,0,52,20,18], [7840,8000,-14,30,14,14], [8084,8225,0,52,20,18], [8395,8915,14,16,14,12], [9840,10190,0,52,20,18],
      [10360,10735,0,52,20,18], [10905,11425,0,52,20,18], [11790,12190,-14,30,14,14], [12544,12735,0,52,20,18], [12819,13339,14,16,14,12], [14024,14190,0,52,20,18],
      [14274,14430,0,52,20,18], [14514,14735,0,52,20,18], [14905,15325,-14,30,14,14], [15409,15620,0,52,20,18], [15840,16000,14,16,14,12], [16360,16880,0,52,20,18],
      [18024,18190,0,52,20,18], [18360,18735,0,52,20,18], [18905,19425,-14,30,14,14], [19790,20190,0,52,20,18], [20544,20735,14,16,14,12], [20819,21339,0,52,20,18],
      [22024,22190,0,52,20,18], [22274,22430,0,52,20,18], [22514,22735,-14,30,14,14], [22905,23325,0,52,20,18], [23409,23620,14,16,14,12], [23840,24000,0,52,20,18],
      [24360,24880,0,52,20,18], [26024,26190,0,52,20,18], [26514,27034,-14,30,14,14], [27409,27620,0,52,20,18], [27704,28000,14,16,14,12], [28274,28794,0,52,20,18],
      [29409,29620,0,52,20,18], [30514,31034,0,52,20,18], [31409,31620,-14,30,14,14],
    ],
  },
};
