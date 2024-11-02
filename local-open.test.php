<?php


$_GET['filepath'] = "/Users/wengffung/Library/CloudStorage/GoogleDrive-siphon880g@gmail.com/My Drive/_Obsidian MD/Document Vaults/Content-Published/Dev/C++/C++ Terminal PRIMER.md";
// die($_GET['filepath']);

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
    echo "ERROR: No file path specified.";
}