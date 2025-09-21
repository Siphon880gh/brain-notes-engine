# DevBrain AGE Encryption Support

DevBrain now supports AGE-encrypted content with password protection, providing secure note storage while maintaining the familiar DevBrain interface.

## Features

- **AGE Format Detection**: Automatically detects AGE-encrypted content in markdown files
- **Password-Protected UI**: Clean, secure password entry modal
- **Seamless Integration**: Encrypted content renders exactly like regular notes after decryption
- **Full Feature Support**: Decrypted content supports all DevBrain features (mindmaps, link previews, TOC, etc.)
- **Fallback Support**: Works with or without the `age` binary installed

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

### Backend (PHP)
- `decrypt-age.php`: Handles AGE decryption and re-encryption for JavaScript
- Tries `age` binary first, falls back to PHP-based decryption
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
- `decrypt-age.php` - AGE decryption backend
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

## Security Considerations

- **Password Handling**: Passwords are not stored, only used for decryption
- **Memory Management**: Decrypted content cached only for current session
- **Transport Security**: Use HTTPS in production
- **AGE Compatibility**: Supports real AGE encryption when binary is available

## Troubleshooting

### Common Issues
1. **"Decryption failed"**: Check password is correct
2. **"Age binary not found"**: Install `age` binary or use test format
3. **"Invalid AGE format"**: Verify content is properly formatted

### Debug Mode
Enable debug logging in browser console to see encryption flow details.

## Future Enhancements

- Support for multiple encryption formats
- Key-based encryption (not just passwords)
- Encrypted file attachments
- Bulk encryption/decryption tools

---

**Note**: This implementation provides a secure foundation for encrypted notes while maintaining DevBrain's user-friendly interface. The dual-backend approach (AGE binary + PHP fallback) ensures compatibility across different environments.
