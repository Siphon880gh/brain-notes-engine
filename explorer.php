<?php
  ini_set('display_errors', 1);
  ini_set('display_startup_errors', 1);
  error_reporting(E_ALL);

  header("Cache-Control: no-cache, no-store, must-revalidate");
  header("Pragma: no-cache");
  header("Expires: 0");

  // Env variables

  include("./env/pcregrep.php");
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
        
    <link href="assets/css/explorer.css?v=<?php echo time(); ?>" rel="stylesheet">
    <link href="assets/css/multistates.css?v=<?php echo time(); ?>" rel="stylesheet">
    <link href="assets/css/thermos.css?v=<?php echo time(); ?>" rel="stylesheet">


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
        $filteredFiles = [];
        foreach ($files as $file) {
            if (is_dir($file) || (in_array(pathinfo($file, PATHINFO_EXTENSION), ['md', 'json']) && !preg_match('/\.no\.(md|json)$/', $file))) {
            // if (is_dir($file) || in_array(pathinfo($file, PATHINFO_EXTENSION), ['md', 'json'])) {
                $filteredFiles[] = $file;
            }
        }
        
        return $filteredFiles;
    } // rglob

      $dirs = rglob("$DIR_SNIPPETS?*");
      $lookup_metas = [];

      function map_tp_dec($path) { // trailing parsed (removed preceding snippet/ and may remove ending slash /) and decorated object
        // var_dump($path);
        global $DIR_SNIPPETS;
        global $DEFAULT_THUMBNAIL_SIZE;
        global $lookup_metas;
        
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

        $lastFiveChars = substr($path, -5); // Changed to last 6 chars in case of a .no.md that you want to ignore in the learning app


        if (stripos($lastFiveChars, ".json") !== false) { // Btw, .no.json files had already been stripped away
          $lookup_metas[$path] = @json_decode(file_get_contents($path), true);
          //var_dump( $lookup_metas[$path]);
          //die();
        }

        // var_dump($lookup_metas);
        // die();
        if (stripos($lastFiveChars, ".md") !== false) { // Btw, .no.md files had already been stripped away
          // var_dump($lookup_metas);
          // die();
          if(!isset($lookup_metas[$path]["summary"]))
            $lookup_metas[$path]["summary"] = array();
          $file_contents = "";
          $file_contents = @file_get_contents($path);
          array_push($lookup_metas[$path]["summary"], $file_contents);
          // var_dump($lookup_metas);
          // die();
          // $lookup_metas[$path]["summary"] .= file_get_contents($path . "+meta.txt");
        }

        // die();
        
        return $decorated;
      } // map_tp_dec
      $dirs = array_map("map_tp_dec", $dirs);

      echo "<script>";
      echo "var folders = " . json_encode($dirs) . ",";
      echo "ori = folders, ";
      echo "lookupMetas = " . json_encode($lookup_metas) . ";";
      echo "</script>";

      // var_dump($dirs);
      // die();
    ?>

    <script>
    <?php
        echo 'var realpath = "' . dirname(realpath("explorer.php")) . '"';
    ?>
    </script>

    <script src="assets/js/explorer.js"></script>
    <script src="assets/js/multistates.js"></script>

</head>
    <body>
        <div class="container">
        
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

          <div style="width:1px; height:10px; clear:both;"></div>
          <div id="searcher-containers" style="float:right; padding:15px;">

            <div id="searcher-container" style="float:right; margin-top:5px;">
                  <form action=""></form>
                  <!-- <label for="alpha-strip" style="font-weight:400;">Text:</label> -->
                  <input id="searcher" onkeyup="checkSearcherSubmit(event, $('#searcher-btn'))" class="toolbar" type="text" placeholder="" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" style="width:180px;">
                  <button id="searcher-btn" class="override-ios-button-style" onclick="doSearcher();" style="cursor: pointer;"><span class="fa fa-search" style="cursor: pointer;"></span> Find content</button>
                  <span>&nbsp;</span>
                  <span class="mobile-flush-top">
                    <button onclick="if(confirm('Clear Find text field?')) clearSearcher();" style="cursor: pointer; border:0;"><span class="fa fa-eraser" style="cursor: pointer;"> Clear</button>
                    <button onclick="toggleAllExpand();" style="cursor: pointer; border:0;"><span class="fa fa-eye" style="cursor: pointer;"> Toggle All</button>
                    <button onclick="window.print();" style="cursor: pointer; border:0;"><span class="fa fa-print" style="cursor: pointer;"> Print</button>
                  </span>
            </div>
            
            <div id="searcher-container-2" style="float:right; margin-top:5px;">
                  <form action=""></form>
                  <!-- <label for="alpha-strip" style="font-weight:400;">Text:</label> -->
                  <input id="searcher-2" onkeyup="checkSearcherSubmit(event, $('#searcher-2-btn'))"class="toolbar" type="text" placeholder="" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" style="width:180px;">
                  <button id="searcher-2-btn" class="override-ios-button-style" onclick="doSearcher2($('#searcher-2').val());" style="cursor: pointer;"><span class="fa fa-search" style="cursor: pointer;"></span> Find topic</button>
            </div>
            <div style="clear:both;"></div>
          </div> <!-- #searcher-containers -->

          <div id="printer-title"></div>
          <br style="clear:both;"/><br/>

          <main id="target">
          </main>

          <br/>
          <fieldset id="search-results" class="deemp-fieldset" style="display:none;">
            <legend style="font-size:15.75px;"><span class="fa fa-search"></span> Search Results</legend>
            <div class="contents"></div>
          </fieldset>

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