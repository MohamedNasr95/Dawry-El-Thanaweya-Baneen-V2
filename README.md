# Wadi Degla Speedball League — Website

A static (HTML + CSS + JS + JSON, no backend) league site for Singles,
Doubles and Mixed Doubles. Publish it on GitHub Pages as-is.

## The only file you need to edit day-to-day

**`data/data.json`** — add players, teams, divisions and match results here.
Every page (division tables, match history, leaderboard) recalculates
itself automatically from this file. Open it and read the `_instructions`
block at the top first — it explains every section in plain English.

Quick cheatsheet:
- **Add a player** → add an entry to `players`.
- **Add a doubles/mixed team** → add an entry under `teams.doubles` or `teams.mixed` (2 player ids each).
- **Add a division** → add it to `events.<event>.divisions`, list its participant ids, list its matches.
  List divisions **top/strongest first, last/weakest last** — this order drives the leaderboard bonus (see below).
- **Enter a result** → find the match by its `id` in a division's `matches` list, set `"played": true`,
  and fill in `"rounds": [{"a":10,"b":7}, {"a":8,"b":10}, {"a":10,"b":6}]`. Best of 3 — you can stop
  at 2 rounds if someone already won both.
- **A match not played yet** → `"played": false, "rounds": []`. It will show as "To be played".

## How the leaderboard bonus works

Beyond match wins/losses, the leaderboard adds a **division bonus**: the
last (bottom) division in an event gets +0 bonus points, the division
above it gets +1 × `settings.divisionBonusIncrement`, the one above that
+2 ×, and so on. It's fully automatic — add or remove a division and the
scale recalculates itself, you never renumber anything by hand. Set
`divisionBonusIncrement` to `0` in `data.json` to turn it off.

Ranks 1–3 on the leaderboard get 🥇🥈🥉 medals, both on the podium and next
to their row in the full list.

## File map

```
index.html              Home page — pick an event
divisions.html          Page 1 of an event: division tables
history.html            Page 2 of an event: match history (day cards)
leaderboard.html        Page 3 of an event: leaderboard + podium
css/style.css           All colours/fonts/layout — themes are CSS variables near the top
js/main.js              Theme toggle + tab navigation (edit EVENTS/PAGES lists here to rename tabs)
js/data-engine.js       All the maths: standings, rounds, points, leaderboard, bonus (read comments before editing)
js/page-divisions.js    Builds the HTML for divisions.html
js/page-history.js      Builds the HTML for history.html
js/page-leaderboard.js  Builds the HTML for leaderboard.html
data/data.json          <-- YOUR DATA. Edit this to update the whole site.
```

Only `divisions.html` / `history.html` / `leaderboard.html` exist as
files (3 pages), and each one works for all 3 events via a `?event=`
link in the URL (e.g. `divisions.html?event=doubles`) — that's why you
never have to duplicate a page per event, and why adding a 4th event
only means editing `data.json` + the `EVENTS` list in `js/main.js`.

## Changing the look

- **Colours**: open `css/style.css`, section `2. THEME VARIABLES`. Light
  theme is under `:root`, dark theme is under `[data-theme="dark"]`.
- **Fonts**: same file, top `@import` line. Swap the Google Fonts names
  if you want a different typeface.
- **Club name/logo letters**: in each HTML file, inside `<div class="brand-mark">` and `<span class="title">`.

## Publishing on GitHub Pages

1. Push this whole folder to a GitHub repository.
2. In the repo, go to **Settings → Pages**, set the source to your main
   branch (root folder), save.
3. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

## Testing locally before you publish

Opening `index.html` directly by double-clicking it will usually fail to
load `data.json` (browsers block that for security). Instead, from a
terminal inside the project folder, run:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000` in your browser.
