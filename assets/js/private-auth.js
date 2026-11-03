/**
 * Private Notes Authentication System
 * 
 * Handles authentication for notes ending with "PRIVATE.md"
 * Uses PHP session to persist authentication state
 */

class PrivateAuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.keyButton = null;
        this.modal = null;
        this.unlockedModal = null;
        this.init();
    }

    async init() {
        this.createKeyButton();
        this.createModal();
        // Hide private elements immediately (before auth check) to prevent flash of private content
        this.updatePrivateElementsVisibility();
        await this.checkAuthStatus();
        this.setupEventListeners();
    }

    /**
     * Check if a filename is a private file
     */
    isPrivateFile(filename) {
        if (!filename) return false;
        // Match files ending with "PRIVATE.md" or "(PRIVATE).md" (case insensitive)
        return /\(?PRIVATE\)?\.md$/i.test(filename);
    }

    /**
     * Check if a path is inside a private folder (any segment ends with (PRIVATE) or PRIVATE)
     */
    isInPrivateFolder(pathTp) {
        if (!pathTp) return false;
        return pathTp.split('/').some(seg => /(?:\(PRIVATE\)|PRIVATE)$/i.test(seg));
    }

    /**
     * Update visibility of private folders/files based on auth state
     */
    updatePrivateElementsVisibility() {
        const elements = document.querySelectorAll('[data-private="1"]');
        elements.forEach(el => {
            el.style.display = this.isAuthenticated ? '' : 'none';
        });
    }

    /**
     * Create the key icon button in the top right
     */
    createKeyButton() {
        const slot = document.createElement('div');
        slot.id = 'private-auth-btn';
        slot.className = 'private-auth-button';
        slot.innerHTML = `
            <button type="button" class="private-auth-key" aria-label="Private Notes Login" title="Private Notes Login">
                <i class="fas fa-key" aria-hidden="true"></i>
            </button>
            <button type="button" class="private-auth-chevron" aria-label="See what's unlocked" aria-expanded="false" hidden>
                <span class="private-auth-chevron-label">See what's unlocked</span>
                <i class="fas fa-chevron-down" aria-hidden="true"></i>
            </button>
        `;

        const tocButton = document.getElementById('toc-toggler');
        if (tocButton) {
            tocButton.parentNode.insertBefore(slot, tocButton);
        } else {
            document.body.appendChild(slot);
        }

        this.keyButton = slot;
    }

    /**
     * Create the login modal
     */
    createModal() {
        const modalHTML = `
            <div class="modal" id="privateAuthModal" style="display:none;">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title mt-0">🔐 Private Notes Access</h4>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div id="privateAuthStatus" class="mb-3"></div>
                            <div id="privateAuthLoginForm">
                                <p>Enter the password to access private notes.</p>
                                <div class="form-group">
                                    <label for="privateAuthPassword">Password:</label>
                                    <input type="password" id="privateAuthPassword" class="form-control" placeholder="Enter password" autocomplete="off">
                                    <div id="privateAuthError" class="text-red-500 mt-2" style="display: none;"></div>
                                </div>
                            </div>
                            <div id="privateAuthLoggedIn" style="display: none;">
                                <div class="private-auth-success">
                                    <i class="fas fa-sign-out-alt"></i>
                                    <span>Log out of private notes?</span>
                                </div>
                                <p class="private-auth-logout-note">Private notes will be hidden again until you enter the password.</p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" id="privateAuthLoginBtn" class="btn btn-primary bg-blue-500 text-white px-4 py-2 rounded">
                                <i class="fas fa-sign-in-alt"></i> Login
                            </button>
                            <button type="button" id="privateAuthLogoutBtn" class="btn btn-danger bg-red-500 text-white px-4 py-2 rounded" style="display: none;">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </button>
                            <button type="button" class="btn btn-secondary px-4 py-2 rounded" data-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('privateAuthModal');
        this.createUnlockedModal();
    }

    /**
     * Inventory of password-unlocked notes and Obsidian-only notes.
     */
    createUnlockedModal() {
        const modalHTML = `
            <div class="modal" id="privateUnlockedModal" style="display:none;">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title mt-0">See what's unlocked</h4>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <section class="private-unlock-section">
                                <h5 id="privateUnlockedHeading">Unlocked</h5>
                                <p class="private-unlock-lead">Notes and folders this password opened in the notebook.</p>
                                <div id="privateUnlockedTree"></div>
                            </section>
                            <section class="private-unlock-section">
                                <h5 id="privateLockedHeading">Can't be unlocked</h5>
                                <p class="private-unlock-lead">These notes open in Obsidian on your computer. They stay super private, so this site cannot show them.</p>
                                <div id="privateLockedTree"></div>
                            </section>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary px-4 py-2 rounded" data-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.unlockedModal = document.getElementById('privateUnlockedModal');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const keyFace = this.keyButton.querySelector('.private-auth-key');
        keyFace.addEventListener('click', () => this.showModal());
        const chevron = this.keyButton.querySelector('.private-auth-chevron');
        chevron.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.toggleUnlockedModal();
        });

        // Login button click
        document.getElementById('privateAuthLoginBtn').addEventListener('click', () => this.login());

        // Logout button click
        document.getElementById('privateAuthLogoutBtn').addEventListener('click', () => this.logout());

        // Password input enter key
        document.getElementById('privateAuthPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.login();
            }
        });

        // Clear error on input
        document.getElementById('privateAuthPassword').addEventListener('input', () => {
            document.getElementById('privateAuthError').style.display = 'none';
        });

        // Close button clicks
        const closeButtons = this.modal.querySelectorAll('[data-dismiss="modal"], .close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => this.hideModal());
        });

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            if (this.unlockedModal && this.unlockedModal.classList.contains('show')) {
                this.hideUnlockedModal();
                return;
            }
            if (this.modal.style.display === 'flex') {
                this.hideModal();
            }
        });

        const unlockedClosers = this.unlockedModal.querySelectorAll('[data-dismiss="modal"], .close');
        unlockedClosers.forEach(button => {
            button.addEventListener('click', () => this.hideUnlockedModal());
        });
        this.unlockedModal.addEventListener('click', (e) => {
            if (e.target === this.unlockedModal) this.hideUnlockedModal();
        });
    }

    /**
     * Check current authentication status
     */
    async checkAuthStatus() {
        try {
            const response = await fetch('check-private-auth.php?action=check');
            const result = await response.json();
            
            this.isAuthenticated = result.authenticated === true;
            this.updateUI();
            document.dispatchEvent(new CustomEvent('privateAuthChanged', {
                detail: { authenticated: this.isAuthenticated }
            }));
            
            return this.isAuthenticated;
        } catch (error) {
            console.error('Error checking auth status:', error);
            return false;
        }
    }

    /**
     * Login with password
     */
    async login() {
        const password = document.getElementById('privateAuthPassword').value.trim();
        
        if (!password) {
            this.showError('Please enter a password');
            return;
        }

        try {
            const response = await fetch('check-private-auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'login',
                    password: password
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.isAuthenticated = true;
                this.updateUI();
                document.getElementById('privateAuthPassword').value = '';
                
                // Dispatch event for other components to know auth state changed.
                // A blocked note registers a listener that closes this dialog and reopens the note.
                // A blocked note listens for this and closes the login dialog itself.
                this._loginInProgress = true;
                document.dispatchEvent(new CustomEvent('privateAuthChanged', { 
                    detail: { authenticated: true } 
                }));
                const noteOpenedItself = this._inventorySuppressed === true;
                this._loginInProgress = false;
                this._inventorySuppressed = false;

                if (!noteOpenedItself) {
                    this.hideModal();
                }
            } else {
                this.showError(result.error || 'Invalid password');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.');
        }
    }

    /**
     * Logout
     */
    async logout() {
        try {
            const response = await fetch('check-private-auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'logout'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.isAuthenticated = false;
                this.hideUnlockedModal();
                this.updateUI();
                
                // Dispatch event for other components to know auth state changed
                document.dispatchEvent(new CustomEvent('privateAuthChanged', { 
                    detail: { authenticated: false } 
                }));
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    /**
     * Update UI based on authentication state
     */
    updateUI() {
        const loginForm = document.getElementById('privateAuthLoginForm');
        const loggedInMsg = document.getElementById('privateAuthLoggedIn');
        const loginBtn = document.getElementById('privateAuthLoginBtn');
        const logoutBtn = document.getElementById('privateAuthLogoutBtn');
        const statusDiv = document.getElementById('privateAuthStatus');

        if (this.isAuthenticated) {
            // Logged in state
            loginForm.style.display = 'none';
            loggedInMsg.style.display = 'block';
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            this.keyButton.classList.add('authenticated');
            const keyFace = this.keyButton.querySelector('.private-auth-key');
            keyFace.title = 'Log out of private notes';
            keyFace.setAttribute('aria-label', 'Log out of private notes');
            this.setChevronAvailable(true);
            statusDiv.innerHTML = '<span class="text-green-600"><i class="fas fa-check-circle"></i> Authenticated</span>';
        } else {
            // Logged out state
            loginForm.style.display = 'block';
            loggedInMsg.style.display = 'none';
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            this.keyButton.classList.remove('authenticated');
            this.keyButton.classList.remove('is-active');
            const keyFace = this.keyButton.querySelector('.private-auth-key');
            keyFace.title = 'Private Notes Login';
            keyFace.setAttribute('aria-label', 'Private Notes Login');
            this.setChevronAvailable(false);
            statusDiv.innerHTML = '<span class="text-gray-500"><i class="fas fa-lock"></i> Not authenticated</span>';
        }
        this.updatePrivateElementsVisibility();
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.getElementById('privateAuthError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    /**
     * Show the modal
     */
    showModal() {
        this.hideUnlockedModal();
        this.modal.style.display = 'flex';
        this.modal.classList.add('show');
        this.syncKeyActiveState();

        setTimeout(() => {
            const focusTarget = this.isAuthenticated
                ? document.getElementById('privateAuthLogoutBtn')
                : document.getElementById('privateAuthPassword');
            if (focusTarget) focusTarget.focus();
        }, 100);
    }

    /**
     * Hide the modal
     */
    hideModal() {
        if (this._loginInProgress) this._inventorySuppressed = true;
        this.modal.classList.remove('show');
        this.syncKeyActiveState();
        setTimeout(() => {
            this.modal.style.display = 'none';
        }, 300);
    }

    toggleUnlockedModal() {
        if (!this.isAuthenticated) return;
        if (this.unlockedModal.classList.contains('show')) this.hideUnlockedModal();
        else this.showUnlockedModal();
    }

    showUnlockedModal() {
        this.hideModal();
        this.renderUnlockInventory();
        this.unlockedModal.style.display = 'flex';
        this.unlockedModal.classList.add('show');
        this.syncKeyActiveState();
    }

    hideUnlockedModal() {
        if (!this.unlockedModal) return;
        this.unlockedModal.classList.remove('show');
        this.syncKeyActiveState();
        setTimeout(() => {
            if (!this.unlockedModal.classList.contains('show')) {
                this.unlockedModal.style.display = 'none';
            }
        }, 300);
    }

    setChevronAvailable(available) {
        const chevron = this.keyButton.querySelector('.private-auth-chevron');
        if (!chevron) return;
        chevron.hidden = !available;
        if (!available) chevron.setAttribute('aria-expanded', 'false');
    }

    syncKeyActiveState() {
        const listOpen = this.unlockedModal && this.unlockedModal.classList.contains('show');
        const logoutOpen = this.isAuthenticated && this.modal.classList.contains('show');
        this.keyButton.classList.toggle('is-active', !!(listOpen || logoutOpen));
        const chevron = this.keyButton.querySelector('.private-auth-chevron');
        if (chevron) chevron.setAttribute('aria-expanded', listOpen ? 'true' : 'false');
    }

    renderUnlockInventory() {
        const unlocked = this.collectPrivateTree();
        const locked = this.collectSuperPrivateTree();
        const unlockedCount = this.countKind(unlocked, 'note');
        const lockedCount = this.countKind(locked, 'obsidian');

        document.getElementById('privateUnlockedHeading').textContent =
            unlockedCount ? `Unlocked (${unlockedCount})` : 'Unlocked';
        document.getElementById('privateLockedHeading').textContent =
            lockedCount ? `Can't be unlocked (${lockedCount})` : "Can't be unlocked";

        this.renderTree(
            document.getElementById('privateUnlockedTree'),
            unlocked,
            'Nothing is password-locked yet. End a note filename with (PRIVATE).md, or a folder name with (PRIVATE), then rebuild.'
        );
        this.renderTree(
            document.getElementById('privateLockedTree'),
            locked,
            'No notes open in Obsidian from this notebook.'
        );
    }

    labelOf(nameEl) {
        if (!nameEl) return '';
        const clone = nameEl.cloneNode(true);
        clone.querySelectorAll('.custom-icon, .quiz-pill, .csv-pill, .fa-folder, .fas, .note-item-buttons').forEach((node) => node.remove());
        return clone.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    }

    safeObsidianUrl(raw) {
        if (!raw || !/^obsidian:\/\//i.test(raw)) return '';
        if (/[\s"'<>]/.test(raw)) return '';
        return raw;
    }

    insertCrumbs(forest, crumbs, node) {
        let level = forest;
        crumbs.forEach((name) => {
            let folder = level.find((item) => item.context && item.name === name);
            if (!folder) {
                folder = { name, kind: 'folder', context: true, id: null, url: null, children: [] };
                level.push(folder);
            }
            level = folder.children;
        });
        level.push(node);
    }

    ancestorNames(li) {
        const names = [];
        let parent = li.parentElement ? li.parentElement.closest('li') : null;
        while (parent) {
            const nameEl = parent.querySelector(':scope > .name');
            if (nameEl) names.unshift(this.labelOf(nameEl));
            parent = parent.parentElement ? parent.parentElement.closest('li') : null;
        }
        return names;
    }

    nodeFromPrivateLi(li) {
        const nameEl = li.querySelector(':scope > .name');
        const isFolder = nameEl && nameEl.classList.contains('is-folder');
        const children = isFolder
            ? Array.from(li.querySelectorAll(':scope > ul > li[data-private="1"]'))
                .filter((child) => child.getAttribute('data-superprivate') !== '1')
                .map((child) => this.nodeFromPrivateLi(child))
            : [];
        return {
            name: this.labelOf(nameEl),
            kind: isFolder ? 'folder' : 'note',
            context: false,
            id: nameEl && nameEl.dataset.id ? nameEl.dataset.id : null,
            url: null,
            children
        };
    }

    collectPrivateTree() {
        const tops = Array.from(document.querySelectorAll('#topics-list li[data-private="1"]')).filter((li) => {
            if (li.getAttribute('data-superprivate') === '1') return false;
            const parent = li.parentElement ? li.parentElement.closest('li') : null;
            return !parent || parent.getAttribute('data-private') !== '1';
        });
        const forest = [];
        tops.forEach((li) => {
            this.insertCrumbs(forest, this.ancestorNames(li), this.nodeFromPrivateLi(li));
        });
        return forest;
    }

    collectSuperPrivateTree() {
        const items = Array.from(document.querySelectorAll('#topics-list li[data-superprivate="1"]'));
        const forest = [];
        items.forEach((li) => {
            const nameEl = li.querySelector(':scope > .name');
            this.insertCrumbs(forest, this.ancestorNames(li), {
                name: this.labelOf(nameEl),
                kind: 'obsidian',
                context: false,
                id: nameEl && nameEl.dataset.id ? nameEl.dataset.id : null,
                url: this.safeObsidianUrl(li.getAttribute('data-obsidian-url')),
                children: []
            });
        });
        return forest;
    }

    countKind(nodes, kind) {
        return nodes.reduce((total, node) => {
            return total + (node.kind === kind ? 1 : 0) + this.countKind(node.children || [], kind);
        }, 0);
    }

    renderTree(container, forest, emptyText) {
        container.replaceChildren();
        if (!forest.length) {
            const empty = document.createElement('p');
            empty.className = 'private-unlock-empty';
            empty.textContent = emptyText;
            container.appendChild(empty);
            return;
        }
        container.appendChild(this.renderNodes(forest));
    }

    renderNodes(nodes) {
        const ul = document.createElement('ul');
        ul.className = 'private-unlock-tree';
        nodes.forEach((node) => ul.appendChild(this.renderUnlockNode(node)));
        return ul;
    }

    renderUnlockNode(node) {
        const li = document.createElement('li');
        li.className = `private-unlock-node private-unlock-node--${node.kind}`;

        if (node.kind === 'folder') {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'private-unlock-folder';
            button.setAttribute('aria-expanded', 'true');

            const chevron = document.createElement('i');
            chevron.className = 'fas fa-chevron-down';
            chevron.setAttribute('aria-hidden', 'true');
            const icon = document.createElement('i');
            icon.className = 'fas fa-folder';
            icon.setAttribute('aria-hidden', 'true');
            const label = document.createElement('span');
            label.textContent = node.name;
            button.append(chevron, icon, label);

            const children = this.renderNodes(node.children);
            button.addEventListener('click', () => {
                const open = button.getAttribute('aria-expanded') === 'true';
                button.setAttribute('aria-expanded', open ? 'false' : 'true');
                children.hidden = open;
            });
            li.append(button, children);
            return li;
        }

        if (node.kind === 'obsidian') {
            const link = document.createElement('a');
            link.className = 'private-unlock-file private-unlock-file--obsidian';
            if (node.url) link.href = node.url;
            else {
                link.href = '#';
                link.addEventListener('click', (event) => event.preventDefault());
            }
            const icon = document.createElement('i');
            icon.className = 'fas fa-lock';
            icon.setAttribute('aria-hidden', 'true');
            const label = document.createElement('span');
            label.textContent = node.name;
            const hint = document.createElement('span');
            hint.className = 'private-unlock-hint';
            hint.textContent = 'Opens in Obsidian';
            link.append(icon, label, hint);
            li.appendChild(link);
            return li;
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'private-unlock-file';
        const icon = document.createElement('i');
        icon.className = 'fas fa-file-alt';
        icon.setAttribute('aria-hidden', 'true');
        const label = document.createElement('span');
        label.textContent = node.name;
        button.append(icon, label);
        button.addEventListener('click', () => this.openUnlockedNote(node.id));
        li.appendChild(button);
        return li;
    }

    openUnlockedNote(id) {
        if (!id) return;
        this.hideUnlockedModal();
        const real = document.querySelector(`#topics-list .name.is-file[data-id="${CSS.escape(id)}"]`);
        if (real) real.click();
    }
}

// Global instance
window.privateAuthManager = null;

// Initialize after the topics tree is injected, so updatePrivateElementsVisibility()
// can hide [data-private="1"] items that live inside cachedResPartial.html.
(function () {
    const onTopicsReady = () => {
        window.privateAuthManager = new PrivateAuthManager();
    };
    if (window.__topicsReady) onTopicsReady();
    else document.addEventListener('topics-ready', onTopicsReady, { once: true });
})();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PrivateAuthManager };
}

