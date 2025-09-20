// Mindmap Configuration
let mindmapConfig = {};

// Load mindmap config from JSON
fetch('config-mindmap.json')
    .then(response => response.json())
    .then(data => {
        mindmapConfig = data.mindmap || { type: 'spider' };
    })
    .catch(error => {
        console.warn('Failed to load mindmap config:', error);
        mindmapConfig = { type: 'spider' };
    });

// Mindmap State Variables
let currentMindmapData = null;
let currentZoomLevel = 1;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let translateX = 0;
let translateY = 0;

// Mindmap type cycling
const mindmapTypes = ['spider', 'spread', 'tree-down', 'tree-right'];
let currentTypeIndex = 0;

// D3.js will be loaded from CDN - no initialization needed here
// We'll create our own interactive mindmap implementation

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
    // Clean and escape special characters in labels for Mermaid
    let cleanLabel = node.label
        .replace(/[()[\]{}#]/g, '')
        .replace(/"/g, '')
        .replace(/'/g, '')
        .replace(/&/g, 'and')
        // Remove emojis and icons
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
        .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Regional indicator symbols
        .replace(/[\u{2600}-\u{26FF}]/gu, '') // Miscellaneous symbols
        .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
        .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
        .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
        .replace(/[^\x00-\x7F]/g, '') // Remove any remaining non-ASCII characters
        .replace(/\s+/g, ' ')
        .trim();
    
    let s = '  '.repeat(indent) + cleanLabel + '\n';
    
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
                // Remove emojis and icons
                .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
                .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
                .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
                .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Regional indicator symbols
                .replace(/[\u{2600}-\u{26FF}]/gu, '') // Miscellaneous symbols
                .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
                .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
                .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
                .replace(/[^\x00-\x7F]/g, '') // Remove any remaining non-ASCII characters
                .trim();
            
            if (h1Text && h1Text.length > 0) {
                // Limit root node text to 25 characters and add ellipsis if longer
                const maxLength = 25;
                if (h1Text.length > maxLength) {
                    h1Text = h1Text.substring(0, maxLength) + '...';
                }
                return h1Text;
            }
        }
    }
    return 'Mindmap';
}

// Old Mermaid generation functions removed - now using D3.js interactive implementation

// 4. Main Mindmap Generation Function
function generateMindmapFromLists() {
    const contentEl = document.getElementById('summary-inner');
    if (!contentEl) {
        return null;
    }
    
    let mindmapTree = [];
    let headingStack = []; // Stack to track heading hierarchy: [{level, node}, ...]
    
    // Parse content sequentially to maintain order
    const allElements = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6, ul');
    
    console.log('Parsing elements for mindmap:', allElements.length);
    
    for (const element of allElements) {
        if (element.tagName.match(/^H[1-6]$/)) {
            const level = parseInt(element.tagName.charAt(1));
            const headingImg = element.querySelector('img[src*="1x1"], img[src$="1x1.png"]');
            
            if (headingImg) {
                const headingText = headingImg.alt.trim();
                if (headingText) {
                    const headingNode = { label: headingText, children: [] };
                    
                    console.log(`Found H${level} heading with mindmap signal: "${headingText}"`);
                    
                    // Pop headings from stack that are at same or deeper level
                    while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
                        headingStack.pop();
                    }
                    
                    // Attach to parent heading or root
                    if (headingStack.length === 0) {
                        // This is a top-level heading
                        mindmapTree.push(headingNode);
                        console.log(`Added "${headingText}" as root node`);
                    } else {
                        // Attach to the current parent heading
                        const parentHeading = headingStack[headingStack.length - 1];
                        parentHeading.node.children.push(headingNode);
                        console.log(`Added "${headingText}" as child of "${parentHeading.node.label}"`);
                    }
                    
                    // Push current heading to stack
                    headingStack.push({ level: level, node: headingNode });
                }
            } else {
                // Heading without mindmap signal - clear stack if this heading would interrupt hierarchy
                const level = parseInt(element.tagName.charAt(1));
                console.log(`Found H${level} heading WITHOUT mindmap signal - potentially clearing hierarchy`);
                
                // Clear stack of headings at same or deeper level to prevent lists from attaching to wrong parent
                while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
                    headingStack.pop();
                    console.log(`Cleared heading from stack due to non-mindmap H${level}`);
                }
            }
        } else if (element.tagName === 'UL') {
            // Check if this UL contains mindmap images
            const hasImages = element.querySelectorAll('img[src*="1x1"], img[src$="1x1.png"]').length > 0;
            
            if (hasImages) {
                // Make sure this isn't a nested UL that's already been processed
                // Only process ULs that are not nested inside other mindmap ULs
                const parentUl = element.parentElement.closest('ul');
                const parentHasImages = parentUl ? parentUl.querySelectorAll('img[src*="1x1"], img[src$="1x1.png"]').length > 0 : false;
                
                if (!parentHasImages) {
                    const listNodes = traverseList(element);
                    console.log(`Found ${listNodes.length} top-level list nodes`);
                    
                    // Attach list nodes to the most recent heading or root
                    if (headingStack.length > 0) {
                        const currentHeading = headingStack[headingStack.length - 1];
                        currentHeading.node.children.push(...listNodes);
                        console.log(`Added ${listNodes.length} list items to "${currentHeading.node.label}"`);
                    } else {
                        // No headings, add directly to root
                        mindmapTree.push(...listNodes);
                        console.log(`Added ${listNodes.length} list items to root`);
                    }
                }
            }
        }
    }
    
    console.log('Final mindmap tree structure generated with', mindmapTree.length, 'top-level nodes');
    
    if (mindmapTree.length === 0) {
        return null;
    }
    
    // Return the tree data structure directly for D3.js
    return mindmapTree;
}

// 5. Color Styling Functions
/**
 * Color each branch's text in a Mermaid mindmap SVG using CSS injection.
 * Branch = any .section-N group (N >= 0). Root (.section-root / .section--1) is ignored.
 */
function colorMindmapBranches({
    container = null,
    colorFor = (n) => {
        // Golden-angle palette for good separation with improved contrast
        const hue = (n * 137.508) % 360;
        const lightness = 34 + ((n * 9) % 12); // Vary lightness slightly
        return `hsl(${hue} 72% ${lightness}%)`;
    }
} = {}) {
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
        const color = colorFor(n);
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
    return { sections: Array.from(sectionNums).sort((a,b)=>a-b) };
}

/**
 * Apply basic styling to mindmap (placeholder for future enhancements)
 */
function applyMindmapTypography({
    container = null
} = {}) {
    const root = container ? document.querySelector(container) : document.getElementById(container);
    if (!root) {
        console.warn('applyMindmapTypography: container not found:', container);
        return;
    }

    const svg = root.querySelector('svg[id$="-svg"]');
    if (!svg) {
        console.warn('applyMindmapTypography: mindmap SVG not found in container');
        return;
    }

    console.log('Basic mindmap styling applied');
}

/**
 * Apply both color and typography styling to a mindmap
 */
function applyMindmapTextStyling(mindmapId) {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
        const mindmapContainer = document.getElementById(mindmapId);
        if (!mindmapContainer) {
            console.log('No mindmap container found with ID:', mindmapId);
            return;
        }
        
        console.log('Applying CSS-based mindmap styling to:', mindmapId);
        
        // Apply colors using golden-angle palette
        colorMindmapBranches({
            container: `#${mindmapId}`,
            colorFor: (n) => {
                const hue = (n * 137.508) % 360;
                const lightness = 34 + ((n * 9) % 12);
                return `hsl(${hue} 72% ${lightness}%)`;
            }
        });
        
        // Apply stroke-based hierarchy styling
        applyMindmapTypography({
            container: `#${mindmapId}`
        });
        
        console.log('Mindmap styling complete for:', mindmapId);
    }, 100);
}

/**
 * Setup hover effects for mindmap nodes
 */
function setupNodeHoverEffects(mindmapId) {
    const mindmapContainer = document.getElementById(mindmapId);
    if (!mindmapContainer) return;
    
    const svg = mindmapContainer.querySelector('svg');
    if (!svg) return;
    
    // Find all node groups
    const nodeGroups = svg.querySelectorAll('g[class*="section-"], .mindmap-node');
    
    nodeGroups.forEach(nodeGroup => {
        // Store original position for restoration
        let originalNextSibling = null;
        
        // Add mouseenter event
        nodeGroup.addEventListener('mouseenter', function() {
            // Store the next sibling to restore position later
            originalNextSibling = this.nextSibling;
            // Move this element to the end of the SVG (brings it to front)
            svg.appendChild(this);
        });
        
        // Add mouseleave event
        nodeGroup.addEventListener('mouseleave', function() {
            // Restore original position if we have a reference
            if (originalNextSibling && originalNextSibling.parentNode) {
                svg.insertBefore(this, originalNextSibling);
            } else if (originalNextSibling === null) {
                // If it was the last element, insert it at the beginning
                svg.insertBefore(this, svg.firstChild);
            }
        });
    });
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
        
        console.log('Generating interactive D3.js mindmap with data:', currentMindmapData);
        console.log('Data type:', typeof currentMindmapData);
        console.log('Is array:', Array.isArray(currentMindmapData));
        
        // Create D3.js interactive mindmap
        createInteractiveMindmap(mindmapId, currentMindmapData);
        
    } catch (error) {
        console.error('Error rendering mindmap:', error);
        mindmapContent.innerHTML = `
            <div class="mindmap-empty">
                Error rendering mindmap: ${error.message}
                <br><br>
                <details>
                    <summary>Debug Info</summary>
                    <pre>${JSON.stringify(currentMindmapData, null, 2)}</pre>
                </details>
            </div>
        `;
    }
}

function generateMindmap() {
    const mindmapTree = generateMindmapFromLists();
    currentMindmapData = mindmapTree;
    updateMindmapDisplay();
}

// D3.js Interactive Mindmap Implementation
function createInteractiveMindmap(containerId, treeData) {
    const container = document.getElementById(containerId);
    if (!container || !treeData) return;
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Set up dimensions
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    
    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('background', 'transparent');
    
    // Create container group for zoom/pan
    const g = svg.append('g');
    
    // Convert tree data to D3.js format
    const nodes = flattenTreeToNodes(treeData);
    const links = generateLinksFromNodes(nodes);
    
    console.log('D3.js mindmap created with', nodes.length, 'nodes and', links.length, 'links');
    
    // Create force simulation based on mindmap type
    const simulation = createSimulation(nodes, links, width, height);
    
    // Create links (edges)
    const link = g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('stroke', '#cccccc')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.8);
    
    // Create nodes
    const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(nodes)
        .enter().append('g')
        .attr('class', 'node')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
    
    // Add rectangles to nodes (will be sized after text is added)
    node.append('rect')
        .attr('fill', d => getNodeColor(d.level, d.branchIndex))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('rx', 5) // Rounded corners
        .attr('ry', 5);
    
    // Add labels to nodes
    const nodeText = node.append('text')
        .text(d => d.label)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('font-size', d => d.level === 0 ? '12px' : '10px')
        .attr('font-weight', d => d.level === 0 ? 'bold' : 'bold')
        .attr('fill', '#333')
        .attr('pointer-events', 'none');
    
    // Size rectangles based on text dimensions
    node.each(function(d) {
        const textElement = d3.select(this).select('text');
        const rectElement = d3.select(this).select('rect');
        
        // Get text bounding box
        const bbox = textElement.node().getBBox();
        
        // Add padding around text
        const padding = d.level === 0 ? 16 : 12;
        const width = bbox.width + (padding * 2);
        const height = bbox.height + (padding * 1.5);
        
        // Set rectangle dimensions and center it
        rectElement
            .attr('width', width)
            .attr('height', height)
            .attr('x', -width / 2)
            .attr('y', -height / 2);
    });
    
    // Add hover effects
    node.on('mouseenter', function(event, d) {
        const rect = d3.select(this).select('rect');
        const currentWidth = parseFloat(rect.attr('width'));
        const currentHeight = parseFloat(rect.attr('height'));
        
        rect.transition().duration(200)
            .attr('width', currentWidth * 1.1)
            .attr('height', currentHeight * 1.1)
            .attr('x', -(currentWidth * 1.1) / 2)
            .attr('y', -(currentHeight * 1.1) / 2)
            .attr('stroke-width', 3);
    })
    .on('mouseleave', function(event, d) {
        const rect = d3.select(this).select('rect');
        const textElement = d3.select(this).select('text');
        const bbox = textElement.node().getBBox();
        const padding = d.level === 0 ? 16 : 12;
        const width = bbox.width + (padding * 2);
        const height = bbox.height + (padding * 1.5);
        
        rect.transition().duration(200)
            .attr('width', width)
            .attr('height', height)
            .attr('x', -width / 2)
            .attr('y', -height / 2)
            .attr('stroke-width', 2);
    });
    
    // Update positions on simulation tick
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        node
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // Add zoom and pan behavior
    const zoom = d3.zoom()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    
    svg.call(zoom);
    
    // Store references for external control
    container.d3Data = {
        svg: svg,
        simulation: simulation,
        nodes: nodes,
        links: links,
        zoom: zoom
    };
    
    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        // Keep nodes fixed after dragging for user positioning
        // Remove these lines if you want nodes to move freely after drag
        // d.fx = null;
        // d.fy = null;
    }
}

// Helper functions for D3.js mindmap
function flattenTreeToNodes(treeData) {
    const nodes = [];
    let nodeId = 0;
    
    // Add root node
    const rootText = getRootNodeText();
    nodes.push({
        id: nodeId++,
        label: rootText,
        level: 0,
        branchIndex: 0,
        x: 0,
        y: 0
    });
    
    // Add tree nodes
    function addNodes(nodeList, level, parentId, branchIndex) {
        if (!Array.isArray(nodeList)) {
            console.error('addNodes expects an array, got:', typeof nodeList, nodeList);
            return;
        }
        
        nodeList.forEach((node, index) => {
            if (!node || typeof node.label !== 'string') {
                console.warn('Skipping invalid node:', node);
                return;
            }
            
            const nodeData = {
                id: nodeId++,
                label: node.label,
                level: level,
                branchIndex: level === 1 ? index : branchIndex,
                parentId: parentId,
                x: Math.random() * 100, // Initial random position
                y: Math.random() * 100
            };
            nodes.push(nodeData);
            
            if (node.children && Array.isArray(node.children) && node.children.length > 0) {
                addNodes(node.children, level + 1, nodeData.id, nodeData.branchIndex);
            }
        });
    }
    
    if (treeData && Array.isArray(treeData) && treeData.length > 0) {
        addNodes(treeData, 1, 0, 0);
    } else {
        console.error('flattenTreeToNodes expects an array, got:', typeof treeData, treeData);
    }
    
    return nodes;
}

function generateLinksFromNodes(nodes) {
    const links = [];
    
    nodes.forEach(node => {
        if (node.parentId !== undefined) {
            links.push({
                source: node.parentId,
                target: node.id
            });
        }
    });
    
    return links;
}

function createSimulation(nodes, links, width, height) {
    const mindmapType = mindmapConfig.type || 'spider';
    
    let simulation = d3.forceSimulation(nodes);
    
    // Add link force
    simulation.force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(d => {
            const sourceLevel = nodes.find(n => n.id === d.source.id)?.level || 0;
            const targetLevel = nodes.find(n => n.id === d.target.id)?.level || 1;
            return 120 + (targetLevel * 40); // Much longer links for better spacing
        })
        .strength(0.6) // Reduced strength for more flexible positioning
    );
    
    // Configure forces based on mindmap type
    switch (mindmapType) {
        case 'spider':
            // Radial layout with much better spacing
            simulation
                .force('charge', d3.forceManyBody().strength(-800)) // Much stronger repulsion
                .force('center', d3.forceCenter(width / 2, height / 2))
                .force('radial', d3.forceRadial(d => d.level * 150, width / 2, height / 2).strength(0.5)); // Larger radial distances
            break;
            
        case 'spread':
            // Spread layout with better spacing
            simulation
                .force('charge', d3.forceManyBody().strength(-600)) // Stronger repulsion
                .force('center', d3.forceCenter(width / 2, height / 2))
                .force('x', d3.forceX(width / 2).strength(0.05))
                .force('y', d3.forceY(height / 2).strength(0.05));
            break;
            
        case 'tree-down':
            // Vertical tree layout with proper hierarchical spacing
            simulation
                .force('charge', d3.forceManyBody().strength(-400))
                .force('center', d3.forceCenter(width / 2, 80))
                .force('y', d3.forceY(d => 80 + d.level * 120).strength(0.9)) // Much more vertical spacing
                .force('x', d3.forceX(width / 2).strength(0.05))
                .force('collision', d3.forceCollide().radius(80)); // Prevent overlap
            break;
            
        case 'tree-right':
            // Horizontal tree layout with proper hierarchical spacing
            simulation
                .force('charge', d3.forceManyBody().strength(-400))
                .force('center', d3.forceCenter(80, height / 2))
                .force('x', d3.forceX(d => 80 + d.level * 200).strength(0.9)) // Much more horizontal spacing
                .force('y', d3.forceY(height / 2).strength(0.05))
                .force('collision', d3.forceCollide().radius(80)); // Prevent overlap
            break;
            
        default:
            // Default spider layout
            simulation
                .force('charge', d3.forceManyBody().strength(-800))
                .force('center', d3.forceCenter(width / 2, height / 2));
    }
    
    return simulation;
}

function getNodeColor(level, branchIndex) {
    if (level === 0) {
        return '#667eea'; // Root node color
    }
    
    // Use golden-angle palette like the original
    const hue = (branchIndex * 137.508) % 360;
    const lightness = 65 + ((branchIndex * 5) % 15); // Vary lightness slightly
    return `hsl(${hue}, 60%, ${lightness}%)`;
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

// 7. Zoom and Pan Functions for D3.js
function zoomIn(container) {
    const mindmapDiagram = container ? container.querySelector('.mindmap-diagram') : 
                          document.querySelector('.mindmap-panel.visible .mindmap-diagram') ||
                          document.querySelector('.mindmap-fullscreen-modal.visible .mindmap-diagram');
    
    if (mindmapDiagram && mindmapDiagram.d3Data) {
        const zoom = mindmapDiagram.d3Data.zoom;
        const svg = mindmapDiagram.d3Data.svg;
        
        svg.transition().duration(300).call(
            zoom.scaleBy, 1.2
        );
    }
}

function zoomOut(container) {
    const mindmapDiagram = container ? container.querySelector('.mindmap-diagram') : 
                          document.querySelector('.mindmap-panel.visible .mindmap-diagram') ||
                          document.querySelector('.mindmap-fullscreen-modal.visible .mindmap-diagram');
    
    if (mindmapDiagram && mindmapDiagram.d3Data) {
        const zoom = mindmapDiagram.d3Data.zoom;
        const svg = mindmapDiagram.d3Data.svg;
        
        svg.transition().duration(300).call(
            zoom.scaleBy, 0.8
        );
    }
}

function resetZoom(container) {
    const mindmapDiagram = container ? container.querySelector('.mindmap-diagram') : 
                          document.querySelector('.mindmap-panel.visible .mindmap-diagram') ||
                          document.querySelector('.mindmap-fullscreen-modal.visible .mindmap-diagram');
    
    if (mindmapDiagram && mindmapDiagram.d3Data) {
        const zoom = mindmapDiagram.d3Data.zoom;
        const svg = mindmapDiagram.d3Data.svg;
        
        svg.transition().duration(500).call(
            zoom.transform,
            d3.zoomIdentity
        );
    }
}

// 8. Drag Functions
function enableDragging(element) {
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('mousemove', drag);
    element.addEventListener('mouseup', endDrag);
    element.addEventListener('mouseleave', endDrag);
}

// 8a. Individual Node Dragging Functions
let draggedNode = null;
let nodeStartX = 0;
let nodeStartY = 0;
let nodeInitialTransform = { x: 0, y: 0 };
let nodeConnections = new Map(); // Store node-to-edge relationships

function parseTransform(transformString) {
    if (!transformString || transformString === 'none') {
        return { x: 0, y: 0 };
    }
    
    // Handle translate(x, y) format
    const translateMatch = transformString.match(/translate\(([^,]+),?\s*([^)]*)\)/);
    if (translateMatch) {
        const x = parseFloat(translateMatch[1]) || 0;
        const y = parseFloat(translateMatch[2]) || 0;
        return { x, y };
    }
    
    return { x: 0, y: 0 };
}

function getNodeCenter(node) {
    // Get the bounding box of the node
    const bbox = node.getBBox();
    
    // Get any existing transform
    const transform = parseTransform(node.getAttribute('transform') || '');
    
    // Calculate center point
    return {
        x: bbox.x + bbox.width / 2 + transform.x,
        y: bbox.y + bbox.height / 2 + transform.y
    };
}

function findConnectedEdges(svgContainer, targetNode) {
    const svg = svgContainer.querySelector('svg');
    if (!svg) return [];
    
    const connectedEdges = [];
    
    // Find all possible edge elements - Mermaid uses different structures for different diagram types
    const edgeSelectors = [
        'path[stroke]',           // Generic paths with stroke (most common)
        'line',                   // Direct lines
        '.edgePath path',         // Flowchart edges
        '.edge path',             // Generic edges
        '.flowchart-link',        // Flowchart links
        '.mindmap-link',          // Mindmap specific links
        'g[class*="edge"] path',  // Edge groups containing paths
        'g[class*="link"] path'   // Link groups containing paths
    ];
    
    edgeSelectors.forEach(selector => {
        try {
            const edges = svg.querySelectorAll(selector);
            edges.forEach(edge => {
                // For mindmap diagrams, we need to check spatial proximity
                // since Mermaid doesn't always provide clear node-edge relationships
                if (isEdgeConnectedToNode(edge, targetNode)) {
                    connectedEdges.push(edge);
                }
            });
        } catch (e) {
            // Skip invalid selectors
        }
    });
    
    return connectedEdges;
}

function isEdgeConnectedToNode(edge, node) {
    // Get the path data or line coordinates
    const pathData = edge.getAttribute('d');
    const nodeCenter = getNodeCenter(node);
    const tolerance = 50; // Pixels tolerance for connection detection
    
    if (pathData) {
        // Parse path data to get start and end points
        const pathPoints = parsePathData(pathData);
        
        // Check if any path point is near the node center
        return pathPoints.some(point => {
            const distance = Math.sqrt(
                Math.pow(point.x - nodeCenter.x, 2) + 
                Math.pow(point.y - nodeCenter.y, 2)
            );
            return distance <= tolerance;
        });
    }
    
    // For line elements
    if (edge.tagName === 'line') {
        const x1 = parseFloat(edge.getAttribute('x1') || 0);
        const y1 = parseFloat(edge.getAttribute('y1') || 0);
        const x2 = parseFloat(edge.getAttribute('x2') || 0);
        const y2 = parseFloat(edge.getAttribute('y2') || 0);
        
        const startDistance = Math.sqrt(
            Math.pow(x1 - nodeCenter.x, 2) + 
            Math.pow(y1 - nodeCenter.y, 2)
        );
        const endDistance = Math.sqrt(
            Math.pow(x2 - nodeCenter.x, 2) + 
            Math.pow(y2 - nodeCenter.y, 2)
        );
        
        return startDistance <= tolerance || endDistance <= tolerance;
    }
    
    return false;
}

function parsePathData(pathData) {
    const points = [];
    
    // Simple parser for common path commands (M, L, C, Q)
    const commands = pathData.match(/[MLCQZ][^MLCQZ]*/gi);
    
    if (commands) {
        commands.forEach(command => {
            const type = command[0];
            const coords = command.slice(1).trim().split(/[\s,]+/).map(parseFloat);
            
            switch (type.toUpperCase()) {
                case 'M': // Move to
                case 'L': // Line to
                    if (coords.length >= 2) {
                        points.push({ x: coords[0], y: coords[1] });
                    }
                    break;
                case 'C': // Cubic bezier
                    if (coords.length >= 6) {
                        points.push({ x: coords[4], y: coords[5] }); // End point
                    }
                    break;
                case 'Q': // Quadratic bezier
                    if (coords.length >= 4) {
                        points.push({ x: coords[2], y: coords[3] }); // End point
                    }
                    break;
            }
        });
    }
    
    return points;
}

function updateEdgePosition(edge, node, deltaX, deltaY) {
    const nodeCenter = getNodeCenter(node);
    
    if (edge.getAttribute('d')) {
        // Handle path elements
        const pathData = edge.getAttribute('d');
        const originalPathData = edge.getAttribute('data-original-path') || pathData;
        
        // Store original path if not already stored
        if (!edge.hasAttribute('data-original-path')) {
            edge.setAttribute('data-original-path', pathData);
        }
        
        // Update path by shifting points that are close to the node
        const updatedPath = updatePathForNodeMovement(originalPathData, nodeCenter, deltaX, deltaY);
        edge.setAttribute('d', updatedPath);
        
    } else if (edge.tagName === 'line') {
        // Handle line elements
        const x1 = parseFloat(edge.getAttribute('x1') || 0);
        const y1 = parseFloat(edge.getAttribute('y1') || 0);
        const x2 = parseFloat(edge.getAttribute('x2') || 0);
        const y2 = parseFloat(edge.getAttribute('y2') || 0);
        
        // Store original coordinates if not already stored
        if (!edge.hasAttribute('data-original-coords')) {
            edge.setAttribute('data-original-coords', `${x1},${y1},${x2},${y2}`);
        }
        
        // Check which end is closer to the node and update accordingly
        const startDistance = Math.sqrt(Math.pow(x1 - nodeCenter.x, 2) + Math.pow(y1 - nodeCenter.y, 2));
        const endDistance = Math.sqrt(Math.pow(x2 - nodeCenter.x, 2) + Math.pow(y2 - nodeCenter.y, 2));
        
        if (startDistance < endDistance) {
            // Move the start point
            edge.setAttribute('x1', x1 + deltaX);
            edge.setAttribute('y1', y1 + deltaY);
        } else {
            // Move the end point
            edge.setAttribute('x2', x2 + deltaX);
            edge.setAttribute('y2', y2 + deltaY);
        }
    }
}

function updatePathForNodeMovement(pathData, nodeCenter, deltaX, deltaY) {
    const tolerance = 50;
    
    // Parse and update path commands
    const commands = pathData.match(/[MLCQZ][^MLCQZ]*/gi);
    if (!commands) return pathData;
    
    let updatedPath = '';
    
    commands.forEach(command => {
        const type = command[0];
        const coords = command.slice(1).trim().split(/[\s,]+/).map(parseFloat);
        let updatedCommand = type;
        
        switch (type.toUpperCase()) {
            case 'M': // Move to
            case 'L': // Line to
                if (coords.length >= 2) {
                    const distance = Math.sqrt(
                        Math.pow(coords[0] - nodeCenter.x, 2) + 
                        Math.pow(coords[1] - nodeCenter.y, 2)
                    );
                    if (distance <= tolerance) {
                        coords[0] += deltaX;
                        coords[1] += deltaY;
                    }
                    updatedCommand += coords.join(',');
                }
                break;
            case 'C': // Cubic bezier
                if (coords.length >= 6) {
                    // Check and update end point
                    const endDistance = Math.sqrt(
                        Math.pow(coords[4] - nodeCenter.x, 2) + 
                        Math.pow(coords[5] - nodeCenter.y, 2)
                    );
                    if (endDistance <= tolerance) {
                        coords[4] += deltaX;
                        coords[5] += deltaY;
                        // Also adjust the second control point to maintain curve shape
                        coords[2] += deltaX * 0.5;
                        coords[3] += deltaY * 0.5;
                    }
                    updatedCommand += coords.join(',');
                }
                break;
            case 'Q': // Quadratic bezier
                if (coords.length >= 4) {
                    // Check and update end point
                    const endDistance = Math.sqrt(
                        Math.pow(coords[2] - nodeCenter.x, 2) + 
                        Math.pow(coords[3] - nodeCenter.y, 2)
                    );
                    if (endDistance <= tolerance) {
                        coords[2] += deltaX;
                        coords[3] += deltaY;
                        // Also adjust the control point
                        coords[0] += deltaX * 0.5;
                        coords[1] += deltaY * 0.5;
                    }
                    updatedCommand += coords.join(',');
                }
                break;
            default:
                updatedCommand = command; // Keep original for unsupported commands
        }
        
        updatedPath += updatedCommand;
    });
    
    return updatedPath;
}

function updateConnectedEdges(svgContainer, node, deltaX, deltaY) {
    // Use pre-computed edges if available, otherwise find them
    const connectedEdges = node.connectedEdges || findConnectedEdges(svgContainer, node);
    
    connectedEdges.forEach(edge => {
        updateEdgePosition(edge, node, deltaX, deltaY);
    });
}

function makeNodesDraggable(svgContainer) {
    const svg = svgContainer.querySelector('svg');
    if (!svg) return;
    
    // Find all mindmap nodes - try multiple selectors for different Mermaid versions
    const nodeSelectors = [
        '.mindmap-node',           // Mindmap nodes
        'g[class*="section-"]',    // Section-based nodes
        '.node',                   // Generic nodes
        'g:has(> rect)',          // Groups with rectangles (flowchart nodes)
        'g:has(> circle)',        // Groups with circles (mindmap nodes)
        'g:has(> polygon)'        // Groups with polygons
    ];
    
    let nodes = [];
    nodeSelectors.forEach(selector => {
        try {
            const found = svg.querySelectorAll(selector);
            found.forEach(node => {
                // Avoid duplicates and ensure it has text content
                if (!nodes.includes(node) && node.querySelector('text, tspan')) {
                    nodes.push(node);
                }
            });
        } catch (e) {
            // Skip invalid selectors
        }
    });
    
    console.log(`Found ${nodes.length} draggable nodes with edge connections`);
    
    nodes.forEach(node => {
        // Skip if already made draggable
        if (node.hasAttribute('data-draggable')) return;
        
        node.setAttribute('data-draggable', 'true');
        node.style.cursor = 'grab';
        
        // Store original position for reset functionality
        const currentTransform = node.getAttribute('transform') || '';
        node.setAttribute('data-original-transform', currentTransform);
        
        // Pre-compute connected edges for efficiency
        const connectedEdges = findConnectedEdges(svgContainer, node);
        node.connectedEdges = connectedEdges; // Store as property for quick access
        
        // Add hover effect
        node.addEventListener('mouseenter', function() {
            this.style.opacity = '0.8';
        });
        
        node.addEventListener('mouseleave', function() {
            if (draggedNode !== this) {
                this.style.opacity = '1';
            }
        });
        
        node.addEventListener('mousedown', function(e) {
            // Only handle left mouse button
            if (e.button !== 0) return;
            
            draggedNode = this;
            nodeStartX = e.clientX;
            nodeStartY = e.clientY;
            
            // Get current transform
            const currentTransform = this.getAttribute('transform') || '';
            nodeInitialTransform = parseTransform(currentTransform);
            
            this.style.cursor = 'grabbing';
            this.style.opacity = '0.7';
            
            // Prevent container dragging and text selection
            e.stopPropagation();
            e.preventDefault();
            
            // Add temporary global listeners
            document.addEventListener('mousemove', handleNodeDrag);
            document.addEventListener('mouseup', handleNodeDragEnd);
        });
    });
}

function handleNodeDrag(e) {
    if (!draggedNode) return;
    
    const deltaX = e.clientX - nodeStartX;
    const deltaY = e.clientY - nodeStartY;
    
    const newX = nodeInitialTransform.x + deltaX;
    const newY = nodeInitialTransform.y + deltaY;
    
    // Apply the new transform to the node
    draggedNode.setAttribute('transform', `translate(${newX}, ${newY})`);
    
    // Update connected edges
    const svgContainer = draggedNode.closest('.mindmap-diagram');
    if (svgContainer) {
        updateConnectedEdges(svgContainer, draggedNode, deltaX, deltaY);
    }
    
    e.preventDefault();
}

function handleNodeDragEnd(e) {
    if (draggedNode) {
        draggedNode.style.cursor = 'grab';
        draggedNode.style.opacity = '1';
        draggedNode = null;
    }
    
    // Remove global listeners
    document.removeEventListener('mousemove', handleNodeDrag);
    document.removeEventListener('mouseup', handleNodeDragEnd);
}

function resetNodePositions(svgContainer) {
    if (svgContainer && svgContainer.d3Data) {
        const { simulation, nodes } = svgContainer.d3Data;
        
        // Release all fixed positions
        nodes.forEach(node => {
            node.fx = null;
            node.fy = null;
        });
        
        // Restart the simulation to return to original layout
        simulation.alpha(1).restart();
        
        console.log('D3.js mindmap positions reset - nodes will animate back to original layout');
    }
}

function disableDragging(element) {
    element.removeEventListener('mousedown', startDrag);
    element.removeEventListener('mousemove', drag);
    element.removeEventListener('mouseup', endDrag);
    element.removeEventListener('mouseleave', endDrag);
}

function startDrag(e) {
    // Enable dragging at all zoom levels for better user experience
    isDragging = true;
    dragStartX = e.clientX - translateX;
    dragStartY = e.clientY - translateY;
    e.preventDefault();
    
    // Add visual feedback
    const mindmapDiagram = e.target.closest('.mindmap-diagram');
    if (mindmapDiagram) {
        mindmapDiagram.style.cursor = 'grabbing';
    }
}

function drag(e) {
    if (isDragging) {
        translateX = e.clientX - dragStartX;
        translateY = e.clientY - dragStartY;
        applyZoom();
        e.preventDefault();
    }
}

function endDrag() {
    isDragging = false;
    
    // Restore cursor
    const mindmapDiagram = document.querySelector('.mindmap-diagram');
    if (mindmapDiagram) {
        mindmapDiagram.style.cursor = '';
    }
}

// 9. Fullscreen Functions
function openFullScreenMindmap() {
    const fullScreenModal = document.getElementById('mindmap-fullscreen-modal');
    const fullScreenContent = document.getElementById('mindmap-fullscreen-content');
    
    if (!currentMindmapData) {
        fullScreenContent.innerHTML = '<div class="mindmap-empty">No mindmap available for this document.</div>';
    } else {
        // Create a new mindmap for fullscreen
        const fullscreenId = 'mindmap-fullscreen-' + Date.now();
        fullScreenContent.innerHTML = `<div id="${fullscreenId}" class="mindmap-diagram"></div>`;
        
        // Create the interactive mindmap in fullscreen
        createInteractiveMindmap(fullscreenId, currentMindmapData);
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
    document.getElementById('mindmap-cycle-type').addEventListener('click', cycleMindmapType);
    document.getElementById('mindmap-zoom-in').addEventListener('click', () => zoomIn());
    document.getElementById('mindmap-zoom-out').addEventListener('click', () => zoomOut());
    document.getElementById('mindmap-zoom-reset').addEventListener('click', () => resetZoom());
    document.getElementById('mindmap-reset-positions').addEventListener('click', () => {
        const container = document.querySelector('.mindmap-panel.visible .mindmap-diagram');
        if (container) resetNodePositions(container);
    });
    document.getElementById('mindmap-fullscreen').addEventListener('click', openFullScreenMindmap);
    
    // Fullscreen controls
    document.getElementById('mindmap-fullscreen-close').addEventListener('click', closeFullScreenMindmap);
    document.getElementById('mindmap-fullscreen-cycle-type').addEventListener('click', cycleMindmapType);
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
    document.getElementById('mindmap-fullscreen-reset-positions').addEventListener('click', () => {
        const container = document.querySelector('.mindmap-fullscreen-modal.visible .mindmap-diagram');
        if (container) resetNodePositions(container);
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

// Cycle through mindmap types
function cycleMindmapType() {
    currentTypeIndex = (currentTypeIndex + 1) % mindmapTypes.length;
    const newType = mindmapTypes[currentTypeIndex];
    
    // Update the configuration
    setMindmapConfig({ type: newType });
    
    // Update button tooltips to show current type
    updateCycleButtonTooltips();
    
    // Regenerate the mindmap with new layout
    if (currentMindmapData) {
        updateMindmapDisplay();
        
        // Also update fullscreen if it's open
        const fullScreenModal = document.getElementById('mindmap-fullscreen-modal');
        if (fullScreenModal.classList.contains('visible')) {
            openFullScreenMindmap();
        }
    }
    
    console.log('Switched to mindmap type:', newType);
}

// Update cycle button tooltips to show current type
function updateCycleButtonTooltips() {
    const currentType = mindmapTypes[currentTypeIndex];
    const cycleButtons = [
        document.getElementById('mindmap-cycle-type'),
        document.getElementById('mindmap-fullscreen-cycle-type')
    ];
    
    cycleButtons.forEach(button => {
        if (button) {
            button.title = `Cycle Type (Current: ${currentType})`;
        }
    });
}

// 12. Configuration Loading
async function loadMindmapConfig() {
    try {
        const response = await fetch('config-mindmap.json');
        if (response.ok) {
            const config = await response.json();
            mindmapConfig = { ...mindmapConfig, ...config.mindmap };
            
            // Set the current type index based on loaded config
            const configType = mindmapConfig.type || 'spider';
            currentTypeIndex = mindmapTypes.indexOf(configType);
            if (currentTypeIndex === -1) {
                currentTypeIndex = 0; // Default to spider if type not found
            }
        }
    } catch (error) {
        console.log('Using default mindmap configuration');
        currentTypeIndex = 0; // Default to spider
    }
    
    // Update button tooltips after config is loaded
    updateCycleButtonTooltips();
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
