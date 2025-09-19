# Context: Link Preview Feature

## Overview

The link preview feature provides contextual information about links through popover iframes that display selected excerpts from linked content. This enhances the user experience by allowing quick previews without navigating away from the current page.

## Core Functionality

### Popover Iframe with Selected Excerpt
- **Trigger**: Hover or click on links within content
- **Display**: Popover containing iframe with excerpt from linked content
- **Content**: Selected excerpt from the target page/content
- **Positioning**: Contextual positioning relative to the link

### 1x1 PNG Placeholder
- **Purpose**: Used as a visual indicator for link preview functionality
- **Alt Text Format**: Should contain ellipsis pattern: `a b...c d`
- **Usage**: Embedded in markdown content to trigger preview behavior
- **Example**: `![a b...c d](img/1x1.png)`

## Technical Implementation

### CSS Classes
```css
/* Tooltip for .json file's description property */
.tooltip {
  opacity: 1 !important;
}

.tooltip-inner {
  font-size: 12px;
  background: lightgreen;
  border: 1px solid #737373;
  text-align: left;
  max-width: 80% !important;
  max-height: 80% !important;
  overflow: scroll;
}

.tooltip-inner img {
  width: 100%;
}
```

### Iframe Container
```css
.responsive-iframe-container {
  position: relative;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
  height: 0;
}

.responsive-iframe-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

### JavaScript Integration
- **Tooltip System**: Uses existing tooltip infrastructure from `assets/js/index.js`
- **Iframe Handling**: Leverages responsive iframe container patterns
- **Content Extraction**: Processes selected excerpts for display
- **Event Handling**: Manages hover/click interactions for preview triggers

## Usage Patterns

### Markdown Integration
```markdown
# Topic with Link Preview ![a b...c d](img/1x1.png)

- Subtopic with preview ![excerpt text...more content](img/1x1.png)
  - Detail with preview ![selected...excerpt](img/1x1.png)
```

### Alt Text Conventions
- **Format**: `start text...end text`
- **Purpose**: Indicates the excerpt that will be shown in preview
- **Example**: `a b...c d` shows excerpt from "a b" to "c d"

## Integration Points

### Existing Systems
- **Tooltip System**: Extends current tooltip functionality
- **Iframe Handling**: Uses responsive iframe container patterns
- **Image Processing**: Integrates with existing image enhancement system
- **Content Management**: Works with note opening and content display systems

### File Dependencies
- `assets/css/index.css` - Tooltip and iframe styling
- `assets/js/index.js` - Tooltip interaction handling
- `assets/js/note-opener.js` - Content processing and iframe integration
- `curriculum/img/1x1.png` - Placeholder image for preview triggers

## Future Enhancements

### Planned Features
- **Dynamic Content Loading**: Real-time excerpt extraction
- **Caching System**: Store preview content for performance
- **Custom Positioning**: Advanced popover positioning logic
- **Mobile Optimization**: Touch-friendly preview interactions

### Technical Considerations
- **Performance**: Lazy loading of preview content
- **Accessibility**: Screen reader compatibility
- **Responsive Design**: Mobile and tablet optimization
- **Cross-Origin**: Handling of external link previews
