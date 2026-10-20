// Pure terrain for a stage: one height function shared by the renderer and the
// physics, plus tunnel roofs, solid obstacles (columns, arches), gimmick zones
// (updrafts, tailwinds, gusts, dust devils), rings and water.
//
// groundAt(x, d, y): ground height under (x, d). `y` matters only inside tunnels:
// below the roof you stand on the tunnel floor, above it on the top. Leave y out
// (or -Infinity) for the floor; pass +Infinity for the top surface.
import { LAUNCH, WORLD } from './config.js';
import { STAGES, DEFAULT_STAGE } from './stages.js';
import { rng } from './rng.js';
import { columnCap, fillSceneryChunk, newSceneryChunk } from './scenery.js';

export const DECK = { start: -8, end: 1.5, halfWidth: 2.2 };

const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const bump = (t) => (t >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * t)); // 1 at 0 → 0 at 1

// Building blocks for the city: generated once per stage (deterministic).
function cityBlocks(stage) {
  const B = stage.blocks;
  if (!B) return [];
  const r = rng(B.seed);
  const out = [...B.fixed.map((b) => ({ ...b }))];
  // Keep generated blocks off the landmarks and out of the through-building's footprint.
  const clear = (x0, x1, d0, d1) =>
    !out.some((b) => b.x0 < x1 + 1 && x0 < b.x1 + 1 && b.d0 < d1 + 4 && d0 < b.d1 + 4) &&
    !stage.caverns.some((c) => {
      const cx0 = c.laneMax < 0 ? -46 : c.edge - 1, cx1 = c.laneMax < 0 ? c.edge + 1 : 46;
      return cx0 < x1 && x0 < cx1 && c.start - 60 < d1 && d0 < c.end + 6; // + a clear run-in to the tunnel mouth
    });
  const strip = (sign, x0, x1, from, to, len, gap, hMin, hMax, kind) => {
    for (let d = from; d + len <= to; d += len + gap) {
      const ax0 = sign > 0 ? x0 : -x1, ax1 = sign > 0 ? x1 : -x0;
      if (clear(ax0, ax1, d, d + len)) out.push({ x0: ax0, x1: ax1, d0: d, d1: d + len, h: hMin + r() * (hMax - hMin), kind });
    }
  };
  for (const s of [-1, 1]) strip(s, B.edge.x0, B.edge.x1, 0, stage.cycle, B.edge.len, B.edge.gap, B.edge.hMin, B.edge.hMax, 'edge');
  for (const band of B.bands) strip(band.side === 'left' ? -1 : 1, band.x0, band.x1, band.from, band.to, band.len, band.gap, band.hMin, band.hMax, band.kind);
  return out;
}

export function makeTerrain(stage = STAGES[DEFAULT_STAGE], { deckHeight = LAUNCH.deckHeight, deckExtra = 0 } = {}) {
  const cycle = stage.cycle;
  const G = stage.ground;
  const deckStart = DECK.start - deckExtra;
  const local = (d) => (d >= cycle ? d % cycle : d);
  const waterLevel = stage.water ? stage.water.level : null;

  // Solid columns (trees, pillars, cacti, towers, posts, lighthouse).
  const columns = [];
  for (const set of stage.columnSets) {
    let i = 0;
    for (let d = set.from; d <= set.to; d += set.step, i++) {
      const mid = (set.xs[0] + set.xs[1]) / 2; // the slalom's middle line
      if (set.hero && Math.abs(d - set.hero.d) < set.step / 2) columns.push({ kind: set.kind, x: set.hero.x, d: set.hero.d, r: set.hero.r, h: set.hero.h, hero: true, slalom: true, mid });
      else columns.push({ kind: set.kind, x: set.xs[i % set.xs.length], d, r: set.r, h: set.h, hero: false, slalom: true, mid });
    }
  }
  for (const c of stage.columns) columns.push({ hero: false, slalom: false, ...c });
  columns.forEach((c, i) => { c.id = i; });

  // Floating asteroids (spheres): y = centre height above the ground under them.
  const asteroids = [];
  for (const set of stage.asteroidSets) {
    let i = 0;
    const mid = (set.xs[0] + set.xs[1]) / 2;
    for (let d = set.from; d <= set.to; d += set.step, i++) {
      if (set.hero && Math.abs(d - set.hero.d) < set.step) { if (!asteroids.some((a) => a.hero && a.set === set)) asteroids.push({ ...set.hero, hero: true, set, mid }); continue; }
      asteroids.push({ x: set.xs[i % set.xs.length], d, y: set.ys[i % set.ys.length], r: set.r, hero: false, set, mid });
    }
  }
  for (const a of stage.asteroids) asteroids.push({ hero: false, ...a });

  const blocks = cityBlocks(stage);
  const blockBuckets = new Map();
  for (const b of blocks) for (let k = Math.floor(b.d0 / 50); k <= Math.floor(b.d1 / 50); k++) {
    if (!blockBuckets.has(k)) blockBuckets.set(k, []);
    blockBuckets.get(k).push(b);
  }

  function baseGround(x, d) {
    const ramp = smooth((d - stage.flatStart) / 100);
    const ax = Math.abs(x);
    const edgeFade = smooth((150 - ax) / 30); // fade out at the world's side edges
    let g = 0;
    if (G.style === 'rolling' || G.style === 'canyon' || G.style === 'snow') {
      const n =
        0.5 * Math.sin(d * 0.021 + 1.3) * Math.cos(x * 0.045) +
        0.3 * Math.sin(d * 0.0063 + x * 0.031) +
        0.2 * Math.sin(d * 0.047 - x * 0.07 + 2.1);
      const amp = G.center + (G.side - G.center) * smooth((ax - 10) / 30);
      g = ramp * amp * (0.5 + 0.5 * n) * edgeFade;
      if (G.style === 'snow') g += ramp * G.peaks * smooth((ax - 34) / 14) * (0.65 + 0.35 * Math.sin(d * 0.013 + x * 0.05)) * edgeFade;
    } else if (G.style === 'dunes') {
      const n = 0.6 * Math.sin(d * 0.011 + 0.8 * Math.sin(x * 0.035)) + 0.4 * Math.sin(d * 0.0045 - x * 0.02 + 1.7);
      const amp = G.center + (G.side - G.center) * smooth((ax - 10) / 30);
      g = ramp * amp * (0.5 + 0.5 * n) * edgeFade;
    }
    if (stage.edgeWalls) g += stage.edgeWalls.height * smooth((ax - stage.edgeWalls.at) / 5) * (0.85 + 0.15 * Math.sin(d * 0.05 + x)) * edgeFade; // cliff / tower walls
    return g;
  }

  function cavernAt(x, dl) {
    for (const c of stage.caverns) {
      if (dl < c.start - 40 || dl > c.end + 40) continue;
      const left = c.laneMax < 0;
      let h;
      if (c.shape === 'block') h = smooth((dl - c.start + 1) / 1.5) * smooth((c.end + 1 - dl) / 1.5);
      else if (c.shape === 'pyramid') { const mid = (c.start + c.end) / 2, half = (c.end - c.start) / 2; h = Math.max(0, 1 - Math.abs(dl - mid) / half); }
      else h = dl < c.mouth ? smooth((dl - c.start) / (c.mouth - c.start)) : dl <= c.exit ? 1 : smooth((c.end - dl) / (c.end - c.exit));
      const zone = smooth((dl - (c.start - 40)) / 40) * smooth((c.end + 40 - dl) / 40) * smooth(((left ? -x : x) - 4) / 6);
      const inAlcove = c.alcove && dl >= c.alcove.from && dl <= c.alcove.to;
      const laneMin = inAlcove && c.alcove.laneMin !== undefined ? c.alcove.laneMin : c.laneMin;
      const laneMax = inAlcove && c.alcove.laneMax !== undefined ? c.alcove.laneMax : c.laneMax;
      const inLane = x >= laneMin - (left ? 1 : 0) && x <= laneMax + (left ? 0 : 1) && dl >= c.start - 2 && dl <= c.end + 2;
      let edge;
      if (c.shape === 'block') edge = left ? smooth((c.edge - x) / 1.5) * smooth((x + 46) / 2) : smooth((x - c.edge) / 1.5) * smooth((46 - x) / 2);
      else if (c.shape === 'pyramid') {
        const xc = (c.laneMin + c.laneMax) / 2, hx = Math.abs(c.edge - xc);
        const mid = (c.start + c.end) / 2, half = (c.end - c.start) / 2;
        const p = Math.max(0, 1 - Math.max(Math.abs(dl - mid) / half, Math.abs(x - xc) / hx));
        return { c, zone, inLane, hill: c.height * p, top: c.height * h };
      } else edge = left ? smooth((c.edge - x) / 4) * smooth((x + 95) / 30) : smooth((x - c.edge) / 4) * smooth((95 - x) / 30);
      return { c, zone, inLane, hill: c.height * h * edge, top: c.height * h };
    }
    return null;
  }

  function featuresAt(x, d, y) {
    const dl = local(d);
    let g = baseGround(x, d);
    const cav = cavernAt(x, dl);
    if (cav) {
      g *= 1 - cav.zone;
      if (cav.inLane) {
        const roofed = dl >= cav.c.mouth && dl <= cav.c.exit;
        if (roofed && y >= cav.c.roof) g += cav.top;
      } else {
        g += cav.hill;
      }
    }
    for (const b of stage.bigHills) {
      const r = Math.hypot((x - b.x) / b.rx, (dl - b.d) / b.rd);
      if (r >= 1) continue;
      if (b.shape === 'mesa') g += b.height * smooth((1 - r) / 0.18);
      else if (b.shape === 'island') g = Math.max(g, b.height * smooth((1 - r) / 0.35));
      else g += b.height * bump(r);
    }
    const bucket = blockBuckets.get(Math.floor(dl / 50));
    if (bucket) for (const b of bucket) {
      if (x < b.x0 - 1 || x > b.x1 + 1 || dl < b.d0 - 1 || dl > b.d1 + 1) continue;
      const e = smooth((x - b.x0 + 1) / 1.2) * smooth((b.x1 + 1 - x) / 1.2) * smooth((dl - b.d0 + 1) / 1.2) * smooth((b.d1 + 1 - dl) / 1.2);
      g = Math.max(g, b.h * e);
    }
    for (const m of stage.mounds) {
      const r = Math.hypot(x - m.x, dl - m.d) / m.r;
      if (r < 1) g += m.h * bump(r);
    }
    for (const t of stage.ditches) {
      const u = Math.abs(dl - t.d) / t.halfLength;
      if (u < 1) g -= t.depth * bump(u) * smooth((120 - Math.abs(x)) / 20);
    }
    for (const p of stage.pits) {
      const r = Math.hypot(x - p.x, dl - p.d) / p.radius;
      if (r < 1) g -= p.depth * bump(r);
      if (p.rim && r > 0.6 && r < 1.4) g += p.rim * bump(Math.abs(r - 1) / 0.4); // crater rim
    }
    if (waterLevel !== null && g < waterLevel) g = waterLevel; // the sea is the floor
    return g;
  }

  function groundAt(x, d, y = -Infinity) {
    if (d >= deckStart && d <= DECK.end && Math.abs(x) <= DECK.halfWidth) return deckHeight;
    return featuresAt(x, d, y);
  }

  // 'water' where the floor is the open sea, else 'ground'.
  function surfaceKind(x, d, y = -Infinity) {
    if (waterLevel === null) return 'ground';
    if (d >= deckStart && d <= DECK.end && Math.abs(x) <= DECK.halfWidth) return 'ground';
    return featuresAt(x, d, y) <= waterLevel + 0.05 ? 'water' : 'ground';
  }

  // Tunnel roof height (only inside a tunnel lane), else Infinity.
  function ceilingAt(x, d) {
    const dl = local(d);
    for (const c of stage.caverns) {
      if (dl < c.mouth || dl > c.exit) continue;
      const left = c.laneMax < 0;
      const inAlcove = c.alcove && dl >= c.alcove.from && dl <= c.alcove.to;
      const laneMin = inAlcove && c.alcove.laneMin !== undefined ? c.alcove.laneMin : c.laneMin;
      const laneMax = inAlcove && c.alcove.laneMax !== undefined ? c.alcove.laneMax : c.laneMax;
      if (x >= laneMin - (left ? 1 : 0) && x <= laneMax + (left ? 0 : 1)) return c.roof;
    }
    return Infinity;
  }

  // Arches: rock across the corridor with one opening (positions resolved on the floor).
  const arches = stage.arches.map((a, i) => {
    const base = featuresAt(a.cx, a.d, -Infinity);
    return { ...a, id: i, depth: 6, y0abs: base + a.y0, top: base + a.y0 + a.h + 5, base };
  });
  const rings = stage.rings.map((r, i) => ({ ...r, id: i }));
  const devils = stage.devils.map((v, i) => ({ ...v, id: i }));

  function inOpening(a, x, y, pad) {
    return Math.abs(x - a.cx) < a.w / 2 - pad && y > a.y0abs + pad && y < a.y0abs + a.h - pad;
  }

  // ---- Colliders: everything that reads as solid (v0.6) ----
  // Columns (trees, pillars, cacti, towers, posts, lighthouse): trunk cylinder + cap ellipsoid,
  // bucketed by lap-local distance so a step only tests what is near.
  const BUCKET = 40;
  const colBuckets = new Map();
  for (const c of columns) {
    c.base = featuresAt(c.x, c.d, -Infinity);
    c.cap = columnCap(c);
    const reach = Math.max(c.r, c.cap.r) + 2;
    for (let k = Math.floor((c.d - reach) / BUCKET); k <= Math.floor((c.d + reach) / BUCKET); k++) {
      if (!colBuckets.has(k)) colBuckets.set(k, []);
      colBuckets.get(k).push(c);
    }
  }
  const inEllipsoid = (dx, dy, dd, rx, ry, pad) => (dx / (rx + pad)) ** 2 + (dy / (ry + pad)) ** 2 + (dd / (rx + pad)) ** 2 < 1;
  function hitColumn(c, x, y, dl, radius) {
    const dx = x - c.x, dd = dl - c.d;
    if (Math.abs(dd) > Math.max(c.r, c.cap.r) + radius) return false;
    if (Math.hypot(dx, dd) < c.r + radius && y < c.base + c.h) return true;              // trunk / body
    return inEllipsoid(dx, y - (c.base + c.h + c.cap.y * 0.4), dd, c.cap.r, c.cap.y, radius); // canopy / cap
  }

  // Small scenery (decor trees, cacti, palms; moon rocks in Space) from the same placement
  // the renderer draws. A few pooled chunk records, rewritten in place (no allocation).
  const SCN = WORLD.chunkLength;
  const scnPool = [newSceneryChunk(), newSceneryChunk(), newSceneryChunk(), newSceneryChunk()];
  let scnNext = 0;
  const solidRocks = !!stage.theme.space;
  function sceneryAt(k) {
    for (const c of scnPool) if (c.k === k) return c;
    const c = scnPool[scnNext];
    scnNext = (scnNext + 1) % scnPool.length;
    return fillSceneryChunk(stage, terrainApi, k, c);
  }
  function hitScenery(o, x, y, d, radius) {
    const dx = x - o.x, dd = d - o.d, s = o.s;
    if (Math.abs(dd) > 3 * s + radius || Math.abs(dx) > 3 * s + radius) return false;
    const flat = Math.hypot(dx, dd);
    switch (o.kind) {
      case 'cactus': return flat < 0.45 * s + radius && y < o.h + 4.45 * s;
      case 'palm': return (flat < 0.3 + radius && y < o.h + 5 * s) || inEllipsoid(dx, y - (o.h + 5 * s), dd, 2.2 * s, 0.6 * s, radius);
      case 'cone': return (flat < 0.5 + radius && y < o.h + o.trunkH) || inEllipsoid(dx, y - (o.h + o.trunkH + 1.4 * s), dd, 1.2 * s, 1.9 * s, radius);
      case 'ball': return (flat < 0.5 + radius && y < o.h + o.trunkH) || inEllipsoid(dx, y - (o.h + o.trunkH + 1.2 * s), dd, (o.street ? 1.1 : 1.5) * s, 1.4 * s, radius);
      default: return false;
    }
  }
  function sceneryHit(x, y, d, radius) {
    if (y > 40 || Math.abs(x) > WORLD.chunkHalfWidth) return null; // decor never reaches up here
    const k = Math.floor(d / SCN);
    for (let kk = k - 1; kk <= k + 1; kk++) {
      if (kk < 0) continue;
      const c = sceneryAt(kk);
      for (const o of c.trees) if (o.kind !== 'none' && hitScenery(o, x, y, d, radius)) return o;
      if (solidRocks) for (const o of c.rocks) {
        if (o.on && inEllipsoid(x - o.x, y - o.h, d - o.d, 1.1 * o.s, o.s, radius)) { o.kind = 'rock'; return o; }
      }
    }
    return null;
  }

  // Solid obstacles: returns what you hit (a column, scenery, an asteroid or arch rock), else null.
  function hitTest(x, y, d, radius = 0.6) {
    const dl = local(d);
    const bucket = colBuckets.get(Math.floor(dl / BUCKET));
    if (bucket) for (const t of bucket) if (hitColumn(t, x, y, dl, radius)) return t;
    for (const a of asteroids) {
      if (Math.abs(a.d - dl) > a.r + radius) continue;
      if (Math.hypot(a.x - x, a.d - dl, featuresAt(a.x, a.d, -Infinity) + a.y - y) < a.r + radius) return a;
    }
    for (const a of arches) {
      if (Math.abs(dl - a.d) > a.depth / 2 + radius) continue;
      if (Math.abs(x) > 30 || y >= a.top + radius) continue;
      if (!inOpening(a, x, y, radius * 0.5)) return a;
    }
    return sceneryHit(x, y, d, radius);
  }

  // Gimmick forces at a point (one shared result object — no allocation per step).
  const fx = { lift: 0, push: 0, gust: 0, updraft: null };
  function effectsAt(x, y, d) {
    const dl = local(d);
    fx.lift = 0; fx.push = 0; fx.gust = 0; fx.updraft = null;
    for (const u of stage.updrafts) {
      if (Math.abs(u.d - dl) < u.r && Math.hypot(u.x - x, u.d - dl) < u.r && y < 75) { fx.lift = u.lift; fx.updraft = u; }
    }
    for (const t of stage.tailwinds) if (x >= t.x0 && x <= t.x1 && dl >= t.d0 && dl <= t.d1) fx.push = t.push;
    for (const g of stage.gusts) if (x >= g.x0 && x <= g.x1 && dl >= g.d0 && dl <= g.d1) fx.gust = g.push;
    return fx;
  }

  // Things you fly THROUGH between two points: arch openings and rings. Ids include the lap.
  function crossings(x0, y0, d0, x1, y1, d1, out) {
    const lap = Math.floor(d1 / cycle);
    const a0 = d0 - lap * cycle, a1 = d1 - lap * cycle;
    for (const a of arches) if (a0 < a.d && a1 >= a.d && inOpening(a, x1, y1, 0)) out.push({ type: 'arch', id: `${lap}:${a.id}` });
    for (const r of rings) if (a0 < r.d && a1 >= r.d && Math.hypot(x1 - r.x, y1 - r.y) < r.r) out.push({ type: 'ring', id: `${lap}:${r.id}` });
    return out;
  }

  // The dust devil you are inside, if any (id includes the lap).
  function devilAt(x, y, d) {
    const lap = Math.floor(d / cycle), dl = local(d);
    for (const v of devils) if (Math.hypot(v.x - x, v.d - dl) < v.r && y < 60) return { devil: v, id: `${lap}:${v.id}` };
    return null;
  }

  // surfaceAt = the ground without the launch deck (what the terrain mesh draws).
  // (The scenery colliders read it too: local, surfaceAt, surfaceKind.)
  const terrainApi = {
    stage, groundAt, surfaceAt: featuresAt, surfaceKind, ceilingAt, hitTest, effectsAt, crossings, devilAt,
    columns, trunks: columns, asteroids, blocks, arches, rings, devils, local, deckStart, deckHeight, cycle,
    edgeWalls: !!stage.edgeWalls,
  };
  return terrainApi;
}

// Default Plains terrain with the stock ramp (handy for tests and the title scene).
const plainsDefault = makeTerrain();
export const groundAt = plainsDefault.groundAt;
