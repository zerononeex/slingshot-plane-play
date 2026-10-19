// Streaming world for any stage: pooled terrain chunks + instanced scenery, the
// stage's static features (columns, cavern roofs, arches, rings, updrafts, dust
// devils, windsocks, city windows) in one "lap group", per-flight coins, distance
// flags and the launch site. Nothing is allocated per frame: chunks recycle by
// rewriting their buffers; stage meshes are built once per stage switch.
import * as THREE from 'three';
import { WORLD, LAUNCH } from './config.js';
import { DECK } from './terrain.js';
import { rng, makePatternPicker, patternCoins, featureCoins } from './coins.js';

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

// Column looks per kind: body colour, cap colour, cap shape scale (x, y), cap lift.
const COLUMN_LOOK = {
  tree: { body: 0x7a4a28, cap: 0x3a9a3a, capScale: [5, 4.5], hero: [7, 6.3] },
  pine: { body: 0x6b4423, cap: 0x2f6b4f, capScale: [4, 7], hero: [6, 10] },
  pillar: { body: 0xb85a32, cap: 0xc96a3a, capScale: [1.15, 0.6] },
  cactus: { body: 0x3f9a4a, cap: 0x4fb35a, capScale: [1, 1], hero: [1, 1] },
  waterTower: { body: 0x8fa3b8, cap: 0xd14b3b, capScale: [1.2, 0.6] },
  antenna: { body: 0xdddddd, cap: 0xff3030, capScale: [2.5, 2.5], glow: true },
  post: { body: 0x7d5230, cap: 0x7d5230, capScale: [1, 0.3] },
  lighthouse: { body: 0xffffff, cap: 0xe8262c, capScale: [1.3, 1.1], glow: true },
};

export function createWorld(scene) {
  const hemi = new THREE.HemisphereLight(0xffffff, 0x6f9a52, 1.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3d6, 1.8);
  sun.position.set(-40, 80, 30);
  scene.add(sun);
  scene.background = new THREE.Color(0x9fdcff);
  scene.fog = new THREE.Fog(0x9fdcff, WORLD.fogNear, WORLD.fogFar);

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
    chunks.push({ slot: i, index: -9999, mesh });
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
  const TP = 14, RP = 8, CP = WORLD.cloudsPerChunk * 3;
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
  const clouds = inst(new THREE.IcosahedronGeometry(1, 0), lam(0xffffff, { emissive: 0x777777 }), N * CP);
  const coinGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.18, 14).rotateX(Math.PI / 2);
  const coinMesh = inst(coinGeo, lam(0xffc61a, { emissive: 0x5a3c00 }), WORLD.coinSlots);

  // ---------- the lap group: every static stage feature, moved lap by lap ----------
  const lapGroup = new THREE.Group();
  scene.add(lapGroup);
  let lapShown = -1;
  const stageMeshes = []; // disposed on stage switch
  const keep = (o) => { stageMeshes.push(o); lapGroup.add(o); return o; };

  const colBody = inst(new THREE.CylinderGeometry(1, 1, 1, 8).translate(0, 0.5, 0), lam(0xffffff), 64, lapGroup);
  const colCap = inst(new THREE.IcosahedronGeometry(1, 0), lam(0xffffff), 64, lapGroup);
  const ringMesh = inst(new THREE.TorusGeometry(1, 0.12, 6, 18), lam(0xffd23f, { emissive: 0x8a6a00 }), 32, lapGroup);
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
  }

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
      colBody.setColorAt(i, _c.setHex(t.kind === 'lighthouse' && i % 2 ? 0xe8262c : look.body));
      const cs = t.hero && look.hero ? look.hero : look.capScale;
      const capR = t.kind === 'tree' || t.kind === 'pine' ? cs[0] : t.r * cs[0];
      const capY = t.kind === 'tree' || t.kind === 'pine' ? cs[1] : t.r * cs[1];
      setInst(colCap, i, t.x, g + t.h + capY * 0.4, t.d, capR, capY, capR);
      colCap.setColorAt(i, _c.setHex(look.cap));
    });
    colBody.instanceMatrix.needsUpdate = true;
    colCap.instanceMatrix.needsUpdate = true;
    if (colBody.instanceColor) colBody.instanceColor.needsUpdate = true;
    if (colCap.instanceColor) colCap.instanceColor.needsUpdate = true;

    // Cavern roofs (rock, ice, a lit building, a pyramid, a sea cave).
    for (const c of stage.caverns) {
      const g = new THREE.Group();
      const left = c.laneMax < 0;
      const mat = c.ice ? lam(0xbfe6ff, { emissive: 0x2a5a7a }) : c.shape === 'block' ? lam(0xb8a890) : c.shape === 'pyramid' ? lam(0xd9b46a) : rockMat;
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

    // Rings.
    for (let i = 0; i < 32; i++) ringMesh.setMatrixAt(i, ZERO);
    terrain.rings.slice(0, 32).forEach((r, i) => setInst(ringMesh, i, r.x, r.y, r.d, r.r, r.r, r.r));
    ringMesh.instanceMatrix.needsUpdate = true;

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
  }

  function showLap(lap) {
    lapShown = lap;
    lapGroup.position.set(0, 0, -lap * terrain.cycle);
  }

  // ---------- small scenery ----------
  // Keep small scenery out of the tunnels, the obstacle slaloms and the launch lane.
  function sceneryX(x, d) {
    const dl = terrain.local(d);
    for (const c of stage.caverns) {
      const left = c.laneMax < 0;
      if (dl > c.start - 10 && dl < c.end + 10 && (left ? x > -30 && x < -6 : x < 30 && x > 6)) return x + (left ? -40 : 40);
    }
    for (const z of stage.zones) if (dl > z.from - 10 && dl < z.to + 10 && Math.abs(x) > 6 && Math.abs(x) < 28 && (z.side === 'left') === (x < 0)) return x + Math.sign(x) * 30;
    if (d < 60 && Math.abs(x) < 10) return x + (x < 0 ? -12 : 12);
    return x;
  }

  function groundColor(h, x, d) {
    const G = theme.ground;
    const shade = 0.5 + 0.5 * Math.sin(x * 0.37 + d * 0.23) * Math.cos(d * 0.11);
    if (G.water && terrain.surfaceKind(x, d) === 'water') { _c.setRGB(G.water[0] + 0.04 * shade, G.water[1] + 0.05 * shade, G.water[2]); return; }
    let c;
    if (h > 14 || (theme.windows && h > 3)) c = G.high;
    else if (h < -1) c = G.low;
    else if (G.water && h < 1.2) c = G.low; // beaches
    else c = G.grass;
    _c.setRGB(c[0] + 0.06 * shade + h * 0.004, c[1] + 0.06 * shade, c[2] + 0.04 * shade);
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

    const r = rng(k * 7919 + 17);
    const kind = theme.scenery;
    for (let t = 0; t < TP; t++) {
      const idx = ch.slot * TP + t;
      const d = d0 + r() * L;
      let x = sceneryX((r() * 2 - 1) * (HALF - 10), d);
      if (kind === 'street') x = (r() < 0.5 ? -1 : 1) * (7.5 + r() * 1.5);
      const h = terrain.surfaceAt(x, d, Infinity);
      const s = 0.8 + r() * 0.9;
      const hide = t >= theme.treesPerChunk || (terrain.surfaceKind(x, d) === 'water') || (kind === 'street' && h > 0.5);
      const roll = r(), spin = r() * 6;
      if (hide) { trunks.setMatrixAt(idx, ZERO); cones.setMatrixAt(idx, ZERO); balls.setMatrixAt(idx, ZERO); continue; }
      if (kind === 'cactus') {
        setInst(trunks, idx, x, h, d, 1.4 * s, 4 * s, 1.4 * s);
        setInst(balls, idx, x, h + 4 * s, d, 0.45 * s, 0.45 * s, 0.45 * s);
        cones.setMatrixAt(idx, ZERO);
        continue;
      }
      if (kind === 'palm') {
        setInst(trunks, idx, x, h, d, 0.7 * s, 5 * s, 0.7 * s, 0, 0.12);
        setInst(balls, idx, x, h + 5 * s, d, 2.2 * s, 0.6 * s, 2.2 * s, spin);
        cones.setMatrixAt(idx, ZERO);
        continue;
      }
      const trunkH = 1.2 * s;
      setInst(trunks, idx, x, h, d, s, trunkH, s);
      const cone = kind === 'pine' || kind === 'snowpine' || (kind === 'mixed' && roll < 0.55);
      if (cone) {
        setInst(cones, idx, x, h + trunkH, d, 1.5 * s, 3.4 * s, 1.5 * s, spin);
        balls.setMatrixAt(idx, ZERO);
      } else {
        setInst(balls, idx, x, h + trunkH + 1.2 * s, d, (kind === 'street' ? 1.1 : 1.5) * s, 1.4 * s, (kind === 'street' ? 1.1 : 1.5) * s, spin);
        cones.setMatrixAt(idx, ZERO);
      }
    }
    for (let t = 0; t < RP; t++) {
      const d = d0 + r() * L;
      const x = sceneryX((r() * 2 - 1) * (HALF - 10), d);
      const s = 0.6 + r() * 1.4;
      if (t >= theme.rocksPerChunk || terrain.surfaceKind(x, d) === 'water') { rocks.setMatrixAt(ch.slot * RP + t, ZERO); continue; }
      setInst(rocks, ch.slot * RP + t, x, terrain.surfaceAt(x, d, Infinity), d, s * 1.3, s, s, r() * 6);
    }
    for (let c = 0; c < WORLD.cloudsPerChunk; c++) {
      const side = r() < 0.5 ? -1 : 1;
      const cx = side * (20 + r() * 80);
      const cy = 48 + r() * 30;
      const cd = d0 + r() * L;
      const s = 3 + r() * 3;
      for (let p = 0; p < 3; p++) {
        setInst(clouds, ch.slot * CP + c * 3 + p, cx + (p - 1) * s * 1.2, cy + (p === 1 ? s * 0.3 : 0), cd, s * (p === 1 ? 1.3 : 1), s * 0.8, s);
      }
    }
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
    knobMat.color.setHex(look.level >= 5 ? 0xffc61a : 0xff5d5d);
  }

  const _dir = new THREE.Vector3();
  const _end = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  // Stretch the bands from the fork tips to `p` (a world point).
  function setBands(p) {
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
    for (const b of stage.tailwinds) if (b.d1 + lapOff > planeD - 40 && b.d0 + lapOff < planeD + 260) bandsNear.push({ b, fwd: true });
    for (const b of stage.gusts) if (b.d1 + lapOff > planeD - 40 && b.d0 + lapOff < planeD + 260) bandsNear.push({ b, fwd: false });
    for (let i = 0; i < STREAKS; i++) {
      const s = streaks[i];
      const nb = bandsNear[i % Math.max(1, bandsNear.length)];
      if (!nb) { streakMesh.setMatrixAt(i, ZERO); continue; }
      const b = nb.b;
      if (s.band !== b || s.d < b.d0 + lapOff || s.d > b.d1 + lapOff || s.x < b.x0 || s.x > b.x1) {
        s.band = b;
        s.x = b.x0 + Math.random() * (b.x1 - b.x0);
        s.d = b.d0 + lapOff + Math.random() * (b.d1 - b.d0);
        s.y = terrain.surfaceAt(s.x, s.d, Infinity) + 2 + Math.random() * 24;
      }
      if (nb.fwd) s.d += 40 * dt; else s.x += Math.sign(b.push) * 25 * dt;
      setInst(streakMesh, i, s.x, s.y, s.d, 1, 1, 1, nb.fwd ? 0 : Math.PI / 2);
    }
    streakMesh.instanceMatrix.needsUpdate = true;
  }

  function update(planeD, planeX, dt) {
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
        if (c.alive) setInst(coinMesh, i++, c.x, c.y, c.d, 1, 1, 1, spin + c.d * 0.2);
      }
      for (; i < WORLD.coinSlots; i++) coinMesh.setMatrixAt(i, ZERO);
      coinMesh.instanceMatrix.needsUpdate = true;
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

  // Switch stage: theme + static meshes (never per frame).
  function setStage(newStage, newTerrain) {
    stage = newStage;
    theme = stage.theme;
    terrain = newTerrain;
    scene.background.setHex(theme.sky);
    scene.fog.color.setHex(theme.sky);
    scene.fog.near = theme.fogNear;
    scene.fog.far = theme.fogFar;
    hemi.groundColor.setHex(theme.hemiGround);
    sun.color.setHex(theme.sun);
    baseMat.color.setHex(theme.base);
    rockMatSmall.color.setHex(stage.id === 'snow' ? 0xdfe8f2 : theme.rock);
    const sc = theme.scenery;
    coneMat.color.setHex(sc === 'snowpine' ? 0x2f6b4f : sc === 'pine' ? 0x3f7a3a : 0x2f9e44);
    ballMat.color.setHex(sc === 'cactus' ? 0x4fb35a : sc === 'palm' ? 0x3fae4a : 0x51b848);
    trunkMat.color.setHex(sc === 'cactus' ? 0x3f9a4a : sc === 'palm' ? 0x9a7046 : 0x8a5a35);
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
    coinRand = rng(seed * 31 + 7);
    lapShown = -1;
    update(0, 0, 0);
  }

  return {
    update, newFlight, setStage, setBands, setBandLook, setRamp, restPoint, forkD,
    activeCoins: () => active, setUsed: (set) => { usedSet = set; },
  };
}
