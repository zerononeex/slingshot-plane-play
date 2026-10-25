// v1.6 STAR FOX's own looks (megaview.js calls it; everything else is the shared mega look):
//   · THE DROP + the underwater sector: the splash gates, a curtain of falling water, the surface seen from
//     below (down-facing only), light shafts, drifting jellyfish glow and three gentle whale shapes
//   · the DESCENT transitions: a cloud layer to drop through and re-entry glow streaks
//   · THE FORTRESS GATES (the goal's outer gate) and THE GUARDIAN HEAD — seen from 2,000 m out, growing
//     (drawn at a fixed far range and scaled by the true distance until it is really in view)
//   · the stage's own spectacle moments (a rainbow, the warp rings, a comet, the great whale, the flagship,
//     the sand critter, the eclipse)
// Built once per world; per frame only what is near the plane is placed. No per-frame allocation.
import * as THREE from 'three';
import { merged, cyl, cone, box, ico } from './meshkit.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const basic = (color, extra) => new THREE.MeshBasicMaterial({ color, ...extra });
const glowMat = (color, opacity) => basic(color, { transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const VC = () => new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
const FAR = 470; // the far range a distant landmark is drawn at (inside the camera's far plane)

export function createSFLayer({ keepM, scene, fx, terrain, run, sheetMats }) {
  const inst = (geo, mat, n) => {
    const m = new THREE.InstancedMesh(geo, mat, n);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.count = 0;
    return keepM(m);
  };
  const setI = (mesh, i, x, y, d, sx, sy, sz, ry = 0, rx = 0, rz = 0) => {
    _q.setFromEuler(_e.set(rx, ry, rz));
    _m.compose(_p.set(x, y, -d), _q, _s.set(sx, sy, sz));
    mesh.setMatrixAt(i, _m);
  };
  const ground = (x, d) => terrain.surfaceAt(x, d, Infinity);

  // ── THE DROP and the underwater sector ──
  const W = run.water ?? [];
  const waterGs = W.map((w) => {
    const g = new THREE.Group(), L = w.d1 - w.d0;
    // the surface from below: a rippling cyan sheet facing DOWN (the camera above never sees it)
    const surf = new THREE.Mesh(new THREE.PlaneGeometry(320, L).rotateX(Math.PI / 2), basic(0x7fd8f0, { transparent: true, opacity: 0.45, depthWrite: false }));
    surf.position.set(0, w.surface, -(w.d0 + L / 2)); g.add(surf);
    // THE DROP: the splash gates (three rings) and the curtain of water the flight dives through
    for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(18 - i * 2, 0.8, 6, 28), glowMat(0xd8f6ff, 0.8)); r.position.set(0, 30, -(w.d0 - 60 + i * 25)); g.add(r); }
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(80, w.surface + 6), sheetMats.water); curtain.position.set(0, (w.surface + 6) / 2, -(w.d0 + 2)); g.add(curtain);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(30, 4), glowMat(0xffffff, 0.0)); sign.visible = false; g.add(sign);
    g.visible = false;
    return keepM(g);
  });
  const SHAFTS = 14;
  const shafts = inst(new THREE.PlaneGeometry(6, 70).translate(0, -35, 0), glowMat(0xbff0ff, 0.12), SHAFTS);
  const jelly = inst(merged([[new THREE.SphereGeometry(1.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0xffffff, [0, 0, 0]], ...[0, 1, 2, 3].map((i) => [box(0.08, 2.4, 0.08), 0xffffff, [Math.cos(i * 1.57) * 0.7, -1.2, Math.sin(i * 1.57) * 0.7]])]), glowMat(0xe8a0ff, 0.6), 24);
  const whaleGeo = merged([[new THREE.SphereGeometry(6, 14, 10), 0x2a4a6a, [0, 0, 0], [0, 0, 0], [1, 0.8, 3.2]], [cone(4.2, 9, 8), 0x2a4a6a, [0, 0, 22], [Math.PI / 2, 0, 0], [1, 0.4, 1]], [box(14, 0.6, 5), 0x2a4a6a, [0, 0, 28]],
    [box(9, 0.6, 4), 0x2a4a6a, [0, -2, -4], [0, 0, 0.4]], [new THREE.SphereGeometry(5.6, 12, 8), 0xb8d0e0, [0, -1.6, -3], [0, 0, 0], [0.9, 0.5, 2.6]]]);
  const whales = inst(whaleGeo, VC(), 4);

  // ── the DESCENT transitions: a cloud layer + re-entry glow streaks ──
  const T = run.transitions ?? [];
  const PUFFS = 60, STREAKS = 24;
  const puffs = inst(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x888888, transparent: true, opacity: 0.7, depthWrite: false }), PUFFS);
  const streaks = inst(box(0.18, 0.18, 1), glowMat(0xff9a3a, 0.7), STREAKS);

  // ── THE FORTRESS GATES (around the goal) and THE GUARDIAN HEAD ──
  const F = run.fortress;
  let gatesG = null, head = null, headEyes = null;
  if (F) {
    const parts = [], P = (geo, c, x, y, d, rot, sc) => parts.push([geo, c, [x, y, -d], rot, sc]);
    for (const sx of [-1, 1]) {
      P(cyl(9, 12, 96, 8), 0x3a2a30, sx * 46, 48, F.gates); P(cone(11, 26, 8), 0x2a1e24, sx * 46, 109, F.gates); P(new THREE.SphereGeometry(2, 8, 6), 0xff3a3a, sx * 46, 124, F.gates);
      P(box(40, 50, 8), 0x3a2a30, sx * 72, 25, F.gates); for (let i = 0; i < 5; i++) P(cone(2.4, 8, 4), 0x2a1e24, sx * (56 + i * 8), 54, F.gates);
      for (const y of [20, 44, 68]) P(box(2.4, 2.4, 0.6), 0xff3a3a, sx * 38, y, F.gates - 9);
    }
    P(box(110, 14, 10), 0x2a1e24, 0, 71, F.gates); P(box(112, 1.6, 11), 0xff3a3a, 0, 64.6, F.gates);
    gatesG = new THREE.Group(); gatesG.add(new THREE.Mesh(merged(parts), VC())); gatesG.visible = false; keepM(gatesG);
    // the head (≈ 70 m tall): a horned helm over a stern face, glowing eyes, a jaw of armour plates
    const H = merged([[new THREE.SphereGeometry(30, 18, 14), 0x5a3a4a, [0, 40, 0], [0, 0, 0], [1, 1.15, 0.9]], [new THREE.SphereGeometry(31, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.4), 0x3a2a30, [0, 46, 0], [0, 0, 0], [1, 1.1, 0.95]],
      ...[-1, 1].map((sx) => [cone(5, 34, 6), 0x2a1e24, [sx * 30, 74, 0], [0, 0, -sx * 0.6]]), [box(40, 10, 8), 0x2a1e24, [0, 14, 24]], [box(10, 22, 8), 0x6a4a5a, [0, 34, 27]],
      ...[-1, 1].map((sx) => [box(12, 5, 4), 0x1a1016, [sx * 12, 46, 27]]), [cyl(22, 28, 20, 10), 0x3a2a30, [0, 4, 0]]]);
    head = new THREE.Mesh(H, VC()); head.visible = false; keepM(head);
    headEyes = new THREE.Group();
    for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(3.4, 10, 8), glowMat(0xff3a2a, 0.95)); e.position.set(sx * 12, 46, 29); headEyes.add(e); }
    head.add(headEyes);
  }

  // ── the spectacle props ──
  const rainbow = keepM(new THREE.Group());
  [0xff4f4f, 0xffa23f, 0xffe14d, 0x5fe06a, 0x4fb0ff, 0xb06aff].forEach((c, i) => rainbow.add(new THREE.Mesh(new THREE.TorusGeometry(110 - i * 4, 2, 6, 48, Math.PI), glowMat(c, 0.55))));
  rainbow.visible = false;
  const warpRings = inst(new THREE.TorusGeometry(16, 1, 6, 32), glowMat(0x5fd8ff, 0.8), 6);
  const comet = keepM(new THREE.Group());
  comet.add(new THREE.Mesh(ico(6, 1), basic(0xe8f6ff)));
  const tail = new THREE.Mesh(new THREE.ConeGeometry(7, 90, 12, 1, true).rotateZ(Math.PI / 2).translate(48, 0, 0), glowMat(0x9fd8ff, 0.35)); comet.add(tail);
  comet.visible = false;
  const bigWhale = new THREE.Mesh(whaleGeo, VC()); bigWhale.visible = false; keepM(bigWhale);
  const flagship = new THREE.Mesh(merged([[box(60, 34, 420), 0x6a707c, [0, 0, 0]], [box(110, 6, 180), 0x4a505c, [0, -8, -60]], ...[-150, -60, 30, 120].map((z) => [box(30, 26, 40), 0x8a92a0, [0, 28, z]]),
    [cyl(20, 26, 40, 12), 0x4a505c, [0, 0, -220], [Math.PI / 2, 0, 0]], [cyl(16, 16, 2, 12), 0x5fd8ff, [0, 0, -241], [Math.PI / 2, 0, 0]], ...Array.from({ length: 12 }, (_, i) => [box(2, 2, 2), 0xffe14d, [31, 6, -180 + i * 32]])]), VC());
  flagship.visible = false; keepM(flagship);
  const worm = inst(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshLambertMaterial({ color: 0xb08a5a, flatShading: true }), 14);
  const eclipse = keepM(new THREE.Group());
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(60, 32), basic(0xfff2c0, { fog: false })); eclipse.add(sunDisc);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(58, 32), basic(0x050308, { fog: false })); moon.position.z = 1; eclipse.add(moon);
  const corona = new THREE.Mesh(new THREE.RingGeometry(60, 92, 40), glowMat(0xffd27a, 0.5)); eclipse.add(corona);
  eclipse.visible = false;
  // the eclipse's palette dip: a dark veil around the camera (drawn last, over everything)
  const veil = new THREE.Mesh(new THREE.SphereGeometry(30, 16, 10), basic(0x05030a, { transparent: true, opacity: 0, side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false }));
  veil.renderOrder = 999; veil.visible = false; keepM(veil); // positioned at the camera
  let clock = 0, specOn = 0;

  function update(planeD, t, dt, camPos) {
    clock += dt;
    const lo = planeD - 80, hi = planeD + 760;
    // under water: the surface, shafts of light, drifting jellies, whales gliding along the sides
    let ns = 0, nj = 0, nw = 0;
    W.forEach((w, i) => {
      const on = w.d1 > lo && w.d0 - 300 < hi;
      waterGs[i].visible = on;
      if (!on || planeD < w.d0 - 120 || planeD > w.d1 + 40) return;
      for (let k = 0; k < SHAFTS; k++) { const d = planeD + 30 + ((k * 53 + clock * 6) % 520), x = Math.sin(k * 7.3) * 60; if (d > w.d0 && d < w.d1) setI(shafts, ns++, x, w.surface, d, 1 + (k % 3) * 0.6, 1, 1, k * 0.7, 0.25 * Math.sin(k), 0); }
      for (let k = 0; k < 24; k++) { const d = planeD + 20 + ((k * 37) % 480) - ((clock * 2) % 37), x = ((k * 29) % 2 ? 1 : -1) * (30 + (k * 13) % 60); if (d > w.d0 && d < w.d1) setI(jelly, nj++, x, 12 + (k * 7) % 36 + Math.sin(clock * 1.3 + k) * 2, d, 1 + (k % 3) * 0.4, 1 + 0.15 * Math.sin(clock * 2 + k), 1, 0); }
      for (let k = 0; k < 3; k++) { const x = (k % 2 ? 1 : -1) * (80 + k * 25), d = planeD + 120 + k * 160 - ((clock * 4 + k * 50) % 200); if (d > w.d0 && d < w.d1) setI(whales, nw++, x, 20 + k * 10, d, 1.4, 1.4, 1.4, Math.PI + Math.sin(clock * 0.2 + k) * 0.1, 0, Math.sin(clock * 0.5 + k) * 0.08); }
      if (fx && planeD > w.d0 - 8 && planeD < w.d0 + 30 && Math.random() < 0.5) fx.splash((Math.random() - 0.5) * 30, 2 + Math.random() * 40, -(w.d0 + 2), true);
    });
    shafts.count = ns; jelly.count = nj; whales.count = nw;
    shafts.instanceMatrix.needsUpdate = jelly.instanceMatrix.needsUpdate = whales.instanceMatrix.needsUpdate = true;
    // a DESCENT: drop through the cloud layer; the re-entry glow streaks past (its first half)
    let np = 0, nst = 0;
    for (const tr of T) {
      if (tr.kind !== 'descent' || planeD < tr.d0 - 200 || planeD > tr.d1) continue;
      for (let k = 0; k < PUFFS; k++) {
        const d = tr.d - 120 + ((k * 61) % 520), x = Math.sin(k * 3.7) * 110, y = 18 + (k * 17) % 40, s = 6 + (k % 5) * 3;
        if (d > lo && d < hi) setI(puffs, np++, x, y, d, s, s * 0.45, s * 1.3, k);
      }
      if (planeD < tr.d && camPos) for (let k = 0; k < STREAKS; k++) {
        const z = -camPos.z + 40 + ((k * 23 + clock * 400) % 240), x = camPos.x + Math.sin(k * 5.1) * 26, y = camPos.y + 8 + Math.cos(k * 3.3) * 14;
        setI(streaks, nst++, x, y, z, 1, 1, 14 + (k % 4) * 6, 0, -0.35, 0);
      }
    }
    puffs.count = np; streaks.count = nst; puffs.instanceMatrix.needsUpdate = streaks.instanceMatrix.needsUpdate = true;
    // THE FORTRESS GATES; THE GUARDIAN HEAD from 2,000 m out (at a fixed far range, scaled by the true distance)
    if (F) {
      gatesG.visible = F.gates + 40 > lo && F.gates - 300 < hi;
      const hd = F.head, dist = hd.d - planeD;
      head.visible = dist > -60 && dist < hd.from;
      if (head.visible) {
        const k = dist > FAR ? FAR / dist : 1, dd = dist > FAR ? planeD + FAR : hd.d;
        head.position.set(hd.x * k, ground(hd.x, hd.d) * k, -dd); head.scale.setScalar(k);
        head.rotation.y = Math.atan2(-hd.x, 60) * 0.6;
        for (const e of headEyes.children) e.scale.setScalar(0.9 + 0.25 * Math.sin(clock * 6));
      }
    }
    // the eclipse veil rides with the camera
    if (veil.visible && camPos) veil.position.copy(camPos);
    if (!specOn) { rainbow.visible = comet.visible = bigWhale.visible = flagship.visible = eclipse.visible = veil.visible = false; warpRings.count = worm.count = 0; }
    specOn = 0;
  }

  // A spectacle of this stage's own (u: 0 → 1 as the plane closes in); false if not one of ours.
  function spectacle(sp, u, dt, planeD, camPos) {
    const side = sp.side;
    switch (sp.kind) {
      case 'rainbow': { specOn = 1; rainbow.visible = true; rainbow.position.set(side * 60, ground(side * 60, sp.d + 300) - 10, -(sp.d + 300)); rainbow.rotation.y = side * 0.3; for (const r of rainbow.children) r.material.opacity = 0.55 * Math.sin(u * Math.PI); return true; }
      case 'warpRing': { specOn = 1; let n = 0; for (let i = 0; i < 6; i++) { const d = sp.d - 300 + i * 120; setI(warpRings, n++, Math.sin(i * 1.3) * 6, 44 + Math.cos(i) * 4, d, 1 + 0.05 * Math.sin(clock * 5 + i), 1 + 0.05 * Math.sin(clock * 5 + i), 1, 0, 0, clock + i); } warpRings.count = n; warpRings.instanceMatrix.needsUpdate = true; return true; }
      case 'comet': { specOn = 1; comet.visible = true; comet.position.set(side * (-260 + 520 * u), 150 - 40 * u, -(sp.d + 260)); comet.rotation.z = side > 0 ? Math.PI : 0; return true; }
      case 'whale': { specOn = 1; bigWhale.visible = true; bigWhale.position.set(side * (140 - 120 * u), 24 + 8 * Math.sin(u * Math.PI), -(sp.d + 120)); bigWhale.scale.setScalar(3.2); bigWhale.rotation.set(0, side * Math.PI / 2, Math.sin(clock * 0.6) * 0.06); return true; }
      case 'flagship': { specOn = 1; flagship.visible = true; flagship.position.set(side * (-420 + 840 * u), 120, -(sp.d + 380)); flagship.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; return true; }
      case 'sandworm': { // the sand critter's back arcs out of the dunes beside the line, and down again
        specOn = 1; let n = 0;
        for (let i = 0; i < 14; i++) { const a = u * Math.PI * 1.4 - i * 0.12, x = side * 110, d = sp.d - 160 + i * 14, y = ground(x, d) + Math.sin(a) * 36 - 6, r = 7 - i * 0.3; if (Math.sin(a) > -0.2) setI(worm, n++, x, y, d, r, r, r * 1.3); }
        worm.count = n; worm.instanceMatrix.needsUpdate = true;
        if (fx && Math.random() < dt * 10) fx.dust(side * 110, ground(side * 110, sp.d) + 2, -(sp.d - 100 + Math.random() * 200), 0xe8c890, 8, 3);
        return true;
      }
      case 'eclipse': { // the moon slides over the sun; the world dims for a breath
        specOn = 1; eclipse.visible = true; veil.visible = true;
        const k = Math.sin(u * Math.PI);
        if (camPos) { eclipse.position.set(camPos.x - 120, camPos.y + 220, camPos.z - 360); eclipse.lookAt(camPos.x, camPos.y, camPos.z); }
        moon.position.x = (0.5 - u) * 150; corona.material.opacity = 0.6 * Math.max(0, k - 0.6) / 0.4;
        veil.material.opacity = 0.42 * Math.max(0, (k - 0.5) / 0.5);
        return true;
      }
      default: return false;
    }
  }
  return { update, spectacle };
}
