<?php
  ini_set('display_errors', 1);
  ini_set('display_startup_errors', 1);
  error_reporting(E_ALL);

  // header("Cache-Control: no-cache, no-store, must-revalidate");
  // header("Pragma: no-cache");
  // header("Expires: 0");

  // Env variables
  include("./env/all/pcregrep.php");
  include("./env/dir-snippets.php");

  // Configurable
  $DEFAULT_THUMBNAIL_SIZE = "90x90"; // height x width
  $warningSearchWillFail_Arr = [];

  // UI theme gallery (themes/). Selected via env/config.json "theme".
  // That file is copied from env/templates-* by npm run build-*.
  // "showThemeSwitcher": true adds a top-right theme control.
  // "showNightDaySwitcher": true adds a Day/Night control beside it.
  $allowedThemes = ['generic', 'soft-cards', 'terminal', 'classic', '3d-games', 'business', 'health'];
  $themeId = 'generic';
  $showThemeSwitcher = false;
  $showNightDaySwitcher = false;
  $themeCatalog = [];
  $cfg = null;
  $configPath = __DIR__ . '/env/config.json';
  if (is_readable($configPath)) {
      $cfg = json_decode(file_get_contents($configPath), true);
      if (is_array($cfg) && !empty($cfg['theme']) && in_array($cfg['theme'], $allowedThemes, true)) {
          $themeId = $cfg['theme'];
      }
      if (is_array($cfg) && isset($cfg['showThemeSwitcher']) && $cfg['showThemeSwitcher'] === true) {
          $showThemeSwitcher = true;
      }
      if (is_array($cfg) && isset($cfg['showNightDaySwitcher']) && $cfg['showNightDaySwitcher'] === true) {
          $showNightDaySwitcher = true;
      }
  }
  $manifestPath = __DIR__ . '/themes/manifest.json';
  if (is_readable($manifestPath)) {
      $manifest = json_decode(file_get_contents($manifestPath), true);
      if (is_array($manifest) && !empty($manifest['themes']) && is_array($manifest['themes'])) {
          foreach ($manifest['themes'] as $themeMeta) {
              if (!is_array($themeMeta) || empty($themeMeta['id']) || !in_array($themeMeta['id'], $allowedThemes, true)) {
                  continue;
              }
              $themeCatalog[] = [
                  'id' => $themeMeta['id'],
                  'name' => !empty($themeMeta['name']) ? $themeMeta['name'] : $themeMeta['id'],
              ];
          }
      }
  }
  if (!$themeCatalog) {
      foreach ($allowedThemes as $allowedId) {
          $themeCatalog[] = ['id' => $allowedId, 'name' => $allowedId];
      }
  }
  $themeCssPath = 'themes/' . $themeId . '/theme.css';
  $themeConfigJson = json_encode([
      'showSwitcher' => $showThemeSwitcher,
      'showNightDaySwitcher' => $showNightDaySwitcher,
      'themes' => $themeCatalog,
      'allowed' => $allowedThemes,
  ], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE);
?><!DOCTYPE html>
<html lang="en" data-theme="<?php echo htmlspecialchars($themeId, ENT_QUOTES, 'UTF-8'); ?>" data-mode="day">

<head>
    <title><?php include 'env/title-long.php'; ?></title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php include("env/description-meta.php"); ?>

    <!-- CSS Assets -->
    <link href="assets/css/index.css" rel="stylesheet">
    <link id="theme-css" href="<?php echo htmlspecialchars($themeCssPath, ENT_QUOTES, 'UTF-8'); ?>" rel="stylesheet">
    <script>
    window.DevBrainThemeConfig = <?php echo $themeConfigJson; ?>;
    (function () {
      var cfg = window.DevBrainThemeConfig;
      if (!cfg) return;
      try {
        var scope = (location.pathname || '/').replace(/index\.php$/i, '');
        if (scope.charAt(scope.length - 1) !== '/') scope += '/';
        if (cfg.showSwitcher) {
          var saved = localStorage.getItem('devbrain-theme:' + scope);
          if (saved && cfg.allowed.indexOf(saved) !== -1 && saved !== document.documentElement.getAttribute('data-theme')) {
            document.documentElement.setAttribute('data-theme', saved);
            var link = document.getElementById('theme-css');
            if (link) link.href = 'themes/' + saved + '/theme.css';
          }
        }
        if (cfg.showNightDaySwitcher) {
          var mode = localStorage.getItem('devbrain-color-mode:' + scope);
          if (mode === 'night' || mode === 'day') {
            document.documentElement.setAttribute('data-mode', mode);
          }
        }
      } catch (e) {}
    })();
    </script>
    <link href="assets/css/modal.css" rel="stylesheet">
    <link href="assets/css/mindmap.css" rel="stylesheet">
    <link href="assets/css/link-popover.css" rel="stylesheet">
    <link href="assets/css/encryption.css" rel="stylesheet">
    <link href="assets/css/private-auth.css" rel="stylesheet">

    <link href="assets/css/game.css" rel="stylesheet">
    <!-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" /> -->

    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>

    <!-- jQuery UI -->
    <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js"></script>
    <link href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.min.css" rel="stylesheet"/>

    <!-- Designer: FontAwesome -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.9.0/css/all.min.css">
    
    <!-- Mermaid.js for mindmap generation -->
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>

    <!-- Designer: Tailwind CSS -->
    <!-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"> -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/components.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/utilities.min.css">

    <!-- Highlight.js -->
    <!-- default.min.css, dark.min.css -->
    <link rel="stylesheet" href="https://unpkg.com/highlightjs@9.16.2/styles/dark.css">
    <script src="https://unpkg.com/highlightjs@9.16.2/highlight.pack.min.js"></script>

    <!-- Highlight.js Badge -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlightjs-badge@0.1.9/highlightjs/styles/dark.css">
    <script src="https://cdn.jsdelivr.net/npm/highlightjs-badge@0.1.9/highlightjs-badge.min.js"></script>

    <!-- <_php echo("./game-init.php"); _> -->

    <?php
    // Load the JSON file
    $json = file_get_contents("env/urls.json");

    // Decode JSON data to PHP associative array
    $data = json_decode($json, true);

    // Extract URLs
    $commitsURL = $data['commitsURL'] ?? '';
    $openURL = $data['openURL'] ?? '';

    // Load the .env file as an array
    $env = parse_ini_file('.env');

    // Check if the variable exists and assign it to DIR_SNIPPETS
    if (isset($env['DIR_SNIPPETS'])) {
        $DIR_SNIPPETS = $env['DIR_SNIPPETS'];
    } else {
        die("DIR_SNIPPETS not found in .env file.");
    }

    // Set URLs to JavaScript variables in HTML
    $themeJson = json_encode($themeId);
    $showThemeSwitcherJson = $showThemeSwitcher ? 'true' : 'false';
    $showNightDaySwitcherJson = $showNightDaySwitcher ? 'true' : 'false';
    echo "<script>
        window.commitsURL = '{$commitsURL}';
        window.openURL = '{$openURL}';
        window.dirSnippets = '{$DIR_SNIPPETS}';
    </script>
    <script>
        window.config = window.config || {};
        window.config.theme = {$themeJson};
        window.config.showThemeSwitcher = {$showThemeSwitcherJson};
        window.config.showNightDaySwitcher = {$showNightDaySwitcherJson};
    </script>
";
    ?>

</head>

<body>
    <div class="hire-banner bg-yellow-300 w-full py-2 text-center opacity-80 relative" onmouseleave="setTimeout(()=> { this.style.height=0; this.style.padding=0; }, 2000);" style="transition: height 2s;">
        <button type="button" class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-transparent text-2xl leading-none h-6 w-6 flex items-center justify-center opacity-60" aria-label="Dismiss announcement" onclick="this.parentElement.remove();">×</button>
        View Weng's work or hire him → <a target="_blank" href="https://wengindustries.com" class="text-blue-500 underline font-semibold">WengIndustries.com</a>
    </div>
    
    <div id="bottom-bar">
        <button id="jump-curriculum" class="bottom-btn">📗 See topics</button>
        <div id="folder-options-wrapper" class="folder-options-wrapper">
            <div id="folder-options-buttons" class="folder-options-buttons">
                <button id="ai-assist-btn" class="bottom-btn ai-btn">
                    <span class="fa fa-robot"></span>
                    <span class="ai-text">Ask folder</span>
                </button>
                <button id="share-folder-btn" class="bottom-btn share-folder-btn">
                    <span class="fa fa-share-alt"></span>
                    <span class="share-folder-text">Share folder</span>
                </button>
            </div>
            <button id="folder-options-toggle" class="bottom-btn folder-options-toggle">
                <span class="fa fa-chevron-up folder-options-chevron"></span>
                <span class="folder-options-toggle-text">Folder Options</span>
            </button>
        </div>
    </div>
    
    <div class="site-header mx-auto">
        <h1 id="title" class="clickable"><?php include 'env/title.php'; ?></h1>
        <div class="text-blue-800 mt-2 mb-8 clickable" data-toggle="modal" data-target="#promoModal">By Weng (Weng Fei Fung)</div>

        <div class="w-full flex flex-row flex-wrap justify-around gap-2">
            <?php include 'env/description-must.php'; ?>
        </div>
        
        <div class="w-full flex gap-4 md:gap-6 flex-col md:flex-row flex-wrap justify-around gap-2">
            <div>
                <!-- <div><a id="count-notes" href="#explore-curriculum">1457 Notes!</a></div> -->
                <div><span id="count-notes" href="#explore-curriculum"><i class="fas fa-spinner fa-spin"></i> Loading Notes</span></div>
                <div class="mt-2">
                    <?php if(isset($commitsURL) && strlen($commitsURL)>0) { 
                        echo "<a class='text-blue-800 no-underline' id='whats-changed' target='_blank' href='$commitsURL' rel='nofollow'>Git newest notes</a>";
                    }
                    ?>
                </div>
            </div>
             <!-- Prevent Visual Reflow -->
            <div class="more-notes invisible">
                <div class="mn-header flex flex-col justify-center text-center font-medium" onclick="this.parentElement.classList.toggle('mobile-active')">More<br/>Notebooks</div>
                <ul class="mn-links flex flex-row justify-between p-0">

                    <li data-hide-if-url-contains="/devbrain/, codernotes">
                        <a class="text-blue-800" target="_blank" href="https://codernotes.wengindustries.com">💻 Software development / programming / coding</a>
                    </li>

                    <li data-hide-if-url-contains="/bizbrain/, biznotes">
                        <a class="text-blue-800" target="_blank" href="https://biznotes.wengindustries.com">💼 Business &<br/>Tech Startups</a>
                    </li>

                    <li data-hide-if-url-contains="/3dbrain/, 3dnotes">
                        <a class="text-blue-800" target="_blank" href="https://3dnotes.wengindustries.com">🎮 3d Modeling, Videogame Design,<br/>Video and Photo Editing</a>
                    </li>

                    <li data-hide-if-url-contains="/healthbrain/, healthnotes">
                        <a class="text-blue-800" target="_blank" href="https://healthnotes.wengindustries.com">⚕️ Health<br/>Notes</a>
                    </li>
                </ul>
            </div>
        </div>

    </div> <!-- .site-header end -->

    <div class="container-off">

        <div style="clear:both"></div>

        <!-- Wouldn't allow table of contents to z-index on top if you hadn't unset position away from relative -->
        <div class="card card-primary my-8" style="position:unset;">
            <div id="explore-curriculum" class="card-footer">
                <div id="explore-header" class="card-header p-2 flex flex-wrap justify-between items-center align-center">
                    <h2 class="p-0 m-0 text-center inline"><span class="fas fa-book-reader"></span> Open a lesson</h2>
                    <div class="flex flex-row flex-nowrap gap-4 justify-between items-center align-center">
                        <div id="random-note-wrapper" class="random-note-wrapper">
                                        <button id="get-random-note" class="bg-transparent"><h4>🔀 Random Note</h4></button>
                                        <button id="random-note-chevron" class="random-note-chevron" title="Options">
                                            <i class="fas fa-chevron-down"></i>
                                        </button>
                                        <div id="random-note-dropdown" class="random-note-dropdown" style="display: none;">
                                            <label class="random-note-option">
                                                <input type="checkbox" id="prioritize-images" checked>
                                                <span>Prioritize notes with pictures</span>
                                            </label>
                                        </div>
                                    </div>
                        <span id="summary-sharer" class="text-sm clickable hidden" style="margin-top:-3px;" href="javascript:void(0)" onclick='shareTutorial()'>
                            <span class="fas fa-share-alt"></span>
                        </span>
                    </div>
                </div>

                <div class="sides">

                    <div id="side-a" class="card-body side-by-side-possible mb-4 hidden">
                        <div style="position: sticky; top: 0; left: 0; transform: translateX(-25px); z-index: 1;">
                            <h2 id="summary-title-wrapper" class="inline cursor-pointer">
                                <div id="summary-title-inner" class="flex flex-row items-center justify-start gap-4 my-2 bg-white shadow-md border-b border-gray-200 z-10 rounded-tr-lg rounded-br-lg p-1.5">
                                    <span id="summary-collapser">»</span>
                                    <span id="summary-title" onclick="document.querySelector('#summary-collapser').click();"></span>
                                    <button type="button" id="practice-open" class="practice-open" hidden aria-expanded="false" aria-controls="practice-panel">Practice</button>
                                </div>
                            </h2>
                        </div>
                        <div id="summary-outer" style="height: 100%; margin-top: 20px; padding-left: 5px; padding-right: 5px;">
                            <div id="summary-left-bar" onclick="document.getElementById('summary-collapser').click()"></div>
                            <div id="summary-inner" style="height: 100%; resize: none; width:100%;"></div>

                            <section id="practice-panel" class="practice-panel" hidden>
                                <div class="practice-panel__bar">
                                    <h3>Practice this lesson</h3>
                                    <div class="practice-modes" role="group" aria-label="Practice mode">
                                        <button type="button" id="practice-mode-retype" class="is-active" aria-pressed="true">Retype</button>
                                        <button type="button" id="practice-mode-rearrange" aria-pressed="false">Rearrange</button>
                                    </div>
                                    <button type="button" id="practice-close">Close</button>
                                </div>
                                <p class="practice-narrow">
                                    <button type="button" id="practice-narrow-open" aria-expanded="false" aria-controls="practice-scope">Too long to practice? Narrow the scope</button>
                                </p>
                                <p id="practice-scope-status" class="practice-scope-status" hidden></p>
                                <div id="practice-scope" class="practice-scope" hidden>
                                    <div class="practice-scope__choices" role="group" aria-label="Ways to shorten practice">
                                        <button type="button" id="practice-scope-snippets">Code snippets</button>
                                        <button type="button" id="practice-scope-headings">Table of contents</button>
                                        <button type="button" id="practice-scope-highlight">Highlight a passage</button>
                                    </div>
                                    <div id="practice-scope-snippet-list" class="practice-scope__list" hidden></div>
                                    <div id="practice-scope-heading-list" class="practice-scope__list" hidden></div>
                                </div>
                                <p id="practice-empty" class="practice-empty" hidden>This lesson has nothing to practice yet.</p>
                                <div id="practice-retype">
                                    <fieldset class="practice-difficulty">
                                        <legend>Difficulty</legend>
                                        <p id="practice-level-popover" class="practice-level-popover" role="tooltip"></p>
                                        <label title="Highlights matching code as you type"><input type="radio" name="practice-level" value="1" checked> Level <span class="practice-level-key">1</span></label>
                                        <label title="Covers stretches of the code and reveals them briefly"><input type="radio" name="practice-level" value="2"> Level <span class="practice-level-key">2</span></label>
                                        <label title="Covers more of the code for longer"><input type="radio" name="practice-level" value="3"> Level <span class="practice-level-key">3</span></label>
                                    </fieldset>
                                    <div class="practice-columns">
                                        <div>
                                            <h4>Correct code</h4>
                                            <p class="practice-hint">Edit the sample if you want a shorter passage.</p>
                                            <div id="practice-source" class="practice-source" contenteditable="true" spellcheck="false" data-level="1"></div>
                                        </div>
                                        <div>
                                            <h4>Retype it</h4>
                                            <p class="practice-hint">
                                                <button type="button" id="practice-erase">Clear</button>
                                                <span id="practice-accuracy"></span>
                                            </p>
                                            <textarea id="practice-input" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="Type the code from the left"></textarea>
                                        </div>
                                    </div>
                                </div>
                                <div id="practice-rearrange" hidden>
                                    <p class="practice-hint">Drag a line, or use the arrows, until the snippet is back in order.</p>
                                    <button type="button" id="practice-shuffle">Shuffle</button>
                                    <div id="practice-lines" class="practice-lines"></div>
                                    <p id="practice-rearrange-status" class="practice-status"></p>
                                </div>
                            </section>
                        </div>
                    </div>

                    <div id="side-b" class="card-body side-by-side-possible mb-4">
                        <div id="explorer">

                            <div>
                                <?php

                                if(!`which $pcregrep 2>/dev/null`) {
                                    echo "<div class='error'>Error: Your server does not support pcregrep necessary to find text in files. Search will fail. Please contact your server administrator.</div>";
                                }

                                if(count($warningSearchWillFail_Arr)>0) {
                                    echo "<div class='error'>Error: A folder has illegal characters : or /. Search will produce inaccurate results when hitting such folder(s). Please contact your server administrator to rename these folders:
                                    <ul>";
                                    foreach($warningSearchWillFail_Arr as $illegalFolder) {
                                    echo "<li>$illegalFolder</li>";
                                    }
                                    echo "</ul></div>";
                                }

                                ?>

                                <div id="explorer-btns">
                                    <div class="info-flex-child">
                                        <div id="search-container">
                                            <label for="searcher-input">Search:</label>
                                            <!-- autocomplete="new-password" prevents Chrome from autofilling usernames/passwords -->
                                            <input name="search_query" id="searcher-input" inputmode="search" class="toolbar-off" type="search" role="searchbox"  aria-autocomplete="list" placeholder="" autocomplete="new-password" autocorrect="off" autocapitalize="off" spellcheck="false" readonly onfocus="this.removeAttribute('readonly');">
                                        </div>

                                        <div id="search-container-btns">
                                            <button id="searcher-btn-titles" class="override-ios-button-style cursor-pointer">
                                                <i class="fa fa-search"></i> Titles
                                            </button>

                                            <button id="searcher-btn-contents" class="override-ios-button-style cursor-pointer" title="Searches inside notes. Limited to 5 a day.">
                                                <i class="fa fa-search"></i> Contents
                                            </button>
                                            
                                            <button id="searcher-clear" class="border-0 cursor-pointer">
                                                <i class="fa fa-eraser"></i> Clear
                                            </button>
                                        </div>
                                    </div>
                                        
                                        
                                    <div class="info-flex-child">
                                        <button id="expand-all-folders"><span class="fa fa-eye cursor-pointer"> Toggle</button>
                                        <button id="print-btn" class="cursor-pointer"><span class="fa fa-print"> Print</button>
                                    </div>
                                </div>

                                <div id="printer-title"></div>
                                <div class="clear-both"></div>

                                <main id="topics-list">
                                    <!-- Topics tree is injected client-side from cachedResPartial.html (browser-cached via Last-Modified). See assets/js/index.js app.init(). -->
                                </main>

                                <div id="search-results" style="display:none;">
                                <h2>Search Results</h2>
                                <p id="search-content-quota" class="hidden"></p>
                                <div class="contents"></div>
                                </div>

                            </div> <!-- /.container -->

                            <div id="copied-message" style="display:none; position:fixed; border-radius:5px; top:0; right:0; color:green; background-color:rgba(255,255,255,1); padding: 5px 10px 5px 5px;">Copied!</div>
                            
                            <style id="style-toggle-all-expand">
                            </style>

                            <!-- <_php include("./skeleton.php"); _> -->


                    </div>
                </div>
            </div>
        </div>
        <!-- footer wrapping another pair of heading body -->


    </div>


    <!-- Modal -->
    <div class="modal" id="promoModal" style="display:none;">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
        <div class="modal-header" style="border-bottom:none;">
            <h3 class="modal-title mt-0" id="promoModalLabel">Who is Weng</h3>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="modal-body py-0">
            <?php include 'env/whoami.php'; ?>
        </div>
        <div class="modal-footer flex justify-end" style="border-top:none">
            <button type="button" class="btn btn-secondary float-right p-2" data-dismiss="modal">Return</button>
        </div>
        </div>
    </div>
    </div>

    <!-- <_php echo("./game-puzzler.php"); _> -->

    </div>
    <!-- /.container -->

          
    <!-- Modal -->
    <div class="modal" id="shareModal" style="display:none;">
        <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
            <h4 id="shareModalLabel" class="modal-title mt-0">Share this link</h4>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            </div>
            <div class="modal-body">
            <!-- Embed Code Textarea -->
            <textarea id="shareSnippet" class="form-control mx-auto w-full" rows="3"></textarea>
            </div>
            <div class="modal-footer text-center">
                <!-- Copy to Clipboard Button -->
                <button type="button" class="btn btn-default mt-4 p-2" id="copyButton">
                    <i class="fas fa-copy"></i> Copy to Clipboard
                </button>
            </div>
        </div>
        </div>
    </div>

    <!-- Large Prompt Modal -->
    <div class="modal" id="largePromptModal" style="display:none;">
        <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
            <h4 id="largePromptModalLabel" class="modal-title mt-0">Folder Too Large, But No Worries!</h4>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            </div>
            <div class="modal-body">
            <p>The prompt is too large to connect directly to ChatGPT. Please copy the prompt below and paste it into your free ChatGPT (no signup needed):</p>
            <textarea id="largePromptText" class="form-control mx-auto w-full" rows="10" readonly></textarea>
            </div>
            <div class="modal-footer text-center">
                <button type="button" class="btn btn-primary mt-4 p-2 bg-blue-300" id="copyLargePromptButton">
                    <i class="fas fa-copy"></i> 1. Copy Prompt
                </button>
                <button type="button" class="btn btn-success mt-4 p-2 ml-2 bg-blue-200" id="openChatGPTButton">
                    <i class="fas fa-external-link-alt"></i> 2. Open ChatGPT
                </button>
                <button type="button" class="btn btn-secondary mt-4 p-2 ml-2" data-dismiss="modal">Close</button>
            </div>
        </div>
        </div>
    </div>

    <!-- Quiz CSV Modal -->
    <div class="modal" id="quizModal" style="display:none;">
        <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
            <h4 id="quizModalLabel" class="modal-title mt-0">Quiz</h4>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            </div>
            <div class="modal-body">
            <p>Copy the quiz CSV below and paste it into <a href="https://wengindustries.com/app/quiz-gsheet/gsheets/_Special%20-%20User%20Provides/Intake.php" target="_blank" rel="noopener noreferrer">Weng's Quiz app</a> to be quizzed on all the topics in this folder.</p>
            <textarea id="quizCsvText" class="form-control mx-auto w-full" rows="10" readonly></textarea>
            </div>
            <div class="modal-footer text-center">
                <button type="button" class="btn btn-primary mt-4 p-2 bg-blue-300" id="copyQuizCsvButton">
                    <i class="fas fa-copy"></i> 1. Copy CSV
                </button>
                <button type="button" class="btn btn-success mt-4 p-2 ml-2 bg-blue-200" id="openQuizAppButton">
                    <i class="fas fa-external-link-alt"></i> 2. Open Quiz App
                </button>
                <button type="button" class="btn btn-secondary mt-4 p-2 ml-2" data-dismiss="modal">Close</button>
            </div>
        </div>
        </div>
    </div>

    <!-- Share the search -->
    <div id="share-search-title-wrapper" class="hidden">
        <span id="share-search-titles" class="hoverable cursor-pointer" data-toggle="modal" data-target="#shareModal">
            <i>Share the search:&nbsp;</i>
            <span class="fas fa-share-alt"></span>
        </span>
    </div>
    </div> <!-- #searcher-containers -->

    <!-- Table of Contents Button (shows only when TOC content detected) -->
    <button id="toc-toggler" class="toc-button" title="Table of Contents" style="display: none;">
        <i class="fas fa-list"></i>
        <div id="mobile-tap" style="display: none;"></div>
        <div id="toc"></div>
    </button>

    <!-- Mindmap Button (shows only when mindmap content detected) -->
    <button id="mindmap-button" class="mindmap-button" title="Mindmap" style="display: none;">
        <i class="fas fa-project-diagram"></i>
    </button>

    <!-- Mindmap Panel -->
    <div id="mindmap-panel" class="mindmap-panel">
        <div class="mindmap-header">
            <h3>Mindmap</h3>
            <div class="mindmap-controls">
                <button id="mindmap-cycle-type" class="mindmap-control-btn" title="Cycle Type">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <div class="mindmap-divider"></div>
                <button id="mindmap-zoom-out" class="mindmap-control-btn" title="Zoom Out">
                    <i class="fas fa-search-minus"></i>
                </button>
                <button id="mindmap-zoom-reset" class="mindmap-control-btn" title="Reset Zoom">
                    <i class="fas fa-compress"></i>
                </button>
                <button id="mindmap-zoom-in" class="mindmap-control-btn" title="Zoom In">
                    <i class="fas fa-search-plus"></i>
                </button>
                <div class="mindmap-divider"></div>
                <button id="mindmap-reset-positions" class="mindmap-control-btn" title="Reset Node Positions">
                    <i class="fas fa-undo"></i>
                </button>
                <div class="mindmap-divider"></div>
                <button id="mindmap-fullscreen" class="mindmap-control-btn" title="Fullscreen">
                    <i class="fas fa-expand"></i>
                </button>
            </div>
            <button id="mindmap-close" class="mindmap-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div id="mindmap-content" class="mindmap-content">
            <div class="mindmap-empty">No mindmap available for this document.</div>
        </div>
    </div>

    <!-- Fullscreen Modal -->
    <div id="mindmap-fullscreen-modal" class="mindmap-fullscreen-modal">
        <div class="mindmap-fullscreen-header">
            <h3>Mindmap - Fullscreen</h3>
            <div class="mindmap-fullscreen-controls">
                <button id="mindmap-fullscreen-cycle-type" class="mindmap-control-btn" title="Cycle Type">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <div class="mindmap-divider"></div>
                <button id="mindmap-fullscreen-zoom-out" class="mindmap-control-btn" title="Zoom Out">
                    <i class="fas fa-search-minus"></i>
                </button>
                <button id="mindmap-fullscreen-zoom-reset" class="mindmap-control-btn" title="Reset Zoom">
                    <i class="fas fa-compress"></i>
                </button>
                <button id="mindmap-fullscreen-zoom-in" class="mindmap-control-btn" title="Zoom In">
                    <i class="fas fa-search-plus"></i>
                </button>
                <div class="mindmap-divider"></div>
                <button id="mindmap-fullscreen-reset-positions" class="mindmap-control-btn" title="Reset Node Positions">
                    <i class="fas fa-undo"></i>
                </button>
            </div>
            <button id="mindmap-fullscreen-close" class="mindmap-fullscreen-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div id="mindmap-fullscreen-content" class="mindmap-fullscreen-content">
            <div class="mindmap-empty">No mindmap available for this document.</div>
        </div>
    </div>

    <script src="assets/js/vendors/MarkdownItLatex.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/markdown-it@12.0.4/dist/markdown-it.min.js"></script>
    <script src="https://cdn.bootcdn.net/ajax/libs/markdown-it-emoji/1.4.0/markdown-it-emoji.min.js"></script>
    <script src="https://unpkg.com/markdown-it-anchor@8.6.5/dist/markdownItAnchor.umd.js"></script>
    
    <!-- D3.js for interactive mindmaps -->
    <script src="https://d3js.org/d3.v7.min.js"></script>

    <script>
    fetch("./config.json")
    .then(response => response.json())
    .then(data => {
        if(typeof window?.config === "undefined") {
            window.config = {};
        }
        window.config.imgHostedUrl = data.imgHostedUrl;
    });
    </script>
    <script src="assets/js/modal.js"></script>
    <script src="assets/js/encryption.js"></script>
    <script src="assets/js/private-auth.js"></script>
    <script src="assets/js/note-opener.js"></script>
    <script src="assets/js/mindmap.js"></script>
    <script src="assets/js/theme-enhancer.js"></script>
    <script src="assets/js/index.js"></script>
    <script src="assets/js/searchers.js"></script>
    <script src="assets/js/link-popover.js"></script>
    <script src="assets/js/vendors/jquery.highlight-5.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jquery-ui-touch-punch@0.2.3/jquery.ui.touch-punch.min.js"></script>
    <script src="assets/js/diff.js"></script>

    <div id="practice-highlight-modal" class="practice-highlight-modal" hidden>
        <div class="practice-highlight-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="practice-highlight-title">
            <div class="practice-highlight-modal__header">
                <h3 id="practice-highlight-title">Select a passage to practice</h3>
                <p>This is a separate copy of the lesson, not the original article. Drag across the passage you want.</p>
                <div class="practice-highlight-modal__actions">
                    <button type="button" id="practice-highlight-use" disabled>Practice this selection</button>
                    <button type="button" id="practice-highlight-cancel">Cancel</button>
                </div>
            </div>
            <div id="practice-highlight-article" class="practice-highlight-article"></div>
        </div>
    </div>

    <script src="assets/js/game.js"></script>

    <script src="./assets/js/image-modal.js"></script>
</body>

</html>