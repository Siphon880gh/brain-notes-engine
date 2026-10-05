# Developer Brain UI themes

Switch the homepage look by changing one key in `env/config.json` (copied from `env/templates-*/config.json` by the brain build):

```json
{
  "theme": "classic"
}
```

`"showThemeSwitcher": true` adds a top-right theme control. `"showNightDaySwitcher": true` adds a Day/Night control beside it. The switcher also remembers a choice in `localStorage` (`devbrain-theme`, `devbrain-color-mode`).

## Available theme ids

| Id | Look |
|----|------|
| `generic` | Original / baseline homepage (pre-gallery). |
| `soft-cards` | Dark blue hire banner, three-circle logo, pastel category cards, floating pill nav. |
| `terminal` | Monospaced `~/developer-brain`, teal accents, green notes badge, numbered section labels, terminal search. |
| `classic` | Pale yellow hire bar, blue **DB** logo, orange key button, blue-bordered search, featured lesson card, blue chevron topic rows, gradient **See topics** bar. **Default.** |
| `3d-games` | Charcoal studio HUD. Cyan, lime, and orange. Mesh, gamepad, and wireframe cube. |
| `business` | Finance desk. Navy, charcoal, gold, and grey. Ledger grid, skyline, coin, and chart. |
| `health` | Clinic. Green, teal, white, and calm blue. Heart, pulse, leaf, and plus. |

Unknown or missing values fall back to `generic`. The manifest default remains `classic`, which is what `env/config.json` ships with.

## How it loads

1. `index.php` reads `env/config.json`, sanitizes `theme` against `$allowedThemes`, and sets `<html data-theme="…" data-mode="day">`.
2. It links `themes/<id>/theme.css` (`#theme-css`) and publishes `window.DevBrainThemeConfig` so the switcher can change theme and color mode before paint.
3. `assets/js/theme-enhancer.js` adds small markup hooks (logo, path label, numbered dividers, hire footer, switchers) that CSS alone cannot express.

Shared layout and behavior for the original four themes stay in `assets/css/index.css` and the existing JS. Those theme sheets skin the homepage via `html[data-theme="…"]` selectors.

`3d-games`, `business`, and `health` each `@import` `themes/base.css`, which maps `--theme-*` tokens onto shared chrome. Their ornament SVGs live next to the stylesheet.

## Add a theme

1. Create `themes/<id>/` with:
   - `theme.json` — `{ "id", "name", "description" }`
   - `theme.css` — rules scoped under `html[data-theme="<id>"] { … }`
2. Add the id to `themes/manifest.json`.
3. Allow the id in the `$allowedThemes` array in `index.php` (and the fallback list in `assets/js/theme-enhancer.js`).
4. Optionally extend `assets/js/theme-enhancer.js` for markup-only needs.
5. Set `"theme": "<id>"` in the matching `env/templates-*/config.json`, run that brain's build so it copies into `env/config.json`, and reload the homepage.

Tip: copy `themes/generic/` as a starting point, then override tokens (`--theme-*`) and component selectors. Domain themes can `@import "../base.css"` when they want the shared token mapper.

## Ornament license

Icons and patterns under `themes/3d-games/assets/`, `themes/business/assets/`, and `themes/health/assets/` are original drawings made for this project and released under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). No copyrighted game art or stock imagery is included. The health plus is a generic clinic mark, not the Red Cross emblem. The coin is a generic disc, not a currency trademark.

## Files

- `themes/manifest.json` — gallery catalog
- `themes/base.css` — token mapper used by the domain themes
- `themes/<id>/theme.css` — stylesheet
- `themes/<id>/theme.json` — metadata
- `env/templates-*/config.json` → `"theme"` — per-brain selection, copied to `env/config.json` by `npm run build-*`
