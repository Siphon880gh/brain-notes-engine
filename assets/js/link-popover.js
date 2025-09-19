/**
 * Link Popover Preview System
 * Automatically detects links followed by 1x2.png images and shows content previews on hover
 */

class LinkPopoverPreview {
    constructor() {
        this.cache = new Map();
        this.activePopover = null;
        this.hoverTimeout = null;
        this.hideTimeout = null;
        this.proxyUrl = 'https://api.allorigins.win/get?url=';
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.enhanceLinks());
        } else {
            this.enhanceLinks();
        }
    }

    /**
     * Main function to enhance links with popover previews
     */
    enhanceLinks() {
        // Find all links followed by 1x2.png images
        const links = this.findLinksWithMarkers();
        
        links.forEach(linkData => {
            this.enhanceLink(linkData);
        });
    }

    /**
     * Find links that are followed by 1x2.png marker images
     */
    findLinksWithMarkers() {
        const links = [];
        const allLinks = document.querySelectorAll('a[href]');
        
        allLinks.forEach(link => {
            const markerImage = this.findMarkerImage(link);
            if (markerImage) {
                const boundaryWords = this.parseBoundaryWords(markerImage.alt);
                if (boundaryWords) {
                    links.push({
                        link: link,
                        markerImage: markerImage,
                        url: link.href,
                        startWord: boundaryWords.start,
                        endWord: boundaryWords.end
                    });
                }
            }
        });
        
        return links;
    }

    /**
     * Find the 1x2.png marker image that follows a link
     */
    findMarkerImage(link) {
        let nextElement = link.nextSibling;
        
        // Skip text nodes and find the next element
        while (nextElement && nextElement.nodeType !== Node.ELEMENT_NODE) {
            nextElement = nextElement.nextSibling;
        }
        
        if (nextElement && nextElement.tagName === 'IMG') {
            const src = nextElement.src || nextElement.getAttribute('src') || '';
            const alt = nextElement.alt || '';
            
            // Check if it's a 1x2.png marker
            if (src.includes('1x2.png') || src.includes('1x2') || alt.includes('1x2')) {
                return nextElement;
            }
        }
        
        return null;
    }

    /**
     * Parse boundary words from image alt text
     * Supports patterns: "startWord..endWord" or "startWord...endWord"
     */
    parseBoundaryWords(altText) {
        if (!altText) return null;
        
        // Match pattern: word..word or word...word
        const match = altText.match(/^(.+?)\.{2,3}(.+)$/);
        if (match) {
            return {
                start: match[1].trim(),
                end: match[2].trim()
            };
        }
        
        return null;
    }

    /**
     * Enhance a single link with popover functionality
     */
    enhanceLink(linkData) {
        const { link, markerImage, url, startWord, endWord } = linkData;
        
        // Add enhanced styling
        link.classList.add('link-with-preview');
        
        // Hide the marker image
        markerImage.style.display = 'none';
        
        // Add hover event listeners
        link.addEventListener('mouseenter', (e) => {
            this.handleMouseEnter(e, url, startWord, endWord);
        });
        
        link.addEventListener('mouseleave', (e) => {
            this.handleMouseLeave(e);
        });
    }

    /**
     * Handle mouse enter on enhanced link
     */
    handleMouseEnter(event, url, startWord, endWord) {
        // Clear any existing timeouts
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        
        // Set delay before showing popover
        this.hoverTimeout = setTimeout(() => {
            this.showPopover(event.target, url, startWord, endWord);
        }, 300);
    }

    /**
     * Handle mouse leave on enhanced link
     */
    handleMouseLeave(event) {
        // Clear show timeout
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }
        
        // Set delay before hiding popover
        this.hideTimeout = setTimeout(() => {
            this.hidePopover();
        }, 200);
    }

    /**
     * Show popover with content preview
     */
    async showPopover(linkElement, url, startWord, endWord) {
        // Hide any existing popover
        this.hidePopover();
        
        // Create popover element
        const popover = this.createPopoverElement();
        document.body.appendChild(popover);
        
        // Position popover
        this.positionPopover(popover, linkElement);
        
        // Show loading state
        this.showLoadingState(popover);
        
        this.activePopover = popover;
        
        try {
            // Get content from cache or fetch it
            const content = await this.getContent(url, startWord, endWord);
            this.showContent(popover, content);
        } catch (error) {
            this.showError(popover, error.message);
        }
    }

    /**
     * Hide the active popover
     */
    hidePopover() {
        if (this.activePopover) {
            this.activePopover.remove();
            this.activePopover = null;
        }
    }

    /**
     * Create popover DOM element
     */
    createPopoverElement() {
        const popover = document.createElement('div');
        popover.className = 'link-popover';
        popover.innerHTML = `
            <div class="popover-content">
                <div class="popover-header">
                    <span class="popover-title">Loading...</span>
                    <button class="popover-close" onclick="this.closest('.link-popover').remove()">×</button>
                </div>
                <div class="popover-body">
                    <div class="popover-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Fetching content...</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners to keep popover visible when hovering over it
        popover.addEventListener('mouseenter', () => {
            if (this.hideTimeout) {
                clearTimeout(this.hideTimeout);
                this.hideTimeout = null;
            }
        });
        
        popover.addEventListener('mouseleave', () => {
            this.hideTimeout = setTimeout(() => {
                this.hidePopover();
            }, 200);
        });
        
        return popover;
    }

    /**
     * Position popover relative to link element
     */
    positionPopover(popover, linkElement) {
        const linkRect = linkElement.getBoundingClientRect();
        const popoverRect = popover.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let top = linkRect.bottom + 10;
        let left = linkRect.left;
        
        // Adjust horizontal position to stay within viewport
        if (left + popoverRect.width > viewportWidth - 20) {
            left = viewportWidth - popoverRect.width - 20;
        }
        if (left < 20) {
            left = 20;
        }
        
        // Adjust vertical position if popover would go below viewport
        if (top + popoverRect.height > viewportHeight - 20) {
            top = linkRect.top - popoverRect.height - 10;
        }
        
        popover.style.top = `${top + window.scrollY}px`;
        popover.style.left = `${left}px`;
    }

    /**
     * Show loading state in popover
     */
    showLoadingState(popover) {
        const body = popover.querySelector('.popover-body');
        body.innerHTML = `
            <div class="popover-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Fetching content...</span>
            </div>
        `;
    }

    /**
     * Show content in popover
     */
    showContent(popover, content) {
        const title = popover.querySelector('.popover-title');
        const body = popover.querySelector('.popover-body');
        
        title.textContent = content.title || 'Content Preview';
        body.innerHTML = `
            <div class="popover-text">
                ${content.excerpt}
            </div>
            <div class="popover-footer">
                <a href="${content.url}" target="_blank" class="popover-link">
                    <i class="fas fa-external-link-alt"></i>
                    View full content
                </a>
            </div>
        `;
    }

    /**
     * Show error state in popover
     */
    showError(popover, message) {
        const title = popover.querySelector('.popover-title');
        const body = popover.querySelector('.popover-body');
        
        title.textContent = 'Error';
        body.innerHTML = `
            <div class="popover-error">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;
    }

    /**
     * Get content from cache or fetch it
     */
    async getContent(url, startWord, endWord) {
        const cacheKey = `${url}|${startWord}|${endWord}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        // Fetch content
        const content = await this.fetchContent(url, startWord, endWord);
        
        // Cache the result
        this.cache.set(cacheKey, content);
        
        return content;
    }

    /**
     * Fetch content from URL using CORS proxy
     */
    async fetchContent(url, startWord, endWord) {
        try {
            const proxyUrl = `${this.proxyUrl}${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.contents) {
                throw new Error('No content received from proxy');
            }
            
            // Parse HTML and extract text
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/html');
            
            // Get page title
            const title = doc.querySelector('title')?.textContent || 
                         doc.querySelector('h1')?.textContent || 
                         'Content Preview';
            
            // Extract text content
            const textContent = this.extractTextContent(doc);
            
            // Find content between boundary words
            const excerpt = this.extractContentBetweenWords(textContent, startWord, endWord);
            
            return {
                title: title.trim(),
                excerpt: excerpt,
                url: url
            };
            
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Unable to fetch content. This may be due to CORS restrictions.');
            }
            throw new Error(`Failed to load content: ${error.message}`);
        }
    }

    /**
     * Extract text content from HTML document
     */
    extractTextContent(doc) {
        // Remove script and style elements
        const scripts = doc.querySelectorAll('script, style, nav, header, footer, aside');
        scripts.forEach(el => el.remove());
        
        // Get text content
        return doc.body?.textContent || doc.textContent || '';
    }

    /**
     * Extract content between boundary words
     */
    extractContentBetweenWords(text, startWord, endWord) {
        if (!text || !startWord || !endWord) {
            return 'No content found between specified boundary words.';
        }
        
        // Clean up text
        const cleanText = text.replace(/\s+/g, ' ').trim();
        
        // Find start and end positions (case-insensitive)
        const startIndex = cleanText.toLowerCase().indexOf(startWord.toLowerCase());
        const endIndex = cleanText.toLowerCase().indexOf(endWord.toLowerCase(), startIndex + startWord.length);
        
        if (startIndex === -1) {
            return `Selected excerpt not found. Start word "${startWord}" not found in content.`;
        }
        
        if (endIndex === -1) {
            return `Selected excerpt not found. End word "${endWord}" not found in content.`;
        }
        
        // Extract content including boundary words
        let excerpt = cleanText.substring(startIndex, endIndex + endWord.length).trim();
        
        // Clean up excerpt (but keep the boundary words)
        excerpt = excerpt.replace(/^\W+|\W+$/g, ''); // Remove leading/trailing punctuation
        
        // Limit length
        if (excerpt.length > 500) {
            excerpt = excerpt.substring(0, 500) + '...';
        }
        
        return excerpt || 'No content found between the specified boundary words.';
    }

    /**
     * Re-scan for new links (useful after dynamic content updates)
     */
    rescan() {
        this.enhanceLinks();
    }
}

// Initialize the link popover system
window.linkPopoverPreview = new LinkPopoverPreview();

// Export for manual initialization if needed
window.LinkPopoverPreview = LinkPopoverPreview;
