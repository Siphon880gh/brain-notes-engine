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
          <p>By Weng Fei Fung. Purpose of this app is to help you learn new programming languages and concepts by having a table of contents that explains code snippets, and lets you practice the boilerplate by retyping it with instant feedback on your accuracy. It also lets you rearrange the lines of code into correct order to understand how the written code flows.</p>

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
          
          <div style="clear:both"></div>
          <h2><span class="fa fa-puzzle-piece"></span> Learn by rearranging lines</h2>
          <p>Open now: <button class="btn btn-secondary btn-sm" onclick='if($("#old .contents").text().length===0) alert("Error: You need to have text in the template area"); else $("#modal-puzzle").modal("show");'>Rearrange</button></p>

          <div style="clear:both"></div>
          <h2><span class="fa fa-calculator"></span> Stats</h2>

          <div style="padding:5px; border-radius:5px; display:inline-block; margin-top:5px; text-align:left; margin-bottom:10px;">
              <span style="font-weight:bold;">Programming Language Accuracy: </span><span id="diff"></span>
          </div>

          <h2><span class="fa fa-book-reader"></span> Notes</h2>
          <p>Interested in retyping text surrounded with ```:<br/><button class="btn btn-secondary btn-sm" onclick="copyOver();">Copy over for retyping</button></p>
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
                <h2 class="modal-title">Rearrange Lines</h2>
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
            var lines = $template.find("div").toArray(); // Sometimes newlines are actually div's in contenteditable
            if(lines.length===0) {
              lines = $template.text().split("\n"); // And sometimes it's one whole text node
            } else { // if it's not onewhole text node, you might still have textNode then followed by div's
              let firstNode = $("#old .contents").contents()[0];
              if(firstNode.nodeType===3) // test for textNode
                lines.unshift(firstNode);
            }
            // lines = lines.split("\n");
            // var template = $template.html();
            // var lines = template.split("\n");
            // debugger;
            var listGroupEl = document.querySelector("#modal-puzzle .list-group");
            if(lines.length<=1) {
              alert("Error: You need over 1 line to practice rearranging lines.");
              return false;
            }
            function appendLine(line, i, lines) {

              try {
                if(typeof line !== "string") line = line.textContent;
              } catch(err) {
                
              }
              var listGroupItemEl = document.createElement("div");
              listGroupItemEl.classList = "list-group-item";
              listGroupItemEl.textContent = line;
              listGroupItemEl.setAttribute("contenteditable", true);
              listGroupItemEl.setAttribute("data-correct-order", i);
              listGroupEl.appendChild(listGroupItemEl);
              console.log("Line: " + line);
              if(typeof lines[i]==="undefined") return false;
              else return true;
            }
            var i = 0;
            while(true) {
              var line = lines[i];
              var sublines=[];
              try {
                sublines = line.split("\n");
              } catch(err) {

              }
              if(sublines.length>1) {
                for(var j=0; j<sublines.length; j++) {
                  if(!appendLine(sublines[j], j, sublines)) break;
                } // for
              } else {
                  if(!appendLine(lines[i], i, lines)) break;
                  i++;
              }
            } // while
            $("#modal-puzzle .list-group").sortable({
              // stop: (event, ui) => {
              //   debugger;
              // },
              // When user drops a list item to a new position:
              update: (event, ui) => {
                // debugger;
                // var newPos = ui.item.index();
                // var correctPos = ui.item.data("correct-order");
                // ui.item.removeClass("li-correct").removeClass("li-incorrect")
                // if(newPos===correctPos) {
                //   ui.item.addClass("li-correct");
                // } else {
                //   ui.item.addClass("li-incorrect");
                // }
                let $listItems = $("#modal-puzzle .list-group .list-group-item");
                $listItems.removeClass("li-correct").removeClass("li-incorrect");
                $listItems.each( (i, el) => {
                  var $listItem = $(el);
                  var newPos = $listItem.index();
                  var correctPos = $listItem.data("correct-order");
                  if(newPos===correctPos) {
                    $listItem.addClass("li-correct");
                  } else {
                    $listItem.addClass("li-incorrect");
                  }
                })
              }
            });
            shuffle($(listGroupEl));
          });
          function shuffle($listGroup){
              var listItems = $listGroup.children(); //Extract all listItems from it.
              listItems.sort(function(a,b){ //This function sorts the items.
                  var compA = $(a).text().toUpperCase();
                  var compB = $(b).text().toUpperCase();
                  return (compA < compB) ? -1 : 1; //return a -1 or 1 depending upon specific condition.
              });
              $listGroup.append(listItems);
          }
        </script>
        <style>
        .li-correct {
          border: 1px solid green;
          background-color: lightgreen;
        }
        .li-incorrect {
          border: 1px solid red;
          background-color: #FFCCCB;
        }
        </style>

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
            alert("Error: Nothing loaded in notes. Find a lesson from the curriculum.")
          }


        }
        </script>
        

    </body>
</html>