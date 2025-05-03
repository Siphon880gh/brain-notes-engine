<?php
$id = isset($_GET["id"]) ? intval($_GET["id"]) : null;

// Load and decode the JSON file
$jsonFile = 'cachedResData.json';
$jsonData = json_decode(file_get_contents($jsonFile), true);

// Check if JSON was loaded correctly
if ($jsonData === null) {
    echo "Error loading JSON data.";
    exit;
}

// Search for the object with the matching id
$result = null;
if (isset($jsonData['dirs']) && is_array($jsonData['dirs'])) {
    foreach ($jsonData['dirs'] as $item) {
        if (isset($item['id']) && intval($item['id']) === $id) {
            $result = $item;
            break;
        }
    }
}

// Display the result
if ($result !== null) {
    // echo json_encode($result);
    $_GET['filepath'] = $result['path'];
} else {
echo "title: ERROR
html: |
No matching record found for id: " . id;
    die();
}


// Check if the host is localhost
if (isset($_GET['filepath'])) {
    // $_GET['filepath'] = urldecode($_GET['filepath']);
    // $_GET['filepath'] = str_replace('___plus___', '+', $_GET['filepath']);
    // $_GET['filepath'] = str_replace('___and___', '&', $_GET['filepath']);
}
// print($_GET['filepath']);
// print("<br/>");

// die($_GET['filepath']);

if (isset($_GET['filepath'])) {
    $filePath = $_GET['filepath'];

    // Check if the file exists in the specified path
    if (file_exists($filePath)) {
        $title = $result["current"];
        $content = file_get_contents($filePath);

        // YAML with embedding multiline content. Variation of. Title value with no quotes.
        echo "title: $title
html: |
$content";

        die("");
    } else {
        echo "File not found.";
    }
} else {
    echo "ERROR: No file path specified.";
    die();
}


die();



if (strpos($_SERVER['HTTP_HOST'], 'localhost')  !== false) {
    
    if (isset($_GET['filepath'])) {
        $filePath = $_GET['filepath'];

        // Check if the file exists in the specified path
        if (file_exists($filePath)) {
            $content = file_get_contents($filePath);
            $title = "Your Title Here";


            echo "title: \"$title\"\n";
            echo "html: |\n";

            die("");
        } else {
            echo "File not found.";
        }
    } else {
        echo "ERROR: No file path specified.";
        die();
    }
} else {


    if (isset($_GET['filepath'])) {
        $filePath = $_GET['filepath'];

        // Check if the file exists in the specified path
        if (file_exists($filePath)) {
            $content = file_get_contents($filePath);
            $title = "Your Title Here";


            echo "title: \"$title\"\n";
            echo "html: |\n";

            die("");
        } else {
            echo "File not found.";
        }
    } else {
        echo "ERROR: No file path specified.";
        die();
    }



    
    return;
    // Remote:
    $filePath = $_GET['filepath'];
    $content = file_get_contents($filePath);
    $title = "Your Title Here";

    echo "title: \"$title\"\n";
    echo "html: |\n";

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
