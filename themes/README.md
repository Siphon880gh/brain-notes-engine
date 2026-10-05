# Developer Brain UI themes

Switch the homepage look by changing one key in `env/config.json` (copied from `env/templates-*/config.json` by the brain build):

```json
{
  "theme": "classic"
}
```

## Available theme ids

| Id | Look |
|----|------|
| `generic` | Original / baseline homepage (pre-gallery). |
| `soft-cards` | Dark blue hire banner, three-circle logo, pastel category cards, floating pill nav. |
| `terminal` | Monospaced `~/developer-brain`, teal accents, green notes badge, numbered section labels, terminal search. |
| `classic` | Pale yellow hire bar, blue **DB** logo, orange key button, blue-bordered search, featured lesson card, blue chevron topic rows, gradient **See topics** bar. **Default.** |

Unknown or missing values fall back to `generic`.

## How it loads

1. `index.php` reads `env/config.json`, sanitizes `theme`, and sets `<html data-theme="…">`.
2. It links `themes/<id>/theme.css` after the shared `assets/css/*` sheets.
3. `assets/js/theme-enhancer.js` adds small markup hooks (logo, path label, numbered dividers) that CSS alone cannot express.

Shared layout and behavior stay in `assets/css/index.css` and the existing JS. Theme sheets only skin the homepage via `html[data-theme="…"]` selectors and CSS variables.

## Add a theme

1. Create `themes/<id>/` with:
   - `theme.json` — `{ "id", "name", "description" }`
   - `theme.css` — rules scoped under `html[data-theme="<id>"] { … }`
2. Add the id to `themes/manifest.json`.
3. Allow the id in the `$allowedThemes` array in `index.php`.
4. Optionally extend `assets/js/theme-enhancer.js` for markup-only needs.
5. Set `"theme": "<id>"` in the matching `env/templates-*/config.json`, run that brain's build so it copies into `env/config.json`, and reload the homepage.

Tip: copy `themes/generic/` as a starting point, then override tokens (`--theme-*`) and component selectors.

## Files

- `themes/manifest.json` — gallery catalog
- `themes/<id>/theme.css` — stylesheet
- `themes/<id>/theme.json` — metadata
- `env/templates-*/config.json` → `"theme"` — per-brain selection, copied to `env/config.json` by `npm run build-*`
