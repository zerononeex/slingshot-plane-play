// Stage data, keyed by stage id. A stage = its plane, theme, ground style, terrain
// features, gimmick zones, coin-pattern pool and secrets. The save, shop and game read
// stages by id; the terrain/coins/world modules are generic over these lists.
// Distances (d) are metres from the slingshot. x: + = right, - = left (corridor ±26 m).
// Plane decayMul scales the engine's speed loss, glideMul scales air drag. They were
// tuned so the scripted pilot hits each stage's fresh/maxed targets (see BALANCE.md).
// Every feature list is for the first lap; the layout repeats every `cycle` metres
// (secrets at their own distance, once: 1–4 in the first lap, v1.0's secret 5 far out).

export const DEFAULT_STAGE = 'plains';
export const STAGE_ORDER = ['plains', 'canyon', 'city', 'snow', 'desert', 'ocean', 'space', 'jetstream', 'neonvoid'];

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
  speedGates: [], storms: [], bridges: [], coinRivers: [], zones: [],
  slots: [], loopRings: [], diveGates: [], bumpables: [],
  archways: [], courses: [], decor: [], tube: null,
  pockets: [],
  caveTrails: true, modifiers: {}, unlock: null,
};

export const STAGES = {
  // ───────────────────────── S1 PLAINS (v0.3, unchanged) ─────────────────────────
  plains: {
    ...base,
    id: 'plains', name: 'Plains',
    plane: { name: 'Wooden Trainer', body: 0xff4fa3, wing: 0xffd23f, accent: 0x3fc5ff, wingScale: 1.15, floats: false,
      caps: [30, 35, 40, 46, 52, 56, 60, 64, 68, 73], decayMul: 1, glideMul: 1, balloonMul: 0.55 },
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
      caps: [36, 42, 48, 55, 62, 66, 71, 76, 81, 87], decayMul: 1.0, glideMul: 1.0 },
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
      caps: [42, 48, 55, 63, 70, 75, 79, 85, 89, 95], decayMul: 1.3, glideMul: 0.6, balloonMul: 0.4 },
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
      caps: [48, 55, 63, 71, 79, 82, 85, 89, 92, 96], decayMul: 1.6, glideMul: 0.3, noLiftCarry: 8 },
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
      caps: [54, 62, 71, 80, 89, 92, 95, 99, 102, 106], decayMul: 1.8, glideMul: 0.15, noLiftCarry: 9.5 },
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
      caps: [60, 69, 79, 89, 99, 102, 105, 108, 111, 115], decayMul: 2.2, glideMul: 0.05, noLiftCarry: 10 },
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
  // The STARSHIP (display name only — the id stays 'space'): a rocket ship with fins, an ion
  // exhaust instead of a propeller, and its own upgrade names (names.js).
  plane: { name: 'Starship', body: 0xf4f4f4, wing: 0xff7a1a, accent: 0xff9a3c, wingScale: 0.85, floats: false, exhaust: true, ship: true,
    caps: [66, 76, 87, 98, 110, 113, 116, 118, 121, 124], decayMul: 2.4, glideMul: 0.02, engineSound: 'hum' },
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
  // WARP: boost pushes harder in Space: +7.5 m/s² (+6 elsewhere). The brief's +9 overshot maxed (7,957 m) and the +8 fallback
  // still did (7,711 m), so it is trimmed to +7.5 (7,586 m, inside 7,000–7,600). See BALANCE.md.
  modifiers: { lowGravity: { gravityScale: 0.55, sinkBonus: 1.5 }, warp: { boostThrust: 7.5 } },
  secrets: [
    { id: 'space-station', name: 'Inside the space station', x: -12, y: 3, d: 1291, coins: 14, radius: 5 },
    { id: 'space-asteroid', name: 'Behind the biggest asteroid', x: -18, y: 12, d: 1518, coins: 13, radius: 6 },
    { id: 'space-mountain', name: 'On top of the moon mountain', x: -22, y: 3, d: 1000, coins: 12, radius: 7 },
  ],
  patterns: patterns(['starRingLine', 'craterDip']),
};

// ───────────────────────── S8 JETSTREAM — the sky highway (v0.6 part 2) ─────────────────────────
// High above a sea of clouds; everything big and far apart, built for the Sky Dart's speed.
STAGES.jetstream = {
  ...base,
  id: 'jetstream', name: 'Jetstream',
  unlock: { after: 'space', best: 2500 },
  unlockBanner: 'NEW PLANE: SKY DART JET!',
  // The Sky Dart: no propeller (nose intake + afterburner flame). It needs speed: stalls at 16,
  // and its speed loss is × 0.8 when fast but × 1.3 below 20 m/s. decayMul/glideMul grid-tuned.
  plane: { name: 'Sky Dart', body: 0xe9eef5, wing: 0x2b6fd6, accent: 0xff5d2e, wingScale: 0.95, floats: false, jet: true,
    caps: [84, 98, 113, 129, 146, 150, 153, 157, 161, 165], decayMul: 2.6, glideMul: 0.02, noLiftCarry: 9, stallSpeed: 16, fastDecayMul: 0.8, slowDecayMul: 1.3, slowBelow: 20,
    engineSound: 'turbine' },
  theme: { bits: [0x9fb3c8, 0xdfe8f2], sky: 0x5f9bea, fogNear: 180, fogFar: 560, hemiGround: 0xdfe8f2, sun: 0xfff6e0,
    ground: { low: [0.86, 0.9, 0.97], grass: [0.93, 0.95, 0.99], high: [0.55, 0.57, 0.62], water: null },
    base: 0xe6edf7, rock: 0x8c93a0, scenery: 'none', treesPerChunk: 0, rocksPerChunk: 0, jetstream: true },
  ground: { style: 'rolling', center: 2, side: 5 },        // the soft sea of clouds
  flatStart: 60,
  // Mountain peaks poking through far below (outside the corridor); the tallest one hides a secret.
  bigHills: [
    { shape: 'dome', x: -70, d: 420, rx: 26, rd: 40, height: 46 }, { shape: 'dome', x: 80, d: 900, rx: 30, rd: 44, height: 52 },
    { shape: 'dome', x: -36, d: 1460, rx: 14, rd: 22, height: 70, tallest: true }, { shape: 'dome', x: 90, d: 1800, rx: 28, rd: 40, height: 44 },
  ],
  zones: [
    { side: 'right', kind: 'storm', from: 680, to: 960 },
    { side: 'left', kind: 'storm', from: 1030, to: 1070 },
    { side: 'left', kind: 'peak', from: 1420, to: 1500 },
    { side: 'right', kind: 'cloudTunnel', from: 1440, to: 1520 },
    { side: 'right', kind: 'storm', from: 1540, to: 1580 },
  ],
  // Cloud valleys (the "ditches") and holes in the cloud sea.
  ditches: [{ d: 480, depth: 4, halfLength: 10 }, { d: 1250, depth: 4, halfLength: 9 }],
  pits: [{ x: -4, d: 640, depth: 6, radius: 10 }, { x: 6, d: 1980 - 210, depth: 6, radius: 10 }],
  // The CLOUD TUNNEL: a bank of cloud with a tube through it (soft walls bonk, the tube is safe).
  caverns: [{ shape: 'block', start: 1440, mouth: 1445, exit: 1515, end: 1520, height: 26, laneMin: 14, laneMax: 26, edge: 9, roof: 11, cloud: true }],
  // SPEED GATES: pass between the pylons at ≥ 40 m/s = +25, slower +5 (the GATE LINE is the 1180–1340 trio).
  speedGates: [
    { d: 260, x: 0, w: 16, h: 20 }, { d: 560, x: -8, w: 16, h: 20 }, { d: 1180, x: 4, w: 16, h: 20 },
    { d: 1260, x: 4, w: 16, h: 20 }, { d: 1340, x: 4, w: 16, h: 20 }, { d: 1720, x: 8, w: 16, h: 20 },
  ],
  gateFast: 40, gateBonus: { fast: 25, slow: 5 },
  // Storm clouds = bonk zones. Around 900 m a ring of storm puffs hides a calm eye (a secret).
  storms: [
    { x: 18, d: 700, y: 16, r: 6 }, { x: -16, d: 1050, y: 22, r: 7 }, { x: 14, d: 1560, y: 14, r: 6 }, { x: -12, d: 1880, y: 18, r: 6.5 },
    ...[0, 1, 2, 3, 4, 5].map((i) => ({ x: 18 + 9 * Math.cos((i / 6) * Math.PI * 2), d: 910 + 9 * Math.sin((i / 6) * Math.PI * 2), y: 20, r: 4.2, eye: true })),
  ],
  // Cloud bridges across the sky: fly under them (CLOUD DIVE) or over them.
  bridges: [
    { kind: 'cloud', d: 840, x0: -30, x1: 30, under: 12, thick: 6, depth: 10 },
    { kind: 'cloud', d: 1640, x0: -30, x1: 30, under: 14, thick: 6, depth: 12 },
  ],
  // Long coin rivers (60+ coins, flowing S-curves), every lap.
  coinRivers: [{ d: 300, len: 240, x: 0, amp: 10, y: 14 }, { d: 1360, len: 220, x: -4, amp: 9, y: 12 }],
  modifiers: { thinAir: { dragMul: 0.5, liftMul: 0.85 } },
  secrets: [
    { id: 'jet-eye', name: 'Inside the storm\'s calm eye', x: 18, y: 20, d: 910, coins: 15, radius: 4 },
    { id: 'jet-peak', name: 'Behind the tallest peak', x: -21, y: 8, d: 1492, coins: 13, radius: 6 },
    { id: 'jet-slot', name: 'Through the mega slot', x: -14, y: 10, d: 1112, coins: 14, radius: 5 },
  ],
  patterns: patterns(['gateLine', 'cloudDive']),
};

// Rubber band table for a stage: shared looks/momentum/prices, the stage plane's caps.
// v1.0: caps run Lv1–10 (Lv1–5 frozen; Lv6–10 grid-trimmed per plane, see BALANCE.md "Level 10").
// balloonMul = per-plane trim of the HELIUM BALLOONS' glide effect (default 1; Plains/City/Barnstormer glide most).
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
      caps: [34, 40, 47, 54, 62, 66, 70, 75, 80, 85], decayMul: 1.05, glideMul: 1, liftMul: 1.15, stallSpeed: 8, deepPutter: true, balloonMul: 0.6 },
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

// ───────────────────────── v0.6 part 2: SKILL FURNITURE (fixed per lap, like secrets) ─────────────────────────
// SLOTS: a 2 m gap between two solid walls — a level plane (wings out) bonks, a TILTED one slips
// through: +10 token behind it. LOOP RINGS: 8 rings on a vertical circle (centre `yc` above the
// ground, radius R) — all 8 in one LOOP = LOOP MASTER. DIVE GATES: posts + a low banner — pass
// under the banner = +15.
const FURNITURE = {
  plains: {
    slots: [{ d: 350, x: 0, gap: 2, wall: 2.5, h: 9, look: 'trees' }],          // the tutorial slot: two hero trees on the safe line
    loopRings: [],
    diveGates: [{ d: 698, x: -20, w: 10, h: 6 }, { d: 1598, x: -20, w: 10, h: 6 }], // into the cavern mouths
  },
  canyon: {
    slots: [{ d: 1170, x: 16, gap: 2, wall: 2.5, h: 14, look: 'pillars' }, { d: 1720, x: -16, gap: 2, wall: 2.5, h: 14, look: 'pillars' }],
    loopRings: [{ d: 600, x: 0, yc: 12, R: 10 }],                               // around the low arch
    diveGates: [{ d: 1840, x: 0, w: 10, h: 6 }, { d: 1100, x: -16, w: 10, h: 6 }],  // under the far arch; in the updraft run
  },
  city: {
    slots: [{ d: 1150, x: 16, gap: 2, wall: 2.5, h: 18, look: 'towers' }],
    loopRings: [{ d: 735, x: 0, yc: 13, R: 10 }],                               // just past the bridge
    diveGates: [{ d: 700, x: 8, w: 10, h: 6 }, { d: 1600, x: 0, w: 10, h: 6 }],    // under the bridge
  },
  snow: {
    slots: [{ d: 1000, x: -12, gap: 2, wall: 2.5, h: 10, look: 'ice' }],
    loopRings: [],
    diveGates: [{ d: 600, x: 8, w: 10, h: 6 }, { d: 1400, x: 10, w: 10, h: 6 }],
  },
  desert: {
    slots: [{ d: 1330, x: -8, gap: 2, wall: 2.5, h: 10, look: 'pyramid' }],      // beside the pyramid
    loopRings: [],
    diveGates: [{ d: 1080, x: 8, w: 10, h: 6 }, { d: 1720, x: -8, w: 10, h: 6 }],
  },
  ocean: {
    slots: [{ d: 1340, x: 14, gap: 2, wall: 2.5, h: 10, look: 'rocks' }],        // the lighthouse-and-rock slot
    loopRings: [{ d: 1300, x: 13, yc: 13, R: 10 }],                             // beside the lighthouse
    diveGates: [{ d: 1000, x: 12, w: 10, h: 6 }, { d: 1700, x: -10, w: 10, h: 6 }],
  },
  space: {
    slots: [{ d: 1240, x: -6, gap: 2, wall: 2.5, h: 10, look: 'station' }],     // the station slot
    loopRings: [{ d: 1290, x: -3, yc: 12, R: 10 }],                             // beside the station
    diveGates: [{ d: 1120, x: 10, w: 10, h: 6 }, { d: 1880, x: 0, w: 10, h: 6 }],
  },
  jetstream: {
    slots: [{ d: 1105, x: -14, gap: 2, wall: 6, h: 16, look: 'cloud', mega: true }, { d: 1820, x: 14, gap: 2, wall: 6, h: 14, look: 'cloud' }],
    loopRings: [{ d: 1000, x: 0, yc: 20, R: 13, mega: true }],                  // the mega ring
    diveGates: [{ d: 840, x: 0, w: 10, h: 8 }, { d: 1640, x: 0, w: 10, h: 9 }],    // under the cloud bridges
  },
};
for (const [id, f] of Object.entries(FURNITURE)) Object.assign(STAGES[id], f);
// The City bridge the LOOP RING lives at (fly under it, then loop).
STAGES.city.bridges = [{ kind: 'stone', d: 700, x0: -30, x1: 30, under: 10, thick: 3, depth: 8 }];

// ───────────────────────── v0.6 part 2: BUMPABLES (fixed per lap; respawn every flight) ─────────────────────────
// { type (bumpables.js CAST), d, x, y? (height of the centre above the ground; defaults to the type's) }.
// Kept off the dead-centre line so the scripted pilot's corners don't change.
const BUMPS = {
  plains: [['goose', 220, 8], ['hotAirBalloon', 460, -10], ['scarecrow', 620, -6], ['kite', 940, 10], ['goose', 1240, -8], ['hotAirBalloon', 1560, 10], ['kite', 1880, -6]],
  canyon: [['vulture', 380, -8], ['hangGlider', 760, 8], ['vulture', 1320, 6], ['hangGlider', 1580, -6], ['caveBats', 1925, -21]],
  city: [['balloonBunch', 260, 8], ['pigeonFlock', 520, -10], ['drone', 880, -6], ['kite', 1260, 8], ['balloonBunch', 1480, -8], ['drone', 1700, 6]],
  snow: [['snowman', 300, -8], ['snowyOwl', 560, 8], ['penguinTrio', 820, -6], ['snowman', 1180, 8], ['snowyOwl', 1620, -8], ['penguinTrio', 1850, 8]],
  desert: [['vulture', 330, 8], ['camel', 560, -8], ['desertRunner', 860, -6], ['vulture', 1260, 6], ['camel', 1600, -8], ['desertRunner', 1860, -6]],
  ocean: [['seagullFlock', 300, 8], ['pelican', 650, -8], ['parasail', 1050, -8], ['beachBalloon', 1420, -6], ['seagullFlock', 1720, 8], ['pelican', 1900, -10]],
  space: [['pebbleRocks', 360, -8], ['astronaut', 700, 6], ['satellite', 1080, -8], ['pebbleRocks', 1380, 6], ['astronaut', 1760, -6]],
  jetstream: [['highGoose', 400, 8], ['weatherBalloon', 640, -10], ['skydiver', 1150, 8], ['highGoose', 1300, -10], ['weatherBalloon', 1540, -8], ['skydiver', 1900, 6]],
};
for (const [id, list] of Object.entries(BUMPS)) STAGES[id].bumpables = list.map(([type, d, x, y]) => ({ type, d, x, ...(y !== undefined ? { y } : {}) }));

// ───────────────────────── v0.6 part 2: MAP EXPANSION (more to fly through + one slalom course each) ─────────────────────────
// archways = freestanding arches (two legs + a lintel; the opening is safe, the stone bonks).
// courses = 5 chained gates (thin solid posts + a coin line): all 5 in one pass = COURSE CLEAR +20.
const gate = (d, x, w = 7, h = 8, extra = {}) => ({ d, x, w, h, ...extra });
const EXPANSION = {
  plains: {
    bridges: [{ kind: 'covered', d: 980, x0: -30, x1: 30, under: 9, thick: 3.5, depth: 10 }],       // the COVERED BRIDGE over the river
    caverns: [{ shape: 'hill', start: 1030, mouth: 1060, exit: 1130, end: 1160, height: 24, laneMin: 14, laneMax: 26, edge: 8, roof: 10 }], // ROCK TUNNEL #2
    zones: [{ side: 'right', kind: 'cavern', from: 1030, to: 1160 }],
    courses: [{ id: 'plains-flags', look: 'flags', gates: [gate(1440, -4), gate(1465, 4), gate(1490, -4), gate(1515, 4), gate(1540, -4)] }],
  },
  canyon: {
    bridges: [{ kind: 'rock', d: 820, x0: -34, x1: 34, under: 14, thick: 5, depth: 8 }],           // the NATURAL ROCK BRIDGE
    courses: [{ id: 'canyon-pillars', look: 'banners', gates: [gate(910, 21, 6, 12), gate(935, 12, 6, 12), gate(960, 21, 6, 12), gate(985, 12, 6, 12), gate(1010, 21, 6, 12)] }], // the pillar SLALOM COURSE
  },
  city: {
    bridges: [{ kind: 'stone', d: 1380, x0: -30, x1: 30, under: 6, thick: 3, depth: 8, arches: true }], // the RIVER BRIDGE with low arches
    courses: [{ id: 'city-construction', look: 'scaffold', gates: [gate(1200, -4), gate(1225, 4), gate(1250, -4), gate(1275, 4), gate(1300, -4)] }], // CONSTRUCTION COURSE
    decor: [{ kind: 'crane', d: 1240, x: -13 }],
  },
  snow: {
    bridges: [{ kind: 'snow', d: 700, x0: -30, x1: 30, under: 10, thick: 3, depth: 8 }],           // the SNOW ARCH bridge
    caverns: [{ shape: 'hill', start: 1560, mouth: 1585, exit: 1635, end: 1660, height: 24, laneMin: 14, laneMax: 26, edge: 8, roof: 10, ice: true, lit: true }], // ICE CAVE #2
    zones: [{ side: 'right', kind: 'iceCave', from: 1560, to: 1660 }],
    courses: [{ id: 'snow-flags', look: 'flags', gates: [gate(860, -4), gate(885, 4), gate(910, -4), gate(935, 4), gate(960, -4)] }],
  },
  desert: {
    bridges: [{ kind: 'stone', d: 1150, x0: -30, x1: 30, under: 9, thick: 3, depth: 6, aqueduct: true }], // the AQUEDUCT (over the river band)
    columns: [-18, -6, 6, 18].map((x) => ({ kind: 'aqueductLeg', x: x < 0 ? x - 6 : x + 6, d: 1150, r: 1.4, h: 9 })), // legs between the arches (centre lane clear)
    courses: [{ id: 'desert-oasis', look: 'palms', gates: [gate(860, 10), gate(885, 18), gate(910, 10), gate(935, 18), gate(960, 10)] }], // the oasis palm SLALOM
  },
  ocean: {
    archways: [{ kind: 'seaArch', d: 560, cx: -14, w: 12, h: 12, leg: 3, thick: 4, depth: 5 }],     // the ROCK SEA ARCH over the water
    courses: [{ id: 'ocean-pier', look: 'buoys', gates: [gate(1090, 20, 6), gate(1112, 12, 6), gate(1134, 20, 6), gate(1156, 12, 6), gate(1178, 20, 6)] }], // the PIER COURSE
  },
  space: {
    // The ASTEROID RING TUNNEL: 5 rings of 9 rocks around a safe tube (walls bonk, the tube is clear).
    asteroids: [0, 1, 2, 3, 4].flatMap((k) => [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
      const a = (i / 9) * Math.PI * 2;
      return { x: 8 + 6.5 * Math.cos(a), d: 1555 + k * 7, y: 10 + 6.5 * Math.sin(a), r: 1.8, tube: true };
    })),
    tube: { x: 8, y: 10, d0: 1550, d1: 1590 },
    courses: [{ id: 'space-approach', look: 'buoys', gates: [gate(1150, -20, 6), gate(1170, -18, 6), gate(1190, -20, 6), gate(1210, -18, 6), gate(1230, -20, 6)] }], // STATION APPROACH
  },
  jetstream: {
    // The GATE LINE formalized: the three speed gates + two flag gates between them.
    courses: [{ id: 'jet-gateline', look: 'pylons', gates: [gate(1180, 4, 14, 18, { noPosts: true }), gate(1220, 4, 10, 18), gate(1260, 4, 14, 18, { noPosts: true }), gate(1300, 4, 10, 18), gate(1340, 4, 14, 18, { noPosts: true })] }],
  },
};
for (const [id, x] of Object.entries(EXPANSION)) {
  const st = STAGES[id];
  for (const key of ['bridges', 'caverns', 'zones', 'columns', 'asteroids', 'archways']) if (x[key]) st[key] = [...(st[key] ?? []), ...x[key]];
  st.courses = x.courses;
  st.decor = x.decor ?? [];
  if (x.tube) st.tube = x.tube;
}

// ───────────────────────── v0.6 part 2: SUB-AREAS (one secret pocket per world) ─────────────────────────
// Fly through the PORTAL (a fixed spot at the side of the corridor) and the plane swings ~1.1 s
// sideways into a pocket lane ~70 m off the main line, flies it, and swings back at its end.
// Distance keeps counting the whole way. Pockets are world furniture (no save fields).
// portal: { d, x } · lane centre cx, half-width half · start/end = the pocket's lap-local span ·
// stash = the BONUS STASH (25 coins, per flight, not a secret) · bumpables: 2 of the world's cast.
const pocket = (id, name, look, side, portalD, len, half, bumps, extra = {}) => {
  const cx = side * 72, portalX = side * 17;
  return { id, name, look, side, portal: { d: portalD, x: portalX, w: 9, h: 14 }, cx, half, start: portalD + 25, end: portalD + 25 + len,
    exitX: side * 15, stash: { d: portalD + len, x: cx, y: 4 }, bumpables: bumps.map(([type, dd, dx]) => ({ type, d: portalD + dd, x: cx + dx })), ...extra };
};
const POCKETS = {
  plains: pocket('mushroom-grotto', 'MUSHROOM GROTTO', 'mushrooms', -1, 960, 400, 8, [['goose', 140, 3], ['kite', 300, -3]]),
  canyon: pocket('hidden-canyon', 'HIDDEN CANYON', 'slotCanyon', 1, 1220, 420, 6, [['vulture', 120, 2], ['hangGlider', 330, -2]]),
  city: pocket('rooftop-garden', 'ROOFTOP GARDEN', 'garden', -1, 150, 400, 8, [['pigeonFlock', 130, 3], ['balloonBunch', 300, -3]]),
  snow: pocket('aurora-cave', 'AURORA CAVE', 'aurora', 1, 160, 400, 8, [['snowyOwl', 120, -3], ['penguinTrio', 290, 3]]),
  desert: pocket('lost-oasis', 'LOST OASIS', 'oasis', 1, 1030, 400, 8, [['desertRunner', 140, 3], ['camel', 290, -3]]),
  ocean: pocket('coral-cove', 'CORAL COVE', 'coral', -1, 1020, 400, 8, [['seagullFlock', 130, 3], ['beachBalloon', 300, -3]]),
  space: pocket('nebula-pocket', 'NEBULA POCKET', 'nebula', 1, 920, 400, 8, [['pebbleRocks', 130, -3], ['astronaut', 290, 3]]),
  jetstream: pocket('storm-eye', 'EYE OF THE STORM', 'stormEye', -1, 160, 400, 8, [['highGoose', 120, 3], ['weatherBalloon', 300, -3]]),
};
// v1.0: a SECOND pocket per world (same pattern; its own name + look). Placed clear of pocket #1, the
// world's features, secrets 1–3 and goal gates 1–10, with an occurrence at ≈ 50–75 % of the new
// full-maxed corner (pockets are lap features, like everything else). Listed in BALANCE.md.
const POCKETS2 = {
  plains: pocket('sunflower-maze', 'SUNFLOWER MAZE', 'sunflowers', 1, 300, 400, 8, [['scarecrow', 140, 3], ['goose', 290, -3]]),
  canyon: pocket('gold-mine', 'OLD GOLD MINE', 'goldMine', 1, 190, 400, 8, [['caveBats', 130, -2], ['vulture', 300, 2]]),
  city: pocket('neon-alley', 'NEON ALLEY', 'neon', 1, 200, 350, 8, [['drone', 130, 3], ['pigeonFlock', 270, -3]]),
  snow: pocket('crystal-glacier', 'CRYSTAL GLACIER', 'glacier', -1, 1410, 400, 8, [['penguinTrio', 130, 3], ['snowman', 290, -3]]),
  desert: pocket('sandstone-temple', 'SANDSTONE TEMPLE', 'temple', 1, 120, 350, 8, [['camel', 130, -3], ['vulture', 270, 3]]),
  ocean: pocket('shipwreck-bay', 'SHIPWRECK BAY', 'shipwreck', 1, 930, 400, 8, [['pelican', 130, -3], ['seagullFlock', 290, 3]]),
  space: pocket('comet-trail', 'COMET TRAIL', 'comet', -1, 1430, 400, 8, [['satellite', 140, 3], ['astronaut', 290, -3]]),
  jetstream: pocket('rainbow-bridge', 'RAINBOW BRIDGE', 'rainbow', 1, 210, 350, 8, [['skydiver', 130, -3], ['highGoose', 270, 3]]),
};
for (const [id, p] of Object.entries(POCKETS)) STAGES[id].pockets = [p, POCKETS2[id]];
// v1.0: SECRETS 4–5. Secrets 1–3 stay exactly where they are. Secret 4 hides inside the SECOND pocket
// (its first-lap lane); secret 5 floats high and far, past every v0.9-maxed flight — only the
// Lv6–10 planes reach it. Listed in BALANCE.md.
const SECRETS_45 = {
  plains: [['plains-sunflower', 'Heart of the Sunflower Maze', 75, 4, 510, 14, 5], ['plains-sky', 'High above the far meadow', -10, 40, 3075, 15, 7]],
  canyon: [['canyon-mine', 'Deep in the Old Gold Mine', 75, 4, 400, 14, 5], ['canyon-sky', 'Over the far canyon rim', -10, 40, 3195, 15, 7]],
  city: [['city-neon', 'Under the brightest neon sign', 75, 4, 385, 14, 5], ['city-sky', 'Above the far skyline', -10, 40, 4340, 15, 7]],
  snow: [['snow-glacier', 'Inside the Crystal Glacier', -69, 4, 1620, 14, 5], ['snow-sky', 'Up with the far snow clouds', -10, 40, 5170, 15, 7]],
  desert: [['desert-temple', 'The Sandstone Temple altar', 75, 4, 305, 14, 5], ['desert-sky', 'High over the far dunes', -10, 40, 6290, 15, 7]],
  ocean: [['ocean-wreck', 'The Shipwreck\'s treasure chest', 75, 4, 1140, 14, 5], ['ocean-sky', 'Far out with the high gulls', -10, 40, 7445, 15, 7]],
  space: [['space-comet', 'Riding the Comet Trail', -69, 4, 1640, 14, 5], ['space-sky', 'The far, high star cluster', -10, 40, 8900, 15, 7]],
  jetstream: [['jet-rainbow', 'Under the Rainbow Bridge', 75, 4, 395, 14, 5], ['jet-far', 'Top of the far jet stream', -10, 40, 15055, 15, 7]],
};
for (const [id, list] of Object.entries(SECRETS_45)) STAGES[id].secrets = [...STAGES[id].secrets, ...list.map(([sid, name, x, y, d, coins, radius]) => ({ id: sid, name, x, y, d, coins, radius }))];
// v1.1 FAIRNESS RULE: secret 5 moves inside the world's completion zone where it was outside it
// (or crowding the relocated goal). Same id, same stash: a found secret stays found.
const SECRET5_V11 = { plains: { d: 1520, x: -10, y: 40 }, canyon: { d: 2340, x: -10, y: 40 }, city: { d: 3280, x: -10, y: 40 }, snow: { d: 3700, x: -10, y: 40 }, desert: { d: 4800, x: -10, y: 40 }, ocean: { d: 5460, x: -10, y: 40 }, space: { d: 8900, x: -10, y: 40 }, jetstream: { d: 13650, x: -10, y: 40 } };
for (const [id, p] of Object.entries(SECRET5_V11)) Object.assign(STAGES[id].secrets[4], p);
// The Hidden Canyon is TILT country: a slot inside it.
STAGES.canyon.slots = [...STAGES.canyon.slots, { d: 1460, x: 72, gap: 2, wall: 2.5, h: 12, look: 'pillars', inPocket: true }];

// ───────────────────────── S9 NEON VOID — the true finale (v1.2) ─────────────────────────
// Black by design (the owner's call for the finale): the world drawn as neon outlines on a void.
// The base layer below repeats every 2,000 m like every world; the 40,000 m authored run — the
// barrier walls, laser slaloms, sliding walls and the SLIPSTREAM lanes — lives in neon.js.
STAGES.neonvoid = {
  ...base,
  id: 'neonvoid', name: 'Neon Void',
  unlock: { after: 'jetstream', best: 14000 },
  unlockBanner: 'NEW PLANE: VOID RUNNER!',
  // The VOID RUNNER: a dark light-flyer — near-black body, cyan neon trim, a neon ring propeller
  // and a light-ribbon trail. The fastest stage plane; stalls at 18 and steers × 1.1 (precision).
  plane: { name: 'Void Runner', body: 0x10101c, wing: 0x1a1a30, accent: 0x00e5ff, wingScale: 0.9, floats: false, runner: true,
    caps: [96, 112, 129, 147, 166, 181, 197, 215, 234, 255], decayMul: 5, glideMul: 0.02, noLiftCarry: 20, stallSpeed: 18, steerMul: 1.1, engineSound: 'hum' },
  theme: { bits: [0x00e5ff, 0xff2bd6], sky: 0x020208, fogNear: 160, fogFar: 560, hemiGround: 0x101024, sun: 0x9aa8ff,
    ground: { low: [0.02, 0.02, 0.05], grass: [0.03, 0.03, 0.07], high: [0.05, 0.05, 0.1], water: null },
    base: 0x04040a, rock: 0x14142a, scenery: 'none', treesPerChunk: 0, rocksPerChunk: 0,
    // v1.2 THEME DATA: every neon colour lives here, not in the renderers (other worlds have no `neon`).
    neon: { void: 0x020208, terrain: 0x00e5ff, feature: 0xff2bd6, obstacle: 0xff8a1a, grid: 0x0c4f6a, lane: 0x38fff2, face: 0x07070f } },
  ground: { style: 'rolling', center: 1.5, side: 6 },
  flatStart: 60,
  ditches: [{ d: 520, depth: 3, halfLength: 10 }, { d: 1380, depth: 3, halfLength: 10 }],
  pits: [{ x: -6, d: 760, depth: 5, radius: 9, rim: 1.5, crater: true }, { x: 7, d: 1720, depth: 5, radius: 9, rim: 1.5, crater: true }], // neon craters
  zones: [{ side: 'right', kind: 'neonBlock', from: 1140, to: 1220 }, { side: 'left', kind: 'neonBlock', from: 1560, to: 1640 }], // the Grid Tunnel · the laser slot
  // The GRID TUNNEL: a lit block with a tube through it (the signature fly-through).
  caverns: [{ shape: 'block', start: 1140, mouth: 1145, exit: 1215, end: 1220, height: 24, laneMin: 14, laneMax: 26, edge: 9, roof: 11, lit: true, neon: true }],
  // The NEON ARCH: a freestanding gateway on the lap (the opening is safe, the frame bonks).
  archways: [{ kind: 'neonArch', d: 1430, cx: 0, w: 14, h: 14, leg: 3, thick: 3, depth: 4 }],
  slots: [{ d: 1600, x: -14, gap: 2, wall: 4, h: 14, look: 'neon' }],
  loopRings: [{ d: 1300, x: 0, yc: 18, R: 12 }],
  diveGates: [{ d: 420, x: 0, w: 10, h: 8 }, { d: 1500, x: 6, w: 10, h: 8 }],
  bumpables: [['drone', 300, 8], ['pebbleRocks', 600, -8], ['satellite', 700, -10], ['drone', 1050, -8], ['satellite', 1450, 10], ['drone', 1850, -6]].map(([type, d, x]) => ({ type, d, x })),
  // The LASER COURSE: five neon gates on the lap (thin posts bonk; all five in one pass = COURSE CLEAR).
  courses: [{ id: 'neon-lasers', look: 'lasers', gates: [gate(980, -4), gate(1005, 4), gate(1030, -4), gate(1055, 4), gate(1080, -4)] }],
  pockets: [
    pocket('grid-core', 'THE GRID CORE', 'gridCore', -1, 180, 400, 8, [['drone', 130, 3], ['satellite', 290, -3]]),
    pocket('prism-vault', 'PRISM VAULT', 'prism', 1, 640, 400, 8, [['satellite', 130, -3], ['drone', 290, 3]]),
  ],
  secrets: [
    { id: 'neon-tunnel', name: 'Deep in the Grid Tunnel', x: 20, y: 3, d: 1180, coins: 14, radius: 5 },
    { id: 'neon-loop', name: 'Top of the neon loop', x: 0, y: 30, d: 1300, coins: 13, radius: 5 },
    { id: 'neon-slot', name: 'Behind the laser slot', x: -14, y: 6, d: 1625, coins: 15, radius: 5 },
    { id: 'neon-prism', name: 'At the heart of the Prism Vault', x: 75, y: 4, d: 880, coins: 14, radius: 5 },
    { id: 'neon-far', name: 'The last light in the void', x: -10, y: 40, d: 29505, coins: 15, radius: 7 },
  ],
  patterns: patterns(['ditchDip', 'craterDip']),
};
