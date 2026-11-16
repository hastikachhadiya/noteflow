/**
 * ui.js — shared UI utilities: DOM builder, toasts, dialogs, empty
 * states, skeletons, note cards and an XSS-safe markdown renderer.
 * User data is rendered with textContent only — never raw innerHTML.
 */
import { t } from './i18n.js';
import { COLOURS, isOverdue, stripMarkdown } from './notes.js';

/* ------------------------------------------------------------------ */
/* DOM helpers                                                         */
/* ------------------------------------------------------------------ */

/**
 * Small createElement wrapper.
 * attrs: { class, text, html (trusted, pre-escaped only), on*, dataset, ... }
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value; // trusted markup only
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) {
    if (child != null) node.append(child);
  }
  return node;
}

/** Re-scan for Lucide icons (safe to call any time). */
export function icons() {
  if (window.lucide?.createIcons) window.lucide.createIcons();
  else window.addEventListener('load', () => window.lucide?.createIcons(), { once: true });
}

export function debounce(fn, ms = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

export function formatDate(value) {
  const d = typeof value === 'number' ? new Date(value) : new Date(`${value}T00:00:00`);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function timeAgo(ts) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return formatDate(ts);
}

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

export function toast(message, type = 'success') {
  let host = document.getElementById('nf-toasts');
  if (!host) {
    host = el('div', { id: 'nf-toasts', class: 'fixed bottom-4 right-4 z-[80] flex flex-col gap-2' });
    document.body.append(host);
  }
  const icon = type === 'error' ? 'circle-alert' : type === 'info' ? 'info' : 'circle-check';
  const colour = type === 'error' ? 'var(--nf-danger)' : 'var(--nf-brand)';
  const item = el('div', {
    role: 'status',
    class: 'nf-panel flex items-center gap-2 px-4 py-3 text-sm shadow-xl',
  }, [
    el('span', { html: `<i data-lucide="${icon}" class="h-4 w-4 shrink-0" style="color:${colour}"></i>` }),
    el('span', { text: message }),
  ]);
  host.append(item);
  icons();
  setTimeout(() => {
    item.style.transition = 'opacity .25s';
    item.style.opacity = '0';
    setTimeout(() => item.remove(), 260);
  }, 3000);
}

/* ------------------------------------------------------------------ */
/* Dialogs                                                             */
/* ------------------------------------------------------------------ */

/**
 * Modal dialog. actions: [{ label, value, style: 'primary'|'ghost'|'danger' }]
 * Resolves with the chosen value, or null on Esc/backdrop.
 */
export function dialog({ title, message = '', actions = [], icon = 'circle-help', iconDanger = false }) {
  return new Promise((resolve) => {
    const host = document.getElementById('nf-modal-root') ?? document.body;
    const panel = el('div', {
      role: 'alertdialog',
      'aria-modal': 'true',
      'aria-label': title,
      class: 'nf-panel w-full max-w-sm p-5 shadow-2xl',
    }, [
      el('div', { class: 'mb-3 flex items-center gap-3' }, [
        el('span', {
          class: 'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
          style: iconDanger
            ? 'background:rgba(225,29,72,.15);color:var(--nf-danger)'
            : 'background:var(--nf-brand-soft);color:var(--nf-brand)',
        }, el('span', { html: `<i data-lucide="${icon}" class="h-5 w-5"></i>` })),
        el('h2', { class: 'text-base font-semibold', text: title }),
      ]),
      message ? el('p', { class: 'text-sm text-[var(--nf-ink-soft)]', text: message }) : null,
      el('div', { class: 'mt-5 flex flex-wrap justify-end gap-2' },
        actions.map((a, i) => el('button', {
          type: 'button',
          'data-action-index': String(i),
          class: `nf-btn ${a.style === 'danger' ? 'nf-btn-danger' : a.style === 'ghost' ? 'nf-btn-ghost' : 'nf-btn-primary'}`,
          text: a.label,
        }))),
    ]);
    const backdrop = el('div', {
      class: 'fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm',
    }, panel);

    const close = (value) => {
      document.removeEventListener('keydown', onKey);
      backdrop.remove();
      resolve(value);
    };
    const onKey = (e) => { if (e.key === 'Escape') close(null); };
    panel.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => close(actions[Number(btn.dataset.actionIndex)].value));
    });
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(null); });
    document.addEventListener('keydown', onKey);
    host.append(backdrop);
    icons();
    panel.querySelector('button')?.focus();
  });
}

export function confirmDialog({ title, message = '', confirmText = t('action.confirm'), danger = false }) {
  return dialog({
    title,
    message,
    icon: danger ? 'triangle-alert' : 'circle-help',
    iconDanger: danger,
    actions: [
      { label: t('action.cancel'), value: false, style: 'ghost' },
      { label: confirmText, value: true, style: danger ? 'danger' : 'primary' },
    ],
  }).then(Boolean);
}

/* ------------------------------------------------------------------ */
/* Empty states & skeletons                                            */
/* ------------------------------------------------------------------ */

export function emptyState(host, { icon = 'sticky-note', title, msg = '' }) {
  host.replaceChildren(el('div', {
    class: 'nf-card col-span-full flex flex-col items-center gap-2 px-6 py-14 text-center',
  }, [
    el('span', {
      class: 'grid h-14 w-14 place-items-center rounded-2xl',
      style: 'background:var(--nf-brand-soft);color:var(--nf-brand)',
    }, el('span', { html: `<i data-lucide="${icon}" class="h-7 w-7"></i>` })),
    el('h2', { class: 'text-lg font-semibold', text: title }),
    msg ? el('p', { class: 'max-w-sm text-sm text-[var(--nf-ink-soft)]', text: msg }) : null,
  ]));
}

export function skeletons(host, count = 6) {
  const card = () => el('div', { class: 'nf-card flex flex-col gap-3 p-4', 'aria-hidden': 'true' }, [
    el('div', { class: 'nf-skel h-5 w-3/4' }),
    el('div', { class: 'nf-skel h-3 w-full' }),
    el('div', { class: 'nf-skel h-3 w-5/6' }),
    el('div', { class: 'nf-skel h-3 w-1/3' }),
  ]);
  host.replaceChildren(...Array.from({ length: count }, card));
}

/* ------------------------------------------------------------------ */
/* Icon button + note card                                             */
/* ------------------------------------------------------------------ */

export function iconBtn(icon, label, onClick, { danger = false } = {}) {
  const btn = el('button', {
    type: 'button',
    class: `nf-icon-btn${danger ? ' nf-danger-hover' : ''}`,
    'aria-label': label,
    title: label,
  }, el('span', { html: `<i data-lucide="${icon}" class="h-4 w-4"></i>` }));
  btn.addEventListener('click', onClick);
  return btn;
}

/**
 * Build a note card. actions: { onPin, onArchive, onTrash, onRestore, onPurge }
 * All content is rendered via textContent — safe against XSS.
 */
export function buildNoteCard(note, actions = {}) {
  const hex = (COLOURS.find((c) => c.id === note.colour) ?? COLOURS[0]).hex;
  const card = el('article', { class: 'nf-card relative flex flex-col gap-3 overflow-hidden p-4 pl-5' });
  card.append(el('span', { class: 'absolute inset-y-0 left-0 w-1.5', style: `background:${hex}` }));

  if (note.pinned) {
    card.append(el('span', {
      class: 'absolute right-3 top-3',
      title: t('action.pin'),
      html: '<i data-lucide="pin" class="h-4 w-4" style="color:var(--nf-brand)"></i>',
    }));
  }

  // Header row: explicit "Edit note" button at the top-left + title link
  const editorUrl = `note-editor.html?id=${encodeURIComponent(note.id)}`;
  const title = el('a', {
    href: editorUrl,
    class: 'min-w-0 flex-1 line-clamp-2 pr-6 text-base font-semibold hover:underline',
  }, document.createTextNode(note.title || t('note.untitled')));
  card.append(el('div', { class: 'flex items-start gap-1' }, [
    el('a', {
      href: editorUrl,
      class: 'nf-icon-btn shrink-0',
      'aria-label': t('action.edit'),
      title: t('action.edit'),
    }, el('span', { html: '<i data-lucide="pencil" class="h-4 w-4"></i>' })),
    title,
  ]));

  card.append(el('p', {
    class: 'line-clamp-3 text-sm text-[var(--nf-ink-soft)]',
  }, document.createTextNode(stripMarkdown(note.content) || '—')));

  const chips = el('div', { class: 'flex flex-wrap items-center gap-1.5' });
  chips.append(el('span', { class: 'nf-chip', text: note.category }));
  (note.tags || []).slice(0, 3).forEach((tag) => chips.append(el('span', { class: 'nf-chip', text: `#${tag}` })));
  if ((note.tags || []).length > 3) chips.append(el('span', { class: 'nf-chip', text: `+${note.tags.length - 3}` }));
  if (note.dueDate) {
    const overdue = isOverdue(note.dueDate);
    chips.append(el('span', {
      class: 'nf-chip',
      style: overdue ? 'color:var(--nf-danger);border-color:var(--nf-danger)' : '',
      text: `${t('note.due')} ${formatDate(note.dueDate)}`,
    }));
  }
  card.append(chips);

  const buttons = el('div', { class: 'ml-auto flex items-center gap-0.5' });
  if (actions.onPin) {
    buttons.append(iconBtn(note.pinned ? 'pin-off' : 'pin', note.pinned ? t('action.unpin') : t('action.pin'), actions.onPin));
  }
  if (actions.onArchive) buttons.append(iconBtn('archive', t('action.archive'), actions.onArchive));
  if (actions.onRestore) buttons.append(iconBtn('undo-2', t('action.restore'), actions.onRestore));
  if (actions.onTrash) buttons.append(iconBtn('trash-2', t('action.trash'), actions.onTrash, { danger: true }));
  if (actions.onPurge) buttons.append(iconBtn('trash-2', t('action.purge'), actions.onPurge, { danger: true }));

  card.append(el('div', {
    class: 'mt-auto flex items-center justify-between gap-2 border-t border-[var(--nf-line)] pt-2',
  }, [
    el('span', { class: 'text-xs text-[var(--nf-ink-soft)]', text: timeAgo(note.updatedAt) }),
    buttons,
  ]));
  return card;
}

/* ------------------------------------------------------------------ */
/* Markdown renderer (XSS-safe)                                        */
/* ------------------------------------------------------------------ */

/**
 * Render a small markdown subset to HTML. The source is fully escaped
 * first, so user content can never inject markup. Supports headings,
 * bold/italic/strike, inline code, fenced code, lists, quotes, links
 * (http/https only) and horizontal rules.
 */
export function renderMarkdown(src = '') {
  const esc = (s) => s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const inline = (s) => s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  const lines = esc(src).split(/\r?\n/);
  const out = [];
  let para = [];
  let list = null; // 'ul' | 'ol'
  let fence = false;

  const flushPara = () => {
    if (para.length) { out.push(`<p>${inline(para.join('<br>'))}</p>`); para = []; }
  };
  const closeList = () => {
    if (list) { out.push(`</${list}>`); list = null; }
  };
  const openList = (kind) => {
    if (list !== kind) { closeList(); out.push(`<${kind}>`); list = kind; }
  };

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      if (fence) { out.push('</code></pre>'); fence = false; }
      else { flushPara(); closeList(); out.push('<pre><code>'); fence = true; }
      continue;
    }
    if (fence) { out.push(line); continue; }

    const trimmed = line.trim();
    if (!trimmed) { flushPara(); closeList(); continue; }

    let m;
    if ((m = trimmed.match(/^(#{1,3})\s+(.*)$/))) {
      flushPara(); closeList();
      out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
    } else if (/^(---+|\*\*\*+)$/.test(trimmed)) {
      flushPara(); closeList(); out.push('<hr>');
    } else if ((m = trimmed.match(/^&gt;\s?(.*)$/))) {
      flushPara(); closeList(); out.push(`<blockquote>${inline(m[1])}</blockquote>`);
    } else if ((m = trimmed.match(/^[-*]\s+(.+)$/))) {
      flushPara(); openList('ul'); out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = trimmed.match(/^\d+\.\s+(.+)$/))) {
      flushPara(); openList('ol'); out.push(`<li>${inline(m[1])}</li>`);
    } else {
      closeList(); para.push(trimmed);
    }
  }
  if (fence) out.push('</code></pre>');
  flushPara();
  closeList();
  return out.join('\n');
}
