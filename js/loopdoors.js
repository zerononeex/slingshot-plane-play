// v1.5 LOOP DOORS — shared by the mega-stages. A Loop Door blocks a chokepoint (the whole corridor,
// above the ceiling). Ahead of it a LOOP CIRCLE of coins marks the move, with two glowing KEY RINGS:
// one at the BOTTOM of the circle and one at the TOP, placed with the real loop geometry from
// physics.js (a loop started at (d0, y0) runs d = d0 + R sin θ, y = y0 + R (1 − cos θ): its top is
// straight above its start, 2R up). One full LOOP through both opens the door in advance (fanfare);
// arriving unopened is the heaviest bonk in the game (× 0.4 + shake) and the door grinds open over
// 1.5 s — the flight always goes on. Door + key state is per flight (s.hz.doors), never saved.
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
  // The KEY RINGS are long glowing capsules along d (a loop at 150 m/s is a split-second
  // decision, so the window is generous): a loop started anywhere from `before` m short of the
  // circle's mark to `after` m past it, at the bottom ring's height (± keyR), threads both.
  keyR: 4.5, before: 18, after: 46,
};
// The loop radius depends on speed (R = 7 + 0.1 v, 8 → 13 m): the circle of coins is drawn for a fast
// plane (13 m), and the TOP key is tall enough to catch the top of any loop (2 × 8 → 2 × 13 m up).
export const DOOR_LOOP_R = SKILLS.loopRadius(60);
export const LOOP_R_MIN = SKILLS.loopRadius(0);

// door = { id, d (the door plane), loopD (the circle's mark), x (lane), y (bottom key height, absolute) }
// → the two key rings { key: 'bottom' | 'top', x, y, d0, d1 } (capsules along d).
export function keyRings(door) {
  const d0 = door.loopD - DOOR.before, d1 = door.loopD + DOOR.after;
  return [
    { key: 'bottom', x: door.x, y: door.y, y0: door.y - DOOR.keyR, y1: door.y + DOOR.keyR, d0, d1 },
    { key: 'top', x: door.x, y: door.y + LOOP_R_MIN + DOOR_LOOP_R, y0: door.y + 2 * LOOP_R_MIN - DOOR.keyR, y1: door.y + 2 * DOOR_LOOP_R + DOOR.keyR, d0, d1 },
  ];
}
// The loop circle of coins that marks the move (centre = the mark, R = DOOR_LOOP_R).
export function loopCircleCoins(door, n = 16) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2;
    out.push({ x: door.x, y: door.y + DOOR_LOOP_R * (1 - Math.cos(th)), d: door.loopD + DOOR_LOOP_R * Math.sin(th) });
  }
  return out;
}

// Which key ring (if any) the point is inside.
export function keyRingHit(door, x, y, d) {
  if (d < door.loopD - DOOR.before - DOOR.keyR || d > door.loopD + DOOR.after + DOOR.keyR) return null;
  if (Math.abs(x - door.x) > DOOR.keyR) return null;
  if (Math.abs(y - door.y) < DOOR.keyR) return 'bottom';
  if (y > door.y + 2 * LOOP_R_MIN - DOOR.keyR && y < door.y + 2 * DOOR_LOOP_R + DOOR.keyR) return 'top';
  return null;
}

// Per-flight door state: 0 closed · 1 opened by the keys · 2 grinding open after a bonk. t = when.
export const createDoorStates = (doors) => doors.map(() => ({ state: 0, t: 0 }));
// How open a door is (0 shut → 1 wide) at flight time t (the view reads this).
export function doorOpenness(st, t) {
  if (st.state === 0) return 0;
  return Math.min(1, (t - st.t) / (st.state === 1 ? DOOR.open : DOOR.grind));
}

// A finished loop: every door whose BOTH key rings it threaded slides open in advance.
export function openByLoop(doors, states, keys, s) {
  for (let i = 0; i < doors.length; i++) {
    if (states[i].state !== 0 || !keys.has(`${i}:bottom`) || !keys.has(`${i}:top`)) continue;
    states[i].state = 1; states[i].t = s.time;
    s.events.push('doorOpen');
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
