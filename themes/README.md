# Themes

Developer Brain loads one UI theme at startup.

1. `config.json` sets `"theme"` to a kebab-case id. Existing keys in that file stay as they are. The default id is `classic`.
2. `index.php` reads `themes/manifest.json`, allows only ids that match `^[a-z0-9]+(?:-[a-z0-9]+)*$` and that have `themes/<id>/theme.css`, then sets `html[data-theme]` and links that stylesheet.
3. `themes/base.css` paints shared chrome from CSS variables. `assets/css/theme-layout.css` holds layout fixes used by every theme. `assets/js/theme-enhancer.js` measures the promo banner and bottom bar and publishes `window.DevBrainThemes` (active id, default, allowlist).

An unknown or missing id falls back to the manifest default (`classic`).

## Theme ids

| id | Notes |
| --- | --- |
| `classic` | Default. Light paper, indigo actions, yellow announcement bar. |
| `generic` | Neutral gray documentation chrome. |
| `soft-cards` | Pastel cards, large radii, soft shadows. |
| `terminal` | Dark monospace console. |
| `3d-games` | Charcoal studio HUD. Cyan, lime, and orange. Mesh, gamepad, and wireframe cube. |
| `business` | Finance desk. Navy, charcoal, gold, and grey. Ledger grid, skyline, coin, and chart. |
| `health` | Clinic. Green, teal, white, and calm blue. Heart, pulse, leaf, and plus. |

Switch themes by editing the root config:

```json
"theme": "health"
```

Reload the page. Stylesheets are chosen on the server, so a reload is required.

## Add a theme

1. Create `themes/<id>/theme.css` and `themes/<id>/theme.json`.
2. Set variables on `html[data-theme="<id>"]`. Use the same custom properties as the existing themes (`--theme-bg`, `--theme-fg`, `--theme-surface`, `--theme-accent`, button colors, and the rest listed in any `theme.css`).
3. Register the id in `themes/manifest.json`.
4. Keep layout rules out of the theme file. Overflow, padding, sticky offsets, and z-index live in `assets/css/theme-layout.css` so one theme cannot reintroduce a gallery-wide glitch.

## Ornament license

Icons and patterns under `themes/3d-games/assets/`, `themes/business/assets/`, and `themes/health/assets/` are original drawings made for this project and released under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). No copyrighted game art or stock imagery is included. The health plus is a generic clinic mark, not the Red Cross emblem.

## Layout fixes (all themes)

`assets/css/theme-layout.css` and `assets/js/theme-enhancer.js` correct:

- Horizontal overflow from `100vw` columns, full-width fixed bars with extra padding, code-block margins, and the notebook strip.
- Double padding on the explorer header, bottom bar, and banner close control.
- Stacking so the banner, sticky note title, bottom bar, share bar, floating buttons, popovers, dialogs, image lightbox, and mindmap fullscreen sit in one order.
- Clipping from the banner close button, the random-note menu, and the table-of-contents hover transform.
- Overlapping TOC, mindmap, and private-note buttons, and the share bar covering the bottom bar.
- The note title sticky bar, which used a transform and therefore did not stick.
