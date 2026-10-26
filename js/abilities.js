// v2.2 PLANE ABILITIES (owner 2026-10-25): one ability per plane, always on, shown on its card as
// "ABILITY: {NAME} — {line}" (locked cards too). THE DRAGON has two (FIRE BREATH + KNIGHT'S GUARD); the Dragonite
// skin inherits them. A plane names its ability id(s) in its data (`plane.ability`); flightParams merges EFFECTS in,
// so every hook reads a plain number off the flight params (absent = 1 / off = exactly the old game). Pure data.

export const ABILITIES = {
  magnet: { name: 'COIN MAGNET', line: 'Coins within 12 m snap straight to you.' },
  charge: { name: 'SHAPE CHARGE', line: 'Boost Shapes give 1.5× the speed.' },
  double: { name: 'DOUBLE COINS', line: 'Every coin you grab counts twice.' },
  tank: { name: 'BIG TANK', line: '1.5× the boost fuel.' },
  shield: { name: 'SAND SHIELD', line: 'Your first bonk each flight bounces right off — no slowdown.' },
  sealuck: { name: 'SEA LUCK', line: 'Water landings can be GREAT, PERFECT or SUPER too.' },
  moonglide: { name: 'MOON GLIDE', line: 'Sinks gently when slow — 40 % less stall sink.' },
  tailwind: { name: 'TAILWIND FRIEND', line: 'Wind lanes push you 1.5× harder.' },
  sipper: { name: 'SLIPSTREAM SIPPER', line: 'Neon lanes top up your boost while you ride them.' },
  lava: { name: 'LAVA RIDER', line: 'Lava vents lift you 2× — and the lava wave barely slows you.' },
  snack: { name: 'SNACK MASTER', line: 'Smash-throughs pay double.' },
  updrift: { name: 'UPDRIFT ANGEL', line: 'Updrafts and thermals lift you 1.5× higher.' },
  guard: { name: 'KNIGHT\'S GUARD', line: 'Fireballs, arrows and blasts bounce off — no effect.' },
  hunter: { name: 'SHAPE HUNTER', line: 'Boost chains last 10 s and stack up to ×6.' },
  hyper: { name: 'HYPERDRIVE', line: 'Boost goes 10 % faster and uses 25 % less fuel.' },
  fire: { name: 'FIRE BREATH', line: 'Boosting breathes fire: trees and rocks ahead burn away, +2 coins each.' },
};

// What each ability puts on the flight params (the hooks read these; see the implementation map in BALANCE.md).
export const EFFECTS = {
  magnet: { snapRadius: 12 },                       // main.js collect: pickup radius ≥ 12 m
  charge: { shapeGainMul: 1.5 },                    // shapes.js stepShapeRun gain
  double: { coinMul: 2 },                           // main.js collect: coin objects count × 2
  tank: { tankMul: 1.5 },                           // the flight's starting fuel (main.js launch, sim, stat bars)
  shield: { shield: true },                         // physics.js bonk: the first obstacle bonk is negated ('shield')
  sealuck: { seaLuck: true },                       // physics.js touchGround: water graded on the normal ladder
  moonglide: { stallSinkMul: 0.6 },                 // physics.js flightParams: stall sink × 0.6
  tailwind: { windMul: 1.5 },                       // physics.js stepAir: wind-lane push × 1.5
  sipper: { laneSip: 0.5 },                         // physics.js stepAir: + 0.5 s fuel / s inside a neon lane
  lava: { lavaLiftMul: 2, waveKeep: 0.8 },          // stepAir lava-vent lift × 2; megarun THE WAVE keeps 0.8
  snack: { smashMul: 2 },                           // main.js bumpables: payouts × 2
  updrift: { updraftMul: 1.5 },                     // physics.js stepAir: updraft / thermal lift × 1.5
  guard: { guard: true },                           // shooters.js applyHit: no effect ('guard')
  hunter: { chainWindow: 10, chainCap: 6 },         // shapes.js chain window / cap
  hyper: { ceilingAdd: 0.10, boostDrainMul: 0.75 }, // flightParams boostCap + 10 points; stepAir fuel drain × 0.75
  fire: { fire: { len: 25, width: 8, coins: 2 } },  // physics.js breathe: the cone ahead while boosting
};

// Each world's own plane.
export const NATIVE_ABILITY = {
  plains: 'magnet', canyon: 'charge', city: 'double', snow: 'tank', desert: 'shield', ocean: 'sealuck', space: 'moonglide',
  jetstream: 'tailwind', neonvoid: 'sipper', volcano: 'lava', jungle: 'snack', skyislands: 'updrift', dragonwar: 'guard',
  starfox: 'hunter', starwars: 'hyper',
};

// A plane's ability ids (a plane def's `ability`: one id or a list).
export const abilitiesOf = (plane) => (plane?.ability ? [plane.ability].flat() : []);
// The flight-param additions for a plane.
export function abilityParams(plane) {
  const out = {};
  for (const id of abilitiesOf(plane)) Object.assign(out, EFFECTS[id]);
  return out;
}
// The card lines: "ABILITY: {NAME} — {line}", one per ability.
export const abilityLines = (plane) => abilitiesOf(plane).map((id) => `ABILITY: ${ABILITIES[id].name} — ${ABILITIES[id].line}`);
