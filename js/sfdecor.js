// v1.6 STAR FOX's geometry (megaview.js draws it, instanced): the weave posts of its seven arcs and the
// arcs' dressing kits (§0 detail: outside the corridor, looks only), with how each one floats, moves and
// what it carries (windmill blades, nav-light beacons, searchlight beams). Built at real size.
import * as THREE from 'three';
import { merged, cyl, cone, box, ico } from './meshkit.js';

const H = 90; // posts reach above the 60 m ceiling (megarun.js POST_TOP)
const dode = (r) => new THREE.DodecahedronGeometry(r, 0);
const sph = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);
const tor = (R, r, rs = 6, ts = 18, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, rs, ts, arc);

// The radius each post geometry is built at (megarun.js POST_R: the collider).
export const SF_POST_R0 = { asteroid: 2.4, coral: 1.8, hullMast: 2.2, obelisk: 2.0, plasma: 1.7, redSpire: 2.4 };

export function sfPostGeo(kind) {
  switch (kind) {
    case 'asteroid': return merged(Array.from({ length: 12 }, (_, i) => [dode(2.6 + (i % 3) * 0.5), [0x6a6670, 0x585460, 0x7a7480][i % 3], [Math.sin(i * 2.3) * 0.4, 4 + i * 7.6, Math.cos(i * 1.7) * 0.4], [i, i * 0.7, 0]]));
    case 'coral': return merged([[cyl(1.4, 1.9, H, 9), 0xff7a9a, [0, H / 2, 0]], ...Array.from({ length: 9 }, (_, i) => [tor(1.95, 0.35, 5, 12), [0xffb0c8, 0xff9a3c, 0xd85aa8][i % 3], [0, 6 + i * 9, 0], [Math.PI / 2, 0, 0]]),
      ...Array.from({ length: 6 }, (_, i) => [cyl(0.4, 0.6, 7, 6), [0xff9a3c, 0xb04ad1][i % 2], [Math.cos(i * 2.1) * 2.6, 12 + i * 12, Math.sin(i * 2.1) * 2.6], [0, 0, Math.cos(i * 2.1) * 0.6]])]);
    case 'hullMast': return merged([[cyl(1.8, 2.3, H, 8), 0x8a92a0, [0, H / 2, 0]], ...[16, 38, 60, 82].map((y) => [cyl(2.6, 2.6, 1.6, 8), 0x5a606c, [0, y, 0]]),
      [new THREE.CylinderGeometry(3.2, 0.4, 1.4, 12, 1, true), 0xdfe6ee, [0, 70, 2.2], [0.9, 0, 0]], ...[24, 48, 74].map((y) => [box(0.6, 0.6, 0.6), 0xff3a3a, [0, y, 2.4]])]);
    case 'obelisk': return merged([[cyl(1.3, 2.4, H - 6, 4), 0xd8b070, [0, (H - 6) / 2, 0], [0, Math.PI / 4, 0]], [cone(1.6, 6, 4), 0xffc61a, [0, H - 3, 0], [0, Math.PI / 4, 0]],
      ...[14, 28, 42].map((y) => [box(3.6, 1, 3.6), 0xa07a40, [0, y, 0], [0, Math.PI / 4, 0]])]);
    case 'plasma': return merged([[cyl(1.2, 1.6, H, 10), 0xffa21f, [0, H / 2, 0]], ...Array.from({ length: 10 }, (_, i) => [tor(1.8, 0.3, 5, 14), i % 2 ? 0xfff2a0 : 0xff6a1a, [0, 4 + i * 9, 0], [Math.PI / 2, 0, 0]]), [sph(2.2), 0xfffbe0, [0, H, 0]]]);
    case 'redSpire': return merged([[cone(4, H + 6, 6), 0x7a3a30, [0, (H + 6) / 2, 0]], ...[10, 26, 42, 58].map((y, i) => [cyl(3.6 - i * 0.7, 3.8 - i * 0.7, 3, 6), i % 2 ? 0xa04a3a : 0x5a2420, [0, y, 0]]), [cone(2, 16, 5), 0x6a2a24, [2.4, 8, 1.4]]]);
    default: return null;
  }
}

// The arcs' dressing (scale ~1 = real metres). Sheets (falls) and flags live in megaview.js.
export function sfDecorGeo(kind) {
  switch (kind) {
    // ── the Green World (Corneria) ──
    case 'farmField': return merged([...Array.from({ length: 6 }, (_, i) => [box(10, 0.3, 14), [0x8fc84a, 0xd8c060, 0x5fae3a, 0xc8a050, 0x7ab84a, 0xa8c850][i], [(i % 3) * 10.4 - 10.4, 0.15, Math.floor(i / 3) * 14.4 - 7.2]]),
      [box(4, 3, 3), 0xc0392b, [17, 1.5, 0]], [cone(3, 2, 4), 0x6a3a2a, [17, 4, 0], [0, Math.PI / 4, 0]]]);
    case 'windmill': return merged([[cyl(1.2, 2.2, 15, 8), 0xf4efe4, [0, 7.5, 0]], [cone(2, 3, 8), 0xb0402a, [0, 16.5, 0]], [box(0.8, 0.8, 1.6), 0x5a3a22, [0, 15, 1.6]]]);
    case 'lakeBand': return merged([[new THREE.CircleGeometry(16, 20).rotateX(-Math.PI / 2), 0x3f8fd8, [0, 0.2, 0], [0, 0, 0], [1, 1, 0.5]], [new THREE.RingGeometry(15.5, 17, 20).rotateX(-Math.PI / 2), 0xe8d8a0, [0, 0.15, 0], [0, 0, 0], [1, 1, 0.5]], [box(0.3, 0.05, 20), 0x9fd8ff, [3, 0.25, 0]]]);
    case 'radarDish': return merged([[box(1, 10, 1), 0x8a92a0, [0, 5, 0]], [new THREE.CylinderGeometry(5, 0.6, 2, 14, 1, true), 0xdfe6ee, [0, 11, 0], [0.7, 0, 0]], [box(0.4, 0.4, 3), 0x5a606c, [0, 11, 1.6]], [box(6, 1, 6), 0x9aa4b2, [0, 0.5, 0]]]);
    // ── the Asteroid Belt ──
    case 'asteroidBig': return merged([[dode(9), 0x6a6670, [0, 0, 0], [0.4, 0.7, 0], [1.2, 0.9, 1]], [dode(4), 0x585460, [7, 3, 2]], [ico(2, 0), 0x8a8490, [-6, -4, 3]], [new THREE.CircleGeometry(2.4, 10), 0x2a2830, [0, 4, 8.2]]]);
    case 'asteroidSmall': return merged([[dode(3), 0x7a7480, [0, 0, 0]], [dode(2), 0x6a6670, [4, 2, 1]], [dode(1.6), 0x585460, [-3, -1, 2]]]);
    case 'iceAsteroid': return merged([[ico(6, 0), 0xcfe6ff, [0, 0, 0], [0.3, 0.2, 0.1], [1, 1.3, 1]], [ico(2.6, 0), 0xe8f6ff, [5, 2, 1]], [cone(1, 5, 5), 0xbfe0ff, [-3, 5, 0], [0.3, 0, 0.4]]]);
    case 'mineBuoy': return merged([[sph(2), 0x3a3a44, [0, 0, 0]], ...Array.from({ length: 6 }, (_, i) => [cone(0.4, 1.4, 5), 0x8a8a94, [Math.cos(i) * 2.2, Math.sin(i * 1.7) * 1.4, Math.sin(i) * 2.2], [i, 0, i * 0.7]]), [sph(0.5, 6, 4), 0xff3a3a, [0, 2.1, 0]]]);
    case 'derelict': return merged([[box(8, 3, 22), 0x8a92a0, [0, 0, 0], [0.2, 0.3, 0.4]], [box(14, 0.4, 5), 0x5a606c, [0, 0, -4], [0.2, 0.3, 0.4]], [cyl(1.6, 1.6, 6, 8), 0x6a707c, [0, 0, 12], [Math.PI / 2, 0, 0.4]], [box(0.8, 0.8, 0.8), 0xffa21f, [3, 1.6, 2]]]);
    // ── the Ocean World ──
    case 'island': return merged([[cone(16, 7, 9), 0xe8d8a0, [0, 2.5, 0]], [cone(10, 9, 8), 0x3fae4a, [0, 6.5, 0]], [cyl(0.4, 0.5, 9, 6), 0x9a7046, [3, 12, 2], [0, 0, 0.2]], [ico(2.6, 0), 0x2f8a4a, [4, 16.5, 2], [0, 0, 0], [1.6, 0.4, 1.6]]]);
    case 'coralTower': return merged([[cyl(1.6, 2.6, 16, 7), 0xff7ab8, [0, 8, 0]], [cyl(0.8, 1.2, 9, 6), 0xff9a3c, [3, 6, 1], [0, 0, -0.4]], [cyl(0.7, 1, 8, 6), 0xb04ad1, [-3, 7, -1], [0, 0, 0.5]], [sph(1.6), 0xffb0c8, [0, 16.5, 0]]]);
    case 'shell': return merged([[new THREE.SphereGeometry(6, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xf4e0c8, [0, 0, 0], [0, 0, 0], [1, 0.7, 1.3]], ...Array.from({ length: 6 }, (_, i) => [box(0.4, 4, 15), 0xe8b890, [-5 + i * 2, 2, 0], [0, 0, (i - 2.5) * 0.18]])]);
    case 'slickBuoy': return merged([[new THREE.CircleGeometry(14, 18).rotateX(-Math.PI / 2), 0x2a2a3a, [0, 0.3, 0], [0, 0, 0], [1.4, 1, 0.8]], [cyl(1.4, 1.6, 4, 8), 0xff7a1a, [6, 2, 0]], [box(0.6, 3, 0.6), 0xdfe6ee, [6, 5.5, 0]], [sph(0.6, 6, 4), 0xff3a3a, [6, 7.4, 0]]]);
    case 'kelp': return merged([...Array.from({ length: 7 }, (_, i) => [box(0.5, 10 + (i % 3) * 5, 0.2), [0x2f8a4a, 0x3fae5a, 0x4a9a3a][i % 3], [-6 + i * 2, 5 + (i % 3) * 2.5, (i % 2) * 2], [0, 0, (i - 3) * 0.08]]), [sph(1.6), 0xe8a0ff, [0, 22, 0], [0, 0, 0], [1, 0.7, 1]]]);
    // ── the Fleet ──
    case 'cruiser': return merged([[box(9, 6, 60), 0x8a92a0, [0, 0, 0]], [box(16, 1.4, 22), 0x6a707c, [0, -1, -8]], [box(5, 7, 10), 0x9aa4b2, [0, 6, 12]], [cyl(2.4, 3.2, 6, 10), 0x5a606c, [0, 0, -32], [Math.PI / 2, 0, 0]], [cyl(1.8, 1.8, 0.6, 10), 0x5fd8ff, [0, 0, -35.2], [Math.PI / 2, 0, 0]], ...[-20, -6, 8].map((z) => [box(0.6, 0.6, 0.6), 0xff3a3a, [4.8, 1, z]])]);
    case 'frigate': return merged([[cone(5, 34, 4), 0x9aa4b2, [0, 0, 0], [Math.PI / 2, Math.PI / 4, 0]], [box(14, 0.8, 8), 0x6a707c, [0, 0, 6]], [cyl(1.4, 1.4, 4, 8), 0x5fd8ff, [0, 0, 18], [Math.PI / 2, 0, 0]], [box(2, 3, 5), 0x5a606c, [0, 3, 2]]]);
    case 'debris': return merged([[box(6, 1, 9), 0x6a707c, [0, 0, 0], [0.4, 0.9, 0.3]], [box(3, 3, 1), 0x8a92a0, [5, 2, 3], [0.8, 0.2, 0.6]], [cyl(0.6, 0.6, 7, 6), 0x5a606c, [-4, 1, -2], [0.3, 0, 1.2]], [box(0.6, 0.6, 0.6), 0xffa21f, [1, 1, 1]]]);
    case 'beacon': return merged([[cyl(0.5, 0.8, 12, 6), 0x8a92a0, [0, 6, 0]], [box(4, 0.6, 4), 0x5a606c, [0, 0.3, 0]], [tor(2.2, 0.2, 4, 14), 0xdfe6ee, [0, 9, 0], [Math.PI / 2, 0, 0]]]);
    case 'capitalHull': return merged([[box(22, 12, 120), 0x7a828e, [0, 0, 0]], [box(34, 2, 50), 0x5a606c, [0, -3, -20]], ...[-40, -10, 20].map((z) => [box(8, 9, 12), 0x9aa4b2, [0, 10, z]]), [cyl(5, 6, 10, 10), 0x5a606c, [0, 0, -64], [Math.PI / 2, 0, 0]], [cyl(4, 4, 0.8, 10), 0x5fd8ff, [0, 0, -69.5], [Math.PI / 2, 0, 0]],
      ...[-50, -30, -10, 10, 30, 50].map((z) => [box(0.8, 0.8, 0.8), 0xffe14d, [11.4, 3, z]])]);
    // ── the Desert World ──
    case 'dune': return merged([[new THREE.SphereGeometry(18, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0xe2b56a, [0, 0, 0], [0, 0, 0], [1.4, 0.35, 0.8]], [new THREE.SphereGeometry(10, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2), 0xd8a858, [14, 0, 6], [0, 0, 0], [1.2, 0.4, 0.8]]]);
    case 'tankWreck': return merged([[box(6, 2.4, 9), 0x6a6a5a, [0, 1.6, 0]], [box(4, 1.6, 4), 0x5a5a4a, [0, 3.4, -0.5]], [cyl(0.35, 0.35, 6, 6), 0x4a4a3a, [0, 3.6, 3.5], [Math.PI / 2 - 0.15, 0, 0]], ...[-3.2, 3.2].map((x) => [box(1.4, 1.8, 9.6), 0x3a3a2e, [x, 0.9, 0]])]);
    case 'obelisk': return merged([[cyl(1, 2, 24, 4), 0xd8b070, [0, 12, 0], [0, Math.PI / 4, 0]], [cone(1.3, 4, 4), 0xffc61a, [0, 26, 0], [0, Math.PI / 4, 0]], [box(5, 1.2, 5), 0xa07a40, [0, 0.6, 0]]]);
    case 'ruinCol': return merged([...[-5, 0, 5].map((x, i) => [cyl(1, 1.1, 8 + i * 3, 8), 0xe2c08a, [x, 4 + i * 1.5, 0]]), [box(12, 1.4, 3), 0xc8a060, [-2, 10.5, 0], [0, 0, 0.12]], [box(3, 2, 3), 0xd8b070, [6, 1, 3], [0.3, 0.4, 0]]]);
    case 'dustDevil': return merged(Array.from({ length: 6 }, (_, i) => [tor(1.4 + i * 1.1, 0.5, 4, 12), 0xd8b880, [Math.sin(i) * 0.8, 2 + i * 3.2, 0], [Math.PI / 2, 0, 0]]));
    // ── the Solar World ──
    case 'flareCrown': return merged([...Array.from({ length: 4 }, (_, i) => [tor(8 + i * 2.5, 0.9, 4, 12, Math.PI), [0xffd23f, 0xffa21f, 0xff6a1a][i % 3], [0, 0, (i - 2) * 4], [0, 0, 0]]), [new THREE.CircleGeometry(10, 18).rotateX(-Math.PI / 2), 0xfff2a0, [0, 0.4, 0]]]);
    case 'lavaPlume': return merged([[cone(4, 22, 7), 0xff7a1a, [0, 11, 0]], [cone(2.4, 30, 6), 0xffd23f, [0, 15, 0]], [sph(3), 0xfffbe0, [0, 28, 0]], [cyl(6, 7, 1, 10), 0x3a1a10, [0, 0.5, 0]]]);
    case 'sunspot': return merged([[new THREE.CircleGeometry(14, 20).rotateX(-Math.PI / 2), 0x2a0a06, [0, 0.4, 0]], [new THREE.RingGeometry(13.5, 18, 20).rotateX(-Math.PI / 2), 0xff8a1a, [0, 0.35, 0]], [new THREE.RingGeometry(18, 21, 20).rotateX(-Math.PI / 2), 0xffd23f, [0, 0.3, 0]]]);
    case 'heatShimmer': return merged(Array.from({ length: 4 }, (_, i) => [box(0.3, 14 + i * 4, 10), [0xffb04a, 0xff8a2a][i % 2], [i * 3 - 4.5, 7 + i * 2, 0], [0, 0, 0.08 * (i - 1.5)]]));
    // ── the Boss World ──
    case 'strataRock': return merged([[cyl(10, 14, 8, 7), 0x7a3a30, [0, 4, 0]], [cyl(8, 10, 8, 7), 0xa04a3a, [0, 12, 0]], [cyl(6, 8, 8, 7), 0x5a2420, [0, 20, 0]], [cone(6, 8, 7), 0x7a3a30, [0, 28, 0]]]);
    case 'fortressWall': return merged([[box(40, 18, 6), 0x3a2a30, [0, 9, 0]], ...Array.from({ length: 8 }, (_, i) => [box(3, 3, 6.4), 0x2a1e24, [-17.5 + i * 5, 19.5, 0]]), [box(42, 1.4, 7), 0x6a1a1a, [0, 14, 0]], ...[-12, 0, 12].map((x) => [box(1.4, 1.4, 0.4), 0xff3a3a, [x, 10, 3.2]])]);
    case 'searchlight': return merged([[box(4, 10, 4), 0x3a2a30, [0, 5, 0]], [cyl(1.6, 2, 2.4, 10), 0x6a6a74, [0, 11.2, 0], [0.4, 0, 0]], [new THREE.CircleGeometry(1.5, 10), 0xfffbe0, [0, 11.6, 1.3], [0.4, 0, 0]]]);
    case 'turretTower': return merged([[cyl(3, 4, 16, 8), 0x3a2a30, [0, 8, 0]], [sph(3.4, 10, 6), 0x5a3a40, [0, 17, 0]], [cyl(0.5, 0.5, 6, 6), 0x2a1e24, [0, 18, 3.2], [Math.PI / 2 - 0.3, 0, 0]], [box(0.8, 0.8, 0.8), 0xff3a3a, [0, 14, 3.4]]]);
    default: return null;
  }
}

// How the dressing sits and moves: lift (floats this high: [min, max]), far (set back from the corridor),
// anim: 'tumble' (rocks), 'drift' (ships sail along the run), 'crawl' (wrecks on the move), 'sway' (kelp),
// 'spin' (dust devils), 'sweep' (searchlights).
export const SF_DECOR_INFO = {
  asteroidBig: { lift: [10, 50], far: true, anim: 'tumble' }, asteroidSmall: { lift: [6, 40], anim: 'tumble' }, iceAsteroid: { lift: [10, 45], anim: 'tumble' },
  mineBuoy: { lift: [12, 40] }, derelict: { lift: [14, 44], far: true, anim: 'tumble' },
  cruiser: { lift: [20, 60], far: true, anim: 'drift' }, frigate: { lift: [15, 55], anim: 'drift' }, debris: { lift: [8, 45], anim: 'tumble' }, beacon: { lift: [6, 30] }, capitalHull: { lift: [25, 60], far: true },
  island: { far: true }, coralTower: {}, kelp: { anim: 'sway' }, dune: { far: true }, tankWreck: { anim: 'crawl' }, dustDevil: { anim: 'spin' },
  flareCrown: { far: true }, searchlight: {}, fortressWall: { far: true }, strataRock: { far: true }, farmField: { far: true }, lakeBand: { far: true },
};
// What some dressing carries, drawn as its own instanced kind: windmill blades (turning), the beacons' nav
// lights (blinking), the searchlights' beams (sweeping). at = offset from the item (x, y, z).
export const SF_ATTACH = {
  windmill: { geo: () => merged([0, 1, 2, 3].map((i) => [box(0.7, 7, 0.15), 0xf4efe4, [Math.sin(i * Math.PI / 2) * 3.5, Math.cos(i * Math.PI / 2) * 3.5, 0], [0, 0, -i * Math.PI / 2]])), at: [0, 15, 2.6], anim: 'turn' },
  beacon: { geo: () => sph(0.9, 8, 6), at: [0, 12.6, 0], anim: 'blink', glow: 0xff3a3a },
  searchlight: { geo: () => new THREE.ConeGeometry(5, 60, 12, 1, true).translate(0, -30, 0).rotateX(-Math.PI / 2 - 0.9), at: [0, 11.5, 0], anim: 'sweep', glow: 0xfff2c0 },
};
