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

export const sfx = {
  coin: () => blip('triangle', 880, 1760, 0.12, 0.18),
  launch: () => blip('sine', 180, 720, 0.25, 0.25),
  bounce: () => blip('sine', 420, 160, 0.18, 0.25),
  bonk: () => blip('square', 300, 90, 0.3, 0.12),
  poing: () => blip('sine', 260, 1400, 0.35, 0.3),
  scrape: () => blip('sawtooth', 140, 90, 0.12, 0.06),
  cheer: () => { blip('triangle', 660, 990, 0.15, 0.18); setTimeout(() => blip('triangle', 990, 1320, 0.2, 0.18), 140); },
  secret: () => { blip('triangle', 784, 1046, 0.12, 0.2); setTimeout(() => blip('triangle', 1046, 1568, 0.25, 0.2), 120); },
};
