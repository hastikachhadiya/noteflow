/**
 * layout.js — shared chrome injected into every page: top navbar,
 * sidebar (drawer on mobile), footer, theme toggle, keyboard shortcuts.
 * Pages call initLayout('activePage') — no duplicated markup anywhere.
 */
import { prefs } from './storage.js';
import { el, icons } from './ui.js';
import { t, applyI18n } from './i18n.js';
import { ensureSeed, counts } from './notes.js';

const LINKS = [
  { id: 'notes', href: 'index.html', icon: 'sticky-note', key: 'nav.notes', count: 'total' },
  { id: 'archive', href: 'archive.html', icon: 'archive', key: 'nav.archive', count: 'archived' },
  { id: 'trash', href: 'trash.html', icon: 'trash-2', key: 'nav.trash', count: 'trashed' },
  { id: 'profile', href: 'profile.html', icon: 'user-round', key: 'nav.profile' },
  { id: 'settings', href: 'settings.html', icon: 'settings', key: 'nav.settings' },
];

export function initLayout(active = '') {
  ensureSeed(); // first run → sample notes
  buildNav();
  buildSidebar(active);
  buildFloatingMenu();
  buildFooter();
  applyMotionPref();
  applyI18n();
  updateSidebarCounts();
  bindShortcuts();
  icons();
}

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */

function paintThemeButton(btn) {
  const dark = document.documentElement.classList.contains('dark');
  btn.replaceChildren(el('span', { html: `<i data-lucide="${dark ? 'sun' : 'moon'}" class="h-5 w-5"></i>` }));
  btn.setAttribute('aria-label', t('nav.theme'));
}

export function setTheme(mode) {
  prefs.setTheme(mode);
  document.documentElement.classList.toggle('dark', mode === 'dark');
  const btn = document.getElementById('nf-theme-btn');
  if (btn) paintThemeButton(btn);
  icons();
}

export function applyMotionPref() {
  document.documentElement.classList.toggle('nf-no-motion', prefs.getMotion() === 'reduced');
}

/* ------------------------------------------------------------------ */
/* Navbar                                                              */
/* ------------------------------------------------------------------ */

function brand() {
  return el('a', { href: 'index.html', class: 'flex items-center gap-2 rounded-lg px-1 py-1' }, [
    el('span', {
      class: 'grid h-8 w-8 place-items-center rounded-lg',
      style: 'background:var(--nf-brand);color:#052e22',
    }, el('span', { html: '<i data-lucide="notebook-pen" class="h-4 w-4"></i>' })),
    el('span', { class: 'text-lg font-extrabold tracking-tight', text: 'NoteFlow' }),
  ]);
}

function buildNav() {
  const host = document.getElementById('nf-nav');
  if (!host) return;

  const menuBtn = el('button', {
    type: 'button',
    id: 'nf-menu-btn',
    class: 'nf-icon-btn lg:hidden',
    'aria-label': t('nav.menu'),
    'aria-expanded': 'false',
    'aria-controls': 'nf-sidebar-panel',
  }, el('span', { html: '<i data-lucide="menu" class="h-5 w-5"></i>' }));

  const themeBtn = el('button', { type: 'button', id: 'nf-theme-btn', class: 'nf-icon-btn' });
  paintThemeButton(themeBtn);
  themeBtn.addEventListener('click', () => {
    setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
  });

  const header = el('header', { class: 'nf-glass sticky top-0 z-40 border-b border-[var(--nf-line)]' },
    el('div', { class: 'mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-2 px-4 sm:px-6' }, [
      el('div', { class: 'flex items-center gap-1' }, [menuBtn, brand()]),
      themeBtn,
    ]));

  host.replaceChildren(header);
  menuBtn.addEventListener('click', () => toggleDrawer());
}

/* ------------------------------------------------------------------ */
/* Sidebar / drawer                                                    */
/* ------------------------------------------------------------------ */

function buildSidebar(active) {
  const host = document.getElementById('nf-sidebar');
  if (!host) return;

  const items = LINKS.map((link) => {
    const a = el('a', { href: link.href, class: 'nf-side-link' }, [
      el('span', { html: `<i data-lucide="${link.icon}" class="h-4 w-4 shrink-0"></i>` }),
      el('span', { text: t(link.key) }),
      link.count
        ? el('span', {
          'data-count': link.count,
          class: 'ml-auto rounded-full px-2 py-0.5 text-xs font-semibold',
          style: 'background:var(--nf-input);color:var(--nf-ink-soft)',
        }, document.createTextNode('0'))
        : null,
    ]);
    if (active === link.id) a.setAttribute('aria-current', 'page');
    a.addEventListener('click', () => toggleDrawer(false)); // close drawer on mobile
    return a;
  });

  const aside = el('aside', {
    id: 'nf-sidebar-panel',
    class: 'nf-card nf-drawer fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto rounded-none border-l-0 p-3 lg:sticky lg:top-20 lg:z-auto lg:w-60 lg:self-start lg:rounded-2xl lg:border',
  }, el('nav', { class: 'flex flex-col gap-1', 'aria-label': 'Main' }, items));

  host.replaceChildren(aside);
}

function toggleDrawer(open) {
  const panel = document.getElementById('nf-sidebar-panel');
  const backdrop = document.getElementById('nf-backdrop');
  if (!panel) return;
  const willOpen = open ?? !panel.classList.contains('nf-open');
  panel.classList.toggle('nf-open', willOpen);
  backdrop?.classList.toggle('hidden', !willOpen);
  document.querySelectorAll('#nf-menu-btn, #nf-float-menu').forEach((b) => {
    b?.setAttribute('aria-expanded', String(willOpen));
  });
}

/* ------------------------------------------------------------------ */
/* Floating menu button (left edge)                                    */
/* ------------------------------------------------------------------ */

/**
 * Side-mounted floating button that opens the same drawer with every
 * page link. Shown on screens where the sidebar is hidden (< lg), so a
 * note can be open full screen and the menu stays reachable.
 */
function buildFloatingMenu() {
  if (document.getElementById('nf-float-menu')) return;
  const btn = el('button', {
    type: 'button',
    id: 'nf-float-menu',
    class: 'fixed left-0 top-1/2 z-30 flex -translate-y-1/2 items-center gap-1 rounded-r-full border border-l-0 px-2 py-4 shadow-lg transition-transform hover:translate-x-0.5 lg:hidden',
    style: 'background:var(--nf-card);border-color:var(--nf-line);backdrop-filter:blur(14px);color:var(--nf-brand)',
    'aria-label': t('nav.menu'),
    'aria-controls': 'nf-sidebar-panel',
    'aria-expanded': 'false',
    'data-i18n-aria': 'nav.menu',
  }, el('span', { html: '<i data-lucide="panel-left-open" class="h-5 w-5"></i>' }));
  btn.addEventListener('click', () => toggleDrawer());
  document.body.append(btn);
}

/* ------------------------------------------------------------------ */
/* Sidebar counts                                                      */
/* ------------------------------------------------------------------ */

export function updateSidebarCounts() {
  const c = counts();
  document.querySelectorAll('[data-count]').forEach((span) => {
    span.textContent = String(c[span.dataset.count] ?? 0);
  });
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

function buildFooter() {
  const host = document.getElementById('nf-footer');
  if (!host) return;
  host.replaceChildren(el('footer', { class: 'mx-auto w-full max-w-7xl px-4 pb-8 pt-2 sm:px-6' },
    el('div', { class: 'nf-card flex flex-col items-center gap-1 px-4 py-4 text-center text-xs text-[var(--nf-ink-soft)]' }, [
      el('span', { 'data-i18n': 'footer.text', text: t('footer.text') }),
      el('span', { text: `© ${new Date().getFullYear()} NoteFlow` }),
    ])));
}

/* ------------------------------------------------------------------ */
/* Keyboard shortcuts                                                  */
/* ------------------------------------------------------------------ */

function bindShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { toggleDrawer(false); return; }
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    const key = e.key.toLowerCase();
    if (key === 'k') {
      e.preventDefault();
      const search = document.getElementById('nf-search');
      if (search) search.focus();
      else location.href = 'index.html';
    } else if (key === 'n' && e.altKey) {
      e.preventDefault(); // Ctrl+N is reserved by browsers → Ctrl+Alt+N
      location.href = 'note-editor.html';
    }
  });
}
