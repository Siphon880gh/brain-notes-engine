# DevBrain - Link Preview System Context

## Overview

The link preview system provides popover previews that display selected excerpts from linked content without navigating away from the current page. This feature enhances user experience by allowing quick content previews.

## Core Components

### Detection System
- **Trigger**: Uses `1x2.png` placeholder image with ellipsis pattern in alt text
- **Pattern**: Alt text follows `start text...end text` format to indicate excerpt range
- **Location**: Integrated with existing tooltip and modal systems

### Link Preview Features
- **Popover Display**: Hover or click to show preview in popover iframe
- **Selected Excerpt**: Alt text with ellipsis pattern indicates excerpt range
- **Responsive Design**: Works on desktop and mobile devices
- **Contextual Positioning**: Popover positions relative to the link
- **Content Integration**: Seamlessly integrates with existing tooltip system

## Markdown Syntax

### Basic Structure
```markdown
# Topic with Link Preview ![a b...c d](img/1x2.png)

- Subtopic with preview ![excerpt text...more content](img/1x2.png)
  - Detail with preview ![selected...excerpt](img/1x2.png)
```

### Alt Text Format
- **Format**: `start text...end text`
- **Purpose**: Shows the excerpt range that will be displayed in the preview
- **Example**: `a b...c d` displays excerpt from "a b" to "c d"

## Implementation Details

### Image Requirements
- **Path**: Must contain `1x2.png` or end with `1x2.png`
- **Alt Text**: Used to determine excerpt range for preview
- **Integration**: Works alongside existing `1x1.png` mindmap system

### User Experience
- **Non-intrusive**: Preview appears on hover/click without disrupting navigation
- **Quick Access**: Allows users to preview content without full page navigation
- **Contextual**: Shows relevant excerpts based on alt text specification

## File Dependencies

### Required Files
- `assets/js/image-modal.js` (127 lines) - Image viewing functionality
- `assets/css/modal.css` (47 lines) - Modal and popover styling
- `assets/js/modal.js` (27 lines) - Modal system management

### Integration Points
- Works with existing tooltip system
- Integrates with modal system for consistent UI
- Compatible with mindmap system (different placeholder images)

## Performance Considerations

### Optimization
- **Lazy Loading**: Previews loaded on-demand
- **Caching**: Preview content cached for repeated access
- **Efficient Rendering**: Uses iframe for isolated content display

### Mobile Support
- **Touch Controls**: Mobile-friendly interaction patterns
- **Responsive Design**: Adapts to different screen sizes
- **Performance**: Optimized for mobile rendering

## Error Handling

### Graceful Degradation
- **Missing Images**: Falls back to standard link behavior
- **Invalid Alt Text**: Skips malformed preview specifications
- **Loading Errors**: Shows fallback content or error message

### Debug Information
- **Console Logging**: Detailed preview generation process
- **Error Display**: User-friendly error messages
- **Fallback Content**: Standard link behavior when preview fails