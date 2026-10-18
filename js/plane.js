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

  // Main wing (one slab through the body) with slightly rounded tips.
  const span = 3.2 * tune.wingScale;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(span, 0.1, 0.75), wingMat);
  wing.position.set(0, -0.08, -0.35);
  model.add(wing);
  for (const side of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.375, 0.375, 0.1, 8), wingMat);
    tip.position.set(side * span / 2, -0.08, -0.35);
    model.add(tip);
  }

  // Tail.
  const stab = new THREE.Mesh(new THREE.BoxGeometry(1.3 * tune.wingScale, 0.08, 0.4), wingMat);
  stab.position.set(0, 0.05, 1.0);
  model.add(stab);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.45), wingMat);
  fin.position.set(0, 0.38, 1.0);
  model.add(fin);

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
  return { root, model, prop };
}
