# AGE Binary Bypass Configuration

## Overview

The `bypassAgeBinary` configuration option allows you to skip the AGE binary entirely and use Node.js directly for AGE decryption. This is useful when:

- The AGE binary is not available or not working properly
- You want to force Node.js usage for consistency
- You're having issues with the AGE binary on your system

## Configuration

In `config.json`, set the `bypassAgeBinary` option:

```json
{
    "age": {
        "bypassAgeBinary": true
    }
}
```

## How It Works

When `bypassAgeBinary` is set to `true`:

1. The system will skip checking for the AGE binary
2. It will go directly to Node.js decryption using the `age-encryption` package
3. The decryption method will be logged as `nodejs_bypass` with a ⚡ emoji
4. No fallback to AGE binary will be attempted

## Decryption Methods

The system supports these decryption methods:

- `age_binary` 🔧 - Uses the AGE binary (default)
- `nodejs_fallback` ⚠️ - Node.js fallback when AGE binary fails
- `nodejs_primary` 🔧 - Node.js when AGE binary is not found
- `nodejs_bypass` ⚡ - Node.js bypass (when `bypassAgeBinary: true`)

## Requirements

When using bypass mode, ensure:

1. Node.js is installed and available
2. The `age-encryption` package is installed: `npm install age-encryption`
3. The `decrypt-age-node.js` script exists in the project root

## Testing

You can test the bypass mode by:

1. Setting `bypassAgeBinary: true` in config.json
2. Trying to decrypt an AGE-encrypted note
3. Checking the browser console for the ⚡ "Node.js (Bypass)" message

## Troubleshooting

If bypass mode fails:

1. Check that Node.js is in your PATH
2. Verify `npm install age-encryption` was run
3. Check the error logs for specific Node.js errors
4. Ensure the `decrypt-age-node.js` script is present and executable
