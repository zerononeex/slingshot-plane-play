// v1.7 S15 STAR WARS — the authored data of the third and final 70,000 m MEGA-STAGE (a galaxy-far-away love
// letter). Seven 10,000 m ARCS — the twin-suns desert, the orbital battle, the ice world, the cloud world,
// the forest moon, the great fleet battle, the great station — with a scripted transition zone at each of
// the six boundaries (ASCENT / DESCENT as in v1.6, and the new HYPERSPACE jump: a star-streak tunnel),
// seventy named 1,000 m zones, the hazard layout read by the SHARED mega layer (megarun.js: weave rows,
// tilt sectors, loop doors, shooters, wild flyers + mines, interiors, thermals, solar-wind lanes, and the
// TARGET PORT), fourteen spectacle moments, the hero landmarks and the long-run set pieces. Everything at
// ABSOLUTE metres. The shooter system (shooters.js) and Loop Doors (loopdoors.js) are reused unchanged:
// bolts, plasma and gates are stage-data reskins (`skin`, `look`).
// Pure data + maths (no DOM / three.js). See BALANCE.md "Star Wars (v1.7)".

export const SW_RUN = 70000;
export const SW_ARC_LEN = 10000;
export const SW_BLEND = 300; // the transition zones: ±300 m about each arc boundary (600 m)

// ───────────────────────── the base lap (repeats every 2,000 m, like every world) ─────────────────────────
// Lap-local metres. Three pockets (the standard pattern: lap furniture), a loop ring, two dive gates, a
// LANDING-BEACON course; the mega layer keeps clear of all of it.
export const SW_LAP = {
  loopRing: { d: 900, x: 0, yc: 20, R: 12 },
  diveGates: [{ d: 420, x: 0, w: 10, h: 8 }, { d: 1660, x: 6, w: 10, h: 8 }],
  course: [1480, 1505, 1530, 1555, 1580],
  // the HANGAR TUNNEL (right; the cavern tech as a lit block) and the DOCKING SLOT (a knife-edge gap)
  cavern: { shape: 'block', start: 700, mouth: 705, exit: 785, end: 790, height: 30, laneMin: 14, laneMax: 26, edge: 9, roof: 10, lit: true },
  slot: { d: 1620, x: 14, gap: 2, wall: 2.5, h: 12, look: 'station' },
  // the CATWALK BRIDGE over the gully (fly under it or over it)
  bridge: { kind: 'stone', d: 1440, x0: -30, x1: 30, under: 12, thick: 3, depth: 8 },
  busy: [[120, 240], [360, 480], [640, 960], [1120, 1360], [1420, 1640], [1600, 1720]],
};

// ───────────────────────── the seven ARCS ─────────────────────────
// space = a space arc (a dark starfield sky; `planet` = the world hanging in it). suns = the desert's twin
// suns (a sky dressing). The rest like Star Fox's arcs (terrain grammar, palette, lights, scenery,
// particles, the dressing kit, ambient life, ten zone names).
export const SW_ARCS = [
  { id: 'twinsuns', name: 'THE DESERT WORLD', from: 0, to: 10000, suns: [0xfff2c0, 0xffd27a],
    ground: { style: 'rolling', center: 4, side: 14, peaks: 18 },
    pal: { low: [0.72, 0.56, 0.34], grass: [0.86, 0.7, 0.46], high: [0.74, 0.58, 0.4] }, base: 0xdcae68, rock: 0xb0845a,
    sky: 0xffe0a8, sun: 0xfff2d0, hemi: 0xa8844a, cloud: 0xfff4e0,
    scenery: { kind: 'cactus', trees: 2, rocks: 5, cone: 0x8a7a50, ball: 0x9a8a5a, trunk: 0x8a6a40 },
    particles: { kind: 'sand', color: 0xf0d090, dir: 1 },
    kit: ['vaporator', 'domeHut', 'sandSkiff', 'rockArch', 'dune', 'dustDevil', 'vaporator', 'bantha'],
    ambient: ['sand', 'skiffs', 'dustDevils', 'banthas', 'twinSuns'],
    zones: ['TWIN SUNS', 'THE DUNE SEA', 'MOISTURE FARMS', 'DOME TOWN', 'THE CANYON WEAVE', 'THE DUEL PLATEAU', 'THE NEEDLE CANYON', 'THE SPACEPORT', 'THE JUNK MARKET', 'THE LAUNCH PITS'] },
  { id: 'orbital', name: 'THE ORBITAL BATTLE', from: 10000, to: 20000, space: true, planet: [0xe2b56a, 0xc89a50], // the desert world below
    ground: { style: 'rolling', center: 1, side: 3 },
    pal: { low: [0.15, 0.15, 0.2], grass: [0.22, 0.22, 0.28], high: [0.34, 0.33, 0.38] }, base: 0x262632, rock: 0x6a6670,
    sky: 0x080a20, sun: 0xfff0e0, hemi: 0x3a3a5a, cloud: 0x7a7686,
    scenery: { kind: 'none', trees: 0, rocks: 5, cone: 0x3a3a44, ball: 0x4a4a54, trunk: 0x3a3a44 },
    particles: { kind: 'stardust', color: 0xd8e6ff, dir: -1 },
    kit: ['asteroidBig', 'asteroidSmall', 'capitalWedge', 'beacon', 'escortFrigate', 'debris', 'stationPylon', 'asteroidBig'],
    ambient: ['stardust', 'squadrons', 'tumblingRocks', 'navLights', 'cruisersUnderWay'],
    zones: ['THE JUMP POINT', 'THE PICKET SHIPS', 'THE ASTEROID CHASE', 'ROCK STORM', 'THE CAVE ROCK', 'THE DOCKING GATE', 'THE STATION RING', 'CAPITAL ROW', 'THE BROADSIDE', 'THE RETREAT'] },
  { id: 'iceworld', name: 'THE ICE WORLD', from: 20000, to: 30000,
    ground: { style: 'rolling', center: 3, side: 14, peaks: 22 },
    pal: { low: [0.8, 0.86, 0.92], grass: [0.92, 0.95, 0.98], high: [0.72, 0.8, 0.9] }, base: 0xe8f0f8, rock: 0x8a9ab0,
    sky: 0xc8dcf0, sun: 0xf4f8ff, hemi: 0x8aa0c0, cloud: 0xffffff,
    scenery: { kind: 'none', trees: 0, rocks: 5, cone: 0xbfd8f0, ball: 0xd8e8f8, trunk: 0x8a9ab0 },
    particles: { kind: 'snow', color: 0xffffff, dir: 1 },
    kit: ['snowDrift', 'iceSpike', 'walkerSmall', 'shieldPylon', 'snowTrench', 'iceSpike', 'sensorDish', 'snowDrift'],
    ambient: ['snow', 'walkersStride', 'shieldLights', 'scanners'],
    zones: ['ICE RE-ENTRY', 'THE SNOW PLAINS', 'THE WALKER LINE', 'THE SNOW TRENCHES', 'THE GENERATOR FIELD', 'FROST RIDGE', 'THE ICE CAVE', 'THE HIDDEN HANGAR', 'THE ION BATTERY', 'THE FROZEN PASS'] },
  { id: 'cloudworld', name: 'THE CLOUD WORLD', from: 30000, to: 40000,
    ground: { style: 'rolling', center: 2, side: 6, peaks: 6 },
    pal: { low: [0.96, 0.7, 0.56], grass: [1, 0.8, 0.66], high: [0.92, 0.66, 0.6] }, base: 0xffc8a0, rock: 0xd08a7a,
    sky: 0xffb08a, sun: 0xffe0c0, hemi: 0xc07a6a, cloud: 0xffe8d8,
    scenery: { kind: 'none', trees: 0, rocks: 1, cone: 0xd08a7a, ball: 0xe8a08a, trunk: 0xb07a6a },
    particles: { kind: 'motes', color: 0xffe0a0, dir: 1 },
    kit: ['cloudBank', 'cloudPlatform', 'floatTower', 'cloudBank', 'cloudCar', 'floatTower', 'cloudPlatform', 'beaconTower'],
    ambient: ['motes', 'cloudCars', 'cloudDrift', 'towerLights'],
    zones: ['THE CLOUD SEA', 'SUNSET BANKS', 'THE FLOATING CITY', 'TOWER ROW', 'THE LANDING PLATFORMS', 'THE TOWER GAP', 'THE REFINERY', 'THE BARON\'S TERRACE', 'THE FREEZING PLANT', 'THE AMBER CLOUDS'] },
  { id: 'forestmoon', name: 'THE FOREST MOON', from: 40000, to: 50000,
    ground: { style: 'rolling', center: 3, side: 12, peaks: 14 },
    pal: { low: [0.2, 0.36, 0.18], grass: [0.26, 0.5, 0.22], high: [0.34, 0.42, 0.26] }, base: 0x3f7a30, rock: 0x6a5a40,
    sky: 0x9ad0c0, sun: 0xf8f4d8, hemi: 0x3a6a30, cloud: 0xf0f6f0,
    scenery: { kind: 'mixed', trees: 10, rocks: 3, cone: 0x2a5a2a, ball: 0x3a7a30, trunk: 0x6a3a1a },
    particles: { kind: 'leaves', color: 0x8ac04a, dir: 1 },
    kit: ['fern', 'treeHut', 'speederBike', 'fern', 'logPile', 'treeHut', 'scoutWalkerSmall', 'glowShroom'],
    ambient: ['leaves', 'speeders', 'walkersPatrol', 'ferns'],
    zones: ['THE FOREST EDGE', 'THE GIANT TREES', 'THE SPEEDER RUN', 'TREE VILLAGE', 'THE SCOUT ROAD', 'THE ELDER GROVE', 'THE SHIELD BUNKER', 'THE BUNKER CACHE', 'THE COUNCIL GLADE', 'THE LANDING FIELD'] },
  { id: 'greatfleet', name: 'THE GREAT FLEET BATTLE', from: 50000, to: 60000, space: true, planet: [0x3f8a4a, 0x2a6a3a], // the forest moon below
    ground: { style: 'rolling', center: 1, side: 2 },
    pal: { low: [0.13, 0.12, 0.2], grass: [0.2, 0.18, 0.28], high: [0.3, 0.27, 0.38] }, base: 0x201c30, rock: 0x5a5a6a,
    sky: 0x120a2a, sun: 0xffe8f0, hemi: 0x4a2a5a, cloud: 0x6a5a86,
    scenery: { kind: 'none', trees: 0, rocks: 2, cone: 0x3a3a44, ball: 0x4a4a54, trunk: 0x3a3a44 },
    particles: { kind: 'stardust', color: 0xffd8e8, dir: -1 },
    kit: ['capitalWedge', 'roundCruiser', 'debris', 'escortFrigate', 'beacon', 'roundCruiser', 'capitalHull', 'debris'],
    ambient: ['stardust', 'squadrons', 'driftingShips', 'tumblingDebris', 'navLights'],
    zones: ['THE GREAT JUMP', 'THE BATTLE LINE', 'THE GUN WALL', 'FLAGSHIP SHADOW', 'THE FIGHTER SCREEN', 'THE WRECK AIRLOCK', 'THE HOLLOW WRECK', 'THE SMUGGLER\'S MOON', 'THE CRUISER WALL', 'THE STATION LOOMS'] },
  { id: 'greatstation', name: 'THE GREAT STATION', from: 60000, to: 70000, space: true, planet: [0x6a7a9a, 0x8a9ab8], // the gas giant beyond
    ground: { style: 'rolling', center: 3, side: 16, peaks: 8 },
    pal: { low: [0.34, 0.36, 0.4], grass: [0.44, 0.46, 0.5], high: [0.56, 0.58, 0.62] }, base: 0x5a5e66, rock: 0x7a7e86,
    sky: 0x05060e, sun: 0xe8f0ff, hemi: 0x3a3e4a, cloud: 0x6a6e7a,
    scenery: { kind: 'none', trees: 0, rocks: 3, cone: 0x4a4e56, ball: 0x5a5e66, trunk: 0x4a4e56 },
    particles: { kind: 'stardust', color: 0xc8d0e0, dir: -1 },
    kit: ['greebleBlock', 'dishTower', 'turretTower', 'greebleBlock', 'searchlight', 'exhaustVent', 'dishTower', 'smoke'],
    ambient: ['stardust', 'searchlights', 'dishes', 'smokeColumns'],
    zones: ['THE SURFACE', 'THE STATION GATES', 'THE GREEBLE FIELDS', 'THE GUN TOWERS', 'THE TRENCH', 'THE TRENCH RUN', 'THE NARROWS', 'THE EXHAUST WALLS', 'THE TARGET PORT', 'VICTORY'] },
];
// The animated ambient vocabulary (megaview.js / sfview.js draw each): drifting particles, sky + flock
// life, and the dressing that moves — each animated dressing element needs its kit piece in the arc's kit.
export const SW_AMBIENT = {
  sand: 'particles', stardust: 'particles', snow: 'particles', motes: 'particles', leaves: 'particles',
  squadrons: 'flock', twinSuns: 'sky',
  skiffs: 'sandSkiff', dustDevils: 'dustDevil', banthas: 'bantha',
  tumblingRocks: 'asteroidBig', navLights: 'beacon', cruisersUnderWay: 'capitalWedge',
  walkersStride: 'walkerSmall', shieldLights: 'shieldPylon', scanners: 'sensorDish',
  cloudCars: 'cloudCar', cloudDrift: 'cloudBank', towerLights: 'beaconTower',
  speeders: 'speederBike', walkersPatrol: 'scoutWalkerSmall', ferns: 'fern',
  driftingShips: 'roundCruiser', tumblingDebris: 'debris',
  searchlights: 'searchlight', dishes: 'dishTower', smokeColumns: 'smoke',
};
export const swArcIndex = (d) => Math.max(0, Math.min(SW_ARCS.length - 1, Math.floor(d / SW_ARC_LEN)));
export const SW_ZONES = SW_ARCS.flatMap((a) => a.zones);
// Each zone shifts its arc's palette: [brightness, warm (r up / b down)] — no two neighbours alike.
export const swZoneTint = (k, out = [0, 0]) => { out[0] = 1 + 0.07 * Math.sin(k * 2.37 + 0.4); out[1] = 0.03 * Math.sin(k * 1.71 + 1.1); return out; };

// ───────────────────────── the six TRANSITION ZONES ─────────────────────────
// ±300 m about each arc boundary. ASCENT / DESCENT as in v1.6 (the sky, fog and palette lerp; wisps or
// re-entry glow; a banner). HYPERSPACE (v1.7): the jump between distant worlds — the stars stretch into
// lines, a blue-white surge washes the sky, a banner moment. Scenery + sky data only: the flight line
// stays flyable throughout.
export const SW_TRANSITIONS = [
  ['hyperspace', 'HYPERSPACE: JUMP TO THE FLEET'], ['descent', 'DESCENT: THE ICE WORLD'], ['ascent', 'ASCENT: INTO THE CLOUD SEA'],
  ['descent', 'DESCENT: THE FOREST MOON'], ['hyperspace', 'HYPERSPACE: THE GREAT JUMP'], ['descent', 'DESCENT: THE STATION SURFACE'],
].map(([kind, name], i) => ({ kind, name, d: (i + 1) * SW_ARC_LEN, d0: (i + 1) * SW_ARC_LEN - SW_BLEND, d1: (i + 1) * SW_ARC_LEN + SW_BLEND, from: SW_ARCS[i].id, to: SW_ARCS[i + 1].id }));
export const swTransitionAt = (d) => SW_TRANSITIONS.find((t) => d >= t.d0 && d <= t.d1) ?? null;

// ───────────────────────── HERO LANDMARKS (one per 2,000 m; outside the corridor, BIG) ─────────────────────────
// [d, x, look, NAME]. Built by swlandmarks.js; the names are printed in BALANCE.md.
export const SW_HEROES = [
  [1150, -88, 'moistureFarm', 'THE MOISTURE FARM'], [3150, 90, 'domeTown', 'DOME TOWN'], [5150, -86, 'saberDuel', 'THE DUEL ON THE PLATEAU'],
  [7150, 92, 'spacePort', 'THE SPACEPORT'], [9150, -94, 'crawlerFortress', 'THE CRAWLER FORTRESS'],
  [11150, 96, 'wedgeCruiser', 'THE WEDGE CRUISER'], [13150, -98, 'caveRock', 'THE CAVE ROCK'], [15150, 92, 'dockingStation', 'THE DOCKING STATION'],
  [17150, -94, 'orbitalRing', 'THE STATION RING'], [19150, 96, 'mediFrigate', 'THE MEDICAL FRIGATE'],
  [21150, -90, 'iceBase', 'THE ICE BASE'], [23150, 92, 'greatWalker', 'THE GREAT WALKER'], [25150, -94, 'shieldDome', 'THE SHIELD GENERATOR'],
  [27150, 90, 'walkerPair', 'THE WALKER PAIR'], [29150, -92, 'ionCannon', 'THE ION CANNON'],
  [31150, 98, 'cloudCity', 'THE CLOUD CITY'], [33150, -100, 'gasRefinery', 'THE GAS REFINERY'], [35150, 98, 'landingTower', 'THE LANDING TOWER'],
  [37150, -96, 'baronPalace', 'THE BARON\'S PALACE'], [39150, 100, 'freezePlant', 'THE FREEZING PLANT'],
  [41150, -92, 'treeVillage', 'THE TREE VILLAGE'], [43150, 94, 'scoutWalker', 'THE SCOUT WALKER'], [45150, 96, 'elderTree', 'THE ELDER TREE'],
  [47150, -92, 'bunkerDish', 'THE SHIELD DISH'], [49150, 94, 'councilGlade', 'THE COUNCIL GLADE'],
  [51150, -96, 'roundCruiserGiant', 'THE ROUND CRUISER'], [53150, 98, 'superCapital', 'THE SUPER-CAPITAL'], [55150, -94, 'hollowWreck', 'THE HOLLOW WRECK'],
  [57150, 100, 'escortCarrier', 'THE ESCORT CARRIER'], [59150, -110, 'greatStation', 'THE GREAT STATION'],
  [61150, 96, 'gateTowers', 'THE GATE TOWERS'], [63150, -94, 'laserDish', 'THE SUPERLASER DISH'], [65150, 96, 'trenchTower', 'THE TRENCH TOWER'],
  [67150, -100, 'commandSpire', 'THE COMMAND SPIRE'], [69150, 98, 'reactorGlow', 'THE REACTOR GLOW'],
];

// ───────────────────────── the HAZARD LAYOUT (read by megarun.js) ─────────────────────────
// WEAVE ROWS in the lap's clear windows; the clear line swings 3 m a row (≤ 3 % per 100 m), as in
// Star Fox. Per lap: the windows used. The canyon weave (the Desert World) is the TIGHTEST slalom (a row
// in every window, its swing the steepest the rule allows); the forest moon's giant trees the FASTEST
// (rows the whole arc long, flown at the Kestrel's top speed). The interiors, the doors, the tilt
// sectors and the transitions take windows of their own.
const WINDOWS = { A: [240, 2], B: [480, 2], C: [800, 1], D: [980, 2], F: [1740, 4] };
const LAP_PLAN = [
  'F', 'D', 'ABCDF', 'ABDF', 'ABCDF',     // the Desert World (the canyon weave; its tilt slot 6,700)
  'D', 'ABDF', 'BD', 'ABDF', 'ABD',       // the Orbital Battle (THE ASTEROID CHASE 12,000–14,000 · door 15,900)
  'D', 'BD', 'ABD', 'F', 'BD',            // the Ice World (THE ICE CAVE 26,050)
  'BD', 'ABDF', 'BDF', 'ABDF', 'BD',      // the Cloud World (its tilt slot 35,300)
  'ABDF', 'ABDF', 'ABD', 'F', 'ABD',      // the Forest Moon (door 45,900 · THE SHIELD BUNKER 46,050)
  'BD', 'ABDF', 'BD', 'ABDF', 'BD',       // the Great Fleet Battle (door 55,900)
  '', 'BD', '', '', '',                   // the Great Station (the goal 60,900 · door 63,900 · THE TRENCH 64,050)
];
const ROW_KIND = ['rockSpire', 'asteroid', 'iceSpire', 'cloudTower', 'redwood', 'hullMast', 'greebleTower'];
const SWING = [0, 1, 2, 3, 2, 1, 0, -1, -2, -3, -2, -1];
// No weave row inside a transition zone, an interior's run-in, a door's run-in or the goal's.
const NO_ROWS = [[9700, 10300], [19700, 20300], [29700, 30300], [39700, 40300], [49700, 50300], [59700, 60300], [6440, 6800], [35220, 35380]];
const WEAVE = LAP_PLAN.flatMap((plan, lap) => [...plan].flatMap((w) => {
  const [l0, n] = WINDOWS[w];
  return Array.from({ length: n }, (_, j) => ({ d: lap * 2000 + l0 + j * 100, kind: ROW_KIND[Math.floor(lap / 5)] }));
})).filter((w) => w.d < SW_RUN && !NO_ROWS.some(([a, b]) => w.d > a && w.d < b)).map((w, k) => ({ ...w, offset: (SWING[k % SWING.length] * 3 + 16) % 16 }));

// TILT SECTORS (4, mandatory): the canyon slot (the Desert World), a cloud-tower slot, and two doorways
// indoors — the ice cave's and the trench entry's.
const TILTS = [[6700, -8, 'THE CANYON SLOT'], [35300, -8, 'THE TOWER GAP']];
const HALL_TILTS = [[26750, 0, 'THE ICE CAVE DOORWAY'], [64350, -6, 'THE TRENCH ENTRY']];
// LOOP DOORS (4): [door d, loop mark d, lane x, bottom key height (abs), name, look].
const DOORS = [
  [15900, 15760, 0, 22, 'THE DOCKING GATE', 'dockingGate'], [45900, 45760, 0, 22, 'THE BUNKER DOOR', 'bunkerDoor'],
  [55900, 55760, 0, 22, 'THE WRECK AIRLOCK', 'airlock'], [63900, 63760, 0, 22, 'THE TRENCH GATE', 'trenchGate'],
];

// THE INTERIORS (Great-Hall tech): a raised floor, a facade with one doorway, side walls, DIVE / CLIMB
// shafts (gap walls) and knife-edge doorways. THE ICE CAVE (crystal halls; THE HIDDEN HANGAR beside it),
// THE SHIELD BUNKER (behind its loop door; the bunker cache beside it) and THE TRENCH — two segments, the
// second narrower (THE NARROWS), open to the stars, turrets on the wall tops.
const HALLS = [
  { d0: 26050, d1: 27330, floor: 32, half: 18, outer: 34, door: { half: 14, y0: 34, y1: 58 }, cruise: 45, name: 'THE ICE CAVE', look: 'iceCave' },
  { d0: 46050, d1: 47330, floor: 32, half: 18, outer: 34, door: { half: 14, y0: 34, y1: 58 }, cruise: 45, name: 'THE SHIELD BUNKER', look: 'bunker' },
  { d0: 64050, d1: 66250, floor: 32, half: 18, outer: 34, door: { half: 14, y0: 34, y1: 58 }, cruise: 45, name: 'THE TRENCH', look: 'trench' },
  { d0: 66250, d1: 68000, floor: 32, half: 13, outer: 34, door: { half: 11, y0: 34, y1: 58 }, cruise: 45, name: 'THE NARROWS', look: 'trench' },
];
// gap walls: [d, x, opening y (abs), w, h, move]
const GAPS = [
  [26400, 0, 38, 14, 8, 'dive'], [27050, 0, 53, 14, 8, 'climb'],
  [46400, 0, 38, 14, 8, 'dive'], [47050, 0, 53, 14, 8, 'climb'],
];

// THE TARGET PORT (v1.7): one glowing ring past the trench — flying through it pays a big one-time coin
// burst and the full fanfare. Per flight: it pays once, never twice. [d, x, y (abs), r, coins]
export const TARGET_PORT = { d: 68150, x: 0, y: 44, r: 7, coins: 150, name: 'THE TARGET PORT' };

// SHOOTERS (the shared shooter system, reskinned): plasma streams ('dragon' kind = the fireball stream:
// fighters, skiffs, cloud cars, speeders, gunships), laser bolts ('archer' kind = the arrow: roof turrets,
// defense platforms, the walkers' chin guns, bunker turrets, the trench turrets on the wall tops).
// [d, x, y (muzzle, abs), aim ('plane' or [x, y]), look, patrol?]
const PLASMA = [
  [2300, 34, 30, [12, 24], 'skiff', [6, 7]], [4600, -34, 36, 'plane', 'skiff'], [8100, 34, 40, [0, 44], 'fighter', [8, 6]],
  [11600, -36, 40, 'plane', 'fighter'], [12800, 36, 46, [14, 40], 'fighter', [6, 7]], [16600, -34, 44, 'plane', 'fighter'], [18200, 36, 50, [0, 52], 'fighter', [8, 6]], [19400, -34, 38, 'plane', 'fighter'],
  [21700, 34, 34, 'plane', 'fighter'], [23300, -36, 40, [-12, 30], 'fighter', [6, 8]], [28600, -36, 40, [0, 44], 'fighter', [6, 7]],
  [33300, 34, 44, 'plane', 'cloudCar'], [38200, -34, 40, [0, 44], 'cloudCar', [6, 7]],
  [41600, 34, 34, 'plane', 'speeder'], [43300, -34, 40, [0, 44], 'speeder', [6, 7]], [48100, 34, 38, 'plane', 'speeder'], [49000, -36, 44, [14, 40], 'speeder'],
  [50700, 34, 44, 'plane', 'gunship'], [51300, -36, 50, [0, 52], 'gunship', [8, 6]], [52100, 36, 40, 'plane', 'gunship'], [52900, -34, 46, [-14, 40], 'gunship'],
  [53700, 34, 52, 'plane', 'gunship', [6, 7]], [54500, -36, 40, [0, 44], 'gunship'], [56500, 36, 48, 'plane', 'gunship'], [57100, -34, 44, [14, 40], 'gunship', [8, 6]],
  [57700, 34, 50, 'plane', 'gunship'], [58300, -36, 40, [-12, 34], 'gunship'], [58900, 36, 46, 'plane', 'gunship', [6, 8]], [59500, -34, 52, [0, 54], 'gunship'],
  [60800, -34, 40, 'plane', 'fighter'], [62300, 36, 44, [0, 44], 'fighter', [6, 7]], [63300, -34, 50, 'plane', 'fighter'],
];
const BOLTS = [
  [5800, 32, 14, 'plane', 'turret'], [9300, -32, 14, 'plane', 'turret'],
  [13600, 30, 36, 'plane', 'platform'], [17800, -30, 40, 'plane', 'platform'],
  [22500, -34, 28, 'plane', 'walker'], [24100, 34, 28, 'plane', 'walker'], [25300, -34, 28, 'plane', 'walker'], [28300, 34, 28, 'plane', 'walker'], [29100, -34, 28, 'plane', 'walker'],
  [26850, 16, 50, 'plane', 'hall'],
  [36300, -32, 30, 'plane', 'platform'],
  [42400, 32, 14, 'plane', 'turret'], [44400, -32, 14, 'plane', 'turret'], [48200, 32, 14, 'plane', 'turret'], [46850, -16, 50, 'plane', 'hall'], [47200, 16, 50, 'plane', 'hall'],
  [51700, -30, 40, 'plane', 'platform'], [52500, 30, 44, 'plane', 'platform'], [53100, 30, 46, 'plane', 'platform'], [54300, -30, 36, 'plane', 'platform'], [56900, 30, 44, 'plane', 'platform'], [58600, -30, 50, 'plane', 'platform'],
  [61700, -32, 18, 'plane', 'turret'], [62700, 32, 18, 'plane', 'turret'],
  [64600, 21, 74, 'plane', 'turret'], [65100, -21, 74, 'plane', 'turret'], [65700, 21, 74, 'plane', 'turret'], [66500, -16, 74, 'plane', 'turret'], [67000, 16, 74, 'plane', 'turret'], [67500, -16, 74, 'plane', 'turret'], [67800, 16, 74, 'plane', 'turret'],
];

// WILD flyers (big bonk critters on sine paths): fighters crossing the desert and the forest, squadrons
// in formation (three at once) in both space battles, and the asteroid chase's floating MINES (a
// bumpable variant: still, blinking, bonk). [d, x, y, ax, ay, period, phase, look, r?]
const WILD = [
  [1700, -14, 30, 10, 4, 6, 0, 'fighter'], [5300, 14, 38, 10, 5, 7, 1.2, 'fighter'], [9500, -14, 34, 10, 4, 6, 2.1, 'fighter'],
  ...[11900, 15300, 18700, 51900, 53500, 58100].flatMap((d, i) => [[d, -10, 40, 6, 3, 8, i], [d + 10, 0, 44, 6, 3, 8, i], [d + 20, 10, 40, 6, 3, 8, i]].map((w) => [...w, 'fighter'])),
  ...[[12250, -12, 24], [12300, 10, 40], [13250, 2, 32], [13300, -16, 46], [16900, 14, 28], [17350, -6, 38], [19050, 8, 46], [52450, 12, 36]].map(([d, x, y]) => [d, x, y, 0, 0, 1, 0, 'mine', 2.6]),
  [42900, -16, 40, 6, 6, 8, 0.4, 'fighter'], [47900, 16, 36, 6, 6, 7, 2.2, 'fighter'],
  [61300, -14, 38, 6, 6, 7, 0.8, 'fighter'], [62900, 14, 42, 6, 6, 8, 1.7, 'fighter'],
];
// THERMALS (the Desert World's canyon thermals; the Cloud World's updrafts between the towers — its rich
// aid): [d, x, r, lift]
const THERMALS = [
  [1300, -21, 10, 4], [2600, 21, 10, 4], [4300, -21, 10, 4], [5700, 21, 10, 4], [7300, -21, 10, 4], [8300, 21, 10, 4],
  ...Array.from({ length: 18 }, (_, i) => [30600 + i * 520, i % 2 ? 21 : -21, 10, 5]),
];
// SOLAR-WIND LANES through both space battles (the wind-lane mechanic: only for a plane at ≥ 50 m/s) and
// the Desert World's canyon draughts over its thermals (the fresh corner rides them): [d0, d1, x, y, w, h, push].
export const SW_WIND_MIN = 50;
const LANE_LAPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16, 17, 18, 19, 25, 26, 27, 28];
const LANES = LANE_LAPS.flatMap((lap) => [[lap * 2000 + 100, lap * 2000 + 700], [lap * 2000 + 1000, lap * 2000 + 1600]])
  .map(([d0, d1]) => [d0, d1, 0, 52, 40, 18, 9]);

// The SPECTACLE moments (looks only; 2 per arc): [d, kind, NAME, side]
const SPECTACLES = [
  [2800, 'flyby', 'THE FIGHTERS SCREAM OVER', 1], [7600, 'sandworm', 'THE SAND BEAST RISES', -1],
  [12600, 'jumpIn', 'THE FLEET JUMPS IN', 1], [17600, 'barrage', 'THE BROADSIDE', -1],
  [22600, 'volley', 'THE WALKER GUNS', 1], [28400, 'avalanche', 'THE AVALANCHE', -1],
  [32600, 'rainbow', 'SUNSET OVER THE CLOUD SEA', 1], [37600, 'flyby', 'THE CLOUD CAR PATROL', -1],
  [42600, 'flock', 'THE GLIDER FLOCK', 1], [48400, 'eruption', 'THE SHIELD GENERATOR BLOWS', -1],
  [52600, 'flagship', 'THE SUPER-CAPITAL', 1], [57600, 'jumpIn', 'THE SECOND FLEET JUMPS IN', -1],
  [62400, 'barrage', 'THE SURFACE GUNS', -1], [68900, 'salute', 'VICTORY FIREWORKS', 1],
];
// THE STATION GATES (the goal's arch, an outer gate of towers) and THE GREAT STATION itself (the moon-sized
// battle station: seen from 3,000 m out over the fleet battle, growing). The game has no bosses.
const FORTRESS = { gates: 60900, look: 'station', head: { d: 59150, x: -110, from: 3000, look: 'station' } };

export const SW_MEGA = {
  starwars: {
    run: SW_RUN,
    // the reskins of the shared systems (megaview.js): the fighter model, plasma / bolt / dust colours
    skin: { flyer: 'raven', fire: [0xe8ffe8, 0x3fe05a], bolt: 0x3aff5a, lava: [0xfffbe0, 0xffa21f], dust: 0xffffff, posts: 'starwars' },
    weave: WEAVE,
    tilts: TILTS.map(([d, x, name]) => ({ d, x, name })),
    hallTilts: HALL_TILTS.map(([d, x, name]) => ({ d, x, name })),
    doors: DOORS.map(([d, loopD, x, y, name, look]) => ({ d, loopD, x, y, name, look })),
    shooters: [
      ...PLASMA.map(([d, x, y, aim, look, patrol]) => ({ kind: 'dragon', d, x, y, aim, look, ...(patrol ? { patrol } : {}) })),
      ...BOLTS.map(([d, x, y, aim, look]) => ({ kind: 'archer', d, x, y, aim, look })),
    ].sort((a, b) => a.d - b.d),
    halls: HALLS,
    gaps: GAPS.map(([d, x, y, w, h, move]) => ({ d, x, y, w, h, move })),
    caves: [],
    water: [],
    wild: WILD.map(([d, x, y, ax, ay, period, phase, look, r]) => ({ d, x, y, ax, ay, period, phase, look, ...(r ? { r } : {}) })),
    thermals: THERMALS.map(([d, x, r, lift]) => ({ d, x, r, lift })),
    lanes: LANES.map(([d0, d1, x, y, w, h, push]) => ({ d0, d1, x, y, w, h, push, min: SW_WIND_MIN })),
    spectacles: SPECTACLES.map(([d, kind, name, side]) => ({ d, kind, name, side, big: kind === 'flagship' })),
    transitions: SW_TRANSITIONS,
    fortress: FORTRESS,
    port: TARGET_PORT,
  },
};

// ───────────────────────── the LONG-RUN SET PIECES (≥ 10 authored pieces per 1,000 m zone) ─────────────────────────
// Per zone: its banner arch, 9 coin fly-throughs (arcs, rings, hoop lines — order + heights shuffled per
// zone; the Cloud World's zones get two more: its rich coins), the hero landmark (every other zone) and
// the long-run boost frames (the high lines). Each piece keeps clear of the mega layer and of the base
// lap's solids; inside an interior they sit low over its raised floor.
const BUSY_MEGA = [
  ...WEAVE.map((w) => [w.d - 12, w.d + 12]), ...TILTS.map(([d]) => [d - 14, d + 14]), ...HALL_TILTS.map(([d]) => [d - 14, d + 14]),
  ...DOORS.map(([d, loopD]) => [loopD - 40, d + 60]), ...WILD.map(([d]) => [d - 14, d + 14]),
  ...GAPS.map(([d]) => [d - 14, d + 14]), ...HALLS.map((h) => [h.d0 - 30, h.d0 + 20]), [TARGET_PORT.d - 30, TARGET_PORT.d + 30],
];
const inHall = (d) => HALLS.some((h) => d >= h.d0 - 10 && d <= h.d1 + 10);
const LAP_SOLID = [[410, 430], [690, 800], [1432, 1448], [1472, 1588], [1610, 1630], [1650, 1670]];
const lapSolid = (d0, d1) => { const a = d0 % 2000, b = a + (d1 - d0); return LAP_SOLID.some(([x, y]) => a < y && x < b) || (b > 2000 && LAP_SOLID.some(([x, y]) => b - 2000 > x)); };
const clearSpan = (d0, d1) => !BUSY_MEGA.some(([a, b]) => d0 < b && a < d1) && !lapSolid(d0, d1);
// Long-run boost frames (8, on the high lines; the three pockets + goal approach add the rest in shapes.js): [zone, shape, x, y]
const FRAMES = [[4, 'triangle', 0, 46], [12, 'rectangle', 0, 50], [21, 'oval', 6, 44], [31, 'triangle', 0, 48], [38, 'square', -6, 46], [43, 'rectangle', 0, 50], [52, 'circle', 0, 44], [58, 'triangle', 0, 48]];
let seed = 1;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
export function starWarsPieces() {
  seed = 4242;
  const out = [];
  let n = 0;
  const id = () => `starwars-${++n}`;
  const spot = (want, len, lo, hi) => {
    for (let k = 0; k < 40; k++) for (const s of [1, -1]) {
      const d = Math.round(want + s * k * 9);
      if (d >= lo && d + len <= hi && clearSpan(d - 4, d + len + 4) && !out.some((p) => Math.abs(p.d - d) < 22)) return d;
    }
    return null;
  };
  for (let z = 0; z < SW_ZONES.length; z++) {
    const z0 = z * 1000, z1 = z0 + 1000, rich = swArcIndex(z0) === 3;
    const bd = spot(z0 + 40, 0, z0 + 10, z0 + 200) ?? z0 + 40;
    out.push({ kind: 'bannerArch', d: bd, x: 0, y: inHall(bd) ? 18 : 34, text: SW_ZONES[z], id: id() });
    const hero = SW_HEROES.find(([d]) => d >= z0 && d < z1);
    if (hero) out.push({ kind: 'landmark', d: hero[0], x: hero[1], y: 0, look: hero[2], scale: 1, name: hero[3], id: id() });
    const fr = FRAMES.find(([zz]) => zz === z);
    const kinds = ['coinArc', 'coinArc', 'coinArc', 'coinRing', 'coinRing', 'coinRing', 'hoops', 'hoops', fr ? 'shape' : 'coinArc', ...(rich ? ['coinRing', 'coinArc'] : [])];
    for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
    const step = Math.floor(860 / kinds.length);
    kinds.forEach((k0, i) => {
      const want = z0 + 100 + i * step + Math.round(rnd() * 30);
      let kind = k0, len = kind === 'coinArc' ? 45 + 15 * Math.floor(rnd() * 3) : kind === 'hoops' ? 70 : 0;
      let d = spot(want, len, z0 + 60, z1 - 10);
      if (d === null && kind === 'coinArc') { len = 30; d = spot(want, len, z0 + 60, z1 - 10); }
      if (d === null && kind !== 'shape') { kind = 'coinRing'; len = 0; d = spot(want, 0, z0 + 60, z1 - 10); }
      if (d === null) return;
      const x0 = [0, -8, 8, 0, -12, 12, 4, -4][Math.floor(rnd() * 8)], x = inHall(d) || inHall(d + len) ? Math.max(-6, Math.min(6, x0)) : x0; // (the narrows: inside the walls)
      const y0 = [14, 22, 30, 38, 44, 18, 26, 46][Math.floor(rnd() * 8)], y = inHall(d) || inHall(d + len) ? 6 + (y0 % 12) : y0;
      if (kind === 'coinArc') out.push({ kind, d, x, y: Math.min(y, 46), len, rise: [5, 8, 6][Math.floor(rnd() * 3)], sway: rnd() < 0.5 ? -4 : 4, id: id() });
      else if (kind === 'coinRing') out.push({ kind, d, x, y, r: 3, id: id() });
      else if (kind === 'hoops') out.push({ kind, d, x: Math.max(-10, Math.min(10, x)), y: Math.min(y, 46), n: 4, gap: 22, zig: 3, id: id() });
      else out.push({ kind: 'shape', d, x: fr[2], y: fr[3], shape: fr[1], id: id() });
    });
  }
  return out.sort((a, b) => a.d - b.d);
}
