// v2.1 FEEL FAST (owner playtest 2026-10-25: "I want it to feel like a boost on screen"). Pure (no three.js):
// the camera's field of view on live speed, and how far past its cap the plane is (the streaks use it).

export const BOOST_FOV = 18; // degrees added at the boost ceiling, on top of today's framing at the cap

const smooth = (k) => { const t = Math.min(1, Math.max(0, k)); return t * t * (3 - 2 * t); };

// 0 at (or below) the plane's cap → 1 at its boost ceiling.
export const overCap = (speed, cap, ceiling) => (ceiling > cap ? smooth((speed - cap) / (ceiling - cap)) : 0);

// The FOV the camera eases toward. Up to the cap it is exactly today's framing: the sub-area swing's +6 and the
// speed kick (+4 from 45 m/s up) take the MAX, never stack. Past the cap the boost widens it smoothly, + 18° at
// the ceiling. An ended flight settles back to the base.
export function speedFov(base, speed, cap, ceiling, swingKick = 0, ended = false) {
  if (ended) return base + swingKick;
  const sk = smooth((speed - 45) / 40), speedKick = 4 * sk;
  return base + Math.max(swingKick, speedKick) + BOOST_FOV * overCap(speed, cap, ceiling);
}

// v2.1 THE SPEED READOUT (top-left, live): km/h, rounded — gold while the plane is past its cap (boosting).
export const speedReadout = (speed, cap) => ({ kmh: Math.round(speed * 3.6), gold: speed > cap });
