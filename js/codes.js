// SP1 save codes: move the WHOLE save between devices (pure, no DOM).
// Code = "SP1-" + base64url(JSON of the validated save) + "-" + 4-char FNV-1a checksum.
// Import validates prefix + checksum + the payload through the normal save
// validation/migration BEFORE anything is written; a bad code changes nothing.
// v0.9: each world's goal gates[] + complete ride along (sparse, like the save); import cleans them
// (known numbers, no duplicates, complete only as a real true with 10/10) and older codes read as none.
import { validateSave } from './save.js';
import { STAGES, STAGE_ORDER } from './stages.js';

export const CODE_PREFIX = 'SP1-';
const BAD = "That code doesn't look right";

// FNV-1a (32-bit) over the payload text → 4 base-36 characters.
export function checksum(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h % 36 ** 4).toString(36).toUpperCase().padStart(4, '0');
}

function toB64url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(b64) {
  if (!/^[A-Za-z0-9_-]+$/.test(b64)) throw new Error('bad characters');
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64.length + 3) % 4));
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function exportCode(save) {
  const payload = toB64url(JSON.stringify(validateSave(save)));
  return `${CODE_PREFIX}${payload}-${checksum(payload)}`;
}

// Big, readable chunks for the screen (whitespace is ignored on import).
export function groupCode(code, size = 6) {
  return code.match(new RegExp(`.{1,${size}}`, 'g')).join(' ');
}

// → { ok: true, save, summary } or { ok: false, error }.
export function parseCode(text) {
  try {
    const code = String(text ?? '').replace(/\s+/g, '');
    if (!code.startsWith(CODE_PREFIX) || code.length < CODE_PREFIX.length + 6) return { ok: false, error: BAD };
    const sum = code.slice(-4);
    if (code[code.length - 5] !== '-') return { ok: false, error: BAD };
    const payload = code.slice(CODE_PREFIX.length, -5);
    if (!payload || checksum(payload) !== sum) return { ok: false, error: BAD };
    const data = JSON.parse(fromB64url(payload));
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, error: BAD };
    const save = validateSave(data);
    return { ok: true, save, summary: summarize(save) };
  } catch {
    return { ok: false, error: BAD };
  }
}

// What a code holds, for the "Replace my progress?" question.
export function summarize(save) {
  const worlds = STAGE_ORDER.filter((id) => save.unlocked.includes(id));
  return {
    worldsUnlocked: worlds.length,
    worlds: worlds.map((id) => ({ id, name: STAGES[id].name, best: save.stages[id]?.best ?? 0 })),
    totalCoins: Object.values(save.stages).reduce((a, r) => a + (r.coins ?? 0), 0),
  };
}
