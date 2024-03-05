<?php
// DIR_SNIPPETS is the folder of MD files and JSON that is made up of the curriculum of code snippets, guides and tutorials.
// I like locally authoring on Obsidian Editor (great for MD files) but the code needs to exist on another folder path.

// Therefore, I must detect production or local development
// Local development should use Obsidian vault directory at the author's computer
// Production environment should use ./curriculum/ which will be ignored at .gitignore but SSH will fetch and reset a sub 
// repository at ./curriculum/ (not pull because we want automatic scripts without the possibility of needing supervision 
// for merge conflicts)

$DIR_SNIPPETS = "curriculum/"; // default

$host = $_SERVER['HTTP_HOST'];

if (strpos($host, 'localhost') !== false) {
    // When viewing app in localhots, render MD notes from Obsidian Vault
    $DIR_SNIPPETS = "/Users/wengffung/Library/CloudStorage/GoogleDrive-siphon880g@gmail.com/My Drive/_Obsidian MD/Document Vaults/Content/Dev/curriculum-3d/"; 

} elseif (strpos($host, 'wengindustry.com') !== false) {
    // Is fine but kept here for scalability
} else {
    // Is fine but kept here for scalability
}

// die($DIR_SNIPPETS);

?>