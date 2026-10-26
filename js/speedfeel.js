// v2.1 FEEL FAST (owner playtest 2026-10-25: "I want it to feel like a boost on screen"). Pure (no three.js):
// the camera's field of view on live speed, and how far past its cap the plane is (the streaks use it).

export const BOOST_FOV = 18; // degrees added at the boost ceiling, on top of today's framing at the cap

const smooth = (k) => { const t = Math.min(1, Math.max(0, k)); return t * t * (3 - 2 * t); };

// 0 at (or below) the plane's cap → 1 at its boost ceiling.
export const overCap = (speed, cap, ceiling) => (ceiling > cap ? smooth((speed - cap) / (ceiling - cap)) : 0);

// The FOV the camera eases toward. Up to the cap it is exactly today's framing: the sub-area swing's +6 and the
// speed kick (+4 from 45 m/s up) take the MAX, never stack. Past the cap the boost widens it smoothly, + 18° at
// the ceiling. An ended flight settles back to the base.
// v2.2: `intensity` (the speed-feel value below) replaces the raw over-cap reading when given, so a shape pulse
// widens the view too.
export function speedFov(base, speed, cap, ceiling, swingKick = 0, ended = false, intensity = overCap(speed, cap, ceiling)) {
  if (ended) return base + swingKick;
  const sk = smooth((speed - 45) / 40), speedKick = 4 * sk;
  return base + Math.max(swingKick, speedKick) + BOOST_FOV * intensity;
}

// v2.2 SPEED-FEEL KIT (owner 2026-10-25): ONE intensity value drives every speed cue — the FOV, the speed lines,
// the ribbon trail and the edge vignette. 0 at (or below) the cap → 1 at the boost ceiling, from live speed every
// frame; a Boost Shape pickup lifts it to 1 for PULSE.dur s (held, then eased out over its last PULSE.fade s).
export const PULSE = { dur: 0.8, fade: 0.3 };
export const pulseLevel = (age) => (age < 0 || age >= PULSE.dur ? 0 : age <= PULSE.dur - PULSE.fade ? 1 : smooth((PULSE.dur - age) / PULSE.fade));
export const speedIntensity = (speed, cap, ceiling, pulseAge = Infinity) => Math.max(overCap(speed, cap, ceiling), pulseLevel(pulseAge));
// Everything eases: the shown intensity follows the target at `rate` /s (rises quicker than it falls).
export const easeIntensity = (shown, target, dt) => shown + (target - shown) * Math.min(1, (target > shown ? 8 : 3) * dt);
// The soft edge vignette: its strength and how far in from the edge it reaches (tightens slightly with intensity).
export const vignette = (k) => ({ opacity: 0.55 * k, inner: 72 - 12 * k });

// v2.1 THE SPEED READOUT (top-left, live): km/h, rounded — gold while the plane is past its cap (boosting).
export const speedReadout = (speed, cap) => ({ kmh: Math.round(speed * 3.6), gold: speed > cap });
