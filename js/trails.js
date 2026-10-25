// v0.7 speed FX (visuals only): wingtip contrails (two pooled ribbons) and camera-space speed
// streaks. Every buffer is allocated once here; the frame loop only rewrites numbers in place.
import * as THREE from 'three';

const SEG = 40;            // ribbon points per trail (fixed budget)
const SAMPLE = 0.012;      // s of flight per point → a trail is ~0.5 s long whatever the frame rate
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();

// Fade-in above ~25 m/s, stronger with speed; BOOST flares it.
export const trailStrength = (speed, boosting) => Math.min(1, Math.max(0, (speed - 25) / 30)) * (boosting ? 0.42 : 0.2);

function ribbon(scene) {
  const pts = Array.from({ length: SEG }, () => new THREE.Vector3());
  const pos = new Float32Array(SEG * 2 * 3), col = new Float32Array(SEG * 2 * 3);
  const idx = [];
  for (let i = 0; i < SEG - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setIndex(idx);
  // Additive + vertex colours fading to black = a soft fade with no alpha sorting.
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  scene.add(mesh);
  return { pts, pos, col, geo, mesh, n: 0, last: new THREE.Vector3(), has: false };
}

export function createTrails(scene) {
  const L = ribbon(scene), R = ribbon(scene);
  const tint = new THREE.Color(1, 1, 1);
  let width = 0.07, keep = 1;

  let acc = 0;
  function push(r, p) {
    for (let i = SEG - 1; i > 0; i--) r.pts[i].copy(r.pts[i - 1]);
    r.pts[0].copy(p);
    r.n = Math.min(SEG, r.n + 1);
  }
  // Sample on a fixed time step, interpolating between frames (no allocation).
  function sample(r, p, k) { _p.copy(r.last).lerp(p, k); push(r, _p); }
  const cam = new THREE.Vector3();
  function write(r, strength) {
    for (let i = 0; i < SEG; i++) {
      const p = r.pts[Math.min(i, r.n - 1)];
      // Fade along the trail, and away near the camera (a chase cam sits right in the trail's path).
      const near = Math.min(1, Math.max(0, (p.distanceTo(cam) - 6) / 10)) ** 1.5;
      const f = i < r.n ? Math.pow(1 - i / SEG, 2.6 / keep) * strength * near : 0;
      const w = width * (0.25 + 0.75 * (1 - i / SEG));
      const o = i * 6, P = r.pos, C = r.col; // written in place: no allocation per frame
      P[o] = p.x - w; P[o + 1] = p.y; P[o + 2] = p.z; P[o + 3] = p.x + w; P[o + 4] = p.y; P[o + 5] = p.z;
      C[o] = C[o + 3] = tint.r * f; C[o + 1] = C[o + 4] = tint.g * f; C[o + 2] = C[o + 5] = tint.b * f;
    }
    r.geo.attributes.position.needsUpdate = true;
    r.geo.attributes.color.needsUpdate = true;
  }
  return {
    // look: 'prop' | 'jet' (shorter, tighter, hotter) | 'ship' (ion blue) | 'runner' (v1.2: a wide, long
    // cyan LIGHT RIBBON). accent: the plane's stripe colour.
    setLook(look, accent) {
      const LOOK_TINT = { runner: 0x00e5ff, ship: 0x8fd0ff, jet: 0xffe0b0, ember: 0xff8a2a, leaf: 0x7fe07a, cloud: 0xffffff, knight: 0xffd23f, starhound: 0x5fb8ff, kestrel: 0xff6a4a }; // v1.3: ember / leaf / cloud; v1.5: the Sky Knight's gold pennant; v1.6: the Starhound's blue glow
      tint.set(LOOK_TINT[look] ?? 0xffffff).lerp(new THREE.Color(accent), look === 'ship' ? 0.1 : 0.12);
      width = look === 'runner' ? 0.16 : look === 'cloud' || look === 'knight' || look === 'starhound' || look === 'kestrel' ? 0.12 : look === 'jet' ? 0.05 : 0.07;
      keep = look === 'runner' ? 1.8 : look === 'jet' ? 0.55 : 1;
    },
    update(left, right, speed, boosting, dt = SAMPLE, camPos = null) {
      if (camPos) cam.copy(camPos);
      if (!L.has) { L.last.copy(left); R.last.copy(right); L.has = R.has = true; }
      acc += dt;
      const steps = Math.min(SEG, Math.floor(acc / SAMPLE));
      for (let k = 1; k <= steps; k++) { sample(L, left, k / steps); sample(R, right, k / steps); }
      acc -= steps * SAMPLE;
      if (steps) { L.last.copy(left); R.last.copy(right); }
      if (!L.n) return;
      // The newest point always sits on the wingtip.
      L.pts[0].copy(left); R.pts[0].copy(right);
      const k = trailStrength(speed, boosting) * (boosting ? 1.25 : 1);
      write(L, k); write(R, k);
      L.mesh.visible = R.mesh.visible = k > 0.001;
    },
    reset() { for (const r of [L, R]) { r.n = 0; r.has = false; r.mesh.visible = false; } acc = 0; },
  };
}

// SPEED STREAKS: thin bright dashes whipping past the frame edges (centre kept clear), denser with speed.
export const streakDensity = (speed) => Math.min(1, Math.max(0, (speed - 35) / 90));
export function createStreaks(scene, camera) {
  const N = 36;
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.03, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), N);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  scene.add(mesh);
  const S = Array.from({ length: N }, () => ({ x: 0, y: 0, z: -30, on: false }));
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  function spawn(st) {
    // Spawn at 70–105 % of the view's half-extent at that depth, so a streak sits at the frame
    // EDGE and only moves further out as it rushes past (the centre stays clear; portrait-safe).
    const a = Math.random() * Math.PI * 2, f = 0.7 + Math.random() * 0.35;
    st.z = -(14 + Math.random() * 12);
    const half = Math.tan((camera.fov * Math.PI) / 360) * -st.z;
    st.x = Math.cos(a) * half * camera.aspect * f; st.y = Math.sin(a) * half * f; st.on = true;
  }
  return {
    update(speed, dt) {
      const dens = streakDensity(speed);
      const want = Math.round(N * dens);
      let live = 0;
      for (let i = 0; i < N; i++) {
        const st = S[i];
        if (!st.on && live < want && Math.random() < 0.3) spawn(st);
        if (st.on) {
          st.z += (speed * 0.9 + 25) * dt;
          if (st.z > 1) st.on = false;
        }
        if (st.on && i < want) {
          live++;
          _p.set(st.x, st.y, st.z).applyMatrix4(camera.matrixWorld);
          _q.copy(camera.quaternion);
          _s.set(1, 1, 1.5 + speed * 0.04);
          _m.compose(_p, _q, _s);
          mesh.setMatrixAt(i, _m);
        } else mesh.setMatrixAt(i, zero);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.visible = dens > 0;
    },
    hide() { mesh.visible = false; },
  };
}
