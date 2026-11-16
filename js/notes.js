/**
 * notes.js — note domain logic: CRUD, search/filter/sort, import/export,
 * demo seed data. All persistence goes through storage.js.
 */
import { read, write } from './storage.js';

const KEY = 'notes';

export const CATEGORIES = ['Personal', 'Work', 'Ideas', 'Shopping'];

export const COLOURS = [
  { id: 'emerald', hex: '#10b981' },
  { id: 'sky', hex: '#0ea5e9' },
  { id: 'amber', hex: '#f59e0b' },
  { id: 'rose', hex: '#f43f5e' },
  { id: 'violet', hex: '#8b5cf6' },
  { id: 'slate', hex: '#64748b' },
];

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

export function uid() {
  return crypto.randomUUID?.() ?? `n-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getNotes() {
  const list = read(KEY, []);
  return Array.isArray(list) ? list : [];
}

export function getNote(id) {
  return getNotes().find((n) => n.id === id) ?? null;
}

export function saveNotes(list) {
  write(KEY, list);
  notify();
}

function notify() {
  window.dispatchEvent(new CustomEvent('nf:changed'));
}

/**
 * Subscribe to note changes (same tab + other tabs via `storage`).
 * Returns an unsubscribe function.
 */
export function subscribe(cb) {
  const onStorage = (e) => { if (!e.key || e.key.endsWith(':notes')) cb(); };
  window.addEventListener('storage', onStorage);
  window.addEventListener('nf:changed', cb);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('nf:changed', cb);
  };
}

/* ------------------------------------------------------------------ */
/* CRUD                                                                */
/* ------------------------------------------------------------------ */

function baseNote() {
  const now = Date.now();
  return {
    id: uid(),
    title: '',
    content: '',
    category: CATEGORIES[0],
    tags: [],
    colour: COLOURS[0].id,
    pinned: false,
    archived: false,
    trashed: false,
    dueDate: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function createNote(data = {}) {
  const note = { ...baseNote(), ...data };
  const list = getNotes();
  list.unshift(note);
  saveNotes(list);
  return note;
}

export function updateNote(id, patch = {}) {
  const list = getNotes();
  const i = list.findIndex((n) => n.id === id);
  if (i < 0) return null;
  list[i] = { ...list[i], ...patch, updatedAt: Date.now() };
  saveNotes(list);
  return list[i];
}

export const togglePin = (id) => {
  const note = getNote(id);
  return note ? updateNote(id, { pinned: !note.pinned }) : null;
};
export const archiveNote = (id) => updateNote(id, { archived: true, pinned: false });
export const unarchiveNote = (id) => updateNote(id, { archived: false });
export const trashNote = (id) => updateNote(id, { trashed: true, pinned: false });
export const restoreNote = (id) => updateNote(id, { trashed: false });
export const purgeNote = (id) => saveNotes(getNotes().filter((n) => n.id !== id));
export const emptyTrash = () => saveNotes(getNotes().filter((n) => !n.trashed));
export const clearAllNotes = () => saveNotes([]);

export function counts() {
  const notes = getNotes();
  return {
    total: notes.filter((n) => !n.trashed && !n.archived).length,
    pinned: notes.filter((n) => n.pinned && !n.trashed && !n.archived).length,
    archived: notes.filter((n) => n.archived && !n.trashed).length,
    trashed: notes.filter((n) => n.trashed).length,
  };
}

/* ------------------------------------------------------------------ */
/* Query                                                               */
/* ------------------------------------------------------------------ */

/**
 * Filter notes. `status` selects the working set:
 * 'active' (dashboard) or 'archived'. Trash is always excluded —
 * the trash page reads raw notes instead.
 */
export function queryNotes(notes, opts = {}) {
  const { q = '', category = 'all', colour = 'all', tag = 'all', pin = 'all', status = 'active' } = opts;
  const needle = q.trim().toLowerCase();
  return notes.filter((n) => {
    if (n.trashed) return false;
    if (status === 'active' && n.archived) return false;
    if (status === 'archived' && !n.archived) return false;
    if (category !== 'all' && n.category !== category) return false;
    if (colour !== 'all' && n.colour !== colour) return false;
    if (tag !== 'all' && !(n.tags || []).includes(tag)) return false;
    if (pin === 'pinned' && !n.pinned) return false;
    if (pin === 'unpinned' && n.pinned) return false;
    if (needle) {
      const haystack = [n.title, n.content, ...(n.tags || [])].join('\n').toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

/** Sort by mode; pinned notes always float to the top. */
export function sortNotes(notes, mode = 'updated-desc') {
  const comparators = {
    'updated-asc': (a, b) => a.updatedAt - b.updatedAt,
    'updated-desc': (a, b) => b.updatedAt - a.updatedAt,
    'created-desc': (a, b) => b.createdAt - a.createdAt,
    'title-asc': (a, b) => (a.title || '').localeCompare(b.title || ''),
    'title-desc': (a, b) => (b.title || '').localeCompare(a.title || ''),
  };
  const cmp = comparators[mode] ?? comparators['updated-desc'];
  return [...notes].sort(cmp).sort((a, b) => Number(b.pinned) - Number(a.pinned));
}

/** Unique tag list across non-trashed notes (for the filter dropdown). */
export function allTags(notes) {
  return [...new Set(notes.filter((n) => !n.trashed).flatMap((n) => n.tags || []))]
    .sort((a, b) => a.localeCompare(b));
}

/** Plain-text version of markdown source (for card snippets). */
export function stripMarkdown(src = '') {
  return src
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~`[\]()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isOverdue(dueDate) {
  if (!dueDate) return false;
  const [y, m, d] = dueDate.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59) < new Date();
}

/* ------------------------------------------------------------------ */
/* Import / export                                                     */
/* ------------------------------------------------------------------ */

/** Validate + normalize one imported object. Returns a safe note or null. */
function coerceNote(raw) {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  if (typeof raw.title !== 'string' || typeof raw.content !== 'string') return null;
  const now = Date.now();
  const base = baseNote();
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : now);
  const note = {
    ...base,
    title: raw.title.slice(0, 100),
    content: raw.content.slice(0, 5000),
    category: CATEGORIES.includes(raw.category) ? raw.category : base.category,
    colour: COLOURS.some((c) => c.id === raw.colour) ? raw.colour : base.colour,
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim().slice(0, 20)).slice(0, 5)
      : [],
    pinned: Boolean(raw.pinned),
    archived: Boolean(raw.archived),
    trashed: Boolean(raw.trashed),
    dueDate: typeof raw.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.dueDate) ? raw.dueDate : null,
    createdAt: num(raw.createdAt),
    updatedAt: num(raw.updatedAt),
  };
  note.id = typeof raw.id === 'string' && raw.id ? raw.id : uid();
  return note;
}

/**
 * Import parsed JSON. mode: 'merge' | 'replace'.
 * Returns the number of imported notes, 0 if nothing valid, or null
 * if the payload itself is not an array.
 */
export function importNotes(raw, mode = 'merge') {
  if (!Array.isArray(raw)) return null;
  const seen = new Set(getNotes().map((n) => n.id));
  const valid = [];
  for (const item of raw) {
    const note = coerceNote(item);
    if (!note) continue;
    if (seen.has(note.id)) note.id = uid(); // avoid overwriting on merge
    seen.add(note.id);
    valid.push(note);
  }
  if (!valid.length) return 0;
  saveNotes(mode === 'replace' ? valid : [...valid, ...getNotes()]);
  return valid.length;
}

/* ------------------------------------------------------------------ */
/* Seed data (first run, or "restore samples")                         */
/* ------------------------------------------------------------------ */

export function ensureSeed(force = false) {
  if (!force && read('seeded', false)) return;
  const now = Date.now();
  const day = 86_400_000;
  const samples = [
    {
      title: 'Welcome to NoteFlow',
      category: 'Personal', colour: 'emerald', pinned: true, tags: ['demo', 'guide'],
      createdAt: now - 2 * day, updatedAt: now - day,
      content: [
        '## 👋 Welcome!',
        '',
        'This is your **local-first** note app — everything lives in your browser.',
        '',
        '- Press `Ctrl+K` to search, `Ctrl+Alt+N` for a new note',
        '- Use the toolbar to format with **Markdown**',
        '- Pin, colour and tag notes to stay organized',
        '',
        '> Tip: pinned notes always float to the top.',
        '',
        '```',
        'Happy note-taking!',
        '```',
      ].join('\n'),
    },
    {
      title: 'Groceries',
      category: 'Shopping', colour: 'amber', tags: ['errand'],
      createdAt: now - day, updatedAt: now - 3 * 3_600_000,
      content: ['- Oat milk', '- Coffee beans', '- Spinach', '- Dark chocolate (85%)', '', '1. Pay utilities', '2. Pick up parcel'].join('\n'),
    },
    {
      title: 'Project ideas',
      category: 'Ideas', colour: 'violet', tags: ['side-project'],
      createdAt: now - 4 * day, updatedAt: now - 2 * day,
      content: ['**NoteFlow v2**', '', '1. Reminder notifications', '2. PWA offline mode', '3. Kanban view?', '', '*Maybe* a mobile widget…'].join('\n'),
    },
    {
      title: 'Standup — sprint 14',
      category: 'Work', colour: 'sky', tags: ['meetings'], archived: true,
      createdAt: now - 6 * day, updatedAt: now - 5 * day,
      content: ['- Shipped dark mode', '- Bug: tag dedupe', '- Next: export flow'].join('\n'),
    },
    {
      title: 'Books to read',
      category: 'Personal', colour: 'rose', tags: ['reading'],
      createdAt: now - 8 * day, updatedAt: now - 6 * day,
      content: ['- *Thinking, Fast and Slow*', '- *Deep Work*', '- *The Pragmatic Programmer*'].join('\n'),
    },
  ];
  const notes = samples.map((s) => ({ ...baseNote(), ...s, id: uid(), updatedAt: s.updatedAt ?? now }));
  write(KEY, notes);
  write('seeded', true);
  notify();
}
