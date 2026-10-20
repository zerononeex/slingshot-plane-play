// Music player: the owner drops MP3s into site/assets/music/ — nothing is shipped.
//   menu.mp3            home / shop / results
//   flight.mp3          in flight, every world
//   space.mp3           in flight, Space (beats flight.mp3)
//   flight-<world>.mp3  in flight, that world (beats everything), e.g. flight-canyon.mp3
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

// The player: WebAudio buffer sources (seamless loops) + gain crossfades.
export function createMusic(getCtx, base = MUSIC_DIR) {
  const cache = new Map(); // file → Promise<AudioBuffer|null>
  let enabled = true;
  let want = null;         // { context, stageId } most recently asked for
  let playing = null;      // { file, src, gain }
  let token = 0;

  function load(file) {
    if (!cache.has(file)) {
      const ctx = getCtx();
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

  async function update() {
    const my = ++token;
    const ctx = getCtx();
    if (!enabled || !want || !ctx || ctx.state !== 'running') { fadeOut(playing); playing = null; return; }
    let file = null, buffer = null;
    for (const f of trackCandidates(want.context, want.stageId)) {
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
      want = { context: ctxKey, stageId };
      update();
    },
    setEnabled(on) { enabled = !!on; want = want ? { ...want } : null; update(); },
    // Call after the first user tap (browsers block audio before it).
    kick() { update(); },
    get file() { return playing?.file ?? null; },
  };
}
