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
// v1.3 the new worlds' own names (same precedent; the lines not listed keep their stock names).
export const VOLCANO_NAMES = { ...STOCK_NAMES, ramp: 'ERUPTION RAMP', magnet: 'ORE MAGNET', wheels: 'OBSIDIAN WHEELS', balloons: 'THERMAL BALLOONS', tank: 'MAGMA TANK' };
export const JUNGLE_NAMES = { ...STOCK_NAMES, ramp: 'VINE RAMP', engine: 'CANOPY ENGINE', wheels: 'MUD WHEELS', band: 'JUNGLE VINE', balloons: 'SEED PODS' };
export const SKY_NAMES = { ...STOCK_NAMES, ramp: 'CLOUD RAMP', tank: 'MIST TANK', balloons: 'CLOUD BALLOONS', engine: 'BREEZE ENGINE', wheels: 'PUFF WHEELS' };
// v1.5 Dragon War (the builder's list; the lines not listed keep their stock names).
export const DRAGON_NAMES = {
  ...STOCK_NAMES, band: 'WAR BANNER ELASTIC', engine: 'KNIGHT\'S ENGINE', tank: 'DRAGONFIRE TANK', ramp: 'CASTLE RAMP', magnet: 'HOARD MAGNET',
  wheels: 'IRONSHOD WHEELS', radar: 'SCOUT\'S EYE', horn: 'WAR HORN', balloons: 'BANNER BALLOONS', paints: 'HERALDRY',
};
// The short labels on the Home hangar strip.
const STOCK_CHIPS = { band: 'ELASTIC', engine: 'PROPELLER', leftWing: 'LEFT WING', rightWing: 'RIGHT WING', tail: 'TAIL' };
const SPACE_CHIPS = { band: 'RAIL', engine: 'ION ENGINE', leftWing: 'LEFT FIN', rightWing: 'RIGHT FIN', tail: 'STABILIZER' };
const VOID_CHIPS = { ...STOCK_CHIPS, band: 'LIGHT RIBBON', engine: 'PHOTON DRIVE' };
const JUNGLE_CHIPS = { ...STOCK_CHIPS, band: 'JUNGLE VINE', engine: 'CANOPY ENGINE' };
const SKY_CHIPS = { ...STOCK_CHIPS, engine: 'BREEZE ENGINE' };
const DRAGON_CHIPS = { ...STOCK_CHIPS, band: 'WAR BANNER', engine: 'KNIGHT\'S ENGINE' };

// The worlds with their own names: [upgrade names, hangar chips]. A plane's own set wins (the Starship
// borrowed elsewhere keeps its names), else the world's, else the stock names.
const OWN = {
  space: [SPACE_NAMES, SPACE_CHIPS], neonvoid: [VOID_NAMES, VOID_CHIPS],
  volcano: [VOLCANO_NAMES, STOCK_CHIPS], jungle: [JUNGLE_NAMES, JUNGLE_CHIPS], skyislands: [SKY_NAMES, SKY_CHIPS],
  dragonwar: [DRAGON_NAMES, DRAGON_CHIPS],
};
const nameSet = (planeId, worldId) => OWN[planeId] ?? OWN[worldId] ?? [STOCK_NAMES, STOCK_CHIPS];
export const spaceNamed = (planeId, worldId) => nameSet(planeId, worldId)[0] === SPACE_NAMES;
export const upgradeNames = (planeId, worldId) => nameSet(planeId, worldId)[0];
export const chipNames = (planeId, worldId) => nameSet(planeId, worldId)[1];
