# DevBrain - Notes Brain Engine Context

> **Note for AI Tools:** Line references in this file are intentionally approximate (e.g., "near the top," "around lines 100–150"). Exact line numbers are fragile and shift with edits. Use these as navigation hints, then search or read the actual file for precision.

## Project Overview

**DevBrain** is a powerful knowledge management and publishing engine that transforms Markdown notes into an interactive, searchable web application. It's designed to handle thousands of notes across various topics (coding, 3D modeling, business, health) with features like full-text search, hierarchical organization, AI-assisted content generation, interactive mindmap visualization, link preview popovers, and click-to-expand image modals.

## What the App Does

- **Knowledge Management**: Transforms Obsidian/Markdown vaults into interactive web applications
- **Multi-Brain Architecture**: Supports multiple knowledge collections (dev, 3D, business, health) with independent configurations
- **Enhanced Markdown**: Processes Obsidian-style links `[[Topic]]`, collapsible sections, math equations, and heading indentation
- **Interactive Features**: Auto-generated mindmaps from lists, link popover previews, full-text search, AI assistance, image modals
- **Publishing Pipeline**: Automated image hosting, path rewriting, and deployment for public-facing knowledge bases

## Tech Stack

### Backend (PHP)
- **`index.php`** (~480 lines): Main application entry point with HTML structure, modal system, and template integration
- **`search.php`** (~21 lines): PCRE-based full-text search endpoint using `pcregrep`
- **`decrypt-age.php`** (~1411 lines): AGE encryption/decryption handler with Node.js fallback, robust TTY detection, and AES-256-CBC re-encryption
- **`decrypt-age-node.js`** (~352 lines): Node.js AGE decryption script using `age-encryption` npm package with ES module support
- **`find-nodejs-path.php`** (~141 lines): Node.js path detection helper for configuration
- **Template System**: Multi-brain configuration support in `env/templates-*/`

### Frontend (JavaScript + CSS)
- **`assets/js/mindmap.js`** (~1681 lines): Interactive mindmap generation with Mermaid.js, zoom/pan controls, layout cycling
- **`assets/js/link-popover.js`** (~550 lines): Link preview system with CORS proxy and content extraction
- **`assets/js/note-opener.js`** (~1550 lines): Markdown rendering, note display, content loading, code block enhancement, and private note handling
- **`assets/js/index.js`** (~399 lines): Main UI logic, navigation, and interaction handling
- **`assets/js/searchers.js`** (~398 lines): Search functionality and result display
- **`assets/js/image-modal.js`** (~127 lines): Image viewing modal functionality with click-to-expand
- **`assets/js/encryption.js`** (~399 lines): AGE encryption/decryption functionality with client-side AES-256-CBC
- **`assets/js/private-auth.js`** (~250 lines): Private notes authentication modal and session management
- **CSS Framework**: Tailwind CSS, FontAwesome icons, custom styling (10 CSS files, ~3000 lines total)

### Build System (Node.js)
- **`cache_data.js`** (~153 lines): Scans curriculum directory, builds hierarchical file tree
- **`cache_data_imaged.js`** (~175 lines): Scans curriculum directory, builds file tree of notes containing images only (for Random Note prioritization)
- **`cache_render.js`** (~226 lines): Generates PHP partials from cached data using EJS templates
- **Package Scripts**: Build commands for different brain variants (devbrain, 3dbrain, etc.)

### External Dependencies
- **Mermaid.js v10.6.1**: Interactive diagram rendering for mindmaps
- **D3.js v7**: Force-based layout for spread mindmap type
- **jQuery + jQuery UI**: DOM manipulation and UI components
- **MarkdownIt**: Markdown parsing with LaTeX support
- **Highlight.js**: Syntax highlighting for code blocks
- **AGE Encryption**: Command-line encryption tool with Node.js fallback using `age-encryption` npm package (v0.2.4)
- **Web Crypto API**: Client-side AES-256-CBC encryption with PBKDF2 key derivation

## Architecture

### Core Application Flow
```
1. Content Creation (Obsidian/Markdown) → curriculum/
2. Build Process: cache_data.js → cachedResData.json
3. HTML Generation: cache_render.js → cachedResPartial.php  
4. Runtime: index.php loads cached content + JavaScript enhances UI
5. Search: search.php provides PCRE-based full-text search
6. Features: Mindmaps, link previews, AI assistance activate dynamically
```

### Multi-Brain Template System
```
env/templates-{devbrain,3dbrain,bizbrain,healthbrain}/
├── description.php     # Badge links and page description
├── title.php          # Page titles and branding
├── dir-snippets.php   # Curriculum directory path configuration
├── icons.js           # Custom topic icons
└── urls.json          # Repository URLs for "what's changed" links
```

### File Structure (Key Components)
```
devbrain/
├── index.php                 # Main app (~485 lines)
├── search.php               # Search endpoint (~21 lines)
├── decrypt-age.php          # AGE encryption handler (~1411 lines)
├── decrypt-age-node.js      # Node.js AGE decryption (~352 lines)
├── find-nodejs-path.php     # Node.js path detection (~141 lines)
├── check-private-auth.php   # Private notes authentication (~80 lines)
├── .env-password.php        # Password for private notes
├── cache_data.js            # File tree builder (~153 lines)
├── cache_data_imaged.js     # Imaged notes file tree builder (~175 lines)
├── cache_render.js          # HTML generator (~226 lines)
├── config-mindmap.json      # Mindmap configuration (~5 lines)
├── config.json              # Image hosting & Node.js configuration (~21 lines)
├── 1x2.png                  # Link popover marker image
├── assets/
│   ├── css/                 # Styling (10 files, ~3000 lines total)
│   │   ├── mindmap.css      # Mindmap styling (~458 lines)
│   │   ├── link-popover.css # Link popover styling (~430 lines)
│   │   ├── index.css        # Main styling + code blocks (~1294 lines)
│   │   ├── encryption.css   # Encryption styling (~290 lines)
│   │   └── private-auth.css # Private notes auth styling (~200 lines)
│   └── js/                  # Frontend logic (11 files, ~6200 lines total)
│       ├── mindmap.js       # Mindmap system (~1681 lines)
│       ├── link-popover.js  # Link preview system (~550 lines)
│       ├── note-opener.js   # Note loading/rendering + code blocks (~1550 lines)
│       ├── index.js         # Main UI logic (~399 lines)
│       ├── searchers.js     # Search functionality (~398 lines)
│       ├── image-modal.js   # Image modal functionality (~127 lines)
│       ├── encryption.js    # AGE encryption/decryption (~399 lines)
│       ├── private-auth.js  # Private notes authentication (~250 lines)
│       ├── game.js          # Game mode functionality (~600 lines)
│       └── modal.js         # Modal system management (~27 lines)
├── env/                     # Multi-brain templates and configuration
├── curriculum/              # Markdown notes (separate repository)
└── future-*/               # Planned features (game modes, progress tracking)
```

## Code Flow

### 1. Application Bootstrap (`index.php`)
- Loads environment configuration from templates
- Renders HTML structure with modals, search, and UI components
- Includes cached content from `cachedResPartial.php`
- Initializes JavaScript modules and external dependencies

### 2. Content Processing Pipeline
```javascript
// cache_data.js - File tree generation
scanDirectory(curriculumPath) → buildFileTree() → cachedResData.json

// cache_data_imaged.js - Imaged notes file tree generation
scanDirectory(curriculumPath) → filterNotesWithImages() → cachedResDataImaged.json

// cache_render.js - HTML generation  
loadCachedData() → processTemplates() → cachedResPartial.php
```

### 3. Runtime Enhancement
```javascript
// Main UI initialization (index.js)
$(document).ready() → initializeSearch() + initializeNavigation()

// Feature detection and activation
onContentLoad() → detectMindmapContent() + enhanceLinks()

// Dynamic content loading (note-opener.js)
openNote() → fetchMarkdown() → renderWithMarkdownIt() → enhanceContent()
```

### 4. Feature Systems
- **Mindmaps**: Detect `1x1.png` in lists → parse structure → generate Mermaid → render with controls
- **Link Previews**: Detect `1x2.png` markers → parse boundary words → fetch via CORS proxy → display popover
- **Search**: User input → PCRE query → highlight results → navigate to content
- **Encryption**: Detect AGE blocks → prompt for password → decrypt via PHP backend → re-encrypt with AES → client-side decryption → render content

## Key Features Implementation

### Interactive Mindmap System
- **Detection**: Scans for `1x1.png` placeholder images in markdown lists
- **Generation**: Converts nested lists to Mermaid.js syntax (spider, tree, spread layouts)
- **Controls**: Zoom, pan, fullscreen, layout cycling with smooth animations
- **Integration**: Automatically activates when mindmap content is detected

**Markdown Syntax:**
```markdown
# Topic ![Topic](img/1x1.png)
- Subtopic 1 ![Sub1](img/1x1.png)
  - Detail A ![DetailA](img/1x1.png)
```

### Link Popover Preview System  
- **Smart Content Extraction**: Parses boundary words from alt text (`startWord..endWord`)
- **Custom Preview Text**: Uses `##` delimiter for instant custom previews
- **CORS Handling**: Uses `api.allorigins.win` proxy for external content
- **Caching**: Results cached to avoid repeated requests

**Markdown Syntax:**
```markdown
[Example Site](https://example.com) ![title..content](../1x2.png)
[API](https://example.com) ![API##Application Programming Interface](../1x2.png)
```

### Image Modal System
- **Click-to-Expand**: Images in notes open in fullscreen modal on click
- **Keyboard Support**: ESC key to close, smooth animations
- **Dynamic Detection**: Automatically attaches to new images when notes load
- **File**: `assets/js/image-modal.js` (~127 lines) - Small file, read full for complete understanding

### Code Snippet Enhancement
- **Line Numbers**: Automatic line number gutter on the left side of all code blocks
- **Copy Button**: Custom one-click copy with visual feedback (Copied! with checkmark)
- **Syntax Highlighting**: Language-aware syntax highlighting with Highlight.js
- **Dark Theme**: Modern dark theme styling (#2d2d2d background)
- **No Language Label**: Clean UI without potentially incorrect language labels
- **Implementation**: `addLineNumbersToCodeBlocks()` function in `note-opener.js` (near middle of file)

### Enhanced Markdown Support
- **Internal Links**: `[[Topic Title]]` for navigation between notes
- **Collapsible Sections**: `> [!note] HEADING` syntax
- **Math Equations**: KaTeX support with `$E = mc^2$` syntax
- **Heading Indentation**: Visual hierarchy with `<<<` reset markers
- **Highlight Syntax**: `==text==` renders as highlighted text (yellow background)
- **Strikethrough Syntax**: `~~text~~` renders as crossed-out text
- **YouTube Embeds**: Auto-converts YouTube links (standard, shorts, live, youtu.be) to embedded players with privacy-enhanced mode

### AI Integration
- **"Ask Folder" Feature**: AI can analyze entire folder contents for context-aware assistance
- **Content Generation**: AI-assisted note creation and improvement
- **Large Prompt Handling**: Manages prompts too large for direct API calls
- **ChatGPT Integration**: Seamless connection to external AI services

### Encryption System
- **AGE Format Support**: Detects and handles AGE-encrypted content in markdown files
- **Hybrid Encryption**: AGE → PHP backend → AES-256-CBC → JavaScript client → rendered content
- **Robust Fallback**: Primary age binary with Node.js fallback using `age-encryption` npm package
- **Console Logging**: Browser console shows which decryption method was used

### Private Notes System
- **Filename-Based Protection**: Files ending with "PRIVATE.md" or "(PRIVATE).md" require authentication (case insensitive)
- **Hidden Paths in Build**: Private files have `href=""` in `cachedResPartial.php` to hide their true file paths from HTML source
- **Session-Based Auth**: Password verified against `.env-password.php`, stored in PHP session
- **Key Icon UI**: Top-right key button (🔑) for login/logout, turns green when authenticated
- **Blocked Content**: Unauthenticated users see a login prompt instead of private note content

## Development Workflow

### Local Development
1. **Content Creation**: Write markdown notes in Obsidian or preferred editor
2. **Build Process**: Run `npm run build-devbrain` (or other brain variant)
3. **Testing**: Local server serves content with live reloading
4. **Feature Development**: Modify JavaScript/CSS, test with sample content

### Build Scripts
```bash
npm run build-devbrain    # Developer notes variant
npm run build-3dbrain     # 3D modeling notes variant  
npm run build-bizbrain    # Business notes variant
npm run build-healthbrain # Health notes variant
```

## Performance Considerations

- **Caching Strategy**: Pre-computed file structures and HTML partials eliminate runtime filesystem scanning
- **Lazy Loading**: Notes loaded on-demand via AJAX to reduce initial page load
- **Search Optimization**: Efficient PCRE patterns with file exclusions (git, node_modules, binaries)
- **Image Optimization**: Automatic thumbnail generation and hosted image serving

## Detailed Documentation

For comprehensive implementation details, see specialized context files:

- **[context-architecture.md](./context-architecture.md)** (~130 lines) - System architecture, caching pipeline, build process
- **[context-features.md](./context-features.md)** (~175 lines) - Enhanced markdown, search, UI features, AI integration
- **[context-tech-stack.md](./context-tech-stack.md)** (~180 lines) - Backend/frontend technologies, build system, security
- **[context-mindmap.md](./context-mindmap.md)** (~255 lines) - Mindmap system implementation, detection, generation
- **[context-link-preview.md](./context-link-preview.md)** (~235 lines) - Link preview system with popover excerpts
- **[context-encryption.md](./context-encryption.md)** (~200 lines) - AGE encryption system with Node.js fallback

## Quick Reference for AI Code Generation

**Refer to context.md for high-level context; details are in specialized context files.**

### When to Read Full Files vs Targeted Search:
- **Small files (<100 lines)**: Read entire file (config files, simple scripts)
- **Medium files (100-500 lines)**: Consider targeted search for specific functions
- **Large files (500+ lines)**: Use targeted search unless full understanding needed

### Key File Sizes for Reference:
- `index.php`: ~480 lines (medium - consider targeted search)
- `decrypt-age.php`: ~1411 lines (large - use targeted search)
- `decrypt-age-node.js`: ~352 lines (medium - consider targeted search)
- `find-nodejs-path.php`: ~141 lines (small-medium - read full file)
- `assets/js/mindmap.js`: ~1681 lines (large - use targeted search)
- `assets/js/link-popover.js`: ~550 lines (large - use targeted search)
- `assets/js/note-opener.js`: ~1464 lines (large - use targeted search)
- `assets/js/index.js`: ~399 lines (medium - consider targeted search)
- `assets/js/searchers.js`: ~398 lines (medium - consider targeted search)
- `assets/js/encryption.js`: ~399 lines (medium - consider targeted search)
- `assets/js/image-modal.js`: ~127 lines (small-medium - read full file)
- Configuration files: <50 lines each (small - read full files)

This architecture enables efficient handling of thousands of notes while providing a rich, interactive experience for knowledge discovery and content management. The modular design supports easy feature extension and multiple knowledge domain deployments.
