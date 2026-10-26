// v2.1 WATERFALL GUIDE RINGS (owner playtest 2026-10-25: "it is sometimes hard to tell where I can go through
// a waterfall safely — maybe a row of rings that leads me to the safe path"). Pure DECORATION: a row of soft
// white-cyan rings tracing each waterfall passage's safe line in and out. They pay nothing, collect nothing and
// trigger nothing (the physics never reads them); a little smaller than a coin ring (r 3) so nobody mistakes
// them for pickups. Spaced GUIDE.gap m apart, so the next one is always in view at speed. Pure (no three.js).
import { pocketClearZones, EXIT_PASSAGE } from './pockets.js';

export const GUIDE = { r: 2.4, gap: 30, color: 0xbff6ff };
// The pocket looks that hide their lane behind falls (Sky Islands' WATERFALL GROTTO, Star Fox's WATERFALL HIDEOUT).
export const WATERFALL_POCKET_LOOKS = ['grotto', 'waterfallHideout'];
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (k) => { const t = Math.min(1, Math.max(0, k)); return t * t * (3 - 2 * t); };

// A falls CAVE (megarun caves with `falls`): the approach drops in to the cave lane's centre, low; through the
// curtain at its mouth, along the tunnel under the roof, and out past the far mouth. Absolute metres.
// surface(x, d) = the ground. → [{ x, y, d, r, passage }]
export function caveGuideRings(cave, surface) {
  const cx = (cave.lane[0] + cave.lane[1]) / 2, out = [];
  const lowY = Math.min(cave.cruise, cave.roof - GUIDE.r - 2);
  for (let d = cave.d0 - 150; d <= cave.d1 + 30; d += GUIDE.gap) {
    const k = smooth((d - (cave.d0 - 150)) / 130);                   // ease in to the lane over the run-in
    const x = d > cave.d1 ? lerp(cx, cx * 0.75, smooth((d - cave.d1) / 30)) : lerp(cx * 0.5, cx, k);
    const y = Math.max(d < cave.d0 ? lerp(lowY + 6, lowY, k) : lowY, surface(x, d) + GUIDE.r + 1.5);
    out.push({ x, y, d, r: GUIDE.r, passage: cave.name });
  }
  return out;
}

// A waterfall POCKET: along the corridor to its portal (the pocket audit's ENTRY lane), down the lane between the
// falls, and back out along the EXIT swing. Lap-local metres (the pocket repeats every lap).
export function pocketGuideRings(p, surface) {
  const [entry, exit] = pocketClearZones(p), out = [];
  const lineX = (d) => (d <= p.portal.d ? entry.lineX(d) : d < p.start ? lerp(p.portal.x, p.cx, smooth((d - p.portal.d) / (p.start - p.portal.d))) : d <= p.end ? p.cx : exit.lineX(d));
  const h = (d) => (d <= p.portal.d ? Math.max(5, p.portal.w / 2 + 0.6) : d <= p.end ? 6 : 7);
  for (let d = entry.d0; d <= p.end + EXIT_PASSAGE; d += GUIDE.gap) { const x = lineX(d); out.push({ x, y: surface(x, d) + h(d), d, r: GUIDE.r, passage: p.name }); }
  return out;
}

// Every waterfall passage a stage has: { lap: lap-local rings (pockets), abs: absolute rings (mega caves) }.
export function guideRingsFor(stage, surface, mega = null) {
  const lap = (stage.pockets ?? []).filter((p) => WATERFALL_POCKET_LOOKS.includes(p.look)).flatMap((p) => pocketGuideRings(p, surface));
  const abs = (mega?.caves ?? []).filter((c) => c.falls).flatMap((c) => caveGuideRings(c, surface));
  return { lap, abs };
}
