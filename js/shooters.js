// v1.5 THE SHOOTER SYSTEM — shared by the mega-stages (Dragon War's fireballs, trebuchet boulders, arrows,
// lava blobs and falling rubble;
// v1.6/v1.7 reskin the same shots). Shots are slow, bright and telegraphed. Every shot is a pure
// function of its launch record (a lerp + an arc), so nothing is integrated and the scripted sim
// reproduces a flight exactly. Spawns come from stage data + the flight's own state, never a random.
// Pure data + maths (no DOM / three.js).
import { isDodging } from './physics.js';

// THE HIT RULE (owner's, locked): NO damage, ever. A hit = a screen shake + speed × 0.99 and a 0.5 s
// grace in which no second hit can land. Mid-barrel-roll (isDodging) every shot passes through.
export const HIT = { keep: 0.99, grace: 0.5, shake: 0.45 };
// A boulder (and falling rubble, the same family) is bonk-strength: the standard hit PLUS a knock
// sideways (still no damage).
export const BOULDER_KICK = 9;
export const KNOCKS = new Set(['boulder', 'rubble']);
export const SHOT_CAP = 24; // alive at once (pooled per flight)

// kind → look + timing. r = hit radius (m). time = seconds in the air (fireballs: chosen per shot from
// their distance at `speed` m/s, clamped). windup = the telegraph before launch. arc = apex height (m).
export const SHOTS = {
  fireball: { r: 1.6, speed: 26, minTime: 1.1, maxTime: 2.2, windup: 0.45, arc: 5, every: 0.22, burst: 3, spread: 2.5 },
  boulder:  { r: 2.6, time: 3.0, windup: 1.4, arc: 46, every: 0, burst: 1, spread: 0 },
  // v1.5 addendum: ARROWS (thinner + faster than fireballs, same hit rule), LAVA blobs from the
  // geysers (a glowing crack is the telegraph) and falling RUBBLE (a shadow on the floor first).
  arrow:    { r: 0.7, speed: 70, minTime: 0.5, maxTime: 1.2, windup: 0.35, arc: 1.5, every: 0.16, burst: 2, spread: 1.5 },
  lava:     { r: 1.5, time: 1.5, windup: 1.0, arc: 22, every: 0, burst: 4, spread: 0 },
  rubble:   { r: 2.2, time: 1.1, windup: 1.2, arc: 0, every: 0, burst: 1, spread: 0 },
};

// One pooled shot record (rewritten in place).
const newShot = () => ({ on: false, kind: 'fireball', who: -1, tTele: 0, t0: 0, T: 1, x0: 0, y0: 0, d0: 0, x1: 0, y1: 0, d1: 0, arc: 0, r: 1, dodged: false, landed: false });
export const createShotPool = (n = SHOT_CAP) => Array.from({ length: n }, newShot);

// Where a shot is at time t (u = 0 at launch → 1 on arrival). `out` = { x, y, d }.
export function shotPos(p, t, out) {
  const u = Math.max(0, Math.min(1, (t - p.t0) / p.T));
  out.x = p.x0 + (p.x1 - p.x0) * u;
  out.d = p.d0 + (p.d1 - p.d0) * u;
  out.y = p.y0 + (p.y1 - p.y0) * u + p.arc * 4 * u * (1 - u);
  return out;
}

// Claim a pooled slot (null when all SHOT_CAP are busy: the shot simply isn't fired).
function claim(pool) {
  for (const p of pool) if (!p.on) return p;
  return null;
}

// Launch one shot from (x0, y0, d0) to (x1, y1, d1). tNow = the flight clock; the shot leaves after
// its windup (the telegraph), so tTele < t0 always.
export function fireShot(pool, kind, who, tNow, from, to, T) {
  const p = claim(pool);
  if (!p) return null;
  const k = SHOTS[kind];
  p.on = true; p.kind = kind; p.who = who; p.tTele = tNow; p.t0 = tNow + k.windup; p.T = T;
  p.x0 = from.x; p.y0 = from.y; p.d0 = from.d; p.x1 = to.x; p.y1 = to.y; p.d1 = to.d;
  p.arc = k.arc; p.r = k.r; p.dodged = false; p.landed = false;
  return p;
}

// A streamed shot's time in the air for a given distance (fireballs slow on purpose; arrows quick).
export function shotTime(kind, dist) {
  const k = SHOTS[kind];
  return k.speed ? Math.max(k.minTime, Math.min(k.maxTime, dist / k.speed)) : k.time;
}
export const fireballTime = (dist) => shotTime('fireball', dist);

const _a = { x: 0, y: 0, d: 0 }, _b = { x: 0, y: 0, d: 0 };
// Closest approach (squared) of the plane and a shot over one step, both moving linearly:
// relative vector r(τ) = r0 + (r1 − r0)·τ, τ ∈ [0, 1].
function closest2(px0, py0, pd0, px1, py1, pd1, p, t0, t1) {
  shotPos(p, t0, _a); shotPos(p, t1, _b);
  const ax = px0 - _a.x, ay = py0 - _a.y, ad = pd0 - _a.d;
  const bx = px1 - _b.x - ax, by = py1 - _b.y - ay, bd = pd1 - _b.d - ad;
  const bb = bx * bx + by * by + bd * bd;
  const tau = bb > 1e-9 ? Math.max(0, Math.min(1, -(ax * bx + ay * by + ad * bd) / bb)) : 0;
  const cx = ax + bx * tau, cy = ay + by * tau, cd = ad + bd * tau;
  return cx * cx + cy * cy + cd * cd;
}

// Apply THE HIT RULE to the flight (and a boulder's sideways knock). Returns true if it landed.
export function applyHit(s, p, P) {
  s.speed = Math.max(P.minAirSpeed, s.speed * HIT.keep);
  s.hitGrace = HIT.grace;
  s.shake = Math.max(s.shake ?? 0, HIT.shake);
  s.hits = (s.hits ?? 0) + 1;
  s.events.push('hit');
  if (p && KNOCKS.has(p.kind)) {
    const away = Math.sign(s.x - p.x1) || (s.x >= 0 ? 1 : -1);
    s.vx += away * BOULDER_KICK;
    s.events.push('boulderHit');
  }
  return true;
}

// Step every live shot against the plane's move (xPrev, yPrev, dPrev) → (s.x, s.y, s.d) over
// [t − dt, t]. Mid-roll a crossing shot passes through ('dodge', once per shot); during the grace
// nothing lands. A shot that hits bursts (its slot frees); one that arrives lands ('boulderLand').
export function stepShots(pool, s, dt, P, xPrev, yPrev, dPrev) {
  const t1 = s.time, t0 = t1 - dt, reach = P.clearance + 0.4;
  for (const p of pool) {
    if (!p.on) continue;
    if (t1 < p.t0) continue;                        // still the telegraph (wind-up / landing shadow)
    if (t0 > p.t0 + p.T) {                          // arrived last step: gone
      p.on = false;
      if (KNOCKS.has(p.kind) && !p.landed) { p.landed = true; s.events.push('boulderLand'); }
      continue;
    }
    if (s.mode !== 'air' && !s.loop) continue;
    const hitR = p.r + reach;
    if (Math.abs(s.d - shotPos(p, t1, _a).d) > hitR + Math.abs(s.d - dPrev) + 8) continue;
    if (closest2(xPrev, yPrev, dPrev, s.x, s.y, s.d, p, Math.max(t0, p.t0), t1) > hitR * hitR) continue;
    if (isDodging(s)) { if (!p.dodged) { p.dodged = true; s.events.push('dodge'); } continue; }
    if ((s.hitGrace ?? 0) > 0) continue;
    applyHit(s, p, P);
    p.on = false;
  }
}
