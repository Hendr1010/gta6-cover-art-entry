# Neon Bay — GTA-style Cover Maker

[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/Hendr1010/gta6-cover-art-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/Hendr1010/gta6-cover-art-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn your photos and a caption into multi-panel cover art in the style of a
Vice City sunset poster — three photo panels, a sunset or neon colour grade,
and bold condensed caption lettering — exported as a PNG to share.

## How to use

1. Serve `app/` with any static server, for example `python3 -m http.server`
   from inside `app/`, and open `index.html` in desktop Chrome. The app works
   fully offline; nothing is uploaded anywhere.
2. Load a photo into each panel (or tap **Use sample photo**), then click a
   panel in the preview and drag its photo to position it; the zoom slider
   crops it tighter.
3. Type the title and subtitle, pick a colour grade (Sunset, Neon, Midnight,
   Gold hour) and an export size (1080 × 1080, 1080 × 1350, 1920 × 1080).
4. Tap **Export PNG** — the cover downloads at full size.

## What is inside

- `app/index.html`, `app/style.css`, `app/src/main.js` — the editor.
- `app/src/cover.js` — the cover engine: procedural sunset sky, skyline and
  palm silhouettes, the three-panel layout, the grade wash and the caption
  lettering, all drawn on canvas.
- `app/src/shots.js` — fixed screenshot scenes (`?shot=editor`,
  `?shot=cover-wide`, `?shot=cover-square`, `?shot=cover-portrait`).
- `app/samples/` — three sunset cityscapes drawn for this app (not photos of
  real people, not game artwork).
- `app/fonts/` — Noto Sans Display (ExtraCondensed Black for titles,
  Condensed Bold for subtitles) under the SIL Open Font License (`OFL.txt`).
- `main.ts` — hands `app/` and `screenshots/` to `/output` with a dossier
  (`MAKEFUN_OUTPUT_DIR=out node main.ts` outside the grader).

Everything on the cover is original work made for this entry: no Rockstar
Games logo, wordmark, artwork, character or font is used anywhere.
