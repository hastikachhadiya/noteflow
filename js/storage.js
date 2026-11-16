/**
 * storage.js — the single data layer.
 * Every localStorage read/write goes through here, so a REST backend
 * could later replace this module without touching the UI code.
 */
const PREFIX = 'noteflow:';

export const KEYS = {
  notes: 'notes',
  theme: 'theme',
  lang: 'lang',
  motion: 'motion',
  seeded: 'seeded',
};

/** Read and parse a value. Returns `fallback` on missing/corrupt data. */
export function read(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback; // corrupted JSON → behave as if empty
  }
}

/** Serialize and persist a value. Returns false on quota/privacy errors. */
export function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    console.error('[NoteFlow] Storage write failed (quota or private mode).');
    return false;
  }
}

export function remove(key) {
  try { localStorage.removeItem(PREFIX + key); } catch { /* ignore */ }
}

/** Remove every NoteFlow key (used by "Reset app"). */
export function clearAll() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

/** User preferences (theme, language, motion). */
export const prefs = {
  getTheme() {
    const t = read(KEYS.theme, null);
    if (t === 'dark' || t === 'light') return t;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  },
  setTheme(value) { write(KEYS.theme, value); },
  getLang() { return read(KEYS.lang, 'en'); },
  setLang(value) { write(KEYS.lang, value); },
  getMotion() { return read(KEYS.motion, 'system'); }, // 'system' | 'reduced'
  setMotion(value) { write(KEYS.motion, value); },
};
