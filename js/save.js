// localStorage save, per stage. A bad save never crashes and is never wiped:
// every field is validated on its own and falls back to its default.
//
// Shape (v2): { v: 2, currentStage, unlocked: [stageIds], planesUnlocked: [extra plane ids],
//              planeChoice: { world: plane }, prefs: { music }, stages: { <stageId | extra plane id>: record } }
//              skills: [skill ids]
// (planesUnlocked and skills are v0.6, additive: older saves derive them from their unlocked worlds.)
// record = { coins, band, engine, tank, ramp, magnet, wheels, eject,
//            parts{leftWing,rightWing,tail}, paints{owned[], current}, best, secrets[],
//            gates[]?, complete? }   (v0.9 STAGE GOALS, sparse: absent = no gates / not complete)
//
// Game code reads/writes progression ONLY through getStage(save, id) / setStage(save, id, rec).
import { SAVE_KEY } from './config.js';
import { STAGES, DEFAULT_STAGE, STAGE_ORDER, EXTRA_PLANES, EXTRA_PLANE_ORDER } from './stages.js';
import { TRACK_IDS, PART_IDS, PAINT_IDS, minLevel, maxLevel, paintFits } from './economy.js';
import { PAINTS } from './config.js';
import { cleanGates, cleanComplete } from './goals.js';

const MAX_COINS = 10_000_000;
const MAX_BEST = 10_000_000;
const MAX_STAGES = 16;
const STAGE_ID = /^[a-z][a-z0-9-]{0,23}$/;

export const freshParts = () => Object.fromEntries(PART_IDS.map((id) => [id, false]));

export function freshRecord() {
  return {
    coins: 0,
    ...Object.fromEntries(TRACK_IDS.map((id) => [id, minLevel(id)])),
    eject: false,
    parts: freshParts(),
    paints: { owned: ['default'], current: 'default' },
    best: 0,
    secrets: [],
  };
}

export const freshPrefs = () => ({ music: true });

export function freshSave() {
  return { v: 2, currentStage: DEFAULT_STAGE, unlocked: [DEFAULT_STAGE], planesUnlocked: [], skills: [], planeChoice: {}, prefs: freshPrefs(), stages: { [DEFAULT_STAGE]: freshRecord() } };
}

// Which plane flies each world: only unlocked worlds → unlocked other planes (the default is implicit).
function cleanPlaneChoice(raw, unlocked, planes = []) {
  const out = {};
  if (!isObj(raw)) return out;
  for (const [w, p] of Object.entries(raw)) if (w !== p && unlocked.includes(w) && (unlocked.includes(p) || planes.includes(p))) out[w] = p;
  return out;
}

// SKILLS (global): each unlocks the first time its world does (stored, never lost).
export const SKILL_ORDER = ['tilt', 'loop', 'roll', 'dive'];
export const SKILL_WORLD = { tilt: 'canyon', loop: 'city', roll: 'snow', dive: 'desert' };
export function deriveSkills(unlocked, stored = []) {
  return SKILL_ORDER.filter((id) => stored.includes(id) || unlocked.includes(SKILL_WORLD[id]));
}

// Extra planes (the Barnstormer): stored once earned, and earned the moment their world unlocks.
export function derivePlanes(unlocked, stored = []) {
  return EXTRA_PLANE_ORDER.filter((id) => stored.includes(id) || unlocked.includes(EXTRA_PLANES[id].unlock.world));
}
// prefs.musicLast = { world: 1–3 } — the rotating flight song played last per world (only when set).
function cleanPrefs(raw) {
  const out = { music: !(isObj(raw) && raw.music === false) };
  if (isObj(raw) && isObj(raw.musicLast)) {
    const last = {};
    for (const [w, n] of Object.entries(raw.musicLast)) if (STAGE_ORDER.includes(w) && [1, 2, 3].includes(n)) last[w] = n;
    if (Object.keys(last).length) out.musicLast = last;
  }
  return out;
}

// Unlock chain: a stage is unlocked if it was unlocked before (stored, never re-locks),
// if its own record exists, or if the previous stage's best meets its bar.
export function deriveUnlocked(stages, stored = []) {
  const out = [DEFAULT_STAGE];
  for (const id of STAGE_ORDER) {
    if (id === DEFAULT_STAGE) continue;
    const u = STAGES[id].unlock;
    const prevBest = stages[u.after]?.best ?? 0;
    if (stored.includes(id) || stages[id] || (out.includes(u.after) && prevBest >= u.best)) out.push(id);
  }
  return out;
}

// After a run: newly earned unlocks (and the save with them stored).
export function checkUnlocks(save) {
  const unlocked = deriveUnlocked(save.stages, save.unlocked);
  const newly = unlocked.filter((id) => !save.unlocked.includes(id));
  const had = save.planesUnlocked ?? [];
  const planesUnlocked = derivePlanes(unlocked, had);
  const newPlanes = planesUnlocked.filter((id) => !had.includes(id));
  const hadSkills = save.skills ?? deriveSkills(save.unlocked);
  const skills = deriveSkills(unlocked, hadSkills);
  const newSkills = skills.filter((id) => !hadSkills.includes(id));
  const changed = newly.length || newPlanes.length || newSkills.length || !save.skills;
  return { save: changed ? { ...save, unlocked, planesUnlocked, skills } : save, newly, newPlanes, newSkills };
}

export const isUnlocked = (save, id) => save.unlocked.includes(id);
// Worlds' planes unlock with their world; extra planes have their own list.
export const isPlaneUnlocked = (save, id) => (STAGES[id] ? isUnlocked(save, id) : (save.planesUnlocked ?? []).includes(id));

const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
const intOr = (n, lo, hi, dflt) => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : dflt);

// Parts must be owned in order: keep the longest valid prefix, drop the rest.
function cleanParts(raw) {
  const parts = freshParts();
  if (!isObj(raw)) return parts;
  for (const id of PART_IDS) {
    if (raw[id] !== true) break;
    parts[id] = true;
  }
  return parts;
}

function cleanPaints(raw, stageId) {
  const owned = ['default'];
  if (isObj(raw) && Array.isArray(raw.owned)) {
    for (const id of raw.owned) if (PAINT_IDS.includes(id) && !owned.includes(id) && paintFits(PAINTS.find((p) => p.id === id), stageId)) owned.push(id);
  }
  const current = isObj(raw) && owned.includes(raw.current) ? raw.current : 'default';
  return { owned, current };
}

function cleanSecrets(raw, stageId) {
  const known = (STAGES[stageId]?.secrets ?? []).map((s) => s.id);
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((id) => known.includes(id)))];
}

// Validate one stage record field by field.
export function validateRecord(raw, stageId = DEFAULT_STAGE) {
  const r = isObj(raw) ? raw : {};
  const rec = freshRecord();
  rec.coins = intOr(r.coins, 0, MAX_COINS, 0);
  rec.best = intOr(r.best, 0, MAX_BEST, 0);
  for (const id of TRACK_IDS) rec[id] = intOr(r[id], minLevel(id), maxLevel(id), minLevel(id));
  rec.eject = r.eject === true;
  rec.parts = cleanParts(r.parts);
  rec.paints = cleanPaints(r.paints, stageId);
  rec.secrets = cleanSecrets(r.secrets, stageId);
  // v0.9 goal gates: known numbers, no duplicates; `complete` only as a real true with all 10 behind it.
  const gates = STAGES[stageId] ? cleanGates(r.gates) : [];
  if (gates.length) rec.gates = gates;
  if (cleanComplete(r.complete, gates)) rec.complete = true;
  return rec;
}

// v0 / v0.2 flat save → the plains record (slingLevel → band; new lines at base).
function migrateFlat(raw) {
  return validateRecord({
    coins: raw.coins,
    best: raw.best,
    engine: raw.engine ?? raw.engineLevel,
    band: raw.slingLevel,
    parts: raw.parts,
  }, DEFAULT_STAGE);
}

export function validateSave(data) {
  if (!isObj(data)) return freshSave();
  if (!isObj(data.stages)) {
    // Old flat save (v0 / v0.2).
    const stages = { [DEFAULT_STAGE]: migrateFlat(data) };
    const unlocked = deriveUnlocked(stages);
    return { v: 2, currentStage: DEFAULT_STAGE, unlocked, planesUnlocked: derivePlanes(unlocked), skills: deriveSkills(unlocked), planeChoice: {}, prefs: freshPrefs(), stages };
  }
  const stages = {};
  for (const id of Object.keys(data.stages).slice(0, MAX_STAGES)) {
    if (STAGE_ID.test(id)) stages[id] = validateRecord(data.stages[id], id);
  }
  if (!stages[DEFAULT_STAGE]) stages[DEFAULT_STAGE] = freshRecord();
  const stored = Array.isArray(data.unlocked) ? data.unlocked.filter((id) => STAGE_ORDER.includes(id)) : [];
  const unlocked = deriveUnlocked(stages, stored);
  const currentStage = typeof data.currentStage === 'string' && STAGES[data.currentStage] && unlocked.includes(data.currentStage)
    ? data.currentStage : DEFAULT_STAGE;
  const storedPlanes = Array.isArray(data.planesUnlocked) ? data.planesUnlocked : [];
  const planesUnlocked = derivePlanes(unlocked, storedPlanes);
  const skills = deriveSkills(unlocked, Array.isArray(data.skills) ? data.skills : []);
  return { v: 2, currentStage, unlocked, planesUnlocked, skills, planeChoice: cleanPlaneChoice(data.planeChoice, unlocked, planesUnlocked), prefs: cleanPrefs(data.prefs), stages };
}

// The ONLY way game code reads progression: a validated copy of one stage's record.
export function getStage(save, id = save.currentStage) {
  return validateRecord(save.stages[id] ?? freshRecord(), id);
}

// The ONLY way game code writes progression: returns a NEW save with that stage replaced.
export function setStage(save, id, rec) {
  if (!STAGE_ID.test(id)) throw new Error(`bad stage id: ${id}`);
  return { ...save, stages: { ...save.stages, [id]: validateRecord(rec, id) } };
}

function defaultStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function loadSave(storage = defaultStorage()) {
  try {
    const raw = storage?.getItem(SAVE_KEY);
    if (!raw) return freshSave();
    return validateSave(JSON.parse(raw));
  } catch {
    return freshSave();
  }
}

export function writeSave(save, storage = defaultStorage()) {
  try {
    if (!storage) return false;
    storage.setItem(SAVE_KEY, JSON.stringify(validateSave(save)));
    return true;
  } catch {
    return false; // private mode / quota — the game keeps going
  }
}

// Switch stages (only to an unlocked one).
export function selectStage(save, id) {
  return isUnlocked(save, id) ? { ...save, currentStage: id } : save;
}

export function setPrefs(save, prefs) {
  return { ...save, prefs: cleanPrefs({ ...save.prefs, ...prefs }) };
}
