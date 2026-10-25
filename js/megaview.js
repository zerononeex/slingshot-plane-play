// v1.5 THE MEGA-STAGE LOOK — draws the shared mega layer (megarun.js) and the arcs' dressing:
//   · weave posts (pines, giant trunks, war towers, obsidian spires, castle towers) — instanced per kind
//   · tilt sectors (tall walls + a glowing knife-edge slot) and LOOP DOORS (castle gates that slide open,
//     two golden key rings, a name banner) — one group each
//   · dragons (perched, patrolling, wild) from a small pool of the v1.4 Dragon model, and trebuchets
//   · the SHOTS: fireballs (a glow wind-up at the mouth first), boulders + their growing landing shadow
//   · thermals (rising rings), war-wind lanes (gold chevron ribbons), river / lava strips in the ditches
//   · §0 DETAIL: each arc's dressing kit outside the corridor (pooled per 80 m chunk), ambient life
//     (bird flocks, waving banners, smoke columns, moving wagons, scrolling falls, the aurora) and the
//     ten scripted SPECTACLE moments
//   · §6 the ADDENDUM: ARROWS (+ the archers: elves on canopy platforms, cavalry bowmen, castle + hall
//     archers), LAVA blobs (a glowing crack first), RUBBLE (a shadow first), THE GREAT HALL (facade +
//     doorway, stone halls, pillars, banners, torchlight, balconies, DIVE / CLIMB gap walls, a roof seen
//     only from below), THE SHELTER cave + THE LAVA WAVE, and THE GOLDEN CITY (golden kit + the plaza)
// Built once per world; per frame only what is near the plane is placed. No per-frame allocation.
import * as THREE from 'three';
import { shotPos, SHOTS } from './shooters.js';
import { doorOpenness, DOOR, DOOR_LOOP_R, LOOP_R_MIN } from './loopdoors.js';
import { WEAVE_HALF, POST_TOP, TILT, GAP, wildPos, patrolX } from './megarun.js';
import { buildFlyer } from './flyermodels.js';
import { FLIGHT } from './config.js';
import { rng } from './rng.js';
import { merged, cyl, cone, box, ico } from './meshkit.js';
import { createSFLayer } from './sfview.js';
import { sfPostGeo, sfDecorGeo, SF_POST_R0, SF_DECOR_INFO, SF_ATTACH } from './sfdecor.js';
import { swPostGeo, swDecorGeo, SW_POST_R0, SW_DECOR_INFO, SW_ATTACH } from './swdecor.js';
// v1.6 / v1.7: how the mega-stages' dressing floats + moves, and what it carries (sfdecor.js, swdecor.js)
const DECOR_INFO = { ...SF_DECOR_INFO, ...SW_DECOR_INFO }, ATTACH = { ...SF_ATTACH, ...SW_ATTACH };

const SHOW_BEHIND = 80, SHOW_AHEAD = 760;
const POST_R0 = { pine: 1.3, giantTree: 2.1, tower: 2.4, spire: 1.7, castleTower: 2.6, ...SF_POST_R0, ...SW_POST_R0 }; // the radius each post geometry is built at
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
const _a = { x: 0, y: 0, d: 0 };
const lam = (color, extra) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
const basic = (color, extra) => new THREE.MeshBasicMaterial({ color, ...extra });
const VC0 = () => new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
const _q2 = new THREE.Quaternion(), _z = new THREE.Vector3(0, 0, 1), _dir = new THREE.Vector3(), _b = { x: 0, y: 0, d: 0 };



// ───────────────────────── geometries ─────────────────────────
// Weave posts, built at their real size (r = the collider radius; 90 m tall, above the ceiling).
function postGeo(kind) {
  const H = POST_TOP;
  switch (kind) {
    case 'pine': return merged([[cyl(0.9, 1.3, H), 0x6b4423, [0, H / 2, 0]], ...Array.from({ length: 7 }, (_, i) => [cone(10 - i * 1.1, 13, 9), i % 2 ? 0x2f6b4f : 0x285e45, [0, 26 + i * 9, 0]]),
      ...Array.from({ length: 7 }, (_, i) => [cone(4.2 - i * 0.4, 4, 9), 0xf4f8ff, [0, 31 + i * 9, 0]])]);
    case 'giantTree': return merged([[cyl(1.7, 2.6, H, 10), 0x5a3a22, [0, H / 2, 0]], [cyl(2.65, 2.7, 6, 10), 0x4f8a3a, [0, 3, 0]],
      ...[0, 1, 2, 3].map((i) => [box(14, 1.2, 1.2), 0x5a3a22, [Math.cos(i * 1.6) * 7, 66 + i * 6, Math.sin(i * 1.6) * 7], [0, i * 1.6, 0.3]]),
      [ico(16, 1), 0x2f7a35, [0, 90, 0], [0, 0, 0], [1, 0.55, 1]], [ico(10, 0), 0x3f9a3a, [9, 80, 4], [0, 0, 0], [1, 0.6, 1]], [ico(9, 0), 0x2a6a30, [-9, 84, -5], [0, 0, 0], [1, 0.6, 1]]]);
    case 'tower': return merged([[cyl(2.4, 2.9, H, 10), 0x9a9488, [0, H / 2, 0]], [cyl(3.4, 3.4, 4, 10), 0x7a756c, [0, H + 2, 0]],
      ...Array.from({ length: 8 }, (_, i) => [box(1.2, 2, 1.2), 0x7a756c, [Math.cos(i * 0.785) * 3, H + 5, Math.sin(i * 0.785) * 3]]),
      [box(0.2, 14, 3.4), 0xc0392b, [2.5, 48, 0]], [box(0.2, 14, 3.4), 0xc0392b, [-2.5, 48, 0]], [box(0.25, 2, 3.4), 0xffc61a, [2.55, 41, 0]], [box(0.25, 2, 3.4), 0xffc61a, [-2.55, 41, 0]],
      ...[18, 30, 64, 76].map((y) => [box(0.5, 2.4, 1), 0x2a2420, [0, y, 2.7]])]);
    case 'spire': return merged([[cone(4, H + 4, 6), 0x1d1a22, [0, (H + 4) / 2, 0]], [cone(2.6, 30, 5), 0x2a2430, [2.2, 15, 1]],
      ...[14, 30, 46, 62].map((y, i) => [box(0.5, 9, 0.5), 0xff7a1a, [Math.cos(i * 2) * (3.6 - y * 0.035), y, Math.sin(i * 2) * (3.6 - y * 0.035)], [0.2, 0, 0.1]])]);
    case 'castleTower': return merged([[cyl(2.6, 3, H, 12), 0xf4f2ec, [0, H / 2, 0]], [cone(4.2, 12, 12), 0x2f6fe8, [0, H + 6, 0]], [cyl(3.4, 3.4, 3, 12), 0xd8d4cc, [0, H - 1, 0]],
      [box(0.3, 8, 0.3), 0xdfe6ee, [0, H + 15, 0]], [box(3, 1.8, 0.15), 0xffc61a, [1.6, H + 17.5, 0]], ...[20, 34, 50, 70].map((y) => [box(0.8, 2.6, 0.4), 0x2a3a5a, [0, y, 2.9]])]);
    default: return sfPostGeo(kind) ?? swPostGeo(kind) ?? merged([[cyl(2, 2, H), 0x888888, [0, H / 2, 0]]]); // v1.6 Star Fox's posts; v1.7 Star Wars'
  }
}
// The arc dressing (outside the corridor; looks only). Sheets (falls) and flags are separate (animated).
function decorGeo(kind) {
  switch (kind) {
    case 'pine': return merged([[cyl(0.35, 0.5, 4), 0x6b4423, [0, 2, 0]], [cone(3.4, 6, 8), 0x2f6b4f, [0, 6, 0]], [cone(2.6, 5, 8), 0x285e45, [0, 9, 0]], [cone(1.8, 4, 8), 0x2f6b4f, [0, 11.5, 0]], [cone(1.2, 2, 8), 0xf4f8ff, [0, 13, 0]]]);
    case 'giantTree': return merged([[cyl(1.4, 2.2, 34, 8), 0x5a3a22, [0, 17, 0]], [ico(9, 1), 0x2f8a3a, [0, 36, 0], [0, 0, 0], [1, 0.6, 1]], [ico(6, 0), 0x3fae4a, [5, 30, 3]], [ico(5, 0), 0x2a6a30, [-5, 32, -3]]]);
    case 'canopy': return merged([[cyl(1, 1.6, 20, 7), 0x5a3a22, [0, 10, 0]], [ico(12, 1), 0x2a7a35, [0, 24, 0], [0, 0, 0], [1.4, 0.45, 1.2]], [ico(8, 0), 0x3f9a3a, [8, 22, 4], [0, 0, 0], [1, 0.5, 1]], [ico(7, 0), 0x4fb34a, [-8, 26, -2], [0, 0, 0], [1, 0.5, 1]]]);
    case 'vines': return merged([[box(18, 1.2, 1.2), 0x5a3a22, [0, 26, 0]], ...Array.from({ length: 7 }, (_, i) => [box(0.25, 8 + (i % 3) * 5, 0.25), 0x3f8a2a, [-8 + i * 2.6, 22 - (i % 3) * 2.5, 0]]), [ico(5, 0), 0x2f7a35, [-9, 27, 0]], [ico(5, 0), 0x2f7a35, [9, 27, 0]]]);
    case 'cabin': return merged([[box(8, 5, 6), 0x8a5a35, [0, 2.5, 0]], [cone(6, 3.6, 4), 0xf4f8ff, [0, 6.8, 0], [0, Math.PI / 4, 0], [1, 1, 0.8]], [box(1.2, 4, 1.2), 0x6b6b6b, [2.4, 7.5, 0]], [box(1.4, 1.6, 0.2), 0xffd27a, [-1.8, 2.6, 3.05]], [box(1.6, 3, 0.2), 0x5a3a22, [1.8, 1.5, 3.05]]]);
    case 'iceFall': return merged([[new THREE.DodecahedronGeometry(12, 0), 0x8a9ab0, [0, 13, -6], [0.3, 0.5, 0], [1.3, 1.5, 0.75]], [new THREE.DodecahedronGeometry(8, 0), 0x7a8aa0, [-11, 8, -4], [0, 1, 0.4], [1, 1.2, 0.8]],
      [ico(10, 0), 0xf4f8ff, [0, 30, -6], [0, 0, 0], [1.6, 0.35, 0.9]], ...Array.from({ length: 6 }, (_, i) => [cone(0.9, 6 + (i % 3) * 3, 5), 0xd8f6ff, [-5 + i * 2, 24 - (i % 3) * 1.5, 2.6], [Math.PI, 0, 0]]),
      [cyl(8, 9, 0.6, 14), 0xd8f6ff, [0, 0.3, 6]], [ico(2.5, 0), 0xe8fbff, [4, 1.5, 5]], [ico(2, 0), 0xe8fbff, [-4, 1.2, 7]]]);
    case 'stoneCircle': return merged([...Array.from({ length: 8 }, (_, i) => [box(2, 6 + (i % 2) * 2, 1.4), 0x8d8a80, [Math.cos(i * 0.785) * 8, 3.5, Math.sin(i * 0.785) * 8], [0, -i * 0.785, 0]]), [box(7, 1.2, 2), 0x8d8a80, [0, 8.5, 8]]]);
    case 'watchtower': return merged([...[[-2, -2], [2, -2], [-2, 2], [2, 2]].map(([x, z]) => [box(0.6, 16, 0.6), 0x6b4423, [x, 8, z]]), [box(6, 3, 6), 0x8a5a35, [0, 17, 0]], [cone(5, 4, 4), 0xb0402a, [0, 20.5, 0], [0, Math.PI / 4, 0]], [box(1, 1, 1), 0xffa21f, [0, 17.5, 3.1]]]);
    case 'ruin': return merged([[box(16, 1.6, 10), 0xa09a80, [0, 0.8, 0]], ...[-6, -2, 2, 6].map((x, i) => [cyl(0.9, 1, 6 + (i % 2) * 5, 8), 0xb8b098, [x, 3.5 + (i % 2) * 2.5, 3.5]]), [box(10, 1.2, 2.4), 0x8a8468, [-2, 9.6, 3.5], [0, 0, 0.15]], [ico(2.5, 0), 0x3f9a3a, [5, 2, -2]]]);
    case 'mushrooms': return merged([[cyl(0.6, 0.9, 6, 8), 0xf4ead2, [0, 3, 0]], [new THREE.SphereGeometry(3.6, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0xd8402a, [0, 5.8, 0]], [cyl(0.4, 0.6, 4, 8), 0xf4ead2, [3.5, 2, 1]], [new THREE.SphereGeometry(2.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0xffa21f, [3.5, 3.8, 1]]]);
    case 'tent': return merged([[cone(4.6, 6, 8), 0xe8dcc0, [0, 3, 0]], [cone(4.65, 1.6, 8), 0xc0392b, [0, 0.8, 0]], [box(0.2, 3, 0.2), 0x6b4423, [0, 7, 0]], [box(1.4, 0.9, 0.08), 0xc0392b, [0.75, 8, 0]]]);
    case 'banner': return merged([[box(0.4, 14, 0.4), 0x6b4423, [0, 7, 0]], [cone(0.5, 1, 6), 0xffc61a, [0, 14.4, 0]]]);
    case 'siegeTower': return merged([[box(6, 20, 6), 0x8a5a35, [0, 10, 0]], [box(6.6, 1, 6.6), 0x5a3a22, [0, 13, 0]], [box(5, 0.6, 7), 0x7a5230, [0, 18, 6], [0.8, 0, 0]], ...[-2.6, 2.6].map((x) => [cyl(1.6, 1.6, 1, 10), 0x3a2a1a, [x, 1.6, 0], [0, 0, Math.PI / 2]]), [box(4, 4, 0.2), 0xc0392b, [0, 16, 3.05]]]);
    case 'wagon': return merged([[box(3, 1.6, 5.5), 0x8a5a35, [0, 1.6, 0]], [new THREE.CylinderGeometry(2, 2, 5.6, 10, 1, false, 0, Math.PI), 0xe8dcc0, [0, 2.4, 0], [Math.PI / 2, 0, Math.PI / 2]], ...[[-1.6, -1.8], [1.6, -1.8], [-1.6, 1.8], [1.6, 1.8]].map(([x, z]) => [cyl(0.8, 0.8, 0.3, 10), 0x3a2a1a, [x, 0.8, z], [0, 0, Math.PI / 2]]), [box(1.2, 1.8, 2.4), 0x6b4a2a, [0, 1.6, -4.4]]]);
    case 'regiment': return merged([...Array.from({ length: 24 }, (_, i) => [box(0.9, 1.9, 0.6), i % 6 === 0 ? 0xc0392b : 0x7a828c, [(i % 6) * 1.8 - 4.5, 0.95, Math.floor(i / 6) * 1.8 - 2.7]]), ...Array.from({ length: 24 }, (_, i) => [box(0.12, 3.2, 0.12), 0xd8d0c0, [(i % 6) * 1.8 - 4.2, 2.2, Math.floor(i / 6) * 1.8 - 2.7]]), [box(0.2, 5, 0.2), 0x6b4423, [-5.6, 2.5, -3]], [box(2, 1.2, 0.1), 0xffc61a, [-4.5, 4.4, -3]]]);
    case 'obsidian': return merged([[cone(3, 24, 5), 0x1d1a22, [0, 12, 0]], [cone(1.8, 14, 5), 0x2a2430, [2.4, 7, 1]], [box(0.4, 10, 0.4), 0xff6a1a, [0.9, 8, 1.2]]]);
    case 'nest': return merged([[cone(6, 14, 6), 0x3a302e, [0, 7, 0]], [new THREE.TorusGeometry(5, 1.6, 6, 14), 0x6b4a2a, [0, 14.5, 0], [Math.PI / 2, 0, 0]], ...[0, 1, 2, 3].map((i) => [new THREE.SphereGeometry(1.5, 8, 6), [0xc0392b, 0xffc61a, 0x8a1f1a, 0xff7a1a][i], [Math.cos(i * 1.57) * 2.4, 15.6, Math.sin(i * 1.57) * 2.4], [0, 0, 0], [1, 1.3, 1]])]);
    case 'smoke': return merged([[cyl(2.4, 3.2, 3, 8), 0x3a302e, [0, 1.5, 0]], [ico(1.6, 0), 0xff6a1a, [0, 3, 0]]]);
    case 'lavaFall': return merged([[new THREE.DodecahedronGeometry(11, 0), 0x2a2224, [0, 12, -6], [0.4, 0.2, 0], [1.3, 1.4, 0.75]], [new THREE.DodecahedronGeometry(7, 0), 0x3a2e2c, [10, 7, -3], [0, 0.7, 0.3]],
      [cone(4, 6, 6), 0x1d1a22, [-6, 28, -5]], [cyl(8, 9, 0.6, 14), 0xff5a1a, [0, 0.3, 6]], [ico(2, 0), 0x2a2224, [5, 1, 6]]]);
    case 'perchedDragon': return merged([[box(4, 16, 4), 0x3a302e, [0, 8, 0]], [ico(2.6, 0), 0x1d1a22, [0, 19, 0], [0, 0, 0], [1, 0.8, 1.8]], [box(1, 3, 1), 0x1d1a22, [0, 21.5, -3.4], [-0.5, 0, 0]], [ico(1.2, 0), 0x1d1a22, [0, 23, -4.4]],
      [new THREE.PlaneGeometry(6, 5), 0x5a1015, [3.6, 20.5, 0], [0, 0, -0.5]], [new THREE.PlaneGeometry(6, 5), 0x5a1015, [-3.6, 20.5, 0], [0, 0, 0.5]], [box(0.3, 0.3, 0.3), 0xffe14d, [0.5, 23.3, -5]], [box(0.3, 0.3, 0.3), 0xffe14d, [-0.5, 23.3, -5]]]);
    case 'bones': return merged([...Array.from({ length: 5 }, (_, i) => [new THREE.TorusGeometry(5 - Math.abs(i - 2), 0.4, 5, 12, Math.PI), 0xece6da, [0, 0, -6 + i * 3], [0, Math.PI / 2, 0]]), [box(1, 1, 16), 0xd8d0c0, [0, 5, 0]], [ico(2.4, 0), 0xece6da, [0, 2, 10], [0, 0, 0], [1, 0.7, 1.5]]]);
    case 'plateau': return merged([[cone(16, 26, 7), 0x8a7a6a, [0, 22, 0], [Math.PI, 0, 0]], [cyl(16.4, 16.4, 2, 7), 0x4fb34a, [0, 36, 0]], [cone(1.6, 5, 6), 0x2f6b4f, [6, 39.5, 3]], [cone(1.4, 4, 6), 0x2f6b4f, [-5, 39, -6]]]);
    case 'castle': return merged([[cone(14, 22, 7), 0x8a7a6a, [0, 20, 0], [Math.PI, 0, 0]], [cyl(14.4, 14.4, 2, 7), 0x4fb34a, [0, 32, 0]], [box(14, 9, 10), 0xf4f2ec, [0, 37.5, 0]],
      ...[[-6, -4], [6, -4], [-6, 4], [6, 4]].map(([x, z]) => [cyl(1.6, 1.6, 14, 8), 0xf4f2ec, [x, 40, z]]), ...[[-6, -4], [6, -4], [-6, 4], [6, 4]].map(([x, z]) => [cone(2.2, 5, 8), 0x2f6fe8, [x, 49.5, z]]), [box(2, 2.6, 0.2), 0xffd27a, [0, 37, 5.05]]]);
    case 'bridge': return merged([[box(4, 1.6, 70), 0x9a9488, [0, 34, 0]], ...[-26, -9, 9, 26].map((z) => [new THREE.TorusGeometry(7, 0.8, 5, 12, Math.PI), 0x9a9488, [0, 27.5, z], [0, Math.PI / 2, 0]]), ...[-30, -15, 0, 15, 30].map((z) => [box(0.3, 4, 0.3), 0xffc61a, [1.9, 36.5, z]])]);
    case 'waterfall': return merged([[cone(12, 20, 7), 0x8a7a6a, [0, 24, 0], [Math.PI, 0, 0]], [cyl(12.4, 12.4, 2, 7), 0x4fb34a, [0, 35, 0]]]);
    // v1.5 §6 THE GOLDEN CITY's halls and towers
    case 'goldenSpire': return merged([[box(9, 4, 9), 0xf6ead0, [0, 2, 0]], [cyl(2.6, 3.2, 34, 10), 0xf6ead0, [0, 21, 0]], [cyl(3.6, 3.6, 1.4, 10), 0xffc61a, [0, 38.5, 0]], [new THREE.SphereGeometry(3.2, 10, 8), 0xffc61a, [0, 41.5, 0]], [cone(0.8, 9, 6), 0xffd23f, [0, 48, 0]],
      ...[14, 22, 30].map((y) => [box(1, 2, 0.3), 0xffd27a, [0, y, 3.1]])]);
    case 'goldenHouse': return merged([[box(16, 10, 12), 0xf6ead0, [0, 5, 0]], [cone(11, 6, 4), 0xffc61a, [0, 13, 0], [0, Math.PI / 4, 0], [1, 1, 0.75]], ...[-5, 0, 5].map((x) => [box(1.6, 3, 0.3), 0xffd27a, [x, 5.5, 6.05]]),
      ...[-7, 7].map((x) => [cyl(0.7, 0.8, 10, 8), 0xfff4d6, [x, 5, 6.6]]), [box(17, 1, 1.4), 0xffc61a, [0, 10.4, 6.6]]]);
    default: return sfDecorGeo(kind) ?? swDecorGeo(kind) ?? merged([[box(2, 2, 2), 0xff00ff, [0, 1, 0]]]); // v1.6 Star Fox's kits; v1.7 Star Wars'
  }
}
const SHEET = { iceFall: ['ice', 8, 26, 0, 14, 3], lavaFall: ['lava', 7, 24, 0, 13, 3], waterfall: ['water', 5, 30, 10, 20, 0] }; // [material, w, h, x, y, z]
const FLAGGED = { banner: [0, 12, 0.25] };   // the flag hangs at this offset (x, y, z) from the pole
const SMOKY = { cabin: [2.4, 9.5, 0], smoke: [0, 4, 0] };

// A canvas texture: scrolling fall sheets (ice / lava / water), chevrons, the TILT sign, a door's name.
function stripeTexture(c1, c2) {
  const c = document.createElement('canvas'); c.width = 32; c.height = 128;
  const g = c.getContext('2d');
  for (let y = 0; y < 128; y += 8) { g.fillStyle = (y / 8) % 3 ? c1 : c2; g.fillRect(0, y, 32, 8); for (let x = 0; x < 32; x += 8) { g.globalAlpha = 0.3; g.fillStyle = '#ffffff'; g.fillRect(x + ((y * 7) % 8), y, 2, 8); g.globalAlpha = 1; } }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function chevrons(color) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); g.strokeStyle = color; g.lineWidth = 9; g.lineCap = 'round';
  g.beginPath(); g.moveTo(12, 46); g.lineTo(32, 20); g.lineTo(52, 46); g.stroke();
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function signTexture(lines, fg = '#ffffff', bg = '#1b2438', accent = '#ffc61a') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 160); g.fillStyle = accent; g.fillRect(0, 0, 512, 10); g.fillRect(0, 150, 512, 10);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg;
  lines.forEach((t, i) => { let size = i ? 34 : 64; g.font = `italic 900 ${size}px system-ui, -apple-system, "Segoe UI", Arial, sans-serif`; while (g.measureText(t).width > 480 && size > 18) { size -= 4; g.font = `italic 900 ${size}px system-ui, -apple-system, "Segoe UI", Arial, sans-serif`; } g.fillText(t, 256, lines.length === 1 ? 82 : i ? 122 : 62); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Per-arc dragon tint (the Dragon model's colours are baked; the material colour multiplies them).
const DRAGON_TINT = { snowfields: 0xbfe0ff, deepforest: 0x8fd08a, warplains: 0xffffff, firelands: 0x7a5a5a, skycastles: 0xffe8a0,
  greenworld: 0xc08080, asteroids: 0xb07a8a, oceanworld: 0x8a9ac0, fleet: 0x9a7ab8, desertworld: 0xb08a6a, solarworld: 0xc06a4a, bossworld: 0x8a3a4a, // v1.6: Star Fox's enemy fighters
  twinsuns: 0xc8b8a0, orbital: 0x9aa0b0, iceworld: 0xc8d0e0, cloudworld: 0xe8c0a0, forestmoon: 0x9aa890, greatfleet: 0x8a90a8, greatstation: 0x7a808c }; // v1.7: Star Wars'
const BIRD_TINT = { snowfields: 0x22242a, deepforest: 0x3fae4a, warplains: 0x22242a, firelands: 0xff7a1a, skycastles: 0xffffff,
  greenworld: 0x22242a, asteroids: 0x9aa4b2, oceanworld: 0xffffff, fleet: 0x9aa4b2, desertworld: 0x3a2a20, solarworld: 0xffa21f, bossworld: 0x5a3a4a,
  twinsuns: 0x3a2a20, orbital: 0x9aa4b2, iceworld: 0x5a6a7a, cloudworld: 0xffffff, forestmoon: 0x2a3a20, greatfleet: 0x9aa4b2, greatstation: 0x9aa4b2 };
// v1.6 Star Fox's tilt walls (per arc) and loop-door looks ([towers, roofs / lights, leaves]).
const TILT_WALL = { greenworld: 0x6a7068, asteroids: 0x5a5660, oceanworld: 0x4a8a9a, fleet: 0x6a707c, desertworld: 0xd0a860, solarworld: 0x3a1a10, bossworld: 0x3a2a30,
  twinsuns: 0xb0845a, cloudworld: 0xe8e0d8, iceworld: 0xc8d8e8, greatstation: 0x6a707c }; // v1.7: Star Wars' canyon rock, cloud towers, ice, station steel
const DOOR_LOOK = { warpGate: [0x8a92a0, 0x5fd8ff, 0x4a505c], sunkenGate: [0x5a8a8a, 0xff7ab8, 0x3a5a5a], coronaGate: [0xffc61a, 0xff6a1a, 0x8a4a1a], fortressDoor: [0x3a2a30, 0xff3a3a, 0x2a1e24],
  dockingGate: [0x9aa0a8, 0x5fd8ff, 0x4a4e56], bunkerDoor: [0x5a5a50, 0x3aff5a, 0x3a3a34], airlock: [0x5a5048, 0xffa21f, 0x3a342e], trenchGate: [0x6a707c, 0xff3a3a, 0x3a3e46] }; // v1.7: Star Wars' gates
const RIVER = { snowfields: ['ice', 0.85], deepforest: ['water', 0.8], warplains: ['water', 0.8], firelands: ['lava', 0.95],
  greenworld: ['water', 0.8], oceanworld: ['water', 0.8], solarworld: ['lava', 0.95], bossworld: ['lava', 0.95],
  iceworld: ['ice', 0.85], forestmoon: ['water', 0.8], cloudworld: ['water', 0.6] }; // v1.7 (the desert's gullies are dry)

export function createMegaView(scene, fx) {
  const root = new THREE.Group();
  scene.add(root);
  let run = null, stage = null, terrain = null, arcs = null;
  let built = [];      // everything made for the current world (removed on a world switch)
  const keepM = (o) => { built.push(o); root.add(o); return o; };
  const inst = (geo, mat, n) => {
    const m = new THREE.InstancedMesh(geo, mat, n);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
    for (let i = 0; i < n; i++) m.setMatrixAt(i, ZERO);
    return m;
  };
  const setI = (mesh, i, x, y, d, sx, sy, sz, ry = 0, rx = 0, rz = 0) => {
    _q.setFromEuler(_e.set(rx, ry, rz));
    _m.compose(_p.set(x, y, -d), _q, _s.set(sx, sy, sz));
    mesh.setMatrixAt(i, _m);
  };
  const VC = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });

  // ── shots (always made; shared by every mega-stage) ──
  const SHOT_N = 24;
  const fireCore = inst(new THREE.SphereGeometry(1, 10, 8), basic(0xffd23f), SHOT_N);
  const fireGlow = inst(new THREE.SphereGeometry(1, 10, 8), basic(0xff6a1a, { transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }), SHOT_N);
  const boulders = inst(new THREE.DodecahedronGeometry(1, 0), lam(0x8a8478), SHOT_N);
  const shadows = inst(new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2), basic(0x1a1010, { transparent: true, opacity: 0.45, depthWrite: false }), SHOT_N);
  const marks = inst(new THREE.RingGeometry(0.85, 1, 24).rotateX(-Math.PI / 2), basic(0xff3a1a, { transparent: true, opacity: 0.8, depthWrite: false }), SHOT_N);
  // §6: arrows (a shaft along +z, turned to the flight path), lava blobs + their glowing ground crack
  const arrows = inst(merged([[box(0.14, 0.14, 2.6), 0x7a5230, [0, 0, 0]], [cone(0.22, 0.5, 4), 0xc8ccd4, [0, 0, 1.5], [Math.PI / 2, 0, 0]], [box(0.02, 0.36, 0.5), 0xf4f2ec, [0, 0, -1.1]], [box(0.36, 0.02, 0.5), 0xf4f2ec, [0, 0, -1.1]]]), VC0(), SHOT_N);
  const lavaCore = inst(ico(1, 1), basic(0xff7a1a), SHOT_N);
  const lavaGlow = inst(new THREE.SphereGeometry(1, 10, 8), basic(0xff3a00, { transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }), SHOT_N);
  const cracks = inst(merged([[box(1, 0.1, 0.18), 0xffffff, [0, 0, 0]], [box(0.5, 0.1, 0.14), 0xffffff, [0.55, 0, 0.18], [0, 0.6, 0]], [box(0.45, 0.1, 0.14), 0xffffff, [-0.5, 0, -0.16], [0, 0.7, 0]]]), basic(0xff4a0a, { transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }), SHOT_N);
  // v1.6: laser BOLTS (Star Fox's arrows: a glowing dash) and floating MINES (+ their blinking light)
  const bolts = inst(merged([[box(0.22, 0.22, 4.4), 0xffffff, [0, 0, 0]]]), basic(0xff3a3a), SHOT_N);
  const boltGlow = inst(box(0.7, 0.7, 5.4), basic(0xff3a3a, { transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }), SHOT_N);
  const MINES = 16;
  const mines = inst(merged([[new THREE.SphereGeometry(1, 12, 8), 0x3a3a44, [0, 0, 0]], ...Array.from({ length: 8 }, (_, i) => [cone(0.18, 0.7, 5), 0x9a9aa4, [Math.cos(i * 0.785) * 1.05, Math.sin(i * 2.3) * 0.5, Math.sin(i * 0.785) * 1.05], [Math.sin(i * 2.3) * 0.5, 0, -Math.PI / 2 + i * 0.785]]), [new THREE.TorusGeometry(1.02, 0.08, 4, 18), 0xffc61a, [0, 0, 0], [Math.PI / 2, 0, 0]]]), VC0(), MINES);
  const mineLights = inst(new THREE.SphereGeometry(0.4, 8, 6), basic(0xff2a2a, { transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }), MINES);
  for (const m of [fireCore, fireGlow, boulders, shadows, marks, arrows, lavaCore, lavaGlow, cracks, bolts, boltGlow, mines, mineLights]) root.add(m);

  // ── thermals: rising rings ──
  const RINGS = 48;
  const thermalRings = inst(new THREE.TorusGeometry(1, 0.06, 4, 18).rotateX(Math.PI / 2), basic(0xffffff, { transparent: true, opacity: 0.5, depthWrite: false }), RINGS);
  root.add(thermalRings);

  // ── birds (ambient flocks) ──
  const BIRDS = 36;
  const birdGeo = merged([[box(1.6, 0.08, 0.5), 0xffffff, [-0.75, 0, 0], [0, 0, 0.35]], [box(1.6, 0.08, 0.5), 0xffffff, [0.75, 0, 0], [0, 0, -0.35]], [box(0.3, 0.3, 0.9), 0xffffff, [0, 0, 0]]]);
  const birdMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, color: 0x22242a });
  const birds = inst(birdGeo, birdMat, BIRDS);
  root.add(birds);

  // ── the aurora (the Snowfields' sky) ──
  const aurGeo = new THREE.PlaneGeometry(900, 70, 40, 1);
  { const p = aurGeo.attributes.position, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const u = (p.getX(i) + 450) / 900, top = p.getY(i) > 0; const g = 0.6 + 0.4 * Math.sin(u * 17); col[i * 3] = top ? 0.5 * g : 0.1; col[i * 3 + 1] = top ? 0.3 : 0.9 * g; col[i * 3 + 2] = top ? 0.9 * g : 0.6; p.setZ(i, Math.sin(u * 9) * 40); }
    aurGeo.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
  const aurMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const aurora = new THREE.Mesh(aurGeo, aurMat);
  aurora.frustumCulled = false; aurora.visible = false; aurora.renderOrder = -1;
  scene.add(aurora);

  // ── materials whose textures scroll ──
  const sheetMats = {
    ice: lam(0xd8f6ff, { map: stripeTexture('#bff0ff', '#e8fbff'), emissive: 0x1a4a6a, transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
    lava: basic(0xffffff, { map: stripeTexture('#ff7a1a', '#ffc040'), side: THREE.DoubleSide }),
    water: basic(0xffffff, { map: stripeTexture('#7fd0ff', '#d8f4ff'), transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
  };
  const laneTex = chevrons('#ffd23f');
  const laneMat = new THREE.MeshBasicMaterial({ color: 0xffe08a, map: laneTex, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const puffMat = new THREE.MeshLambertMaterial({ color: 0x8c8c8c, emissive: 0x404040, transparent: true, opacity: 0.32, depthWrite: false });

  // ── per-world state ──
  let posts = {};          // kind → { mesh, rows: [] }
  let postList = [], sheetList = [];
  const SHEET_MATS = Object.values(sheetMats);
  let doors = [], tilts = [], trebs = [], lanes = [], strips = [];
  let decor = null;        // dressing pools
  const CH = 10, PER = 12; // dressing: chunks kept, items per chunk
  const chunkK = new Int32Array(CH).fill(-99999);
  // The dressing items of the kept chunks (pooled records, rewritten in place) and, after each change,
  // the compacted lists the animated ones are drawn from (instance counts = what is really there).
  const items = Array.from({ length: CH * PER }, () => ({ on: false, kind: '', ki: 0, x: 0, y: 0, d: 0, s: 1, ry: 0, lift: 0, facing: 0, ph: 0, col: 0 }));
  const flagList = [], smokeList = [], wagonList = [], animList = []; // v1.6 animList: Star Fox's moving dressing
  let attach = {}, animKinds = [];  // v1.6 attachments (blades / nav lights / beams): kind → { mesh, list, def }
  let dressDirty = true;
  let flagMesh = null, smokeMesh = null, sheetMeshes = {};
  let dragons = [];        // the Dragon model pool: { f, who }
  const SPEC_POOL = 3;
  let clock = 0;
  let waveG = null, plazaMesh = null, archerMeshes = [], cavalry = [], riderMesh = null; // §6
  let hallGs = [], caveGs = [], torchMats = []; // v1.6: every interior / cave
  let sfLayer = null, lastCam = null;           // v1.6: Star Fox's own looks (sfview.js)

  function clear() {
    for (const o of built) { root.remove(o); o.traverse?.((m) => { if (m.geometry && !m.geometry.userData?.shared) m.geometry.dispose?.(); }); }
    built = []; posts = {}; postList = []; sheetList = []; doors = []; tilts = []; trebs = []; lanes = []; strips = []; dragons = []; decor = null; sheetMeshes = {}; flagMesh = smokeMesh = null;
    chunkK.fill(-99999);
    for (const m of [fireCore, fireGlow, boulders, shadows, marks, thermalRings, arrows, lavaCore, lavaGlow, cracks, bolts, boltGlow, mines, mineLights]) m.count = 0;
    // the shots' default look (a world's `skin` recolours them in build)
    fireCore.material.color.setHex(0xffd23f); fireGlow.material.color.setHex(0xff6a1a); lavaCore.material.color.setHex(0xff7a1a); lavaGlow.material.color.setHex(0xff3a00);
    hallGs = []; caveGs = []; torchMats = []; sfLayer = null; waveG = null; plazaMesh = null; archerMeshes = []; cavalry = []; riderMesh = null;
    aurora.visible = false;
  }

  // A tall wall across the corridor with one knife-edge slot (+ glowing slot edges and a TILT sign ahead).
  function buildTilt(t, arc) {
    const g = new THREE.Group(), wallC = TILT_WALL[arc.id] ?? (arc.id === 'firelands' ? 0x1d1a22 : arc.id === 'snowfields' ? 0xb8cfe0 : 0x9a9488);
    const half = t.gap / 2, H = t.hall ? HALL_ROOF : TILT.top; // §6: a hall doorway stands floor → roof
    const L = new THREE.Mesh(box(WEAVE_HALF + 8 + (t.x - half), H, TILT.depth * 2), lam(wallC)); L.position.set((-WEAVE_HALF - 8 + t.x - half) / 2, H / 2, 0); g.add(L);
    const R = new THREE.Mesh(box(WEAVE_HALF + 8 - (t.x + half), H, TILT.depth * 2), lam(wallC)); R.position.set((WEAVE_HALF + 8 + t.x + half) / 2, H / 2, 0); g.add(R);
    for (const sx of [-1, 1]) { const e = new THREE.Mesh(box(0.35, H, TILT.depth * 2 + 0.2), basic(0xffe14d)); e.position.set(t.x + sx * (half + 0.2), H / 2, 0); g.add(e); }
    for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(box(4, 0.6, 0.4), basic(0xff4fa3)); b.position.set(t.x + sx * (half + 3.5 + i * 3.5), 6 + i * 9, TILT.depth + 0.2); b.rotation.z = sx * 0.6; g.add(b); } // arrows pointing at the slot
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(t.hall ? 22 : 40, t.hall ? 6.9 : 12.5), new THREE.MeshBasicMaterial({ map: signTexture(['TILT!', t.name]), side: THREE.DoubleSide }));
    if (t.hall) { sign.position.set(0, 55, TILT.depth + 0.3); g.add(sign); } // on the doorway's wall itself (indoors)
    else {
      sign.position.set(t.x, 46, 340); g.add(sign); // 340 m ahead of the wall (it rides with the group: z = −d)
      for (const sx of [-1, 1]) { const pole = new THREE.Mesh(cyl(0.5, 0.6, 52), lam(0xdfe6ee)); pole.position.set(t.x + sx * 21, 26, 340); g.add(pole); }
    }
    g.position.set(0, 0, -t.d);
    keepM(g);
    tilts.push({ g, t });
  }
  // A LOOP DOOR: flanking towers, a wall beam above, two gate leaves (they slide into the towers), the
  // name banner, and ahead of it the two golden KEY RINGS on the loop circle (+ their glow rails).
  function buildDoor(o, arc) {
    const look = DOOR_LOOK[o.look]; // v1.6 Star Fox's gates: a warp frame, a sunken gate, a corona gate, the fortress door
    const g = new THREE.Group(), stone = look ? look[0] : arc.id === 'snowfields' ? 0xc8d4e2 : arc.id === 'skycastles' ? 0xf4f2ec : 0x8a8478, roof = look ? look[1] : arc.id === 'skycastles' ? 0x2f6fe8 : 0xc0392b;
    for (const sx of [-1, 1]) {
      const t = new THREE.Mesh(cyl(7, 8, 96, 12), lam(stone)); t.position.set(sx * (DOOR.half + 7), 48, 0); g.add(t);
      const r = new THREE.Mesh(cone(9.5, 18, 12), lam(roof)); r.position.set(sx * (DOOR.half + 7), 105, 0); g.add(r);
    }
    const beam = new THREE.Mesh(box(DOOR.half * 2 + 6, 12, DOOR.depth + 3), lam(stone)); beam.position.set(0, DOOR.top + 6, 0); g.add(beam);
    const leaves = [];
    for (const sx of [-1, 1]) {
      const leaf = new THREE.Group();
      const slab = new THREE.Mesh(box(DOOR.half, DOOR.top, DOOR.depth), lam(look ? look[2] : 0x6b4423)); slab.position.set(sx * DOOR.half / 2, DOOR.top / 2, 0); leaf.add(slab);
      for (let i = 0; i < 6; i++) { const band = new THREE.Mesh(box(DOOR.half, 1.4, DOOR.depth + 0.4), lam(0x2a2d36)); band.position.set(sx * DOOR.half / 2, 8 + i * 13, 0); leaf.add(band); }
      const crest = new THREE.Mesh(new THREE.CircleGeometry(7, 20), basic(0xffc61a)); crest.position.set(sx * 3.5, 40, DOOR.depth / 2 + 0.3); leaf.add(crest);
      g.add(leaf); leaves.push({ leaf, sx });
    }
    const glowMat = basic(0xfff2a8, { transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(DOOR.half * 2, DOOR.top), glowMat); glow.position.set(0, DOOR.top / 2, 2); g.add(glow);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(46, 14), new THREE.MeshBasicMaterial({ map: signTexture([o.name, 'LOOP THROUGH BOTH KEYS!']), side: THREE.DoubleSide }));
    sign.position.set(0, DOOR.top + 22, 1); g.add(sign);
    g.position.set(0, 0, -o.d);
    keepM(g);
    // the key rings (gold, facing the plane) at the circle's mark, and glow rails along their windows
    const kg = new THREE.Group(), keyMat = basic(0xffd23f), railMat = basic(0xfff2a8, { transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
    const yb = o.y, ytop = o.y + LOOP_R_MIN + DOOR_LOOP_R, len = DOOR.before + DOOR.after;
    const rings = [];
    for (const [y, sy] of [[yb, 1], [ytop, (DOOR_LOOP_R - LOOP_R_MIN + DOOR.keyR) / DOOR.keyR]]) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(DOOR.keyR, 0.45, 8, 28), keyMat); r.scale.set(1, sy, 1); r.position.set(o.x, y, 0); kg.add(r); rings.push(r);
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, len, 6).rotateX(Math.PI / 2), railMat); rail.position.set(o.x, y - DOOR.keyR * sy, -(DOOR.after - DOOR.before) / 2); kg.add(rail);
      const tooth = new THREE.Mesh(box(1.2, 2.4, 0.6), keyMat); tooth.position.set(o.x + DOOR.keyR + 1, y - 1, 0); kg.add(tooth);
    }
    kg.position.set(0, 0, -o.loopD);
    keepM(kg);
    doors.push({ g, kg, o, leaves, glowMat, rings, flash: 0, wasOpen: 0 });
  }
  // A trebuchet (an arm on a pivot; it winds back, then throws).
  function buildTreb(sh) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(box(10, 2, 14), lam(0x5a3a22)); base.position.y = 1; g.add(base);
    for (const sz of [-4, 4]) for (const sx of [-1, 1]) { const leg = new THREE.Mesh(box(1, 14, 1), lam(0x7a5230)); leg.position.set(sx * 2.4, 8, sz); leg.rotation.z = -sx * 0.3; g.add(leg); }
    const pivot = new THREE.Group(); pivot.position.y = 14; g.add(pivot);
    const arm = new THREE.Mesh(box(1.2, 26, 1.2), lam(0x8a5a35)); arm.position.y = 6; pivot.add(arm);
    const cw = new THREE.Mesh(box(4, 4, 4), lam(0x3a3a3a)); cw.position.y = -6; pivot.add(cw);
    const sling = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 0), lam(0x8a8478)); sling.position.y = 19; pivot.add(sling);
    g.rotation.y = sh.x > 0 ? Math.PI / 2 : -Math.PI / 2; // the arm throws toward the corridor
    g.visible = false;
    keepM(g);
    trebs.push({ g, pivot, sling, sh });
  }

  // ── the dressing (§0): per 80 m chunk, PER items outside the corridor, from the arc's kit ──
  // (v1.6: only the kinds a world's kits use are built — KINDS is per world)
  let KINDS = [];
  const ALL_KINDS = ['pine', 'giantTree', 'canopy', 'vines', 'cabin', 'iceFall', 'stoneCircle', 'watchtower', 'ruin', 'mushrooms', 'tent', 'banner', 'siegeTower', 'wagon', 'regiment',
    'obsidian', 'nest', 'smoke', 'lavaFall', 'perchedDragon', 'bones', 'plateau', 'castle', 'bridge', 'waterfall', 'goldenSpire', 'goldenHouse'];
  const GOLD_KIT = ['goldenSpire', 'goldenHouse', 'banner', 'goldenSpire', 'goldenHouse', 'castle', 'goldenSpire', 'banner'];
  function buildDecor() {
    decor = {};
    KINDS = [...new Set([...arcs.flatMap((a) => a.kit), ...(run.golden ? GOLD_KIT : [])])];
    void ALL_KINDS;
    for (const k of KINDS) { const m = inst(decorGeo(k), VC, CH * PER); keepM(m); decor[k] = m; }
    for (const [k, [mat, w, h]] of Object.entries(SHEET)) { const m = inst(new THREE.PlaneGeometry(w, h), sheetMats[mat], CH * PER); keepM(m); sheetMeshes[k] = m; }
    flagMesh = inst(new THREE.PlaneGeometry(5, 3).translate(2.5, 0, 0), new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide, flatShading: true }), CH * PER);
    for (let i = 0; i < CH * PER; i++) flagMesh.setColorAt(i, _c.setHex(0xc0392b));
    keepM(flagMesh);
    sheetList = Object.values(sheetMeshes);
    smokeMesh = inst(new THREE.SphereGeometry(1, 8, 6), puffMat, CH * PER * 4);
    keepM(smokeMesh);
    attach = {};
    for (const k of KINDS) {
      const def = ATTACH[k];
      if (!def) continue;
      const mat = def.glow ? basic(def.glow, { transparent: true, opacity: def.anim === 'sweep' ? 0.08 : 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }) : VC;
      const m = inst(def.geo(), mat, CH * PER); keepM(m); attach[k] = { mesh: m, list: [], def };
    }
    animKinds = KINDS.filter((k) => DECOR_INFO[k]?.anim);
    for (const it of items) it.on = false;
    dressDirty = true;
  }
  // Rebuild every dressing kind's instances from the kept chunks' items, compacted (count = items).
  const kindCount = new Int32Array(64);
  function rebuildDressing() {
    dressDirty = false;
    kindCount.fill(0);
    flagList.length = 0; smokeList.length = 0; wagonList.length = 0; animList.length = 0;
    for (const a of Object.values(attach)) a.list.length = 0;
    const sheetCount = { iceFall: 0, lavaFall: 0, waterfall: 0 };
    for (const it of items) {
      if (!it.on) continue;
      const mesh = decor[it.kind], n = kindCount[it.ki]++;
      setI(mesh, n, it.x, it.y + it.lift, it.d, it.s, it.s, it.s, it.kind in SHEET || it.kind === 'bridge' ? it.facing : it.ry);
      if (SHEET[it.kind]) { const [, , , sx, sy, sz] = SHEET[it.kind], c = Math.cos(it.facing), sn = Math.sin(it.facing), sm = sheetMeshes[it.kind]; setI(sm, sheetCount[it.kind]++, it.x + (sx * c + sz * sn) * it.s, it.y + it.lift + sy * it.s, it.d - (-sx * sn + sz * c) * it.s, it.s, it.s, it.s, it.facing); }
      if (FLAGGED[it.kind]) { flagMesh.setColorAt(flagList.length, _c.setHex(it.col)); flagList.push(it); }
      if (SMOKY[it.kind]) smokeList.push(it);
      if (it.kind === 'wagon') { it.wi = n; wagonList.push(it); }
      if (DECOR_INFO[it.kind]?.anim) { it.wi = n; animList.push(it); }
      if (attach[it.kind]) attach[it.kind].list.push(it);
    }
    for (const a of Object.values(attach)) a.mesh.count = a.list.length;
    KINDS.forEach((k, i) => { decor[k].count = kindCount[i]; decor[k].instanceMatrix.needsUpdate = true; });
    for (const [k, m] of Object.entries(sheetMeshes)) { m.count = sheetCount[k]; m.instanceMatrix.needsUpdate = true; }
    flagMesh.count = flagList.length; if (flagMesh.instanceColor) flagMesh.instanceColor.needsUpdate = true;
    smokeMesh.count = smokeList.length * 4;
  }
  const FLAG_COLS = [0xc0392b, 0xffc61a, 0x2f6fe8, 0xffffff];
  function fillChunk(slot, k) {
    chunkK[slot] = k;
    dressDirty = true;
    const r = rng(k * 131 + 7), d0 = k * 80;
    const arc = arcs.find((a) => d0 >= a.from && d0 < a.to) ?? arcs[arcs.length - 1];
    const zone = Math.floor(d0 / 1000), G = run.golden, kit = G && d0 + 80 > G.d0 && d0 < G.d1 ? GOLD_KIT : arc.kit; // §6: the Golden City's own kit
    for (let j = 0; j < PER; j++) {
      const it = items[slot * PER + j];
      it.on = false;
      // the zone's own mix: a window of its arc's kit, shifted per zone (no two zones dress alike)
      const kind = kit[(zone * 3 + Math.floor(r() * 5)) % kit.length];
      const info = DECOR_INFO[kind]; // v1.6: how Star Fox's dressing floats + moves
      const side = j % 2 ? 1 : -1, far = kind === 'regiment' || kind === 'plateau' || kind === 'castle' || kind === 'bridge' || kind === 'waterfall' || info?.far ? 70 + r() * 70 : 36 + r() * 80;
      const x = side * far, d = d0 + r() * 80, s = 0.8 + r() * 0.6, ry = r() * Math.PI * 2;
      if (r() < 0.12 && kind !== 'pine') continue; // a little breathing room
      it.on = true; it.kind = kind; it.ki = KINDS.indexOf(kind); it.x = x; it.d = d; it.s = s; it.ry = ry;
      it.y = terrain.surfaceAt(x, d, Infinity);
      it.facing = side > 0 ? -Math.PI / 2 : Math.PI / 2; // falls / walls face the corridor
      it.lift = kind === 'plateau' || kind === 'castle' || kind === 'waterfall' || kind === 'bridge' ? 8 + r() * 14 : info?.lift ? info.lift[0] + r() * (info.lift[1] - info.lift[0]) : 0;
      it.ph = r() * 80; it.col = FLAG_COLS[(zone + j) % FLAG_COLS.length];
    }
  }

  // ── the world switch ──
  function build(newRun, newStage, newTerrain) {
    clear();
    run = newRun; stage = newStage; terrain = newTerrain; arcs = stage?.theme.arcs ?? null;
    if (!run || !arcs) return;
    const K = run.skin; // v1.6 a stage's reskin of the shared shots: plasma, laser bolts, solar flares
    if (K) { fireCore.material.color.setHex(K.fire[0]); fireGlow.material.color.setHex(K.fire[1]); lavaCore.material.color.setHex(K.lava[0]); lavaGlow.material.color.setHex(K.lava[1]); bolts.material.color.setHex(K.bolt); boltGlow.material.color.setHex(K.bolt); }
    const arcAt = (d) => arcs.find((a) => d >= a.from && d < a.to) ?? arcs[arcs.length - 1];
    for (const kind of new Set(run.rows.map((r) => r.kind))) {
      const rows = run.rows.filter((r) => r.kind === kind);
      const mesh = inst(postGeo(kind), VC, 96);
      keepM(mesh);
      posts[kind] = { mesh, rows };
      postList.push(posts[kind]);
    }
    for (const t of run.tilts) buildTilt(t, arcAt(t.d));
    for (const o of run.doors) buildDoor(o, arcAt(o.d));
    for (const sh of run.shooters) if (sh.kind === 'trebuchet') buildTreb(sh);
    buildAddendum(arcAt);
    if (run.transitions.length || run.water.length || run.fortress) sfLayer = createSFLayer({ keepM, scene, fx, terrain, run, sheetMats, arcs });
    // perches under the perched dragons (stone pillars / dark rock spires, outside the corridor)
    const perches = run.shooters.filter((s) => s.kind === 'dragon' && !s.patrol && !s.look); // (v1.6 Star Fox's flyers hover)
    const perchMesh = inst(merged([[cyl(3.4, 4.4, 1, 8), 0xffffff, [0, 0.5, 0]], [cyl(4.6, 4.6, 1.2, 8), 0xdddddd, [0, 1, 0]]]), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), perches.length);
    perches.forEach((sh, i) => { const h = terrain.surfaceAt(sh.x, sh.d, Infinity), top = sh.y - 3.5; setI(perchMesh, i, sh.x, h, sh.d, 1, Math.max(1, top - h), 1); perchMesh.setColorAt(i, _c.setHex(arcAt(sh.d).rock)); });
    keepM(perchMesh);
    // war-wind lanes: a gold chevron ribbon along the bottom of each lane
    for (const l of run.lanes) {
      const geo = new THREE.PlaneGeometry(l.w, l.d1 - l.d0).rotateX(-Math.PI / 2), uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (l.w / 10), uv.getY(i) * ((l.d1 - l.d0) / 10));
      const m = new THREE.Mesh(geo, laneMat); m.position.set(l.x, l.y0, -(l.d0 + l.d1) / 2); m.visible = false;
      keepM(m); lanes.push({ m, l });
    }
    // river / ice / lava strips in the lap's ditches (looks only), a few near the plane
    for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(300, 1, 1, 1).rotateX(-Math.PI / 2), sheetMats.water); m.visible = false; keepM(m); strips.push(m); }
    // the Dragon model pool: shooters, wild dragons, and the spectacle moments
    POOL = run.skin ? 5 : 8; // (v1.6: a reskinned stage's fighters are many-part models — a smaller pool, drawn nearer)
    for (let i = 0; i < POOL + SPEC_POOL; i++) {
      const f = buildFlyer(run.skin?.flyer ?? 'dragon'); // v1.6: Star Fox flies its enemy fighters from the same pool
      const mats = new Set();
      f.root.traverse((o) => { if (o.material && o.material.isMeshLambertMaterial) mats.add(o.material); });
      f.root.visible = false;
      keepM(f.root);
      dragons.push({ f, who: null, mats: [...mats], tint: -1 });
    }
    buildDecor();
  }

  const tintDragon = (dr, hex) => { if (dr.tint === hex) return; dr.tint = hex; for (const m of dr.mats) m.color.setHex(hex); };
  // Claim a pool dragon for `who` (a stable key), or null when the pool is busy.
  function dragonFor(who, from, to) {
    for (let i = from; i < to; i++) if (dragons[i].who === who) return dragons[i];
    for (let i = from; i < to; i++) if (dragons[i].who === null) { dragons[i].who = who; return dragons[i]; }
    return null;
  }

  // ───────────────────────── §6 THE ADDENDUM ─────────────────────────
  // Archers (scaled up ×2.2 to read at range): an elf, a castle archer, a cavalry bowman on his horse.
  const FIG = {
    elf: () => merged([[box(0.8, 1.5, 0.5), 0x2f6b3a, [0, 0.95, 0]], [box(0.9, 0.2, 0.6), 0x5a3a22, [0, 0.9, 0]], [ico(0.34, 0), 0xf0d0b0, [0, 1.95, 0]], [cone(0.42, 0.8, 6), 0x3f8a3a, [0, 2.45, 0]],
      [new THREE.TorusGeometry(0.85, 0.06, 4, 10, Math.PI), 0x7a5230, [0.1, 1.45, 0.55], [0, 0, Math.PI / 2]], [box(0.02, 1.7, 0.02), 0xf4f2ec, [0.1, 1.45, 0.55]], [box(0.3, 0.9, 0.3), 0x2a4a2a, [0, 0.35, 0]]]),
    knight: () => merged([[box(0.9, 1.5, 0.55), 0xc0392b, [0, 0.95, 0]], [box(0.95, 0.5, 0.6), 0xc8ccd4, [0, 1.55, 0]], [cyl(0.32, 0.36, 0.5, 8), 0xc8ccd4, [0, 2.0, 0]], [box(0.5, 0.08, 0.1), 0x1a1a1a, [0, 2.0, 0.33]],
      [new THREE.TorusGeometry(0.9, 0.07, 4, 10, Math.PI), 0x5a3a22, [0.1, 1.45, 0.6], [0, 0, Math.PI / 2]], [box(0.02, 1.8, 0.02), 0xf4f2ec, [0.1, 1.45, 0.6]], [box(0.35, 0.9, 0.35), 0x3a3a44, [0, 0.35, 0]], [box(0.12, 0.6, 0.12), 0xffc61a, [0, 1.0, 0.3]]]),
    cavalry: () => merged([[box(1.1, 1.1, 2.6), 0x6b4423, [0, 1.6, 0]], [box(0.55, 1.1, 0.6), 0x6b4423, [0, 2.3, 1.35], [0.5, 0, 0]], [box(0.45, 0.45, 0.9), 0x5a3a22, [0, 2.85, 1.85]],
      ...[[-0.4, -1], [0.4, -1], [-0.4, 1], [0.4, 1]].map(([x, z]) => [box(0.25, 1.2, 0.25), 0x4a2e18, [x, 0.6, z]]), [box(0.2, 0.9, 0.2), 0x2a1a10, [0, 1.9, -1.4], [-0.6, 0, 0]], [box(1.2, 0.2, 1.2), 0xc0392b, [0, 2.2, 0]],
      [box(0.7, 1.1, 0.45), 0x2f6fe8, [0, 2.85, 0]], [ico(0.3, 0), 0xf0d0b0, [0, 3.65, 0]], [cyl(0.3, 0.32, 0.3, 8), 0xc8ccd4, [0, 3.85, 0]],
      [new THREE.TorusGeometry(0.8, 0.06, 4, 10, Math.PI), 0x7a5230, [0.1, 3.0, 0.5], [0, 0, Math.PI / 2]], [box(0.02, 1.6, 0.02), 0xf4f2ec, [0.1, 3.0, 0.5]]]),
  };
  // v1.6 a laser turret: a domed gun housing with twin barrels (Star Fox's archers)
  FIG.turret = () => merged([[cyl(0.9, 1.1, 1, 10), 0x6a707c, [0, 0.5, 0]], [new THREE.SphereGeometry(0.9, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0x8a92a0, [0, 1, 0]],
    ...[-0.25, 0.25].map((x) => [cyl(0.1, 0.1, 1.6, 6), 0x3a3e46, [x, 1.4, 0.9], [Math.PI / 2, 0, 0]]), [box(0.3, 0.2, 0.2), 0xff3a3a, [0, 1.75, 0.4]]]);
  // v1.7 a four-legged WALKER (its chin guns are the muzzle; drawn at 2.2 ×, so ≈ 30 m tall): Star Wars' ice-world archers
  FIG.walker = () => merged([[box(4.4, 3, 7), 0x9aa0a8, [0, 0.6, -1.6]], [box(2, 1.8, 2.4), 0x9aa0a8, [0, 0.4, 2.4]], ...[-0.4, 0.4].map((x) => [cyl(0.08, 0.08, 1, 6), 0x3a3e46, [x, 0.1, 3.9], [Math.PI / 2, 0, 0]]),
    ...[[-1.6, -4], [1.6, -4], [-1.6, 0.8], [1.6, 0.8]].map(([x, z]) => [box(0.6, 11, 0.6), 0x4a4e56, [x, -5.4, z]])]);
  const tor = (R, r, rs = 6, ts = 18) => new THREE.TorusGeometry(R, r, rs, ts);
  const HALL_ROOF = 64, HALL_TOP = 72;
  // The interiors' palettes + their outsides: Dragon War's castle hall (v1.5 §6), Star Fox's GREAT PYRAMID
  // (sandstone, lapis and gold; the pyramid rises over its entrance) and FORTRESS (dark armour, red lights).
  const HALL_PAL = {
    castle: { stone: 0x9a9488, dark: 0x7a756c, trim: 0xffc61a, carpet: 0x9a1f1a, pillar: 0xd8d4cc, banners: [0xc0392b, 0x2f6fe8], window: 0xffe8a0, roof: 0x4a3020, beam: 0x2a1a10, sign: '#3a1a10', torch: 0xffa23f,
      towers: (P, x, d) => { P(cyl(6, 6.6, 92, 12), 0xf6ead0, x, 46, d); P(new THREE.SphereGeometry(6.4, 12, 8), 0xffc61a, x, 94, d); P(cone(1, 10, 6), 0xffc61a, x, 104, d); },
      facade: (P, H) => P(cone(H.outer + 4, 14, 4), 0xffc61a, 0, HALL_TOP + 7, H.d0, [0, Math.PI / 4, 0], [1, 1, 0.12]) },
    pyramid: { stone: 0xd8b070, dark: 0xb08a50, trim: 0xffc61a, carpet: 0x2f4fa8, pillar: 0xe8c890, banners: [0x2f6fe8, 0xc0392b], window: 0xfff2c0, roof: 0x8a6a3a, beam: 0x6a4a2a, sign: '#4a3010', torch: 0xffa23f,
      towers: (P, x, d) => { P(cyl(3, 6, 80, 4), 0xd8b070, x, 40, d, [0, Math.PI / 4, 0]); P(cone(4.2, 10, 4), 0xffc61a, x, 85, d, [0, Math.PI / 4, 0]); },
      facade: (P, H) => {
        P(cone(200, 130, 4), 0xe2b56a, 0, 65, H.d0 + 150, [0, Math.PI / 4, 0]); P(cone(18, 12, 4), 0xffc61a, 0, 126, H.d0 + 150, [0, Math.PI / 4, 0]);
        P(cone(130, 86, 4), 0xd8a858, 0, 43, H.d1 - 90, [0, Math.PI / 4, 0]);
        for (let d = H.d0 + 300; d < H.d1 - 180; d += 60) for (const sx of [-1, 1]) P(box(10, 26, 58), 0xd0a860, sx * (H.outer + 5), HALL_TOP - 4, d, [0, 0, sx * 0.5]); // the long gallery's sloped stone roof
      } },
    fortress: { stone: 0x3a2a30, dark: 0x2a1e24, trim: 0xff3a3a, carpet: 0x5a1a1a, pillar: 0x4a3a40, banners: [0x6a1a1a, 0x2a2a3a], window: 0xff6a3a, roof: 0x1e1418, beam: 0x140c10, sign: '#3a0a0a', torch: 0xff3a2a,
      towers: (P, x, d) => { P(cyl(5, 7, 96, 8), 0x2a1e24, x, 48, d); P(cone(6, 22, 8), 0x3a2a30, x, 107, d); P(new THREE.SphereGeometry(1.4, 8, 6), 0xff3a3a, x, 119, d); },
      facade: (P, H) => {
        P(box(H.outer * 2 + 24, 20, 10), 0x2a1e24, 0, HALL_TOP + 8, H.d0 + 4);
        for (let i = 0; i < 9; i++) P(cone(2, 9, 4), 0x3a2a30, -36 + i * 9, HALL_TOP + 22, H.d0 + 4);
        for (const sx of [-1, 1]) P(box(3, 3, 0.6), 0xff3a3a, sx * 20, HALL_TOP + 8, H.d0 - 1.2);
      } },
  };
  // v1.7 Star Wars' interiors: THE ICE CAVE (crystal halls, ice-blue light), THE SHIELD BUNKER (concrete,
  // green status lights) and THE TRENCH (station steel, open to the stars: `open` = no roof).
  HALL_PAL.iceCave = { stone: 0xc8dcf0, dark: 0x9ab4d0, trim: 0x8ad8ff, carpet: 0xe8f4ff, pillar: 0xe0f0ff, banners: [0x8ad8ff, 0xffffff], window: 0xbfe8ff, roof: 0x8aa8c8, beam: 0x6a88a8, sign: '#2a4a6a', torch: 0x8ad8ff,
    towers: (P, x, d) => { P(cone(6, 70, 5), 0xd8f0ff, x, 35, d); P(cone(3, 30, 5), 0xbfe0ff, x + 4, 15, d); },
    facade: (P, H) => { P(cone(80, 70, 7), 0xf4f8ff, 0, 34, H.d0 + 60); for (let i = 0; i < 7; i++) P(cone(2, 9, 5), 0xd8f0ff, -24 + i * 8, 58, H.d0 - 1, [Math.PI, 0, 0]); } };
  HALL_PAL.bunker = { stone: 0x6a6a5e, dark: 0x4a4a40, trim: 0x3aff5a, carpet: 0x3a3a34, pillar: 0x5a5a50, banners: [0x3a5a3a, 0x4a4a40], window: 0x8aff9a, roof: 0x3a3a34, beam: 0x2a2a24, sign: '#1a2a1a', torch: 0x3aff5a,
    towers: (P, x, d) => { P(box(10, 40, 10), 0x5a5a50, x, 20, d); P(box(12, 3, 12), 0x3a3a34, x, 41, d); },
    facade: (P, H) => { P(box(H.outer * 2 + 10, 14, 30), 0x2a5a2a, 0, HALL_TOP + 7, H.d0 + 14); for (let i = 0; i < 6; i++) P(cone(4, 10, 6), 0x2a6a2a, -30 + i * 12, HALL_TOP + 18, H.d0 + 8); } };
  HALL_PAL.trench = { open: true, stone: 0x6a707c, dark: 0x4a4e56, trim: 0xc8e0ff, carpet: 0x3a3e46, pillar: 0x8a909a, banners: [0x4a4e56, 0x5a5e66], window: 0xc8e0ff, roof: 0x3a3e46, beam: 0x2a2e36, sign: '#1a1e2a', torch: 0xff3a3a,
    towers: (P, x, d) => { P(box(8, 90, 8), 0x7a808a, x, 45, d); P(box(10, 2, 10), 0x4a4e56, x, 91, d); },
    facade: (P, H) => { for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) P(box(6, 3 + (i % 3) * 2, 6), 0x4a4e56, sx * (H.half + 4 + i * 2.6), HALL_TOP + 1.5, H.d0 + 10 + i * 18); } };
  function buildAddendum(arcAt) {
    // ── the archers + what they stand on (static, except the cavalry who ride their paths) ──
    const A = run.shooters.filter((sh) => sh.kind === 'archer');
    const by = (look) => A.filter((sh) => (sh.look ?? 'castle') === look);
    const face = (sh) => (sh.x > 0 ? -Math.PI / 2 : Math.PI / 2);
    // (v1.6 Star Fox: laser TURRETS on pylons, DEFENSE PLATFORMS hovering in space, gantry turrets indoors)
    for (const [look, geo] of [['elf', FIG.elf()], ['castle', FIG.knight()], ['hall', run.skin ? FIG.turret() : FIG.knight()], ['turret', FIG.turret()], ['platform', FIG.turret()], ['walker', FIG.walker()]]) {
      const list = by(look);
      if (!list.length) continue;
      const m = inst(geo, VC, list.length);
      list.forEach((sh, i) => setI(m, i, sh.x, sh.y - 1.2, sh.d, 2.2, 2.2, 2.2, face(sh)));
      m.count = list.length; keepM(m);
      // their bases: canopy platforms on a trunk (elves), a tower top (castle), a balcony (the hall)
      const trunk = inst(look === 'elf' ? merged([[cyl(1.3, 1.6, 1, 8), 0x5a3a22, [0, 0.5, 0]]]) : look === 'turret' ? merged([[cyl(1.6, 2.4, 1, 8), 0x6a707c, [0, 0.5, 0]]]) : merged([[cyl(3.2, 3.5, 1, 10), 0xf4f2ec, [0, 0.5, 0]]]), VC, list.length);
      const top = inst(look === 'turret' ? merged([[cyl(3, 3, 0.8, 10), 0x5a606c, [0, -0.4, 0]], [box(0.6, 0.6, 0.6), 0xff3a3a, [2.6, 0.2, 0]]])
        : look === 'platform' ? merged([[cyl(5, 3.4, 1.6, 10), 0x6a707c, [0, -0.8, 0]], [tor(5.2, 0.3), 0xffc61a, [0, -0.2, 0], [Math.PI / 2, 0, 0]], [cone(2.4, 5, 8), 0x4a505c, [0, -4, 0], [Math.PI, 0, 0]], ...[0, 1, 2, 3].map((i) => [box(0.5, 0.5, 0.5), 0x5fd8ff, [Math.cos(i * 1.57) * 4.6, -1, Math.sin(i * 1.57) * 4.6]])])
        : look === 'elf'
        ? merged([[cyl(3.4, 3.4, 0.6, 10), 0x7a5230, [0, 0, 0]], ...Array.from({ length: 8 }, (_, i) => [box(0.15, 1.1, 0.15), 0x5a3a22, [Math.cos(i * 0.785) * 3.2, 0.6, Math.sin(i * 0.785) * 3.2]]), [ico(6, 1), 0x2f7a35, [0, 9, 0], [0, 0, 0], [1, 0.45, 1]], [ico(3.5, 0), 0x3f9a3a, [3, 7.5, 2]]])
        : look === 'castle'
          ? merged([[cyl(3.8, 3.8, 1.2, 10), 0xd8d4cc, [0, -0.6, 0]], ...Array.from({ length: 8 }, (_, i) => [box(1.1, 1.4, 1.1), 0xd8d4cc, [Math.cos(i * 0.785) * 3.3, 0.7, Math.sin(i * 0.785) * 3.3]]), [box(0.3, 7, 0.3), 0xdfe6ee, [-2, 3.5, -2]], [box(3, 1.8, 0.12), 0xc0392b, [-0.4, 6, -2]]])
          : merged([[box(5, 0.8, 11), 0x8a8478, [0, -0.4, 0]], ...[-4.5, -1.5, 1.5, 4.5].map((z) => [box(0.3, 1.2, 0.3), 0xffc61a, [0, 0.6, z]]), [box(0.2, 0.2, 11), 0xffc61a, [0, 1.2, 0]], ...[-4, 4].map((z) => [cone(1.6, 3, 4), 0x6a645a, [1.6, -2.2, z], [Math.PI, 0, 0]])]), VC, list.length);
      list.forEach((sh, i) => {
        const g = terrain.surfaceAt(sh.x, sh.d, Infinity), h = sh.y - 1.2 - g;
        if (look === 'hall' || look === 'platform' || look === 'walker') setI(trunk, i, 0, -100, sh.d, 0, 0, 0); else setI(trunk, i, sh.x, g, sh.d, 1, Math.max(1, h), 1);
        if (look === 'walker') setI(top, i, 0, -100, sh.d, 0, 0, 0); else setI(top, i, look === 'hall' ? Math.sign(sh.x) * 15.6 : sh.x, sh.y - 1.2, sh.d, 1, 1, 1, look === 'hall' ? 0 : face(sh));
      });
      trunk.count = top.count = list.length; keepM(trunk); keepM(top);
      archerMeshes.push({ meshes: [m, trunk, top], list });
    }
    cavalry = by('cavalry');
    if (cavalry.length) { riderMesh = inst(FIG.cavalry(), VC, cavalry.length); riderMesh.count = 0; keepM(riderMesh); }
    // ── THE GREAT HALL ──
    // (v1.6: every interior — Dragon War's castle hall, Star Fox's pyramid and fortress — in its own palette)
    for (const H of run.halls) {
      const pal = HALL_PAL[H.look ?? 'castle'];
      const L = H.d1 - H.d0, STONE = pal.stone, DK = pal.dark, GOLDC = pal.trim, parts = [];
      const myGaps = run.gaps.filter((g) => g.d > H.d0 && g.d < H.d1);
      const P = (geo, c, x, y, d, rot, sc) => parts.push([geo, c, [x, y, -d], rot, sc]);
      P(box(H.outer * 2, H.floor - 0.1, L), STONE, 0, (H.floor - 0.1) / 2, (H.d0 + H.d1) / 2);                    // the raised floor (its top is the terrain's own, drawn by world.js)
      P(box(9, 0.12, L - 8), pal.carpet, 0, H.floor + 0.07, (H.d0 + H.d1) / 2);                                   // the carpet
      for (const sx of [-1, 1]) P(box(0.5, 0.14, L - 8), GOLDC, sx * 4.7, H.floor + 0.08, (H.d0 + H.d1) / 2);
      for (let d = H.d0 + 12; d < H.d1; d += 24) P(box(H.half * 2 - 1, 0.1, 0.3), DK, 0, H.floor + 0.05, d);       // flagstone joints
      for (const sx of [-1, 1]) {
        P(box(H.outer - H.half, HALL_TOP - H.floor, L), STONE, sx * (H.half + H.outer) / 2, (H.floor + HALL_TOP) / 2, (H.d0 + H.d1) / 2); // the side walls
        P(box(H.outer - H.door.half, HALL_TOP, 3), STONE, sx * (H.door.half + H.outer) / 2, HALL_TOP / 2, H.d0);  // the facade either side of the doorway
        for (const d of [H.d0, H.d1]) pal.towers(P, sx * (H.outer + 5), d);
        for (let d = H.d0 + 25; d < H.d1 - 10; d += 50) { // engaged pillars, banners between them, torches
          P(cyl(0.9, 1.1, HALL_ROOF - H.floor, 10), pal.pillar, sx * 17.2, (H.floor + HALL_ROOF) / 2, d); P(box(2.6, 1.2, 2.6), GOLDC, sx * 17.2, HALL_ROOF - 0.6, d); P(box(2.6, 1, 2.6), DK, sx * 17.2, H.floor + 0.5, d);
          P(box(0.12, 13, 3.4), pal.banners[(d / 50) % 2 ? 0 : 1], sx * 17.9, H.floor + 18, d + 25); P(box(0.14, 1, 3.6), GOLDC, sx * 17.85, H.floor + 11, d + 25); P(box(0.14, 2.4, 0.5), GOLDC, sx * 17.85, H.floor + 19, d + 25);
          P(box(0.6, 0.5, 0.6), 0x3a2a1a, sx * 17.6, H.floor + 9, d + 12); P(box(0.25, 1.2, 0.25), 0x3a2a1a, sx * 17.6, H.floor + 8.3, d + 12);
          P(box(0.1, 6, 2.2), pal.window, sx * 17.95, H.floor + 28, d + 37);                                       // the high windows
        }
      }
      P(box(H.door.half * 2, HALL_TOP - H.door.y1, 3), STONE, 0, (H.door.y1 + HALL_TOP) / 2, H.d0);               // over the doorway
      P(box(H.door.half * 2, H.door.y0, 3), STONE, 0, H.door.y0 / 2, H.d0);                                       // under it (the floor's face)
      for (const sx of [-1, 1]) P(box(0.8, H.door.y1 - H.door.y0, 3.4), GOLDC, sx * (H.door.half + 0.4), (H.door.y0 + H.door.y1) / 2, H.d0);
      P(box(H.door.half * 2 + 1.6, 0.8, 3.4), GOLDC, 0, H.door.y1 + 0.4, H.d0);
      pal.facade(P, H);                                                                                            // the pediment / pyramid / bastion
      P(box(H.outer * 2, HALL_TOP - FLIGHT.ceiling, 3), STONE, 0, (FLIGHT.ceiling + HALL_TOP) / 2, H.d1);               // the exit lintel (above the ceiling)
      P(box(H.half * 2, 0.8, 3.4), GOLDC, 0, FLIGHT.ceiling - 0.4, H.d1);
      // the roof — planes facing DOWN only, so the camera always sees in from above (FrontSide); v1.7: none over an open trench
      if (!pal.open) P(new THREE.PlaneGeometry(H.half * 2 + 2, L).rotateX(Math.PI / 2), pal.roof, 0, HALL_ROOF, (H.d0 + H.d1) / 2);
      if (!pal.open) for (let d = H.d0 + 10; d < H.d1; d += 25) P(new THREE.PlaneGeometry(H.half * 2, 1.6).rotateX(Math.PI / 2), pal.beam, 0, HALL_ROOF - 0.3, d);
      if (pal.open) for (let d = H.d0 + 20; d < H.d1; d += 40) for (const sx of [-1, 1]) P(box(0.4, 1.2 + (d % 3), 6 + (d % 5)), (d / 40) % 2 ? pal.dark : pal.window, sx * (H.half - 0.15), H.floor + 6 + ((d * 7) % 40), d); // greeble panels on the trench walls
      // the gap walls: one opening each (DIVE low / CLIMB high), a gold frame
      for (const g of myGaps) {
        const y0 = g.y - g.h / 2, y1 = g.y + g.h / 2, xl = g.x - g.w / 2, xr = g.x + g.w / 2, D = GAP.depth;
        P(box(xl + H.half, HALL_ROOF - H.floor, D), DK, (xl - H.half) / 2, (H.floor + HALL_ROOF) / 2, g.d);
        P(box(H.half - xr, HALL_ROOF - H.floor, D), DK, (xr + H.half) / 2, (H.floor + HALL_ROOF) / 2, g.d);
        P(box(g.w, y0 - H.floor, D), DK, g.x, (H.floor + y0) / 2, g.d);
        P(box(g.w, HALL_ROOF - y1, D), DK, g.x, (y1 + HALL_ROOF) / 2, g.d);
        for (const [w, h, x, y] of [[g.w + 1.2, 0.6, g.x, y0 - 0.3], [g.w + 1.2, 0.6, g.x, y1 + 0.3], [0.6, g.h, xl - 0.3, g.y], [0.6, g.h, xr + 0.3, g.y]]) P(box(w, h, D + 0.3), GOLDC, x, y, g.d);
      }
      const hallG = new THREE.Group();
      hallG.add(new THREE.Mesh(merged(parts), VC));
      const sign = (lines, w, x, y, d) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.3125), new THREE.MeshBasicMaterial({ map: signTexture(lines, '#ffffff', pal.sign), side: THREE.DoubleSide })); m.position.set(x, y, -d); hallG.add(m); };
      sign([H.name, 'THROUGH THE DOORWAY!'], 26, 0, H.door.y1 + 6.5, H.d0 - 1.8);
      for (const g of myGaps) sign([g.move === 'dive' ? 'DIVE!' : 'CLIMB!'], 12, g.x, g.move === 'dive' ? g.y + g.h / 2 + 5 : g.y - g.h / 2 - 4.5, g.d - GAP.depth / 2 - 0.1);
      // torchlight: flames (a flickering shared material) on the wall brackets
      const myTorch = basic(pal.torch, { transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }); torchMats.push(myTorch);
      const torchD = [];
      for (const sx of [-1, 1]) for (let d = H.d0 + 37; d < H.d1 - 10; d += 50) torchD.push([sx * 17.6, d]);
      const flames = inst(merged([[cone(0.45, 1.3, 6), 0xffffff, [0, 0.65, 0]], [new THREE.SphereGeometry(0.9, 8, 6), 0xff7a1a, [0, 0.5, 0]]]), myTorch, torchD.length);
      torchD.forEach(([x, d], i) => setI(flames, i, x, H.floor + 9.3, d, 1, 1, 1));
      flames.count = torchD.length;
      hallG.add(flames);
      hallG.visible = false;
      keepM(hallG);
      hallGs.push({ g: hallG, H });
    }
    // ── THE SHELTER: a mountainside cave, a tunnel through the rock ──
    for (const C of run.caves) { // (v1.6: + Star Fox's WATERFALL CAVES — a falls pours over each mouth)
      const R = C.falls ? 0x6a7068 : 0x3a2e2c, R2 = C.falls ? 0x56604f : 0x2a2224, parts = [], len = C.d1 - C.d0, dm = (C.d0 + C.d1) / 2;
      const behind = C.cx > 0 ? C.x1 + 40 : C.x0 - 40, sideOut = C.cx > 0 ? 1 : -1;
      const P = (geo, c, x, y, d, rot, sc) => parts.push([geo, c, [x, y, -d], rot, sc]);
      P(box(C.lane[0] - C.x0, C.top, len), R, (C.x0 + C.lane[0]) / 2, C.top / 2, dm);
      P(box(C.x1 - C.lane[1], C.top, len), R, (C.lane[1] + C.x1) / 2, C.top / 2, dm);
      P(box(C.lane[1] - C.lane[0], C.top - C.roof, len), R, (C.lane[0] + C.lane[1]) / 2, (C.roof + C.top) / 2, dm);
      for (let i = 0; i < 7; i++) P(new THREE.DodecahedronGeometry(9 + (i % 3) * 3, 0), i % 2 ? R : R2, C.x0 + 4 + (i * 4) % (C.x1 - C.x0 - 6), C.top + 2 + (i % 2) * 3, C.d0 + 14 + i * (len - 28) / 6, [i, i * 0.7, 0], [1, 0.7, 1]);
      P(cone(42, 78, 7), R2, behind, 39, dm + 40);                                                                // the mountainside behind it
      P(cone(18, 30, 6), R, behind - sideOut * 6, 92, dm + 40);
      P(box(C.lane[1] - C.lane[0] + 2, 0.8, 1.2), 0xffc61a, (C.lane[0] + C.lane[1]) / 2, C.roof + 0.4, C.d0 - 0.4); // the mouth's beam
      for (const x of C.lane) P(box(0.8, C.roof, 1.2), 0x5a3a22, x, C.roof / 2, C.d0 - 0.4);
      const caveG = new THREE.Group();
      caveG.add(new THREE.Mesh(merged(parts), VC));
      caveGs.push({ g: caveG, C });
      if (C.falls) { // the falls: a curtain over the mouth from the clifftop, a splash pool below, a mist glow
        const wide = C.lane[1] - C.lane[0] + 10, fallsM = new THREE.Mesh(new THREE.PlaneGeometry(wide, C.top + 4), sheetMats.water);
        fallsM.position.set(C.cx, (C.top + 4) / 2, -(C.d0 - 1.2)); caveG.add(fallsM);
        const pool = new THREE.Mesh(new THREE.CircleGeometry(wide * 0.6, 18).rotateX(-Math.PI / 2), basic(0xd8f6ff, { transparent: true, opacity: 0.7, depthWrite: false }));
        pool.position.set(C.cx, terrain.surfaceAt(C.cx, C.d0 - 8, Infinity) + 0.3, -(C.d0 - 8)); caveG.add(pool);
        caveG.visible = false; keepM(caveG);
        continue;
      }
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(16, 5), new THREE.MeshBasicMaterial({ map: signTexture([C.name], '#ffffff', '#6a1a0a'), side: THREE.DoubleSide }));
      sign.position.set((C.lane[0] + C.lane[1]) / 2, C.roof + 5, -(C.d0 - 0.8)); caveG.add(sign);
      const way = new THREE.Mesh(new THREE.PlaneGeometry(22, 6.9), new THREE.MeshBasicMaterial({ map: signTexture([`${C.name} →`, 'IN THE CAVE, LOW'], '#ffffff', '#6a1a0a'), side: THREE.DoubleSide }));
      way.position.set(14, 30, -(C.d0 - 320)); caveG.add(way);
      for (const sx of [-1, 1]) { const pole = new THREE.Mesh(cyl(0.4, 0.5, 34), lam(0x3a2a1a)); pole.position.set(14 + sx * 10, 15, -(C.d0 - 320)); caveG.add(pole); }
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(C.lane[1] - C.lane[0], C.roof), basic(0xff8a3a, { transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.position.set((C.lane[0] + C.lane[1]) / 2, C.roof / 2, -(C.d1 + 0.5)); caveG.add(glow);   // the far mouth (light at the end of the tunnel)
      caveG.visible = false;
      keepM(caveG);
    }
    // ── THE LAVA WAVE: a moving wall of lava with a curling crest ──
    const W = run.wave;
    if (W) {
      waveG = new THREE.Group();
      const body = new THREE.Mesh(box(14, 34, 380), sheetMats.lava); body.position.y = 17; waveG.add(body);
      const crest = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 380, 10, 1, false, 0, Math.PI).rotateX(Math.PI / 2), sheetMats.lava); crest.position.set(0, 34, 0); crest.rotation.z = (W.from ?? 1) > 0 ? -Math.PI / 2 : Math.PI / 2; waveG.add(crest);
      const front = new THREE.Mesh(new THREE.PlaneGeometry(380, 46).rotateY(Math.PI / 2), basic(0xff5a1a, { transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      front.position.set(-(W.from ?? 1) * 8, 23, 0); waveG.add(front);
      waveG.position.z = -W.d;
      waveG.visible = false;
      keepM(waveG);
    }
    // ── THE GOLDEN CITY's great plaza: gold + white paving round the goal ──
    const G = run.golden;
    if (G) {
      const nx = 14, nz = 12, T = 9;
      plazaMesh = new THREE.InstancedMesh(box(T - 0.3, 0.4, T - 0.3), lam(0xffffff), nx * nz);
      let i = 0;
      for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++, i++) {
        const x = (a - (nx - 1) / 2) * T, d = G.plaza + (b - (nz - 1) / 2) * T;
        setI(plazaMesh, i, x, terrain.surfaceAt(x, d, Infinity) + 0.1, d, 1, 1, 1);
        plazaMesh.setColorAt(i, _c.setHex((a + b) % 2 ? 0xffd23f : 0xf6ead0));
      }
      plazaMesh.frustumCulled = false; plazaMesh.visible = false;
      keepM(plazaMesh);
    }
  }
  function updateAddendum(planeD, t, dt, lo, hi) {
    for (const g of archerMeshes) { // a look's archers are drawn only while one of them is near
      let near = false;
      for (const sh of g.list) if (sh.d > lo - 60 && sh.d < hi) { near = true; break; }
      for (const m of g.meshes) m.visible = near;
    }
    if (riderMesh) { // the cavalry ride their deterministic paths (patrolX)
      let n = 0;
      for (const sh of cavalry) {
        if (sh.d < lo - 60 || sh.d > hi) continue;
        const x = patrolX(sh, t), back = Math.cos((2 * Math.PI * t) / sh.patrol[1] + (sh.patrol[2] ?? 0)) >= 0 ? 0 : Math.PI; // facing the way they ride
        setI(riderMesh, n++, x, terrain.surfaceAt(x, sh.d, Infinity) + 0.15 * Math.abs(Math.sin(clock * 9 + sh.id)), sh.d, 2.2, 2.2, 2.2, Math.PI / 2 + back);
      }
      riderMesh.count = n; riderMesh.instanceMatrix.needsUpdate = true;
    }
    for (const h of hallGs) h.g.visible = h.H.d1 > lo && h.H.d0 < hi + 200;
    for (const m of torchMats) m.opacity = 0.75 + 0.2 * Math.sin(clock * 13) * Math.sin(clock * 7.3);
    for (const c of caveGs) c.g.visible = c.C.d1 > lo && c.C.d0 - 340 < hi;
    if (waveG) { // tied to the plane's own progress: it reaches the line exactly as the plane reaches W.d
      const W = run.wave, from = W.from ?? 1;
      waveG.visible = planeD > W.warn - 100 && planeD < W.d + 260;
      if (waveG.visible) {
        const x = planeD <= W.d ? from * 420 * Math.max(0, (W.d - planeD) / (W.d - W.warn)) : -from * (planeD - W.d) * 3.2;
        waveG.position.x = x; waveG.position.y = 2 + Math.sin(clock * 2) * 0.6;
        if (fx && Math.abs(x) < 220 && Math.random() < 0.6) fx.flame(x + (Math.random() - 0.5) * 10, 38 + Math.random() * 6, -(W.d + (Math.random() - 0.5) * 360));
      }
    }
    if (plazaMesh) plazaMesh.visible = run.golden.plaza + 60 > lo && run.golden.plaza - 60 < hi;
  }

  // ── per frame ──
  // planeD / planeX = the plane; t = the flight clock (shots, patrols, wild paths); flight = the flight
  // state (its pooled shots + door states) or null; camPos = the camera (sky dressing rides with it).
  function update(planeD, t, dt, flight = null, camPos = null) {
    if (!run || !arcs) return;
    clock += dt;
    const lo = planeD - SHOW_BEHIND, hi = planeD + SHOW_AHEAD;
    const arcI = Math.max(0, Math.min(arcs.length - 1, Math.floor(Math.max(0, planeD) / (arcs[0].to - arcs[0].from)))), arc = arcs[arcI];
    // weave posts: rewrite a kind's instances only when the rows in view change (rows are sorted by d)
    for (const pk of postList) {
      const { mesh, rows } = pk;
      let i0 = pk.i0 ?? 0;
      while (i0 < rows.length && rows[i0].d < lo) i0++;
      while (i0 > 0 && rows[i0 - 1].d >= lo) i0--;
      let i1 = i0;
      while (i1 < rows.length && rows[i1].d <= hi) i1++;
      if (i0 === pk.i0 && i1 === pk.i1) continue;
      pk.i0 = i0; pk.i1 = i1;
      let n = 0;
      for (let ri = i0; ri < i1; ri++) for (const p of rows[ri].posts) if (n < 96) { const k = p.r / POST_R0[p.kind]; setI(mesh, n++, p.x, terrain.surfaceAt(p.x, p.d, -Infinity) - 1, p.d, k, 1, k, (p.x * 0.37 + p.d) % 6.28); }
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
    }
    for (const it of tilts) it.g.visible = it.t.d + 20 > lo && it.t.d - (it.t.hall ? 20 : 380) < hi;
    // doors: slide by the flight's door state; a flash when they open
    const states = flight?.hz?.doors ?? null;
    doors.forEach((it, i) => {
      it.g.visible = it.o.d > lo && it.o.d < hi + 200;
      it.kg.visible = it.o.loopD + DOOR.after > lo && it.o.loopD - DOOR.before < hi;
      const st = states ? states[i] : null, k = st ? doorOpenness(st, t) : 0;
      for (const { leaf, sx } of it.leaves) leaf.position.x = sx * k * (DOOR.half + 2);
      if (st && st.state === 1 && !it.wasOpen) it.flash = 1;
      it.wasOpen = st ? st.state : 0;
      it.flash = Math.max(0, it.flash - dt * 0.8);
      it.glowMat.opacity = it.flash * 0.9;
      for (const r of it.rings) { r.rotation.y = clock * 1.6; r.material.color.setHex(st && st.state === 1 ? 0xffffff : 0xffd23f); }
    });
    // trebuchets: wind back during the telegraph, throw at launch
    for (const tb of trebs) {
      tb.g.visible = tb.sh.d > lo - 100 && tb.sh.d < hi;
      if (!tb.g.visible) continue;
      tb.g.position.set(tb.sh.x, terrain.surfaceAt(tb.sh.x, tb.sh.d, Infinity), -tb.sh.d);
      let ang = 0.5;
      if (flight?.hz) for (const p of flight.hz.shots) if (p.on && p.who === tb.sh.id) ang = t < p.t0 ? 0.5 + 0.7 * Math.min(1, (t - p.tTele) / SHOTS.boulder.windup) : -1.1;
      tb.pivot.rotation.x += (ang - tb.pivot.rotation.x) * Math.min(1, dt * (ang < 0 ? 14 : 3));
    }
    // dragons: perched / patrolling shooters and wild flyers near the plane
    const fhi = run.skin ? planeD + 460 : hi;
    for (let i = 0; i < POOL; i++) if (dragons[i].who !== null) { const w = dragons[i].who; if (w.d < lo - 40 || w.d > fhi) { dragons[i].who = null; dragons[i].f.root.visible = false; } }
    for (const sh of run.shooters) {
      if (sh.kind !== 'dragon' || sh.look === 'eye' || sh.d < lo - 40 || sh.d > fhi) continue;
      const dr = dragonFor(sh, 0, POOL);
      if (!dr) continue;
      tintDragon(dr, DRAGON_TINT[arcs[Math.min(arcs.length - 1, Math.floor(sh.d / 10000))].id] ?? 0xffffff);
      const R = dr.f.root, x = patrolX(sh, t);
      R.visible = true; R.position.set(x, sh.y, -sh.d); R.scale.setScalar(run.skin ? 3.2 : 4.5);
      if (run.skin) R.rotation.set(0, Math.PI, 0.3 * Math.sin(clock * 1.3 + sh.id)); // a fighter faces you, banking
      else R.rotation.set(0, sh.x > 0 ? Math.PI / 2 : -Math.PI / 2, 0);
      dr.f.animate(dt, sh.patrol ? 26 : 10 + 4 * Math.sin(clock + sh.id), 0);
    }
    let nm = 0;
    for (const w of run.wild) {
      if (w.d < lo - 40 || w.d > hi) continue;
      if (w.look === 'mine') { // v1.6 a floating MINE: it blinks, faster as you close in
        const near = Math.max(0, Math.min(1, 1 - (w.d - planeD) / 400)), on = (clock * (1.2 + near * 6) + w.id * 0.37) % 1 < 0.4;
        setI(mines, nm, w.x, w.y, w.d, w.r, w.r, w.r, clock * 0.4 + w.id); setI(mineLights, nm++, w.x, w.y + w.r * 0.95, w.d, on ? 1 : 0.35, on ? 1 : 0.35, on ? 1 : 0.35);
        continue;
      }
      if (w.d > fhi) continue;
      const dr = dragonFor(w, 0, POOL);
      if (!dr) continue;
      tintDragon(dr, DRAGON_TINT[arcs[Math.min(arcs.length - 1, Math.floor(w.d / 10000))].id] ?? 0xffffff);
      wildPos(w, t, _a);
      const R = dr.f.root, a = (2 * Math.PI * t) / w.period + w.phase;
      R.visible = true; R.position.set(_a.x, _a.y, -_a.d); R.scale.setScalar(w.r * (run.skin ? 0.9 : 1.15));
      R.rotation.set(0, Math.cos(a) >= 0 ? -Math.PI / 2 : Math.PI / 2, 0.25 * Math.sin(a));
      dr.f.animate(dt, 22, 2 * Math.cos(2 * a));
    }
    mines.count = mineLights.count = nm; mines.instanceMatrix.needsUpdate = mineLights.instanceMatrix.needsUpdate = true;
    // shots: fireballs (a growing glow at the mouth during the wind-up), boulders + landing shadows
    let nf = 0, nb = 0, ns = 0, na = 0, nl = 0, nc = 0, nbo = 0;
    if (flight?.hz) for (const p of flight.hz.shots) {
      if (!p.on) continue;
      if (p.kind === 'arrow') { // nocked at the bow during the wind-up, then along its path (pointing where it flies)
        const tt = Math.max(t, p.t0);
        shotPos(p, tt, _a); shotPos(p, tt + 0.02, _b);
        _dir.set(_b.x - _a.x, _b.y - _a.y, -(_b.d - _a.d));
        if (_dir.lengthSq() < 1e-9) _dir.set(p.x1 - p.x0, p.y1 - p.y0, -(p.d1 - p.d0));
        _q2.setFromUnitVectors(_z, _dir.normalize());
        const k = t < p.t0 ? 0.7 : 1.15;
        _m.compose(_p.set(_a.x, _a.y, -_a.d), _q2, _s.set(k, k, k));
        if (run.skin) { bolts.setMatrixAt(nbo, _m); boltGlow.setMatrixAt(nbo++, _m); } else arrows.setMatrixAt(na++, _m); // v1.6: a laser bolt
        continue;
      }
      if (p.kind === 'lava') { // the crack glows (the telegraph), then the blob flies its arc
        if (t < p.t0) { const k = 0.3 + 0.7 * Math.min(1, (t - p.tTele) / SHOTS.lava.windup), fl = 1 + 0.15 * Math.sin(clock * 30 + p.x1); setI(cracks, nc++, p.x0, p.y0 + 0.15, p.d0, 7 * k * fl, 1, 7 * k, p.x1 * 0.7); continue; }
        shotPos(p, t, _a);
        setI(lavaCore, nl, _a.x, _a.y, _a.d, p.r * 0.8, p.r * 0.8, p.r * 0.8, clock * 4, clock * 3);
        setI(lavaGlow, nl++, _a.x, _a.y, _a.d, p.r * 1.8, p.r * 1.8, p.r * 1.8);
        if (fx && Math.random() < 0.25) fx.flame(_a.x, _a.y, -_a.d);
        continue;
      }
      if (p.kind === 'fireball') {
        const k = t < p.t0 ? 0.4 + 0.6 * Math.min(1, (t - p.tTele) / SHOTS.fireball.windup) : 1;
        shotPos(p, t, _a);
        const flick = 1 + 0.12 * Math.sin(clock * 40 + p.d1);
        setI(fireCore, nf, _a.x, _a.y, _a.d, p.r * 0.75 * k * flick, p.r * 0.75 * k * flick, p.r * 0.75 * k * flick);
        setI(fireGlow, nf++, _a.x, _a.y, _a.d, p.r * 1.7 * k, p.r * 1.7 * k, p.r * 1.7 * k);
        if (fx && t >= p.t0 && Math.random() < 0.35) fx.flame(_a.x, _a.y, -_a.d);
      } else { // boulders and the hall's falling rubble (the same family): the landing shadow grows first
        const floor = terrain.surfaceAt(p.x1, p.d1, Infinity) + 0.25;
        const k = Math.min(1, (t - p.tTele) / (p.t0 + p.T - p.tTele));
        setI(shadows, ns, p.x1, floor, p.d1, 1 + 3.4 * k, 1, 1 + 3.4 * k);
        setI(marks, ns++, p.x1, floor + 0.05, p.d1, 5 - k, 1, 5 - k);
        if (t >= p.t0) { shotPos(p, t, _a); setI(boulders, nb++, _a.x, _a.y, _a.d, p.r, p.r * 0.9, p.r, clock * 3, clock * 2); }
      }
    }
    fireCore.count = fireGlow.count = nf; boulders.count = nb; shadows.count = marks.count = ns; arrows.count = na; lavaCore.count = lavaGlow.count = nl; cracks.count = nc; bolts.count = boltGlow.count = nbo;
    for (const m of [fireCore, fireGlow, boulders, shadows, marks, arrows, lavaCore, lavaGlow, cracks, bolts, boltGlow]) m.instanceMatrix.needsUpdate = true;
    updateAddendum(planeD, t, dt, lo, hi);
    // thermals: rings rising through each column near the plane
    let nr = 0;
    thermalRings.material.color.setHex(arc.lava ? 0xffa060 : 0xffffff);
    for (const u of run.thermals) {
      if (u.d < lo || u.d > hi) continue;
      const base = terrain.surfaceAt(u.x, u.d, Infinity);
      for (let j = 0; j < 6 && nr < RINGS; j++, nr++) { const y = base + ((clock * 7 + j * 11) % 66), s = u.r * (0.5 + 0.1 * Math.sin(clock * 3 + j)); setI(thermalRings, nr, u.x, y, u.d, s, 1, s); }
    }
    thermalRings.count = nr;
    thermalRings.instanceMatrix.needsUpdate = true;
    // wind lanes: ribbons near the plane, chevrons rushing forward
    for (const it of lanes) it.m.visible = it.l.d1 > lo && it.l.d0 < hi;
    laneTex.offset.y -= dt * 3;
    // river / ice / lava strips in the ditches near the plane
    const R = RIVER[arc.id];
    let si = 0;
    if (R) for (let L = Math.floor(lo / stage.cycle); L * stage.cycle < hi && si < strips.length; L++) for (const dt2 of stage.ditches) {
      const d = L * stage.cycle + dt2.d;
      if (d < lo || d > hi || si >= strips.length) continue;
      const m = strips[si++]; m.visible = true; m.material = sheetMats[R[0]];
      m.position.set(0, terrain.surfaceAt(0, d, -Infinity) + 0.35, -d); m.scale.set(1, 1, dt2.halfLength * 1.3);
    }
    for (; si < strips.length; si++) strips[si].visible = false;
    for (const m of SHEET_MATS) m.map.offset.y += dt * (m === sheetMats.lava ? 0.25 : 0.6);
    sheetMats.lava.color.setScalar(0.85 + 0.15 * Math.sin(clock * 3));
    // the dressing: refill a chunk slot when its chunk changes, then re-pack the instances
    const first = Math.floor(lo / 80);
    for (let k = first; k < first + CH; k++) { const slot = ((k % CH) + CH) % CH; if (chunkK[slot] !== k && k >= 0) fillChunk(slot, k); }
    if (dressDirty) rebuildDressing();
    // animated dressing: waving flags, rising smoke, rolling wagons
    for (let i = 0; i < flagList.length; i++) { const f = flagList[i], s = f.s; setI(flagMesh, i, f.x, f.y + FLAGGED.banner[1] * s, f.d, 1, 1, 1, Math.sin(clock * 3.2 + f.ph) * 0.45 + 0.6, 0, Math.sin(clock * 5 + f.ph) * 0.08); }
    for (const w of wagonList) { const dd = w.d + ((clock * 4 + w.ph) % 60) - 30; setI(decor.wagon, w.wi, w.x, terrain.surfaceAt(w.x, dd, Infinity), dd, w.s, w.s, w.s, 0); }
    for (let i = 0; i < smokeList.length; i++) {
      const o = smokeList[i], big = o.kind === 'smoke' ? 2.4 : 1, sx = o.x + SMOKY[o.kind][0] * o.s, sy = o.y + SMOKY[o.kind][1] * o.s;
      for (let j = 0; j < 4; j++) {
        const u = ((clock * 0.35 + o.ph + j * 0.25) % 1), s = big * (1 + 3 * u);
        setI(smokeMesh, i * 4 + j, sx + Math.sin(u * 4 + o.ph) * 2 * big, sy + u * 26 * big, o.d, s, s, s, u * 3);
      }
    }
    flagMesh.instanceMatrix.needsUpdate = true; smokeMesh.instanceMatrix.needsUpdate = true; if (wagonList.length) decor.wagon.instanceMatrix.needsUpdate = true;
    // v1.6 Star Fox's moving dressing: tumbling rocks, ships under way, crawling wrecks, swaying kelp,
    // spinning dust devils; and what it carries: turning windmill blades, blinking nav lights, sweeping beams
    for (let i = 0; i < animList.length; i++) {
      const it = animList[i], a = DECOR_INFO[it.kind].anim, mesh = decor[it.kind], s0 = it.s, t0 = clock + it.ph;
      if (a === 'tumble') setI(mesh, it.wi, it.x, it.y + it.lift + Math.sin(t0 * 0.5) * 1.5, it.d, s0, s0, s0, it.ry + t0 * 0.2, t0 * 0.13);
      else if (a === 'drift') { const dd = it.d + ((clock * 9 + it.ph * 3) % 160) - 80; setI(mesh, it.wi, it.x, it.y + it.lift, dd, s0, s0, s0, Math.PI); }
      else if (a === 'crawl') { const dd = it.d + ((clock * 3 + it.ph) % 50) - 25; setI(mesh, it.wi, it.x, terrain.surfaceAt(it.x, dd, Infinity), dd, s0, s0, s0, Math.PI); }
      else if (a === 'sway') setI(mesh, it.wi, it.x, it.y + it.lift, it.d, s0, s0, s0, it.ry, 0, Math.sin(t0 * 1.4) * 0.12);
      else if (a === 'spin') setI(mesh, it.wi, it.x, it.y + it.lift, it.d, s0, s0, s0, t0 * 4);
    }
    for (const k of animKinds) decor[k].instanceMatrix.needsUpdate = true;
    for (const k in attach) {
      const A = attach[k], [ax, ay, az] = A.def.at;
      for (let i = 0; i < A.list.length; i++) {
        const it = A.list[i], s0 = it.s, c = Math.cos(it.ry), sn = Math.sin(it.ry), x = it.x + (ax * c + az * sn) * s0, y = it.y + it.lift + ay * s0, d = it.d - (-ax * sn + az * c) * s0;
        if (A.def.anim === 'turn') setI(A.mesh, i, x, y, d, s0, s0, s0, it.ry, 0, clock * 2 + it.ph);
        else if (A.def.anim === 'sweep') setI(A.mesh, i, x, y, d, s0, s0, s0, Math.sin(clock * 0.7 + it.ph) * 1.3);
        else setI(A.mesh, i, x, y, d, s0, s0, s0);
      }
      if (A.def.anim === 'blink') A.mesh.material.opacity = (clock * 1.5) % 1 < 0.35 ? 0.95 : 0.15;
      A.mesh.instanceMatrix.needsUpdate = true;
    }
    puffMat.color.setHex(arc.lava ? 0x6a6260 : 0xc8c8c8);
    // ambient flocks: three loose flocks circling ahead of the plane
    birdMat.color.setHex(BIRD_TINT[arc.id] ?? 0x22242a);
    for (let i = 0; i < BIRDS; i++) {
      const fl = i % 3, cx = (fl - 1) * 60 + 10 * Math.sin(clock * 0.2 + fl), cd = planeD + 240 + fl * 140 - ((clock * 20 + fl * 90) % 160), cy = 42 + fl * 9;
      const a = clock * (0.5 + fl * 0.15) + i * 0.7, rr = 6 + (i % 5) * 2.2;
      const flap = 0.4 + 0.6 * Math.abs(Math.sin(clock * 9 + i));
      setI(birds, i, cx + Math.cos(a) * rr, cy + Math.sin(a * 2) * 2, cd + Math.sin(a) * rr, 1.6, flap * 1.6, 1.6, -a);
    }
    birds.instanceMatrix.needsUpdate = true;
    // the aurora over the Snowfields
    aurora.visible = arc.id === 'snowfields' && !!camPos;
    if (aurora.visible) { aurora.position.set(camPos.x, 150, camPos.z - 360); aurMat.opacity = 0.28 + 0.12 * Math.sin(clock * 0.7); }
    lastCam = camPos;
    if (sfLayer) sfLayer.update(planeD, t, dt, camPos);
    spectacles(planeD, dt);
  }

  // ── the SPECTACLE moments (looks only): each plays as the plane closes on its distance ──
  const _v = new THREE.Vector3();
  let used = 8, POOL = 8;
  // A pool dragon for a spectacle this frame (tinted to the arc), or null.
  function specDragon(sp, x, y, d, scale, ry, speed, dt) {
    if (used >= POOL + SPEC_POOL) return null;
    const dr = dragons[used++];
    tintDragon(dr, DRAGON_TINT[arcs[Math.min(arcs.length - 1, Math.floor(sp.d / 10000))].id] ?? 0xffffff);
    const R = dr.f.root; R.visible = true; R.position.set(x, y, -d); R.scale.setScalar(scale); R.rotation.set(0, ry, 0);
    dr.f.animate(dt, speed, 0);
    return R;
  }
  function spectacles(planeD, dt) {
    used = POOL;
    for (const sp of run.spectacles) {
      const u = (planeD - (sp.d - 900)) / 1300;
      if (u < 0 || u > 1) continue;
      const side = sp.side;
      if (sp.kind === 'flyby') { // crosses the line high ahead, breathing fire wide of you (outward)
        const big = sp.big ? 11 : 7, x = side * (-170 + 340 * u), y = 72 + 20 * Math.sin(u * Math.PI), d = sp.d + 120 - 80 * u;
        const R = specDragon(sp, x, y, d, big, side > 0 ? -Math.PI / 2 : Math.PI / 2, 30, dt);
        if (R && fx && !run.skin && Math.abs(x) > 34 && Math.random() < 0.8) { R.localToWorld(_v.set(0, 0.6, -2.6)); fx.flame(_v.x, _v.y, _v.z); fx.flame(_v.x + side * 3, _v.y, _v.z); }
      } else if (sp.kind === 'duel') { // two far silhouettes circling each other, trading fire
        for (let s2 = -1; s2 <= 1; s2 += 2) {
          const a = u * Math.PI * 4 + (s2 > 0 ? 0 : Math.PI), x = side * 120 + Math.cos(a) * 26, d = sp.d + Math.sin(a) * 26, y = 78 + 8 * Math.sin(a * 2);
          const R = specDragon(sp, x, y, d, 6, -a, 30, dt);
          if (R && fx && Math.random() < 0.4) { R.localToWorld(_v.set(0, 0.6, -2.6)); fx.flame(_v.x, _v.y, _v.z); }
        }
      } else if (sfLayer && sfLayer.spectacle(sp, u, dt, planeD, lastCam)) { // v1.6 a Star Fox moment (sfview.js)
      } else if (fx && Math.random() < dt * 14) { // bursts at a far point: volley / barrage / eruption / avalanche / flock / salute
        const fx0 = side * (80 + Math.random() * 60), fd = sp.d - 100 + Math.random() * 250, gy = terrain.surfaceAt(fx0, fd, Infinity);
        if (sp.kind === 'volley' || sp.kind === 'barrage') { fx.flame(fx0, gy + 2, -fd); fx.smoke(fx0, gy + 3, -fd, 1); fx.dust(fx0, gy + 1, -fd, 0xb8a888, 8, 2); }
        else if (sp.kind === 'eruption') { const y = gy + 40 + Math.random() * 50; fx.flame(fx0 * 1.2, y, -fd); fx.smoke(fx0 * 1.2, y + 4, -fd, 1); }
        else if (sp.kind === 'avalanche') fx.dust(fx0, gy + 40 * (1 - u) + 4, -fd, run.skin ? run.skin.dust ?? 0xe8c890 : 0xffffff, 10, 3); // (v1.6: Star Fox's dust storm is sand; v1.7: the skin says)
        else if (sp.kind === 'flock') fx.bits(side * 50, 30 + u * 40, -(sp.d - 300 + u * 400), 0x3fae4a, 0x22242a);
        else if (sp.kind === 'salute') fx.goalBurst(fx0 * 0.8, gy + 70 + Math.random() * 20, -fd, 0.8);
      }
    }
    for (let i = used; i < POOL + SPEC_POOL; i++) dragons[i].f.root.visible = false;
  }

  return { build, update, get active() { return !!run; } };
}
