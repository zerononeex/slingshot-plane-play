// BUMPABLES (v0.6 part 2): soft, silly things in the flight corridor that PAY you for bumping
// them. Never an obstacle: v2.1 SMASH-THROUGH (owner playtest 2026-10-25: "remove any slow downs from
// destroying something that you collide into for coins") — a bump costs NO speed (was × 0.90, big
// × 0.85); it plays a cartoon set-piece (the animation IS the leaving), pays instantly, one-shot per flight.
// Nobody gets hurt: every character ends up fine. Pure data + maths (no DOM / three.js).

// leave = the set-piece (world.js animates it); sound = the synth voice (audio.js).
// r = contact radius (m); y = height of the centre above the ground.
export const CAST = {
  goose:          { name: 'GOOSE', reward: 5, r: 1.6, y: 9, leave: 'tumble', sound: 'squawk' },
  hotAirBalloon:  { name: 'HOT-AIR BALLOON', reward: 10, r: 3, y: 14, big: true, leave: 'popChute', sound: 'pop' },
  scarecrow:      { name: 'SCARECROW', reward: 5, r: 1.6, y: 1.8, leave: 'headPop', sound: 'boing' },
  kite:           { name: 'KITE', reward: 5, r: 1.6, y: 10, leave: 'spiral', sound: 'boing' },
  vulture:        { name: 'VULTURE', reward: 8, r: 1.8, y: 11, leave: 'helix', sound: 'squawk' },
  hangGlider:     { name: 'HANG-GLIDER GUY', reward: 10, r: 2.6, y: 12, big: true, leave: 'chute', sound: 'boing' },
  caveBats:       { name: 'CAVE BATS', reward: 5, r: 3, y: 5, leave: 'scatter', sound: 'squawk' },
  balloonBunch:   { name: 'BALLOON BUNCH', reward: 9, r: 2.2, y: 8, leave: 'pop3', sound: 'pop' },   // 3 balloons × 3
  pigeonFlock:    { name: 'PIGEON FLOCK', reward: 5, r: 3, y: 7, leave: 'scatter', sound: 'squawk' },
  drone:          { name: 'DELIVERY DRONE', reward: 8, r: 1.6, y: 9, leave: 'dropPackage', sound: 'beep' },
  snowman:        { name: 'SNOWMAN', reward: 5, r: 1.8, y: 1.6, leave: 'headPop', sound: 'boing' },
  snowyOwl:       { name: 'SNOWY OWL', reward: 5, r: 1.5, y: 9, leave: 'glide', sound: 'squawk' },
  penguinTrio:    { name: 'PENGUIN TRIO', reward: 5, r: 2.6, y: 1, leave: 'slide', sound: 'honk' },
  camel:          { name: 'CAMEL', reward: 5, r: 2.4, y: 2, big: true, leave: 'trot', sound: 'honk' },
  desertRunner:   { name: 'DESERT RUNNER', reward: 8, r: 1.3, y: 1, leave: 'zip', sound: 'boing' },
  seagullFlock:   { name: 'SEAGULL FLOCK', reward: 5, r: 3, y: 7, leave: 'scatter', sound: 'squawk' },
  pelican:        { name: 'PELICAN', reward: 8, r: 2, y: 6, big: true, leave: 'splashDive', sound: 'splash' },
  parasail:       { name: 'PARASAIL GUY', reward: 10, r: 2.6, y: 10, big: true, leave: 'chute', sound: 'splash' },
  beachBalloon:   { name: 'BEACH BALLOON', reward: 5, r: 2.2, y: 8, leave: 'popChute', sound: 'pop' },
  pebbleRocks:    { name: 'PEBBLE ASTEROIDS', reward: 15, r: 2.6, y: 7, leave: 'crack', sound: 'pop' }, // 3 small rocks × 5
  astronaut:      { name: 'LOST ASTRONAUT', reward: 10, r: 1.6, y: 9, leave: 'drift', sound: 'boing' },
  satellite:      { name: 'OLD SATELLITE', reward: 8, r: 2.2, y: 12, big: true, leave: 'spinAway', sound: 'beep' },
  highGoose:      { name: 'HIGH GOOSE', reward: 5, r: 1.6, y: 16, leave: 'tumble', sound: 'squawk' },
  weatherBalloon: { name: 'WEATHER BALLOON', reward: 10, r: 3, y: 18, big: true, leave: 'popChute', sound: 'pop' },
  skydiver:       { name: 'SKYDIVER', reward: 10, r: 1.6, y: 14, leave: 'chute', sound: 'boing' },
};

// The results line: "Bumps: N (+M coins)" (null when there were none). mul: v2.2 SNACK MASTER's × 2.
export function bumpSummary(bumps, mul = 1) {
  const coins = bumps.reduce((a, b) => a + CAST[b.type].reward * mul, 0);
  return bumps.length ? { n: bumps.length, coins, text: `Bumps: ${bumps.length} (+${coins} coins)` } : null;
}
