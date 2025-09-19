# DevBrain - Notes Brain Engine Context

## Project Overview

**DevBrain** is a powerful knowledge management and publishing engine that transforms Markdown notes into an interactive, searchable web application. It's designed to handle thousands of notes across various topics (coding, 3D modeling, business, health) with features like full-text search, hierarchical organization, and AI-assisted content generation.

## Tech Stack

- **Backend**: PHP (395 lines in `index.php`)
- **Frontend**: HTML, CSS, JavaScript (jQuery, Tailwind CSS)
- **Build System**: Node.js with custom caching pipeline
- **Search**: PCRE (Perl Compatible Regular Expressions) via `pcregrep`
- **Markdown Processing**: MarkdownIt with LaTeX support
- **Styling**: Tailwind CSS, FontAwesome icons, Highlight.js
- **Deployment**: Multi-brain architecture with template system

## Core Architecture

### Main Components
- **`index.php`** (395 lines): Main application entry point with HTML structure
- **`cache_data.js`** (154 lines): Scans curriculum directory, builds file tree
- **`cache_render.js`** (227 lines): Generates PHP partials from cached data
- **`search.php`** (22 lines): PCRE-based full-text search endpoint
- **`assets/js/`** (8 files): Frontend logic including note opening, search, modals

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
- **Full-Text Search**: Title and content search with real-time results
- **AI Integration**: "Ask folder" feature for AI-assisted content generation
- **Publishing Pipeline**: Automatic image hosting and path rewriting
- **Multi-Environment**: Local development vs production path handling

## File Structure

```
devbrain/
├── index.php                 # Main application (395 lines)
├── cache_data.js            # File tree caching (154 lines)
├── cache_render.js          # HTML generation (227 lines)
├── search.php               # Search endpoint (22 lines)
├── assets/js/               # Frontend logic (8 JS files)
├── env/templates-*/         # Multi-brain configurations
├── curriculum/              # Markdown notes (separate repo)
└── future-*/               # Planned features
```

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

## Quick Reference

**Refer to README for high-level context; details are in context files.**

This architecture enables handling thousands of notes efficiently while providing a rich, interactive experience for knowledge discovery and learning.
