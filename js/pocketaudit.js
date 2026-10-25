// v1.9 POCKET AUDIT (the owner, in Dragon War's side areas: entering or leaving a pocket "leads me straight
// into something I'm going to bump into right away"). The rule, enforced by a permanent test: every
// pocket's ENTRY and EXIT lanes are CLEAR — no solid / bonk obstacle, bumpable, shooter or terrain
// feature in them (the pocket's own dressing excepted):
//   · ENTRY: the 60 m before the mouth (the portal), on the portal's line (± 6 m, floor → portal top);
//   · EXIT: the exit passage (from the lane's end, the 75 m swing back to the corridor) and the 60 m
//     after it, on the swing's path (± 6 m, floor → 60 m).
// Every occurrence of every pocket (they are lap furniture) along the world's run. Pure (no DOM).
import { STAGES } from './stages.js';
import { makeTerrain } from './terrain.js';
import { uniqueRun } from './longrun.js';
import { pocketClearZones, CLEAR_LANE as LANE } from './pockets.js';
import { SHOOTER_NEAR } from './megarun.js';

export function pocketAudit(stageId, terrain = makeTerrain(STAGES[stageId])) {
  const st = STAGES[stageId], T = terrain, cyc = st.cycle, run = Math.max(uniqueRun(stageId), cyc);
  const out = [], seenAll = new Set(), seenObj = new Set(); // (each obstacle counted once)
  const shooters = T.mega?.shooters ?? [];
  const bumps = T.bumpables.filter((b) => b.pocket === undefined);
  for (const p of T.pockets) {
    for (let base = 0; base + p.portal.d < run; base += cyc) {
      if (T.mega?.noPortal(base + p.portal.d)) continue; // the portal is shut there (inside an interior or a cave)
      const zones = pocketClearZones(p).map((z) => ({ kind: z.kind, d0: base + z.d0, d1: base + z.d1, x: (d) => z.lineX(d - base), y1: z.top === null ? 60 : p.portalBase + z.top }));
      for (const z of zones) {
        const add = (what, d) => { if (!seenAll.has(what)) { seenAll.add(what); out.push({ pocket: p.id ?? p.name, zone: z.kind, d: Math.round(d), what }); } };
        for (let d = Math.max(0, z.d0); d <= z.d1; d += 2) {
          const cx = z.x(d);
          for (let x = cx - LANE; x <= cx + LANE; x += 2) {
            for (let y = T.surfaceAt(x, d, -Infinity) + 2; y <= Math.min(z.y1, 58); y += 4) {
              const h = T.hitTest(x, y, d, 0.6, 1.6, 0);
              if (h && !seenObj.has(h)) { seenObj.add(h); add(`solid:${h.kind ?? h.type ?? h.look ?? 'rock'}@${Math.round(h.d ?? d)}:${Math.round(h.x ?? h.cx ?? x)}`, d); }
            }
          }
        }
        for (const b of bumps) {
          const bl = b.tailLap !== undefined ? b.tailLap * cyc + b.d : null;
          for (let L = Math.floor(z.d0 / cyc); L <= Math.floor(z.d1 / cyc); L++) {
            const d = bl ?? L * cyc + b.d;
            if (d >= z.d0 && d <= z.d1 && Math.abs(b.x - z.x(d)) < LANE + b.r) add(`bumpable:${b.type}#${b.id}`, d); // (a lap bumpable counts once)
          }
        }
        for (const s of shooters) if (s.d >= z.d0 && s.d <= z.d1 && Math.abs(s.x) <= SHOOTER_NEAR) add(`shooter:${s.look ?? s.kind}@${s.d}`, s.d); // (beside the corridor, not out by the far landmarks)
      }
    }
  }
  return out;
}
