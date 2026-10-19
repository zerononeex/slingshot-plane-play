// Pure launch-speedometer maths. The needle shows the REAL launch speed the
// physics will use for this pull (launchSpeedFor), in km/h.
import { launchSpeedFor } from './physics.js';

export const KMH = 3.6;
export const NEAR_FULL = 0.9; // pull fraction where the rim pulses and the needle trembles

export function speedoReading(pull, band, launch) {
  const mps = launchSpeedFor(pull, launch, band);
  const capKmh = band.launchMax * KMH;
  const kmh = mps * KMH;
  return { mps, kmh, capKmh, frac: Math.min(1, kmh / capKmh), nearFull: pull >= NEAR_FULL };
}

// Dial zones as fractions of the band cap: green → yellow → red, with a GOLD top
// zone from band level 3 up.
export function speedoZones(bandLevel) {
  const zones = [
    { from: 0, to: 0.5, color: '#3ccf5a' },
    { from: 0.5, to: 0.75, color: '#ffd23f' },
  ];
  if (bandLevel >= 3) zones.push({ from: 0.75, to: 0.9, color: '#ff5d5d' }, { from: 0.9, to: 1, color: '#ffc61a', gold: true });
  else zones.push({ from: 0.75, to: 1, color: '#ff5d5d' });
  return zones;
}
