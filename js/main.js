/* =====================================================================
   MAIN.JS — theme switching + the tab navigation shared by every page
   =====================================================================
   Two jobs:
     1. Light/Dark theme toggle (remembers the choice in the browser
        using localStorage, so it stays picked next visit).
     2. Renders the "Event" tabs (Singles / Doubles / Mixed Doubles) and
        "Page" tabs (Divisions / History / Leaderboard) at the top of
        every page, and highlights whichever one is currently active.

   HOW PAGES TALK TO EACH OTHER:
   We use a URL parameter, e.g.  divisions.html?event=doubles
   That way divisions.html / history.html / leaderboard.html don't need
   3 separate copies each (9 files) — one file per PAGE TYPE handles
   all 3 events. This is also why editing data.json is the only thing
   you need to do to add events/divisions — the pages are generic.

   If you want to rename an event or add a 4th one, see the EVENTS
   list below AND add a matching key under "events" in data/data.json.
   ===================================================================== */

// ---- EDIT HERE to rename events or add a new one (must match data.json keys) ----
const EVENTS = [
  { key: 'singles', label: 'Singles' },
  { key: 'doubles', label: 'Doubles' },
  { key: 'mixed', label: 'Mixed Doubles' },
];

// ---- EDIT HERE to rename pages (the "page" query param + file names must match) ----
const PAGES = [
  { key: 'divisions', label: 'Divisions', file: 'divisions.html' },
  { key: 'history', label: 'Match History', file: 'history.html' },
  { key: 'leaderboard', label: 'Leaderboard', file: 'leaderboard.html' },
];

/** Reads ?event=xxx from the URL, defaulting to "singles" if missing/invalid. */
function getCurrentEventKey() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('event');
  const valid = EVENTS.some((e) => e.key === requested);
  return valid ? requested : 'singles';
}

/** Builds a link to another page while keeping/changing the ?event= value. */
function buildPageLink(file, eventKey) {
  return file + '?event=' + encodeURIComponent(eventKey);
}

/**
 * Renders the two rows of tabs into the page. Every page calls this once,
 * passing which page-key it is (e.g. "divisions") so the right tab lights up.
 */
function renderNav(activePageKey) {
  const currentEvent = getCurrentEventKey();
  const currentFile = PAGES.find((p) => p.key === activePageKey).file;

  const eventTabsEl = document.getElementById('event-tabs');
  const pageTabsEl = document.getElementById('page-tabs');
  if (!eventTabsEl || !pageTabsEl) return;

  eventTabsEl.innerHTML = EVENTS.map((e) => {
    const activeClass = e.key === currentEvent ? ' active' : '';
    return `<a class="tab-pill${activeClass}" href="${buildPageLink(currentFile, e.key)}">${e.label}</a>`;
  }).join('');

  pageTabsEl.innerHTML = PAGES.map((p) => {
    const activeClass = p.key === activePageKey ? ' active' : '';
    return `<a class="page-tab${activeClass}" href="${buildPageLink(p.file, currentEvent)}">${p.label}</a>`;
  }).join('');
}

/* --------------------------------------------------------------------
   THEME TOGGLE
   Stores "light" or "dark" under the key "speedball-theme" in the
   browser's localStorage so it's remembered on the next visit.
   -------------------------------------------------------------------- */
const THEME_STORAGE_KEY = 'speedball-theme';

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '\u2600\uFE0F' : '\u{1F319}'; // sun / moon emoji
}

function initTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  // Default: use light theme, unless the device itself prefers dark AND
  // the user has never explicitly chosen a theme on this site before.
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(initial);

  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const next = isDark ? 'light' : 'dark';
      localStorage.setItem(THEME_STORAGE_KEY, next);
      applyTheme(next);
    });
  }
}

// Run the theme setup as soon as this script loads (before the page content
// paints) so there's no flash of the wrong theme.
initTheme();
