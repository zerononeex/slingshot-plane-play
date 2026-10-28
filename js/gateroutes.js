// v2.3 GATE ROUTE AUDIT (owner playtest 2026-10-27: Star Fox's BURIED TOMB gate could not be flown on the same run as
// THE GREAT PYRAMID's). A gate inside a CONTAINER — a sub-area pocket, a base-lap cavern lane, a mega cave lane or a
// mega interior (hall) — forces a route over that container's whole span: from the moment you must line up for its
// entry to the moment it lets you go. Halls are mandatory for every flight. Two forced routes are MUTUALLY EXCLUSIVE
// when their spans overlap, or when the gap between one's exit and the next one's entry is too short to steer across
// even for the best-steering plane the world has: its own plane at its top cap (band Lv10) with HANDLING Lv10, through
// the physics' own sideways cap (physics.js lateralCap), plus a pocket swing's 30 m. ("Exclusive" = nobody can fly both.)
// A pocket whose portal is switched off on that lap (megarun noPortal: within 30 m of a hall or cave) is unreachable.
// Pure (no DOM / three.js); the tests run it on every stage.
import { EXIT_PASSAGE } from './pockets.js';
import { FLIGHT, BAND } from './config.js';
import { flightParams, lateralCap } from './physics.js';
import { stageBand } from './stages.js';
import { HANDLING_MAX } from './handling.js';

export const SWING_LEAD = 30; // m: the swing into a pocket portal / a lane mouth
// m forward per m sideways for the world's best-steering plane at its top speed (see above).
export function steerRun(stage) {
  const P = flightParams(FLIGHT, { decay: 0 }, null, { band: stageBand(stage, BAND[9]), plane: stage.plane, modifiers: stage.modifiers, handling: HANDLING_MAX });
  return P.topSpeed / lateralCap(P, P.topSpeed);
}

// The container a gate sits in (null = the main line): { id, kind, d0, d1, xIn, xOut, mandatory, portal? }.
export function gateContainer(stage, terrain, g) {
  const C = terrain.cycle, lap = Math.floor(g.at / C), base = lap * C, dl = g.at - base, M = terrain.mega;
  for (const p of terrain.pockets ?? []) {
    if (dl >= p.start && dl <= p.end && Math.abs(g.x - p.cx) <= p.half) {
      return { id: `pocket:${p.name}@${lap}`, kind: 'pocket', d0: base + p.portal.d, d1: base + p.end + EXIT_PASSAGE, xIn: p.portal.x, xOut: p.exitX, mandatory: false, portal: base + p.portal.d };
    }
  }
  for (const c of stage.caverns ?? []) {
    if (dl >= c.mouth && dl <= c.exit && g.x >= c.laneMin && g.x <= c.laneMax) {
      const x = (c.laneMin + c.laneMax) / 2;
      return { id: `cavern:${c.start}@${lap}`, kind: 'cavern', d0: base + c.start, d1: base + c.end, xIn: x, xOut: x, mandatory: false };
    }
  }
  if (M) {
    for (const c of M.caves) if (g.at >= c.d0 && g.at <= c.d1 && g.x >= c.lane[0] && g.x <= c.lane[1]) { const x = (c.lane[0] + c.lane[1]) / 2; return { id: `cave:${c.name}`, kind: 'cave', d0: c.d0, d1: c.d1, xIn: x, xOut: x, mandatory: false }; }
    for (const h of M.halls) if (g.at >= h.d0 && g.at <= h.d1) return hallRoute(h);
  }
  return null;
}
const hallRoute = (h) => ({ id: `hall:${h.name}`, kind: 'hall', d0: h.d0, d1: h.d1, xIn: 0, xOut: 0, mandatory: true });

// The run-in a route B needs after route A lets go: B's entry must be at least this far past A's exit.
export const transferLead = (a, b, run) => (b.kind === 'hall' && a.kind === 'hall' ? 0 : run * Math.abs(a.xOut - b.xIn) + SWING_LEAD);

// Every mutually-exclusive pair (and every unreachable gate) on a stage → [{ a, b, why }] (empty = clean).
export function routeConflicts(stage, terrain, goals) {
  const out = [], routes = new Map(), run = steerRun(stage);
  for (const g of goals.gates) {
    const r = gateContainer(stage, terrain, g);
    if (!r) continue;
    if (!routes.has(r.id)) routes.set(r.id, { ...r, gates: [] });
    routes.get(r.id).gates.push(g.n);
    if (r.portal !== undefined && terrain.mega?.noPortal(r.portal)) out.push({ a: r.id, b: null, gates: [g.n], why: `portal at ${r.portal} m is switched off (next to a hall / cave)` });
  }
  for (const h of terrain.mega?.halls ?? []) { const r = hallRoute(h); if (!routes.has(r.id)) routes.set(r.id, { ...r, gates: [] }); }
  const list = [...routes.values()].sort((a, b) => a.d0 - b.d0);
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      if (!a.gates.length && !b.gates.length) continue; // two empty interiors: nothing to miss
      if (b.d0 >= a.d1 + transferLead(a, b, run)) continue;
      out.push({ a: a.id, b: b.id, gates: [...a.gates, ...b.gates], why: b.d0 < a.d1 ? 'their spans overlap' : `only ${Math.round(b.d0 - a.d1)} m to steer ${Math.round(Math.abs(a.xOut - b.xIn))} m across` });
    }
  }
  return out;
}
