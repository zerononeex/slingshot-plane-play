// v2.2 PRESS-AND-HOLD DESCRIPTIONS (owner 2026-10-25: "press and hold upgrades to see what they do"). One plain,
// kid-readable line per purchasable shop line: what it changes, in words a kid reads at a glance. Keys are the
// shop cards' own keys (track:band, fun:horn, part:tail, eject, paint). Pure data (no DOM).
export const DESCRIPTIONS = {
  'track:band': 'A stronger launch and a higher top speed. Boost gets stronger too.',
  'track:engine': 'Your propeller wastes less speed — you glide farther.',
  'track:tank': 'More boost fuel — boost for longer.',
  'track:ramp': 'A taller, steeper launch pad — you start higher and fly farther.',
  'track:magnet': 'Coins fly to you from farther away.',
  'track:wheels': 'Bouncier wheels — you keep more speed when you bounce on the ground.',
  'track:handling': 'Your plane turns and climbs faster when you steer.',
  eject: 'Adds an EJECT button — pop out and parachute down for bonus coins.',
  'fun:radar': 'Beeps when a secret is close — helps you find hidden treasure.',
  'fun:horn': 'A HORN button for silly honks (and confetti at the top levels).',
  'fun:chute': 'A bigger parachute — your pilot floats down slower and steers better.',
  'fun:brakes': 'A BRAKE button that slows you down without ever stalling.',
  'fun:balloons': 'Balloons lift you a little — you sink slower when you glide.',
  'part:leftWing': 'Your first wing — it lifts you up (but one wing pulls you left!).',
  'part:rightWing': 'The second wing — balanced flying and even more lift.',
  'part:tail': 'A tail — steadier, quicker flying.',
  paint: 'A new colour for your plane — looks only, it does not change how you fly.',
};
// The description for a shop card key (paints share one line).
export const describe = (key) => DESCRIPTIONS[key] ?? (key.startsWith('paint:') ? DESCRIPTIONS.paint : null);
// The title hangar chips' ids → the same lines.
export const chipDescription = (id) => describe(id === 'band' || id === 'engine' ? `track:${id}` : `part:${id}`);
// How long a press must last to show the description instead of buying.
export const HOLD_MS = 350;
