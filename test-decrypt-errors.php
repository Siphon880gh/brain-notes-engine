<?php
/**
 * Test script for decrypt-age.php error handling
 * This script helps test various error scenarios to ensure no redirects occur
 */

// Test different error scenarios
$testCases = [
    'missing_content' => [
        'description' => 'Test missing content parameter',
        'data' => ['password' => 'test123']
    ],
    'missing_password' => [
        'description' => 'Test missing password parameter', 
        'data' => ['content' => 'test content']
    ],
    'invalid_json' => [
        'description' => 'Test invalid JSON input',
        'data' => 'invalid json string'
    ],
    'empty_content' => [
        'description' => 'Test empty content',
        'data' => ['content' => '', 'password' => 'test123']
    ],
    'empty_password' => [
        'description' => 'Test empty password',
        'data' => ['content' => 'test content', 'password' => '']
    ],
    'non_age_content' => [
        'description' => 'Test non-AGE encrypted content',
        'data' => ['content' => 'This is not AGE encrypted content', 'password' => 'test123']
    ]
];

echo "<h1>Decrypt-Age.php Error Handling Test</h1>\n";
echo "<p>This script tests various error scenarios to ensure proper JSON error responses.</p>\n";

foreach ($testCases as $testName => $testCase) {
    echo "<h2>Test: {$testCase['description']}</h2>\n";
    
    // Make request to decrypt-age.php
    $url = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/decrypt-age.php?debug=1';
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testCase['data']));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false); // Don't follow redirects
    curl_setopt($ch, CURLOPT_HEADER, true);
    
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
    
    // Check if response is valid JSON
    if (json_decode($body)) {
        echo "<p style='color: green;'>✅ Valid JSON response</p>\n";
    } else {
        echo "<p style='color: red;'>❌ Invalid JSON response - this could cause redirects!</p>\n";
    }
    
    echo "<hr>\n";
}

echo "<h2>Manual Test Instructions</h2>\n";
echo "<p>You can also test manually by visiting these URLs:</p>\n";
echo "<ul>\n";
echo "<li><a href='decrypt-age.php?debug=1' target='_blank'>decrypt-age.php?debug=1</a> - Should show error about missing parameters</li>\n";
echo "<li><a href='decrypt-age.php?debug=1&content=test&password=test' target='_blank'>decrypt-age.php?debug=1&content=test&password=test</a> - Should show error about invalid AGE format</li>\n";
echo "</ul>\n";

echo "<h2>Bypass Configuration Test</h2>\n";
echo "<p>To test the AGE binary bypass functionality:</p>\n";
echo "<ol>\n";
echo "<li>Edit <code>config.json</code> and set <code>\"bypassAgeBinary\": true</code></li>\n";
echo "<li>Try decrypting an AGE-encrypted note</li>\n";
echo "<li>Check the browser console for the ⚡ 'Node.js (Bypass)' message</li>\n";
echo "<li>Set <code>\"bypassAgeBinary\": false</code> to return to normal operation</li>\n";
echo "</ol>\n";

echo "<h2>Browser Console Test</h2>\n";
echo "<p>Open your browser's developer console and run this JavaScript to test the fetch request:</p>\n";
echo "<pre>\n";
echo "fetch('decrypt-age.php', {\n";
echo "    method: 'POST',\n";
echo "    headers: { 'Content-Type': 'application/json' },\n";
echo "    body: JSON.stringify({ content: 'invalid', password: 'test' })\n";
echo "})\n";
echo ".then(response => {\n";
echo "    console.log('Status:', response.status);\n";
echo "    return response.json();\n";
echo "})\n";
echo ".then(data => console.log('Response:', data))\n";
echo ".catch(error => console.error('Error:', error));\n";
echo "</pre>\n";
?>
