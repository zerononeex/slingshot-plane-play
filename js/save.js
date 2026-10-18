// localStorage save with validation. A bad save never crashes — it starts fresh.
import { SAVE_KEY } from './config.js';
import { MAX_ENGINE } from './economy.js';

const MAX_COINS = 10_000_000;
const MAX_BEST = 10_000_000;

export function freshSave() {
  return { v: 1, coins: 0, best: 0, engine: 1 };
}

const isInt = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;

export function validateSave(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  if (data.v !== 1) return null;
  if (!isInt(data.coins, 0, MAX_COINS)) return null;
  if (!isInt(data.best, 0, MAX_BEST)) return null;
  if (!isInt(data.engine, 1, MAX_ENGINE)) return null;
  return { v: 1, coins: data.coins, best: data.best, engine: data.engine };
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
