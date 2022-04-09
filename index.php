<?php
header('Expires: Sun, 01 Jan 2014 00:00:00 GMT');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Cache-Control: post-check=0, pre-check=0', FALSE);
header('Pragma: no-cache');
?><!DOCTYPE html>
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
    <script src="js/diff.js?v=<?php echo time(); ?>"></script>
    <script src="js/app.js?v=<?php echo time(); ?>"></script>

    <script>
    function loadFile() {
      var file = event.target.files[0];

      // Only render plain text files
      // if (!file.type === "text/plain")
          // return;

      var reader = new FileReader();
      reader.readAsText(file);
      reader.onload = function(event) {
          var text = event.target.result;
        $("#old .contents").text(text)
      };

    }; // loadFile
    </script>

    <script src="js/vendors/save-when-stop-typing.js"></script>
    <script>
    $(()=>{
      var saver = SaveWhenStopTyping($("#notes"));
    });
    </script>

    <style>
    #diff:after {
      content: "%";
    }
    </style>
    
</head>
    <body>
        <div class="container-full" style="margin: 10px 5px;">
          <h3 class="title">Retype Notes</h3>

          <div id="sides">

            <aside id="old">
              <div class="header">
                <h4>Template</h4>
                <p>Paste correct text<a href="#" onclick="notes1()">...</a></p>
                <div class="contents" contenteditable="true">This is a <b>sample.</b></div>
              </div>
            </aside>

            <aside id="new" style="padding: 5px;">
              <div class="header">
                <h4>Practice</h4>
                <p>Start typing</p>
                <textarea class="contents" style="width:100%; margin-top:-6px; resize:vertical;"></textarea>
              </div>
            </aside>

            <span style="clear:both;"></span>
          </div> <!-- /sides -->
          

          <!-- <div id="results">
            <label for="coverage">Coverage: </label>
            <span>&nbsp;</span>
            <span id="coverage">0</span>
          </div> -->

          <!-- <div style="float:left; width:100%; height:20px;"></div> -->

          <div style="clear:both"></div>
          <h4>Info</h4>

          <div class="bg-info" style="padding:5px; border-radius:5px; display:inline-block; margin-top:5px; text-align:left; margin-bottom:10px;">
              <span style="font-weight:bold;">Coverage: </span><span id="diff"></span>
          </div><br/>

          <div style="width:100%; height:10px;"></div>
          <textarea id="notes" style="display:block; width:100%; height:50px; resize:none;" placeholder="Your table of contents notes"><?php include("data/data.txt"); ?></textarea>

          <br/>
          <div style="float:left; margin-top:5px; text-align:left;">
            <h4>File System</h4>
            <button onclick='$("#load-file-input").click();'>Load file</button><input type="file" id="load-file-input" onchange="loadFile()" style="display:none;"/><br>
          </div>

        </div> <!-- /.container -->
        
        <!-- Designer: FontAwesome -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.5.0/css/font-awesome.css">
       
        <!-- Bootstrap JS -->
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js"></script>
        

    </body>
</html>