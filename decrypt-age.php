<?php
/**
 * AGE Decryption and Re-encryption Handler
 * 
 * This script handles AGE encrypted content by:
 * 1. Detecting AGE encryption format
 * 2. Decrypting with AGE using provided password
 * 3. Re-encrypting with AES-256-GCM for JavaScript compatibility
 * 4. Returning encrypted content that can be decrypted client-side
 */

// Only set headers if running in web context
if (php_sapi_name() !== 'cli') {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    // Handle OPTIONS request for CORS
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit(0);
    }

    // Only allow POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode([
            'error' => 'Method not allowed. Received: ' . $_SERVER['REQUEST_METHOD'] . '. This endpoint only accepts POST requests.',
            'debug_info' => 'Make sure the frontend is sending a POST request with JSON body containing content and password'
        ]);
        exit;
    }
}

// Get input (JSON for web, direct call for CLI)
if (php_sapi_name() === 'cli') {
    // CLI mode - functions can be called directly
    $ageContent = null;
    $password = null;
} else {
    // Web mode - try multiple input methods
    $ageContent = null;
    $password = null;
    
    // Method 1: Try JSON input from POST body
    $jsonInput = json_decode(file_get_contents('php://input'), true);
    if ($jsonInput && isset($jsonInput['content']) && isset($jsonInput['password'])) {
        $ageContent = $jsonInput['content'];
        $password = $jsonInput['password'];
    }
    
    // Method 2: Try GET parameters
    if ((!$ageContent || !$password) && isset($_GET['content']) && isset($_GET['password'])) {
        $ageContent = $_GET['content'];
        $password = $_GET['password'];
    }
    
    // Method 3: Try POST parameters
    if ((!$ageContent || !$password) && isset($_POST['content']) && isset($_POST['password'])) {
        $ageContent = $_POST['content'];
        $password = $_POST['password'];
    }
    
    // Debug info about what we received
    $debugInfo = [
        'method' => $_SERVER['REQUEST_METHOD'],
        'has_json_content' => $jsonInput ? 'yes' : 'no',
        'has_get_content' => isset($_GET['content']) ? 'yes' : 'no',
        'has_post_content' => isset($_POST['content']) ? 'yes' : 'no',
        'content_length' => $ageContent ? strlen($ageContent) : 0,
        'has_password' => $password ? 'yes' : 'no'
    ];
    
    if (!$ageContent || !$password) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Missing content or password',
            'debug_info' => json_encode($debugInfo, JSON_PRETTY_PRINT)
        ]);
        exit;
    }
}

/**
 * Load configuration from config.json
 */
function loadConfig() {
    $configFile = __DIR__ . '/config.json';
    if (file_exists($configFile)) {
        $configContent = file_get_contents($configFile);
        return json_decode($configContent, true) ?: [];
    }
    return [];
}

/**
 * Check if content is AGE encrypted (either full format or payload only)
 */
function isAgeEncrypted($content) {
    // Check for armored AGE format with headers
    if (strpos($content, '-----BEGIN AGE ENCRYPTED FILE-----') !== false &&
        strpos($content, '-----END AGE ENCRYPTED FILE-----') !== false) {
        return true;
    }
    
    // Check for unarmored AGE format (base64 encoded, starts with age-encryption.org/v1)
    // AGE encrypted content typically starts with "YWdlLWVuY3J5cHRpb24ub3JnL3Yx" (base64 for "age-encryption.org/v1")
    if (preg_match('/^[A-Za-z0-9+\/=\s]+$/', $content) && 
        strpos($content, 'YWdlLWVuY3J5cHRpb24ub3JnL3Yx') === 0) {
        return true;
    }
    
    return false;
}

/**
 * Decrypt AGE content - tries multiple methods
 */
function decryptAge($ageContent, $password) {
    // Load config for AGE binary paths
    $config = loadConfig();
    
    // Check if age binary is available using configured paths
    $ageAvailable = false;
    $ageBinaryPath = null;
    
    // First try system which command (most reliable)
    $whichResult = shell_exec('which age 2>/dev/null');
    if (!empty($whichResult)) {
        $ageAvailable = true;
        $ageBinaryPath = trim($whichResult);
    } else {
        // Try configured system paths as fallback
        if (isset($config['age']['appendSystemPath'])) {
            foreach ($config['age']['appendSystemPath'] as $path) {
                $testPath = $path . '/age';
                if (file_exists($testPath)) {
                    $ageAvailable = true;
                    $ageBinaryPath = $testPath;
                    break;
                }
            }
        }
    }
    
    // Debug info
    $debugInfo = [
        'age_binary_available' => $ageAvailable ? 'yes' : 'no',
        'age_binary_path' => $ageBinaryPath ?: 'not found',
        'content_length' => strlen($ageContent),
        'content_preview' => substr($ageContent, 0, 50) . '...',
        'password_length' => strlen($password)
    ];
    
    if ($ageAvailable) {
        try {
            $result = decryptAgeWithBinary($ageContent, $password, $ageBinaryPath);
            // Log successful age binary usage
            error_log("🔧 AGE Decryption: Using age binary at " . $ageBinaryPath);
            return ['content' => $result, 'method' => 'age_binary'];
        } catch (Exception $e) {
            // Add debug info to exception
            $debugInfo['age_binary_error'] = $e->getMessage();
            error_log("⚠️ AGE Decryption: Age binary failed, falling back to Node.js. Error: " . $e->getMessage());
            
            // Try Node.js fallback if binary fails
            try {
                $result = decryptAgeWithNodeJS($ageContent, $password);
                $debugInfo['fallback_method'] = 'nodejs_success';
                error_log("✅ AGE Decryption: Node.js fallback successful");
                return ['content' => $result, 'method' => 'nodejs_fallback'];
            } catch (Exception $nodeError) {
                $debugInfo['nodejs_error'] = $nodeError->getMessage();
                error_log("❌ AGE Decryption: Both age binary and Node.js failed");
                throw new Exception('AGE binary decryption failed: ' . $e->getMessage() . '. Node.js fallback also failed: ' . $nodeError->getMessage() . '. Debug: ' . json_encode($debugInfo));
            }
        }
    } else {
        // AGE binary not available - try Node.js fallback
        error_log("🔧 AGE Decryption: Age binary not found, using Node.js fallback");
        try {
            $result = decryptAgeWithNodeJS($ageContent, $password);
            $debugInfo['fallback_method'] = 'nodejs_success';
            error_log("✅ AGE Decryption: Node.js fallback successful");
            return ['content' => $result, 'method' => 'nodejs_primary'];
        } catch (Exception $nodeError) {
            $debugInfo['nodejs_error'] = $nodeError->getMessage();
            error_log("❌ AGE Decryption: Node.js fallback failed");
            throw new Exception('AGE binary not found and Node.js fallback failed: ' . $nodeError->getMessage() . '. Please install AGE encryption tool: ' . 
                'Ubuntu/Debian: sudo apt install age | ' .
                'macOS: brew install age | ' .
                'Windows: Download from https://github.com/FiloSottile/age/releases | ' .
                'Or visit: https://age-encryption.org/ for installation instructions. ' .
                'Debug: ' . json_encode($debugInfo));
        }
    }
}

/**
 * Decrypt AGE content using age binary
 */
function decryptAgeWithBinary($ageContent, $password, $ageBinaryPath = 'age') {
    $tempDir = sys_get_temp_dir();
    $ageFile = tempnam($tempDir, 'age_encrypted_');
    $outputFile = tempnam($tempDir, 'age_decrypted_');
    
    try {
        // Check if content is armored or unarmored
        $fullAgeContent = $ageContent;
        if (strpos($ageContent, '-----BEGIN AGE ENCRYPTED FILE-----') === false) {
            // Content is unarmored (starts with age-encryption.org/v1)
            // Decode from base64 to get raw binary data
            $fullAgeContent = base64_decode($ageContent);
            if ($fullAgeContent === false) {
                throw new Exception('Failed to decode base64 content');
            }
        }
        
        // Write AGE content to temporary file (as binary data)
        file_put_contents($ageFile, $fullAgeContent);
        
        // Debug: Log file content
        error_log("AGE File path: " . $ageFile);
        error_log("AGE File content length: " . strlen($fullAgeContent));
        error_log("AGE File content preview: " . substr($fullAgeContent, 0, 200));
        
        // Set up PATH environment for MAMP compatibility
        $currentPath = getenv('PATH') ?: '/usr/bin:/bin';
        $pathEnv = "PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:{$currentPath}";
        
        // Test if AGE binary works at all
        $testCommand = "export {$pathEnv} && " . escapeshellarg($ageBinaryPath) . " --version 2>&1";
        $testOutput = [];
        $testReturn = 0;
        exec($testCommand, $testOutput, $testReturn);
        
        // Debug: Log test results
        error_log("AGE Test Command: " . $testCommand);
        error_log("AGE Test Return code: " . $testReturn);
        error_log("AGE Test Output: " . implode("\n", $testOutput));
        
        if ($testReturn !== 0) {
            throw new Exception('AGE binary test failed. Command: ' . $testCommand . ' | Output: ' . implode("\n", $testOutput) . ' | Debug info: Test return=' . $testReturn . ', Output count=' . count($testOutput));
        }
        
        // Try multiple methods to handle password input
        $success = false;
        
        // Method 1: Try with printf and pipe (set PATH for MAMP compatibility)
        $command = "export {$pathEnv} && printf '%s\\n' " . escapeshellarg($password) . " | " . escapeshellarg($ageBinaryPath) . " -d " . escapeshellarg($ageFile) . " > " . escapeshellarg($outputFile) . " 2>&1";
        $output = [];
        $returnVar = 0;
        exec($command, $output, $returnVar);
        
        // Debug: Log the command and results
        error_log("AGE Command: " . $command);
        error_log("AGE Return code: " . $returnVar);
        error_log("AGE Output: " . implode("\n", $output));
        error_log("Output file exists: " . (file_exists($outputFile) ? 'yes' : 'no'));
        error_log("Output file size: " . (file_exists($outputFile) ? filesize($outputFile) : 'N/A'));
        
        if ($returnVar === 0 && file_exists($outputFile) && filesize($outputFile) > 0) {
            $success = true;
        }
        
        // Check if the output looks like an error message (expect script output)
        if ($success && file_exists($outputFile)) {
            $outputContent = file_get_contents($outputFile);
            // Only treat as error if it contains expect script artifacts AND looks like error output
            if ((strpos($outputContent, 'while executing') !== false || 
                strpos($outputContent, 'spawn') !== false ||
                strpos($outputContent, 'expect') !== false) &&
                (strpos($outputContent, 'file "/') !== false || 
                 strpos($outputContent, 'line') !== false)) {
                $success = false; // This is expect script error output, not decrypted content
            }
        }
        
        // Method 2: If printf method failed, try with echo
        if (!$success) {
            $command = "export {$pathEnv} && echo " . escapeshellarg($password) . " | " . escapeshellarg($ageBinaryPath) . " -d " . escapeshellarg($ageFile) . " > " . escapeshellarg($outputFile) . " 2>&1";
            exec($command, $output, $returnVar);
            
            if ($returnVar === 0 && file_exists($outputFile) && filesize($outputFile) > 0) {
                $success = true;
            }
            
            // Check if the output looks like an error message (expect script output)
            if ($success && file_exists($outputFile)) {
                $outputContent = file_get_contents($outputFile);
                if ((strpos($outputContent, 'while executing') !== false || 
                    strpos($outputContent, 'spawn') !== false ||
                    strpos($outputContent, 'expect') !== false) &&
                    (strpos($outputContent, 'file "/') !== false || 
                     strpos($outputContent, 'line') !== false)) {
                    $success = false; // This is expect script error output, not decrypted content
                }
            }
        }
        
        // Method 3: Try expect script as fallback (if available)
        if (!$success && !empty(shell_exec('which expect 2>/dev/null'))) {
            $currentPath = getenv('PATH') ?: '/usr/bin:/bin';
            $expectScript = "#!/usr/bin/expect -f
set env(PATH) \"/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:{$currentPath}\"
spawn {$ageBinaryPath} -d \"$ageFile\"
expect \"Enter passphrase:\"
send \"$password\\r\"
expect eof
";
            
            $expectFile = tempnam($tempDir, 'age_expect_');
            file_put_contents($expectFile, $expectScript);
            chmod($expectFile, 0755);
            
            $command = $expectFile . " > " . escapeshellarg($outputFile) . " 2>&1";
            exec($command, $output, $returnVar);
            
            if ($returnVar === 0 && file_exists($outputFile) && filesize($outputFile) > 0) {
                $success = true;
            }
            
            // Check if the output looks like an error message (expect script output)
            if ($success && file_exists($outputFile)) {
                $outputContent = file_get_contents($outputFile);
                if ((strpos($outputContent, 'while executing') !== false || 
                    strpos($outputContent, 'spawn') !== false ||
                    strpos($outputContent, 'expect') !== false) &&
                    (strpos($outputContent, 'file "/') !== false || 
                     strpos($outputContent, 'line') !== false)) {
                    $success = false; // This is expect script error output, not decrypted content
                }
            }
            
            if (file_exists($expectFile)) unlink($expectFile);
        }
        
        if (!$success) {
            $debugOutput = implode("\n", $output);
            $fileContent = file_exists($ageFile) ? file_get_contents($ageFile) : 'File not found';
            throw new Exception('Age binary decryption failed - check password. Command: ' . $command . ' | Return code: ' . $returnVar . ' | Output: ' . $debugOutput . ' | File content preview: ' . substr($fileContent, 0, 100));
        }
        
        $decryptedContent = file_get_contents($outputFile);
        
        // Check if the content looks like an error message instead of decrypted content
        // But only if it doesn't contain any actual content markers
        if ((strpos($decryptedContent, 'spawn') !== false || 
            strpos($decryptedContent, 'expect') !== false ||
            strpos($decryptedContent, 'send:') !== false ||
            strpos($decryptedContent, 'while executing') !== false) &&
            !preg_match('/^#|^\d+|^[a-zA-Z]|^- /m', $decryptedContent)) {
            throw new Exception('AGE decryption failed - the output appears to be an error message, not decrypted content. Output: ' . substr($decryptedContent, 0, 200));
        }
        
        // Check if we have mixed content (prompt + decrypted content)
        if (strpos($decryptedContent, 'Enter passphrase:') !== false) {
            // Extract content after the prompt
            $parts = explode('Enter passphrase:', $decryptedContent);
            if (count($parts) > 1) {
                $decryptedContent = $parts[1];
            }
        }
        
        // Also handle the case where we have spawn output mixed with content
        if (strpos($decryptedContent, 'spawn') !== false) {
            // Look for content that starts after the spawn line
            $lines = explode("\n", $decryptedContent);
            $contentStart = -1;
            
            for ($i = 0; $i < count($lines); $i++) {
                if (strpos($lines[$i], 'spawn') !== false) {
                    // Look for the first line that looks like actual content after spawn
                    for ($j = $i + 1; $j < count($lines); $j++) {
                        $line = trim($lines[$j]);
                        if (!empty($line) && 
                            strpos($line, 'spawn') === false && 
                            strpos($line, 'Enter passphrase:') === false &&
                            strpos($line, 'expect') === false) {
                            $contentStart = $j;
                            break 2;
                        }
                    }
                }
            }
            
            if ($contentStart >= 0) {
                $decryptedContent = implode("\n", array_slice($lines, $contentStart));
            }
        }
        
        // Clean up expect script output from the decrypted content
        $lines = explode("\n", $decryptedContent);
        $cleanLines = [];
        $foundContent = false;
        
        foreach ($lines as $line) {
            // Skip expect script output lines and control characters
            if (strpos($line, 'spawn age') !== false || 
                strpos($line, 'Enter passphrase:') !== false ||
                strpos($line, 'age: error:') !== false ||
                strpos($line, 'age: report') !== false) {
                continue;
            }
            
            // Clean control characters and escape sequences from the line
            $cleanLine = $line;
            
            // Remove ANSI escape sequences (including [F[K patterns)
            $cleanLine = preg_replace('/\x1b\[[0-9;]*[FK]/', '', $cleanLine); // Remove escape sequences
            $cleanLine = preg_replace('/\[F\[K/', '', $cleanLine); // Remove literal [F[K sequences
            $cleanLine = preg_replace('/\[[FK]\[K/', '', $cleanLine); // Remove [F[K and [K[K patterns
            $cleanLine = preg_replace('/\x1b\[[FK]/', '', $cleanLine); // Remove Unicode escape sequences
            
            // Remove other control characters but preserve newlines
            $cleanLine = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $cleanLine);
            $cleanLine = preg_replace('/\r/', '', $cleanLine); // Remove carriage returns
            
            // Skip empty lines at the beginning, but keep them once we find content
            if (empty(trim($cleanLine)) && !$foundContent) {
                continue;
            }
            
            // Mark that we've found actual content
            if (!empty(trim($cleanLine))) {
                $foundContent = true;
            }
            
            $cleanLines[] = $cleanLine;
        }
        
        // Remove leading/trailing empty lines
        while (!empty($cleanLines) && trim($cleanLines[0]) === '') {
            array_shift($cleanLines);
        }
        while (!empty($cleanLines) && trim(end($cleanLines)) === '') {
            array_pop($cleanLines);
        }
        
        $cleanContent = implode("\n", $cleanLines);
        
        // Final cleanup of any remaining control characters
        $cleanContent = preg_replace('/\x1b\[[0-9;]*[FK]/', '', $cleanContent);
        $cleanContent = preg_replace('/\[F\[K/', '', $cleanContent);
        $cleanContent = preg_replace('/\[[FK]\[K/', '', $cleanContent);
        $cleanContent = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $cleanContent);
        
        // Check if we have any meaningful content after cleaning
        if (empty(trim($cleanContent))) {
            throw new Exception('AGE decryption failed - no meaningful content found after cleaning. Original output: ' . substr($decryptedContent, 0, 200));
        }
        
        // Clean up temporary files
        unlink($ageFile);
        unlink($outputFile);
        
        return trim($cleanContent);
        
    } catch (Exception $e) {
        // Clean up on error
        if (file_exists($ageFile)) unlink($ageFile);
        if (file_exists($outputFile)) unlink($outputFile);
        
        throw $e;
    }
}

/**
 * Decrypt AGE content using Node.js script
 */
function decryptAgeWithNodeJS($ageContent, $password) {
    $scriptPath = __DIR__ . '/decrypt-age-node.js';
    
    // Check if the Node.js script exists
    if (!file_exists($scriptPath)) {
        throw new Exception('Node.js decryption script not found at: ' . $scriptPath);
    }
    
    // Load config for Node.js paths
    $config = loadConfig();
    
    // Check if Node.js is available using configured paths
    $nodeAvailable = false;
    $nodePath = null;
    
    // First try system which command
    $whichResult = shell_exec('which node 2>/dev/null');
    if (!empty($whichResult)) {
        $nodeAvailable = true;
        $nodePath = trim($whichResult);
    } else {
        // Try configured system paths as fallback
        if (isset($config['nodejs']['appendSystemPath'])) {
            foreach ($config['nodejs']['appendSystemPath'] as $path) {
                $testPath = $path . '/node';
                if (file_exists($testPath)) {
                    $nodeAvailable = true;
                    $nodePath = $testPath;
                    break;
                }
            }
        }
    }
    
    if (!$nodeAvailable) {
        $errorMsg = 'Node.js not found. ';
        $errorMsg .= 'Please install Node.js or update the nodejs.appendSystemPath in config.json. ';
        $errorMsg .= 'For nvm users, try: nvm use node && nvm which node';
        throw new Exception($errorMsg);
    }
    
    // Log Node.js usage
    error_log("🔧 AGE Decryption: Using Node.js at " . $nodePath);
    
    // Check if age-encryption package is installed
    $packageJsonPath = __DIR__ . '/package.json';
    $nodeModulesPath = __DIR__ . '/node_modules/age-encryption';
    
    if (!file_exists($packageJsonPath)) {
        throw new Exception('package.json not found. Please run npm install to install dependencies.');
    }
    
    if (!file_exists($nodeModulesPath)) {
        throw new Exception('age-encryption package not found. Please run: npm install age-encryption');
    }
    
    // Prepare the input data
    $inputData = json_encode([
        'content' => $ageContent,
        'password' => $password
    ]);
    
    // Create a temporary file for input to avoid shell escaping issues
    $tempInputFile = tempnam(sys_get_temp_dir(), 'age_input_');
    file_put_contents($tempInputFile, $inputData);
    
    try {
        // Set up PATH environment for Node.js compatibility
        $currentPath = getenv('PATH') ?: '/usr/bin:/bin';
        $pathEnv = '';
        if (isset($config['nodejs']['appendSystemPath'])) {
            $pathEnv = 'PATH=' . implode(':', $config['nodejs']['appendSystemPath']) . ':' . $currentPath;
        } else {
            $pathEnv = "PATH={$currentPath}";
        }
        
        // Run the Node.js script
        $command = "export {$pathEnv} && " . escapeshellarg($nodePath) . ' ' . escapeshellarg($scriptPath) . ' < ' . escapeshellarg($tempInputFile) . ' 2>&1';
        $output = [];
        $returnVar = 0;
        
        exec($command, $output, $returnVar);
        
        // Clean up temp file
        unlink($tempInputFile);
        
        if ($returnVar !== 0) {
            $errorOutput = implode("\n", $output);
            
            // Check for common error patterns and provide helpful messages
            if (strpos($errorOutput, 'Cannot find module') !== false) {
                throw new Exception('Node.js module not found. Please run: npm install age-encryption');
            } elseif (strpos($errorOutput, 'age-encryption') !== false) {
                throw new Exception('age-encryption package error. Please run: npm install age-encryption');
            } else {
                throw new Exception('Node.js decryption failed with return code ' . $returnVar . ': ' . $errorOutput);
            }
        }
        
        $decryptedContent = implode("\n", $output);
        
        // Check if we got meaningful content
        if (empty(trim($decryptedContent))) {
            throw new Exception('Node.js decryption returned empty content');
        }
        
        return trim($decryptedContent);
        
    } catch (Exception $e) {
        // Clean up temp file on error
        if (file_exists($tempInputFile)) {
            unlink($tempInputFile);
        }
        throw $e;
    }
}

/**
 * Alternative AGE decryption method using PHP
 * This implements a basic AES-based decryption for testing
 */
function decryptAgeAlternative($ageContent, $password) {
    $payload = '';
    
    // Check if we have the full AGE format with headers
    if (strpos($ageContent, '-----BEGIN AGE ENCRYPTED FILE-----') !== false) {
        // Extract the encrypted payload from AGE format
        $lines = explode("\n", $ageContent);
        $inPayload = false;
        
        foreach ($lines as $line) {
            if (strpos($line, '-----BEGIN AGE ENCRYPTED FILE-----') !== false) {
                $inPayload = true;
                continue;
            }
            if (strpos($line, '-----END AGE ENCRYPTED FILE-----') !== false) {
                break;
            }
            if ($inPayload && !empty(trim($line))) {
                $payload .= trim($line);
            }
        }
    } else {
        // We have payload-only format (from frontend extraction)
        $payload = $ageContent;
    }
    
    if (empty($payload)) {
        throw new Exception('Invalid AGE format');
    }
    
    // Decode base64 payload
    $encrypted = base64_decode($payload);
    
    if ($encrypted === false) {
        throw new Exception('Invalid base64 in AGE content');
    }
    
    // Try our test format first (salt + iv + ciphertext)
    if (strlen($encrypted) >= 32) {
        $salt = substr($encrypted, 0, 16);
        $iv = substr($encrypted, 16, 16);
        $ciphertext = substr($encrypted, 32);
        
        // Derive key using PBKDF2 (our test format)
        $key = hash_pbkdf2('sha256', $password, $salt, 10000, 32, true);
        
        // Try to decrypt
        $decrypted = openssl_decrypt($ciphertext, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
        
        if ($decrypted !== false) {
            return $decrypted;
        }
    }
    
    // If that didn't work, try to parse as real AGE format
    // This is a simplified parser - real AGE format is more complex
    try {
        return decryptRealAge($ageContent, $password);
    } catch (Exception $e) {
        throw new Exception('Decryption failed - incorrect password or unsupported AGE format');
    }
}

/**
 * Attempt to decrypt real AGE format (simplified)
 */
function decryptRealAge($ageContent, $password) {
    // This is a very simplified approach to real AGE decryption
    // In practice, AGE uses X25519, ChaCha20Poly1305, and scrypt
    // This is just for demonstration purposes
    
    throw new Exception('Real AGE decryption requires the age binary - use age-keygen and age tools');
}

/**
 * Generate AGE key from password (simplified)
 */
function generateAgeKeyFromPassword($password) {
    // This is a simplified key generation
    // In practice, AGE uses more complex key derivation
    $salt = 'age-encryption';
    $key = hash_pbkdf2('sha256', $password, $salt, 100000, 32, true);
    return base64_encode($key);
}

/**
 * Encrypt content with AES-256-CBC for JavaScript compatibility
 */
function encryptForJavaScript($content, $password) {
    // Generate random salt and IV
    $salt = random_bytes(16);
    $iv = random_bytes(16); // CBC uses 16-byte IV
    
    // Derive key from password using PBKDF2
    $key = hash_pbkdf2('sha256', $password, $salt, 10000, 32, true);
    
    // Encrypt using AES-256-CBC
    $encrypted = openssl_encrypt($content, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
    
    if ($encrypted === false) {
        throw new Exception('Encryption failed');
    }
    
    // Combine salt + iv + encrypted data
    $result = $salt . $iv . $encrypted;
    
    return base64_encode($result);
}

// Main processing (only in web mode)
if (php_sapi_name() !== 'cli') {
    // Suppress any HTML error output
    ini_set('display_errors', 0);
    error_reporting(E_ALL);
    
    // Set error handler to return JSON
    set_error_handler(function($severity, $message, $file, $line) {
        http_response_code(500);
        echo json_encode([
            'error' => 'PHP Error: ' . $message . ' in ' . $file . ' on line ' . $line,
            'severity' => $severity
        ]);
        exit;
    });
    
    try {
        // Validate AGE format
        if (!isAgeEncrypted($ageContent)) {
            echo json_encode(['error' => 'Content is not AGE encrypted']);
            exit;
        }
        
        
        // Decrypt the AGE content using the standard decryption process
        $decryptResult = decryptAge($ageContent, $password);
        
        // Handle both old format (string) and new format (array with method info)
        if (is_array($decryptResult)) {
            $decryptedContent = $decryptResult['content'];
            $decryptionMethod = $decryptResult['method'];
        } else {
            $decryptedContent = $decryptResult;
            $decryptionMethod = 'age_binary'; // Default for backward compatibility
        }
        
        if ($decryptedContent === false || $decryptedContent === null || strlen($decryptedContent) === 0) {
            // Show first two lines of content for debugging
            $contentLines = explode("\n", $ageContent);
            $firstTwoLines = array_slice($contentLines, 0, 2);
            $debugInfo = implode(" | ", $firstTwoLines);
            
            echo json_encode([
                'error' => 'Decryption failed - check your password or AGE format',
                'debug_content_preview' => $debugInfo
            ]);
            exit;
        }
        
        // Re-encrypt for JavaScript
        $jsEncrypted = encryptForJavaScript($decryptedContent, $password);
        
        // Return success response with decryption method info
        echo json_encode([
            'success' => true,
            'encrypted_content' => $jsEncrypted,
            'algorithm' => 'AES-256-CBC',
            'decryption_method' => $decryptionMethod
        ]);
        
    } catch (Exception $e) {
        // Show first two lines of content for debugging
        $contentLines = explode("\n", $ageContent);
        $firstTwoLines = array_slice($contentLines, 0, 2);
        $debugInfo = implode(" | ", $firstTwoLines);
        
        http_response_code(500);
        echo json_encode([
            'error' => $e->getMessage(),
            'debug_content_preview' => $debugInfo
        ]);
    } catch (Error $e) {
        // Catch PHP 7+ errors
        http_response_code(500);
        echo json_encode([
            'error' => 'PHP Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine(),
            'type' => 'PHP Error'
        ]);
    }
}
?>
