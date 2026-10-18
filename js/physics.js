// Pure flight physics — no three.js, no DOM, so node tests can run it.
// Coordinates: x = right, y = up, d = metres flown forward from the slingshot.

const DEG = Math.PI / 180;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

// Merge the shared FLIGHT numbers with the current engine level's numbers.
export function flightParams(flight, engine) {
  return { ...flight, decay: engine.decay };
}

export function launchSpeedFor(pull, launch, engine) {
  if (pull < launch.weakPull) return launch.flopSpeed;
  const t = clamp((pull - launch.weakPull) / (1 - launch.weakPull), 0, 1);
  return launch.minSpeed + t * (engine.launchMax - launch.minSpeed);
}

export function createFlight({ speed, y, pitchDeg = 0, x = 0, d = 0 }) {
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
    ended: null,      // null | 'landed' | 'tumble'
    events: [],       // 'bounce' | 'touchdown' | 'tumble' — drained by the game each frame
  };
}

// Advance one step. input = { x: -1..1 (right +), y: -1..1 (climb +) }.
// groundAt(x, d) returns ground height in metres.
export function stepFlight(s, input, dt, P, groundAt) {
  if (s.ended) return s;
  if (s.mode === 'air') stepAir(s, input, dt, P, groundAt);
  else if (s.mode === 'ground') stepGround(s, input, dt, P, groundAt);
  else stepTumble(s, dt, P, groundAt);
  return s;
}

function steerLateral(s, input, dt, P, scale) {
  const target = clamp(input.x, -1, 1) * P.lateralSpeed * scale;
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

  // Energy: diving (pitch < 0) adds speed, climbing removes it; decay + drag always bleed.
  const accel = -P.gravity * Math.sin(s.pitch) - P.decay - P.drag * s.speed * s.speed;
  s.speed = Math.max(P.minAirSpeed, s.speed + accel * dt);

  const forward = s.speed * Math.cos(s.pitch);
  s.vy = s.speed * Math.sin(s.pitch) - clamp(stallAmt, 0, 1) * P.stallSink;
  steerLateral(s, input, dt, P, 1);
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
