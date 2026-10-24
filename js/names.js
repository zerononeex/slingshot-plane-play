// What the upgrades are CALLED (same mechanics, same prices everywhere). The Starship — and
// anything being upgraded in the Space world — gets its own space names (v0.6 part 2).
export const STOCK_NAMES = {
  band: 'RUBBER BAND', engine: 'PROPELLER ENGINE', tank: 'FUEL TANK', ramp: 'LAUNCH RAMP', magnet: 'COIN MAGNET',
  wheels: 'BOUNCY WHEELS', eject: 'EJECTOR SEAT', leftWing: 'LEFT WING', rightWing: 'RIGHT WING', tail: 'TAIL',
  parts: 'BUILD YOUR PLANE', paints: 'PAINT JOBS',
  radar: 'SECRET RADAR', horn: 'PARTY HORN', chute: 'MEGA CHUTE', brakes: 'SPOILER BRAKES', balloons: 'HELIUM BALLOONS', fun: 'FUN UPGRADES', // v1.0
};
export const SPACE_NAMES = {
  band: 'CATAPULT RAIL', engine: 'ION ENGINE', tank: 'WARP TANK', ramp: 'LAUNCH PAD', magnet: 'TRACTOR BEAM',
  wheels: 'RETRO THRUSTERS', eject: 'EJECTOR SEAT', leftWing: 'LEFT FIN', rightWing: 'RIGHT FIN', tail: 'STABILIZER',
  parts: 'BUILD YOUR SHIP', paints: 'STAR SKINS',
  radar: 'SENSOR DISH', horn: 'PARTY KLAXON', chute: 'RETRO CHUTE', brakes: 'AIR BRAKES', balloons: 'ANTI-GRAV PODS', fun: 'FUN UPGRADES', // v1.0
};
// v1.2 the VOID RUNNER — and anything upgraded in Neon Void — gets void names (Space precedent); the
// lines not renamed here keep their stock names.
export const VOID_NAMES = {
  ...STOCK_NAMES,
  band: 'LIGHT RIBBON', engine: 'PHOTON DRIVE', tank: 'OVERCHARGE CELLS', magnet: 'TRACTOR GLOW', ramp: 'LAUNCH RAIL', wheels: 'GYRO WHEELS',
  radar: 'VOID SENSE', balloons: 'GLOW ORBS',
};
// The short labels on the Home hangar strip.
const STOCK_CHIPS = { band: 'ELASTIC', engine: 'PROPELLER', leftWing: 'LEFT WING', rightWing: 'RIGHT WING', tail: 'TAIL' };
const SPACE_CHIPS = { band: 'RAIL', engine: 'ION ENGINE', leftWing: 'LEFT FIN', rightWing: 'RIGHT FIN', tail: 'STABILIZER' };
const VOID_CHIPS = { ...STOCK_CHIPS, band: 'LIGHT RIBBON', engine: 'PHOTON DRIVE' };

// Which name set: the plane's own first (the Starship / the Void Runner), else the world's.
function nameSet(planeId, worldId) {
  if (planeId === 'space') return 'space';
  if (planeId === 'neonvoid') return 'void';
  if (worldId === 'space') return 'space';
  if (worldId === 'neonvoid') return 'void';
  return 'stock';
}
export const spaceNamed = (planeId, worldId) => nameSet(planeId, worldId) === 'space';
export const upgradeNames = (planeId, worldId) => ({ space: SPACE_NAMES, void: VOID_NAMES, stock: STOCK_NAMES })[nameSet(planeId, worldId)];
export const chipNames = (planeId, worldId) => ({ space: SPACE_CHIPS, void: VOID_CHIPS, stock: STOCK_CHIPS })[nameSet(planeId, worldId)];
