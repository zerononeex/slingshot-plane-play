// Pure flight physics — no three.js, no DOM, so node tests can run it.
// Coordinates: x = right, y = up, d = metres flown forward from the slingshot.
import { WHEELS, LANDING, BOOST } from './config.js';

const DEG = Math.PI / 180;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

// What the owned plane parts do. No parts = all neutral = the v0 flight.
export function partEffects(parts, pp) {
  const p = parts ?? {};
  const wings = p.leftWing && p.rightWing ? pp.bothWings : p.leftWing ? pp.leftWing : pp.noWings;
  return {
    sinkMul: wings.sinkMul,
    climbCostMul: wings.climbCostMul,
    driftSpeed: wings.driftSpeed ?? 0,   // only ever non-zero with the left wing alone
    rollDeg: wings.rollDeg ?? 0,
    stallSpeed: p.tail ? pp.tail.stallSpeed : null,
    stallSinkMul: p.tail ? pp.tail.stallSinkMul : 1,
    responseMul: p.tail ? pp.tail.responseMul : 1,
    wobbleDeg: p.tail ? 0 : pp.noTailWobbleDeg,
  };
}

// Merge the shared FLIGHT numbers with the engine level, the plane parts, and the
// shop items that change the flight (wheels, band cap for the boost limit).
export function flightParams(flight, engine, effects = null, { wheels = WHEELS[0], band = null } = {}) {
  const e = effects ?? { sinkMul: 1, climbCostMul: 1, driftSpeed: 0, stallSpeed: null, stallSinkMul: 1, responseMul: 1 };
  return {
    ...flight,
    decay: engine.decay,
    sinkMul: e.sinkMul,
    climbCostMul: e.climbCostMul,
    driftSpeed: e.driftSpeed,
    stallSpeed: e.stallSpeed ?? flight.stallSpeed,
    stallSink: flight.stallSink * e.stallSinkMul,
    pitchRateDeg: flight.pitchRateDeg * e.responseMul,
    lateralResponse: flight.lateralResponse * e.responseMul,
    bounceKeep: wheels.keep,
    bouncePop: wheels.pop,
    boostThrust: BOOST.thrust,
    boostCap: (band ? band.launchMax : 30) + BOOST.capOverBand,
  };
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
    momentumLeft: momentum, // s of band momentum left (no decay/drag)
    fuel,                   // s of boost left (refilled free every flight)
    fuelMax: fuel,
    boosting: false,
    peakSpeed: speed,
    landing: null,          // null | perfect | good | rough | bad — judged at first contact
    crashFX: false,         // fire + smoke only for a BAD crash
    scrapeCool: 0,
    ended: null,            // null | 'landed' | 'tumble'
    events: [],             // bounce | touchdown | tumble | scrape | perfect | good — drained by the game
  };
}

// Accept either a bare groundAt(x, d, y) function or a terrain object.
function envOf(env) {
  if (typeof env === 'function') return { groundAt: env, ceilingAt: () => Infinity, hitTest: () => null };
  return env;
}

// Advance one step. input = { x: -1..1 (right +), y: -1..1 (climb +), boost: bool }.
export function stepFlight(s, input, dt, P, envIn) {
  if (s.ended) return s;
  const env = envOf(envIn);
  if (s.momentumLeft > 0) s.momentumLeft = Math.max(0, s.momentumLeft - dt);
  if (s.scrapeCool > 0) s.scrapeCool -= dt;
  s.boosting = false;
  if (s.mode === 'air') stepAir(s, input, dt, P, env);
  else if (s.mode === 'ground') stepGround(s, input, dt, P, env);
  else stepTumble(s, dt, P, env);
  if (s.speed > s.peakSpeed) s.peakSpeed = s.speed;
  return s;
}

function steerLateral(s, input, dt, P, scale, drift = 0) {
  const target = clamp(input.x, -1, 1) * P.lateralSpeed * scale + drift;
  s.vx += (target - s.vx) * Math.min(1, P.lateralResponse * dt);
  s.x += s.vx * dt;
  if (s.x > P.corridorHalfWidth) { s.x = P.corridorHalfWidth; s.vx = Math.min(s.vx, 0); }
  if (s.x < -P.corridorHalfWidth) { s.x = -P.corridorHalfWidth; s.vx = Math.max(s.vx, 0); }
}

function startTumble(s) {
  s.mode = 'tumble';
  s.tumbleT = 0;
  s.landing = 'bad';
  s.crashFX = true;
  s.events.push('tumble');
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

  s.stalled = s.speed < P.stallSpeed;
  const stallAmt = s.stalled ? clamp(1 - (s.speed - P.minAirSpeed) / (P.stallSpeed - P.minAirSpeed), 0, 1) : 0;
  if (s.stalled) target = Math.min(target, 0) - stallAmt * P.stallNoseDropDeg * DEG;
  if (s.y >= P.ceiling) target = Math.min(target, 0);

  const maxTurn = P.pitchRateDeg * DEG * dt;
  s.pitch += clamp(target - s.pitch, -maxTurn, maxTurn);

  // Energy: diving (pitch < 0) adds speed, climbing removes it (wings make climbing cheaper).
  // Decay + drag bleed speed, except while band momentum lasts. Boost pushes, up to its cap.
  const sin = Math.sin(s.pitch);
  const energy = -P.gravity * sin * (sin > 0 ? P.climbCostMul ?? 1 : 1);
  const bleed = s.momentumLeft > 0 ? 0 : P.decay + P.drag * s.speed * s.speed;
  let thrust = 0;
  if (input.boost && s.fuel > 0) {
    s.boosting = true;
    s.fuel = Math.max(0, s.fuel - dt);
    if (s.speed < P.boostCap) thrust = P.boostThrust;
  }
  s.speed = Math.max(P.minAirSpeed, s.speed + (energy - bleed + thrust) * dt);
  if (thrust > 0 && s.speed > P.boostCap) s.speed = Math.max(P.boostCap, s.speed - thrust * dt);

  const xPrev = s.x, dPrev = s.d, yPrev = s.y;
  const forward = s.speed * Math.cos(s.pitch);
  s.vy = s.speed * Math.sin(s.pitch) - stallAmt * P.stallSink * (P.sinkMul ?? 1);
  steerLateral(s, input, dt, P, 1, P.driftSpeed ?? 0);
  s.d += forward * dt;
  s.y = Math.min(P.ceiling, s.y + s.vy * dt);

  // Solid trunks: a proper hit is a Bonk.
  if (env.hitTest(s.x, s.y, s.d, P.clearance)) { s.d = dPrev; startTumble(s); return; }

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

  // Ground rose much more than we came down = we flew into a wall or a face, not onto the ground.
  if (g - (yPrev - P.clearance) > P.faceStep) {
    if (env.groundAt(s.x, dPrev, s.y) > s.y - P.clearance) {
      // Sideways into a wall: push back, small speed loss. Never a Bonk (too shallow).
      s.x = xPrev - Math.sign(s.x - xPrev) * 0.3;
      s.vx = 0;
      scrape(s, P);
    }
    if (env.groundAt(s.x, s.d, s.y) > s.y - P.clearance) {
      // Head-on into a face: a steep (it's a wall) and fast hit Bonks, otherwise scrape back.
      s.d = dPrev;
      if (s.speed > P.crashSpeed) { startTumble(s); return; }
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
export function classifyTouchdown(vy, impactDeg, speed, P) {
  if (impactDeg < -P.crashAngleDeg && speed > P.crashSpeed) return 'bad';
  const a = Math.abs(impactDeg);
  if (vy >= LANDING.perfect.minSink && a <= LANDING.perfect.maxAngleDeg) return 'perfect';
  if (vy >= LANDING.good.minSink && a <= LANDING.good.maxAngleDeg) return 'good';
  return 'rough';
}

function touchGround(s, forward, P, env, g) {
  const slope = slopeAt(s.x, s.d, s.y, env);
  const path = Math.atan2(s.vy, forward);
  const impact = path - slope; // negative = into the ground
  s.y = g + P.clearance;

  const verdict = classifyTouchdown(s.vy, impact / DEG, s.speed, P);
  const first = s.landing === null;
  if (verdict === 'bad') { startTumble(s); return; }
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
  if (env.hitTest(s.x, s.y, s.d, P.clearance)) { s.d = dPrev; startTumble(s); return; }
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
  s.x = clamp(s.x + s.vx * dt, -P.corridorHalfWidth, P.corridorHalfWidth);
  const dPrev = s.d;
  s.d += s.speed * dt;
  const g = env.groundAt(s.x, s.d, s.y);
  if (g > s.y - P.clearance + P.faceStep || env.hitTest(s.x, s.y, s.d, P.clearance)) {
    s.d = dPrev;
    s.speed = 0;
  } else {
    s.y = env.groundAt(s.x, s.d, s.y) + P.clearance;
  }
  if (s.tumbleT >= P.tumbleTime) s.ended = 'tumble';
}
