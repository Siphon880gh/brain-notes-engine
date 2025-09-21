<?php
/**
 * Test script for Node.js bypass functionality
 * This script helps test the Node.js decryption directly
 */

echo "<h1>Node.js Bypass Test</h1>\n";
echo "<p>This script tests the Node.js decryption functionality directly.</p>\n";

// Test the Node.js script directly - using base64 payload only (as DevBrain sends it)
$testContent = 'YWdlLWVuY3J5cHRpb24ub3JnL3YxCi0+IHNjcnlwdCBNa2xvdFRuYnhzVGM0VGlzbGk1bU13IDE4CnlWbkkySER2MnF2c2JrM1lZQ0ZvQ2RKRmY1V0cvcEZOVSsvV1Yva2pobUkKLS0tIHJQV1Z6UTZ3cklOMHlzc2ZLbEJZWTIvckorWlRWcm5pOG45NjJIYnAvZXMKChd7KmJikOmEGZyTnzEluoT71er+74UWzAiyrwmxQLxMskNfU40r1ltuq9xGuG2Zre7NWHYh7xJjeIvQM+JJQreF1Sqcg13cXXbZ2oUPnl8sLqebxFBCQv1gn/pr9FYGZWa5ZpRat/RE/2LT2UqZD0kDH+ORmfn31uLzXucbGaIHJpp1CxrUu0yqAM+wJq3hIhYlEgAWZ4U5/fSC0I5lyAxaln4PJ2y3HLo2cWZr8G0Vdh5yPj4FQxplK/z4ZgK5PjEIKC1K25aFjkMaADD4ZcSRoxa/zzlCyj1tWqDWAUoUVdWLGG7snSFOZ8QdGZgIYCH+r2YDFbpQR6F2OTMtdUXltTdtUmnnwxomR38nhCXesPzQeY1qyn90Fexuy8dAmUbjOXK1JZHcw+bj5OU73+5VRAUUw9jgxWYx4/XW';

$testPassword = 'test123';

echo "<h2>Test 1: Direct Node.js Script Test</h2>\n";

// Create a temporary file with the test data
$tempFile = tempnam(sys_get_temp_dir(), 'age_test_');
$inputData = json_encode([
    'content' => $testContent,
    'password' => $testPassword
]);
file_put_contents($tempFile, $inputData);

// Run the Node.js script
$scriptPath = __DIR__ . '/decrypt-age-node.js';
$command = "node " . escapeshellarg($scriptPath) . " < " . escapeshellarg($tempFile) . " 2>&1";
$output = [];
$returnVar = 0;

exec($command, $output, $returnVar);

echo "<h3>Command:</h3>\n";
echo "<pre>" . htmlspecialchars($command) . "</pre>\n";

echo "<h3>Return Code:</h3>\n";
echo "<pre>" . $returnVar . "</pre>\n";

echo "<h3>Output:</h3>\n";
echo "<pre>" . htmlspecialchars(implode("\n", $output)) . "</pre>\n";

// Clean up
unlink($tempFile);

echo "<h2>Test 2: PHP Backend Test (with bypass enabled)</h2>\n";

// Test through the PHP backend
$url = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/decrypt-age.php?debug=1';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'content' => $testContent,
    'password' => $testPassword
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);

curl_close($ch);

$headers = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

echo "<h3>Response (HTTP $httpCode):</h3>\n";
echo "<pre>" . htmlspecialchars($headers) . "</pre>\n";

echo "<h3>Body:</h3>\n";
$jsonData = json_decode($body, true);
if ($jsonData) {
    echo "<pre>" . htmlspecialchars(json_encode($jsonData, JSON_PRETTY_PRINT)) . "</pre>\n";
} else {
    echo "<pre>" . htmlspecialchars($body) . "</pre>\n";
}

echo "<h2>Configuration Check</h2>\n";
$configFile = __DIR__ . '/config.json';
if (file_exists($configFile)) {
    $config = json_decode(file_get_contents($configFile), true);
    $bypassEnabled = $config['age']['bypassAgeBinary'] ?? false;
    echo "<p>Bypass enabled: " . ($bypassEnabled ? '✅ Yes' : '❌ No') . "</p>\n";
} else {
    echo "<p>❌ Config file not found</p>\n";
}

echo "<h2>Node.js Requirements Check</h2>\n";

// Check if Node.js is available
$nodeCheck = shell_exec('which node 2>/dev/null');
if ($nodeCheck) {
    echo "<p>✅ Node.js found at: " . trim($nodeCheck) . "</p>\n";
} else {
    echo "<p>❌ Node.js not found in PATH</p>\n";
}

// Check if age-encryption package is installed
$packagePath = __DIR__ . '/node_modules/age-encryption';
if (file_exists($packagePath)) {
    echo "<p>✅ age-encryption package found</p>\n";
} else {
    echo "<p>❌ age-encryption package not found. Run: npm install age-encryption</p>\n";
}

// Check if decrypt-age-node.js exists
$scriptPath = __DIR__ . '/decrypt-age-node.js';
if (file_exists($scriptPath)) {
    echo "<p>✅ decrypt-age-node.js script found</p>\n";
} else {
    echo "<p>❌ decrypt-age-node.js script not found</p>\n";
}
?>
