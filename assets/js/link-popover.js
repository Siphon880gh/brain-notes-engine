/**
 * Link Popover Preview System
 * - [[DOCUMENT NAME]] links: first-paragraph + TOC tabs
 * - [[TEXT]]##preview text## links: inline custom-text previews
 */

class LinkPopoverPreview {
    constructor() {
        this.noteCache = new Map();
        this.activePopover = null;
        this.hoverTimeout = null;
        this.hideTimeout = null;
        
        this.init();
    }

    init() {
        // Wait until the topics tree is injected so any links inside it are also enhanced.
        const run = () => this.enhanceLinks();
        if (window.__topicsReady) run();
        else document.addEventListener('topics-ready', run, { once: true });
    }

    /**
     * Main function to enhance links with popover previews
     */
    enhanceLinks() {
        this.findCustomPreviewLinks().forEach(linkData => {
            this.enhanceCustomLink(linkData);
        });

        this.findNoteOpenLinks().forEach(linkData => {
            this.enhanceNoteLink(linkData);
        });
    }

    /**
     * Find custom previews emitted by note-opener's wiki syntax renderer.
     */
    findCustomPreviewLinks() {
        return Array.from(document.querySelectorAll('a[data-custom-preview]'))
            .filter(link => link.dataset.previewEnhanced !== '1')
            .map(link => ({
                link,
                linkText: (link.textContent || '').trim(),
                previewText: link.dataset.customPreview || ''
            }));
    }

    /**
     * Find links that open another markdown note (?open= / openURL wiki links)
     */
    findNoteOpenLinks() {
        const links = [];
        const allLinks = document.querySelectorAll('a[href]');

        allLinks.forEach(link => {
            if (link.dataset.previewEnhanced === '1') return;
            if (link.classList.contains('link-with-preview')) return;
            if ((link.textContent || '').includes('🔗')) return;

            const title = this.getNoteTitleFromLink(link);
            if (!title) return;

            links.push({
                link,
                title,
                url: link.href,
                type: 'note'
            });
        });

        return links;
    }

    /**
     * Extract note title from a ?open= / openURL link
     */
    getNoteTitleFromLink(link) {
        const href = link.getAttribute('href') || '';
        if (!href || href === '#') return null;

        try {
            const url = new URL(link.href, window.location.href);
            const openParam = url.searchParams.get('open');
            if (openParam) {
                return decodeURIComponent(openParam)
                    .replace(/\.md$/i, '')
                    .replace(/\.json$/i, '')
                    .trim();
            }
        } catch (e) {
            // fall through
        }

        if (window.openURL && href.includes(window.openURL)) {
            const raw = href.split(window.openURL)[1] || '';
            if (!raw) return null;
            try {
                return decodeURIComponent(raw.split('#')[0])
                    .replace(/\.md$/i, '')
                    .replace(/\.json$/i, '')
                    .trim();
            } catch (e) {
                return raw.split('#')[0].replace(/\.md$/i, '').trim();
            }
        }

        return null;
    }

    /**
     * Enhance a custom text preview.
     */
    enhanceCustomLink(linkData) {
        const { link, linkText, previewText } = linkData;
        link.dataset.previewEnhanced = '1';
        link.classList.add('link-with-preview', 'no-link');
        link.addEventListener('mouseenter', (e) => {
            this.handleCustomMouseEnter(e, linkText, previewText);
        });
        link.addEventListener('mouseleave', (e) => {
            this.handleMouseLeave(e);
        });
        link.addEventListener('click', (e) => {
            e.preventDefault();
        });
    }

    /**
     * Enhance a note-open link with Preview + TOC popover
     */
    enhanceNoteLink(linkData) {
        const { link, title, url } = linkData;

        link.dataset.previewEnhanced = '1';
        link.classList.add('link-with-preview', 'note-link-preview');

        link.addEventListener('mouseenter', (e) => {
            this.handleNoteMouseEnter(e, title, url);
        });
        link.addEventListener('mouseleave', (e) => {
            this.handleMouseLeave(e);
        });
    }

    /**
     * Handle mouse enter on note-open link
     */
    handleNoteMouseEnter(event, title, url) {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        this.hoverTimeout = setTimeout(() => {
            this.showNotePopover(event.target, title, url);
        }, 300);
    }

    /**
     * Show popover for an internal markdown note (preview + TOC tabs)
     */
    async showNotePopover(linkElement, title, url) {
        this.hidePopover();

        const popover = this.createPopoverElement();
        popover.classList.add('note-link-popover');
        document.body.appendChild(popover);
        this.positionPopover(popover, linkElement);
        this.showLoadingState(popover);
        this.activePopover = popover;

        try {
            const content = await this.getNotePreview(title, url);
            if (this.activePopover !== popover) return;
            this.showNoteContent(popover, content);
            this.positionPopover(popover, linkElement);
        } catch (error) {
            if (this.activePopover !== popover) return;
            this.showError(popover, error.message);
        }
    }

    /**
     * Resolve note id, fetch markdown, and build preview + TOC (cached)
     */
    async getNotePreview(title, url) {
        const cacheKey = `note|${title.toLowerCase()}`;
        if (this.noteCache.has(cacheKey)) {
            return this.noteCache.get(cacheKey);
        }

        const noteId = await this.resolveNoteId(title);
        if (noteId == null) {
            throw new Error('Note not found in curriculum.');
        }

        const response = await fetch('local-open.php?id=' + noteId);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const yamlTextish = await response.text();
        const titleMatch = yamlTextish.match(/^title:\s*(.*?)\n/);
        const htmlMatch = yamlTextish.match(/^html:\s*\|([\s\S]*)/m);

        let displayTitle = titleMatch ? titleMatch[1].replace(/^ {2}/gm, '').trim() : title;
        displayTitle = displayTitle.replace(/\.md$/i, '').replace(/\.json$/i, '');

        let markdown = htmlMatch ? htmlMatch[1].replace(/^ {2}/gm, '') : '';
        if (markdown) markdown = markdown.trim();

        const content = this.parseNoteMarkdown(markdown, displayTitle, url);
        this.noteCache.set(cacheKey, content);
        return content;
    }

    /**
     * Look up note id from window.folders by title (waits briefly if folders not ready)
     */
    async resolveNoteId(title) {
        const findInFolders = (data, searchPhrase) => {
            let fuzzyId = null;
            const needle = searchPhrase.toLowerCase();

            const walk = (items) => {
                for (const item of items) {
                    if (item.current) {
                        const currentRaw = String(item.current);
                        const current = currentRaw.replace(/\.md$/i, '').replace(/\.json$/i, '').toLowerCase();
                        if (current === needle || currentRaw.toLowerCase() === needle + '.md') {
                            return item.id;
                        }
                        if (fuzzyId == null && current.includes(needle)) {
                            fuzzyId = item.id;
                        }
                    }
                    if (item.next && item.next.length) {
                        const nested = walk(item.next);
                        if (nested != null) return nested;
                    }
                }
                return null;
            };

            const exact = walk(data);
            return exact != null ? exact : fuzzyId;
        };

        if (typeof window.folders !== 'undefined' && window.folders) {
            return findInFolders(window.folders, title);
        }

        // folders loads async after topics; wait briefly
        return new Promise((resolve) => {
            let tries = 0;
            const timer = setInterval(() => {
                tries++;
                if (typeof window.folders !== 'undefined' && window.folders) {
                    clearInterval(timer);
                    resolve(findInFolders(window.folders, title));
                } else if (tries >= 40) {
                    clearInterval(timer);
                    resolve(null);
                }
            }, 50);
        });
    }

    /**
     * Build first-paragraph preview + heading TOC from note markdown
     */
    parseNoteMarkdown(markdown, title, noteUrl) {
        if (!markdown || markdown.trim() === '__PRIVATE_BLOCKED__') {
            return {
                title,
                excerpt: 'Private note — sign in to preview.',
                toc: [],
                url: noteUrl,
                privateBlocked: true
            };
        }

        let text = markdown.trim();
        text = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');

        const toc = [];
        const headingRe = /^(#{1,6})\s+(.+?)\s*$/gm;
        let headingMatch;
        while ((headingMatch = headingRe.exec(text)) !== null) {
            const level = headingMatch[1].length;
            let headingText = headingMatch[2]
                .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
                .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
                .replace(/\[\[([^\]\r\n]+?)\]\]##[^\r\n]*?##/g, '$1')
                .replace(/\[\[([^\]\r\n]+?)\]\]/g, '$1')
                .replace(/[*_`~]/g, '')
                .trim();
            if (!headingText) continue;
            toc.push({
                level,
                text: headingText,
                slug: this.slugifyHeading(headingText)
            });
        }

        const { excerpt, hasMore } = this.extractFirstParagraph(text);
        let preview = excerpt || 'No preview available.';
        if (excerpt && hasMore && !preview.endsWith('…') && !preview.endsWith('...')) {
            preview += '…';
        }

        return {
            title,
            excerpt: preview,
            toc,
            url: noteUrl,
            privateBlocked: false
        };
    }

    /**
     * First prose paragraph from markdown (skips headings, lists, code, images)
     */
    extractFirstParagraph(text) {
        const lines = text.split(/\r?\n/);
        let inCode = false;
        const paraLines = [];
        let started = false;
        let lineIndex = 0;

        for (; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const trimmed = line.trim();

            if (trimmed.startsWith('```')) {
                inCode = !inCode;
                if (started) break;
                continue;
            }
            if (inCode) continue;

            if (!trimmed) {
                if (started) break;
                continue;
            }

            if (/^#{1,6}\s/.test(trimmed)) {
                if (started) break;
                continue;
            }
            if (/^([-*+]|\d+\.)\s/.test(trimmed)) {
                if (started) break;
                continue;
            }
            if (/^(!?\[[^\]]*\]\([^)]*\)|>\s*\[!)/.test(trimmed)) {
                if (started) break;
                continue;
            }
            if (/^[-*_]{3,}$/.test(trimmed)) {
                if (started) break;
                continue;
            }

            started = true;
            paraLines.push(trimmed);
        }

        let excerpt = paraLines.join(' ');
        excerpt = excerpt
            .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
            .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
            .replace(/\[\[([^\]\r\n]+?)\]\]##[^\r\n]*?##/g, '$1')
            .replace(/\[\[([^\]\r\n]+?)\]\]/g, '$1')
            .replace(/[*_`~]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        let truncated = false;
        if (excerpt.length > 320) {
            excerpt = excerpt.substring(0, 320).replace(/\s+\S*$/, '').trim() + '…';
            truncated = true;
        }

        let hasMore = truncated;
        if (!hasMore && started) {
            for (let i = lineIndex; i < lines.length; i++) {
                const rest = lines[i].trim();
                if (rest) {
                    hasMore = true;
                    break;
                }
            }
        }

        return { excerpt, hasMore };
    }

    /**
     * Match heading slug rules used by note-opener / markdown-it-anchor
     */
    slugifyHeading(s) {
        let slug = String(s).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '');
        if (slug.length && !/[a-zA-Z]/.test(slug[0])) {
            slug = 'at' + slug;
        }
        return slug;
    }

    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * Render note preview popover with Preview / Contents tabs
     */
    showNoteContent(popover, content) {
        const title = popover.querySelector('.popover-title');
        const body = popover.querySelector('.popover-body');

        title.textContent = content.title || 'Note Preview';

        const tocHtml = content.toc.length
            ? `<ul class="popover-toc">${content.toc.map(item => {
                const href = this.buildNoteSectionUrl(content.title, item.slug);
                return `<li class="popover-toc-item level-${item.level}">
                    <a href="${this.escapeHtml(href)}" target="_blank" class="popover-toc-link">${this.escapeHtml(item.text)}</a>
                </li>`;
            }).join('')}</ul>`
            : `<div class="popover-toc-empty">No headings in this note.</div>`;

        body.innerHTML = `
            <div class="popover-tabs" role="tablist">
                <button type="button" class="popover-tab active" data-tab="preview" role="tab" aria-selected="true">Preview</button>
                <button type="button" class="popover-tab" data-tab="toc" role="tab" aria-selected="false">Contents</button>
            </div>
            <div class="popover-tab-panel active" data-panel="preview" role="tabpanel">
                <div class="popover-text">${this.escapeHtml(content.excerpt)}</div>
            </div>
            <div class="popover-tab-panel" data-panel="toc" role="tabpanel" hidden>
                ${tocHtml}
            </div>
            <div class="popover-footer">
                <a href="${this.escapeHtml(content.url)}" target="_blank" class="popover-link">
                    <i class="fas fa-external-link-alt"></i>
                    Open note
                </a>
            </div>
        `;

        body.querySelectorAll('.popover-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tabName = tab.getAttribute('data-tab');
                body.querySelectorAll('.popover-tab').forEach(t => {
                    const on = t === tab;
                    t.classList.toggle('active', on);
                    t.setAttribute('aria-selected', on ? 'true' : 'false');
                });
                body.querySelectorAll('.popover-tab-panel').forEach(panel => {
                    const on = panel.getAttribute('data-panel') === tabName;
                    panel.classList.toggle('active', on);
                    if (on) panel.removeAttribute('hidden');
                    else panel.setAttribute('hidden', '');
                });
            });
        });
    }

    /**
     * Build section URL the same way shareTutorialSection / permalinkHref do:
     * host + encodeURI(pathname + '?open=' + encodeURI(title) + '#' + slug)
     */
    buildNoteSectionUrl(title, slug) {
        const noteTitle = String(title || '').replace(/\.md$/i, '').trim();
        const trailingHash = '?open=' + encodeURI(noteTitle) + (slug ? '#' + slug : '');
        return window.location.protocol + '//' + window.location.host
            + encodeURI(window.location.pathname + trailingHash);
    }

    /**
     * Handle mouse enter on custom preview link
     */
    handleCustomMouseEnter(event, linkText, previewText) {
        // Clear any existing timeouts
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        
        // Set delay before showing popover
        this.hoverTimeout = setTimeout(() => {
            this.showCustomPopover(event.target, linkText, previewText);
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
     * Show popover with custom preview text
     */
    showCustomPopover(linkElement, linkText, previewText) {
        // Hide any existing popover
        this.hidePopover();
        
        // Create popover element
        const popover = this.createPopoverElement();
        document.body.appendChild(popover);
        
        // Position popover
        this.positionPopover(popover, linkElement);
        
        this.activePopover = popover;
        
        // Show custom content immediately (no fetching needed)
        const content = {
            title: linkText,
            excerpt: previewText,
            url: '#' // Custom links don't go anywhere
        };
        
        this.showCustomContent(popover, content);
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
     * Show custom content in popover (no external link)
     */
    showCustomContent(popover, content) {
        const title = popover.querySelector('.popover-title');
        const body = popover.querySelector('.popover-body');

        title.textContent = content.title || 'Custom Preview';
        body.innerHTML = '<div class="popover-text"></div>';
        const previewElement = body.querySelector('.popover-text');
        const previewMarkdown = String(content.excerpt || '')
            .replace(/\\r\\n|\\n|\\r/g, '\n')
            .replace(/\r\n?/g, '\n');

        if (!window.markdownit) {
            previewElement.textContent = previewMarkdown;
            return;
        }

        const renderer = window.markdownit({
            html: true,
            linkify: true,
            breaks: true,
            typographer: false
        });
        const renderedPreview = document.createElement('template');
        renderedPreview.innerHTML = renderer.render(previewMarkdown);

        // Sanitize in inert template content before adding it to the live page.
        renderedPreview.content.querySelectorAll('script, iframe, object, embed').forEach(element => {
            element.remove();
        });
        renderedPreview.content.querySelectorAll('*').forEach(element => {
            Array.from(element.attributes).forEach(attribute => {
                const name = attribute.name.toLowerCase();
                const value = attribute.value.trim().toLowerCase();
                if (name.startsWith('on') || ((name === 'href' || name === 'src') && value.startsWith('javascript:'))) {
                    element.removeAttribute(attribute.name);
                }
            });
        });
        renderedPreview.content.querySelectorAll('a[href]').forEach(link => {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        });
        previewElement.replaceChildren(renderedPreview.content);
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
