// The "Wooden Trainer", built from three.js primitives (no GLB could be downloaded in
// the build sandbox). Nose points along -Z. Every shop item is VISIBLE on the model
// and its look shows its level (setLoadout).
import * as THREE from 'three';
import { funLevel } from './funlines.js';
import { buildFlyer } from './flyermodels.js';

// v0.7 art pass: every plane material carries baked vertex colours (lighter on top, the colour
// mid, deeper on the belly) so paint jobs still recolour through material.color.
const lam = (color, extra) => new THREE.MeshLambertMaterial({ color, flatShading: true, vertexColors: true, ...extra });
// Metal bits (cowls, intake, hub, struts, rims): a subtle Phong sheen — no environment maps.
const metal = (color) => new THREE.MeshPhongMaterial({ color, flatShading: true, vertexColors: true, specular: 0x9aa3b0, shininess: 46 });

// Bake top-light / belly-shade vertex colours into every mesh of a built model (once, at load).
const _n = new THREE.Vector3(), _nm = new THREE.Matrix3();
export function bakeShading(root, top = 1, belly = 0.56) {
  root.updateMatrixWorld(true);
  root.traverse((m) => {
    if (!m.isMesh || !m.material?.vertexColors) return;
    const g = m.geometry, nrm = g.attributes.normal, n = nrm.count;
    _nm.getNormalMatrix(m.matrixWorld);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      _n.fromBufferAttribute(nrm, i).applyMatrix3(_nm).normalize();
      const t = (_n.y + 1) / 2;                                 // 0 = belly, 1 = top
      const k = (belly + (top - belly) * t * t * (3 - 2 * t)) * (0.86 + 0.14 * Math.abs(_n.y)); // + a darker rim on the sides
      const dust = Math.max(0, 0.45 - t) / 0.45 * 0.08;                // a soft warm dust tint on bellies + wheels
      col[i * 3] = k; col[i * 3 + 1] = k * (1 - dust * 0.6); col[i * 3 + 2] = k * (1 - dust * 1.4);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  });
}

// Glass: dark blue-black with a baked diagonal highlight stripe (canvas, made once).
let glassTex = null;
function glassTexture() {
  if (glassTex) return glassTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const base = g.createLinearGradient(0, 0, 0, 64);
  base.addColorStop(0, '#2a3b66'); base.addColorStop(1, '#0b1224');
  g.fillStyle = base; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(10, 64); g.lineTo(44, 0); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(26, 64); g.lineTo(58, 4); g.stroke();
  glassTex = new THREE.CanvasTexture(c);
  glassTex.colorSpace = THREE.SRGBColorSpace;
  return glassTex;
}
const glass = (extra) => new THREE.MeshPhongMaterial({ color: 0xffffff, map: glassTexture(), specular: 0xffffff, shininess: 90, ...extra });

// ---------- v0.7 decals (canvas-made once; they ride on top, so paint jobs still show) ----------
// Plane identity: tail number (delivery order) + a two-tone stripe kit [main, pin].
const IDENTITY = {
  'Wooden Trainer': { num: '01', stripe: [0x3fc5ff, 0xffffff] }, 'Canyon Cruiser': { num: '02', stripe: [0xfff1d6, 0x7a2a12] },
  'City Hopper': { num: '03', stripe: [0xe8262c, 0x2b3a55] }, 'Snow Owl': { num: '04', stripe: [0x3f86e8, 0xffffff] },
  'Dune Hawk': { num: '05', stripe: [0x8a5a1a, 0xfff1d6] }, 'Sea Falcon': { num: '06', stripe: [0xffffff, 0xff7a1a] },
  Starship: { num: '07', stripe: [0xff7a1a, 0xffffff] }, Barnstormer: { num: '08', stripe: [0xfff1d6, 0xd8262c] },
  'Sky Dart': { num: '09', stripe: [0xff7a1a, 0x3b4252] }, 'Void Runner': { num: '10', stripe: [0x00e5ff, 0xff2bd6] },
  'Sky Knight': { num: '13', stripe: [0xffc61a, 0x1f4fa8] }, // v1.5
  Starhound: { num: '14', stripe: [0xff7a1a, 0x2f6fe8] }, // v1.6
};
const hexCss = (n) => `#${n.toString(16).padStart(6, '0')}`;
function canvasTex(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 2;
  return { c, g: c.getContext('2d'), t };
}
const decalMat = (map) => new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide });

// Thin dark silhouette lines on the few big parts (fuselage, wing decks, tail): ~8 extra draw calls.
const EDGE_MAT = new THREE.LineBasicMaterial({ color: 0x0d1626, transparent: true, opacity: 0.38 });
// v1.2 the VOID RUNNER: the same lines, glowing cyan (its neon trim).
const RUNNER_EDGE_MAT = new THREE.LineBasicMaterial({ color: 0x00e5ff });
function edges(mesh, angle = 28) {
  const l = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, angle), EDGE_MAT);
  mesh.add(l);
  return l;
}

// The little pilot (sits in the cockpit; pops out on eject or after a Bonk).
function buildPilot() {
  const g = new THREE.Group();
  const suit = lam(0x2f6fd6);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.26), suit);
  torso.position.y = 0.18;
  g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), lam(0xffcc9a));
  head.position.y = 0.5;
  g.add(head);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), lam(0xe8262c));
  helmet.position.y = 0.53;
  g.add(helmet);
  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.06), lam(0x3fc5ff));
  goggles.position.set(0, 0.54, -0.14);
  g.add(goggles);
  const arms = [-1, 1].map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.21, 0.32, 0);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.3, 0.09), suit);
    arm.position.y = -0.13;
    pivot.add(arm);
    g.add(pivot);
    return pivot;
  });
  // Parachute: canopy + 4 lines, hidden until the seat fires.
  const chute = new THREE.Group();
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), lam(0xff7a1a, { side: THREE.DoubleSide }));
  canopy.scale.y = 0.6;
  canopy.position.y = 3.0;
  chute.add(canopy);
  const stripe = new THREE.Mesh(new THREE.SphereGeometry(1.62, 10, 2, 0, Math.PI * 2, 0.55, 0.35), lam(0xffffff, { side: THREE.DoubleSide }));
  stripe.scale.y = 0.6;
  stripe.position.y = 3.0;
  chute.add(stripe);
  const lineGeo = new THREE.CylinderGeometry(0.015, 0.015, 1, 3);
  for (const [lx, lz] of [[-1.3, 0], [1.3, 0], [0, -1.3], [0, 1.3]]) {
    const line = new THREE.Mesh(lineGeo, lam(0xffffff));
    const top = new THREE.Vector3(lx, 3.0, lz), bot = new THREE.Vector3(0, 0.4, 0);
    line.position.copy(top).add(bot).multiplyScalar(0.5);
    line.scale.y = top.distanceTo(bot);
    line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.sub(bot).normalize());
    chute.add(line);
  }
  chute.visible = false;
  g.add(chute);
  return { group: g, arms, chute };
}

export function buildPlane(tune) {
  const bodyMat = lam(tune.bodyColor);
  const wingMat = lam(tune.wingColor);
  const accentMat = lam(tune.accentColor);
  const darkMat = metal(0x333344);

  const root = new THREE.Group();   // positioned + rotated by the game
  const model = new THREE.Group();  // local offsets / tumble spin
  root.add(model);

  // Fuselage: tapered tube along Z.
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.22, 2.2, 8), bodyMat);
  body.rotation.x = Math.PI / 2;
  model.add(body);
  edges(body);
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.4, 8), bodyMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = -1.3;
  model.add(nose);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.18, 8), accentMat);
  stripe.rotation.x = Math.PI / 2;
  stripe.position.z = -0.75;
  model.add(stripe);

  // Windscreen in front of the pilot: dark glossy glass with a highlight stripe.
  const screen = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), glass());
  screen.scale.set(1, 0.8, 0.7);
  screen.position.set(0, 0.3, -0.42);
  model.add(screen);

  // Engine cowl ring (colour = engine level).
  const cowlMat = metal(0x888888);
  const cowl = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.07, 6, 12), cowlMat);
  cowl.position.z = -1.48;
  model.add(cowl);

  // Wings: separate left/right halves, each shown only when owned.
  const span = 3.2 * tune.wingScale;
  const makeWing = (side) => {
    const g = new THREE.Group();
    const slab = new THREE.Mesh(new THREE.BoxGeometry(span / 2, 0.1, 0.75), wingMat);
    slab.position.set(side * span / 4, -0.08, -0.35);
    g.add(slab);
    edges(slab);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.375, 0.375, 0.1, 8), wingMat);
    tip.position.set(side * span / 2, -0.08, -0.35);
    g.add(tip);
    // Biplane (the Barnstormer): a top wing on two struts, part of the same owned half.
    const upper = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(span / 2 - 0.3, 0.09, 0.7), wingMat);
    top.position.set(side * (span / 4 + 0.15), 0.72, -0.5);
    upper.add(top);
    edges(top);
    const topTip = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.09, 8), wingMat);
    topTip.position.set(side * span / 2, 0.72, -0.5);
    upper.add(topTip);
    for (const k of [0.45, 0.85]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.06), strutMat);
      strut.position.set(side * (span / 2) * k, 0.32, -0.42);
      upper.add(strut);
    }
    upper.visible = false;
    g.add(upper);
    g.userData.upper = upper;
    model.add(g);
    return g;
  };
  const strutMat = metal(0x5a3a22);
  const leftWing = makeWing(-1);  // -x = screen-left from the chase camera
  const rightWing = makeWing(1);

  // Tail.
  const tail = new THREE.Group();
  const stab = new THREE.Mesh(new THREE.BoxGeometry(1.3 * tune.wingScale, 0.08, 0.4), wingMat);
  stab.position.set(0, 0.05, 1.0);
  tail.add(stab);
  edges(stab);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.45), wingMat);
  fin.position.set(0, 0.38, 1.0);
  tail.add(fin);
  edges(fin);
  model.add(tail);

  // Propeller.
  const prop = new THREE.Group();
  prop.position.z = -1.52;
  const hub = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.25, 8), darkMat);
  hub.rotation.x = -Math.PI / 2;
  prop.add(hub);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 0.04), darkMat);
  prop.add(blade);
  // v1.2 the Void Runner's NEON RING propeller: a glowing ring around the spinning blades.
  const neonRing = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.04, 6, 32), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
  neonRing.visible = false;
  prop.add(neonRing);
  prop.visible = !!tune.propeller;
  model.add(prop);

  // Pilot + ejector seat back.
  const pilot = buildPilot();
  const cockpitPos = new THREE.Vector3(0, 0.02, -0.05);
  pilot.group.position.copy(cockpitPos);
  model.add(pilot.group);
  const seat = new THREE.Group();
  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.08), lam(0xe8262c));
  seatBack.position.set(0, 0.42, 0.16);
  seat.add(seatBack);
  const seatStripe = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.1), lam(0xffd400));
  seatStripe.position.set(0, 0.58, 0.16);
  seat.add(seatStripe);
  model.add(seat);

  // v1.0 FUN LINES on the plane (VISIBILITY RULE: each level shows).
  // SECRET RADAR: a radarDome + antenna behind the cockpit.
  const radar = new THREE.Group();
  const dishMat = metal(0xdfe6ee);
  const radarDome = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), dishMat);
  radar.add(radarDome);
  const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 4), dishMat);
  radarMast.position.y = 0.3; radar.add(radarMast);
  const tipLamp = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), new THREE.MeshBasicMaterial({ color: 0x5fffa0 }));
  tipLamp.position.y = 0.54; radar.add(tipLamp);
  radar.position.set(0, 0.38, 0.55);
  radar.visible = false;
  model.add(radar);
  // PARTY HORN: a brass hornBell + a squeeze hornBulb on the fuselage's side.
  const horn = new THREE.Group();
  const hornMat = metal(0xffc61a);
  const hornBell = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 10, 1, true), hornMat);
  hornBell.rotation.x = -Math.PI / 2; hornBell.position.z = -0.16; horn.add(hornBell);
  const hornBulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), lam(0xe8262c));
  hornBulb.position.z = 0.1; horn.add(hornBulb);
  horn.position.set(0.42, 0.12, -0.5);
  horn.visible = false;
  model.add(horn);
  // SPOILER BRAKES: a tail spoiler that pops up while braking.
  const spoiler = new THREE.Group();
  const spoilerFlap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.22), lam(0xe8262c));
  spoilerFlap.position.z = -0.11; spoiler.add(spoilerFlap);
  spoiler.position.set(0, 0.12, 1.2);
  spoiler.visible = false;
  model.add(spoiler);
  let spoilerUp = 0, spoilerWant = 0;
  // HELIUM BALLOONS: +1 tied to the tail per level (the Starship: glowing anti-grav orbs).
  const BALLOON_COLS = [0xff4fa3, 0xffd23f, 0x3fc5ff, 0x5fe06a, 0xb06aff];
  const balloons = BALLOON_COLS.map((c, i) => {
    const b = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), lam(c, { emissive: 0x000000 }));
    ball.scale.y = 1.2; ball.position.y = 1.1 + (i % 2) * 0.25; b.add(ball);
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.0, 3), lam(0xffffff));
    string.position.y = 0.5; b.add(string);
    b.position.set((i - 2) * 0.16, 0.2, 1.05);
    b.rotation.z = (i - 2) * 0.12;
    b.visible = false;
    model.add(b);
    return { b, ball };
  });
  let chuteScale = 1;
  const CHUTE_COLS = [0xff7a1a, 0xff4fa3, 0x3fc5ff, 0x5fe06a, 0xb06aff, 0xffc61a];

  // Wheels (always fitted; size/colour = BOUNCY WHEELS level). Wheel bottoms sit at y -0.6.
  const tireMat = lam(0x222222);
  const rimMat = metal(0x888888);
  const stripeMat = lam(0xe8262c);
  const gear = new THREE.Group();
  const wheels = [-1, 1].map((side) => {
    const w = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.14, 12), tireMat);
    tire.rotation.z = Math.PI / 2;
    w.add(tire);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.16, 8), rimMat);
    rim.rotation.z = Math.PI / 2;
    w.add(rim);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 4, 12), stripeMat);
    band.rotation.y = Math.PI / 2;
    band.position.x = side * 0.075;
    w.add(band);
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), darkMat);
    strut.position.set(-side * 0.08, 0.2, 0);
    w.add(strut);
    w.userData = { band, side };
    gear.add(w);
    return w;
  });
  model.add(gear);

  // Fuel tank under the body (size = TANK level).
  const tank = new THREE.Group();
  const tankBody = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.8, 10), lam(0xd9dde3));
  tankBody.rotation.x = Math.PI / 2;
  tank.add(tankBody);
  for (const z of [-0.4, 0.4]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), lam(0xe8262c));
    cap.position.z = z;
    tank.add(cap);
  }
  tank.position.set(0, -0.42, 0.45);
  model.add(tank);

  // Horseshoe coin magnet under the tail (size/colour = MAGNET level).
  const magnet = new THREE.Group();
  const magMat = lam(0xd63a3a);
  const tipMat = lam(0xffffff);
  const shoe = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.07, 6, 12, Math.PI), magMat);
  shoe.rotation.z = Math.PI; // opening points down
  magnet.add(shoe);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.14), magMat);
    leg.position.set(side * 0.2, -0.06, 0);
    magnet.add(leg);
    const tipM = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.15), tipMat);
    tipM.position.set(side * 0.2, -0.16, 0);
    magnet.add(tipM);
  }
  magnet.position.set(0, -0.32, 0.95);
  model.add(magnet);

  // Seaplane floats (the Sea Falcon) — shown per stage plane.
  const floats = new THREE.Group();
  const floatMat = lam(0xffffff);
  for (const side of [-1, 1]) {
    const pontoon = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 2.0, 8), floatMat);
    pontoon.rotation.x = Math.PI / 2;
    pontoon.position.set(side * 0.75, -0.62, -0.25);
    floats.add(pontoon);
    const tipF = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 8), floatMat);
    tipF.rotation.x = -Math.PI / 2;
    tipF.position.set(side * 0.75, -0.62, -1.45);
    floats.add(tipF);
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), darkMat);
    strut.position.set(side * 0.6, -0.4, -0.3);
    floats.add(strut);
  }
  floats.visible = false;
  model.add(floats);

  // Rocket exhaust (the Comet): a glowing cone behind the tail.
  const exhaustMat = new THREE.MeshBasicMaterial({ color: 0xffa21f, transparent: true, opacity: 0.85 });
  const exhaust = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 10).rotateX(-Math.PI / 2), exhaustMat);
  exhaust.position.set(0, 0, 1.55);
  exhaust.visible = false;
  model.add(exhaust);

  // Jet (the Sky Dart): a dark nose intake instead of a propeller; the engine ring moves to the
  // tail as the afterburner ring and the exhaust flame grows with speed.
  const intakeMat = new THREE.MeshPhongMaterial({ color: 0x1d2433, side: THREE.DoubleSide, flatShading: true, vertexColors: true, specular: 0x9aa3b0, shininess: 46 });
  const intake = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.25, 12, 1, true).rotateX(Math.PI / 2), intakeMat);
  intake.position.z = -1.55;
  intake.visible = false;
  model.add(intake);
  let jet = false;

  // Starship (Space): a pointed nose, a cockpit bubble, fins (the wing parts), a stabilizer
  // with an antenna, an ion exhaust (bigger + bluer per ION ENGINE level) and a TRACTOR BEAM.
  const shipParts = new THREE.Group();
  const shipNose = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 10).rotateX(-Math.PI / 2), bodyMat);
  shipNose.position.z = -1.9;
  shipParts.add(shipNose);
  const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 8), glass({ transparent: true, opacity: 0.85 }));
  bubble.scale.set(1, 0.85, 1.4);
  bubble.position.set(0, 0.32, -0.3);
  shipParts.add(bubble);
  shipParts.visible = false;
  model.add(shipParts);
  const antenna = new THREE.Group();
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 5), lam(0xdddddd));
  mast.position.set(0, 0.95, 1.05);
  antenna.add(mast);
  const tipBall = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff3030 }));
  tipBall.position.set(0, 1.32, 1.05);
  antenna.add(tipBall);
  antenna.visible = false;
  const beamMat = new THREE.MeshBasicMaterial({ color: 0x9ff6ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.2, 14, 1, true).translate(0, -1.6, 0), beamMat);
  beam.position.set(0, -0.3, -0.2);
  beam.visible = false;
  model.add(beam);
  let ship = false, beamT = 0, ionLevel = 1, runner = false, trailKind = null;
  const ION = [0xffb06a, 0xc8e0ff, 0x9fd0ff, 0x6fb4ff, 0x3f7bff, 0x5a5cff, 0x7a4dff, 0x9d3dff, 0xc23dff, 0xff4fe0]; // v1.0: Lv6–10 push into violet
  root.rotation.order = 'YXZ'; // yaw, then pitch, then roll

  // Each stage flies its own plane: colours, wing size, floats.
  let defaultBody = tune.bodyColor;
  function setStagePlane(def) {
    defaultBody = def.body;
    baseFlyer = def.flyer ?? null; // v1.4 a reward flyer: its own model in place of the airframe
    mountFlyer(baseFlyer);
    wingMat.color.setHex(def.wing);
    accentMat.color.setHex(def.accent);
    const ws = def.wingScale / tune.wingScale;
    leftWing.scale.x = rightWing.scale.x = ws;
    tail.scale.x = ws;
    floats.visible = !!def.floats;
    exhaust.visible = !!def.exhaust || !!def.jet;
    leftWing.userData.upper.visible = rightWing.userData.upper.visible = !!def.biplane;
    jet = !!def.jet;
    ship = !!def.ship;
    runner = !!def.runner;
    trailKind = def.trail ?? null; // v1.3: ember / leaf / cloud trails
    neonRing.visible = runner;
    model.traverse((o) => { if (o.material === EDGE_MAT || o.material === RUNNER_EDGE_MAT) o.material = runner ? RUNNER_EDGE_MAT : EDGE_MAT; });
    prop.visible = !jet && !ship;
    intake.visible = jet;
    shipParts.visible = ship;
    screen.visible = !ship;
    cowl.position.z = jet || ship ? 1.35 : -1.48; // the afterburner / ion ring (colour = engine level)
    leftWing.rotation.z = ship ? -0.3 : 0;        // fins angle up
    rightWing.rotation.z = ship ? 0.3 : 0;
    exhaustMat.color.setHex(jet ? 0xff7a2e : ship ? ION[ionLevel - 1] : 0xffa21f);
    // v0.7 identity: stripes, roundel number and name lettering per plane; scorch behind exhausts.
    const id = IDENTITY[def.name] ?? { num: '00', stripe: [def.accent, 0xffffff] };
    stripeMain.color.setHex(id.stripe[0]);
    stripePin.color.setHex(id.stripe[1]);
    drawIdentity(def.name, id.num, id.stripe[0], id.stripe[1]);
    for (const m of scorches) m.visible = jet || ship;
    core.visible = ship;
  }

  function setParts(parts) {
    leftWing.visible = !!parts.leftWing;
    rightWing.visible = !!parts.rightWing;
    tail.visible = !!parts.tail;
    antenna.visible = ship && !!parts.tail;
  }
  tail.add(antenna);

  // Show exactly what this stage record owns, at its level.
  function setLoadout(rec, { ENGINE_LV, TANK_LV, MAGNET_LV, WHEELS_LV, paint }) {
    setParts(rec.parts);
    cowlMat.color.setHex(ENGINE_LV.cowl);
    ionLevel = ENGINE_LV.level;
    if (ship) exhaustMat.color.setHex(ION[ionLevel - 1]);
    tank.visible = TANK_LV.level > 0;
    tank.scale.setScalar(TANK_LV.scale || 1);
    magnet.visible = MAGNET_LV.level > 0;
    magnet.scale.setScalar(MAGNET_LV.scale || 1);
    magMat.color.setHex(MAGNET_LV.color);
    tipMat.color.setHex(MAGNET_LV.tips);
    tipMat.emissive.setHex(MAGNET_LV.glowTips ? 0xffffff : 0x000000);
    magMat.emissive.setHex(MAGNET_LV.sparkle ? 0x6a4a00 : 0x000000);
    const ws = WHEELS_LV.scale;
    tireMat.color.setHex(WHEELS_LV.tire);
    rimMat.color.setHex(WHEELS_LV.rim);
    for (const w of wheels) {
      w.scale.setScalar(ws);
      w.position.set(w.userData.side * 0.55, -0.6 + 0.25 * ws, -0.45);
      w.userData.band.visible = WHEELS_LV.stripe;
      w.userData.baseY = w.position.y;
    }
    seat.visible = !!rec.eject;
    // v1.0 fun lines
    const rl = funLevel(rec, 'radar'), hl = funLevel(rec, 'horn'), bl = funLevel(rec, 'brakes'), gl = funLevel(rec, 'balloons'), cl = funLevel(rec, 'chute');
    radar.visible = rl > 0; radar.scale.setScalar(0.85 + 0.12 * rl); tipLamp.material.color.setHex(rl >= 5 ? 0xffc61a : 0x5fffa0);
    horn.visible = hl > 0; horn.scale.setScalar(0.8 + 0.12 * hl); hornMat.color.setHex(hl >= 5 ? 0xff6ad5 : hl >= 4 ? 0xffffff : 0xffc61a);
    spoiler.visible = bl > 0; spoilerFlap.scale.set(0.8 + 0.08 * bl, 1, 0.8 + 0.1 * bl);
    balloons.forEach((o, i) => { o.b.visible = i < gl; o.ball.material.emissive.setHex(ship ? BALLOON_COLS[i] : 0x000000); o.ball.scale.setScalar(ship ? 0.8 : 1).y *= ship ? 1 : 1.2; });
    chuteScale = 1 + 0.12 * cl;                                    // MEGA CHUTE: bigger…
    pilot.chute.children[0].material.color.setHex(CHUTE_COLS[cl]);  // …and striped / recoloured per level
    pilot.chute.children[1].material.color.setHex(cl >= 3 ? 0xffd23f : 0xffffff);
    bodyMat.color.setHex(paint.id === 'default' ? defaultBody : paint.color);
    if (baseFlyer) { // v1.4: a skin paint swaps the model (the Dragonite); other paints recolour the flyer's body
      mountFlyer(paint.skin ?? baseFlyer);
      for (const m of flyer.bodyMats) m.color.setHex(paint.id === 'default' || paint.skin ? flyer.body : paint.color);
    }
    rainbow = !!paint.rainbow;
    nebula = !!paint.nebula;
    dragonwings = !!paint.dragonwings;
    starfire = !!paint.starfire;
    // v1.0 Lv10 rainbow sheen on the engine cowl, the magnet and the wheel rims.
    gearSheen = [ENGINE_LV.rainbow ? cowlMat : null, MAGNET_LV.rainbow ? magMat : null, WHEELS_LV.rainbow ? rimMat : null].filter(Boolean);
  }
  let gearSheen = [];

  let rainbow = false, nebula = false, dragonwings = false, starfire = false;
  let squash = 0;
  const _hsl = new THREE.Color();
  // Per-frame visual life: rainbow paint, wheel squash after a bounce.
  // How fast the prop turns (rad/s): fast = a blur disc, slow = the blades.
  function propBlurFor(rate) {
    const k = Math.min(1, Math.max(0, (rate - 14) / 16));
    blurMat.opacity = 0.9 * k;
    propBlur.visible = k > 0.02;
    blade.visible = k < 0.75;
  }
  function animate(dt, t, flying, speed = 0, boosting = false, climb = 0) {
    if (flyer) { // v1.4: the Dragon flaps (hard when slow or climbing), props spin, flames flicker
      flyer.f.animate(dt, flying ? speed : 30, flying ? climb : 0);
    }
    if (jet) intakeGlowMat.opacity = flying ? Math.min(0.9, 0.2 + speed / 120) * (0.75 + 0.25 * Math.sin(t * (6 + speed * 0.2))) : 0.15;
    if (ship) { coreMat.opacity = 0.75 + Math.random() * 0.25; core.scale.set(1, 1, boosting ? 1.6 + Math.random() * 0.6 : 1); }
    if (rainbow) bodyMat.color.copy(_hsl.setHSL((t * (flying ? 0.12 : 0.08)) % 1, 0.85, 0.55));
    // v1.0: the spoiler eases up/down; balloons bob
    spoilerUp += (spoilerWant - spoilerUp) * Math.min(1, dt * 14);
    spoiler.rotation.x = -spoilerUp * 1.1;
    for (let i = 0; i < balloons.length; i++) if (balloons[i].b.visible) balloons[i].b.rotation.x = Math.sin(t * 2.2 + i) * 0.12 - (flying ? 0.35 : 0);
    for (let i = 0; i < gearSheen.length; i++) gearSheen[i].color.copy(_hsl.setHSL((t * 0.15 + i * 0.33) % 1, 0.9, 0.62));
    if (nebula) bodyMat.color.copy(_hsl.setHSL(0.5 + 0.28 * (0.5 + 0.5 * Math.sin(t * 1.3)), 0.7, 0.5)); // swirling teal ↔ purple
    if (starfire) bodyMat.color.copy(_hsl.setHSL(0.6 + 0.06 * Math.sin(t * 2.1), 0.85, 0.5 + 0.12 * (0.5 + 0.5 * Math.sin(t * 5.3)))); // v1.6: blue fire with a pulsing core
    if (dragonwings) bodyMat.color.copy(_hsl.setHSL(0.01 + 0.07 * (0.5 + 0.5 * Math.sin(t * 1.7)), 0.85, 0.36 + 0.08 * Math.sin(t * 2.3))); // v1.5: crimson scales glowing ember-gold
    if (beamT > 0) { beamT = Math.max(0, beamT - dt); beamMat.opacity = 0.28 * Math.min(1, beamT / 0.15) * (0.8 + 0.2 * Math.sin(t * 30)); }
    beam.visible = beamT > 0;
    if (exhaust.visible) {
      const f = 0.8 + Math.random() * 0.4;
      // The jet flame grows with speed; the ion exhaust pulses with speed and grows per ION ENGINE level.
      const len = jet ? (flying ? 1 + Math.min(3, speed / 40) : 0.7)
        : ship ? (0.7 + 0.18 * ionLevel) * (flying ? 1.2 + Math.min(1.2, speed / 70) * (0.8 + 0.2 * Math.sin(t * 18)) : 0.9)
        : flying ? 1.6 : 1;
      exhaust.scale.set(f, f, f * len);
      exhaust.position.z = 1.55 + (len - 1) * 0.45;
    }
    if (flyer && (rainbow || nebula || dragonwings || starfire)) for (const m of flyer.bodyMats) m.color.copy(bodyMat.color);
    squash = Math.max(0, squash - dt);
    const k = squash > 0 ? 0.55 + 0.45 * (1 - squash / 0.15) : 1;
    for (const w of wheels) {
      w.scale.y = w.scale.x * k;
      w.scale.z = w.scale.x * (2 - k);
    }
  }
  function squashWheels() { squash = 0.15; }

  // Put the pilot back in the cockpit (after an eject or a Bonk).
  function seatPilot() {
    model.add(pilot.group);
    pilot.group.visible = !flyer;
    pilot.group.position.copy(cockpitPos);
    pilot.group.rotation.set(0, 0, 0);
    pilot.group.scale.setScalar(1);
    pilot.chute.visible = false;
    pilot.chute.scale.setScalar(1);
    for (const a of pilot.arms) a.rotation.set(0, 0, 0);
  }

  // TRACTOR BEAM: a soft cone shimmer while a coin is being pulled (Starship only).
  function tractor() { if (ship) beamT = 0.35; }
  // ---- decals: stripes, roundel + number, name lettering, scorch; prop blur disc; intake glow ----
  const stripeMain = lam(0x3fc5ff), stripePin = lam(0xffffff);
  const rTop = (z) => 0.32 - 0.09 * z;        // the fuselage's top line along z (it tapers to the tail)
  const fuseStripe = new THREE.Group();
  const sMain = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.02, 2.0), stripeMain);
  const sPin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 2.0), stripePin);
  for (const m of [sMain, sPin]) { m.rotation.x = Math.atan(0.09); m.position.set(0, rTop(0) + 0.1 + (m === sPin ? 0.012 : 0), 0); fuseStripe.add(m); }
  model.add(fuseStripe);
  for (const w of [leftWing, rightWing]) { // wing-tip stripes (ride with the owned wing)
    const side = w === leftWing ? -1 : 1;
    for (const [dx, mat] of [[0.38, stripeMain], [0.26, stripePin]]) {
      const ws = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.012, 0.78), mat);
      ws.position.set(side * (span / 2 - dx), -0.025, -0.35);
      w.add(ws);
    }
  }
  const roundel = canvasTex(128, 128), nameTex = canvasTex(512, 64), scorch = canvasTex(64, 32);
  const sideDecal = (tex, w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), decalMat(tex.t)); m.position.set(x, y, z); m.rotation.y = ry; model.add(m); return m; };
  for (const sd of [-1, 1]) sideDecal(roundel, 0.42, 0.42, sd * 0.33, 0.06, 0.52, sd * Math.PI / 2 + sd * 0.09);
  for (const sd of [-1, 1]) { // …and on both sides of the tail fin (shown with the TAIL part)
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), decalMat(roundel.t));
    m.position.set(sd * 0.05, 0.4, 1.0);
    m.rotation.y = sd * Math.PI / 2;
    tail.add(m);
  }
  for (const sd of [-1, 1]) sideDecal(nameTex, 1.1, 0.14, sd * 0.4, 0.02, -0.2, sd * Math.PI / 2 + sd * 0.09);
  const scorches = [-1, 1].map((sd) => sideDecal(scorch, 0.5, 0.2, sd * 0.25, 0, 0.98, sd * Math.PI / 2 + sd * 0.09));
  { // the scorch gradient is the same for every plane
    const g = scorch.g, gr = g.createLinearGradient(0, 0, 64, 0);
    gr.addColorStop(0, 'rgba(20,16,12,0)'); gr.addColorStop(1, 'rgba(20,16,12,0.55)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 32);
    scorch.t.needsUpdate = true;
  }
  function drawIdentity(name, num, accent, pin) {
    let g = roundel.g;
    g.clearRect(0, 0, 128, 128);
    g.fillStyle = hexCss(pin); g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2); g.fill();
    g.fillStyle = hexCss(accent); g.beginPath(); g.arc(64, 64, 50, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(64, 64, 38, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#121a2b'; g.font = 'italic 900 54px system-ui, -apple-system, "Segoe UI", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(num, 64, 68);
    roundel.t.needsUpdate = true;
    g = nameTex.g;
    g.clearRect(0, 0, 512, 64);
    g.font = 'italic 900 44px system-ui, -apple-system, "Segoe UI", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 6; g.strokeStyle = 'rgba(10,16,30,0.75)'; g.strokeText(name.toUpperCase(), 256, 34);
    g.fillStyle = '#ffffff'; g.fillText(name.toUpperCase(), 256, 34);
    nameTex.t.needsUpdate = true;
  }

  // PROP BLUR: a soft disc + faint arc streaks replaces the hard blades when it spins fast.
  const blurTex = canvasTex(128, 128);
  {
    const g = blurTex.g, gr = g.createRadialGradient(64, 64, 6, 64, 64, 62);
    gr.addColorStop(0, 'rgba(40,44,56,0.55)'); gr.addColorStop(0.7, 'rgba(60,64,78,0.22)'); gr.addColorStop(1, 'rgba(60,64,78,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 3;
    for (const a of [0.3, 2.4, 4.4]) { g.beginPath(); g.arc(64, 64, 50, a, a + 0.7); g.stroke(); }
    blurTex.t.needsUpdate = true;
  }
  const blurMat = new THREE.MeshBasicMaterial({ map: blurTex.t, transparent: true, depthWrite: false, opacity: 0, side: THREE.DoubleSide });
  const propBlur = new THREE.Mesh(new THREE.CircleGeometry(0.7, 24), blurMat);
  propBlur.position.z = -0.02;
  prop.add(propBlur);
  // JET: the intake glow ring pulses with speed.
  const intakeGlowMat = new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0, depthWrite: false });
  const intakeGlow = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.04, 6, 20), intakeGlowMat);
  intakeGlow.position.z = -1.62;
  intake.add(intakeGlow);
  intakeGlow.position.set(0, 0, 0);
  // STARSHIP: a bright core inside the exhaust (a longer flicker tongue at boost).
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false });
  const core = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.9, 8).rotateX(-Math.PI / 2), coreMat);
  exhaust.add(core);

  // Contrail anchors: the wing tips (they ride the wing groups, so ship fins tilt with them),
  // or the fuselage sides when a wing isn't fitted.
  const anchors = [leftWing, rightWing].map((w, i) => { const a = new THREE.Object3D(); a.position.set((i ? 1 : -1) * span / 2, -0.08, -0.2); w.add(a); return a; });
  const bodyAnchors = [-1, 1].map((sd) => { const a = new THREE.Object3D(); a.position.set(sd * 0.45, 0, 0.2); model.add(a); return a; });
  function trailPoints(outL, outR) {
    (leftWing.visible ? anchors[0] : bodyAnchors[0]).getWorldPosition(outL);
    (rightWing.visible ? anchors[1] : bodyAnchors[1]).getWorldPosition(outR);
  }

  bakeShading(model); // v0.7: the shaded, less-toy look (vertex colours, baked once)

  // v1.4 REWARD FLYERS: the airframe (fuselage, wings, tail, prop, wheels, decals, per-plane extras)
  // goes into one group the flyer hides; the pilot rides inside the flyer's own cockpit (hidden until
  // an eject or a tumble pops them out). The fun-line extras, tank and magnet stay on.
  const keep = new Set([pilot.group, seat, radar, horn, spoiler, tank, magnet, ...balloons.map((o) => o.b)]);
  const airframe = new THREE.Group();
  for (const o of [...model.children]) if (!keep.has(o)) airframe.add(o);
  model.add(airframe);
  const FLYER_FIT = 3.8; // the flyer's longest side (length or span), about the stock plane's span
  const flyerCache = new Map();
  let flyer = null, baseFlyer = null;
  function mountFlyer(id) {
    if (flyer?.id === id) return;
    if (flyer) model.remove(flyer.holder);
    flyer = null;
    if (id) {
      let e = flyerCache.get(id);
      if (!e) {
        const f = buildFlyer(id), holder = new THREE.Group();
        holder.add(f.root);
        const box = new THREE.Box3().setFromObject(f.root), size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
        const k = FLYER_FIT / Math.max(size.x, size.z);
        f.root.scale.setScalar(k);
        f.root.position.set(-mid.x * k, -0.6 - box.min.y * k, -mid.z * k); // sits where the stock wheels touch down
        const body = f.def.colors.body, bodyMats = [];
        f.root.traverse((o) => { if (o.isMesh && o.material.color?.getHex() === body && !bodyMats.includes(o.material)) bodyMats.push(o.material); });
        e = { id, f, holder, body, bodyMats };
        flyerCache.set(id, e);
      }
      flyer = e;
      model.add(e.holder);
    }
    airframe.visible = !flyer;
    if (pilot.group.parent === model) pilot.group.visible = !flyer;
  }
  const setSpoiler = (on) => { spoilerWant = on ? 1 : 0; };
  return { setSpoiler, get chuteScale() { return chuteScale; }, root, model, prop, propBlurFor, trailPoints, get trailLook() { return jet ? 'jet' : ship ? 'ship' : runner ? 'runner' : trailKind ?? 'prop'; }, get accent() { return stripeMain.color.getHex(); }, setParts, setLoadout, setStagePlane, animate, squashWheels, pilot, seatPilot, magnet, tank, tractor, get isShip() { return ship; }, get isFlyer() { return !!flyer; } };
}
