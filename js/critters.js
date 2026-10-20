// The bumpable cast as little low-poly figures + their set-pieces (v0.6 part 2).
// Built once per stage switch; a set-piece only rewrites transforms (no allocation per frame).
// Every character ends up fine: parachutes open, birds fly on, penguins slide away honking.
import * as THREE from 'three';

const lam = (color, extra) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
const MATS = new Map();
const mat = (c) => { if (!MATS.has(c)) MATS.set(c, lam(c)); return MATS.get(c); };
function mesh(geo, color, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(geo, mat(color));
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}
const ball = (r, c, x, y, z, sx = 1, sy = 1, sz = 1) => mesh(new THREE.IcosahedronGeometry(r, 1), c, x, y, z, sx, sy, sz);
const box = (w, h, d, c, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), c, x, y, z);
const cone = (r, h, c, x, y, z) => mesh(new THREE.ConeGeometry(r, h, 8), c, x, y, z);

// A tiny person (for pilots, gliders, astronauts, skydivers).
function person(suit = 0x2f7fe0, head = 0xffd9b8) {
  const g = new THREE.Group();
  g.add(box(0.5, 0.7, 0.35, suit, 0, 0, 0));
  g.add(ball(0.22, head, 0, 0.55, 0));
  g.add(box(0.15, 0.5, 0.15, suit, -0.35, 0.1, 0));
  g.add(box(0.15, 0.5, 0.15, suit, 0.35, 0.1, 0));
  return g;
}
// A little parachute that opens during a set-piece (hidden until then).
function chute(color = 0xff5d5d) {
  const c = new THREE.Group();
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), lam(color, { side: THREE.DoubleSide }));
  canopy.position.y = 1.6;
  c.add(canopy);
  for (const sx of [-0.8, 0.8]) c.add(box(0.03, 1.5, 0.03, 0xffffff, sx * 0.6, 0.9, 0));
  c.visible = false;
  return c;
}
function bird(body, wing, beak = 0xffb020, s = 1) {
  const g = new THREE.Group();
  g.add(ball(0.5 * s, body, 0, 0, 0, 1, 0.8, 1.4));
  g.add(ball(0.28 * s, body, 0, 0.25 * s, -0.6 * s));
  g.add(cone(0.1 * s, 0.35 * s, beak, 0, 0.22 * s, -0.95 * s).rotateX(-Math.PI / 2));
  const wl = box(1.2 * s, 0.08, 0.5 * s, wing, -0.75 * s, 0.1, 0), wr = box(1.2 * s, 0.08, 0.5 * s, wing, 0.75 * s, 0.1, 0);
  g.add(wl, wr);
  g.userData.wings = [wl, wr];
  return g;
}
function flock(n, body, wing, spread = 2) {
  const g = new THREE.Group();
  g.userData.members = [];
  for (let i = 0; i < n; i++) {
    const b = bird(body, wing, 0xffb020, 0.6);
    b.position.set(Math.cos(i * 2.4) * spread, Math.sin(i * 1.7) * spread * 0.4, Math.sin(i * 2.4) * spread * 0.6);
    g.add(b);
    g.userData.members.push(b);
  }
  return g;
}
function balloon(color, r = 1.2) {
  const g = new THREE.Group();
  g.add(ball(r, color, 0, 0, 0, 1, 1.2, 1));
  g.add(box(0.02, 1.6, 0.02, 0xffffff, 0, -r * 1.2 - 0.8, 0));
  return g;
}

// type → { group, parts } (parts the set-piece moves).
export function buildCritter(type) {
  const g = new THREE.Group();
  const parts = {};
  switch (type) {
    case 'goose': case 'highGoose': g.add(parts.body = bird(0xf4f4f4, 0xdedede)); break;
    case 'vulture': g.add(parts.body = bird(0x3b2a22, 0x2a1d17, 0xe8c48a, 1.2)); break;
    case 'snowyOwl': g.add(parts.body = bird(0xffffff, 0xeef4fb, 0x333333, 1)); break;
    case 'hotAirBalloon': case 'weatherBalloon': case 'beachBalloon': {
      const big = type !== 'beachBalloon';
      parts.bag = ball(big ? 2.4 : 1.6, type === 'weatherBalloon' ? 0xf4f4f4 : type === 'beachBalloon' ? 0x19c3c3 : 0xff5d5d, 0, 0.8, 0, 1, 1.15, 1);
      g.add(parts.bag);
      if (big) { parts.stripe = ball(2.45, 0xffd23f, 0, 0.8, 0, 1, 0.35, 1); g.add(parts.stripe); }
      parts.rider = new THREE.Group();
      parts.rider.add(type === 'weatherBalloon' ? box(0.6, 0.5, 0.6, 0x8a94a6, 0, 0, 0) : type === 'beachBalloon' ? box(0.5, 0.4, 0.5, 0xffd23f, 0, 0, 0) : person(0x7a4ad1));
      parts.rider.add(parts.chute = chute(type === 'weatherBalloon' ? 0xff8a3d : 0x3ccf5a));
      parts.rider.position.y = big ? -2.4 : -2;
      if (type === 'hotAirBalloon') parts.rider.add(box(1, 0.6, 1, 0x8a5a35, 0, -0.6, 0)); // the basket
      g.add(parts.rider);
      break;
    }
    case 'scarecrow': case 'snowman': {
      const snow = type === 'snowman';
      g.add(parts.body = snow ? ball(0.9, 0xffffff, 0, -0.6, 0) : box(0.9, 1.2, 0.4, 0x8a5a35, 0, -0.3, 0));
      if (!snow) g.add(box(2.2, 0.15, 0.15, 0x6b4423, 0, 0, 0));
      parts.head = snow ? ball(0.6, 0xffffff, 0, 0.55, 0) : ball(0.55, 0xff8a1f, 0, 0.6, 0);
      if (snow) { parts.head.add(cone(0.1, 0.5, 0xff8a1f, 0, 0, -0.6).rotateX(-Math.PI / 2)); g.add(parts.scarf = box(1.1, 0.2, 0.9, 0xe8262c, 0, 0.05, 0)); }
      else parts.head.add(cone(0.6, 0.6, 0xd9b77a, 0, 0.55, 0));
      g.add(parts.head);
      break;
    }
    case 'kite': {
      parts.body = new THREE.Group();
      const k = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 0), lam(0xff4fa3));
      k.scale.set(1, 1.4, 0.15);
      parts.body.add(k);
      parts.body.add(box(0.04, 3, 0.04, 0xffffff, 0, -2.4, 0));
      g.add(parts.body);
      break;
    }
    case 'hangGlider': case 'parasail': case 'skydiver': case 'astronaut': {
      parts.rider = person(type === 'astronaut' ? 0xf4f4f4 : type === 'skydiver' ? 0xff5d2e : 0x2f7fe0, type === 'astronaut' ? 0x9fe6ff : 0xffd9b8);
      g.add(parts.rider);
      if (type === 'hangGlider') { parts.wing = cone(2.4, 0.3, 0x3ccf5a, 0, 1, 0); parts.wing.scale.set(1, 1, 0.5); g.add(parts.wing); }
      if (type === 'parasail') { parts.wing = new THREE.Mesh(new THREE.SphereGeometry(2, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2.5), lam(0xffd23f, { side: THREE.DoubleSide })); parts.wing.position.y = 2.5; g.add(parts.wing); }
      parts.rider.add(parts.chute = chute(type === 'astronaut' ? 0x7a4ad1 : 0xff5d5d));
      break;
    }
    case 'caveBats': g.add(parts.flock = flock(6, 0x2b2420, 0x1d1714, 1.6)); break;
    case 'pigeonFlock': g.add(parts.flock = flock(5, 0x8a94a6, 0x6b7380, 1.8)); break;
    case 'seagullFlock': g.add(parts.flock = flock(5, 0xffffff, 0xb8c2cc, 2)); break;
    case 'balloonBunch': {
      parts.balloons = [0xe8262c, 0xffd23f, 0x2f7fe0].map((c, i) => { const b = balloon(c, 0.8); b.position.set((i - 1) * 1.1, Math.abs(i - 1) * -0.3, 0); g.add(b); return b; });
      break;
    }
    case 'drone': {
      parts.body = new THREE.Group();
      parts.body.add(box(1, 0.3, 1, 0x333344, 0, 0, 0));
      for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) parts.body.add(box(0.6, 0.04, 0.12, 0xdddddd, x, 0.2, z));
      g.add(parts.body);
      parts.pack = box(0.6, 0.5, 0.6, 0xc9a36a, 0, -0.55, 0);
      g.add(parts.pack);
      break;
    }
    case 'penguinTrio': case 'camel': case 'desertRunner': {
      parts.members = [];
      const n = type === 'penguinTrio' ? 3 : 1;
      for (let i = 0; i < n; i++) {
        const m = new THREE.Group();
        if (type === 'penguinTrio') { m.add(ball(0.5, 0x1d2433, 0, 0, 0, 1, 1.4, 1)); m.add(ball(0.35, 0xffffff, 0, -0.05, -0.25, 1, 1.3, 0.6)); m.add(cone(0.1, 0.3, 0xffb020, 0, 0.45, -0.45).rotateX(-Math.PI / 2)); }
        if (type === 'camel') { m.add(box(2.2, 1, 0.9, 0xc9a36a, 0, 0.3, 0)); m.add(ball(0.55, 0xb8925a, 0, 1, 0)); m.add(box(0.4, 1.2, 0.4, 0xc9a36a, 0, 0.9, -1.2)); m.add(ball(0.35, 0xc9a36a, 0, 1.6, -1.35)); for (const [x, z] of [[-0.3, -0.7], [0.3, -0.7], [-0.3, 0.7], [0.3, 0.7]]) m.add(box(0.2, 1, 0.2, 0xb8925a, x, -0.6, z)); }
        if (type === 'desertRunner') { m.add(ball(0.4, 0x6b6aa8, 0, 0.3, 0, 1, 0.8, 1.5)); m.add(box(0.1, 0.6, 0.1, 0xffb020, 0, -0.3, 0)); m.add(box(0.08, 0.5, 0.4, 0x3b3a68, 0, 0.5, 0.6)); }
        m.position.x = (i - (n - 1) / 2) * 1.2;
        g.add(m);
        parts.members.push(m);
      }
      break;
    }
    case 'pebbleRocks': {
      parts.members = [0, 1, 2].map((i) => { const r = mesh(new THREE.DodecahedronGeometry(0.7, 0), 0x8a8d96, (i - 1) * 1.4, (i % 2) * 0.6, 0); g.add(r); return r; });
      break;
    }
    case 'satellite': {
      parts.body = new THREE.Group();
      parts.body.add(box(1.2, 1, 1, 0xc9d0da, 0, 0, 0));
      parts.body.add(cone(0.5, 0.6, 0xdddddd, 0, 0.8, 0));
      parts.panel = box(2.2, 0.06, 0.9, 0x2f5fd6, 1.7, 0, 0);
      parts.body.add(box(2.2, 0.06, 0.9, 0x2f5fd6, -1.7, 0, 0));
      g.add(parts.body, parts.panel);
      break;
    }
    default: g.add(ball(1, 0xff00ff, 0, 0, 0));
  }
  g.userData.parts = parts;
  g.userData.type = type;
  // Remember every piece's starting pose so a new flight / lap can restore it (no allocation).
  g.traverse((o) => { o.userData.init = { p: o.position.clone(), r: o.rotation.clone(), s: o.scale.clone(), v: o.visible }; });
  return g;
}
export function resetCritter(g) {
  g.traverse((o) => { const i = o.userData.init; if (!i) return; o.position.copy(i.p); o.rotation.copy(i.r); o.scale.copy(i.s); o.visible = i.v; });
}

// Idle life (wing flaps, bobbing) and the set-piece. t = seconds since the bump (−1 = idle).
// Positions are relative to the critter's home `p` (the group's base position).
export function animateCritter(g, leave, t, clock, home) {
  const P = g.userData.parts;
  const flap = Math.sin(clock * 9 + home.x) * 0.5;
  for (const b of [P.body, ...(P.flock?.userData.members ?? [])]) if (b?.userData?.wings) { b.userData.wings[0].rotation.z = flap; b.userData.wings[1].rotation.z = -flap; }
  if (t < 0) { // idle
    g.position.set(home.x, home.y + Math.sin(clock * 1.6 + home.d) * 0.3, -home.d);
    g.rotation.set(0, 0, 0);
    g.scale.setScalar(1);
    g.visible = true;
    return;
  }
  const k = Math.min(1, t / 1.2), e = t;
  g.position.set(home.x, home.y, -home.d);
  switch (leave) {
    case 'tumble': g.position.set(home.x + e * 6, home.y + e * 5 - e * e * 2, -home.d - e * 8); g.rotation.set(e * 9, e * 5, 0); break;
    case 'helix': g.position.set(home.x + Math.cos(e * 7) * 2, home.y - e * 4, -home.d - Math.sin(e * 7) * 2); g.rotation.y = e * 7; break;
    case 'spiral': g.position.set(home.x + Math.sin(e * 6) * 1.5, home.y - e * e * 5, -home.d); g.rotation.z = e * 8; break;
    case 'glide': g.position.set(home.x + Math.sign(home.x || 1) * e * 9, home.y + e * 2, -home.d - e * 6); g.rotation.z = -Math.sign(home.x || 1) * 0.4; break;
    case 'scatter': P.flock.userData.members.forEach((m, i) => { const a = i * 1.3 + e * 3; m.position.set(Math.cos(a) * (2 + e * 8), e * (4 + i), Math.sin(a) * (2 + e * 8)); }); break;
    case 'popChute': case 'pop3': case 'chute': case 'drift': case 'dropPackage': case 'spinAway': case 'crack': case 'headPop': case 'slide': case 'trot': case 'zip': case 'splashDive': break;
    default:
  }
  if (leave === 'popChute') {
    P.bag.visible = P.stripe ? (P.stripe.visible = t < 0.12) : t < 0.12;
    if (t < 0.12) P.bag.scale.setScalar(1 + t * 3);
    P.chute.visible = t > 0.15;
    P.rider.position.set(0, -2.4 - e * 1.5, 0);
  }
  if (leave === 'pop3') P.balloons.forEach((b, i) => { b.visible = t < 0.12 + i * 0.12; });
  if (leave === 'chute') {
    P.rider.rotation.z = t < 0.4 ? Math.sin(t * 40) * 0.4 : 0; // wobble, then the chute pops open
    P.chute.visible = t > 0.4;
    if (P.wing) P.wing.visible = t < 0.4;
    g.position.set(home.x + e * 2, home.y - Math.max(0, e - 0.4) * 2.5, -home.d - e * 3);
  }
  if (leave === 'drift') { g.position.set(home.x + Math.sign(home.x || 1) * e * 5, home.y + e * 1.5, -home.d); g.rotation.set(e * 1.5, 0, e * 2); P.chute.visible = false; P.rider.children[2].rotation.z = Math.sin(clock * 10) * 0.8; }
  if (leave === 'dropPackage') { P.body.rotation.z = Math.sin(t * 30) * 0.5; g.position.y = home.y + e * 3; P.pack.position.y = -0.55 - e * e * 8; P.pack.visible = t < 0.7; }
  if (leave === 'spinAway') { g.rotation.set(e * 6, e * 9, 0); g.position.set(home.x + e * 6, home.y + e * 2, -home.d - e * 4); P.panel.position.set(1.7 + e * 4, -e * 3, 0); }
  if (leave === 'crack') P.members.forEach((m, i) => { const a = i * 2.1; m.position.set((i - 1) * 1.4 + Math.cos(a) * e * 6, (i % 2) * 0.6 + Math.sin(a) * e * 6, e * 2); m.scale.setScalar(Math.max(0.1, 1 - k)); });
  if (leave === 'headPop') { P.head.position.set(e * 1.2, 0.6 + e * 3 - e * e * 4, -e * 1.5); P.head.rotation.z = -e * 8; if (P.scarf) P.scarf.rotation.y = Math.sin(t * 20) * 0.5; }
  if (leave === 'slide') P.members.forEach((m, i) => { m.position.set((i - 1) * 1.2 + Math.sign(home.x || 1) * e * 9, -0.4, i * 0.4); m.rotation.x = -Math.PI / 2 * Math.min(1, t * 4); });
  if (leave === 'trot') { g.position.x = home.x + Math.sign(home.x || 1) * e * 6; g.rotation.y = Math.sign(home.x || 1) * Math.PI / 2; g.position.y = home.y + Math.abs(Math.sin(t * 14)) * 0.3; }
  if (leave === 'zip') { g.position.x = home.x + Math.sign(home.x || 1) * e * e * 25; g.rotation.y = Math.sign(home.x || 1) * Math.PI / 2; }
  if (leave === 'splashDive') { g.rotation.x = Math.min(1.2, t * 3); g.position.set(home.x, home.y - e * e * 10, -home.d - e * 5); }
  // The set-piece IS the leaving: fade out at the end (hidden for the rest of the flight).
  g.visible = t < 1.25;
  if (t > 1) g.scale.setScalar(Math.max(0.01, 1 - (t - 1) * 4));
}
