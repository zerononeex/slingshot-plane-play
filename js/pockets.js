// SUB-AREA geometry (pure): the rectangles a pocket carves its floor into, lap-local.
// A = the entry passage (from the corridor edge out to the lane), B = the exit passage,
// C = the pocket lane itself. City blocks and decor keep out of them.
export const SWING = { time: 1.1, fovKick: 6, bankDeg: 60 };
export const CARVE_EDGE = 6; // m of soft blend at a rectangle's edge

export function pocketRects(p) {
  const s = Math.sign(p.cx), outer = Math.abs(p.cx) + p.half + CARVE_EDGE;
  const span = (a, b) => (s > 0 ? [a, b] : [-b, -a]);
  const [px0, px1] = span(22, outer);
  return [
    { d0: p.portal.d - 4, d1: p.portal.d + 75, x0: px0, x1: px1 },     // A: entry passage (fast planes swing far)
    { d0: p.end - 4, d1: p.end + 75, x0: px0, x1: px1 },               // B: exit passage
    { d0: p.start - 30, d1: p.end + 10, x0: p.cx - p.half - CARVE_EDGE, x1: p.cx + p.half + CARVE_EDGE }, // C: the lane
  ];
}
export const inRect = (r, x, dl, pad = 0) => dl > r.d0 - pad && dl < r.d1 + pad && x > r.x0 - pad && x < r.x1 + pad;
// 0 outside → 1 well inside (a soft blend over CARVE_EDGE metres).
export function rectWeight(r, x, dl) {
  const e = Math.min(dl - r.d0, r.d1 - dl, x - r.x0, r.x1 - x);
  if (e <= 0) return 0;
  const t = Math.min(1, e / CARVE_EDGE);
  return t * t * (3 - 2 * t);
}

// v1.9 POCKET CLEARANCE (the owner: entering or leaving a pocket "leads me straight into something I'm
// going to bump into right away"). Each pocket's two clear lanes, lap-local, on the game's own pocket
// geometry (pocketRects): the ENTRY lane = the 60 m before the mouth (the portal), on the portal's line;
// the EXIT lane = the exit passage (from the lane's end, the 75 m swing back to the corridor) and the
// 60 m after it, on the swing's path. lineX(dl) = the x flown there; CLEAR_LANE = metres either side.
export const POCKET_CLEAR = 60;
export const CLEAR_LANE = 6;
export const EXIT_PASSAGE = 75;
const smooth = (k) => k * k * (3 - 2 * k);
export function pocketClearZones(p) {
  return [
    { kind: 'entry', d0: p.portal.d - POCKET_CLEAR, d1: p.portal.d, lineX: () => p.portal.x, top: p.portal.h },
    { kind: 'exit', d0: p.end, d1: p.end + EXIT_PASSAGE + POCKET_CLEAR, lineX: (dl) => p.cx + (p.exitX - p.cx) * smooth(Math.min(1, Math.max(0, (dl - p.end) / EXIT_PASSAGE))), top: null },
  ];
}

// Move what stands in a pocket's clear lanes FORWARD, just past the lane (the pocket itself never
// moves). items = [{ d (absolute), r? }], cycle = the lap length. What follows a moved item within
// `tail` m moves with it (keeping its spacing: laser triplets, weave rows), so nothing piles up.
// Returns new objects (with `movedFrom` set on the moved ones); the order by d is kept.
export function shiftOutOfPockets(items, stage, cycle, { pad = 4, tail = 60, avoid = () => false, skip = () => false } = {}) {
  const zones = (stage.pockets ?? []).flatMap((p) => pocketClearZones(p));
  const zoneAt = (d, r) => {
    const lap = Math.floor(d / cycle);
    for (const L of [lap - 1, lap]) for (const z of zones) if (d + r > L * cycle + z.d0 - pad && d - r < L * cycle + z.d1 + pad) return L * cycle + z.d1;
    return null;
  };
  const out = [];
  let carry = 0, prevOrig = -Infinity;
  for (const it of [...items].sort((a, b) => a.d - b.d)) {
    if (skip(it)) { out.push(it); continue; }
    const r = it.r ?? 3;
    let d = it.d + (carry > 0 && it.d - prevOrig <= tail ? carry : 0);
    for (let k = 0; k < 6; k++) { const end = zoneAt(d, r); if (end === null && !avoid(d)) break; d = end !== null ? end + pad + r + 1 : d + 20; }
    carry = d - it.d; prevOrig = it.d;
    out.push(carry ? { ...it, d, movedFrom: it.d } : it);
  }
  return out;
}
