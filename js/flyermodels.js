// v1.4 REWARD FLYERS, PART 1 — the ten flyers (+ the Dragonite skin) as real game models, built the
// game's way: three.js primitives with baked vertex colours (plane.js bakeShading — the v0.7 Sleek
// shading), thin silhouette edges, canvas decals, glowing unlit parts. Nose along −Z, up +Y.
// NOT wired into the game (Part 2 comes after the owner's approval): only flyers-showcase.html uses it.
// THE DRAGON (and its skin) carries a two-joint wing rig; animate() moves it in
// place every frame (no allocation): flap rate + amplitude follow flapEffort(speed, climb).
import * as THREE from 'three';
import { bakeShading } from './plane.js';
import { flyerById, flapEffort } from './flyers.js';

const lam = (color, extra) => new THREE.MeshLambertMaterial({ color, flatShading: true, vertexColors: true, ...extra });
const metal = (color) => new THREE.MeshPhongMaterial({ color, flatShading: true, vertexColors: true, specular: 0x9aa3b0, shininess: 46 });
const glow = (color, extra) => new THREE.MeshBasicMaterial({ color, ...extra });
const EDGE_MAT = new THREE.LineBasicMaterial({ color: 0x0d1626, transparent: true, opacity: 0.38 });
const edges = (mesh) => { mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 28), EDGE_MAT)); return mesh; };
const glassMat = () => new THREE.MeshPhongMaterial({ color: 0x2a3b66, specular: 0xffffff, shininess: 90, transparent: true, opacity: 0.85 });

// A small canvas decal (made once per build).
function decal(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide });
}

// Place a mesh: position, rotation (radians), optional scale, under `parent`.
function put(parent, geo, mat, [x = 0, y = 0, z = 0] = [], [rx = 0, ry = 0, rz = 0] = [], s = null) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  if (s) m.scale.set(...s);
  parent.add(m);
  return m;
}
const along = (geo) => geo.rotateX(Math.PI / 2); // a Y-axis primitive turned to lie along Z

// A flat wing panel in the XZ plane: outline points [x, z] (x outward from the root).
function panel(points, thick = 0.06) {
  const s = new THREE.Shape();
  points.forEach(([x, z], i) => (i ? s.lineTo(x, z) : s.moveTo(x, z)));
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
  g.rotateX(Math.PI / 2); // shape XY → XZ, extruded downward
  g.translate(0, thick / 2, 0);
  return g;
}
const mirror = (points) => points.map(([x, z]) => [-x, z]).reverse();

// A vertical fin: an outline [h, z] (h up from the root), canted `cant` rad outward to side sx.
const fin = (parent, pts, mat, pos, sx = 0, cant = 0, thick = 0.05) => edges(put(parent, panel(pts, thick), mat, pos, [0, 0, Math.PI / 2 - sx * cant]));
// A spinning propeller (hub + blades) facing −Z.
function propeller(parent, pos, r, bladeMat, hubMat, n = 1) { // n full-length blades = 2n tips
  const p = new THREE.Group();
  p.position.set(...pos);
  put(p, along(new THREE.ConeGeometry(r * 0.16, r * 0.4, 10)), hubMat, [0, 0, -r * 0.12], [Math.PI, 0, 0]);
  for (let i = 0; i < n; i++) put(p, new THREE.BoxGeometry(r * 2, r * 0.17, 0.05), bladeMat, [0, 0, 0], [0, 0.18, (i * Math.PI) / n]);
  parent.add(p);
  return p;
}
const exhaust = (parent, pos, r, len, color) => put(parent, along(new THREE.ConeGeometry(r, len, 12)), glow(color, { transparent: true, opacity: 0.85 }), [pos[0], pos[1], pos[2] + len / 2]);

// ───────────────────────── the flyers ─────────────────────────
const BUILD = {
  glider(m, c, parts) { // Mario Kart-style plane glider over a little go-kart
    const red = lam(c.body), white = lam(c.trim), dark = lam(c.dark), skin = lam(0xffd2a8);
    for (const sx of [-1, 1]) { // the striped glider wing, a gentle dihedral
      const w = edges(put(m, panel([[0, -0.7], [2.5, -0.35], [2.6, 0.15], [0, 0.5]], 0.08), red, [0, 1.6, 0], [0, 0, sx * 0.1], [sx, 1, 1]));
      for (const x of [0.9, 1.9]) put(w, new THREE.BoxGeometry(0.32, 0.1, x < 1 ? 1.05 : 0.8), white, [x, 0, x < 1 ? -0.07 : -0.1]);
      put(m, new THREE.CylinderGeometry(0.035, 0.035, 1.25, 6), dark, [sx * 0.45, 0.95, 0.05], [0, 0, sx * 0.3]); // struts down to the kart
    }
    edges(put(m, along(new THREE.CylinderGeometry(0.2, 0.14, 2.6, 10)), red, [0, 1.75, 0.5])); // the little fuselage
    put(m, new THREE.BoxGeometry(0.42, 0.06, 1.5), white, [0, 1.95, 0.4]);
    parts.prop = propeller(m, [0, 1.75, -0.85], 0.55, white, red);
    edges(put(m, panel([[0, 0], [0.9, 0.25], [0.9, 0.5], [0, 0.55], [-0.9, 0.5], [-0.9, 0.25]], 0.05), white, [0, 1.75, 1.45])); // tailplane
    fin(m, [[0, 0], [0.7, 0.3], [0.7, 0.5], [0, 0.6]], red, [0, 1.75, 1.35]);
    // the go-kart + its driver
    edges(put(m, new THREE.BoxGeometry(1.1, 0.32, 1.9), red, [0, 0, 0.1]));
    put(m, new THREE.BoxGeometry(1.2, 0.14, 0.25), white, [0, -0.05, -0.92]); // bumper
    put(m, new THREE.BoxGeometry(0.6, 0.45, 0.2), dark, [0, 0.35, 0.55]); // seat back
    for (const sx of [-1, 1]) for (const z of [-0.6, 0.75]) put(m, new THREE.CylinderGeometry(0.26, 0.26, 0.24, 14).rotateZ(Math.PI / 2), dark, [sx * 0.66, -0.12, z]);
    put(m, new THREE.SphereGeometry(0.24, 12, 10), skin, [0, 0.58, 0.3]); // driver
    put(m, new THREE.SphereGeometry(0.26, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), red, [0, 0.64, 0.3]); // red cap
    put(m, new THREE.BoxGeometry(0.3, 0.04, 0.18), red, [0, 0.64, 0.06]); // cap brim
    put(m, new THREE.BoxGeometry(0.3, 0.16, 0.24), lam(0x2f6fe8), [0, 0.28, 0.3]); // blue overalls
    put(m, new THREE.TorusGeometry(0.16, 0.03, 6, 14), dark, [0, 0.35, -0.12], [-0.6, 0, 0]); // steering wheel
  },

  tornado(m, c, parts) { // Sonic's red biplane
    const red = lam(c.body), white = lam(c.trim), dark = lam(c.dark);
    edges(put(m, along(new THREE.CylinderGeometry(0.46, 0.22, 3.2, 12)), red, [0, 0, 0.35]));
    edges(put(m, along(new THREE.CylinderGeometry(0.5, 0.48, 0.55, 14)), white, [0, 0, -1.4])); // engine cowl
    parts.prop = propeller(m, [0, 0, -1.72], 0.95, lam(0x8a6a4a), red);
    edges(put(m, new THREE.BoxGeometry(5.2, 0.09, 0.95), red, [0, 1.0, -0.45])); // upper wing
    edges(put(m, new THREE.BoxGeometry(4.9, 0.09, 0.9), red, [0, -0.32, -0.35])); // lower wing
    for (const sx of [-1, 1]) {
      for (const y of [1.0, -0.32]) put(m, new THREE.BoxGeometry(0.5, 0.11, y > 0 ? 0.97 : 0.92), white, [sx * 2.2, y, y > 0 ? -0.45 : -0.35]); // white tips
      for (const z of [-0.75, -0.15]) { put(m, new THREE.CylinderGeometry(0.035, 0.035, 1.32, 6), white, [sx * 1.85, 0.34, z]); put(m, new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6), dark, [sx * 0.32, 0.65, z]); } // struts
      put(m, new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6), dark, [sx * 0.3, -0.55, -0.65]); // landing gear
      put(m, new THREE.CylinderGeometry(0.22, 0.22, 0.12, 14).rotateZ(Math.PI / 2), dark, [sx * 0.4, -0.9, -0.65]);
    }
    edges(put(m, panel([[0, 0], [1.0, 0.25], [1.0, 0.55], [0, 0.6], [-1.0, 0.55], [-1.0, 0.25]], 0.05), red, [0, 0.05, 1.55])); // tailplane
    fin(m, [[0, -0.1], [0.8, 0.25], [0.8, 0.5], [0, 0.6]], red, [0, 0.15, 1.45]);
    for (const z of [-0.1, 0.75]) put(m, new THREE.TorusGeometry(0.28, 0.05, 6, 14), dark, [0, 0.42, z], [Math.PI / 2, 0, 0]); // two open seats
    const blue = lam(0x2456d8), orange = lam(0xf5a142); // the pilots: a blue hedgehog (back), an orange fox (front)
    put(m, new THREE.SphereGeometry(0.25, 12, 10), blue, [0, 0.62, 0.75]);
    for (let i = 0; i < 5; i++) put(m, along(new THREE.ConeGeometry(0.1, 0.45, 6)), blue, [(i - 2) * 0.1, 0.62 + (i % 2) * 0.12, 1.0], [0.3 - (i % 2) * 0.5, (i - 2) * 0.2, 0]); // quills
    put(m, new THREE.SphereGeometry(0.13, 10, 8), lam(0xffd2a8), [0, 0.57, 0.56], [], [1.2, 0.8, 0.6]); // muzzle
    put(m, new THREE.SphereGeometry(0.22, 12, 10), orange, [0, 0.58, -0.1]);
    for (const sx of [-1, 1]) put(m, new THREE.ConeGeometry(0.08, 0.25, 4), orange, [sx * 0.13, 0.82, -0.08], [0, 0, -sx * 0.3]); // ears
  },

  bluefalcon(m, c, parts) { // F-Zero anti-gravity racer
    const hull = lam(c.body), yellow = lam(c.trim), deep = lam(c.dark), white = lam(0xffffff);
    edges(put(m, panel([[0, -2.7], [0.5, -1.7], [1.15, 0.1], [1.35, 1.3], [1.05, 1.85], [-1.05, 1.85], [-1.35, 1.3], [-1.15, 0.1], [-0.5, -1.7]], 0.42), hull, [0, 0, 0]));
    edges(put(m, panel([[0, -1.6], [0.55, -0.4], [0.75, 1.5], [-0.75, 1.5], [-0.55, -0.4]], 0.25), deep, [0, 0.3, 0])); // raised deck
    put(m, new THREE.SphereGeometry(0.4, 14, 10), glassMat(), [0, 0.5, -0.35], [], [0.9, 0.6, 1.7]);
    for (const sx of [-1, 1]) {
      put(m, new THREE.BoxGeometry(0.12, 0.44, 2.4), yellow, [sx * 1.1, 0.0, 0.25], [0, sx * -0.12, 0]); // side stripes
      put(m, new THREE.BoxGeometry(0.1, 0.05, 1.2), yellow, [sx * 0.35, 0.23, -1.55], [0, sx * 0.33, 0]); // nose stripes
      edges(put(m, along(new THREE.CylinderGeometry(0.28, 0.3, 0.9, 12)), metal(0x9aa3b0), [sx * 0.6, 0.15, 1.95]));
      fin(m, [[0, 0], [0.55, 0.3], [0.55, 0.55], [0, 0.6]], hull, [sx * 1.15, 0.2, 1.2], sx, 0.25);
    }
    const flame = new THREE.Group();
    for (const sx of [-1, 1]) exhaust(flame, [sx * 0.6, 0.15, 2.4], 0.24, 1.6, 0x9fd8ff);
    m.add(flame);
    parts.flame = flame;
    put(m, new THREE.CircleGeometry(1.1, 24), glow(0x7fe0ff, { transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }), [0, -0.3, 0.2], [Math.PI / 2, 0, 0], [1, 1.6, 1]); // hover glow
    const num = decal(128, 128, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill(); g.fillStyle = '#14306e'; g.font = 'bold 64px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('07', 64, 68); });
    put(m, new THREE.CircleGeometry(0.32, 20), num, [0, 0.44, 0.9], [-Math.PI / 2, 0, Math.PI]);
    put(m, new THREE.BoxGeometry(0.5, 0.05, 0.1), white, [0, 0.2, -2.0]);
  },

  vicviper(m, c, parts) { // Gradius needle-nose fighter
    const white = lam(c.body), blue = lam(c.trim), red = lam(c.dark), grey = lam(0x8a93a3);
    edges(put(m, along(new THREE.CylinderGeometry(0.22, 0.4, 2.6, 8)), white, [0, 0, 0.3]));
    edges(put(m, along(new THREE.ConeGeometry(0.22, 2.0, 8)), white, [0, 0, -2.0], [Math.PI, 0, 0])); // the needle nose
    put(m, new THREE.SphereGeometry(0.2, 10, 8), glassMat(), [0, 0.22, -0.7], [], [1, 0.7, 2.0]);
    for (const sx of [-1, 1]) {
      const w = edges(put(m, panel([[0.15, 1.5], [0.25, -0.2], [0.75, -2.5], [1.05, -2.45], [0.95, -0.3], [2.0, 0.95], [2.0, 1.5]], 0.07), white, [0, -0.05, 0], [], [sx, 1, 1]));
      put(w, new THREE.BoxGeometry(0.22, 0.09, 1.6), blue, [0.85, 0, -1.3], [0, 0.25, 0]); // blue prong panels
      put(w, new THREE.BoxGeometry(1.0, 0.09, 0.2), red, [1.35, 0, 1.1]); // red trailing stripe
      fin(m, [[0, 0], [0.55, 0.35], [0.55, 0.6], [0, 0.65]], blue, [sx * 0.35, 0.15, 1.0], sx, 0.35);
      put(m, along(new THREE.CylinderGeometry(0.17, 0.2, 0.5, 10)), grey, [sx * 0.25, -0.05, 1.7]);
    }
    const flame = new THREE.Group();
    for (const sx of [-1, 1]) exhaust(flame, [sx * 0.25, -0.05, 1.95], 0.16, 1.1, 0x7fd8ff);
    m.add(flame);
    parts.flame = flame;
    for (const [x, y, z] of [[-1.1, 0.25, 2.6], [1.2, -0.35, 3.3]]) { // the two Option orbs
      put(m, new THREE.SphereGeometry(0.26, 14, 10), glow(0xff8a1a), [x, y, z]);
      put(m, new THREE.SphereGeometry(0.4, 14, 10), glow(0xffc04d, { transparent: true, opacity: 0.35, depthWrite: false }), [x, y, z]);
    }
  },

  raptor(m, c) { // F-22A stealth fighter
    const grey = lam(c.body), dark = lam(c.dark);
    edges(put(m, panel([[0, -3.0], [0.32, -1.9], [0.6, -0.7], [0.72, 1.6], [0.6, 2.15], [-0.6, 2.15], [-0.72, 1.6], [-0.6, -0.7], [-0.32, -1.9]], 0.42), grey, [0, 0, 0]));
    edges(put(m, panel([[0, -2.0], [0.3, -1.0], [0.35, 1.5], [-0.35, 1.5], [-0.3, -1.0]], 0.2), grey, [0, 0.25, 0])); // spine
    put(m, new THREE.SphereGeometry(0.24, 12, 8), new THREE.MeshPhongMaterial({ color: c.trim, specular: 0xffffff, shininess: 80, transparent: true, opacity: 0.9 }), [0, 0.38, -1.35], [], [1, 0.7, 2.6]); // gold canopy
    for (const sx of [-1, 1]) {
      edges(put(m, panel([[0.5, -0.65], [2.45, 1.15], [2.4, 1.5], [0.5, 1.3]], 0.06), grey, [0, 0, 0], [], [sx, 1, 1])); // diamond wing
      edges(put(m, panel([[0.5, 1.65], [1.65, 2.35], [1.65, 2.7], [0.5, 2.55]], 0.05), grey, [0, 0, 0], [], [sx, 1, 1])); // stabilator
      fin(m, [[0, 0.1], [0.95, 0.6], [0.95, 1.0], [0, 1.15]], grey, [sx * 0.5, 0.18, 1.0], sx, 0.45); // canted tails
      put(m, new THREE.BoxGeometry(0.32, 0.36, 0.8), dark, [sx * 0.7, -0.05, -0.55], [0, sx * 0.12, 0]); // intakes
      put(m, new THREE.BoxGeometry(0.38, 0.3, 0.35), dark, [sx * 0.3, 0, 2.25]); // square nozzles
      put(m, new THREE.BoxGeometry(0.28, 0.2, 0.05), glow(0xff9a3a), [sx * 0.3, 0, 2.43]);
    }
  },

  xfa27(m, c) { // Ace Combat XFA-27: forward-swept wings + canards
    const white = lam(c.body), red = lam(c.trim), dark = lam(c.dark);
    edges(put(m, along(new THREE.CylinderGeometry(0.32, 0.45, 3.4, 10)), white, [0, 0, 0.3]));
    edges(put(m, along(new THREE.ConeGeometry(0.32, 1.4, 10)), white, [0, 0, -2.1], [Math.PI, 0, 0]));
    put(m, new THREE.SphereGeometry(0.24, 12, 8), glassMat(), [0, 0.32, -1.0], [], [1, 0.75, 2.2]);
    put(m, new THREE.BoxGeometry(0.1, 0.06, 2.2), red, [0, 0.4, 0.4]);
    for (const sx of [-1, 1]) {
      const w = edges(put(m, panel([[0.35, 0.3], [2.3, -0.65], [2.45, -0.3], [0.35, 1.35]], 0.07), white, [0, -0.05, 0.4], [], [sx, 1, 1])); // forward-swept wing
      put(w, new THREE.BoxGeometry(0.9, 0.09, 0.14), red, [1.6, 0, -0.18], [0, 0.45, 0]);
      edges(put(m, panel([[0.3, -1.55], [1.05, -1.3], [1.05, -1.1], [0.3, -0.95]], 0.05), white, [0, 0.05, 0], [], [sx, 1, 1])); // canards
      fin(m, [[0, 0], [0.85, 0.45], [0.85, 0.8], [0, 0.95]], red, [sx * 0.4, 0.2, 1.1], sx, 0.35);
      put(m, along(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8)), white, [sx * 1.3, -0.2, 0.25]); // missile pods
      put(m, along(new THREE.ConeGeometry(0.06, 0.18, 8)), red, [sx * 1.3, -0.2, -0.3], [Math.PI, 0, 0]);
      put(m, along(new THREE.CylinderGeometry(0.22, 0.25, 0.3, 12, 1, true)), metal(0x555b66), [sx * 0.25, -0.05, 2.0]);
      exhaust(m, [sx * 0.25, -0.05, 2.15], 0.2, 1.0, 0xffa24a);
    }
  },

  xwing(m, c) { // Star Wars X-Wing, S-foils in attack position
    const hull = lam(c.body), red = lam(c.trim), dark = lam(c.dark);
    edges(put(m, new THREE.BoxGeometry(0.7, 0.6, 1.9), hull, [0, 0, 0.75]));
    edges(put(m, new THREE.CylinderGeometry(0.08, 0.42, 2.8, 4).rotateX(-Math.PI / 2).rotateZ(Math.PI / 4), hull, [0, -0.02, -1.6])); // long nose
    for (const sx of [-1, 1]) put(m, new THREE.BoxGeometry(0.03, 0.12, 1.5), red, [sx * 0.24, 0.0, -1.3], [0, -sx * 0.1, 0]); // red nose stripes
    put(m, new THREE.SphereGeometry(0.26, 12, 8), glassMat(), [0, 0.32, -0.15], [], [1, 0.7, 1.7]);
    put(m, new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), lam(0x2f6fe8), [0, 0.3, 0.55]); // astromech dome
    put(m, new THREE.CylinderGeometry(0.17, 0.17, 0.14, 12), lam(0xdfe6ee), [0, 0.25, 0.55]);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) { // four S-foils in an X, an engine on each
      const w = new THREE.Group();
      w.position.set(sx * 0.3, sy * 0.12, 0.9);
      w.rotation.z = sx * sy * 0.3;
      edges(put(w, panel([[0, -0.3], [2.3, -0.1], [2.3, 0.35], [0, 0.65]], 0.05), hull, [], [], [sx, 1, 1]));
      put(w, new THREE.BoxGeometry(0.8, 0.07, 0.14), red, [sx * 1.6, 0, 0.05]);
      put(w, along(new THREE.CylinderGeometry(0.035, 0.035, 1.6, 6)), dark, [sx * 2.32, 0, -0.55]); // wingtip cannon
      put(w, along(new THREE.CylinderGeometry(0.06, 0.06, 0.25, 6)), dark, [sx * 2.32, 0, -1.4]);
      edges(put(w, along(new THREE.CylinderGeometry(0.2, 0.2, 1.3, 12)), lam(0xc9ccd2), [sx * 0.45, sy * 0.18, 0.05]));
      put(w, along(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 12)), glow(0xff6a4a), [sx * 0.45, sy * 0.18, 0.72]);
      m.add(w);
    }
  },

  raven(m, c, parts) { // Ace Combat 7 ADF-11F: radical swept wings
    const body = lam(c.body), dark = lam(c.dark), lite = lam(0x6b7280);
    edges(put(m, panel([[0, -3.0], [0.3, -1.8], [0.55, 0.0], [0.6, 2.0], [-0.6, 2.0], [-0.55, 0.0], [-0.3, -1.8]], 0.4), body, [0, 0, 0]));
    edges(put(m, panel([[0, -2.2], [0.28, -0.6], [0.3, 1.6], [-0.3, 1.6], [-0.28, -0.6]], 0.2), lite, [0, 0.22, 0]));
    put(m, new THREE.BoxGeometry(0.32, 0.05, 0.6), glow(c.trim), [0, 0.1, -2.15]); // the red sensor eye
    put(m, new THREE.SphereGeometry(0.2, 10, 8), glassMat(), [0, 0.35, -1.0], [], [1, 0.6, 2.4]);
    for (const sx of [-1, 1]) {
      const w = edges(put(m, panel([[0.3, -1.0], [1.5, 0.5], [2.7, 1.75], [2.75, 2.15], [1.8, 1.8], [0.3, 1.7]], 0.06), body, [0, -0.02, 0], [0, 0, sx * -0.05], [sx, 1, 1])); // crescent wing
      put(w, new THREE.BoxGeometry(1.6, 0.08, 0.06), glow(c.trim), [1.55, 0, 0.5], [0, -0.78, 0]); // red leading-edge glow line
      fin(m, [[0, 0.2], [0.65, 0.65], [0.65, 0.9], [0, 1.0]], dark, [sx * 0.45, 0.15, 1.1], sx, 0.7);
    }
    put(m, along(new THREE.CylinderGeometry(0.3, 0.34, 0.3, 12, 1, true)), metal(0x2a2d33), [0, 0, 2.1]);
    parts.flame = exhaust(m, [0, 0, 2.2], 0.28, 3.0, 0x8fd0ff);
  },

  arwing(m, c) { // Star Fox all-range fighter
    const white = lam(c.body), blue = lam(c.trim), dark = lam(c.dark);
    edges(put(m, new THREE.CylinderGeometry(0.05, 0.8, 3.8, 4).rotateX(-Math.PI / 2).rotateZ(Math.PI / 4), white, [0, 0, -0.4], [], [1, 0.55, 1])); // the pointed wedge body
    edges(put(m, new THREE.BoxGeometry(1.0, 0.4, 0.7), white, [0, 0, 1.6]));
    put(m, new THREE.SphereGeometry(0.28, 12, 8), glassMat(), [0, 0.45, -0.35], [], [1, 0.7, 2.0]);
    fin(m, [[0, 0.2], [0.75, 0.75], [0.75, 1.0], [0, 1.15]], blue, [0, 0.35, 0.35]); // the blue tail fin
    for (const sx of [-1, 1]) {
      const w = edges(put(m, panel([[0, -0.1], [1.7, 0.45], [1.7, 0.9], [0, 1.2]], 0.07), white, [sx * 0.55, 0, 0.1], [0, 0, -sx * 0.32], [sx, 1, 1])); // drooped wing
      put(w, new THREE.BoxGeometry(0.9, 0.09, 0.12), blue, [0.9, 0, 0.35], [0, -0.3, 0]);
      edges(put(w, panel([[-0.25, 0.1], [0.15, -0.55], [0.95, -0.2], [1.05, 0.25], [0.6, 0.95], [-0.1, 1.0]], 0.07), blue, [1.68, 0, 0.35], [0, 0, Math.PI / 2 + 0.32])); // the blue tip blade, standing upright
      edges(put(m, along(new THREE.CylinderGeometry(0.22, 0.24, 0.9, 12)), lam(0xc9ccd2), [sx * 0.42, -0.05, 1.35]));
      exhaust(m, [sx * 0.42, -0.05, 1.8], 0.2, 1.1, 0x5f9bff);
    }
  },

  dragon(m, c, parts, def) { // THE DRAGON (and, recoloured with antennae, the Dragonite skin)
    const nite = def.id === 'dragonite';
    const body = lam(c.body), belly = lam(c.trim), dark = lam(c.dark), horn = lam(c.horn);
    edges(put(m, new THREE.SphereGeometry(0.62, 16, 12), body, [0, 0, 0.3], [], nite ? [1.1, 1.05, 2.0] : [1, 0.95, 2.1]));
    for (let i = 0; i < 6; i++) put(m, new THREE.BoxGeometry(0.62 - Math.abs(i - 2.5) * 0.06, 0.08, 0.22), belly, [0, -0.52 + Math.abs(i - 2.5) * 0.03 - (nite ? 0.05 : 0), -0.4 + i * 0.26]); // belly plates
    put(m, along(new THREE.CylinderGeometry(0.22, 0.34, 0.9, 10)), body, [0, 0.32, -1.25], [-0.45, 0, 0]); // neck
    const head = new THREE.Group();
    head.position.set(0, 0.62, -1.75);
    m.add(head);
    edges(put(head, new THREE.BoxGeometry(0.5, 0.42, 0.75), body, [0, 0, 0]));
    edges(put(head, new THREE.BoxGeometry(0.4, 0.24, 0.5), body, [0, -0.08, -0.55])); // snout
    put(head, new THREE.BoxGeometry(0.34, 0.07, 0.42), belly, [0, -0.22, -0.5]); // jaw
    for (const sx of [-1, 1]) {
      if (nite) { // antennae, curling forward
        put(head, new THREE.CylinderGeometry(0.025, 0.035, 0.7, 6), body, [sx * 0.14, 0.5, -0.05], [-0.45, 0, -sx * 0.15]);
        put(head, new THREE.CylinderGeometry(0.02, 0.025, 0.35, 6), body, [sx * 0.19, 0.82, -0.32], [-1.3, 0, -sx * 0.15]);
      } else put(head, new THREE.ConeGeometry(0.08, 0.55, 8), horn, [sx * 0.18, 0.32, 0.25], [-0.9, 0, sx * -0.25]); // horns
      put(head, new THREE.SphereGeometry(0.06, 8, 6), glow(nite ? 0x1d1d22 : 0xffe14d), [sx * 0.2, 0.08, -0.22]); // eyes
      put(head, new THREE.SphereGeometry(0.03, 6, 4), glow(0x1d1d22), [sx * 0.08, -0.02, -0.8]); // nostrils
    }
    if (!nite) for (let i = 0; i < 7; i++) put(m, new THREE.ConeGeometry(0.08, 0.28, 4), horn, [0, 0.55 - i * 0.02, -0.75 + i * 0.32]); // back spikes
    const tail = new THREE.Group();
    tail.position.set(0, 0.05, 1.5);
    m.add(tail);
    let z = 0;
    for (let i = 0; i < 6; i++) { const r = 0.26 - i * 0.04; put(tail, along(new THREE.CylinderGeometry(r * 0.8, r, 0.42, 8)), body, [0, -i * 0.04, z + 0.2]); if (!nite) put(tail, new THREE.ConeGeometry(0.06, 0.2, 4), horn, [0, r + 0.05 - i * 0.04, z + 0.2]); z += 0.4; }
    if (!nite) edges(put(tail, panel([[0, 0], [0.35, 0.45], [0, 0.7], [-0.35, 0.45]], 0.05), dark, [0, -0.22, z + 0.05])); // spiked tail tip
    parts.tail = tail;
    for (const sx of [-1, 1]) for (const z2 of [-0.3, 0.8]) { // claw feet
      put(m, new THREE.CylinderGeometry(0.08, 0.1, 0.4, 6), body, [sx * 0.34, -0.62, z2]);
      for (const cx of [-0.06, 0, 0.06]) put(m, new THREE.ConeGeometry(0.03, 0.14, 4), nite ? belly : horn, [sx * 0.34 + cx, -0.85, z2 - 0.06], [-Math.PI / 2 - 0.4, 0, 0]);
    }
    parts.wings = BUILD_WING.membrane(m, c, 'dragon');
  },
};

// The flap rig: each wing = an inner group (shoulder hinge) + an outer group (wrist hinge).
const BUILD_WING = {
  // The Dragon: a bony leading edge with a leathery membrane (scalloped trailing edge).
  membrane(m, c, kind) {
    const big = kind === 'dragon', out = [];
    const mem = lam(c.membrane, { side: THREE.DoubleSide }), bone = lam(big ? c.horn : c.dark);
    for (const sx of [-1, 1]) {
      const inner = new THREE.Group(), outer = new THREE.Group();
      const reach = big ? 1.5 : 1.35;
      inner.position.set(sx * (big ? 0.45 : 0.28), big ? 0.35 : 0.12, big ? -0.1 : -0.15);
      outer.position.set(sx * reach, 0, 0);
      m.add(inner); inner.add(outer);
      put(inner, new THREE.CylinderGeometry(0.06, 0.08, reach, 6).rotateZ(Math.PI / 2), bone, [sx * reach / 2, 0, 0]);
      edges(put(inner, panel([[0, -0.1], [reach, 0], [reach, big ? 0.9 : 0.7], [reach * 0.55, big ? 1.15 : 0.85], [0, big ? 1.2 : 0.8]], 0.03), mem, [], [], [sx, 1, 1]));
      const tip = big ? 1.9 : 1.85;
      put(outer, new THREE.CylinderGeometry(0.04, 0.06, tip, 6).rotateZ(Math.PI / 2), bone, [sx * tip / 2, 0, 0]);
      if (big) put(outer, new THREE.ConeGeometry(0.06, 0.25, 4).rotateZ(-sx * Math.PI / 2), bone, [sx * (tip + 0.1), 0, 0]); // wing claw
      edges(put(outer, panel([[0, 0], [tip, -0.05], [tip * 0.85, 0.35], [tip * 0.55, 0.55], [tip * 0.3, 0.75], [0, 0.9]], 0.03), mem, [], [], [sx, 1, 1]));
      out.push({ inner, outer, side: sx });
    }
    return out;
  },
};

// Build one flyer by id ('dragonite' = the Dragon in the Dragonite skin). Returns
// { root, model, def, wings, animate(dt, speed, climb) }.
export function buildFlyer(id) {
  const def = flyerById(id);
  if (!def) throw new Error(`no flyer ${id}`);
  const root = new THREE.Group(), model = new THREE.Group(), parts = {};
  root.add(model);
  BUILD[def.skinOf ?? def.id](model, def.colors, parts, def);
  bakeShading(model);
  const wings = parts.wings ?? [];
  let phase = 0, t = 0;
  // Per frame, in place: the flap (effort from speed + climb), the propellers, flame flicker, tail sway.
  function animate(dt, speed = 30, climb = 0) {
    t += dt;
    if (def.flap) {
      const effort = flapEffort(speed, climb);
      phase += dt * Math.PI * 2 * def.flap.rate * (0.5 + effort);
      const a = def.flap.amp * effort;
      for (const w of wings) {
        w.inner.rotation.z = w.side * (0.08 + a * Math.sin(phase));
        w.outer.rotation.z = w.side * (a * 0.7 * Math.sin(phase - 0.8));
      }
      model.position.y = -0.12 * effort * Math.sin(phase); // the body bobs against the stroke
    }
    if (parts.prop) parts.prop.rotation.z += dt * 28;
    if (parts.flame) parts.flame.scale.set(1, 1, 0.85 + 0.15 * Math.sin(t * 31) + 0.1 * Math.sin(t * 17));
    if (parts.tail) parts.tail.rotation.y = 0.12 * Math.sin(t * 1.7);
  }
  return { root, model, def, wings, animate };
}
