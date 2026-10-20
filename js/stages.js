// Stage data, keyed by stage id. A stage = its plane, theme, ground style, terrain
// features, gimmick zones, coin-pattern pool and secrets. The save, shop and game read
// stages by id; the terrain/coins/world modules are generic over these lists.
// Distances (d) are metres from the slingshot. x: + = right, - = left (corridor ±26 m).
// Plane decayMul scales the engine's speed loss, glideMul scales air drag. They were
// tuned so the scripted pilot hits each stage's fresh/maxed targets (see BALANCE.md).
// Every feature list is for the first lap; the layout repeats every `cycle` metres
// (secrets only in the first lap).

export const DEFAULT_STAGE = 'plains';
export const STAGE_ORDER = ['plains', 'canyon', 'city', 'snow', 'desert', 'ocean', 'space'];

const range = (from, to, step) => { const a = []; for (let d = from; d <= to; d += step) a.push(d); return a; };
const SHARED_PATTERNS = ['line', 'highArc', 'slalom', 'dive', 'stairs', 'wave', 'fork', 'ring'];
const patterns = (specials) => ({
  pool: [...SHARED_PATTERNS, ...specials],
  gentle: ['line', 'highArc'],
  tricky: ['slalom', 'dive', 'stairs', 'wave', 'fork', 'ring'],
  specials,
  segment: 80,
  coinsEach: 10,
});
// Default stage shape: anything a stage leaves out is empty.
const base = {
  flatStart: 40, cycle: 2000, ditches: [], pits: [], mounds: [], caverns: [], bigHills: [], columnSets: [], columns: [],
  arches: [], rings: [], updrafts: [], tailwinds: [], gusts: [], devils: [], asteroidSets: [], asteroids: [], blocks: null, edgeWalls: null,
  caveTrails: true, modifiers: {}, unlock: null,
};

export const STAGES = {
  // ───────────────────────── S1 PLAINS (v0.3, unchanged) ─────────────────────────
  plains: {
    ...base,
    id: 'plains', name: 'Plains',
    plane: { name: 'Wooden Trainer', body: 0xff4fa3, wing: 0xffd23f, accent: 0x3fc5ff, wingScale: 1.15, floats: false,
      caps: [30, 35, 40, 46, 52], decayMul: 1, glideMul: 1 },
    theme: { bits: [0x4fb34a, 0x9ad65a], sky: 0x9fdcff, fogNear: 90, fogFar: 400, hemiGround: 0x6f9a52, sun: 0xfff3d6,
      ground: { low: [0.5, 0.4, 0.28], grass: [0.42, 0.74, 0.32], high: [0.55, 0.5, 0.42], water: null },
      base: 0x7cc95a, rock: 0x8d7f6e, scenery: 'mixed', treesPerChunk: 14, rocksPerChunk: 4 },
    ground: { style: 'rolling', center: 5, side: 14 },
    ditches: [
      { d: 450, depth: 4, halfLength: 8 }, { d: 980, depth: 3, halfLength: 7 },
      { d: 1550, depth: 5, halfLength: 9 }, { d: 1960, depth: 4, halfLength: 8 },
    ],
    pits: [
      { x: -4, d: 320, depth: 6, radius: 8 }, { x: 9, d: 1180, depth: 6, radius: 8 },
      { x: 3, d: 1420, depth: 5.5, radius: 7 }, { x: -6, d: 1680, depth: 6, radius: 8 },
    ],
    zones: [
      { side: 'right', kind: 'forest', from: 500, to: 700 },
      { side: 'left', kind: 'cavern', from: 700, to: 900 },
      { side: 'left', kind: 'bigHill', from: 1040, to: 1130 },
      { side: 'right', kind: 'forest', from: 1300, to: 1500 },
      { side: 'left', kind: 'cavern', from: 1600, to: 1900 },
    ],
    caverns: [
      { shape: 'hill', start: 700, mouth: 760, exit: 840, end: 900, height: 26, laneMin: -26, laneMax: -14, edge: -8, roof: 10 },
      { shape: 'hill', start: 1600, mouth: 1710, exit: 1790, end: 1900, height: 28, laneMin: -26, laneMax: -14, edge: -8, roof: 10,
        alcove: { from: 1745, to: 1761, laneMax: -10 } },
    ],
    bigHills: [{ shape: 'dome', x: -40, d: 1080, rx: 30, rd: 40, height: 30 }],
    columnSets: [
      { kind: 'tree', from: 510, to: 690, step: 25, xs: [12, 21], r: 0.75, h: 14 },
      { kind: 'tree', from: 1310, to: 1490, step: 25, xs: [12, 21], r: 0.75, h: 14, hero: { d: 1410, x: 18, r: 1.5, h: 18 } },
    ],
    secrets: [
      { id: 'plains-hill', name: 'Behind the big hill', x: -20, y: 4, d: 1136, coins: 12, radius: 7 },
      { id: 'plains-cave', name: 'Cave alcove', x: -12, y: 3, d: 1753, coins: 14, radius: 5 },
      { id: 'plains-tree', name: 'Behind the hero tree', x: 18, y: 4, d: 1428, coins: 15, radius: 6 },
    ],
    patterns: patterns(['treeWeave', 'ditchDip']),
  },

  // ───────────────────────── S2 MOUNTAIN CANYON ─────────────────────────
  canyon: {
    ...base,
    id: 'canyon', name: 'Mountain Canyon', cycle: 2200,
    unlock: { after: 'plains', best: 500 },
    plane: { name: 'Canyon Cruiser', body: 0xd9622b, wing: 0xe8c48a, accent: 0x7a2a12, wingScale: 1.05, floats: false,
      caps: [36, 42, 48, 55, 62], decayMul: 1.0, glideMul: 1.0 },
    theme: { bits: [0xb0703a, 0x8d7f6e], sky: 0xf6b98a, fogNear: 80, fogFar: 380, hemiGround: 0xb5643a, sun: 0xffc48a,
      ground: { low: [0.85, 0.63, 0.4], grass: [0.82, 0.55, 0.33], high: [0.7, 0.33, 0.18], water: null },
      base: 0xb2532c, rock: 0xa8502e, scenery: 'pine', treesPerChunk: 5, rocksPerChunk: 8 },
    ground: { style: 'canyon', center: 3, side: 12 },
    edgeWalls: { at: 28, height: 42 },
    ditches: [{ d: 450, depth: 3, halfLength: 7 }, { d: 1050, depth: 4, halfLength: 8 }, { d: 1650, depth: 3, halfLength: 7 }],
    pits: [{ x: -4, d: 350, depth: 5, radius: 7 }, { x: 6, d: 1150, depth: 6, radius: 8 }, { x: 0, d: 1760, depth: 5, radius: 7 }],
    zones: [
      { side: 'left', kind: 'updraft', from: 200, to: 1150 },
      { side: 'right', kind: 'pillarSlalom', from: 900, to: 1150 },
      { side: 'right', kind: 'mesa', from: 1370, to: 1430 },
      { side: 'left', kind: 'pillarSlalom', from: 1450, to: 1700 },
      { side: 'right', kind: 'updraft', from: 1550, to: 2000 },
      { side: 'left', kind: 'cavern', from: 1930, to: 2070 },
    ],
    // Cliff alcove: the cavern tech, smaller.
    caverns: [{ shape: 'hill', start: 1930, mouth: 1975, exit: 2025, end: 2070, height: 30, laneMin: -26, laneMax: -17, edge: -12, roof: 9 }],
    bigHills: [
      { shape: 'mesa', x: -15, d: 900, rx: 9, rd: 28, height: 22, pines: true },   // the high mesa (secret on top)
      { shape: 'mesa', x: 22, d: 1400, rx: 11, rd: 26, height: 32, pines: true },  // the big mesa (secret behind)
      { shape: 'mesa', x: -42, d: 520, rx: 14, rd: 30, height: 28, pines: true },
      { shape: 'mesa', x: 46, d: 1820, rx: 14, rd: 30, height: 30, pines: true },
    ],
    columns: [
      { kind: 'pillar', x: 13, d: 300, r: 2.2, h: 28 },
      { kind: 'pillar', x: -14, d: 430, r: 2.2, h: 28 },
    ],
    columnSets: [
      { kind: 'pillar', from: 910, to: 1140, step: 25, xs: [12, 21], r: 2, h: 30 },
      { kind: 'pillar', from: 1460, to: 1690, step: 25, xs: [-12, -21], r: 2, h: 30 },
    ],
    // Arches across the corridor: opening 14 × 10 m, low (on the floor) / mid (12 m up) alternating.
    arches: [
      { d: 600, cx: 0, y0: 0, w: 14, h: 10 },
      { d: 1250, cx: 0, y0: 12, w: 14, h: 10 },
      { d: 1850, cx: 0, y0: 0, w: 14, h: 10 },
    ],
    archBonus: 10,
    updrafts: [
      { x: -19, d: 250, r: 10, lift: 3 }, { x: -19, d: 700, r: 10, lift: 3 }, { x: -19, d: 1100, r: 10, lift: 3 },
      { x: 19, d: 1600, r: 10, lift: 3 }, { x: 19, d: 1950, r: 10, lift: 3 },
    ],
    secrets: [
      { id: 'canyon-mesa', name: 'Behind the big mesa', x: 18, y: 4, d: 1442, coins: 13, radius: 7 },
      { id: 'canyon-alcove', name: 'Cliff alcove', x: -21.5, y: 3, d: 2000, coins: 14, radius: 5 },
      { id: 'canyon-top', name: 'On top of the high mesa', x: -15, y: 2.5, d: 900, coins: 12, radius: 7 },
    ],
    patterns: patterns(['archLine', 'updraftCatch']),
  },

  // ───────────────────────── S3 CITY ─────────────────────────
  city: {
    ...base,
    id: 'city', name: 'City',
    unlock: { after: 'canyon', best: 1200 },
    plane: { name: 'City Hopper', body: 0xf4f4f4, wing: 0xe8262c, accent: 0x2b3a55, wingScale: 1.1, floats: false,
      caps: [42, 48, 55, 63, 70], decayMul: 1.3, glideMul: 0.6 },
    theme: { bits: [0xffffff, 0xffe14d], sky: 0xffc98a, fogNear: 90, fogFar: 380, hemiGround: 0x8a7a6a, sun: 0xffd29a,
      ground: { low: [0.36, 0.37, 0.4], grass: [0.42, 0.43, 0.46], high: [0.79, 0.72, 0.6], water: null },
      base: 0x5d6068, rock: 0x9aa0aa, scenery: 'street', treesPerChunk: 6, rocksPerChunk: 0, windows: true },
    ground: { style: 'city', center: 0, side: 0 },
    // Buildings: boundary towers at the edges, low blocks in the ring row, tall-ish rooftops in the rooftop run.
    // The streets between rooftop blocks are the city's "ditches"; underpasses dip under the road.
    blocks: {
      seed: 7,
      edge: { x0: 27, x1: 46, hMin: 34, hMax: 58, len: 30, gap: 6 },
      bands: [
        { side: 'left', kind: 'ringRow', from: 200, to: 1100, x0: 11, x1: 26, hMin: 4, hMax: 8, len: 22, gap: 14 },
        { side: 'right', kind: 'rooftop', from: 300, to: 1100, x0: 9, x1: 26, hMin: 9, hMax: 20, len: 24, gap: 10 },
        { side: 'right', kind: 'ringRow', from: 1300, to: 1800, x0: 11, x1: 26, hMin: 4, hMax: 8, len: 22, gap: 14 },
        { side: 'left', kind: 'rooftop', from: 1300, to: 1800, x0: 9, x1: 26, hMin: 9, hMax: 20, len: 24, gap: 10 },
      ],
      // Fixed landmarks (x0 < x1, d0 < d1).
      fixed: [
        { x0: -26, x1: -13, d0: 1185, d1: 1215, h: 60, tallest: true },          // the tallest tower
        { x0: 12, x1: 26, d0: 788, d1: 812, h: 18, helipad: true },              // helipad rooftop
      ],
    },
    ditches: [{ d: 600, depth: 4, halfLength: 8 }, { d: 1550, depth: 4, halfLength: 8 }],
    pits: [{ x: 3, d: 420, depth: 4, radius: 6 }, { x: -4, d: 1420, depth: 4, radius: 6 }], // construction holes
    zones: [
      { side: 'left', kind: 'ringRow', from: 200, to: 1100 },
      { side: 'right', kind: 'rooftop', from: 300, to: 1100 },
      { side: 'right', kind: 'throughBuilding', from: 950, to: 1010 },
      { side: 'left', kind: 'tower', from: 1185, to: 1215 },
      { side: 'right', kind: 'ringRow', from: 1300, to: 1800 },
      { side: 'left', kind: 'rooftop', from: 1300, to: 1800 },
    ],
    // The through-building: the cavern tech as a block, with a lit tunnel and an alcove.
    caverns: [{ shape: 'block', start: 950, mouth: 955, exit: 1005, end: 1010, height: 44, laneMin: 14, laneMax: 26, edge: 9, roof: 10,
      alcove: { from: 975, to: 987, laneMin: 10 }, lit: true }],
    columns: [
      { kind: 'waterTower', x: 16, d: 470, r: 2, h: 6 }, { kind: 'antenna', x: 22, d: 660, r: 0.4, h: 10 },
      { kind: 'waterTower', x: 20, d: 1060, r: 2, h: 6 }, { kind: 'antenna', x: -16, d: 1420, r: 0.4, h: 10 },
      { kind: 'waterTower', x: -20, d: 1640, r: 2, h: 6 }, { kind: 'antenna', x: -22, d: 1760, r: 0.4, h: 10 },
    ],
    rings: [
      ...range(240, 1080, 84).map((d, i) => ({ x: -18, y: 13 + (i % 3) * 3, d, r: 3 })),
      ...range(1330, 1780, 84).map((d, i) => ({ x: 18, y: 13 + (i % 3) * 3, d, r: 3 })),
    ],
    ringBonus: 5,
    secrets: [
      { id: 'city-tower', name: 'Behind the tallest tower', x: -20, y: 4, d: 1232, coins: 13, radius: 7 },
      { id: 'city-alcove', name: 'Inside the through-building', x: 12, y: 3, d: 981, coins: 14, radius: 5 },
      { id: 'city-helipad', name: 'On the helipad', x: 19, y: 2.2, d: 800, coins: 12, radius: 7 },
    ],
    patterns: patterns(['ringLine', 'rooftopSkim']),
  },

  // ───────────────────────── S4 SNOW ─────────────────────────
  snow: {
    ...base,
    id: 'snow', name: 'Snow',
    unlock: { after: 'city', best: 1600 },
    plane: { name: 'Snow Owl', body: 0xeef7ff, wing: 0x3f86e8, accent: 0x9fd8ff, wingScale: 1.4, floats: false,
      caps: [48, 55, 63, 71, 79], decayMul: 1.6, glideMul: 0.3 },
    theme: { bits: [0xffffff, 0xdff0ff], sky: 0xcfe8ff, fogNear: 80, fogFar: 360, hemiGround: 0xc9d8e8, sun: 0xffffff,
      ground: { low: [0.82, 0.86, 0.92], grass: [0.93, 0.96, 1.0], high: [1, 1, 1], water: null },
      base: 0xeef4fb, rock: 0x9fb3c8, scenery: 'snowpine', treesPerChunk: 14, rocksPerChunk: 3 },
    ground: { style: 'snow', center: 4, side: 18, peaks: 40 },
    mounds: [ // snow drifts in the middle (DRIFT DIP)
      { x: 0, d: 380, r: 9, h: 4 }, { x: -3, d: 560, r: 9, h: 4.5 }, { x: 2, d: 980, r: 10, h: 4 },
      { x: 0, d: 1240, r: 9, h: 5 }, { x: -2, d: 1700, r: 10, h: 4.5 }, { x: 3, d: 1880, r: 9, h: 4 },
    ],
    ditches: [{ d: 470, depth: 3, halfLength: 7 }, { d: 1060, depth: 4, halfLength: 8 }, { d: 1620, depth: 3, halfLength: 7 }], // crevasses
    pits: [{ x: 5, d: 300, depth: 5, radius: 7 }, { x: -6, d: 1380, depth: 6, radius: 8 }], // ice holes
    zones: [
      { side: 'left', kind: 'tailwind', from: 250, to: 800 },
      { side: 'right', kind: 'gustRidge', from: 450, to: 960 },
      { side: 'right', kind: 'iceCliff', from: 1055, to: 1105 },
      { side: 'left', kind: 'iceCave', from: 1150, to: 1330 },
      { side: 'left', kind: 'tailwind', from: 1400, to: 1550 },
      { side: 'right', kind: 'heroPine', from: 1490, to: 1510 },
      { side: 'left', kind: 'gustRidge', from: 1650, to: 1800 },
      { side: 'right', kind: 'tailwind', from: 1750, to: 1900 },
    ],
    caverns: [{ shape: 'hill', start: 1150, mouth: 1200, exit: 1280, end: 1330, height: 28, laneMin: -26, laneMax: -14, edge: -8, roof: 10, ice: true }],
    bigHills: [{ shape: 'mesa', x: 36, d: 1080, rx: 18, rd: 25, height: 34 }], // the ice cliff
    columns: [{ kind: 'pine', x: 18, d: 1500, r: 1.6, h: 24, hero: true }],
    tailwinds: [
      { x0: -26, x1: -10, d0: 250, d1: 400, push: 4 }, { x0: -26, x1: -10, d0: 650, d1: 800, push: 4 },
      { x0: -26, x1: -10, d0: 1400, d1: 1550, push: 4 }, { x0: 10, x1: 26, d0: 1750, d1: 1900, push: 4 },
    ],
    gusts: [
      { x0: 8, x1: 26, d0: 450, d1: 560, push: -3 }, { x0: 8, x1: 26, d0: 850, d1: 960, push: 3 },
      { x0: -26, x1: -8, d0: 1650, d1: 1800, push: 3 },
    ],
    modifiers: { softSnow: { keepBonus: 0.10, sinkBonus: 1 } },
    secrets: [
      { id: 'snow-cliff', name: 'Behind the ice cliff', x: 20, y: 4, d: 1115, coins: 13, radius: 7 },
      { id: 'snow-cave', name: 'Inside the ice cave', x: -24, y: 3, d: 1240, coins: 14, radius: 5 },
      { id: 'snow-pine', name: 'Behind the giant pine', x: 18, y: 4, d: 1520, coins: 15, radius: 6 },
    ],
    patterns: patterns(['gustRider', 'driftDip']),
  },

  // ───────────────────────── S5 DESERT ─────────────────────────
  desert: {
    ...base,
    id: 'desert', name: 'Desert',
    unlock: { after: 'snow', best: 2000 },
    plane: { name: 'Dune Hawk', body: 0xe2c27a, wing: 0xd4a017, accent: 0x8a5a1a, wingScale: 1.15, floats: false,
      caps: [54, 62, 71, 80, 89], decayMul: 1.8, glideMul: 0.15 },
    theme: { bits: [0xe8c98a, 0xd4a860], sky: 0xffe3a8, fogNear: 70, fogFar: 340, hemiGround: 0xd8b070, sun: 0xfff0c0,
      ground: { low: [0.82, 0.67, 0.42], grass: [0.91, 0.79, 0.54], high: [0.86, 0.7, 0.43], water: [0.2, 0.6, 0.75] },
      base: 0xe8c98a, rock: 0xb07a45, scenery: 'cactus', treesPerChunk: 6, rocksPerChunk: 5 },
    ground: { style: 'dunes', center: 6, side: 16 },
    ditches: [{ d: 520, depth: 3, halfLength: 7 }, { d: 1150, depth: 4, halfLength: 8 }, { d: 1720, depth: 3, halfLength: 7 }], // dry washes
    pits: [
      { x: -5, d: 360, depth: 5, radius: 7 }, { x: 6, d: 1290, depth: 5, radius: 7 },
      { x: 15, d: 910, depth: 5, radius: 10, pond: true }, // the oasis pond
    ],
    zones: [
      { side: 'left', kind: 'dustDevils', from: 250, to: 1150 },
      { side: 'right', kind: 'cactusSlalom', from: 600, to: 800 },
      { side: 'right', kind: 'oasis', from: 890, to: 930 },
      { side: 'left', kind: 'bigDune', from: 945, to: 1015 },
      { side: 'left', kind: 'pyramid', from: 1350, to: 1500 },
      { side: 'right', kind: 'cactusSlalom', from: 1520, to: 1680 },
      { side: 'right', kind: 'dustDevils', from: 1750, to: 1950 },
    ],
    caverns: [{ shape: 'pyramid', start: 1350, mouth: 1395, exit: 1455, end: 1500, height: 40, laneMin: -26, laneMax: -14, edge: -6, roof: 10,
      alcove: { from: 1418, to: 1432, laneMax: -10 } }], // the treasure chamber
    bigHills: [
      { shape: 'dome', x: -30, d: 980, rx: 26, rd: 35, height: 26 },  // the big dune
      { shape: 'mesa', x: 42, d: 600, rx: 10, rd: 20, height: 14 },
      { shape: 'mesa', x: -46, d: 1700, rx: 12, rd: 22, height: 16 },
    ],
    columnSets: [
      { kind: 'cactus', from: 620, to: 800, step: 25, xs: [12, 21], r: 0.7, h: 6 },
      { kind: 'cactus', from: 1520, to: 1680, step: 25, xs: [12, 21], r: 0.7, h: 6, hero: { d: 1600, x: 18, r: 1.4, h: 14 } },
    ],
    devils: [
      { x: -18, d: 300, r: 6 }, { x: -18, d: 550, r: 6 }, { x: -18, d: 820, r: 6 }, { x: -18, d: 1100, r: 6 },
      { x: 18, d: 1800, r: 6 }, { x: 18, d: 1920, r: 6 },
    ],
    devilBoost: { speed: 8, pitchDeg: 14 },
    secrets: [
      { id: 'desert-dune', name: 'Behind the big dune', x: -18, y: 4, d: 1030, coins: 13, radius: 7 },
      { id: 'desert-pyramid', name: 'Inside the pyramid chamber', x: -12, y: 3, d: 1425, coins: 14, radius: 5 },
      { id: 'desert-cactus', name: 'Behind the giant cactus', x: 18, y: 4, d: 1615, coins: 15, radius: 6 },
    ],
    patterns: patterns(['devilRider', 'oasisDip']),
  },

  // ───────────────────────── S6 OCEAN ISLANDS ─────────────────────────
  ocean: {
    ...base,
    id: 'ocean', name: 'Ocean Islands',
    unlock: { after: 'desert', best: 2400 },
    plane: { name: 'Sea Falcon', body: 0x1fa5a0, wing: 0xffffff, accent: 0x0d5c63, wingScale: 1.2, floats: true,
      caps: [60, 69, 79, 89, 99], decayMul: 2.2, glideMul: 0.05 },
    theme: { bits: [0xffffff, 0x9fd8ff], sky: 0x8fd3ff, fogNear: 90, fogFar: 400, hemiGround: 0x2f8fc6, sun: 0xffffff,
      ground: { low: [0.94, 0.86, 0.6], grass: [0.36, 0.75, 0.29], high: [0.55, 0.5, 0.42], water: [0.12, 0.56, 0.84] },
      base: 0x1f8fd6, rock: 0x9a8f80, scenery: 'palm', treesPerChunk: 8, rocksPerChunk: 2 },
    ground: { style: 'ocean', center: 0, side: 0 },
    water: { level: 0 },
    // Islands rise from the water; the channels between them are this stage's ditches.
    bigHills: [
      { shape: 'island', x: 0, d: 380, rx: 16, rd: 30, height: 4 },
      { shape: 'island', x: -6, d: 640, rx: 14, rd: 26, height: 5 },
      { shape: 'island', x: 4, d: 1180, rx: 15, rd: 28, height: 4 },
      { shape: 'island', x: 20, d: 1300, rx: 9, rd: 12, height: 5 },       // lighthouse island
      { shape: 'island', x: -3, d: 1720, rx: 16, rd: 30, height: 5 },
      { shape: 'island', x: 46, d: 560, rx: 18, rd: 30, height: 12 },
      { shape: 'island', x: -48, d: 1460, rx: 18, rd: 34, height: 14 },
    ],
    pits: [{ x: 0, d: 380, depth: 3, radius: 5 }, { x: -3, d: 1720, depth: 3, radius: 5 }], // island craters
    zones: [
      { side: 'left', kind: 'lowSwoop', from: 200, to: 800 },
      { side: 'left', kind: 'seaCave', from: 820, to: 980 },
      { side: 'right', kind: 'pier', from: 1080, to: 1240 },
      { side: 'right', kind: 'lighthouse', from: 1290, to: 1310 },
      { side: 'left', kind: 'pier', from: 1500, to: 1650 },
      { side: 'right', kind: 'lowSwoop', from: 1450, to: 1900 },
    ],
    // The sea cave through the biggest island (its floor is the sea).
    caverns: [{ shape: 'hill', start: 820, mouth: 860, exit: 940, end: 980, height: 30, laneMin: -26, laneMax: -14, edge: -8, roof: 10, island: true }],
    columns: [{ kind: 'lighthouse', x: 20, d: 1300, r: 2, h: 28 }],
    columnSets: [
      { kind: 'post', from: 1090, to: 1240, step: 22, xs: [12, 20], r: 0.5, h: 6 },
      { kind: 'post', from: 1500, to: 1650, step: 22, xs: [-12, -20], r: 0.5, h: 6 },
    ],
    modifiers: { water: { keep: 0.35, pop: 2 } },
    secrets: [
      { id: 'ocean-lighthouse', name: 'Behind the lighthouse', x: 20, y: 4, d: 1322, coins: 13, radius: 6 },
      { id: 'ocean-cave', name: 'Inside the sea cave', x: -24, y: 3, d: 900, coins: 14, radius: 5 },
      { id: 'ocean-top', name: 'On top of the big island', x: -38, y: 2.5, d: 900, coins: 12, radius: 7 },
    ],
    patterns: patterns(['waterSkim', 'islandHop']),
  },
};

// ───────────────────────── S7 SPACE — THE FINALE ─────────────────────────
STAGES.space = {
  ...base,
  id: 'space', name: 'Space',
  unlock: { after: 'ocean', best: 2800 },
  plane: { name: 'Comet', body: 0xf4f4f4, wing: 0xff7a1a, accent: 0xff9a3c, wingScale: 0.85, floats: false, exhaust: true,
    caps: [66, 76, 87, 98, 110], decayMul: 2.4, glideMul: 0.02 },
  theme: { bits: [0xfff3b0, 0xff9a3c], sky: 0x0b1030, fogNear: 140, fogFar: 460, hemiGround: 0x3a3f52, sun: 0xf2f4ff,
    ground: { low: [0.33, 0.34, 0.38], grass: [0.55, 0.56, 0.6], high: [0.72, 0.72, 0.76], water: null },
    base: 0x5c5f68, rock: 0x8a8d96, scenery: 'none', treesPerChunk: 0, rocksPerChunk: 6, space: true },
  ground: { style: 'rolling', center: 3, side: 12 },          // the moon's grey surface
  ditches: [{ d: 520, depth: 4, halfLength: 8 }, { d: 1420, depth: 3, halfLength: 7 }], // rilles
  // Craters ARE this stage's holes (a raised rim + a bowl).
  pits: [
    { x: -3, d: 300, depth: 6, radius: 9, rim: 2, crater: true }, { x: 8, d: 650, depth: 7, radius: 10, rim: 2.5, crater: true },
    { x: -6, d: 1150, depth: 6, radius: 9, rim: 2, crater: true }, { x: 5, d: 1650, depth: 7, radius: 10, rim: 2.5, crater: true },
  ],
  zones: [
    { side: 'left', kind: 'starRings', from: 200, to: 900 },
    { side: 'right', kind: 'asteroidField', from: 450, to: 900 },
    { side: 'left', kind: 'moonMountain', from: 964, to: 1036 },
    { side: 'left', kind: 'spaceStation', from: 1250, to: 1330 },
    { side: 'right', kind: 'starRings', from: 1450, to: 1850 },
    { side: 'left', kind: 'asteroidField', from: 1450, to: 1700 },
  ],
  // The space station: the cavern tech as a block with a lit fly-through tunnel + an alcove.
  caverns: [{ shape: 'block', start: 1250, mouth: 1255, exit: 1325, end: 1330, height: 30, laneMin: -26, laneMax: -14, edge: -9, roof: 10,
    alcove: { from: 1285, to: 1297, laneMax: -10 }, lit: true, station: true }],
  bigHills: [{ shape: 'dome', x: -22, d: 1000, rx: 18, rd: 36, height: 34 }], // the moon mountain
  // Asteroids float (y = height of the centre above the ground) and Bonk on a hit.
  asteroidSets: [
    { from: 470, to: 880, step: 26, xs: [12, 21], ys: [7, 11], r: 2.6 },
    { from: 1460, to: 1700, step: 26, xs: [-12, -21], ys: [7, 11], r: 2.6, hero: { d: 1500, x: -18, y: 12, r: 7 } },
  ],
  rings: [
    ...range(240, 880, 80).map((d, i) => ({ x: -17, y: 14 + (i % 3) * 3, d, r: 3 })),
    ...range(1460, 1840, 80).map((d, i) => ({ x: 17, y: 14 + (i % 3) * 3, d, r: 3 })),
  ],
  ringBonus: 10, ringName: 'STAR RING',
  modifiers: { lowGravity: { gravityScale: 0.55, sinkBonus: 1.5 } },
  secrets: [
    { id: 'space-station', name: 'Inside the space station', x: -12, y: 3, d: 1291, coins: 14, radius: 5 },
    { id: 'space-asteroid', name: 'Behind the biggest asteroid', x: -18, y: 12, d: 1518, coins: 13, radius: 6 },
    { id: 'space-mountain', name: 'On top of the moon mountain', x: -22, y: 3, d: 1000, coins: 12, radius: 7 },
  ],
  patterns: patterns(['starRingLine', 'craterDip']),
};

export function stageData(id) {
  return STAGES[id] ?? null;
}

// Rubber band table for a stage: shared looks/momentum/prices, the stage plane's caps.
export function stageBand(stage, bandRow) {
  return { ...bandRow, launchMax: stage.plane.caps[bandRow.level - 1] };
}

// ---------- planes that don't belong to a world (v0.6) ----------
// A full plane in the plane system: its own upgrade record (save.stages.<id>), picked in
// CHANGE PLANE for any world under the borrowed-plane rules. It has no home wallet, so its
// upgrades are paid from the wallet of the world you are in.
export const EXTRA_PLANES = {
  biplane: {
    id: 'biplane', name: 'Barnstormer', kind: 'Stunt biplane', unlock: { world: 'canyon' },
    banner: 'NEW PLANE: BARNSTORMER BIPLANE!',
    plane: { name: 'Barnstormer', body: 0xd8262c, wing: 0xfff1d6, accent: 0x2b3a55, wingScale: 1.0, floats: false, biplane: true,
      caps: [34, 40, 47, 54, 62], decayMul: 1.05, glideMul: 1, liftMul: 1.15, stallSpeed: 8, deepPutter: true },
  },
};
export const EXTRA_PLANE_ORDER = ['biplane'];
// Every plane id in picker order: the world planes, then the extras.
export const PLANE_ORDER = [...STAGE_ORDER.slice(0, 2), ...EXTRA_PLANE_ORDER, ...STAGE_ORDER.slice(2)];
// { id, name (home label), plane } for any plane id — world planes come from their stage.
export function planeEntry(id) {
  if (STAGES[id]) return { id, name: STAGES[id].name, plane: STAGES[id].plane, home: id };
  const e = EXTRA_PLANES[id];
  return e ? { id, name: e.kind, plane: e.plane, home: null } : null;
}
