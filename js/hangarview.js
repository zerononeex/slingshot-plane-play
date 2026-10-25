// v1.8 THE HANGAR's TURNTABLE: the previewed plane's REAL model (plane.js buildPlane — the same builder the
// flight and the flyers use), standing on a disc in the stage's sky colours, turning a full circle every 8 s
// with a gentle bob. Drag sideways to spin it; it resumes on its own after a pause. Exactly one model is
// alive at a time (the old one is disposed on a switch, and on close). main.js renders it — into the top
// of the screen, with the game's own renderer — only while the Hangar is open.
import * as THREE from 'three';
import { buildPlane } from './plane.js';

const TURN = (Math.PI * 2) / 8;  // one full circle in 8 s
const RESUME = 1.6;              // s after a drag before it turns on its own again

// tune = PLANE_TUNE; keep = materials / textures shared with the flying plane (never disposed here).
export function createTurntable(tune, keep = new Set()) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  camera.position.set(0, 3.4, 13.5);
  camera.lookAt(0, -0.1, 0);
  const sky = new THREE.Color(0x9fdcff);
  scene.background = sky;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a9aa8, 1.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(4, 8, 6);
  scene.add(sun);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 0.3, 40), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  disc.position.y = -1.45;
  scene.add(disc);
  const blob = new THREE.Mesh(new THREE.CircleGeometry(1.9, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
  blob.position.y = -1.29;
  scene.add(blob);
  const spin = new THREE.Group();
  scene.add(spin);

  let model = null, modelId = null, yaw = 0.6, idle = 0, clock = 0, dragX = null;

  function dispose(m) {
    m.root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      for (const mat of [].concat(o.material ?? [])) {
        if (keep.has(mat)) continue;
        if (mat.map && !keep.has(mat.map)) mat.map.dispose();
        mat.dispose();
      }
    });
  }

  // Show a plane: build its model, dress it as its record is (parts, engine cowl, paint…), or `null` to clear.
  function show(id, def = null, rec = null, looks = null) {
    if (model) { spin.remove(model.root); dispose(model); model = null; modelId = null; }
    if (!id) return;
    model = buildPlane(tune);
    model.setStagePlane(def);
    if (rec && looks) model.setLoadout(rec, looks);
    spin.add(model.root);
    modelId = id;
  }

  // The stage's sky behind it (lighter at the horizon) and the disc in its ground colour.
  function setBackdrop(skyHex, groundHex) {
    sky.setHex(skyHex).lerp(new THREE.Color(0xffffff), 0.25);
    disc.material.color.setHex(groundHex).lerp(new THREE.Color(0xffffff), 0.35);
  }

  function update(dt) {
    clock += dt;
    idle = Math.max(0, idle - dt);
    if (dragX === null && idle <= 0) yaw += TURN * dt;
    spin.rotation.y = yaw;
    spin.position.y = Math.sin(clock * 1.6) * 0.12;
    blob.scale.setScalar(1 - spin.position.y * 0.6);
    if (model) {
      model.prop.rotation.z += dt * 6;
      model.animate(dt, clock, false, 0, false, 0);
    }
  }

  // Manual spin: pointer x in px.
  const grab = (x) => { dragX = x; idle = RESUME; };
  const drag = (x) => { if (dragX === null) return; yaw += (x - dragX) * 0.012; dragX = x; idle = RESUME; };
  const release = () => { dragX = null; idle = RESUME; };

  // Draw into the given rect (CSS px, from the top-left) of the renderer's canvas.
  function render(renderer, x, y, w, h) {
    const H = renderer.domElement.clientHeight;
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
    renderer.setScissorTest(true);
    renderer.setViewport(x, H - y - h, w, h);
    renderer.setScissor(x, H - y - h, w, h);
    renderer.render(scene, camera);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, renderer.domElement.clientWidth, H);
  }

  return { show, setBackdrop, update, render, grab, drag, release, get modelId() { return modelId; }, get yaw() { return yaw; } };
}
