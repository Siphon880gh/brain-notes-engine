# DevBrain - Technical Stack & Implementation

> **Note for AI Tools:** Line references in this file are intentionally approximate (e.g., "near the top," "around lines 100–150"). Exact line numbers are fragile and shift with edits. Use these as navigation hints, then search or read the actual file for precision.

## Backend Technologies

### PHP Backend (`index.php` - ~480 lines)
- **Server-Side Rendering**: Main application entry point
- **Environment Management**: Dynamic configuration loading
- **Error Handling**: Comprehensive error reporting and debugging
- **Session Management**: User state and interaction tracking

### Encryption Backend (`decrypt-age.php` - ~1411 lines)
- **AGE Decryption**: Handles AGE-encrypted content decryption
- **Re-encryption**: Converts AGE to AES-256-CBC for client-side handling
- **Fallback Support**: Works with or without AGE binary installed
- **Node.js Integration**: ES module support for age-encryption package (v0.2.4)
- **Configuration Bypass**: Optional bypass of age binary to use Node.js as primary method

### Search Engine (`search.php` - ~21 lines)
- **PCRE Integration**: Perl Compatible Regular Expressions via `pcregrep`
- **File System Search**: Recursive directory scanning with exclusions
- **JSON API**: RESTful search endpoint returning structured results

## Frontend Technologies

### JavaScript Framework
- **jQuery**: DOM manipulation and AJAX requests
- **jQuery UI**: Interactive components and widgets
- **Vanilla JS**: Custom application logic and utilities
- **ES6+ Features**: Modern JavaScript with async/await patterns
- **Web Crypto API**: Client-side encryption/decryption with AES-256-CBC and PBKDF2
- **Encryption Manager**: AGE format detection and hybrid encryption workflow

### CSS Framework
- **Tailwind CSS**: Utility-first styling framework
- **FontAwesome**: Icon library for UI elements
- **Highlight.js**: Syntax highlighting for code blocks
- **Custom CSS**: Project-specific styling and animations (~2700 lines total)

### Markdown Processing
- **MarkdownIt**: Core markdown parsing and rendering
- **LaTeX Support**: Mathematical equation rendering
- **Emoji Support**: Enhanced markdown with emoji processing
- **Anchor Generation**: Automatic heading anchors for navigation

## Build System

### Node.js Pipeline
- **File System Operations**: Recursive directory scanning and processing
- **EJS Templating**: Server-side HTML generation
- **JSON Processing**: Data serialization and caching
- **Environment Variables**: Configuration management with dotenv

### Build Scripts (`package.json`)
```json
{
  "scripts": {
    "build-devbrain": "cp -r ./env/templates-devbrain/* ./env && node cache_data.js && node cache_render.js",
    "build-3dbrain": "cp -r ./env/templates-3dbrain/* ./env && node cache_data.js && node cache_render.js",
    "build-bizbrain": "cp -r ./env/templates-bizbrain/* ./env && node cache_data.js && node cache_render.js",
    "build-healthbrain": "cp -r ./env/templates-healthbrain/* ./env && node cache_data.js && node cache_render.js"
  }
}
```

## Data Management

### Caching System
- **File Tree Caching**: Pre-computed directory structures
- **Content Caching**: Rendered HTML partials
- **Metadata Storage**: JSON-based configuration and state
- **Performance Optimization**: Reduced filesystem operations

### Data Flow
1. **Content Creation**: Markdown files in curriculum directory
2. **Data Collection**: `cache_data.js` scans and structures content
3. **HTML Generation**: `cache_render.js` creates renderable partials
4. **Runtime Loading**: JavaScript loads cached data for UI rendering

## External Integrations

### CDN Resources
- **jQuery**: `https://code.jquery.com/jquery-2.1.4.min.js`
- **jQuery UI**: `https://code.jquery.com/ui/1.12.1/jquery-ui.min.js`
- **FontAwesome**: `https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.9.0/css/all.min.css`
- **Tailwind CSS**: `https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/components.min.css`
- **Highlight.js**: `https://unpkg.com/highlightjs@9.16.2/highlight.pack.min.js`
- **Mermaid.js**: `https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js`
- **D3.js**: `https://d3js.org/d3.v7.min.js`
- **MarkdownIt**: `https://cdn.jsdelivr.net/npm/markdown-it@12.0.4/dist/markdown-it.min.js`

### Third-Party Services
- **Image Hosting**: Custom image server integration via `config.json`
- **Git Integration**: Repository URL management through `env/urls.json`
- **AI Services**: ChatGPT integration for content assistance
- **CORS Proxy**: `api.allorigins.win` for link preview content extraction
- **AGE Encryption**: Command-line encryption tool for secure note storage

## Development Tools

### Build Dependencies
```json
{
  "dependencies": {
    "age-encryption": "^0.2.4",
    "dotenv": "^16.4.5",
    "ejs": "^3.1.10"
  }
}
```

### Development Scripts
- **Watch Mode**: `concurrently 'compass watch ./' 'livereload .'`
- **Pull Updates**: Git integration for content synchronization
- **Deploy Pipeline**: Automated deployment to remote servers

## Configuration Management

### Environment Variables
- **DIR_SNIPPETS**: Path to curriculum directory
- **HTTP_TO_FILE_PROTOCOL**: File protocol for local development
- **WANT_A_TAG_FOR_SEO**: SEO optimization toggle
- **PCREGREP_PATH**: Custom pcregrep executable path
- **AGE_PATH**: Custom AGE binary path configuration
- **NODEJS_PATH**: Custom Node.js executable path configuration
- **BYPASS_AGE_BINARY**: Configuration flag to use Node.js as primary decryption method

### Template System
- **Multi-Brain Support**: Separate configurations for different knowledge collections
- **Dynamic Loading**: Runtime template switching
- **Customization**: Per-brain icons, titles, and descriptions
- **URL Management**: Repository and deployment URL configuration

## Security Considerations

### Input Validation
- **Search Sanitization**: Prevents injection attacks in search queries
- **File Path Validation**: Ensures safe file system access
- **XSS Prevention**: Proper output escaping and sanitization

### Access Control
- **Directory Traversal Protection**: Prevents unauthorized file access
- **Git Directory Exclusion**: Hides sensitive version control data
- **Binary File Filtering**: Excludes potentially dangerous file types

## Performance Optimization

### Frontend Optimization
- **Lazy Loading**: On-demand content loading
- **Image Optimization**: Thumbnail generation and compression
- **Caching Strategy**: Browser and server-side caching
- **Minification**: Compressed CSS and JavaScript

### Backend Optimization
- **Pre-computed Data**: Cached file structures and metadata
- **Efficient Search**: Optimized regex patterns and file filtering
- **Memory Management**: Efficient data structures for large datasets
- **Database Alternative**: File-based storage for simplicity and performance

## Browser Compatibility

### Supported Browsers
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Support**: Responsive design for mobile devices
- **Progressive Enhancement**: Graceful degradation for older browsers
- **JavaScript Requirements**: ES6+ features with fallbacks

### Feature Detection
- **PCRE Support**: Server-side validation of search capabilities
- **File API**: Client-side file handling where supported
- **CSS Grid/Flexbox**: Modern layout techniques with fallbacks
- **MutationObserver**: For dynamic content detection (image modals, link previews)
- **CSS `:has()` Selector**: Modern CSS feature for hiding placeholder images
- **Node.js ES Modules**: Dynamic import support for age-encryption package (Node.js v14+)
- **Web Crypto API**: Client-side encryption/decryption with PBKDF2 and AES-256-CBC
