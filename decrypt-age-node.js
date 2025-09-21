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

/**
 * Decrypt AGE armored content using the age-encryption npm package
 * @param {string} armored - The ASCII-armored age payload
 * @param {string} password - The passphrase
 * @param {function} addDebug - Debug logging function
 * @returns {Promise<string>} - The decrypted plaintext
 */
async function decryptAgeArmored(armored, password, addDebug = () => {}) {
    try {
        addDebug('Starting AGE decryption');
        addDebug(`Armored content length: ${armored.length}`);
        addDebug(`Armored content preview: ${armored.substring(0, 200)}`);
        
        // Import the age-encryption module with Node.js version compatibility
        let age;
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
        
        addDebug(`Node.js version: ${nodeVersion}`);
        addDebug(`Node.js platform: ${process.platform}`);
        addDebug(`Node.js major version: ${majorVersion}`);
        
        if (majorVersion >= 14) {
            // Use dynamic import for Node.js v14+
            try {
                addDebug('Using dynamic import for Node.js v14+');
                age = await import('age-encryption');
                addDebug('age-encryption module loaded successfully via dynamic import');
            } catch (importError) {
                addDebug(`Dynamic import failed: ${importError.message}`);
                throw new Error(`Failed to load age-encryption module via dynamic import: ${importError.message}`);
            }
        } else {
            // For Node.js v12 and below, we need to use a different approach
            addDebug('Node.js version is too old for ES modules. Attempting alternative approach...');
            
            // Try to use child_process to run a separate script with newer Node.js
            const { spawn } = require('child_process');
            const path = require('path');
            
            // Create a temporary script that can handle the ES module
            const tempScript = `
const { spawn } = require('child_process');
const path = require('path');

async function runDecryption() {
    try {
        const age = await import('age-encryption');
        const decrypter = new age.Decrypter();
        decrypter.addPassphrase(process.argv[2]);
        
        const armored = process.argv[3];
        const binaryData = age.armor.decode(armored);
        const decrypted = await decrypter.decrypt(binaryData, "text");
        
        console.log(JSON.stringify({ success: true, content: decrypted }));
    } catch (error) {
        console.log(JSON.stringify({ success: false, error: error.message }));
    }
}

runDecryption();
`;
            
            // For now, throw a helpful error message
            throw new Error(`Node.js version ${nodeVersion} is too old to support the age-encryption ES module. Please upgrade to Node.js v14 or later, or use the age binary instead. Current version: ${nodeVersion}, Required: v14+`);
        }
        
        // Create a decrypter and add the passphrase
        const decrypter = new age.Decrypter();
        decrypter.addPassphrase(password);
        addDebug('Decrypter created and passphrase added');
        
        // Try to decode the armored content to get the binary data
        let binaryData;
        try {
            addDebug('Attempting to decode armored content');
            binaryData = age.armor.decode(armored);
            addDebug(`Armored content decoded successfully, binary data length: ${binaryData.length}`);
        } catch (armorError) {
            addDebug(`Armor decode failed: ${armorError.message}`);
            addDebug('Trying alternative base64 decode approach');
            
            // Try alternative approach - decode base64 directly
            const payloadMatch = armored.match(/-----BEGIN AGE ENCRYPTED FILE-----\s*([\s\S]*?)\s*-----END AGE ENCRYPTED FILE-----/);
            if (payloadMatch) {
                const base64Payload = payloadMatch[1].replace(/\s+/g, '');
                addDebug(`Extracted base64 payload length: ${base64Payload.length}`);
                addDebug(`Base64 payload preview: ${base64Payload.substring(0, 100)}`);
                
                // Validate base64 content
                if (!/^[A-Za-z0-9+\/]*={0,2}$/.test(base64Payload)) {
                    throw new Error('Invalid base64 characters found in payload');
                }
                
                // Convert base64 to binary
                const binaryString = atob(base64Payload);
                binaryData = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    binaryData[i] = binaryString.charCodeAt(i);
                }
                addDebug(`Base64 decoded to binary, length: ${binaryData.length}`);
            } else {
                throw new Error('Could not extract payload from armored content');
            }
        }
        
        // Decrypt the binary data
        addDebug('Attempting to decrypt binary data');
        addDebug(`Binary data length: ${binaryData.length}`);
        addDebug(`Binary data preview (hex): ${Array.from(binaryData.slice(0, 50)).map(b => b.toString(16).padStart(2, '0')).join('')}`);
        
        // Check if the binary data looks complete
        const textData = new TextDecoder().decode(binaryData);
        addDebug(`Binary data as text: ${textData.substring(0, 200)}`);
        
        if (!textData.includes('---')) {
            addDebug('WARNING - AGE content appears to be truncated (missing final stanza marker)');
        }
        
        const decrypted = await decrypter.decrypt(binaryData, "text");
        addDebug(`Decryption successful, decrypted length: ${decrypted.length}`);
        
        return decrypted;
    } catch (error) {
        addDebug(`Decryption error details: ${error}`);
        addDebug(`Error stack: ${error.stack}`);
        
        // Enhanced error message with more context
        let errorMsg = `AGE decryption failed: ${error.message}`;
        
        if (error.message.includes('invalid line length')) {
            errorMsg += ' (This usually means the base64 content has line breaks or invalid characters)';
        } else if (error.message.includes('armor')) {
            errorMsg += ' (This usually means the AGE format is invalid or corrupted)';
        } else if (error.message.includes('passphrase')) {
            errorMsg += ' (This usually means the password is incorrect)';
        } else if (error.message.includes('Unexpected token')) {
            errorMsg += ' (This usually means there are invalid characters in the base64 content)';
        } else if (error.message.includes('invalid stanza')) {
            errorMsg += ' (This usually means the AGE content is truncated or incomplete - check if the full AGE file was transmitted)';
        }
        
        throw new Error(errorMsg);
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
 * @param {function} addDebug - Debug logging function
 * @returns {Promise<string>} - The decrypted content
 */
async function decryptContent(content, password, addDebug = () => {}) {
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
        // Content is unarmored (payload only), clean it up first
        // Remove any line breaks and whitespace from the base64 content
        const cleanPayload = ageContent.replace(/\s+/g, '');
        
        // Add headers
        armoredContent = `-----BEGIN AGE ENCRYPTED FILE-----\n${cleanPayload}\n-----END AGE ENCRYPTED FILE-----`;
    } else {
        // Content already has headers, but clean up the payload inside
        const payloadRegex = /-----BEGIN AGE ENCRYPTED FILE-----\s*([\s\S]*?)\s*-----END AGE ENCRYPTED FILE-----/;
        const payloadMatch = armoredContent.match(payloadRegex);
        
        if (payloadMatch) {
            // Clean the payload (remove line breaks and whitespace)
            const cleanPayload = payloadMatch[1].replace(/\s+/g, '');
            armoredContent = `-----BEGIN AGE ENCRYPTED FILE-----\n${cleanPayload}\n-----END AGE ENCRYPTED FILE-----`;
        }
    }
    
    // Clean up any extra whitespace and ensure proper line endings
    armoredContent = armoredContent.trim();

    // Decrypt using the age-encryption package
    const decryptedContent = await decryptAgeArmored(armoredContent, password, addDebug);
    
    return decryptedContent;
}

/**
 * Main execution
 */
async function main() {
    const debugInfo = [];
    
    function addDebug(message) {
        debugInfo.push(message);
    }
    
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
            
            // Debug: Log the raw input (first 200 chars)
            addDebug(`Raw input length: ${input.length}`);
            addDebug(`Raw input preview: ${input.substring(0, 200)}`);
            addDebug(`Raw input ending: ${input.substring(input.length - 200)}`);
            
            try {
                const data = JSON.parse(input);
                content = data.content;
                password = data.password;
                
                // Debug: Log content info
                addDebug(`Content length: ${content ? content.length : 'null'}`);
                addDebug(`Content preview: ${content ? content.substring(0, 100) : 'null'}`);
                addDebug(`Password length: ${password ? password.length : 'null'}`);
            } catch (parseError) {
                addDebug(`JSON parse error: ${parseError.message}`);
                addDebug(`Input that failed to parse: ${input.substring(0, 500)}`);
                throw new Error(`Invalid JSON input: ${parseError.message}`);
            }
        }

        // Decrypt the content
        const decryptedContent = await decryptContent(content, password, addDebug);
        
        // Output the result as JSON with debug info
        const result = {
            success: true,
            content: decryptedContent,
            debug: debugInfo
        };
        
        console.log(JSON.stringify(result));
        
    } catch (error) {
        const result = {
            success: false,
            error: error.message,
            debug: debugInfo
        };
        
        console.log(JSON.stringify(result));
        // Don't exit with error code - let PHP handle the JSON response
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
