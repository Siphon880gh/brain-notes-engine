# DevBrain - Notes Brain Engine Context

## Project Overview

**DevBrain** is a powerful knowledge management and publishing engine that transforms Markdown notes into an interactive, searchable web application. It's designed to handle thousands of notes across various topics (coding, 3D modeling, business, health) with features like full-text search, hierarchical organization, AI-assisted content generation, and interactive mindmap visualization.

## Tech Stack

- **Backend**: PHP (469 lines in `index.php`)
- **Frontend**: HTML, CSS, JavaScript (jQuery, Tailwind CSS)
- **Build System**: Node.js with custom caching pipeline
- **Search**: PCRE (Perl Compatible Regular Expressions) via `pcregrep`
- **Markdown Processing**: MarkdownIt with LaTeX support
- **Mindmap Visualization**: Mermaid.js v10.6.1 for interactive diagrams
- **Link Previews**: CORS proxy integration with content extraction (445 lines)
- **Styling**: Tailwind CSS, FontAwesome icons, Highlight.js
- **Deployment**: Multi-brain architecture with template system

## Core Architecture

### Main Components
- **`index.php`** (469 lines): Main application entry point with HTML structure and mindmap UI
- **`cache_data.js`** (153 lines): Scans curriculum directory, builds file tree
- **`cache_render.js`** (226 lines): Generates PHP partials from cached data
- **`search.php`** (21 lines): PCRE-based full-text search endpoint
- **`assets/js/`** (12 files): Frontend logic including note opening, search, modals, mindmap generation, link popovers

### Multi-Brain Template System
Supports multiple knowledge collections through template system:
```
env/templates-{devbrain,3dbrain,bizbrain,healthbrain}/
├── description.php    # Badge links and description
├── title.php         # Page titles
├── dir-snippets.php  # Curriculum directory path
├── icons.js          # Custom icons for topics
└── urls.json         # Repository URLs
```

## Key Features

- **Enhanced Markdown**: Obsidian-style links `[[Topic]]`, collapsible sections, math equations
- **Interactive Mindmaps**: Automatic generation from markdown lists with Mermaid.js visualization
- **Link Popover Previews**: Hover previews with selected excerpts from external links using `1x2.png` markers
- **Full-Text Search**: Title and content search with real-time results
- **AI Integration**: "Ask folder" feature for AI-assisted content generation
- **Publishing Pipeline**: Automatic image hosting and path rewriting
- **Multi-Environment**: Local development vs production path handling

## File Structure

```
devbrain/
├── index.php                 # Main application (469 lines)
├── cache_data.js            # File tree caching (153 lines)
├── cache_render.js          # HTML generation (226 lines)
├── search.php               # Search endpoint (21 lines)
├── mindmap-config.json      # Mindmap layout configuration (5 lines)
├── 1x2.png                  # Link popover marker image
├── assets/
│   ├── css/
│   │   ├── mindmap.css      # Mindmap styling (372 lines)
│   │   └── link-popover.css # Link popover styling (369 lines)
│   └── js/
│       ├── mindmap.js       # Mindmap functionality (860 lines)
│       ├── link-popover.js  # Link popover system (445 lines)
│       └── note-opener.js   # Note opening logic (1057 lines)
├── env/templates-*/         # Multi-brain configurations
├── curriculum/              # Markdown notes (separate repo)
└── future-*/               # Planned features
```

## Mindmap System

**Interactive mindmap generation from markdown lists using Mermaid.js visualization.**

- **Automatic Detection**: Scans for `1x1.png` placeholder images in markdown lists
- **Multiple Layouts**: Spider/radial, tree top-down, tree left-right, spread (compact) configurations
- **Interactive Controls**: Zoom, pan (always enabled), fullscreen with responsive design
- **Cycle Type Button**: Dynamic switching between layout types (spider → spread → tree-down → tree-right)
- **Configuration**: JSON-based layout type settings with runtime type cycling

*See [context-mindmap.md](./context-mindmap.md) for detailed implementation.*

## Link Popover Preview System

**Automatic link preview system that displays selected excerpts from external links on hover.**

- **Automatic Detection**: Scans for links followed by `1x2.png` marker images
- **Smart Content Extraction**: Parses boundary words from image alt text (`startWord..endWord`) and includes them in the excerpt
- **CORS Handling**: Uses proxy service to bypass CORS restrictions for external content
- **Performance**: Caches results to avoid repeated requests
- **Responsive Design**: Works on desktop and mobile devices with contextual positioning
- **Error Handling**: Graceful fallbacks for failed requests with user-friendly error messages

### Markdown Syntax
```markdown
[Example Website](https://example.com) ![title..content](../1x2.png)
[MDN Docs](https://developer.mozilla.org) ![Resources...Developers](../1x2.png)
```

*See [context-link-preview.md](./context-link-preview.md) for detailed implementation.*

## Development Workflow

1. **Content Creation**: Write markdown notes in Obsidian
2. **Local Testing**: Run `npm run build-{brain}` to generate cached content
3. **Deployment**: Use `npm run deploy` to push to remote server
4. **Server Pipeline**: Remote PHP script pulls changes and rebuilds cache

## Detailed Documentation

For comprehensive technical details, see:
- **[context-architecture.md](./context-architecture.md)** - System architecture, caching pipeline, build process
- **[context-features.md](./context-features.md)** - Enhanced markdown, search, AI integration, UI features
- **[context-tech-stack.md](./context-tech-stack.md)** - Backend/frontend technologies, build system, integrations
- **[context-mindmap.md](./context-mindmap.md)** - Mindmap system, detection, generation, and interactive controls
- **[context-link-preview.md](./context-link-preview.md)** - Link preview system with popover excerpts

## Quick Reference

**Refer to README for high-level context; details are in context files.**

This architecture enables handling thousands of notes efficiently while providing a rich, interactive experience for knowledge discovery and learning.
