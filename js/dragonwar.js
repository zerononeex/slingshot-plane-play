// v1.5 S13 DRAGON WAR — the authored data of the first 50,000 m MEGA-STAGE (a Skyrim-flavoured
// medieval war world). Five 10,000 m biome ARCS, fifty named 1,000 m zones, the hazard layout read by
// the shared mega layer (megarun.js: weave rows, tilt sectors, loop doors, shooters, wild dragons,
// thermals, war-wind lanes), the ten spectacle moments, the hero landmarks and the long-run set
// pieces. Everything at ABSOLUTE metres. Pure data + maths (no DOM / three.js). See BALANCE.md
// "Dragon War (v1.5)".

export const DW_RUN = 50000;
export const ARC_LEN = 10000;

// ───────────────────────── the base lap (repeats every 2,000 m, like every world) ─────────────────────────
// Lap-local metres. The mega layer keeps ≥ 60 m clear of all of it.
export const DW_LAP = {
  pockets: [{ id: 'dragon-roost', name: 'DRAGON ROOST', look: 'dragonRoost', side: -1, portal: 180 }, { id: 'war-chest-vault', name: 'WAR CHEST VAULT', look: 'warChest', side: 1, portal: 1180 }],
  archway: { kind: 'castleArch', d: 700, cx: 0, w: 16, h: 16, leg: 3, thick: 3, depth: 5 },
  loopRing: { d: 900, x: 0, yc: 20, R: 12 },
  diveGates: [{ d: 420, x: 0, w: 10, h: 8 }, { d: 1660, x: 6, w: 10, h: 8 }],
  course: [1480, 1505, 1530, 1555, 1580],
  cavern: { shape: 'block', start: 1130, mouth: 1135, exit: 1215, end: 1220, height: 30, laneMin: -26, laneMax: -14, edge: -9, roof: 10, lit: true, castle: true },
  bridge: { kind: 'stone', d: 1440, x0: -30, x1: 30, under: 12, thick: 3, depth: 8 },
  slot: { d: 1620, x: -14, gap: 2, wall: 2.5, h: 12, look: 'towers' },
  busy: [[120, 240], [360, 480], [640, 760], [840, 960], [1120, 1240], [1420, 1640], [1600, 1720]],
};
const lapBusy = (d) => { const l = d % 2000; return DW_LAP.busy.some(([a, b]) => l > a - 6 && l < b + 6); };

// ───────────────────────── the five ARCS (looks + terrain grammar) ─────────────────────────
// ground = the terrain shape (terrain.js blends across arc edges) · pal = ground colours (each zone
// shifts it a little: `tint`) · sky/sun/hemi = lighting · scenery = the small (solid) trees and rocks ·
// particles = the drifting ambient bits · kit = the dressing set (megaview.js) · ambient = its animated
// life (≥ 3 per arc; AMBIENT below) · zones = 10 names.
export const ARCS = [
  { id: 'snowfields', name: 'THE SNOWFIELDS', from: 0, to: 10000,
    ground: { style: 'snow', center: 4, side: 16, peaks: 34 }, water: [0.62, 0.82, 0.95],
    pal: { low: [0.78, 0.86, 0.94], grass: [0.92, 0.95, 1.0], high: [1, 1, 1] }, base: 0xeef4fb, rock: 0x9fb3c8,
    sky: 0xbfe0ff, sun: 0xffffff, hemi: 0xc9d8e8, cloud: 0xffffff,
    scenery: { kind: 'snowpine', trees: 12, rocks: 3, cone: 0x2f6b4f, ball: 0x4a8a6a, trunk: 0x6b4423 },
    particles: { kind: 'snow', color: 0xffffff, dir: -1 },
    kit: ['pine', 'pine', 'pine', 'cabin', 'iceFall', 'stoneCircle', 'pine', 'watchtower'],
    ambient: ['snow', 'aurora', 'ravens', 'chimneySmoke', 'iceFalls', 'rivers'],
    zones: ['FROSTGATE', 'PINEWATCH', 'WOLF RUN', 'THE FROZEN RIVER', 'ICEFALL CLIFFS', 'SNOWHOLLOW VILLAGE', 'THE WHITE BARROWS', 'WINTERHORN PASS', 'AURORA FIELDS', 'THE ICE GATE'] },
  { id: 'deepforest', name: 'THE DEEP FOREST', from: 10000, to: 20000,
    ground: { style: 'rolling', center: 5, side: 15 }, water: [0.25, 0.55, 0.62],
    pal: { low: [0.24, 0.38, 0.2], grass: [0.24, 0.52, 0.22], high: [0.4, 0.36, 0.26] }, base: 0x2f7a35, rock: 0x6b6a5a,
    sky: 0xa8e2c8, sun: 0xfff6d8, hemi: 0x3f7a3a, cloud: 0xf4fff4,
    scenery: { kind: 'mixed', trees: 18, rocks: 3, cone: 0x2f6b3a, ball: 0x3f9a3a, trunk: 0x6b4423 },
    particles: { kind: 'leaves', color: 0x6fbf3a, dir: -1 },
    kit: ['giantTree', 'giantTree', 'canopy', 'vines', 'giantTree', 'ruin', 'canopy', 'mushrooms'],
    ambient: ['leaves', 'songbirds', 'rivers'],
    zones: ['THE EDGEWOOD', 'MOSSHOLLOW', 'ELDERGROVE', 'THE TANGLE', 'THE SUNKEN SHRINE', 'OWL\'S ROOST', 'THORNWEAVE', 'THE ANCIENT RING', 'FERNDEEP', 'THE WORLD ROOTS'] },
  { id: 'warplains', name: 'THE WAR PLAINS', from: 20000, to: 30000,
    ground: { style: 'rolling', center: 3, side: 9 }, water: [0.3, 0.6, 0.85],
    pal: { low: [0.5, 0.42, 0.3], grass: [0.58, 0.7, 0.32], high: [0.62, 0.56, 0.44] }, base: 0x8fae4a, rock: 0x8a7f70,
    sky: 0xffd8a8, sun: 0xfff0d0, hemi: 0x8a7a52, cloud: 0xfff6ea,
    scenery: { kind: 'mixed', trees: 5, rocks: 4, cone: 0x3f7a3a, ball: 0x5aa83f, trunk: 0x7a5230 },
    particles: { kind: 'ash', color: 0xd8d0c8, dir: 1 },
    kit: ['tent', 'tent', 'banner', 'siegeTower', 'wagon', 'regiment', 'smoke', 'banner'],
    ambient: ['ash', 'banners', 'smokeColumns', 'wagons', 'crows', 'rivers'],
    zones: ['BANNERFIELD', 'THE KING\'S ROAD', 'TENT CITY', 'THE SIEGE LINE', 'TREBUCHET RIDGE', 'IRONGATE TOWN', 'THE WAGON ROAD', 'RIVERFORD', 'THE BROKEN WALL', 'DRAGONSBANE'] },
  { id: 'firelands', name: 'THE SCORCHED FIRELANDS', from: 30000, to: 40000,
    ground: { style: 'rolling', center: 3, side: 12 }, lava: [1, 0.38, 0.08],
    pal: { low: [0.16, 0.14, 0.15], grass: [0.38, 0.22, 0.17], high: [0.28, 0.25, 0.27] }, base: 0x3a2a28, rock: 0x4a3530,
    sky: 0xffc49a, sun: 0xffe8c8, hemi: 0x8a3a2a, cloud: 0x9a908a,
    scenery: { kind: 'none', trees: 0, rocks: 8, cone: 0x2a2426, ball: 0x3a302e, trunk: 0x2a2020 },
    particles: { kind: 'embers', color: 0xffa040, dir: 1 },
    kit: ['obsidian', 'obsidian', 'nest', 'lavaFall', 'smoke', 'perchedDragon', 'obsidian', 'bones'],
    ambient: ['embers', 'smokeColumns', 'lavaFalls', 'lavaRivers', 'fireBats'],
    zones: ['THE SCORCH', 'ASHEN WASTE', 'LAVA RUN', 'THE BONEYARD', 'OBSIDIAN TEETH', 'THE BROODING NESTS', 'THE FORGE', 'CINDER CANYON', 'FIREFALL', 'THE BURNING CROWN'] },
  { id: 'skycastles', name: 'THE SKY CASTLES', from: 40000, to: 50000,
    ground: { style: 'rolling', center: 2, side: 5 }, cloudSea: true,
    pal: { low: [0.86, 0.9, 0.97], grass: [0.94, 0.96, 1.0], high: [0.8, 0.84, 0.92] }, base: 0xe6edf7, rock: 0x9a8f86,
    sky: 0x8fcbff, sun: 0xfff6e0, hemi: 0xdfe8f2, cloud: 0xffffff,
    scenery: { kind: 'none', trees: 0, rocks: 0, cone: 0x2f6b4f, ball: 0x4fb34a, trunk: 0x6b4423 },
    particles: { kind: 'motes', color: 0xffffff, dir: 1 },
    kit: ['plateau', 'castle', 'bridge', 'plateau', 'castle', 'banner', 'plateau', 'waterfall'],
    ambient: ['motes', 'waterfalls', 'banners', 'doves'],
    // v1.5 §6: THE GOLDEN CITY opens the arc (the goal sits in its great plaza) and THE GREAT HALL is its palace.
    zones: ['THE GOLDEN CITY', 'THE GILDED BRIDGES', 'THE GOLDEN SPIRES', 'THE GREAT HALL', 'THE HALL OF KINGS', 'CATHEDRAL HEIGHTS', 'THE KING\'S STAIR', 'WINDWALL', 'THE DRAGON THRONE', 'THE LAST KEEP'] },
];
// The animated ambient vocabulary (megaview.js draws each): drifting particles, sky + flock life, and
// the dressing that moves — each animated dressing element needs its kit piece in the arc's kit.
export const AMBIENT = {
  snow: 'particles', leaves: 'particles', ash: 'particles', embers: 'particles', motes: 'particles',
  aurora: 'sky', ravens: 'flock', songbirds: 'flock', crows: 'flock', fireBats: 'flock', doves: 'flock',
  chimneySmoke: 'cabin', smokeColumns: 'smoke', iceFalls: 'iceFall', lavaFalls: 'lavaFall', waterfalls: 'waterfall',
  banners: 'banner', wagons: 'wagon', rivers: 'ditches', lavaRivers: 'ditches',
};
export const arcIndex = (d) => Math.max(0, Math.min(ARCS.length - 1, Math.floor(d / ARC_LEN)));
export const arcAt = (d) => ARCS[arcIndex(d)];
export const DW_ZONES = ARCS.flatMap((a) => a.zones);
// Each zone shifts its arc's palette: [brightness, warm (r up / b down)] — no two neighbours alike.
export const zoneTint = (k, out = [0, 0]) => { out[0] = 1 + 0.07 * Math.sin(k * 2.39 + 0.4); out[1] = 0.035 * Math.sin(k * 1.71 + 1.1); return out; };

// ───────────────────────── HERO LANDMARKS (one per 2,000 m; outside the corridor, BIG) ─────────────────────────
// [d, x, look, NAME]. Built by setpieces.js; the names are printed in BALANCE.md.
export const HEROES = [
  [1150, -86, 'frostKeep', 'FROSTHOLD KEEP'], [3150, 90, 'frozenFalls', 'THE FROZEN FALLS'], [5150, -84, 'standingStones', 'THE STANDING STONES'],
  [7150, 88, 'watchtowerGiant', 'WINTERHORN WATCHTOWER'], [9150, -92, 'dragonSkull', 'THE ICE DRAGON\'S SKULL'],
  [11150, 96, 'worldTree', 'THE WORLD TREE'], [13150, -88, 'ruinedTemple', 'THE SUNKEN SHRINE'], [15150, 90, 'stagStatue', 'THE ELDER STAG'],
  [17150, -94, 'treeCitadel', 'THE TREEHOUSE CITADEL'], [19150, 88, 'fallenGiant', 'THE FALLEN STONE GIANT'],
  [21150, -96, 'greatTrebuchet', 'THE GREAT TREBUCHET'], [23150, 98, 'castleKeep', 'IRONGATE CASTLE'], [25150, -90, 'siegeTowers', 'THE SIEGE TOWERS'],
  [27150, 94, 'warPavilion', 'THE KING\'S PAVILION'], [29150, -100, 'fortress', 'DRAGONSBANE FORTRESS'],
  [31150, 92, 'dragonGraveyard', 'THE DRAGON GRAVEYARD'], [33150, -88, 'obsidianGate', 'THE OBSIDIAN GATE'], [35150, 90, 'moltenForge', 'THE MOLTEN FORGE'],
  [37150, -94, 'broodNest', 'THE BROOD MOTHER\'S NEST'], [39150, 100, 'burningMountain', 'THE BURNING MOUNTAIN'],
  [41150, -96, 'goldenCitadel', 'THE GOLDEN CITADEL'], [43150, 94, 'kingsBridge', 'THE BRIDGE OF KINGS'], [45150, -92, 'highCathedral', 'THE HIGH CATHEDRAL'],
  [47150, 96, 'dragonThrone', 'THE DRAGON THRONE'], [49150, -98, 'lastKeep', 'THE LAST KEEP'],
];
// Extra (smaller) ruined temples in the Deep Forest, every ~4,000 m (the arc kit's set dressing).
const TEMPLES = [[12350, 70], [16350, -72], [19850, 74]];

// ───────────────────────── the HAZARD LAYOUT (read by megarun.js) ─────────────────────────
// WEAVE SLALOMS. Rows sit in the base lap's clear windows (lap-local, 100 m apart inside a window) and
// the clear lines (offset + 8 + 16k) swing 3 m from each row to the next along the whole run — a slow
// triangle wave between −9 and +9 m — so the clean line weaves left and right and never asks for more
// than 3 m sideways per 100 m (Neon Void's family rule is ≤ 4.5 %). Per lap: the windows used (A–F);
// the Deep Forest uses nearly all of them (the densest pure weave of the stage); the doors and tilt
// sectors take a window of their own.
const WINDOWS = { A: [240, 2], B: [480, 2], C: [800, 1], D: [980, 2], E: [1260, 2], F: [1740, 4] };
const LAP_PLAN = [
  'F', 'D', 'B', 'A', 'DF',                         // Snowfields (tilt 5,300 · door 7,900)
  'ABCDEF', 'ABDEF', 'ABCDEF', 'ACDEF', 'ABCDEF',   // Deep Forest
  'DF', 'DE', 'BDF', 'DF', 'BDF',                   // War Plains (door 23,900 · tilt 26,500)
  'BF', 'BDF', 'B', 'DF', 'BF',                     // Scorched Firelands (tilt 35,300 · THE SHELTER + THE LAVA WAVE 36,460)
  'ACF', 'A', 'CEF', 'AEF', 'ACEF',                 // Sky Castles (door 41,400 · THE GREAT HALL 43,100–44,500)
];
const ROW_KIND = ['pine', 'giantTree', 'tower', 'spire', 'castleTower'];
const SWING = [0, 1, 2, 3, 2, 1, 0, -1, -2, -3, -2, -1];
const WEAVE = LAP_PLAN.flatMap((plan, lap) => [...plan].flatMap((w) => {
  const [l0, n] = WINDOWS[w];
  return Array.from({ length: n }, (_, j) => ({ d: lap * 2000 + l0 + j * 100, kind: ROW_KIND[Math.floor(lap / 5)] }));
})).filter((w) => w.d < DW_RUN).map((w, k) => ({ ...w, offset: (SWING[k % SWING.length] * 3 + 16) % 16 }));

// TILT SECTORS (mandatory): a tall wall with one knife-edge slot. [d, slot x, name]
const TILTS = [[5300, 0, 'THE ICE NEEDLE'], [26500, 8, 'THE ARROW SLIT'], [35300, -8, 'THE OBSIDIAN BLADE']];
// LOOP DOORS: [door d, loop mark d, lane x, bottom key height (abs), name] — the teacher, the war gate, the sky gate.
const DOORS = [[7900, 7760, 0, 22, 'THE ICE GATE'], [23900, 23760, 0, 22, 'IRONGATE'], [41400, 41270, 0, 22, 'THE SKY GATE']];

// SHOOTERS. Dragons: [d, x, y (muzzle, abs), aim ('plane' or [x, y] = the line they guard), patrol?]
// Trebuchets: [d, x (side, outside the corridor), aimX (the ground line the boulder lands on)].
const DRAGONS = [
  [2600, -34, 30, [-14, 18]], [4200, 34, 40, [14, 34]], [6600, -36, 50, [0, 52], [8, 7]], [9500, 34, 36, 'plane'],
  [11800, 36, 44, [14, 40]], [14300, -36, 38, 'plane'], [16700, 36, 50, [0, 54], [6, 8]], [19200, -34, 34, [-12, 30]],
  [20900, 34, 46, 'plane'], [22300, -36, 40, [-14, 36]], [25100, 36, 52, [0, 54], [8, 6]], [27300, -34, 44, 'plane'], [28800, 34, 38, [12, 30]], [29600, -36, 50, 'plane'],
  [30300, 34, 44, 'plane'], [30900, -36, 50, [0, 54]], [31500, 36, 36, [14, 28], [6, 7]], [32100, -34, 46, 'plane'], [32900, 36, 52, [0, 50]],
  [33400, -36, 40, [-14, 34]], [34100, 34, 48, 'plane', [8, 6]], [34800, -34, 44, [0, 52]], [35900, 36, 50, 'plane'], [36600, -36, 38, [-12, 30]],
  [37300, 34, 52, 'plane', [6, 8]], [38100, -34, 46, [0, 54]], [38800, 36, 40, 'plane'], [39400, -36, 50, [14, 46]],
  [40500, 34, 56, [0, 54]], [42000, -36, 50, 'plane'], [42600, 36, 46, [14, 40], [8, 7]], [44800, -34, 54, 'plane'], [46200, 36, 50, [0, 56]],
  [47600, -36, 48, 'plane', [6, 6]], [48700, 34, 54, [-12, 50]], [49500, -36, 52, 'plane'],
];
const TREBUCHETS = [
  [21580, -72, 0], [21620, 72, -10], [22700, -74, 10], [24580, 72, 0], [24620, -72, 12], [26100, -74, -8], [27950, 72, 6], [28050, -72, -6], [29150, 74, 0], [29400, -74, 10],
];
// v1.5 §6 ARCHERS (arrows: the shared shooter system, thinner + faster than fireballs, same hit rule):
// [d, x, y (bow, abs), look, patrol?]. ELVES on canopy platforms in the Deep Forest (shooting at the
// weave line), CAVALRY BOWMEN riding deterministic paths on the War Plains (shooting up), CASTLE archers
// on the Sky Castles' towers and on THE GREAT HALL's balconies.
const ARCHERS = [
  [10700, -30, 34, 'elf'], [11400, 30, 38, 'elf'], [12900, -30, 32, 'elf'], [13700, 30, 36, 'elf'],
  [15000, -30, 40, 'elf'], [16100, 30, 34, 'elf'], [17800, -30, 36, 'elf'], [18900, 30, 38, 'elf'],
  [20500, -46, 12, 'cavalry', [10, 8, 0]], [21900, 46, 12, 'cavalry', [10, 7, 1]], [23300, -46, 12, 'cavalry', [12, 8, 2]], [24300, 46, 12, 'cavalry', [10, 9, 0.5]],
  [25700, -46, 12, 'cavalry', [12, 7, 1.5]], [26900, 46, 12, 'cavalry', [10, 8, 2.5]], [28300, -46, 12, 'cavalry', [12, 9, 0.2]], [29700, 46, 12, 'cavalry', [10, 7, 1.1]],
  [40800, -34, 46, 'castle'], [42300, 34, 50, 'castle'], [45300, -34, 48, 'castle'], [46700, 34, 52, 'castle'], [48000, -34, 46, 'castle'], [49200, 34, 50, 'castle'],
  [43350, 16, 50, 'hall'], [43750, -16, 50, 'hall'], [44200, 16, 50, 'hall'],
];
// LAVA GEYSERS (the Firelands): a crack in the ground glows (the telegraph), then the geyser throws an
// arc of lava blobs across the line. [d, x (the vent, beside the corridor), [dx, y] per blob]
const FAN = (sx) => [[16, 18], [26, 30], [36, 42], [46, 26]].map(([dx, y]) => [-sx * dx, y]);
const GEYSERS = [[30800, -30], [31300, 30], [32300, -30], [33250, 30], [34250, -30], [37450, 30], [38250, -30], [39200, 30]]; // in the clear stretches between the weave windows

// THE LAVA WAVE (~36,000 m, one, fully telegraphed): the warning at `warn`, a mountainside CAVE ahead
// (THE SHELTER, a tunnel through the rock on the right — clear of the left pocket's portal); the wave
// pours over that mountain from the right (`from` +1) and sweeps the line as the plane reaches `d`.
// Inside the tunnel = safe (a fanfare); outside = the heavy knock (× 0.5 speed + a big push to the
// left, away from the rock), never damage.
const CAVE = { d0: 36460, d1: 36640, x0: 4, x1: 30, lane: [10, 22], roof: 13, top: 42, cruise: 7, name: 'SHELTER' };
const WAVE_AT = { d: 36560, warn: 35360, from: 1, name: 'THE LAVA WAVE' };

// THE GREAT HALL (the Golden City's palace, late in the Sky Castles): a castle interior on a raised
// stone floor — the facade's doorway, stone halls with banners, pillars and torchlight, archers on the
// balconies, crumbling RUBBLE (its shadow first), DIVE and CLIMB gap walls and knife-edge DOORWAYS.
const HALL = { d0: 43100, d1: 44500, floor: 30, half: 18, outer: 34, door: { half: 14, y0: 32, y1: 58 }, cruise: 44, name: 'THE GREAT HALL' };
// gap walls: [d, x, opening y (abs), w, h, move]
const GAPS = [[43450, 0, 36, 14, 8, 'dive'], [43800, 0, 52, 14, 8, 'climb'], [44300, 0, 36, 14, 8, 'dive']];
// knife-edge doorways: [d, slot x, name]
const HALL_TILTS = [[43620, 0, 'THE KNIGHTS\' DOOR'], [44050, -6, 'THE CHAPEL DOOR']];
// falling rubble: [d, x (where it falls), from y (abs)]
const RUBBLE = [[43300, 4, 58], [43920, -5, 58], [44420, 3, 58]];
// THE GOLDEN CITY: the golden dressing (megaview.js) from its gate to the hall; the goal (unchanged,
// goals.js) sits in its great plaza.
const GOLDEN = { d0: 39800, d1: 42800, plaza: 40560, name: 'THE GOLDEN CITY' };
// …and its landmark set (outside the corridor): the gate, the plaza's colonnades either side of the
// goal, the golden towers (+ the hero, THE GOLDEN CITADEL). [d, x, look, NAME]
export const GOLDEN_SET = [
  [39860, -64, 'goldenGate', 'THE GOLDEN GATE'], [39860, 64, 'goldenGate', 'THE GOLDEN GATE'],
  [40560, -70, 'goldenColonnade', 'THE GREAT PLAZA'], [40560, 70, 'goldenColonnade', 'THE GREAT PLAZA'],
  [40200, 66, 'goldenTower', 'A GOLDEN TOWER'], [40950, -66, 'goldenTower', 'A GOLDEN TOWER'], [41700, 68, 'goldenTower', 'A GOLDEN TOWER'],
  [42150, -70, 'goldenTower', 'A GOLDEN TOWER'], [42650, 66, 'goldenTower', 'A GOLDEN TOWER'],
];

// WILD dragons (no fire — big bonk critters on sine paths): [d, x, y (abs), ax, ay, period, phase]
const WILD = [
  [3700, -18, 38, 6, 6, 7, 0], [6000, 18, 44, 5, 8, 8, 1.2], [9800, -16, 30, 6, 5, 6, 2.1],
  [12100, 18, 40, 5, 7, 7, 0.5], [15600, -18, 46, 6, 6, 9, 1.7], [18600, 16, 34, 6, 5, 8, 2.6],
  [21300, -18, 42, 5, 8, 7, 0.9], [25400, 18, 38, 6, 6, 8, 2.2], [28500, -16, 46, 5, 7, 6, 0.3],
  [31200, 18, 40, 6, 6, 7, 1.4], [34300, -18, 44, 5, 8, 9, 2.8], [38600, 16, 36, 6, 5, 7, 0.7],
  [42600, -18, 42, 6, 6, 8, 1.9], [45900, 18, 46, 5, 7, 7, 0.2], [48300, -16, 40, 6, 6, 8, 2.4],
];
// THERMALS (cliff / waterfall / plateau edges, lava vents): [d, x, r, lift]
const THERMALS = [
  [1300, -21, 10, 4], [2500, 21, 10, 4], [3300, 21, 10, 4], [5700, -21, 10, 4], [7300, 21, 10, 4], [9300, -21, 10, 4],
  [30700, 20, 9, 4.5], [32700, -20, 9, 4.5], [34700, 20, 9, 4.5], [36700, -20, 9, 4.5], [38200, 20, 9, 4.5], [39300, -20, 9, 4.5],
  [40300, -21, 10, 5], [41500, 21, 10, 5], [42500, -21, 10, 5], [45500, 21, 10, 5], [46500, -21, 10, 5], [47500, 21, 10, 5], [48500, -21, 10, 5], [49500, 21, 10, 5],
];
// WAR-WIND LANES on the high lines (the wind-lane mechanic): [d0, d1, x, y, w, h, push]; only for a
// plane at ≥ 50 m/s (a slow plane drops out, like Neon Void's slipstreams).
export const WIND_MIN = 50;
// Two lanes a lap through the first 32 km (wide enough for the weave lines), then the plane glides
// out on its own through the Firelands and the Sky Castles (their thermals help) — the FULL corner.
const LANE_LAPS = 16;
const LANES = Array.from({ length: LANE_LAPS }, (_, lap) => [[lap * 2000 + 100, lap * 2000 + 700], [lap * 2000 + 1000, lap * 2000 + 1600]])
  .flat().map(([d0, d1]) => [d0, d1, 0, 52, 40, 18, 9]);

// The SPECTACLE moments (looks only; 2 per arc): [d, kind, NAME, side]
const SPECTACLES = [
  [2800, 'flyby', 'THE FROST WYRM FLYBY', 1], [6900, 'avalanche', 'THE AVALANCHE', -1],
  [12600, 'flock', 'THE GREAT FLOCK', 1], [17400, 'flyby', 'THE CANOPY DRAGON', -1],
  [22000, 'volley', 'THE TREBUCHET VOLLEY', 1], [27600, 'barrage', 'THE SIEGE OF IRONGATE', -1],
  [31800, 'duel', 'TWO DRAGONS DUELLING', 1], [37800, 'eruption', 'THE BURNING MOUNTAIN ERUPTS', -1],
  [45600, 'flyby', 'THE DRAGON KING', -1], [48400, 'salute', 'THE CASTLE SALUTE', 1],
];

export const MEGA_DATA = {
  dragonwar: {
    run: DW_RUN,
    weave: WEAVE,
    tilts: TILTS.map(([d, x, name]) => ({ d, x, name })),
    doors: DOORS.map(([d, loopD, x, y, name]) => ({ d, loopD, x, y, name })),
    shooters: [
      ...DRAGONS.map(([d, x, y, aim, patrol]) => ({ kind: 'dragon', d, x, y, aim, ...(patrol ? { patrol } : {}) })),
      ...TREBUCHETS.map(([d, x, aimX]) => ({ kind: 'trebuchet', d, x, y: 0, aim: [aimX, 0] })),
      ...ARCHERS.map(([d, x, y, look, patrol]) => ({ kind: 'archer', d, x, y, aim: 'plane', look, ...(patrol ? { patrol } : {}) })),
      ...GEYSERS.map(([d, x]) => ({ kind: 'geyser', d, x, y: 0, aims: FAN(Math.sign(x)) })),
      ...RUBBLE.map(([d, x, y]) => ({ kind: 'rubble', d, x, y, aim: [x, 0] })),
    ].sort((a, b) => a.d - b.d),
    hall: HALL,
    gaps: GAPS.map(([d, x, y, w, h, move]) => ({ d, x, y, w, h, move })),
    hallTilts: HALL_TILTS.map(([d, x, name]) => ({ d, x, name })),
    cave: CAVE,
    wave: WAVE_AT,
    golden: GOLDEN,
    wild: WILD.map(([d, x, y, ax, ay, period, phase]) => ({ d, x, y, ax, ay, period, phase })),
    thermals: THERMALS.map(([d, x, r, lift]) => ({ d, x, r, lift })),
    lanes: LANES.map(([d0, d1, x, y, w, h, push]) => ({ d0, d1, x, y, w, h, push, min: WIND_MIN })),
    spectacles: SPECTACLES.map(([d, kind, name, side]) => ({ d, kind, name, side, big: name === 'THE DRAGON KING' })),
  },
};

// ───────────────────────── the LONG-RUN SET PIECES (≥ 10 authored pieces per 1,000 m zone) ─────────────────────────
// Per zone: its banner arch, 9 coin fly-throughs (arcs, rings, hoop lines — order + heights shuffled per
// zone, so no block repeats another), the hero landmark (every other zone), the Deep Forest's extra
// ruined temples and the eight long-run boost frames (the high lines). Each piece keeps clear of the
// mega layer (weave rows, tilt walls, the loop doors and their key circles, wild dragons) and of the
// base lap's furniture, so coins never sit in anything solid.
const BUSY_MEGA = [
  ...WEAVE.map((w) => [w.d - 12, w.d + 12]), ...TILTS.map(([d]) => [d - 14, d + 14]),
  ...DOORS.map(([d, loopD]) => [loopD - 40, d + 60]), ...WILD.map(([d]) => [d - 14, d + 14]),
  ...GAPS.map(([d]) => [d - 14, d + 14]), ...HALL_TILTS.map(([d]) => [d - 14, d + 14]), [HALL.d0 - 30, HALL.d0 + 20],
  [CAVE.d0 - 30, CAVE.d1 + 20],
];
// Inside THE GREAT HALL the floor is the hall's (30 m up): the pieces there sit low over it.
const inHall = (d) => d >= HALL.d0 - 10 && d <= HALL.d1 + 10;
// The base lap's SOLIDS a coin must miss (dive-gate posts, the castle arch, the gatehouse, the bridge, the course, the slot).
const LAP_SOLID = [[410, 430], [690, 712], [1100, 1260], [1432, 1448], [1472, 1588], [1610, 1630], [1650, 1670]];
const lapSolid = (d0, d1) => { const a = d0 % 2000, b = a + (d1 - d0); return LAP_SOLID.some(([x, y]) => a < y && x < b) || (b > 2000 && LAP_SOLID.some(([x, y]) => b - 2000 > x)); };
const clearSpan = (d0, d1) => !BUSY_MEGA.some(([a, b]) => d0 < b && a < d1) && !lapSolid(d0, d1);
// Long-run boost frames (8; the pockets + goal approach add 4 more in shapes.js): [zone, shape, x, y]
const FRAMES = [[3, 'triangle', 0, 46], [9, 'rectangle', 0, 50], [15, 'oval', 6, 44], [21, 'triangle', 0, 48], [27, 'square', -6, 46], [33, 'rectangle', 0, 50], [38, 'circle', 0, 44], [42, 'triangle', 0, 48]];
let seed = 1;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
export function dragonWarPieces() {
  seed = 4521;
  const out = [];
  let n = 0;
  const id = () => `dragonwar-${++n}`;
  // A clear spot near `want` for a piece spanning `len` m (null if the zone has none).
  const spot = (want, len, lo, hi) => {
    for (let k = 0; k < 40; k++) for (const s of [1, -1]) {
      const d = Math.round(want + s * k * 9);
      if (d >= lo && d + len <= hi && clearSpan(d - 4, d + len + 4) && !out.some((p) => Math.abs(p.d - d) < 22)) return d;
    }
    return null;
  };
  for (let z = 0; z < DW_ZONES.length; z++) {
    const z0 = z * 1000, z1 = z0 + 1000;
    const bd = spot(z0 + 40, 0, z0 + 10, z0 + 200);
    out.push({ kind: 'bannerArch', d: bd ?? z0 + 40, x: 0, y: inHall(bd ?? z0 + 40) ? 18 : 34, text: DW_ZONES[z], id: id() });
    const hero = HEROES.find(([d]) => d >= z0 && d < z1);
    if (hero) out.push({ kind: 'landmark', d: hero[0], x: hero[1], y: 0, look: hero[2], scale: 1, name: hero[3], id: id() });
    for (const [d, x] of TEMPLES) if (d >= z0 && d < z1) out.push({ kind: 'landmark', d, x, y: 0, look: 'ruinedTemple', scale: 0.6, name: 'a ruined temple', id: id() });
    for (const [d, x, look, name] of GOLDEN_SET) if (d >= z0 && d < z1) out.push({ kind: 'landmark', d, x, y: 0, look, scale: 1, name, id: id() });
    const fr = FRAMES.find(([zz]) => zz === z);
    // eight coin fly-throughs in a shuffled order
    const kinds = ['coinArc', 'coinArc', 'coinArc', 'coinRing', 'coinRing', 'coinRing', 'hoops', 'hoops', fr ? 'shape' : 'coinArc'];
    for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
    kinds.forEach((k0, i) => {
      const want = z0 + 100 + i * 96 + Math.round(rnd() * 30);
      let kind = k0, len = kind === 'coinArc' ? 45 + 15 * Math.floor(rnd() * 3) : kind === 'hoops' ? 70 : 0;
      let d = spot(want, len, z0 + 60, z1 - 10);
      if (d === null && kind === 'coinArc') { len = 30; d = spot(want, len, z0 + 60, z1 - 10); }          // a short arc between weave rows
      if (d === null && kind !== 'shape') { kind = 'coinRing'; len = 0; d = spot(want, 0, z0 + 60, z1 - 10); } // or a ring
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
