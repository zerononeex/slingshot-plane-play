// The "Wooden Trainer", built from three.js primitives (no GLB could be downloaded in
// the build sandbox). Nose points along -Z. Every shop item is VISIBLE on the model
// and its look shows its level (setLoadout).
import * as THREE from 'three';

const lam = (color, extra) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });

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
  const darkMat = lam(0x333344);

  const root = new THREE.Group();   // positioned + rotated by the game
  const model = new THREE.Group();  // local offsets / tumble spin
  root.add(model);

  // Fuselage: tapered tube along Z.
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.22, 2.2, 8), bodyMat);
  body.rotation.x = Math.PI / 2;
  model.add(body);
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.4, 8), bodyMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = -1.3;
  model.add(nose);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.18, 8), accentMat);
  stripe.rotation.x = Math.PI / 2;
  stripe.position.z = -0.75;
  model.add(stripe);

  // Windscreen in front of the pilot.
  const screen = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), accentMat);
  screen.scale.set(1, 0.8, 0.7);
  screen.position.set(0, 0.3, -0.42);
  model.add(screen);

  // Engine cowl ring (colour = engine level).
  const cowlMat = lam(0x888888);
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
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.375, 0.375, 0.1, 8), wingMat);
    tip.position.set(side * span / 2, -0.08, -0.35);
    g.add(tip);
    model.add(g);
    return g;
  };
  const leftWing = makeWing(-1);  // -x = screen-left from the chase camera
  const rightWing = makeWing(1);

  // Tail.
  const tail = new THREE.Group();
  const stab = new THREE.Mesh(new THREE.BoxGeometry(1.3 * tune.wingScale, 0.08, 0.4), wingMat);
  stab.position.set(0, 0.05, 1.0);
  tail.add(stab);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.45), wingMat);
  fin.position.set(0, 0.38, 1.0);
  tail.add(fin);
  model.add(tail);

  // Propeller.
  const prop = new THREE.Group();
  prop.position.z = -1.52;
  const hub = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.25, 8), darkMat);
  hub.rotation.x = -Math.PI / 2;
  prop.add(hub);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 0.04), darkMat);
  prop.add(blade);
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

  // Wheels (always fitted; size/colour = BOUNCY WHEELS level). Wheel bottoms sit at y -0.6.
  const tireMat = lam(0x222222);
  const rimMat = lam(0x888888);
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

  root.rotation.order = 'YXZ'; // yaw, then pitch, then roll

  // Each stage flies its own plane: colours, wing size, floats.
  let defaultBody = tune.bodyColor;
  function setStagePlane(def) {
    defaultBody = def.body;
    wingMat.color.setHex(def.wing);
    accentMat.color.setHex(def.accent);
    const ws = def.wingScale / tune.wingScale;
    leftWing.scale.x = rightWing.scale.x = ws;
    tail.scale.x = ws;
    floats.visible = !!def.floats;
    exhaust.visible = !!def.exhaust;
  }

  function setParts(parts) {
    leftWing.visible = !!parts.leftWing;
    rightWing.visible = !!parts.rightWing;
    tail.visible = !!parts.tail;
  }

  // Show exactly what this stage record owns, at its level.
  function setLoadout(rec, { ENGINE_LV, TANK_LV, MAGNET_LV, WHEELS_LV, paint }) {
    setParts(rec.parts);
    cowlMat.color.setHex(ENGINE_LV.cowl);
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
    bodyMat.color.setHex(paint.id === 'default' ? defaultBody : paint.color);
    rainbow = !!paint.rainbow;
  }

  let rainbow = false;
  let squash = 0;
  const _hsl = new THREE.Color();
  // Per-frame visual life: rainbow paint, wheel squash after a bounce.
  function animate(dt, t, flying) {
    if (rainbow) bodyMat.color.copy(_hsl.setHSL((t * (flying ? 0.12 : 0.08)) % 1, 0.85, 0.55));
    if (exhaust.visible) { const f = 0.8 + Math.random() * 0.4; exhaust.scale.set(f, f, f * (flying ? 1.6 : 1)); }
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
    pilot.group.position.copy(cockpitPos);
    pilot.group.rotation.set(0, 0, 0);
    pilot.group.scale.setScalar(1);
    pilot.chute.visible = false;
    pilot.chute.scale.setScalar(1);
    for (const a of pilot.arms) a.rotation.set(0, 0, 0);
  }

  return { root, model, prop, setParts, setLoadout, setStagePlane, animate, squashWheels, pilot, seatPilot, magnet, tank };
}
