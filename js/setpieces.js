// v1.1 LONG STAGES look: the long runs' set pieces — glowing hoop lines, banner arches that name each
// character zone, and the world landmarks outside the corridor. Looks only: nothing here collides.
// Built once per world (absolute positions); only the pieces near the plane are shown.
import * as THREE from 'three';
import { neonify } from './neonlook.js';

const lam = (color, extra) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
const basic = (color, extra) => new THREE.MeshBasicMaterial({ color, ...extra });

function bannerTexture(text) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = '#1b2438'; g.fillRect(0, 0, 512, 96);
  g.fillStyle = '#ffc61a'; g.fillRect(0, 0, 512, 8); g.fillRect(0, 88, 512, 8);
  g.font = 'italic 900 52px system-ui, -apple-system, "Segoe UI", Arial, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff';
  let size = 52; while (g.measureText(text).width > 480 && size > 24) { size -= 4; g.font = `italic 900 ${size}px system-ui, -apple-system, "Segoe UI", Arial, sans-serif`; }
  g.fillText(text, 256, 50);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// The landmark looks: a few primitives each, scaled per zone.
function landmark(look, k) {
  const g = new THREE.Group();
  const add = (geo, mat, x, y, z = 0, s = null) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (s) m.scale.set(...s); g.add(m); return m; };
  switch (look) {
    case 'windmill': { add(new THREE.CylinderGeometry(1.6, 2.6, 12, 8), lam(0xe8dcc0), 0, 6); add(new THREE.ConeGeometry(2.4, 3, 8), lam(0xb0402a), 0, 13.5); const hub = add(new THREE.BoxGeometry(0.6, 0.6, 0.6), lam(0x5a3a22), 0, 11, 2.2); hub.userData.spin = true; for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 7, 0.15), lam(0xf4efe4)); b.position.y = 3.5; const arm = new THREE.Group(); arm.rotation.z = (i * Math.PI) / 2; arm.add(b); hub.add(arm); } break; }
    case 'barn': add(new THREE.BoxGeometry(8, 6, 10), lam(0xc0392b), 0, 3); add(new THREE.CylinderGeometry(0.1, 5.8, 3.4, 4, 1), lam(0x6b2a20), 0, 7.7, 0, [1, 1, 1.25]); add(new THREE.CylinderGeometry(1.4, 1.4, 9, 10), lam(0xdfe6ee), 6, 4.5); break;
    case 'balloonCluster': for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(2.2, 10, 8), lam([0xff4fa3, 0xffd23f, 0x3fc5ff, 0x5fe06a, 0xb06aff][i]), (i - 2) * 3, 16 + (i % 2) * 4); add(new THREE.BoxGeometry(2, 1.4, 2), lam(0x8a5a35), 0, 10); break;
    case 'spire': add(new THREE.ConeGeometry(4, 30, 6), lam(0xb0603a), 0, 15); add(new THREE.ConeGeometry(2.6, 14, 6), lam(0x8d4a2a), 4, 7); break;
    case 'waterfall': add(new THREE.BoxGeometry(10, 26, 6), lam(0x9a5a3a), 0, 13); add(new THREE.PlaneGeometry(4, 24), basic(0x8fd8ff, { transparent: true, opacity: 0.8, side: THREE.DoubleSide }), 0, 12, 3.1); add(new THREE.CircleGeometry(4, 12).rotateX(-Math.PI / 2), basic(0xbfeaff), 0, 0.3, 5); break;
    case 'totem': for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(2.6, 3, 2.6), lam([0xc0392b, 0x2a7fd0, 0xffc61a, 0x3fae4a][i]), 0, 1.5 + i * 3); add(new THREE.BoxGeometry(8, 0.6, 1), lam(0xffc61a), 0, 11); break;
    case 'billboard': add(new THREE.BoxGeometry(0.6, 10, 0.6), lam(0x8a94a6), -4, 5); add(new THREE.BoxGeometry(0.6, 10, 0.6), lam(0x8a94a6), 4, 5); add(new THREE.BoxGeometry(12, 6, 0.4), basic([0xff4fa3, 0x3fe0ff, 0xffe14d][Math.round(k * 10) % 3]), 0, 13); break;
    case 'radioTower': add(new THREE.CylinderGeometry(0.3, 2, 30, 4), lam(0xd8262c), 0, 15); add(new THREE.SphereGeometry(0.6, 8, 6), basic(0xff3030), 0, 30.5); break;
    case 'ferrisWheel': { const w = add(new THREE.TorusGeometry(9, 0.35, 6, 32), lam(0xffffff), 0, 12); w.userData.spin = true; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const c = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), lam([0xff4fa3, 0x3fc5ff, 0xffd23f][i % 3])); c.position.set(Math.cos(a) * 9, Math.sin(a) * 9, 0); w.add(c); } add(new THREE.BoxGeometry(1, 12, 1), lam(0x8a94a6), 0, 6); break; }
    case 'iceSpire': add(new THREE.ConeGeometry(3, 24, 5), lam(0xd8f6ff, { emissive: 0x1a4a6a }), 0, 12); add(new THREE.ConeGeometry(1.8, 14, 5), lam(0xbfe6ff, { emissive: 0x1a4a6a }), 3, 7); break;
    case 'snowmanGiant': add(new THREE.SphereGeometry(5, 12, 10), lam(0xffffff), 0, 5); add(new THREE.SphereGeometry(3.6, 12, 10), lam(0xffffff), 0, 12); add(new THREE.SphereGeometry(2.6, 12, 10), lam(0xffffff), 0, 17.5); add(new THREE.ConeGeometry(0.5, 2.5, 8), lam(0xff8a3d), 0, 17.5, 2.6).rotation.x = Math.PI / 2; break;
    case 'cabin': add(new THREE.BoxGeometry(7, 5, 6), lam(0x8a5a35), 0, 2.5); add(new THREE.CylinderGeometry(0.1, 5.2, 3, 4, 1), lam(0xffffff), 0, 6.5, 0, [1.05, 1, 1]); add(new THREE.BoxGeometry(1, 3, 1), lam(0x6b6b6b), 2, 8); break;
    case 'obelisk': add(new THREE.BoxGeometry(3, 24, 3), lam(0xe2b97a), 0, 12); add(new THREE.ConeGeometry(2.2, 3, 4), lam(0xffc61a), 0, 25.5); break;
    case 'palmOasis': for (let i = 0; i < 3; i++) { add(new THREE.CylinderGeometry(0.4, 0.6, 9, 6), lam(0x9a7046), (i - 1) * 4, 4.5); add(new THREE.IcosahedronGeometry(1.6, 0), lam(0x3fae4a), (i - 1) * 4, 9.4, 0, [2.6, 0.6, 2.6]); } add(new THREE.CircleGeometry(6, 16).rotateX(-Math.PI / 2), lam(0x2fa8e0), 0, 0.2); break;
    case 'ruinsArch': add(new THREE.BoxGeometry(2.4, 12, 2.4), lam(0xd9b46a), -4, 6); add(new THREE.BoxGeometry(2.4, 9, 2.4), lam(0xd9b46a), 4, 4.5); add(new THREE.BoxGeometry(11, 2, 2.6), lam(0xc99a5a), 0, 12.6, 0); break;
    case 'lighthouse': add(new THREE.CylinderGeometry(1.8, 2.6, 18, 10), lam(0xffffff), 0, 9); add(new THREE.CylinderGeometry(1.9, 1.9, 2, 10), lam(0xe8262c), 0, 6); add(new THREE.CylinderGeometry(1.9, 1.9, 2, 10), lam(0xe8262c), 0, 12); add(new THREE.SphereGeometry(1.4, 10, 8), basic(0xfff2a8), 0, 19); break;
    case 'sailboat': add(new THREE.BoxGeometry(3, 1.6, 9), lam(0x8a5a35), 0, 0.8); add(new THREE.CylinderGeometry(0.15, 0.15, 10, 6), lam(0xffffff), 0, 6); add(new THREE.ConeGeometry(3, 8, 3), lam(0xffffff), 0, 6, 1.2, [0.15, 1, 1]); break;
    case 'buoyTower': add(new THREE.CylinderGeometry(1.4, 2, 6, 10), lam(0xff8a3d), 0, 3); add(new THREE.BoxGeometry(0.4, 6, 0.4), lam(0xdfe6ee), 0, 9); add(new THREE.SphereGeometry(0.6, 8, 6), basic(0x5fd0ff), 0, 12.4); break;
    case 'satDish': add(new THREE.CylinderGeometry(0.6, 1, 6, 8), lam(0xdfe6ee), 0, 3); add(new THREE.SphereGeometry(5, 14, 6, 0, Math.PI * 2, 0, Math.PI / 3), lam(0xffffff, { side: THREE.DoubleSide }), 0, 9, 0).rotation.x = -0.9; break;
    case 'ringPlanet': add(new THREE.SphereGeometry(6, 16, 12), lam(0xc08aff, { emissive: 0x3a1a5a }), 0, 30); add(new THREE.TorusGeometry(10, 0.6, 4, 40), basic(0xffd27a), 0, 30).rotation.x = 1.2; break;
    case 'crystalSpire': for (let i = 0; i < 3; i++) add(new THREE.OctahedronGeometry(2.4 + i, 0), lam([0x7fe3ff, 0xc08aff, 0xff6ad5][i], { emissive: 0x1a2a4a }), (i - 1) * 3, 3 + i * 3, 0, [1, 2.2, 1]); break;
    case 'cloudCastle': add(new THREE.IcosahedronGeometry(7, 1), lam(0xffffff), 0, 2, 0, [1.6, 0.6, 1.2]); add(new THREE.BoxGeometry(5, 10, 5), lam(0xeef3fb), 0, 8); for (const x of [-5, 5]) { add(new THREE.CylinderGeometry(1.4, 1.4, 14, 8), lam(0xeef3fb), x, 9); add(new THREE.ConeGeometry(2, 4, 8), lam(0x6f9be6), x, 18); } break;
    case 'zeppelin': add(new THREE.SphereGeometry(4, 14, 10), lam(0xdfe6ee), 0, 24, 0, [1, 1, 3]); add(new THREE.BoxGeometry(2, 1.4, 4), lam(0x5a3a22), 0, 19.5); add(new THREE.BoxGeometry(0.2, 4, 3), lam(0xe8262c), 0, 24, -11); break;
    case 'skyIsland': add(new THREE.ConeGeometry(7, 10, 7), lam(0x8a7a6a), 0, 20).rotation.x = Math.PI; add(new THREE.CylinderGeometry(7, 7, 1.4, 7), lam(0x4fb34a), 0, 25.7); add(new THREE.ConeGeometry(1.8, 5, 6), lam(0x2f7a3a), 2, 28.9); break;
    case 'smokingCone': add(new THREE.ConeGeometry(16, 26, 9, 1, true), lam(0x4a3530), 0, 13); add(new THREE.CircleGeometry(4.2, 12).rotateX(-Math.PI / 2), basic(0xff6a1a), 0, 25.6); for (let i = 0; i < 3; i++) add(new THREE.IcosahedronGeometry(3 + i, 0), lam(0x9a948f), i * 1.5, 30 + i * 5, 0); break;
    case 'obsidianSpire': add(new THREE.ConeGeometry(3, 26, 5), lam(0x1d1a22), 0, 13); add(new THREE.ConeGeometry(1.8, 14, 5), lam(0x2a2430), 3, 7); add(new THREE.BoxGeometry(0.4, 18, 0.4), basic(0xff6a1a), 1.2, 9); break;
    case 'lavaFall': add(new THREE.BoxGeometry(10, 22, 6), lam(0x3a2a28), 0, 11); add(new THREE.PlaneGeometry(4, 20), basic(0xff7a1a, { side: THREE.DoubleSide }), 0, 11, 3.1); add(new THREE.CircleGeometry(5, 12).rotateX(-Math.PI / 2), basic(0xff5a1a), 0, 0.3, 6); break;
    case 'jungleTemple': for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(14 - i * 3, 3, 14 - i * 3), lam(0x9a9070), 0, 1.5 + i * 3); add(new THREE.BoxGeometry(3, 3, 3), lam(0x6b5a40), 0, 13.5); add(new THREE.IcosahedronGeometry(2, 0), lam(0x3f9a3a), 5, 6, 3); break;
    case 'giantTree': add(new THREE.CylinderGeometry(1.6, 2.6, 26, 8), lam(0x6b4423), 0, 13); add(new THREE.IcosahedronGeometry(9, 1), lam(0x2f8a3a), 0, 28, 0, [1, 0.6, 1]); add(new THREE.IcosahedronGeometry(5, 0), lam(0x3fae4a), 4, 33, 2); break;
    case 'rainbowArch': [0xff4f4f, 0xffa23f, 0xffe14d, 0x5fe06a, 0x4fb0ff, 0xb06aff].forEach((c, i) => add(new THREE.TorusGeometry(18 - i * 1.2, 0.6, 6, 30, Math.PI), basic(c), 0, 4)); break;
    case 'waterfallIsland': add(new THREE.ConeGeometry(8, 12, 7), lam(0x8a7a6a), 0, 22).rotation.x = Math.PI; add(new THREE.CylinderGeometry(8, 8, 1.6, 7), lam(0x4fb34a), 0, 28.6); add(new THREE.PlaneGeometry(3, 26), basic(0x9fe0ff, { transparent: true, opacity: 0.75, side: THREE.DoubleSide }), 6, 15, 2); add(new THREE.IcosahedronGeometry(4, 0), lam(0xffffff), 6, 2, 2); break;
    case 'gridPyramid': add(new THREE.ConeGeometry(11, 16, 4), lam(0x0a0a18), 0, 8).rotation.y = Math.PI / 4; break;
    case 'neonTower': add(new THREE.BoxGeometry(3, 30, 3), lam(0x0a0a18), 0, 15); add(new THREE.TorusGeometry(3.4, 0.25, 6, 24), basic(0xff2bd6), 0, 31).rotation.x = Math.PI / 2; break;
    case 'prismCube': { const c = add(new THREE.BoxGeometry(8, 8, 8), lam(0x0a0a18), 0, 18); c.rotation.set(0.6, 0.8, 0); c.userData.spin = true; break; }
    default:
      if (!dragonWarLandmark(look, add)) add(new THREE.OctahedronGeometry(2, 0), lam(0xffd23f), 0, 3);
  }
  g.scale.setScalar(k);
  return g;
}

// ───────────────────────── v1.5 DRAGON WAR's hero landmarks (one per 2,000 m, BIG: 30–90 m) ─────────────────────────
// Readable silhouettes at 270 m/s: castles, the World Tree, the dragon graveyard… (names in dragonwar.js HEROES).
const STONE = 0x9a9488, DARK = 0x5a554e, SNOWY = 0xf4f8ff, WOOD = 0x7a5230, GOLD = 0xffc61a, OBS = 0x1d1a22, LAVA = 0xff6a1a, PALE = 0xf6ead0;
function dragonWarLandmark(look, add) {
  const cyl = (r0, r1, h, n = 10) => new THREE.CylinderGeometry(r0, r1, h, n);
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const cone = (r, h, n = 8) => new THREE.ConeGeometry(r, h, n);
  const tower = (x, z, r, h, roof, wall = STONE) => { add(cyl(r, r * 1.08, h), lam(wall), x, h / 2, z); add(cone(r * 1.35, r * 2.4), lam(roof), x, h + r * 1.2, z); };
  const flag = (x, y, z, c) => { add(box(0.4, 8, 0.4), lam(0xdfe6ee), x, y + 4, z); add(box(5, 3, 0.2), basic(c, { side: THREE.DoubleSide }), x + 2.6, y + 6.5, z); };
  const keep = (w, h, d, roof, x = 0, z = 0, wall = STONE) => { add(box(w, h, d), lam(wall), x, h / 2, z); add(cone(Math.max(w, d) * 0.75, h * 0.35, 4), lam(roof), x, h + h * 0.175, z).rotation.y = Math.PI / 4; };
  const windows = (w, y, z, n, c = 0xffd27a) => { for (let i = 0; i < n; i++) add(box(1.4, 2.4, 0.3), basic(c), -w / 2 + (i + 0.5) * (w / n), y, z); };
  switch (look) {
    // ── the Snowfields ──
    case 'frostKeep':
      add(box(44, 14, 32), lam(STONE), 0, 7); for (const [x, z] of [[-22, -16], [22, -16], [-22, 16], [22, 16]]) tower(x, z, 4.5, 26, SNOWY);
      keep(16, 36, 16, SNOWY); windows(16, 26, 8.2, 4); flag(0, 42, 0, 0x2f6fe8); add(box(46, 1.2, 34), lam(SNOWY), 0, 14.6); break;
    case 'frozenFalls':
      add(box(54, 46, 18), lam(0x8a9ab0), 0, 23); add(box(58, 4, 20), lam(SNOWY), 0, 47);
      add(new THREE.PlaneGeometry(16, 44), basic(0xbff0ff, { transparent: true, opacity: 0.85, side: THREE.DoubleSide }), 0, 22, 9.2);
      add(new THREE.CircleGeometry(14, 16).rotateX(-Math.PI / 2), lam(0xd8f6ff, { emissive: 0x1a4a6a }), 0, 0.4, 16);
      for (let i = 0; i < 7; i++) add(cone(1.4, 9, 5), lam(0xd8f6ff), -12 + i * 4, 40, 9.5).rotation.x = Math.PI; break;
    case 'standingStones':
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; add(box(4, 16 + (i % 3) * 3, 2.6), lam(0x8d8a80), Math.cos(a) * 20, 8, Math.sin(a) * 20).rotation.y = -a; }
      add(box(14, 3, 4), lam(0x8d8a80), 0, 20, -20); add(box(6, 2, 6), lam(SNOWY), 0, 1, 0); add(new THREE.CircleGeometry(24, 24).rotateX(-Math.PI / 2), lam(SNOWY), 0, 0.2, 0); break;
    case 'watchtowerGiant':
      add(cyl(6, 7.5, 52, 12), lam(STONE), 0, 26); add(cyl(9, 7, 4, 12), lam(DARK), 0, 54); add(cone(9.5, 14, 12), lam(0xb0402a), 0, 63);
      add(new THREE.SphereGeometry(2.6, 10, 8), basic(0xffa21f), 0, 58.5, 8); for (let i = 0; i < 4; i++) add(box(1.4, 2.6, 0.3), basic(0xffd27a), 0, 12 + i * 10, 6.2); flag(0, 70, 0, 0x2f6fe8); break;
    case 'dragonSkull': {
      add(new THREE.IcosahedronGeometry(14, 1), lam(0xece6da), 0, 8, 0, [1, 0.7, 1.6]); add(box(18, 5, 22), lam(0xd8d0c0), 0, 2, 16);
      for (const sx of [-1, 1]) { add(new THREE.SphereGeometry(3.2, 10, 8), basic(0x2a2a3a), sx * 6, 12, 10); const h = add(cone(2.6, 26, 8), lam(0xd8d0c0), sx * 9, 22, -6); h.rotation.set(-0.7, 0, sx * 0.5); }
      add(box(30, 2, 60), lam(SNOWY), 0, 0.5, 0); break; }
    // ── the Deep Forest ──
    case 'worldTree':
      add(cyl(7, 11, 80, 12), lam(0x5a3a22), 0, 40); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; add(cyl(1.5, 3.5, 22, 6), lam(0x5a3a22), Math.cos(a) * 12, 4, Math.sin(a) * 12).rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1); }
      add(new THREE.IcosahedronGeometry(34, 1), lam(0x2f8a3a), 0, 92, 0, [1, 0.55, 1]); add(new THREE.IcosahedronGeometry(20, 1), lam(0x3fae4a), 16, 110, 8, [1, 0.6, 1]);
      add(new THREE.IcosahedronGeometry(18, 1), lam(0x4fbf55), -18, 104, -6, [1, 0.6, 1]); for (let i = 0; i < 8; i++) add(new THREE.SphereGeometry(1.2, 8, 6), basic(0xfff2a8), Math.sin(i * 2.1) * 22, 80 + (i % 3) * 6, Math.cos(i * 2.1) * 22); break;
    case 'ruinedTemple':
      for (let i = 0; i < 3; i++) add(box(34 - i * 8, 3, 26 - i * 6), lam(0xa09a80), 0, 1.5 + i * 3, 0);
      for (let i = 0; i < 8; i++) add(cyl(1.4, 1.6, 10 + (i % 3) * 5, 8), lam(0xb8b098), -12 + i * 3.4, 9 + (i % 3) * 2.5, 9);
      add(box(26, 2, 5), lam(0x8a8468), -2, 22, 9).rotation.z = 0.12; add(new THREE.IcosahedronGeometry(5, 0), lam(0x3f9a3a), 10, 8, 4, [1.4, 0.7, 1]); add(new THREE.IcosahedronGeometry(4, 0), lam(0x2f7a33), -12, 21, 9); break;
    case 'stagStatue':
      add(box(18, 6, 10), lam(DARK), 0, 3); add(box(14, 7, 5), lam(0xb8b4a8), 0, 15, 0); for (const [x, z] of [[-5, -2], [5, -2], [-5, 2], [5, 2]]) add(box(1.6, 9, 1.6), lam(0xb8b4a8), x, 8, z);
      add(box(3, 9, 3), lam(0xb8b4a8), 7, 21, 0).rotation.z = -0.4; add(box(6, 3, 3), lam(0xb8b4a8), 10, 26, 0);
      for (const sz of [-1, 1]) for (let i = 0; i < 4; i++) add(box(0.8, 7 - i, 0.8), lam(0xc8c0a8), 9 + i * 0.8, 31 + i * 1.5, sz * (1.5 + i * 1.6)).rotation.x = sz * 0.5; break;
    case 'treeCitadel':
      add(cyl(6, 9, 70, 10), lam(0x5a3a22), 0, 35); add(new THREE.IcosahedronGeometry(26, 1), lam(0x2f8a3a), 0, 78, 0, [1, 0.5, 1]);
      for (let i = 0; i < 4; i++) { const a = i * 1.7, r = 12, y = 18 + i * 12; add(cyl(8, 8, 1.2, 12), lam(WOOD), Math.cos(a) * r, y, Math.sin(a) * r); add(box(6, 5, 6), lam(0xa0784a), Math.cos(a) * r, y + 3.2, Math.sin(a) * r); add(cone(5.2, 4, 4), lam(0xb0402a), Math.cos(a) * r, y + 7.6, Math.sin(a) * r).rotation.y = Math.PI / 4; add(box(1.4, 1.4, 1), basic(0xffd27a), Math.cos(a) * r, y + 3.5, Math.sin(a) * r + 3.1); }
      break;
    case 'fallenGiant':
      add(box(30, 10, 14), lam(0x8d8a80), 0, 5, 0).rotation.y = 0.2; add(new THREE.SphereGeometry(8, 12, 10), lam(0x8d8a80), -20, 7, 4); add(box(26, 6, 6), lam(0x8d8a80), 6, 4, 13).rotation.y = -0.3;
      for (let i = 0; i < 5; i++) add(new THREE.IcosahedronGeometry(4 + i, 0), lam(0x3f9a3a), -10 + i * 7, 10, (i % 2 ? -4 : 3), [1.4, 0.5, 1]); add(new THREE.SphereGeometry(1.6, 8, 6), basic(0x7fe3ff), -24, 9, 9); break;
    // ── the War Plains ──
    case 'greatTrebuchet': {
      for (const sz of [-6, 6]) { add(box(2, 34, 2), lam(WOOD), -6, 16, sz).rotation.z = 0.35; add(box(2, 34, 2), lam(WOOD), 6, 16, sz).rotation.z = -0.35; }
      add(box(22, 3, 16), lam(0x5a3a22), 0, 1.5, 0); const arm = add(box(2.2, 60, 2.2), lam(0x8a5a35), 0, 32, 0); arm.rotation.z = 0.9; add(box(10, 10, 10), lam(DARK), -20, 18, 0);
      add(new THREE.SphereGeometry(4, 10, 8), lam(0x8a8478), 24, 54, 0); flag(0, 34, 0, 0xc0392b); break; }
    case 'castleKeep':
      add(box(60, 18, 40), lam(STONE), 0, 9); for (const [x, z] of [[-30, -20], [30, -20], [-30, 20], [30, 20]]) tower(x, z, 5, 30, 0xc0392b);
      add(box(16, 26, 10), lam(DARK), 0, 13, 22); add(box(8, 12, 1), lam(0x2a1a10), 0, 6, 27.1); keep(20, 44, 20, 0xc0392b); windows(20, 32, 10.2, 5); flag(0, 52, 0, 0xc0392b); flag(30, 38, 20, GOLD); break;
    case 'siegeTowers':
      for (const [x, z, h] of [[-18, 0, 34], [0, 8, 40], [18, -4, 30]]) { add(box(9, h, 9), lam(WOOD), x, h / 2, z); add(box(10, 1.2, 10), lam(0x5a3a22), x, h * 0.66, z); add(box(8, 1, 12), lam(0x8a5a35), x, h - 2, z + 9).rotation.x = 0.7; flag(x, h, z, [0xc0392b, GOLD, 0x2f6fe8][Math.abs(x) % 3]); for (const sx of [-1, 1]) add(cyl(3, 3, 1.6, 10), lam(0x3a2a1a), x + sx * 4.6, 3, z).rotation.z = Math.PI / 2; } break;
    case 'warPavilion':
      for (let i = 0; i < 2; i++) add(cone(22 - i * 0.2, 26, 16, 1, true), lam(i ? 0xffffff : 0xc0392b, { side: THREE.DoubleSide }), 0, 13, 0).rotation.y = i * (Math.PI / 16);
      add(cyl(22, 22, 8, 16, 1, true), lam(0xe8dcc0, { side: THREE.DoubleSide }), 0, 4, 0); flag(0, 26, 0, GOLD);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; add(cone(5, 8, 6), lam(i % 2 ? 0x2f6fe8 : 0xe8dcc0), Math.cos(a) * 34, 4, Math.sin(a) * 34); } break;
    case 'fortress':
      add(cyl(40, 44, 16, 8), lam(DARK), 0, 8); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; tower(Math.cos(a) * 42, Math.sin(a) * 42, 4.5, 26, 0x3a2a28, DARK); }
      add(cyl(10, 12, 60, 10), lam(0x6a645c), 0, 30); add(cone(13, 18, 10), lam(0x8a1f1a), 0, 69); flag(0, 78, 0, 0xc0392b); windows(18, 46, 10.5, 4, 0xff8a3a); break;
    // ── the Scorched Firelands ──
    case 'dragonGraveyard':
      for (let i = 0; i < 9; i++) { const r = add(new THREE.TorusGeometry(14 - Math.abs(i - 4) * 1.4, 0.9, 6, 20, Math.PI), lam(0xece6da), 0, 0, -24 + i * 6); r.rotation.y = Math.PI / 2; r.rotation.z = 0; }
      for (let i = 0; i < 14; i++) add(box(2.4, 2.4, 3.4), lam(0xd8d0c0), 0, 14 - Math.abs(i - 7) * 0.6, -30 + i * 4.6);
      add(new THREE.IcosahedronGeometry(9, 1), lam(0xece6da), 0, 6, 36, [1, 0.7, 1.6]); for (const sx of [-1, 1]) add(cone(1.8, 18, 6), lam(0xd8d0c0), sx * 6, 14, 30).rotation.set(-0.6, 0, sx * 0.4); break;
    case 'obsidianGate':
      for (const sx of [-1, 1]) { add(cone(9, 70, 5), lam(OBS), sx * 24, 35, 0); add(cone(5, 40, 5), lam(0x2a2430), sx * 34, 20, 6); }
      add(new THREE.TorusGeometry(24, 2.2, 8, 32, Math.PI), basic(LAVA), 0, 30, 0); add(new THREE.TorusGeometry(20, 0.8, 6, 32, Math.PI), basic(0xffd27a), 0, 30, 0.5); break;
    case 'moltenForge':
      add(box(40, 20, 28), lam(0x3a302e), 0, 10); add(box(44, 3, 32), lam(0x2a2426), 0, 21.5);
      for (const x of [-12, 0, 12]) { add(cyl(3.5, 4.2, 26, 8), lam(0x4a3a36), x, 34, -6); add(cyl(3.6, 3.6, 1.6, 8), basic(LAVA), x, 47.5, -6); }
      add(box(16, 8, 1), basic(0xff8a3a), 0, 7, 14.2); add(new THREE.CircleGeometry(14, 16).rotateX(-Math.PI / 2), basic(0xff5a1a), 0, 0.4, 26); add(box(6, 4, 3), lam(0x22262c), 14, 2, 24); break;
    case 'broodNest':
      add(cone(16, 40, 7), lam(0x3a302e), 0, 20).rotation.x = 0; add(new THREE.TorusGeometry(14, 4, 8, 20), lam(0x6b4a2a), 0, 42, 0).rotation.x = Math.PI / 2;
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; add(new THREE.SphereGeometry(3.4, 10, 8), lam([0xc0392b, GOLD, 0x8a1f1a][i % 3], { emissive: 0x3a1000 }), Math.cos(a) * 7, 44.5, Math.sin(a) * 7, [1, 1.3, 1]); }
      add(new THREE.SphereGeometry(4, 10, 8), basic(0xffa040), 0, 44, 0); break;
    case 'burningMountain':
      add(cone(60, 80, 12, 1, true), lam(0x3a2a28), 0, 40); add(new THREE.CircleGeometry(12, 14).rotateX(-Math.PI / 2), basic(LAVA), 0, 78, 0);
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.4; const st = add(box(3, 70, 1.4), basic(0xff7a1a), Math.cos(a) * 30, 38, Math.sin(a) * 30); st.rotation.set(Math.sin(a) * 0.62, -a, Math.cos(a) * 0.62); }
      for (let i = 0; i < 4; i++) add(new THREE.IcosahedronGeometry(9 + i * 3, 0), lam(0x8a8480), i * 4, 92 + i * 12, -i * 3); break;
    // ── the Sky Castles ──
    // v1.5 §6 THE GOLDEN CITY (its gate, towers, the great plaza's colonnades and the citadel)
    case 'goldenCitadel':
      add(cone(30, 46, 8), lam(0x8a7a6a), 0, 30).rotation.x = Math.PI; add(cyl(31, 31, 4, 8), lam(PALE), 0, 54);
      add(box(34, 14, 24), lam(PALE), 0, 63); for (const [x, z] of [[-17, -12], [17, -12], [-17, 12], [17, 12]]) { tower(x, z, 3.6, 26, GOLD, PALE); add(new THREE.SphereGeometry(3.4, 10, 8), lam(GOLD, { emissive: 0x4a3200 }), x, 99, z); }
      tower(0, 0, 5, 44, GOLD, PALE); add(new THREE.SphereGeometry(6, 12, 10), lam(GOLD, { emissive: 0x4a3200 }), 0, 104, 0); flag(0, 112, 0, 0xc0392b); windows(34, 63, 12.2, 6); add(new THREE.IcosahedronGeometry(16, 1), lam(0xffffff), 6, 6, 0, [1.6, 0.5, 1.2]); break;
    case 'goldenGate':
      for (const z of [-9, 9]) { tower(0, z, 6, 56, GOLD, PALE); add(new THREE.SphereGeometry(4, 10, 8), lam(GOLD, { emissive: 0x4a3200 }), 0, 66, z); }
      add(box(12, 10, 12), lam(PALE), 0, 50, 0); add(new THREE.TorusGeometry(6, 1.2, 6, 14, Math.PI), lam(GOLD), 0, 38, 0).rotation.y = Math.PI / 2;
      for (const z of [-9, 9]) flag(0, 72, z, 0xc0392b); windows(12, 50, 6.2, 3); break;
    case 'goldenTower':
      add(box(14, 6, 14), lam(PALE), 0, 3); add(cyl(4.2, 5, 52, 10), lam(PALE), 0, 32); add(cyl(5.6, 5.6, 2, 10), lam(GOLD), 0, 58);
      add(new THREE.SphereGeometry(5, 12, 10), lam(GOLD, { emissive: 0x4a3200 }), 0, 62); add(cone(1.2, 14, 6), lam(GOLD), 0, 72); windows(8, 40, 4.4, 2); windows(8, 48, 4.4, 2); break;
    case 'goldenColonnade':
      add(box(18, 2, 140), lam(PALE), 0, 1); add(box(14, 2, 132), lam(PALE), 0, 3);
      for (let i = 0; i < 9; i++) { const z = -60 + i * 15; add(cyl(1.6, 1.8, 22, 10), lam(0xfff4d6), 0, 15, z); add(box(4, 1.4, 4), lam(GOLD), 0, 26.5, z); }
      add(box(6, 3, 134), lam(GOLD, { emissive: 0x3a2600 }), 0, 28.5, 0); add(box(4, 10, 6), lam(PALE), 0, 9, 0);
      add(new THREE.IcosahedronGeometry(3, 0), lam(GOLD, { emissive: 0x4a3200 }), 0, 17, 0, [1, 1.4, 1]); for (const z of [-66, 66]) flag(0, 30, z, 0xc0392b); break;
    case 'kingsBridge':
      for (const z of [-60, 60]) { add(cyl(12, 16, 70, 8), lam(0x8a7a6a), 0, 35, z); add(box(26, 18, 26), lam(0xf4f2ec), 0, 79, z); add(cone(16, 14, 4), lam(0x2f6fe8), 0, 95, z).rotation.y = Math.PI / 4; }
      add(box(8, 3, 120), lam(STONE), 0, 70, 0); for (let i = 0; i < 6; i++) add(new THREE.TorusGeometry(9, 1.4, 6, 16, Math.PI), lam(STONE), 0, 61, -50 + i * 20).rotation.y = Math.PI / 2;
      for (let i = 0; i < 9; i++) flag(0, 71.5, -48 + i * 12, i % 2 ? GOLD : 0xc0392b); break;
    case 'highCathedral':
      add(box(22, 34, 56), lam(0xe8e4dc), 0, 17); add(cyl(0.1, 16, 14, 4, 1), lam(0x6a7a9a), 0, 41, 0, [1, 1, 2.4]);
      for (const sx of [-1, 1]) { add(box(12, 50, 12), lam(0xe8e4dc), sx * 8, 25, 30); add(cone(7.5, 40, 4), lam(0x6a7a9a), sx * 8, 70, 30).rotation.y = Math.PI / 4; }
      add(new THREE.CircleGeometry(6, 18), basic(GOLD), 0, 30, 36.2); add(new THREE.CircleGeometry(4, 18), basic(0x5fd0ff), 0, 30, 36.3); for (let i = 0; i < 5; i++) add(box(1.6, 10, 0.3), basic(0xffd27a), 11.2, 14, -20 + i * 10).rotation.y = Math.PI / 2; break;
    case 'dragonThrone':
      for (let i = 0; i < 4; i++) add(box(50 - i * 10, 4, 40 - i * 8), lam(i % 2 ? 0x8a7a6a : STONE), 0, 2 + i * 4, 0);
      add(box(14, 30, 6), lam(GOLD), 0, 31, -6); add(box(14, 4, 12), lam(GOLD), 0, 18, 0);
      for (const sx of [-1, 1]) { const w = add(new THREE.PlaneGeometry(30, 22), lam(0x8a1f1a, { side: THREE.DoubleSide }), sx * 18, 40, -8); w.rotation.set(0, sx * 0.4, sx * 0.3); }
      add(new THREE.IcosahedronGeometry(5, 0), lam(0x8a1f1a), 0, 50, -8, [1, 1, 1.6]); for (const sx of [-1, 1]) add(cone(1.4, 8, 6), lam(GOLD), sx * 3, 56, -8).rotation.z = -sx * 0.4; break;
    case 'lastKeep':
      add(cone(36, 50, 8), lam(0x8a7a6a), 0, 30).rotation.x = Math.PI; add(cyl(37, 37, 4, 8), lam(0x4fb34a), 0, 56);
      add(box(36, 22, 30), lam(0xf4f2ec), 0, 69); add(box(26, 22, 22), lam(0xf4f2ec), 0, 91); add(box(16, 22, 14), lam(0xf4f2ec), 0, 113);
      add(cone(14, 26, 4), lam(GOLD), 0, 137).rotation.y = Math.PI / 4; for (const [x, z] of [[-18, -15], [18, -15], [-18, 15], [18, 15]]) { add(cyl(3.2, 3.2, 44, 8), lam(0xf4f2ec), x, 80, z); add(cone(4.4, 12, 8), lam(GOLD), x, 108, z); }
      windows(26, 92, 11.2, 5); windows(16, 114, 7.2, 3); flag(0, 150, 0, 0xc0392b); break;
    default: return false;
  }
  return true;
}

export function createSetPiecesView(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const hoopGeo = new THREE.TorusGeometry(3.6, 0.22, 6, 28);
  const hoopMat = basic(0xfff2a8, { transparent: true, opacity: 0.85 });
  const poleMat = lam(0xdfe6ee), poleGeo = new THREE.CylinderGeometry(0.5, 0.6, 1, 8);
  let items = [];      // { g, d }
  const spinners = [];
  return {
    // pieces = setPiecesFor(world); floor(x, d) = the floor height there; neon = the theme's neon
    // colours in a neon world (v1.2: dark faces + neon edges), else null.
    build(pieces, floor, neon = null) {
      for (const it of items) { root.remove(it.g); it.g.traverse((o) => { if (o.material?.map) o.material.map.dispose(); }); }
      items = []; spinners.length = 0;
      for (const p of pieces ?? []) {
        const g = new THREE.Group();
        if (p.kind === 'hoops') {
          for (let n = 0; n < p.n; n++) { const h = new THREE.Mesh(hoopGeo, hoopMat); const x = p.x + (n % 2 ? p.zig : -p.zig); h.position.set(x, floor(p.x, p.d) + p.y + (n % 2 ? 2 : 0), -(p.d + n * p.gap)); g.add(h); }
        } else if (p.kind === 'bannerArch') {
          const top = floor(0, p.d) + p.y;
          for (const x of [-31, 31]) { const pole = new THREE.Mesh(poleGeo, poleMat); const base = floor(x, p.d); pole.scale.y = top + 3 - base; pole.position.set(x, (top + 3 + base) / 2, -p.d); g.add(pole); }
          const flag = new THREE.Mesh(new THREE.PlaneGeometry(56, 6), new THREE.MeshBasicMaterial({ map: bannerTexture(p.text), side: THREE.DoubleSide, transparent: true }));
          flag.position.set(0, top + 3, -p.d);
          g.add(flag);
        } else if (p.kind === 'landmark') {
          const m = landmark(p.look, p.scale ?? 1);
          m.position.set(p.x, floor(p.x, p.d), -p.d);
          m.rotation.y = p.x < 0 ? 0.5 : -0.5;
          m.traverse((o) => { if (o.userData.spin) spinners.push(o); });
          g.add(m);
        } else continue; // coins are coins (coins.js); shapes are boost shapes (shapesview.js)
        if (neon) neonify(g, neon);
        g.visible = false;
        root.add(g);
        items.push({ g, d: p.d });
      }
    },
    update(planeD, dt) {
      for (const it of items) it.g.visible = it.d > planeD - 80 && it.d < planeD + 600;
      for (const s of spinners) s.rotation.z += dt * 0.8;
    },
  };
}
