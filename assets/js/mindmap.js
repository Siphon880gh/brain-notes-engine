// Mindmap Configuration
let mindmapConfig = {
    type: 'spider' // 'spider', 'tree', 'tree-down', 'tree-right'
};

// Mindmap State Variables
let currentMindmapData = null;
let currentZoomLevel = 1;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let translateX = 0;
let translateY = 0;

// Initialize Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
        primaryColor: '#667eea',
        primaryTextColor: '#333',
        primaryBorderColor: '#667eea',
        lineColor: '#667eea',
        secondaryColor: '#f8f9fa',
        tertiaryColor: '#e6f0ff'
    }
});

// 1. Mindmap Detection
function detectMindmapContent() {
    const contentEl = document.getElementById('summary-inner');
    if (!contentEl) {
        return false;
    }
    
    // Look for images with src containing "1x1.png" or ending with "1x1.png"
    const mindmapImages = contentEl.querySelectorAll('img[src*="1x1.png"], img[src$="1x1.png"]');
    return mindmapImages.length > 0;
}

// 2. List Parsing Functions
function traverseList(ul) {
    let nodes = [];
    
    // Get direct children li elements only
    const directLiChildren = Array.from(ul.children).filter(child => child.tagName === 'LI');
    
    for (const li of directLiChildren) {
        // Find first 1x1 image and get its alt text
        let img = li.querySelector('img[src*="1x1"], img[src$="1x1.png"]');
        let label = img ? img.alt.trim() : '';
        
        // Skip if no mindmap image found
        if (!label) {
            continue;
        }
        
        // Check for nested ul (direct child only)
        let childList = li.querySelector(':scope > ul');
        let children = childList ? traverseList(childList) : [];
        
        nodes.push({ label, children });
    }
    
    return nodes;
}

function treeToMermaid(node, indent = 1) {
    // Escape special characters in labels for Mermaid
    const escapedLabel = node.label.replace(/[()]/g, '');
    let s = '  '.repeat(indent) + escapedLabel + '\n';
    
    for (const child of node.children) {
        s += treeToMermaid(child, indent + 1);
    }
    
    return s;
}

function getRootNodeText() {
    const contentEl = document.getElementById('summary-inner');
    if (contentEl) {
        const h1 = contentEl.querySelector('h1');
        if (h1) {
            let h1Text = h1.textContent.trim();
            // Clean text for Mermaid compatibility
            h1Text = h1Text
                .replace(/[()[\]{}#]/g, '')
                .replace(/"/g, '')
                .replace(/'/g, '')
                .replace(/&/g, 'and')
                .replace(/\s+/g, ' ')
                .trim();
            
            if (h1Text && h1Text.length > 0) {
                if (h1Text.length > 30) {
                    h1Text = h1Text.substring(0, 27) + '...';
                }
                return h1Text;
            }
        }
    }
    return 'Mindmap';
}

// 3. Mermaid Generation Functions
function generateSpiderMermaid(mindmapTree) {
    const rootText = getRootNodeText();
    let mermaid = `mindmap\n  root)${rootText}(\n`;
    
    for (const node of mindmapTree) {
        mermaid += treeToMermaid(node, 2);
    }
    
    return mermaid;
}

function generateTreeMermaid(mindmapTree, direction = 'TD') {
    let mermaid = `flowchart ${direction}\n`;
    let nodeId = 0;
    let connections = [];
    let rootNodeId = null;
    
    function addNode(node, parentId = null) {
        const currentId = `N${nodeId++}`;
        let cleanLabel = node.label
            .replace(/[()[\]{}#]/g, '')
            .replace(/"/g, '')
            .replace(/'/g, '')
            .replace(/&/g, 'and')
            .replace(/\s+/g, ' ')
            .trim();
        
        if (!cleanLabel || cleanLabel.length === 0) {
            cleanLabel = 'Node';
        }
        
        if (cleanLabel.length > 30) {
            cleanLabel = cleanLabel.substring(0, 27) + '...';
        }
        
        if (parentId === null && rootNodeId === null) {
            rootNodeId = currentId;
        }
        
        mermaid += `    ${currentId}[${cleanLabel}]\n`;
        
        if (parentId !== null) {
            connections.push(`    ${parentId} --> ${currentId}\n`);
        }
        
        for (const child of node.children) {
            addNode(child, currentId);
        }
        
        return currentId;
    }
    
    // Create a virtual root if multiple top-level nodes
    if (mindmapTree.length > 1) {
        const virtualRootId = `N${nodeId++}`;
        rootNodeId = virtualRootId;
        const rootText = getRootNodeText();
        mermaid += `    ${virtualRootId}[${rootText}]\n`;
        
        for (const node of mindmapTree) {
            addNode(node, virtualRootId);
        }
    } else if (mindmapTree.length === 1) {
        addNode(mindmapTree[0]);
    }
    
    // Add all connections
    for (const connection of connections) {
        mermaid += connection;
    }
    
    // Add styling
    mermaid += `\n    classDef default fill:#ffffff,stroke:#667eea,stroke-width:2px,color:#333333\n`;
    mermaid += `    classDef rootStyle fill:#667eea,stroke:#4c63d2,stroke-width:3px,color:#ffffff\n`;
    
    if (rootNodeId) {
        mermaid += `    class ${rootNodeId} rootStyle\n`;
    }
    
    return mermaid;
}

// 4. Main Mindmap Generation Function
function generateMindmapFromLists() {
    const contentEl = document.getElementById('summary-inner');
    if (!contentEl) {
        return null;
    }
    
    let mindmapTree = [];
    
    // Parse content sequentially to maintain order and handle headings + lists
    const allElements = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6, ul');
    let currentHeadingNode = null;
    let headingLevel = 0;
    let headingStack = [];
    
    for (const element of allElements) {
        if (element.tagName.match(/^H[1-6]$/)) {
            const level = parseInt(element.tagName.charAt(1));
            const headingImg = element.querySelector('img[src*="1x1"], img[src$="1x1.png"]');
            
            if (headingImg) {
                const headingText = headingImg.alt.trim();
                if (headingText) {
                    const headingNode = { label: headingText, children: [] };
                    
                    // Clear stack of headings at same or deeper level
                    while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
                        headingStack.pop();
                    }
                    
                    if (headingStack.length === 0) {
                        mindmapTree.push(headingNode);
                    } else {
                        headingStack[headingStack.length - 1].node.children.push(headingNode);
                    }
                    
                    headingStack.push({ level: level, node: headingNode });
                    currentHeadingNode = headingNode;
                    headingLevel = level;
                }
            } else {
                currentHeadingNode = null;
                headingLevel = 0;
            }
        } else if (element.tagName === 'UL') {
            const hasImages = element.querySelectorAll('img[src*="1x1"], img[src$="1x1.png"]').length > 0;
            
            if (hasImages) {
                const parentUl = element.closest('ul:not(:scope)');
                const parentHasImages = parentUl ? parentUl.querySelectorAll('img[src*="1x1"], img[src$="1x1.png"]').length > 0 : false;
                
                if (!parentHasImages) {
                    const listNodes = traverseList(element);
                    
                    if (currentHeadingNode && headingLevel > 0) {
                        currentHeadingNode.children.push(...listNodes);
                    } else {
                        mindmapTree.push(...listNodes);
                    }
                }
            }
        }
    }
    
    if (mindmapTree.length === 0) {
        return null;
    }
    
    // Generate based on configuration
    const mindmapType = mindmapConfig.type || 'spider';
    
    if (mindmapType === 'tree' || mindmapType === 'tree-down') {
        return generateTreeMermaid(mindmapTree, 'TD');
    } else if (mindmapType === 'tree-right') {
        return generateTreeMermaid(mindmapTree, 'LR');
    } else {
        return generateSpiderMermaid(mindmapTree);
    }
}

// 5. Color Styling Function
function colorMindmapBranches(container) {
    const root = container ? document.querySelector(container) : document.getElementById(container);
    if (!root) {
        console.warn('colorMindmapBranches: container not found:', container);
        return;
    }

    const svg = root.querySelector('svg[id$="-svg"]');
    if (!svg) {
        console.warn('colorMindmapBranches: mindmap SVG not found in container');
        return;
    }

    const sectionNums = new Set();
    svg.querySelectorAll('.mindmap-node').forEach(g => {
        for (const c of g.classList) {
            const m = c.match(/^section-(\d+)$/);
            if (m) sectionNums.add(Number(m[1]));
        }
    });

    const rules = [];
    sectionNums.forEach(n => {
        // Golden-angle palette for good color separation
        const hue = (n * 137.508) % 360;
        const lightness = 34 + ((n * 9) % 12);
        const color = `hsl(${hue} 72% ${lightness}%)`;
        
        rules.push(`#${CSS.escape(svg.id)} .section-${n} text { fill: ${color} !important; }`);
        rules.push(`#${CSS.escape(svg.id)} .section-${n} tspan { fill: ${color} !important; }`);
    });

    // Remove any existing branch colorizer styles
    const oldTag = svg.querySelector('style[data-branch-colorizer]');
    if (oldTag) oldTag.remove();

    // Inject new styles
    const styleTag = document.createElement('style');
    styleTag.setAttribute('data-branch-colorizer', 'true');
    styleTag.textContent = rules.join('\n');
    svg.appendChild(styleTag);

    console.log('Branch colors applied to sections:', Array.from(sectionNums).sort((a,b)=>a-b));
}

// 6. UI Management Functions
function updateMindmapButton() {
    const mindmapButton = document.getElementById('mindmap-button');
    const hasMindmap = detectMindmapContent();
    
    if (hasMindmap) {
        mindmapButton.style.display = 'flex';
    } else {
        mindmapButton.style.display = 'none';
        closeMindmapPanel();
    }
}

async function updateMindmapDisplay() {
    const mindmapContent = document.getElementById('mindmap-content');
    
    if (!currentMindmapData) {
        mindmapContent.innerHTML = '<div class="mindmap-empty">No mindmap available for this document.</div>';
        return;
    }
    
    try {
        const mindmapId = 'mindmap-' + Date.now();
        mindmapContent.innerHTML = `<div id="${mindmapId}" class="mindmap-diagram"></div>`;
        
        console.log('Generated Mermaid syntax:', currentMindmapData);
        
        const { svg } = await mermaid.render(mindmapId + '-svg', currentMindmapData);
        document.getElementById(mindmapId).innerHTML = svg;
        
        // Apply color styling for spider mindmaps
        if (mindmapConfig.type === 'spider') {
            setTimeout(() => {
                colorMindmapBranches(`#${mindmapId}`);
            }, 100);
        }
        
    } catch (error) {
        console.error('Error rendering mindmap:', error);
        mindmapContent.innerHTML = `
            <div class="mindmap-empty">
                Error rendering mindmap: ${error.message}
                <br><br>
                <details>
                    <summary>Debug Info</summary>
                    <pre>${currentMindmapData}</pre>
                </details>
            </div>
        `;
    }
}

function generateMindmap() {
    const mindmapData = generateMindmapFromLists();
    currentMindmapData = mindmapData;
    updateMindmapDisplay();
}

function toggleMindmapPanel() {
    const mindmapPanel = document.getElementById('mindmap-panel');
    const isVisible = mindmapPanel.classList.contains('visible');
    
    if (!isVisible && !currentMindmapData) {
        generateMindmap();
    } else if (!isVisible && currentMindmapData) {
        updateMindmapDisplay();
    }
    
    mindmapPanel.classList.toggle('visible');
}

function closeMindmapPanel() {
    const mindmapPanel = document.getElementById('mindmap-panel');
    mindmapPanel.classList.remove('visible');
}

// 7. Zoom and Pan Functions
function zoomIn(container) {
    currentZoomLevel = Math.min(currentZoomLevel * 1.2, 3);
    applyZoom(container);
}

function zoomOut(container) {
    currentZoomLevel = Math.max(currentZoomLevel / 1.2, 0.3);
    applyZoom(container);
}

function resetZoom(container) {
    currentZoomLevel = 1;
    translateX = 0;
    translateY = 0;
    applyZoom(container);
}

function applyZoom(container) {
    const mindmapDiagram = container ? container.querySelector('.mindmap-diagram') : 
                          document.querySelector('.mindmap-panel.visible .mindmap-diagram') ||
                          document.querySelector('.mindmap-fullscreen-modal.visible .mindmap-diagram');
    
    if (mindmapDiagram) {
        const transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoomLevel})`;
        mindmapDiagram.style.transform = transform;
        
        if (currentZoomLevel > 1) {
            mindmapDiagram.classList.add('zoomed');
            enableDragging(mindmapDiagram);
        } else {
            mindmapDiagram.classList.remove('zoomed');
            disableDragging(mindmapDiagram);
        }
    }
}

// 8. Drag Functions
function enableDragging(element) {
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('mousemove', drag);
    element.addEventListener('mouseup', endDrag);
    element.addEventListener('mouseleave', endDrag);
}

function disableDragging(element) {
    element.removeEventListener('mousedown', startDrag);
    element.removeEventListener('mousemove', drag);
    element.removeEventListener('mouseup', endDrag);
    element.removeEventListener('mouseleave', endDrag);
}

function startDrag(e) {
    if (currentZoomLevel > 1) {
        isDragging = true;
        dragStartX = e.clientX - translateX;
        dragStartY = e.clientY - translateY;
        e.preventDefault();
    }
}

function drag(e) {
    if (isDragging && currentZoomLevel > 1) {
        translateX = e.clientX - dragStartX;
        translateY = e.clientY - dragStartY;
        applyZoom();
        e.preventDefault();
    }
}

function endDrag() {
    isDragging = false;
}

// 9. Fullscreen Functions
function openFullScreenMindmap() {
    const fullScreenModal = document.getElementById('mindmap-fullscreen-modal');
    const fullScreenContent = document.getElementById('mindmap-fullscreen-content');
    
    if (!currentMindmapData) {
        fullScreenContent.innerHTML = '<div class="mindmap-empty">No mindmap available for this document.</div>';
    } else {
        const currentMindmapContent = document.getElementById('mindmap-content');
        const mindmapDiagram = currentMindmapContent.querySelector('.mindmap-diagram');
        
        if (mindmapDiagram) {
            const clonedDiagram = mindmapDiagram.cloneNode(true);
            clonedDiagram.style.transform = '';
            fullScreenContent.innerHTML = '';
            fullScreenContent.appendChild(clonedDiagram);
            
            currentZoomLevel = 1;
            translateX = 0;
            translateY = 0;
        } else {
            fullScreenContent.innerHTML = '<div class="mindmap-empty">No mindmap available for this document.</div>';
        }
    }
    
    fullScreenModal.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function closeFullScreenMindmap() {
    const fullScreenModal = document.getElementById('mindmap-fullscreen-modal');
    fullScreenModal.classList.remove('visible');
    document.body.style.overflow = '';
    
    currentZoomLevel = 1;
    translateX = 0;
    translateY = 0;
}

// 10. Event Listeners Setup
function setupMindmapEventListeners() {
    // Mindmap button
    document.getElementById('mindmap-button').addEventListener('click', toggleMindmapPanel);
    
    // Panel controls
    document.getElementById('mindmap-close').addEventListener('click', closeMindmapPanel);
    document.getElementById('mindmap-zoom-in').addEventListener('click', () => zoomIn());
    document.getElementById('mindmap-zoom-out').addEventListener('click', () => zoomOut());
    document.getElementById('mindmap-zoom-reset').addEventListener('click', () => resetZoom());
    document.getElementById('mindmap-fullscreen').addEventListener('click', openFullScreenMindmap);
    
    // Fullscreen controls
    document.getElementById('mindmap-fullscreen-close').addEventListener('click', closeFullScreenMindmap);
    document.getElementById('mindmap-fullscreen-zoom-in').addEventListener('click', () => {
        const container = document.querySelector('.mindmap-fullscreen-modal.visible');
        zoomIn(container);
    });
    document.getElementById('mindmap-fullscreen-zoom-out').addEventListener('click', () => {
        const container = document.querySelector('.mindmap-fullscreen-modal.visible');
        zoomOut(container);
    });
    document.getElementById('mindmap-fullscreen-zoom-reset').addEventListener('click', () => {
        const container = document.querySelector('.mindmap-fullscreen-modal.visible');
        resetZoom(container);
    });
    
    // Close panels when clicking outside
    document.addEventListener('click', (e) => {
        const mindmapPanel = document.getElementById('mindmap-panel');
        const mindmapButton = document.getElementById('mindmap-button');
        
        if (mindmapPanel.classList.contains('visible') && 
            !mindmapPanel.contains(e.target) && 
            !mindmapButton.contains(e.target)) {
            closeMindmapPanel();
        }
    });
    
    // ESC key to close panels
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const fullScreenModal = document.getElementById('mindmap-fullscreen-modal');
            if (fullScreenModal.classList.contains('visible')) {
                closeFullScreenMindmap();
            } else {
                closeMindmapPanel();
            }
        }
    });
}

// 11. Configuration Function
function setMindmapConfig(config) {
    mindmapConfig = { ...mindmapConfig, ...config };
    // Regenerate mindmap if currently displayed
    if (currentMindmapData) {
        generateMindmap();
    }
}

// 12. Configuration Loading
async function loadMindmapConfig() {
    try {
        const response = await fetch('mindmap-config.json');
        if (response.ok) {
            const config = await response.json();
            mindmapConfig = { ...mindmapConfig, ...config.mindmap };
        }
    } catch (error) {
        console.log('Using default mindmap configuration');
    }
}

// 13. Public API Functions
async function initializeMindmapFeature() {
    await loadMindmapConfig();
    setupMindmapEventListeners();
    updateMindmapButton();
}

// Call this function after your markdown content is rendered
function onMarkdownContentUpdated() {
    updateMindmapButton();
    // Clear previous mindmap data
    currentMindmapData = null;
    currentZoomLevel = 1;
    translateX = 0;
    translateY = 0;
}
