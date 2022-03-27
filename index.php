<!DOCTYPE html>
<?php /*
Setup compass, npm, and livereload
---
1. Run Command: compass init
2. Create css and css/scss directories then add them to config.rb
3. Run command: npm init
4. Edit package.json's settings
  "watch": {
    "js_docs_watch": {
      "patterns": [
        "js"
      ],
      "extensions": "js",
      "quiet": false
    }
  }
4. Edit package.json's scripts:
    "watch": "concurrently 'compass watch ./' 'livereload .' 'watch \"npm run js_docs_run\" js/'",
    "js_docs_run": "jsdoc js/*"
5. Run localhost:
    - http-server command
        Drawback: Node does not support Php so no Php extension or code runs. Ignores index.php)
    - MAMP
        a. npm run watch
        b. Activate Livereload browser extension.
*/ ?>
<html lang="en">
  <head>
   <title>Retype Notes</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">

    <!-- jQuery and Bootstrap  -->
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
    <script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
    <script src="js/vendors/jquery.highlight-5.js"></script>

    <link href="css/index.css?v=<?php echo time(); ?>" rel="stylesheet">
    <script src="js/app.js?v=<?php echo time(); ?>"></script>
    
</head>
    <body>
        <div class="container-full" style="margin: 10px 5px;">
          <h3 class="title">Retype Notes</h3>

          <div id="sides">

            <aside id="new">
              <div class="header">
                <h4>New</h4>
                <p>Just reword the old notes</p>
                <div class="contents" contenteditable="true"></div>
              </div>
            </aside>

            <aside id="old">
              <div class="header">
                <h4>Old</h4>
                <p>Paste notes here<a href="#" onclick="notes1()">...</a></p>
                <div class="contents" contenteditable="true">This is a <b>sample.</b></div>
              </div>
            </aside>

            <span style="clear:both;"></span>
          </div> <!-- /sides -->

          <!-- <div id="results">
            <label for="coverage">Coverage: </label>
            <span>&nbsp;</span>
            <span id="coverage">0</span>
          </div> -->

        </div> <!-- /.container -->
        
        <!-- Designer: FontAwesome -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.5.0/css/font-awesome.css">
       
        <!-- Bootstrap JS -->
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js"></script>
        

    </body>
</html>