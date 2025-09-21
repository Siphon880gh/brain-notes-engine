<?php
/**
 * Cleanup script for AGE decryption temp files
 * Can be run manually or via cron job
 */

require_once __DIR__ . '/decrypt-age.php';

echo "🧹 Cleaning up AGE decryption temp files...\n";

$tempDir = getAgeTempDir();
echo "📁 Temp directory: " . $tempDir . "\n";

if (!is_dir($tempDir)) {
    echo "❌ Temp directory does not exist\n";
    exit(1);
}

$files = glob($tempDir . '/age_*');
echo "📄 Found " . count($files) . " temp files\n";

$now = time();
$maxAge = 60; // 1 minute - short enough to avoid conflicts, long enough for processing
$deletedCount = 0;

foreach ($files as $file) {
    if (is_file($file)) {
        $age = $now - filemtime($file);
        $ageMinutes = round($age / 60);
        
        if ($age > $maxAge) {
            if (unlink($file)) {
                echo "🗑️  Deleted: " . basename($file) . " (age: {$ageMinutes}m)\n";
                $deletedCount++;
            } else {
                echo "❌ Failed to delete: " . basename($file) . "\n";
            }
        } else {
            echo "⏳ Keeping: " . basename($file) . " (age: {$ageMinutes}m)\n";
        }
    }
}

echo "✅ Cleanup complete. Deleted {$deletedCount} files.\n";
?>
