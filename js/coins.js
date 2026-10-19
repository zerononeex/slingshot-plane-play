// Pure coin logic: per-flight coin patterns (R1), cave trails, secret stashes (R4),
// magnet pull and pickup. The WORLD is fixed; only the coin patterns shuffle per flight.
import { MAGNET_PULL_SPEED } from './config.js';

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const overlaps = (a0, a1, b0, b1) => a0 <= b1 && b0 <= a1;

// Which specials can appear in segment k (they need their feature nearby).
function segmentContext(stage, terrain, k) {
  const L = stage.patterns.segment;
  const d0 = terrain.local(k * L), d1 = d0 + L;
  return {
    forest: stage.forests.some((f) => overlaps(d0 + 5, d1 - 5, f.from, f.to)),
    ditch: stage.ditches.find((t) => t.d > d0 + 20 && t.d < d1 - 15) ?? null,
    cavern: stage.caverns.some((c) => overlaps(d0, d1, c.start - 20, c.end + 20)),
    bigHill: stage.bigHills.some((b) => overlaps(d0, d1, b.d - b.rd, b.d + b.rd)),
    d0: k * L,
  };
}

// A per-flight pattern sequence: seeded, never the same twice in a row,
// gentle openers, trickier patterns weigh in further out.
export function makePatternPicker(stage, terrain, seed) {
  const P = stage.patterns;
  const r = rng(seed);
  const seq = [];
  function weight(name, k, ctx) {
    if (name === 'treeWeave') return ctx.forest ? 20 : 0;
    if (name === 'ditchDip') return ctx.ditch ? 20 : 0;
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

// Coins for one ~80 m segment. Never buried: at least 2.5 m over the ground top.
export function patternCoins(stage, terrain, k, name, r) {
  const L = stage.patterns.segment;
  const n = stage.patterns.coinsEach;
  const ctx = segmentContext(stage, terrain, k);
  let cx = k === 0 ? 0 : (r() * 2 - 1) * 16;
  if (ctx.cavern || ctx.bigHill) cx = Math.max(cx, -6);  // keep the left features for the cave trail
  if (ctx.forest) cx = Math.min(cx, 6);
  const base = k === 0 ? 6 : 6 + r() * 12;
  const start = k === 0 ? 14 : k * L + 8 + r() * 18;
  const out = [];
  const add = (x, y, d) => out.push({ x, y, d });
  if (name === 'treeWeave') {
    // Thread the trunks: pass each trunk on the opposite side, with a coin in each gap.
    const lap = k * L - terrain.local(k * L);
    const inSeg = terrain.trunks.filter((tr) => !tr.hero && tr.d + lap >= k * L && tr.d + lap < (k + 1) * L);
    for (const tr of inSeg) {
      const mx = 33 - tr.x; // mirror across the slalom middle (x 16.5)
      add(mx, 4, tr.d + lap - 2);
      add(mx, 4, tr.d + lap + 2);
      add(16.5, 4, tr.d + lap + 12.5);
    }
    if (out.length === 0) name = 'slalom';
  }
  for (let i = 0; i < n && name !== 'treeWeave'; i++) {
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
      case 'ditchDip': {
        const t0 = ctx.ditch ? ctx.ditch.d + (k * L - terrain.local(k * L)) - (n - 1) * 2.5 : d;
        const dd = t0 + i * 5;
        add(cx, 0, dd); // y set below to follow the ground into the ditch
        out[out.length - 1].dip = true;
        break;
      }
      default: add(cx, base, d); // line
    }
  }
  for (const c of out) {
    const top = terrain.groundAt(c.x, c.d, Infinity);
    c.y = c.dip ? terrain.groundAt(c.x, c.d) + 2.2 : Math.max(c.y, top + 2.5);
    c.y = Math.min(c.y, terrain.ceilingAt(c.x, c.d) - 1.5);
  }
  return out;
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
  if (lap === 0) {
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
    if (!c.alive || Math.abs(c.d - pos.d) > reach + 1) continue;
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

// R4: secrets reached this step (by the plane or the parachuting pilot).
// Reaching a stash scoops up all of its coins at once.
export function reachSecrets(stage, terrain, coins, pos, reached) {
  const found = [];
  if (pos.d > stage.cycle) return found;
  for (const s of stage.secrets) {
    if (reached.has(s.id)) continue;
    if (Math.hypot(pos.x - s.x, pos.y - secretY(terrain, s), pos.d - s.d) > s.radius) continue;
    reached.add(s.id);
    let got = 0;
    for (const c of coins) if (c.alive && c.secret === s.id) { c.alive = false; got++; }
    found.push({ id: s.id, coins: got });
  }
  return found;
}
