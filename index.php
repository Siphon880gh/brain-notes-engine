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
?><!DOCTYPE html>
<html lang="en">

<head>
    <title><?php include 'env/title-long.php'; ?></title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php include("env/description-meta.php"); ?>

    <!-- CSS Assets -->
    <link href="assets/css/index.css" rel="stylesheet">
    <link href="assets/css/modal.css" rel="stylesheet">

    <!-- <link href="assets/css/game.css" rel="stylesheet"> -->
    <!-- <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" /> -->

    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>

    <!-- jQuery UI -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/themes/base/jquery-ui.min.css" rel="stylesheet"/>

    <!-- Designer: FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.9.0/css/all.min.css">

    <script src="https://cdn.tailwindcss.com"></script>
    <script>
    tailwind.config = {
        corePlugins: {
            preflight: false
        }
    }
    </script>

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
    echo "<script>
        window.commitsURL = '{$commitsURL}';
        window.openURL = '{$openURL}';
        window.dirSnippets = '{$DIR_SNIPPETS}';
    </script>";
    ?>
</head>

<body>
    <div id="toc-toggler">
        <div id="mobile-tap">📖 TOC</div>
        <div id="toc"></div>
    </div>
    
    <div id="jump-curriculum">
        📗 Jump to Topics
    </div>

    <div class="site-header mx-auto">
        <h1 id="title" class="clickable"><?php include 'env/title.php'; ?></h1>

        <div class="w-full flex flex-row flex-wrap justify-around gap-2">
            <?php include 'env/description-must.php'; ?>
        </div>
        
        <div class="w-full flex gap-4 md:gap-6 flex-col md:flex-row flex-wrap justify-around gap-2">
            <div>
                <!-- <div><a id="count-notes" href="#explore-curriculum">1457 Notes!</a></div> -->
                <div><span id="count-notes" href="#explore-curriculum">Loading Notes</span></div>
                <a class="text-blue-800 no-underline" id="whats-changed" target="_blank" href="<?php echo $commitsURL; ?>" rel="nofollow">See what's changed</a>
                <div class="text-blue-800 clickable" data-toggle="modal" data-target="#promoModal">By Weng (Weng Fei Fung)</div>
            </div>
             <!-- Prevent Visual Reflow -->
            <div class="more-notes invisible">
                <div class="mn-header flex flex-col justify-center text-center font-medium">More<br/>Notebooks</div>
                <ul class="mn-links flex flex-row justify-between p-0">

                    <li data-hide-if-url-contains="/devbrain/">
                        <a class="text-blue-800" target="_blank" href="../devbrain">💻 Software development / programming / coding</a>
                    </li>

                    <li data-hide-if-url-contains="/bizbrain/">
                        <a class="text-blue-800" target="_blank" href="../bizbrain">💼 Business &<br/>Tech Startups</a>
                    </li>

                    <li data-hide-if-url-contains="/3dbrain/">
                        <a class="text-blue-800" target="_blank" href="../3dbrain">🎮 3d Modeling, Videogame Design,<br/>Video and Photo Editing</a>
                    </li>

                    <li data-hide-if-url-contains="/healthbrain/">
                        <a class="text-blue-800" target="_blank" href="../healthbrain">⚕️ Health<br/>Notes</a>
                    </li>
                </ul>
            </div>
        </div>

    </div> <!-- .site-header end -->

    <div class="container">

        <!-- <_php include("./game-retyper.php"); _> -->

        <div style="clear:both"></div>

       <!-- <_php echo("./game-rearranger.php"); _> -->


        <!-- Wouldn't allow table of contents to z-index on top if you hadn't unset position away from relative -->
        <div class="card card-primary my-8" style="position:unset;">
            <div id="explore-curriculum" class="card-footer">
                <div id="explore-header" class="card-header p-2 flex flex-wrap justify-between items-center align-center">
                    <h2 class="p-0 m-0 text-center inline"><span class="fas fa-book-reader"></span> Open a lesson</h2>
                    <div class="flex flex-row flex-nowrap gap-4 justify-between items-center align-center">
                        <button id="get-random-note" class="bg-transparent"><h3>🔀 Random Note</h3></button>
                        <span id="summary-sharer" class="text-sm clickable hidden" style="margin-top:-3px;" href="javascript:void(0)" onclick='shareTutorial()'>
                            <span class="fas fa-share-alt"></span>
                        </span>
                        <span id="scroll-to-item" class="text-sm clickable hidden" style="margin-top:-3px;" href="javascript:void(0)" onclick='goToItem()'>
                            <span class="fas fa-angle-down"></span>
                        </span>
                    </div>
                </div>

                <!-- <_php include("./game-copy-to-practice.php"); _> -->
                
                <div class="sides">

                    <div id="side-a" class="card-body side-by-side-possible mb-4 hidden">
                        <div style="position: sticky; top: 0; left: 0; z-index: 1;">
                            <h2 id="summary-title-wrapper" class="inline cursor-pointer">
                            <div class="flex flex-row items-center align-center justify-start gap-4 my-2 bg-white">
                                <span id="summary-collapser">»</span>
                                <span id="summary-title" onclick="document.querySelector('#summary-collapser').click();"></span>
                            </div>
                            </h2>
                        </div>
                        <div id="summary-outer" style="height: 100%; margin-top: 20px; padding-left: 5px; padding-right: 5px;">
                            <div id="summary-left-bar" onclick="document.getElementById('summary-collapser').click()"></div>
                            <div id="summary-inner" style="height: 100%; resize: none; width:100%;"></div>

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
                                            <input id="searcher-input" class="toolbar" type="text" placeholder="" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
                                        </div>

                                        <div id="search-container-btns">
                                            <button id="searcher-btn-titles" class="override-ios-button-style cursor-pointer">
                                                <i class="fa fa-search"></i> Titles
                                            </button>

                                            <button id="searcher-btn-contents" class="override-ios-button-style cursor-pointer">
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
                                    <?php include("./cachedResPartial.php"); ?>
                                </main>

                                <div id="search-results" style="display:none;">
                                <h2>Search Results</h2>
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

    <!-- Share the search -->
    <div id="share-search-title-wrapper" class="hidden">
        <span id="share-search-titles" class="hoverable cursor-pointer" data-toggle="modal" data-target="#shareModal">
            <i>Share the search:&nbsp;</i>
            <span class="fas fa-share-alt"></span>
        </span>
    </div>
    </div> <!-- #searcher-containers -->

    <!-- <_php echo("./game-error.php"); _> -->

    <!-- <_php echo("./game-fogs.php"); _> -->

    <script src="assets/js/vendors/MarkdownItLatex.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/markdown-it@12.0.4/dist/markdown-it.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/markdown-it-emoji/1.4.0/markdown-it-emoji.min.js"></script>
    <script src="https://unpkg.com/markdown-it-anchor@8.6.5/dist/markdownItAnchor.umd.js"></script>

    <script src="assets/js/modal.js"></script>
    <script src="assets/js/note-opener.js"></script>
    <script src="assets/js/index.js"></script>
    <script src="assets/js/searchers.js"></script>
    <!-- <script src="assets/js/game.js"></script> -->

</body>

</html>