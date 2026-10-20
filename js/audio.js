// Tiny WebAudio synth blips. Silent until the first tap (iOS needs a gesture).
let ctx = null;

export function unlockAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    ctx = null;
  }
}

// The shared context (null until the first tap) — the music player plays through it too.
export const audioCtx = () => ctx;

function blip(type, f0, f1, dur, vol) {
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

// A short filtered-noise sweep (whooshes, swishes, rushes).
let noiseBuf = null;
function sweep(f0, f1, f2, dur, vol, q = 1) {
  if (!ctx || ctx.state !== 'running') return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.5);
  f.frequency.exponentialRampToValueAtTime(f2, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(t);
  src.stop(t + dur + 0.05);
}
const notes = (list, gap, type = 'triangle', vol = 0.14) =>
  list.forEach((f, i) => setTimeout(() => blip(type, f, f * 1.01, 0.16, vol), i * gap));

export const sfx = {
  coin: () => blip('triangle', 880, 1760, 0.12, 0.18),
  launch: () => blip('sine', 180, 720, 0.25, 0.25),
  bounce: () => blip('sine', 420, 160, 0.18, 0.25),
  bonk: () => blip('square', 300, 90, 0.3, 0.12),
  poing: () => blip('sine', 260, 1400, 0.35, 0.3),
  scrape: () => blip('sawtooth', 140, 90, 0.12, 0.06),
  cheer: () => { blip('triangle', 660, 990, 0.15, 0.18); setTimeout(() => blip('triangle', 990, 1320, 0.2, 0.18), 140); },
  whoosh: () => blip('sawtooth', 120, 520, 0.4, 0.05),
  splash: () => blip('triangle', 900, 120, 0.3, 0.12),
  // Bumpables: soft, silly voices (v0.6 part 2)
  squawk: () => { blip('sawtooth', 900, 500, 0.12, 0.07); setTimeout(() => blip('sawtooth', 1100, 600, 0.14, 0.07), 110); },
  pop: () => { blip('square', 1400, 200, 0.06, 0.1); sweep(2000, 800, 400, 0.15, 0.06, 0.8); },
  boing: () => blip('sine', 180, 720, 0.4, 0.2),
  beep: () => { blip('square', 1500, 1500, 0.06, 0.05); setTimeout(() => blip('square', 1900, 1900, 0.06, 0.05), 90); },
  honk: () => { blip('square', 320, 280, 0.15, 0.07); setTimeout(() => blip('square', 300, 260, 0.15, 0.07), 160); },
  // Skills + events (v0.6)
  tilt: () => { blip('square', 1800, 900, 0.03, 0.06); setTimeout(() => blip('triangle', 2400, 1600, 0.04, 0.08), 30); }, // click-snap
  loop: () => sweep(300, 1600, 350, 0.9, 0.09),          // rising-falling whoosh
  roll: () => sweep(900, 2600, 1200, 0.25, 0.07, 2),     // quick swish
  dive: () => sweep(900, 400, 160, 0.8, 0.08),           // deepening rush (one-shot; the held version is flightSound.dive)
  slot: () => notes([784, 988, 1175, 1568], 70),         // bright chime arpeggio
  loopRing: () => notes([659, 784, 988, 784, 1319], 95), // happy jingle
  speedGate: (speed = 30) => { const f = 700 + Math.min(1, speed / 70) * 900; blip('sine', f, f, 0.35, 0.16); }, // clean ding, pitched by speed
  chaChing: () => { blip('square', 1900, 1500, 0.05, 0.06); setTimeout(() => notes([1568, 2093], 60, 'triangle', 0.12), 60); },
  secret: () => { blip('triangle', 784, 1046, 0.12, 0.2); setTimeout(() => blip('triangle', 1046, 1568, 0.25, 0.2), 120); },
};
