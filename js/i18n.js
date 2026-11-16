/**
 * i18n.js — tiny translation layer.
 * English ships today; adding a language means adding one dictionary
 * below and enabling it in LANGUAGES. UI strings come from `t()` or
 * `data-i18n` attributes applied by applyI18n().
 */
import { prefs } from './storage.js';

const dictionaries = {
  en: {
    /* Nav / sidebar */
    'nav.notes': 'Notes',
    'nav.archive': 'Archive',
    'nav.trash': 'Trash',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.menu': 'Open menu',
    'nav.theme': 'Toggle theme',
    'footer.text': 'Notes are stored locally in your browser — no account, no cloud.',

    /* Index */
    'index.title': 'Notes',
    'index.subtitle': 'Everything you have captured, in one place.',
    'index.new': 'New note',
    'index.search': 'Search notes…',
    'index.allCategories': 'All categories',
    'index.allColours': 'All colours',
    'index.allTags': 'All tags',
    'index.allPins': 'Pinned & not',
    'index.pinOnly': 'Pinned only',
    'index.unpinOnly': 'Not pinned',
    'index.sortUpdatedDesc': 'Last updated (newest)',
    'index.sortUpdatedAsc': 'Last updated (oldest)',
    'index.sortCreatedDesc': 'Date created (newest)',
    'index.sortTitleAsc': 'Title A–Z',
    'index.sortTitleDesc': 'Title Z–A',
    'index.emptyTitle': 'No notes found',
    'index.emptyMsg': 'Try changing the search or filters — or create your first note.',

    /* Notes */
    'note.untitled': 'Untitled note',
    'note.due': 'Due',

    /* Actions */
    'action.pin': 'Pin note',
    'action.unpin': 'Unpin note',
    'action.edit': 'Edit note',
    'action.archive': 'Archive',
    'action.unarchive': 'Unarchive',
    'action.trash': 'Move to trash',
    'action.restore': 'Restore',
    'action.purge': 'Delete forever',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    'action.add': 'Add',
    'action.delete': 'Delete',
    'action.back': 'Back',

    /* Confirm dialogs */
    'confirm.trashTitle': 'Move to trash?',
    'confirm.trashMsg': 'The note will be moved to Trash. You can restore it later.',
    'confirm.purgeTitle': 'Delete forever?',
    'confirm.purgeMsg': 'This permanently deletes the note. This cannot be undone.',
    'confirm.emptyTitle': 'Empty trash?',
    'confirm.emptyMsg': 'All notes in the trash will be permanently deleted.',
    'confirm.clearTitle': 'Clear all data?',
    'confirm.clearMsg': 'Every note, preference and setting will be removed. This cannot be undone.',

    /* Toasts */
    'toast.saved': 'Note saved',
    'toast.trashed': 'Moved to trash',
    'toast.restored': 'Note restored',
    'toast.archived': 'Note archived',
    'toast.unarchived': 'Note unarchived',
    'toast.deleted': 'Deleted forever',
    'toast.pinned': 'Pinned',
    'toast.unpinned': 'Unpinned',
    'toast.exported': 'Export downloaded',
    'toast.imported': 'Imported {count} notes',
    'toast.importFailed': 'Invalid file — expected a JSON array of notes.',
    'toast.importEmpty': 'No valid notes were found in that file.',
    'toast.cleared': 'All data cleared',
    'toast.seeded': 'Sample notes restored',
    'toast.settingsSaved': 'Setting saved',

    /* Editor */
    'editor.newTitle': 'New note',
    'editor.editTitle': 'Edit note',
    'editor.titleLabel': 'Title',
    'editor.phTitle': 'Note title…',
    'editor.contentLabel': 'Content (Markdown)',
    'editor.phContent': 'Write your note in Markdown…',
    'editor.preview': 'Preview',
    'editor.categoryLabel': 'Category',
    'editor.colourLabel': 'Colour',
    'editor.dueLabel': 'Due date',
    'editor.tagsLabel': 'Tags',
    'editor.phTag': 'Add a tag…',
    'editor.tagsHint': 'Up to 5 tags, 2–20 characters each. Press Enter or Add.',
    'editor.counter': '{count} / {max}',
    'editor.delete': 'Delete',
    'editor.notFound': 'Note not found — redirecting…',

    /* Validation messages */
    'v.required': 'This field is required.',
    'v.titleLen': 'Title must be 3–100 characters.',
    'v.contentMax': 'Content cannot exceed 5000 characters.',
    'v.category': 'Choose a valid category.',
    'v.tagCount': 'Maximum 5 tags.',
    'v.tagLen': 'Each tag must be 2–20 characters.',
    'v.tagDup': 'Tags must be unique.',
    'v.duePast': 'Due date cannot be in the past.',

    /* Archive */
    'archive.title': 'Archive',
    'archive.subtitle': 'Notes you archived — out of the way, never lost.',
    'archive.emptyTitle': 'Archive is empty',
    'archive.emptyMsg': 'Archive a note from its card menu to tuck it away here.',

    /* Trash */
    'trash.title': 'Trash',
    'trash.subtitle': 'Deleted notes are kept here until you remove them for good.',
    'trash.emptyBtn': 'Empty trash',
    'trash.emptyTitle': 'Trash is empty',
    'trash.emptyMsg': 'Deleted notes will appear here for safe keeping.',

    /* Profile */
    'profile.title': 'Profile',
    'profile.subtitle': 'A quick look at your notes and your data tools.',
    'profile.total': 'Active notes',
    'profile.pinned': 'Pinned',
    'profile.archived': 'Archived',
    'profile.trashed': 'In trash',
    'profile.dataTitle': 'Your data',
    'profile.dataHint': 'Export all notes to a JSON file, or import a previous backup.',
    'profile.export': 'Export JSON',
    'profile.import': 'Import JSON',
    'profile.importTitle': 'Import notes',
    'profile.importMsg': 'How should the imported notes be added?',
    'profile.merge': 'Merge',
    'profile.replace': 'Replace all',
    'profile.dangerTitle': 'Danger zone',
    'profile.dangerHint': 'Irreversible actions — please be certain.',
    'profile.clear': 'Clear all data',
    'profile.samples': 'Restore sample notes',

    /* Settings */
    'settings.title': 'Settings',
    'settings.subtitle': 'Tune NoteFlow to your liking.',
    'settings.appearance': 'Appearance',
    'settings.dark': 'Dark',
    'settings.light': 'Light',
    'settings.themeHint': 'Saved instantly. The first visit follows your system preference.',
    'settings.language': 'Language',
    'settings.languageHint': 'More languages are coming soon.',
    'settings.comingSoon': 'coming soon',
    'settings.motion': 'Accessibility',
    'settings.motionLabel': 'Reduce motion',
    'settings.motionHint': 'Disables animations and transitions across the app.',
    'settings.about': 'About',
    'settings.aboutBody': 'NoteFlow is a local-first note app: all data lives in your browser via localStorage. No account, no server.',
    'settings.shortcuts': 'Keyboard shortcuts',
    'settings.shortcutSearch': 'Focus search',
    'settings.shortcutNew': 'New note',
    'settings.resetTitle': 'Reset app',
    'settings.resetHint': 'Removes every note and preference and reloads the app.',
    'settings.reset': 'Reset NoteFlow',

    /* 404 */
    'nf404.code': '404',
    'nf404.title': 'Page not found',
    'nf404.msg': 'The page you are looking for does not exist or was moved.',
    'nf404.cta': 'Back to Notes',
  },
};

let current = prefs.getLang();

/** Translate a key, with optional {placeholder} interpolation. */
export function t(key, vars = {}) {
  const template = dictionaries[current]?.[key] ?? dictionaries.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
}

export function getLang() { return current; }

export function setLang(code) {
  current = dictionaries[code] ? code : 'en';
  prefs.setLang(current);
  applyI18n();
}

/** Available languages (disabled entries render in the settings picker). */
export const LANGUAGES = [
  { code: 'en', label: 'English', disabled: false },
  { code: 'es', label: 'Español', disabled: true }, // structure ready — add a dictionary to enable
];

/** Apply translations to every [data-i18n] element under `root`. */
export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((n) => { n.placeholder = t(n.dataset.i18nPlaceholder); });
  root.querySelectorAll('[data-i18n-aria]').forEach((n) => { n.setAttribute('aria-label', t(n.dataset.i18nAria)); });
}
