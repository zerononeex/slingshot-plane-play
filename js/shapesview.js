// v1.0 BOOST SHAPES look: chunky neon frames (CIRCLE · SQUARE · OVAL · RECTANGLE · TRIANGLE), each with
// its word label floating beside it for the youngest pilots. A used frame dims until the next flight.
// Canvas labels are drawn once at load; each world builds its frames once; nothing per frame allocates.
import * as THREE from 'three';
import { SHAPES } from './shapes.js';

const NEON = { circle: 0x3fe0ff, square: 0x5fff7a, oval: 0xffe14d, rectangle: 0xff8a3d, triangle: 0xff4fd8 };

function labelTexture(text, color) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.font = 'italic 900 40px system-ui, -apple-system, "Segoe UI", Arial, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 8; g.strokeStyle = 'rgba(14, 22, 40, 0.85)'; g.strokeText(text, 128, 34);
  g.fillStyle = `#${color.toString(16).padStart(6, '0')}`; g.fillText(text, 128, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// The frame's outline as a closed list of points (metres, before world scale).
function outline(kind) {
  const s = SHAPES[kind], pts = [];
  if (kind === 'circle' || kind === 'oval') {
    const rx = kind === 'circle' ? s.r : s.rx, ry = kind === 'circle' ? s.r : s.ry;
    for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; pts.push([Math.cos(a) * rx, Math.sin(a) * ry]); }
  } else if (kind === 'triangle') {
    const h = (s.side * Math.sqrt(3)) / 2;
    pts.push([0, (2 * h) / 3], [-s.side / 2, -h / 3], [s.side / 2, -h / 3]);
  } else {
    const hw = kind === 'square' ? s.half : s.hw, hh = kind === 'square' ? s.half : s.hh;
    pts.push([-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]);
  }
  return pts;
}

export function createShapesView(scene) {
  const labels = Object.fromEntries(Object.keys(SHAPES).map((k) => [k, labelTexture(SHAPES[k].label, NEON[k])]));
  const mats = Object.fromEntries(Object.keys(SHAPES).map((k) => [k, new THREE.MeshBasicMaterial({ color: NEON[k] })]));
  const dimMat = new THREE.MeshBasicMaterial({ color: 0x8a93a6, transparent: true, opacity: 0.35, depthWrite: false });
  const geos = {};
  const tube = (kind) => {
    if (geos[kind]) return geos[kind];
    const pts = outline(kind).map(([x, y]) => new THREE.Vector3(x, y, 0));
    const curve = new THREE.CatmullRomCurve3(pts, true, kind === 'circle' || kind === 'oval' ? 'centripetal' : 'catmullrom', kind === 'circle' || kind === 'oval' ? 0.5 : 0);
    geos[kind] = new THREE.TubeGeometry(curve, kind === 'circle' || kind === 'oval' ? 64 : 48, 0.32, 6, true);
    return geos[kind];
  };
  const root = new THREE.Group();
  scene.add(root);
  const slots = [];
  const newSlot = () => {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(tube('circle'), mats.circle);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labels.circle, transparent: true, depthWrite: false }));
    label.scale.set(7, 1.75, 1);
    g.add(frame, label);
    g.visible = false;
    root.add(g);
    const o = { g, frame, label, kind: 'circle' };
    slots.push(o);
    return o;
  };
  for (let i = 0; i < 10; i++) newSlot(); // grows on demand (v1.1: the long runs carry more frames)
  return {
    build(shapes, ys, scale = 1) {
      for (const o of slots) o.g.visible = false;
      if (!shapes) return;
      while (slots.length < shapes.length) newSlot();
      shapes.forEach((sh, i) => {
        const o = slots[i];
        o.kind = sh.kind;
        o.frame.geometry = tube(sh.kind);
        o.frame.material = mats[sh.kind];
        o.label.material.map = labels[sh.kind];
        o.label.material.opacity = 1;
        o.label.material.needsUpdate = true;
        o.g.position.set(sh.x, ys[i], -sh.at);
        o.g.scale.setScalar(scale);
        o.label.position.set(SHAPES[sh.kind].bound + 3.6, SHAPES[sh.kind].bound * 0.6, 0);
        o.g.visible = true;
      });
    },
    setUsed(i) { const o = slots[i]; if (!o) return; o.frame.material = dimMat; o.label.material.opacity = 0.35; },
    update(t) { for (const k in mats) mats[k].color.setHex(NEON[k]).multiplyScalar(0.85 + 0.15 * Math.sin(t * 6)); },
  };
}
