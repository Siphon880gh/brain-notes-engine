# DevBrain AGE Encryption & Decryption Guide

DevBrain supports AGE-encrypted content with password protection, providing secure note storage while maintaining the familiar DevBrain interface. This guide covers both encryption and decryption functionality, including advanced configuration options and testing procedures.

## Features

- **AGE Format Detection**: Automatically detects AGE-encrypted content in markdown files. These md files are usually encrypted in Obsidian where it was authored then finally encrypted with the plugin Age Encrypt.
- **Password-Protected UI**: Clean, secure password entry modal
- **Seamless Integration**: Encrypted content renders exactly like regular notes after decryption
- **Full Feature Support**: Decrypted content supports all DevBrain features (mindmaps, link previews, TOC, etc.)
- **Robust Fallback Support**: Works with or without the `age` binary installed, with automatic Node.js fallback for server environments
- **Configurable Bypass**: Option to bypass AGE binary entirely and use Node.js directly

## Usage

### Creating Encrypted Content

1. **Using AGE Binary** (recommended for real AGE encryption):
   ```bash
   echo "Secret content" | age -p > encrypted.txt
   ```

Or: Encrypted in Obsidian where it was authored then finally encrypted with the plugin Age Encrypt.

### Markdown Format

Add encrypted content to your markdown files using the `age` code block:

```markdown
# My Note Title

Regular content here...

```age
-----BEGIN AGE ENCRYPTED FILE-----
[encrypted content here]
-----END AGE ENCRYPTED FILE-----
```

More regular content...
```

### DevBrain Integration

1. **Automatic Detection**: DevBrain automatically detects AGE-encrypted blocks
2. **Password Prompt**: Users see a secure password dialog when opening encrypted notes
3. **Seamless Decryption**: After entering the correct password, content renders normally
4. **Full Features**: All DevBrain features work with decrypted content

## Architecture

### Backend (PHP + Node.js)
- `decrypt-age.php`: Handles AGE decryption and re-encryption for JavaScript. First contact point when user clicks Decrypt then types in the password.
- `decrypt-age-node.js`: Node.js fallback using age-encryption npm package
- **Primary**: Tries `age` binary first
- **Fallback**: Automatically uses Node.js script when binary fails or isn't available (especially for nginx/PHP-FPM servers)
- Re-encrypts with AES-256-GCM for client-side handling

### Frontend (JavaScript)
- `assets/js/encryption.js`: Main encryption management
- `assets/js/note-opener.js`: Integrated decryption flow
- `assets/css/encryption.css`: Password dialog styling

### Security Flow
1. **Detection**: JavaScript detects AGE blocks in markdown
2. **Password Request**: Secure modal prompts for password
3. **Backend Decryption**: PHP decrypts AGE content
4. **Re-encryption**: Content re-encrypted with AES-256-GCM
5. **Client Decryption**: JavaScript decrypts and renders content
6. **Caching**: Decrypted content cached for session

## Configuration Options

### Basic Configuration

In your `config.json` file, you can configure the AGE binary bypass and system paths:

```json
{
    "imgHostedUrl": "https://wengindustries.com/hosted/obs-imgur/",
    "age": {
        "bypassAgeBinary": true,
        "appendSystemPath": [
            "/usr/local/bin",
            "/opt/homebrew/bin",
            "/usr/bin",
            "/bin",
            "/opt/homebrew/bin/age"
        ]
    },
    "nodejs": {
        "appendSystemPath": [
            "/Users/username/.nvm/versions/node/v22.7.0/bin",
            "/usr/local/bin",
            "/opt/homebrew/bin",
            "/usr/bin",
            "/bin"
        ]
    }
}
```

### Configuration Parameters

#### `age.bypassAgeBinary`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: When set to `true`, the system will skip checking for the AGE binary and go directly to Node.js decryption
- **Effect**: Forces the use of Node.js `age-encryption` package instead of the system AGE binary

#### `age.appendSystemPath`
- **Type**: `array` of strings
- **Description**: Additional system paths to search for the AGE binary
- **Use case**: When `bypassAgeBinary` is `false`, these paths are checked for the AGE binary
- **Example**: `["/usr/local/bin", "/opt/homebrew/bin"]`

#### `nodejs.appendSystemPath`
- **Type**: `array` of strings
- **Description**: Additional system paths to search for Node.js
- **Use case**: Used when looking for the Node.js executable
- **Example**: `["/Users/username/.nvm/versions/node/v22.7.0/bin"]`

## How Decryption Works

### Decryption Flow

1. **AGE Binary Bypass Check**: If `bypassAgeBinary: true`, skip to Node.js
2. **AGE Binary Detection**: If bypass is `false`, check for AGE binary in system paths
3. **Node.js Fallback**: If AGE binary fails or is not found, use Node.js
4. **AES-256-CBC Fallback**: If Node.js fails, try AES-256-CBC decryption

### Decryption Methods

The system supports these decryption methods with corresponding emojis:

- `age_binary` 🔧 - Uses the AGE binary (default when available)
- `nodejs_fallback` ⚠️ - Node.js fallback when AGE binary fails
- `nodejs_primary` 🔧 - Node.js when AGE binary is not found
- `nodejs_bypass` ⚡ - Node.js bypass (when `bypassAgeBinary: true`)
- `aes256cbc_fallback` 🔄 - AES-256-CBC fallback when AGE methods fail

## AGE Binary Bypass Configuration

### Overview

The `bypassAgeBinary` configuration option allows you to skip the AGE binary entirely and use Node.js directly for AGE decryption. This is useful when:

- The AGE binary is not available or not working properly
- You want to force Node.js usage for consistency
- You're having issues with the AGE binary on your system
- You're running on a server environment where the AGE binary cannot work properly

### Why Use Node.js Instead of AGE Binary?

#### AGE Binary Limitations

1. **Interactive Terminal Required**: AGE binary requires interactive password input
2. **TTY Issues**: Doesn't work well in web server environments (nginx + PHP-FPM)
3. **Version Compatibility**: Different AGE binary versions have different capabilities
4. **Shell Escaping**: Complex password handling in shell environments

#### Node.js Advantages

1. **No Interactive Terminal**: Works in web server environments
2. **Consistent API**: Same behavior across different systems
3. **Better Error Handling**: More detailed error messages
4. **Version Control**: Can specify exact Node.js version via .nvmrc

#### PHP Limitations

PHP's AGE implementation is not compatible with Obsidian's AGE format, which is why we use Node.js as a bridge.

## Requirements

### For AGE Binary Bypass Mode

1. **Node.js v14+**: Required for ES module support
2. **age-encryption package**: Install with `npm install age-encryption`
3. **decrypt-age-node.js script**: Must exist in project root
4. **package.json**: Must contain the age-encryption dependency

### Installation Steps

```bash
# Install Node.js dependencies
npm install age-encryption

# Verify Node.js version (should be v14+)
node --version

# Check if age-encryption is installed
ls node_modules/age-encryption
```

## Testing with Postman

### Local Testing

**Endpoint**: `POST http://localhost:8888/weng/app/devbrain/decrypt-age.php`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
    "content": "YWdlLWVuY3J5cHRpb24ub3JnL3YxCi0+IHNjcnlwdCBNa2xvdFRuYnhzVGM0VGlzbGk1bU13IDE4CnlWbkkySER2MnF2c2JrM1lZQ0ZvQ2RKRmY1V0cvcEZOVSsvV1Yva2pobUkKLS0tIHJQV1Z6UTZ3cklOMHlzc2ZLbEJZWTIvckorWlRWcm5pOG45NjJIYnAvZXMKChd7KmJikOmEGZyTnzEluoT71er+74UWzAiyrwmxQLxMskNfU40r1ltuq9xGuG2Zre7NWHYh7xJjeIvQM+JJQreF1Sqcg13cXXbZ2oUPnl8sLqebxFBCQv1gn/pr9FYGZWa5ZpRat/RE/2LT2UqZD0kDH+ORmfn31uLzXucbGaIHJpp1CxrUu0yqAM+wJq3hIhYlEgAWZ4U5/fSC0I5lyAxaln4PJ2y3HLo2cWZr8G0Vdh5yPj4FQxplK/z4ZgK5PjEIKC1K25aFjkMaADD4ZcSRoxa/zzlCyj1tWqDWAUoUVdWLGG7snSFOZ8QdGZgIYCH+r2YDFbpQR6F2OTMtdUXltTdtUmnnwxomR38nhCXesPzQeY1qyn90Fexuy8dAmUbjOXK1JZHcw+bj5OU73+5VRAUUw9jgxWYx4/XW",
    "password": "go"
}
```

### Remote Testing

**Endpoint**: `POST https://codernotes.wengindustries.com/decrypt-age.php`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
    "content": "YWdlLWVuY3J5cHRpb24ub3JnL3YxCi0+IHNjcnlwdCBNa2xvdFRuYnhzVGM0VGlzbGk1bU13IDE4CnlWbkkySER2MnF2c2JrM1lZQ0ZvQ2RKRmY1V0cvcEZOVSsvV1Yva2pobUkKLS0tIHJQV1Z6UTZ3cklOMHlzc2ZLbEJZWTIvckorWlRWcm5pOG45NjJIYnAvZXMKChd7KmJikOmEGZyTnzEluoT71er+74UWzAiyrwmxQLxMskNfU40r1ltuq9xGuG2Zre7NWHYh7xJjeIvQM+JJQreF1Sqcg13cXXbZ2oUPnl8sLqebxFBCQv1gn/pr9FYGZWa5ZpRat/RE/2LT2UqZD0kDH+ORmfn31uLzXucbGaIHJpp1CxrUu0yqAM+wJq3hIhYlEgAWZ4U5/fSC0I5lyAxaln4PJ2y3HLo2cWZr8G0Vdh5yPj4FQxplK/z4ZgK5PjEIKC1K25aFjkMaADD4ZcSRoxa/zzlCyj1tWqDWAUoUVdWLGG7snSFOZ8QdGZgIYCH+r2YDFbpQR6F2OTMtdUXltTdtUmnnwxomR38nhCXesPzQeY1qyn90Fexuy8dAmUbjOXK1JZHcw+bj5OU73+5VRAUUw9jgxWYx4/XW",
    "password": "go"
}
```

### GET Method (Server Migration Fallback)

**Note**: In case server migration is rough, the decrypt endpoint at `decrypt-age.php` can accept GET requests with URL query parameters for `content` and `password`. However, this is **not a viable secured method** and should only be used to get the system initially started up before investing more time to move it to POST.

**Endpoint**: `GET http://localhost:8888/weng/app/devbrain/decrypt-age.php?content=ENCRYPTED_CONTENT&password=PASSWORD`

**Example**:
```
GET http://localhost:8888/weng/app/devbrain/decrypt-age.php?content=YWdlLWVuY3J5cHRpb24ub3JnL3Yx...&password=go
```

**Security Warning**: This method exposes sensitive data in URL parameters and server logs. Use only for initial testing during migration, then switch to POST method for production use.

### Expected Response

**Success Response**:
```json
{
    "success": true,
    "encrypted_content": "base64_encoded_aes256cbc_content",
    "algorithm": "AES-256-CBC",
    "decryption_method": "nodejs_bypass"
}
```

**Error Response**:
```json
{
    "error": "Error message describing what went wrong",
    "debug_content_preview": "First few lines of the content for debugging"
}
```

### Postman Collection Setup

1. **Create New Collection**: "DevBrain AGE Decryption"
2. **Add Environment Variables**:
   - `local_url`: `http://localhost:8888/weng/app/devbrain/decrypt-age.php`
   - `remote_url`: `https://codernotes.wengindustries.com/decrypt-age.php`
   - `test_password`: `go`
   - `test_content`: `[paste the long base64 string]`

3. **Create Requests**:
   - **Local Test**: `POST {{local_url}}`
   - **Remote Test**: `POST {{remote_url}}`
   - **Test Endpoint**: `GET {{local_url}}?test=1`

## Testing Different Scenarios

### 1. Test Endpoint Verification

**Request**: `GET http://localhost:8888/weng/app/devbrain/decrypt-age.php?test=1`

**Expected Response**:
```json
{
    "status": "success",
    "message": "decrypt-age.php is working correctly",
    "timestamp": "2025-01-21 10:30:00",
    "php_version": "8.1.0",
    "error_reporting": 32767,
    "display_errors": "1"
}
```

### 2. Debug Mode Testing

**Request**: `POST http://localhost:8888/weng/app/devbrain/decrypt-age.php?debug=1`

**Response includes additional debug information**:
```json
{
    "success": true,
    "encrypted_content": "...",
    "algorithm": "AES-256-CBC",
    "decryption_method": "nodejs_bypass",
    "debug": {
        "content_length": 1234,
        "decryption_method": "nodejs_bypass",
        "timestamp": "2025-01-21 10:30:00"
    }
}
```

### 3. Invalid Content Testing

**Request with invalid content**:
```json
{
    "content": "invalid_content",
    "password": "go"
}
```

**Expected Error Response**:
```json
{
    "error": "Content is not AGE encrypted"
}
```

### 4. Wrong Password Testing

**Request with wrong password**:
```json
{
    "content": "YWdlLWVuY3J5cHRpb24ub3JnL3Yx...",
    "password": "wrong_password"
}
```

**Expected Error Response**:
```json
{
    "error": "AGE decryption failed: incorrect password or corrupted data"
}
```

## Files Added/Modified

### New Files
- `decrypt-age.php` - AGE decryption backend with Node.js fallback
- `decrypt-age-node.js` - Node.js AGE decryption script using age-encryption package
- `find-nodejs-path.php` - Helper script to find Node.js installation paths
- `assets/js/encryption.js` - Encryption management
- `assets/css/encryption.css` - Password dialog styling
- `Test Encrypted Note.md` - Example encrypted note
- `create-test-encrypted.php` - Test file generator

### Modified Files
- `index.php` - Added CSS and JS includes
- `assets/js/note-opener.js` - Added encryption detection and handling

## Troubleshooting

### Common Issues

#### 1. Node.js Not Found

**Error**: `Node.js not found. Please install Node.js or update the nodejs.appendSystemPath in config.json.`

**Solution**:
- Install Node.js v14 or later
- Update `nodejs.appendSystemPath` in config.json with correct paths
- For nvm users: `nvm use node && nvm which node`

#### 2. age-encryption Package Missing

**Error**: `age-encryption package not found. Please run: npm install age-encryption`

**Solution**:
```bash
npm install age-encryption
```

#### 3. Node.js Version Too Old

**Error**: `Node.js version v12.x.x is too old to support the age-encryption ES module. Please upgrade to Node.js v14 or later.`

**Solution**:
- Upgrade Node.js to v14 or later
- Use nvm: `nvm install 22 && nvm use 22`

#### 4. AGE Binary Issues

**Error**: `Age binary decryption failed - check password.`

**Solution**:
- Set `bypassAgeBinary: true` in config.json
- This will force Node.js usage instead of the problematic AGE binary

#### 5. Invalid AGE Format

**Error**: `Content is not AGE encrypted`

**Solution**:
- Ensure content starts with `YWdlLWVuY3J5cHRpb24ub3JnL3Yx` (base64 for "age-encryption.org/v1")
- Or has proper AGE headers: `-----BEGIN AGE ENCRYPTED FILE-----`

#### 6. Other Common Issues
1. **"Decryption failed"**: Check password is correct
2. **"Age binary not found"**: System will automatically fall back to Node.js script
3. **"Invalid AGE format"**: Verify content is properly formatted
4. **TTY issues on servers**: Node.js fallback automatically handles this
5. **"Cannot find module"**: Run `npm install` to install all dependencies

### Debug Mode

Enable debug mode by adding `?debug=1` to your request URL:

```
POST http://localhost:8888/weng/app/devbrain/decrypt-age.php?debug=1
```

This provides additional debugging information in the response.

### Log Files

Check your server error logs for detailed debugging information. The script logs extensive debug information with emojis:

- 🔧 - General debug information
- ⚠️ - Warning messages
- ✅ - Success messages
- ❌ - Error messages
- ⚡ - Bypass mode messages

## Configuration Examples

### Development Environment

```json
{
    "age": {
        "bypassAgeBinary": true
    },
    "nodejs": {
        "appendSystemPath": [
            "/Users/developer/.nvm/versions/node/v22.7.0/bin"
        ]
    }
}
```

### Production Environment

```json
{
    "age": {
        "bypassAgeBinary": true,
        "appendSystemPath": [
            "/usr/local/bin",
            "/opt/homebrew/bin"
        ]
    },
    "nodejs": {
        "appendSystemPath": [
            "/usr/local/bin",
            "/opt/homebrew/bin"
        ]
    }
}
```

### Mixed Environment (AGE Binary + Node.js Fallback)

```json
{
    "age": {
        "bypassAgeBinary": false,
        "appendSystemPath": [
            "/usr/local/bin",
            "/opt/homebrew/bin",
            "/usr/bin",
            "/bin"
        ]
    },
    "nodejs": {
        "appendSystemPath": [
            "/usr/local/bin",
            "/opt/homebrew/bin"
        ]
    }
}
```

## Security Considerations

- **Password Handling**: Passwords are not stored, only used for decryption
- **Memory Management**: Decrypted content cached only for current session
- **Transport Security**: Use HTTPS in production
- **AGE Compatibility**: Supports real AGE encryption when binary is available
- **Node.js Security**: Uses the official `age-encryption` package for cryptographic operations
- **Temporary Files**: All temporary files are cleaned up automatically
- **Error Messages**: Error messages don't expose sensitive information
- **Input Validation**: All input is validated before processing

## Performance Notes

- **Node.js Startup**: Initial Node.js execution has a small overhead
- **Memory Usage**: Node.js uses more memory than the AGE binary
- **Caching**: No caching is implemented - each request spawns a new Node.js process
- **Concurrent Requests**: Multiple requests can run simultaneously

## Best Practices

1. **Use Bypass Mode**: Set `bypassAgeBinary: true` for consistency
2. **Specify Node.js Paths**: Always specify Node.js paths in config.json
3. **Version Control**: Use .nvmrc to specify Node.js version
4. **Monitor Logs**: Check error logs for debugging information
5. **Test Both Modes**: Test with both AGE binary and Node.js modes

## Migration Guide

### From AGE Binary to Node.js Bypass

1. **Install Dependencies**:
   ```bash
   npm install age-encryption
   ```

2. **Update Configuration**:
   ```json
   {
       "age": {
           "bypassAgeBinary": true
       }
   }
   ```

3. **Test the Change**:
   ```bash
   # Test with Postman or curl
   curl -X POST http://localhost:8888/weng/app/devbrain/decrypt-age.php \
        -H "Content-Type: application/json" \
        -d '{"content": "YWdlLWVuY3J5cHRpb24ub3JnL3Yx...", "password": "go"}'
   ```

4. **Verify Response**: Check that `decryption_method` is `nodejs_bypass`

## Finding Your Node.js Path

Use the included helper script to find the correct Node.js path for your system:

```bash
php find-nodejs-path.php
```

This script will:
- Check common Node.js installation locations
- Detect nvm installations and versions
- Provide a ready-to-use configuration for `config.json`

## Future Enhancements

- Support for multiple encryption formats
- Key-based encryption (not just passwords)
- Encrypted file attachments
- Bulk encryption/decryption tools

---

**Note**: This implementation provides a secure foundation for encrypted notes while maintaining DevBrain's user-friendly interface. The triple-backend approach (AGE binary + Node.js fallback + PHP fallback) ensures compatibility across all environments, including nginx servers with PHP-FPM where TTY issues prevent direct age binary usage.
