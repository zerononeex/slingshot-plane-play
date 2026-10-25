// v1.7 STAR WARS's geometry (megaview.js draws it, instanced): the weave posts of its seven arcs and the
// arcs' dressing kits (§0 detail: outside the corridor, looks only), with how each one floats, moves and
// what it carries (blinking shield and tower lights, sweeping dishes). Built at real size. The kits also
// borrow Star Fox's asteroids, beacons, debris, capital hulls, dunes, dust devils, searchlights and turret
// towers (sfdecor.js) and Dragon War's smoke columns (megaview.js).
import * as THREE from 'three';
import { merged, cyl, cone, box, ico } from './meshkit.js';

const H = 90; // posts reach above the 60 m ceiling (megarun.js POST_TOP)
const sph = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);
const dome = (r, w = 12) => new THREE.SphereGeometry(r, w, 6, 0, Math.PI * 2, 0, Math.PI / 2);
const tor = (R, r, rs = 6, ts = 18, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, rs, ts, arc);
const GREY = 0x9aa0a8, DARK = 0x4a4e56, CREAM = 0xe6e3dc;

// The radius each post geometry is built at (megarun.js POST_R: the collider).
export const SW_POST_R0 = { rockSpire: 2.2, iceSpire: 1.9, cloudTower: 2.4, redwood: 2.6, greebleTower: 2.3 };

export function swPostGeo(kind) {
  switch (kind) {
    case 'rockSpire': return merged([[cyl(1.8, 2.6, H, 7), 0xb0845a, [0, H / 2, 0]], ...Array.from({ length: 8 }, (_, i) => [cyl(2.7 - (i % 2) * 0.3, 2.9 - (i % 2) * 0.3, 4, 7), [0xc89a60, 0x9a7048][i % 2], [0, 8 + i * 10, 0]]),
      [cone(2.4, 8, 7), 0xd8b070, [0, H + 4, 0]], [box(1.4, 6, 1.4), 0x8a6040, [2.2, 30, 0.6], [0, 0, 0.3]]]);
    case 'iceSpire': return merged([[cone(2.6, H + 8, 6), 0xd8f0ff, [0, (H + 8) / 2, 0]], [cone(1.6, 30, 5), 0xbfe0ff, [1.8, 15, 0.8]], ...[20, 42, 64].map((y, i) => [cone(1, 8, 5), 0xf4faff, [-(1.7 - i * 0.3), y, 0.4], [0, 0, 0.5]])]);
    case 'cloudTower': return merged([[cyl(2, 2.6, H, 10), 0xf4ece4, [0, H / 2, 0]], ...[18, 44, 70].map((y) => [cyl(4.4, 4.4, 1.2, 12), 0xe8d0b0, [0, y, 0]]), ...[18, 44, 70].map((y) => [tor(4.4, 0.25, 4, 16), 0xffd27a, [0, y + 0.7, 0], [Math.PI / 2, 0, 0]]),
      [sph(3, 10, 6), 0xffd8b0, [0, H, 0]]]);
    case 'redwood': return merged([[cyl(2.2, 3.2, H, 10), 0x6a2a10, [0, H / 2, 0]], ...[0, 1, 2].map((i) => [box(0.5, H - 10, 0.5), 0x4a1a08, [Math.cos(i * 2.1) * 2.6, (H - 10) / 2, Math.sin(i * 2.1) * 2.6]]),
      [ico(10, 1), 0x2a5a2a, [0, H + 2, 0], [0, 0, 0], [1, 0.5, 1]], [ico(6, 0), 0x3a7a30, [6, H - 6, 3]], [box(10, 0.8, 0.8), 0x6a2a10, [4, 60, 0], [0, 0.6, 0.2]]]);
    case 'greebleTower': return merged([[box(4.4, H, 4.4), GREY, [0, H / 2, 0]], ...Array.from({ length: 9 }, (_, i) => [box(4.8, 1, 4.8), DARK, [0, 6 + i * 10, 0]]), ...[14, 38, 62].map((y) => [box(0.2, 2, 3.6), 0xc8e0ff, [2.3, y, 0]]),
      [cyl(0.4, 0.4, 10, 6), DARK, [1.2, H + 5, 1.2]], [sph(0.7, 8, 6), 0xff3a3a, [1.2, H + 10.2, 1.2]]]);
    default: return null;
  }
}

// The arcs' dressing (scale ~1 = real metres).
export function swDecorGeo(kind) {
  switch (kind) {
    // ── the Desert World ──
    case 'vaporator': return merged([[cyl(0.5, 0.8, 9, 8), GREY, [0, 4.5, 0]], ...[2.4, 5.2, 8].map((y) => [cyl(1.4, 1.4, 0.35, 10), DARK, [0, y, 0]]), [box(0.3, 2.2, 0.3), GREY, [0, 10, 0]], [box(3, 0.3, 3), 0xb0845a, [0, 0.15, 0]]]);
    case 'domeHut': return merged([[dome(5), CREAM, [0, 0, 0]], [cyl(5.2, 5.2, 0.8, 12), 0xc8a070, [0, 0.4, 0]], [box(2.4, 2.4, 1.2), 0x3a2a1a, [0, 1.2, 4.6]], [dome(2.4), 0xd8d0c0, [6.4, 0, 2]], [box(0.4, 4, 0.4), GREY, [-3, 6, 0]]]);
    case 'sandSkiff': return merged([[box(3.6, 1, 11), 0xb0a080, [0, 0, 0]], [box(3.8, 0.4, 2), 0x8a7a5a, [0, 0.6, 4.6]], [box(0.3, 3, 0.3), DARK, [0, 2, -4.4]], [box(4, 0.2, 2.4), 0xc8b090, [0, 3.4, -4.4]], [box(3.2, 0.2, 10), 0x4a4038, [0, -0.6, 0]]]);
    case 'rockArch': return merged([[box(5, 26, 6), 0xb0845a, [-11, 13, 0]], [box(5, 22, 6), 0xa07850, [11, 11, 0]], [box(28, 6, 6.4), 0xb0845a, [0, 26, 0], [0, 0, 0.08]], [ico(3, 0), 0xc89a60, [-14, 1.5, 4]]]);
    case 'bantha': return merged([[sph(2.2, 10, 8), 0x6a4a30, [0, 3.2, 0], [0, 0, 0], [1, 0.9, 1.6]], [sph(1.2, 8, 6), 0x5a3a22, [0, 3.6, 3.4]], ...[-1, 1].map((sx) => [tor(0.8, 0.25, 4, 10, Math.PI * 1.5), 0xd8c8a8, [sx * 1.1, 4.2, 3.6], [0, Math.PI / 2, 0]]),
      ...[[-1, -2], [1, -2], [-1, 2], [1, 2]].map(([x, z]) => [cyl(0.4, 0.5, 2.2, 6), 0x5a3a22, [x, 1.1, z]])]);
    // ── the Orbital Battle / the Great Fleet ──
    case 'capitalWedge': return merged([[cone(12, 64, 3), GREY, [0, 0, 0], [Math.PI / 2, Math.PI, 0]], [box(10, 4, 12), 0xb0b6be, [0, 5, 18]], [box(4, 6, 4), GREY, [0, 10, 21]], ...[-4, 0, 4].map((x) => [cyl(1.6, 1.6, 0.8, 10), 0x5fd8ff, [x, 0, 32.2], [Math.PI / 2, 0, 0]])]);
    case 'escortFrigate': return merged([[box(4, 4, 30), CREAM, [0, 0, 0]], [box(7, 9, 7), CREAM, [0, 0, -14]], [box(16, 1, 3), 0xd8402a, [0, 0, 5]], [cyl(1.4, 1.4, 0.6, 10), 0x5fd8ff, [0, 0, 15.3], [Math.PI / 2, 0, 0]]]);
    case 'stationPylon': return merged([[cyl(1.2, 1.2, 26, 8), GREY, [0, 0, 0]], [sph(3, 10, 8), 0xb0b6be, [0, 13, 0]], [sph(3, 10, 8), 0xb0b6be, [0, -13, 0]], [box(12, 0.4, 3), 0x2a3a5a, [0, 0, 0]]]);
    case 'roundCruiser': return merged([[sph(7, 12, 8), 0xb0a8a0, [0, 0, 0], [0, 0, 0], [1, 0.6, 2.6]], ...[-8, 0, 8].map((z) => [dome(2), 0x9a9088, [0, 3.6, z]]), ...[-1, 1].map((sx) => [cyl(1.6, 1.6, 0.6, 10), 0x5fd8ff, [sx * 3, 0, 18.4], [Math.PI / 2, 0, 0]])]);
    // ── the Ice World ──
    case 'snowDrift': return merged([[dome(9), 0xf4f8ff, [0, 0, 0], [0, 0, 0], [1.6, 0.3, 0.9]], [dome(5), 0xe8f0fa, [8, 0, 3], [0, 0, 0], [1.2, 0.4, 0.8]]]);
    case 'iceSpike': return merged([[cone(2.4, 14, 5), 0xd8f0ff, [0, 7, 0]], [cone(1.4, 9, 5), 0xbfe0ff, [2.6, 4.5, 1], [0, 0, -0.3]], [cone(1.2, 7, 5), 0xf4faff, [-2.2, 3.5, -1], [0, 0, 0.35]]]);
    case 'walkerSmall': return merged([[box(4, 3, 7), GREY, [0, 11, 0]], [box(2, 2, 2.6), GREY, [0, 10.6, 4.6]], ...[[-1.6, -2.6], [1.6, -2.6], [-1.6, 2.6], [1.6, 2.6]].map(([x, z]) => [box(0.7, 9.5, 0.7), DARK, [x, 4.75, z]])]);
    case 'shieldPylon': return merged([[cyl(1, 1.6, 14, 8), GREY, [0, 7, 0]], [box(3, 1, 3), DARK, [0, 0.5, 0]], [tor(1.8, 0.3, 4, 12), DARK, [0, 12, 0], [Math.PI / 2, 0, 0]]]);
    case 'snowTrench': return merged([[box(24, 2.4, 2), 0xd8e4f0, [0, 1.2, 0]], [box(24, 0.6, 3), 0x8a9ab0, [0, 2.6, -0.5]], ...[-8, 0, 8].map((x) => [cyl(0.5, 0.5, 2, 6), DARK, [x, 3.2, 0.6], [Math.PI / 2 - 0.3, 0, 0]])]);
    case 'sensorDish': return merged([[box(1, 8, 1), GREY, [0, 4, 0]], [box(5, 1, 5), DARK, [0, 0.5, 0]]]);
    // ── the Cloud World ──
    case 'cloudBank': return merged([[ico(9, 1), 0xffe8d8, [0, 0, 0], [0, 0, 0], [1.8, 0.5, 1.2]], [ico(6, 1), 0xfff0e4, [10, 2, 3], [0, 0, 0], [1.4, 0.6, 1]], [ico(5, 1), 0xffd8c8, [-9, 1, -2], [0, 0, 0], [1.4, 0.5, 1]]]);
    case 'cloudPlatform': return merged([[cyl(10, 4, 4, 12), 0xe8e0d8, [0, 0, 0]], [cyl(10.2, 10.2, 0.6, 12), 0xd0c0b0, [0, 2.2, 0]], [cyl(1, 1, 16, 6), 0xc8b8a8, [0, -10, 0]], [tor(10, 0.25, 4, 20), 0xffd27a, [0, 2.6, 0], [Math.PI / 2, 0, 0]]]);
    case 'floatTower': return merged([[cyl(3, 1.4, 30, 10), 0xf4ece4, [0, 15, 0]], [sph(4, 10, 8), 0xffd8b0, [0, 32, 0]], [cyl(5, 5, 1, 12), 0xe8d0b0, [0, 24, 0]], [cone(3, 8, 8), 0xe8d0b0, [0, -4, 0], [Math.PI, 0, 0]]]);
    case 'cloudCar': return merged([...[-1, 1].map((sx) => [sph(1.4, 10, 8), 0xe8a040, [sx * 1.8, 0, 0], [0, 0, 0], [1, 1, 1.8]]), [box(3.6, 0.6, 1), 0x8a5a30, [0, 0, 0]], [box(0.2, 0.2, 0.2), 0xff3a3a, [0, 0.4, 2.2]]]);
    case 'beaconTower': return merged([[cyl(0.8, 1.2, 22, 8), 0xf4ece4, [0, 11, 0]], [cyl(2.4, 2.4, 0.8, 10), 0xe8d0b0, [0, 20, 0]]]);
    // ── the Forest Moon ──
    case 'fern': return merged(Array.from({ length: 6 }, (_, i) => [box(0.4, 0.15, 5), [0x2a6a2a, 0x3a8a3a][i % 2], [Math.sin(i * 1.05) * 2.2, 1 + (i % 2) * 0.3, Math.cos(i * 1.05) * 2.2], [0.5, i * 1.05, 0]]));
    case 'treeHut': return merged([[cyl(2, 3, 34, 9), 0x6a3a1a, [0, 17, 0]], [cyl(6, 6, 0.8, 12), 0x8a5a30, [0, 18, 0]], [cone(5, 4, 10), 0x6a4a2a, [0, 22, 0]], [ico(9, 1), 0x2a6a2a, [0, 38, 0], [0, 0, 0], [1, 0.6, 1]], [box(0.3, 14, 0.3), 0x8a5a30, [5, 11, 0]]]);
    case 'speederBike': return merged([[box(0.8, 0.6, 4), DARK, [0, 0, 0]], [box(1.6, 0.3, 0.4), DARK, [0, 0.1, 2.6]], [box(0.6, 0.8, 1.2), 0x6a6a5a, [0, 0.6, -0.6]], [box(0.5, 0.5, 0.2), 0xff6a3a, [0, 0, -2.1]]]);
    case 'logPile': return merged([...[0, 1, 2].map((i) => [cyl(0.8, 0.8, 8, 8), 0x6a3a1a, [(i - 1) * 1.6, 0.8, 0], [Math.PI / 2, 0, 0]]), [cyl(0.8, 0.8, 8, 8), 0x7a4a2a, [0, 2.2, 0], [Math.PI / 2, 0, 0]]]);
    case 'scoutWalkerSmall': return merged([[box(2.4, 2.2, 2.4), GREY, [0, 7.4, 0]], [box(1.6, 1, 1), DARK, [0, 7.2, 1.6]], ...[-1, 1].map((sx) => [box(0.5, 6.4, 0.5), DARK, [sx * 0.9, 3.2, 0]]), ...[-1, 1].map((sx) => [box(1.2, 0.3, 1.8), DARK, [sx * 0.9, 0.15, 0.2]])]);
    case 'glowShroom': return merged([[cyl(0.3, 0.4, 2.4, 6), 0xd8d0c0, [0, 1.2, 0]], [dome(1.4), 0x8ad0ff, [0, 2.3, 0]], [cyl(0.2, 0.3, 1.6, 6), 0xd8d0c0, [1.4, 0.8, 0.6]], [dome(0.9), 0xb08aff, [1.4, 1.5, 0.6]]]);
    // ── the Great Station ──
    case 'greebleBlock': return merged([[box(14, 6, 14), GREY, [0, 3, 0]], [box(6, 10, 6), DARK, [-3, 8, -3]], [box(4, 4, 8), GREY, [4, 8, 2]], [box(14.2, 0.4, 0.4), 0xc8e0ff, [0, 5, 7]], [cyl(1, 1, 6, 8), DARK, [5, 9, -5]]]);
    case 'dishTower': return merged([[box(3, 16, 3), GREY, [0, 8, 0]], [box(6, 2, 6), DARK, [0, 1, 0]]]);
    case 'exhaustVent': return merged([[box(10, 1.6, 10), DARK, [0, 0.8, 0]], [box(7, 0.4, 7), 0xff8a3a, [0, 1.7, 0]], ...[-2, 0, 2].map((x) => [box(0.4, 0.6, 7.4), GREY, [x, 1.9, 0]])]);
    default: return null;
  }
}

// How the dressing sits and moves (as sfdecor.js): lift [min, max], far, anim ('drift' ships and skiffs
// sail along the run, 'crawl' walkers and banthas plod, 'sway' ferns and cloud banks breathe).
export const SW_DECOR_INFO = {
  sandSkiff: { lift: [3, 9], anim: 'drift' }, bantha: { anim: 'crawl' }, rockArch: { far: true }, domeHut: {}, vaporator: {},
  capitalWedge: { lift: [20, 60], far: true, anim: 'drift' }, escortFrigate: { lift: [15, 55], anim: 'drift' }, stationPylon: { lift: [14, 44], far: true },
  roundCruiser: { lift: [20, 60], far: true, anim: 'drift' },
  walkerSmall: { far: true, anim: 'crawl' }, snowDrift: { far: true }, shieldPylon: {}, sensorDish: {},
  cloudBank: { lift: [0, 18], anim: 'sway' }, cloudPlatform: { lift: [16, 40], far: true }, floatTower: { lift: [8, 30], far: true }, cloudCar: { lift: [20, 50], anim: 'drift' }, beaconTower: {},
  fern: { anim: 'sway' }, treeHut: { far: true }, speederBike: { lift: [1, 3], anim: 'drift' }, scoutWalkerSmall: { anim: 'crawl' },
  greebleBlock: { far: true }, dishTower: {}, exhaustVent: {},
};
// What some dressing carries, drawn as its own instanced kind (as sfdecor.js): blinking shield and
// tower lights, sweeping sensor dishes and station dishes. at = offset from the item (x, y, z).
const dishGeo = (r, y) => () => merged([[new THREE.SphereGeometry(r, 12, 6, 0, Math.PI * 2, 0, Math.PI / 3.4), 0xdfe6ee, [0, 0, 0], [-Math.PI / 2 + 0.5, 0, 0]], [box(0.3, 0.3, r * 0.8), DARK, [0, 0, r * 0.4], [0.5, 0, 0]], [sph(0.3, 6, 4), 0xff3a3a, [0, y, r * 0.75]]]);
export const SW_ATTACH = {
  shieldPylon: { geo: () => sph(1.2, 8, 6), at: [0, 14.6, 0], anim: 'blink', glow: 0x5fd8ff },
  beaconTower: { geo: () => sph(1, 8, 6), at: [0, 23, 0], anim: 'blink', glow: 0xff3a3a },
  sensorDish: { geo: dishGeo(4, 0.6), at: [0, 9, 0], anim: 'sweep' },
  dishTower: { geo: dishGeo(6, 0.8), at: [0, 17, 0], anim: 'sweep' },
};
