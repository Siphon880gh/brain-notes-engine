# DevBrain - Link Popover Preview System Context

> **Note for AI Tools:** Line references are intentionally approximate. Search the implementation before editing it.

## Overview

The link popover system previews other DevBrain documents and supports inline custom preview text. It does not use marker images, scrape external webpages, or call a CORS proxy.

## Markdown Syntax

### Another Document

```markdown
[[DOCUMENT NAME]]
```

The visible text links to the local document. Hovering it opens a popover with the document's first prose paragraph, a table of contents, and an Open note action.

### Custom Text

```markdown
[[TEXT]]##This is preview text##
```

Only `TEXT` appears in the rendered note. The `##...##` payload appears only in the hover popover, and the rendered text does not navigate when clicked.

Custom content takes precedence when `TEXT` is also the exact name of an existing document. In that case, DevBrain shows the custom popover and does not load or navigate to the document preview.

Payloads support Markdown, formatting HTML, actual newlines, and literal `\n` line breaks:

```markdown
[[Existing Document]]##Test **Preview**
<b>Text</b>##
```

The popover renders Markdown with line breaks and `html: true`. Executable or embedded elements (`script`, `iframe`, `object`, and `embed`), event-handler attributes, and `javascript:` URLs are removed.

## Core Components

- `assets/js/note-opener.js`: `extractCustomWikiPreviews()` removes custom payloads before MarkdownIt renders the note, preserving multiline Markdown/HTML for the popover. `replaceWikiLinksWithPreviews()` then restores custom anchors and converts ordinary document wiki links. The regular and decrypted rendering paths both use this pipeline.
- `assets/js/link-popover.js`: Enhances custom-preview anchors before scanning local document links, which gives custom content precedence. It loads document previews, renders custom Markdown/HTML, sanitizes executable content, manages the preview cache, and positions popovers.
- `assets/css/link-popover.css`: Styles document and custom-text preview links, popovers, tabs, and responsive states.

## Runtime Flow

1. `extractCustomWikiPreviews()` replaces complete custom-preview expressions with placeholders before note rendering.
2. The note is rendered with MarkdownIt without the hidden custom payloads.
3. `replaceWikiLinksWithPreviews()` restores custom anchors and converts ordinary document wiki links.
4. The resulting HTML is inserted and `window.linkPopoverPreview.rescan()` enhances custom links first.
5. Hovering a document link lazily loads local note context; hovering a custom link renders its embedded Markdown/HTML immediately.

## Security and Performance

- Labels and preview attributes are assigned through DOM APIs.
- Custom Markdown/HTML is rendered only inside the popover, then executable/embed elements, inline event handlers, and `javascript:` URLs are removed.
- Code blocks are excluded from syntax conversion.
- Custom previews require no request.
- Document previews use the existing local note endpoint and are cached by normalized note title.
- There is no external page scraper or public CORS proxy dependency.

## Dynamic Content Integration

After inserting newly rendered note content, call:

```javascript
window.linkPopoverPreview.rescan();
```

The enhancer uses `data-preview-enhanced` to avoid attaching duplicate event listeners.
