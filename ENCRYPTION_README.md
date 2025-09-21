# DevBrain AGE Encryption Support

DevBrain now supports AGE-encrypted content with password protection, providing secure note storage while maintaining the familiar DevBrain interface.

## Features

- **AGE Format Detection**: Automatically detects AGE-encrypted content in markdown files
- **Password-Protected UI**: Clean, secure password entry modal
- **Seamless Integration**: Encrypted content renders exactly like regular notes after decryption
- **Full Feature Support**: Decrypted content supports all DevBrain features (mindmaps, link previews, TOC, etc.)
- **Robust Fallback Support**: Works with or without the `age` binary installed, with automatic Node.js fallback for server environments

## Usage

### Creating Encrypted Content

1. **Using AGE Binary** (recommended for real AGE encryption):
   ```bash
   echo "Secret content" | age -p > encrypted.txt
   ```

2. **For Testing** (using our test format):
   ```bash
   php create-test-encrypted.php
   ```

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
- `decrypt-age.php`: Handles AGE decryption and re-encryption for JavaScript
- `decrypt-age-node.js`: Node.js fallback using age-encryption npm package
- **Primary**: Tries `age` binary first (for local development)
- **Fallback**: Automatically uses Node.js script when binary fails or isn't available (for nginx/PHP-FPM servers)
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

## Testing

### Test Files Included
- **Test Encrypted Note.md**: Sample encrypted note (password: `test123`)
- **Encryption Test (Works in Obsidian, not implemented in Devbrain yet).md**: Real AGE-encrypted file

### Manual Testing
1. Open DevBrain in browser
2. Navigate to "Test Encrypted Note"
3. Click "Decrypt" button
4. Enter password: `test123`
5. Verify content decrypts and renders properly

## Node.js Fallback

### Why Node.js Fallback?
- **TTY Issues**: The `age` binary requires a TTY for password input, which isn't available in nginx/PHP-FPM environments
- **Server Compatibility**: Many production servers don't have the `age` binary installed
- **Reliability**: Node.js solution works consistently across all environments

### How It Works
1. **Primary**: System tries the `age` binary first (for local development)
2. **Detection**: If binary fails due to TTY issues or isn't available, system detects this
3. **Fallback**: Automatically calls `decrypt-age-node.js` using the `age-encryption` npm package
4. **Seamless**: Frontend code doesn't need any changes - it's completely transparent

### Requirements
- Node.js installed on the server (already required for your build system)
- `age-encryption` npm package (already in your `package.json`)

### Configuration
The Node.js fallback can be configured in `config.json`:

```json
{
  "nodejs": {
    "appendSystemPath": [
      "/path/to/node/bin",
      "/usr/local/bin",
      "/opt/homebrew/bin",
      "/usr/bin",
      "/bin"
    ]
  }
}
```

**Note**: The system will automatically find Node.js using:
1. `which node` command (if available in PATH)
2. Paths specified in `appendSystemPath` array
3. No need to specify `binaryPath` - it's automatically detected

- **`appendSystemPath`**: Additional paths to search for Node.js binary

### Finding Your Node.js Path
Use the included helper script to find the correct Node.js path for your system:

```bash
php find-nodejs-path.php
```

This script will:
- Check common Node.js installation locations
- Detect nvm installations and versions
- Provide a ready-to-use configuration for `config.json`

## Security Considerations

- **Password Handling**: Passwords are not stored, only used for decryption
- **Memory Management**: Decrypted content cached only for current session
- **Transport Security**: Use HTTPS in production
- **AGE Compatibility**: Supports real AGE encryption when binary is available
- **Node.js Security**: Uses the official `age-encryption` package for cryptographic operations

## Troubleshooting

### Common Issues
1. **"Decryption failed"**: Check password is correct
2. **"Age binary not found"**: System will automatically fall back to Node.js script
3. **"Invalid AGE format"**: Verify content is properly formatted
4. **TTY issues on servers**: Node.js fallback automatically handles this
5. **"Node.js not found"**: Update `nodejs.binaryPath` in `config.json` or install Node.js
6. **"age-encryption package not found"**: Run `npm install age-encryption`
7. **"Cannot find module"**: Run `npm install` to install all dependencies

### Debug Mode
Enable debug logging in browser console to see encryption flow details.

## Future Enhancements

- Support for multiple encryption formats
- Key-based encryption (not just passwords)
- Encrypted file attachments
- Bulk encryption/decryption tools

---

**Note**: This implementation provides a secure foundation for encrypted notes while maintaining DevBrain's user-friendly interface. The triple-backend approach (AGE binary + Node.js fallback + PHP fallback) ensures compatibility across all environments, including nginx servers with PHP-FPM where TTY issues prevent direct age binary usage.
