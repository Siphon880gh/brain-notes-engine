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