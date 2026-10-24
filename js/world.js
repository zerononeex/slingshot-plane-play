// Streaming world for any stage: pooled terrain chunks + instanced scenery, the
// stage's static features (columns, cavern roofs, arches, rings, updrafts, dust
// devils, windsocks, city windows) in one "lap group", per-flight coins, distance
// flags and the launch site. Nothing is allocated per frame: chunks recycle by
// rewriting their buffers; stage meshes are built once per stage switch.
import * as THREE from 'three';
import { WORLD, LAUNCH } from './config.js';
import { DECK } from './terrain.js';
import { rng, makePatternPicker, patternCoins, featureCoins } from './coins.js';
import { fillSceneryChunk, newSceneryChunk, TREE_SLOTS, ROCK_SLOTS, columnCap } from './scenery.js';
import { buildCritter, animateCritter, resetCritter } from './critters.js';
import { neonify, edgeMat } from './neonlook.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();
const _c = new THREE.Color();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

const lam = (color, extra) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });

// Terrain vertex x positions: 2 m apart in the middle ±40 m, coarser out to the edges.
function terrainXs(half) {
  const xs = [-half];
  for (let x = -half + 11; x < -40; x += 11) xs.push(x);
  for (let x = -40; x <= 40; x += 2) xs.push(x);
  for (let x = 51; x < half; x += 11) xs.push(x);
  xs.push(half);
  return xs;
}

// Column colours per kind (cap sizes live in scenery.js COLUMN_CAPS, shared with the colliders).
const COLUMN_LOOK = {
  tree: { body: 0x7a4a28, cap: 0x3a9a3a },
  pine: { body: 0x6b4423, cap: 0x2f6b4f },
  pillar: { body: 0xb85a32, cap: 0xc96a3a },
  cactus: { body: 0x3f9a4a, cap: 0x4fb35a },
  waterTower: { body: 0x8fa3b8, cap: 0xd14b3b },
  antenna: { body: 0xdddddd, cap: 0xff3030, glow: true },
  post: { body: 0x7d5230, cap: 0x7d5230 },
  lighthouse: { body: 0xffffff, cap: 0xe8262c, glow: true },
  pylon: { body: 0xff5d2e, cap: 0xffe14d, glow: true },
  flag: { body: 0xffffff, cap: 0xff4fa3 },
  aqueductLeg: { body: 0xd9b46a, cap: 0xd9b46a },
};

export function createWorld(scene) {
  const hemi = new THREE.HemisphereLight(0xffffff, 0x6f9a52, 1.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3d6, 1.8);
  sun.position.set(-40, 80, 30);
  scene.add(sun);
  scene.background = new THREE.Color(0x9fdcff);
  scene.fog = new THREE.Fog(0x9fdcff, WORLD.fogNear, WORLD.fogFar);

  // Space dressing: a starfield and a distant Earth that ride along with the camera.
  const spaceSky = new THREE.Group();
  const starPos = new Float32Array(900 * 3);
  const sr = rng(4242);
  for (let i = 0; i < 900; i++) {
    const a = sr() * Math.PI * 2, e = Math.asin(sr() * 1.1 - 0.1), R = 420;
    starPos.set([Math.cos(a) * Math.cos(e) * R, Math.sin(e) * R, Math.sin(a) * Math.cos(e) * R], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  spaceSky.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false })));
  const earth = new THREE.Mesh(new THREE.IcosahedronGeometry(38, 2), new THREE.MeshBasicMaterial({ color: 0x3f86e8, fog: false }));
  earth.position.set(-160, 170, -330);
  const land = new THREE.Mesh(new THREE.IcosahedronGeometry(38.5, 1), new THREE.MeshBasicMaterial({ color: 0x4fb35a, fog: false, wireframe: false, transparent: true, opacity: 0.55 }));
  land.scale.set(1, 0.6, 1);
  earth.add(land);
  spaceSky.add(earth);
  spaceSky.visible = false;
  scene.add(spaceSky);

  // ---------- v0.7 sky: a 3-stop gradient dome (zenith → horizon → warm near-ground haze) ----------
  // Rides with the camera; fog uses the horizon stop. Bright skies stay bright (richness, not dusk).
  const domeGeo = new THREE.SphereGeometry(470, 24, 14);
  domeGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(domeGeo.attributes.position.count * 3), 3));
  const dome = new THREE.Mesh(domeGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  dome.renderOrder = -2;
  dome.frustumCulled = false;
  scene.add(dome);
  const _z = new THREE.Color(), _h = new THREE.Color(), _w = new THREE.Color(), _k = new THREE.Color();
  function paintSky(th) {
    if (th.space) { _z.setHex(0x03050f); _h.setHex(th.sky); _w.setHex(0x1a2040); }
    else if (th.neon) { _z.setHex(th.neon.void); _h.setHex(th.neon.void); _w.setHex(th.neon.void); } // v1.2: the void
    else {
      _h.setHex(th.sky).lerp(_k.setHex(0xffffff), 0.28);           // horizon: lighter
      _z.setHex(th.sky).multiplyScalar(0.82);                        // zenith: a deeper version of the sky
      _w.copy(_h).lerp(_k.setHex(0xfff0d8), 0.4);                    // near-ground haze: warm
    }
    const pos = domeGeo.attributes.position, col = domeGeo.attributes.color;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 470;
      if (y >= 0) _k.copy(_h).lerp(_z, Math.pow(y, 0.6)); else _k.copy(_h).lerp(_w, Math.min(1, -y * 5));
      col.setXYZ(i, _k.r, _k.g, _k.b);
    }
    col.needsUpdate = true;
    return _h;
  }

  // ---------- v0.7 depth: ONE far, hazy silhouette range per world (parallax sells speed) ----------
  const FAR_R = 420, FAR_N = 160;
  const farGeo = new THREE.BufferGeometry();
  const farPos = new Float32Array((FAR_N + 1) * 2 * 3), farCol = new Float32Array((FAR_N + 1) * 2 * 3);
  const farIdx = [];
  for (let i = 0; i < FAR_N; i++) { const a = i * 2; farIdx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  farGeo.setAttribute('position', new THREE.BufferAttribute(farPos, 3));
  farGeo.setAttribute('color', new THREE.BufferAttribute(farCol, 3));
  farGeo.setIndex(farIdx);
  const farLayer = new THREE.Mesh(farGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false, depthWrite: false }));
  farLayer.renderOrder = -1;
  farLayer.frustumCulled = false;
  scene.add(farLayer);
  const FAR_STYLE = { plains: 'hills', canyon: 'mesas', city: 'towers', snow: 'peaks', desert: 'dunes', ocean: 'islands', space: 'rims', jetstream: 'peaks' };
  function profile(style, a) {
    const s1 = Math.sin(a * 3 + 1.3), s2 = Math.sin(a * 7 + 0.4), s3 = Math.sin(a * 17 + 2.2);
    switch (style) {
      case 'mesas': return 22 + (s1 > 0.1 ? 20 : 4) + (s2 > 0.5 ? 10 : 0);
      case 'towers': { const b = Math.floor(a * 40); return 18 + ((b * 7919) % 13) * 4 * (b % 3 ? 1 : 0.4); }
      case 'peaks': return 30 + 35 * Math.abs(Math.sin(a * 5 + 0.7)) ** 1.6 + 10 * s3;
      case 'dunes': return 12 + 10 * (0.5 + 0.5 * s1) + 4 * s2;
      case 'islands': return 4 + Math.max(0, 22 * Math.sin(a * 4 + 0.9) - 6) + 3 * s3;
      case 'rims': return 10 + 8 * Math.abs(s2) + 4 * s3;
      default: return 16 + 12 * (0.5 + 0.5 * s1) + 6 * s2 + 2 * s3; // rolling hills
    }
  }
  function buildFar(st, horizon) {
    const style = FAR_STYLE[st.id] ?? 'hills';
    const top = _k.setHex(st.theme.rock).lerp(horizon, st.theme.space ? 0.35 : 0.62); // paler, hazier than anything near
    for (let i = 0; i <= FAR_N; i++) {
      const a = (i / FAR_N) * Math.PI * 2, h = profile(style, a);
      const x = Math.cos(a) * FAR_R, z = Math.sin(a) * FAR_R, o = i * 6;
      farPos[o] = x; farPos[o + 1] = -30; farPos[o + 2] = z;
      farPos[o + 3] = x; farPos[o + 4] = h; farPos[o + 5] = z;
      farCol[o] = horizon.r; farCol[o + 1] = horizon.g; farCol[o + 2] = horizon.b; // fades into the haze at its foot
      farCol[o + 3] = top.r; farCol[o + 4] = top.g; farCol[o + 5] = top.b;
    }
    farGeo.attributes.position.needsUpdate = true;
    farGeo.attributes.color.needsUpdate = true;
  }

  const L = WORLD.chunkLength;
  const N = WORLD.chunkCount;
  const HALF = WORLD.chunkHalfWidth;
  let terrain = null;
  let stage = null;
  let theme = null;

  // Flat ground beyond the chunks' side edges (not under them: ditches and pits go below 0).
  const baseMat = lam(0x7cc95a);
  const bases = [-1, 1].map((side) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), baseMat);
    m.rotation.x = -Math.PI / 2;
    m.userData.side = side;
    scene.add(m);
    return m;
  });

  // Terrain chunks (indexed grid, rewritten in place on recycle).
  const xs = terrainXs(HALF);
  const ZS = 21; // rows along d (4 m apart)
  const groundMat = lam(0xffffff, { vertexColors: true });
  const chunks = [];
  for (let i = 0; i < N; i++) {
    const count = xs.length * ZS;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const up = new Float32Array(count * 3);
    for (let n = 1; n < up.length; n += 3) up[n] = 1; // flat shading derives real normals per face
    geo.setAttribute('normal', new THREE.BufferAttribute(up, 3));
    const idx = [];
    for (let r = 0; r < ZS - 1; r++) {
      for (let c = 0; c < xs.length - 1; c++) {
        const a = r * xs.length + c, b = a + 1, cc = a + xs.length, dd = cc + 1;
        idx.push(a, b, cc, b, dd, cc); // counter-clockwise seen from above
      }
    }
    geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, groundMat);
    mesh.frustumCulled = false;
    scene.add(mesh);
    chunks.push({ slot: i, index: -9999, mesh, scenery: newSceneryChunk() });
  }

  // Instanced small scenery (shared by all stages; looks change with the theme).
  const inst = (geo, mat, count, parent = scene) => {
    const m = new THREE.InstancedMesh(geo, mat, count);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false; // instances span the whole world
    for (let i = 0; i < count; i++) m.setMatrixAt(i, ZERO);
    parent.add(m);
    return m;
  };
  const TP = TREE_SLOTS, RP = ROCK_SLOTS, CP = WORLD.cloudsPerChunk * 3;
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 1, 6).translate(0, 0.5, 0);
  const trunkMat = lam(0x8a5a35);
  const trunks = inst(trunkGeo, trunkMat, N * TP);
  const coneMat = lam(0x2f9e44);
  const cones = inst(new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0), coneMat, N * TP);
  const ballGeo = new THREE.IcosahedronGeometry(1, 0);
  const ballMat = lam(0x51b848);
  const balls = inst(ballGeo, ballMat, N * TP);
  const rockMatSmall = lam(0x9a9aa5);
  const rocks = inst(new THREE.DodecahedronGeometry(1, 0), rockMatSmall, N * RP);
  // v0.7: soft two-tone clouds — bright top, gentle grey-blue belly (baked vertex colours).
  const cloudMat = lam(0xffffff, { emissive: 0x777777, vertexColors: true });
  const cloudGeo = new THREE.IcosahedronGeometry(1, 0).toNonIndexed();
  {
    const n = cloudGeo.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const t = (cloudGeo.attributes.position.getY(i) + 1) / 2; col[i * 3] = 0.8 + 0.2 * t; col[i * 3 + 1] = 0.83 + 0.17 * t; col[i * 3 + 2] = 0.92 + 0.08 * t; }
    cloudGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const clouds = inst(cloudGeo, cloudMat, N * CP);
  const coinGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.18, 14).rotateX(Math.PI / 2);
  const roundCoins = inst(coinGeo, lam(0xffc61a, { emissive: 0x5a3c00 }), WORLD.coinSlots);
  // Space: STAR COINS (looks only — still worth 1).
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.45 : 1.05;
    if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r); else star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const starCoins = inst(new THREE.ExtrudeGeometry(star, { depth: 0.2, bevelEnabled: false }).translate(0, 0, -0.1), lam(0xffe14d, { emissive: 0x6a5200 }), WORLD.coinSlots);
  // Per-coin colour for the v0.7 glint (created up front so the shader has it from the first frame).
  for (const m of [roundCoins, starCoins]) for (let i = 0; i < WORLD.coinSlots; i++) m.setColorAt(i, _c.setRGB(1, 1, 1));
  let coinMesh = roundCoins;

  // ---------- the lap group: every static stage feature, moved lap by lap ----------
  const lapGroup = new THREE.Group();
  scene.add(lapGroup);
  let lapShown = -1;
  const stageMeshes = []; // disposed on stage switch
  const keep = (o) => { stageMeshes.push(o); lapGroup.add(o); return o; };

  const colBody = inst(new THREE.CylinderGeometry(1, 1, 1, 8).translate(0, 0.5, 0), lam(0xffffff), 64, lapGroup);
  const colCap = inst(new THREE.IcosahedronGeometry(1, 0), lam(0xffffff), 64, lapGroup);
  const ringMesh = inst(new THREE.TorusGeometry(1, 0.12, 6, 18), lam(0xffd23f, { emissive: 0x8a6a00 }), 32, lapGroup);
  // v0.7: a soft inner glow edge on every ring / star ring (same matrices, additive).
  const ringGlow = inst(new THREE.TorusGeometry(0.88, 0.07, 4, 24), new THREE.MeshBasicMaterial({ color: 0xfff1a0, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }), 32, lapGroup);
  const loopRingMesh = inst(new THREE.TorusGeometry(1, 0.13, 6, 18), lam(0xff4fd8, { emissive: 0x6a1a5a }), 40, lapGroup);
  const asteroidMesh = inst(new THREE.DodecahedronGeometry(1, 0), lam(0x8a8d96), 96, lapGroup);
  const updraftRings = inst(new THREE.TorusGeometry(1, 0.05, 4, 16).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, depthWrite: false }), 30, lapGroup);
  const updraftCols = [];
  const devilCones = [];

  // Wind streaks (tailwind = forward, gust = sideways): a small pool reused every frame.
  const STREAKS = 70;
  const streakMesh = inst(new THREE.BoxGeometry(0.06, 0.06, 2.2), new THREE.MeshBasicMaterial({ color: 0x5f8fc8, transparent: true, opacity: 0.8 }), STREAKS);
  const streaks = Array.from({ length: STREAKS }, () => ({ x: 0, y: 0, d: 0, band: null }));

  function setInst(mesh, i, x, y, d, sx, sy, sz, ry = 0, rx = 0) {
    _e.set(rx, ry, 0);
    _q.setFromEuler(_e);
    _m.compose(_p.set(x, y, -d), _q, _s.set(sx, sy, sz));
    mesh.setMatrixAt(i, _m);
  }

  function clearStageMeshes() {
    for (const o of stageMeshes) {
      lapGroup.remove(o);
      o.traverse?.((m) => { m.geometry?.dispose(); m.material?.dispose?.(); });
    }
    stageMeshes.length = 0;
    updraftCols.length = 0;
    devilCones.length = 0;
    critters.length = 0;
  }
  // BUMPABLES: one figure each (in the lap group); t = seconds since its bump this lap (−1 = idle).
  const critters = [];
  let clockT = 0;
  function resetCritters() { for (const c of critters) { c.t = -1; c.lap = -1; resetCritter(c.g); } }
  function bump(index, lap) { const c = critters[index]; if (c) { resetCritter(c.g); c.t = 0; c.lap = lap; } }

  // Build the stage's static meshes (called on stage switch, never per frame).
  function buildStageMeshes() {
    clearStageMeshes();
    const rockMat = lam(theme.rock);
    // Columns.
    for (let i = 0; i < 64; i++) { colBody.setMatrixAt(i, ZERO); colCap.setMatrixAt(i, ZERO); }
    terrain.columns.slice(0, 64).forEach((t, i) => {
      const look = COLUMN_LOOK[t.kind] ?? COLUMN_LOOK.pillar;
      const g = terrain.surfaceAt(t.x, t.d, -Infinity);
      setInst(colBody, i, t.x, g - 0.5, t.d, t.r, t.h + 0.5, t.r);
      const COURSE = { flags: 0xff4fa3, banners: 0xffd23f, scaffold: 0xffb020, palms: 0x3fae4a, buoys: 0xff7a1a, pylons: 0xff5d2e };
      colBody.setColorAt(i, _c.setHex(theme.neon ? theme.neon.feature : t.kind === 'lighthouse' && i % 2 ? 0xe8262c : t.kind === 'flag' ? (t.look === 'scaffold' ? 0xffb020 : 0xffffff) : look.body)); // v1.2: glowing neon posts
      const cap = columnCap(t);
      setInst(colCap, i, t.x, g + t.h + cap.y * 0.4, t.d, cap.r, cap.y, cap.r);
      colCap.setColorAt(i, _c.setHex(theme.neon ? theme.neon.feature : t.kind === 'flag' ? COURSE[t.look] ?? look.cap : look.cap));
    });
    colBody.instanceMatrix.needsUpdate = true;
    colCap.instanceMatrix.needsUpdate = true;
    if (colBody.instanceColor) colBody.instanceColor.needsUpdate = true;
    if (colCap.instanceColor) colCap.instanceColor.needsUpdate = true;

    // Cavern roofs (rock, ice, a lit building, a pyramid, a sea cave).
    for (const c of stage.caverns) {
      const g = new THREE.Group();
      const left = c.laneMax < 0;
      const mat = c.cloud ? lam(0xf4f7fc, { emissive: 0x8a96a8 }) : c.ice ? lam(0xbfe6ff, { emissive: 0x2a5a7a }) : c.station ? lam(0xdfe6ee, { emissive: 0x1a2230 }) : c.shape === 'block' ? lam(0xb8a890) : c.shape === 'pyramid' ? lam(0xd9b46a) : rockMat;
      const mid = (c.start + c.end) / 2, half = (c.end - c.start) / 2;
      const topAt = (d) => (c.shape === 'pyramid' ? c.height * Math.max(0, 1 - Math.abs(d - mid) / half) : c.height);
      const top = Math.min(topAt(c.mouth), topAt(c.exit));
      const h = Math.max(1, top - c.roof);
      const x0 = left ? c.laneMin - 4 : c.laneMin - 2, x1 = left ? c.laneMax + 2 : c.laneMax + 4;
      const slab = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, c.exit - c.mouth), mat);
      slab.position.set((x0 + x1) / 2, c.roof + h / 2, -(c.mouth + c.exit) / 2);
      g.add(slab);
      const mouth = new THREE.Mesh(new THREE.PlaneGeometry(c.laneMax - c.laneMin, c.roof),
        new THREE.MeshBasicMaterial({ color: c.ice ? 0x5fb8e8 : 0x2b2420, side: THREE.DoubleSide, transparent: true, opacity: 0.35, depthWrite: false }));
      mouth.position.set((c.laneMin + c.laneMax) / 2, c.roof / 2, -c.mouth - 0.5);
      g.add(mouth);
      if (c.alcove) {
        const a = c.alcove;
        const ax0 = a.laneMax !== undefined ? c.laneMax : a.laneMin - 2, ax1 = a.laneMax !== undefined ? a.laneMax + 2 : c.laneMin;
        const box = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(ax1 - ax0), h, a.to - a.from), mat);
        box.position.set((ax0 + ax1) / 2, c.roof + h / 2, -(a.from + a.to) / 2);
        g.add(box);
      }
      if (c.lit || c.ice || c.shape === 'pyramid') {
        // Lights along the tunnel ceiling.
        const lampMat = new THREE.MeshBasicMaterial({ color: c.ice ? 0x9fe6ff : 0xffe28a });
        for (let d = c.mouth + 5; d < c.exit; d += 10) {
          const lamp = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 1), lampMat);
          lamp.position.set((c.laneMin + c.laneMax) / 2, c.roof - 0.2, -d);
          g.add(lamp);
        }
      }
      keep(g);
    }

    // Arches: two side blocks, a lintel and (for raised arches) a base wall.
    for (const a of terrain.arches) {
      const g = new THREE.Group();
      const piece = (x0, x1, y0, y1) => {
        if (x1 - x0 < 0.1 || y1 - y0 < 0.1) return;
        const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, a.depth), rockMat);
        m.position.set((x0 + x1) / 2, (y0 + y1) / 2, -a.d);
        g.add(m);
      };
      const ox0 = a.cx - a.w / 2, ox1 = a.cx + a.w / 2;
      piece(-34, ox0, a.base - 4, a.top);
      piece(ox1, 34, a.base - 4, a.top);
      piece(ox0, ox1, a.y0abs + a.h, a.top);
      if (a.y0abs > a.base + 0.5) piece(ox0, ox1, a.base - 4, a.y0abs);
      keep(g);
    }

    for (const b of terrain.bumpables ?? []) {
      const g = buildCritter(b.type);
      critters.push({ g, b, home: { x: b.x, y: b.cy, d: b.d }, t: -1, lap: -1 });
      keep(g);
    }

    // SLOTS: two themed walls around the 2 m gap (tilt through!).
    const SLOT_LOOK = { trees: 0x7a4a28, pillars: theme.rock, towers: 0x8a94a6, ice: 0xbfe6ff, pyramid: 0xd9b46a, rocks: 0x6f6a64, station: 0xdfe6ee, cloud: 0x8e98aa };
    for (const sl of terrain.slots ?? []) {
      const mat = lam(SLOT_LOOK[sl.look] ?? theme.rock, sl.look === 'ice' ? { emissive: 0x2a5a7a } : undefined);
      for (const side of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(sl.wall, sl.h + 1, 2), mat);
        w.position.set(sl.x + side * (sl.gap / 2 + sl.wall / 2), sl.base + (sl.h + 1) / 2 - 1, -sl.d);
        keep(w);
        if (sl.look === 'trees') { // the tutorial slot's two hero trees: leafy tops above the gap
          const top = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 0), lam(0x3a9a3a));
          top.position.set(sl.x + side * (sl.gap / 2 + sl.wall / 2 + 0.6), sl.base + sl.h + 2.2, -sl.d);
          keep(top);
        }
      }
    }
    // LOOP RINGS: each ring faces along its circle.
    for (let i = 0; i < 40; i++) loopRingMesh.setMatrixAt(i, ZERO);
    (terrain.loopRings ?? []).slice(0, 40).forEach((r, i) => setInst(loopRingMesh, i, r.x, r.y, r.d, r.r, r.r, r.r, 0, (r.k / 8) * Math.PI * 2));
    loopRingMesh.instanceMatrix.needsUpdate = true;
    // DIVE GATES: a low blue banner between the posts.
    for (const g of terrain.diveGates ?? []) {
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 48;
      const c2 = cv.getContext('2d');
      c2.fillStyle = '#2f7fe0'; c2.fillRect(0, 0, 256, 48);
      c2.fillStyle = '#ffffff'; c2.font = 'bold 30px system-ui, sans-serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle';
      c2.fillText('▼ DIVE GATE ▼', 128, 26);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      const ban = new THREE.Mesh(new THREE.BoxGeometry(g.w, 1.4, 0.2), new THREE.MeshBasicMaterial({ map: tex }));
      ban.position.set(g.x, g.base + g.h + 0.7, -g.d);
      keep(ban);
    }

    // Speed gates: a glowing banner across the pylon tops.
    for (const gt of terrain.gates ?? []) {
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 48;
      const c2 = cv.getContext('2d');
      c2.fillStyle = '#ff5d2e'; c2.fillRect(0, 0, 256, 48);
      c2.fillStyle = '#fff6c0'; c2.font = 'bold 32px system-ui, sans-serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle';
      c2.fillText('SPEED GATE', 128, 26);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      const ban = new THREE.Mesh(new THREE.BoxGeometry(gt.w, 2.2, 0.3), new THREE.MeshBasicMaterial({ map: tex }));
      ban.position.set(gt.x, gt.base + gt.h + 1.4, -gt.d);
      keep(ban);
    }

    // Storm clouds: dark puffy clusters (the collider is the big puff).
    const stormMat = lam(0x4b5466, { emissive: 0x141821 });
    for (const c of terrain.storms ?? []) {
      const g = new THREE.Group();
      const main = new THREE.Mesh(new THREE.IcosahedronGeometry(c.r, 1), stormMat);
      g.add(main);
      for (const [ox, oy, k] of [[0.55, -0.25, 0.6], [-0.6, -0.15, 0.55], [0.1, 0.45, 0.5]]) {
        const p2 = new THREE.Mesh(new THREE.IcosahedronGeometry(c.r * k, 1), stormMat);
        p2.position.set(c.r * ox, c.r * oy, c.r * 0.2);
        g.add(p2);
      }
      g.position.set(c.x, c.cy, -c.d);
      keep(g);
    }

    // Bridges across the corridor: cloud, covered (wood with a red roof), rock, stone (river arches /
    // the aqueduct), snow.
    for (const b of terrain.bridges ?? []) {
      const mat = b.kind === 'cloud' ? lam(0xf7f9fd, { emissive: 0x7d8899 }) : b.kind === 'covered' ? lam(0x9a6a3a)
        : b.kind === 'snow' ? lam(0xf2f7ff, { emissive: 0x3a4a5a }) : b.kind === 'stone' ? lam(b.aqueduct ? 0xd9b46a : 0xa8a29a) : rockMat;
      const slab = new THREE.Mesh(new THREE.BoxGeometry(b.x1 - b.x0, b.y1 - b.y0, b.depth), mat);
      slab.position.set((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, -b.d);
      keep(slab);
      if (b.kind === 'covered') { // a little red roof on top
        const roof = new THREE.Mesh(new THREE.BoxGeometry(b.x1 - b.x0 + 1, 1, b.depth + 1), lam(0xc0392b));
        roof.position.set((b.x0 + b.x1) / 2, b.y1 + 0.5, -b.d);
        keep(roof);
      }
      if (b.arches) for (let x = b.x0 + 6; x < b.x1; x += 12) { // the river bridge's low arch piers (looks only, outside the lane)
        if (Math.abs(x) < 8) continue;
        const pier = new THREE.Mesh(new THREE.BoxGeometry(1.4, b.under, b.depth * 0.8), mat);
        pier.position.set(x, b.base + b.under / 2, -b.d);
        keep(pier);
      }
    }
    // SUB-AREAS: a glowing PORTAL at the side of the corridor, an end-portal in the pocket lane,
    // the pocket's own decor along its sides (looks only), and the BONUS STASH sign.
    const PORTAL = { mushrooms: 0xffd23f, slotCanyon: 0xff9a3c, garden: 0x7fff9a, aurora: 0x9fe6ff, oasis: 0x5fffd0, coral: 0xff7ab8, nebula: 0xc08aff, stormEye: 0xffd23f,
      sunflowers: 0xffe14d, goldMine: 0xffb020, neon: 0xff3fd0, glacier: 0xbff4ff, temple: 0xffc070, shipwreck: 0x5fd0ff, comet: 0x9fd8ff, rainbow: 0xff6ad5, // v1.0 second pockets
      gridCore: 0x00e5ff, prism: 0xff2bd6 }; // v1.2 Neon Void
    for (const p of terrain.pockets ?? []) {
      const glow = new THREE.MeshBasicMaterial({ color: PORTAL[p.look] ?? 0xffd23f });
      const ringAt = (x, d, base) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(p.portal.w / 2, 0.45, 8, 28), glow);
        ring.position.set(x, base + p.portal.w / 2 + 0.6, -d);
        keep(ring);
        for (const side of [-1, 1]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.7, p.portal.w / 2 + 0.8, 0.7), glow);
          post.position.set(x + side * p.portal.w / 2, base + (p.portal.w / 2 + 0.8) / 2, -d);
          keep(post);
        }
      };
      ringAt(p.portal.x, p.portal.d, p.portalBase);
      ringAt(p.cx, p.end, terrain.surfaceAt(p.cx, p.end, -Infinity));
      // Decor along both sides of the lane.
      for (let d = p.start + 10, i = 0; d < p.end - 10; d += 34, i++) for (const side of [-1, 1]) {
        const x = p.cx + side * (p.half + 2.5 + (i % 2) * 2), g0 = terrain.surfaceAt(x, d, -Infinity), y = new THREE.Group();
        if (p.look === 'mushrooms') { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 4 + (i % 3), 7), lam(0xf2e6d0)); st.position.y = 2; y.add(st); const cap = new THREE.Mesh(new THREE.SphereGeometry(2.6, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2), lam(i % 2 ? 0xe8262c : 0xb04ad1)); cap.position.y = 4 + (i % 3); y.add(cap); const fly = new THREE.Mesh(new THREE.SphereGeometry(0.18, 5, 3), new THREE.MeshBasicMaterial({ color: 0xfff6a0 })); fly.position.set(-side * 2, 6, 3); y.add(fly); }
        else if (p.look === 'garden') { const pl = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 2.4), lam(0x8a5a35)); pl.position.y = 0.6; y.add(pl); const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 0), lam(0x3fae4a)); bush.position.y = 2; y.add(bush); }
        else if (p.look === 'aurora') { const ice = new THREE.Mesh(new THREE.OctahedronGeometry(1.6, 0), lam(0xbfe6ff, { emissive: 0x2a6a8a })); ice.position.y = 1.6; y.add(ice); if (side > 0) { const rib = new THREE.Mesh(new THREE.PlaneGeometry(2 * p.half + 8, 5), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x6fffb0 : 0xb08aff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); rib.position.set(-side * (p.half + 3), 16, 0); rib.rotation.x = -0.4; y.add(rib); } }
        else if (p.look === 'oasis') { const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 6, 6), lam(0x9a7046)); tr.position.y = 3; y.add(tr); const fr = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), lam(0x3fae4a)); fr.scale.set(2.4, 0.6, 2.4); fr.position.y = 6.2; y.add(fr); }
        else if (p.look === 'coral') { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 0), lam([0xff7ab8, 0xff9a3c, 0xb04ad1][i % 3])); c.scale.set(1, 1.6, 1); c.position.y = 0.8; y.add(c); if (i % 3 === 0) { const stack = new THREE.Mesh(new THREE.BoxGeometry(3, 18, 3), lam(0x8a7a6a)); stack.position.set(side * 3, 9, 0); y.add(stack); } }
        else if (p.look === 'nebula') { const n = new THREE.Mesh(new THREE.IcosahedronGeometry(3 + (i % 3), 1), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xb04ad1 : 0x19c3c3, transparent: true, opacity: 0.25, depthWrite: false })); n.position.y = 8; y.add(n); }
        else if (p.look === 'stormEye') { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(4, 1), lam(0x4b5466, { emissive: 0x141821 })); c.position.y = 10 + (i % 3) * 3; y.add(c); }
        // v1.0 SECOND POCKETS
        else if (p.look === 'sunflowers') { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 5 + (i % 3), 6), lam(0x3f8a2a)); st.position.y = 2.6; y.add(st); const fl = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.3, 12), lam(0xffc61a)); fl.rotation.x = Math.PI / 2; fl.position.y = 5.4 + (i % 3); y.add(fl); const mid = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.35, 10), lam(0x5a3a1a)); mid.rotation.x = Math.PI / 2; mid.position.set(0, 5.4 + (i % 3), 0.05); y.add(mid); }
        else if (p.look === 'goldMine') { const beam = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7, 0.6), lam(0x7a5230)); beam.position.y = 3.5; y.add(beam); const top = new THREE.Mesh(new THREE.BoxGeometry(4, 0.6, 0.6), lam(0x7a5230)); top.position.set(-side * 2, 7, 0); y.add(top); if (i % 2) { const nug = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0), lam(0xffc61a, { emissive: 0x6a4a00 })); nug.position.set(-side * 1.5, 0.6, 1); y.add(nug); } const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffd27a })); lamp.position.set(-side * 1.2, 6.4, 0); y.add(lamp); }
        else if (p.look === 'neon') { const sign = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.4, 4), new THREE.MeshBasicMaterial({ color: [0xff3fd0, 0x3fe0ff, 0xffe14d][i % 3] })); sign.position.y = 5 + (i % 2) * 3; y.add(sign); const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 12, 6), lam(0x2a2f45)); wall.position.set(side * 1.6, 6, 0); y.add(wall); }
        else if (p.look === 'glacier') { const sp = new THREE.Mesh(new THREE.ConeGeometry(1.4, 7 + (i % 3) * 2, 5), lam(0xd8f6ff, { emissive: 0x1a4a6a })); sp.position.y = 3.5 + (i % 3); y.add(sp); }
        else if (p.look === 'temple') { const col = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1, 8, 10), lam(0xe2b97a)); col.position.y = 4; y.add(col); const cap = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.8, 2.6), lam(0xc99a5a)); cap.position.y = 8.4; y.add(cap); }
        else if (p.look === 'shipwreck') { if (i % 3 === 0) { const hull = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 9), lam(0x6b4423)); hull.rotation.z = side * 0.4; hull.position.y = 1; y.add(hull); const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 9, 6), lam(0x8a5a35)); mast.rotation.z = side * 0.5; mast.position.y = 4.5; y.add(mast); } else { const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 8), lam(0x9a6b3a)); barrel.position.y = 0.6; y.add(barrel); } }
        else if (p.look === 'comet') { const ice = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 + (i % 2), 0), lam(0xcfe6ff, { emissive: 0x1a3a6a })); ice.position.y = 7 + (i % 3) * 2; y.add(ice); const tail = new THREE.Mesh(new THREE.ConeGeometry(0.9, 6, 6), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.35, depthWrite: false })); tail.rotation.x = -Math.PI / 2; tail.position.set(0, 7 + (i % 3) * 2, -3.5); y.add(tail); }
        else if (p.look === 'rainbow') { const arc = new THREE.Mesh(new THREE.TorusGeometry(3, 0.35, 6, 18, Math.PI), new THREE.MeshBasicMaterial({ color: [0xff4f4f, 0xffa23f, 0xffe14d, 0x5fe06a, 0x4fb0ff, 0xb06aff][i % 6] })); arc.position.y = 9; arc.rotation.y = Math.PI / 2; y.add(arc); const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 1), lam(0xffffff)); puff.position.y = 8; y.add(puff); }
        else if (p.look === 'gridCore') { const c = new THREE.Mesh(new THREE.BoxGeometry(2.4, 6 + (i % 3) * 2, 2.4), lam(0x0a0a18)); c.position.y = 3 + (i % 3); y.add(c); const cap = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 2.6), new THREE.MeshBasicMaterial({ color: 0x00e5ff })); cap.position.y = 6.2 + (i % 3) * 2; y.add(cap); }
        else if (p.look === 'prism') { const pr = new THREE.Mesh(new THREE.OctahedronGeometry(1.6, 0), new THREE.MeshBasicMaterial({ color: [0xff2bd6, 0x00e5ff, 0xffe14d][i % 3], transparent: true, opacity: 0.7 })); pr.scale.set(1, 2.4, 1); pr.position.y = 5 + (i % 2) * 3; y.add(pr); }
        else { const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 0), lam(0xffb070, { emissive: 0x6a3a10 })); crystal.position.y = 1.2; y.add(crystal); }
        y.position.set(x, g0, -d);
        keep(y);
      }
      if (p.look === 'garden') { const ft = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.4, 1, 12), lam(0xdfe6ee)); ft.position.set(p.cx + p.half + 4, terrain.surfaceAt(p.cx, (p.start + p.end) / 2, -Infinity) + 0.5, -(p.start + p.end) / 2); keep(ft); }
      if (p.look === 'oasis') { const pond = new THREE.Mesh(new THREE.CircleGeometry(6, 18).rotateX(-Math.PI / 2), lam(0x2fa8e0)); pond.position.set(p.cx, terrain.surfaceAt(p.cx, (p.start + p.end) / 2, -Infinity) + 0.05, -(p.start + p.end) / 2); keep(pond); }
      // The BONUS STASH sign.
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 64;
      const c2 = cv.getContext('2d');
      c2.fillStyle = '#ffc61a'; c2.fillRect(0, 0, 256, 64);
      c2.fillStyle = '#5b3b00'; c2.font = 'bold 34px system-ui, sans-serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle';
      c2.fillText('BONUS STASH!', 128, 34);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
      sign.position.set(p.stash.x, p.stashBase + p.stash.y + 3.5, -p.stash.d);
      keep(sign);
    }

    // ARCHWAYS: two legs + a lintel.
    for (const a of terrain.archways ?? []) {
      const mat = rockMat;
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(a.leg, a.h + a.thick + 6, a.depth), mat);
        leg.position.set(a.cx + side * (a.w / 2 + a.leg / 2), a.base + (a.h + a.thick) / 2 - 3, -a.d);
        keep(leg);
      }
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(a.w + a.leg * 2, a.thick, a.depth), mat);
      lintel.position.set(a.cx, a.base + a.h + a.thick / 2, -a.d);
      keep(lintel);
    }
    // Decor: the City construction crane (looks only, off the lane).
    for (const dc of stage.decor ?? []) if (dc.kind === 'crane') {
      const g0 = terrain.surfaceAt(dc.x, dc.d, -Infinity), y = new THREE.Group(), steel = lam(0xffb020);
      const mast = new THREE.Mesh(new THREE.BoxGeometry(1.2, 30, 1.2), steel); mast.position.set(0, 15, 0); y.add(mast);
      const jib = new THREE.Mesh(new THREE.BoxGeometry(18, 0.8, 0.8), steel); jib.position.set(6, 29.5, 0); y.add(jib);
      const hook = new THREE.Mesh(new THREE.BoxGeometry(0.1, 8, 0.1), lam(0x333344)); hook.position.set(12, 25.5, 0); y.add(hook);
      y.position.set(dc.x, g0, -dc.d);
      keep(y);
    }

    // Floating asteroids.
    for (let i = 0; i < 96; i++) asteroidMesh.setMatrixAt(i, ZERO);
    terrain.asteroids.slice(0, 96).forEach((a, i) => {
      const g = terrain.surfaceAt(a.x, a.d, -Infinity);
      setInst(asteroidMesh, i, a.x, g + a.y, a.d, a.r * 1.1, a.r * 0.9, a.r, i * 1.7, i * 0.9);
    });
    asteroidMesh.instanceMatrix.needsUpdate = true;

    // Rings.
    for (let i = 0; i < 32; i++) ringMesh.setMatrixAt(i, ZERO);
    for (let i = 0; i < 32; i++) ringGlow.setMatrixAt(i, ZERO);
    terrain.rings.slice(0, 32).forEach((r, i) => { setInst(ringMesh, i, r.x, r.y, r.d, r.r, r.r, r.r); setInst(ringGlow, i, r.x, r.y, r.d, r.r, r.r, r.r); });
    ringMesh.instanceMatrix.needsUpdate = true;
    ringGlow.instanceMatrix.needsUpdate = true;

    // Updrafts: a shimmering column each (rings rise inside, animated per frame).
    for (const u of stage.updrafts) {
      const g = terrain.surfaceAt(u.x, u.d, -Infinity);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(u.r, u.r, 60, 16, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xfff1d0, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false }));
      col.position.set(u.x, g + 30, -u.d);
      updraftCols.push({ u, base: g });
      keep(col);
    }

    // Dust devils: spinning tan cones.
    for (const v of stage.devils) {
      const g = terrain.surfaceAt(v.x, v.d, -Infinity);
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(v.r, v.r * 0.25, 26, 10, 3, true),
        new THREE.MeshBasicMaterial({ color: 0xd8b07a, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
      cone.position.set(v.x, g + 13, -v.d);
      devilCones.push(cone);
      keep(cone);
    }

    // Windsocks at the start of each wind band.
    const sockMat = lam(0xff7a1a);
    for (const b of [...stage.tailwinds, ...stage.gusts]) {
      const x = (b.x0 + b.x1) / 2, g = terrain.surfaceAt(x, b.d0, -Infinity);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 5), lam(0xffffff));
      pole.position.set(x, g + 3, -b.d0);
      const sock = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.4, 8, 1, true), sockMat);
      const fwd = b.push !== undefined && stage.tailwinds.includes(b);
      sock.rotation.set(fwd ? -Math.PI / 2 : 0, 0, fwd ? 0 : (b.push > 0 ? -Math.PI / 2 : Math.PI / 2));
      sock.position.set(x + (fwd ? 0 : Math.sign(b.push) * 1.2), g + 5.6, -b.d0 - (fwd ? 1.2 : 0));
      keep(pole); keep(sock);
    }

    // City: window lights on the building faces that look at the corridor, + the helipad.
    if (theme.windows && terrain.blocks.length) {
      const wins = [];
      for (const b of terrain.blocks) {
        if (b.h < 6) continue;
        const face = b.x0 > 0 ? b.x0 - 0.05 : b.x1 + 0.05;
        for (let y = 3; y < b.h - 1; y += 3) for (let d = b.d0 + 2; d < b.d1 - 1; d += 4) if ((d * 7 + y * 3) % 5 < 3) wins.push([face, y, d]);
      }
      const winMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.2, 1.4).rotateY(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffe08a }), Math.max(1, wins.length));
      winMesh.frustumCulled = false;
      wins.forEach(([x, y, d], i) => setInst(winMesh, i, x, y, d, 1, 1, 1));
      keep(winMesh);
      for (const b of terrain.blocks.filter((q) => q.helipad)) {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const g2 = c.getContext('2d');
        g2.fillStyle = '#3b3f48'; g2.fillRect(0, 0, 128, 128);
        g2.strokeStyle = '#ffd23f'; g2.lineWidth = 8; g2.beginPath(); g2.arc(64, 64, 52, 0, Math.PI * 2); g2.stroke();
        g2.fillStyle = '#ffffff'; g2.font = 'bold 80px system-ui, sans-serif'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText('H', 64, 68);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        const pad = new THREE.Mesh(new THREE.CircleGeometry(5, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex }));
        pad.position.set((b.x0 + b.x1) / 2, b.h + 0.06, -(b.d0 + b.d1) / 2);
        keep(pad);
      }
    }
    // v1.2 NEON VOID: every lap feature drawn as dark faces + neon edges (the theme's colours).
    if (theme.neon) for (const o of stageMeshes) neonify(o, theme.neon);
  }

  function showLap(lap) {
    lapShown = lap;
    lapGroup.position.set(0, 0, -lap * terrain.cycle);
  }

  // ---------- small scenery ---------- (placement lives in scenery.js, shared with the colliders)

  function groundColor(h, x, d) {
    if (theme.neon) { _c.setHex(theme.neon.face); return; } // v1.2: black ground (the grid is the light)
    const G = theme.ground;
    const shade = 0.5 + 0.5 * Math.sin(x * 0.37 + d * 0.23) * Math.cos(d * 0.11);
    if (G.water && terrain.surfaceKind(x, d) === 'water') { _c.setRGB(G.water[0] + 0.04 * shade, G.water[1] + 0.05 * shade, G.water[2]); return; }
    let c;
    if (h > 14 || (theme.windows && h > 3)) c = G.high;
    else if (h < -1) c = G.low;
    else if (G.water && h < 1.2) c = G.low; // beaches
    else c = G.grass;
    // v0.7: a very subtle fine grain so big slopes aren't empty (a hash, no visible tiling).
    const grain = (((Math.sin(x * 12.9898 + d * 78.233) * 43758.5453) % 1) + 1) % 1 * 0.03 - 0.015;
    _c.setRGB(c[0] + 0.06 * shade + h * 0.004 + grain, c[1] + 0.06 * shade + grain, c[2] + 0.04 * shade + grain);
  }

  // v1.2 NEON VOID: a glowing grid on the ground — lines along the chunk's own vertices (every 8 m),
  // made the first time a neon world shows the chunk and rewritten in place on recycle.
  const GRID_COLS = xs.map((x, c) => (Math.abs(x) > 40 || x % 8 === 0 ? c : -1)).filter((c) => c >= 0);
  const GRID_ROWS = Array.from({ length: ZS }, (_, r) => r).filter((r) => r % 2 === 0);
  function writeGrid(ch) {
    const n = (GRID_COLS.length * (ZS - 1) + GRID_ROWS.length * (xs.length - 1)) * 2;
    if (!ch.grid) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      ch.grid = new THREE.LineSegments(geo, edgeMat(theme.neon.grid));
      ch.grid.frustumCulled = false;
      scene.add(ch.grid);
    }
    ch.grid.material = edgeMat(theme.neon.grid);
    const src = ch.mesh.geometry.attributes.position, dst = ch.grid.geometry.attributes.position;
    let i = 0;
    const put = (v) => { dst.setXYZ(i++, src.getX(v), src.getY(v) + 0.06, src.getZ(v)); };
    for (const c of GRID_COLS) for (let r = 0; r < ZS - 1; r++) { put(r * xs.length + c); put((r + 1) * xs.length + c); }
    for (const r of GRID_ROWS) for (let c = 0; c < xs.length - 1; c++) { put(r * xs.length + c); put(r * xs.length + c + 1); }
    dst.needsUpdate = true;
  }

  function buildChunk(ch, k) {
    ch.index = k;
    const d0 = k * L;
    const pos = ch.mesh.geometry.attributes.position;
    const col = ch.mesh.geometry.attributes.color;
    let i = 0;
    for (let r = 0; r < ZS; r++) {
      const d = d0 + (r / (ZS - 1)) * L;
      for (const x of xs) {
        const h = terrain.surfaceAt(x, d, -Infinity);
        pos.setXYZ(i, x, h, -d);
        groundColor(h, x, d);
        col.setXYZ(i, _c.r, _c.g, _c.b);
        i++;
      }
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    if (theme.neon) writeGrid(ch);

    const sc = fillSceneryChunk(stage, terrain, k, ch.scenery);
    for (let t = 0; t < TP; t++) {
      const idx = ch.slot * TP + t;
      const o = sc.trees[t];
      const { x, d, h, s, spin } = o;
      if (o.kind === 'none') { trunks.setMatrixAt(idx, ZERO); cones.setMatrixAt(idx, ZERO); balls.setMatrixAt(idx, ZERO); continue; }
      if (o.kind === 'cactus') {
        setInst(trunks, idx, x, h, d, 1.4 * s, 4 * s, 1.4 * s);
        setInst(balls, idx, x, h + 4 * s, d, 0.45 * s, 0.45 * s, 0.45 * s);
        cones.setMatrixAt(idx, ZERO);
        continue;
      }
      if (o.kind === 'palm') {
        setInst(trunks, idx, x, h, d, 0.7 * s, 5 * s, 0.7 * s, 0, 0.12);
        setInst(balls, idx, x, h + 5 * s, d, 2.2 * s, 0.6 * s, 2.2 * s, spin);
        cones.setMatrixAt(idx, ZERO);
        continue;
      }
      setInst(trunks, idx, x, h, d, s, o.trunkH, s);
      if (o.kind === 'cone') {
        setInst(cones, idx, x, h + o.trunkH, d, 1.5 * s, 3.4 * s, 1.5 * s, spin);
        balls.setMatrixAt(idx, ZERO);
      } else {
        setInst(balls, idx, x, h + o.trunkH + 1.2 * s, d, (o.street ? 1.1 : 1.5) * s, 1.4 * s, (o.street ? 1.1 : 1.5) * s, spin);
        cones.setMatrixAt(idx, ZERO);
      }
    }
    for (let t = 0; t < RP; t++) {
      const o = sc.rocks[t];
      if (!o.on) { rocks.setMatrixAt(ch.slot * RP + t, ZERO); continue; }
      setInst(rocks, ch.slot * RP + t, o.x, o.h, o.d, o.s * 1.3, o.s, o.s, o.ry);
    }
    sc.clouds.forEach((c, ci) => {
      for (let p = 0; p < 3; p++) {
        setInst(clouds, ch.slot * CP + ci * 3 + p, c.x + (p - 1) * c.s * 1.2, c.y + (p === 1 ? c.s * 0.3 : 0), c.d, c.s * (p === 1 ? 1.3 : 1), c.s * 0.8, c.s);
      }
    });
    trunks.instanceMatrix.needsUpdate = true;
    cones.instanceMatrix.needsUpdate = true;
    balls.instanceMatrix.needsUpdate = true;
    rocks.instanceMatrix.needsUpdate = true;
    clouds.instanceMatrix.needsUpdate = true;
  }

  // ---------- coins for this flight ----------
  const segs = new Map();   // segment k → coin array
  let picker = null, coinRand = null;
  const lapsDone = new Set();
  const active = [];        // coins in the visible window (rebuilt when the window moves)
  let windowFirst = null;

  function ensureSegment(k) {
    if (segs.has(k)) return;
    segs.set(k, patternCoins(stage, terrain, k, picker.pick(k), coinRand).map((c) => ({ ...c, alive: true })));
  }
  function ensureLap(lap) {
    if (lapsDone.has(lap)) return;
    lapsDone.add(lap);
    for (const c of featureCoins(stage, terrain, lap)) {
      const k = Math.floor(c.d / L);
      ensureSegment(k);
      segs.get(k).push({ ...c, alive: true });
    }
  }

  // Distance flags (two pooled flags, one pole each side of the corridor).
  const flags = [];
  const poleMat = lam(0xffffff);
  for (let i = 0; i < 2; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const clothMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    const group = new THREE.Group();
    for (const side of [-1, 1]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 12, 6), poleMat);
      pole.position.set(side * WORLD.flagX, 6, 0);
      group.add(pole);
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), clothMat);
      cloth.position.set(side * (WORLD.flagX - 4.2), 10, 0);
      group.add(cloth);
    }
    group.visible = false;
    scene.add(group);
    flags.push({ group, canvas, tex, n: -1 });
  }
  function drawFlag(f, meters) {
    const g = f.canvas.getContext('2d');
    g.fillStyle = '#ff5d5d';
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = '#fff';
    g.fillRect(8, 8, 240, 112);
    g.fillStyle = '#ff5d5d';
    g.font = 'bold 64px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(`${meters} m`, 128, 68);
    f.tex.needsUpdate = true;
  }

  // ---------- launch site: pad (grows with the RAMP level), slingshot, bands ----------
  const wood = lam(0xb07a45);
  const darkWood = lam(0x7d5230);
  const launch = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(DECK.halfWidth * 2, 0.3, 1), wood);
  launch.add(deck);
  const posts = [];
  for (const px of [-1, 1]) for (const f of [0.05, 0.5, 0.95]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1, 0.35), darkWood);
    post.userData = { px, f };
    launch.add(post);
    posts.push(post);
  }
  const rails = [-1, 1].map((side) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.4, 1), lam(0xffc61a));
    rail.userData.side = side;
    launch.add(rail);
    return rail;
  });
  const forkD = DECK.end - 0.2;
  const arms = [];
  const knobs = [];
  const knobMat = lam(0xff5d5d);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 2.0, 6), darkWood);
    arm.rotation.z = -side * 0.2;
    arm.userData.side = side;
    launch.add(arm);
    arms.push(arm);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 4), knobMat);
    knob.userData.side = side;
    launch.add(knob);
    knobs.push(knob);
  }
  scene.add(launch);

  const tips = [new THREE.Vector3(), new THREE.Vector3()];
  const anchors = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const bandMat = lam(0xd9b77a);
  const bandGeo = new THREE.CylinderGeometry(0.07, 0.07, 1, 5).translate(0, 0.5, 0);
  const attachOffsets = [0, 0, -0.12, -0.12];
  const bands = anchors.map(() => {
    const b = new THREE.Mesh(bandGeo, bandMat);
    scene.add(b);
    return b;
  });
  let bandThickness = 1;
  const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.15), lam(0x6b3b1f));
  scene.add(pouch);
  const restPoint = new THREE.Vector3();

  // Rebuild the pad for a ramp level (on purchase / new flight, never per frame).
  function setRamp(rampLv, extra) {
    const top = LAUNCH.deckHeight + rampLv.height;
    const start = DECK.start - extra;
    const len = DECK.end - start;
    deck.scale.z = len;
    deck.position.set(0, top - 0.15, -(start + len / 2));
    for (const p of posts) {
      p.scale.y = top + 4; // reaches down into the sea on the Ocean stage too
      p.position.set(p.userData.px * (DECK.halfWidth - 0.3), (top - 4) / 2, -(start + 0.5 + p.userData.f * (len - 1)));
    }
    for (const r of rails) {
      r.visible = rampLv.rails;
      r.scale.z = len;
      r.position.set(r.userData.side * (DECK.halfWidth - 0.1), top + 0.2, -(start + len / 2));
    }
    for (const a of arms) a.position.set(a.userData.side * 1.65, top + 0.95, -forkD);
    knobs.forEach((k, i) => {
      tips[i].set(k.userData.side * 1.85, top + 1.95, -forkD);
      k.position.copy(tips[i]);
    });
    for (let i = 0; i < 4; i++) {
      anchors[i].copy(tips[i % 2]);
      if (i >= 2) anchors[i].y -= 0.32;
    }
    restPoint.set(0, top + 1.1, -forkD);
  }

  // Band look = strength (colour ladder lives in config BAND).
  function setBandLook(look) {
    bandMat.color.setHex(look.color);
    bandThickness = look.thickness;
    bands[2].visible = bands[3].visible = look.doubleBands;
    for (const a of arms) a.scale.set(look.frameScale, 1, look.frameScale);
    for (const k of knobs) k.scale.setScalar(look.frameScale);
    knobMat.color.setHex(look.level >= 10 ? 0xffffff : look.level >= 6 ? look.color : look.level >= 5 ? 0xffc61a : 0xff5d5d);
    bandRainbow = !!look.rainbow; // v1.0 Lv10: the bands shimmer through the rainbow
  }
  let bandRainbow = false;
  const _bandHsl = new THREE.Color();

  const _dir = new THREE.Vector3();
  const _end = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  // Stretch the bands from the fork tips to `p` (a world point).
  function setBands(p) {
    if (bandRainbow) bandMat.color.copy(_bandHsl.setHSL((performance.now() / 4000) % 1, 0.9, 0.6));
    pouch.position.copy(p);
    bands.forEach((b, i) => {
      _end.copy(p).y += attachOffsets[i];
      _dir.subVectors(_end, anchors[i]);
      const len = _dir.length();
      b.position.copy(anchors[i]);
      b.scale.set(bandThickness, Math.max(0.01, len), bandThickness);
      b.quaternion.setFromUnitVectors(UP, _dir.multiplyScalar(1 / Math.max(len, 1e-4)));
    });
  }

  // ---------- per-frame ----------
  let spin = 0, clock = 0;
  let usedSet = new Set(); // the flight's used arches/rings/devils (ids `${lap}:${i}<type>`)
  function animateGimmicks(planeD, dt) {
    clock += dt;
    const lapOff = lapShown * terrain.cycle;
    // Updraft rings rise through their columns.
    let n = 0;
    for (const { u, base } of updraftCols) {
      for (let j = 0; j < 6 && n < 30; j++, n++) {
        const y = base + ((clock * 6 + j * 10) % 60);
        const s = u.r * (0.55 + 0.1 * Math.sin(clock * 3 + j));
        setInst(updraftRings, n, u.x, y, u.d, s, 1, s);
      }
    }
    for (; n < 30; n++) updraftRings.setMatrixAt(n, ZERO);
    updraftRings.instanceMatrix.needsUpdate = true;
    for (const c of devilCones) c.rotation.y += dt * 6;
    // Used rings turn grey.
    terrain.rings.slice(0, 32).forEach((r, i) => ringMesh.setColorAt(i, _c.setHex(usedSet.has(`${lapShown}:${r.id}ring`) ? 0x9a9a9a : 0xffffff)));
    if (ringMesh.instanceColor) ringMesh.instanceColor.needsUpdate = true;
    // Wind streaks in the bands near the plane.
    const bandsNear = [];
    for (const b of stage.tailwinds) if (b.d1 + lapOff > planeD - 40 && b.d0 + lapOff < planeD + 260) bandsNear.push({ b, fwd: true, off: lapOff });
    for (const b of stage.gusts) if (b.d1 + lapOff > planeD - 40 && b.d0 + lapOff < planeD + 260) bandsNear.push({ b, fwd: false, off: lapOff });
    // v1.2 SLIPSTREAM lanes (absolute distances, a box of air): light rushes through them.
    if (terrain.neon) for (const b of terrain.neon.lanes) if (b.d1 > planeD - 40 && b.d0 < planeD + 260) bandsNear.push({ b, fwd: true, off: 0, lane: true });
    for (let i = 0; i < STREAKS; i++) {
      const s = streaks[i];
      const nb = bandsNear[i % Math.max(1, bandsNear.length)];
      if (!nb) { streakMesh.setMatrixAt(i, ZERO); continue; }
      const b = nb.b, off = nb.off;
      if (s.band !== b || s.d < b.d0 + off || s.d > b.d1 + off || s.x < b.x0 || s.x > b.x1) {
        s.band = b;
        s.x = b.x0 + Math.random() * (b.x1 - b.x0);
        s.d = b.d0 + off + Math.random() * (b.d1 - b.d0);
        s.y = nb.lane ? b.y0 + Math.random() * (b.y1 - b.y0) : terrain.surfaceAt(s.x, s.d, Infinity) + 2 + Math.random() * 24;
      }
      if (nb.fwd) s.d += (nb.lane ? 160 : 40) * dt; else s.x += Math.sign(b.push) * 25 * dt;
      setInst(streakMesh, i, s.x, s.y, s.d, 1, 1, 1, nb.fwd ? 0 : Math.PI / 2);
    }
    streakMesh.instanceMatrix.needsUpdate = true;
  }

  function update(planeD, planeX, dt, camPos = null) {
    // Bumpables: idle life, or their set-piece (only in the lap they were bumped in).
    for (const c of critters) {
      const mine = c.lap === lapShown && c.t >= 0;
      if (mine) c.t += dt;
      else if (c.t >= 0) { c.t = -1; c.lap = -1; resetCritter(c.g); }
      animateCritter(c.g, c.b.cast.leave, mine ? c.t : -1, clockT, c.home);
      if (c.b.tailLap !== undefined && c.b.tailLap !== lapShown) c.g.visible = false; // v1.1 deep tail: one lap only
    }
    clockT += dt;
    if (fogPulse > 0) {
      fogPulse = Math.max(0, fogPulse - dt);
      const k = Math.min(1, fogPulse / 0.4, (2 - fogPulse) / 0.3 + 0.0001);
      scene.fog.near = theme.fogNear * (1 - 0.95 * k);
      scene.fog.far = theme.fogFar + (30 - theme.fogFar) * k;
    }
    if (spaceSky.visible && camPos) spaceSky.position.copy(camPos);
    if (camPos) { dome.position.copy(camPos); farLayer.position.set(camPos.x, 0, camPos.z); }
    const first = Math.floor(planeD / L) - 1;
    for (let k = first; k < first + N; k++) {
      const slot = ((k % N) + N) % N;
      if (chunks[slot].index !== k) buildChunk(chunks[slot], k);
    }
    for (const b of bases) b.position.set(b.userData.side * (HALF + 1500), -0.3, -planeD);
    // A lap's features end near its end, so switch to the next lap just before it.
    const lap = Math.floor((Math.max(0, planeD) + 50) / terrain.cycle);
    if (lap !== lapShown) showLap(lap);
    animateGimmicks(planeD, dt);

    // Coins in the visible window.
    if (picker) {
      if (first !== windowFirst) {
        windowFirst = first;
        ensureLap(Math.floor(Math.max(0, planeD - L) / terrain.cycle));
        ensureLap(Math.floor(Math.max(0, planeD + N * L) / terrain.cycle));
        active.length = 0;
        for (let k = Math.max(0, first); k < first + N; k++) {
          ensureSegment(k);
          for (const c of segs.get(k)) active.push(c);
        }
      }
      spin += dt * 3;
      let i = 0;
      for (const c of active) {
        if (i >= WORLD.coinSlots) break;
        if (c.alive) {
          const k = c.big ? 2.2 : 1, turn = spin + c.d * 0.2;
          // v0.7 GLINT: a quick bright flash as each coin turns face-on (still unmistakably gold).
          const g = Math.max(0, Math.cos(turn * 2)) ** 24;
          coinMesh.setColorAt(i, _c.setRGB(1 + 0.9 * g, 1 + 0.8 * g, 1 + 0.5 * g));
          setInst(coinMesh, i++, c.x, c.y, c.d, k, k, k, turn); // big = a slot TOKEN
        }
      }
      for (; i < WORLD.coinSlots; i++) coinMesh.setMatrixAt(i, ZERO);
      coinMesh.instanceMatrix.needsUpdate = true;
      if (coinMesh.instanceColor) coinMesh.instanceColor.needsUpdate = true;
    }

    // Flags for the milestones near the plane.
    const every = WORLD.flagEvery;
    for (let n = Math.max(1, Math.ceil((planeD - 60) / every)); n * every < planeD + WORLD.fogFar; n++) {
      const f = flags[n % 2];
      if (f.n !== n) {
        f.n = n;
        drawFlag(f, n * every);
        f.group.position.set(0, Math.max(0, terrain.surfaceAt(0, n * every, Infinity)) * 0.3, -n * every);
        f.group.visible = true;
      }
    }
  }

  // Pocket looks: the Nebula Pocket's purple fog, the Eye of the Storm's golden calm.
  const POCKET_FOG = { nebula: 0x3a1a5a, stormEye: 0xffd98a, aurora: 0x2a4a6a, goldMine: 0x4a3418, neon: 0x2a1a40, comet: 0x14204a, gridCore: 0x001820, prism: 0x1a0018 };
  function setPocketLook(look) {
    const c = look && POCKET_FOG[look];
    if (c) { scene.fog.color.setHex(c); scene.background.setHex(c); }
    else { const h = paintSky(theme); scene.fog.color.copy(h); scene.background.copy(h); }
    dome.visible = !c; // a tinted pocket hides the sky dome + far range (v1.2: the void never has one)
    farLayer.visible = !c && !theme.neon;
  }
  // The cloud tunnel feels like fog for 2 s (v0.6 part 2).
  let fogPulse = 0;
  function fogIn(seconds = 2) { fogPulse = seconds; }

  // Switch stage: theme + static meshes (never per frame).
  function setStage(newStage, newTerrain) {
    stage = newStage;
    theme = stage.theme;
    terrain = newTerrain;
    const horizon = paintSky(theme);
    buildFar(stage, horizon);
    scene.background.copy(horizon);
    scene.fog.color.copy(horizon); // fog matched to the horizon stop
    scene.fog.near = theme.fogNear;
    scene.fog.far = theme.fogFar;
    hemi.groundColor.setHex(theme.hemiGround);
    sun.color.setHex(theme.sun);
    hemi.intensity = theme.neon ? 0.5 : 1.6; // v1.2: the void is dim (the neon lines are unlit)
    sun.intensity = theme.neon ? 0.5 : 1.8;
    baseMat.color.setHex(theme.base);
    rockMatSmall.color.setHex(stage.id === 'snow' ? 0xdfe8f2 : theme.rock);
    const sc = theme.scenery;
    coneMat.color.setHex(sc === 'snowpine' ? 0x2f6b4f : sc === 'pine' ? 0x3f7a3a : 0x2f9e44);
    ballMat.color.setHex(sc === 'cactus' ? 0x4fb35a : sc === 'palm' ? 0x3fae4a : 0x51b848);
    trunkMat.color.setHex(sc === 'cactus' ? 0x3f9a4a : sc === 'palm' ? 0x9a7046 : 0x8a5a35);
    spaceSky.visible = !!theme.space;
    coinMesh = theme.space ? starCoins : roundCoins;
    for (const m of [roundCoins, starCoins]) { for (let i = 0; i < WORLD.coinSlots; i++) m.setMatrixAt(i, ZERO); m.instanceMatrix.needsUpdate = true; }
    // Space: the CATAPULT RAIL on a moon LAUNCH PAD (metal + glowing energy bands).
    wood.color.setHex(theme.space ? 0x8e96a3 : 0xb07a45);
    darkWood.color.setHex(theme.space ? 0xc9d0da : 0x7d5230);
    bandMat.emissive.setHex(theme.space ? 0x335577 : 0x000000);
    cloudMat.color.setHex(theme.space ? 0x7a7d86 : 0xffffff);   // space: floating rock islets
    cloudMat.emissive.setHex(theme.space ? 0x15161c : 0x777777);
    // v1.2 NEON VOID: an empty black void — no far range, no clouds; the ground grid shows.
    farLayer.visible = clouds.visible = !theme.neon;
    streakMesh.material.color.setHex(theme.neon ? theme.neon.lane : 0x5f8fc8);
    for (const ch of chunks) if (ch.grid) ch.grid.visible = !!theme.neon;
    buildStageMeshes();
    for (const ch of chunks) ch.index = -9999;
    lapShown = -1;
  }

  // New terrain (the ramp level changes the deck) and a fresh, seeded coin layout.
  function newFlight(newTerrain, seed) {
    terrain = newTerrain;
    for (const ch of chunks) ch.index = -9999;
    for (const f of flags) { f.n = -1; f.group.visible = false; }
    segs.clear();
    lapsDone.clear();
    active.length = 0;
    windowFirst = null;
    picker = makePatternPicker(stage, terrain, seed);
    resetCritters(); // bumpables respawn every flight
    coinRand = rng(seed * 31 + 7);
    lapShown = -1;
    update(0, 0, 0);
  }

  return {
    update, newFlight, setStage, setBands, setBandLook, setRamp, restPoint, forkD, bump, fogIn, setPocketLook,
    activeCoins: () => active, setUsed: (set) => { usedSet = set; },
  };
}
