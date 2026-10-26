// v1.6 S14 STAR FOX — the authored data of the 70,000 m planet-hopping MEGA-STAGE (a Star Fox 64 love
// letter). Seven 10,000 m ARCS — green world, asteroid belt, ocean world, the fleet, desert world, solar
// world, the boss world — with a scripted ASCENT / DESCENT transition zone at each of the six boundaries,
// seventy named 1,000 m zones, the hazard layout read by the SHARED mega layer (megarun.js: weave rows,
// tilt sectors, loop doors, shooters, wild flyers + mines, interiors, caves, the underwater sector,
// thermals, solar-wind lanes), fourteen spectacle moments, the hero landmarks and the long-run set
// pieces. Everything at ABSOLUTE metres. The shooter system (shooters.js) and Loop Doors (loopdoors.js)
// are reused unchanged: bolts, plasma, flares and gates are stage-data reskins (`skin`, `look`).
// Pure data + maths (no DOM / three.js). See BALANCE.md "Star Fox (v1.6)".

export const SF_RUN = 70000;
export const SF_ARC_LEN = 10000;
export const SF_BLEND = 300; // the transition zones: ±300 m about each arc boundary (600 m)

// ───────────────────────── the base lap (repeats every 2,000 m, like every world) ─────────────────────────
// Lap-local metres. Three pockets (the standard pattern: lap furniture), a loop ring, two dive gates,
// a STATION APPROACH buoy course; the mega layer keeps clear of all of it.
export const SF_LAP = {
  loopRing: { d: 900, x: 0, yc: 20, R: 12 },
  diveGates: [{ d: 420, x: 0, w: 10, h: 8 }, { d: 1660, x: 6, w: 10, h: 8 }],
  course: [1480, 1505, 1530, 1555, 1580],
  // the SERVICE TUNNEL (right; the cavern tech as a lit block) and the STATION SLOT (a knife-edge gap)
  cavern: { shape: 'block', start: 700, mouth: 705, exit: 785, end: 790, height: 30, laneMin: 14, laneMax: 26, edge: 9, roof: 10, lit: true },
  slot: { d: 1620, x: 14, gap: 2, wall: 2.5, h: 12, look: 'station' },
  // the GANTRY BRIDGE over the river (fly under it or over it)
  bridge: { kind: 'stone', d: 1440, x0: -30, x1: 30, under: 12, thick: 3, depth: 8 },
  busy: [[120, 240], [360, 480], [640, 960], [1120, 1360], [1420, 1640], [1600, 1720]],
};

// ───────────────────────── the seven ARCS ─────────────────────────
// space = a space arc (a dark starfield sky with a bright nebula colour — normal Sleek rendering, not
// the Neon outline style). The rest like Dragon War's arcs (terrain grammar, palette, lights, scenery,
// particles, the dressing kit, ambient life, ten zone names).
export const SF_ARCS = [
  { id: 'greenworld', name: 'THE GREEN WORLD', from: 0, to: 10000,
    ground: { style: 'rolling', center: 4, side: 14, peaks: 18 }, water: [0.3, 0.62, 0.9],
    pal: { low: [0.28, 0.5, 0.3], grass: [0.36, 0.72, 0.3], high: [0.5, 0.58, 0.4] }, base: 0x5fbf4a, rock: 0x8a8070,
    sky: 0x8fd0ff, sun: 0xfff6e0, hemi: 0x5f9a4a, cloud: 0xffffff,
    scenery: { kind: 'mixed', trees: 12, rocks: 3, cone: 0x2f6b3a, ball: 0x4fb34a, trunk: 0x6b4423 },
    particles: { kind: 'motes', color: 0xfff6c0, dir: 1 },
    kit: ['farmField', 'pine', 'windmill', 'farmField', 'waterfall', 'lakeBand', 'pine', 'radarDish'],
    ambient: ['motes', 'songbirds', 'waterfalls', 'windmills'],
    zones: ['CORNERIA CITY', 'GREEN PLAINS', 'LAKE VERDANT', 'PINE HILLS', 'FARMLANDS', 'WINDMILL VALLEY', 'THE WATERFALL CAVES', 'THE GREAT FALLS', 'DEFENSE LINE', 'LAUNCH BASE'] },
  { id: 'asteroids', name: 'THE ASTEROID BELT', from: 10000, to: 20000, space: true, planet: [0x3f86e8, 0x4fb35a], // the Green World left behind
    ground: { style: 'rolling', center: 1, side: 3 },
    pal: { low: [0.16, 0.16, 0.22], grass: [0.24, 0.23, 0.3], high: [0.36, 0.34, 0.4] }, base: 0x2a2836, rock: 0x6a6670,
    sky: 0x0a0c24, sun: 0xfff0e0, hemi: 0x3a3a5a, cloud: 0x7a7686,
    scenery: { kind: 'none', trees: 0, rocks: 6, cone: 0x3a3a44, ball: 0x4a4a54, trunk: 0x3a3a44 },
    particles: { kind: 'stardust', color: 0xcfe0ff, dir: -1 },
    kit: ['asteroidBig', 'asteroidSmall', 'asteroidBig', 'iceAsteroid', 'mineBuoy', 'beacon', 'derelict', 'asteroidBig'],
    ambient: ['stardust', 'squadrons', 'tumblingRocks', 'navLights'],
    zones: ['ORBIT GATE', 'THE OUTER BELT', 'ROCK FIELD', 'THE MINEFIELD', 'MINERS\' RUN', 'THE PINCH', 'THE WARP GATE', 'COMET ALLEY', 'ICE FIELD', 'THE INNER BELT'] },
  { id: 'oceanworld', name: 'THE OCEAN WORLD', from: 20000, to: 30000,
    ground: { style: 'rolling', center: 1.5, side: 10, peaks: 14 }, water: [0.2, 0.5, 0.75],
    pal: { low: [0.12, 0.38, 0.62], grass: [0.16, 0.5, 0.7], high: [0.86, 0.8, 0.56] }, base: 0x2a7ab8, rock: 0x8a7a6a,
    sky: 0x7fd8f0, sun: 0xfffbe8, hemi: 0x2a6a8a, cloud: 0xffffff,
    scenery: { kind: 'palm', trees: 4, rocks: 3, cone: 0x2f8a4a, ball: 0x3fae5a, trunk: 0x9a7046 },
    particles: { kind: 'bubbles', color: 0xd8f6ff, dir: 1 },
    kit: ['island', 'coralTower', 'shell', 'island', 'slickBuoy', 'coralTower', 'kelp', 'island'],
    ambient: ['bubbles', 'seagulls', 'jellyfish', 'lightShafts'],
    zones: ['SPLASHDOWN', 'ISLAND CHAIN', 'THE POLLUTED BAY', 'SLICK WATERS', 'THE DROP', 'CORAL GARDENS', 'KELP CANYON', 'THE SUNKEN GATE', 'THE WHALE ROAD', 'THE BLUE DEEP'] },
  { id: 'fleet', name: 'THE FLEET', from: 30000, to: 40000, space: true, planet: [0x2a7ab8, 0xd8f6ff], // the Ocean World below
    ground: { style: 'rolling', center: 1, side: 2 },
    pal: { low: [0.14, 0.12, 0.22], grass: [0.2, 0.18, 0.3], high: [0.3, 0.26, 0.4] }, base: 0x221c34, rock: 0x5a5a6a,
    sky: 0x1a0c34, sun: 0xffe8ff, hemi: 0x4a2a6a, cloud: 0x6a5a86,
    scenery: { kind: 'none', trees: 0, rocks: 2, cone: 0x3a3a44, ball: 0x4a4a54, trunk: 0x3a3a44 },
    particles: { kind: 'stardust', color: 0xffd0ff, dir: -1 },
    kit: ['cruiser', 'frigate', 'debris', 'cruiser', 'beacon', 'frigate', 'capitalHull', 'debris'],
    ambient: ['stardust', 'squadrons', 'navLights', 'driftingShips'],
    zones: ['THE PICKET LINE', 'HULL ALLEY', 'THE GUN DECK', 'NEBULA DRIFT', 'THE STATION RING', 'CARRIER ROW', 'THE BROADSIDE', 'FLAGSHIP WAKE', 'THE ARMADA', 'THE LAST CRUISER'] },
  { id: 'desertworld', name: 'THE DESERT WORLD', from: 40000, to: 50000,
    ground: { style: 'rolling', center: 3, side: 12, peaks: 10 },
    pal: { low: [0.76, 0.6, 0.36], grass: [0.88, 0.72, 0.44], high: [0.8, 0.64, 0.42] }, base: 0xe2b56a, rock: 0xb08a5a,
    sky: 0xffd9a0, sun: 0xfff2d0, hemi: 0xa8844a, cloud: 0xfff4e0,
    scenery: { kind: 'cactus', trees: 3, rocks: 4, cone: 0x4f8a3a, ball: 0x5fa040, trunk: 0x8a6a40 },
    particles: { kind: 'sand', color: 0xf0d090, dir: 1 },
    kit: ['dune', 'tankWreck', 'obelisk', 'ruinCol', 'dune', 'dustDevil', 'tankWreck', 'obelisk'],
    ambient: ['sand', 'vultures', 'dustDevils', 'crawlers'],
    zones: ['DUNE SEA', 'TANK GRAVEYARD', 'THE DUST VEIL', 'OASIS', 'THE GREAT PYRAMID', 'THE BURIED TOMB', 'OBELISK ROAD', 'SPHINX VALLEY', 'SANDSTORM FLATS', 'THE LAST DUNE'] },
  { id: 'solarworld', name: 'THE SOLAR WORLD', from: 50000, to: 60000, space: true, planet: [0xffb02a, 0xfff2a0], // the star itself
    ground: { style: 'rolling', center: 2, side: 8 }, lava: [1, 0.62, 0.16],
    pal: { low: [0.5, 0.16, 0.06], grass: [0.62, 0.24, 0.08], high: [0.4, 0.14, 0.08] }, base: 0x8a2a10, rock: 0x4a2018,
    sky: 0x3a0a10, sun: 0xffd0a0, hemi: 0xc0501a, cloud: 0xb06a4a,
    scenery: { kind: 'none', trees: 0, rocks: 4, cone: 0x2a1a18, ball: 0x3a2018, trunk: 0x2a1a18 },
    particles: { kind: 'embers', color: 0xffc040, dir: 1 },
    kit: ['flareCrown', 'lavaPlume', 'sunspot', 'flareCrown', 'lavaFall', 'heatShimmer', 'sunspot', 'lavaPlume'],
    ambient: ['embers', 'flareCrowns', 'lavaFalls', 'lavaRivers'],
    zones: ['THE CORONA', 'MOLTEN SEA', 'FLARE FIELDS', 'SUNSPOT REACH', 'HEAT RISE', 'THE CORONA GATE', 'THE ECLIPSE', 'PLASMA FALLS', 'THE RINGED HORIZON', 'SOLAR EDGE'] },
  { id: 'bossworld', name: 'THE BOSS WORLD', from: 60000, to: 70000,
    ground: { style: 'rolling', center: 3, side: 18, peaks: 26 }, lava: [1, 0.3, 0.1],
    pal: { low: [0.36, 0.12, 0.12], grass: [0.5, 0.2, 0.16], high: [0.6, 0.3, 0.24] }, base: 0x6a2420, rock: 0x7a3a30,
    sky: 0x6a2a4a, sun: 0xffc0c0, hemi: 0x5a1a2a, cloud: 0x8a5a6a,
    scenery: { kind: 'none', trees: 0, rocks: 6, cone: 0x3a1a1a, ball: 0x4a2020, trunk: 0x3a1a1a },
    particles: { kind: 'embers', color: 0xff6a3a, dir: 1 },
    kit: ['strataRock', 'fortressWall', 'searchlight', 'strataRock', 'smoke', 'fortressWall', 'turretTower', 'searchlight'],
    ambient: ['embers', 'searchlights', 'smokeColumns', 'squadrons'],
    zones: ['VENOM CANYON', 'THE FORTRESS GATES', 'RED ROCK RUN', 'THE OUTER WALLS', 'THE HANGAR HALLS', 'THE SHAFTS', 'THE CORE PLAZA', 'THE GUARDIAN', 'THE INNER SANCTUM', 'THE CORE'] },
];
// The animated ambient vocabulary (megaview.js draws each): drifting particles, sky + flock life, and
// the dressing that moves — each animated dressing element needs its kit piece in the arc's kit.
export const SF_AMBIENT = {
  motes: 'particles', stardust: 'particles', bubbles: 'particles', sand: 'particles', embers: 'particles',
  songbirds: 'flock', squadrons: 'flock', seagulls: 'flock', vultures: 'flock',
  waterfalls: 'waterfall', windmills: 'windmill', tumblingRocks: 'asteroidBig', navLights: 'beacon', jellyfish: 'kelp',
  lightShafts: 'sky', driftingShips: 'cruiser', dustDevils: 'dustDevil', crawlers: 'tankWreck', flareCrowns: 'flareCrown',
  lavaFalls: 'lavaFall', lavaRivers: 'ditches', searchlights: 'searchlight', smokeColumns: 'smoke',
};
export const sfArcIndex = (d) => Math.max(0, Math.min(SF_ARCS.length - 1, Math.floor(d / SF_ARC_LEN)));
export const SF_ZONES = SF_ARCS.flatMap((a) => a.zones);
// Each zone shifts its arc's palette: [brightness, warm (r up / b down)] — no two neighbours alike.
export const sfZoneTint = (k, out = [0, 0]) => { out[0] = 1 + 0.07 * Math.sin(k * 2.61 + 0.9); out[1] = 0.03 * Math.sin(k * 1.53 + 0.3); return out; };

// ───────────────────────── the six TRANSITION ZONES (the signature of the stage) ─────────────────────────
// ±300 m about each arc boundary: an ASCENT (a climb band — sky, fog and palette lerp surface → space,
// air wisps give way to stars, a banner moment) or a DESCENT (re-entry glow streaks, a cloud layer, the
// palette lerps space → surface). Scenery + sky data only: the flight line stays flyable throughout.
export const TRANSITIONS = [
  ['ascent', 'ASCENT: BREAKING ORBIT'], ['descent', 'DESCENT: OCEAN RE-ENTRY'], ['ascent', 'ASCENT: SPRAY TO SPACE'],
  ['descent', 'DESCENT: DESERT RE-ENTRY'], ['ascent', 'ASCENT: INTO THE CORONA'], ['descent', 'DESCENT: VENOM RE-ENTRY'],
].map(([kind, name], i) => ({ kind, name, d: (i + 1) * SF_ARC_LEN, d0: (i + 1) * SF_ARC_LEN - SF_BLEND, d1: (i + 1) * SF_ARC_LEN + SF_BLEND, from: SF_ARCS[i].id, to: SF_ARCS[i + 1].id }));
export const transitionAt = (d) => TRANSITIONS.find((t) => d >= t.d0 && d <= t.d1) ?? null;

// ───────────────────────── HERO LANDMARKS (one per 2,000 m; outside the corridor, BIG) ─────────────────────────
// [d, x, look, NAME]. Built by setpieces.js; the names are printed in BALANCE.md.
export const SF_HEROES = [
  [1150, -88, 'cornerianCity', 'CORNERIA CITY'], [3150, 90, 'greatFalls', 'THE GREAT FALLS'], [5150, -86, 'windmillHill', 'WINDMILL HILL'],
  [7150, 92, 'defenseTower', 'THE DEFENSE TOWER'], [9150, -94, 'launchBase', 'THE LAUNCH BASE'],
  [11150, 96, 'derelictStation', 'THE DERELICT STATION'], [13150, -98, 'giantAsteroid', 'THE GIANT ASTEROID'], [15150, 92, 'warpFrame', 'THE OLD WARP FRAME'],
  [17150, -94, 'mineRig', 'THE MINING RIG'], [19150, 96, 'crystalRock', 'THE CRYSTAL ROCK'],
  [21150, -90, 'pollutedRig', 'THE POLLUTED RIG'], [23150, 92, 'lighthouseIsle', 'LIGHTHOUSE ISLE'], [25150, -94, 'sunkenWreck', 'THE SUNKEN WRECK'],
  [27150, 90, 'coralCastle', 'THE CORAL CASTLE'], [29150, -92, 'giantShell', 'THE GIANT SHELL'],
  [31150, 98, 'stationRing', 'THE STATION RING'], [33150, -100, 'battleship', 'THE BATTLESHIP'], [35150, 98, 'carrier', 'THE CARRIER'],
  [37150, -96, 'defensePlatform', 'THE DEFENSE PLATFORM'], [39150, 100, 'dreadnought', 'THE DREADNOUGHT'],
  [41150, -92, 'sandCrawler', 'THE SAND CRAWLER'], [43150, 94, 'tankGraveyard', 'THE TANK GRAVEYARD'], [45150, 96, 'sphinx', 'THE SPHINX'],
  [47150, -92, 'desertOasis', 'THE OASIS'], [49150, 94, 'obeliskRow', 'THE OBELISK ROW'],
  [51150, -96, 'sunspotCrater', 'THE SUNSPOT'], [53150, 98, 'flareArch', 'THE FLARE CROWN'], [55150, -94, 'solarStation', 'THE SOLAR STATION'],
  [57150, 100, 'ringedPlanet', 'THE RINGED PLANET'], [59150, -96, 'coronaSpire', 'THE CORONA SPIRE'],
  [61150, 96, 'gateBastion', 'THE GATE BASTION'], [63150, -94, 'fortressKeep', 'THE FORTRESS KEEP'], [65150, 96, 'hangarTower', 'THE HANGAR TOWER'],
  [67150, -100, 'guardianHead', 'THE GUARDIAN HEAD'], [69150, 98, 'theCore', 'THE CORE'],
];

// ───────────────────────── the HAZARD LAYOUT (read by megarun.js) ─────────────────────────
// WEAVE ROWS in the lap's clear windows; the clear line swings 3 m a row (≤ 3 % per 100 m), as in
// Dragon War. Per lap: the windows used. The asteroid belt is densest mid-arc; the interiors, the
// underwater canyon's door, the tilt sectors and the transitions take windows of their own.
const WINDOWS = { A: [240, 2], B: [480, 2], C: [800, 1], D: [980, 2], F: [1870, 2] }; // (v1.9 pocket audit: F 1,740 × 4 → 1,870 × 2, clear of the pockets' exits)
const LAP_PLAN = [
  'F', 'D', 'BD', 'D', 'F',              // the Green World (the waterfall caves 3,660 · 6,960 (its tilt slot 6,940; v1.9: was 6,660 / 6,640) · 9,000)
  'D', 'ABD', 'BD', 'ABDF', 'ABD',       // the Asteroid Belt (the pinch 14,300 · door 15,900)
  'D', 'BD', 'ABDF', 'ABD', 'D',         // the Ocean World (THE DROP 24,800 · door 27,900)
  'BD', 'ABDF', 'BDF', 'ABDF', 'BD',     // the Fleet
  'D', 'BD', '', 'BDF', 'BD',            // the Desert World (THE GREAT PYRAMID 44,000)
  'D', 'B', 'D', 'BD', 'D',              // the Solar World (door 55,900)
  'D', 'BD', '', 'BD', 'D',              // the Boss World (door 63,900 · THE FORTRESS 64,050)
];
const ROW_KIND = ['pine', 'asteroid', 'coral', 'hullMast', 'obelisk', 'plasma', 'redSpire'];
const SWING = [0, 1, 2, 3, 2, 1, 0, -1, -2, -3, -2, -1];
// No weave row inside a transition zone (the sky is busy enough there), an interior, a cave or THE DROP's entry.
const NO_ROWS = [[9700, 10300], [19700, 20300], [29700, 30300], [39700, 40300], [49700, 50300], [59700, 60300], [6860, 7160], [8900, 9200], [24700, 24900]];
const WEAVE = LAP_PLAN.flatMap((plan, lap) => [...plan].flatMap((w) => {
  const [l0, n] = WINDOWS[w];
  return Array.from({ length: n }, (_, j) => ({ d: lap * 2000 + l0 + j * 100, kind: ROW_KIND[Math.floor(lap / 5)] }));
})).filter((w) => w.d < SF_RUN && !NO_ROWS.some(([a, b]) => w.d > a && w.d < b)).map((w, k) => ({ ...w, offset: (SWING[k % SWING.length] * 3 + 16) % 16 }));

// TILT SECTORS (4, mandatory): [d, slot x, name, hall?]. The waterfall-cave entry slot (its slot is the
// cave's lane), the asteroid pinch gap, the pyramid doorway and the fortress doorway (indoors).
const TILTS = [[6940, -16, 'THE FALLS SLOT'], [14300, 8, 'THE ASTEROID PINCH']];
const HALL_TILTS = [[44700, 0, 'THE PYRAMID DOORWAY'], [64750, -6, 'THE FORTRESS DOORWAY']];
// LOOP DOORS (4): [door d, loop mark d, lane x, bottom key height (abs), name, look].
const DOORS = [
  [15900, 15760, 0, 22, 'THE WARP GATE', 'warpGate'], [27900, 27760, 0, 22, 'THE SUNKEN GATE', 'sunkenGate'],
  [55900, 55760, 0, 22, 'THE CORONA GATE', 'coronaGate'], [63900, 63760, 0, 22, 'THE FORTRESS DOOR', 'fortressDoor'],
];
// KEY RINGS (owner playtest 2026-10-25, no loop): per door [ring d, x, y] — one giant ring ≥ 1,000 m before its
// door, off the centreline (|x| ≥ 40 % of the corridor's half-width), a different spot for every door.
const DOOR_KEYS = [[14860, -12, 31], [26860, -14, 29], [54860, -16, 33], [62860, -13, 31]]; // (left of the line: a 30 m block stands right of it)

// THE INTERIORS (Great-Hall tech): a raised floor, a facade with one doorway, side walls, DIVE / CLIMB
// shafts (gap walls) and a knife-edge doorway. THE GREAT PYRAMID (treasure halls; THE BURIED TOMB's
// portal opens at its foot) and THE FORTRESS (hangar halls behind its loop door; turrets on the gantries).
const HALLS = [
  { d0: 44000, d1: 45280, floor: 32, half: 18, outer: 34, door: { half: 14, y0: 34, y1: 58 }, cruise: 45, name: 'THE GREAT PYRAMID', look: 'pyramid' },
  { d0: 64050, d1: 65450, floor: 32, half: 18, outer: 34, door: { half: 14, y0: 34, y1: 58 }, cruise: 45, name: 'THE FORTRESS', look: 'fortress' },
];
// gap walls: [d, x, opening y (abs), w, h, move]
const GAPS = [
  [44350, 0, 38, 14, 8, 'dive'], [45000, 0, 53, 14, 8, 'climb'],
  [64300, 0, 38, 14, 8, 'dive'], [64550, 0, 53, 14, 8, 'climb'], [65050, 0, 38, 14, 8, 'dive'],
];
// THE WATERFALL CAVES (the Green World's signature): a falls pours over each mouth; fly THROUGH it into
// the cavern sector behind. The first is the tilt sector's (its slot is the cave lane).
const CAVES = [
  { d0: 3900, d1: 4040, x0: -30, // (v1.9 pocket audit: 3,660 → 3,900, out of the BURIED TOMB's exit)
    x1: -4, lane: [-22, -10], roof: 13, top: 42, cruise: 7, name: 'THE WATERFALL CAVE', falls: true, clearApproach: true },
  { d0: 6960, d1: 7100, x0: -30, // (v1.9 pocket audit: 6,660 → 6,960, out of the WATERFALL HIDEOUT's exit)
    x1: -4, lane: [-22, -10], roof: 13, top: 42, cruise: 7, name: 'THE FALLS CAVERN', falls: true, clearApproach: true },
  { d0: 9000, d1: 9140, x0: -30, x1: -4, lane: [-22, -10], roof: 13, top: 42, cruise: 7, name: 'THE HIDDEN FALLS', falls: true, clearApproach: true },
];
// THE DROP: splash gates take the flight UNDERWATER (sector physics flags, read by physics.js like the
// wind flags): sink × 0.5, a constant gentle upward drift, extra drag. The surface rides at `surface`.
const WATER = [{ d0: 24800, d1: 29200, surface: 58, sink: 0.5, drift: 1.2, drag: 1.6, name: 'THE DROP' }];

// SHOOTERS (the shared shooter system, reskinned): plasma streams ('dragon' kind = the fireball
// stream: gun drones, gunships, the guardian's eyes), laser bolts ('archer' kind = the arrow: turrets,
// defense platforms, fortress gantries), solar flares ('geyser' kind = the lava fan: a glow first).
// [d, x, y (muzzle, abs), aim ('plane' or [x, y]), look, patrol?]
const PLASMA = [
  [2300, 34, 30, [12, 24], 'drone', [6, 7]], [4600, -34, 36, 'plane', 'drone'], [8100, 34, 40, [0, 44], 'drone', [8, 6]],
  [11600, -36, 40, 'plane', 'fighter'], [12800, 36, 46, [14, 40], 'fighter', [6, 7]], [16600, -34, 44, 'plane', 'fighter'], [18200, 36, 50, [0, 52], 'fighter', [8, 6]], [19400, -34, 38, 'plane', 'fighter'],
  [21700, 34, 34, 'plane', 'drone'], [23300, -36, 40, [-12, 30], 'drone', [6, 8]], [25700, 34, 44, 'plane', 'sub'], [28600, -36, 40, [0, 44], 'sub', [6, 7]],
  [30700, 34, 44, 'plane', 'gunship'], [31300, -36, 50, [0, 52], 'gunship', [8, 6]], [32100, 36, 40, 'plane', 'gunship'], [32900, -34, 46, [-14, 40], 'gunship'],
  [33700, 34, 52, 'plane', 'gunship', [6, 7]], [34500, -36, 40, [0, 44], 'gunship'], [35300, 36, 48, 'plane', 'gunship'], [36100, -34, 44, [14, 40], 'gunship', [8, 6]],
  [36900, 34, 50, 'plane', 'gunship'], [37700, -36, 40, [-12, 34], 'gunship'], [38500, 36, 46, 'plane', 'gunship', [6, 8]], [39300, -34, 52, [0, 54], 'gunship'],
  [41600, 34, 34, 'plane', 'drone'], [43300, -34, 40, [0, 44], 'drone', [6, 7]], [47600, 34, 38, 'plane', 'drone'], [48800, -36, 44, [14, 40], 'drone'],
  [51600, 34, 44, 'plane', 'drone'], [53800, -34, 48, [0, 50], 'drone', [8, 6]], [57400, 34, 40, 'plane', 'drone'],
  [60800, -34, 40, 'plane', 'drone'], [62300, 36, 44, [0, 44], 'drone', [6, 7]], [63300, -34, 50, 'plane', 'drone'],
  [67150, -94, 54, 'plane', 'eye'], [67150, -106, 54, [6, 40], 'eye'], // THE GUARDIAN HEAD's eyes (the head: x −100)
];
const BOLTS = [
  [5800, 32, 14, 'plane', 'turret'], [9300, -32, 14, 'plane', 'turret'],
  [13600, 30, 36, 'plane', 'platform'], [17800, -30, 40, 'plane', 'platform'],
  [22500, -32, 10, 'plane', 'turret'], [26300, 30, 34, 'plane', 'turret'],
  [31700, -30, 40, 'plane', 'platform'], [33100, 30, 46, 'plane', 'platform'], [34900, -30, 36, 'plane', 'platform'], [37300, 30, 44, 'plane', 'platform'], [38900, -30, 50, 'plane', 'platform'],
  [42400, 32, 14, 'plane', 'turret'], [46400, -32, 14, 'plane', 'turret'], [48200, 32, 14, 'plane', 'turret'],
  [61700, -32, 18, 'plane', 'turret'], [62700, 32, 18, 'plane', 'turret'],
  [64400, 16, 50, 'plane', 'hall'], [64900, -16, 50, 'plane', 'hall'], [65300, 16, 50, 'plane', 'hall'], [44850, -16, 50, 'plane', 'hall'],
];
// SOLAR FLARES (the Solar World): a glow on the surface (the telegraph), then a flare arcs up across the
// line. [d, x (the vent, beside the corridor)]
const FAN = (sx) => [[16, 20], [26, 32], [36, 44], [46, 28]].map(([dx, y]) => [-sx * dx, y]);
const FLARES = [[50800, -30], [51300, 30], [52300, -30], [53300, 30], [54300, -30], [56300, 30], [57300, -30], [58300, 30], [59200, -30]];

// WILD flyers (big bonk critters on sine paths): drone fighters crossing the Green World, squadrons in
// formation (three at once) in the belt and the fleet, and floating MINES (a bumpable variant: they
// don't move — they blink, faster as you close in, and bonk). [d, x, y, ax, ay, period, phase, look, r?]
const WILD = [
  [1700, -14, 30, 10, 4, 6, 0, 'fighter'], [5300, 14, 38, 10, 5, 7, 1.2, 'fighter'], [9500, -14, 34, 10, 4, 6, 2.1, 'fighter'],
  ...[11900, 15300, 18700, 31900, 35700, 38100].flatMap((d, i) => [[d, -10, 40, 6, 3, 8, i], [d + 10, 0, 44, 6, 3, 8, i], [d + 20, 10, 40, 6, 3, 8, i]].map((w) => [...w, 'fighter'])),
  ...[[12250, -12, 24], [12300, 10, 40], [13250, 2, 32], [13300, -16, 46], [16900, 14, 28], [17350, -6, 38], [19050, 8, 46], [23900, -10, 30], [33450, 12, 36]].map(([d, x, y]) => [d, x, y, 0, 0, 1, 0, 'mine', 2.6]),
  [42900, -16, 40, 6, 6, 8, 0.4, 'fighter'], [47900, 16, 36, 6, 6, 7, 2.2, 'fighter'], [52900, -14, 42, 6, 6, 8, 1.1, 'fighter'], [58900, 14, 38, 6, 6, 8, 2.4, 'fighter'],
  [61300, -14, 38, 6, 6, 7, 0.8, 'fighter'], [62900, 14, 42, 6, 6, 8, 1.7, 'fighter'],
];
// THERMALS (the Green World's ridges; the Solar World's heat updrafts — its rich aid): [d, x, r, lift]
const THERMALS = [
  [1300, -21, 10, 4], [2600, 21, 10, 4], [4300, -21, 10, 4], [5700, 21, 10, 4], [7300, -21, 10, 4], [8300, 21, 10, 4],
  ...Array.from({ length: 18 }, (_, i) => [50600 + i * 520, i % 2 ? 21 : -21, 10, 5]),
];
// SOLAR-WIND LANES through both space arcs + the Solar World, and the Ocean World's surface tailwinds
// (the wind-lane mechanic: only for a plane at ≥ 50 m/s): [d0, d1, x, y, w, h, push].
export const SF_WIND_MIN = 50;
// (+ the Green World's RIDGE WINDS over its thermals: the same lanes, laps 0–4 — the fresh corner rides them.)
const LANE_LAPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 15, 16, 17, 18, 19, 25, 26, 27, 28];
const LANES = [...LANE_LAPS.flatMap((lap) => [[lap * 2000 + 100, lap * 2000 + 700], [lap * 2000 + 1000, lap * 2000 + 1600]]), [58100, 58400]]
  .filter(([d0]) => !(d0 > 24700 && d0 < 29300))
  .map(([d0, d1]) => [d0, d1, 0, 52, 40, 18, 9]);

// The SPECTACLE moments (looks only; 2 per arc): [d, kind, NAME, side]
const SPECTACLES = [
  [2800, 'flyby', 'THE WINGMEN FORM UP', 1], [7600, 'rainbow', 'A RAINBOW OVER THE FALLS', -1],
  [12600, 'warpRing', 'THROUGH THE WARP RINGS', 1], [17600, 'comet', 'THE COMET', -1],
  [22600, 'volley', 'THE BAY BATTERIES', 1], [26800, 'whale', 'THE GREAT WHALE', -1],
  [32600, 'flagship', 'THE FLAGSHIP CROSSES', 1], [37400, 'barrage', 'THE BROADSIDE', -1],
  [42600, 'sandworm', 'THE SAND CRITTER RISES', 1], [47600, 'avalanche', 'THE DUST STORM', -1],
  [52600, 'eruption', 'THE GREAT FLARE', 1], [57600, 'eclipse', 'THE ECLIPSE', -1],
  [62400, 'flyby', 'THE LAST SQUADRON', -1], [68400, 'salute', 'VICTORY FIREWORKS', 1],
];
// THE FORTRESS GATES (the goal's arch, an outer gate of towers) and THE GUARDIAN HEAD (the final hero:
// scenery + the eye shooters above; seen from 2,000 m out, growing). The game has no bosses.
const FORTRESS = { gates: 61000, head: { d: 67150, x: -100, from: 2000 } };

export const SF_MEGA = {
  starfox: {
    run: SF_RUN,
    // the reskins of the shared systems (megaview.js): the flyer model, plasma / bolt / flare colours
    skin: { flyer: 'vicviper', fire: [0xe8fbff, 0x3fa8ff], bolt: 0xff3a3a, lava: [0xfffbe0, 0xffa21f], posts: 'starfox' },
    weave: WEAVE,
    tilts: TILTS.map(([d, x, name]) => ({ d, x, name })),
    hallTilts: HALL_TILTS.map(([d, x, name]) => ({ d, x, name })),
    doors: DOORS.map(([d, loopD, x, y, name, look], i) => ({ d, loopD, x, y, name, look, key: { d: DOOR_KEYS[i][0], x: DOOR_KEYS[i][1], y: DOOR_KEYS[i][2] } })),
    shooters: [
      ...PLASMA.map(([d, x, y, aim, look, patrol]) => ({ kind: 'dragon', d, x, y, aim, look, ...(patrol ? { patrol } : {}) })),
      ...BOLTS.map(([d, x, y, aim, look]) => ({ kind: 'archer', d, x, y, aim, look })),
      ...FLARES.map(([d, x]) => ({ kind: 'geyser', d, x, y: 0, aims: FAN(Math.sign(x)), look: 'flare' })),
    ].sort((a, b) => a.d - b.d),
    halls: HALLS,
    gaps: GAPS.map(([d, x, y, w, h, move]) => ({ d, x, y, w, h, move })),
    caves: CAVES,
    water: WATER,
    wild: WILD.map(([d, x, y, ax, ay, period, phase, look, r]) => ({ d, x, y, ax, ay, period, phase, look, ...(r ? { r } : {}) })),
    thermals: THERMALS.map(([d, x, r, lift]) => ({ d, x, r, lift })),
    lanes: LANES.map(([d0, d1, x, y, w, h, push]) => ({ d0, d1, x, y, w, h, push, min: SF_WIND_MIN })),
    spectacles: SPECTACLES.map(([d, kind, name, side]) => ({ d, kind, name, side, big: kind === 'flagship' })),
    transitions: TRANSITIONS,
    fortress: FORTRESS,
  },
};

// ───────────────────────── the LONG-RUN SET PIECES (≥ 10 authored pieces per 1,000 m zone) ─────────────────────────
// Per zone: its banner arch, 9 coin fly-throughs (arcs, rings, hoop lines — order + heights shuffled per
// zone), the hero landmark (every other zone) and the long-run boost frames (the high lines). Each piece
// keeps clear of the mega layer and of the base lap's solids; inside an interior they sit low over its
// raised floor, and nothing is placed in a cave's rock.
const BUSY_MEGA = [
  ...WEAVE.map((w) => [w.d - 12, w.d + 12]), ...TILTS.map(([d]) => [d - 14, d + 14]), ...HALL_TILTS.map(([d]) => [d - 14, d + 14]),
  ...DOORS.map(([d, loopD]) => [loopD - 40, d + 60]), ...WILD.map(([d]) => [d - 14, d + 14]),
  ...GAPS.map(([d]) => [d - 14, d + 14]), ...HALLS.map((h) => [h.d0 - 30, h.d0 + 20]), ...CAVES.map((c) => [c.d0 - 30, c.d1 + 20]),
  ...WATER.map((w) => [w.d0 - 30, w.d0 + 20]),
];
const inHall = (d) => HALLS.some((h) => d >= h.d0 - 10 && d <= h.d1 + 10);
const LAP_SOLID = [[410, 430], [690, 800], [1432, 1448], [1472, 1588], [1610, 1630], [1650, 1670]];
const lapSolid = (d0, d1) => { const a = d0 % 2000, b = a + (d1 - d0); return LAP_SOLID.some(([x, y]) => a < y && x < b) || (b > 2000 && LAP_SOLID.some(([x, y]) => b - 2000 > x)); };
const clearSpan = (d0, d1) => !BUSY_MEGA.some(([a, b]) => d0 < b && a < d1) && !lapSolid(d0, d1);
// Long-run boost frames (8, on the high lines; the three pockets + goal approach add the rest in shapes.js): [zone, shape, x, y]
const FRAMES = [[5, 'triangle', 0, 46], [12, 'rectangle', 0, 50], [21, 'oval', 6, 44], [31, 'triangle', 0, 48], [38, 'square', -6, 46], [48, 'rectangle', 0, 50], [52, 'circle', 0, 44], [58, 'triangle', 0, 48]];
let seed = 1;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
export function starFoxPieces() {
  seed = 7331;
  const out = [];
  let n = 0;
  const id = () => `starfox-${++n}`;
  const spot = (want, len, lo, hi) => {
    for (let k = 0; k < 40; k++) for (const s of [1, -1]) {
      const d = Math.round(want + s * k * 9);
      if (d >= lo && d + len <= hi && clearSpan(d - 4, d + len + 4) && !out.some((p) => Math.abs(p.d - d) < 22)) return d;
    }
    return null;
  };
  for (let z = 0; z < SF_ZONES.length; z++) {
    const z0 = z * 1000, z1 = z0 + 1000;
    const bd = spot(z0 + 40, 0, z0 + 10, z0 + 200) ?? z0 + 40;
    out.push({ kind: 'bannerArch', d: bd, x: 0, y: inHall(bd) ? 18 : 34, text: SF_ZONES[z], id: id() });
    const hero = SF_HEROES.find(([d]) => d >= z0 && d < z1);
    if (hero) out.push({ kind: 'landmark', d: hero[0], x: hero[1], y: 0, look: hero[2], scale: 1, name: hero[3], id: id() });
    const fr = FRAMES.find(([zz]) => zz === z);
    const kinds = ['coinArc', 'coinArc', 'coinArc', 'coinRing', 'coinRing', 'coinRing', 'hoops', 'hoops', fr ? 'shape' : 'coinArc'];
    for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
    kinds.forEach((k0, i) => {
      const want = z0 + 100 + i * 96 + Math.round(rnd() * 30);
      let kind = k0, len = kind === 'coinArc' ? 45 + 15 * Math.floor(rnd() * 3) : kind === 'hoops' ? 70 : 0;
      let d = spot(want, len, z0 + 60, z1 - 10);
      if (d === null && kind === 'coinArc') { len = 30; d = spot(want, len, z0 + 60, z1 - 10); }
      if (d === null && kind !== 'shape') { kind = 'coinRing'; len = 0; d = spot(want, 0, z0 + 60, z1 - 10); }
      if (d === null) return;
      const x = [0, -8, 8, 0, -12, 12, 4, -4][Math.floor(rnd() * 8)];
      const y0 = [14, 22, 30, 38, 44, 18, 26, 46][Math.floor(rnd() * 8)], y = inHall(d) || inHall(d + len) ? 6 + (y0 % 12) : y0;
      if (kind === 'coinArc') out.push({ kind, d, x, y: Math.min(y, 46), len, rise: [5, 8, 6][Math.floor(rnd() * 3)], sway: rnd() < 0.5 ? -4 : 4, id: id() });
      else if (kind === 'coinRing') out.push({ kind, d, x, y, r: 3, id: id() });
      else if (kind === 'hoops') out.push({ kind, d, x: Math.max(-10, Math.min(10, x)), y: Math.min(y, 46), n: 4, gap: 22, zig: 3, id: id() });
      else out.push({ kind: 'shape', d, x: fr[2], y: fr[3], shape: fr[1], id: id() });
    });
  }
  return out.sort((a, b) => a.d - b.d);
}
