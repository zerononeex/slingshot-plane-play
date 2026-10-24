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
    default: add(new THREE.OctahedronGeometry(2, 0), lam(0xffd23f), 0, 3);
  }
  g.scale.setScalar(k);
  return g;
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
