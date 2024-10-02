<!DOCTYPE html>
<html lang="en">

<head>
    <title><?php include 'env/title-long.php'; ?></title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
    <meta http-equiv="expires" content="0">

    <!-- jQuery and Bootstrap  -->
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"
        integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
    <script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
    <script src="assets/js/vendors/jquery.highlight-5.js"></script>

    <!-- Autoexpand (dependencies)-->
    <script src="assets/js/vendors/autoExpand/autoExpand.js"></script>

    <!-- CSS Assets -->
    <link href="assets/css/index.css" rel="stylesheet">
    <link href="assets/css/game.css" rel="stylesheet">
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" integrity="sha512-wnea99uKIC3TJF7v4eKk4Y+lMz2Mklv18+r4na2Gn1abDRPPOeef95xTzdwGD9e6zXJBteMIhZ1+68QC5byJZw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link href="https://cdnjs.cloudflare.com/ajax/libs/tufte-css/1.8.0/tufte.min.css" rel="stylesheet">
    <?php include("./partials/tufte-override.php"); ?>
    <script>
        window.dirSnippets = "<?php include 'env/dir-snippets.php'; ?>";
    </script>
</head>

<body onclick="if(!event.target.matches('#mobile-tap')) { document.querySelector('#mobile-tap').classList.remove('active'); }">
    <div id="toc-toggler">
        <div id="mobile-tap" onclick="event.target.classList.toggle('active')">📖 TOC</div>
        <div id="toc"></div>
    </div>

    <div id="jump-curriculum">
        <div onclick="document.querySelector('#side-b').scrollIntoView()">📗 More Topics</div>
    </div>

    <div class="site-header mx-auto">
        <h1 class="title"><?php include 'env/title.php'; ?></h1>

        <div class="w-full flex flex-row flex-wrap justify-around gap-2">
            <?php include 'env/description-must.php'; ?>
        </div>
        
        <div class="w-full flex flex-row flex-wrap justify-around gap-2">
            <div class="hide:lt867"></div>
            <div>
                <!-- <div><a id="count-notes" href="#explore-curriculum">1457 Notes!</a></div> -->
                <div><span id="count-notes" href="#explore-curriculum">1457 Notes!</span></div>
                <a target="_blank" href="https://github.com/Siphon880gh/devbrain/commits/main/">See what's changed</a>
                <!-- <div><i class="fa fa-link"></i> <a href="javascript:void(0)" onclick="$('.description-must').toggleClass('hidden')">More brains</a></div> -->
                <div>By <a href="javascript:void(0)" data-toggle="modal" data-target="#promoModal">Weng (Weng Fei Fung)</a></div>
            </div>
            <div class="more-notes">
                <div class="mn-header" class="font-bold text-center">More<br/>Notes</div>
                <div class="mn-links">
                    <li>
                        <a target="_blank" href="../devbrain">💻 Software development / programming / coding</a>
                    </li>
                    <li>
                        <a target="_blank" href="../bizbrain">💼 Business - Tech startup</a>
                    </li>
                    <li>
                        <a target="_blank" href="../3dbrain">🎮 3d video game development and video editing</a>
                    </li>
                    <li>
                        <a target="_blank" href="../3dbrain">⚕️ Health</a>
                    </li>
                </div>
            </div>
        </div>

    </div> <!-- .site-header end -->

    <div class="container">
        <div id="retype-container" class="card card-default hide">
            <div class="card-header">
                <h2 class="text-center"><i class="fa fa-keyboard"></i> Learn by Retyping</h2>
                <div style="float:right">Want to learn <a href="#explore-curriculum"
                        onclick="animateExploreCurriculum();">other languages/frameworks</a>?</div>
            </div>
            <div class="card-body sides">
                <div class="info-nav-wrapper" style="height:80px; width:100%;">

                    <nav class="difficulty float-right">
                        <span style="font-weight:500; margin-right:2ch;">Difficulty:</span>
                        <div class="form-group inline-block" onclick="location.reload(); /* initLevel1() */">
                            <input id="level-1" value="1" class="form-control" type="radio" name="level" checked="true">
                            <label for="level-1" class="form-text" title="Highlights code as you type"
                                data-toggle="toolbar">Level 1</label>
                        </div>
                        <div class="form-group inline-block" onclick="initLevel2()">
                            <input id="level-2" value="fog" class="form-control" type="radio" name="level">
                            <label for="level-2" class="form-text"
                                title="Black fog covering portions of the code briefly" data-toggle="toolbar">Level
                                2</label>
                        </div>
                        <div class="form-group inline-block" onclick="initLevel3()">
                            <input id="level-3" value="fog" class="form-control" type="radio" name="level">
                            <label for="level-3" class="form-text"
                                title="Black fog covering portions of the code longer" data-toggle="toolbar">Level
                                3</label>
                        </div>
                    </nav>
                    <span style="clear:left;"></span>

                </div>
                <aside id="old" data-class-level="1">
                    <div class="header">
                        <h3>1. Correct Code</h3>
                        <div class="instructions">
                            Edit away <a href="#" onclick="notes1()">(?)</a> what doesn't make sense to retype.
                        </div>
                        <div class="contents" contenteditable="true">This is a <b>sample.</b></div>
                    </div>
                </aside>

                <aside id="new" style="padding: 5px;">
                    <div class="header">
                        <h3>2. Retype It</h3>
                        <div class="instructions">
                            Retype as accurate as possible.<br />
                            <span>
                                <span><i class="fa fa-eraser clickable" onclick="confirmEraseText()"></i></span>
                                <span style="display:inline; margin-right:2ch;"></span>
                                <span><span id="diff"></span></span>
                            </span>
                        </div>
                        <textarea class="contents" style="width:100%; margin:5px; margin-top:-1px; resize:vertical;"
                            placeholder="Type from the left into here"></textarea>
                        <!-- <div class="contents" style="width:100%; margin-top:-6px; resize:vertical;" placeholder="Type what's on the left"></div> -->
                    </div>
                </aside>
            </div>
            <!-- /sides -->
        </div>
        <!-- card -->

        <div style="clear:both"></div>

        <div id="rearrange-container" class="card card-default hide">
            <div class="card-header">
                <h2 class="text-center"><span class="fa fa-puzzle-piece"></span> Learn by rearranging lines</h2>
            </div>
            <div class="card-body">
                <p class="text-center"><button class="btn btn-success-off btn-sm"
                        onclick='if($("#old .contents").text().length===0) { $("#modal-error .message").text("You need to have text in the template area"); $("#modal-error").modal("show"); } else $("#modal-puzzle").modal("show");'>Rearrange
                        lines <i class="fa fa-sign-out-alt"></i></button></p>
            </div>
        </div>


        <!-- Wouldn't allow table of contents to z-index on top if you hadn't unset position away from relative -->
        <div class="card card-primary" style="position:unset;">
            <!-- <div class="card-header">
                <h2 class="text-center"><span class="fa fa-book-reader"></span> Notes</h2>
            </div> -->
            <div id="explore-curriculum" class="card-footer">
                <div class="card-header p-0">
                    <h2 class="p0 m-0 text-center"><span class="fa-off fa-microscope-off fas fa-book-reader"></span> Open a lesson</h2>

                    <!-- <details>
                        <summary>More info...</summary>

                        <div class="bg-gray-200 p-3">
                            <?php /* include 'env/description.php'; */ ?>
                        </div>

                    </details> -->
                </div>

                <div id="js-visible-if-contents" class="hide">
                    <!-- <p>Want to practice? Can move the entire lesson to retyping/rearranging sections. For specific parts
                        you want to practice, have content surrounded by <code>```</code>. You can have multiple
                        sections surrounded with these backticks.
                        </p>
                    -->
                    <p>
                    <!-- TODO: Bring back when have time to rework the gaming: <button class="btn btn-info-off btn-success-off btn-sm" id="gamify-now" style="margin-top:5px">Play learning games!</button> -->
                    <!-- OBSOLETED: <button class="btn btn-default btn-sm" onclick="$('#explore-curriculum .side-by-side-possible').toggleClass('side-by-side');" style="margin-top:5px">See more topics side by side</button> -->
                    </p>
                </div>
                <div class="sides">

                    <script>
                        function shareTutorial() {

                            $("#shareModal").modal("show");
                            $("#shareSnippet").val(window.location.hostname + window.location.pathname + `?open=${encodeURI($("#summary-title").text())}`)
                        }
                        function shareTutorialSection(trailingHash) {

                            $("#shareModal").modal("show");
                            $("#shareSnippet").val(window.location.hostname + window.location.pathname + `${trailingHash}`)
                        }
                    </script>
                    <div id="side-a" class="card-body side-by-side-possible hidden"
                        style="border: 1px solid darkgray; padding-left:5px; padding-right:5px;">
                        <div style="position: sticky; top: 0; left: 0; z-index: 100;">
                            <h3 style="display:inline; cursor:pointer;">
                            <span id="summary-title" onclick="document.querySelector('#summary-collapser').click();"></span>
                            <span id="summary-collapser" class="d-none">»</span>
                            </h3>
                            <a id="summary-sharer" class="d-none" href="javascript:void(0)" style="float:right; margin-right:15px;" onclick='shareTutorial()'>
                                <span class="fas fa-share-alt"></span>
                            </a>
                        </div>
                        <div class="deemp-fieldset" style="height: 100%; margin-top: 20px; padding-left: 5px; padding-right: 5px;">
                            <!-- <textarea id="summary-inner" style="height: 100%; resize: none; width:100%;"></textarea> -->
                            <div class="left-bar" onclick="$('#summary-collapser').click()"></div>
                            <div id="summary-inner" style="height: 100%; resize: none; width:100%;"></div>

                        </div>
                    </div>

                    <div id="side-b" class="card-body side-by-side-possible">
                        <iframe class="d-none"
                            id="explorer-iframe"
                            src="explorer.php"
                            onload="
                                event.target.classList.remove('d-none');
                                document.getElementById('skeleton-explorer').classList.add('d-none');"
                            ></iframe>

                        <div id="skeleton-explorer"
                            style="padding:5px; border-radius:5px; display:inline-block; margin-top:5px; text-align:left; margin-bottom:10px; width:100%; height:400px;">


                            <div style="padding:15px; display:flex; flex-flow:column nowrap; align-items: flex-end;">

                                <div style="margin-top:5px;">
                                    <div id="skeleton-1" class="skeleton" style="background-color:lightgray;"> </div>

                                </div>

                                <div style="margin-top:5px;">


                                    <div id="skeleton-2" class="skeleton" style="background-color:lightgray;"> </div>

                                </div>

                            </div>


                            <br />

                            <div>
                                <ul style="color:lightgray;">
                                    <li style="margin: 5px 0;">
                                        <div class="skeleton"
                                            style="display:inline-block; width: 40%; background-color:lightgray;">
                                            &nbsp;</div>
                                    </li>
                                    <li style="margin: 5px 0;">
                                        <div class="skeleton"
                                            style="display:inline-block; width: 40%; background-color:lightgray;">
                                            &nbsp;</div>
                                    </li>
                                    <li style="margin: 5px 0;">
                                        <div class="skeleton"
                                            style="display:inline-block; width: 40%; background-color:lightgray;">
                                            &nbsp;</div>
                                    </li>
                                    <li style="margin: 5px 0;">
                                        <div class="skeleton"
                                            style="display:inline-block; width: 40%; background-color:lightgray;">
                                            &nbsp;</div>
                                    </li>
                                    <li style="margin: 5px 0;">
                                        <div class="skeleton"
                                            style="display:inline-block; width: 40%; background-color:lightgray;">
                                            &nbsp;</div>
                                    </li>
                                    <li style="margin: 5px 0;">
                                        <div class="skeleton"
                                            style="display:inline-block; width: 40%; background-color:lightgray;">
                                            &nbsp;</div>
                                    </li>
                                    <li style="margin: 5px 0;">
                                        <div class="skeleton"
                                            style="display:inline-block; width: 40%; background-color:lightgray;">
                                            &nbsp;</div>
                                    </li>
                                    <li style="margin: 5px 0;">
                                        <div class="skeleton"
                                            style="display:inline-block; width: 40%; background-color:lightgray;">
                                            &nbsp;</div>
                                    </li>
                                </ul>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- footer wrapping another pair of heading body -->


    </div>


    <!-- Modal -->
    <div class="modal fade" id="promoModal" tabindex="-1" role="dialog" aria-labelledby="promoModalLabel" aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
        <div class="modal-header" style="border-bottom:none;">
            <h3 class="modal-title" id="promoModalLabel">Who is Weng</h3>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="modal-body py-0">
            <?php include 'env/whoami.php'; ?>
        </div>
        <div class="modal-footer" style="border-top:none">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Return</button>
        </div>
        </div>
    </div>
    </div>

    <!-- Modal -->
    <div id="modal-puzzle" class="modal fade" role="dialog">
        <div class="modal-dialog">

            <!-- Modal content-->
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Rearrange Lines</h2>
                </div>
                <div class="modal-body py-0">
                    <div class="list-group">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                </div>
            </div>

        </div>
    </div>

    </div>
    <!-- /.container -->

    <script>
        $(document).ready(function() {
          $('#copyButton').click(function() {
            var copyText = document.getElementById("shareSnippet");
            copyText.select();
            document.execCommand("copy");
            // alert("Copied the text: " + copyText.value); // Optional: alert message
          });
        });
        </script>
          
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

    <!-- Designer: FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.9.0/css/all.min.css">

    <!-- jQuery UI, Bootstrap JS -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/themes/base/jquery-ui.min.css">
    </link>

    <!-- Modal -->
    <div id="modal-error" class="modal fade" role="dialog">
        <div class="modal-dialog">

            <!-- Modal content-->
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title text-danger">Error</h4>
                    <button type="button" class="close" data-dismiss="modal">×</button>
                </div>
                <div class="modal-body">
                    <p class="message"></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                </div>
            </div>

        </div>
    </div>

    <style id="style-fogs">
        /* Dynamic fog styling */
    </style>

    <!-- <div id="dashboard">
        <i id="shortcut-summary-collapser" class="fa fa-minus"
            onclick="document.querySelector('#summary-collapser').click();"> Lesson</i>
    </div> -->

    <style>
        .skeleton {
            width: 100%;
            height: 20px;
            /* background: linear-gradient(90deg, #f0f0f0, #f5f5f5, #f0f0f0); */
            /* background: linear-gradient(90deg, lightgray, #f5f5f5, lightgray); */
            /* The gradient looks too metallic */
            background: lightgray;
            position: relative;
            overflow: hidden;
        }

        .skeleton::before {
            content: "";
            position: absolute;
            top: -50%;
            left: -50%;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.5), transparent);
            transform: rotate(-45deg);

            /* Diagonal sprite sliding left to right and repeats from left but edge looked too sharp, so blurring it*/
            filter: blur(10px);
            animation: shine 1.5s infinite;
        }

        @keyframes shine {
            0% {
                transform: translateX(-100%) rotate(-45deg);
            }

            100% {
                transform: translateX(200%) rotate(-45deg);
            }
        }
        #skeleton-1 {
            width: 530px;
            height:27px; 
        }
        #skeleton-2 {
            width: 400px;
            height:27px; 
        }
        @media screen AND (max-width:768px) {
            #skeleton-1 {
                width:50vw;
            }
            #skeleton-2 {
                width:50vw;
            }
        }
    </style>


    <!-- JS Assets -->
    <script src="assets/js/diff.js"></script>
    <script src="assets/js/index.js"></script>
    <script src="assets/js/game.js"></script>


    <script
        src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.3/jquery.ui.touch-punch.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.15.0/umd/popper.min.js"></script>
    <!-- PopperJs for Tooltip -->
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"
        integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy"
        crossorigin="anonymous"></script>
</body>

</html>