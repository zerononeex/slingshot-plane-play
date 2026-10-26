// v1.4 REWARD FLYERS (the owner's list, approved 2026-10-24): ten ★-reward flyers — nine famous video-game
// aircraft (family-only lookalikes, the owner's call) + THE DRAGON — and the Dragonite skin (a paint on the
// Dragon's record). Pure data (no DOM / three.js). stages.js turns each into an extra plane (CHANGE PLANE,
// its own upgrade record); save.js derives the unlocks from the ★s. Models: flyermodels.js.

// caps = the rubber-band caps Lv1–10 (m/s). v2.2 FLYER LADDER (owner 2026-10-25): every flyer sits above every
// world plane — Lv10 Glider 285 · Tornado 288 · Blue Falcon 292 · Vic Viper 295 · Raptor 298 · XFA-27 300 ·
// X-Wing 304 · Raven 308 · Arwing 312 · THE DRAGON 320 — and Lv1–9 scale by the same factor (the old shape).
// stars = the worlds whose ★ (every goal gate + the Golden Goal) earns it ('all' = every world; v2.2: THE DRAGON
// is earned by ★ Dragon War). flight.ability = its v2.2 ability id(s) (abilities.js).
// flight = its feel (physics plane fields + the engine sound). decayMul is its unlock world's plane's (THE DRAGON:
// × 0.9, the lowest of any plane, with the best glide and the top steer). On the v2.2 ladder FULL maxed in its home
// world flies × 1.15 – 1.48 the world plane (the Arwing and THE DRAGON ride past the 600 s sim cap; BALANCE.md).
// flap = a flapping flyer's wing rig: { span (m, shoulder to tip), amp (rad at full effort), rate (Hz at rest) }.
export const FLYERS = [
  { id: 'glider', name: 'Plane Glider', from: 'Mario Kart 8', unlock: '★ Plains', caps: [141, 164, 189, 216, 245, 254, 260, 268, 277, 285], stars: ['plains'],
    flight: { ability: 'magnet', stallSpeed: 10, decayMul: 1, glideMul: 1.1, balloonMul: 0.6, engineSound: 'prop' },
    character: 'Red-and-white plane glider over a little go-kart: propeller, striped wing, tail',
    colors: { body: 0xe8262c, trim: 0xffffff, dark: 0x22252c } },
  { id: 'tornado', name: 'The Tornado', from: 'Sonic the Hedgehog', unlock: '★ Canyon', caps: [142, 166, 191, 219, 249, 256, 264, 272, 280, 288], stars: ['canyon'],
    flight: { ability: 'charge', stallSpeed: 8, decayMul: 1, glideMul: 1.1, balloonMul: 0.6, engineSound: 'prop', deepPutter: true },
    character: 'Red biplane: two wings, struts, big propeller, two open seats (a blue hedgehog + an orange fox)',
    colors: { body: 0xd8202a, trim: 0xffffff, dark: 0x2a2d36 } },
  { id: 'bluefalcon', name: 'Blue Falcon', from: 'F-Zero', unlock: '★ City', caps: [144, 168, 194, 221, 252, 260, 268, 276, 284, 292], stars: ['city'],
    flight: { ability: 'double', stallSpeed: 13, decayMul: 1.3, glideMul: 0.74, engineSound: 'turbine' },
    character: 'Anti-gravity racer: wide blue wedge hull, yellow stripes, twin boosters, hover glow',
    colors: { body: 0x2160d8, trim: 0xffd23f, dark: 0x14306e } },
  { id: 'vicviper', name: 'Vic Viper', from: 'Gradius', unlock: '★ Snow', caps: [148, 171, 197, 225, 255, 262, 270, 278, 287, 295], stars: ['snow'],
    flight: { ability: 'tank', stallSpeed: 14, decayMul: 1.6, glideMul: 0.43, engineSound: 'turbine' },
    character: 'Needle-nose starfighter: forward wing prongs, blue + red panels, two glowing Option orbs',
    colors: { body: 0xf1f3f6, trim: 0x2f6fe8, dark: 0xe8262c } },
  { id: 'raptor', name: 'F-22A Raptor', from: 'Ace Combat 7', unlock: '★ Desert', caps: [148, 172, 198, 227, 257, 265, 272, 281, 289, 298], stars: ['desert'],
    flight: { ability: 'shield', stallSpeed: 14, decayMul: 1.8, glideMul: 0.26, engineSound: 'turbine' },
    character: 'Stealth fighter: diamond wings, twin canted tails, gold canopy, square nozzles',
    colors: { body: 0x8b939d, trim: 0xd9a63a, dark: 0x4a5160 } },
  { id: 'xfa27', name: 'XFA-27', from: 'Ace Combat', unlock: '★ Ocean', caps: [149, 172, 199, 227, 258, 266, 275, 282, 291, 300], stars: ['ocean'],
    flight: { ability: 'sealuck', stallSpeed: 14, decayMul: 2.2, glideMul: 0.14, engineSound: 'turbine' },
    character: 'Carrier fighter: forward-swept wings, canards, twin tails, multi-lock missile pods',
    colors: { body: 0xeef0f3, trim: 0xd8202a, dark: 0x3b4252 } },
  { id: 'xwing', name: 'X-Wing', from: 'Star Wars', unlock: '★ Space', caps: [151, 176, 202, 231, 262, 269, 278, 287, 295, 304], stars: ['space'],
    flight: { ability: 'moonglide', stallSpeed: 13, decayMul: 2.4, glideMul: 0.094, engineSound: 'hum' },
    character: 'S-foils in attack position: four wings in an X, four engines, wingtip cannons, droid dome',
    colors: { body: 0xe6e3dc, trim: 0xd8402a, dark: 0x4a5160 } },
  { id: 'raven', name: 'ADF-11F Raven', from: 'Ace Combat 7', unlock: '★ Jetstream', caps: [154, 179, 206, 235, 266, 274, 283, 291, 300, 308], stars: ['jetstream'],
    flight: { ability: 'tailwind', stallSpeed: 15, decayMul: 2.6, glideMul: 0.035, engineSound: 'turbine' },
    character: 'Radical swept-wing fighter: dark crescent wings, red sensor eye, long afterburner',
    colors: { body: 0x3a3f4a, trim: 0xff3030, dark: 0x1e2128 } },
  { id: 'arwing', name: 'Arwing', from: 'Star Fox', unlock: '★ Volcano + ★ Jungle + ★ Sky Islands', caps: [155, 179, 207, 236, 270, 278, 286, 295, 303, 312], stars: ['volcano', 'jungle', 'skyislands'],
    flight: { ability: 'guard', stallSpeed: 12, decayMul: 2.6, glideMul: 0.0045, engineSound: 'hum' },
    character: 'All-range fighter: white wedge body, drooped wings, blue tip blades, twin blue engines',
    colors: { body: 0xf2f4f7, trim: 0x2f6fe8, dark: 0x4a5160 } },
  { id: 'dragon', name: 'THE DRAGON', unlock: '★ DRAGON WAR', caps: [158, 184, 213, 243, 276, 284, 293, 302, 311, 320], stars: ['dragonwar'],
    flight: { ability: ['fire', 'guard'], stallSpeed: 9, decayMul: 0.9, glideMul: 0.003, steerMul: 1.2, balloonMul: 0.7, engineSound: 'hum', trail: 'ember' },
    character: 'Flapping dragon: big hinged wings, horns, belly plates, spiked tail, claw feet',
    colors: { body: 0xb3202a, trim: 0xffc61a, dark: 0x5a1015, membrane: 0x7a1820, horn: 0xf4ead2 }, flap: { span: 3.6, amp: 0.7, rate: 0.9 } },
];
// The Dragonite skin: THE DRAGON rebuilt in Dragonite's colours (orange, a cream belly, sea-green wing
// membranes) with antennae instead of horns and no spikes. Same stats as the Dragon.
export const DRAGONITE = { id: 'dragonite', name: 'Dragonite (skin)', from: 'Pokémon', skinOf: 'dragon', unlock: 'comes with THE DRAGON',
  colors: { body: 0xf5a142, trim: 0xf6e3a8, dark: 0xd07a22, membrane: 0x3fa99a, horn: 0xf5a142 } };

export const flyerById = (id) => FLYERS.find((f) => f.id === id) ?? (id === DRAGONITE.id ? { ...FLYERS.find((f) => f.id === 'dragon'), ...DRAGONITE } : null);

// Flap effort (pure): 0 = gliding flat, 1 = working hard. Hard when slow or climbing, easing off as the
// flyer gets fast and level. speed in m/s, climb = vertical speed in m/s.
export function flapEffort(speed, climb) {
  const slow = Math.max(0, Math.min(1, (40 - speed) / 30));
  const up = Math.max(0, Math.min(1, climb / 8));
  return Math.max(0.15, Math.min(1, 0.25 + 0.6 * slow + 0.6 * up));
}
