// The plane, built from three.js primitives (no GLB could be downloaded in the
// build sandbox — see the hand-off). Nose points along -Z. Driven by PLANE_TUNE.
import * as THREE from 'three';

export function buildPlane(tune) {
  const lam = (color) => new THREE.MeshLambertMaterial({ color, flatShading: true });
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

  // Cockpit bubble.
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), accentMat);
  cockpit.scale.set(1, 0.9, 1.5);
  cockpit.position.set(0, 0.3, -0.2);
  model.add(cockpit);

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

  root.rotation.order = 'YXZ'; // yaw, then pitch, then roll

  // Show exactly the owned parts.
  function setParts(parts) {
    leftWing.visible = !!parts.leftWing;
    rightWing.visible = !!parts.rightWing;
    tail.visible = !!parts.tail;
  }
  setParts({});
  return { root, model, prop, setParts };
}
