<?php
// Check if the host is localhost

if (isset($_GET['filepath'])) {
    $_GET['filepath'] = urldecode($_GET['filepath']);
    $_GET['filepath'] = str_replace('___plus___', '+', $_GET['filepath']);
    $_GET['filepath'] = str_replace('___and___', '&', $_GET['filepath']);
}
// print($_GET['filepath']);
// print("<br/>");

if (strpos($_SERVER['HTTP_HOST'], 'localhost')  !== false) {
    
    if (isset($_GET['filepath'])) {
        $filePath = $_GET['filepath'];

        // Check if the file exists in the specified path
        if (file_exists($filePath)) {
            $content = file_get_contents($filePath);
            echo $content;
        } else {
            echo "File not found.";
        }
    } else {
        echo "No file path specified.";
    }
} else {
    // Remote:
    $filePath = $_GET['filepath'];
    $content = file_get_contents($filePath);
    echo $content;
    die("");

    // Remote:
    // Why this was needed? Fetching the path directly worked but not for + because those are treated as spaces
    $baseDir = realpath(__DIR__);

    // Prevent character escaping and other potentially dangerous inputs
    if (preg_match('/\.\.', $filePath)) {
        die('Invalid file path.');
    }

    // Construct the full path
    $fullPath = realpath($baseDir . '/' . $filePath);

    // Ensure the file exists, is a file, and its path starts with the base directory path
    if ($fullPath && is_file($fullPath) && strpos($fullPath, $baseDir) === 0) {
        $content = file_get_contents($fullPath);
        echo $content;
    } else {
        echo "Access denied or file not found.";
    }
}
?>
