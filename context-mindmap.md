# DevBrain - Mindmap System Context

## Overview

The mindmap system automatically detects specially formatted markdown lists and generates interactive visualizations using Mermaid.js. It provides multiple layout options, zoom controls, and fullscreen viewing capabilities.

## Core Components

### Detection System
- **Location**: `assets/js/mindmap.js` (lines 25-35)
- **Function**: `detectMindmapContent()`
- **Logic**: Scans `#summary-inner` for images with `1x1.png` in src attribute

```javascript
function detectMindmapContent() {
    const contentEl = document.getElementById('summary-inner');
    if (!contentEl) return false;
    
    const mindmapImages = contentEl.querySelectorAll('img[src*="1x1.png"], img[src$="1x1.png"]');
    return mindmapImages.length > 0;
}
```

### List Parsing
- **Location**: `assets/js/mindmap.js` (lines 37-65)
- **Function**: `traverseList()`
- **Logic**: Recursively parses nested lists, extracting alt text from 1x1.png images

```javascript
function traverseList(ul) {
    let nodes = [];
    const directLiChildren = Array.from(ul.children).filter(child => child.tagName === 'LI');
    
    for (const li of directLiChildren) {
        let img = li.querySelector('img[src*="1x1"], img[src$="1x1.png"]');
        let label = img ? img.alt.trim() : '';
        
        if (!label) continue;
        
        let childList = li.querySelector(':scope > ul');
        let children = childList ? traverseList(childList) : [];
        
        nodes.push({ label, children });
    }
    
    return nodes;
}
```

### Mermaid Generation
- **Location**: `assets/js/mindmap.js` (lines 85-150)
- **Functions**: `generateSpiderMermaid()`, `generateTreeMermaid()`
- **Logic**: Converts parsed tree structure to Mermaid syntax

```javascript
function generateSpiderMermaid(mindmapTree) {
    const rootText = getRootNodeText();
    let mermaid = `mindmap\n  root)${rootText}(\n`;
    
    for (const node of mindmapTree) {
        mermaid += treeToMermaid(node, 2);
    }
    
    return mermaid;
}
```

## Configuration System

### Configuration File
- **Location**: `mindmap-config.json` (6 lines)
- **Purpose**: Controls default mindmap layout type

```json
{
  "mindmap": {
    "type": "spider"
  }
}
```

### Layout Types
- **spider**: Radial layout with central root (default)
- **tree**: Hierarchical tree flowing top-down
- **tree-down**: Same as tree (explicit)
- **tree-right**: Hierarchical tree flowing left-right

### Dynamic Configuration
- **Function**: `setMindmapConfig(config)`
- **Usage**: Change layout type programmatically
- **Effect**: Regenerates mindmap if currently displayed

## UI Components

### Mindmap Button
- **Location**: `index.php` (lines 371-373)
- **CSS**: `assets/css/mindmap.css` (lines 1-20)
- **Behavior**: Appears only when mindmap content detected
- **Position**: Fixed top-right, green circular button

### Mindmap Panel
- **Location**: `index.php` (lines 376-401)
- **CSS**: `assets/css/mindmap.css` (lines 22-80)
- **Features**: Slide-out panel with zoom controls and fullscreen option
- **Responsive**: Adapts to mobile screens

### Fullscreen Modal
- **Location**: `index.php` (lines 404-425)
- **CSS**: `assets/css/mindmap.css` (lines 120-180)
- **Features**: Immersive viewing with dedicated controls
- **Behavior**: Clones current mindmap for fullscreen display

## Interactive Controls

### Zoom System
- **Functions**: `zoomIn()`, `zoomOut()`, `resetZoom()`
- **Range**: 0.3x to 3x zoom levels
- **Smooth Scaling**: CSS transitions for smooth animations
- **Pan Support**: Drag functionality when zoomed > 1x

### Drag & Pan
- **Functions**: `startDrag()`, `drag()`, `endDrag()`
- **Behavior**: Mouse-based dragging when zoomed
- **Visual Feedback**: Cursor changes to grab/grabbing

### Fullscreen Mode
- **Function**: `openFullScreenMindmap()`
- **Features**: Dedicated zoom controls, full viewport usage
- **Exit**: ESC key or close button

## Integration Points

### Note Loading Integration
- **Location**: `assets/js/note-opener.js` (lines 618-624)
- **Trigger**: After markdown content is rendered
- **Functions**: `initializeMindmapFeature()`, `onMarkdownContentUpdated()`

```javascript
// Initialize mindmap feature after content is loaded
if (typeof initializeMindmapFeature === 'function') {
    initializeMindmapFeature();
}
if (typeof onMarkdownContentUpdated === 'function') {
    onMarkdownContentUpdated();
}
```

### Event Management
- **Location**: `assets/js/mindmap.js` (lines 450-500)
- **Function**: `setupMindmapEventListeners()`
- **Events**: Click handlers, keyboard shortcuts, outside clicks

## Styling System

### CSS Architecture
- **File**: `assets/css/mindmap.css` (289 lines)
- **Components**: Button, panel, fullscreen modal, responsive design
- **Features**: Smooth animations, hover effects, mobile optimization

### Image Hiding
- **CSS Rule**: `.img-wrapper:has(img[src*="1x1"]) { display: none !important; }`
- **Purpose**: Hides placeholder images from rendered content
- **Implementation**: Uses CSS `:has()` selector for modern browsers

### Color Styling
- **Function**: `colorMindmapBranches()`
- **Palette**: Golden-angle color distribution
- **Application**: Dynamic CSS injection for branch colors

## Markdown Syntax

### Basic Structure
```markdown
# Root Topic ![Root](img/1x1.png)

- Subtopic 1 ![Subtopic1](img/1x1.png)
  - Detail A ![DetailA](img/1x1.png)
  - Detail B ![DetailB](img/1x1.png)
- Subtopic 2 ![Subtopic2](img/1x1.png)
```

### Requirements
- **Image Path**: Must contain `1x1.png` or end with `1x1.png`
- **Alt Text**: Used as node label in mindmap
- **Nesting**: Supports unlimited depth levels
- **Mixed Content**: Can combine with regular markdown

## Performance Considerations

### Detection Optimization
- **Scope**: Limited to `#summary-inner` container
- **Caching**: Results cached until content changes
- **Efficiency**: Single DOM query for detection

### Rendering Performance
- **Lazy Loading**: Mindmap generated only when panel opened
- **Mermaid Optimization**: Uses `startOnLoad: false` for manual control
- **Memory Management**: Clears previous data on content updates

### Mobile Optimization
- **Responsive Design**: Adaptive panel sizing
- **Touch Controls**: Mobile-friendly button sizes
- **Performance**: Optimized for mobile rendering

## Error Handling

### Graceful Degradation
- **Missing Dependencies**: Falls back to default configuration
- **Rendering Errors**: Shows error message with debug info
- **Invalid Content**: Skips malformed list items

### Debug Information
- **Console Logging**: Detailed generation process logging
- **Error Display**: User-friendly error messages in UI
- **Fallback Content**: Shows "No mindmap available" when appropriate

## File Dependencies

### Required Files
- `assets/js/mindmap.js` (594 lines) - Core functionality
- `assets/css/mindmap.css` (289 lines) - Styling
- `mindmap-config.json` (6 lines) - Configuration
- `index.php` - HTML structure and integration

### External Dependencies
- **Mermaid.js v10.6.1** - Diagram rendering
- **Font Awesome 6.4.0** - UI icons
- **jQuery** - DOM manipulation (existing)

### Integration Dependencies
- `assets/js/note-opener.js` - Content loading integration
- `assets/js/index.js` - Main application logic
