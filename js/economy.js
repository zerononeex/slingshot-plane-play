// Pure coin + upgrade rules.
import { ENGINE, SLING, PARTS, COINS } from './config.js';

export const MAX_ENGINE = ENGINE.length;
export const MAX_SLING = SLING.length;
export const PART_IDS = PARTS.map((p) => p.id);

const statsAt = (table, level) => table[Math.min(table.length, Math.max(1, level | 0)) - 1];
const nextCost = (table, level) => (level >= table.length ? null : table[level].cost);

export const engineStats = (level) => statsAt(ENGINE, level);
export const slingStats = (level) => statsAt(SLING, level);

// Cost of the NEXT level, or null when maxed.
export const nextEngineCost = (level) => nextCost(ENGINE, level);
export const nextSlingCost = (level) => nextCost(SLING, level);

export function canBuyEngine(save) {
  const cost = nextEngineCost(save.engine);
  return cost !== null && save.coins >= cost;
}

export function canBuySling(save) {
  const cost = nextSlingCost(save.slingLevel);
  return cost !== null && save.coins >= cost;
}

// Purchases return a NEW save with the purchase applied, or null if not allowed.
export function buyEngine(save) {
  if (!canBuyEngine(save)) return null;
  return { ...save, coins: save.coins - nextEngineCost(save.engine), engine: save.engine + 1 };
}

export function buySling(save) {
  if (!canBuySling(save)) return null;
  return { ...save, coins: save.coins - nextSlingCost(save.slingLevel), slingLevel: save.slingLevel + 1 };
}

// The next part to build (they come in a fixed order), or null when complete.
export function nextPart(parts) {
  return PARTS.find((p) => !parts[p.id]) ?? null;
}

export function canBuyPart(save, id) {
  const next = nextPart(save.parts);
  return !!next && next.id === id && save.coins >= next.cost;
}

export function buyPart(save, id) {
  if (!canBuyPart(save, id)) return null;
  const part = nextPart(save.parts);
  return { ...save, coins: save.coins - part.cost, parts: { ...save.parts, [id]: true } };
}

export function runPayout(distance, coinsCollected) {
  const bonus = Math.floor(Math.max(0, distance) / COINS.metersPerBonusCoin);
  return { collected: coinsCollected * COINS.perCoin, bonus, total: coinsCollected * COINS.perCoin + bonus };
}

// Apply a finished run to the save. Returns a NEW save.
export function applyRun(save, distance, coinsCollected) {
  const pay = runPayout(distance, coinsCollected);
  const dist = Math.floor(Math.max(0, distance));
  return { ...save, coins: save.coins + pay.total, best: Math.max(save.best, dist) };
}
