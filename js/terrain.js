// Pure terrain height function — shared by the renderer and the physics.
import { WORLD, LAUNCH } from './config.js';

export const DECK = { start: -8, end: 1.5, halfWidth: 2.2 };

// Rolling hills; flat near the slingshot so launches are fair. Always >= 0.
export function hillsAt(x, d) {
  const ramp = Math.min(1, Math.max(0, (d - 40) / 100));
  if (ramp === 0) return 0;
  const n =
    0.5 * Math.sin(d * 0.021 + 1.3) * Math.cos(x * 0.045) +
    0.3 * Math.sin(d * 0.0063 + x * 0.031) +
    0.2 * Math.sin(d * 0.047 - x * 0.07 + 2.1);
  // n is roughly -1..1 → 0..1
  return ramp * WORLD.hillHeight * (0.5 + 0.5 * n);
}

export function groundAt(x, d) {
  if (d >= DECK.start && d <= DECK.end && Math.abs(x) <= DECK.halfWidth) return LAUNCH.deckHeight;
  return hillsAt(x, d);
}
