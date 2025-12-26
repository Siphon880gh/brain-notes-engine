# DevBrain - Features & Functionality

> **Note for AI Tools:** Line references in this file are intentionally approximate (e.g., "near the top," "around lines 100–150"). Exact line numbers are fragile and shift with edits. Use these as navigation hints, then search or read the actual file for precision.

## Enhanced Markdown Support

### Obsidian-Style Features
- **Internal Links**: `[[Topic Title]]` creates internal navigation between notes
- **Collapsible Sections**: `> [!note] HEADING` syntax creates expandable content blocks
- **Math Equations**: KaTeX/LaTeX support with `$E = mc^2$` syntax
- **Heading Indentation**: Visual hierarchy with `<<<` reset markers for content organization
- **Highlight Syntax**: `==text==` renders as `<mark>text</mark>` with yellow background (#fff3a3)

### Markdown Processing Pipeline
```javascript
// From note-opener.js - markdown rendering flow (near middle of file)
// 1. Fetch markdown content via AJAX
// 2. Process with MarkdownIt + LaTeX support
// 3. Handle image path rewriting for hosted images
// 4. Render with syntax highlighting
```

## Search Capabilities

### Search Types
- **Title Search**: Searches filenames and folder names
- **Content Search**: Full-text search within markdown files
- **Real-time Results**: Instant search with highlighting
- **Exclusion Handling**: Skips binary files, git directories, node_modules

### Search Implementation
```php
// From search.php - search execution (entire file is ~21 lines)
$cmd = $pcregrep . ' -ri --exclude-dir=.git --exclude-dir=node_modules "' . $search . '" "' . $DIR_SNIPPETS . '"';
$res = [];
$stdout = exec($cmd, $res);
echo json_encode(["res"=>$res, "cmd"=>$cmd, "stdout"=>$stdout]);
```

## Publishing Pipeline

### Image Handling
- **Automatic Upload**: New local images uploaded to hosted image server
- **Path Rewriting**: Converts local image paths to hosted URLs
- **Thumbnail Generation**: Creates optimized thumbnails for faster loading
- **SEO Optimization**: Optional `<a>` tags for better search engine indexing

### Content Transformation
- **Obsidian to Web**: Transforms Obsidian vaults into public-facing knowledge bases
- **Multi-Environment**: Handles local development vs production paths
- **Template System**: Supports multiple knowledge collections with different configurations

## User Interface Features

### Navigation
- **Hierarchical File Tree**: Expandable folder structure with custom icons
- **Random Note**: Quick access to random content for discovery
- **Jump to Topics**: Direct navigation to specific sections
- **Print Support**: Print-friendly note rendering

### Interactive Elements
- **Modal System**: Overlay windows for notes, sharing, and AI assistance
- **Image Modal**: Click-to-expand fullscreen image viewing with keyboard support
- **Tooltip System**: Contextual help and information
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

### Image Enhancement Features
- **Click-to-Expand**: All images in notes can be clicked to open in fullscreen modal
- **Keyboard Navigation**: ESC key to close modals, smooth fade animations
- **Dynamic Detection**: Automatically attaches modal functionality to new images when content loads
- **Event Management**: Prevents modal triggers from interfering with other interactive elements

### Code Snippet Enhancement
- **Line Numbers**: Automatic line number gutter on the left side of all code blocks
- **Copy Button**: Custom copy button with "Copied!" feedback and checkmark animation
- **Syntax Highlighting**: Language-aware syntax highlighting with Highlight.js
- **Dark Theme**: Modern dark theme styling (#2d2d2d background) for improved readability
- **No Language Label**: Clean UI without language labels (which can be incorrect)
- **Clipboard API**: Uses modern `navigator.clipboard` with fallback for older browsers
- **Responsive**: Horizontal scroll for long lines while maintaining line number alignment
- **Implementation**: Located in `note-opener.js` function `addLineNumbersToCodeBlocks()` (near middle of file)
- **CSS Styling**: Code block styles in `index.css` under `.code-block-wrapper` and `.code-copy-btn` sections

## AI Integration

### "Ask Folder" Feature
- **Context-Aware**: AI can analyze entire folder contents
- **Large Prompt Handling**: Manages prompts too large for direct API calls
- **ChatGPT Integration**: Seamless connection to external AI services
- **Content Generation**: AI-assisted note creation and improvement

### AI-Assisted Content
- **Writing Improvement**: AI can rewrite notes for clarity and readability
- **Content Enhancement**: Suggests improvements while preserving markdown formatting
- **Image Preservation**: Maintains Obsidian-style image links during AI processing

## Encryption Support

### AGE Encryption Integration
- **AGE Format Detection**: Automatically detects AGE-encrypted content in markdown files
- **Password-Protected UI**: Clean, secure password entry modal with error handling
- **Seamless Integration**: Encrypted content renders exactly like regular notes after decryption
- **Full Feature Support**: Decrypted content supports all DevBrain features (mindmaps, link previews, TOC, etc.)
- **Fallback Support**: Works with or without the `age` binary installed

### Encryption Architecture
- **Backend Decryption**: `decrypt-age.php` (~1411 lines) handles AGE decryption and re-encryption with AES-256-CBC
- **Client-Side Decryption**: JavaScript handles AES-256-CBC decryption with PBKDF2 key derivation
- **Security Flow**: AGE → PHP backend → AES-256-CBC → JavaScript client → rendered content
- **Caching**: Decrypted content cached for session duration only

## Sharing & Collaboration

### URL Generation
- **Note Sharing**: Direct links to specific notes
- **Search Sharing**: Shareable URLs for search results
- **Embed Support**: Code snippets for embedding content

### Git Integration
- **"What's Changed"**: Links to repository commits showing recent updates
- **Version Control**: Tracks changes across multiple knowledge collections
- **Collaborative Editing**: Supports multiple contributors through git workflow

## Multi-Brain Support

### Knowledge Collections
- **Developer Brain**: Coding, web development, mobile development, AI/ML
- **3D Brain**: 3D modeling, game development, video/photo editing
- **Business Brain**: Tech startups, entrepreneurship, business strategy
- **Health Brain**: Health notes, wellness, medical information

### Template Customization
Each brain can have:
- Custom icons and branding
- Specialized content organization
- Domain-specific features
- Independent deployment pipelines

## Future Features (Planned)

### Game Modes (`future-game-mode/`)
- **Copy to Practice**: Interactive learning exercises
- **Error Handling**: Gamified error correction
- **Puzzler**: Problem-solving challenges
- **Rearranger**: Content organization games
- **Retyper**: Typing practice with code snippets

### Learning Progress (`future-learning-progress/`)
- **Mastery Tracking**: Progress monitoring for concepts
- **Importance Rating**: Thermometer-style importance indicators
- **Review Scheduling**: Spaced repetition system

## Performance Features

### Optimization
- **Lazy Loading**: Notes loaded on-demand to reduce initial load time
- **Caching Strategy**: Pre-computed file structures and rendered content
- **Image Optimization**: Compressed thumbnails and hosted image serving
- **Search Efficiency**: Optimized regex patterns and file exclusion

### Scalability
- **Large Dataset Support**: Handles thousands of notes efficiently
- **Memory Management**: Efficient data structures for large file trees
- **Network Optimization**: Minimized AJAX requests and data transfer

## AI Code Generation Guidelines

### File Size Reference for Efficient Development
- **SMALL files (<100 lines)**: Read entire file for full context
- **MEDIUM files (100-500 lines)**: Consider targeted search for specific functions
- **LARGE files (500+ lines)**: Use targeted search unless complete understanding needed

### Key File Sizes for Features
- **`assets/js/image-modal.js`** (~127 lines): Image modal functionality [SMALL-MEDIUM]
- **`assets/js/link-popover.js`** (~550 lines): Link preview system [LARGE]
- **`assets/js/note-opener.js`** (~1464 lines): Note rendering, content loading, code blocks [LARGE]
- **`assets/js/mindmap.js`** (~1681 lines): Mindmap generation and controls [LARGE]
- **`assets/js/encryption.js`** (~399 lines): Encryption management [MEDIUM]
- **`assets/css/index.css`** (~1294 lines): Main styling including code blocks [LARGE]

### Key Implementation Patterns
- **Feature Detection**: Check for placeholder images (`1x1.png`, `1x2.png`) before activation
- **Event-Driven Architecture**: Features initialize on content load and update events
- **Graceful Degradation**: All features work with or without external dependencies
- **Modular Design**: Each feature system is self-contained with clear integration points
