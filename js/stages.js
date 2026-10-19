// Stage data, keyed by stage id. A new stage = a new entry here (its own terrain
// features, coin-pattern pool and secrets); the save/shop/game read stages by id.
// Distances (d) are metres from the slingshot. x: + = right, - = left.

export const DEFAULT_STAGE = 'plains';

export const STAGES = {
  plains: {
    id: 'plains',
    name: 'Plains',
    plane: 'Wooden Trainer',
    cycle: 2000,          // the feature layout repeats every 2,000 m (secrets only in the first lap)
    flatStart: 40,        // first ~40 m after the ramp stay flat
    hills: {
      centerHeight: 5,    // rolling hills in the safe centre lane
      sideHeight: 14,     // rolling hills out at the sides (up to ~14 m)
      centerHalfWidth: 10,
    },
    // Trenches across the whole track, 3–5 m deep.
    ditches: [
      { d: 450, depth: 4, halfLength: 8 },
      { d: 980, depth: 3, halfLength: 7 },
      { d: 1550, depth: 5, halfLength: 9 },
      { d: 1960, depth: 4, halfLength: 8 },
    ],
    // Round pits, ~6 m deep, ~8 m radius.
    pits: [
      { x: -4, d: 320, depth: 6, radius: 8 },
      { x: 9, d: 1180, depth: 6, radius: 8 },
      { x: 3, d: 1420, depth: 5.5, radius: 7 },
      { x: -6, d: 1680, depth: 6, radius: 8 },
    ],
    // Character zones by distance band (R2): left caverns, right big-tree forest.
    zones: [
      { side: 'right', kind: 'forest', from: 500, to: 700 },
      { side: 'left', kind: 'cavern', from: 700, to: 900 },
      { side: 'left', kind: 'bigHill', from: 1040, to: 1130 },
      { side: 'right', kind: 'forest', from: 1300, to: 1500 },
      { side: 'left', kind: 'cavern', from: 1600, to: 1900 },
    ],
    // LEFT caverns: a big hill with a tunnel through it. The tunnel lane is x in
    // [laneMin, laneMax]; the hill's inner edge is at x = edge (centre flows past).
    caverns: [
      { start: 700, mouth: 760, exit: 840, end: 900, height: 26, laneMin: -26, laneMax: -14, edge: -8, roof: 10 },
      { start: 1600, mouth: 1710, exit: 1790, end: 1900, height: 28, laneMin: -26, laneMax: -14, edge: -8, roof: 10,
        alcove: { from: 1745, to: 1761, laneMax: -10 } },
    ],
    // The biggest left hill (secret 1 hides behind it).
    bigHills: [{ x: -40, d: 1080, rx: 30, rd: 40, height: 30 }],
    // RIGHT forests: big trunks in a slalom, ~25 m apart.
    forests: [
      { from: 510, to: 690, step: 25, xs: [12, 21] },
      { from: 1310, to: 1490, step: 25, xs: [12, 21], hero: { d: 1410, x: 18, radius: 1.5, height: 18 } },
    ],
    trunk: { radius: 0.75, height: 14, crown: 6 },
    // Fixed coin trails through the caves (~15 coins each).
    caveTrails: true,
    // R4 secrets: fixed stashes (y = height above the floor); first reach per save = banner + sparkle burst.
    secrets: [
      { id: 'plains-hill', name: 'Behind the big hill', x: -20, y: 4, d: 1136, coins: 12, radius: 7 },
      { id: 'plains-cave', name: 'Cave alcove', x: -12, y: 3, d: 1753, coins: 14, radius: 5 },
      { id: 'plains-tree', name: 'Behind the hero tree', x: 18, y: 4, d: 1428, coins: 15, radius: 6 },
    ],
    // R1 coin-pattern pool (10). Gentle openers first; specials only where their feature is.
    patterns: {
      pool: ['line', 'highArc', 'slalom', 'dive', 'stairs', 'wave', 'fork', 'ring', 'treeWeave', 'ditchDip'],
      gentle: ['line', 'highArc'],
      tricky: ['slalom', 'dive', 'stairs', 'wave', 'fork', 'ring'],
      segment: 80,
      coinsEach: 10,
    },
  },
};

export function stageData(id) {
  return STAGES[id] ?? null;
}
