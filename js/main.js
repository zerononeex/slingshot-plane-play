// Game shell: screens, input, camera, and the frame loop.
import * as THREE from 'three';
import { PLANE_TUNE, LAUNCH, FLIGHT, ENGINE, RENDER } from './config.js';
import { createFlight, stepFlight, flightParams, launchSpeedFor } from './physics.js';
import { groundAt } from './terrain.js';
import { engineStats, nextEngineCost, canBuyEngine, buyEngine, applyRun, runPayout, MAX_ENGINE } from './economy.js';
import { loadSave, writeSave } from './save.js';
import { buildPlane } from './plane.js';
import { createWorld } from './world.js';
import { unlockAudio, sfx } from './audio.js';

const $ = (id) => document.getElementById(id);
const DEG = Math.PI / 180;
const STEP = 1 / 60;
const PULL_BACK_M = 5;            // how far the plane slides back at full pull
const TOP_SPEED = ENGINE[ENGINE.length - 1].launchMax;

// ---------- renderer / scene ----------
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: RENDER.antialias, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, RENDER.maxPixelRatio));
renderer.shadowMap.enabled = false;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, 1, 0.5, 520);
const world = createWorld(scene);

const plane = buildPlane(PLANE_TUNE);
scene.add(plane.root);

// Fake blob shadow.
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.3, 16).rotateX(-Math.PI / 2), shadowMat);
scene.add(shadow);

// Cartoon stars for a tumble.
const stars = new THREE.Group();
const starMat = new THREE.MeshLambertMaterial({ color: 0xffe14d, emissive: 0x806000, flatShading: true });
const starGeo = new THREE.OctahedronGeometry(0.28, 0);
for (let i = 0; i < 5; i++) stars.add(new THREE.Mesh(starGeo, starMat));
stars.visible = false;
scene.add(stars);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = camera.aspect < 1 ? 68 : 55; // portrait needs a taller view
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---------- save / title ----------
let save = loadSave();

function showScreen(id) {
  for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id;
  $('hud').hidden = !(id === 'hud');
}

function refreshTitle() {
  $('title-coins').textContent = save.coins;
  $('title-best').textContent = save.best;
  const cost = nextEngineCost(save.engine);
  const btn = $('btn-engine');
  if (cost === null) {
    btn.innerHTML = `ENGINE <b>Lv ${save.engine}</b> · MAX ★`;
    btn.disabled = true;
  } else {
    btn.innerHTML = `ENGINE <b>Lv ${save.engine} ▸ ${save.engine + 1}</b> · <span class="coin-dot"></span>${cost}`;
    btn.disabled = !canBuyEngine(save);
  }
  const pips = $('engine-pips');
  pips.textContent = '';
  for (let i = 1; i <= MAX_ENGINE; i++) {
    const p = document.createElement('span');
    p.className = i <= save.engine ? 'pip on' : 'pip';
    pips.appendChild(p);
  }
}

$('btn-engine').addEventListener('click', () => {
  const next = buyEngine(save);
  if (!next) return;
  save = next;
  writeSave(save);
  sfx.coin();
  refreshTitle();
});

// ---------- run state ----------
let mode = 'title';      // title | aim | fly | results
let paused = false;
let flight = null;
let params = null;
let runCoins = 0;
let flop = false;
let endTimer = 0;
let pull = 0;
let tumbleSpin = 0;
let acc = 0;
const input = { x: 0, y: 0 };
const keys = { x: 0, y: 0 };

function restPose(d) {
  return { x: 0, y: LAUNCH.deckHeight + FLIGHT.clearance, d };
}

function startRun() {
  world.reset();
  const st = engineStats(save.engine);
  params = flightParams(FLIGHT, st);
  flight = null;
  runCoins = 0;
  flop = false;
  pull = 0;
  endTimer = 0;
  paused = false;
  tumbleSpin = 0;
  plane.model.rotation.set(0, 0, 0);
  stars.visible = false;
  mode = 'aim';
  showScreen('hud');
  $('aim').hidden = false;
  $('hud-flight').hidden = true;
  $('power-fill').style.height = '0%';
  placePlane(restPose(0), 0, 0, 0);
  snapCamera();
  updateHud();
}

function launch() {
  const st = engineStats(save.engine);
  flop = pull < LAUNCH.weakPull;
  const speed = launchSpeedFor(pull, LAUNCH, st);
  const p = restPose(-pull * PULL_BACK_M);
  flight = createFlight({ speed, y: p.y, d: p.d, pitchDeg: flop ? 0 : LAUNCH.pitchDeg });
  mode = 'fly';
  $('aim').hidden = true;
  $('hud-flight').hidden = false;
  sfx.launch();
}

function finishRun() {
  const dist = Math.max(0, Math.floor(flight.d));
  const prevBest = save.best;
  const pay = runPayout(dist, runCoins);
  save = applyRun(save, dist, runCoins);
  writeSave(save);
  $('res-dist').textContent = dist;
  $('res-coins').textContent = pay.collected;
  $('res-bonus').textContent = pay.bonus;
  $('res-total').textContent = pay.total;
  $('res-best').textContent = save.best;
  $('res-newbest').hidden = !(dist > prevBest && dist > 0);
  $('res-msg').textContent = flop
    ? 'Oops, a little flop! Try a bigger pull!'
    : flight.ended === 'tumble'
      ? 'Bonk! A wobbly tumble — you’re OK!'
      : 'What a smooth landing!';
  mode = 'results';
  showScreen('results');
}

function goHome() {
  if (mode === 'fly' && flight) {
    // Leaving mid-flight still keeps what you earned.
    save = applyRun(save, Math.max(0, flight.d), runCoins);
    writeSave(save);
  }
  mode = 'title';
  paused = false;
  $('pause').hidden = true;
  refreshTitle();
  showScreen('title');
  placePlane(restPose(0), 0, 0, 0);
  stars.visible = false;
  plane.model.rotation.set(0, 0, 0);
  snapCamera();
}

function setPaused(p) {
  if (mode !== 'fly' && mode !== 'aim') return;
  paused = p;
  $('pause').hidden = !p;
}

// ---------- input ----------
// Aim: drag down to pull. Fly: relative virtual stick from where you touch.
let pointerId = null;
let originX = 0, originY = 0;
const stickEl = $('stick');
const knobEl = $('stick-knob');

function stickRadius() {
  return Math.max(50, Math.min(window.innerWidth, window.innerHeight) * 0.14);
}

canvas.addEventListener('pointerdown', (e) => {
  unlockAudio();
  if (paused || pointerId !== null) return;
  if (mode !== 'aim' && mode !== 'fly') return;
  pointerId = e.pointerId;
  canvas.setPointerCapture?.(e.pointerId);
  originX = e.clientX;
  originY = e.clientY;
  if (mode === 'fly') {
    stickEl.style.left = `${originX}px`;
    stickEl.style.top = `${originY}px`;
    knobEl.style.transform = 'translate(-50%, -50%)';
    stickEl.hidden = false;
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId !== pointerId) return;
  const dx = e.clientX - originX;
  const dy = e.clientY - originY;
  if (mode === 'aim') {
    pull = Math.min(1, Math.max(0, dy / (window.innerHeight * LAUNCH.pullScreenFraction)));
  } else if (mode === 'fly') {
    const r = stickRadius();
    let sx = dx / r, sy = -dy / r;
    const len = Math.hypot(sx, sy);
    if (len > 1) { sx /= len; sy /= len; }
    input.x = sx;
    input.y = sy;
    knobEl.style.transform = `translate(calc(-50% + ${sx * r}px), calc(-50% + ${-sy * r}px))`;
  }
});

function endPointer(e) {
  if (e.pointerId !== pointerId) return;
  pointerId = null;
  input.x = 0;
  input.y = 0;
  stickEl.hidden = true;
  if (mode === 'aim' && !paused) {
    if (pull > 0.02) launch();
    else pull = 0;
  }
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

// Arrow keys / WASD for desktop testing.
const KEYMAP = { ArrowLeft: ['x', -1], KeyA: ['x', -1], ArrowRight: ['x', 1], KeyD: ['x', 1], ArrowUp: ['y', 1], KeyW: ['y', 1], ArrowDown: ['y', -1], KeyS: ['y', -1] };
window.addEventListener('keydown', (e) => {
  const k = KEYMAP[e.code];
  if (k) { keys[k[0]] = k[1]; e.preventDefault(); }
  if (e.code === 'Escape' || e.code === 'KeyP') setPaused(!paused);
});
window.addEventListener('keyup', (e) => {
  const k = KEYMAP[e.code];
  if (k && keys[k[0]] === k[1]) keys[k[0]] = 0;
});

document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'fly') setPaused(true); });
document.addEventListener('gesturestart', (e) => e.preventDefault()); // no pinch-zoom on iPad

$('btn-fly').addEventListener('click', () => { unlockAudio(); startRun(); });
$('btn-again').addEventListener('click', () => { unlockAudio(); startRun(); });
$('btn-home').addEventListener('click', goHome);
$('btn-pause').addEventListener('click', () => setPaused(true));
$('btn-resume').addEventListener('click', () => setPaused(false));
$('btn-pause-home').addEventListener('click', goHome);

// ---------- visuals ----------
const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
const _want = new THREE.Vector3();
const _look = new THREE.Vector3();

function placePlane(p, pitch, bank, yaw) {
  plane.root.position.set(p.x, p.y, -p.d);
  plane.root.rotation.set(pitch, yaw, -bank);
  const g = groundAt(p.x, p.d);
  const alt = Math.max(0, p.y - g);
  shadow.position.set(p.x, g + 0.08, -p.d);
  const s = 1 + alt * 0.02;
  shadow.scale.set(s, 1, s);
  shadowMat.opacity = Math.max(0.06, 0.35 - alt * 0.006);
}

function cameraTarget(out, look) {
  const p = plane.root.position;
  if (mode === 'aim' || mode === 'title') {
    out.set(0, LAUNCH.deckHeight + 3.2, p.z + 9);
    look.set(0, LAUNCH.deckHeight + 1.4, p.z - 14);
  } else {
    out.set(p.x * 0.9, p.y + 3.4, p.z + 9.5);
    look.set(p.x, p.y + 0.8, p.z - 14);
  }
  const minY = groundAt(out.x, -out.z) + 1.5;
  if (out.y < minY) out.y = minY;
}

function snapCamera() {
  cameraTarget(camPos, camLook);
  camera.position.copy(camPos);
  camera.lookAt(camLook);
}

function updateCamera(dt) {
  cameraTarget(_want, _look);
  const k = 1 - Math.exp(-6 * dt);
  camPos.lerp(_want, k);
  camLook.lerp(_look, 1 - Math.exp(-9 * dt));
  camera.position.copy(camPos);
  camera.lookAt(camLook);
}

function updateHud() {
  const d = flight ? Math.max(0, Math.floor(flight.d)) : 0;
  $('hud-dist').textContent = `${d} m`;
  $('hud-coins').textContent = runCoins;
  const sp = flight ? flight.speed : 0;
  const fill = $('speed-fill');
  fill.style.width = `${Math.min(100, (sp / TOP_SPEED) * 100)}%`;
  fill.classList.toggle('slow', !!flight && flight.mode === 'air' && flight.stalled);
}

// ---------- loop ----------
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  if (!paused) {
    if (mode === 'aim') {
      const p = restPose(-pull * PULL_BACK_M);
      placePlane(p, 0, 0, 0);
      world.setBands(_look.set(0, p.y + 0.05, -(p.d - 1.1)));
      $('power-fill').style.height = `${Math.round(pull * 100)}%`;
      $('power-fill').classList.toggle('weak', pull < LAUNCH.weakPull);
    } else if (mode === 'fly') {
      stepGame(dt);
    }
    if (mode !== 'aim') world.setBands(world.restPoint);
    world.update(Math.max(0, -plane.root.position.z), plane.root.position.x, dt);
    const spinRate = flight && mode === 'fly' ? 12 + flight.speed * 1.6 : mode === 'aim' ? 6 : 0;
    plane.prop.rotation.z += spinRate * dt;
    updateCamera(dt);
  }
  renderer.render(scene, camera);
}

function stepGame(dt) {
  input.x = pointerId === null ? keys.x : input.x;
  input.y = pointerId === null ? keys.y : input.y;
  acc += dt;
  let n = 0;
  while (acc >= STEP && n < 6) {
    stepFlight(flight, input, STEP, params, groundAt);
    const got = world.collectCoins(flight.x, flight.y, flight.d);
    if (got) { runCoins += got; sfx.coin(); }
    acc -= STEP;
    n++;
  }
  if (n === 6) acc = 0;
  for (const ev of flight.events) {
    if (ev === 'bounce') sfx.bounce();
    if (ev === 'tumble') sfx.bonk();
  }
  flight.events.length = 0;

  const bankMax = 50 * DEG;
  const onGround = flight.mode !== 'air';
  const bank = onGround ? 0 : (flight.vx / params.lateralSpeed) * bankMax;
  const yaw = -Math.atan2(flight.vx, Math.max(1, flight.speed)) * 0.6;
  placePlane(flight, flight.pitch, bank, yaw);

  if (flight.mode === 'tumble' && !flight.ended) {
    tumbleSpin += dt * 9;
    plane.model.rotation.set(tumbleSpin * 0.8, 0, Math.sin(tumbleSpin) * 0.6);
    stars.visible = true;
  }
  if (stars.visible) {
    const p = plane.root.position;
    stars.children.forEach((s, i) => {
      const a = performance.now() / 400 + (i * Math.PI * 2) / 5;
      s.position.set(p.x + Math.cos(a) * 1.4, p.y + 1.3 + Math.sin(a * 2) * 0.15, p.z + Math.sin(a) * 1.4);
      s.rotation.y = a * 2;
    });
  }
  if (flight.ended) {
    if (flight.ended === 'tumble' && plane.model.rotation.x !== 0) {
      plane.model.rotation.x *= 0.85; // settle upright-ish
    }
    endTimer += dt;
    if (endTimer > 1.1) finishRun();
  }
  updateHud();
}

// ---------- boot ----------
refreshTitle();
showScreen('title');
placePlane(restPose(0), 0, 0, 0);
world.setBands(world.restPoint);
snapCamera();
requestAnimationFrame(frame);
window.__game = { get mode() { return mode; }, get flight() { return flight; }, get save() { return save; } };
