# DevBrain - Architecture & Core Systems

## System Architecture

### Multi-Brain Template System
The application supports multiple "brains" (knowledge collections) through a template system:

```
env/
├── templates-devbrain/     # Developer notes template
├── templates-3dbrain/      # 3D modeling notes template  
├── templates-bizbrain/     # Business notes template
└── templates-healthbrain/  # Health notes template
```

Each template contains:
- `description.php`: Badge links and description
- `title.php` / `title-long.php`: Page titles
- `dir-snippets.php`: Curriculum directory path
- `icons.js`: Custom icons for topics
- `urls.json`: Repository URLs for "what's changed" links

### Caching Pipeline Architecture

1. **Data Collection** (`cache_data.js` - 153 lines)
   - Scans curriculum directory recursively
   - Builds hierarchical file tree structure
   - Collects metadata and sorting specifications
   - Excludes git directories and node_modules
   - Outputs: `cachedResData.json`

2. **HTML Generation** (`cache_render.js` - 226 lines)
   - Reads cached data from JSON
   - Merges folders by common path
   - Applies Obsidian sort specifications
   - Generates HTML using EJS templates
   - Outputs: `cachedResPartial.php`

### Build Process Flow
```bash
# Build specific brain variant
npm run build-devbrain    # Copies template, caches data, renders HTML
npm run build-3dbrain     # Same process for 3D notes
npm run build-bizbrain    # Same process for business notes
npm run build-healthbrain # Same process for health notes
```

## Core Components

### Main Application (`index.php` - 456 lines)
- Entry point with HTML structure
- Environment configuration loading
- Modal system for notes and sharing
- Integration with cached content
- Multi-brain template switching

### Search System (`search.php` - 21 lines)
- Uses `pcregrep` for full-text search across markdown files
- Supports both title and content searching
- Excludes binary files and git directories
- Returns JSON results for AJAX consumption

### Frontend Architecture (`assets/js/` - 11 files)
- `index.js` (399 lines): Main application logic, note opening, UI interactions
- `searchers.js` (363 lines): Search functionality and result display
- `modal.js` (27 lines): Modal system management
- `note-opener.js` (956 lines): Markdown rendering and note display
- `image-modal.js` (127 lines): Image viewing functionality
- `mindmap.js` (792 lines): Interactive mindmap generation and controls
- `game.js` (600 lines): Game mode functionality
- `multistates.js` (230 lines): Multi-state UI components
- `diff.js` (39 lines): Content comparison utilities

## File Structure

```
devbrain/
├── index.php                 # Main application (456 lines)
├── cache_data.js            # File tree caching (153 lines)
├── cache_render.js          # HTML generation (226 lines)
├── search.php               # Search endpoint (21 lines)
├── assets/
│   ├── css/                 # Styling (8 CSS files)
│   └── js/                  # Frontend logic (11 JS files)
├── env/                     # Configuration templates
│   ├── templates-devbrain/  # Developer notes config
│   ├── templates-3dbrain/   # 3D notes config
│   ├── templates-bizbrain/  # Business notes config
│   └── templates-healthbrain/ # Health notes config
├── curriculum/              # Markdown notes (separate repo)
└── future-*/               # Planned features (game modes, progress tracking)
```

## Environment Configuration

### Required Files
- `.env`: Contains `DIR_SNIPPETS` path to curriculum directory
- `env/urls.json`: Repository URLs for git integration
- `3dbrain.config.json`: Image hosting configuration

### Template Variables
Each brain template can override:
- Page titles and descriptions
- Curriculum directory paths
- Custom icons for topics
- Repository URLs for "what's changed" links

## Performance Considerations

- **Caching**: All file structure is pre-cached to avoid filesystem scanning
- **Lazy Loading**: Notes are loaded on-demand via AJAX
- **Search Optimization**: Uses efficient `pcregrep` for text searching
- **Image Optimization**: Thumbnail generation and hosted image serving

## Development Workflow

1. **Content Creation**: Write markdown notes in Obsidian or preferred editor
2. **Local Testing**: Run `npm run build-devbrain` to generate cached content
3. **Deployment**: Use `npm run deploy` to push to remote server
4. **Server Pipeline**: Remote PHP script pulls changes and rebuilds cache
