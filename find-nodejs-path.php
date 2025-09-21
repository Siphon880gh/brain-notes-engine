<?php
/**
 * Node.js Path Finder for DevBrain Configuration
 * 
 * This script helps you find the correct Node.js path for your config.json
 */

echo "🔍 DevBrain Node.js Path Finder\n";
echo "================================\n\n";

// Method 1: Check which command
echo "1. Checking 'which node' command:\n";
$whichResult = shell_exec('which node 2>/dev/null');
if (!empty($whichResult)) {
    echo "   ✅ Found: " . trim($whichResult) . "\n";
} else {
    echo "   ❌ Not found in PATH\n";
}

// Method 2: Check common locations
echo "\n2. Checking common Node.js locations:\n";
$commonPaths = [
    '/usr/local/bin/node',
    '/opt/homebrew/bin/node',
    '/usr/bin/node',
    '/bin/node',
    '/opt/local/bin/node'
];

foreach ($commonPaths as $path) {
    if (file_exists($path)) {
        echo "   ✅ Found: $path\n";
    } else {
        echo "   ❌ Not found: $path\n";
    }
}

// Method 3: Check for nvm
echo "\n3. Checking for nvm installations:\n";
$nvmPaths = [
    getenv('HOME') . '/.nvm/versions/node',
    '/usr/local/nvm/versions/node'
];

foreach ($nvmPaths as $nvmPath) {
    if (is_dir($nvmPath)) {
        echo "   📁 Found nvm directory: $nvmPath\n";
        
        // List available Node.js versions
        $versions = glob($nvmPath . '/*');
        foreach ($versions as $version) {
            $nodePath = $version . '/bin/node';
            if (file_exists($nodePath)) {
                $versionName = basename($version);
                echo "      ✅ Version $versionName: $nodePath\n";
            }
        }
    }
}

// Method 4: Check environment variables
echo "\n4. Checking environment variables:\n";
$envVars = ['NVM_BIN', 'NODE_PATH', 'PATH'];
foreach ($envVars as $var) {
    $value = getenv($var);
    if ($value) {
        echo "   📋 $var: $value\n";
    }
}

// Method 5: Try to run node --version
echo "\n5. Testing Node.js execution:\n";
$testResult = shell_exec('node --version 2>&1');
if ($testResult && strpos($testResult, 'v') === 0) {
    echo "   ✅ Node.js is working: " . trim($testResult) . "\n";
} else {
    echo "   ❌ Node.js not working: " . trim($testResult) . "\n";
}

echo "\n📝 Configuration Recommendation:\n";
echo "================================\n";

// Find the best path to recommend
$recommendedPath = null;

// First try which command
if (!empty($whichResult)) {
    $recommendedPath = trim($whichResult);
    echo "Add this to your config.json:\n\n";
} else {
    // Try to find any working node
    foreach ($commonPaths as $path) {
        if (file_exists($path)) {
            $recommendedPath = $path;
            echo "Add this to your config.json:\n\n";
            break;
        }
    }
    
    // Check nvm paths
    if (!$recommendedPath) {
        foreach ($nvmPaths as $nvmPath) {
            if (is_dir($nvmPath)) {
                $versions = glob($nvmPath . '/*');
                foreach ($versions as $version) {
                    $nodePath = $version . '/bin/node';
                    if (file_exists($nodePath)) {
                        $recommendedPath = $nodePath;
                        echo "Add this to your config.json:\n\n";
                        break 2;
                    }
                }
            }
        }
    }
}

if ($recommendedPath) {
    echo "{\n";
    echo "  \"nodejs\": {\n";
    echo "    \"appendSystemPath\": [\n";
    echo "      \"" . dirname($recommendedPath) . "\",\n";
    echo "      \"/usr/local/bin\",\n";
    echo "      \"/opt/homebrew/bin\",\n";
    echo "      \"/usr/bin\",\n";
    echo "      \"/bin\"\n";
    echo "    ]\n";
    echo "  }\n";
    echo "}\n";
} else {
    echo "❌ No Node.js installation found.\n";
    echo "Please install Node.js first:\n";
    echo "- macOS: brew install node\n";
    echo "- Ubuntu/Debian: sudo apt install nodejs npm\n";
    echo "- Or visit: https://nodejs.org/\n";
}

echo "\n🔧 For nvm users:\n";
echo "Run: nvm use node && nvm which node\n";
echo "Then copy the output path to config.json\n";
?>
