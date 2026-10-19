// localStorage save with validation. A bad save never crashes.
// v0.2 added `slingLevel` and `parts`; saves without them load with defaults
// and keep their coins / best / engine.
import { SAVE_KEY } from './config.js';
import { MAX_ENGINE, MAX_SLING, PART_IDS } from './economy.js';

const MAX_COINS = 10_000_000;
const MAX_BEST = 10_000_000;

export const freshParts = () => Object.fromEntries(PART_IDS.map((id) => [id, false]));

export function freshSave() {
  return { v: 1, coins: 0, best: 0, engine: 1, slingLevel: 1, parts: freshParts() };
}

const isInt = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;

// Parts must be owned in order: keep the longest valid prefix, drop the rest.
function cleanParts(raw) {
  const parts = freshParts();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return parts;
  for (const id of PART_IDS) {
    if (raw[id] !== true) break;
    parts[id] = true;
  }
  return parts;
}

export function validateSave(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  if (data.v !== 1) return null;
  // Core fields from v0: if these are broken the save is corrupt → start fresh.
  if (!isInt(data.coins, 0, MAX_COINS)) return null;
  if (!isInt(data.best, 0, MAX_BEST)) return null;
  if (!isInt(data.engine, 1, MAX_ENGINE)) return null;
  // v0.2 fields: missing or broken → default, never wipe the rest of the save.
  return {
    v: 1,
    coins: data.coins,
    best: data.best,
    engine: data.engine,
    slingLevel: isInt(data.slingLevel, 1, MAX_SLING) ? data.slingLevel : 1,
    parts: cleanParts(data.parts),
  };
}

function defaultStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function loadSave(storage = defaultStorage()) {
  try {
    const raw = storage?.getItem(SAVE_KEY);
    if (!raw) return freshSave();
    return validateSave(JSON.parse(raw)) ?? freshSave();
  } catch {
    return freshSave();
  }
}

export function writeSave(save, storage = defaultStorage()) {
  try {
    const ok = validateSave(save);
    if (!ok || !storage) return false;
    storage.setItem(SAVE_KEY, JSON.stringify(ok));
    return true;
  } catch {
    return false; // private mode / quota — the game keeps going
  }
}
