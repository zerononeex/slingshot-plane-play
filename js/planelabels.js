// v2.2 STAGE-PLANE HIGHLIGHT (owner 2026-10-25: "make it clear which plane belongs to which world"). Display only:
// every label is a pure function of (world, selected plane); the wallet's coin count is passed in for the sub-line.
import { STAGES, EXTRA_PLANES, FLYER_STARS, planeEntry } from './stages.js';

// A plane's home world: a world's own plane → that world; the Barnstormer → the world that unlocks it; a reward
// flyer → the (first) world whose ★ earns it.
export function planeHome(planeId) {
  if (STAGES[planeId]) return planeId;
  return EXTRA_PLANES[planeId]?.unlock?.world ?? FLYER_STARS[planeId]?.[0] ?? null;
}
export const isNative = (worldId, planeId) => worldId === planeId;
const worldName = (id) => STAGES[id]?.name ?? '';
// The Hangar card badge.
export const cardBadge = (worldId, planeId) => (isNative(worldId, planeId) ? '★ THIS WORLD\'S PLANE' : `BORROWED FROM ${worldName(planeHome(planeId)).toUpperCase()}`);
// The stage FLY screen's line under the world.
export const flyLine = (worldId, planeId) => (isNative(worldId, planeId)
  ? 'This world\'s plane — coins earned here upgrade this ship.'
  : `Borrowed from ${worldName(planeHome(planeId))} — this world's plane is ${STAGES[worldId].plane.name}.`);
// Whose wallet pays: the plane's home wallet for a world's own plane, else the world you are in (planes.js walletOf).
export const walletWorld = (worldId, planeId) => (planeEntry(planeId)?.home ? planeId : worldId);
// The UPGRADES header: { title, sub }.
export const upgradeHeader = (worldId, planeId, coins) => ({
  title: `Upgrading: ${planeEntry(planeId).plane.name}`,
  sub: `Paid from the ${worldName(walletWorld(worldId, planeId))} wallet: ${coins}`,
});
