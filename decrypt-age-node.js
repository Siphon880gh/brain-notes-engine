#!/usr/bin/env node

/**
 * Node.js AGE Decryption Script for DevBrain
 * 
 * This script handles AGE encrypted content using the age-encryption npm package
 * instead of relying on the system age binary. This solves the TTY requirement
 * issue on nginx servers with PHP-FPM.
 * 
 * Usage:
 *   node decrypt-age-node.js <age_content> <password>
 *   echo '{"content": "...", "password": "..."}' | node decrypt-age-node.js
 */

// Note: age-encryption is an ES module, so we'll use dynamic import

/**
 * Decrypt AGE armored content using the age-encryption npm package
 * @param {string} armored - The ASCII-armored age payload
 * @param {string} password - The passphrase
 * @returns {Promise<string>} - The decrypted plaintext
 */
async function decryptAgeArmored(armored, password) {
    try {
        // Dynamic import of the ES module
        const age = await import('age-encryption');
        
        // Create a decrypter and add the passphrase
        const decrypter = new age.Decrypter();
        decrypter.addPassphrase(password);
        
        // Decode the armored content to get the binary data
        const binaryData = age.armor.decode(armored);
        
        // Decrypt the binary data
        const decrypted = await decrypter.decrypt(binaryData, "text");
        
        return decrypted;
    } catch (error) {
        throw new Error(`AGE decryption failed: ${error.message}`);
    }
}

/**
 * Check if content is AGE encrypted
 * @param {string} content - The content to check
 * @returns {boolean} - True if content appears to be AGE encrypted
 */
function isAgeEncrypted(content) {
    // Check for armored AGE format with headers
    if (content.includes('-----BEGIN AGE ENCRYPTED FILE-----') &&
        content.includes('-----END AGE ENCRYPTED FILE-----')) {
        return true;
    }
    
    // Check for unarmored AGE format (base64 encoded, starts with age-encryption.org/v1)
    if (/^[A-Za-z0-9+\/=\s]+$/.test(content) && 
        content.includes('YWdlLWVuY3J5cHRpb24ub3JnL3Yx')) {
        return true;
    }
    
    return false;
}

/**
 * Extract AGE encrypted block from markdown content
 * @param {string} content - The markdown content
 * @returns {string|null} - The AGE encrypted block or null if not found
 */
function extractAgeBlock(content) {
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
 * Main decryption function
 * @param {string} content - The AGE encrypted content
 * @param {string} password - The password
 * @returns {Promise<string>} - The decrypted content
 */
async function decryptContent(content, password) {
    if (!content || !password) {
        throw new Error('Content and password are required');
    }

    // Check if content is AGE encrypted
    if (!isAgeEncrypted(content)) {
        throw new Error('Content is not AGE encrypted');
    }

    // Extract AGE block if it's wrapped in markdown
    let ageContent = content;
    if (content.includes('```age')) {
        ageContent = extractAgeBlock(content);
        if (!ageContent) {
            throw new Error('No AGE encrypted block found in markdown');
        }
    }

    // Ensure we have the full armored format
    let armoredContent = ageContent;
    if (!ageContent.includes('-----BEGIN AGE ENCRYPTED FILE-----')) {
        // Content is unarmored (payload only), add headers
        armoredContent = `-----BEGIN AGE ENCRYPTED FILE-----\n${ageContent}\n-----END AGE ENCRYPTED FILE-----`;
    }
    
    // Clean up any extra whitespace and ensure proper line endings
    armoredContent = armoredContent.trim();

    // Decrypt using the age-encryption package
    const decryptedContent = await decryptAgeArmored(armoredContent, password);
    
    return decryptedContent;
}

/**
 * Main execution
 */
async function main() {
    try {
        let content, password;

        // Check if we're getting input from stdin (JSON format)
        if (process.stdin.isTTY) {
            // Command line arguments
            if (process.argv.length < 4) {
                console.error('Usage: node decrypt-age-node.js <age_content> <password>');
                console.error('   or: echo \'{"content": "...", "password": "..."}\' | node decrypt-age-node.js');
                process.exit(1);
            }
            content = process.argv[2];
            password = process.argv[3];
        } else {
            // Read from stdin (JSON format)
            let input = '';
            process.stdin.setEncoding('utf8');
            
            for await (const chunk of process.stdin) {
                input += chunk;
            }
            
            const data = JSON.parse(input);
            content = data.content;
            password = data.password;
        }

        // Decrypt the content
        const decryptedContent = await decryptContent(content, password);
        
        // Output the decrypted content
        console.log(decryptedContent);
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the main function if this script is executed directly
if (require.main === module) {
    main();
}

// Export functions for use as a module
module.exports = {
    decryptAgeArmored,
    decryptContent,
    isAgeEncrypted,
    extractAgeBlock
};
