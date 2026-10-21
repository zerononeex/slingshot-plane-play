// Game shell: screens (title / shop / flight / results), input, camera, frame loop.
// Progression is read/written ONLY through getStage/setStage (stage-ready save).
import * as THREE from 'three';
import {
  PLANE_TUNE, LAUNCH, FLIGHT, PARTS, PART_PHYSICS, RENDER, COINS, PILOT, LANDING, PAINTS, EJECT,
} from './config.js';
import { createFlight, stepFlight, flightParams, launchSpeedFor, partEffects, toggleTilt, tryLoop, tryRoll, pickupRadiusFor, SKILLS } from './physics.js';
import { stepPilot, tryEject, runDistance, runOver, pilotParams } from './pilot.js';
import { makeTerrain } from './terrain.js';
import { STAGES, STAGE_ORDER, stageBand, planeEntry, EXTRA_PLANES } from './stages.js';
import { stepCoins, reachSecrets, reachStashes } from './coins.js';
import { speedoReading, speedoZones, KMH } from './speedo.js';
import {
  trackStats, nextCost, canBuyTrack, buyTrack, maxLevel, minLevel,
  nextPart, canBuyPart, buyPart, canBuyEject, buyEject, buyOrWearPaint, applyRun, runPayout, newSecrets,
} from './economy.js';
import { loadSave, writeSave, getStage, setStage, checkUnlocks, isUnlocked, selectStage, setPrefs } from './save.js';
import { availablePlanes, planeFor, choosePlane, creditRun, hangarChips, hangarBuy, HANGAR, planeRecord, commitPlaneRecord, walletOf } from './planes.js';
import { buildPlane } from './plane.js';
import { createWorld } from './world.js';
import { createFx } from './fx.js';
import { unlockAudio, sfx, audioCtx } from './audio.js';
import { createMusic } from './music.js';
import { createFlightSound } from './flightsound.js';
import { upgradeNames, chipNames } from './names.js';
import { SWING } from './pockets.js';
import { createTrails, createStreaks } from './trails.js';
import { exportCode, groupCode, parseCode } from './codes.js';
import { quote, stepAmount, transfer, transferProblem } from './transfer.js';
import { bumpSummary } from './bumpables.js';

const $ = (id) => document.getElementById(id);
const DEG = Math.PI / 180;
const STEP = 1 / 60;
const PULL_BACK_M = 5;            // how far the plane slides back at full pull
const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;

// ---------- save + stage ----------
// stageId/stage = the WORLD being flown (terrain, rules, earnings: `wrec`).
// planeId/pstage = the PLANE flying it (`rec` = its record — loadout + purchases — with the
// paying wallet's coins: its home world's, or the world's for a plane with no home).
let save = loadSave();
let stageId = save.currentStage;
let stage = STAGES[stageId];
let planeId = planeFor(save, stageId);
let pstage = planeEntry(planeId);
let rec = planeRecord(save, stageId);
let wrec = getStage(save, stageId);
function reloadRecords() {
  planeId = planeFor(save, stageId);
  pstage = planeEntry(planeId);
  rec = planeRecord(save, stageId);
  wrec = getStage(save, stageId);
}
// Plane-aware shop stats: the band's caps come from the flying plane.
const statsFor = (id, lv) => (id === 'band' ? stageBand(pstage, trackStats('band', lv)) : trackStats(id, lv));
const topSpeed = () => pstage.plane.caps[pstage.plane.caps.length - 1] + 10;
// Purchases write the flying plane's record (coins to whichever wallet paid).
function commit(next) {
  save = commitPlaneRecord(save, stageId, next);
  writeSave(save);
  reloadRecords();
}
const loadout = () => ({
  band: statsFor('band', rec.band),
  engine: trackStats('engine', rec.engine),
  tank: trackStats('tank', rec.tank),
  ramp: trackStats('ramp', rec.ramp),
  magnet: trackStats('magnet', rec.magnet),
  wheels: trackStats('wheels', rec.wheels),
  paint: PAINTS.find((p) => p.id === rec.paints.current) ?? PAINTS[0],
});
const deckExtra = (ramp) => (ramp.level - 1) * 1.5;
const terrainFor = (lo) => makeTerrain(stage, { deckHeight: LAUNCH.deckHeight + lo.ramp.height, deckExtra: deckExtra(lo.ramp) });

// ---------- renderer / scene ----------
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: RENDER.antialias, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, RENDER.maxPixelRatio));
renderer.shadowMap.enabled = false;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, 1, 0.5, 520);
const world = createWorld(scene);
const fx = createFx(scene);
let terrain = terrainFor(loadout());
world.setStage(stage, terrain);

const plane = buildPlane(PLANE_TUNE);
plane.setStagePlane(pstage.plane);
scene.add(plane.root);

// Fake blob shadow.
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.3, 16).rotateX(-Math.PI / 2), shadowMat);
scene.add(shadow);

// Cartoon stars (dizzy pilot after a Bonk).
const stars = new THREE.Group();
const starMat = new THREE.MeshLambertMaterial({ color: 0xffe14d, emissive: 0x806000, flatShading: true });
const starGeo = new THREE.OctahedronGeometry(0.22, 0);
for (let i = 0; i < 5; i++) stars.add(new THREE.Mesh(starGeo, starMat));
stars.visible = false;
scene.add(stars);

let baseFov = 55;
let viewShift = 0; // Home projection offset (px), see frameView()
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = baseFov = camera.aspect < 1 ? 68 : 55; // portrait needs a taller view
  camera.updateProjectionMatrix();
  viewShift = NaN; // re-frame the Home scene for the new size
}
window.addEventListener('resize', resize);
resize();

// ---------- looks ----------
function applyLooks() {
  const lo = loadout();
  plane.setLoadout(rec, { ENGINE_LV: lo.engine, TANK_LV: lo.tank, MAGNET_LV: lo.magnet, WHEELS_LV: lo.wheels, paint: lo.paint });
  world.setBandLook(lo.band);
  world.setRamp(lo.ramp, deckExtra(lo.ramp));
  document.documentElement.style.setProperty('--band', hex(lo.band.color));
}

function showScreen(id) {
  for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id;
  $('hud').hidden = !(id === 'hud');
  if (id !== 'title') setPanel(null); // coming back to Home always lands on the FLY view
  if (id === 'title') requestAnimationFrame(() => scrollToCard(carouselIndex, 'auto')); // re-centre after being hidden
}

// ---------- home (the hangar) ----------
const MOTIF = { plains: '🌾', canyon: '⛰️', city: '🏙️', snow: '❄️', desert: '🌵', ocean: '🏝️', space: '🌙', jetstream: '☁️' };
let carouselIndex = 0;
let lockedView = false;

function refreshTitle() {
  $('title-coins').textContent = wrec.coins;
  $('title-world').textContent = stage.name;
  updateCarousel();
  renderHangar();
  $('fly-label').textContent = lockedView ? '🔒 LOCKED' : 'FLY!';
  $('btn-fly').disabled = lockedView;
  applyLooks();
}

// World carousel: one big card per world; the centred card is the selected world.
function buildCarousel() {
  const row = $('carousel');
  row.textContent = '';
  for (const id of STAGE_ORDER) {
    const st = STAGES[id];
    const b = document.createElement('button');
    b.className = 'stage-card';
    b.dataset.stage = id;
    const sky = hex(st.theme.sky), base = hex(st.theme.base);
    b.innerHTML = `<span class="st-art" style="background:linear-gradient(180deg, ${sky} 0%, ${sky} 55%, ${base} 56%, ${hex(st.theme.rock)} 100%)"><span class="st-motif">${MOTIF[id] ?? '✈️'}</span></span>
      <span class="st-banner"><span class="st-name"></span><span class="st-plane"></span><span class="st-meta"><span class="st-best"></span><span class="st-secrets"></span></span><span class="st-lock"></span></span>`;
    b.addEventListener('click', () => scrollToCard(STAGE_ORDER.indexOf(id)));
    row.appendChild(b);
  }
  carouselIndex = STAGE_ORDER.indexOf(stageId);
  requestAnimationFrame(() => scrollToCard(carouselIndex, 'auto'));
  // Dots along the scene's bottom edge: one per world, tap = the same scroll as a swipe.
  const dots = $('car-dots');
  dots.textContent = '';
  STAGE_ORDER.forEach((id, i) => {
    const d = document.createElement('button');
    d.className = 'car-dot';
    d.setAttribute('aria-label', STAGES[id].name);
    d.addEventListener('click', () => scrollToCard(i));
    dots.appendChild(d);
  });
}

function updateCarousel() {
  for (const b of $('carousel').children) {
    const id = b.dataset.stage, st = STAGES[id], r = getStage(save, id), open = isUnlocked(save, id);
    b.classList.toggle('selected', id === stageId);
    b.classList.toggle('locked', !open);
    b.disabled = !open;
    b.querySelector('.st-name').textContent = open ? st.name : `🔒 ${st.name}`;
    b.querySelector('.st-plane').textContent = open ? st.plane.name : '';
    b.querySelector('.st-best').textContent = open ? `Best ${r.best} m` : '';
    b.querySelector('.st-secrets').textContent = open ? `Secrets ${r.secrets.length}/${st.secrets.length}` : '';
    b.querySelector('.st-lock').textContent = open ? '' : lockLine(id);
  }
  [...$('car-dots').children].forEach((d, i) => { d.classList.toggle('on', i === carouselIndex); d.classList.toggle('locked', !isUnlocked(save, STAGE_ORDER[i])); });
}

// The unlock requirement line a locked world shows (scene banner and WORLDS panel).
function lockLine(id) {
  const st = STAGES[id], prev = STAGES[st.unlock.after];
  return `Fly ${st.unlock.best} m in ${prev.name} to unlock! (Best: ${getStage(save, prev.id).best} m)`;
}

// v0.8 Home panels: WORLDS / MORE slide up over the scene; the tab bar shows which is open.
let homePanel = null; // null (the FLY view) | 'worlds' | 'more'
function setPanel(name) {
  homePanel = name;
  $('worlds-wrap').hidden = name !== 'worlds';
  $('more-wrap').hidden = name !== 'more';
  for (const t of $('tabbar').children) t.classList.toggle('on', t.dataset.tab === (name ?? 'fly'));
  if (name === 'worlds') renderWorlds();
}

// WORLDS: all eight at a glance; tapping an open one selects it (the same selection the swipe makes).
function renderWorlds() {
  const grid = $('worlds-grid');
  grid.textContent = '';
  for (const id of STAGE_ORDER) {
    const st = STAGES[id], r = getStage(save, id), open = isUnlocked(save, id);
    const b = document.createElement('button');
    b.className = `world-tile${id === stageId && !lockedView ? ' selected' : ''}${open ? '' : ' locked'}`;
    b.dataset.world = id;
    b.style.setProperty('--wt', hex(st.theme.sky));
    b.innerHTML = '<span class="wt-name"></span><span class="wt-sub"></span><span class="wt-meta"></span>';
    b.querySelector('.wt-name').textContent = open ? st.name : `🔒 ${st.name}`;
    b.querySelector('.wt-sub').textContent = st.plane.name;
    b.querySelector('.wt-meta').textContent = open ? `Best ${r.best} m · Secrets ${r.secrets.length}/${st.secrets.length}` : lockLine(id);
    b.addEventListener('click', () => {
      if (!open) { b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle'); return; }
      const i = STAGE_ORDER.indexOf(id);
      carouselIndex = i;
      if (id === stageId) { lockedView = false; refreshTitle(); } else switchStage(id);
      setPanel(null);
      scrollToCard(i, 'auto');
    });
    grid.appendChild(b);
  }
}

function scrollToCard(i, behavior = 'smooth') {
  const row = $('carousel');
  const card = row.children[Math.max(0, Math.min(STAGE_ORDER.length - 1, i))];
  if (card) row.scrollTo({ left: card.offsetLeft - (row.clientWidth - card.clientWidth) / 2, behavior });
}

// After a swipe settles: select the centred world (a locked one just shows its lock).
let scrollTimer = 0;
function onCarouselScroll() {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    if (mode !== 'title') return; // a hidden carousel measures every card at 0: never switch worlds then
    const row = $('carousel');
    const mid = row.scrollLeft + row.clientWidth / 2;
    let best = 0, bestDist = Infinity;
    [...row.children].forEach((c, i) => { const d = Math.abs(c.offsetLeft + c.clientWidth / 2 - mid); if (d < bestDist) { bestDist = d; best = i; } });
    carouselIndex = best;
    const id = STAGE_ORDER[best];
    lockedView = !isUnlocked(save, id);
    if (!lockedView) switchStage(id); else refreshTitle();
  }, 120);
}

// Hangar strip: ELASTIC · PROPELLER · LEFT WING · RIGHT WING · TAIL for the flying plane's home record.
const CHIP_LOOK = { band: ['➰', 'ELASTIC'], engine: ['🌀', 'PROPELLER'], leftWing: ['◀', 'LEFT WING'], rightWing: ['▶', 'RIGHT WING'], tail: ['▲', 'TAIL'] };
function renderHangar() {
  const borrowed = planeId !== stageId;
  $('hangar-label').textContent = borrowed ? `Upgrading: ${pstage.plane.name} (${STAGES[walletOf(save, stageId)].name} wallet: ${rec.coins})` : 'Hangar';
  const box = $('hangar-chips');
  box.textContent = '';
  for (const c of hangarChips(save, stageId)) {
    const [icon] = CHIP_LOOK[c.id];
    const label = chipNames(planeId, stageId)[c.id];
    const b = document.createElement('button');
    b.className = 'chip-btn';
    b.dataset.chip = c.id;
    let state, price;
    if (c.kind === 'track') {
      state = c.cost === null ? 'maxed' : c.canBuy ? 'buyable' : 'poor';
      price = c.cost === null ? 'MAX' : `<span class="coin-dot"></span>${c.cost}`;
      b.innerHTML = `<span class="chip-icon" style="${c.id === 'band' ? `background:${hex(statsFor('band', c.level).color)}` : ''}">${icon}</span><span class="chip-name">${label}</span>${pipsHtml(c.level, c.min, c.max)}<span class="chip-price">${price}</span>`;
    } else {
      state = c.owned ? 'maxed' : c.locked ? 'locked' : c.canBuy ? 'buyable' : 'poor';
      price = c.owned ? '✓' : c.locked ? '🔒' : `<span class="coin-dot"></span>${c.cost}`;
      b.innerHTML = `<span class="chip-icon">${icon}</span><span class="chip-name">${label}</span><span class="chip-price">${price}</span>`;
    }
    b.classList.add(state);
    b.disabled = lockedView || state !== 'buyable';
    b.addEventListener('click', () => {
      const next = hangarBuy(save, stageId, c.id);
      if (!next) return;
      save = next;
      writeSave(save);
      reloadRecords();
      sfx.coin();
      refreshTitle();
    });
    box.appendChild(b);
  }
}

function switchStage(id) {
  if (id === stageId || !isUnlocked(save, id)) return;
  save = selectStage(save, id);
  writeSave(save);
  stageId = id;
  stage = STAGES[id];
  lockedView = false;
  applyWorldAndPlane();
}

// Rebuild the 3D world + plane for the current world/plane choice.
function applyWorldAndPlane() {
  reloadRecords();
  lo = loadout();
  terrain = terrainFor(lo);
  world.setStage(stage, terrain);
  plane.setStagePlane(pstage.plane);
  newWorld();
  refreshTitle();
  placePlane(restPose(0), 0, 0, 0);
  snapCamera();
}

// CHANGE PLANE: every unlocked plane; picking one flies it in this world (remembered per world).
function openPlanes() {
  mode = 'planes';
  const list = $('plane-list');
  list.textContent = '';
  for (const id of availablePlanes(save)) {
    const st = planeEntry(id);
    const b = document.createElement('button');
    b.className = `plane-card${id === planeId ? ' selected' : ''}`;
    b.dataset.plane = id;
    const home = id === stageId ? 'This world\'s own plane' : st.home ? `From ${st.name} · flies with its own upgrades` : `${st.name} · its own upgrades, paid from the world you fly`;
    b.innerHTML = `<span class="pc-swatch" style="background:linear-gradient(90deg, ${hex(st.plane.body)} 50%, ${hex(st.plane.wing)} 50%)"></span>
      <span class="pc-name">${st.plane.name}${id === stageId ? ' ★' : ''}</span><span class="pc-home">${home}</span>`;
    b.addEventListener('click', () => {
      save = choosePlane(save, stageId, id);
      writeSave(save);
      mode = 'title';
      showScreen('title');
      applyWorldAndPlane();
    });
    list.appendChild(b);
  }
  showScreen('planes');
}

// ---------- shop ----------
const pct = (v) => `${Math.round(v * 100)}%`;
const SHOP_ITEMS = [
  { id: 'band', name: 'RUBBER BAND', icon: '➰', effect: (l) => `${l.name} · launch ${Math.round(l.launchMax * KMH)} km/h${l.momentum ? ` · ${l.momentum}s momentum` : ''}` },
  { id: 'engine', name: 'PROPELLER ENGINE', icon: '🌀', effect: (l) => `Fly longer: loses ${(l.decay * pstage.plane.decayMul).toFixed(2)} m/s each second` },
  { id: 'tank', name: 'FUEL TANK', icon: '⛽', effect: (l) => (l.level ? `BOOST for ${l.seconds} s, refills every flight` : 'Get a BOOST button!') },
  { id: 'ramp', name: 'LAUNCH RAMP', icon: '📐', effect: (l) => `Pad +${l.height} m, angle +${l.angleDeg}°` },
  { id: 'magnet', name: 'COIN MAGNET', icon: '🧲', effect: (l) => (l.level ? `Pulls coins from ${l.radius} m` : 'Coins fly to you!') },
  { id: 'wheels', name: 'BOUNCY WHEELS', icon: '🛞', effect: (l) => `Bounce keeps ${pct(l.keep)} speed, pop ${l.pop} m/s` },
];

// One pip per level: filled = owned; the next one pulses when you can afford it.
function pipsHtml(level, min, max, pulseNext = false) {
  let h = '<span class="pips">';
  for (let i = Math.max(1, min); i <= max; i++) h += `<span class="pip${i <= level ? ' on' : i === level + 1 && pulseNext ? ' next' : ''}"></span>`;
  return `${h}</span>`;
}

const coinBtnMaxed = '<span class="coin-btn">★ MAXED</span>';
const coinBtn = (cost) => `<span class="coin-btn"><span class="coin-dot"></span>${cost}</span>`;

// state: buyable | poor (can't afford yet) | maxed | locked (needs an earlier part)
function card({ key, icon, iconBg, name, pips = '', effect, price, state, onBuy }) {
  const b = document.createElement('button');
  b.className = `card ${state}`;
  b.dataset.key = key;
  b.disabled = state !== 'buyable';
  b.innerHTML = `<span class="icon" style="${iconBg ? `background:${iconBg}` : ''}">${icon}</span>
    <span class="name">${name}</span><span class="effect">${effect}</span><span class="price">${pips}${price}</span>`;
  b.addEventListener('click', () => { lastBought = key; onBuy(); });
  return b;
}
let lastBought = null; // which card/swatch gets the happy bounce after the screen rebuilds

// One purchase path for the shop AND the title quick cards (one source of truth: the stage record).
function purchase(next) {
  if (!next) return;
  commit(next);
  sfx.coin();
  if (mode === 'shop') { refreshShop(); celebrateBuy(); } else refreshTitle();
}

// The plane pops and sparkles; the bought card bounces.
let shopPop = 0;
function celebrateBuy() {
  shopPop = 0.5;
  plane.root.getWorldPosition(_v);
  fx.sparkleBurst(_v.x, _v.y + 0.6, _v.z);
  const el = lastBought && document.querySelector(`#shop [data-key="${lastBought}"]`);
  if (el) { el.classList.remove('bounce'); void el.offsetWidth; el.classList.add('bounce'); }
}
// (The hangar chips go through planes.hangarBuy → the same buyTrack/buyPart on the same record.)

// A level-track card.
function trackCard(item) {
  const lv = rec[item.id];
  const cur = statsFor(item.id, lv);
  const cost = nextCost(item.id, lv);
  const next = cost === null ? null : statsFor(item.id, lv + 1);
  const state = cost === null ? 'maxed' : canBuyTrack(rec, item.id) ? 'buyable' : 'poor';
  const effect = next ? `▸ ${item.effect(next)}` : item.effect(cur);
  const c = card({
    key: `track:${item.id}`,
    icon: item.icon,
    iconBg: item.id === 'band' ? hex(cur.color) : item.id === 'magnet' && lv ? hex(cur.color) : '',
    name: upgradeNames(planeId, stageId)[item.id],
    pips: pipsHtml(lv, minLevel(item.id), maxLevel(item.id), state === 'buyable'),
    effect,
    price: cost === null ? coinBtnMaxed : coinBtn(cost),
    state,
    onBuy: () => purchase(buyTrack(rec, item.id)),
  });
  c.dataset.track = item.id;
  return c;
}

// UPGRADES is tinted by the selected world: [accent, dark] (Jetstream is reserved for its world).
const WORLD_TINT = {
  plains: [0x3ccf5a, 0x24a33f], canyon: [0xc8572a, 0x8f3517], city: [0xe8b100, 0xa87c00], snow: [0x5cb8ff, 0x2f86d1],
  desert: [0xe2b064, 0xb07f2f], ocean: [0x16a89f, 0x0b7470], space: [0x7c5cff, 0x5136d1], jetstream: [0xff9a4d, 0xd9661b],
};
const rgba = (n, a) => `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
function applyTint() {
  const [t, d] = WORLD_TINT[stageId] ?? WORLD_TINT.plains;
  const el = $('shop').style;
  el.setProperty('--tint', hex(t));
  el.setProperty('--tint-dark', hex(d));
  el.setProperty('--tint-soft', rgba(t, 0.16));
  el.setProperty('--tint-bg', `linear-gradient(180deg, ${rgba(t, 0.12)} 0%, ${rgba(t, 0.35)} 35%, ${rgba(t, 0.85)} 100%)`);
}

// Wallet: ticks down to the new amount with a coin flip when a purchase lands.
let walletShown = null, walletAnim = 0;
function showWallet(coins) {
  const el = $('shop-coins');
  cancelAnimationFrame(walletAnim);
  if (walletShown === null || coins >= walletShown) { walletShown = coins; el.textContent = coins; return; }
  const from = walletShown, t0 = performance.now();
  walletShown = coins;
  const coin = $('shop-coin');
  coin.classList.remove('flip'); void coin.offsetWidth; coin.classList.add('flip');
  const tick = (now) => {
    const k = Math.min(1, (now - t0) / 550);
    el.textContent = Math.round(from + (coins - from) * k);
    if (k < 1) walletAnim = requestAnimationFrame(tick);
  };
  walletAnim = requestAnimationFrame(tick);
}

function refreshShop() {
  applyTint();
  showWallet(rec.coins);
  $('shop-for').textContent = `${planeId !== stageId ? 'Upgrading: ' : ''}${pstage.plane.name} · ${pstage.home ? `${pstage.name} plane` : pstage.name}`;
  const grid = $('shop-grid');
  grid.textContent = '';
  for (const item of SHOP_ITEMS) grid.appendChild(trackCard(item));
  grid.appendChild(card({
    key: 'eject', icon: '🪂', name: upgradeNames(planeId, stageId).eject, effect: 'Pop out and parachute on!',
    price: rec.eject ? coinBtnMaxed : coinBtn(EJECT.cost),
    state: rec.eject ? 'maxed' : canBuyEject(rec) ? 'buyable' : 'poor',
    onBuy: () => purchase(buyEject(rec)),
  }));

  const parts = $('parts-grid');
  parts.textContent = '';
  const nxt = nextPart(rec.parts);
  for (const p of PARTS) {
    const owned = rec.parts[p.id];
    const isNext = nxt && nxt.id === p.id;
    parts.appendChild(card({
      key: `part:${p.id}`,
      icon: p.id === 'leftWing' ? '◀' : p.id === 'rightWing' ? '▶' : '▲',
      name: upgradeNames(planeId, stageId)[p.id],
      effect: owned || isNext ? p.blurb : `Buy the ${upgradeNames(planeId, stageId)[nxt.id]} first`,
      price: owned ? '<span class="coin-btn">✓ BUILT</span>' : isNext ? coinBtn(p.cost) : '<span class="coin-btn">🔒</span>',
      state: owned ? 'maxed' : isNext && canBuyPart(rec, p.id) ? 'buyable' : isNext ? 'poor' : 'locked',
      onBuy: () => purchase(buyPart(rec, p.id)),
    }));
  }

  const paints = $('paints');
  paints.textContent = '';
  $('shop-sec-parts').textContent = upgradeNames(planeId, stageId).parts;
  $('shop-sec-paints').textContent = upgradeNames(planeId, stageId).paints;
  for (const p of PAINTS) {
    if (p.only && p.only !== planeId) continue; // Nebula: the Starship's own skin
    const owned = rec.paints.owned.includes(p.id);
    const b = document.createElement('button');
    const poor = !owned && rec.coins < p.cost;
    b.className = `swatch${rec.paints.current === p.id ? ' current' : ''}${poor ? ' poor' : ''}`;
    b.dataset.key = `paint:${p.id}`;
    b.disabled = poor;
    const fancy = p.rainbow ? 'rainbow-dot' : p.nebula ? 'nebula-dot' : '';
    b.innerHTML = `<span class="dot ${fancy}" style="${fancy ? '' : `background:${hex(p.color)}`}"></span>${p.name}<b>${owned ? (rec.paints.current === p.id ? 'ON' : 'WEAR') : coinBtn(p.cost)}</b>`;
    b.addEventListener('click', () => { lastBought = `paint:${p.id}`; purchase(buyOrWearPaint(rec, p.id, planeId)); });
    paints.appendChild(b);
  }
  applyLooks();
}

// ---------- run state ----------
let mode = 'title';      // title | shop | aim | fly | results
let paused = false;
let flight = null, params = null, effects = null, lo = null;
let pilot = null, ejected = false, pilotDizzy = false, pilotChuteT = 0;
let session = { ownsSeat: false, ejected: false, pilot: null };
let runCoins = 0, landingBonus = 0, secretsFound = [], reached = new Set();
let flop = false, endTimer = 0, crashTimer = 0, pull = 0, tumbleSpin = 0, acc = 0;
let boostHeld = false, boostKey = false, flightSeed = 1, bonkWobble = 0;
let bumpsRun = []; // this flight's bumps ({ type }) for the results line
let inCloudTunnel = false;
let stashReached = new Set();
const input = { x: 0, y: 0, boost: false };
const keys = { x: 0, y: 0 };
const CRASH_FX_AFTER = 2.5;

function restPose(d) {
  return { x: 0, y: LAUNCH.deckHeight + lo.ramp.height + FLIGHT.clearance, d };
}

function newWorld() {
  lo = loadout();
  terrain = terrainFor(lo);
  flightSeed = (Math.random() * 2 ** 31) | 0;
  world.newFlight(terrain, flightSeed);
}

function resetPilot() {
  plane.seatPilot();
  ejected = false;
  pilot = null;
  session = { ownsSeat: rec.eject, ejected: false, pilot: null };
  pilotDizzy = false;
  stars.visible = false;
}

function startRun() {
  newWorld();
  applyLooks();
  effects = partEffects(rec.parts, PART_PHYSICS);
  params = flightParams(FLIGHT, lo.engine, effects, { wheels: lo.wheels, band: lo.band, plane: pstage.plane, modifiers: stage.modifiers });
  // SKILLS: global, from the save; TILT also needs the flying plane's Left Wing.
  const skills = new Set(save.skills ?? []);
  params.canTilt = skills.has('tilt') && !!rec.parts.leftWing;
  params.canDive = skills.has('dive');
  flight = null;
  camera.fov = baseFov; camera.updateProjectionMatrix(); // the speed kick starts from rest
  runCoins = 0; landingBonus = 0; secretsFound = []; reached = new Set(); bumpsRun = []; stashReached = new Set();
  world.setPocketLook(null);
  flop = false; pull = 0; endTimer = 0; crashTimer = 0; paused = false; tumbleSpin = 0;
  boostHeld = false;
  resetPilot();
  fx.clear();
  plane.root.rotation.set(0, 0, 0);
  plane.model.rotation.set(0, 0, 0);
  mode = 'aim';
  showScreen('hud');
  $('aim').hidden = false;
  $('hud-flight').hidden = true;
  $('banner').hidden = true;
  buildSpeedo();
  placePlane(restPose(0), 0, 0, 0);
  snapCamera();
  updateHud();
}

// ---------- speedometer ----------
const SWEEP = 120; // degrees each side of straight up
function polar(frac, r) {
  const a = (-SWEEP + 2 * SWEEP * frac) * DEG;
  return [100 + r * Math.sin(a), 100 - r * Math.cos(a)];
}
function buildSpeedo() {
  const zones = $('speedo-zones');
  zones.textContent = '';
  for (const z of speedoZones(rec.band)) {
    const [x0, y0] = polar(z.from, 78), [x1, y1] = polar(z.to, 78);
    const large = (z.to - z.from) * 2 * SWEEP > 180 ? 1 : 0;
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', `M${x0} ${y0} A78 78 0 ${large} 1 ${x1} ${y1}`);
    p.setAttribute('stroke', z.color);
    if (z.gold) p.classList.add('gold');
    zones.appendChild(p);
  }
  const ticks = $('speedo-ticks');
  ticks.textContent = '';
  for (let i = 0; i <= 10; i++) {
    const [x0, y0] = polar(i / 10, 60), [x1, y1] = polar(i / 10, i % 5 ? 66 : 70);
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', x0); l.setAttribute('y1', y0); l.setAttribute('x2', x1); l.setAttribute('y2', y1);
    ticks.appendChild(l);
  }
  updateSpeedo();
}
function updateSpeedo() {
  // pull 0 = needle at rest; otherwise the REAL launch speed this pull gives.
  const r = speedoReading(pull, lo.band, LAUNCH);
  const frac = pull > 0.02 ? r.frac : 0;
  $('speedo-needle').style.transform = `rotate(${-SWEEP + 2 * SWEEP * frac}deg)`;
  $('speedo-kmh').textContent = pull > 0.02 ? Math.round(r.kmh) : 0;
  $('speedo').classList.toggle('full', r.nearFull);
  $('speedo').classList.toggle('jet', pull > 0.02 && r.kmh >= 500); // jet-gauge look (visual only)
}

function launch() {
  flop = pull < LAUNCH.weakPull;
  const speed = launchSpeedFor(pull, LAUNCH, lo.band);
  const p = restPose(-pull * PULL_BACK_M);
  flight = createFlight({
    speed, y: p.y, d: p.d,
    pitchDeg: flop ? 0 : LAUNCH.pitchDeg + lo.ramp.angleDeg,
    momentum: flop ? 0 : lo.band.momentum,
    fuel: lo.tank.seconds,
    hold: flop ? 0 : FLIGHT.launchHold,
  });
  mode = 'fly';
  $('aim').hidden = true;
  $('hud-flight').hidden = false;
  $('btn-boost').hidden = lo.tank.level === 0;
  $('btn-eject').hidden = !rec.eject;
  showSkills(true);
  world.setUsed(flight.used);
  sfx.launch();
  // v0.7: a little launch dust, and the trails start fresh.
  plane.root.getWorldPosition(_v);
  fx.dust(_v.x, _v.y - 0.5, _v.z + 1, DUST[stageId] ?? 0xd8c8a8, 8, 0.6);
  trails.reset();
  trails.setLook(plane.trailLook, plane.accent);
}

// A flight credits the WORLD flown (coins, best, secrets); unlocks read world bests.
function creditFlight(distance) {
  const r = creditRun(save, stageId, { distance, coins: runCoins, landingBonus, secrets: secretsFound });
  save = r.save;
  writeSave(save);
  reloadRecords();
  return [...r.newly, ...r.newPlanes, ...(r.newSkills ?? []).map((id) => `skill:${id}`)];
}

function distanceNow() {
  return flight ? runDistance(session, flight) : 0;
}

function finishRun() {
  const dist = Math.floor(distanceNow());
  const prevBest = wrec.best;
  const pay = runPayout(dist, runCoins, landingBonus);
  const unlocked = creditFlight(dist);
  $('res-unlock').hidden = unlocked.length === 0;
  $('res-unlock').textContent = unlocked.map((id) => (id.startsWith('skill:') ? `NEW SKILL: ${id.slice(6).toUpperCase()}!` : STAGES[id] ? [`NEW STAGE UNLOCKED: ${STAGES[id].name}!`, STAGES[id].unlockBanner].filter(Boolean).join(' ') : EXTRA_PLANES[id].banner)).join(' ');
  if (unlocked.length) sfx.secret();
  $('res-dist').textContent = dist;
  $('res-coins').textContent = pay.collected;
  $('res-bonus').textContent = pay.bonus;
  $('res-landing').textContent = pay.landing;
  $('res-total').textContent = pay.total;
  $('res-best').textContent = wrec.best;
  $('res-top').textContent = Math.round(flight.peakSpeed * KMH);
  $('res-newbest').hidden = !(dist > prevBest && dist > 0);
  $('res-glide-box').hidden = !ejected;
  if (ejected) $('res-glide').textContent = Math.round(pilot.d - pilot.ejectD);
  const verdict = ejected ? LANDING.pilot : LANDING[flight.landing ?? 'rough'];
  $('res-verdict').textContent = verdict.bonus ? `${verdict.text} +${verdict.bonus}` : verdict.text;
  const bs = bumpSummary(bumpsRun);
  $('res-bumps').hidden = !bs;
  if (bs) $('res-bumps').textContent = bs.text;
  $('res-msg').textContent = flop ? 'Oops, a little flop! Try a bigger pull!' : secretsFound.length ? `SECRET FOUND! (${wrec.secrets.length}/${stage.secrets.length})` : '';
  mode = 'results';
  showScreen('results');
}

function goHome() {
  flightSound.stop();
  if (mode === 'fly' && flight) creditFlight(distanceNow()); // leaving mid-flight keeps what you earned
  mode = 'title';
  paused = false;
  $('pause').hidden = true;
  resetPilot();
  fx.clear();
  newWorld();
  refreshTitle();
  showScreen('title');
  plane.model.rotation.set(0, 0, 0);
  placePlane(restPose(0), 0, 0, 0);
  snapCamera();
}

function openShop() {
  mode = 'shop';
  walletShown = null; // no tick-down on open
  refreshShop();
  showScreen('shop');
}
function closeShop() {
  mode = 'title';
  newWorld();
  refreshTitle();
  showScreen('title');
  placePlane(restPose(0), 0, 0, 0);
  snapCamera();
}

function setPaused(p) {
  if (mode !== 'fly' && mode !== 'aim') return;
  paused = p;
  $('pause').hidden = !p;
  if (p) flightSound.stop(true); // restarts on the next flying frame
}

let bannerTimer = 0;
function banner(text, seconds = 1.8) {
  const b = $('banner');
  b.textContent = text;
  b.hidden = false;
  b.style.animation = 'none';
  void b.offsetWidth; // restart the pop animation
  b.style.animation = '';
  bannerTimer = seconds;
}

function eject() {
  if (mode !== 'fly' || paused || flight?.swing) return; // EJECT is ignored during a sub-area swing
  pilot = tryEject(session, flight, PILOT);
  if (!pilot) return;
  ejected = true;
  pilotChuteT = 0;
  scene.attach(plane.pilot.group);
  $('btn-eject').hidden = true;
  $('btn-boost').hidden = true;
  boostHeld = false;
  sfx.poing();
  banner('POING!', 1.2);
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

// BOOST: hold to burn (its own pointer, so steering keeps working).
const boostBtn = $('btn-boost');
boostBtn.addEventListener('pointerdown', (e) => { unlockAudio(); boostBtn.setPointerCapture?.(e.pointerId); boostHeld = true; e.preventDefault(); });
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) boostBtn.addEventListener(ev, () => { boostHeld = false; });
$('btn-eject').addEventListener('pointerdown', (e) => { e.preventDefault(); eject(); });

// Arrow keys / WASD for desktop testing; Space = boost, E = eject, P/Esc = pause.
const KEYMAP = { ArrowLeft: ['x', -1], KeyA: ['x', -1], ArrowRight: ['x', 1], KeyD: ['x', 1], ArrowUp: ['y', 1], KeyW: ['y', 1], ArrowDown: ['y', -1], KeyS: ['y', -1] };
window.addEventListener('keydown', (e) => {
  const k = KEYMAP[e.code];
  if (k) { keys[k[0]] = k[1]; e.preventDefault(); }
  if (e.code === 'Space') { boostKey = true; e.preventDefault(); }
  if (e.code === 'KeyE') eject();
  if (e.code === 'KeyT') useSkill('tilt');
  if (e.code === 'KeyL') useSkill('loop');
  if (e.code === 'KeyR') useSkill('roll');
  if (e.code === 'KeyF') diveKey = true;
  if (e.code === 'Escape' || e.code === 'KeyP') setPaused(!paused);
});
window.addEventListener('keyup', (e) => {
  const k = KEYMAP[e.code];
  if (k && keys[k[0]] === k[1]) keys[k[0]] = 0;
  if (e.code === 'Space') boostKey = false;
  if (e.code === 'KeyF') diveKey = false;
});

// ---------- SKILLS ----------
let diveHeld = false, diveKey = false, lastSteer = 1, puffTimer = 0;
function showSkills(on) {
  const skills = new Set(save.skills ?? []);
  for (const b of document.querySelectorAll('.skill-btn')) {
    b.hidden = !on || !skills.has(b.dataset.skill);
    b.classList.remove('on', 'held', 'cool');
  }
  const tilt = document.querySelector('.skill-btn[data-skill="tilt"]');
  tilt.classList.toggle('nowing', !params?.canTilt);
  tilt.querySelector('small').textContent = params?.canTilt ? '' : 'needs a wing';
}
function updateSkillButtons() {
  if (!flight) return;
  document.querySelector('.skill-btn[data-skill="tilt"]').classList.toggle('on', !!flight.tilted);
  document.querySelector('.skill-btn[data-skill="roll"]').classList.toggle('cool', flight.rollCool > 0);
  document.querySelector('.skill-btn[data-skill="dive"]').classList.toggle('held', diveHeld || diveKey);
}
function puffText(text) {
  const el = $('puff-text');
  el.textContent = text;
  el.hidden = false;
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  puffTimer = 1.1;
}
function useSkill(id) {
  if (mode !== 'fly' || !flight || ejected || paused || !(save.skills ?? []).includes(id)) return;
  if (id === 'tilt') { if (!params.canTilt) puffText('TILT needs a Left Wing!'); else toggleTilt(flight, params); }
  if (id === 'loop') tryLoop(flight);
  if (id === 'roll') tryRoll(flight, lastSteer);
}
for (const b of document.querySelectorAll('.skill-btn')) {
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    unlockAudio();
    if (b.dataset.skill === 'dive') { diveHeld = true; b.setPointerCapture?.(e.pointerId); } else useSkill(b.dataset.skill);
  });
  if (b.dataset.skill === 'dive') for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, () => { diveHeld = false; });
}

document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'fly') setPaused(true); });
document.addEventListener('gesturestart', (e) => e.preventDefault()); // no pinch-zoom on iPad

$('btn-fly').addEventListener('click', () => { unlockAudio(); startRun(); });
$('btn-shop').addEventListener('click', () => { unlockAudio(); openShop(); });
$('btn-shop-back').addEventListener('click', closeShop);
$('btn-change-plane').addEventListener('click', () => { unlockAudio(); openPlanes(); });
$('tab-fly').addEventListener('click', () => { unlockAudio(); setPanel(null); }); // the Home view; dismisses an open panel
$('tab-worlds').addEventListener('click', () => { unlockAudio(); setPanel(homePanel === 'worlds' ? null : 'worlds'); });
$('tab-more').addEventListener('click', () => { unlockAudio(); setPanel(homePanel === 'more' ? null : 'more'); });
for (const w of document.querySelectorAll('.sheet-wrap')) {
  w.addEventListener('click', (e) => { if (e.target === w || e.target.closest('[data-close]')) setPanel(null); }); // ✕, or a tap on the scene above
}
$('btn-planes-back').addEventListener('click', () => { mode = 'title'; showScreen('title'); refreshTitle(); });
$('car-prev').addEventListener('click', () => scrollToCard(carouselIndex - 1));
$('car-next').addEventListener('click', () => scrollToCard(carouselIndex + 1));
$('carousel').addEventListener('scroll', onCarouselScroll, { passive: true });
$('btn-again').addEventListener('click', () => { unlockAudio(); startRun(); });
$('btn-home').addEventListener('click', goHome);
$('btn-pause').addEventListener('click', () => setPaused(true));
$('btn-resume').addEventListener('click', () => setPaused(false));
$('btn-pause-home').addEventListener('click', goHome);

// ---------- music ----------
// menu.mp3 at home/shop/results, flight tracks in flight; a missing file is silence.
// Rotation memory: the last numbered flight song per world lives in prefs (survives reloads).
const music = createMusic(audioCtx, undefined, {
  get: (w) => save.prefs.musicLast?.[w] ?? null,
  set: (w, n) => { save = setPrefs(save, { musicLast: { ...save.prefs.musicLast, [w]: n } }); writeSave(save); },
});
const flightSound = createFlightSound(audioCtx);
music.setEnabled(save.prefs.music);
let musicKicked = false;
function syncMusic() {
  if (!musicKicked && audioCtx()?.state === 'running') { musicKicked = true; music.kick(); } // first tap
  music.prepare(stageId); // probes the world's three songs once per session (never waited on)
  music.play(mode === 'aim' || mode === 'fly' ? 'flight' : 'menu', stageId);
}
function renderMusicButtons() {
  const on = save.prefs.music;
  $('btn-music').textContent = on ? '🎵 MUSIC: ON' : '🔇 MUSIC: OFF';
  $('btn-music').classList.toggle('off', !on);
  $('btn-pause-music').textContent = on ? '🎵 MUSIC ON' : '🔇 MUSIC OFF';
}
function toggleMusic() {
  unlockAudio();
  save = setPrefs(save, { music: !save.prefs.music });
  writeSave(save);
  music.setEnabled(save.prefs.music);
  renderMusicButtons();
}
$('btn-music').addEventListener('click', toggleMusic);
$('btn-pause-music').addEventListener('click', toggleMusic);

// ---------- save codes ----------
let codesFromPause = false;
let pendingImport = null;
let replaceArmed = false;
function resetImport() {
  pendingImport = null;
  replaceArmed = false;
  $('code-confirm').hidden = true;
  $('code-error').hidden = true;
  $('btn-code-replace').classList.remove('armed');
  $('btn-code-replace').textContent = 'REPLACE';
}
function openCodes(fromPause) {
  codesFromPause = fromPause;
  const code = exportCode(save);
  $('code-out').textContent = groupCode(code);
  $('code-out').dataset.code = code;
  $('code-in').value = '';
  $('btn-code-copy').textContent = '📋 COPY';
  resetImport();
  if (fromPause) { $('pause').hidden = true; $('codes').hidden = false; } else { mode = 'codes'; showScreen('codes'); }
}
function closeCodes() {
  resetImport();
  if (codesFromPause) { $('codes').hidden = true; $('pause').hidden = false; } else { mode = 'title'; showScreen('title'); refreshTitle(); }
}
async function copyCode() {
  const code = $('code-out').dataset.code;
  try {
    await navigator.clipboard.writeText(code);
  } catch {
    const range = document.createRange(); // no clipboard API: select it so a long-press copies
    range.selectNodeContents($('code-out'));
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    try { document.execCommand('copy'); } catch { /* selected is good enough */ }
  }
  $('btn-code-copy').textContent = '✓ COPIED';
}
function tryImport() {
  resetImport();
  const r = parseCode($('code-in').value);
  if (!r.ok) {
    $('code-error').textContent = r.error;
    $('code-error').hidden = false;
    return;
  }
  pendingImport = r.save;
  const sum = r.summary;
  const box = $('code-summary');
  box.textContent = '';
  const head = document.createElement('p');
  head.className = 'msg';
  head.textContent = `${sum.worldsUnlocked} world${sum.worldsUnlocked === 1 ? '' : 's'} unlocked · ${sum.totalCoins} coins`;
  const ul = document.createElement('ul');
  for (const w of sum.worlds) {
    const li = document.createElement('li');
    li.textContent = `${w.name}: best ${w.best} m`;
    ul.appendChild(li);
  }
  box.append(head, ul);
  $('code-confirm').hidden = false;
}
function confirmReplace() {
  if (!pendingImport) return;
  if (!replaceArmed) { // a second, deliberate tap is needed
    replaceArmed = true;
    $('btn-code-replace').classList.add('armed');
    $('btn-code-replace').textContent = 'TAP AGAIN TO REPLACE';
    return;
  }
  save = pendingImport;
  writeSave(save);
  resetImport();
  // Leave any flight WITHOUT crediting it (the old progress is gone), then rebuild everything.
  mode = 'title';
  paused = false;
  $('pause').hidden = true;
  $('codes').hidden = true;
  resetPilot();
  fx.clear();
  flightSound.stop(true);
  stageId = save.currentStage;
  stage = STAGES[stageId];
  lockedView = false;
  music.setEnabled(save.prefs.music);
  renderMusicButtons();
  buildCarousel();
  showScreen('title');
  plane.model.rotation.set(0, 0, 0);
  applyWorldAndPlane();
}
$('btn-codes').addEventListener('click', () => { unlockAudio(); openCodes(false); });
$('btn-pause-codes').addEventListener('click', () => openCodes(true));
$('btn-codes-back').addEventListener('click', closeCodes);
$('btn-code-copy').addEventListener('click', copyCode);
$('btn-code-import').addEventListener('click', tryImport);
$('btn-code-replace').addEventListener('click', confirmReplace);
$('btn-code-cancel').addEventListener('click', resetImport);
$('code-in').addEventListener('input', resetImport);

// ---------- coin transfers + THE BANKER ----------
let xferFrom = null, xferTo = null, xferAmt = 0;
function worldChips(box, pick, isOn, isOff) {
  box.textContent = '';
  for (const id of STAGE_ORDER) {
    if (!isUnlocked(save, id)) continue;
    const b = document.createElement('button');
    b.className = `xfer-world${isOn(id) ? ' on' : ''}`;
    b.dataset.world = id;
    b.disabled = isOff(id);
    b.innerHTML = `${STAGES[id].name}<small><span class="coin-dot"></span>${getStage(save, id).coins}</small>`;
    b.addEventListener('click', () => pick(id));
    box.appendChild(b);
  }
}
function renderTransfer() {
  const open = STAGE_ORDER.filter((id) => isUnlocked(save, id));
  if (!open.includes(xferFrom)) xferFrom = stageId;
  if (xferTo === xferFrom || !open.includes(xferTo)) xferTo = open.find((id) => id !== xferFrom) ?? null;
  xferAmt = stepAmount(xferAmt, '', getStage(save, xferFrom).coins); // clamp to the wallet
  worldChips($('xfer-from'), (id) => { xferFrom = id; renderTransfer(); }, (id) => id === xferFrom, () => false);
  worldChips($('xfer-to'), (id) => { xferTo = id; renderTransfer(); }, (id) => id === xferTo, (id) => id === xferFrom);
  $('xfer-amt').textContent = xferAmt;
  const q = quote(xferAmt);
  $('xfer-math').innerHTML = !xferTo ? 'Unlock another world to send coins there!'
    : `Send ${q.send} → ${q.arrive} arrive · <em>Banker keeps ${q.toll}</em>`;
  $('btn-xfer-send').disabled = !xferTo || !!transferProblem(save, xferFrom, xferTo, xferAmt);
}
function openTransfer() {
  mode = 'transfer';
  xferFrom = stageId; xferTo = null; xferAmt = 0;
  renderTransfer();
  showScreen('transfer');
}
function sendTransfer() {
  const next = transfer(save, xferFrom, xferTo, xferAmt);
  if (!next) return;
  const before = { from: getStage(save, xferFrom).coins, to: getStage(save, xferTo).coins };
  save = next;
  writeSave(save); // saved BEFORE the show: skipping or a crash mid-animation loses nothing
  reloadRecords();
  playTransferShow(xferFrom, xferTo, quote(xferAmt), before);
  xferAmt = 0;
  renderTransfer();
}
document.querySelectorAll('.xfer-steps [data-step]').forEach((b) => b.addEventListener('click', () => {
  xferAmt = stepAmount(xferAmt, b.dataset.step, getStage(save, xferFrom).coins);
  renderTransfer();
}));
$('btn-transfer').addEventListener('click', () => { unlockAudio(); openTransfer(); });
$('btn-xfer-back').addEventListener('click', () => { mode = 'title'; showScreen('title'); refreshTitle(); });
$('btn-xfer-send').addEventListener('click', sendTransfer);

// The show (~2.2 s, tap to skip): a cargo plane crosses the top trailing coins that rain onto
// the destination card; every 5th coin veers into THE BANKER's bag (cha-ching); he tips his hat.
const XS_COINS = 15;
const xsPool = [];
for (let i = 0; i < XS_COINS; i++) { const c = document.createElement('div'); c.className = 'xs-coin'; $('xs-coinpool').appendChild(c); xsPool.push(c); }
let xsAnim = 0, xsDone = null, xsFinalTo = 0;
function playTransferShow(from, to, q, before) {
  const show = $('xfer-show');
  const fromCard = $('xs-from'), toCard = $('xs-to');
  fromCard.querySelector('b').textContent = STAGES[from].name;
  toCard.querySelector('b').textContent = STAGES[to].name;
  fromCard.querySelector('i').textContent = before.from - q.send;
  const toCoins = toCard.querySelector('i');
  toCoins.textContent = before.to;
  xsFinalTo = before.to + q.arrive;
  $('bk-hat').classList.remove('tip');
  show.hidden = false;
  const W = innerWidth, H = innerHeight;
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const dest = rect(toCard), bag = rect($('bk-bag'));
  const T = 2.2, flyT = 0.75;
  const banked = (i) => i % 5 === 4; // every 5th coin = the 20 %
  const plane = (t) => ({ x: -80 + (W + 160) * Math.min(1, t / 1.7), y: H * 0.13 + Math.sin(t * 5) * 6 });
  const drops = xsPool.map((_, i) => ({ t0: 0.12 + i * 0.075, landed: false }));
  let landedNormal = 0;
  const normals = drops.filter((_, i) => !banked(i)).length;
  const t0 = performance.now();
  cancelAnimationFrame(xsAnim);
  const finish = () => {
    cancelAnimationFrame(xsAnim);
    xsDone = null;
    for (const c of xsPool) c.style.display = 'none';
    show.hidden = true;
    renderTransfer();
  };
  xsDone = finish;
  const tick = (now) => {
    const t = (now - t0) / 1000;
    const p = plane(t);
    $('xs-cargo').style.transform = `translate(${p.x}px, ${p.y}px)`;
    drops.forEach((d, i) => {
      const c = xsPool[i];
      const k = (t - d.t0) / flyT;
      if (k < 0) { c.style.display = 'none'; return; }
      if (k >= 1) {
        c.style.display = 'none';
        if (!d.landed) {
          d.landed = true;
          if (banked(i)) { sfx.chaChing(); const b = $('bk-bag'); b.classList.remove('bounce'); void b.offsetWidth; b.classList.add('bounce'); }
          else {
            landedNormal++;
            toCoins.textContent = before.to + Math.round((q.arrive * landedNormal) / normals);
            toCard.classList.remove('pop'); void toCard.offsetWidth; toCard.classList.add('pop');
          }
        }
        return;
      }
      if (!d.start) d.start = plane(d.t0);
      // An arc down onto the card; the banker's coins set off the same way, then veer to his bag.
      const end = banked(i) ? bag : dest;
      const ctrl = { x: (d.start.x + dest.x) / 2 + 40, y: d.start.y - 40 };
      const a = (1 - k) * (1 - k), b2 = 2 * (1 - k) * k, c2 = k * k;
      c.style.display = 'block';
      c.style.transform = `translate(${a * d.start.x + b2 * ctrl.x + c2 * end.x}px, ${a * d.start.y + b2 * ctrl.y + c2 * end.y}px)`;
    });
    if (t > T - 0.35) $('bk-hat').classList.add('tip'); // he tips his hat
    if (t < T + 0.25) xsAnim = requestAnimationFrame(tick); else finish();
  };
  xsAnim = requestAnimationFrame(tick);
}
$('xfer-show').addEventListener('click', () => { // tap to skip (the numbers are already saved)
  if (!xsDone) return;
  $('xs-to').querySelector('i').textContent = xsFinalTo;
  xsDone();
});

// ---------- v0.7 speed FX ----------
// World-tinted dust: snow puffs white, desert tan, moon grey…
const DUST = { plains: 0xcdb98e, canyon: 0xd99a68, city: 0xc4c4c4, snow: 0xffffff, desert: 0xe8c98a, ocean: 0xeadcb0, space: 0xc2c6d0, jetstream: 0xf4f7fc };
const trails = createTrails(scene), streaks = createStreaks(scene, camera);
const _tl = new THREE.Vector3(), _tr = new THREE.Vector3();
function speedFx(dt) {
  if (mode === 'fly' && flight && !flight.ended && !ejected) {
    plane.trailPoints(_tl, _tr);
    trails.update(_tl, _tr, flight.speed, flight.boosting, dt, camera.position);
    streaks.update(flight.speed, dt);
  } else {
    trails.update(_tl, _tr, 0, false, dt);
    streaks.hide();
  }
}

// ---------- visuals ----------
const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
const _want = new THREE.Vector3();
const _look = new THREE.Vector3();
const _v = new THREE.Vector3();

function placePlane(p, pitch, bank, yaw) {
  plane.root.position.set(p.x, p.y, -p.d);
  plane.root.rotation.set(pitch, yaw, -bank);
}

function placeShadow(x, y, d) {
  const g = terrain.groundAt(x, d, y);
  const alt = Math.max(0, y - g);
  shadow.position.set(x, g + 0.08, -d);
  const s = 1 + alt * 0.02;
  shadow.scale.set(s, 1, s);
  shadowMat.opacity = Math.max(0.06, 0.35 - alt * 0.006);
}

function cameraTarget(out, look) {
  const p = plane.root.position;
  if (mode === 'shop') {
    // 3/4 view with the plane in the gap above the cards (portrait: high on screen).
    const portrait = camera.aspect < 1;
    out.set(p.x + 8.5, p.y + 2.6, p.z + 7.5);
    look.set(p.x, p.y - (portrait ? 4.2 : 3.4), p.z);
    return;
  }
  if (mode === 'title' || mode === 'planes' || mode === 'codes' || mode === 'transfer') {
    // The hangar: a 3/4 view with the plane in the middle of the screen.
    out.set(p.x + 7, p.y + 2.2, p.z + 6);
    look.set(p.x, p.y - 0.9, p.z - 0.4);
    return;
  }
  if (mode === 'aim') {
    out.set(0, p.y + 2.6, p.z + 9);
    look.set(0, p.y + 0.8, p.z - 14);
  } else if (ejected) {
    const q = plane.pilot.group.position;
    out.set(q.x * 0.9, q.y + 2.5, q.z + 9);
    look.set(q.x, q.y + 1.2, q.z - 10);
  } else if (mode === 'fly' && flight && (flight.swing || flight.lane)) {
    // SUB-AREAS: the camera rides the lane (or arcs with the swing), never the main line.
    const cx = flight.lane ? flight.lane.cx : p.x;
    out.set(cx + (p.x - cx) * 0.9, p.y + 3.4, p.z + 9.5);
    look.set(p.x, p.y + 0.8, p.z - 14);
  } else if (flight?.loop) {
    // LOOP: hold the camera behind the circle so the loop reads clearly (no swinging).
    const L = flight.loop;
    out.set(L.x * 0.9, L.y0 + L.R * 0.9, -(L.d0 - 16));
    look.set(L.x, L.y0 + L.R, -L.d0);
  } else {
    out.set(p.x * 0.9, p.y + 3.4, p.z + 9.5);
    look.set(p.x, p.y + 0.8, p.z - 14);
  }
  const minY = terrain.groundAt(out.x, -out.z, out.y) + 1.5;
  if (out.y < minY) out.y = minY;
  const roof = terrain.ceilingAt(out.x, -out.z);
  if (out.y > roof - 1) out.y = roof - 1;
}

// v0.8 Home: frame the plane in the middle of the SCENE area (between the HUD strip and the chips),
// not the whole screen. A projection offset only: the camera itself does not move.
function frameView() {
  let want = 0;
  if (mode === 'title') { const r = $('home-scene').getBoundingClientRect(); if (r.height > 0) want = Math.round(window.innerHeight / 2 - (r.top + r.height / 2)); }
  if (want === viewShift) return;
  viewShift = want;
  if (want) camera.setViewOffset(window.innerWidth, window.innerHeight, 0, want, window.innerWidth, window.innerHeight);
  else camera.clearViewOffset();
}

function snapCamera() {
  frameView();
  cameraTarget(camPos, camLook);
  camera.position.copy(camPos);
  camera.lookAt(camLook);
}

function updateCamera(dt) {
  frameView();
  cameraTarget(_want, _look);
  const k = 1 - Math.exp(-6 * dt);
  camPos.lerp(_want, k);
  camLook.lerp(_look, 1 - Math.exp(-9 * dt));
  camera.position.copy(camPos);
  camera.lookAt(camLook);
}

function updateHud() {
  $('hud-dist').textContent = `${Math.floor(distanceNow())} m`;
  $('hud-coins').textContent = runCoins;
  const sp = flight ? flight.speed : 0;
  const fill = $('speed-fill');
  fill.style.width = `${Math.min(100, (sp / topSpeed()) * 100)}%`;
  $('hud-updraft').hidden = !(flight && flight.inUpdraft && !ejected);
  fill.classList.toggle('slow', !!flight && flight.mode === 'air' && flight.stalled);
  fill.classList.toggle('momentum', !!flight && flight.momentumLeft > 0);
  if (flight && lo.tank.level) {
    const f = flight.fuelMax ? flight.fuel / flight.fuelMax : 0;
    $('fuel-ring').style.strokeDashoffset = `${276.5 * (1 - f)}`;
    boostBtn.classList.toggle('on', flight.boosting);
    boostBtn.classList.toggle('empty', flight.fuel <= 0);
  }
}

// ---------- loop ----------
let last = performance.now();
let clock = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  syncMusic();
  if (!paused) {
    clock += dt;
    if (mode === 'aim') {
      const p = restPose(-pull * PULL_BACK_M);
      placePlane(p, 0, 0, 0);
      placeShadow(p.x, p.y, p.d);
      world.setBands(_look.set(0, p.y + 0.05, -(p.d - 1.1)));
      updateSpeedo();
    } else if (mode === 'fly') {
      stepGame(dt);
    } else if (mode === 'shop' || mode === 'title' || mode === 'planes' || mode === 'codes' || mode === 'transfer') {
      plane.root.rotation.y += dt * 0.6; // turntable
    }
    // Upgrades: a gentle bob, and a pop when something is bought.
    shopPop = Math.max(0, shopPop - dt);
    plane.model.position.y = mode === 'shop' ? Math.sin(clock * 1.8) * 0.15 : 0;
    plane.model.scale.setScalar(1 + Math.sin((shopPop / 0.5) * Math.PI) * 0.18);
    if (mode !== 'aim') world.setBands(world.restPoint);
    world.update(Math.max(0, -plane.root.position.z), plane.root.position.x, dt, camera.position);
    const flying = mode === 'fly' && flight && !flight.ended;
    const spinRate = (flying && !ejected ? 12 + flight.speed * 1.6 : mode === 'fly' ? 0 : 6) * lo.engine.propSpin;
    plane.prop.rotation.z += spinRate * dt;
    plane.propBlurFor(spinRate);
    plane.animate(dt, clock, flying, flying ? flight.speed : 0, flying && flight.boosting);
    animatePilot(dt);
    if (lo.magnet.sparkle && mode !== 'fly' && Math.random() < dt * 4) magnetSpark(0xffe14d);
    fx.update(dt);
    speedFx(dt);
    if (bannerTimer > 0 && (bannerTimer -= dt) <= 0) $('banner').hidden = true;
    updateCamera(dt);
  }
  renderer.render(scene, camera);
}

function magnetSpark(color) {
  plane.magnet.getWorldPosition(_v);
  fx.spark(_v.x + (Math.random() - 0.5) * 0.8, _v.y - 0.2 + (Math.random() - 0.5) * 0.4, _v.z + (Math.random() - 0.5) * 0.6, color);
}

function animatePilot(dt) {
  const pg = plane.pilot;
  if (ejected && pilot) {
    pg.group.position.set(pilot.x, pilot.y - 0.3, -pilot.d);
    pg.group.rotation.set(0, 0, Math.sin(clock * 2) * 0.08);
    pilotChuteT += dt;
    if (!pilot.landed) {
      pg.chute.visible = pilotChuteT > 0.25;
      pg.chute.scale.setScalar(Math.min(1, Math.max(0.05, (pilotChuteT - 0.25) / 0.4)));
      for (const a of pg.arms) a.rotation.z = a.position.x > 0 ? 2.7 : -2.7;   // holding the lines
    } else {
      pg.chute.scale.setScalar(Math.max(0.01, pg.chute.scale.x - dt * 2));
      if (pg.chute.scale.x <= 0.02) pg.chute.visible = false;
      pg.arms[0].rotation.z = 0;
      pg.arms[1].rotation.z = 2.4 + Math.sin(clock * 10) * 0.5;               // waving
    }
  } else if (pilotDizzy) {
    pg.group.rotation.set(0, Math.sin(clock * 3) * 0.4, Math.sin(clock * 5) * 0.15);
  } else if (flight && (flight.landing === 'perfect' || flight.landing === 'good') && flight.mode !== 'air') {
    pg.group.position.y = 0.02 + 0.18 + Math.abs(Math.sin(clock * 8)) * 0.15; // cheering
    pg.arms[0].rotation.z = -2.8;
    pg.arms[1].rotation.z = 2.8;
  }
  if (stars.visible) {
    pg.group.getWorldPosition(_v);
    stars.children.forEach((s, i) => {
      const a = clock * 2.5 + (i * Math.PI * 2) / 5;
      s.position.set(_v.x + Math.cos(a) * 0.5, _v.y + 0.85, _v.z + Math.sin(a) * 0.5);
      s.rotation.y = a * 2;
    });
  }
}

// Bump reward FX: a floating "+N" and a few coins flying to the coin counter (pooled DOM).
const bumpCoins = [];
for (let i = 0; i < 8; i++) { const d = document.createElement('div'); d.className = 'bump-coin'; $('bump-fx').appendChild(d); bumpCoins.push(d); }
function bumpFx(n) {
  const plus = $('bump-plus');
  plus.textContent = `+${n}`;
  plus.classList.remove('go'); void plus.offsetWidth; plus.classList.add('go');
  const target = $('hud-coins').getBoundingClientRect();
  const sx = innerWidth / 2, sy = innerHeight * 0.55;
  bumpCoins.forEach((d, i) => {
    d.style.transition = 'none';
    d.style.opacity = '1';
    d.style.transform = `translate(${sx + (i - 3.5) * 14}px, ${sy + Math.sin(i * 2) * 20}px)`;
    void d.offsetWidth;
    d.style.transition = '';
    d.style.transitionDelay = `${i * 0.04}s`;
    d.style.transform = `translate(${target.left + target.width / 2}px, ${target.top + target.height / 2}px)`;
    d.style.opacity = '0';
  });
}

// LOOP: anything collectible inside the circle is swept up when the loop completes.
function sweepLoop(L) {
  if (!L) return;
  let got = 0;
  for (const c of world.activeCoins()) {
    if (!c.alive || c.token || Math.abs(c.x - L.x) > 3) continue;
    if (Math.hypot(c.d - L.d0, c.y - (L.y0 + L.R)) < L.R + 1.5) { c.alive = false; got++; }
  }
  if (got) { runCoins += got; sfx.coin(); }
}

function collect(pos, opts) {
  const res = stepCoins(world.activeCoins(), pos, STEP, opts);
  if (res.pulled) plane.tractor();
  if (res.collected) { runCoins += res.collected; sfx.coin(); }
  if (res.pulled && !ejected) magnetSpark(0xfff3b0);
  for (const st of reachStashes(terrain, world.activeCoins(), pos, stashReached)) { // a sub-area's BONUS STASH
    runCoins += st.coins;
    plane.root.getWorldPosition(_v);
    fx.sparkleBurst(_v.x, _v.y + 1, _v.z);
    sfx.secret();
    banner(`BONUS STASH! +${st.coins}`, 2.2);
  }
  for (const s of reachSecrets(stage, terrain, world.activeCoins(), pos, reached)) {
    runCoins += s.coins;
    plane.root.getWorldPosition(_v);
    if (ejected) plane.pilot.group.getWorldPosition(_v);
    fx.sparkleBurst(_v.x, _v.y + 1, _v.z);
    sfx.secret();
    if (newSecrets(wrec, [...secretsFound, s.id]).includes(s.id) && !secretsFound.includes(s.id)) {
      secretsFound.push(s.id);
      banner(`SECRET FOUND! +${s.coins}`, 2.4);
    }
  }
}

function stepGame(dt) {
  input.x = pointerId === null ? keys.x : input.x;
  input.y = pointerId === null ? keys.y : input.y;
  input.boost = (boostHeld || boostKey) && !ejected;
  input.dive = (diveHeld || diveKey) && !ejected;
  if (Math.abs(input.x) > 0.25) lastSteer = Math.sign(input.x); // ROLL goes the way you last steered
  if (puffTimer > 0 && (puffTimer -= dt) <= 0) $('puff-text').hidden = true;
  flightSound.dive(!!flight.diving);
  acc += dt;
  let n = 0;
  while (acc >= STEP && n < 6) {
    // After an eject the empty plane noses down and flies on by itself.
    stepFlight(flight, ejected ? { x: 0, y: -0.4, boost: false } : input, STEP, params, terrain);
    if (!ejected) {
      collect(flight, { magnetRadius: lo.magnet.radius, pickupRadius: pickupRadiusFor(flight, COINS.pickupRadius), speed: flight.speed });
    } else {
      const wasLanded = pilot.landed;
      stepPilot(pilot, input, STEP, pilotParams(PILOT, stage.modifiers), terrain, flight.lane ?? FLIGHT.corridorHalfWidth);
      collect(pilot, { pickupRadius: PILOT.pickupRadius });
      if (pilot.landed && !wasLanded) {
        landingBonus += LANDING.pilot.bonus;
        banner(`${LANDING.pilot.text} +${LANDING.pilot.bonus}`, 2.2);
        sfx.cheer();
      }
    }
    acc -= STEP;
    n++;
  }
  if (n === 6) acc = 0;
  for (const ev of flight.events) {
    if (ev === 'bounce' || ev === 'touchdown' || ev === 'perfect' || ev === 'good') { // touchdown dust, scaled by the impact
      plane.root.getWorldPosition(_v);
      const k = Math.min(1, flight.speed / 30);
      fx.dust(_v.x, _v.y - 0.5, _v.z, DUST[stageId] ?? 0xd8c8a8, Math.round(6 + 12 * k), 0.6 + 0.6 * k);
    }
    if (ev === 'bounce') {
      sfx.bounce();
      if (plane.isShip) { // RETRO THRUSTERS: blue puffs instead of a squash
        plane.root.getWorldPosition(_v);
        for (let i = 0; i < 6; i++) fx.spark(_v.x + (Math.random() - 0.5) * 1.4, _v.y - 0.5, _v.z + (Math.random() - 0.5) * 1.2, 0x7fc8ff);
        fx.puff(_v.x, _v.y - 0.6, _v.z);
      } else plane.squashWheels();
    }
    if (ev === 'tumble') sfx.bonk();
    if (ev === 'bonk') { // bounced off something solid: bits + wobble, the flight goes on
      sfx.bonk();
      plane.root.getWorldPosition(_v);
      const [c1, c2] = stage.theme.bits ?? [0xffffff, 0xdddddd];
      fx.bits(_v.x, _v.y + 0.3, _v.z - 1, c1, c2);
      bonkWobble = 0.6;
    }
    if (ev === 'scrape') sfx.scrape();
    if ((ev === 'perfect' || ev === 'good') && !ejected) {
      landingBonus += LANDING[ev].bonus;
      banner(`${LANDING[ev].text} +${LANDING[ev].bonus}`, 2.2);
      sfx.cheer();
    }
    if (ejected) continue; // the empty plane earns nothing
    if (ev === 'arch') { runCoins += stage.archBonus; banner(`THROUGH THE ARCH! +${stage.archBonus}`, 1.6); sfx.secret(); }
    // SKILLS
    if (ev === 'tiltOn' || ev === 'tiltOff') sfx.tilt();
    if (ev === 'loop') sfx.loop();
    if (ev === 'loopSlow') { puffText('NEED MORE SPEED!'); bonkWobble = 0.4; }
    if (ev === 'roll') sfx.roll();
    if (ev === 'loopEnd') sweepLoop(flight.lastLoop);
    if (ev === 'slot') {
      for (const c of world.activeCoins()) if (c.alive && c.token && Math.abs(c.d - flight.d) < 8) c.alive = false; // the TOKEN
      runCoins += 10; banner('THROUGH THE SLOT! +10', 1.6); sfx.slot();
    }
    if (ev === 'loopRing') { runCoins += 5; sfx.coin(); }
    if (ev === 'loopMaster') { runCoins += 50; banner('LOOP MASTER! +50', 2); sfx.loopRing(); }
    if (ev === 'diveGate') { runCoins += 15; banner('DIVE GATE! +15', 1.4); sfx.speedGate(flight.speed); }
    // SUB-AREAS
    if (ev === 'swingIn' || ev === 'swingOut') sfx.whoosh();
    if (ev === 'pocketIn') { const p = terrain.pockets[flight.lane.pocket]; banner(p.name, 1.8); world.setPocketLook(p.look); }
    if (ev === 'swingOut') world.setPocketLook(null);
    if (ev === 'courseClear') { runCoins += 20; banner('COURSE CLEAR! +20', 1.8); sfx.slot(); }
    if (ev === 'gateFast' || ev === 'gateSlow') {
      const pay = stage.gateBonus[ev === 'gateFast' ? 'fast' : 'slow'];
      runCoins += pay;
      banner(ev === 'gateFast' ? `SPEED GATE! +${pay}` : `GATE +${pay} — go faster!`, 1.3);
      sfx.speedGate(flight.speed);
    }
    if (ev === 'ring') { runCoins += stage.ringBonus; banner(`THROUGH THE ${stage.ringName ?? 'RING'}! +${stage.ringBonus}`, 1.2); sfx.secret(); }
    if (ev === 'devil') { banner('WHOOSH! DUST DEVIL BOOST!', 1.4); sfx.whoosh(); }
    if (ev === 'updraft') sfx.whoosh();
    if (ev === 'splash' || ev === 'bigSplash') {
      plane.root.getWorldPosition(_v);
      fx.splash(_v.x, terrain.groundAt(flight.x, flight.d), _v.z, ev === 'bigSplash');
      sfx.splash();
      if (ev === 'splash') plane.squashWheels();
    }
  }
  flight.events.length = 0;
  // BUMPABLES: pay instantly, start the set-piece, a "+N", coin sparkles and a silly sound.
  for (const bp of flight.bumps) {
    world.bump(bp.b.id, bp.lap);
    if (ejected) continue;
    const c = bp.b.cast;
    runCoins += c.reward;
    bumpsRun.push({ type: bp.b.type });
    bumpFx(c.reward);
    sfx[c.sound]?.();
    plane.root.getWorldPosition(_v);
    const [c1, c2] = c.leave === 'crack' ? [0xfff3b0, 0xc9d0da] : c.leave === 'pop3' || c.leave === 'popChute' ? [0xff4fa3, 0xffe14d] : [0xffffff, 0xe8e0d0];
    fx.bits(_v.x, _v.y + 0.4, _v.z - 2, c1, c2); // feathers / confetti / star bits
  }
  flight.bumps.length = 0;
  // COURSE CLEAR is paid in the event loop above. Into the Jetstream CLOUD TUNNEL: 2 s of fog.
  const inCloud = stage.theme.jetstream && terrain.ceilingAt(flight.x, flight.d) < Infinity;
  if (inCloud && !inCloudTunnel) world.fogIn(2);
  inCloudTunnel = inCloud;

  // Plane pose.
  const bankMax = 50 * DEG;
  const onGround = flight.mode !== 'air';
  const steerVx = flight.vx - params.driftSpeed;
  const wob = onGround ? 0 : effects.wobbleDeg * DEG;
  let bank = onGround ? 0 : (steerVx / params.lateralSpeed) * bankMax - effects.rollDeg * DEG + wob * Math.sin(clock * 2.3);
  bank += -flight.tiltT * (Math.PI / 2 - bank * 0.5); // TILT: knife-edge (left wing down)
  // FOV kick: the sub-area swing's +6 and the speed kick (+4 from 45 m/s up) take the MAX, never stack;
  // eased so it returns smoothly on landing.
  let swingKick = 0;
  if (flight.swing) { // SUB-AREAS: bank HARD toward the turn
    const k = Math.min(1, flight.swing.t / SWING.time), dir = Math.sign(flight.swing.to - flight.swing.from);
    bank += dir * SWING.bankDeg * DEG * Math.sin(Math.PI * k);
    swingKick = SWING.fovKick * Math.sin(Math.PI * k);
  }
  const sk = Math.min(1, Math.max(0, (flight.speed - 45) / 40)), speedKick = flight.ended ? 0 : 4 * sk * sk * (3 - 2 * sk);
  const fovWant = baseFov + Math.max(swingKick, speedKick);
  if (Math.abs(camera.fov - fovWant) > 0.01) { camera.fov += (fovWant - camera.fov) * Math.min(1, (swingKick ? 14 : 5) * dt); camera.updateProjectionMatrix(); }                                         // TILT: knife-edge (left wing down)
  if (flight.rollT > 0) bank += flight.rollDir * Math.PI * 2 * (1 - flight.rollT / SKILLS.rollTime); // ROLL: a barrel roll
  const yaw = -Math.atan2(flight.vx, Math.max(1, flight.speed)) * 0.6;
  bonkWobble = Math.max(0, bonkWobble - dt);
  const bw = bonkWobble * 0.5 * Math.sin(clock * 38); // a quick dizzy shake after a bonk
  placePlane(flight, flight.pitch + flight.noseUp + wob * Math.sin(clock * 1.7 + 1) + bw * 0.5, bank + bw, yaw); // noseUp: a wingless plane lifts its nose but can't climb
  // Engine + wind follow airspeed; a hard steer (not the passive one-wing roll) whooshes.
  if (flight.ended) flightSound.stop();
  else {
    if (!flightSound.running) flightSound.start(pstage.plane.engineSound ?? 'prop', { deep: pstage.plane.deepPutter });
    flightSound.update(flight.speed, onGround ? 0 : (steerVx / params.lateralSpeed) * 50);
  }
  if (ejected) placeShadow(pilot.x, pilot.y, pilot.d);
  else placeShadow(flight.x, flight.y, flight.d);

  if (flight.mode === 'tumble' && !flight.ended) {
    tumbleSpin += dt * 9;
    plane.model.rotation.set(tumbleSpin * 0.8, 0, Math.sin(tumbleSpin) * 0.6);
  } else if (flight.ended === 'tumble') {
    plane.model.rotation.x *= 0.85; // settle upright-ish
    plane.model.rotation.z *= 0.85;
  }

  // Boost exhaust puffs from the tank.
  if (flight.boosting && Math.random() < 0.7) {
    plane.tank.getWorldPosition(_v);
    fx.puff(_v.x, _v.y, _v.z + 0.6);
  }

  // BAD crash only: flames + smoke during the tumble and ~2.5 s after stopping, then they die down.
  if (flight.crashFX) {
    if (flight.ended) crashTimer += dt;
    const k = Math.max(0, 1 - crashTimer / CRASH_FX_AFTER);
    plane.root.localToWorld(_v.set(0, 0.2, -1.2));
    if (k > 0 && Math.random() < 0.9 * k + 0.1) fx.flame(_v.x, _v.y, _v.z);
    if (Math.random() < (0.35 + 0.4 * k) * dt * 10) fx.smoke(_v.x, _v.y + 0.3, _v.z, 0.4 + 0.6 * k);
    // The pilot pops out dizzy (unless they already ejected).
    if (flight.ended === 'tumble' && !ejected && !pilotDizzy) {
      pilotDizzy = true;
      scene.attach(plane.pilot.group);
      plane.pilot.group.position.set(flight.x + 1.6, terrain.groundAt(flight.x + 1.6, flight.d, flight.y) + 0.05, -flight.d);
      plane.pilot.group.rotation.set(0, 0, 0);
      stars.visible = true;
    }
  }

  if (flight.ended && !ejected) { $('btn-boost').hidden = true; $('btn-eject').hidden = true; showSkills(false); }
  updateSkillButtons();

  // When is the flight over?
  if (ejected) {
    if (runOver(session, flight)) { endTimer += dt; if (endTimer > 2.2) finishRun(); }
  } else if (runOver(session, flight)) {
    endTimer += dt;
    const wait = flight.landing === 'bad' ? 3.2 : flight.landing === 'perfect' || flight.landing === 'good' ? 1.8 : 1.2;
    if (endTimer > wait) finishRun();
  }
  updateHud();
}

// ---------- boot ----------
lo = loadout();
newWorld();
buildCarousel();
refreshTitle();
renderMusicButtons();
showScreen('title');
placePlane(restPose(0), 0, 0, 0);
placeShadow(0, restPose(0).y, 0);
world.setBands(world.restPoint);
snapCamera();
requestAnimationFrame(frame);
window.__game = {
  get mode() { return mode; }, get flight() { return flight; }, get pilot() { return pilot; },
  get save() { return save; }, get rec() { return rec; }, get coins() { return world.activeCoins(); },
  get pattern() { return flightSeed; }, eject, get music() { return music.file; }, get sound() { return flightSound.kind; },
};
