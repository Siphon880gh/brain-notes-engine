# DevBrain - Features & Functionality

## Enhanced Markdown Support

### Obsidian-Style Features
- **Internal Links**: `[[Topic Title]]` creates internal navigation between notes
- **Collapsible Sections**: `> [!note] HEADING` syntax creates expandable content blocks
- **Math Equations**: KaTeX/LaTeX support with `$E = mc^2$` and `@(1/2[1-(1/2)^n])/(1-(1/2))=s_n@` syntax
- **Heading Indentation**: Visual hierarchy with `<<<` reset markers for content organization

### Markdown Processing Pipeline
```javascript
// From note-opener.js - markdown rendering flow
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
// From search.php - search execution
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
- **Tooltip System**: Contextual help and information
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Keyboard Shortcuts**: Efficient navigation and interaction

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
- **Performance Analytics**: Learning pattern analysis

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
- **Browser Compatibility**: Works across modern browsers with graceful degradation

## AI Code Generation Guidelines

### File Size Reference for Efficient Development
- **SMALL files (<100 lines)**: Read entire file for full context
- **MEDIUM files (100-500 lines)**: Consider targeted search for specific functions
- **LARGE files (500+ lines)**: Use targeted search unless complete understanding needed

### Key Implementation Patterns
- **Feature Detection**: Check for placeholder images (`1x1.png`, `1x2.png`) before activation
- **Event-Driven Architecture**: Features initialize on content load and update events
- **Graceful Degradation**: All features work with or without external dependencies
- **Modular Design**: Each feature system is self-contained with clear integration points
