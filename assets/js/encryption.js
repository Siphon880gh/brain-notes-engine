/**
 * Encryption/Decryption utilities for DevBrain
 * Handles AGE encrypted content with password protection
 */

class EncryptionManager {
    constructor() {
        this.cache = new Map(); // Cache decrypted content
    }

    /**
     * Check if content contains AGE encryption
     */
    isAgeEncrypted(content) {
        return content.includes('-----BEGIN AGE ENCRYPTED FILE-----') &&
               content.includes('-----END AGE ENCRYPTED FILE-----');
    }

    /**
     * Extract AGE encrypted block from markdown content
     */
    extractAgeBlock(content) {
        const ageBlockRegex = /```age\s*([\s\S]*?)```/;
        const match = content.match(ageBlockRegex);
        if (!match) return null;
        
        const fullBlock = match[1].trim();
        
        // Extract only the base64 payload between the headers
        const payloadRegex = /-----BEGIN AGE ENCRYPTED FILE-----\s*([\s\S]*?)\s*-----END AGE ENCRYPTED FILE-----/;
        const payloadMatch = fullBlock.match(payloadRegex);
        
        if (payloadMatch) {
            // Return only the base64 payload, not the headers
            return payloadMatch[1].trim();
        }
        
        // Fallback: return the full block if headers aren't found
        return fullBlock;
    }

    /**
     * Decrypt content using the PHP backend
     */
    async decryptWithBackend(ageContent, password) {
        try {
            // Starting backend decryption...

            const response = await fetch('decrypt-age.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: ageContent,
                    password: password
                })
            });

            const result = await response.json();

            if (!response.ok) {
                const error = new Error(result.error || 'Decryption failed');
                if (result.debug_content_preview) {
                    error.debug_content_preview = result.debug_content_preview;
                }
                if (result.debug_info) {
                    error.debug_info = result.debug_info;
                }
                throw error;
            }

            // Log which decryption method was used
            if (result.decryption_method) {
                const methodEmoji = {
                    'age_binary': '🔧',
                    'nodejs_fallback': '⚠️',
                    'nodejs_primary': '🔧'
                };
                const methodName = {
                    'age_binary': 'Age Binary',
                    'nodejs_fallback': 'Node.js (Fallback)',
                    'nodejs_primary': 'Node.js (Primary)'
                };
                const emoji = methodEmoji[result.decryption_method] || '🔧';
                const name = methodName[result.decryption_method] || result.decryption_method;
                console.log(`${emoji} AGE Decryption: Using ${name}`);
            }

            return result;
        } catch (error) {
            console.error('❌ Backend decryption error:', error);
            throw error;
        }
    }

    /**
     * Decrypt AES-256-CBC content in JavaScript
     */
    async decryptAES(encryptedData, password) {
        try {
            // Starting AES decryption...
            console.log('🔓 Decrypting AES content, length:', encryptedData.length);

            // Validate base64 before decoding
            if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encryptedData)) {
                throw new Error('Invalid base64 format: ' + encryptedData.substring(0, 50) + '...');
            }

            // Decode base64
            const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
            
            // Extract components (CBC format: salt + iv + ciphertext)
            const salt = combined.slice(0, 16);
            const iv = combined.slice(16, 32);
            const ciphertext = combined.slice(32);

            // Derive key using PBKDF2
            const keyMaterial = await window.crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(password),
                'PBKDF2',
                false,
                ['deriveBits', 'deriveKey']
            );

            const key = await window.crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 10000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                { name: 'AES-CBC', length: 256 },
                false,
                ['decrypt']
            );

            // Decrypt
            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-CBC',
                    iv: iv
                },
                key,
                ciphertext
            );

            const result = new TextDecoder().decode(decrypted);
            console.log('✅ AES decryption successful, result length:', result.length);
            console.log('📄 Decrypted content preview:', result.substring(0, 100) + '...');
            return result;
        } catch (error) {
            console.error('❌ AES decryption failed:', error);
            throw new Error('Client-side decryption failed: ' + error.message);
        }
    }

    /**
     * Main decryption method
     */
    async decrypt(content, password) {
        // Starting main decryption process...

        const cacheKey = btoa(content + password);
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            // Using cached result
            return this.cache.get(cacheKey);
        }

        try {
            // Extract AGE block
            const ageBlock = this.extractAgeBlock(content);
            // AGE block extracted successfully

            if (!ageBlock) {
                throw new Error('No AGE encrypted block found');
            }

            // Step 1: Decrypt AGE content via PHP backend
            const backendResult = await this.decryptWithBackend(ageBlock, password);
            
            // Step 2: Decrypt the AES content client-side
            const decryptedContent = await this.decryptAES(backendResult.encrypted_content, password);

            // Decryption successful
            console.log('🎉 Full decryption successful!');
            console.log('📝 Final decrypted content:', decryptedContent);

            // Cache the result
            this.cache.set(cacheKey, decryptedContent);

            return decryptedContent;
        } catch (error) {
            console.error('❌ Main decryption error:', error);
            throw error;
        }
    }


    /**
     * Clear decryption cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Password dialog management
class PasswordDialog {
    constructor() {
        this.createDialog();
    }

    createDialog() {
        // Create modal HTML
        const modalHTML = `
            <div class="modal" id="passwordModal" style="display:none;">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title mt-0">🔒 Encrypted Content</h4>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p>This note contains encrypted content. Please enter the password to decrypt it.</p>
                            <div class="form-group">
                                <label for="passwordInput">Password:</label>
                                <input type="password" id="passwordInput" class="form-control" placeholder="Enter password" autocomplete="off">
                                <div id="passwordError" class="text-red-500 mt-2" style="display: none;"></div>
                            </div>
                            <div id="decryptionProgress" style="display: none;" class="mt-3">
                                <div class="flex items-center">
                                    <i class="fas fa-spinner fa-spin mr-2"></i>
                                    <span>Decrypting content...</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" id="decryptButton" class="btn btn-primary bg-blue-500 text-white px-4 py-2 rounded">
                                <i class="fas fa-unlock"></i> Decrypt
                            </button>
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page if it doesn't exist
        if (!document.getElementById('passwordModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        const modal = document.getElementById('passwordModal');
        const passwordInput = document.getElementById('passwordInput');
        const decryptButton = document.getElementById('decryptButton');
        const errorDiv = document.getElementById('passwordError');
        const progressDiv = document.getElementById('decryptionProgress');

        // Handle Enter key in password input
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                decryptButton.click();
            }
        });

        // Handle decrypt button click
        decryptButton.addEventListener('click', () => {
            const password = passwordInput.value.trim();
            if (!password) {
                this.showError('Please enter a password');
                return;
            }

            this.decrypt(password);
        });

        // Clear error when typing
        passwordInput.addEventListener('input', () => {
            errorDiv.style.display = 'none';
        });

        // Handle close button clicks
        const closeButtons = modal.querySelectorAll('[data-dismiss="modal"], .close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.hide();
            });
        });

        // Handle clicking outside modal to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hide();
            }
        });

        // Handle ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                this.hide();
            }
        });
    }

    showError(message) {
        const errorDiv = document.getElementById('passwordError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    showProgress(show = true) {
        const progressDiv = document.getElementById('decryptionProgress');
        const decryptButton = document.getElementById('decryptButton');
        
        progressDiv.style.display = show ? 'block' : 'none';
        decryptButton.disabled = show;
    }

    async decrypt(password) {
        if (!this.onDecrypt) {
            console.error('No decrypt handler set');
            return;
        }

        this.showProgress(true);
        
        try {
            await this.onDecrypt(password);
            // Success - modal will be closed by the handler
        } catch (error) {
            let errorMessage = error.message || 'Decryption failed';
            if (error.debug_info) {
                errorMessage += '\n\nDebug: ' + error.debug_info;
            }
            if (error.debug_content_preview) {
                errorMessage += '\n\nContent Preview: ' + error.debug_content_preview;
            }
            this.showError(errorMessage);
        } finally {
            this.showProgress(false);
        }
    }

    show(onDecrypt) {
        this.onDecrypt = onDecrypt;
        const modal = document.getElementById('passwordModal');
        const passwordInput = document.getElementById('passwordInput');
        const errorDiv = document.getElementById('passwordError');
        const progressDiv = document.getElementById('decryptionProgress');
        
        // Reset form state
        passwordInput.value = '';
        errorDiv.style.display = 'none';
        progressDiv.style.display = 'none';
        
        // Show modal with animation
        modal.style.display = 'flex';
        // Trigger animation on next frame
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
        
        // Focus the password input after animation starts
        setTimeout(() => {
            passwordInput.focus();
        }, 100);
    }

    hide() {
        const modal = document.getElementById('passwordModal');
        modal.classList.remove('show');
        // Hide modal after animation completes
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Global instances
window.encryptionManager = new EncryptionManager();
window.passwordDialog = new PasswordDialog();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EncryptionManager, PasswordDialog };
}
