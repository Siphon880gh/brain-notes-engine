# DevBrain - Notes Brain Engine Context

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
- **`index.php`** (481 lines): Main application entry point with HTML structure, modal system, and template integration
- **`search.php`** (21 lines): PCRE-based full-text search endpoint using `pcregrep`
- **Template System**: Multi-brain configuration support in `env/templates-*/`

### Frontend (JavaScript + CSS)
- **`assets/js/mindmap.js`** (1681 lines): Interactive mindmap generation with Mermaid.js, zoom/pan controls, layout cycling
- **`assets/js/link-popover.js`** (444 lines): Link preview system with CORS proxy and content extraction
- **`assets/js/note-opener.js`** (1058 lines): Markdown rendering, note display, and content loading
- **`assets/js/index.js`** (399 lines): Main UI logic, navigation, and interaction handling
- **`assets/js/searchers.js`** (363 lines): Search functionality and result display
- **`assets/js/image-modal.js`** (128 lines): Image viewing modal functionality with click-to-expand
- **`assets/js/encryption.js`** (encryption support): Note encryption/decryption functionality
- **CSS Framework**: Tailwind CSS, FontAwesome icons, custom styling (9 CSS files)

### Build System (Node.js)
- **`cache_data.js`** (153 lines): Scans curriculum directory, builds hierarchical file tree
- **`cache_render.js`** (226 lines): Generates PHP partials from cached data using EJS templates
- **Package Scripts**: Build commands for different brain variants (devbrain, 3dbrain, etc.)

### External Dependencies
- **Mermaid.js v10.6.1**: Interactive diagram rendering for mindmaps
- **jQuery + jQuery UI**: DOM manipulation and UI components
- **MarkdownIt**: Markdown parsing with LaTeX support
- **Highlight.js**: Syntax highlighting for code blocks

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
├── index.php                 # Main app (481 lines)
├── search.php               # Search endpoint (21 lines)  
├── cache_data.js            # File tree builder (153 lines)
├── cache_render.js          # HTML generator (226 lines)
├── config-mindmap.json      # Mindmap configuration (5 lines)
├── config.json              # Image hosting configuration (3 lines)
├── 1x2.png                  # Link popover marker image
├── assets/
│   ├── css/                 # Styling (9 files, ~2400+ total lines)
│   │   ├── mindmap.css      # Mindmap styling (458 lines)
│   │   ├── link-popover.css # Link popover styling (368 lines)
│   │   ├── index.css        # Main application styling (1205 lines)
│   │   └── encryption.css   # Encryption styling
│   └── js/                  # Frontend logic (12 files, ~5600+ total lines)
│       ├── mindmap.js       # Mindmap system (1681 lines)
│       ├── link-popover.js  # Link preview system (444 lines)
│       ├── note-opener.js   # Note loading/rendering (1058 lines)
│       ├── index.js         # Main UI logic (399 lines)
│       ├── searchers.js     # Search functionality (363 lines)
│       ├── image-modal.js   # Image modal functionality (128 lines)
│       ├── encryption.js    # Encryption/decryption functionality

│       ├── game.js          # Game mode functionality (600 lines)
│       └── modal.js         # Modal system management (27 lines)
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
- **Responsive**: Desktop hover + mobile touch with contextual positioning

**Markdown Syntax:**
```markdown
[Example Site](https://example.com) ![title..content](../1x2.png)
[API](https://example.com) ![API##Application Programming Interface](../1x2.png)
```

### Image Modal System
- **Click-to-Expand**: Images in notes open in fullscreen modal on click
- **Keyboard Support**: ESC key to close, smooth animations
- **Dynamic Detection**: Automatically attaches to new images when notes load
- **Event Management**: Prevents conflicts with other interactive elements
- **File**: `assets/js/image-modal.js` (128 lines) - Small-medium file, read full for complete understanding

### Enhanced Markdown Support
- **Internal Links**: `[[Topic Title]]` for navigation between notes
- **Collapsible Sections**: `> [!note] HEADING` syntax
- **Math Equations**: KaTeX support with `$E = mc^2$` syntax
- **Heading Indentation**: Visual hierarchy with `<<<` reset markers

### AI Integration
- **"Ask Folder" Feature**: AI can analyze entire folder contents for context-aware assistance
- **Content Generation**: AI-assisted note creation and improvement while preserving markdown formatting
- **Large Prompt Handling**: Manages prompts too large for direct API calls
- **ChatGPT Integration**: Seamless connection to external AI services with fallback for large prompts

## Development Workflow

### Local Development
1. **Content Creation**: Write markdown notes in Obsidian or preferred editor
2. **Build Process**: Run `npm run build-devbrain` (or other brain variant)
3. **Testing**: Local server serves content with live reloading
4. **Feature Development**: Modify JavaScript/CSS, test with sample content

### Deployment Pipeline  
1. **Content Push**: `git push` curriculum changes to repository
2. **Deploy Script**: `npm run deploy` triggers remote server update
3. **Server Pipeline**: Remote PHP script pulls changes and rebuilds cache
4. **Live Update**: New content immediately available on production

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
- **Memory Management**: Efficient data structures for handling thousands of notes

## Detailed Documentation

For comprehensive implementation details, see specialized context files:

- **[context-architecture.md](./context-architecture.md)** (126 lines) - System architecture, caching pipeline, build process, multi-brain template system
- **[context-features.md](./context-features.md)** (157 lines) - Enhanced markdown, search capabilities, publishing pipeline, UI features, AI integration
- **[context-tech-stack.md](./context-tech-stack.md)** (161 lines) - Backend/frontend technologies, build system, external integrations, security considerations
- **[context-mindmap.md](./context-mindmap.md)** (253 lines) - Mindmap system implementation, detection, generation, interactive controls, configuration
- **[context-link-preview.md](./context-link-preview.md)** (234 lines) - Link preview system with popover excerpts, CORS handling, content extraction

## Quick Reference for AI Code Generation

**Refer to README.md for high-level context; details are in specialized context files.**

### When to Read Full Files vs Targeted Search:
- **Small files (<100 lines)**: Read entire file (config files, simple scripts)
- **Medium files (100-500 lines)**: Consider targeted search for specific functions
- **Large files (500+ lines)**: Use targeted search unless full understanding needed

### Key File Sizes for Reference:
- `index.php`: 481 lines (medium - consider targeted search)
- `assets/js/mindmap.js`: 1681 lines (large - use targeted search)
- `assets/css/mindmap.css`: 458 lines (medium - consider targeted search)
- `assets/js/link-popover.js`: 444 lines (medium - consider targeted search)
- `assets/js/note-opener.js`: 1058 lines (large - use targeted search)
- `assets/js/index.js`: 399 lines (medium - consider targeted search)
- `assets/js/searchers.js`: 363 lines (medium - consider targeted search)
- `assets/js/image-modal.js`: 128 lines (small-medium - read full file)
- `assets/js/encryption.js`: encryption functionality (small - read full file)
- `assets/js/game.js`: 600 lines (large - use targeted search)
- Configuration files: <50 lines each (small - read full files)

This architecture enables efficient handling of thousands of notes while providing a rich, interactive experience for knowledge discovery, learning, and content management. The modular design supports easy feature extension and multiple knowledge domain deployments.

## AI Context Optimization

- **Total Documentation**: ~1170 lines across 6 focused files optimized for AI context windows
- **Main Overview**: This file (context.md) provides complete high-level understanding (240 lines)
- **Feature-Specific**: 5 specialized files for deep implementation details
- **Efficient Loading**: Each context file under 260 lines for optimal token usage
- **Code Generation Ready**: Includes file sizes, syntax examples, and implementation patterns