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
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
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

    // Always resize
    setInterval(()=>{
      if($("#old .contents").css("display")!=="none" || $("#old .contents").css("visibility")!=="hidden")
        $("#new .contents").height( $("#old .contents").height() );
    }, 200);
    </script>

    <script src="js/vendors/save-when-stop-typing.js"></script>
    <script>
    $(()=>{
      var saver = SaveWhenStopTyping($("#notes"));
    });
    </script>

</head>
    <body>
        <div class="container-full" style="margin: 10px 5px;">
          <h1 class="title">Retype Notes</h1>

          <div id="sides">

            <aside id="old">
              <div class="header">
                <h2>Template</h2>
                <p>Paste correct text<a href="#" onclick="notes1()">...</a></p>
                <div class="contents" contenteditable="true">This is a <b>sample.</b></div>
              </div>
            </aside>

            <aside id="new" style="padding: 5px;">
              <div class="header">
                <h2>Retype</h2>
                <p>Practice <i class="fa fa-eraser clickable" onclick="if(confirm('Erase practice text?')) { $('#new .contents').val(''); $('.highlight').removeClass('highlight'); }"></i></p>
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
          <h2><span class="fa fa-puzzle-piece"></span> Learn by resorting lines</h2>
          <p>Open now: <button class="btn btn-secondary btn-sm" onclick='if($("#old .contents").length===0) alert("Error: You need to have text in the template area"); else $("#modal-puzzle").modal("show");'>Resort</button></p>

          <div style="clear:both"></div>
          <h2><span class="fa fa-calculator"></span> Stats</h2>

          <div class="bg-info-off" style="padding:5px; border-radius:5px; display:inline-block; margin-top:5px; text-align:left; margin-bottom:10px;">
              <span style="font-weight:bold;">Programming Language Accuracy: </span><span id="diff" class="bg-info"></span>
          </div>

          <h2><span class="fa fa-book-reader"></span> Notes</h2>
          <p>Interested in retyping text surrounded with ```:<br/><button class="btn btn-secondary btn-sm" onclick="copyOver();">Copy over</button></p>
          <fieldset class="deemp-fieldset">
            <textarea id="summary-inner" style="height: 467.989px; resize: none; width:100%;"></textarea>
          </fieldset>

          <h2><span class="fa fa-microscope"></span> Explorer</h2>
          <iframe style="padding:5px; border-radius:5px; display:inline-block; margin-top:5px; text-align:left; margin-bottom:10px; width:100%;"
          src="explorer.php">
          </iframe>

        <!-- Modal -->
        <div id="modal-puzzle" class="modal fade" role="dialog">
          <div class="modal-dialog">

            <!-- Modal content-->
            <div class="modal-content">
              <div class="modal-header">
                <h2 class="modal-title">Resort Lines</h2>
              </div>
              <div class="modal-body">
                <div class="list-group">
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
              </div>
            </div>

          </div>
        </div>
        <script id="resort-lines">
          $(document).on("show.bs.modal", "#modal-puzzle", ()=> {
            $("#modal-puzzle .list-group").html("");
            var $template = $("#old .contents");
            var lines = $template.find("div").toArray(); // newlines are actually div's in contenteditable
            if(lines.length===0) {
              lines = $template.text().split("\n");
              // debugger;
            }
            // var template = $template.html();
            // var lines = template.split("\n");
            // debugger;
            var listGroupEl = document.querySelector("#modal-puzzle .list-group");
            for(var i = 0; i<lines.length; i++) {
              var line = lines[i];
              if(typeof line !== "string") line = line.textContent;
              var listGroupItemEl = document.createElement("div");
              listGroupItemEl.classList = "list-group-item";
              listGroupItemEl.textContent = line;
              listGroupItemEl.setAttribute("data-correct-order", i);
              listGroupEl.appendChild(listGroupItemEl);
              console.log("line: " + line)
            }
            $("#modal-puzzle .list-group").sortable();
          });
        </script>


          <!-- <div class="spacer"></div> -->
          <!-- <textarea id="notes" style="display:block; width:100%; height:50px; resize:none;" placeholder="Your table of contents notes"><?php include("data/data.txt"); ?></textarea> -->
          <!-- <div class="spacer"></div> -->

          <!-- <div style="float:left; margin-top:5px; text-align:left;">
            <h2>File System</h2>
            <button onclick='$("#load-file-input").click();'>Load file</button><input type="file" id="load-file-input" onchange="loadFile()" style="display:none;"/><br>
          </div> -->

        </div> <!-- /.container -->
        
        <!-- Designer: FontAwesome -->
        <!-- <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.5.0/css/font-awesome.css"> -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.9.0/css/all.min.css">
       
        <!-- jQuery UI, Bootstrap JS -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/themes/base/jquery-ui.min.css"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.3/jquery.ui.touch-punch.min.js"></script>
        <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js" integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous"></script>

        <!-- Autosize textarea
            https://gomakethings.com/automatically-expand-a-textarea-as-the-user-types-using-vanilla-javascript/
        -->
        <script src="js/vendors/autoExpand/autoExpand.js"></script>
        <script id="auto-resize-textarea">
            document.querySelector("#summary-inner").addEventListener("input", (event) => {
                autoExpand(event.target);
            });

            window.autoExpandNow = () => {
                autoExpand(document.querySelector("#summary-inner"));
            }
            autoExpandNow();
        </script>

        <script id="copyNotesToTemplate">
        function copyOver() {
          var $summary = $("#summary-inner");
          var summary = $summary.val();
          if($summary.val().length) {
            var $template = $("#old .contents");
            var code = Array.from(summary.matchAll(/```(.*?)```/gi)).map(el => el[1]);
            // debugger;
            
            // If text has ```___```, then get all text between those backticks, otherwise just get all of the text
            if(code.length) {
              var code = code.join("\n");
              $template.text(code);
              $template.trigger("input");
            } else {
              $template.text(summary);
              $template.trigger("input");
            }
          } else {
            alert("Error: No summary loaded yet. Find a lesson to retype from the curriculum.")
          }


        }
        </script>
        

    </body>
</html>