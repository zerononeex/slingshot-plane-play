// Pure flight physics — no three.js, no DOM, so node tests can run it.
// Coordinates: x = right, y = up, d = metres flown forward from the slingshot.
import { WHEELS, LANDING, BOOST, boostMargin, boostThrustAt } from './config.js';
import { steerGain } from './handling.js';
import { SWING } from './pockets.js';
import { FUN, brakeFloor } from './funlines.js';

const DEG = Math.PI / 180;

// Hitting anything solid (a tree, a pillar, a building face, an asteroid) is a BONK, never a
// crash: the plane keeps 55 % of its speed, is popped up and away, and gets 0.6 s of grace
// so one tree can't bonk twice. The flight goes on.
export const BONK = { keep: 0.55, grace: 0.6, popDeg: 20, kick: 6, back: 0.3, sameFor: 2 };
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

// SKILLS (v0.6 part 2). TILT = knife-edge toggle (needs the Left Wing); LOOP = a full circle
// (needs 20 m/s); ROLL = a barrel roll that sweeps coins; DIVE (hold) = a steep, fast dive.
export const SKILLS = {
  tiltTime: 0.35, tiltSink: 2.5, tiltSteer: 0.8, tiltSpan: 0.3, wingSpan: 1.6,
  loopMinSpeed: 20, loopTime: 1.15, loopExitKeep: 0.95, loopRadius: (v) => clamp(7 + 0.1 * v, 8, 13), // exit was × 0.72
  rollTime: 0.6, rollCooldown: 1.0, rollPickupMul: 2.2, rollDrift: 3,
  diveDeg: -55, diveGravityMul: 1.6,
};
// Coin pickup reach: a ROLL sweeps × 2.2 wider while it lasts.
export const pickupRadiusFor = (s, base) => (s.rollT > 0 ? base * SKILLS.rollPickupMul : base);
// The DODGE window: true mid-barrel-roll (rollT > 0). Projectiles (the mega-stages) pass through.
export const isDodging = (s) => s.rollT > 0;
// The plane's half-width against slot walls: knife-edge, wings out, or just the body.
export const spanOf = (s, P) => (s.tilted ? SKILLS.tiltSpan : (P.lift ?? 1) > 0 ? SKILLS.wingSpan : P.clearance);

// TILT toggle. Blocked without the Left Wing (P.canTilt), on the ground and mid-loop.
export function toggleTilt(s, P) {
  if (!P.canTilt || s.mode !== 'air' || s.loop || s.ended) return false;
  s.tilted = !s.tilted;
  s.events.push(s.tilted ? 'tiltOn' : 'tiltOff');
  return true;
}
// LOOP: below 20 m/s it refuses ('loopSlow'); else a 1.15 s circle from here.
export function tryLoop(s) {
  if (s.mode !== 'air' || s.loop || s.ended) return false;
  if (s.speed < SKILLS.loopMinSpeed) { s.events.push('loopSlow'); return false; }
  if (s.tilted) s.tilted = false;
  s.loop = { t: 0, R: SKILLS.loopRadius(s.speed), d0: s.d, y0: s.y, x: s.x, rings: new Set(), thread: new Map() };
  s.events.push('loop');
  return true;
}
// ROLL: 0.6 s barrel roll toward `dir` (−1 left, +1 right), 1.0 s cooldown, no speed cost: decay + drag
// are paused while it lasts (it holds your speed), and it is the dodge (isDodging).
export function tryRoll(s, dir = 1) {
  if (s.mode !== 'air' || s.loop || s.ended || s.rollCool > 0) return false;
  s.rollT = SKILLS.rollTime;
  s.rollCool = SKILLS.rollCooldown;
  s.rollDir = dir < 0 ? -1 : 1;
  s.events.push('roll');
  return true;
}

// v1.9 LOOP RINGS PAY: threading any pink ring pays (once per flight per ring) — on a loop or straight through.
export const LOOP_RINGS = 8;
function payLoopRing(s, lr) {
  if (s.used.has(lr.id + 'loopRing')) return;
  s.used.add(lr.id + 'loopRing');
  s.events.push('loopRing');
}

// The loop itself: a full vertical circle (back to where it started), then exit at × 0.95.
function stepLoop(s, dt, P, env) {
  const L = s.loop;
  L.t += dt;
  const th = Math.min(1, L.t / SKILLS.loopTime) * Math.PI * 2;
  s.d = L.d0 + L.R * Math.sin(th);
  s.y = L.y0 + L.R * (1 - Math.cos(th));
  s.pitch = th;
  s.vy = 0;
  const lr = env.loopRingAt ? env.loopRingAt(s.x, s.y, s.d) : null;
  if (lr) {
    payLoopRing(s, lr);
    // v1.9: what THIS loop threads, per formation (lap:set), whether or not a ring was paid before
    const key = lr.id.slice(0, lr.id.lastIndexOf('.'));
    if (!L.thread.has(key)) L.thread.set(key, new Set());
    L.thread.get(key).add(lr.ring.k);
  }
  // v1.5 LOOP DOORS: the door key rings this loop threads (both = the door opens when the loop ends).
  const kr = env.keyRingAt ? env.keyRingAt(s.x, s.y, s.d) : null;
  if (kr) {
    const key = `${kr.i}:${kr.key}`;
    if (!(L.keys ??= new Set()).has(key)) { L.keys.add(key); s.events.push('keyRing'); }
  }
  const hit = solidHit(s, env, P);
  const g = env.groundAt(s.x, s.d, s.y);
  if (hit || s.y - P.clearance < g) { // clipped something: the loop breaks off
    s.loop = null;
    s.pitch = 0;
    if (s.y - P.clearance < g) s.y = g + P.clearance + 0.1;
    if (hit) bonk(s, hit, P);
    return;
  }
  if (L.t >= SKILLS.loopTime) {
    s.loop = null;
    s.lastLoop = { d0: L.d0, y0: L.y0, R: L.R, x: L.x };
    s.d = L.d0; s.y = L.y0; s.pitch = 0;
    s.speed *= SKILLS.loopExitKeep;
    s.events.push('loopEnd');
    // v1.9 PERFECT LOOP: every ring of one formation threaded inside ONE loop — once per flight per formation
    for (const [key, ks] of L.thread) if (ks.size >= LOOP_RINGS && !s.used.has(key + 'perfectLoop')) { s.used.add(key + 'perfectLoop'); s.events.push('perfectLoop'); }
    if (L.keys && env.loopDone) env.loopDone(s, L.keys); // v1.5: a keyed loop opens its door in advance
  }
}

// What the owned plane parts do. No parts = all neutral = the v0 flight.
export function partEffects(parts, pp) {
  const p = parts ?? {};
  const wings = p.leftWing && p.rightWing ? pp.bothWings : p.leftWing ? pp.leftWing : pp.noWings;
  return {
    sinkMul: wings.sinkMul,
    climbCostMul: wings.climbCostMul,
    lift: wings.lift ?? 1,
    driftSpeed: wings.driftSpeed ?? 0,   // only ever non-zero with the left wing alone
    rollDeg: wings.rollDeg ?? 0,
    stallSpeed: p.tail ? pp.tail.stallSpeed : null,
    stallSinkMul: p.tail ? pp.tail.stallSinkMul : 1,
    responseMul: p.tail ? pp.tail.responseMul : 1,
    wobbleDeg: p.tail ? 0 : pp.noTailWobbleDeg,
  };
}

// Merge the shared FLIGHT numbers with the engine level, the plane parts, the shop
// items that change the flight (wheels, band cap for the boost limit), the stage's
// plane (decay/glide multipliers) and the stage's modifiers (soft snow, water).
const STOCK_PLANE = { decayMul: 1, glideMul: 1 };
export function flightParams(flight, engine, effects = null, { wheels = WHEELS[0], band = null, plane = STOCK_PLANE, modifiers = {}, fun = null, handling = 1 } = {}) {
  const steer = steerGain(handling); // v1.9: the base raise (× 1.15) × the HANDLING line (Lv1 × 1 → Lv10 × 1.6)
  const e = effects ?? { sinkMul: 1, climbCostMul: 1, driftSpeed: 0, stallSpeed: null, stallSinkMul: 1, responseMul: 1 };
  const snow = modifiers.softSnow;
  const lowG = modifiers.lowGravity;
  const thin = modifiers.thinAir;           // Jetstream: drag × 0.5, lift × 0.85 for every plane
  const g = lowG ? lowG.gravityScale : 1;
  const P = {
    ...flight,
    gravity: flight.gravity * g,              // low gravity: climbing costs and diving gains soften
    gravityScale: g,
    decay: engine.decay * plane.decayMul,
    drag: flight.drag * plane.glideMul * (thin ? thin.dragMul : 1),
    fastDecayMul: plane.fastDecayMul ?? 1,     // the Sky Dart: × 0.8 when fast…
    slowDecayMul: plane.slowDecayMul ?? 1,     // …× 1.3 below slowBelow m/s
    slowBelow: plane.slowBelow ?? 0,
    sinkMul: e.sinkMul,
    climbCostMul: e.climbCostMul,
    lift: (e.lift ?? 1) * (plane.liftMul ?? 1) * (thin ? thin.liftMul : 1), // no parts given (generic tests) = full lift
    noLiftCarry: plane.noLiftCarry ?? flight.noLiftCarry, // per-plane wingless launch carry (v0.6 part 2)
    driftSpeed: e.driftSpeed,
    // A plane's own stall speed (biplane 8, jet 16) replaces the stock 11; the tail lowers it by the same 9/11.
    stallSpeed: plane.stallSpeed ? plane.stallSpeed * (e.stallSpeed ?? flight.stallSpeed) / flight.stallSpeed : e.stallSpeed ?? flight.stallSpeed,
    stallSink: flight.stallSink * e.stallSinkMul * g, // …and you sink slower
    pitchRateDeg: flight.pitchRateDeg * e.responseMul * steer,
    lateralResponse: flight.lateralResponse * e.responseMul * steer,
    lateralSpeed: flight.lateralSpeed * (plane.steerMul ?? 1) * steer, // v1.2 the Void Runner steers × 1.1 (precision at 250 m/s)
    steerGain: steer,
    bounceKeep: snow ? Math.min(0.97, wheels.keep + snow.keepBonus) : wheels.keep,
    bouncePop: wheels.pop,
    landingSinkBonus: (snow ? snow.sinkBonus : 0) + (lowG ? lowG.sinkBonus : 0),
    water: modifiers.water ?? null,
    boostThrust: modifiers.warp ? modifiers.warp.boostThrust : boostThrustAt(band?.level ?? 1), // Space: the WARP TANK; v1.9: grows with the band level
    boostCap: (band ? band.launchMax : 30) + boostMargin(band?.level ?? 1), // v1.9: the margin grows with the band level (Lv1: + 10, as before)
    windCap: (band ? band.launchMax : 30) + BOOST.capOverBand,              // tailwinds: always + 10 (unchanged)
  };
  // v1.0 fun lines that touch the flight (only when owned: everything else is exactly as before).
  if (fun?.brakes) P.brakeDecel = FUN.brakes.decel[fun.brakes];
  if (fun?.balloons) {
    P.balloonSink = FUN.balloons.sink[fun.balloons] * (plane.balloonMul ?? 1); // per-plane trim (BALANCE.md)
    P.bouncePop = P.bouncePop * (1 - 0.4 * P.balloonSink);                       // landings bounce a touch softer
  }
  return P;
}

export function launchSpeedFor(pull, launch, band) {
  if (pull < launch.weakPull) return launch.flopSpeed;
  const t = clamp((pull - launch.weakPull) / (1 - launch.weakPull), 0, 1);
  return launch.minSpeed + t * (band.launchMax - launch.minSpeed);
}

export function createFlight({ speed, y, pitchDeg = 0, x = 0, d = 0, momentum = 0, fuel = 0, hold = 0 }) {
  return {
    x, y, d,
    speed,
    pitch: pitchDeg * DEG,
    launchPitch: pitchDeg * DEG,
    holdLeft: hold,         // s the nose keeps the ramp angle (unless you push down)
    vx: 0,
    vy: 0,
    mode: 'air',            // air | ground | tumble
    stalled: false,
    bounces: 0,
    tumbleT: 0,
    time: 0,                // s since launch
    tilted: false, tiltT: 0, // TILT: knife-edge (tiltT animates 0 → 1)
    loop: null, lastLoop: null,
    rollT: 0, rollCool: 0, rollDir: 1,
    diving: false,
    swing: null,            // a sub-area swing in progress (§9)
    lane: null,             // inside a sub-area: { cx, half, pocket, lap, end }
    bumps: [],              // bumpables hit this flight ({ b, id, lap }), drained by the game
    chain: null,            // a slalom course in progress { course, next, lap }
    noseUp: 0,              // extra nose-up (looks only) when a wingless plane holds "up"
    bonkGrace: 0,           // seconds of collision grace after a bonk
    hitGrace: 0, shake: 0, hits: 0, doorBonks: 0, hz: null, // v1.5 mega-stages: projectile grace, screen shake, per-flight hazard state
    bonks: 0,
    bonkWith: null,
    bonkWithT: 0,         // the obstacle last bonked (can't bonk again until you leave it)
    lastBonk: null,         // kind of the last thing bonked (for the bits it throws)
    momentumLeft: momentum, // s of band momentum left (no decay/drag)
    fuel,                   // s of boost left (refilled free every flight)
    fuelMax: fuel,
    boosting: false,
    peakSpeed: speed,
    landing: null,          // null | perfect | good | rough | bad — judged at first contact
    crashFX: false,         // fire + smoke only for a BAD crash
    scrapeCool: 0,
    used: new Set(),        // arches / rings / dust devils already used this flight
    inUpdraft: false,
    ended: null,            // null | 'landed' | 'tumble'
    events: [],             // bounce | touchdown | tumble | scrape | perfect | good | arch | ring | devil | updraft | splash | bigSplash
  };
}

// Accept either a bare groundAt(x, d, y) function or a terrain object.
const NO_FX = { lift: 0, push: 0, gust: 0, updraft: null, water: null };
function envOf(env) {
  if (typeof env === 'function') return { groundAt: env, ceilingAt: () => Infinity, hitTest: () => null };
  return env;
}
const _cross = [];

// Advance one step. input = { x: -1..1 (right +), y: -1..1 (climb +), boost: bool }.
export function stepFlight(s, input, dt, P, envIn) {
  if (s.ended) return s;
  const env = envOf(envIn);
  s.time += dt;
  if (s.momentumLeft > 0) s.momentumLeft = Math.max(0, s.momentumLeft - dt);
  if (s.scrapeCool > 0) s.scrapeCool -= dt;
  if (s.bonkGrace > 0) s.bonkGrace = Math.max(0, s.bonkGrace - dt);
  if (s.bonkWithT > 0) s.bonkWithT -= dt;
  if (s.rollT > 0) s.rollT = Math.max(0, s.rollT - dt);
  if (s.rollCool > 0) s.rollCool = Math.max(0, s.rollCool - dt);
  s.tiltT = clamp(s.tiltT + (s.tilted ? dt : -dt) / SKILLS.tiltTime, 0, 1); // 0.35 s to knife-edge and back
  s.boosting = false;
  if (s.mode !== 'air') { s.loop = null; s.tilted = false; }
  if (s.swing && s.mode !== 'air') stepSwing(s, dt, P, env); // a landing mid-swing still finishes it
  if (s.loop) stepLoop(s, dt, P, env);
  else if (s.mode === 'air') stepAir(s, input, dt, P, env);
  else if (s.mode === 'ground') stepGround(s, input, dt, P, env);
  else stepTumble(s, dt, P, env);
  if (env.stepHazards) env.stepHazards(s, dt, P); // v1.5 the mega-stages: shots + loop doors (shooters.js, loopdoors.js)
  if (s.speed > s.peakSpeed) s.peakSpeed = s.speed;
  return s;
}

// The lateral limits: the main corridor, or (in a sub-area) the pocket lane.
export const laneOf = (s, P) => (s.lane ? { lo: s.lane.cx - s.lane.half, hi: s.lane.cx + s.lane.half } : { lo: -P.corridorHalfWidth, hi: P.corridorHalfWidth });

// Returns true when the plane was pushed against the corridor edge this step (never in a pocket).
function steerLateral(s, input, dt, P, scale, drift = 0) {
  if (s.swing) return false; // the swing owns x
  const target = clamp(input.x, -1, 1) * P.lateralSpeed * scale + drift;
  s.vx += (target - s.vx) * Math.min(1, P.lateralResponse * dt);
  s.x += s.vx * dt;
  const pushing = Math.abs(s.vx) > 1.5 && !s.lane;
  const L = laneOf(s, P);
  if (s.x > L.hi) { s.x = L.hi; s.vx = Math.min(s.vx, 0); return pushing; }
  if (s.x < L.lo) { s.x = L.lo; s.vx = Math.max(s.vx, 0); return pushing; }
  return false;
}

// SUB-AREAS: a ~1.1 s cinematic swing into a pocket (enter) or back to the corridor (exit).
// x eases from → to while the flight carries on forward (distance keeps counting); bonks are
// suspended and the plane rides over the ground. Then the pocket lane (or the corridor) takes over.
function startSwing(s, pocket, lap, enter) {
  s.swing = { t: 0, from: s.x, to: enter ? pocket.cx : pocket.exitX, enter, pocket: pocket.index, lap, end: pocket.end, half: pocket.half, cx: pocket.cx };
  s.lane = null;
  s.vx = 0;
  if (s.tilted) s.tilted = false;
  s.events.push(enter ? 'swingIn' : 'swingOut');
}
function stepSwing(s, dt, P, env) {
  const w = s.swing;
  w.t += dt;
  const k = Math.min(1, w.t / SWING.time);
  s.x = w.from + (w.to - w.from) * k * k * (3 - 2 * k);
  const g = env.groundAt(s.x, s.d, s.y) + P.clearance + 0.5;
  if (s.y < g) s.y += (g - s.y) * Math.min(1, 12 * dt); // ride over, never through, the ground
  if (k >= 1) {
    s.swing = null;
    s.lane = w.enter ? { cx: w.cx, half: w.half, pocket: w.pocket, lap: w.lap, end: w.end } : null;
    s.events.push(w.enter ? 'pocketIn' : 'pocketOut');
  }
}

function startTumble(s) {
  s.mode = 'tumble';
  s.tumbleT = 0;
  s.landing = 'bad';
  s.crashFX = true;
  s.events.push('tumble');
}

// The obstacle to bonk on this step, if any. Never during the grace, and never the same
// obstacle again while you are still in it or for BONK.sameFor seconds (trunk → its canopy).
function solidHit(s, env, P) {
  if (s.swing) return null; // a sub-area swing: bonks are suspended
  const hit = env.hitTest(s.x, s.y, s.d, P.clearance, spanOf(s, P), s.time);
  if (!hit) { if (s.bonkGrace <= 0 && s.bonkWithT <= 0) s.bonkWith = null; return null; }
  if (s.bonkGrace > 0 || hit === s.bonkWith) return null;
  return hit;
}

// SLALOM COURSES: gate 0 starts a chain; each next gate in order extends it; all 5 = COURSE CLEAR
// (+20), once per course per lap. Missing one ends the chain silently (checked in stepAir).
function courseGate(s, c) {
  if (c.k === 0) s.chain = { course: c.course, next: 1, lap: c.lap };
  else if (s.chain && s.chain.course === c.course && s.chain.next === c.k) s.chain.next++;
  else return;
  if (s.chain.next === 5) {
    const key = `${c.lap}:${c.course}courseClear`;
    if (!s.used.has(key)) { s.used.add(key); s.events.push('courseClear'); }
    s.chain = null;
  }
}

// hit = the obstacle (has x or cx), or null for a terrain face (bounce straight back).
function bonk(s, hit, P) {
  s.bonkWith = hit;
  s.bonkWithT = BONK.sameFor;
  s.speed = Math.max(P.minAirSpeed, s.speed * BONK.keep);
  s.bonkGrace = BONK.grace;
  s.bonks++;
  s.lastBonk = hit ? hit.kind ?? 'rock' : 'face';
  const hx = hit ? hit.cx ?? hit.x : undefined;
  if (hx !== undefined && !hit.w) { // sideways off its middle (arch rock just pushes back)
    const away = Math.sign(s.x - hx) || (s.x >= 0 ? 1 : -1);
    s.vx = away * BONK.kick;
    s.x += away * BONK.back;
  }
  s.d -= BONK.back;
  s.mode = 'air';
  s.pitch = Math.max(s.pitch, BONK.popDeg * DEG);
  s.holdLeft = 0;
  s.events.push('bonk');
}

function scrape(s, P, amount = P.scrapeLoss) {
  if (s.scrapeCool > 0) return;
  s.speed = Math.max(P.minAirSpeed, s.speed - amount);
  s.scrapeCool = 0.3;
  s.events.push('scrape');
}

function stepAir(s, input, dt, P, env) {
  const iy = clamp(input.y ?? 0, -1, 1);
  let target = iy >= 0 ? iy * P.maxClimbDeg * DEG : iy * P.maxDiveDeg * DEG;
  if (s.holdLeft > 0) {
    s.holdLeft -= dt;
    if (iy >= 0) target = Math.max(target, s.launchPitch);
  }

  // Stage gimmicks at this spot: updraft lift, tailwind push, side gusts.
  const zone = env.effectsAt ? env.effectsAt(s.x, s.y, s.d) : NO_FX;
  const inUp = zone.lift > 0;
  // v1.6 UNDERWATER (a mega-stage sector's flags, like the wind flags): sink × sink, a gentle upward
  // drift, drag × drag. Null everywhere else, so no other world changes.
  const wat = zone.water ?? null, sinkK = wat ? wat.sink : 1;
  if (!!wat !== !!s.underwater) { s.underwater = !!wat; s.events.push(wat ? 'underwater' : 'surfaced'); }
  if (inUp && !s.inUpdraft) s.events.push('updraft');
  s.inUpdraft = inUp;

  s.stalled = s.speed < P.stallSpeed;
  const stallAmt = s.stalled ? clamp(1 - (s.speed - P.minAirSpeed) / (P.stallSpeed - P.minAirSpeed), 0, 1) : 0;
  if (s.stalled) target = Math.min(target, 0) - stallAmt * P.stallNoseDropDeg * DEG;
  if (s.y >= P.ceiling) target = Math.min(target, 0);
  // TILT: no climbing on knife-edge. DIVE (held): nose down to −55°.
  if (s.tilted) target = Math.min(target, 0);
  const diving = !!input.dive && P.canDive;
  s.diving = diving;
  if (diving) target = SKILLS.diveDeg * DEG;

  const lift = P.lift ?? 1;
  if (lift <= 0) {
    // No wings: up can't make a climb. The path bends down like a thrown dart toward a
    // shallow glide; pushing down still dives; a dive flattens back slowly (a little zoom).
    const glide = P.noLiftGlideDeg * DEG;
    const want = iy < 0 ? Math.min(iy * P.maxDiveDeg * DEG, glide) : glide;
    // The launch carry: while the band's push lasts (hold + momentum window) the dart rides its launch line.
    const carry = iy >= 0 && (s.holdLeft > 0 || s.momentumLeft > 0 || s.time < P.noLiftCarry);
    const tgt = carry ? Math.max(want, s.launchPitch) : s.stalled ? Math.min(want, target) : want;
    const down = (P.gravity * sinkK * Math.cos(s.pitch)) / Math.max(s.speed, 4) * dt;  // ballistic bend
    const up = P.pitchRateDeg * P.noLiftRecoverRate * DEG * dt;                         // dive flattening
    const turnDown = iy < 0 || s.stalled ? Math.max(down, P.pitchRateDeg * DEG * dt) : down;
    s.pitch += clamp(tgt - s.pitch, -turnDown, up);
    s.noseUp += ((iy > 0 ? iy * P.noLiftNoseDeg * DEG : 0) - s.noseUp) * Math.min(1, 6 * dt);
  } else {
    // Wings: the nose (and path) follows the finger; one wing climbs at 60 % of the angle,
    // the Barnstormer's eager wings at 115 %.
    if (target > 0) target *= lift;
    const maxTurn = P.pitchRateDeg * DEG * dt;
    s.pitch += clamp(target - s.pitch, -maxTurn, maxTurn);
    s.noseUp = 0;
  }

  // Energy: diving (pitch < 0) adds speed, climbing removes it (wings make climbing cheaper).
  // Decay + drag bleed speed, except while band momentum lasts. Boost pushes, up to its cap.
  const sin = Math.sin(s.pitch);
  const energy = -P.gravity * sinkK * sin * (sin > 0 ? P.climbCostMul ?? 1 : 1) * (diving ? SKILLS.diveGravityMul : 1);
  const carrying = s.holdLeft > 0 || s.momentumLeft > 0 || ((P.lift ?? 1) <= 0 && s.time < P.noLiftCarry);
  const upBleed = (P.lift ?? 1) <= 0 && iy > 0 && !carrying ? P.noLiftUpBleed * iy : 0; // nose up with no wings = drag
  const pushed = s.momentumLeft > 0 || ((P.lift ?? 1) <= 0 && s.time < P.noLiftCarry); // band push: no decay/drag
  const decay = P.decay * (s.speed < (P.slowBelow ?? 0) ? P.slowDecayMul ?? 1 : P.fastDecayMul ?? 1);
  const bleed = (pushed || s.rollT > 0 ? 0 : (decay + P.drag * s.speed * s.speed) * (wat ? wat.drag : 1)) + upBleed; // a ROLL pauses decay + drag (v1.6: water is thick)
  let thrust = 0;
  if (input.boost && s.fuel > 0) {
    s.boosting = true;
    s.fuel = Math.max(0, s.fuel - dt);
    if (s.speed < P.boostCap) thrust = P.boostThrust;
  }
  // Tailwind: a push forward (never past the boost cap). A v1.2 slipstream only catches a fast plane (pushMin).
  const wind = zone.push > 0 && s.speed < P.windCap && s.speed >= (zone.pushMin ?? 0) ? zone.push : 0;
  s.speed = Math.max(P.minAirSpeed, s.speed + (energy - bleed + thrust + wind) * dt);
  const pushCap = thrust > 0 ? P.boostCap : P.windCap; // v1.9: the boost's own margin; tailwinds keep + 10
  if ((thrust > 0 || wind > 0) && s.speed > pushCap) s.speed = Math.max(pushCap, s.speed - (thrust + wind) * dt);
  // v1.0 SPOILER BRAKES (held): strong drag, but never below stall + 2 m/s (it can't stall you out).
  if (P.brakeDecel) {
    s.braking = !!input.brake;
    if (s.braking) { const floor = brakeFloor(P); if (s.speed > floor) s.speed = Math.max(floor, s.speed - P.brakeDecel * dt); }
  }

  const xPrev = s.x, dPrev = s.d, yPrev = s.y;
  const forward = s.speed * Math.cos(s.pitch);
  // Updraft: the stall sink is cancelled and the air lifts you — at no speed cost.
  s.vy = s.speed * Math.sin(s.pitch) - (inUp ? 0 : stallAmt * P.stallSink * (P.sinkMul ?? 1) * sinkK) + zone.lift - s.tiltT * SKILLS.tiltSink * sinkK + (wat ? wat.drift : 0); // tilted: lift fades to a gentle sink
  // v1.0 HELIUM BALLOONS: a gentler sink during unpowered glide only (not boosting, not climbing).
  if (P.balloonSink && !s.boosting && s.vy < 0) s.vy *= 1 - P.balloonSink;
  const steer = s.tilted ? SKILLS.tiltSteer : 1;
  const rollDrift = s.rollT > 0 ? s.rollDir * SKILLS.rollDrift : 0;
  if (steerLateral(s, input, dt, P, steer, (P.driftSpeed ?? 0) + zone.gust + rollDrift) && env.edgeWalls) scrape(s, P); // cliff / building walls
  s.d += forward * dt;
  s.y = Math.min(P.ceiling, s.y + s.vy * dt);

  // v1.9 a pink loop ring flown straight through pays too.
  if (env.loopRingAt) { const lr = env.loopRingAt(s.x, s.y, s.d); if (lr) payLoopRing(s, lr); }
  // Through an arch opening or a ring: once each per flight.
  if (env.crossings) {
    _cross.length = 0;
    for (const c of env.crossings(xPrev, yPrev, dPrev, s.x, s.y, s.d, _cross)) {
      if (s.used.has(c.id + c.type)) continue;
      if (c.type === 'slot' && (!s.tilted || s.bonkGrace > 0)) continue; // the slot's treasure is for a clean knife-edge pass
      if (c.type === 'courseGate') { courseGate(s, c); continue; }
      if (c.type === 'portal') { if (!s.lane && !s.swing && env.pockets) startSwing(s, env.pockets[c.pocket], c.lap, true); continue; }
      s.used.add(c.id + c.type);
      // A speed gate pays more if you're fast: 'gateFast' / 'gateSlow'.
      s.events.push(c.type === 'gate' ? (s.speed >= (P.gateFast ?? 40) ? 'gateFast' : 'gateSlow') : c.type);
    }
  }
  // BUMPABLES: a soft bump — a little speed (× 0.90 / big × 0.85), never a bonk; once per flight each.
  if (env.bumpAt) {
    const bp = env.bumpAt(s.x, s.y, s.d, P.clearance);
    if (bp && !s.used.has(bp.id + 'bump')) {
      s.used.add(bp.id + 'bump');
      s.speed = Math.max(P.minAirSpeed, s.speed * bp.b.slow);
      s.bumps.push(bp);
      s.events.push('bump');
    }
  }
  // The pocket's end: swing back to the main corridor.
  if (s.lane && env.pockets && (env.local(s.d) >= s.lane.end || Math.floor(s.d / env.cycle) !== s.lane.lap)) startSwing(s, env.pockets[s.lane.pocket], s.lane.lap, false);
  if (s.swing) stepSwing(s, dt, P, env);
  // A course chain ends silently if you fly past the next gate without going through it.
  if (s.chain && env.courses) {
    const g = env.courses[s.chain.course]?.gates[s.chain.next];
    if (!g || env.local(s.d) > g.d + 2 || Math.floor(s.d / env.cycle) !== s.chain.lap) s.chain = null;
  }
  // Dust devil: a swirling boost, once per devil.
  if (env.devilAt) {
    const dv = env.devilAt(s.x, s.y, s.d);
    if (dv && !s.used.has(`devil${dv.id}`)) {
      s.used.add(`devil${dv.id}`);
      s.speed += env.stage.devilBoost.speed;
      s.pitch = Math.max(s.pitch, env.stage.devilBoost.pitchDeg * DEG);
      s.events.push('devil');
    }
  }

  // Solid obstacles (trees, pillars, towers, arch rock, asteroids): a Bonk.
  const hit = solidHit(s, env, P);
  if (hit) { s.d = dPrev; s.x = xPrev; bonk(s, hit, P); return; }

  // Tunnel roof: scrape along it.
  const roof = env.ceilingAt(s.x, s.d);
  if (s.y + P.clearance > roof && yPrev + P.clearance <= roof + 0.01) {
    s.y = roof - P.clearance;
    if (s.pitch > 0) s.pitch = 0;
    s.speed = Math.max(P.minAirSpeed, s.speed - P.roofScrapeDecel * dt);
    if (s.scrapeCool <= 0) { s.events.push('scrape'); s.scrapeCool = 0.3; }
  }

  let g = env.groundAt(s.x, s.d, s.y);
  if (s.y - P.clearance > g) return;
  if (s.swing) { s.y = g + P.clearance; return; } // mid-swing: ride over the ground (no face bonks)

  // Ground rose much more than we came down = we flew into a wall or a face, not onto the ground.
  if (g - (yPrev - P.clearance) > P.faceStep) {
    if (env.groundAt(s.x, dPrev, s.y) > s.y - P.clearance) {
      // Sideways into a wall: push back, small speed loss. Never a Bonk (too shallow).
      s.x = xPrev - Math.sign(s.x - xPrev) * 0.3;
      s.vx = 0;
      scrape(s, P);
    }
    if (env.groundAt(s.x, s.d, s.y) > s.y - P.clearance) {
      // Head-on into a face (mesa, building, pyramid wall): fast = a Bonk back off it, else scrape back.
      s.d = dPrev;
      if (s.speed > P.crashSpeed && s.bonkGrace <= 0) { bonk(s, null, P); return; }
      s.d -= 0.3;
      scrape(s, P);
    }
    g = env.groundAt(s.x, s.d, s.y);
    if (s.y - P.clearance > g) return;
  }
  touchGround(s, forward, P, env, g);
}

function slopeAt(x, d, y, env) {
  return Math.atan((env.groundAt(x, d + 1, y) - env.groundAt(x, d - 1, y)) / 2);
}

// Landing classification (first contact) + bounce / roll / tumble.
// Soft snow widens the sink limits by P.landingSinkBonus m/s.
export function classifyTouchdown(vy, impactDeg, speed, P) {
  if (impactDeg < -P.crashAngleDeg && speed > P.crashSpeed) return 'bad';
  const a = Math.abs(impactDeg);
  const bonus = P.landingSinkBonus ?? 0;
  if (vy >= LANDING.perfect.minSink - bonus && a <= LANDING.perfect.maxAngleDeg) return 'perfect';
  if (vy >= LANDING.good.minSink - bonus && a <= LANDING.good.maxAngleDeg) return 'good';
  return 'rough';
}

function touchGround(s, forward, P, env, g) {
  const slope = slopeAt(s.x, s.d, s.y, env);
  const path = Math.atan2(s.vy, forward);
  const impact = path - slope; // negative = into the ground
  s.y = g + P.clearance;

  const verdict = classifyTouchdown(s.vy, impact / DEG, s.speed, P);
  const first = s.landing === null;
  const onWater = P.water && env.surfaceKind && env.surfaceKind(s.x, s.d, s.y) === 'water';
  if (verdict === 'bad') { if (onWater) s.events.push('bigSplash'); startTumble(s); return; }
  if (onWater) {
    // Floats! Water never grades better than ROUGH: splash-bounce, or settle and float.
    if (first) s.landing = 'rough';
    s.events.push('splash');
    if (s.speed > P.bounceMinSpeed) {
      s.bounces++;
      s.speed *= P.water.keep;
      s.pitch = slope + Math.asin(Math.min(0.9, P.water.pop / Math.max(s.speed, 1)));
    } else {
      s.mode = 'ground';
      s.pitch = slope;
    }
    return;
  }
  if (first) s.landing = verdict;

  if (first && (verdict === 'perfect' || verdict === 'good')) {
    s.mode = 'ground';
    s.pitch = slope;
    s.events.push(verdict);
  } else if (s.speed > P.bounceMinSpeed && s.bounces < P.maxBounces && impact < -P.bounceMinAngleDeg * DEG) {
    s.bounces++;
    s.speed *= P.bounceKeep;
    s.pitch = slope + Math.asin(Math.min(0.9, P.bouncePop / Math.max(s.speed, 1)));
    s.events.push('bounce');
  } else {
    s.mode = 'ground';
    s.pitch = slope;
    s.events.push('touchdown');
  }
}

function stepGround(s, input, dt, P, env) {
  const slope = slopeAt(s.x, s.d, s.y, env);
  s.pitch += (slope - s.pitch) * Math.min(1, 8 * dt);
  s.speed -= (P.groundFriction + P.gravity * Math.sin(slope)) * dt;
  steerLateral(s, input, dt, P, 0.4);
  if (s.speed <= P.stopSpeed) {
    s.speed = 0;
    s.ended = 'landed';
    return;
  }
  const dPrev = s.d;
  s.d += s.speed * Math.cos(slope) * dt;
  const hit = solidHit(s, env, P);
  if (hit) { s.d = dPrev; s.y += 0.2; bonk(s, hit, P); return; } // rolled into it: hop off
  const g = env.groundAt(s.x, s.d, s.y);
  if (g > s.y - P.clearance + P.faceStep) {
    // Rolled into a wall: stop there.
    s.d = dPrev;
    s.speed = 0;
    s.ended = 'landed';
    return;
  }
  if (g < s.y - P.clearance - 0.25) {
    // Rolled off an edge (the ramp, into a ditch) — back into the air.
    s.mode = 'air';
    s.speed = Math.max(s.speed, P.minAirSpeed);
  } else {
    s.y = g + P.clearance;
  }
  s.vy = 0;
}

function stepTumble(s, dt, P, env) {
  s.tumbleT += dt;
  s.speed = Math.max(0, s.speed - P.tumbleFriction * dt);
  s.vx *= Math.max(0, 1 - 3 * dt);
  const L = laneOf(s, P);
  s.x = clamp(s.x + s.vx * dt, L.lo, L.hi);
  const dPrev = s.d;
  s.d += s.speed * dt;
  const g = env.groundAt(s.x, s.d, s.y);
  if (g > s.y - P.clearance + P.faceStep || env.hitTest(s.x, s.y, s.d, P.clearance, P.clearance, s.time)) {
    s.d = dPrev;
    s.speed = 0;
  } else {
    s.y = env.groundAt(s.x, s.d, s.y) + P.clearance;
  }
  if (s.tumbleT >= P.tumbleTime) s.ended = 'tumble';
}
