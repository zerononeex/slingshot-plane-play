// Streaming world for a stage: pooled terrain chunks + instanced scenery, big
// forest trees, cavern roofs, per-flight coins, distance flags and the launch site.
// Nothing is allocated per frame: chunks recycle by rewriting their buffers and
// instance matrices; coin data is only created when a new segment comes into view.
import * as THREE from 'three';
import { WORLD, LAUNCH } from './config.js';
import { DECK } from './terrain.js';
import { rng, makePatternPicker, patternCoins, featureCoins } from './coins.js';

const SKY = 0x9fdcff;
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

export function createWorld(scene, stage) {
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, WORLD.fogNear, WORLD.fogFar);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6f9a52, 1.6));
  const sun = new THREE.DirectionalLight(0xfff3d6, 1.8);
  sun.position.set(-40, 80, 30);
  scene.add(sun);

  const L = WORLD.chunkLength;
  const N = WORLD.chunkCount;
  const HALF = WORLD.chunkHalfWidth;
  let terrain = null;

  // Flat grass beyond the chunks' side edges (not under them: ditches and pits go below 0).
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

  // Instanced scenery.
  const inst = (geo, mat, count) => {
    const m = new THREE.InstancedMesh(geo, mat, count);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false; // instances span the whole world
    for (let i = 0; i < count; i++) m.setMatrixAt(i, ZERO);
    scene.add(m);
    return m;
  };
  const TP = WORLD.treesPerChunk, RP = WORLD.rocksPerChunk, CP = WORLD.cloudsPerChunk * 3;
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 1, 6).translate(0, 0.5, 0);
  const trunks = inst(trunkGeo, lam(0x8a5a35), N * TP);
  const cones = inst(new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0), lam(0x2f9e44), N * TP);
  const ballGeo = new THREE.IcosahedronGeometry(1, 0);
  const balls = inst(ballGeo, lam(0x51b848), N * TP);
  const rocks = inst(new THREE.DodecahedronGeometry(1, 0), lam(0x9a9aa5), N * RP);
  const clouds = inst(new THREE.IcosahedronGeometry(1, 0), lam(0xffffff, { emissive: 0x777777 }), N * CP);
  const coinGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.18, 14).rotateX(Math.PI / 2);
  const coinMesh = inst(coinGeo, lam(0xffc61a, { emissive: 0x5a3c00 }), WORLD.coinSlots);

  // Big forest trees (solid trunks) — one set, moved to the current lap.
  const bigTrunks = inst(trunkGeo, lam(0x7a4a28), 24);
  const bigCrowns = inst(ballGeo, lam(0x3a9a3a), 24);

  // Cavern roofs: rock slabs over each tunnel (moved to the current lap).
  const rockMat = lam(0x8d7f6e);
  const shadeMat = new THREE.MeshBasicMaterial({ color: 0x2b2420, side: THREE.DoubleSide, transparent: true, opacity: 0.35, depthWrite: false });
  const roofs = stage.caverns.map((c) => {
    const g = new THREE.Group();
    const h = c.height - c.roof;
    const x0 = c.laneMin - 4, x1 = c.laneMax + 2;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, c.exit - c.mouth), rockMat);
    slab.position.set((x0 + x1) / 2, c.roof + h / 2, -(c.mouth + c.exit) / 2);
    g.add(slab);
    // Dark mouth so the cave reads as a cave.
    const mouth = new THREE.Mesh(new THREE.PlaneGeometry(c.laneMax - c.laneMin, c.roof), shadeMat);
    mouth.position.set((c.laneMin + c.laneMax) / 2, c.roof / 2, -c.mouth - 0.5);
    g.add(mouth);
    if (c.alcove) {
      const a = c.alcove;
      const box = new THREE.Mesh(new THREE.BoxGeometry(a.laneMax - c.laneMax + 2, h, a.to - a.from), rockMat);
      box.position.set((c.laneMax + a.laneMax) / 2 + 1, c.roof + h / 2, -(a.from + a.to) / 2);
      g.add(box);
    }
    scene.add(g);
    return g;
  });
  let lapShown = -1;

  function setInst(mesh, i, x, y, d, sx, sy, sz, ry = 0) {
    _e.set(0, ry, 0);
    _q.setFromEuler(_e);
    _m.compose(_p.set(x, y, -d), _q, _s.set(sx, sy, sz));
    mesh.setMatrixAt(i, _m);
  }

  // Keep small scenery out of the tunnels, the forests and the launch lane.
  function sceneryX(x, d) {
    const dl = terrain.local(d);
    for (const c of stage.caverns) if (dl > c.start - 10 && dl < c.end + 10 && x > -30 && x < -6) return x - 40;
    for (const f of stage.forests) if (dl > f.from - 10 && dl < f.to + 10 && x > 6 && x < 28) return x + 30;
    if (d < 60 && Math.abs(x) < 10) return x + (x < 0 ? -12 : 12);
    return x;
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
        const shade = 0.5 + 0.5 * Math.sin(x * 0.37 + d * 0.23) * Math.cos(d * 0.11);
        if (h > 14) _c.setRGB(0.55 + 0.05 * shade, 0.5 + 0.05 * shade, 0.42);            // rocky tops
        else if (h < -1) _c.setRGB(0.5 + 0.05 * shade, 0.4 + 0.04 * shade, 0.28);          // dirt in ditches/pits
        else _c.setRGB(0.42 + 0.06 * shade + h * 0.012, 0.74 + 0.08 * shade, 0.32 + 0.04 * shade);
        col.setXYZ(i, _c.r, _c.g, _c.b);
        i++;
      }
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;

    const r = rng(k * 7919 + 17);
    for (let t = 0; t < TP; t++) {
      const idx = ch.slot * TP + t;
      const d = d0 + r() * L;
      const x = sceneryX((r() * 2 - 1) * (HALF - 10), d);
      const h = terrain.surfaceAt(x, d, Infinity);
      const s = 0.8 + r() * 0.9;
      const trunkH = 1.2 * s;
      setInst(trunks, idx, x, h, d, s, trunkH, s);
      if (r() < 0.55) {
        setInst(cones, idx, x, h + trunkH, d, 1.5 * s, 3.4 * s, 1.5 * s, r() * 6);
        balls.setMatrixAt(idx, ZERO);
      } else {
        setInst(balls, idx, x, h + trunkH + 1.2 * s, d, 1.5 * s, 1.4 * s, 1.5 * s, r() * 6);
        cones.setMatrixAt(idx, ZERO);
      }
    }
    for (let t = 0; t < RP; t++) {
      const d = d0 + r() * L;
      const x = sceneryX((r() * 2 - 1) * (HALF - 10), d);
      const s = 0.6 + r() * 1.4;
      setInst(rocks, ch.slot * RP + t, x, terrain.surfaceAt(x, d, Infinity), d, s * 1.3, s, s, r() * 6);
    }
    for (let c = 0; c < WORLD.cloudsPerChunk; c++) {
      const side = r() < 0.5 ? -1 : 1;
      const cx = side * (20 + r() * 80);
      const cy = 38 + r() * 35;
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

  function showLap(lap) {
    lapShown = lap;
    const off = lap * terrain.cycle;
    terrain.trunks.forEach((t, i) => {
      const g = terrain.surfaceAt(t.x, t.d, -Infinity);
      const s = t.r / 0.3;
      setInst(bigTrunks, i, t.x, g - 0.5, t.d + off, s, t.h + 2, s);
      const cr = t.hero ? 7 : 5;
      setInst(bigCrowns, i, t.x, g + t.h + cr * 0.6, t.d + off, cr, cr * 0.9, cr, i);
    });
    bigTrunks.instanceMatrix.needsUpdate = true;
    bigCrowns.instanceMatrix.needsUpdate = true;
    roofs.forEach((g) => g.position.set(0, 0, -off));
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
      p.scale.y = top;
      p.position.set(p.userData.px * (DECK.halfWidth - 0.3), top / 2, -(start + 0.5 + p.userData.f * (len - 1)));
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
  let spin = 0;
  function update(planeD, planeX, dt) {
    const first = Math.floor(planeD / L) - 1;
    for (let k = first; k < first + N; k++) {
      const slot = ((k % N) + N) % N;
      if (chunks[slot].index !== k) buildChunk(chunks[slot], k);
    }
    for (const b of bases) b.position.set(b.userData.side * (HALF + 1500), -0.3, -planeD);
    // A lap's features end by ~1,900 m, so switch to the next lap just after that.
    const lap = Math.floor((Math.max(0, planeD) + 50) / terrain.cycle);
    if (lap !== lapShown) showLap(lap);

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

  return { update, newFlight, setBands, setBandLook, setRamp, restPoint, forkD, activeCoins: () => active };
}
