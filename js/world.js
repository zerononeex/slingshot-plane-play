// Streaming world: pooled terrain chunks + instanced trees/rocks/clouds/coins,
// distance flags and the launch site. Nothing is allocated per frame —
// chunks recycle by rewriting existing buffers and instance matrices.
import * as THREE from 'three';
import { WORLD, LAUNCH, COINS } from './config.js';
import { hillsAt, DECK } from './terrain.js';

const SKY = 0x9fdcff;
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();
const _c = new THREE.Color();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

// Small deterministic RNG so a chunk always looks the same.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lam = (color, extra) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });

export function createWorld(scene) {
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, WORLD.fogNear, WORLD.fogFar);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6f9a52, 1.6));
  const sun = new THREE.DirectionalLight(0xfff3d6, 1.8);
  sun.position.set(-40, 80, 30);
  scene.add(sun);

  const L = WORLD.chunkLength;
  const N = WORLD.chunkCount;

  // Endless flat base far below the chunks' edges.
  const base = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), lam(0x7cc95a));
  base.rotation.x = -Math.PI / 2;
  base.position.y = -0.3;
  scene.add(base);

  // Terrain chunks.
  const groundMat = lam(0xffffff, { vertexColors: true });
  const chunks = [];
  for (let i = 0; i < N; i++) {
    const geo = new THREE.PlaneGeometry(WORLD.chunkHalfWidth * 2, L, 20, 8);
    geo.rotateX(-Math.PI / 2);
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
    const mesh = new THREE.Mesh(geo, groundMat);
    scene.add(mesh);
    chunks.push({ slot: i, index: -9999, mesh, coins: [] });
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
  const TP = WORLD.treesPerChunk, RP = WORLD.rocksPerChunk, CP = WORLD.cloudsPerChunk * 3, KP = WORLD.coinsPerChunk;
  const trunks = inst(new THREE.CylinderGeometry(0.25, 0.35, 1, 6).translate(0, 0.5, 0), lam(0x8a5a35), N * TP);
  const cones = inst(new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0), lam(0x2f9e44), N * TP);
  const balls = inst(new THREE.IcosahedronGeometry(1, 0), lam(0x51b848), N * TP);
  const rocks = inst(new THREE.DodecahedronGeometry(1, 0), lam(0x9a9aa5), N * RP);
  const clouds = inst(new THREE.IcosahedronGeometry(1, 0), lam(0xffffff, { emissive: 0x777777 }), N * CP);
  const coinGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.18, 14).rotateX(Math.PI / 2);
  const coinMesh = inst(coinGeo, lam(0xffc61a, { emissive: 0x5a3c00 }), N * KP);

  function setInst(mesh, i, x, y, d, sx, sy, sz, ry = 0) {
    _e.set(0, ry, 0);
    _q.setFromEuler(_e);
    _m.compose(_p.set(x, y, -d), _q, _s.set(sx, sy, sz));
    mesh.setMatrixAt(i, _m);
  }

  function buildChunk(ch, k) {
    ch.index = k;
    const d0 = k * L;
    ch.mesh.position.set(0, 0, -(d0 + L / 2));
    const pos = ch.mesh.geometry.attributes.position;
    const col = ch.mesh.geometry.attributes.color;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const d = d0 + L / 2 - pos.getZ(i);
      const h = hillsAt(x, d);
      pos.setY(i, h);
      const shade = 0.5 + 0.5 * Math.sin(x * 0.37 + d * 0.23) * Math.cos(d * 0.11);
      _c.setRGB(0.42 + 0.06 * shade + h * 0.012, 0.74 + 0.08 * shade, 0.32 + 0.04 * shade);
      col.setXYZ(i, _c.r, _c.g, _c.b);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    ch.mesh.geometry.computeBoundingSphere();

    const r = rng(k * 7919 + 17);
    const near = k <= 0;
    // Trees (cone pines and round trees).
    for (let t = 0; t < TP; t++) {
      const i = ch.slot * TP + t;
      let x = (r() * 2 - 1) * (WORLD.chunkHalfWidth - 10);
      const d = d0 + r() * L;
      if (near && Math.abs(x) < 10) x += x < 0 ? -12 : 12;
      const h = hillsAt(x, d);
      const s = 0.8 + r() * 0.9;
      const trunkH = 1.2 * s;
      setInst(trunks, i, x, h, d, s, trunkH, s);
      if (r() < 0.55) {
        setInst(cones, i, x, h + trunkH, d, 1.5 * s, 3.4 * s, 1.5 * s, r() * 6);
        balls.setMatrixAt(i, ZERO);
      } else {
        setInst(balls, i, x, h + trunkH + 1.2 * s, d, 1.5 * s, 1.4 * s, 1.5 * s, r() * 6);
        cones.setMatrixAt(i, ZERO);
      }
    }
    for (let t = 0; t < RP; t++) {
      let x = (r() * 2 - 1) * (WORLD.chunkHalfWidth - 10);
      const d = d0 + r() * L;
      const s = 0.6 + r() * 1.4;
      if (near && Math.abs(x) < 10) x += 20;
      setInst(rocks, ch.slot * RP + t, x, hillsAt(x, d), d, s * 1.3, s, s, r() * 6);
    }
    for (let c = 0; c < WORLD.cloudsPerChunk; c++) {
      const side = r() < 0.5 ? -1 : 1;
      const cx = side * (20 + r() * 80);
      const cy = 30 + r() * 35;
      const cd = d0 + r() * L;
      const s = 3 + r() * 3;
      for (let p = 0; p < 3; p++) {
        setInst(clouds, ch.slot * CP + c * 3 + p, cx + (p - 1) * s * 1.2, cy + (p === 1 ? s * 0.3 : 0), cd, s * (p === 1 ? 1.3 : 1), s * 0.8, s);
      }
    }
    placeCoins(ch, k, r);
    trunks.instanceMatrix.needsUpdate = true;
    cones.instanceMatrix.needsUpdate = true;
    balls.instanceMatrix.needsUpdate = true;
    rocks.instanceMatrix.needsUpdate = true;
    clouds.instanceMatrix.needsUpdate = true;
  }

  // One coin pattern per chunk: line, arc, slalom or dive.
  function placeCoins(ch, k, r) {
    const d0 = k * L;
    // reuse the coin objects (allocated once per slot)
    if (ch.coins.length === 0) for (let i = 0; i < KP; i++) ch.coins.push({ x: 0, y: 0, d: 0, alive: false });
    for (const c of ch.coins) c.alive = false;
    if (k < 0) return;
    const kind = k === 0 ? 0 : Math.floor(r() * 4);
    const count = KP;
    const startD = k === 0 ? 14 : d0 + 10 + r() * 20;
    const cx = k === 0 ? 0 : (r() * 2 - 1) * 16;
    const cy = k === 0 ? 6 : 6 + r() * 14;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const c = ch.coins[i];
      c.d = startD + i * 5;
      c.x = cx;
      c.y = cy;
      if (kind === 1) c.y = cy + 7 * Math.sin(Math.PI * t);               // arc over a hump
      else if (kind === 2) c.x = Math.max(-20, Math.min(20, cx + 7 * Math.sin(2 * Math.PI * t))); // slalom
      else if (kind === 3) c.y = cy + 10 - 12 * t;                         // dive line
      c.y = Math.max(c.y, hillsAt(c.x, c.d) + 2.5);
      c.alive = true;
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

  // Launch site: wooden deck, ramp posts, slingshot fork, bands.
  const wood = lam(0xb07a45);
  const darkWood = lam(0x7d5230);
  const launch = new THREE.Group();
  const deckLen = DECK.end - DECK.start;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(DECK.halfWidth * 2, 0.3, deckLen), wood);
  deck.position.set(0, LAUNCH.deckHeight - 0.15, -(DECK.start + deckLen / 2));
  launch.add(deck);
  for (const px of [-1, 1]) for (const pd of [DECK.start + 0.5, DECK.end - 0.5, (DECK.start + DECK.end) / 2]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, LAUNCH.deckHeight, 0.35), darkWood);
    post.position.set(px * (DECK.halfWidth - 0.3), LAUNCH.deckHeight / 2, -pd);
    launch.add(post);
  }
  // Fork: two arms leaning out from a stem at the front of the deck.
  const forkD = DECK.end - 0.2;
  const tips = [];
  const arms = [];
  const knobs = [];
  const knobMat = lam(0xff5d5d);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 2.0, 6), darkWood);
    arm.position.set(side * 1.65, LAUNCH.deckHeight + 0.95, -forkD);
    arm.rotation.z = -side * 0.2;
    launch.add(arm);
    arms.push(arm);
    const tip = new THREE.Vector3(side * 1.85, LAUNCH.deckHeight + 1.95, -forkD);
    tips.push(tip);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 4), knobMat);
    knob.position.copy(tip);
    launch.add(knob);
    knobs.push(knob);
  }
  scene.add(launch);

  // Bands: a main pair plus a second, lower pair that appears from level 3.
  const bandMat = lam(0xd23a3a);
  const bandGeo = new THREE.CylinderGeometry(0.07, 0.07, 1, 5).translate(0, 0.5, 0);
  const anchors = [...tips, ...tips.map((t) => t.clone().add(new THREE.Vector3(0, -0.32, 0)))];
  const attachOffsets = [0, 0, -0.12, -0.12];
  const bands = anchors.map(() => {
    const b = new THREE.Mesh(bandGeo, bandMat);
    scene.add(b);
    return b;
  });
  let bandThickness = 1;
  const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.15), lam(0x6b3b1f));
  scene.add(pouch);
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
  // The slingshot evolves with its upgrade level (look numbers live in config SLING).
  function setSlingLook(look) {
    bandMat.color.setHex(look.bandColor);
    bandThickness = look.bandScale;
    bands[2].visible = bands[3].visible = look.doubleBands;
    for (const a of arms) a.scale.set(look.frameScale, 1, look.frameScale);
    for (const k of knobs) k.scale.setScalar(look.frameScale);
    knobMat.color.setHex(look.level >= 4 ? 0xffc61a : 0xff5d5d); // golden knobs with golden bands
  }
  const restPoint = new THREE.Vector3(0, LAUNCH.deckHeight + 1.1, -forkD);

  // --- per-frame ---
  let spin = 0;
  function update(planeD, planeX, dt) {
    const first = Math.floor(planeD / L) - 1;
    for (let k = first; k < first + N; k++) {
      const slot = ((k % N) + N) % N;
      if (chunks[slot].index !== k) buildChunk(chunks[slot], k);
    }
    base.position.set(planeX, -0.3, -planeD);

    // Coins spin.
    spin += dt * 3;
    for (const ch of chunks) {
      for (let i = 0; i < KP; i++) {
        const c = ch.coins[i];
        const idx = ch.slot * KP + i;
        if (!c || !c.alive) coinMesh.setMatrixAt(idx, ZERO);
        else setInst(coinMesh, idx, c.x, c.y, c.d, 1, 1, 1, spin + c.d * 0.2);
      }
    }
    coinMesh.instanceMatrix.needsUpdate = true;

    // Flags for the milestones near the plane.
    const every = WORLD.flagEvery;
    for (let n = Math.max(1, Math.ceil((planeD - 60) / every)); n * every < planeD + WORLD.fogFar; n++) {
      const f = flags[n % 2];
      if (f.n !== n) {
        f.n = n;
        drawFlag(f, n * every);
        f.group.position.set(0, hillsAt(0, n * every) * 0.3, -n * every);
        f.group.visible = true;
      }
    }
  }

  // Collect coins within reach of the plane; returns how many.
  function collectCoins(x, y, d) {
    const r2 = COINS.pickupRadius * COINS.pickupRadius;
    let got = 0;
    for (const ch of chunks) {
      for (const c of ch.coins) {
        if (!c.alive || Math.abs(c.d - d) > COINS.pickupRadius) continue;
        const dx = c.x - x, dy = c.y - y, dd = c.d - d;
        if (dx * dx + dy * dy + dd * dd <= r2) { c.alive = false; got++; }
      }
    }
    return got;
  }

  // Fresh run: rebuild everything so collected coins come back.
  function reset() {
    for (const ch of chunks) ch.index = -9999;
    for (const f of flags) { f.n = -1; f.group.visible = false; }
    update(0, 0, 0);
  }

  return { update, collectCoins, reset, setBands, setSlingLook, restPoint, forkD };
}
