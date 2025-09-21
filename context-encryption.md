# DevBrain Encryption System Context

## Overview

DevBrain implements a robust AGE encryption system with Node.js fallback to handle password-protected notes seamlessly across different server environments. The system provides transparent encryption/decryption with full feature support for all DevBrain capabilities.

## Architecture

### Hybrid Encryption Flow
```
AGE Encrypted Content → PHP Backend → AES-256-CBC → JavaScript Client → Rendered Content
```

### Backend Components
- **`decrypt-age.php`** (1411 lines): Main encryption handler with dual decryption methods
- **`decrypt-age-node.js`** (353 lines): Node.js AGE decryption script using `age-encryption` npm package (v0.2.4)
- **`find-nodejs-path.php`** (142 lines): Helper script for Node.js path detection and configuration

### Frontend Components
- **`assets/js/encryption.js`** (399 lines): Client-side encryption management with console logging
- **`assets/css/encryption.css`**: Password dialog styling and modal appearance

## Decryption Methods

### Primary: AGE Binary
- Uses system `age` binary for decryption
- Fast and efficient when available
- May fail in nginx/PHP-FPM environments due to TTY requirements

### Fallback: Node.js
- Uses `age-encryption` npm package (v0.2.4, already in `package.json`)
- Works in all environments including nginx/PHP-FPM
- Automatically triggered when age binary fails
- Handles TTY issues and non-interactive environments
- ES module support for Node.js v14+ with dynamic import
- Can be configured as primary method via `bypassAgeBinary` setting

## Configuration

### config.json Structure
```json
{
  "age": {
    "appendSystemPath": [
      "/usr/local/bin",
      "/opt/homebrew/bin",
      "/usr/bin",
      "/bin",
      "/opt/homebrew/bin/age"
    ],
    "bypassAgeBinary": true
  },
  "nodejs": {
    "appendSystemPath": [
      "/Users/wengffung/.nvm/versions/node/v22.7.0/bin",
      "/usr/local/bin",
      "/opt/homebrew/bin",
      "/usr/bin",
      "/bin"
    ]
  }
}
```

### Node.js Detection Priority
1. `which node` command (if available in PATH)
2. Paths specified in `appendSystemPath` array
3. Automatic detection - no manual binary path needed

### Configuration Options
- **`bypassAgeBinary`**: Set to `true` to use Node.js as primary method instead of age binary
- **`appendSystemPath`**: Array of paths to search for Node.js and age binaries
- **Automatic Fallback**: System automatically falls back to Node.js if age binary fails

## Key Features

### Robust Fallback Support
- **TTY Issue Resolution**: Handles nginx/PHP-FPM environments where age binary requires TTY
- **Automatic Detection**: Smart Node.js path detection using system commands and configurable paths
- **Error Handling**: Comprehensive error messages with troubleshooting guidance

### Console Logging
- **Browser Console**: Shows which decryption method was used
- **Server Logs**: PHP error_log statements for debugging
- **Method Indicators**:
  - `🔧 AGE Decryption: Using Age Binary`
  - `⚠️ AGE Decryption: Using Node.js (Fallback)`
  - `🔧 AGE Decryption: Using Node.js (Primary)`
- **Debug Information**: Comprehensive logging of decryption process, Node.js version detection, and error details
- **Error Context**: Enhanced error messages with troubleshooting guidance for common issues

### Security Features
- **PBKDF2 Key Derivation**: Secure password-based key generation
- **AES-256-CBC Encryption**: Client-side encryption for session security
- **Session Caching**: Decrypted content cached for session duration only
- **No Persistent Storage**: Passwords and decrypted content never stored

## Implementation Details

### PHP Backend (`decrypt-age.php`)
```php
// Main decryption function with fallback logic
function decryptAge($ageContent, $password) {
    // Try age binary first
    if ($ageAvailable) {
        try {
            return decryptAgeWithBinary($ageContent, $password);
        } catch (Exception $e) {
            // Fallback to Node.js
            return decryptAgeWithNodeJS($ageContent, $password);
        }
    } else {
        // Use Node.js as primary method
        return decryptAgeWithNodeJS($ageContent, $password);
    }
}
```

### Node.js Script (`decrypt-age-node.js`)
```javascript
// ES module import for age-encryption package (Node.js v14+)
const age = await import('age-encryption');
const decrypter = new age.Decrypter();
decrypter.addPassphrase(password);

// Handle both armored and unarmored content
let binaryData;
if (armored.includes('-----BEGIN AGE ENCRYPTED FILE-----')) {
    binaryData = age.armor.decode(armored);
} else {
    // Handle unarmored content with manual base64 decoding
    const cleanPayload = armored.replace(/\s+/g, '');
    const binaryString = atob(cleanPayload);
    binaryData = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        binaryData[i] = binaryString.charCodeAt(i);
    }
}

const decrypted = await decrypter.decrypt(binaryData, "text");
```

### Frontend Integration (`assets/js/encryption.js`)
```javascript
// Console logging for decryption method
if (result.decryption_method) {
    const methodEmoji = {
        'age_binary': '🔧',
        'nodejs_fallback': '⚠️',
        'nodejs_primary': '🔧'
    };
    console.log(`${emoji} AGE Decryption: Using ${name}`);
}
```

## File Sizes for AI Reference
- `decrypt-age.php`: 1411 lines (large - use targeted search)
- `assets/js/encryption.js`: 399 lines (medium - consider targeted search)
- `decrypt-age-node.js`: 353 lines (medium - consider targeted search)
- `find-nodejs-path.php`: 142 lines (small-medium - read full file)

## Troubleshooting

### Common Issues
1. **"Node.js not found"**: Run `php find-nodejs-path.php` to detect paths
2. **"age-encryption package not found"**: Run `npm install age-encryption`
3. **"Cannot find module"**: Ensure Node.js and npm are properly installed
4. **TTY errors**: Normal behavior - system automatically falls back to Node.js
5. **"Node.js version too old"**: Upgrade to Node.js v14+ for ES module support
6. **"Invalid base64 characters"**: Check for line breaks or invalid characters in AGE content
7. **"AGE content truncated"**: Ensure full AGE file was transmitted (check for missing final stanza)

### Configuration Helper
```bash
# Find Node.js paths and generate config
php find-nodejs-path.php

# Test decryption
node decrypt-age-node.js "$(cat encryption-test.md)" "password"
```

## Integration Points

### Note Detection
- Scans for AGE encrypted blocks in markdown content
- Detects `-----BEGIN AGE ENCRYPTED FILE-----` markers
- Handles both full armored format and markdown code fences

### Feature Compatibility
- **Full Feature Support**: Decrypted content supports all DevBrain features
- **Mindmaps**: Works with decrypted content
- **Link Previews**: Functions normally after decryption
- **Search**: Decrypted content is searchable
- **Image Modals**: Click-to-expand works with decrypted images

### Session Management
- **Temporary Caching**: Decrypted content cached in session only
- **Security**: No persistent storage of sensitive data
- **Performance**: Avoids re-decryption during session

This encryption system provides enterprise-grade security while maintaining the seamless user experience that DevBrain is known for, with robust fallback mechanisms ensuring compatibility across all server environments.
