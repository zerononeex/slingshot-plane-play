// v2.2 BOOST REGEN, the owner's rule (2026-10-25): "1% refill the moment you hit 1000 coins collected — not gradual,
// as that permits infinite boost for endgame players." Owner's ruling 2026-10-26 (Star Fox playtest: it refilled too
// rarely on the long stages): 1 % every 200 coins. Still coin-gated, never time-based. Every time the coins collected in a flight cross another
// COIN_REGEN.every, the tank instantly gains COIN_REGEN.share of its capacity (never past full). Nothing refills
// over time, so a flight still ends. Pure (no DOM).
export const COIN_REGEN = { every: 200, share: 0.01 };
// The fuel after the flight's coin count went from `before` to `after` (one +1 % per 200-coin mark crossed).
export function coinRegen(fuel, fuelMax, before, after) {
  const marks = Math.floor(after / COIN_REGEN.every) - Math.floor(before / COIN_REGEN.every);
  return marks > 0 ? Math.min(fuelMax, fuel + marks * COIN_REGEN.share * fuelMax) : fuel;
}
