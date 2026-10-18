// Pure coin + upgrade rules.
import { ENGINE, COINS } from './config.js';

export const MAX_ENGINE = ENGINE.length;

export function engineStats(level) {
  const i = Math.min(MAX_ENGINE, Math.max(1, level | 0)) - 1;
  return ENGINE[i];
}

// Cost of the NEXT engine level, or null when maxed.
export function nextEngineCost(level) {
  return level >= MAX_ENGINE ? null : ENGINE[level].cost;
}

export function canBuyEngine(save) {
  const cost = nextEngineCost(save.engine);
  return cost !== null && save.coins >= cost;
}

// Returns a NEW save with the purchase applied, or null if not allowed.
export function buyEngine(save) {
  if (!canBuyEngine(save)) return null;
  const cost = nextEngineCost(save.engine);
  return { ...save, coins: save.coins - cost, engine: save.engine + 1 };
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
