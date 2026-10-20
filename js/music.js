// Music player: the owner drops MP3s into site/assets/music/ — nothing is shipped.
//   menu.mp3              home / upgrades / results
//   flight-<world>-1/2/3  in flight, that world: ROTATES (a different one each flight; v0.6 part 2)
//   flight-<world>.mp3    in flight, that world (single song)
//   space.mp3             in flight, Space
//   flight.mp3            in flight, every world
// A missing file = silence: no errors thrown, the game never waits for music.
export const MUSIC_DIR = 'assets/music/';
export const MUSIC_VOLUME = 0.5;
export const CROSSFADE_S = 0.6;

// Which files a context may use, best first (pure, testable).
export function trackCandidates(context, stageId) {
  if (context === 'flight') return [`flight-${stageId}.mp3`, ...(stageId === 'space' ? ['space.mp3'] : []), 'flight.mp3'];
  return ['menu.mp3']; // home, shop, results, pause screens
}

// The file a context plays given the files that exist (a Set or a has() function), or null = silence.
export function resolveTrack(context, stageId, available) {
  const has = typeof available === 'function' ? available : (f) => available.has(f);
  return trackCandidates(context, stageId).find(has) ?? null;
}

// ROTATION (pure). `has(file)` = which files exist; lastIndex = the numbered song played last
// in this world (1–3, or null). Returns { file, index } (index = the numbered song, or null).
export const ROTATION = [1, 2, 3];
export function pickFlightTrack(worldId, available, lastIndex = null) {
  const has = typeof available === 'function' ? available : (f) => available.has(f);
  const numbered = ROTATION.filter((n) => has(`flight-${worldId}-${n}.mp3`));
  if (numbered.length) {
    // The next existing song after the last one (cyclic) — never the same twice in a row.
    const next = numbered.find((n) => n > (lastIndex ?? 0)) ?? numbered[0];
    return { file: `flight-${worldId}-${next}.mp3`, index: next };
  }
  return { file: resolveTrack('flight', worldId, has), index: null };
}

// The player: WebAudio buffer sources (seamless loops) + gain crossfades.
// rotation = { get(worldId) → last index, set(worldId, index) } (persisted in prefs by the game).
export function createMusic(getCtx, base = MUSIC_DIR, rotation = null) {
  const cache = new Map(); // file → Promise<AudioBuffer|null>
  let enabled = true;
  let want = null;         // { context, stageId } most recently asked for
  let playing = null;      // { file, src, gain }
  let token = 0;

  const probes = new Map(); // worldId → Set of numbered files that exist (null while probing)
  function load(file) {
    if (!cache.has(file)) {
      const ctx = getCtx();
      if (!ctx) return Promise.resolve(null); // no audio yet: try again later (not cached)
      cache.set(file, fetch(base + file)
        .then((r) => (r.ok ? r.arrayBuffer() : null))
        .then((buf) => (buf && ctx ? ctx.decodeAudioData(buf) : null))
        .catch(() => null)); // missing / unreadable = silence
    }
    return cache.get(file);
  }

  function fadeOut(p) {
    const ctx = getCtx();
    if (!p || !ctx) return;
    const t = ctx.currentTime;
    p.gain.gain.cancelScheduledValues(t);
    p.gain.gain.setValueAtTime(p.gain.gain.value, t);
    p.gain.gain.linearRampToValueAtTime(0, t + CROSSFADE_S);
    try { p.src.stop(t + CROSSFADE_S + 0.05); } catch { /* already stopped */ }
  }

  // Probe a world's three numbered songs once per session, in the background (never waited on).
  function prepare(worldId) {
    const ctx = getCtx();
    if (!ctx || ctx.state !== 'running' || probes.has(worldId)) return;
    probes.set(worldId, null);
    Promise.all(ROTATION.map((n) => load(`flight-${worldId}-${n}.mp3`).then((b) => (b ? `flight-${worldId}-${n}.mp3` : null))))
      .then((found) => probes.set(worldId, new Set(found.filter(Boolean))));
  }

  // What this flight plays: a rotating numbered song if the probe found any, else the chain.
  function flightList(worldId) {
    const found = probes.get(worldId);
    if (!found || !found.size) return trackCandidates('flight', worldId);
    const pick = pickFlightTrack(worldId, found, rotation?.get(worldId) ?? null);
    if (pick.index) rotation?.set(worldId, pick.index);
    return [pick.file, ...trackCandidates('flight', worldId)];
  }

  async function update() {
    const my = ++token;
    const ctx = getCtx();
    if (!enabled || !want || !ctx || ctx.state !== 'running') { fadeOut(playing); playing = null; return; }
    let file = null, buffer = null;
    for (const f of want.list ?? trackCandidates(want.context, want.stageId)) {
      const b = await load(f);
      if (my !== token) return; // a newer request won
      if (b) { file = f; buffer = b; break; }
    }
    if (playing && playing.file === file) return; // already on it
    fadeOut(playing);
    playing = null;
    if (!buffer) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(MUSIC_VOLUME, ctx.currentTime + CROSSFADE_S);
    src.connect(gain).connect(ctx.destination);
    src.start();
    playing = { file, src, gain };
  }

  return {
    // Ask for the music of a context; safe to call often (no-op if unchanged).
    play(context, stageId) {
      const ctxKey = context === 'flight' ? 'flight' : 'menu';
      if (want && want.context === ctxKey && want.stageId === stageId) return;
      want = { context: ctxKey, stageId, list: ctxKey === 'flight' ? flightList(stageId) : null }; // one pick per flight
      update();
    },
    setEnabled(on) { enabled = !!on; want = want ? { ...want } : null; update(); },
    // Call after the first user tap (browsers block audio before it).
    kick() { update(); },
    prepare,
    get file() { return playing?.file ?? null; },
  };
}
