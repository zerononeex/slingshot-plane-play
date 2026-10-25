// Pure plane-swap + hangar rules (no DOM). A world's plane is unlocked when its world is;
// extra planes (the Barnstormer) have their own unlock list; v1.4 reward flyers follow the ★s.
// Flying world W with plane P: P's record supplies the loadout and P's plane the caps;
// W supplies the terrain + modifiers and gets the coins, best distance and secrets.
// Upgrades are paid from P's home wallet; a plane with no home world (the Barnstormer)
// is paid from the wallet of the world you are in.
import { STAGES, PLANE_ORDER, FLYER_ORDER, stageBand, planeEntry } from './stages.js';
import { FLYERS } from './flyers.js';
import { getStage, setStage, isUnlocked, isPlaneUnlocked, checkUnlocks, flyersUnlocked } from './save.js';
import { TRACKS, trackStats, nextCost, canBuyTrack, buyTrack, nextPart, canBuyPart, buyPart, applyRun, minLevel, maxLevel } from './economy.js';
import { PARTS } from './config.js';
import { applyGoals, gateTotal, beatsTheGame } from './goals.js';

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
export const flightSetup = (save, worldId) => setupFor(save, worldId, planeFor(save, worldId));
// (v1.8: the same setup for any plane in a world — the Hangar previews with it)
export function setupFor(save, worldId, planeId) {
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
// v0.9: goal gates collected this flight join the world's collection; completing it pays the prize once.
export function creditRun(save, worldId, { distance, coins, landingBonus = 0, secrets = [], gates = [], completed = false }) {
  const run = applyRun(getStage(save, worldId), distance, coins, landingBonus, secrets);
  let next = setStage(save, worldId, gates.length || completed ? applyGoals(run, gates, completed, gateTotal(worldId)) : run);
  const beatGame = beatsTheGame(save, next); // v1.2: the last ★ was Neon Void's
  if (beatGame) next = { ...next, gameComplete: true };
  const r = checkUnlocks(next);
  const had = flyersUnlocked(save.stages); // v1.4: a new ★ can earn a reward flyer (its banner rides newPlanes)
  const newFlyers = flyersUnlocked(r.save.stages).filter((id) => !had.includes(id));
  return { ...r, newPlanes: [...r.newPlanes, ...newFlyers], beatGame };
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

// ───────────────────────── v1.8 THE HANGAR (the plane showroom): its pure rules ─────────────────────────
// The lineup in a world: the world's own plane, the other planes you have unlocked (other worlds' planes,
// the Barnstormer), then EVERY reward flyer — locked ones too, so a kid can see what they are working toward.
export function hangarLineup(save, worldId) {
  const others = availablePlanes(save).filter((id) => id !== worldId && !FLYER_ORDER.includes(id));
  return [worldId, ...others, ...FLYER_ORDER];
}
// What still has to happen for a locked plane ("★ Canyon"), or null once it is yours.
export function unlockLabel(save, planeId) {
  if (isPlaneUnlocked(save, planeId)) return null;
  const f = FLYERS.find((x) => x.id === planeId);
  if (f) return f.unlock.replace(/\s*\(.*\)\s*$/, '');
  return STAGES[planeId] ? `Open ${STAGES[planeId].name}` : 'Keep flying';
}
// The status a previewed plane shows: its level + top speed IN THIS WORLD, read exactly as a flight reads
// them — the plane's own record and its band (stageBand of the plane's caps at its band level, as
// flightSetup / the loadout do) — and its state: 'current' (it flies this world), 'ready' or 'locked'.
export function planeStatus(save, worldId, planeId) {
  const setup = setupFor(save, worldId, planeId), unlocked = isPlaneUnlocked(save, planeId);
  return {
    id: planeId, name: setup.plane.name, flyer: setup.plane.flyer ?? null,
    level: setup.loadout.band, topSpeed: setup.band(setup.loadout.band).launchMax,
    state: !unlocked ? 'locked' : planeFor(save, worldId) === planeId ? 'current' : 'ready',
    requirement: unlockLabel(save, planeId),
  };
}
// FLY THIS PLANE: exactly today's equip (choosePlane) — or null for a plane that is still locked.
export function confirmPlane(save, worldId, planeId) {
  if (!isUnlocked(save, worldId) || !isPlaneUnlocked(save, planeId)) return null;
  return choosePlane(save, worldId, planeId);
}
