# NoteFlow 📝

A local-first, multi-page **note tracking app** built with plain HTML, **Tailwind CSS v4 (CDN)** and **vanilla JavaScript** — no build tools, no npm, no backend required.

## Run it

- **Easiest:** double-click `index.html` (everything works from `file://`).
- **Recommended:** open the folder in VS Code and use the **Live Server** extension for auto-reload.

## Folder structure

```
/noteflow
  index.html          → Notes dashboard (search, filters, sort, cards)
  note-editor.html    → Add / edit note (Markdown + live preview)
  archive.html        → Archived notes (restore / delete forever)
  trash.html          → Soft-deleted notes (restore / purge / empty)
  profile.html        → Stats, Export/Import JSON, danger zone
  settings.html       → Theme, language, reduce motion, reset app
  404.html            → Not-found page
  /js
    storage.js        → Single data layer (all localStorage access)
    notes.js          → Note CRUD, search/filter/sort, import/export, seed
    validation.js     → Reusable validators + form binding
    ui.js             → Toasts, dialogs, empty states, cards, markdown
    layout.js         → Shared navbar / sidebar / footer / shortcuts
    i18n.js           → Translation layer (English now, structure ready)
  /assets
    favicon.svg
```

## Features

- **Full CRUD** with unique IDs and `createdAt` / `updatedAt` timestamps.
- **Live debounced search** plus filters by category, colour, tag and pinned; sort by date or title (pinned notes always float to the top).
- **Pin, archive, soft-delete → Trash, restore, permanent delete** — every destructive action asks for confirmation.
- **6 colour labels**, 4 fixed categories, up to 5 tags per note.
- **Markdown editor** with toolbar and live preview (headings, bold/italic, lists, quotes, code blocks, links — all XSS-escaped).
- **Due dates** that cannot be set in the past; overdue badges turn red.
- **Export / Import JSON** with strict validation, choose *merge* or *replace* on import.
- **Cross-tab sync** via the `storage` event.
- **Keyboard shortcuts:** `Ctrl+K` focus search · `Ctrl+Alt+N` new note · `Esc` close modals/drawer.
- **Dark / light mode** (dark-first glassmorphism, emerald brand), saved in localStorage, no flash on load.
- **i18n-ready:** all UI strings go through `js/i18n.js`; adding a language = adding one dictionary.
- **Accessibility:** semantic HTML, labels on every input, `aria-invalid` / `aria-describedby`, focus rings, keyboard navigation, `prefers-reduced-motion` support.
- Empty states, loading skeletons and success/error toasts everywhere.

## Validation

All forms validate **on blur, on input after the first error, and on submit**:

- Title: required, 3–100 chars (trimmed).
- Content: required, max 5000 chars with a live counter.
- Tags: max 5, each 2–20 chars, no duplicates.
- Category: must be one of the allowed values.
- Due date: cannot be in the past.
- Invalid fields get a red border + inline message; valid ones turn green; submit is disabled while invalid; the first invalid field is focused on submit.

## How data is stored

Everything lives in **localStorage** under the `noteflow:` prefix:

| Key | Content |
|---|---|
| `noteflow:notes` | Array of note objects |
| `noteflow:theme` | `"dark"` / `"light"` |
| `noteflow:lang` | `"en"` |
| `noteflow:motion` | `"system"` / `"reduced"` |
| `noteflow:seeded` | Demo-data flag (first run seeds sample notes) |

JSON parsing is wrapped in try/catch everywhere, so corrupted storage degrades gracefully. `storage.js` is the **only** module touching localStorage — swap it for a REST client later and nothing else changes.

## Safety

- All user content is rendered with `textContent` — never raw `innerHTML`.
- The markdown renderer HTML-escapes the entire source before applying formatting; links are restricted to `http(s)`.
- Imported JSON is validated and normalized field by field before touching storage.

## What's next

Add a Spanish dictionary in `js/i18n.js` (the picker already lists it), a backend adapter in `storage.js`, reminders via the Notifications API, or a PWA service worker for offline install.
