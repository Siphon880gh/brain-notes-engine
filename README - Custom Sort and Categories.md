# Custom sort and categories in the curriculum explorer

DevBrain reads an Obsidian-style `sortspec.md` from your curriculum vault root to control **root-level folder order** in the topic navigator and to add **section dividers** between groups.

During `npm run build-*`, `cache_data.js` stores the spec in `cachedResData.json`, and `cache_render.js` applies it when generating `cachedResPartial.html`.

## Where to put it

Place `sortspec.md` at the root of `curriculum/` (same level as your top-level topic folders):

```
curriculum/
  sortspec.md
  Topic - Computer Science Basics/
  Topic - Backend/
  ...
```

Rebuild after editing (for example `npm run build-devbrain`).

## File format

Use Obsidian Custom Sort YAML frontmatter with a `sorting-spec` block. Only the **indented list inside that block** drives order and dividers — the outer `---` lines are YAML delimiters, not explorer dividers.

```markdown
---
sorting-spec: |-
  --- Fundamentals
  Topic - Computer Science Basics
  Topic - Version Control
  Topic - Developer Tools
  --- Web Development
  Topic - Backend
  Topic - Frontend
  Topic - Full Stack
  --- Databases and APIs
  Topic - SQL and ORMs
  Topic - Platform Services
  --- Artificial Intelligence
  Topic - AI Assisted Coding
  Topic - Prompt Engineering
  ---
  README
  sortspec
---
```

## Divider and category syntax

Inside `sorting-spec`, these special lines are **not** folder names:

| Line | Effect in the curriculum explorer |
|------|-----------------------------------|
| `--- Section Title` | Section divider with a small uppercase heading, then the folders listed below it |
| `---` | Plain horizontal rule between groups |
| `%` | Same as plain `---` (legacy alias) |

Everything else must match a **root folder name exactly** (same spelling and punctuation as the folder on disk).

## Ordering rules

- Root folders listed in the spec appear in that order.
- Folders **not** listed in the spec are appended at the end, sorted alphabetically.
- Dividers only affect the **root** explorer list; nested folders inside a topic keep their normal order.
- `sortspec.md` itself is hidden from the explorer (like `README.md` and `package.json`).

## Tips

- Use `--- Category Name` at the start of each block to label major areas (Fundamentals, Web Development, Enterprise, and so on).
- Use a plain `---` or `%` before meta items at the bottom (for example `README`, `sortspec`) to separate them from topic folders.
- If a divider or section does not show up, confirm the line is inside `sorting-spec`, rebuild, and check that folder names match exactly.

## Related docs

- [README - Custom Headings.md](README%20-%20Custom%20Headings.md) — where navigator labels such as Fundamentals and Web Development come from, with a screenshot
- [README.md](README.md) — Organizing folders and files
- [AGENTS-architecture.md](AGENTS-architecture.md) — Build pipeline and caching details
