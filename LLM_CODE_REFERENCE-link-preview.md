# DevBrain - Link Popover Preview System Context

## Overview

Link popovers preview other DevBrain documents and provide inline custom text. They do not use marker images, scrape external webpages, or call a CORS proxy.

## Syntax

```markdown
[[DOCUMENT NAME]]
[[TEXT]]##This is preview text##
```

The first form links to and previews another local document. The second renders only `TEXT`; the `##...##` payload is displayed only in its non-navigating popover.

Custom content takes precedence even when `TEXT` names an existing document. Payloads support Markdown, formatting HTML, actual newlines, and literal `\n` line breaks:

```markdown
[[Existing Document]]##Test **Preview**
<b>Text</b>##
```

Executable/embed elements, event-handler attributes, and `javascript:` URLs are removed after rendering.

## Implementation

- `assets/js/note-opener.js`: `extractCustomWikiPreviews()` protects rich custom payloads before note rendering; `replaceWikiLinksWithPreviews()` restores custom anchors and converts ordinary wiki links for regular and decrypted notes.
- `assets/js/link-popover.js`: Enhances custom links before document links, loads and caches local document previews, and safely renders custom Markdown/HTML.
- `assets/css/link-popover.css`: Styles preview links, popovers, document tabs, and responsive states.

## Runtime Flow

1. Extract custom preview expressions before MarkdownIt renders the note.
2. Render the visible note without custom payloads.
3. Restore custom anchors and convert ordinary document wiki links.
4. Insert the content and call `window.linkPopoverPreview.rescan()`.
5. On hover, load local document context or render embedded custom Markdown/HTML.

Labels and preview attributes are assigned through DOM APIs. Rich custom content is sanitized in inert template content before insertion. Document previews use the existing local note endpoint and are cached by normalized title.
