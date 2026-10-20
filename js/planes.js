// Pure plane-swap + hangar rules (no DOM). A world's plane is unlocked when its world is;
// extra planes (the Barnstormer) have their own unlock list.
// Flying world W with plane P: P's record supplies the loadout and P's plane the caps;
// W supplies the terrain + modifiers and gets the coins, best distance and secrets.
// Upgrades are paid from P's home wallet; a plane with no home world (the Barnstormer)
// is paid from the wallet of the world you are in.
import { STAGES, PLANE_ORDER, stageBand, planeEntry } from './stages.js';
import { getStage, setStage, isUnlocked, isPlaneUnlocked, checkUnlocks } from './save.js';
import { TRACKS, trackStats, nextCost, canBuyTrack, buyTrack, nextPart, canBuyPart, buyPart, applyRun, minLevel, maxLevel } from './economy.js';
import { PARTS } from './config.js';

export const availablePlanes = (save) => PLANE_ORDER.filter((id) => isPlaneUnlocked(save, id));

// The plane that flies a world: the remembered choice if still unlocked, else the world's own.
export function planeFor(save, worldId) {
  const p = save.planeChoice?.[worldId];
  return p && isPlaneUnlocked(save, p) ? p : worldId;
}

export function choosePlane(save, worldId, planeId) {
  if (!isUnlocked(save, worldId) || !isPlaneUnlocked(save, planeId)) return save;
  const planeChoice = { ...save.planeChoice };
  if (planeId === worldId) delete planeChoice[worldId];
  else planeChoice[worldId] = planeId;
  return { ...save, planeChoice };
}

// Whose wallet pays for the plane flying `worldId`: its home world, or (no home) that world.
export function walletOf(save, worldId) {
  const planeId = planeFor(save, worldId);
  return planeEntry(planeId)?.home ? planeId : worldId;
}

// The flying plane's record as the shop sees it: its levels + the paying wallet's coins.
export function planeRecord(save, worldId) {
  const rec = getStage(save, planeFor(save, worldId));
  return { ...rec, coins: getStage(save, walletOf(save, worldId)).coins };
}

// Write a shop result back: levels/parts/paints to the plane, coins to the paying wallet.
export function commitPlaneRecord(save, worldId, rec) {
  const planeId = planeFor(save, worldId), wallet = walletOf(save, worldId);
  if (wallet === planeId) return setStage(save, planeId, rec);
  const next = setStage(save, planeId, { ...rec, coins: getStage(save, planeId).coins });
  return setStage(next, wallet, { ...getStage(next, wallet), coins: rec.coins });
}

// Everything a flight needs: who flies, with what, where.
export function flightSetup(save, worldId) {
  const planeId = planeFor(save, worldId);
  const entry = planeEntry(planeId);
  return {
    worldId, planeId,
    borrowed: planeId !== worldId,
    loadout: getStage(save, planeId),           // the plane's own record
    plane: entry.plane,                         // its caps + multipliers
    band: (lv) => stageBand(entry, trackStats('band', lv)),
    modifiers: STAGES[worldId].modifiers,       // the world's rules (snow, water, low gravity)
  };
}

// A finished flight credits the WORLD flown; unlocks read world bests.
export function creditRun(save, worldId, { distance, coins, landingBonus = 0, secrets = [] }) {
  const next = setStage(save, worldId, applyRun(getStage(save, worldId), distance, coins, landingBonus, secrets));
  return checkUnlocks(next);
}

// Hangar strip: ELASTIC, PROPELLER, LEFT WING, RIGHT WING, TAIL — on the chosen plane's record.
export const HANGAR = ['band', 'engine', 'leftWing', 'rightWing', 'tail'];

export function hangarChips(save, worldId) {
  const rec = planeRecord(save, worldId);
  return HANGAR.map((id) => {
    if (TRACKS[id]) {
      const cost = nextCost(id, rec[id]);
      return { id, kind: 'track', level: rec[id], min: minLevel(id), max: maxLevel(id), cost, canBuy: canBuyTrack(rec, id), locked: false };
    }
    const part = PARTS.find((p) => p.id === id);
    const owned = rec.parts[id];
    const next = nextPart(rec.parts);
    return { id, kind: 'part', owned, cost: part.cost, canBuy: canBuyPart(rec, id), locked: !owned && next?.id !== id };
  });
}

// Returns the NEW save, or null if not allowed (can't afford, maxed, or parts out of order).
export function hangarBuy(save, worldId, id) {
  const rec = planeRecord(save, worldId);
  const next = TRACKS[id] ? buyTrack(rec, id) : buyPart(rec, id);
  return next ? commitPlaneRecord(save, worldId, next) : null;
}
