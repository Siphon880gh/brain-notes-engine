<?php

// Note content search shells out to pcregrep across the vault. Cap it so one
// visitor cannot tie up this free search for everyone else.
$contentSearchDailyMax = 5;

function devbrainContentSearchClientIp() {
    $trustXff = false;
    $trustCloudflare = false;
    $configPath = __DIR__ . '/config-throttle.json';
    if (file_exists($configPath)) {
        $cfg = json_decode((string)@file_get_contents($configPath), true);
        if (is_array($cfg)) {
            $trustXff = !empty($cfg['trust_forwarded_for']);
            $trustCloudflare = !empty($cfg['trust_cloudflare']);
        }
    }

    $clientIp = isset($_SERVER['REMOTE_ADDR']) ? (string)$_SERVER['REMOTE_ADDR'] : '';
    if ($trustCloudflare && !empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        $clientIp = trim((string)$_SERVER['HTTP_CF_CONNECTING_IP']);
    } elseif ($trustXff) {
        if (!empty($_SERVER['HTTP_X_REAL_IP'])) {
            $clientIp = trim((string)$_SERVER['HTTP_X_REAL_IP']);
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $parts = explode(',', (string)$_SERVER['HTTP_X_FORWARDED_FOR']);
            $clientIp = trim($parts[0]);
        }
    }
    return $clientIp;
}

function devbrainContentSearchToday() {
    return (new DateTimeImmutable('now', new DateTimeZone('America/Los_Angeles')))->format('Y-m-d');
}

/**
 * Consume one content-search credit for this IP.
 * The day resets at midnight Pacific Time.
 * If the counter directory cannot be written, the search is allowed.
 */
function devbrainConsumeContentSearchQuota($maxPerDay) {
    $open = ['allowed' => true, 'remaining' => $maxPerDay, 'limit' => $maxPerDay];
    $clientIp = devbrainContentSearchClientIp();
    if ($clientIp === '') {
        return $open;
    }

    $storagePath = __DIR__ . '/temp/search-content-quota';
    if (!is_dir($storagePath)) {
        @mkdir($storagePath, 0755, true);
    }
    if (!is_dir($storagePath) || !is_writable($storagePath)) {
        return $open;
    }

    $day = devbrainContentSearchToday();
    $counterFile = $storagePath . '/' . hash('sha256', $clientIp) . '.json';
    $fp = @fopen($counterFile, 'c+');
    if ($fp === false) {
        return $open;
    }
    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        return $open;
    }

    $raw = stream_get_contents($fp);
    $count = 0;
    if (is_string($raw) && $raw !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded) && isset($decoded['day'], $decoded['count']) && $decoded['day'] === $day) {
            $count = intval($decoded['count']);
        }
    }

    if ($count >= $maxPerDay) {
        flock($fp, LOCK_UN);
        fclose($fp);
        return ['allowed' => false, 'remaining' => 0, 'limit' => $maxPerDay];
    }

    $count += 1;
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode(['day' => $day, 'count' => $count]));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    if (mt_rand(1, 100) === 1) {
        $entries = @scandir($storagePath);
        if (is_array($entries)) {
            $cutoff = time() - 172800;
            foreach ($entries as $entry) {
                if ($entry === '.' || $entry === '..') continue;
                $full = $storagePath . '/' . $entry;
                if (is_file($full) && filemtime($full) < $cutoff) {
                    @unlink($full);
                }
            }
        }
    }

    return [
        'allowed' => true,
        'remaining' => $maxPerDay - $count,
        'limit' => $maxPerDay,
    ];
}

if(isset($_GET["search"])) {
  $search = $_GET["search"];
  if ($search === '') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["res"=>[], "error"=>"empty"]);
    exit;
  }

  $quota = devbrainConsumeContentSearchQuota($contentSearchDailyMax);
  if (!$quota['allowed']) {
    http_response_code(429);
    header('Content-Type: application/json; charset=utf-8');
    header('Retry-After: 86400');
    echo json_encode([
      "res" => [],
      "error" => "content_search_limit",
      "remaining" => 0,
      "limit" => $quota['limit'],
      "message" => "Note content search is limited to " . $quota['limit'] . " times a day so this free search stays available for everyone. Please try again tomorrow."
    ]);
    exit;
  }

  // echo "HIT 1";
  include("./env/all/pcregrep.php");
  include("./env/dir-snippets.php");
  // pcregrep: case insensitive, I ignoring binary files, recursive search
  // $cmd = 'pcregrep --binary-files=without-match -ri "' . $search . '" "./curriculum"';
  // binary-files option doesn't exist on some operating system's pcregrep
  $cmd = $pcregrep . ' -ri  --exclude-dir=.git --exclude-dir=node_modules "' . $search . '" "' . $DIR_SNIPPETS . '"';
  $res = [];
  $stdout = exec($cmd, $res);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode([
    "res"=>$res,
    "cmd"=>$cmd,
    "stdout"=>$stdout,
    "remaining"=>$quota['remaining'],
    "limit"=>$quota['limit']
  ]);
  // echo json_encode(["res"=>$res, "debug"=>$cmd]);
} else {
  // echo "HIT 2";
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(["res"=>[], "error"=>"POST search param not found."]);
}
// echo "HIT 3";
?>