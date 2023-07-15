<?php
include("./env/dir-snippets.php");

// Google and Filezilla has restrictions in placing blocking <img src="file:// to files out of the current dirname
$baseDirectory = $DIR_SNIPPETS;

// Get the requested image path from the query string. This gets appended to $DIR_SNIPPETS
$requestedImage = $_GET['image'];

// Construct the full path to the requested image
$imagePath = "./" . $baseDirectory . $requestedImage;

// <php 5.3.0 uses mime_content_type to get mime content type of a file
// php 5.3.0 deprecated mime_content_type in favor of finfo_open and finfo_file
// php 7.2.0 removed mime_content_type in favor of finfo_open and finfo_file
function getMimeType($file)
{
    // Check if mime_content_type() function exists
    if (function_exists('mime_content_type')) {
        return mime_content_type($file);
    }

    // Fallback to finfo_open() and finfo_file() if mime_content_type() is not available
    if (function_exists('finfo_open') && function_exists('finfo_file')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime_type = finfo_file($finfo, $file);
        finfo_close($finfo);
        return $mime_type;
    }

    // Return null if no suitable functions are available
    return null;
}

// Check if the file exists
if (file_exists($imagePath)) {
  // Set the appropriate content type based on the file extension
  $contentType = getMimeType($imagePath);
  header('Content-Type: '.$contentType);

  // Read and output the file
  readfile($imagePath);
} else {
  // Return a 404 error if the file doesn't exist
  http_response_code(404);
  echo 'Image not found.';
}
?>