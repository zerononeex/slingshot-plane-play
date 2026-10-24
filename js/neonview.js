// v1.2 NEON VOID look for the run's physics layer (neon.js): barrier walls (dark slabs, neon edges, a
// bright frame round the gap), laser slaloms (glowing posts; the beams between them are light and
// harmless), sliding walls (the same wall, moved every frame by the same clock the colliders use)
// and the SLIPSTREAM lanes (glowing edges + a ribbon of chevrons rushing forward). Built once per
// world; only what is near the plane is shown. No per-frame allocation.
import * as THREE from 'three';
import { WALL_HALF, WALL_TOP, WALL_DEPTH, gapX } from './neon.js';
import { neonify, edgeMat } from './neonlook.js';

const BOX = new THREE.BoxGeometry(1, 1, 1), LIT = new THREE.MeshLambertMaterial(); // neonify swaps LIT for the dark face
const SHOW_BEHIND = 60, SHOW_AHEAD = 700;

// One shared chevron texture for every lane (scrolled once per frame).
function chevronTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.lineCap = 'round';
  g.beginPath(); g.moveTo(12, 44); g.lineTo(32, 20); g.lineTo(52, 44); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function createNeonView(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const chevrons = chevronTexture();
  let items = [], sliders = [], ribbonMat = null;
  const block = (g, x0, x1, y0, y1) => {
    if (x1 - x0 < 0.05 || y1 - y0 < 0.05) return;
    const m = new THREE.Mesh(BOX, LIT);
    m.scale.set(x1 - x0, y1 - y0, WALL_DEPTH);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
    g.add(m);
  };
  // A wall around a gap centred at the group's x = 0, reaching `left` / `right` (relative) to the sides.
  const wall = (o, neon, left, right) => {
    const g = new THREE.Group(), y0 = o.y - o.h / 2, y1 = o.y + o.h / 2, gx0 = -o.w / 2, gx1 = o.w / 2;
    block(g, left, gx0, 0, WALL_TOP); block(g, gx1, right, 0, WALL_TOP);
    block(g, gx0, gx1, -2, y0); block(g, gx0, gx1, y1, WALL_TOP);
    neonify(g, neon, neon.obstacle);
    const frame = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[gx0, y0], [gx1, y0], [gx1, y1], [gx0, y1]].map(([x, y]) => new THREE.Vector3(x, y, WALL_DEPTH / 2 + 0.05))), edgeMat(neon.terrain));
    g.add(frame);
    return g;
  };
  return {
    build(run, neon) {
      for (const it of items) root.remove(it.g);
      items = []; sliders = [];
      if (!run) return;
      for (const o of run.walls) { const g = wall(o, neon, -WALL_HALF - o.x, WALL_HALF - o.x); g.position.set(o.x, 0, -o.d); items.push({ g, d: o.d }); }
      // a sliding wall is wider than the corridor, so its edges never show as it glides
      for (const o of run.sliders) { const r = WALL_HALF + o.amp + 20; const g = wall(o, neon, -r, r); g.position.set(o.x, 0, -o.d); items.push({ g, d: o.d }); sliders.push({ g, o }); }
      const beamMat = edgeMat(neon.feature);
      for (const row of run.lasers) {
        const g = new THREE.Group();
        for (const p of row.posts) block(g, p.x - p.r, p.x + p.r, 0, WALL_TOP);
        neonify(g, neon, neon.feature);
        const pts = [];
        for (let i = 0; i + 1 < row.posts.length; i++) for (const y of [8, 20, 32, 44, 56]) pts.push(new THREE.Vector3(row.posts[i].x, y, 0), new THREE.Vector3(row.posts[i + 1].x, y, 0));
        g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), beamMat));
        g.position.z = -row.d;
        items.push({ g, d: row.d });
      }
      ribbonMat = new THREE.MeshBasicMaterial({ color: neon.lane, map: chevrons, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      for (const l of run.lanes) {
        const g = new THREE.Group(), len = l.d1 - l.d0;
        const geo = new THREE.PlaneGeometry(l.w, len).rotateX(-Math.PI / 2);
        const uv = geo.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (l.w / 8), uv.getY(i) * (len / 8)); // a chevron every 8 m
        const ribbon = new THREE.Mesh(geo, ribbonMat);
        ribbon.position.set(l.x, l.y, -(l.d0 + l.d1) / 2);
        g.add(ribbon);
        const e = [];
        for (const x of [l.x0, l.x1]) for (const y of [l.y0, l.y1]) e.push(new THREE.Vector3(x, y, -l.d0), new THREE.Vector3(x, y, -l.d1));
        g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(e), edgeMat(neon.lane)));
        items.push({ g, d: l.d0, d1: l.d1 });
      }
      for (const it of items) { it.g.visible = false; root.add(it.g); }
    },
    // planeD = the plane's distance; t = the flight's clock (the sliding walls' timing).
    update(planeD, t, dt) {
      for (const it of items) it.g.visible = (it.d1 ?? it.d) > planeD - SHOW_BEHIND && it.d < planeD + SHOW_AHEAD;
      for (const s of sliders) if (s.g.visible) s.g.position.x = gapX(s.o, t);
      chevrons.offset.y -= dt * 2.5;
    },
  };
}
