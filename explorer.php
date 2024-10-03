<?php
  ini_set('display_errors', 1);
  ini_set('display_startup_errors', 1);
  error_reporting(E_ALL);

  header("Cache-Control: no-cache, no-store, must-revalidate");
  header("Pragma: no-cache");
  header("Expires: 0");

  // Env variables
  include("./env/all/pcregrep.php");
  include("./env/dir-snippets.php");

  // Configurable
  $DEFAULT_THUMBNAIL_SIZE = "90x90"; // height x width
  $warningSearchWillFail_Arr = [];
?><!DOCTYPE html>
<html lang="en">
  <head>
   <title>Snippets Mastery</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">

    <!-- jQuery and Bootstrap  -->
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
    <script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.1.2/handlebars.min.js"></script>

    <!-- Autoexpand, Markdown (dependencies)-->
    <script src="assets/js/vendors/autoExpand/autoExpand.js"></script>
    <!-- <script src="https://cdn.jsdelivr.net/npm/markdown-it@13.0.1/dist/markdown-it.min.js"></script> -->
    <script src="assets/js/vendors/MarkdownItLatex.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/markdown-it@12.0.4/dist/markdown-it.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/markdown-it-emoji/1.4.0/markdown-it-emoji.min.js"></script>
    <script src="https://unpkg.com/markdown-it-anchor@8.6.5/dist/markdownItAnchor.umd.js"></script>

        
    <link href="assets/css/explorer.css?v=1003434" rel="stylesheet">
    <link href="assets/css/multistates.css?v=1003434" rel="stylesheet">
    <link href="assets/css/thermos.css?v=1003434" rel="stylesheet">

    <script>
        window.dirSnippets = "<?php echo $DIR_SNIPPETS;?>";
    </script>

    <?php
    // TODO:
    // https://stackoverflow.com/questions/33850412/merge-javascript-objects-in-array-with-same-key
    // ggl - array of objects same keys merge

      // function rglob($pattern, $flags = GLOB_ONLYDIR) {
      //   global $warningSearchWillFail_Arr;

      //   $files = glob($pattern, $flags); 
      //   foreach (glob(dirname($pattern).'/*', GLOB_ONLYDIR) as $dir) {
      //       $files = array_merge($files, rglob($dir.'/'.basename($pattern), $flags));
      //       $folderName = basename($dir);
      //       if(strpos($folderName, ":")!==false || strpos($folderName, "/")!==false) {
      //         array_push($warningSearchWillFail_Arr, $folderName);
      //       }
      //       // die();
      //   }
      //   return $files;
      // } // rglob


      function rglob($pattern, $flags = 0) {
        global $warningSearchWillFail_Arr;
    
        $files = glob($pattern, $flags); 
        foreach (glob(dirname($pattern).'/*', GLOB_ONLYDIR) as $dir) {
            $files = array_merge($files, rglob($dir.'/'.basename($pattern), $flags));
            $folderName = basename($dir);
            if (strpos($folderName, ":") !== false || strpos($folderName, "/") !== false) {
                array_push($warningSearchWillFail_Arr, $folderName);
            }
        }
        
        // Filter files based on extensions or if dir
        // $filteredFiles = [];
        // foreach ($files as $file) {
        //     if (is_dir($file) || (in_array(pathinfo($file, PATHINFO_EXTENSION), ['md', 'json']) && !preg_match('/\.no\.(md|json)$/', $file))) {
        //     // if (is_dir($file) || in_array(pathinfo($file, PATHINFO_EXTENSION), ['md', 'json'])) {
        //         array_push($filteredFiles, $file);
        //     }
        // }

        $filteredFiles = []; // Initialize an empty array to store filtered files

        // foreach ($files as $file) {
        //     // Check if the file is a directory
        //     $isDirectory = is_dir($file);

        //     // Get the file extension
        //     $fileExtension = pathinfo($file, PATHINFO_EXTENSION);

        //     // Check if the file has a valid extension (md or json)
        //     // $isValidExtension = in_array($fileExtension, ['md', 'json']);
        //     $isValidExtension = in_array($fileExtension, ['md']);

        //     // Check if the file name does not end with '.no.md' or '.no.json'
        //     $isNotExcluded = !preg_match('/\.no\.md$/', $file) && !preg_match('/\.hide\.md$/', $file);

        //     // If the file is not a directory and has a valid, non-excluded extension, add it to the filtered list
        //     if ($isDirectory && $isValidExtension && $isNotExcluded) {
        //         $filteredFiles[] = $file;
        //     }
        // }
        // $filteredFiles = [];
        // foreach ($files as $file) {
        //     if (is_dir($file) || (in_array(pathinfo($file, PATHINFO_EXTENSION), ['md', 'json']) && !preg_match('/\.no\.(md|json)$/', $file))) {
        //     // if (is_dir($file) || in_array(pathinfo($file, PATHINFO_EXTENSION), ['md', 'json'])) {
        //         $filteredFiles[] = $file;
        //     }
        // }
        $filteredFiles = [];
        foreach ($files as $file) {
          // if directory, is acceptable file extension, though no secondary extension .hide or .no
            if (is_dir($file) || (in_array(pathinfo($file, PATHINFO_EXTENSION), ['md', 'json']) && !preg_match('/\.(no|hide)\.md$/', $file))) {
            // if (is_dir($file) || in_array(pathinfo($file, PATHINFO_EXTENSION), ['md', 'json'])) {
                $filteredFiles[] = $file;
            }
        }

        // $filteredFiles = [];
        // foreach ($files as $file) {
        //     // Check if the file is a directory or if the filename starts with a dot
        //     if (is_dir($file) || $file[0] === '.') {
        //         continue; // Skip the file if it's a directory or starts with a dot
        //     }

        //     // Get the file extension
        //     $extension = pathinfo($file, PATHINFO_EXTENSION);

        //     // Check if the file ends with .no.md or does not end with .md
        //     // Don't hide sortspec.md or else the JS can't detect the file's content and perform custom sort
        //     // if ( $extension === 'md' && !preg_match('/\.no\.md$/', $file) && !preg_match('/sortspec\.md$/', $file) ) {
        //     if ( $extension === 'md' && !preg_match('/\.no\.md$/', $file)  ) {
        //         array_push($filteredFiles, $file);
        //     }
        // } // foreach
        
        return $filteredFiles;
    } // rglob

      $dirs = rglob("$DIR_SNIPPETS?*");
      $lookup_metas = [];
      $sortSpec = "";

      function map_tp_dec($path) { // trailing parsed (removed preceding snippet/ and may remove ending slash /) and decorated object
        // var_dump($path);
        global $DIR_SNIPPETS;
        global $DEFAULT_THUMBNAIL_SIZE;
        global $lookup_metas;
        global $sortspec;
        
        // tp trailing path?
        $path_tp = substr($path, strlen($DIR_SNIPPETS)); // trailing parsed

        // Assure trailing forward slash /
        // $lastChar = $path[strlen($path)-1];
        // $path = ($lastChar==='/') ? $path : "$path/";
        // $desc = $thumbnail = $gotos = null;
        

        $decorated = [
          "current" => "",
          "path" => $path,
          "path_tp" => $path_tp,
          "next" => []
        ];
        //var_dump($path);
        //echo "<br/>";

        $lastChars = substr($path, -11); // In case of a .no.md that you want to ignore in the learning app

        // Btw, .no.json and .no.md files had already been stripped away
        if (stripos($lastChars, ".json") !== false || stripos($lastChars, ".md") !== false) { 
          // $lookup_metas[$path] = @json_decode(file_get_contents($path), true);
          $lookup_metas[$path] = array("pathTP"=>$path_tp);
          if (stripos($lastChars, "sortspec.md") !== false) { 
            // $lookup_metas[$path] = @json_decode(file_get_contents($path), true);
            $sortspec = file_get_contents($path);
          }
        }
        
        return $decorated;
      } // map_tp_dec
      $dirs = array_map("map_tp_dec", $dirs);

      echo "<script>";
      echo "var folders = " . json_encode($dirs) . ",";
      echo "lookupMetas = " . json_encode($lookup_metas) . ",";
      echo "sortspecs = " . json_encode($sortspec) . ";";
      echo "</script>";

      // var_dump($lookup_metas);
      // die();

      // var_dump($dirs);
      // die();
    ?>

    <script>
    <?php
        echo 'var realpath = "' . dirname(realpath("explorer.php")) . '"';
    ?>
    </script>

    <script src="env/icons.js"></script>
    <script src="assets/js/common.js"></script>
    <script src="assets/js/explorer.js?v=1003433"></script>
    <script src="assets/js/multistates.js"></script>

    <link href="https://cdnjs.cloudflare.com/ajax/libs/tufte-css/1.8.0/tufte.min.css" rel="stylesheet">
    <?php include("./partials/tufte-override.php"); ?>
</head>
    <body style="padding-right:5px">
        <div class="container-off">
        
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

          <!-- <div style="width:1px; height:10px; clear:both;"></div> -->
          <!-- <div id="searcher-containers" style="float:right;"> -->

            <div id="explorer-btns">
              <div class="info-flex-child">
                  <div id="search-container">
                    <label for="searcher">Search:</label>
                    <input id="searcher" onkeyup="checkIfEmptiedSearch(event, $('#searcher-btn'))" class="toolbar" type="text" placeholder="" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
                  </div>

                  <div id="search-container-btns">
                    <button id="searcher-2-btn" class="override-ios-button-style" 
                      onclick="searchAllTitles($('#searcher').val(), ()=>{ 
                        $('#shareSnippet').val((window.location.hostname + window.location.pathname).replaceAll('explorer.php', '') + `?search-titles=${encodeURI($('#searcher-2').val())}`);
                        document.getElementById('share-search-title-wrapper').classList.remove('hidden')
                      }); " 
                      style="cursor: pointer;"
                    ><i class="fa fa-search" style="cursor: pointer;"></i> Titles</button>

                    <button id="searcher-btn" class="override-ios-button-style" onclick="searchAllContents($('#searcher').val());" style="cursor: pointer;"><i class="fa fa-search" style="cursor: pointer;"></i> Contents</button>
                    
                    <button onclick="if(confirm('Clear Search?')) clearSearcher($('#searcher'));" style="cursor: pointer; border:0;"><i class="fa fa-eraser" style="cursor: pointer;"></i> Clear</button>
                  </div>
              </div>
                  
                  
              <div class="info-flex-child">
                  <button id="toggle-all-responsive" onclick="toggleAllExpand();"><span class="fa fa-eye cursor-pointer"> Toggle</button>
                  <button onclick="window.print();"><span class="fa fa-print" style="cursor: pointer;"> Print</button>
             </div>
            </div>
            
            <!-- <div style="clear:both;"></div> -->
            <div id="share-search-title-wrapper" class="hidden" 
              style="margin-top:10px; text-align:right; position:fixed; right:10px; bottom:0; padding:0; background-color:white;">
              <a href="javascript:void()" onclick='$("#shareModal").modal("show");'>
                <i>Share the search:</i>
                <span class="fas fa-share-alt"></span>
              </a>
            </div>
          </div> <!-- #searcher-containers -->
          
          <!-- Modal -->
          <div class="modal fade" id="shareModal" tabindex="-1" role="dialog" aria-labelledby="shareModalLabel">
            <div class="modal-dialog" role="document">
              <div class="modal-content">
                <div class="modal-header">
                  <h4 class="modal-title" id="shareModalLabel">Share this link</h4>
                  <button type="button" class="close" data-dismiss="modal" aria-label="Close" style="position:absolute; top:10px; right:10px;">
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div class="modal-body">
                  <!-- Embed Code Textarea -->
                  <textarea id="shareSnippet" class="form-control" rows="3"></textarea>
                </div>
                <div class="modal-footer">
                  <!-- Copy to Clipboard Button -->
                  <button type="button" class="btn btn-default" id="copyButton">
                    <i class="fas fa-copy"></i> Copy to Clipboard
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div id="printer-title"></div>
          <div style="clear:both;"></div>

          <main id="target">
          </main>

          <div id="search-results" class="deemp-fieldset" style="display:none;">
            <legend style="font-size:15.75px;"><span class="fa fa-search"></span> Search Results</legend>
            <div class="contents"></div>
          </div>

        </div> <!-- /.container -->

        <div id="copied-message" style="display:none; position:fixed; border-radius:5px; top:0; right:0; color:green; background-color:rgba(255,255,255,1); padding: 5px 10px 5px 5px;">Copied!</div>
        
        <style id="style-toggle-all-expand">
        </style>

        <!-- Highlighter -->
        <script src="assets/js/vendors/jquery.highlight.js"></script>

        <!-- Designer: Open Sans, Lato, FontAwesome, Waypoints, Skrollr, Pixel-Em-Converter -->
        <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,300|Open+Sans+Condensed:300" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.9.0/css/all.min.css">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/waypoints/4.0.0/jquery.waypoints.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/skrollr/0.6.30/skrollr.min.js"></script>
        <script src="https://raw.githack.com/filamentgroup/jQuery-Pixel-Em-Converter/master/pxem.jQuery.js"></script>
        
        <!-- Rendering: Handlebars JS, LiveQuery, Sprintf JS -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.0.5/handlebars.js"></script>
        <script src="assets/js/vendors/livequery.js"></script>
        <script src="https://raw.githack.com/azatoth/jquery-sprintf/master/jquery.sprintf.js"></script>
        
        <!-- Compatibility: Modernizr, jQuery Migrate (check browser) -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min.js"></script>
        <script src="https://code.jquery.com/jquery-migrate-1.2.1.min.js"></script>
        
        <!-- Mobile: jQuery UI, jQuery UI Touch Punch -->
        <link href="https://code.jquery.com/ui/1.11.3/themes/ui-lightness/jquery-ui.css" rel="stylesheet"/>
        <script src="https://code.jquery.com/ui/1.11.4/jquery-ui.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.3/jquery.ui.touch-punch.min.js"></script>
       
        <!-- Bootstrap JS -->
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js"></script>
        
        <!-- Friendlier API: ListHandlers, Timeout -->
        <script src="https://raw.githack.com/Inducido/jquery-handler-toolkit.js/master/jquery-handler-toolkit.js"></script>
        <script src="https://raw.githack.com/tkem/jquery-timeout/master/src/jquery.timeout.js"></script>
        <!-- Autosize textarea
            https://gomakethings.com/automatically-expand-a-textarea-as-the-user-types-using-vanilla-javascript/
        -->
        <script src="assets/js/vendors/autoExpand/autoExpand.js"></script>

        <!-- Highlighter -->
        <script src="assets/js/vendors/jquery.highlight.js"></script>
        
    </body>
</html>