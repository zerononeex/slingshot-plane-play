// All tunable numbers live here. docs/BALANCE.md explains them in plain words —
// keep the two in sync when you change something.

// How the plane looks. Change these to repaint / reshape the code-built plane.
export const PLANE_TUNE = {
  bodyColor: 0xff4fa3,   // bubblegum pink body (the free default paint)
  wingColor: 0xffd23f,   // sunny yellow wings + tail
  accentColor: 0x3fc5ff, // cockpit glass + stripes
  wingScale: 1.15,       // 1 = normal wingspan, 1.3 = big wings
  propeller: true,       // false hides the propeller
};

// Slingshot launch.
export const LAUNCH = {
  minSpeed: 8,          // m/s at the smallest pull that still counts
  weakPull: 0.15,       // pulls below this (0..1) are a "flop"
  flopSpeed: 5,         // m/s the plane gets on a flop
  pullScreenFraction: 0.32, // dragging this much of the screen height = full pull
  pitchDeg: 14,         // launch angle up off the ramp
  deckHeight: 3,        // m, top of the wooden ramp
};

// Flight physics (per second). Engine level changes `decay` and launch power.
export const FLIGHT = {
  gravity: 9.8,         // how strongly diving speeds you up / climbing slows you
  drag: 0.0012,         // extra slow-down that grows with speed²
  stallSpeed: 11,       // below this the nose drops
  stallNoseDropDeg: 30, // how hard the nose drops when fully stalled
  stallSink: 4,         // extra sink speed (m/s) when fully stalled
  minAirSpeed: 6,       // the plane never goes slower than this in the air
  maxClimbDeg: 30,
  maxDiveDeg: 40,
  pitchRateDeg: 70,     // how fast the nose follows the finger
  lateralSpeed: 13,     // m/s sideways at full stick (the floor)…
  lateralShare: 0.09,   // …or 9 % of the live forward speed, whichever is more (owner playtest 2026-10-25: steer by angle)
  lateralResponse: 4,
  corridorHalfWidth: 26,
  ceiling: 60,          // m, can't climb above this
  clearance: 0.6,       // plane "radius" for ground contact
  // ground contact
  crashAngleDeg: 35,    // hitting the ground steeper than this...
  crashSpeed: 20,       // ...and faster than this = cartoon tumble
  bounceMinSpeed: 9,    // need this much speed to bounce instead of skid
  bounceMinAngleDeg: 4,
  maxBounces: 2,
  // bounce speed kept + upward pop now come from the BOUNCY WHEELS level (WHEELS below)
  launchHold: 0.5,      // s after launch the nose keeps (at least) the ramp angle unless you push down
  // No wings = no lift (v0.6): the flight path follows a ballistic arc (it bends down at
  // g·cos θ / v) toward a shallow paper-dart glide; "up" only lifts the nose and bleeds speed.
  noLiftGlideDeg: -6,   // where a wingless plane's path settles
  noLiftUpBleed: 2.5,   // m/s² extra speed loss while holding "up" with no wings
  noLiftNoseDeg: 14,    // how far the nose lifts (looks only) when holding "up" with no wings
  noLiftRecoverRate: 0.35, // × pitchRate when a dive flattens back toward the glide (a small zoom)
  noLiftCarry: 6,       // s: the launch carry — a wingless dart rides its launch line this long (unless pushed down)
  faceStep: 1.5,        // m: ground rising more than this in one step = a wall/face, not a landing
  scrapeLoss: 2,        // m/s lost per wall scrape
  roofScrapeDecel: 6,   // m/s² while scraping a tunnel roof
  trunkRadius: 0.75,
  groundFriction: 5,    // m/s² slow-down while rolling
  stopSpeed: 0.4,
  tumbleFriction: 9,
  tumbleTime: 1.6,      // s of tumbling before results
};

// ENGINE upgrade = "fly longer once you're up". Index 0 = level 1.
// propSpin = how fast the propeller idles at that level; cowl = engine ring colour.
// `cost` = coins to BUY that level. Since v0.2 the engine changes ONLY decay
// (launch power moved to the SLINGSHOT upgrade).
export const ENGINE = [
  { level: 1, decay: 0.90, cost: 0, propSpin: 1.0, cowl: 0x888888 },
  { level: 2, decay: 0.78, cost: 30, propSpin: 1.25, cowl: 0xc0c0c0 },
  { level: 3, decay: 0.66, cost: 80, propSpin: 1.5, cowl: 0x4fd1ff },
  { level: 4, decay: 0.54, cost: 150, propSpin: 1.8, cowl: 0xff8a3d },
  { level: 5, decay: 0.42, cost: 300, propSpin: 2.2, cowl: 0xffc61a },
  // v1.0 LEVEL 10: Lv6–10 stacked on top (Lv1–5 frozen). Grid-trimmed from the × 0.93 starting curve
  // to ≈ × 0.99 per level so the full-maxed corners land in the 1.25–1.40 band (BALANCE.md).
  { level: 6, decay: 0.415, cost: 450, propSpin: 2.5, cowl: 0xe5e4e2 },
  { level: 7, decay: 0.41, cost: 680, propSpin: 2.8, cowl: 0xb9f2ff },
  { level: 8, decay: 0.405, cost: 1020, propSpin: 3.1, cowl: 0x9d7bff },
  { level: 9, decay: 0.4, cost: 1530, propSpin: 3.4, cowl: 0xff6ad5 },
  { level: 10, decay: 0.395, cost: 2300, propSpin: 3.8, cowl: 0xffffff, rainbow: true },
];

// RUBBER BAND (was "Slingshot") = "a stronger launch". launchMax = m/s at full
// pull; momentum = seconds after launch with no decay/drag (dive/climb still work).
// colour = strength: on the ramp model, the shop icon and the speedometer accent.
export const BAND = [
  { level: 1, name: 'Hemp Rope', launchMax: 30, momentum: 0,   cost: 0,   color: 0xd9b77a, thickness: 1.0, doubleBands: false, frameScale: 1.0 },
  { level: 2, name: 'Red',       launchMax: 35, momentum: 2.0, cost: 30,  color: 0xe0342f, thickness: 1.3, doubleBands: false, frameScale: 1.0 },
  { level: 3, name: 'Blue',      launchMax: 40, momentum: 2.5, cost: 80, color: 0x2f7fe0, thickness: 1.3, doubleBands: true,  frameScale: 1.0 },
  { level: 4, name: 'Purple',    launchMax: 46, momentum: 3.0, cost: 150, color: 0x9b3fe0, thickness: 1.6, doubleBands: true,  frameScale: 1.2 },
  { level: 5, name: 'GOLD',      launchMax: 52, momentum: 3.5, cost: 300, color: 0xffc61a, thickness: 1.9, doubleBands: true,  frameScale: 1.6 },
  // v1.0: past gold → platinum → rainbow. launchMax here is the stock line; each plane's own caps rule (stages.js).
  { level: 6, name: 'PLATINUM',  launchMax: 56, momentum: 3.6, cost: 450,  color: 0xe5e4e2, thickness: 2.0, doubleBands: true,  frameScale: 1.7 },
  { level: 7, name: 'DIAMOND',   launchMax: 60, momentum: 3.7, cost: 680,  color: 0xb9f2ff, thickness: 2.1, doubleBands: true,  frameScale: 1.8 },
  { level: 8, name: 'COSMIC',    launchMax: 64, momentum: 3.8, cost: 1020, color: 0x9d7bff, thickness: 2.2, doubleBands: true,  frameScale: 1.9 },
  { level: 9, name: 'PRISM',     launchMax: 68, momentum: 3.9, cost: 1530, color: 0xff6ad5, thickness: 2.3, doubleBands: true,  frameScale: 2.0 },
  { level: 10, name: 'RAINBOW',  launchMax: 73, momentum: 4.0, cost: 2300, color: 0xff4fa3, thickness: 2.4, doubleBands: true,  frameScale: 2.1, rainbow: true },
];

// FUEL TANK = the BOOST. Level 0 = no tank (no BOOST button). Refills free every flight.
// NOTE: the brief lists 5 tank sizes but only 4 prices; Lv5 uses 800 (see BALANCE.md).
export const TANK = [
  { level: 0, seconds: 0,   cost: 0,   scale: 0 },
  { level: 1, seconds: 3,   cost: 40,  scale: 0.8 },
  { level: 2, seconds: 4.5, cost: 80, scale: 1.0 },
  { level: 3, seconds: 6,   cost: 150, scale: 1.2 },
  { level: 4, seconds: 8,   cost: 300, scale: 1.4 },
  { level: 5, seconds: 10,  cost: 600, scale: 1.65 },
  // v1.0: grid-trimmed from +1.5 s/level (17.5 s) to +0.6 s/level → 13 s at Lv10 (the band governs, BALANCE.md).
  { level: 6, seconds: 10.6, cost: 900,  scale: 1.75 },
  { level: 7, seconds: 11.2,   cost: 1350, scale: 1.85 },
  { level: 8, seconds: 11.8, cost: 2030, scale: 1.95 },
  { level: 9, seconds: 12.4,   cost: 3050, scale: 2.05 },
  { level: 10, seconds: 13, cost: 4580, scale: 2.15 },
];
export const BOOST = {
  thrust: 6,            // m/s² while the BOOST button is held (band Lv1)
  capOverBand: 10,      // boost can't push you faster than band cap + this (band Lv1; tailwinds always + 10)
  thrustPerLevel: 0.5,  // v1.9 BOOSTS SCALE: + 0.5 m/s² per band level above 1 (Lv10 → 10.5)
  capPerLevel: 2,       // v1.9: + 2 m/s of margin per band level above 1 (Lv10 → + 28)
};
// v1.9 the hold-boost at a band level: margin over the cap, and thrust (Space's WARP TANK keeps its own thrust).
export const boostMargin = (bandLv) => BOOST.capOverBand + BOOST.capPerLevel * (Math.max(1, bandLv) - 1);
export const boostThrustAt = (bandLv) => BOOST.thrust + BOOST.thrustPerLevel * (Math.max(1, bandLv) - 1);

// LAUNCH RAMP: taller pad + steeper launch angle (launch speed unchanged).
export const RAMP = [
  { level: 1, height: 0,   angleDeg: 0, cost: 0,   rails: false },
  { level: 2, height: 1.5, angleDeg: 2, cost: 30,  rails: false },
  { level: 3, height: 3,   angleDeg: 4, cost: 80, rails: false },
  { level: 4, height: 4.5, angleDeg: 6, cost: 150, rails: true },
  { level: 5, height: 6,   angleDeg: 8, cost: 300, rails: true },
  // v1.0: keeps rising modestly.
  { level: 6, height: 6.8, angleDeg: 8.5, cost: 450,  rails: true },
  { level: 7, height: 7.6, angleDeg: 9,   cost: 680,  rails: true },
  { level: 8, height: 8.4, angleDeg: 9.5, cost: 1020, rails: true },
  { level: 9, height: 9.2, angleDeg: 10,  cost: 1530, rails: true },
  { level: 10, height: 10, angleDeg: 10.5, cost: 2300, rails: true },
];

// COIN MAGNET: coins within `radius` drift to the plane. Level 0 = none.
// NOTE: 5 radii but only 4 prices in the brief; Lv5 uses 800 (see BALANCE.md).
export const MAGNET = [
  { level: 0, radius: 0,   cost: 0,   scale: 0,    color: 0x000000, tips: 0x000000, glowTips: false, sparkle: false },
  { level: 1, radius: 2.5, cost: 40,  scale: 0.7,  color: 0x9a6b6b, tips: 0xb8b8b8, glowTips: false, sparkle: false }, // small dull grey-red
  { level: 2, radius: 4,   cost: 80, scale: 0.85, color: 0xd63a3a, tips: 0xdddddd, glowTips: false, sparkle: false }, // red
  { level: 3, radius: 5.5, cost: 150, scale: 1.05, color: 0xff2a2a, tips: 0xffffff, glowTips: false, sparkle: false }, // big bright red
  { level: 4, radius: 7,   cost: 300, scale: 1.2,  color: 0xff2a2a, tips: 0xffffff, glowTips: true,  sparkle: false }, // glowing white tips
  { level: 5, radius: 9,   cost: 600, scale: 1.4,  color: 0xffc61a, tips: 0xfff3b0, glowTips: true,  sparkle: true },  // GOLD + sparkles
  // v1.0: radius +15 % per level; the magnet keeps growing and recolours past gold.
  { level: 6, radius: 10.4, cost: 900,  scale: 1.5,  color: 0xe5e4e2, tips: 0xffffff, glowTips: true, sparkle: true },  // platinum
  { level: 7, radius: 11.9, cost: 1350, scale: 1.6,  color: 0x7fe3ff, tips: 0xffffff, glowTips: true, sparkle: true },  // diamond blue
  { level: 8, radius: 13.7, cost: 2030, scale: 1.7,  color: 0x9d7bff, tips: 0xfff3b0, glowTips: true, sparkle: true },  // cosmic violet
  { level: 9, radius: 15.7, cost: 3050, scale: 1.8,  color: 0xff6ad5, tips: 0xffffff, glowTips: true, sparkle: true },  // prism pink
  { level: 10, radius: 18.1, cost: 4580, scale: 1.95, color: 0xffffff, tips: 0xffc61a, glowTips: true, sparkle: true, rainbow: true }, // rainbow
];
export const MAGNET_PULL_SPEED = 22; // m/s (on top of the plane's own speed) a pulled coin flies at

// BOUNCY WHEELS: speed kept per bounce + upward pop. Lv1 = stock.
// NOTE: the brief lists 6 retention numbers for 5 levels; 55% was dropped (see BALANCE.md).
export const WHEELS = [
  { level: 1, keep: 0.45, pop: 3,   cost: 0,   scale: 0.8,  tire: 0x222222, rim: 0x888888, stripe: false }, // small black
  { level: 2, keep: 0.65, pop: 4,   cost: 30,  scale: 0.95, tire: 0x6b4423, rim: 0xc8a070, stripe: false }, // brown
  { level: 3, keep: 0.75, pop: 5,   cost: 80, scale: 1.1,  tire: 0xff7a1a, rim: 0xffffff, stripe: false }, // orange
  { level: 4, keep: 0.85, pop: 6,   cost: 150, scale: 1.25, tire: 0x222222, rim: 0xffffff, stripe: true },  // red-striped
  { level: 5, keep: 0.92, pop: 7.5, cost: 300, scale: 1.5,  tire: 0x222222, rim: 0xffc61a, stripe: true },  // big GOLD-rimmed
  // v1.0: retention climbs to a 97 % cap; the wheels keep growing and recolouring.
  { level: 6, keep: 0.93, pop: 8,   cost: 450,  scale: 1.55, tire: 0x222222, rim: 0xe5e4e2, stripe: true },  // platinum rims
  { level: 7, keep: 0.94, pop: 8.5, cost: 680,  scale: 1.6,  tire: 0x1b2a4a, rim: 0x7fe3ff, stripe: true },  // diamond
  { level: 8, keep: 0.95, pop: 9,   cost: 1020, scale: 1.65, tire: 0x2a1650, rim: 0x9d7bff, stripe: true },  // cosmic
  { level: 9, keep: 0.96, pop: 9.5, cost: 1530, scale: 1.7,  tire: 0x3a1030, rim: 0xff6ad5, stripe: true },  // prism
  { level: 10, keep: 0.97, pop: 10, cost: 2300, scale: 1.75, tire: 0x111111, rim: 0xffffff, stripe: true, rainbow: true }, // rainbow
];

// EJECTOR SEAT: one-time buy. The parachuting pilot glides on.
export const EJECT = { cost: 190 };
export const PILOT = {
  popUp: 6,             // m/s upward kick when the seat fires ("POING!")
  canopySink: 3.2,      // m/s steady sink under the parachute
  flareSinkMul: 0.55,   // full drag-up: sink × this (floats flatter)
  diveSinkMul: 1.9,     // full drag-down: sink × this (dives faster)
  glideSpeed: 8,        // m/s forward the canopy settles to
  forwardDrag: 0.45,    // per second, how fast forward speed settles to glideSpeed
  sideSpeed: 5,
  sinkResponse: 1.5,
  pickupRadius: 2.0,
};

// LANDINGS, judged at the first ground contact (no eject).
// Owner playtest 2026-10-25: PERFECT widened (−2 → −3 m/s, 10° → 14°), GOOD (−3.5 → −4.5, 18° → 22°), and a
// rare SUPER PERFECT above it (+500, the landing's whole bonus — never stacked with PERFECT's +10). The impact
// angle counts terrain slope at LANDING.slopeWeight (half) — physics.js touchGround.
export const LANDING = {
  slopeWeight: 0.5,
  super:   { minSink: -1,   maxAngleDeg: 3,  bonus: 500, text: 'SUPER PERFECT LANDING!' },
  perfect: { minSink: -3,   maxAngleDeg: 14, bonus: 10, text: 'PERFECT LANDING!' },
  good:    { minSink: -4.5, maxAngleDeg: 22, bonus: 5,  text: 'GREAT LANDING!' },
  rough:   { bonus: 0, text: 'Bumpy landing' },
  bad:     { bonus: 0, text: 'Bonk! A wobbly tumble — you’re OK!' },
  // EJECT JACKPOT: the pilot's own touchdown graded on the same ladder (pilot.js pilotGrade).
  pilot:   { bonus: 5, text: 'PILOT LANDED SAFELY!' },
  pilotPerfect: { bonus: 100, text: 'PERFECT EJECTION!' },
  pilotSuper:   { bonus: 500, text: 'SUPER PERFECT LANDING!' },
  pilotRough:   { bonus: 0, text: 'Pilot landed — a bumpy one!' },
};

// PAINT JOBS (cosmetic). The first is the free default.
export const PAINTS = [
  { id: 'default', name: 'Bubblegum',       cost: 0,   color: 0xff4fa3 },
  { id: 'sky',     name: 'Sky Blue',        cost: 80, color: 0x45b6ff },
  { id: 'red',     name: 'Racing Red',      cost: 80, color: 0xe8262c },
  { id: 'yellow',  name: 'Sunshine Yellow', cost: 80, color: 0xffd400 },
  { id: 'grape',   name: 'Grape Purple',    cost: 110, color: 0x8a3fd1 },
  { id: 'rainbow', name: 'RAINBOW',         cost: 230, color: 0xff4040, rainbow: true },
  // Space-only STAR SKIN: belongs to the Starship record only (not in the shared totals).
  { id: 'nebula',  name: 'Nebula',          cost: 230, color: 0x7a3fd1, nebula: true, only: 'space' },
  // v1.2 the Void Runner's NEON set (its record only, not in the shared totals): TRON = black + cyan trim.
  { id: 'tron',    name: 'TRON',            cost: 230, color: 0x05050a, tron: true, only: 'neonvoid' },
  { id: 'laser',   name: 'Laser Pink',      cost: 110, color: 0xff2bd6, only: 'neonvoid' },
  { id: 'lime',    name: 'Electric Lime',   cost: 110, color: 0x7dff2b, only: 'neonvoid' },
  // v1.5 the Sky Knight's HERALDRY (its record only, not in the shared totals): DRAGON WINGS at the rainbow tier.
  { id: 'dragonwings', name: 'DRAGON WINGS',   cost: 230, color: 0x9a1a1a, dragonwings: true, only: 'dragonwar' },
  { id: 'knightsteel', name: 'Knight Steel',   cost: 110, color: 0x9aa4b2, only: 'dragonwar' },
  { id: 'royalbanner', name: 'Royal Banner',   cost: 110, color: 0x1f3fa8, only: 'dragonwar' },
  // v1.6 the Starhound's SQUADRON COLOURS (its record only, not in the shared totals): STARFIRE at the rainbow tier.
  { id: 'starfire', name: 'STARFIRE',        cost: 230, color: 0x2f6fe8, starfire: true, only: 'starfox' },
  { id: 'foxwhite', name: 'Fox White',       cost: 110, color: 0xf2f4f7, only: 'starfox' },
  { id: 'wolfpurple', name: 'Wolf Purple',   cost: 110, color: 0x5a3a9a, only: 'starfox' },
  // v1.7 the Star Kestrel's SQUADRON MARKINGS (its record only, not in the shared totals): HYPERDRIVE at the rainbow tier.
  { id: 'hyperdrive', name: 'HYPERDRIVE',    cost: 230, color: 0x9fd8ff, hyperdrive: true, only: 'starwars' },
  { id: 'redleader', name: 'Red Leader',     cost: 110, color: 0xd8402a, only: 'starwars' },
  { id: 'goldleader', name: 'Gold Leader',   cost: 110, color: 0xffc61a, only: 'starwars' },
  // v1.4 THE DRAGON's skin, free with it (its record only): the Dragonite model in place of the Dragon.
  { id: 'dragonite', name: 'Dragonite',      cost: 0,   color: 0xf5a142, skin: 'dragonite', only: 'dragon' },
];

// PLANE PARTS — one-time buys, in this order. Start = body + propeller only.
export const PARTS = [
  { id: 'leftWing',  name: 'LEFT WING',  cost: 30,  blurb: 'A wing lifts you up — but one wing pulls you left!' },
  { id: 'rightWing', name: 'RIGHT WING', cost: 90, blurb: 'Two wings balance you and lift you even more.' },
  { id: 'tail',      name: 'TAIL',       cost: 190, blurb: 'The tail keeps you steady and quick.' },
];

// What the parts do to the flight. No parts = exactly the v0 flight.
export const PART_PHYSICS = {
  // sinkMul scales the extra stall sink; climbCostMul scales the speed lost to climbing.
  // lift (v0.6): 0 = no wings, can't climb; 0.6 = one wing, gentle climbs; 1 = both wings.
  noWings:   { sinkMul: 1.0,  climbCostMul: 1.0, lift: 0 },
  leftWing:  { sinkMul: 0.85, climbCostMul: 0.85, driftSpeed: -1.8, rollDeg: 6, lift: 0.6 }, // gentle pull + roll to the LEFT
  bothWings: { sinkMul: 0.75, climbCostMul: 0.75, lift: 1 },
  tail:      { stallSpeed: 9, stallSinkMul: 0.7, responseMul: 1.15 },
  noTailWobbleDeg: 2, // visual sway (roll + pitch) without a tail; the tail removes it
};

// Coins.
export const COINS = {
  perCoin: 1,
  metersPerBonusCoin: 25, // +1 bonus coin for every 25 m flown
  pickupRadius: 2.4,      // m, generous for small fingers
};

// World streaming.
export const WORLD = {
  chunkLength: 80,
  chunkCount: 7,
  chunkHalfWidth: 150,
  treesPerChunk: 14,
  rocksPerChunk: 4,
  cloudsPerChunk: 2,
  coinSlots: 360,        // coins drawn at once (patterns + cave trails + secret stashes)
  flagEvery: 500,
  flagX: 30,             // flag poles stand this far either side of the middle
  fogNear: 90,
  fogFar: 400,
};

export const RENDER = {
  maxPixelRatio: 1.25,
  antialias: true,
};

export const SAVE_KEY = 'slingshot-plane-save-v1';
