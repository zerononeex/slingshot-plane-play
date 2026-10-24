// Pure coin logic: per-flight coin patterns (R1), cave trails, secret stashes (R4),
// magnet pull and pickup. The WORLD is fixed; only the coin patterns shuffle per flight.
import { MAGNET_PULL_SPEED } from './config.js';
import { rng } from './rng.js';
import { setPiecesFor, setPieceCoins } from './longrun.js';
import { loopCircleCoins } from './loopdoors.js';

export { rng };

const overlaps = (a0, a1, b0, b1) => a0 <= b1 && b0 <= a1;

// What is in segment k (local, first-lap coordinates), so specials only appear
// where their feature is, and plain patterns stay clear of side features.
function segmentContext(stage, terrain, k) {
  const L = stage.patterns.segment;
  const d0 = terrain.local(k * L), d1 = d0 + L;
  const off = k * L - d0;
  const inSeg = (d) => d >= d0 && d < d1;
  const zones = stage.zones.filter((z) => overlaps(d0, d1, z.from - 20, z.to + 20));
  const midKind = stage.water ? terrain.surfaceKind(-16, k * L + L / 2) : 'ground';
  return {
    d0, d1, off,
    leftBusy: zones.some((z) => z.side === 'left') || stage.bigHills.some((b) => b.x < -8 && b.shape !== 'island' && overlaps(d0, d1, b.d - b.rd, b.d + b.rd)),
    rightBusy: zones.some((z) => z.side === 'right'),
    slalomTrees: terrain.columns.filter((c) => c.kind === 'tree' && c.slalom && !c.hero && inSeg(c.d) && c.d > d0 + 5 && c.d < d1 - 5),
    ditch: stage.ditches.find((t) => t.d > d0 + 20 && t.d < d1 - 15) ?? null,
    arches: terrain.arches.filter((a) => inSeg(a.d)),
    updrafts: stage.updrafts.filter((u) => u.d > d0 + 30 && u.d < d1),
    rings: terrain.rings.filter((r) => inSeg(r.d)),
    rooftops: terrain.blocks.filter((b) => b.kind === 'rooftop' && b.d0 >= d0 && b.d1 < d1),
    tailwind: stage.tailwinds.find((t) => overlaps(d0 + 10, d1 - 10, t.d0, t.d1)) ?? null,
    mound: stage.mounds.find((m) => m.d > d0 + 22 && m.d < d1 - 22) ?? null,
    devil: stage.devils.find((v) => v.d > d0 + 12 && v.d < d1 - 6) ?? null,
    pond: stage.pits.find((p) => p.pond && p.d > d0 + 25 && p.d < d1 - 20) ?? null,
    crater: stage.pits.find((p) => p.crater && p.d > d0 + 25 && p.d < d1 - 20) ?? null,
    water: !!stage.water && midKind === 'water' && zones.some((z) => z.kind === 'lowSwoop'),
    island: stage.bigHills.find((b) => b.shape === 'island' && Math.abs(b.x) < 10 && b.d > d0 + 10 && b.d < d1 - 10) ?? null,
    gates: (terrain.gates ?? []).filter((g) => inSeg(g.d)),
    cloudBridge: (terrain.bridges ?? []).find((b) => b.kind === 'cloud' && b.d > d0 + 25 && b.d < d1 - 25) ?? null,
  };
}

// Which context entry each special needs.
const SPECIAL_NEEDS = {
  treeWeave: (c) => c.slalomTrees.length > 0, ditchDip: (c) => !!c.ditch,
  archLine: (c) => c.arches.length > 0, updraftCatch: (c) => c.updrafts.length > 0,
  ringLine: (c) => c.rings.length > 0, rooftopSkim: (c) => c.rooftops.length > 0,
  gustRider: (c) => !!c.tailwind, driftDip: (c) => !!c.mound,
  devilRider: (c) => !!c.devil, oasisDip: (c) => !!c.pond,
  waterSkim: (c) => c.water, islandHop: (c) => !!c.island,
  starRingLine: (c) => c.rings.length > 0, craterDip: (c) => !!c.crater,
  gateLine: (c) => c.gates.length > 0, cloudDive: (c) => !!c.cloudBridge,
};

// A per-flight pattern sequence: seeded, never the same twice in a row,
// gentle openers, trickier patterns weigh in further out.
export function makePatternPicker(stage, terrain, seed) {
  const P = stage.patterns;
  const r = rng(seed);
  const seq = [];
  function weight(name, k, ctx) {
    if (SPECIAL_NEEDS[name]) return SPECIAL_NEEDS[name](ctx) ? 20 : 0;
    if (P.gentle.includes(name)) return Math.max(0.6, 3 - k * 0.25);
    return Math.min(3, 0.4 + k * 0.3);
  }
  function pick(k) {
    while (seq.length <= k) {
      const i = seq.length;
      const ctx = segmentContext(stage, terrain, i);
      const prev = seq[i - 1];
      const names = i < 2 ? P.gentle : P.pool;
      const opts = names.filter((n) => n !== prev).map((n) => [n, weight(n, i, ctx)]).filter(([, w]) => w > 0);
      const total = opts.reduce((a, [, w]) => a + w, 0);
      let roll = r() * total;
      let chosen = opts[opts.length - 1][0];
      for (const [n, w] of opts) { if ((roll -= w) <= 0) { chosen = n; break; } }
      seq.push(chosen);
    }
    return seq[k];
  }
  return { pick, seq, rand: r };
}

// The stage specials: each builds its coins around its feature in the segment.
// `rel` = height above the floor at that spot (resolved after).
function specialCoins(name, ctx, add, n) {
  const o = ctx.off;
  switch (name) {
    case 'treeWeave':
      // Thread the trunks: pass each trunk on the opposite side, with a coin in each gap.
      for (const tr of ctx.slalomTrees) {
        const mx = 2 * tr.mid - tr.x; // mirror across the slalom middle
        add(mx, 0, tr.d + o - 2, 4); add(mx, 0, tr.d + o + 2, 4); add(tr.mid, 0, tr.d + o + 12.5, 4);
      }
      return;
    case 'ditchDip':
      for (let i = 0; i < n; i++) add(0, 0, ctx.ditch.d + o - (n - 1) * 2.5 + i * 5, 2.2, true);
      return;
    case 'archLine':
      for (const a of ctx.arches) for (let i = 0; i < 9; i++) add(a.cx, a.y0abs + a.h / 2, a.d + o - 12 + i * 3);
      return;
    case 'updraftCatch': {
      const u = ctx.updrafts[0];
      for (let i = 0; i < n; i++) { const t = i / (n - 1); add(u.x * t, 0, u.d + o - 45 + 45 * t, 6 + 20 * t * t); }
      return;
    }
    case 'ringLine':
    case 'starRingLine':
      for (const r of ctx.rings) for (const dd of [-6, 0, 6]) add(r.x, r.y, r.d + o + dd);
      return;
    case 'craterDip': {
      // Dive into the crater and out again (follows the floor, over the rim).
      const p = ctx.crater;
      for (let i = 0; i < n; i++) add(p.x, 0, p.d + o - 22.5 + i * 5, 2.2, true);
      return;
    }
    case 'rooftopSkim':
      for (const b of ctx.rooftops.slice(0, 2)) for (let i = 0; i < 5; i++) add((b.x0 + b.x1) / 2, 0, b.d0 + o + 2 + i * (b.d1 - b.d0 - 4) / 4, 2.5);
      return;
    case 'gustRider': {
      const t = ctx.tailwind;
      const from = Math.max(t.d0, ctx.d0 + 5);
      for (let i = 0; i < n; i++) add((t.x0 + t.x1) / 2, 0, from + o + i * 5, 8);
      return;
    }
    case 'driftDip': {
      const m = ctx.mound;
      for (let i = 0; i < n; i++) add(m.x, 0, m.d + o - 22.5 + i * 5, 2.2, true);
      return;
    }
    case 'devilRider': {
      const v = ctx.devil;
      for (let i = 0; i < n; i++) { const a = i * 0.9; add(v.x + 3 * Math.cos(a), 0, v.d + o - 12 + i * 1.8, 4 + i * 1.2); }
      return;
    }
    case 'oasisDip': {
      const p = ctx.pond;
      for (let i = 0; i < n; i++) add(p.x, 0, p.d + o - 25 + i * 5, 2.2, true);
      return;
    }
    case 'waterSkim':
      for (let i = 0; i < n; i++) add(-16, 0, ctx.d0 + o + 15 + i * 5, 1.8, true);
      return;
    case 'islandHop': {
      const isl = ctx.island;
      for (let i = 0; i < n; i++) { const t = i / (n - 1); add(isl.x, 0, isl.d + o - isl.rd + t * isl.rd * 2, 2.5 + 8 * Math.sin(Math.PI * t)); }
      return;
    }
    case 'gateLine':
      // Through the middle of every speed gate in the segment (the GATE LINE trio is three in a row).
      for (const g of ctx.gates) for (const dd of [-8, -4, 0, 4, 8]) add(g.x, 0, g.d + o + dd, g.h * 0.45);
      return;
    case 'cloudDive': {
      // Dive under a cloud bridge and climb back out.
      const b = ctx.cloudBridge;
      for (let i = 0; i < n; i++) { const t = i / (n - 1); add(0, 0, b.d + o - 25 + 50 * t, b.under * 0.45 + 10 * (2 * t - 1) ** 2); }
      return;
    }
    default:
  }
}

// Coins for one ~80 m segment. Never buried: at least 2.5 m over the ground top
// (dips follow the floor at a fixed height), and always under tunnel roofs.
export function patternCoins(stage, terrain, k, name, r) {
  const L = stage.patterns.segment;
  const n = stage.patterns.coinsEach;
  const ctx = segmentContext(stage, terrain, k);
  let cx = k === 0 ? 0 : (r() * 2 - 1) * 16;
  if (ctx.leftBusy) cx = Math.max(cx, -6);  // keep the side features clear
  if (ctx.rightBusy) cx = Math.min(cx, 6);
  const base = k === 0 ? 6 : 6 + r() * 12;
  const start = k === 0 ? 14 : k * L + 8 + r() * 18;
  const out = [];
  const add = (x, y, d, rel = null, dip = false) => out.push({ x, y, d, rel, dip });
  if (SPECIAL_NEEDS[name]) {
    if (SPECIAL_NEEDS[name](ctx)) specialCoins(name, ctx, add, n);
    if (out.length === 0) name = 'line';
  }
  for (let i = 0; i < n && !SPECIAL_NEEDS[name]; i++) {
    const t = i / (n - 1);
    const d = start + i * 5;
    switch (name) {
      case 'highArc': add(cx, base + 9 * Math.sin(Math.PI * t), d); break;
      case 'slalom': add(Math.max(-20, Math.min(20, cx + 7 * Math.sin(2 * Math.PI * t))), base, d); break;
      case 'dive': add(cx, base + 10 - 12 * t, d); break;
      case 'stairs': add(cx, base + Math.floor(t * 3.99) * 3, d); break;
      case 'wave': add(cx, base + 4 * Math.sin(3 * Math.PI * t), d); break;
      case 'fork':
        if (i < 4) add(cx, base, start + i * 5);
        else { const side = i % 2 ? 1 : -1; const j = Math.floor((i - 4) / 2) + 1; add(cx + side * 2.5 * j, base, start + (3 + j) * 6); }
        break;
      case 'ring': {
        if (i < 2) add(cx, base, start + i * 5);
        else { const a = ((i - 2) / (n - 2)) * Math.PI * 2; add(cx + 2.2 * Math.cos(a), base + 2.2 * Math.sin(a), start + 14); }
        break;
      }
      default: add(cx, base, d); // line
    }
  }
  for (const c of out) {
    const floor = terrain.groundAt(c.x, c.d);
    const top = terrain.groundAt(c.x, c.d, Infinity);
    if (c.dip) c.y = floor + c.rel;
    else if (c.rel !== null) c.y = Math.max(floor + c.rel, top + 2.5);
    else c.y = Math.max(c.y, top + 2.5);
    c.y = Math.min(c.y, terrain.ceilingAt(c.x, c.d) - 1.5);
    delete c.rel; delete c.dip;
  }
  // Never inside rock: a coin in an arch slides into its opening; one inside a column is dropped.
  return out.filter((c) => {
    const hit = terrain.hitTest(c.x, c.y, c.d, 0.6);
    if (!hit) return true;
    if (hit.w) { c.x = hit.cx; c.y = hit.y0abs + hit.h / 2; return true; }
    return false;
  });
}

// A secret's `y` is its height above the floor there.
export const secretY = (terrain, s) => terrain.groundAt(s.x, s.d) + s.y;

// Fixed coins that belong to the world: cave trails every lap, secret stashes in lap 1.
export function featureCoins(stage, terrain, lap) {
  const out = [];
  const off = lap * terrain.cycle;
  if (stage.caveTrails) {
    for (const c of stage.caverns) {
      const x = (c.laneMin + c.laneMax) / 2;
      for (let i = 0; i < 15; i++) {
        const d = c.mouth - 6 + i * ((c.exit - c.mouth + 12) / 14);
        out.push({ x, y: 3.5 + Math.sin(i * 0.7) * 1.2, d: d + off });
      }
    }
  }
  // Coin rivers: 60+ coins in a flowing S-curve, every lap.
  for (const rv of stage.coinRivers ?? []) {
    const n = Math.max(60, Math.round(rv.len / 4));
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), d = rv.d + t * rv.len;
      const x = rv.x + rv.amp * Math.sin(t * Math.PI * 3);
      out.push({ x, y: Math.max(rv.y, terrain.groundAt(x, d, Infinity) + 3) + 2 * Math.sin(t * Math.PI * 5), d: d + off });
    }
  }
  // v1.5 LOOP DOORS: the loop circle of coins that marks the move (absolute: lap 0 only).
  if (lap === 0 && terrain.mega) for (const door of terrain.mega.doors) for (const c of loopCircleCoins(door)) out.push(c);
  // SLOTS: the 10-coin TOKEN right behind each slot (paid by a tilted pass, not by pickup) + a coin line.
  for (const sl of terrain.slots ?? []) {
    const y = sl.base + Math.min(sl.h - 1.5, 5);
    out.push({ x: sl.x, y, d: sl.d + 3 + off, token: `${lap}:${sl.id}`, big: true });
    for (let i = 0; i < 6; i++) out.push({ x: sl.x, y, d: sl.d + 7 + i * 3 + off });
  }
  // SUB-AREAS: two rich patterns chained down the pocket lane + the BONUS STASH (25) at the end.
  for (const p of terrain.pockets ?? []) {
    const len = p.end - p.start - 40;
    for (let i = 0; i < 24; i++) { // a wave…
      const t = i / 23, d = p.start + 10 + t * len * 0.5;
      out.push({ x: p.cx + 4 * Math.sin(t * Math.PI * 4), y: terrain.groundAt(p.cx, d, Infinity) + 4 + 2 * Math.sin(t * Math.PI * 2), d: d + off });
    }
    for (let i = 0; i < 24; i++) { // …then a zig-zag
      const t = i / 23, d = p.start + 15 + len * 0.5 + t * len * 0.5;
      out.push({ x: p.cx + (Math.floor(i / 4) % 2 ? 4 : -4), y: terrain.groundAt(p.cx, d, Infinity) + 5, d: d + off });
    }
    const y = p.stashBase + p.stash.y;
    for (let i = 0; i < 25; i++) {
      const a = (i / 25) * Math.PI * 2, ring = 0.6 + (i % 3) * 0.6;
      out.push({ x: p.stash.x + Math.cos(a) * ring, y: y + Math.sin(a * 2) * 0.5 + (i % 4) * 0.4, d: p.stash.d + Math.sin(a) * ring + off, stash: `${lap}:${p.index}` });
    }
  }
  // The asteroid ring tunnel: a coin line down the safe middle of the tube.
  if (stage.tube) for (let d = stage.tube.d0 + 2; d <= stage.tube.d1; d += 4) out.push({ x: stage.tube.x, y: terrain.groundAt(stage.tube.x, d) + stage.tube.y, d: d + off });
  // Slalom courses: a coin line threading every gate.
  for (const c of terrain.courses ?? []) for (const g of c.gates) for (const dd of [-3, 0, 3]) out.push({ x: g.x, y: g.base + g.h * 0.45, d: g.d + dd + off });
  // Threaded coins past the floating asteroids (the other side of the slalom, same height).
  for (const a of terrain.asteroids) {
    if (a.hero || a.tube) continue;
    const x = 2 * a.mid - a.x;
    out.push({ x, y: terrain.groundAt(x, a.d, Infinity) + a.y, d: a.d + off });
  }
  // Threaded coins through every non-tree slalom (pillars, cacti, pier posts).
  for (const c of terrain.columns) {
    if (!c.slalom || c.hero || c.kind === 'tree') continue;
    const x = 2 * c.mid - c.x;
    out.push({ x, y: terrain.groundAt(x, c.d, Infinity) + 3, d: c.d + off });
  }
  if (lap === 0) {
    // v1.1 LONG STAGES: the long run's coin arcs, coin rings and hoop lines (absolute distances, once).
    for (const c of setPieceCoins(setPiecesFor(stage.id), (x, d) => terrain.surfaceAt(x, d, -Infinity))) out.push(c);
    for (const s of stage.secrets) {
      const y = secretY(terrain, s);
      for (let i = 0; i < s.coins; i++) {
        const a = (i / s.coins) * Math.PI * 2;
        const ring = i % 2 ? 1.6 : 0.8;
        out.push({ x: s.x + Math.cos(a) * ring, y: y + Math.sin(a * 2) * 0.6 + (i % 3) * 0.5, d: s.d + Math.sin(a) * ring, secret: s.id });
      }
    }
  }
  return out;
}

// Move + collect coins for one step. Magnet: coins inside `magnetRadius` fly to the plane.
// Returns how many were collected this step and how many are being pulled.
export function stepCoins(coins, pos, dt, { magnetRadius = 0, pickupRadius = 2.4, speed = 0 } = {}) {
  let collected = 0, pulled = 0;
  const reach = Math.max(magnetRadius, pickupRadius);
  for (const c of coins) {
    if (!c.alive || c.token || Math.abs(c.d - pos.d) > reach + 1) continue;
    const dx = pos.x - c.x, dy = pos.y - c.y, dd = pos.d - c.d;
    const dist = Math.hypot(dx, dy, dd);
    if (dist <= pickupRadius) { c.alive = false; collected++; continue; }
    if (dist <= magnetRadius) {
      const step = Math.min(dist, (MAGNET_PULL_SPEED + speed) * dt);
      c.x += (dx / dist) * step; c.y += (dy / dist) * step; c.d += (dd / dist) * step;
      if (!c.pulled) { c.pulled = true; pulled++; }
      if (dist - step <= pickupRadius) { c.alive = false; collected++; }
    }
  }
  return { collected, pulled };
}

// SUB-AREA BONUS STASH: reaching it scoops all 25 at once (per flight, per lap; not a secret).
export const STASH_RADIUS = 4;
export function reachStashes(terrain, coins, pos, reached) {
  const found = [];
  const lap = Math.floor(pos.d / terrain.cycle), dl = terrain.local(pos.d);
  for (const p of terrain.pockets ?? []) {
    const id = `${lap}:${p.index}`;
    if (reached.has(id) || Math.abs(dl - p.stash.d) > STASH_RADIUS) continue;
    if (Math.hypot(pos.x - p.stash.x, pos.y - (p.stashBase + p.stash.y), dl - p.stash.d) > STASH_RADIUS) continue;
    reached.add(id);
    let got = 0;
    for (const c of coins) if (c.alive && c.stash === id) { c.alive = false; got++; }
    found.push({ id, coins: got, name: p.name });
  }
  return found;
}

// R4: secrets reached this step (by the plane or the parachuting pilot).
// Reaching a stash scoops up all of its coins at once.
export function reachSecrets(stage, terrain, coins, pos, reached) {
  const found = [];
  for (const s of stage.secrets) {
    if (reached.has(s.id) || Math.abs(pos.d - s.d) > s.radius) continue; // v1.0: each secret at its own distance (5 is far out)
    if (Math.hypot(pos.x - s.x, pos.y - secretY(terrain, s), pos.d - s.d) > s.radius) continue;
    reached.add(s.id);
    let got = 0;
    for (const c of coins) if (c.alive && c.secret === s.id) { c.alive = false; got++; }
    found.push({ id: s.id, coins: got });
  }
  return found;
}
