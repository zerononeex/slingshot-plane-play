// v2.2 PLANE STAT BARS (owner 2026-10-25: "is it possible to see the stats of the plane? Each upgrade you buy
// affects the stats bar"). Five bars, fuller = better, computed from the LIVE record through the very params a
// flight builds (flightParamsFor — main.js starts every flight with it), never hand-written numbers. Normalised
// against fixed game-wide maxima: a FULLY-UPGRADED THE DRAGON in a neutral world (the owner's ceiling rule — a
// maxed Dragon reads ~full on every bar and every other plane scales honestly below it). Pure (no DOM).
import { FLIGHT, PART_PHYSICS } from './config.js';
import { flightParams, partEffects } from './physics.js';
import { trackStats, maxLevel } from './economy.js';
import { stageBand, planeEntry } from './stages.js';
import { handlingLevel, HANDLING_MAX } from './handling.js';
import { funLevel } from './funlines.js';

// The params a flight with this record, plane (a stages.js plane entry) and world modifiers uses.
export function flightParamsFor(rec, entry, modifiers = {}) {
  return flightParams(FLIGHT, trackStats('engine', rec.engine), partEffects(rec.parts, PART_PHYSICS), {
    wheels: trackStats('wheels', rec.wheels), band: stageBand(entry, trackStats('band', rec.band)), plane: entry.plane, modifiers,
    fun: { brakes: funLevel(rec, 'brakes'), balloons: funLevel(rec, 'balloons') }, handling: handlingLevel(rec),
  });
}
// The tank a flight starts with (s of boost), after any plane multiplier.
export const tankSecondsFor = (rec, P) => trackStats('tank', rec.tank).seconds * (P.tankMul ?? 1);

// SMOOTH reads the speed a plane loses each second at a kid's cruise (SMOOTH_AT m/s): engine decay + drag. It is
// shown on a LOG scale from the worst setup in the game (WORST_LOSS: a Lv1 engine, decay × 5, glide × 1.1) up to a
// maxed THE DRAGON, so every engine level visibly moves it (drag dwarfs decay at speed on a linear scale).
export const SMOOTH_AT = 35;
export const WORST_LOSS = 0.9 * 5 + FLIGHT.drag * 1.1 * SMOOTH_AT * SMOOTH_AT;
export const BARS = ['speed', 'zoom', 'boost', 'smooth', 'steer'];
export const BAR_LABELS = { speed: 'SPEED', zoom: 'ZOOM', boost: 'BOOST', smooth: 'SMOOTH', steer: 'STEER' };
// The raw values behind the bars.
export function rawStats(rec, entry, modifiers = {}) {
  const P = flightParamsFor(rec, entry, modifiers);
  return {
    speed: P.topSpeed,                              // the top-speed cap (band-driven)
    zoom: P.boostThrust,                            // boost thrust (acceleration)
    ceiling: P.boostCap / P.topSpeed - 1,           // the boost ceiling past the cap (+0.10 … +0.55)
    tank: tankSecondsFor(rec, P),                   // boost fuel (s)
    loss: P.decay + P.drag * SMOOTH_AT * SMOOTH_AT, // m/s lost per second at cruise
    steer: P.lateralMul,                            // HANDLING × the plane's steer multiplier
  };
}
// The reference maxima: a fully-upgraded THE DRAGON, no world modifiers.
export const MAXED_RECORD = { band: maxLevel('band'), engine: maxLevel('engine'), tank: maxLevel('tank'), ramp: maxLevel('ramp'), magnet: maxLevel('magnet'), wheels: maxLevel('wheels'),
  parts: { leftWing: true, rightWing: true, tail: true }, handling: HANDLING_MAX, brakes: 5, balloons: 5, chute: 5, radar: 5, horn: 5 };
export const REFERENCE = rawStats(MAXED_RECORD, planeEntry('dragon'));
const clamp01 = (v) => Math.max(0, Math.min(1, v));
// Each bar 0 → 1 (fuller = better; a maxed Dragon reads 1 on all five).
export function statBars(rec, entry, modifiers = {}) {
  const r = rawStats(rec, entry, modifiers), R = REFERENCE;
  return {
    speed: clamp01(r.speed / R.speed),
    zoom: clamp01(r.zoom / R.zoom),
    boost: clamp01(Math.sqrt(clamp01(r.ceiling / R.ceiling) * clamp01(r.tank / R.tank))), // ceiling × tank (no tank = no boost)
    smooth: clamp01(Math.log(WORST_LOSS / r.loss) / Math.log(WORST_LOSS / R.loss)),
    steer: clamp01(r.steer / R.steer),
  };
}
// The bars that moved between two readings (a purchase): their keys.
export const movedBars = (before, after) => (before ? BARS.filter((k) => Math.abs((after[k] ?? 0) - (before[k] ?? 0)) > 1e-9) : []);
