// Pure plane-swap + hangar rules (no DOM). A plane is unlocked when its home world is.
// Flying world W with plane P: P's home record supplies the loadout and P's plane the caps;
// W supplies the terrain + modifiers and gets the coins, best distance and secrets.
import { STAGES, STAGE_ORDER, stageBand } from './stages.js';
import { getStage, setStage, isUnlocked, checkUnlocks } from './save.js';
import { TRACKS, trackStats, nextCost, canBuyTrack, buyTrack, nextPart, canBuyPart, buyPart, applyRun, minLevel, maxLevel } from './economy.js';
import { PARTS } from './config.js';

export const availablePlanes = (save) => STAGE_ORDER.filter((id) => isUnlocked(save, id));

// The plane that flies a world: the remembered choice if still unlocked, else the world's own.
export function planeFor(save, worldId) {
  const p = save.planeChoice?.[worldId];
  return p && isUnlocked(save, p) ? p : worldId;
}

export function choosePlane(save, worldId, planeId) {
  if (!isUnlocked(save, worldId) || !isUnlocked(save, planeId)) return save;
  const planeChoice = { ...save.planeChoice };
  if (planeId === worldId) delete planeChoice[worldId];
  else planeChoice[worldId] = planeId;
  return { ...save, planeChoice };
}

// Everything a flight needs: who flies, with what, where.
export function flightSetup(save, worldId) {
  const planeId = planeFor(save, worldId);
  return {
    worldId, planeId,
    borrowed: planeId !== worldId,
    loadout: getStage(save, planeId),           // the plane's own home record
    plane: STAGES[planeId].plane,               // its caps + multipliers
    band: (lv) => stageBand(STAGES[planeId], trackStats('band', lv)),
    modifiers: STAGES[worldId].modifiers,       // the world's rules (snow, water, low gravity)
  };
}

// A finished flight credits the WORLD flown; unlocks read world bests.
export function creditRun(save, worldId, { distance, coins, landingBonus = 0, secrets = [] }) {
  const next = setStage(save, worldId, applyRun(getStage(save, worldId), distance, coins, landingBonus, secrets));
  return checkUnlocks(next);
}

// Hangar strip: ELASTIC, PROPELLER, LEFT WING, RIGHT WING, TAIL — on the chosen plane's home record.
export const HANGAR = ['band', 'engine', 'leftWing', 'rightWing', 'tail'];

export function hangarChips(save, worldId) {
  const planeId = planeFor(save, worldId);
  const rec = getStage(save, planeId);
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
  const planeId = planeFor(save, worldId);
  const rec = getStage(save, planeId);
  const next = TRACKS[id] ? buyTrack(rec, id) : buyPart(rec, id);
  return next ? setStage(save, planeId, next) : null;
}
