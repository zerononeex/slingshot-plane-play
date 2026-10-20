// Flight sounds, all synthesized (no files): engine loop (propeller putter, jet turbine or
// starship hum), wind, and a soft bank whoosh. Quiet by design: every loop's gain is capped
// far below the music's 0.5. The voice math is pure so tests can check it.

export const SPEED_FULL = 70;   // m/s where the loops reach full character
export const PROP_MAX = 0.06;   // gain caps (the music plays at 0.5)
export const WIND_MAX = 0.07;
export const TURBINE_MAX = 0.035;
export const HUM_MAX = 0.06;
export const WHOOSH_DEG = 25;   // bank angle that triggers a whoosh
export const WHOOSH_REARM_DEG = 18;
export const WHOOSH_GAP_MS = 250;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const unit = (speed) => clamp01(speed / SPEED_FULL);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

// Propeller putter: a filtered sawtooth whose amplitude wobbles at `rate` Hz.
// The Barnstormer biplane (deep) putters a little lower and slower.
export function propVoice(speed, deep = false) {
  const u = unit(speed), k = deep ? 0.78 : 1;
  return {
    gain: PROP_MAX * (0.55 + 0.45 * u) * smooth(0, 3, speed),
    rate: (14 + 34 * u) * k,
    freq: (55 + 45 * u) * k,
    cutoff: 380 + 520 * u,
  };
}

// Wind: filtered noise, near-silent below 8 m/s, clearly there at full speed.
export function windVoice(speed) {
  const u = unit(speed);
  return { gain: WIND_MAX * smooth(8, SPEED_FULL, speed) ** 1.3, cutoff: 300 + 2700 * u };
}

// Jet (Sky Dart): a smooth turbine whine whose pitch follows speed.
export function turbineVoice(speed) {
  const u = unit(speed);
  return { gain: TURBINE_MAX * (0.4 + 0.6 * u) * smooth(0, 3, speed), freq: 600 + 1400 * u };
}

// Starship: a low soft hum with a shimmer on top.
export function humVoice(speed) {
  const u = unit(speed);
  const on = smooth(0, 3, speed);
  return { gain: HUM_MAX * (0.5 + 0.5 * u) * on, freq: 55 + 25 * u, shimmerGain: 0.012 * u * on, shimmerFreq: 900 + 600 * u };
}

// Bank whoosh gate: fires once each time |bank| passes WHOOSH_DEG (re-arms below
// WHOOSH_REARM_DEG), never closer than WHOOSH_GAP_MS. Returns -1 (left), 1 (right) or 0.
export function newWhooshGate() { return { armed: true, last: -Infinity }; }
export function whooshGate(g, bankDeg, nowMs) {
  const a = Math.abs(bankDeg);
  if (a < WHOOSH_REARM_DEG) g.armed = true;
  if (!g.armed || a < WHOOSH_DEG || nowMs - g.last < WHOOSH_GAP_MS) return 0;
  g.armed = false;
  g.last = nowMs;
  return bankDeg < 0 ? -1 : 1;
}

// The live graph. getCtx() returns the shared AudioContext (null before the first tap).
export function createFlightSound(getCtx) {
  let ctx = null, nodes = null, kind = null, deep = false, noise = null, diving = false;
  const gate = newWhooshGate();

  function noiseBuffer() {
    if (noise) return noise;
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    let seed = 1;
    for (let i = 0; i < d.length; i++) { seed = (seed * 16807) % 2147483647; d[i] = (seed / 2147483647) * 2 - 1; }
    return noise;
  }

  function osc(type, f) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; return o; }
  function gain(v = 0) { const g = ctx.createGain(); g.gain.value = v; return g; }
  function filter(type, f) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; return b; }

  function build() {
    const out = gain(1);
    out.connect(ctx.destination);
    const n = { out, sources: [] };
    // wind
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer();
    src.loop = true;
    n.windFilter = filter('lowpass', 300);
    n.windGain = gain(0);
    src.connect(n.windFilter).connect(n.windGain).connect(out);
    n.sources.push(src);
    // dive rush (silent until a DIVE is held)
    const dsrc = ctx.createBufferSource();
    dsrc.buffer = noiseBuffer();
    dsrc.loop = true;
    n.diveFilter = filter('lowpass', 900);
    n.diveGain = gain(0);
    dsrc.connect(n.diveFilter).connect(n.diveGain).connect(out);
    n.sources.push(dsrc);
    // engine
    if (kind === 'turbine') {
      n.tA = osc('sine', 600); n.tB = osc('triangle', 603);
      n.engGain = gain(0);
      n.tA.connect(n.engGain); n.tB.connect(n.engGain);
      n.engGain.connect(out);
      n.sources.push(n.tA, n.tB);
    } else if (kind === 'hum') {
      n.hum = osc('sine', 55); n.engGain = gain(0);
      n.shim = osc('sine', 900); n.shimGain = gain(0);
      n.shimLfo = osc('sine', 5.5); const depth = gain(0.006);
      n.shimLfo.connect(depth).connect(n.shimGain.gain);
      n.hum.connect(n.engGain).connect(out);
      n.shim.connect(n.shimGain).connect(out);
      n.sources.push(n.hum, n.shim, n.shimLfo);
    } else {
      n.saw = osc('sawtooth', 55);
      n.propFilter = filter('lowpass', 400);
      n.wobble = gain(0.5);                 // amplitude wobble = the putter
      n.lfo = osc('square', 14); const depth = gain(0.5);
      n.lfo.connect(depth).connect(n.wobble.gain);
      n.engGain = gain(0);
      n.saw.connect(n.propFilter).connect(n.wobble).connect(n.engGain).connect(out);
      n.sources.push(n.saw, n.lfo);
    }
    for (const s of n.sources) s.start();
    return n;
  }

  const set = (param, v, t) => param.setTargetAtTime(v, t, 0.08);

  return {
    // Launch: kind = 'prop' | 'turbine' | 'hum'; deep = biplane putter.
    start(k = 'prop', opts = {}) {
      ctx = getCtx();
      if (!ctx || ctx.state !== 'running') return;
      this.stop(true);
      kind = k; deep = !!opts.deep;
      try { nodes = build(); } catch { nodes = null; }
    },
    // Every frame while flying (speed m/s; bank degrees, + = right).
    update(speed, bankDeg = 0) {
      if (!nodes) return;
      const t = ctx.currentTime;
      const w = windVoice(speed);
      set(nodes.windGain.gain, w.gain, t);
      set(nodes.windFilter.frequency, w.cutoff, t);
      if (kind === 'turbine') {
        const v = turbineVoice(speed);
        set(nodes.engGain.gain, v.gain, t); set(nodes.tA.frequency, v.freq, t); set(nodes.tB.frequency, v.freq * 1.005, t);
      } else if (kind === 'hum') {
        const v = humVoice(speed);
        set(nodes.engGain.gain, v.gain, t); set(nodes.hum.frequency, v.freq, t);
        set(nodes.shimGain.gain, v.shimmerGain, t); set(nodes.shim.frequency, v.shimmerFreq, t);
      } else {
        const v = propVoice(speed, deep);
        set(nodes.engGain.gain, v.gain, t); set(nodes.lfo.frequency, v.rate, t);
        set(nodes.saw.frequency, v.freq, t); set(nodes.propFilter.frequency, v.cutoff, t);
      }
      if (diving) { set(nodes.diveGain.gain, 0.05, t); nodes.diveFilter.frequency.setTargetAtTime(160, t, 0.6); } // deepens while held
      else { set(nodes.diveGain.gain, 0, t); set(nodes.diveFilter.frequency, 900, t); }
      const dir = whooshGate(gate, bankDeg, t * 1000);
      if (dir) this.whoosh(dir, speed);
    },
    // DIVE skill: a rushing layer that deepens for as long as it is held.
    dive(on) { diving = !!on; },
    // A short soft whoosh panned toward the turn.
    whoosh(dir, speed = 30) {
      if (!ctx || ctx.state !== 'running') return;
      const t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer();
      const f = filter('bandpass', 500);
      f.Q.value = 1.2;
      f.frequency.setValueAtTime(400, t);
      f.frequency.exponentialRampToValueAtTime(1400 + speed * 10, t + 0.18);
      f.frequency.exponentialRampToValueAtTime(500, t + 0.38);
      const g = gain(0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.12);
      g.gain.linearRampToValueAtTime(0, t + 0.4);
      let tail = g;
      if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = 0.7 * dir; g.connect(p); tail = p; }
      src.connect(f).connect(g);
      tail.connect(ctx.destination);
      src.start(t, Math.random());
      src.stop(t + 0.45);
    },
    // Landing / crash / leaving the flight: fade out and release the graph.
    stop(now = false) {
      if (!nodes) return;
      const n = nodes, t = ctx.currentTime, fade = now ? 0.02 : 0.35;
      nodes = null;
      n.out.gain.setTargetAtTime(0, t, fade / 3);
      for (const s of n.sources) { try { s.stop(t + fade + 0.05); } catch { /* already stopped */ } }
    },
    get running() { return !!nodes; },
    get kind() { return nodes ? kind : null; },
  };
}
