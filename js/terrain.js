// Pure terrain for a stage: one height function shared by the renderer and the
// physics, plus tunnel roofs and solid tree trunks.
//
// groundAt(x, d, y): ground height under (x, d). `y` matters only inside cavern
// tunnels: below the roof you stand on the tunnel floor, above it on the hill top.
// Leave y out (or -Infinity) for the floor; pass +Infinity for the top surface.
import { LAUNCH } from './config.js';
import { STAGES, DEFAULT_STAGE } from './stages.js';

export const DECK = { start: -8, end: 1.5, halfWidth: 2.2 };

const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const bump = (t) => (t >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * t)); // 1 at 0 → 0 at 1

export function makeTerrain(stage = STAGES[DEFAULT_STAGE], { deckHeight = LAUNCH.deckHeight, deckExtra = 0 } = {}) {
  const cycle = stage.cycle;
  const H = stage.hills;
  const deckStart = DECK.start - deckExtra;
  const local = (d) => (d >= cycle ? d % cycle : d);

  // Forest trunks (first lap coordinates; later laps wrap with `local`).
  const trunks = [];
  for (const f of stage.forests) {
    let i = 0;
    for (let d = f.from; d <= f.to; d += f.step, i++) {
      if (f.hero && Math.abs(d - f.hero.d) < f.step / 2) {
        trunks.push({ x: f.hero.x, d: f.hero.d, r: f.hero.radius, h: f.hero.height, hero: true });
      } else {
        trunks.push({ x: f.xs[i % f.xs.length], d, r: stage.trunk.radius, h: stage.trunk.height, hero: false });
      }
    }
  }

  function baseHills(x, d) {
    const ramp = smooth((d - stage.flatStart) / 100);
    if (ramp === 0) return 0;
    const n =
      0.5 * Math.sin(d * 0.021 + 1.3) * Math.cos(x * 0.045) +
      0.3 * Math.sin(d * 0.0063 + x * 0.031) +
      0.2 * Math.sin(d * 0.047 - x * 0.07 + 2.1);
    const amp = H.centerHeight + (H.sideHeight - H.centerHeight) * smooth((Math.abs(x) - H.centerHalfWidth) / 30);
    return ramp * amp * (0.5 + 0.5 * n) * smooth((150 - Math.abs(x)) / 30); // fade out at the world's side edges
  }

  function cavernAt(x, dl) {
    for (const c of stage.caverns) {
      if (dl < c.start - 40 || dl > c.end + 40) continue;
      // Profile along d: rise to the mouth, plateau over the tunnel, fall after the exit.
      const h = dl < c.mouth ? smooth((dl - c.start) / (c.mouth - c.start))
        : dl <= c.exit ? 1 : smooth((c.end - dl) / (c.end - c.exit));
      const zone = smooth((dl - (c.start - 40)) / 40) * smooth((c.end + 40 - dl) / 40) * smooth((-x - 4) / 6);
      const laneMax = c.alcove && dl >= c.alcove.from && dl <= c.alcove.to ? c.alcove.laneMax : c.laneMax;
      const inLane = x >= c.laneMin - 1 && x <= laneMax && dl >= c.start && dl <= c.end;
      const edge = smooth((c.edge - x) / 4) * smooth((x + 95) / 30);
      return { c, zone, inLane, hill: c.height * h * edge, top: c.height * h };
    }
    return null;
  }

  function featuresAt(x, d, y) {
    const dl = local(d);
    let g = baseHills(x, d);
    const cav = cavernAt(x, dl);
    if (cav) {
      g *= 1 - cav.zone;
      if (cav.inLane) {
        // Tunnel lane: floor below the roof, hill top above it.
        const roofed = dl >= cav.c.mouth && dl <= cav.c.exit;
        if (roofed && y >= cav.c.roof) g += cav.top;
      } else {
        g += cav.hill;
      }
    }
    for (const b of stage.bigHills) {
      const r = Math.hypot((x - b.x) / b.rx, (dl - b.d) / b.rd);
      if (r < 1) g += b.height * bump(r);
    }
    for (const t of stage.ditches) {
      const u = Math.abs(dl - t.d) / t.halfLength;
      if (u < 1) g -= t.depth * bump(u) * smooth((120 - Math.abs(x)) / 20);
    }
    for (const p of stage.pits) {
      const r = Math.hypot(x - p.x, dl - p.d) / p.radius;
      if (r < 1) g -= p.depth * bump(r);
    }
    return g;
  }

  function groundAt(x, d, y = -Infinity) {
    if (d >= deckStart && d <= DECK.end && Math.abs(x) <= DECK.halfWidth) return deckHeight;
    return featuresAt(x, d, y);
  }

  // Tunnel roof height (only inside a tunnel lane), else Infinity.
  function ceilingAt(x, d) {
    const dl = local(d);
    for (const c of stage.caverns) {
      if (dl < c.mouth || dl > c.exit) continue;
      const laneMax = c.alcove && dl >= c.alcove.from && dl <= c.alcove.to ? c.alcove.laneMax : c.laneMax;
      if (x >= c.laneMin - 1 && x <= laneMax) return c.roof;
    }
    return Infinity;
  }

  // Solid obstacles: a trunk hit returns the trunk, else null.
  function hitTest(x, y, d, radius = 0.6) {
    const dl = local(d);
    for (const t of trunks) {
      if (Math.abs(t.d - dl) > t.r + radius) continue;
      if (Math.hypot(t.x - x, t.d - dl) > t.r + radius) continue;
      if (y < featuresAt(t.x, t.d, -Infinity) + t.h) return t;
    }
    return null;
  }

  // surfaceAt = the ground without the launch deck (what the terrain mesh draws).
  return { stage, groundAt, surfaceAt: featuresAt, ceilingAt, hitTest, trunks, local, deckStart, deckHeight, cycle };
}

// Default Plains terrain with the stock ramp (handy for tests and the title scene).
const plainsDefault = makeTerrain();
export const groundAt = plainsDefault.groundAt;
