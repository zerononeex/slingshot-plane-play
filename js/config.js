// All tunable numbers live here. docs/BALANCE.md explains them in plain words —
// keep the two in sync when you change something.

// How the plane looks. Change these to repaint / reshape the code-built plane.
export const PLANE_TUNE = {
  bodyColor: 0xff4fa3,   // bubblegum pink body
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
  lateralSpeed: 13,     // m/s sideways at full stick
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
  bounceKeep: 0.65,     // fraction of speed kept per bounce
  bounceUpDeg: 16,
  groundFriction: 5,    // m/s² slow-down while rolling
  stopSpeed: 0.4,
  tumbleFriction: 9,
  tumbleTime: 1.6,      // s of tumbling before results
};

// ENGINE upgrade. Index 0 = level 1. `cost` = coins to BUY that level.
export const ENGINE = [
  { level: 1, launchMax: 30, decay: 0.90, cost: 0 },
  { level: 2, launchMax: 34, decay: 0.78, cost: 40 },
  { level: 3, launchMax: 38, decay: 0.66, cost: 100 },
  { level: 4, launchMax: 43, decay: 0.54, cost: 200 },
  { level: 5, launchMax: 48, decay: 0.42, cost: 400 },
];

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
  coinsPerChunk: 10,
  flagEvery: 500,
  flagX: 30,             // flag poles stand this far either side of the middle
  hillHeight: 7,
  fogNear: 90,
  fogFar: 400,
};

export const RENDER = {
  maxPixelRatio: 1.25,
  antialias: true,
};

export const SAVE_KEY = 'slingshot-plane-save-v1';
