// Small scenery placement (trees, cacti, palms, rocks, clouds), pure and deterministic per
// 80 m chunk, shared by the renderer (what you see) and the colliders (what you hit).
// Chunk records are pooled and rewritten in place: nothing is allocated once warmed up.
import { WORLD } from './config.js';
import { rng } from './rng.js';
import { pocketRects, inRect } from './pockets.js';

export const TREE_SLOTS = 14;
export const ROCK_SLOTS = 8;
const L = WORLD.chunkLength;
const HALF = WORLD.chunkHalfWidth;

// Big feature caps (the renderer draws them the same size): [radius, height] scales.
export const COLUMN_CAPS = {
  tree: { capScale: [5, 4.5], hero: [7, 6.3], absolute: true },
  pine: { capScale: [4, 7], hero: [6, 10], absolute: true },
  pillar: { capScale: [1.15, 0.6] },
  cactus: { capScale: [1, 1], hero: [1, 1] },
  waterTower: { capScale: [1.2, 0.6] },
  antenna: { capScale: [2.5, 2.5] },
  post: { capScale: [1, 0.3] },
  lighthouse: { capScale: [1.3, 1.1] },
  pylon: { capScale: [1.3, 0.8] },
};
// Cap size in metres for a column: { r, y } (the cap's centre sits at top + y * 0.4).
export function columnCap(c) {
  const look = COLUMN_CAPS[c.kind] ?? COLUMN_CAPS.pillar;
  const cs = c.hero && look.hero ? look.hero : look.capScale;
  return look.absolute ? { r: cs[0], y: cs[1] } : { r: c.r * cs[0], y: c.r * cs[1] };
}

// Fixed furniture spots (slots, gates, loop rings, bridges, bumpables, courses, portals) that
// decor must keep clear of: [{ d, x, r }] in lap-local metres (cached per stage).
const spotCache = new WeakMap();
export function furnitureSpots(stage) {
  if (spotCache.has(stage)) return spotCache.get(stage);
  const out = [];
  const add = (d, x, r = 14) => out.push({ d, x, r });
  for (const f of stage.slots ?? []) add(f.d, f.x, 18);
  for (const f of stage.diveGates ?? []) add(f.d, f.x);
  for (const f of stage.speedGates ?? []) add(f.d, f.x, 16);
  for (const f of stage.loopRings ?? []) add(f.d, f.x, f.R + 8);
  for (const f of stage.bumpables ?? []) add(f.d, f.x, 10);
  for (const c of stage.courses ?? []) for (const g of c.gates) add(g.d, g.x);
  for (const p of stage.pockets ?? []) { add(p.portal.d, p.portal.x, 18); }
  spotCache.set(stage, out);
  return out;
}

// Keep small scenery out of the tunnels, the obstacle slaloms, the furniture and the launch lane.
export function sceneryX(stage, terrain, x, d) {
  const dl = terrain.local(d);
  for (const f of furnitureSpots(stage)) if (Math.abs(dl - f.d) < f.r && Math.abs(x - f.x) < f.r) return x + (x < f.x ? -f.r : f.r) * 1.6;
  // Sub-areas: decor stays out of the pocket lane and its passages (the pocket has its own decor).
  for (const p of stage.pockets ?? []) for (const r of pocketRects(p)) if (inRect(r, x, dl, 3)) return Math.sign(p.cx) * (Math.abs(p.cx) + p.half + 16 + Math.abs(x) * 0.1);
  for (const c of stage.caverns) {
    const left = c.laneMax < 0;
    if (dl > c.start - 10 && dl < c.end + 10 && (left ? x > -30 && x < -6 : x < 30 && x > 6)) return x + (left ? -40 : 40);
  }
  for (const z of stage.zones) if (dl > z.from - 10 && dl < z.to + 10 && Math.abs(x) > 6 && Math.abs(x) < 28 && (z.side === 'left') === (x < 0)) return x + Math.sign(x) * 30;
  if (d < 60 && Math.abs(x) < 10) return x + (x < 0 ? -12 : 12);
  return x;
}

export function newSceneryChunk() {
  return {
    k: null,
    // kind: 'none' | 'cactus' | 'palm' | 'cone' | 'ball' (street trees are 'ball' with street: true)
    trees: Array.from({ length: TREE_SLOTS }, () => ({ kind: 'none', x: 0, d: 0, h: 0, s: 1, spin: 0, trunkH: 0, street: false })),
    rocks: Array.from({ length: ROCK_SLOTS }, () => ({ on: false, x: 0, d: 0, h: 0, s: 1, ry: 0 })),
    clouds: Array.from({ length: WORLD.cloudsPerChunk }, () => ({ x: 0, y: 0, d: 0, s: 1 })),
  };
}

// Fill `out` with chunk k's scenery (the same rng sequence the renderer always used).
// v1.5 a mega-stage's arcs each bring their own small scenery (kind + density): the arc this chunk is in.
export const sceneryArc = (theme, d) => (theme.arcs ? theme.arcs.find((a) => d >= a.from && d < a.to) ?? theme.arcs[theme.arcs.length - 1] : null);

export function fillSceneryChunk(stage, terrain, k, out) {
  const d0 = k * L;
  const theme = stage.theme, arc = sceneryArc(theme, d0);
  const kind = arc ? arc.scenery.kind : theme.scenery;
  const treesPer = arc ? arc.scenery.trees : theme.treesPerChunk, rocksPer = arc ? arc.scenery.rocks : theme.rocksPerChunk;
  const r = rng(k * 7919 + 17);
  out.k = k;
  for (let t = 0; t < TREE_SLOTS; t++) {
    const o = out.trees[t];
    const d = d0 + r() * L;
    let x = sceneryX(stage, terrain, (r() * 2 - 1) * (HALF - 10), d);
    if (kind === 'street') x = (r() < 0.5 ? -1 : 1) * (7.5 + r() * 1.5);
    const h = terrain.surfaceAt(x, d, Infinity);
    const s = 0.8 + r() * 0.9;
    const hide = t >= treesPer || (terrain.surfaceKind(x, d) === 'water') || (kind === 'street' && h > 0.5);
    const roll = r(), spin = r() * 6;
    o.x = x; o.d = d; o.h = h; o.s = s; o.spin = spin; o.street = kind === 'street';
    if (hide || kind === 'none') { o.kind = 'none'; continue; }
    if (kind === 'cactus' || kind === 'palm') { o.kind = kind; continue; }
    o.trunkH = 1.2 * s;
    o.kind = kind === 'pine' || kind === 'snowpine' || (kind === 'mixed' && roll < 0.55) ? 'cone' : 'ball';
  }
  for (let t = 0; t < ROCK_SLOTS; t++) {
    const o = out.rocks[t];
    const d = d0 + r() * L;
    const x = sceneryX(stage, terrain, (r() * 2 - 1) * (HALF - 10), d);
    const s = 0.6 + r() * 1.4;
    if (t >= rocksPer || terrain.surfaceKind(x, d) === 'water') { o.on = false; continue; }
    o.on = true; o.x = x; o.d = d; o.s = s; o.h = terrain.surfaceAt(x, d, Infinity); o.ry = r() * 6;
  }
  for (const c of out.clouds) {
    const side = r() < 0.5 ? -1 : 1;
    c.x = side * (20 + r() * 80);
    c.y = 48 + r() * 30;
    c.d = d0 + r() * L;
    c.s = 3 + r() * 3;
  }
  return out;
}
