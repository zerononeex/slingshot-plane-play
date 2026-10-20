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
