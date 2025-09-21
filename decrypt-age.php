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

// Show all errors in development
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
ini_set('log_errors', 1);

// Debug: Log that we're starting the script
error_log("🔧 decrypt-age.php: Script started, error reporting enabled");

// Test: Add a simple debug output to verify script execution
if (php_sapi_name() !== 'cli') {
    error_log("🔧 decrypt-age.php: Web mode detected, REQUEST_METHOD=" . ($_SERVER['REQUEST_METHOD'] ?? 'unknown'));
}

/**
 * Output JSON error response and exit
 */
function jsonError($message, $code = 500) {
    if (php_sapi_name() !== 'cli') {
        http_response_code($code);
        header('Content-Type: application/json');
    }
    echo json_encode(['error' => $message]);
    exit;
}

/**
 * Get dedicated temp directory for AGE decryption
 */
function getAgeTempDir() {
    $tempDir = __DIR__ . '/temp/age-decrypt';
    
    // Create directory if it doesn't exist
    if (!is_dir($tempDir)) {
        if (!mkdir($tempDir, 0755, true)) {
            // Fallback to system temp dir if we can't create our own
            return sys_get_temp_dir();
        }
    }
    
    return $tempDir;
}

/**
 * Clean up old temp files (older than 1 minute)
 * This prevents conflicts with multiple concurrent users
 */
function cleanupOldTempFiles() {
    $tempDir = getAgeTempDir();
    if (!is_dir($tempDir)) return;
    
    $files = glob($tempDir . '/age_*');
    $now = time();
    $maxAge = 60; // 1 minute - short enough to avoid conflicts, long enough for processing
    
    foreach ($files as $file) {
        if (is_file($file) && ($now - filemtime($file)) > $maxAge) {
            unlink($file);
        }
    }
}

 
// Only set headers if running in web context
if (php_sapi_name() !== 'cli') {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    
    // Test endpoint - add ?test=1 to URL to verify script is working
    if (isset($_GET['test']) && $_GET['test'] == '1') {
        echo json_encode([
            'status' => 'success',
            'message' => 'decrypt-age.php is working correctly',
            'timestamp' => date('Y-m-d H:i:s'),
            'php_version' => PHP_VERSION,
            'error_reporting' => error_reporting(),
            'display_errors' => ini_get('display_errors')
        ]);
        exit;
    }

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
        'has_password' => $password ? 'yes' : 'no',
        'password_length' => $password ? strlen($password) : 0,
        'password_preview' => $password ? substr($password, 0, 10) . '...' : 'none'
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
 * Get Node.js path from .nvmrc file
 */
function getNodePathFromNvmrc() {
    $nvmrcFile = __DIR__ . '/.nvmrc';
    if (file_exists($nvmrcFile)) {
        $version = trim(file_get_contents($nvmrcFile));
        error_log("🔧 .nvmrc: Found version " . $version);
        
        // Try common nvm paths
        $nvmPaths = [
            getenv('HOME') . '/.nvm/versions/node/v' . $version . '/bin/node',
            '/usr/local/nvm/versions/node/v' . $version . '/bin/node',
            '/opt/nvm/versions/node/v' . $version . '/bin/node'
        ];
        
        foreach ($nvmPaths as $path) {
            if (file_exists($path)) {
                error_log("🔧 .nvmrc: Found Node.js at " . $path);
                return $path;
            }
        }
        
        error_log("🔧 .nvmrc: Node.js v" . $version . " not found in common nvm paths");
    }
    return null;
}

/**
 * Load configuration from config.json
 */
function loadConfig() {
    $configFile = __DIR__ . '/config.json';
    error_log("🔧 loadConfig: Looking for config file at: " . $configFile);
    
    if (file_exists($configFile)) {
        error_log("🔧 loadConfig: Config file found");
        $configContent = file_get_contents($configFile);
        $config = json_decode($configContent, true) ?: [];
        error_log("🔧 loadConfig: Config loaded: " . json_encode($config));
        return $config;
    } else {
        error_log("🔧 loadConfig: Config file not found");
    }
    return [];
}

/**
 * Clean up AGE content by removing invalid characters and normalizing format
 */
function cleanAgeContent($content) {
    $originalLength = strlen($content);
    
    // Remove any null bytes and control characters except newlines and tabs
    $content = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $content);
    
    // Remove any BOM (Byte Order Mark) if present
    $content = preg_replace('/^\xEF\xBB\xBF/', '', $content);
    
    // Normalize line endings to Unix style
    $content = str_replace(["\r\n", "\r"], "\n", $content);
    
    // Remove trailing whitespace from each line
    $lines = explode("\n", $content);
    $lines = array_map('rtrim', $lines);
    $content = implode("\n", $lines);
    
    // Remove leading and trailing whitespace
    $content = trim($content);
    
    $newLength = strlen($content);
    if ($originalLength !== $newLength) {
        error_log("🧹 AGE Content Cleaned: {$originalLength} -> {$newLength} bytes (removed " . ($originalLength - $newLength) . " invalid characters)");
    }
    
    return $content;
}

/**
 * Validate and normalize AGE content format
 */
function validateAgeContent($content) {
    // Clean the content first
    $content = cleanAgeContent($content);
    
    // Check for empty content
    if (empty($content)) {
        jsonError('AGE content is empty after cleaning');
    }
    
    // Check for minimum length (AGE content should be at least 100 characters)
    if (strlen($content) < 100) {
        jsonError('AGE content is too short to be valid');
    }
    
    // Check for invalid characters in base64 content
    if (preg_match('/[^A-Za-z0-9+\/=\s\-]/', $content)) {
        jsonError('AGE content contains invalid characters');
    }
    
    return $content;
}

/**
 * Check if content is AGE encrypted (either full format or payload only)
 */
function isAgeEncrypted($content) {
    try {
        // Validate the content first
        $content = validateAgeContent($content);
        
        error_log("🔧 AGE Detection: Content length=" . strlen($content));
        error_log("🔧 AGE Detection: Content preview=" . substr($content, 0, 100));
        
        // Check for armored AGE format with headers
        $hasAgeHeaders = (strpos($content, '-----BEGIN AGE ENCRYPTED FILE-----') !== false &&
                         strpos($content, '-----END AGE ENCRYPTED FILE-----') !== false);
        error_log("🔧 AGE Detection: Has AGE headers=" . ($hasAgeHeaders ? 'true' : 'false'));
        
        if ($hasAgeHeaders) {
            return true;
        }
        
        // Check for unarmored AGE format (base64 encoded, starts with age-encryption.org/v1)
        // AGE encrypted content typically starts with "YWdlLWVuY3J5cHRpb24ub3JnL3Yx" (base64 for "age-encryption.org/v1")
        $isBase64 = preg_match('/^[A-Za-z0-9+\/=\s]+$/', $content);
        $startsWithAgeMarker = strpos($content, 'YWdlLWVuY3J5cHRpb24ub3JnL3Yx') === 0;
        
        error_log("🔧 AGE Detection: Is base64=" . ($isBase64 ? 'true' : 'false'));
        error_log("🔧 AGE Detection: Starts with age marker=" . ($startsWithAgeMarker ? 'true' : 'false'));
        
        if ($isBase64 && $startsWithAgeMarker) {
            return true;
        }
        
        error_log("🔧 AGE Detection: Not detected as AGE format");
        return false;
    } catch (Exception $e) {
        // If validation fails, it's not valid AGE content
        error_log("🔧 AGE Detection: Validation failed - " . $e->getMessage());
        return false;
    }
}

/**
 * Decrypt AGE content - tries multiple methods
 */
function decryptAge($ageContent, $password) {
    // Debug: Log password info at function entry
    error_log("🔧 decryptAge function: Password length=" . strlen($password));
    error_log("🔧 decryptAge function: Password preview=" . substr($password, 0, 10) . "...");
    error_log("🔧 decryptAge function: Password value=" . $password);
    
    // Load config for AGE binary paths
    $config = loadConfig();
    
    // Check if AGE binary should be bypassed
    error_log("🔧 AGE Decryption: Checking bypass config...");
    error_log("🔧 AGE Decryption: bypassAgeBinary config = " . (isset($config['age']['bypassAgeBinary']) ? ($config['age']['bypassAgeBinary'] ? 'true' : 'false') : 'not set'));
    
    if (isset($config['age']['bypassAgeBinary']) && $config['age']['bypassAgeBinary'] === true) {
        error_log("🔧 AGE Decryption: Bypassing AGE binary, using Node.js directly (config.bypassAgeBinary = true)");
        try {
            $result = decryptAgeWithNodeJS($ageContent, $password);
            error_log("🔧 AGE Decryption: Node.js bypass successful");
            return ['content' => $result, 'method' => 'nodejs_bypass'];
        } catch (Exception $nodeError) {
            error_log("🔧 AGE Decryption: Node.js bypass failed: " . $nodeError->getMessage());
            error_log("🔧 AGE Decryption: Since bypassAgeBinary=true, trying AES-256-CBC fallback instead of age binary");
            
            // Since bypassAgeBinary is true, we should NEVER use the age binary
            // Try AES-256-CBC fallback instead
            try {
                $result = decryptAES256CBC($ageContent, $password);
                error_log("🔧 AGE Decryption: AES-256-CBC fallback successful");
                return ['content' => $result, 'method' => 'aes256cbc_nodejs_fallback'];
            } catch (Exception $aesError) {
                error_log("🔧 AGE Decryption: AES-256-CBC fallback also failed: " . $aesError->getMessage());
                jsonError('Node.js bypass failed: ' . $nodeError->getMessage() . '. AES-256-CBC fallback also failed: ' . $aesError->getMessage());
            }
        }
    } else {
        error_log("🔧 AGE Decryption: Not bypassing AGE binary (config.bypassAgeBinary = false or not set)");
    }
    
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
                jsonError('AGE binary decryption failed: ' . $e->getMessage() . '. Node.js fallback also failed: ' . $nodeError->getMessage() . '. Debug: ' . json_encode($debugInfo));
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
            jsonError('AGE binary not found and Node.js fallback failed: ' . $nodeError->getMessage() . '. ' .
                'The age binary cannot work in web server environments (requires interactive terminal). ' .
                'Please upgrade Node.js to v14+ on your server to use the Node.js fallback, or install a compatible age binary. ' .
                'Debug: ' . json_encode($debugInfo));
        }
    }
}

/**
 * Decrypt AGE content using age binary
 */
function decryptAgeWithBinary($ageContent, $password, $ageBinaryPath = 'age') {
    // Clean up old temp files first
    cleanupOldTempFiles();
    
    $tempDir = getAgeTempDir();
    $ageFile = tempnam($tempDir, 'age_encrypted_');
    $outputFile = tempnam($tempDir, 'age_decrypted_');
    
    error_log("🔧 AGE Binary: Using temp directory: " . $tempDir);
    error_log("🔧 AGE Binary: Created temp files: " . basename($ageFile) . ", " . basename($outputFile));
    
    try {
        // Clean the content first
        $ageContent = cleanAgeContent($ageContent);
        
        // Check if content is armored or unarmored
        $fullAgeContent = $ageContent;
        if (strpos($ageContent, '-----BEGIN AGE ENCRYPTED FILE-----') === false) {
            // Content is unarmored (starts with age-encryption.org/v1)
            // Remove any line breaks from base64 content before decoding
            $cleanBase64 = preg_replace('/\s+/', '', $ageContent);
            
            // Decode from base64 to get raw binary data
            $fullAgeContent = base64_decode($cleanBase64);
            if ($fullAgeContent === false) {
                jsonError('Failed to decode base64 content');
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
            jsonError('AGE binary test failed. Command: ' . $testCommand . ' | Output: ' . implode("\n", $testOutput) . ' | Debug info: Test return=' . $testReturn . ', Output count=' . count($testOutput));
        }
        
        // Try multiple methods to handle password input
        $success = false;
        
        // Method 1: Try with printf and pipe (set PATH for MAMP compatibility)
        // Debug: Log password info
        error_log("🔧 AGE Binary Debug: Password length=" . strlen($password));
        error_log("🔧 AGE Binary Debug: Password preview=" . substr($password, 0, 10) . "...");
        error_log("🔧 AGE Binary Debug: Escaped password=" . escapeshellarg($password));
        
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
            $outputFileContent = file_exists($outputFile) ? file_get_contents($outputFile) : 'Output file not found';
            
            // Enhanced error message with more debugging info
            $errorMsg = 'Age binary decryption failed - check password. ';
            $errorMsg .= 'Command: ' . $command . ' | ';
            $errorMsg .= 'Return code: ' . $returnVar . ' | ';
            $errorMsg .= 'Output: ' . $debugOutput . ' | ';
            $errorMsg .= 'Input file content preview: ' . substr($fileContent, 0, 100) . ' | ';
            $errorMsg .= 'Output file content: ' . substr($outputFileContent, 0, 200);
            
            jsonError($errorMsg);
        }
        
        $decryptedContent = file_get_contents($outputFile);
        
        // Check if the content looks like an error message instead of decrypted content
        // But only if it doesn't contain any actual content markers
        if ((strpos($decryptedContent, 'spawn') !== false || 
            strpos($decryptedContent, 'expect') !== false ||
            strpos($decryptedContent, 'send:') !== false ||
            strpos($decryptedContent, 'while executing') !== false) &&
            !preg_match('/^#|^\d+|^[a-zA-Z]|^- /m', $decryptedContent)) {
            jsonError('AGE decryption failed - the output appears to be an error message, not decrypted content. Output: ' . substr($decryptedContent, 0, 200));
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
            jsonError('AGE decryption failed - no meaningful content found after cleaning. Original output: ' . substr($decryptedContent, 0, 200));
        }
        
        // Clean up temporary files
        unlink($ageFile);
        unlink($outputFile);
        
        return trim($cleanContent);
        
    } catch (Exception $e) {
        // Clean up on error
        if (file_exists($ageFile)) unlink($ageFile);
        if (file_exists($outputFile)) unlink($outputFile);
        
        jsonError($e->getMessage());
    }
}

/**
 * Prepare AGE content for Node.js processing
 * Ensures the content is in the correct format for the Node.js script
 */
function prepareContentForNodeJS($ageContent) {
    error_log("🔧 prepareContentForNodeJS: Input length=" . strlen($ageContent));
    error_log("🔧 prepareContentForNodeJS: Input preview=" . substr($ageContent, 0, 100));
    
    // If content already has AGE headers, clean the payload inside
    if (strpos($ageContent, '-----BEGIN AGE ENCRYPTED FILE-----') !== false &&
        strpos($ageContent, '-----END AGE ENCRYPTED FILE-----') !== false) {
        
        error_log("🔧 prepareContentForNodeJS: Processing armored content");
        
        // Extract the payload between headers
        $payloadRegex = '/-----BEGIN AGE ENCRYPTED FILE-----\s*([\s\S]*?)\s*-----END AGE ENCRYPTED FILE-----/';
        if (preg_match($payloadRegex, $ageContent, $matches)) {
            // Clean the payload (remove all whitespace and line breaks)
            $cleanPayload = preg_replace('/\s+/', '', $matches[1]);
            
            // Reconstruct with clean payload
            $armoredContent = "-----BEGIN AGE ENCRYPTED FILE-----\n" . $cleanPayload . "\n-----END AGE ENCRYPTED FILE-----";
            
            error_log("🔧 prepareContentForNodeJS: Output length=" . strlen($armoredContent));
            return $armoredContent;
        }
    }
    
    error_log("🔧 prepareContentForNodeJS: Processing unarmored content");
    
    // Content is unarmored (base64 payload only) - add headers
    // Remove any line breaks and whitespace from the base64 content
    $cleanBase64 = preg_replace('/\s+/', '', $ageContent);
    
    // Add AGE headers
    $armoredContent = "-----BEGIN AGE ENCRYPTED FILE-----\n" . $cleanBase64 . "\n-----END AGE ENCRYPTED FILE-----";
    
    error_log("🔧 prepareContentForNodeJS: Output length=" . strlen($armoredContent));
    return $armoredContent;
}

/**
 * Decrypt AGE content using Node.js script
 */
function decryptAgeWithNodeJS($ageContent, $password) {
    error_log("🔧 decryptAgeWithNodeJS: Starting Node.js decryption");
    $scriptPath = __DIR__ . '/decrypt-age-node.js';
    
    // Check if the Node.js script exists
    if (!file_exists($scriptPath)) {
        error_log("🔧 decryptAgeWithNodeJS: Script not found at: " . $scriptPath);
        jsonError('Node.js decryption script not found at: ' . $scriptPath);
    }
    
    error_log("🔧 decryptAgeWithNodeJS: Script found at: " . $scriptPath);
    
    // Clean the content first
    $ageContent = cleanAgeContent($ageContent);
    
    // Prepare content for Node.js - ensure it's in the correct format
    $ageContent = prepareContentForNodeJS($ageContent);
    
    // Load config for Node.js paths
    $config = loadConfig();
    
    // Check if Node.js is available using configured paths
    $nodeAvailable = false;
    $nodePath = null;
    
    // First try .nvmrc file (highest priority)
    $nvmrcPath = getNodePathFromNvmrc();
    if ($nvmrcPath) {
        $nodeAvailable = true;
        $nodePath = $nvmrcPath;
        error_log("🔧 Node.js: Using .nvmrc path: " . $nodePath);
    }
    
    // If not found via .nvmrc, try configured system paths
    if (!$nodeAvailable && isset($config['nodejs']['appendSystemPath'])) {
        foreach ($config['nodejs']['appendSystemPath'] as $path) {
            $testPath = $path . '/node';
            if (file_exists($testPath)) {
                $nodeAvailable = true;
                $nodePath = $testPath;
                error_log("🔧 Node.js: Found at configured path: " . $testPath);
                break;
            }
        }
    }
    
    // If not found in configured paths, try system which command
    if (!$nodeAvailable) {
        $whichResult = shell_exec('which node 2>/dev/null');
        if (!empty($whichResult)) {
            $nodeAvailable = true;
            $nodePath = trim($whichResult);
            error_log("🔧 Node.js: Found via which command: " . $nodePath);
        }
    }
    
    if (!$nodeAvailable) {
        $errorMsg = 'Node.js not found. ';
        $errorMsg .= 'Please install Node.js or update the nodejs.appendSystemPath in config.json. ';
        $errorMsg .= 'For nvm users, try: nvm use node && nvm which node';
        jsonError($errorMsg);
    }
    
    // Log Node.js usage
    error_log("🔧 AGE Decryption: Using Node.js at " . $nodePath);
    
    // Check Node.js version compatibility
    $versionCommand = escapeshellarg($nodePath) . ' --version 2>&1';
    $versionOutput = shell_exec($versionCommand);
    if ($versionOutput) {
        $version = trim($versionOutput);
        error_log("🔧 AGE Decryption: Node.js version: " . $version);
        
        // Check if version is compatible (v14+)
        if (preg_match('/v(\d+)/', $version, $matches)) {
            $majorVersion = intval($matches[1]);
            if ($majorVersion < 14) {
                throw new Exception("Node.js version {$version} is too old to support the age-encryption ES module. Please upgrade to Node.js v14 or later, or use the age binary instead. Current version: {$version}, Required: v14+");
            }
        }
    }
    
    // Check if age-encryption package is installed
    $packageJsonPath = __DIR__ . '/package.json';
    $nodeModulesPath = __DIR__ . '/node_modules/age-encryption';
    
    if (!file_exists($packageJsonPath)) {
        jsonError('package.json not found. Please run npm install to install dependencies.');
    }
    
    if (!file_exists($nodeModulesPath)) {
        jsonError('age-encryption package not found. Please run: npm install age-encryption');
    }
    
    // Check for invalid characters that might break JSON or AGE decryption
    $invalidChars = ['\x00', '\x01', '\x02', '\x03', '\x04', '\x05', '\x06', '\x07', '\x08', '\x0B', '\x0C', '\x0E', '\x0F', '\x10', '\x11', '\x12', '\x13', '\x14', '\x15', '\x16', '\x17', '\x18', '\x19', '\x1A', '\x1B', '\x1C', '\x1D', '\x1E', '\x1F'];
    foreach ($invalidChars as $char) {
        if (strpos($ageContent, $char) !== false) {
            error_log("🔧 Node.js Input Debug: Found invalid character in content: " . bin2hex($char));
        }
    }
    
    // Check for invalid base64 characters in the payload
    if (preg_match('/-----BEGIN AGE ENCRYPTED FILE-----\s*([\s\S]*?)\s*-----END AGE ENCRYPTED FILE-----/', $ageContent, $matches)) {
        $payload = $matches[1];
        $cleanPayload = preg_replace('/\s+/', '', $payload);
        
        // Check for invalid base64 characters
        if (!preg_match('/^[A-Za-z0-9+\/]*={0,2}$/', $cleanPayload)) {
            error_log("🔧 Node.js Input Debug: Found invalid base64 characters in payload");
            error_log("🔧 Node.js Input Debug: Payload preview: " . substr($cleanPayload, 0, 100));
            
            // Find the invalid characters
            $invalidBase64Chars = preg_replace('/[A-Za-z0-9+\/=]/', '', $cleanPayload);
            if (!empty($invalidBase64Chars)) {
                error_log("🔧 Node.js Input Debug: Invalid characters found: " . implode(', ', array_unique(str_split($invalidBase64Chars))));
            }
        }
    }
    
    // Prepare the input data
    $inputData = json_encode([
        'content' => $ageContent,
        'password' => $password
    ]);
    
    // Check if JSON encoding failed
    if ($inputData === false) {
        jsonError('Failed to encode JSON data for Node.js script. JSON error: ' . json_last_error_msg());
    }
    
    // Debug: Log the JSON data being sent
    error_log("🔧 Node.js Input Debug: JSON length=" . strlen($inputData) . ", Content length=" . strlen($ageContent) . ", Password length=" . strlen($password));
    error_log("🔧 Node.js Input Debug: Content preview=" . substr($ageContent, 0, 100));
    error_log("🔧 Node.js Input Debug: Content ending=" . substr($ageContent, -100));
    error_log("🔧 Node.js Input Debug: JSON preview=" . substr($inputData, 0, 200));
    error_log("🔧 Node.js Input Debug: JSON ending=" . substr($inputData, -200));
    
    // Check if content appears to be truncated
    if (strpos($ageContent, '-----END AGE ENCRYPTED FILE-----') === false) {
        error_log("🔧 Node.js Input Debug: WARNING - Content appears to be missing END marker");
    }
    
    // Check for common truncation patterns
    if (strlen($ageContent) < 200) {
        error_log("🔧 Node.js Input Debug: WARNING - Content is very short, might be truncated");
    }
    
    // Clean up old temp files first
    cleanupOldTempFiles();
    
    // Create a temporary file for input to avoid shell escaping issues
    $tempDir = getAgeTempDir();
    $tempInputFile = tempnam($tempDir, 'age_input_');
    file_put_contents($tempInputFile, $inputData);
    
    error_log("🔧 Node.js: Using temp directory: " . $tempDir);
    error_log("🔧 Node.js: Created temp file: " . basename($tempInputFile));
    
    try {
        // Set up PATH environment for Node.js compatibility
        $currentPath = getenv('PATH') ?: '/usr/bin:/bin';
        $pathEnv = '';
        if (isset($config['nodejs']['appendSystemPath'])) {
            $pathEnv = 'PATH=' . implode(':', $config['nodejs']['appendSystemPath']) . ':' . $currentPath;
        } else {
            $pathEnv = "PATH={$currentPath}";
        }
        
        // Run the Node.js script directly (nvm use is not available in PHP environment)
        $command = "cd " . escapeshellarg(__DIR__) . " && export {$pathEnv} && " . escapeshellarg($nodePath) . ' ' . escapeshellarg($scriptPath) . ' < ' . escapeshellarg($tempInputFile) . ' 2>&1';
        $output = [];
        $returnVar = 0;
        
        exec($command, $output, $returnVar);
        
        // Clean up temp file
        unlink($tempInputFile);
        
        $outputString = implode("\n", $output);
        
        // Try to parse as JSON first (new format with debug info)
        $jsonResult = json_decode($outputString, true);
        if ($jsonResult !== null) {
            if (isset($jsonResult['success']) && $jsonResult['success'] === true) {
                // Success - return the content
                $decryptedContent = $jsonResult['content'];
                
                // Log debug info if available
                if (isset($jsonResult['debug']) && is_array($jsonResult['debug'])) {
                    error_log("🔧 Node.js Debug: " . implode(" | ", $jsonResult['debug']));
                }
                
                return trim($decryptedContent);
            } else {
                // Error in JSON format
                $errorMsg = isset($jsonResult['error']) ? $jsonResult['error'] : 'Unknown Node.js error';
                
                // Log debug info if available
                if (isset($jsonResult['debug']) && is_array($jsonResult['debug'])) {
                    error_log("🔧 Node.js Debug: " . implode(" | ", $jsonResult['debug']));
                }
                
                jsonError($errorMsg);
            }
        }
        
        // If not JSON or return code is not 0, handle as old format
        if ($returnVar !== 0) {
            $errorOutput = $outputString;
            
            // Fallback to old error detection for non-JSON errors
            if (strpos($errorOutput, 'Cannot find module') !== false) {
                jsonError('Node.js module not found. Please run: npm install age-encryption');
            } elseif (strpos($errorOutput, 'age-encryption') !== false) {
                jsonError('age-encryption package error. Please run: npm install age-encryption');
            } else {
                jsonError('Node.js decryption failed with return code ' . $returnVar . ': ' . $errorOutput);
            }
        }
        
        // Fallback to old format (plain text output)
        $decryptedContent = $outputString;
        
        // Check if we got meaningful content
        if (empty(trim($decryptedContent))) {
            jsonError('Node.js decryption returned empty content');
        }
        
        return trim($decryptedContent);
        
    } catch (Exception $e) {
        // Clean up temp file on error
        if (file_exists($tempInputFile)) {
            unlink($tempInputFile);
        }
        jsonError($e->getMessage());
    }
}

/**
 * Decrypt AES-256-CBC encrypted content
 * This is the method that works locally
 */
function decryptAES256CBC($encryptedContent, $password) {
    error_log("🔧 AES-256-CBC: Starting decryption");
    error_log("🔧 AES-256-CBC: Content length=" . strlen($encryptedContent));
    error_log("🔧 AES-256-CBC: Content preview=" . substr($encryptedContent, 0, 100));
    
    // Check if content has AGE headers and extract the payload
    $payload = $encryptedContent;
    if (strpos($encryptedContent, '-----BEGIN AGE ENCRYPTED FILE-----') !== false &&
        strpos($encryptedContent, '-----END AGE ENCRYPTED FILE-----') !== false) {
        
        // Extract the payload between headers
        $payloadRegex = '/-----BEGIN AGE ENCRYPTED FILE-----\s*([\s\S]*?)\s*-----END AGE ENCRYPTED FILE-----/';
        if (preg_match($payloadRegex, $encryptedContent, $matches)) {
            $payload = trim($matches[1]);
            error_log("🔧 AES-256-CBC: Extracted payload from AGE headers");
        }
    }
    
    // Clean the payload (remove whitespace)
    $cleanPayload = preg_replace('/\s+/', '', $payload);
    error_log("🔧 AES-256-CBC: Clean payload length=" . strlen($cleanPayload));
    
    // Decode from base64
    $encrypted = base64_decode($cleanPayload);
    if ($encrypted === false) {
        throw new Exception('Failed to decode base64 content for AES-256-CBC');
    }
    
    error_log("🔧 AES-256-CBC: Decoded binary length=" . strlen($encrypted));
    
    // Check if we have the expected format (salt + iv + ciphertext)
    if (strlen($encrypted) < 32) {
        throw new Exception('AES-256-CBC content too short (need at least 32 bytes for salt + iv)');
    }
    
    // Extract salt (16 bytes), iv (16 bytes), and ciphertext
    $salt = substr($encrypted, 0, 16);
    $iv = substr($encrypted, 16, 16);
    $ciphertext = substr($encrypted, 32);
    
    error_log("🔧 AES-256-CBC: Salt length=" . strlen($salt) . ", IV length=" . strlen($iv) . ", Ciphertext length=" . strlen($ciphertext));
    
    // Derive key using PBKDF2
    $key = hash_pbkdf2('sha256', $password, $salt, 10000, 32, true);
    error_log("🔧 AES-256-CBC: Key derived successfully");
    
    // Try to decrypt
    $decrypted = openssl_decrypt($ciphertext, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
    
    if ($decrypted === false) {
        throw new Exception('AES-256-CBC decryption failed - incorrect password or corrupted data');
    }
    
    error_log("🔧 AES-256-CBC: Decryption successful, decrypted length=" . strlen($decrypted));
    return $decrypted;
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
        jsonError('Invalid AGE format');
    }
    
    // Decode base64 payload
    $encrypted = base64_decode($payload);
    
    if ($encrypted === false) {
        jsonError('Invalid base64 in AGE content');
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
        jsonError('Decryption failed - incorrect password or unsupported AGE format');
    }
}

/**
 * Attempt to decrypt real AGE format (simplified)
 */
function decryptRealAge($ageContent, $password) {
    // This is a very simplified approach to real AGE decryption
    // In practice, AGE uses X25519, ChaCha20Poly1305, and scrypt
    // This is just for demonstration purposes
    
    jsonError('Real AGE decryption requires the age binary - use age-keygen and age tools');
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
        jsonError('Encryption failed');
    }
    
    // Combine salt + iv + encrypted data
    $result = $salt . $iv . $encrypted;
    
    return base64_encode($result);
}

// Main processing (only in web mode)
if (php_sapi_name() !== 'cli') {
    error_log("🔧 decrypt-age.php: Starting web mode processing");
    
    // Start output buffering to prevent any accidental output
    ob_start();
    
    // Keep error display enabled for debugging
    error_reporting(E_ALL);
    
    // Debug mode - add ?debug=1 to URL to get detailed error info
    $debugMode = isset($_GET['debug']) && $_GET['debug'] == '1';
    
    // Set error handler to return JSON
    set_error_handler(function($severity, $message, $file, $line) use ($debugMode) {
        // Log the error for debugging
        error_log("PHP Error in decrypt-age.php: $message in $file on line $line (severity: $severity)");
        
        // Clear any previous output
        if (ob_get_level()) {
            ob_clean();
        }
        
        $errorResponse = [
            'error' => 'PHP Error: ' . $message . ' in ' . $file . ' on line ' . $line,
            'severity' => $severity,
            'debug_info' => [
                'file' => $file,
                'line' => $line,
                'severity' => $severity,
                'timestamp' => date('Y-m-d H:i:s')
            ]
        ];
        
        if ($debugMode) {
            $errorResponse['debug_mode'] = true;
            $errorResponse['request_info'] = [
                'method' => $_SERVER['REQUEST_METHOD'],
                'uri' => $_SERVER['REQUEST_URI'],
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
                'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'Unknown'
            ];
        }
        
        http_response_code(500);
        echo json_encode($errorResponse);
        exit;
    });
    
    // Set shutdown handler for fatal errors
    register_shutdown_function(function() use ($debugMode) {
        $error = error_get_last();
        if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
            // Log the fatal error for debugging
            error_log("Fatal PHP Error in decrypt-age.php: {$error['message']} in {$error['file']} on line {$error['line']} (type: {$error['type']})");
            
            // Clear any previous output
            if (ob_get_level()) {
                ob_clean();
            }
            
            $errorResponse = [
                'error' => 'Fatal PHP Error: ' . $error['message'] . ' in ' . $error['file'] . ' on line ' . $error['line'],
                'type' => 'Fatal Error',
                'debug_info' => [
                    'file' => $error['file'],
                    'line' => $error['line'],
                    'type' => $error['type'],
                    'timestamp' => date('Y-m-d H:i:s')
                ]
            ];
            
            if ($debugMode) {
                $errorResponse['debug_mode'] = true;
                $errorResponse['request_info'] = [
                    'method' => $_SERVER['REQUEST_METHOD'],
                    'uri' => $_SERVER['REQUEST_URI'],
                    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
                    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'Unknown'
                ];
            }
            
            http_response_code(500);
            echo json_encode($errorResponse);
        }
    });
    
    try {
        // Validate and clean the AGE content
        try {
            $ageContent = validateAgeContent($ageContent);
        } catch (Exception $e) {
            echo json_encode([
                'error' => 'Invalid AGE content: ' . $e->getMessage(),
                'type' => 'Validation Error'
            ]);
            exit;
        }
        
        // Validate AGE format
        $isAgeFormat = isAgeEncrypted($ageContent);
        error_log("🔧 Encryption Detection: isAgeEncrypted=" . ($isAgeFormat ? 'true' : 'false'));
        error_log("🔧 Encryption Detection: Content preview=" . substr($ageContent, 0, 100));
        
        if (!$isAgeFormat) {
            echo json_encode(['error' => 'Content is not AGE encrypted']);
            exit;
        }
        
        
        // Decrypt the AGE content using the standard decryption process
        try {
            $decryptResult = decryptAge($ageContent, $password);
            
            // Handle both old format (string) and new format (array with method info)
            if (is_array($decryptResult)) {
                $decryptedContent = $decryptResult['content'];
                $decryptionMethod = $decryptResult['method'];
            } else {
                $decryptedContent = $decryptResult;
                $decryptionMethod = 'age_binary'; // Default for backward compatibility
            }
        } catch (Exception $ageError) {
            error_log("🔧 AGE Decryption Failed: " . $ageError->getMessage());
            error_log("🔧 Trying AES-256-CBC fallback...");
            
            // Try AES-256-CBC decryption as fallback
            try {
                $decryptedContent = decryptAES256CBC($ageContent, $password);
                $decryptionMethod = 'aes256cbc_fallback';
                error_log("🔧 AES-256-CBC fallback successful");
            } catch (Exception $aesError) {
                error_log("🔧 AES-256-CBC fallback also failed: " . $aesError->getMessage());
                throw $ageError; // Re-throw the original AGE error
            }
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
        $response = [
            'success' => true,
            'encrypted_content' => $jsEncrypted,
            'algorithm' => 'AES-256-CBC',
            'decryption_method' => $decryptionMethod
        ];
        
        // Add debug info if in debug mode
        if (isset($_GET['debug']) && $_GET['debug'] == '1') {
            $response['debug'] = [
                'content_length' => strlen($ageContent),
                'decryption_method' => $decryptionMethod,
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }
        
        echo json_encode($response);
        
    } catch (Exception $e) {
        // Show first two lines of content for debugging
        $contentLines = explode("\n", $ageContent);
        $firstTwoLines = array_slice($contentLines, 0, 2);
        $debugInfo = implode(" | ", $firstTwoLines);
        
        $errorResponse = [
            'error' => $e->getMessage(),
            'debug_content_preview' => $debugInfo
        ];
        
        // Add debug info if in debug mode
        if (isset($_GET['debug']) && $_GET['debug'] == '1') {
            $errorResponse['debug'] = [
                'content_length' => strlen($ageContent),
                'timestamp' => date('Y-m-d H:i:s'),
                'error_type' => get_class($e)
            ];
        }
        
        http_response_code(500);
        echo json_encode($errorResponse);
    } catch (Error $e) {
        // Catch PHP 7+ errors
        // Clear any previous output
        if (ob_get_level()) {
            ob_clean();
        }
        
        http_response_code(500);
        echo json_encode([
            'error' => 'PHP Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine(),
            'type' => 'PHP Error'
        ]);
    } catch (Throwable $e) {
        // Catch any other throwable (PHP 7+)
        // Clear any previous output
        if (ob_get_level()) {
            ob_clean();
        }
        
        http_response_code(500);
        echo json_encode([
            'error' => 'Unexpected Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine(),
            'type' => 'Throwable'
        ]);
    }
    
    // Final safety net - ensure we always output valid JSON
    // This will catch any remaining issues
    if (!headers_sent()) {
        $output = ob_get_contents();
        if ($output && !json_decode($output)) {
            // If output is not valid JSON, clear it and send error
            ob_clean();
            http_response_code(500);
            echo json_encode([
                'error' => 'Invalid response format detected',
                'type' => 'Response Error'
            ]);
        }
    }
}
?>
