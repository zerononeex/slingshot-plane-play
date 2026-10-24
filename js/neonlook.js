// v1.2 NEON VOID look: dark faces + neon edge outlines (the v0.7 EdgesGeometry technique, inverted:
// here the edges are the star). Used only where a stage's theme carries `neon`; colours come from
// that theme data. No post-processing: the "glow" is bright unlit lines against the black void.
import * as THREE from 'three';

const faces = new Map(), edges = new Map();
const faceMat = (c) => faces.get(c) ?? faces.set(c, new THREE.MeshLambertMaterial({ color: c, flatShading: true })).get(c);
export const edgeMat = (c) => edges.get(c) ?? edges.set(c, new THREE.LineBasicMaterial({ color: c })).get(c);

// Every lit (Lambert / Phong) mesh under `root` becomes a dark face with a neon outline. Glowing
// (MeshBasic) parts stay as they are: they already read as light.
export function neonify(root, neon, colour = neon.feature) {
  const lit = [];
  root.traverse((m) => { if (m.isMesh && !m.isInstancedMesh && (m.material?.isMeshLambertMaterial || m.material?.isMeshPhongMaterial)) lit.push(m); });
  for (const m of lit) {
    m.material = faceMat(neon.face);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), edgeMat(colour)));
  }
  return root;
}
