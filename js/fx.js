// Cheap pooled sprite effects: crash flames + smoke, boost exhaust puffs,
// magnet sparks/sparkles and the secret sparkle burst. Every sprite and material
// is created once up front; nothing is allocated per frame.
import * as THREE from 'three';

function softDot() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.8)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createFx(scene) {
  const tex = softDot();
  const pool = [];
  for (let i = 0; i < 72; i++) {
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: true });
    const s = new THREE.Sprite(mat);
    s.visible = false;
    scene.add(s);
    pool.push({ s, mat, life: 0, max: 1, vx: 0, vy: 0, vz: 0, grow: 0, size: 1, flicker: false, color: new THREE.Color() });
  }
  let cursor = 0;

  function spawn(x, y, z, { color, size = 1, life = 1, vx = 0, vy = 0, vz = 0, grow = 0, flicker = false, opacity = 1 }) {
    const p = pool[cursor];
    cursor = (cursor + 1) % pool.length;
    p.s.position.set(x, y, z);
    p.mat.color.setHex(color);
    p.color.setHex(color);
    p.mat.opacity = opacity;
    p.base = opacity;
    p.size = size;
    p.s.scale.setScalar(size);
    p.life = p.max = life;
    p.vx = vx; p.vy = vy; p.vz = vz;
    p.grow = grow;
    p.flicker = flicker;
    p.s.visible = true;
  }

  const r = Math.random;
  const api = {
    flame(x, y, z) {
      spawn(x + (r() - 0.5) * 0.6, y + r() * 0.3, z + (r() - 0.5) * 0.6, {
        color: r() < 0.5 ? 0xff8a1f : 0xffd23f, size: 0.9 + r() * 0.6, life: 0.4 + r() * 0.25, vy: 1.8 + r(), grow: 0.4, flicker: true,
      });
    },
    smoke(x, y, z, thin = 1) {
      spawn(x + (r() - 0.5) * 0.8, y + 0.4, z + (r() - 0.5) * 0.8, {
        color: 0x8c8c8c, size: 0.6 + r() * 0.4, life: 1.6 + r(), vy: 1.6 + r() * 0.8, vx: (r() - 0.5) * 0.6, grow: 1.1, opacity: 0.55 * thin,
      });
    },
    puff(x, y, z) {
      spawn(x + (r() - 0.5) * 0.2, y + (r() - 0.5) * 0.2, z, { color: 0xdedede, size: 0.35, life: 0.45, vz: 6, grow: 1.6, opacity: 0.8 });
    },
    spark(x, y, z, color = 0xfff3b0) {
      spawn(x, y, z, { color, size: 0.35, life: 0.18, grow: -1, flicker: true });
    },
    splash(x, y, z, big = false) {
      const n = big ? 26 : 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const sp = (big ? 7 : 4) * (0.6 + r() * 0.6);
        spawn(x, y + 0.2, z, { color: i % 3 ? 0xffffff : 0x9fd8ff, size: big ? 0.9 : 0.6, life: 0.7, vx: Math.cos(a) * sp, vy: 3 + r() * (big ? 7 : 4), vz: Math.sin(a) * sp, grow: 0.6, opacity: 0.9 });
      }
    },
    sparkleBurst(x, y, z) {
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        spawn(x, y, z, { color: i % 2 ? 0xffe14d : 0xffffff, size: 0.5, life: 0.9, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6, vz: (r() - 0.5) * 4, grow: -0.4, flicker: true });
      }
    },
    update(dt) {
      for (const p of pool) {
        if (!p.s.visible) continue;
        p.life -= dt;
        if (p.life <= 0) { p.s.visible = false; continue; }
        p.s.position.x += p.vx * dt;
        p.s.position.y += p.vy * dt;
        p.s.position.z += p.vz * dt;
        p.size = Math.max(0.05, p.size + p.grow * dt);
        const k = p.life / p.max;
        p.s.scale.setScalar(p.flicker ? p.size * (0.8 + Math.random() * 0.4) : p.size);
        p.mat.opacity = p.base * Math.min(1, k * 1.5);
      }
    },
    clear() { for (const p of pool) p.s.visible = false; },
  };
  return api;
}
