// v0.9 STAGE GOALS look (v1.0: 20 gates): the numbered GOAL GATES (thick violet rings with a bold number disc
// on top; green + ✓ and ghosted once collected) and the golden GOAL arch (double-width ring with
// a checker trim and a GOAL disc — absent until all the world's gates (20; v1.1: 30 in Space + Jetstream) are flown, or the world is already complete). Visually nothing like
// the DIVE skill's dive gates (posts + a low banner) or the loop rings (thin, in a vertical circle).
// Canvas textures are drawn once at load; each world builds its meshes once; no per-frame allocation.
import * as THREE from 'three';
import { MAX_GATES } from './goals.js';

const VIOLET = 0x8a4dff, GREEN = 0x3ccf5a, GOLD = 0xffc61a;

function discTexture(label, bg, edge, fg = '#ffffff', font = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2);
  g.fillStyle = bg; g.fill();
  g.lineWidth = 9; g.strokeStyle = edge; g.stroke();
  g.fillStyle = fg;
  g.font = `italic 900 ${font}px system-ui, -apple-system, "Segoe UI", Arial, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 6; g.strokeStyle = 'rgba(20, 14, 50, 0.6)'; g.strokeText(label, 64, 68);
  g.fillText(label, 64, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function checkerTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 8;
  const g = c.getContext('2d');
  for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#1b2438'; g.fillRect(i * 8, 0, 8, 8); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.repeat.set(4, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createGoalView(scene) {
  const nums = Array.from({ length: MAX_GATES }, (_, i) => discTexture(String(i + 1), '#7a3df0', '#ffd23f', '#ffffff', i >= 9 ? 56 : 66)); // v1.1: up to 30 gates
  const check = discTexture('✓', '#2fae4c', '#e8ffe9', '#ffffff', 72);
  const goalTex = discTexture('GOAL', '#ffb800', '#ffffff', '#1b2438', 36);

  const root = new THREE.Group();
  scene.add(root);
  const ringGeo = new THREE.TorusGeometry(1, 0.13, 10, 56);
  const glowGeo = new THREE.TorusGeometry(0.86, 0.035, 6, 56);
  const openMat = new THREE.MeshLambertMaterial({ color: VIOLET, emissive: 0x3a1680 });
  const doneMat = new THREE.MeshLambertMaterial({ color: GREEN, emissive: 0x145c25, transparent: true, opacity: 0.5, depthWrite: false });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xe9ddff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });

  const gates = Array.from({ length: MAX_GATES }, () => {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(ringGeo, openMat);
    const glow = new THREE.Mesh(glowGeo, glowMat);
    const mat = new THREE.SpriteMaterial({ map: nums[0], transparent: true, depthWrite: false });
    const disc = new THREE.Sprite(mat);
    g.add(ring, glow, disc);
    g.visible = false;
    root.add(g);
    return { g, ring, glow, disc, mat, n: 0, size: 1 };
  });

  // THE GOAL: a double-width golden ring, a checker trim, a white inner glow and the GOAL disc.
  const goal = new THREE.Group();
  const goalRing = new THREE.Mesh(new THREE.TorusGeometry(1, 0.26, 12, 72), new THREE.MeshLambertMaterial({ color: GOLD, emissive: 0x7a4a00 }));
  const trim = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.27, 4, 72, Math.PI * 2), new THREE.MeshBasicMaterial({ map: checkerTexture(), transparent: true, opacity: 0.9 }));
  trim.scale.set(1, 1, 0.35);
  const goalGlow = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.05, 6, 72), new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  const goalDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: goalTex, transparent: true, depthWrite: false }));
  goal.add(goalRing, trim, goalGlow, goalDisc);
  goal.visible = false;
  root.add(goal);
  let goalOn = false, pop = 0;

  function look(o, collected) {
    o.ring.material = collected ? doneMat : openMat;
    o.glow.visible = !collected;
    o.mat.map = collected ? check : nums[o.n - 1];
    o.mat.opacity = collected ? 0.7 : 1;
    o.mat.needsUpdate = true;
  }

  return {
    // goals = goalsFor(world) (or null), ys = the gates' centre heights, goalY = the goal's, owned = Set of collected numbers.
    build(goals, ys, goalY, owned, open) {
      for (const o of gates) o.g.visible = false;
      goal.visible = goalOn = false;
      if (!goals) return;
      goals.gates.forEach((gt, i) => {
        const o = gates[i];
        o.n = gt.n; o.size = gt.size;
        o.g.position.set(gt.x, ys[i], -gt.at);
        o.ring.scale.setScalar(gt.size);
        o.glow.scale.setScalar(gt.size);
        const k = Math.min(1.7, Math.max(0.8, gt.size / 5.5));
        o.disc.position.set(0, gt.size + 2.1 * k, 0);
        o.disc.scale.setScalar(3.6 * k);
        look(o, owned.has(gt.n));
        o.g.visible = true;
      });
      const gl = goals.goal;
      goal.position.set(gl.x, goalY, -gl.at);
      for (const m of [goalRing, trim, goalGlow]) m.scale.set(gl.size, gl.size, m === trim ? gl.size * 0.35 : gl.size);
      goalDisc.position.set(0, gl.size + 3.2, 0);
      goalDisc.scale.setScalar(5.5 * Math.max(1, gl.size / 9));
      this.showGoal(open, false);
    },
    setCollected(n) { const o = gates.find((g) => g.n === n && g.g.visible); if (o) look(o, true); },
    showGoal(on, burst = true) { goal.visible = goalOn = on; pop = on && burst ? 1 : 0; },
    goalPos(out) { return out.copy(goal.position); },
    update(dt, t) {
      glowMat.opacity = 0.6 + 0.3 * Math.sin(t * 4);
      if (!goalOn) return;
      pop = Math.max(0, pop - dt * 1.4);
      goal.scale.setScalar(1 + 0.35 * Math.sin(pop * Math.PI)); // the appear "pop"
      trim.rotation.z = t * 0.4;
      goalGlow.material.opacity = 0.65 + 0.3 * Math.sin(t * 5);
    },
  };
}
