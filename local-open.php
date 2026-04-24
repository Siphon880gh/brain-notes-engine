<?php
session_start();

$id = isset($_GET["id"]) ? intval($_GET["id"]) : null;

// ============================================================
// Rate limiting (anti-scraping) — see README - Throttle Note Requests.md
// Config: config-throttle.json. Missing/invalid config = fail-open (off).
// Keyed on client IP, stored as JSON counter files under storage_dir.
// ============================================================
(function () {
    $configPath = __DIR__ . '/config-throttle.json';
    if (!file_exists($configPath)) return;
    $raw = @file_get_contents($configPath);
    if ($raw === false) return;
    $cfg = json_decode($raw, true);
    if (!is_array($cfg) || empty($cfg['enabled'])) return;

    $maxRequests   = isset($cfg['max_requests'])   ? max(1, intval($cfg['max_requests']))   : 4;
    $windowSeconds = isset($cfg['window_seconds']) ? max(1, intval($cfg['window_seconds'])) : 30;
    $storageDir    = isset($cfg['storage_dir'])    ? (string)$cfg['storage_dir']            : 'temp/throttle';
    $cooldownMsg   = isset($cfg['cooldown_message'])
        ? (string)$cfg['cooldown_message']
        : "Slow down — too many note requests. Please wait a moment and try again.";
    $bypassPrivAuthed = !empty($cfg['bypass_authenticated_private']);
    $trustXff         = !empty($cfg['trust_forwarded_for']);
    $trustCloudflare  = !empty($cfg['trust_cloudflare']);

    // Already-authenticated PRIVATE users can opt out (normal browsing shouldn't trip rate limits).
    if ($bypassPrivAuthed && isset($_SESSION['private_auth']) && $_SESSION['private_auth'] === true) {
        return;
    }

    // Identity: direct REMOTE_ADDR by default.
    //
    // Header priority when trusted:
    //   1. CF-Connecting-IP  (Cloudflare) — always the real client IP, no parsing
    //   2. X-Real-IP         (set by Nginx / CloudPanel reverse proxy)
    //   3. X-Forwarded-For   (first hop is the client)
    //
    // Only enable the trust flags if your origin is actually behind that proxy;
    // otherwise any visitor can forge these headers and evade rate limiting.
    $clientIp = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';
    if ($trustCloudflare && !empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        $clientIp = trim($_SERVER['HTTP_CF_CONNECTING_IP']);
    } elseif ($trustXff) {
        if (!empty($_SERVER['HTTP_X_REAL_IP'])) {
            $clientIp = $_SERVER['HTTP_X_REAL_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            $clientIp = trim($parts[0]);
        }
    }
    // No identifiable client (CLI, odd SAPI) — skip rather than globally rate-limit.
    if ($clientIp === '') return;

    // Resolve storage dir. Accept absolute or relative-to-script paths.
    $storagePath = (strlen($storageDir) > 0 && $storageDir[0] === '/')
        ? $storageDir
        : __DIR__ . '/' . ltrim($storageDir, '/');
    if (!is_dir($storagePath)) {
        @mkdir($storagePath, 0755, true);
    }
    if (!is_dir($storagePath) || !is_writable($storagePath)) return;

    $ipKey       = hash('sha256', $clientIp);
    $counterFile = $storagePath . '/' . $ipKey . '.json';
    $now         = time();
    $windowStart = $now - $windowSeconds;

    $timestamps = [];
    if (file_exists($counterFile)) {
        $prev = @file_get_contents($counterFile);
        if ($prev !== false && $prev !== '') {
            $decoded = json_decode($prev, true);
            if (is_array($decoded)) {
                foreach ($decoded as $t) {
                    if (is_numeric($t) && intval($t) >= $windowStart) {
                        $timestamps[] = intval($t);
                    }
                }
            }
        }
    }

    if (count($timestamps) >= $maxRequests) {
        http_response_code(429);
        header('Retry-After: ' . $windowSeconds);
        header('Content-Type: text/plain; charset=utf-8');
        // YAML envelope matches what note-opener.js expects, so the message renders
        // in place of the note body rather than as a raw error.
        echo "title: Too many requests\nhtml: |\n" . $cooldownMsg;
        exit;
    }

    $timestamps[] = $now;
    @file_put_contents($counterFile, json_encode(array_values($timestamps)));

    // Opportunistic cleanup (~1% of requests): delete counter files untouched for 24h.
    if (mt_rand(1, 100) === 1) {
        $entries = @scandir($storagePath);
        if (is_array($entries)) {
            foreach ($entries as $entry) {
                if ($entry === '.' || $entry === '..') continue;
                $full = $storagePath . '/' . $entry;
                if (is_file($full) && filemtime($full) < ($now - 86400)) {
                    @unlink($full);
                }
            }
        }
    }
})();

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

/**
 * Check if a file is a PRIVATE file (ends with PRIVATE.md or (PRIVATE).md)
 */
function isPrivateFile($filename) {
    return preg_match('/\(?PRIVATE\)?\.md$/i', $filename);
}

/**
 * Check if a folder name ends with (PRIVATE) or PRIVATE (case insensitive)
 */
function isPrivateFolderName($name) {
    return preg_match('/(?:\(PRIVATE\)|PRIVATE)$/i', $name);
}

/**
 * Check if a path is inside a private folder (any segment ends with (PRIVATE) or PRIVATE)
 */
function isInPrivateFolder($pathTp) {
    if (empty($pathTp)) return false;
    $segments = explode('/', $pathTp);
    foreach ($segments as $seg) {
        if (isPrivateFolderName($seg)) return true;
    }
    return false;
}

/**
 * Check if user is authenticated for private files
 */
function isPrivateAuthenticated() {
    return isset($_SESSION['private_auth']) && $_SESSION['private_auth'] === true;
}

// Check if this is a PRIVATE file or inside a PRIVATE folder
$filename = $result["current"] ?? '';
$pathTp = $result["path_tp"] ?? '';
$isPrivate = isPrivateFile($filename) || isInPrivateFolder($pathTp);
if ($isPrivate) {
    // Check if user is authenticated
    if (!isPrivateAuthenticated()) {
        // Return blocked content response
        $title = $filename;
        echo "title: $title
html: |
__PRIVATE_BLOCKED__";
        die();
    }
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
