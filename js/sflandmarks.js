// v1.6 STAR FOX's hero landmarks (one per 2,000 m, BIG: 30–110 m; names in starfox.js SF_HEROES).
// Readable silhouettes at 270 m/s, built by setpieces.js from a few primitives each.
import * as THREE from 'three';

const lam = (color, extra) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
const basic = (color, extra) => new THREE.MeshBasicMaterial({ color, ...extra });
const glow = (color, opacity = 0.6) => basic(color, { transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (r0, r1, h, n = 10) => new THREE.CylinderGeometry(r0, r1, h, n);
const cone = (r, h, n = 8) => new THREE.ConeGeometry(r, h, n);
const sph = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h);
const tor = (R, r, rs = 8, ts = 32, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, rs, ts, arc);
const dode = (r) => new THREE.DodecahedronGeometry(r, 0);
const METAL = 0x8a92a0, DARKM = 0x4a505c, WHITE = 0xf2f4f7, GOLD = 0xffc61a, SAND = 0xd8b070, RED = 0xff3a3a, CYAN = 0x5fd8ff;

export function starFoxLandmark(look, add) {
  switch (look) {
    // ── the Green World ──
    case 'cornerianCity':
      for (const [x, z, h] of [[-14, 0, 60], [0, 8, 84], [14, -4, 52], [-6, -14, 40], [10, 14, 46]]) { add(cyl(4, 5, h, 8), lam(WHITE), x, h / 2, z); add(cone(4.4, 8, 8), lam(0x2f6fe8), x, h + 4, z); add(box(0.4, h * 0.7, 9.4), basic(0x9fd8ff), x, h * 0.45, z); }
      add(box(50, 3, 40), lam(0xd8dde4), 0, 1.5); add(tor(24, 1, 6, 40), lam(METAL), 0, 30).rotation.x = Math.PI / 2; break;
    case 'greatFalls':
      add(box(70, 56, 20), lam(0x7a8070), 0, 28); add(box(74, 4, 22), lam(0x4fb34a), 0, 58); add(new THREE.PlaneGeometry(24, 56), basic(0x9fe0ff, { transparent: true, opacity: 0.85, side: THREE.DoubleSide }), 0, 28, 10.2);
      add(new THREE.CircleGeometry(18, 18).rotateX(-Math.PI / 2), basic(0xd8f6ff), 0, 0.4, 20); [0xff4f4f, 0xffa23f, 0xffe14d, 0x5fe06a, 0x4fb0ff].forEach((c, i) => add(tor(26 - i * 1.4, 0.7, 6, 30, Math.PI), glow(c, 0.5), 0, 6, 26)); break;
    case 'windmillHill':
      add(cone(40, 22, 10), lam(0x4fa83a), 0, 11); for (const [x, z] of [[-12, 0], [8, 10], [6, -12]]) { add(cyl(1.6, 2.6, 16, 8), lam(0xf4efe4), x, 30, z); add(cone(2.6, 4, 8), lam(0xb0402a), x, 40, z); for (let i = 0; i < 4; i++) add(box(0.7, 9, 0.2), lam(0xf4efe4), x + Math.sin(i * 1.57) * 4.5, 36 + Math.cos(i * 1.57) * 4.5, z + 2.4).rotation.z = -i * 1.57; } break;
    case 'defenseTower':
      add(cyl(6, 9, 70, 8), lam(METAL), 0, 35); add(cyl(12, 12, 6, 12), lam(DARKM), 0, 73); add(sph(7), lam(WHITE), 0, 80); for (let i = 0; i < 4; i++) add(box(1, 1, 14), lam(DARKM), Math.cos(i * 1.57) * 8, 76, Math.sin(i * 1.57) * 8).rotation.y = -i * 1.57;
      add(sph(1.2), basic(RED), 0, 88); break;
    case 'launchBase':
      add(box(60, 6, 40), lam(0xb8c0cc), 0, 3); add(box(18, 30, 18), lam(WHITE), -16, 21); add(cone(10, 14, 4), lam(0x2f6fe8), -16, 43).rotation.y = Math.PI / 4;
      add(box(6, 50, 6), lam(METAL), 18, 25); add(box(20, 2, 2), lam(METAL), 10, 48); add(box(4, 22, 8), lam(WHITE), 10, 17, 0); add(cone(3, 8, 4), lam(0xff7a1a), 10, 32); break;
    // ── the Asteroid Belt ──
    case 'derelictStation':
      add(tor(30, 5, 8, 24), lam(METAL), 0, 50).rotation.set(0.3, 0, 0.4); add(cyl(6, 6, 50, 10), lam(DARKM), 0, 50).rotation.z = 0.4; add(box(70, 1, 14), lam(0x2f4fa8), 0, 50, 0).rotation.z = 0.4; add(sph(1.4), basic(0xffa21f), 22, 58); break;
    case 'giantAsteroid':
      add(dode(46), lam(0x5a5660), 0, 46, 0, [1.2, 1, 1]); add(dode(14), lam(0x6a6670), 40, 70, 10); add(new THREE.CircleGeometry(16, 16), basic(0x0a0810), 0, 46, 46).rotation.y = 0; add(sph(2), basic(0xffd27a), 0, 46, 47); break;
    case 'warpFrame':
      for (let i = 0; i < 3; i++) add(tor(34 - i * 2, 2.4, 6, 8), lam(i % 2 ? DARKM : METAL), 0, 52, i * 12).rotation.z = Math.PI / 8; add(tor(28, 1, 6, 32), glow(CYAN, 0.4), 0, 52, 12); for (const sx of [-1, 1]) add(box(6, 6, 30), lam(DARKM), sx * 34, 52, 12); break;
    case 'mineRig':
      add(dode(26), lam(0x6a6670), 0, 26); add(box(8, 60, 8), lam(0xffc61a), 10, 56); add(box(30, 4, 4), lam(0xffc61a), -2, 84); add(cyl(3, 3, 20, 8), lam(METAL), -16, 74); for (let i = 0; i < 4; i++) add(sph(1), basic(0xffa21f), 10, 30 + i * 14, 4.2); break;
    case 'crystalRock':
      add(dode(22), lam(0x5a5660), 0, 30); for (let i = 0; i < 7; i++) add(cone(3 + (i % 3), 26 + (i % 2) * 14, 5), lam(0xbfe6ff, { emissive: 0x1a3a6a }), Math.cos(i) * 14, 44 + (i % 3) * 6, Math.sin(i) * 14).rotation.set(Math.sin(i) * 0.6, i, Math.cos(i) * 0.6); break;
    // ── the Ocean World ──
    case 'pollutedRig':
      for (const [x, z] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) add(cyl(2, 2.4, 40, 8), lam(0x5a5a50), x, 20, z); add(box(40, 6, 40), lam(0x6a6a5a), 0, 43); add(box(6, 30, 6), lam(0x4a4a40), 8, 61); add(box(30, 2, 2), lam(0x4a4a40), -6, 74);
      add(new THREE.CircleGeometry(40, 20).rotateX(-Math.PI / 2), lam(0x2a2a3a), 0, 0.5, 0, [1, 1, 0.7]); add(sph(4), lam(0x3a3a3a, { transparent: true, opacity: 0.6 }), -10, 52, 0); break;
    case 'lighthouseIsle':
      add(cone(40, 12, 10), lam(0xe8d8a0), 0, 6); add(cone(28, 16, 9), lam(0x3fae4a), 0, 16); for (let i = 0; i < 6; i++) add(cyl(4.2 - i * 0.3, 4.4 - i * 0.3, 8, 10), lam(i % 2 ? 0xe8262c : WHITE), 0, 28 + i * 8);
      add(cyl(4, 4, 6, 10), basic(0xfff2a0), 0, 79); add(cone(4.6, 6, 10), lam(0xe8262c), 0, 85); break;
    case 'sunkenWreck':
      add(box(18, 14, 90), lam(0x6a5a4a), 0, 8, 0).rotation.z = 0.35; add(cyl(1, 1.2, 50, 8), lam(0x5a4a3a), -6, 34).rotation.z = 0.6; add(cyl(1, 1.2, 40, 8), lam(0x5a4a3a), -4, 30, -24).rotation.z = 0.7;
      for (let i = 0; i < 5; i++) add(cone(1.6, 10, 6), lam(0xff7ab8), 8 + i * 3, 4, -30 + i * 14); break;
    case 'coralCastle':
      for (const [x, z, h] of [[-12, 0, 50], [0, 10, 70], [14, -6, 44], [4, -16, 36]]) { add(cyl(4, 6, h, 8), lam([0xff7ab8, 0xff9a3c, 0xb04ad1, 0xffb0c8][Math.abs(x + z) % 4]), x, h / 2, z); add(sph(5), lam(0xffd0e0), x, h + 2, z); }
      add(box(40, 10, 30), lam(0xe89aa8), 0, 5); break;
    case 'giantShell':
      add(new THREE.SphereGeometry(30, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), lam(0xf4e0c8), 0, 0, 0, [1, 1.3, 1.4]); for (let i = 0; i < 9; i++) add(box(1.2, 40, 2), lam(0xe8b890), -24 + i * 6, 18, 30).rotation.z = (i - 4) * 0.16;
      add(sph(6), lam(0xfff4f8, { emissive: 0x4a3a40 }), 0, 8, 36); break;
    // ── the Fleet ──
    case 'stationRing':
      add(tor(44, 5, 10, 40), lam(METAL), 0, 60).rotation.y = Math.PI / 2; for (let i = 0; i < 4; i++) add(box(3, 88, 3), lam(DARKM), 0, 60, 0).rotation.x = i * Math.PI / 4; add(sph(10), lam(WHITE), 0, 60); add(tor(44, 1.2, 6, 40), glow(CYAN, 0.5), 0, 60, 0).rotation.y = Math.PI / 2; break;
    case 'battleship':
      add(box(26, 18, 160), lam(0x6a707c), 0, 60); add(box(46, 4, 70), lam(DARKM), 0, 54, -30); for (const z of [-50, -10, 30]) { add(box(12, 12, 16), lam(METAL), 0, 75, z); add(cyl(1.2, 1.2, 24, 8), lam(DARKM), 0, 80, z + 10).rotation.x = Math.PI / 2; }
      add(cyl(9, 11, 20, 10), lam(DARKM), 0, 60, -90).rotation.x = Math.PI / 2; add(cyl(7, 7, 1, 10), basic(CYAN), 0, 60, -100.5).rotation.x = Math.PI / 2; break;
    case 'carrier':
      add(box(40, 14, 180), lam(0x7a828e), 0, 50); add(box(52, 2, 180), lam(DARKM), 0, 58); add(box(10, 24, 20), lam(METAL), 18, 70, 40); for (let i = 0; i < 9; i++) add(box(1, 0.4, 6), basic(0xffe14d), 0, 59.4, -80 + i * 20); break;
    case 'defensePlatform':
      add(cyl(30, 22, 10, 12), lam(METAL), 0, 50); add(cone(18, 30, 12), lam(DARKM), 0, 30).rotation.x = Math.PI; for (let i = 0; i < 6; i++) { const a = i * 1.047; add(sph(4), lam(0x6a707c), Math.cos(a) * 24, 58, Math.sin(a) * 24); add(cyl(0.8, 0.8, 12, 6), lam(DARKM), Math.cos(a) * 24, 62, Math.sin(a) * 24 + 5).rotation.x = Math.PI / 2; }
      add(tor(31, 0.8, 6, 40), glow(RED, 0.6), 0, 50).rotation.x = Math.PI / 2; break;
    case 'dreadnought':
      add(cone(40, 220, 4), lam(0x5a606c), 0, 70).rotation.set(Math.PI / 2, Math.PI / 4, 0); add(box(110, 6, 60), lam(DARKM), 0, 64, 40); add(box(20, 30, 40), lam(METAL), 0, 90, 50); for (let i = 0; i < 3; i++) add(cyl(8, 8, 2, 12), basic(CYAN), (i - 1) * 22, 70, 112).rotation.x = Math.PI / 2; break;
    // ── the Desert World ──
    case 'sandCrawler':
      add(box(40, 26, 70), lam(0x8a6a4a), 0, 22); add(box(30, 12, 50), lam(0x7a5a3a), 0, 41); for (const sx of [-1, 1]) add(box(10, 10, 74), lam(0x3a3028), sx * 18, 5); add(box(6, 6, 0.5), basic(0xffe14d), 8, 30, 35.4); break;
    case 'tankGraveyard':
      for (let i = 0; i < 6; i++) { const x = Math.cos(i * 1.1) * 24, z = Math.sin(i * 1.1) * 24; add(box(10, 5, 14), lam(0x6a6a5a), x, 2.5, z).rotation.set(0.1 * i, i, 0.15); add(cyl(0.6, 0.6, 10, 6), lam(0x4a4a3a), x, 6, z + 6).rotation.x = 1.2 + i * 0.1; }
      add(box(14, 30, 14), lam(0x5a5a4a), 0, 15).rotation.z = 0.25; break;
    case 'sphinx':
      add(box(30, 16, 60), lam(SAND), 0, 8); add(box(22, 24, 22), lam(SAND), 0, 28, 24); add(box(16, 18, 4), lam(0x2f6fe8), 0, 30, 35); add(box(14, 14, 12), lam(0xe2c08a), 0, 30, 30); for (const sx of [-1, 1]) add(box(8, 6, 24), lam(SAND), sx * 10, 3, 40); add(box(4, 30, 4), lam(GOLD), 0, 46, 24); break;
    case 'desertOasis':
      add(new THREE.CircleGeometry(30, 20).rotateX(-Math.PI / 2), lam(0x2fa8e0), 0, 0.4); for (let i = 0; i < 8; i++) { const a = i * 0.785, x = Math.cos(a) * 34, z = Math.sin(a) * 34; add(cyl(0.6, 0.9, 18 + (i % 3) * 4, 6), lam(0x9a7046), x, 10, z); add(sph(5, 8, 4), lam(0x3fae4a), x, 20 + (i % 3) * 4, z, [1.4, 0.4, 1.4]); } break;
    case 'obeliskRow':
      for (let i = 0; i < 6; i++) { add(cyl(2, 4, 50 + (i % 2) * 14, 4), lam(SAND), 0, 25 + (i % 2) * 7, -60 + i * 24).rotation.y = Math.PI / 4; add(cone(3, 8, 4), lam(GOLD), 0, 54 + (i % 2) * 14, -60 + i * 24).rotation.y = Math.PI / 4; } break;
    // ── the Solar World ──
    case 'sunspotCrater':
      add(new THREE.CircleGeometry(40, 24).rotateX(-Math.PI / 2), basic(0x2a0a06), 0, 0.5); add(new THREE.RingGeometry(40, 52, 24).rotateX(-Math.PI / 2), basic(0xff8a1a), 0, 0.4); add(new THREE.RingGeometry(52, 60, 24).rotateX(-Math.PI / 2), basic(0xffd23f), 0, 0.3);
      for (let i = 0; i < 4; i++) add(tor(30 + i * 6, 1.4, 6, 30, Math.PI), glow(0xffa21f, 0.5), 0, 0, 0).rotation.y = i * 0.8; break;
    case 'flareArch':
      for (let i = 0; i < 4; i++) add(tor(46 - i * 6, 3 - i * 0.5, 8, 30, Math.PI), basic([0xfff2a0, 0xffd23f, 0xffa21f, 0xff6a1a][i]), 0, 0, i * 4); add(sph(10), glow(0xfffbe0, 0.6), 0, 46); break;
    case 'solarStation':
      add(cyl(6, 6, 80, 10), lam(METAL), 0, 40); for (const y of [30, 55, 78]) add(box(90, 1, 16), lam(0x2a2a6a, { emissive: 0x1a1a4a }), 0, y); add(sph(9), lam(WHITE), 0, 88); add(tor(14, 1, 6, 30), glow(0xffd23f, 0.6), 0, 88).rotation.x = Math.PI / 2; break;
    case 'ringedPlanet':
      add(sph(36, 24, 16), lam(0xc89a6a), 0, 80); add(new THREE.RingGeometry(46, 70, 48), basic(0xe8d0a0, { side: THREE.DoubleSide, transparent: true, opacity: 0.8 }), 0, 80).rotation.x = Math.PI / 2 - 0.35;
      add(sph(36.5, 24, 16), lam(0xa87a4a, { transparent: true, opacity: 0.35 }), 0, 80, 0, [1, 0.3, 1]); break;
    case 'coronaSpire':
      add(cone(10, 100, 6), lam(0x3a1a10), 0, 50); for (let i = 0; i < 5; i++) add(tor(10 + i * 4, 1, 6, 24), glow([0xffd23f, 0xffa21f, 0xff6a1a][i % 3], 0.55), 0, 30 + i * 16).rotation.x = Math.PI / 2 + Math.sin(i) * 0.3; add(sph(5), basic(0xfffbe0), 0, 102); break;
    // ── the Boss World ──
    case 'gateBastion':
      add(box(60, 50, 30), lam(0x3a2a30), 0, 25); for (let i = 0; i < 6; i++) add(cone(3, 12, 4), lam(0x2a1e24), -25 + i * 10, 56); for (const sx of [-1, 1]) { add(cyl(8, 10, 80, 8), lam(0x2a1e24), sx * 34, 40); add(sph(2), basic(RED), sx * 34, 82); } add(box(30, 4, 1), basic(RED), 0, 36, 15.5); break;
    case 'fortressKeep':
      add(box(50, 70, 50), lam(0x3a2a30), 0, 35); add(box(36, 30, 36), lam(0x2a1e24), 0, 85); add(cone(20, 30, 4), lam(0x5a3a4a), 0, 115).rotation.y = Math.PI / 4; for (let i = 0; i < 5; i++) add(box(40, 1.4, 0.6), basic(RED), 0, 14 + i * 12, 25.4); break;
    case 'hangarTower':
      add(box(30, 90, 30), lam(0x3a2a30), 0, 45); add(box(40, 6, 40), lam(0x2a1e24), 0, 93); add(box(18, 26, 1), basic(0xff8a3a), 0, 20, 15.4); add(cyl(1, 1, 30, 6), lam(DARKM), 10, 110); add(sph(2), basic(RED), 10, 126); break;
    case 'guardianHead': // the head itself is drawn by sfview.js (seen from 2,000 m out, growing): here its throne of rock
      add(cyl(34, 46, 16, 10), lam(0x3a2a30), 0, 8); add(cyl(26, 34, 8, 10), lam(0x2a1e24), 0, 20); for (let i = 0; i < 8; i++) add(cone(4, 22, 4), lam(0x5a3a4a), Math.cos(i * 0.785) * 40, 11, Math.sin(i * 0.785) * 40); break;
    case 'theCore':
      add(sph(26, 20, 14), basic(0xff5a2a), 0, 50); add(tor(36, 3, 8, 40), lam(0x3a2a30), 0, 50).rotation.x = Math.PI / 2; add(tor(36, 3, 8, 40), lam(0x3a2a30), 0, 50).rotation.y = Math.PI / 2;
      add(sph(30, 20, 14), glow(0xff8a3a, 0.35), 0, 50); add(cyl(12, 18, 24, 10), lam(0x2a1e24), 0, 12); break;
    default: return false;
  }
  return true;
}
