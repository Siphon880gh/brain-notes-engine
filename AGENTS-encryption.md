# DevBrain Encryption System Context

> **Note for AI Tools:** Line references in this file are intentionally approximate (e.g., "near the top," "around lines 100–150"). Exact line numbers are fragile and shift with edits. Use these as navigation hints, then search or read the actual file for precision.

## Overview

DevBrain implements a robust AGE encryption system with Node.js fallback to handle password-protected notes seamlessly across different server environments. The system provides transparent encryption/decryption with full feature support for all DevBrain capabilities.

## Architecture

### Hybrid Encryption Flow
```
AGE Encrypted Content → PHP Backend → AES-256-CBC → JavaScript Client → Rendered Content
```

### Backend Components
- **`decrypt-age.php`** (~1411 lines): Main encryption handler with dual decryption methods
- **`decrypt-age-node.js`** (~352 lines): Node.js AGE decryption script using `age-encryption` npm package (v0.2.4)
- **`find-nodejs-path.php`** (~141 lines): Helper script for Node.js path detection and configuration

### Frontend Components
- **`assets/js/encryption.js`** (~399 lines): Client-side encryption management with console logging
- **`assets/css/encryption.css`** (~290 lines): Password dialog styling and modal appearance

## Decryption Methods

### Primary: AGE Binary
- Uses system `age` binary for decryption
- Fast and efficient when available
- May fail in nginx/PHP-FPM environments due to TTY requirements

### Fallback: Node.js
- Uses `age-encryption` npm package (v0.2.4, already in `package.json`)
- Works in all environments including nginx/PHP-FPM
- Automatically triggered when age binary fails
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
      "/usr/bin"
    ],
    "bypassAgeBinary": true
  },
  "nodejs": {
    "appendSystemPath": [
      "/Users/wengffung/.nvm/versions/node/v22.7.0/bin",
      "/usr/local/bin",
      "/opt/homebrew/bin"
    ]
  }
}
```

### Node.js Detection Priority
1. `which node` command (if available in PATH)
2. Paths specified in `appendSystemPath` array
3. Automatic detection - no manual binary path needed

### Configuration Options
- **`bypassAgeBinary`**: Set to `true` to use Node.js as primary method
- **`appendSystemPath`**: Array of paths to search for Node.js and age binaries

## Key Features

### Robust Fallback Support
- **TTY Issue Resolution**: Handles nginx/PHP-FPM environments where age binary requires TTY
- **Automatic Detection**: Smart Node.js path detection using system commands
- **Error Handling**: Comprehensive error messages with troubleshooting guidance

### Console Logging
- **Browser Console**: Shows which decryption method was used
- **Method Indicators**:
  - `🔧 AGE Decryption: Using Age Binary`
  - `⚠️ AGE Decryption: Using Node.js (Fallback)`
  - `🔧 AGE Decryption: Using Node.js (Primary)`

### Security Features
- **PBKDF2 Key Derivation**: Secure password-based key generation
- **AES-256-CBC Encryption**: Client-side encryption for session security
- **Session Caching**: Decrypted content cached for session duration only
- **No Persistent Storage**: Passwords and decrypted content never stored

## Implementation Details

### PHP Backend (`decrypt-age.php`)
Located near the middle of the file, the main decryption function implements fallback logic:
```php
// Main decryption function with fallback logic
function decryptAge($ageContent, $password) {
    // Try age binary first (if not bypassed)
    // Fallback to Node.js on failure
}
```

### Node.js Script (`decrypt-age-node.js`)
Near the top of the file, ES module import for age-encryption:
```javascript
// ES module import for age-encryption package (Node.js v14+)
const age = await import('age-encryption');
const decrypter = new age.Decrypter();
decrypter.addPassphrase(password);
```

### Frontend Integration (`assets/js/encryption.js`)
Near the bottom third of the file, console logging for decryption method:
```javascript
// Console logging for decryption method
if (result.decryption_method) {
    console.log(`${emoji} AGE Decryption: Using ${name}`);
}
```

## File Sizes for AI Reference
- `decrypt-age.php`: ~1411 lines (large - use targeted search)
- `assets/js/encryption.js`: ~399 lines (medium - consider targeted search)
- `decrypt-age-node.js`: ~352 lines (medium - consider targeted search)
- `find-nodejs-path.php`: ~141 lines (small-medium - read full file)
- `assets/css/encryption.css`: ~290 lines (medium - consider targeted search)

## Troubleshooting

### Common Issues
1. **"Node.js not found"**: Run `php find-nodejs-path.php` to detect paths
2. **"age-encryption package not found"**: Run `npm install age-encryption`
3. **TTY errors**: Normal behavior - system automatically falls back to Node.js
4. **"Node.js version too old"**: Upgrade to Node.js v14+ for ES module support

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
