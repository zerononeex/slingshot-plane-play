// v1.9 RING SETS PAY (the owner: "I fly through all the rings and nothing happens"). The yellow hoop
// lines (the `hoops` set pieces: n rings in a zig-zag) are FORMATIONS: per flight, passing through a
// ring's opening marks it; marking every ring of a formation pays +30 coins (into the flight's coins,
// the normal way) with a "RING SET!" banner and a jingle — once per flight per formation. The coins
// inside the rings keep paying one by one as before; a partial set pays nothing extra. Everything
// resets next flight (like the boost shapes). Pure data + maths (no DOM / three.js).
import { setPiecesFor } from './longrun.js';

export const RING_SET_PAY = 30;
export const HOOP_R = 3.4; // the opening (the drawn hoop's tube centre is at 3.6 m)

// The world's formations: { id, rings: [{ x, y (abs), d }] }, sorted by the first ring's d.
// floor(x, d) = the floor height there (the same floor the view and the coins use).
export function ringSetsFor(stageId, floor) {
  return setPiecesFor(stageId).filter((p) => p.kind === 'hoops').map((p) => {
    const base = floor(p.x, p.d) + p.y;
    return { id: p.id, rings: Array.from({ length: p.n }, (_, k) => ({ x: p.x + (k % 2 ? p.zig : -p.zig), y: base + (k % 2 ? 2 : 0), d: p.d + k * p.gap })) };
  }).sort((a, b) => a.rings[0].d - b.rings[0].d);
}

// One flight's state: the rings marked per formation, the formations paid, a scan cursor.
export const createRingSetRun = () => ({ marked: new Map(), paid: new Set(), i0: 0 });

// Step from d0 to d1 at (x, y): returns events { type: 'ringSet', id, coins } for the sets completed now.
export function stepRingSets(run, sets, d0, x, y, d1, out = []) {
  if (!sets || d1 <= d0) return out;
  while (run.i0 < sets.length && sets[run.i0].rings.at(-1).d < d0 - 1) run.i0++;
  for (let i = run.i0; i < sets.length && sets[i].rings[0].d <= d1; i++) {
    const S = sets[i];
    if (run.paid.has(S.id)) continue;
    S.rings.forEach((r, k) => {
      if (!(d0 < r.d && d1 >= r.d) || Math.hypot(x - r.x, y - r.y) >= HOOP_R) return;
      let m = run.marked.get(S.id);
      if (!m) run.marked.set(S.id, (m = new Set()));
      m.add(k);
    });
    if ((run.marked.get(S.id)?.size ?? 0) === S.rings.length) { run.paid.add(S.id); out.push({ type: 'ringSet', id: S.id, coins: RING_SET_PAY }); }
  }
  return out;
}
