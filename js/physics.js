// Pure flight physics — no three.js, no DOM, so node tests can run it.
// Coordinates: x = right, y = up, d = metres flown forward from the slingshot.

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

// Merge the shared FLIGHT numbers with the engine level and the plane parts.
// The engine only changes decay; launch power comes from the slingshot.
export function flightParams(flight, engine, effects = null) {
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
  };
}

export function launchSpeedFor(pull, launch, sling) {
  if (pull < launch.weakPull) return launch.flopSpeed;
  const t = clamp((pull - launch.weakPull) / (1 - launch.weakPull), 0, 1);
  return launch.minSpeed + t * (sling.launchMax - launch.minSpeed);
}

export function createFlight({ speed, y, pitchDeg = 0, x = 0, d = 0, momentum = 0 }) {
  return {
    x, y, d,
    speed,
    pitch: pitchDeg * DEG,
    vx: 0,
    vy: 0,
    mode: 'air',      // air | ground | tumble
    stalled: false,
    bounces: 0,
    tumbleT: 0,
    momentumLeft: momentum, // s of slingshot momentum left (no decay/drag)
    ended: null,      // null | 'landed' | 'tumble'
    events: [],       // 'bounce' | 'touchdown' | 'tumble' — drained by the game each frame
  };
}

// Advance one step. input = { x: -1..1 (right +), y: -1..1 (climb +) }.
// groundAt(x, d) returns ground height in metres.
export function stepFlight(s, input, dt, P, groundAt) {
  if (s.ended) return s;
  if (s.momentumLeft > 0) s.momentumLeft = Math.max(0, s.momentumLeft - dt);
  if (s.mode === 'air') stepAir(s, input, dt, P, groundAt);
  else if (s.mode === 'ground') stepGround(s, input, dt, P, groundAt);
  else stepTumble(s, dt, P, groundAt);
  return s;
}

function steerLateral(s, input, dt, P, scale, drift = 0) {
  const target = clamp(input.x, -1, 1) * P.lateralSpeed * scale + drift;
  s.vx += (target - s.vx) * Math.min(1, P.lateralResponse * dt);
  s.x += s.vx * dt;
  if (s.x > P.corridorHalfWidth) { s.x = P.corridorHalfWidth; s.vx = Math.min(s.vx, 0); }
  if (s.x < -P.corridorHalfWidth) { s.x = -P.corridorHalfWidth; s.vx = Math.max(s.vx, 0); }
}

function stepAir(s, input, dt, P, groundAt) {
  const iy = clamp(input.y, -1, 1);
  let target = iy >= 0 ? iy * P.maxClimbDeg * DEG : iy * P.maxDiveDeg * DEG;

  s.stalled = s.speed < P.stallSpeed;
  const stallAmt = s.stalled ? 1 - (s.speed - P.minAirSpeed) / (P.stallSpeed - P.minAirSpeed) : 0;
  if (s.stalled) target = Math.min(target, 0) - clamp(stallAmt, 0, 1) * P.stallNoseDropDeg * DEG;
  if (s.y >= P.ceiling) target = Math.min(target, 0);

  const maxTurn = P.pitchRateDeg * DEG * dt;
  s.pitch += clamp(target - s.pitch, -maxTurn, maxTurn);

  // Energy: diving (pitch < 0) adds speed, climbing removes it (wings make climbing cheaper).
  // Decay + drag bleed speed, except while slingshot momentum lasts.
  const sin = Math.sin(s.pitch);
  const energy = -P.gravity * sin * (sin > 0 ? P.climbCostMul ?? 1 : 1);
  const bleed = s.momentumLeft > 0 ? 0 : P.decay + P.drag * s.speed * s.speed;
  const accel = energy - bleed;
  s.speed = Math.max(P.minAirSpeed, s.speed + accel * dt);

  const forward = s.speed * Math.cos(s.pitch);
  s.vy = s.speed * Math.sin(s.pitch) - clamp(stallAmt, 0, 1) * P.stallSink * (P.sinkMul ?? 1);
  steerLateral(s, input, dt, P, 1, P.driftSpeed ?? 0);
  s.d += forward * dt;
  s.y = Math.min(P.ceiling, s.y + s.vy * dt);

  const g = groundAt(s.x, s.d);
  if (s.y - P.clearance <= g) touchGround(s, forward, P, groundAt, g);
}

function slopeAt(x, d, groundAt) {
  return Math.atan((groundAt(x, d + 1) - groundAt(x, d - 1)) / 2);
}

function touchGround(s, forward, P, groundAt, g) {
  const slope = slopeAt(s.x, s.d, groundAt);
  const path = Math.atan2(s.vy, forward);
  const impact = path - slope; // negative = into the ground
  s.y = g + P.clearance;

  if (impact < -P.crashAngleDeg * DEG && s.speed > P.crashSpeed) {
    s.mode = 'tumble';
    s.tumbleT = 0;
    s.events.push('tumble');
  } else if (s.speed > P.bounceMinSpeed && s.bounces < P.maxBounces && impact < -P.bounceMinAngleDeg * DEG) {
    s.bounces++;
    s.speed *= P.bounceKeep;
    s.pitch = slope + P.bounceUpDeg * DEG;
    s.events.push('bounce');
  } else {
    s.mode = 'ground';
    s.pitch = slope;
    s.events.push('touchdown');
  }
}

function stepGround(s, input, dt, P, groundAt) {
  const slope = slopeAt(s.x, s.d, groundAt);
  s.pitch += (slope - s.pitch) * Math.min(1, 8 * dt);
  s.speed -= (P.groundFriction + P.gravity * Math.sin(slope)) * dt;
  steerLateral(s, input, dt, P, 0.4);
  if (s.speed <= P.stopSpeed) {
    s.speed = 0;
    s.ended = 'landed';
    return;
  }
  s.d += s.speed * Math.cos(slope) * dt;
  const g = groundAt(s.x, s.d);
  if (g < s.y - P.clearance - 0.25) {
    // Rolled off an edge (e.g. the end of the ramp) — back into the air.
    s.mode = 'air';
    s.speed = Math.max(s.speed, P.minAirSpeed);
  } else {
    s.y = g + P.clearance;
  }
  s.vy = 0;
}

function stepTumble(s, dt, P, groundAt) {
  s.tumbleT += dt;
  s.speed = Math.max(0, s.speed - P.tumbleFriction * dt);
  s.vx *= Math.max(0, 1 - 3 * dt);
  s.x = clamp(s.x + s.vx * dt, -P.corridorHalfWidth, P.corridorHalfWidth);
  s.d += s.speed * dt;
  s.y = groundAt(s.x, s.d) + P.clearance;
  if (s.tumbleT >= P.tumbleTime) s.ended = 'tumble';
}
