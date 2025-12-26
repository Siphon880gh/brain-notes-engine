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
        this.init();
    }

    async init() {
        this.createKeyButton();
        this.createModal();
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
     * Create the key icon button in the top right
     */
    createKeyButton() {
        const button = document.createElement('button');
        button.id = 'private-auth-btn';
        button.className = 'private-auth-button';
        button.title = 'Private Notes Login';
        button.innerHTML = '<i class="fas fa-key"></i>';
        
        // Insert near other top-right buttons (after TOC button)
        const tocButton = document.getElementById('toc-toggler');
        if (tocButton) {
            tocButton.parentNode.insertBefore(button, tocButton);
        } else {
            document.body.appendChild(button);
        }
        
        this.keyButton = button;
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
                                    <i class="fas fa-check-circle"></i>
                                    <span>You are logged in and can access private notes.</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" id="privateAuthLoginBtn" class="btn btn-primary bg-blue-500 text-white px-4 py-2 rounded">
                                <i class="fas fa-sign-in-alt"></i> Login
                            </button>
                            <button type="button" id="privateAuthLogoutBtn" class="btn btn-danger bg-red-500 text-white px-4 py-2 rounded" style="display: none;">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </button>
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('privateAuthModal');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Key button click
        this.keyButton.addEventListener('click', () => this.showModal());

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
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                this.hideModal();
            }
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
                
                // Dispatch event for other components to know auth state changed
                document.dispatchEvent(new CustomEvent('privateAuthChanged', { 
                    detail: { authenticated: true } 
                }));
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
            this.keyButton.title = 'Private Notes (Logged In)';
            statusDiv.innerHTML = '<span class="text-green-600"><i class="fas fa-check-circle"></i> Authenticated</span>';
        } else {
            // Logged out state
            loginForm.style.display = 'block';
            loggedInMsg.style.display = 'none';
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            this.keyButton.classList.remove('authenticated');
            this.keyButton.title = 'Private Notes Login';
            statusDiv.innerHTML = '<span class="text-gray-500"><i class="fas fa-lock"></i> Not authenticated</span>';
        }
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
        this.modal.style.display = 'flex';
        requestAnimationFrame(() => {
            this.modal.classList.add('show');
        });
        
        // Focus password input if not authenticated
        if (!this.isAuthenticated) {
            setTimeout(() => {
                document.getElementById('privateAuthPassword').focus();
            }, 100);
        }
    }

    /**
     * Hide the modal
     */
    hideModal() {
        this.modal.classList.remove('show');
        setTimeout(() => {
            this.modal.style.display = 'none';
        }, 300);
    }
}

// Global instance
window.privateAuthManager = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.privateAuthManager = new PrivateAuthManager();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PrivateAuthManager };
}

