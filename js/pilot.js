// Pure parachute-pilot physics for the EJECTOR SEAT (no three.js).
// The pilot inherits the plane's velocity, pops up, then glides under the canopy.
// Drag left/right to steer; drag up = flare (float flatter); drag down = dive faster.

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

// The parachute in a world: low gravity makes the canopy sink slower (long, dreamy glides).
export function pilotParams(PILOT, modifiers = {}) {
  const g = modifiers.lowGravity ? modifiers.lowGravity.gravityScale : 1;
  return g === 1 ? PILOT : { ...PILOT, canopySink: PILOT.canopySink * g };
}

export function createPilot(flight, PILOT) {
  const forward = flight.speed * Math.cos(flight.pitch);
  return {
    x: flight.x,
    y: flight.y + 0.8,
    d: flight.d,
    vx: flight.vx,
    vy: flight.vy + PILOT.popUp,
    vd: forward,
    ejectD: flight.d,       // where the seat fired (for "Eject glide: ___ m")
    landed: false,
    t: 0,
  };
}

function envOf(env) {
  if (typeof env === 'function') return { groundAt: env, ceilingAt: () => Infinity };
  return env;
}

// corridor: the half-width of the main corridor, or (in a sub-area) a pocket lane { cx, half }.
export function stepPilot(p, input, dt, PILOT, envIn, corridor = 26) {
  const lo = typeof corridor === 'number' ? -corridor : corridor.cx - corridor.half;
  const hi = typeof corridor === 'number' ? corridor : corridor.cx + corridor.half;
  if (p.landed) return p;
  const env = envOf(envIn);
  p.t += dt;
  const iy = clamp(input.y ?? 0, -1, 1);
  const sinkMul = iy >= 0 ? 1 + (PILOT.flareSinkMul - 1) * iy : 1 + (PILOT.diveSinkMul - 1) * -iy;
  const targetVy = -PILOT.canopySink * sinkMul;
  // Just after the pop, gravity carries the pilot up and over before the canopy bites.
  const sinkRate = p.t < 0.5 ? 9.8 : PILOT.sinkResponse * 9.8;
  p.vy = p.vy > targetVy ? Math.max(targetVy, p.vy - sinkRate * dt) : Math.min(targetVy, p.vy + PILOT.sinkResponse * 4 * dt);
  p.vd += (PILOT.glideSpeed - p.vd) * Math.min(1, PILOT.forwardDrag * dt);
  p.vx += (clamp(input.x ?? 0, -1, 1) * PILOT.sideSpeed - p.vx) * Math.min(1, 3 * dt);

  p.x = clamp(p.x + p.vx * dt, lo, hi);
  p.d += p.vd * dt;
  p.y += p.vy * dt;
  const roof = env.ceilingAt(p.x, p.d);
  if (p.y + 0.6 > roof) { p.y = roof - 0.6; p.vy = Math.min(p.vy, 0); }
  const g = env.groundAt(p.x, p.d, p.y);
  if (p.y <= g + 0.5) {
    p.y = g + 0.5;
    p.landed = true;
    p.vd = 0;
    p.vx = 0;
    p.vy = 0;
  }
  return p;
}

// ---- the eject rules for one flight (pure, so they can be tested) ----
// session = { ownsSeat, ejected: false, pilot: null }
export function tryEject(session, flight, PILOT) {
  if (!session.ownsSeat || session.ejected || !flight || flight.ended) return null;
  session.ejected = true;               // once per flight
  session.pilot = createPilot(flight, PILOT);
  return session.pilot;
}

// Flight distance = where the PILOT lands after an eject, else where the plane stops.
export function runDistance(session, flight) {
  return Math.max(0, session.ejected ? session.pilot.d : flight.d);
}

// After an eject the flight ends when the pilot lands — not when the empty plane crashes.
export function runOver(session, flight) {
  return session.ejected ? session.pilot.landed : !!flight.ended;
}
