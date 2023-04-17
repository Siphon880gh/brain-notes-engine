<?php


$DIR_SNIPPETS = "curriculum/";
// TODO: Detect production or local development
// Local development should use Obsidian vault directory at the author's computer
// Production environment should use ./curriculum/ which will be ignored at .gitignore but SSH will fetch and reset a sub repository at ./curriculum/ (not pull because we want automatic scripts without the possibility of needing supervision for merge conflicts)
?>