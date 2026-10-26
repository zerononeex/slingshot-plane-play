// v1.5 LOOP DOORS — shared by the mega-stages. A Loop Door blocks a chokepoint (the whole corridor,
// above the ceiling). KEY RINGS (owner playtest 2026-10-25: "the loop to get the key is a little too
// difficult" at mega-stage speeds): no loop any more — ONE giant gold KEY RING (radius KEY.R, the key
// floating at its centre) stands off the corridor's centreline at least KEY.runway m before its door.
// Flying through its disc collects the key and the door starts opening on the spot (it is wide open long
// before a plane at full speed arrives); the stretch from the ring to the door is a clear lane (megarun.js
// clears it). Missing the ring is the player's problem: arriving unopened is the heaviest bonk in the
// game (× 0.4 + shake) and the door grinds open over 1.5 s — the flight always goes on. The circle of
// coins ahead of the door stays (coins only). Door + key state is per flight (s.hz.doors), never saved.
// Pure data + maths (no DOM / three.js).
import { SKILLS } from './physics.js';

export const DOOR = {
  keep: 0.4,        // the unopened-door bonk: speed × 0.4 (BONK keeps 0.55)
  shake: 1,         // the biggest screen shake in the game
  grind: 1.5,       // s for a bonked door to grind open
  open: 0.7,        // s for a keyed door to slide open (with the fanfare)
  half: 30,         // the door spans x ±30 (the corridor is ±26)
  top: 80,          // and reaches above the 60 m ceiling: no flying over it
  depth: 3,
};
// The giant KEY RING: radius R (a coin ring is a few metres), at least `runway` m before its door, off the
// centreline by at least `offCentre` of the corridor's half-width; `clear` m in front of it stay clear too.
export const KEY = { R: 25, runway: 1000, offCentre: 0.4, clear: 100 };
// The coin circle ahead of each door (centre = its mark, R = DOOR_LOOP_R) — coins only.
export const DOOR_LOOP_R = SKILLS.loopRadius(60);
export const LOOP_R_MIN = SKILLS.loopRadius(0);

// The circle of coins ahead of the door (centre = the mark, R = DOOR_LOOP_R).
export function loopCircleCoins(door, n = 16) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2;
    out.push({ x: door.x, y: door.y + DOOR_LOOP_R * (1 - Math.cos(th)), d: door.loopD + DOOR_LOOP_R * Math.sin(th) });
  }
  return out;
}

// Did the step (x0, y0, d0) → (x1, y1, d1) cross the door's key ring disc? (door.key = { d, x, y })
export function keyRingCrossed(door, x0, y0, d0, x1, y1, d1) {
  const k = door.key;
  if (!(d0 < k.d && d1 >= k.d)) return false;
  const f = (k.d - d0) / Math.max(1e-6, d1 - d0);
  return Math.hypot(x0 + (x1 - x0) * f - k.x, y0 + (y1 - y0) * f - k.y) <= KEY.R;
}

// Per-flight door state: 0 closed · 1 opened by the keys · 2 grinding open after a bonk. t = when.
export const createDoorStates = (doors) => doors.map(() => ({ state: 0, t: 0 }));
// How open a door is (0 shut → 1 wide) at flight time t (the view reads this).
export function doorOpenness(st, t) {
  if (st.state === 0) return 0;
  return Math.min(1, (t - st.t) / (st.state === 1 ? DOOR.open : DOOR.grind));
}

// Through a shut door's key ring: the key is collected and the door starts opening this instant.
export function crossKeys(doors, states, s, x0, y0, d0) {
  for (let i = 0; i < doors.length; i++) {
    if (states[i].state !== 0 || !keyRingCrossed(doors[i], x0, y0, d0, s.x, s.y, s.d)) continue;
    states[i].state = 1; states[i].t = s.time;
    s.events.push('keyRing', 'doorOpen');
  }
}

// The plane crossing a door plane between dPrev and s.d: an open door is a clean pass; a shut one
// is the heaviest bonk (× 0.4 + shake) and starts grinding open — the plane carries on through.
export function crossDoors(doors, states, s, P, dPrev) {
  for (let i = 0; i < doors.length; i++) {
    const door = doors[i];
    if (!(dPrev < door.d && s.d >= door.d) || Math.abs(s.x) > DOOR.half) continue;
    const st = states[i];
    if (st.state !== 0) { s.events.push('doorPass'); continue; }
    st.state = 2; st.t = s.time;
    s.speed = Math.max(P.minAirSpeed, s.speed * DOOR.keep);
    s.shake = Math.max(s.shake ?? 0, DOOR.shake);
    s.doorBonks = (s.doorBonks ?? 0) + 1;
    s.lastBonk = 'door';
    s.events.push('doorBonk');
  }
}
