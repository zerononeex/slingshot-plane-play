// v1.5 THE MEGA-STAGE LAYER — the shared physics of the 50,000 m mega-stages (Dragon War first; v1.6
// and v1.7 reuse it with their own data). At ABSOLUTE distances, on top of the stage's base lap:
//   WEAVE rows   — posts (trees, towers, spires) across the corridor every 16 m; they bonk, the lanes
//                  between them are clear, and successive rows shift so the clean line weaves.
//   TILT sectors — a tall wall across the corridor with one knife-edge slot: clean only when tilted.
//   LOOP DOORS   — loopdoors.js (a gate across the chokepoint, opened in advance by a keyed loop).
//   SHOOTERS     — shooters.js (fire-breathing dragons, trebuchets) on a deterministic schedule.
//   WILD flyers  — big bonk critters on sine paths (wild dragons): x/y follow the flight clock.
//   THE HALL     — an indoor sector: a raised stone floor, a facade with one doorway, side walls,
//                  GAP walls (DIVE low / CLIMB high openings) and knife-edge doorways (hall tilts).
//   THE SHELTER  — a mountainside cave (a tunnel through a rock mass) and the WAVE that sweeps the
//                  line when the plane reaches it: inside the cave = safe, outside = the heavy knock.
//   THERMALS     — updrafts (the Canyon mechanic) · WIND LANES — boxes of forward push (the
//                  tailwind / slipstream mechanic, only for a plane flying at least `min` m/s).
// Everything is a bonk at worst: nothing is one-hit, and a flight never ends at a door.
// Pure data + maths (no DOM / three.js).
import { createShotPool, fireShot, stepShots, shotTime, SHOTS, HIT } from './shooters.js';
import { keyRingHit, createDoorStates, openByLoop, crossDoors, DOOR } from './loopdoors.js';
import { MEGA_DATA } from './dragonwar.js';
import { SF_MEGA } from './starfox.js';
import { SW_MEGA } from './starwars.js';
import { STAGES } from './stages.js';
import { shiftOutOfPockets } from './pockets.js';

// Every mega-stage's data, by stage id (v1.5 Dragon War, v1.6 Star Fox, v1.7 Star Wars).
const ALL_MEGA = { ...MEGA_DATA, ...SF_MEGA, ...SW_MEGA };

export const WEAVE_HALF = 30;     // weave rows + tilt walls span the corridor (±26) with a margin; pocket lanes (±72) pass
export const POST_GAP = 16;       // posts 16 m apart in a row: the clear lines sit at offset + 8 + 16k
export const POST_TOP = 90;       // above the 60 m ceiling: no flying over
export const POST_R = { pine: 1.3, giantTree: 2.1, tower: 2.4, spire: 1.7, castleTower: 2.6,
  asteroid: 2.4, coral: 1.8, hullMast: 2.2, obelisk: 2.0, plasma: 1.7, redSpire: 2.4, // v1.6 Star Fox's posts
  rockSpire: 2.2, iceSpire: 1.9, cloudTower: 2.4, redwood: 2.6, greebleTower: 2.3 }; // v1.7 Star Wars'
export const TILT = { gap: 3, depth: 2, top: 90 };   // gap 3 m: wings out (half-span 1.6) never fit, knife-edge (0.3) does
export const WILD_R = 3.4;
export const GAP = { depth: 2 };                          // a hall gap wall's thickness
export const WAVE = { keep: 0.5, push: 14, shake: 1 };    // caught outside the shelter: × 0.5 + a big sideways push (no damage)
const B = 50; // bucket size (m)
export const SHOOTER_NEAR = 40; // v1.9: a shooter this close to the line (|x|) is part of the corridor (the pocket audit)

const RUNS = {};

// The posts of one weave row (clear lines at offset + 8 + 16k).
export function weavePosts(row) {
  const r = row.r ?? POST_R[row.kind] ?? 2, out = [];
  for (let px = row.offset - POST_GAP * 3; px <= WEAVE_HALF; px += POST_GAP) if (px >= -WEAVE_HALF) out.push({ kind: row.kind, x: px, d: row.d, r });
  return out;
}
// The clear line through a row to aim for from x: the nearest one, leaning toward the middle
// (kept inside ±23 so it is always inside the corridor).
export function weaveLine(row, x) {
  let best = 0, cost = Infinity;
  for (let lx = row.offset + POST_GAP / 2 - POST_GAP * 3; lx <= 23; lx += POST_GAP) {
    if (lx < -23) continue;
    const c = Math.abs(lx - x) + 0.15 * Math.abs(lx);
    if (c < cost) { cost = c; best = lx; }
  }
  return best;
}
// A wild flyer's position at flight time t.
export function wildPos(w, t, out) {
  const a = (2 * Math.PI * t) / w.period + w.phase;
  out.x = w.x + w.ax * Math.sin(a);
  out.y = w.y + w.ay * Math.sin(2 * a);
  out.d = w.d;
  return out;
}
// A patrolling shooter's muzzle x at flight time t.
export const patrolX = (sh, t) => (sh.patrol ? sh.x + sh.patrol[0] * Math.sin((2 * Math.PI * t) / sh.patrol[1] + (sh.patrol[2] ?? 0)) : sh.x);

function build(data, stage = null) {
  // v1.9 POCKET AUDIT: weave rows, shooters and wild flyers standing in a pocket's entry or exit lane
  // move forward, just past it (pockets.js), never into an interior, a door's run-in, a tilt sector or a
  // cave.
  if (stage) {
    const busy = [...(data.halls ?? (data.hall ? [data.hall] : [])).map((h) => [h.d0 - 30, h.d1 + 10]), ...data.doors.map((o) => [o.loopD - 250, o.d + 50]),
      ...[...data.tilts, ...(data.hallTilts ?? [])].map((t) => [t.d - 40, t.d + 20]), ...(data.caves ?? (data.cave ? [data.cave] : [])).map((c) => [c.d0 - 80, c.d1 + 20])];
    const avoid = (d) => busy.some(([a, b]) => d > a && d < b);
    data = { ...data,
      weave: shiftOutOfPockets(data.weave.map((w) => ({ ...w, r: 3 })), stage, stage.cycle, { avoid }).map(({ r, movedFrom, ...w }) => w),
      shooters: shiftOutOfPockets(data.shooters, stage, stage.cycle, { skip: (sh) => Math.abs(sh.x) > SHOOTER_NEAR }).map(({ movedFrom, ...sh }) => sh),
      wild: shiftOutOfPockets(data.wild.map((w) => ({ ...w })), stage, stage.cycle).map(({ movedFrom, ...w }) => w),
    };
  }
  const rows = data.weave.map((w, i) => ({ ...w, id: i, posts: null }));
  for (const r of rows) r.posts = weavePosts(r);
  const tilts = [...data.tilts, ...(data.hallTilts ?? []).map((t) => ({ ...t, hall: true, top: 60 }))].map((t, i) => ({ gap: TILT.gap, ...t, id: i, kind: 'tiltWall' }));
  const doors = data.doors.map((d, i) => ({ ...d, id: i }));
  const BURST = { trebuchet: 1, rubble: 1, dragon: SHOTS.fireball.burst, archer: SHOTS.arrow.burst };
  const shooters = data.shooters.map((s, i) => ({ shots: s.kind === 'geyser' ? s.aims.length : BURST[s.kind], ...s, id: i }));
  // v1.6: any number of interiors (Dragon War has one: `hall`; Star Fox two: `halls`) and caves.
  const halls = (data.halls ?? (data.hall ? [data.hall] : [])).map((h, i) => {
    const o = { ...h, id: i, kind: 'hall' };
    o.walls = [-1, 1].map((sx) => ({ kind: 'hallWall', side: sx, x: sx * o.outer, cx: sx * o.outer }));
    o.facade = { kind: 'hallFacade', d: o.d0, cx: 0, w: o.door.half * 2, y0abs: o.door.y0, x: 0 };
    return o;
  });
  const hall = halls[0] ?? null;
  const hallAt = (d, before = 0) => { for (const h of halls) if (d > h.d0 - before && d <= h.d1) return h; return null; };
  const gaps = (data.gaps ?? []).map((g, i) => ({ ...g, id: i, kind: 'gapWall', cx: g.x, w: g.w, y0abs: g.y - g.h / 2 }));
  const caves = (data.caves ?? (data.cave ? [data.cave] : [])).map((c, i) => ({ ...c, id: i, kind: 'caveRock', w: 1, cx: (c.lane[0] + c.lane[1]) / 2 }));
  const cave = caves[0] ?? null;
  const caveAt = (d, pad = 0) => { for (const c of caves) if (d > c.d0 - pad && d < c.d1 + pad) return c; return null; };
  // v1.6 THE UNDERWATER SECTORS: physics flags on a span (sink × sink, + drift up, drag × drag), below the surface.
  const water = (data.water ?? []).map((w, i) => ({ ...w, id: i }));
  const waterAt = (y, d) => { for (const w of water) if (d >= w.d0 && d <= w.d1 && y < w.surface) return w; return null; };
  const wave = data.wave ?? null;
  const wild = data.wild.map((w, i) => ({ r: WILD_R, ...w, id: i, kind: 'wildDragon', cur: { x: w.x, y: w.y, d: w.d } }));
  const thermals = data.thermals.map((u, i) => ({ ...u, id: i }));
  const lanes = data.lanes.map((l, i) => ({ ...l, id: i, x0: l.x - l.w / 2, x1: l.x + l.w / 2, y0: l.y - l.h / 2, y1: l.y + l.h / 2 }));
  // v1.7 THE TARGET PORT: one glowing ring; flying through it pays once per flight (never twice).
  const port = data.port ?? null;

  const put = (map, k, v) => { if (!map.has(k)) map.set(k, []); map.get(k).push(v); };
  const solid = new Map(), fx = new Map(), fire = new Map();
  for (const r of rows) put(solid, Math.floor(r.d / B), r);
  for (const t of tilts) put(solid, Math.floor(t.d / B), t);
  for (const g of gaps) put(solid, Math.floor(g.d / B), g);
  for (const w of wild) for (let k = Math.floor((w.d - w.r) / B); k <= Math.floor((w.d + w.r) / B); k++) put(solid, k, w);
  for (const u of thermals) for (let k = Math.floor((u.d - u.r) / B); k <= Math.floor((u.d + u.r) / B); k++) put(fx, k, u);
  for (const l of lanes) for (let k = Math.floor(l.d0 / B); k <= Math.floor(l.d1 / B); k++) put(fx, k, l);
  // A shooter is "in range" while the plane is 1,500 m → 15 m short of it.
  for (const s of shooters) for (let k = Math.floor((s.d - 1500) / B); k <= Math.floor(s.d / B); k++) put(fire, k, s);
  const features = [
    ...rows.map((r) => ({ d: r.d, kind: `weave:${r.kind}` })), ...tilts.map((t) => ({ d: t.d, kind: 'tilt' })),
    ...doors.flatMap((d) => [{ d: d.loopD, kind: 'loopKeys' }, { d: d.d, kind: 'loopDoor' }]),
    ...shooters.map((s) => ({ d: s.d, kind: s.kind })), ...wild.map((w) => ({ d: w.d, kind: 'wild' })),
    ...thermals.map((u) => ({ d: u.d, kind: 'thermal' })), ...lanes.map((l) => ({ d: l.d0, kind: 'windLane' })),
    ...gaps.map((g) => ({ d: g.d, kind: `gap:${g.move}` })), ...halls.map((h) => ({ d: h.d0, kind: 'hall' })),
    ...caves.map((c) => ({ d: c.d0, kind: c.falls ? 'waterfallCave' : 'shelterCave' })), ...(wave ? [{ d: wave.d, kind: 'lavaWave' }] : []),
    ...water.map((w) => ({ d: w.d0, kind: 'underwater' })), ...(port ? [{ d: port.d, kind: 'targetPort' }] : []),
  ].sort((a, b) => a.d - b.d);
  const inHall = (d) => { const h = hallAt(d, 0.0001); return !!h && d >= h.d0; };
  const inCaveLane = (x, y, d) => { const c = caveAt(d); return !!c && d >= c.d0 && d <= c.d1 && x >= c.lane[0] && x <= c.lane[1] && y < c.roof; };

  // The solid hit at (x, y, d) at flight time t, or null. span = the plane's half-width (wings).
  function hit(x, y, d, radius = 0.6, span = radius, t = 0) {
    if (y > POST_TOP + radius) return null;
    const hl = hallAt(d, 3);
    if (hl && d < hl.d1) { // THE HALL: the facade's doorway, then the side walls
      if (Math.abs(d - hl.d0) < 1.5 + radius && Math.abs(x) <= hl.outer && !(Math.abs(x) + span < hl.door.half && y > hl.door.y0 + radius && y < hl.door.y1 - radius)) return hl.facade;
      if (d >= hl.d0 && Math.abs(x) + span > hl.half && Math.abs(x) <= hl.outer + radius && y > hl.floor - 1) return hl.walls[x < 0 ? 0 : 1];
    }
    const cv = caveAt(d, radius);
    if (cv && x > cv.x0 - span && x < cv.x1 + span && y < cv.top) {
      if (!(x - span > cv.lane[0] && x + span < cv.lane[1] && y < cv.roof + 1.5)) return cv; // the rock (the tunnel is clear)
    }
    const k = Math.floor(d / B);
    for (let kk = k - 1; kk <= k + 1; kk++) {
      const list = solid.get(kk);
      if (list) for (const o of list) {
        if (o.posts) { // a weave row
          if (Math.abs(d - o.d) > o.posts[0].r + radius) continue;
          for (const p of o.posts) if (Math.abs(x - p.x) < p.r + span && Math.abs(d - p.d) < p.r + radius) return p;
        } else if (o.kind === 'gapWall') { // a hall gap wall: one opening, low (DIVE) or high (CLIMB)
          if (Math.abs(d - o.d) > GAP.depth / 2 + radius || Math.abs(x) > (hallAt(o.d) ?? hall).half + radius) continue;
          if (Math.abs(x - o.x) + span < o.w / 2 && Math.abs(y - o.y) + radius < o.h / 2) continue;
          return o;
        } else if (o.kind === 'tiltWall') {
          if (Math.abs(d - o.d) > TILT.depth / 2 + radius || Math.abs(x) > WEAVE_HALF + radius || y > (o.top ?? TILT.top)) continue;
          if (Math.abs(x - o.x) + span < o.gap / 2) continue; // through the knife-edge slot
          o.cx = o.x; o.w = o.gap; o.y0abs = 0;
          return o;
        } else { // a wild flyer
          wildPos(o, t, o.cur);
          if (Math.hypot(x - o.cur.x, y - o.cur.y, d - o.cur.d) < o.r + radius) { o.cx = o.cur.x; return o; }
        }
      }
    }
    return null;
  }

  // Thermal lift + wind-lane push at a point (writes into the terrain's shared fx object).
  function effects(x, y, d, out) {
    if (water.length) out.water = waterAt(y, d); // v1.6 underwater: the sector's flags (null outside)
    const list = fx.get(Math.floor(d / B));
    if (!list) return out;
    for (const o of list) {
      if (o.lift !== undefined) { if (Math.abs(o.d - d) < o.r && Math.hypot(o.x - x, o.d - d) < o.r && y < 75) { out.lift = o.lift; out.updraft = o; } }
      else if (d >= o.d0 && d <= o.d1 && x >= o.x0 && x <= o.x1 && y >= o.y0 && y <= o.y1) { out.push = o.push; out.pushMin = o.min ?? 0; }
    }
    return out;
  }

  // THE HALL's raised stone floor (the terrain's ground there) and THE SHELTER's tunnel roof.
  const floorAt = (x, d) => { const h = hallAt(d, 0.0001); return h && d >= h.d0 && Math.abs(x) <= h.outer ? h.floor : -Infinity; };
  const ceilingAt = (x, d) => { const c = caveAt(d); return c && d >= c.d0 && d <= c.d1 && x >= c.lane[0] - 1 && x <= c.lane[1] + 1 ? c.roof : Infinity; };

  // The next solid thing to line up for within `reach` m ahead (for the scripted pilot): a weave row's
  // clear line, a tilt slot, a hall gap's opening or the hall doorway → { kind, d, x, y | null }.
  function openingAhead(x, d, reach) {
    for (const h of halls) if (d < h.d0 && h.d0 - d <= reach && !gaps.some((g) => g.d > d && g.d < h.d0) && !rows.some((r) => r.d > d && r.d < h.d0)) return { kind: 'hallDoor', d: h.d0, x: 0, y: h.cruise };
    for (let k = Math.floor(d / B); k <= Math.floor((d + reach) / B); k++) {
      const list = solid.get(k);
      if (!list) continue;
      let near = null;
      for (const o of list) if (o.kind !== 'wildDragon' && o.d > d - 1 && o.d <= d + reach && (!near || o.d < near.d)) near = o;
      if (near) return near.posts ? { kind: 'weave', d: near.d, x: weaveLine(near, x), y: null }
        : near.kind === 'gapWall' ? { kind: 'gap', d: near.d, x: near.x, y: near.y } : { kind: 'tilt', d: near.d, x: near.x, y: near.hall ? (hallAt(near.d) ?? hall).cruise - 4 : null };
    }
    return null;
  }
  // The next shut door whose loop mark is within `reach` m (or still under the plane): { d (mark), x, y, i }.
  function doorAhead(d, reach, states = null) {
    for (let i = 0; i < doors.length; i++) {
      const o = doors[i];
      if (states && states[i].state !== 0) continue;
      if (o.loopD + DOOR.after > d && o.loopD - DOOR.before - reach < d) return { d: o.loopD, x: o.x, y: o.y, i };
    }
    return null;
  }

  // The target port within `reach` m (not yet crossed this flight): { d, x, y }.
  const portAhead = (d, reach, hz = null) => (port && !(hz?.port) && d < port.d && port.d - d <= reach ? port : null);

  // The shelter tunnel within `reach` m (until its exit): { d (mouth), x, y }.
  function caveAhead(d, reach) {
    for (const c of caves) if (d <= c.d1 && d >= c.d0 - reach) return { d: c.d0, x: (c.lane[0] + c.lane[1]) / 2, y: c.cruise, glide: !!c.clearApproach };
    return null;
  }

  // Which door key ring a point is inside (during a loop): { door index, key } or null.
  function keyRingAt(x, y, d) {
    for (let i = 0; i < doors.length; i++) { const k = keyRingHit(doors[i], x, y, d); if (k) return { i, key: k }; }
    return null;
  }

  // The flight's hazard state (created on its first step; pooled shots, per-door state).
  const createHazards = () => ({ shots: createShotPool(), fired: new Int16Array(shooters.length), next: new Float64Array(shooters.length), doors: createDoorStates(doors), tiltsPassed: new Uint8Array(tilts.length), wave: 0, port: 0, prevD: null, prevX: 0, prevY: 0 });
  const _from = { x: 0, y: 0, d: 0 }, _to = { x: 0, y: 0, d: 0 };

  // Fire whatever is due this step (deterministic: the flight's own clock and state only).
  function fireDue(hz, s, floor) {
    const list = fire.get(Math.floor(s.d / B));
    if (!list) return;
    const fwd = Math.max(5, s.speed * Math.cos(s.pitch));
    for (const sh of list) {
      const i = sh.id;
      if (hz.fired[i] >= sh.shots || s.d < sh.d - 1500 || s.d > sh.d - 15 || s.time < hz.next[i]) continue;
      const eta = (sh.d - s.d) / fwd;
      if (sh.kind === 'trebuchet' || sh.kind === 'rubble') { // a lob onto a fixed spot (its shadow is the telegraph)
        const kind = sh.kind === 'trebuchet' ? 'boulder' : 'rubble', k = SHOTS[kind];
        // a boulder lands on the line as the plane arrives; rubble is still falling through the cruise height
        if (hz.fired[i] === 0 && eta > k.windup + k.time * (kind === 'rubble' ? 0.55 : 1)) continue;
        const tx = sh.aim[0];
        _from.x = sh.x; _from.d = sh.d; _from.y = kind === 'rubble' ? sh.y : floor(sh.x, sh.d) + 9;
        _to.x = tx; _to.d = sh.d; _to.y = floor(tx, sh.d) + 0.5;
        if (fireShot(hz.shots, kind, i, s.time, _from, _to, k.time)) hz.fired[i]++;
        hz.next[i] = s.time + 1.2;
        continue;
      }
      if (sh.kind === 'geyser') { // a glowing crack, then a fan of lava blobs across the line (all at once)
        const k = SHOTS.lava;
        if (eta > k.windup + k.time) continue;
        const g = floor(sh.x, sh.d);
        for (const [dx, y] of sh.aims) {
          _from.x = sh.x; _from.y = g; _from.d = sh.d; _to.x = sh.x + dx; _to.y = y; _to.d = sh.d;
          if (fireShot(hz.shots, 'lava', i, s.time, _from, _to, k.time)) hz.fired[i]++;
        }
        hz.fired[i] = sh.shots;
        continue;
      }
      // A dragon (fireballs) or an archer (arrows): a stream, each aimed where the plane will be when it arrives.
      const kind = sh.kind === 'archer' ? 'arrow' : 'fireball', k = SHOTS[kind], mx = patrolX(sh, s.time);
      const aimX = sh.aim === 'plane' ? s.x : sh.aim[0], aimY = sh.aim === 'plane' ? s.y : sh.aim[1];
      const T = shotTime(kind, Math.hypot(mx - aimX, sh.y - aimY));
      if (hz.fired[i] === 0 && eta > k.windup + T) continue;
      _from.x = mx; _from.y = sh.y; _from.d = sh.d;
      _to.x = aimX + (hz.fired[i] - (sh.shots - 1) / 2) * k.spread; _to.y = aimY; _to.d = s.d + fwd * (k.windup + T);
      if (fireShot(hz.shots, kind, i, s.time, _from, _to, T)) hz.fired[i]++;
      hz.next[i] = s.time + k.every;
    }
  }

  // One step of the flight's hazards (called from stepFlight via the terrain): firing, shots,
  // doors and the tilt sectors' clean-pass reward. floor(x, d) = the ground height.
  function stepHazards(s, dt, P, floor) {
    const hz = s.hz ??= createHazards();
    if (hz.prevD === null) { hz.prevD = s.d; hz.prevX = s.x; hz.prevY = s.y; }
    if (s.hitGrace > 0) s.hitGrace = Math.max(0, s.hitGrace - dt);
    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt);
    if (!s.ended) fireDue(hz, s, floor);
    stepShots(hz.shots, s, dt, P, hz.prevX, hz.prevY, hz.prevD);
    if (s.mode === 'air') {
      crossDoors(doors, hz.doors, s, P, hz.prevD);
      for (const t of tilts) {
        if (hz.tiltsPassed[t.id] || !(hz.prevD < t.d && s.d >= t.d)) continue;
        hz.tiltsPassed[t.id] = 1;
        if (s.tilted && Math.abs(s.x - t.x) < t.gap / 2 && (s.bonkGrace ?? 0) <= 0) s.events.push('tiltSector');
      }
      // v1.7 THE TARGET PORT: crossing its plane settles it for this flight — through the ring pays once
      if (port && !hz.port && hz.prevD < port.d && s.d >= port.d) {
        const k = (port.d - hz.prevD) / Math.max(1e-6, s.d - hz.prevD), x = hz.prevX + (s.x - hz.prevX) * k, y = hz.prevY + (s.y - hz.prevY) * k;
        hz.port = Math.hypot(x - port.x, y - port.y) < port.r ? 1 : 2;
        if (hz.port === 1) s.events.push('targetPort');
      }
    }
    if (wave && !s.ended) { // THE WAVE: a warning well before; then inside the shelter = safe, outside = the heavy knock
      if (hz.wave === 0 && hz.prevD < wave.warn && s.d >= wave.warn) { hz.wave = 1; s.events.push('waveWarn'); }
      if (hz.wave < 2 && hz.prevD < wave.d && s.d >= wave.d) {
        hz.wave = 2;
        if (inCaveLane(s.x, s.y, s.d)) s.events.push('shelter');
        else {
          s.speed = Math.max(P.minAirSpeed, s.speed * WAVE.keep);
          s.vx -= (wave.from ?? 1) * WAVE.push; // swept away from the side it rolls in from
          s.shake = Math.max(s.shake ?? 0, WAVE.shake);
          s.hitGrace = Math.max(s.hitGrace ?? 0, HIT.grace);
          s.events.push('waveHit');
        }
      }
    }
    hz.prevD = s.d; hz.prevX = s.x; hz.prevY = s.y;
  }

  // A finished loop opens every door whose two keys it threaded.
  function loopDone(s, keys) { if (keys && keys.size) openByLoop(doors, (s.hz ??= createHazards()).doors, keys, s); }

  // v1.6: a pocket's portal is shut inside an interior or a cave (the walls are in the way).
  const noPortal = (d) => !!hallAt(d, 30) || !!caveAt(d, 30);
  return { rows, tilts, doors, shooters, wild, thermals, lanes, features, spectacles: data.spectacles ?? [], hall, gaps, cave, wave, golden: data.golden ?? null,
    halls, caves, water, waterAt, hallAt, caveAt, noPortal, transitions: data.transitions ?? [], skin: data.skin ?? null, fortress: data.fortress ?? null, port,
    hit, effects, openingAhead, doorAhead, caveAhead, portAhead, inHall, inCaveLane, floorAt, ceilingAt, keyRingAt, stepHazards, loopDone, createHazards, run: data.run };
}

export function megaRunFor(stageId) {
  if (!(stageId in ALL_MEGA)) return null;
  return (RUNS[stageId] ??= build(ALL_MEGA[stageId], STAGES[stageId]));
}
