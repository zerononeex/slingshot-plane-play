// v1.6 the mesh kit shared by the mega-stage renderers (megaview.js, sfdecor.js, sfview.js): merged
// geometries with baked vertex colours (one draw per instanced kind) and the primitive shorthands.
import * as THREE from 'three';

// One geometry from many primitives, each with a baked colour (one draw per instanced kind).
// part = [geometry, colour, [x, y, z], [rx, ry, rz]?, [sx, sy, sz]?]
export function merged(parts) {
  const pos = [], nrm = [], col = [];
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), C = new THREE.Color(), N = new THREE.Matrix3();
  for (const [geo, color, at = [0, 0, 0], rot = [0, 0, 0], sc = [1, 1, 1]] of parts) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    M.compose(new THREE.Vector3(...at), Q.setFromEuler(E.set(...rot)), new THREE.Vector3(...sc));
    g.applyMatrix4(M);
    g.computeVertexNormals();
    C.setHex(color);
    const p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i)); nrm.push(n.getX(i), n.getY(i), n.getZ(i));
      const shade = 0.78 + 0.22 * Math.max(0, n.getY(i)); // a touch of baked top-light (the Sleek look)
      col.push(C.r * shade, C.g * shade, C.b * shade);
    }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  void N;
  return out;
}
export const cyl = (r0, r1, h, n = 8) => new THREE.CylinderGeometry(r0, r1, h, n);
export const cone = (r, h, n = 8) => new THREE.ConeGeometry(r, h, n);
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const ico = (r, k = 0) => new THREE.IcosahedronGeometry(r, k);
