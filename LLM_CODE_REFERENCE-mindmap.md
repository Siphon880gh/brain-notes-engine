# DevBrain - Mindmap System Context

> **Note for AI Tools:** Line references in this file are intentionally approximate (e.g., "near the top," "around lines 100–150"). Exact line numbers are fragile and shift with edits. Use these as navigation hints, then search or read the actual file for precision.

## Overview

The mindmap system automatically detects specially formatted markdown lists and generates interactive visualizations using Mermaid.js. It provides multiple layout options, zoom controls, and fullscreen viewing capabilities.

## Core Components

### Detection System
- **Location**: `assets/js/mindmap.js` (near the top, roughly first 5% of file)
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
- **Location**: `assets/js/mindmap.js` (near the top, roughly 5-10% into file)
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
- **Location**: `assets/js/mindmap.js` (roughly 10-20% into file)
- **Functions**: `generateSpiderMermaid()`, `generateTreeMermaid()`, `generateSpreadMermaid()`
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
- **Location**: `config-mindmap.json` (~5 lines)
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
- **spread**: Organic force-based layout with variable node repulsion based on hierarchy level
- **tree**: Hierarchical tree flowing top-down
- **tree-down**: Same as tree (explicit)
- **tree-right**: Hierarchical tree flowing left-right

### Dynamic Configuration
- **Function**: `setMindmapConfig(config)`
- **Usage**: Change layout type programmatically
- **Effect**: Regenerates mindmap if currently displayed

### Spread Layout Configuration
- **Location**: `assets/js/mindmap.js` (roughly 50% into file)
- **Purpose**: Organic force-based layout with natural node distribution
- **Algorithm**: Uses D3.js force simulation with variable repulsion strength
- **Node Repulsion**: Root nodes have -1500 strength, child nodes have -800 to -900 based on hierarchy
- **Collision Detection**: Dynamic collision radius based on text length
- **Centering Forces**: Gentle attraction to viewport center with 0.08 strength

## UI Components

### Mindmap Button
- **Location**: `index.php` (roughly 75% into file)
- **CSS**: `assets/css/mindmap.css` (near the top)
- **Behavior**: Appears only when mindmap content detected
- **Position**: Fixed top-right, green circular button

### Mindmap Panel
- **Location**: `index.php` (roughly 75-80% into file)
- **CSS**: `assets/css/mindmap.css` (roughly 5-20% into file)
- **Features**: Slide-out panel with cycle type, zoom controls and fullscreen option
- **Controls**: Cycle type button (left), zoom buttons, fullscreen button
- **Responsive**: Adapts to mobile screens

### Fullscreen Modal
- **Location**: `index.php` (roughly 80-85% into file)
- **CSS**: `assets/css/mindmap.css` (roughly 25-40% into file)
- **Features**: Immersive viewing with dedicated controls
- **Controls**: Cycle type button (left), zoom buttons
- **Behavior**: Clones current mindmap for fullscreen display

## Interactive Controls

### Zoom System
- **Functions**: `zoomIn()`, `zoomOut()`, `resetZoom()`
- **Range**: 0.3x to 3x zoom levels
- **Smooth Scaling**: CSS transitions for smooth animations
- **Pan Support**: Drag functionality when zoomed > 1x

### Cycle Type System
- **Function**: `cycleMindmapType()`
- **Types**: Cycles through spider → spread → tree-down → tree-right → spider
- **UI**: Cycle button with sync icon in both panel and fullscreen modal
- **Tooltips**: Dynamic tooltips showing current type

### Drag & Pan
- **Functions**: `startDrag()`, `drag()`, `endDrag()`
- **Behavior**: Mouse-based dragging at all zoom levels
- **Visual Feedback**: Cursor changes to grab/grabbing with smooth transitions
- **Context Support**: Works in both mindmap panel and fullscreen modal

### Fullscreen Mode
- **Function**: `openFullScreenMindmap()`
- **Features**: Dedicated zoom controls, full viewport usage
- **Exit**: ESC key or close button

## Integration Points

### Note Loading Integration
- **Location**: `assets/js/note-opener.js` (roughly 45% into file)
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
- **Location**: `assets/js/mindmap.js` (roughly 30% into file)
- **Function**: `setupMindmapEventListeners()`
- **Events**: Click handlers for cycle type, zoom, fullscreen, keyboard shortcuts

## Styling System

### CSS Architecture
- **File**: `assets/css/mindmap.css` (~458 lines)
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

### Required Files (Line Counts for AI Reference)
- `assets/js/mindmap.js` (~1681 lines) - Core functionality [LARGE - use targeted search]
- `assets/css/mindmap.css` (~458 lines) - Styling [MEDIUM - consider targeted search]
- `config-mindmap.json` (~5 lines) - Configuration [SMALL - read full file]
- `index.php` (~480 lines) - HTML structure and integration [MEDIUM - consider targeted search]

### External Dependencies
- **Mermaid.js v10.6.1** - Diagram rendering
- **D3.js v7** - Force-based layout for spread type
- **Font Awesome 6.4.0** - UI icons
- **jQuery** - DOM manipulation (existing)

### Integration Dependencies (Line Counts for AI Reference)
- `assets/js/note-opener.js` (~1361 lines) - Content loading integration [LARGE]
- `assets/js/index.js` (~399 lines) - Main application logic [MEDIUM]
