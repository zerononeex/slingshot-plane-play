// v1.7 STAR WARS's hero landmarks (one per 2,000 m, BIG: 30–120 m; names in starwars.js SW_HEROES).
// Readable silhouettes at 270 m/s, built by setpieces.js from a few primitives each.
import * as THREE from 'three';

const lam = (color, extra) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
const basic = (color, extra) => new THREE.MeshBasicMaterial({ color, ...extra });
const glow = (color, opacity = 0.6) => basic(color, { transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (r0, r1, h, n = 10) => new THREE.CylinderGeometry(r0, r1, h, n);
const cone = (r, h, n = 8) => new THREE.ConeGeometry(r, h, n);
const sph = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h);
const dome = (r) => new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
const tor = (R, r, rs = 8, ts = 32, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, rs, ts, arc);
const dode = (r) => new THREE.DodecahedronGeometry(r, 0);
const GREY = 0x9aa0a8, DARK = 0x4a4e56, CREAM = 0xe6e3dc, SAND = 0xd8b070, RED = 0xd8402a, GOLD = 0xffc61a, GREEN = 0x3aff5a, CYAN = 0x5fd8ff, SNOW = 0xf4f8ff;

// A four-legged walker (h = hip height): a boxy body on stilt legs, a head on a short neck.
function walker(add, x, z, h, ry = 0) {
  const body = add(box(10, 7, 18), lam(GREY), x, h + 3.5, z); body.rotation.y = ry;
  add(box(4, 4, 6), lam(GREY), x + Math.sin(ry) * 13, h + 2, z + Math.cos(ry) * 13).rotation.y = ry;
  for (const [lx, lz] of [[-4, -7], [4, -7], [-4, 7], [4, 7]]) add(box(1.6, h, 1.6), lam(DARK), x + lx * Math.cos(ry) + lz * Math.sin(ry), h / 2, z + lz * Math.cos(ry) - lx * Math.sin(ry));
}

export function starWarsLandmark(look, add) {
  switch (look) {
    // ── the Desert World ──
    case 'moistureFarm':
      add(new THREE.CircleGeometry(20, 24).rotateX(-Math.PI / 2), lam(0xc89a60), 0, 0.3); add(dome(9), lam(CREAM), 0, 0); add(cyl(9.4, 9.4, 1.6, 20), lam(0xb0845a), 0, 0.8);
      for (const [x, z] of [[-26, 10], [24, -8], [16, 22], [-14, -24]]) { add(cyl(0.8, 1.2, 22, 8), lam(GREY), x, 11, z); for (const y of [8, 14, 20]) add(cyl(2.2, 2.2, 0.6, 10), lam(DARK), x, y, z); } break;
    case 'domeTown':
      for (const [x, z, r] of [[-18, 0, 10], [0, 10, 14], [18, -6, 9], [6, -18, 7], [-8, 20, 8]]) { add(dome(r), lam(CREAM), x, 0, z); add(box(r * 0.5, r * 0.5, 0.4), lam(0x3a2a1a), x, r * 0.25, z + r * 0.92); }
      add(box(4, 30, 4), lam(SAND), 26, 15, 14); add(sph(3), lam(GREY), 26, 32, 14); break;
    case 'saberDuel': // two small figures on a high plateau, crossing glowing blades
      add(cyl(26, 34, 44, 9), lam(0xb0845a), 0, 22); add(cyl(26.4, 26.4, 1.4, 9), lam(0xd8b070), 0, 44.7);
      for (const [sx, c] of [[-1, 0x5fd8ff], [1, 0xff3a3a]]) {
        add(box(1.6, 4, 1.2), lam(sx < 0 ? 0xe8dcc0 : 0x1a1a1a), sx * 3, 47.4, 0); add(sph(0.8, 8, 6), lam(sx < 0 ? 0xf0d0b0 : 0x1a1a1a), sx * 3, 50.2, 0);
        const blade = add(box(0.35, 7, 0.35), glow(c, 0.95), sx * 1.2, 50.6, 0); blade.rotation.z = sx * 0.75; add(box(0.9, 7.4, 0.9), glow(c, 0.3), sx * 1.2, 50.6, 0).rotation.z = sx * 0.75;
      } break;
    case 'spacePort':
      add(cyl(30, 34, 12, 20), lam(SAND), 0, 6); add(cyl(24, 24, 12.4, 20), lam(0x8a6a40), 0, 6.2); add(dome(12), lam(CREAM), 40, 0, 10);
      add(box(16, 5, 26), lam(GREY), 0, 15, 0); add(cyl(4, 4, 6, 12), lam(DARK), 0, 15, -14).rotation.x = Math.PI / 2; add(box(20, 1, 8), lam(GREY), 0, 14, 6); add(cone(3, 18, 6), lam(GREY), -30, 20, -20); break;
    case 'crawlerFortress':
      add(box(30, 28, 56), lam(0x8a7050), 0, 20); add(box(26, 12, 30), lam(0x7a6040), 0, 40, -6); add(box(34, 6, 60), lam(0x3a3a3a), 0, 3);
      for (const z of [-20, 0, 20]) add(box(2, 2, 4), basic(0xffd27a), 15.2, 26, z); add(box(30, 2, 10), lam(0x6a5030), 0, 8, 30).rotation.x = -0.5; break;
    // ── the Orbital Battle ──
    case 'wedgeCruiser': {
      const hull = add(cone(30, 150, 3), lam(GREY), 0, 60, 0); hull.rotation.x = Math.PI / 2; hull.rotation.y = Math.PI;
      add(box(22, 10, 26), lam(0xb0b6be), 0, 72, 40); add(box(10, 14, 10), lam(GREY), 0, 84, 46); for (const sx of [-1, 1]) add(sph(3), lam(DARK), sx * 7, 92, 46);
      for (const sx of [-1, 0, 1]) add(cyl(4, 4, 2, 12), glow(CYAN, 0.8), sx * 10, 60, 76).rotation.x = Math.PI / 2; break;
    }
    case 'caveRock':
      add(dode(44), lam(0x5a5660), 0, 50, 0, [1.3, 1, 1]); add(new THREE.CircleGeometry(14, 16), basic(0x050308), 0, 44, 44); add(dode(12), lam(0x6a6670), 46, 78, 6); add(dode(8), lam(0x4a4650), -40, 30, 10); break;
    case 'dockingStation':
      add(cyl(10, 10, 60, 12), lam(GREY), 0, 50).rotation.z = Math.PI / 2; for (const sx of [-1, 1]) { add(sph(16), lam(0xb0b6be), sx * 36, 50, 0); add(tor(20, 1.4, 6, 30), glow(CYAN, 0.5), sx * 36, 50, 0); }
      for (let i = 0; i < 4; i++) add(box(2, 2, 30), lam(DARK), 0, 50 + Math.cos(i * 1.57) * 12, Math.sin(i * 1.57) * 12); break;
    case 'orbitalRing':
      add(tor(44, 5, 8, 40), lam(GREY), 0, 56).rotation.set(0.4, 0, 0.2); add(sph(12), lam(0xb0b6be), 0, 56); for (let i = 0; i < 4; i++) add(cyl(1.2, 1.2, 40, 6), lam(DARK), Math.cos(i * 1.57) * 20, 56 + Math.sin(i * 1.57) * 20, 0).rotation.z = i * 1.57 + Math.PI / 2;
      add(sph(2), basic(GOLD), 44, 60); break;
    case 'mediFrigate':
      add(box(10, 10, 70), lam(CREAM), 0, 55); add(box(14, 18, 14), lam(CREAM), 0, 60, -36); add(cyl(4, 4, 6, 12), glow(CYAN, 0.8), 0, 55, 37).rotation.x = Math.PI / 2;
      add(box(36, 2, 6), lam(RED), 0, 55, 10); add(box(2, 2, 2), basic(RED), 0, 70, -36); break;
    // ── the Ice World ──
    case 'iceBase':
      add(cone(60, 60, 8), lam(SNOW), 0, 30); add(box(30, 18, 4), lam(0x3a4a5a), 0, 9, 34); add(box(26, 14, 4.2), basic(0xffd27a), 0, 8, 34.2);
      for (const sx of [-1, 1]) { add(cyl(3, 3, 22, 8), lam(GREY), sx * 30, 11, 20); add(box(2, 2, 10), lam(DARK), sx * 30, 22, 25); } break;
    case 'greatWalker': walker(add, 0, 0, 38, 0.4); add(new THREE.CircleGeometry(16, 16).rotateX(-Math.PI / 2), basic(0x8a9ab0, { transparent: true, opacity: 0.5 }), 0, 0.3); break;
    case 'shieldDome':
      add(dome(30), lam(0xb0c0d0), 0, 0); add(dome(34), glow(CYAN, 0.25), 0, 0); add(cyl(4, 6, 50, 8), lam(GREY), 0, 25); add(sph(6), lam(0xdfe6ee), 0, 52); add(tor(10, 1, 6, 24), glow(CYAN, 0.7), 0, 52).rotation.x = Math.PI / 2; break;
    case 'walkerPair': walker(add, -20, 10, 30, 0.6); walker(add, 22, -14, 30, 0.2); break;
    case 'ionCannon':
      add(sph(24), lam(GREY), 0, 24); add(cyl(26, 26, 3, 20), lam(DARK), 0, 18); add(cyl(4, 5, 40, 12), lam(DARK), 0, 48, 0).rotation.x = -0.6; add(cyl(3.4, 3.4, 1, 12), glow(CYAN, 0.9), 0, 64, -12).rotation.x = -0.6; break;
    // ── the Cloud World ──
    case 'cloudCity':
      add(cyl(50, 10, 26, 16), lam(0xe8e0d8), 0, 64); add(cyl(50.4, 50.4, 3, 16), lam(0xd0c0b0), 0, 77); add(cyl(6, 2, 60, 8), lam(0xc8b8a8), 0, 26);
      for (let i = 0; i < 8; i++) { const a = i * 0.785, h = 12 + (i % 3) * 8; add(cyl(4, 5, h, 8), lam(0xf4ece4), Math.cos(a) * 34, 78 + h / 2, Math.sin(a) * 34); } add(sph(10), lam(0xf4ece4), 0, 86); break;
    case 'gasRefinery':
      add(cyl(6, 30, 40, 12), lam(0xc8b8a8), 0, 70); for (const sx of [-1, 1]) add(cyl(3, 3, 70, 8), lam(DARK), sx * 20, 35); add(sph(14), lam(0xe8a08a), 0, 96); add(cyl(1, 1, 30, 6), lam(GREY), 0, 112); break;
    case 'landingTower':
      add(cyl(5, 6, 90, 10), lam(0xe8e0d8), 0, 45); for (const [y, r] of [[40, 16], [62, 20], [84, 14]]) { add(cyl(r, r, 1.6, 16), lam(0xd0c0b0), 0, y); add(tor(r, 0.4, 4, 24), glow(0xffd27a, 0.6), 0, y + 1).rotation.x = Math.PI / 2; } break;
    case 'baronPalace':
      add(cyl(30, 20, 18, 12), lam(0xf4ece4), 0, 60); for (let i = 0; i < 5; i++) add(cyl(3, 3, 30, 8), lam(0xf4ece4), -24 + i * 12, 84, 0); add(box(56, 3, 10), lam(0xe8d0b0), 0, 100); add(dome(14), lam(0xffd8b0), 0, 102); break;
    case 'freezePlant':
      add(box(30, 24, 30), lam(0x6a6a74), 0, 64); add(cyl(10, 10, 6, 16), lam(DARK), 0, 79); add(cyl(8, 8, 6.2, 16), glow(0xff8a3a, 0.7), 0, 79); for (const sx of [-1, 1]) add(cyl(2, 2, 60, 6), lam(DARK), sx * 12, 30); break;
    // ── the Forest Moon ──
    case 'treeVillage':
      for (const [x, z] of [[-14, 0], [12, 10], [4, -16]]) { add(cyl(3, 4.5, 70, 10), lam(0x6a3a1a), x, 35, z); add(cyl(10, 10, 1.4, 12), lam(0x8a5a30), x, 36, z); add(cone(8, 6, 10), lam(0x6a4a2a), x, 42, z); add(new THREE.IcosahedronGeometry(14, 1), lam(0x2a6a2a), x, 72, z, [1, 0.5, 1]); }
      add(box(26, 0.6, 1.4), lam(0x8a5a30), -1, 36, 5).rotation.y = 0.4; break;
    case 'scoutWalker': {
      add(box(7, 6, 7), lam(GREY), 0, 24); add(box(5, 3, 3), lam(DARK), 0, 23, 4.6);
      for (const sx of [-1, 1]) { add(box(1.4, 11, 1.4), lam(DARK), sx * 2.6, 15.5, 0).rotation.x = 0.3; add(box(1.4, 10, 1.4), lam(DARK), sx * 2.6, 5, 1.4).rotation.x = -0.3; add(box(3.6, 0.8, 5), lam(DARK), sx * 2.6, 0.4, 1); } break;
    }
    case 'elderTree':
      add(cyl(9, 14, 120, 12), lam(0x5a2a10), 0, 60); add(new THREE.IcosahedronGeometry(30, 1), lam(0x2a5a2a), 0, 122, 0, [1, 0.5, 1]); for (let i = 0; i < 4; i++) add(box(26, 2.6, 2.6), lam(0x5a2a10), Math.cos(i * 1.6) * 13, 92 + i * 6, Math.sin(i * 1.6) * 13).rotation.y = i * 1.6;
      add(cyl(14, 14, 1.4, 12), lam(0x8a5a30), 0, 40); break;
    case 'bunkerDish': {
      add(box(26, 10, 18), lam(0x5a5a50), 0, 5); add(cyl(1.4, 2, 26, 8), lam(GREY), 0, 23); const d = add(new THREE.SphereGeometry(26, 20, 8, 0, Math.PI * 2, 0, Math.PI / 4), lam(0xb0b6be, { side: THREE.DoubleSide }), 0, 62); d.rotation.x = Math.PI;
      add(tor(18, 1, 6, 30), lam(DARK), 0, 40).rotation.x = Math.PI / 2; add(sph(2), basic(GREEN), 0, 40); break;
    }
    case 'councilGlade':
      add(new THREE.CircleGeometry(30, 24).rotateX(-Math.PI / 2), lam(0x5a7a3a), 0, 0.3); add(cone(4, 8, 8), lam(0x6a3a1a), 0, 4); add(cone(3, 9, 6), glow(0xffa23f, 0.85), 0, 9);
      for (let i = 0; i < 8; i++) { const a = i * 0.785; add(cyl(4, 6, 60, 10), lam(0x6a3a1a), Math.cos(a) * 28, 30, Math.sin(a) * 28); add(new THREE.IcosahedronGeometry(10, 0), lam(0x2a6a2a), Math.cos(a) * 28, 62, Math.sin(a) * 28); } break;
    // ── the Great Fleet Battle ──
    case 'roundCruiserGiant':
      add(sph(26, 16, 10), lam(0xb0a8a0), 0, 60, 0, [1, 0.6, 2.4]); for (let i = 0; i < 6; i++) add(dome(5), lam(0x9a9088), -20 + i * 8, 74, (i % 2) * 10 - 5); for (const sx of [-1, 1]) add(cyl(5, 5, 2, 12), glow(CYAN, 0.8), sx * 10, 60, 62).rotation.x = Math.PI / 2; break;
    case 'superCapital': {
      const h = add(cone(40, 300, 3), lam(0x6a707c), 0, 80, 0); h.rotation.x = Math.PI / 2; h.rotation.y = Math.PI;
      add(box(40, 14, 40), lam(GREY), 0, 92, 100); add(box(16, 18, 14), lam(GREY), 0, 106, 110); for (let i = 0; i < 9; i++) add(cyl(3, 3, 2, 10), glow(CYAN, 0.8), -32 + i * 8, 80, 150).rotation.x = Math.PI / 2; break;
    }
    case 'hollowWreck':
      add(cyl(26, 26, 90, 10, 1, true), lam(0x5a5048, { side: THREE.DoubleSide }), 0, 56).rotation.x = Math.PI / 2; add(tor(26, 3, 6, 10), lam(0x3a342e), 0, 56, 45); add(tor(26, 3, 6, 10), lam(0x3a342e), 0, 56, -45);
      add(box(4, 50, 4), lam(0x3a342e), 0, 56, 0).rotation.z = 0.6; add(sph(2), basic(0xffa21f), 10, 50, 30); break;
    case 'escortCarrier':
      add(box(20, 20, 110), lam(GREY), 0, 60); add(box(60, 4, 30), lam(DARK), 0, 52, 30); add(box(14, 12, 14), lam(0xb0b6be), 0, 76, -40); for (const sx of [-1, 1]) add(cyl(6, 6, 2, 12), glow(CYAN, 0.8), sx * 7, 60, 56).rotation.x = Math.PI / 2; break;
    case 'greatStation': // the station itself is drawn by sfview.js (seen from 3,000 m out, growing): here its picket of defence satellites
      for (let i = 0; i < 5; i++) { add(sph(5), lam(GREY), -40 + i * 20, 40 + (i % 2) * 20, (i % 3) * 14 - 14); add(box(16, 0.6, 5), lam(0x2a3a5a), -40 + i * 20, 40 + (i % 2) * 20, (i % 3) * 14 - 14); } break;
    // ── the Great Station ──
    case 'gateTowers':
      for (const [x, z, h] of [[-20, 0, 70], [0, 14, 90], [20, -6, 60]]) { add(box(12, h, 12), lam(GREY), x, h / 2, z); add(box(14, 4, 14), lam(DARK), x, h + 2, z); add(box(1, h * 0.8, 12.2), basic(0xc8e0ff), x + 6.1, h * 0.45, z); } break;
    case 'laserDish': {
      const d = add(new THREE.SphereGeometry(40, 24, 10, 0, Math.PI * 2, 0, Math.PI / 3.2), lam(0x6a707c, { side: THREE.DoubleSide }), 0, 60); d.rotation.x = -Math.PI / 2 - 0.3;
      add(sph(5), glow(GREEN, 0.9), 0, 46, 22); add(box(40, 30, 10), lam(DARK), 0, 15, -10); break;
    }
    case 'trenchTower':
      add(box(14, 80, 14), lam(GREY), 0, 40); for (let y = 10; y < 80; y += 10) add(box(15, 1.6, 15), lam(DARK), 0, y); add(cyl(2, 2, 20, 6), lam(DARK), 0, 90); add(sph(2), basic(RED), 0, 101); break;
    case 'commandSpire':
      add(cone(18, 110, 6), lam(0x6a707c), 0, 55); add(box(30, 8, 12), lam(DARK), 0, 80); add(box(28, 4, 0.4), basic(0xc8e0ff), 0, 80, 6.2); add(sph(3), basic(RED), 0, 112); break;
    case 'reactorGlow':
      add(cyl(30, 34, 10, 20), lam(DARK), 0, 5); add(cyl(26, 26, 10.4, 20), glow(0x9fd8ff, 0.7), 0, 5); add(cyl(6, 6, 80, 12), glow(0xbfe8ff, 0.35), 0, 50); add(tor(16, 1.6, 6, 30), lam(GREY), 0, 30).rotation.x = Math.PI / 2; break;
    default: return false;
  }
  return true;
}
