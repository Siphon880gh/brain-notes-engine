# DevBrain - Link Popover Preview System Context

> **Note for AI Tools:** Line references in this file are intentionally approximate (e.g., "near the top," "around lines 100–150"). Exact line numbers are fragile and shift with edits. Use these as navigation hints, then search or read the actual file for precision.

## Overview

The link popover preview system provides automatic hover previews that display selected excerpts from external links without navigating away from the current page. This feature enhances user experience by allowing quick content previews with smart content extraction based on boundary words.

## Core Components

### Detection System
- **Trigger**: Uses `1x2.png` placeholder image with specific patterns in alt text
- **Patterns**: 
  - `startWord..endWord` or `startWord...endWord` format for external content extraction
  - `linkText##previewText` format for custom preview text
- **Location**: Integrated with existing tooltip and modal systems
- **File**: `assets/js/link-popover.js` (~550 lines)

### Link Preview Features
- **Popover Display**: Hover or click to show preview in popover with extracted or custom content
- **Selected Excerpt**: Alt text with ellipsis pattern indicates excerpt range for external content
- **Custom Preview**: Alt text with `##` delimiter allows defining custom preview text
- **Responsive Design**: Works on desktop and mobile devices with contextual positioning
- **CORS Handling**: Uses proxy service (`api.allorigins.win`) to bypass CORS restrictions
- **Performance**: Caches results to avoid repeated requests
- **Error Handling**: Graceful fallbacks for failed requests

## Implementation Details

### File Structure (Line Counts for AI Reference)
```
assets/
├── js/link-popover.js     # Main implementation (~550 lines) [LARGE]
├── css/link-popover.css   # Styling and animations (~430 lines) [MEDIUM]
└── 1x2.png               # Marker image file [BINARY]
```

### Core JavaScript Class
Near the top of `link-popover.js`:
```javascript
class LinkPopoverPreview {
    constructor() {
        this.cache = new Map();
        this.activePopover = null;
        this.hoverTimeout = null;
        this.hideTimeout = null;
        this.proxyUrl = 'https://api.allorigins.win/get?url=';
    }
}
```

### Key Methods
- **`enhanceLinks()`**: Main function to scan and enhance links with popover previews
- **`findLinksWithMarkers()`**: Detects links followed by `1x2.png` images
- **`parseBoundaryWords()`**: Extracts boundary words or custom preview data from image alt text
- **`fetchContent()`**: Retrieves content via CORS proxy with error handling
- **`extractContentBetweenWords()`**: Finds and extracts content between boundary words
- **`showCustomPopover()`**: Shows popover with custom preview text (no external fetching)
- **`rescan()`**: Re-scans for new links after dynamic content updates

## Markdown Syntax

### Basic Structure for External Content
```markdown
[Link Text](https://example.com) ![startWord..endWord](../1x2.png)
```

### Basic Structure for Custom Preview
```markdown
[Any Text](https://example.com) ![linkText##previewText](../1x2.png)
```

### Syntax Rules
- **Link**: Standard markdown link format `[text](url)`
- **Marker Image**: Immediately after the link, add image with specific alt pattern
- **External Content**: Use `startWord..endWord` or `startWord...endWord` format
- **Custom Preview**: Use `linkText##previewText` format for instant preview text
- **Image File**: Must be named `1x2.png` or contain `1x2` in the filename

### Examples - External Content Extraction
```markdown
[MDN JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript) ![JavaScript...Reference](../1x2.png)
[GitHub](https://github.com) ![About...Features](../1x2.png)
```

### Examples - Custom Preview Text
```markdown
[Any Link](https://example.com) ![API##Application Programming Interface - a set of protocols](../1x2.png)
[Term](https://example.com) ![CSS##Cascading Style Sheets - used to style web pages](../1x2.png)
```

## Integration Points

### HTML Integration
```html
<!-- Add to <head> section -->
<link href="assets/css/link-popover.css" rel="stylesheet">

<!-- Add before </body> -->
<script src="assets/js/link-popover.js"></script>
```

### Dynamic Content Integration
```javascript
// In note-opener.js, after markdown is rendered:
window.linkPopoverPreview.rescan();
```

### CSS Integration
- **Enhanced Link Styling**: Dotted border with hover effects
- **Popover Positioning**: Contextual positioning relative to link
- **Animation**: Fade-in/out animations with smooth transitions
- **Responsive Design**: Mobile-friendly touch controls and positioning

## Performance Considerations

### Optimization Features
- **Lazy Loading**: Previews loaded on-demand (300ms hover delay)
- **Caching**: Results cached in Map to avoid repeated requests
- **Efficient DOM**: Minimal DOM manipulation with event delegation
- **Memory Management**: Automatic cleanup of timeouts and popover elements

### Mobile Support
- **Touch Controls**: Mobile-friendly interaction patterns
- **Responsive Design**: Adapts to different screen sizes
- **Performance**: Optimized for mobile rendering with reduced animations

## Error Handling

### Graceful Degradation
- **Missing Images**: Falls back to standard link behavior
- **Invalid Alt Text**: Skips malformed preview specifications
- **Loading Errors**: Shows user-friendly error messages
- **CORS Failures**: Handles proxy service failures gracefully

### Debug Information
- **Console Logging**: Detailed preview generation process
- **Error Display**: User-friendly error messages in popover
- **Fallback Content**: Standard link behavior when preview fails

## Configuration Options

Near the middle of the file, configurable settings:
```javascript
// Hover delays (in milliseconds)
this.hoverTimeout = setTimeout(() => {
    this.showPopover(event.target, url, startWord, endWord);
}, 300); // Show delay

this.hideTimeout = setTimeout(() => {
    this.hidePopover();
}, 200); // Hide delay

// Excerpt length limit
if (excerpt.length > 500) {
    excerpt = excerpt.substring(0, 500) + '...';
}

// Proxy service URL
this.proxyUrl = 'https://api.allorigins.win/get?url=';
```

## Custom Preview Feature

### Overview
The custom preview feature allows you to define any preview text directly in the image alt tag using the `##` delimiter, without fetching external content.

### How It Works
1. **Pattern Detection**: Alt text with `##` is recognized as custom preview
2. **Link Transformation**: Original link text is replaced with the left side of `##`
3. **Link Behavior**: Link href is set to `#` and click is prevented
4. **Popover Content**: Right side of `##` is shown as preview text
5. **Styling**: Custom preview links get purple color and help cursor

### Benefits
- **No Network Requests**: Instant preview without external fetching
- **Custom Definitions**: Perfect for glossaries, abbreviations, and explanations
- **Offline Ready**: Works without internet connection
- **Performance**: Zero latency for preview display

### Use Cases
- **Glossary Terms**: Define technical terms inline
- **Abbreviations**: Expand acronyms and abbreviations  
- **Quick Explanations**: Provide context without leaving the page
- **Educational Content**: Add definitions and explanations

## Browser Support

- **Chrome 60+**: Full support with all features
- **Firefox 55+**: Full support with all features  
- **Safari 12+**: Full support with all features
- **Edge 79+**: Full support with all features

## Security Considerations

- **CORS Proxy**: Uses public proxy service for external content
- **No Sensitive Data**: No sensitive information transmitted
- **Client-Side Only**: All processing happens in browser
- **Content Sanitization**: HTML content parsed and text extracted safely

## Dependencies

### Required Files
- **Font Awesome 5.9.0+**: For loading and error icons
- **Modern Browser**: ES6+ support required
- **Internet Connection**: For CORS proxy requests (external content only)

### Integration Dependencies
- **jQuery**: For DOM manipulation (already included)
- **Existing Modal System**: Compatible with current modal infrastructure
- **CSS Framework**: Works with existing Tailwind CSS setup
