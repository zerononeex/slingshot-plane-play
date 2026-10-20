// What the upgrades are CALLED (same mechanics, same prices everywhere). The Starship — and
// anything being upgraded in the Space world — gets its own space names (v0.6 part 2).
export const STOCK_NAMES = {
  band: 'RUBBER BAND', engine: 'PROPELLER ENGINE', tank: 'FUEL TANK', ramp: 'LAUNCH RAMP', magnet: 'COIN MAGNET',
  wheels: 'BOUNCY WHEELS', eject: 'EJECTOR SEAT', leftWing: 'LEFT WING', rightWing: 'RIGHT WING', tail: 'TAIL',
  parts: 'BUILD YOUR PLANE', paints: 'PAINT JOBS',
};
export const SPACE_NAMES = {
  band: 'CATAPULT RAIL', engine: 'ION ENGINE', tank: 'WARP TANK', ramp: 'LAUNCH PAD', magnet: 'TRACTOR BEAM',
  wheels: 'RETRO THRUSTERS', eject: 'EJECTOR SEAT', leftWing: 'LEFT FIN', rightWing: 'RIGHT FIN', tail: 'STABILIZER',
  parts: 'BUILD YOUR SHIP', paints: 'STAR SKINS',
};
// The short labels on the Home hangar strip.
const STOCK_CHIPS = { band: 'ELASTIC', engine: 'PROPELLER', leftWing: 'LEFT WING', rightWing: 'RIGHT WING', tail: 'TAIL' };
const SPACE_CHIPS = { band: 'RAIL', engine: 'ION ENGINE', leftWing: 'LEFT FIN', rightWing: 'RIGHT FIN', tail: 'STABILIZER' };

export const spaceNamed = (planeId, worldId) => planeId === 'space' || worldId === 'space';
export const upgradeNames = (planeId, worldId) => (spaceNamed(planeId, worldId) ? SPACE_NAMES : STOCK_NAMES);
export const chipNames = (planeId, worldId) => (spaceNamed(planeId, worldId) ? SPACE_CHIPS : STOCK_CHIPS);
