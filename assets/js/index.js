function notes1() {
    alert("- RTF supported: You may copy and paste from Word Document or Text Edit and most formatting like bolding, font size, and lists will be copied over.\n- Shortcut keys: You may use shortcut keys for bold or italicized.");
}


window.formatters = [
    (text) => {
        // console.log("1");
        return text.replace(/\s/g, ''); // space, tab, newline
    },
    (text) => {
        // console.log("2");
        return text; // removing comments
    }
]

function confirmEraseText() {
    if (confirm('Start all over retyping?')) {
        $('#new .contents').val('');
        $('.highlight').removeClass('highlight');
        $("#new .contents").trigger("keyup"); // Call the delegator for evalDifference to clear accuracy text 
    }
}

function evalDifferences() {
    var newText = $("#new .contents").val();
    var oldText = $("#old .contents").text();

    // If user erases all text
    if (newText.length === 0) {
        $("#diff").text("").css("background-color", "transparent")
        return;
    }

    formatters.forEach((formatter) => { oldText = formatter(oldText); });
    formatters.forEach((formatter) => { newText = formatter(newText); });

    var typedSoFar = newText.length;
    var typedTooFar = typedSoFar > oldText.length;
    if (!typedTooFar)
        oldText = oldText.substr(0, typedSoFar);
    else
        newText = newText.substr(0, oldText.length);

    var percent = similarity(newText, oldText); // 0 - 0.XXXX - 1

    // NN.NN%
    percent = ((p) => {
        p *= 100;
        p = "" + p;
        return p.substr(0, 5);
    })(percent);

    $("#diff").text("Accuracy: " + percent);
    percent = parseInt(percent);
    if (percent == 100) {
        $("#diff").css("background-color", "lightgreen");
    } else if (percent >= 90) {
        $("#diff").css("background-color", "yellow");
    } else if (percent >= 85) {
        $("#diff").css("background-color", "orange");
    } else {
        $("#diff").css("background-color", "red");
    }
}

function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection != "undefined" &&
        typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
} // placeCaretAtEnd

window.words = [];

function readjustInputHeight($field) {
    var minHeightTextarea = 25;
    var field = $field[0];
    if (field.value.length === 0) {
        field.style.height = 25;
        return;
    }

    // Reset field height
    field.style.height = 'inherit';

    // Get the computed styles for the element
    var computed = window.getComputedStyle(field);

    // Calculate the height
    var height = parseInt(computed.getPropertyValue('border-top-width'), 10) +
        parseInt(computed.getPropertyValue('padding-top'), 10) +
        field.scrollHeight +
        parseInt(computed.getPropertyValue('padding-bottom'), 10) +
        parseInt(computed.getPropertyValue('border-bottom-width'), 10);

    if (height > maxHeight) height = maxHeight;
    field.style.height = height + 'px';

} // readjustInputHeight

/**
 * 
 * @function parseWords Returns words between {}, [], periods, spaces, etc, but only those words
 * @param {string} text Left text 
 */
function parseWords(text) {
    // Between space-type characters
    // return text.match(/([^\s]+)[\s$]/g);

    // Between special symbols and space-type characters:
    const words = text.match(/([^\s{}\(\)=+\.<>\\\/\~]+)[\s{}\(\)=+\.<>\\\/\~]/g);

    return words;
}

function newInputted(event) {
    let key = event.key;
    key = key.toLowerCase();

    if (key !== " " && key !== "enter" && key !== "{" && key !== "}" && key !== "(" && key !== ")" && key !== "[" && key !== "'" && key !== "\"" && key !== "\\" && key !== "/" && key !== ", " && key !== "." && key !== ": " && key !== ";" && key !== " - " && key !== " = ")
        return;

    readjustInputHeight($("#new .contents"));

    // Extract words
    var text = $("#new .contents").val();

    let words = parseWords(text);

    // Remove duplicated words
    words = [...new Set(words)];
    console.log("words", words);

    // If difficulty is level 1, we are highlighting as we type. This prevents collision with other difficulty levels
    const isLevel1 = $(".difficulty :checked")[0].id === "level-1";
    if (isLevel1) {
        let resetHighlights = $("#old .contents").text();
        $("#old .contents").text(resetHighlights);

        // Highlight words (have to run through each word individually)
        words.forEach((word) => {
            $("#old .contents").highlight(word);
        }); // foreach
    }

} // newInputted

/**
 * 
 * @function encodeURIFurther Chrome has default behavior of leaving " and ' as literal characters rather than encoding them when using location.href/hash
 * So we use our own encoding strings
 * 
 */
function encodeURIFurther(str) {

    if (str && typeof str === 'string') {
        str = str.replace(/%22/gmi, '__DQ__'); // "
        str = str.replace(/%27/gmi, '__SQ__'); // '
    }

    return str;
}

window.maxHeight = 0;
$(() => {
    window.maxHeight = $(window).height() - 240; // the textarea max height should be the window height except header and accuracy lines

    // $("#new .contents").on("keyup blur", newInputted); // keyup
    $("#new .contents").on("keyup", newInputted); // keyup

    $("#old .contents").on("input", () => {
        var $old = $("#old .contents");
        var $clonedDom = $old.clone();
        $clonedDom.find('span.highlight').contents().unwrap();
        $clonedDom.find('span.fog').contents().unwrap();
        var oldText = $clonedDom.html(); // html -> text
        oldText = oldText.replace(/<div>/gi, '\n').replace(/<\/div>/gi, '').trim();
        localStorage.setItem("old", oldText);
        oldTextURI = encodeURI(oldText);
        oldTextURI = encodeURIFurther(oldTextURI);
        // debugger;
        window.location.hash = oldTextURI;
        console.log("setItem old text: ", oldText);
        console.log("set URL hash: ", oldTextURI);
    });

    $("#old .contents").on("input", evalDifferences);
    $("#new .contents").on("keyup", evalDifferences);

    $('#new .contents', 'keydown', function(e) {
        if (e.keyCode === 9) {
            var v = this.value,
                s = this.selectionStart,
                e = this.selectionEnd;
            this.value = v.substring(0, s) + '\t' + v.substring(e);
            this.selectionStart = this.selectionEnd = s + 1;
            return false;
        }
    });

    if (window.location.hash.length) {
        var overrideByHash = window.location.hash;
        overrideByHash = overrideByHash.substr(1);
        overrideByHash = decodeURI(overrideByHash); // %20 becomes space
        overrideByHash = decodeURIFurther(overrideByHash); // %22 becomes ", %27 becomes '
        overrideByHash = decodeEntities(overrideByHash); // &lt; becomes <
        $("#old .contents").text(overrideByHash); // html -> text
    } else if (localStorage.getItem("old")) {
        var overrideByLocalStorage = localStorage.getItem("old");
        overrideByLocalStorage = decodeEntities(overrideByLocalStorage); // &lt; becomes <
        $("#old .contents").text(overrideByLocalStorage); // html -> text
    }
}); // dom ready


/**
 * 
 * @function decodeURIFurther Chrome has default behavior of leaving " and ' as literal characters rather than encoding them when using location.href/hash
 * So we use our own encoding strings
 * 
 */
function decodeURIFurther(str) {

    if (str && typeof str === 'string') {
        str = str.replace(/__DQ__/gmi, '"');
        str = str.replace(/__SQ__/gmi, '\'');
    }

    return str;
}

function decodeEntities(str) {

    if (str && typeof str === 'string') {
        str = str.replace(/&lt;/gmi, '<');
        str = str.replace(/&gt;/gmi, '>');
        // strip script tags
        str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
        // strip html tags
        // str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
    }

    return str;
}

function encodeEntities(str) {

    if (str && typeof str === 'string') {
        str = str.replace(/</gmi, '&lt;');
        str = str.replace(/>/gmi, '&gt;');
        // strip script tags
        str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
        // strip html tags
        // str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
    }

    return str;
}
$(() => {
    // Difficulty level for retyping notes
    $(".difficulty input").change((a, b) => {
        let newLevel = $(".difficulty input:checked")[0].value;
        $("#old").attr("data-class-level", newLevel);
        // debugger;
    });

    // Tooltip
    $('[data-toggle="toolbar"]').tooltip({ placement: "bottom" });

    initLevel1();
});

window.fogsMode = null;
window.fogsMax = -1;
window.fogs = 0;

// Split randomly the text 5-8 chars
function splitCharacters(text) {
    // text = encodeEntities(text);
    // text = encodeURI(text);
    // text = encodeURIFurther(text);

    // texts split by < and > html entities
    // let texts = text.split(new RegExp("&lt;|&gt;"));

    text = text.replace(/<\//gmi, '√');
    text = text.replace(/</gmi, '£');
    text = text.replace(/>/gmi, 'å');

    let min = 5;
    let max = 8;
    text = text.split(""); // change "asdf" => ["a", "s", ...]
    let randNum = function() {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    let splitted = [];
    while (text.length) {
        var chars = text.splice(0, randNum());
        var psuedoWord = chars.join("");
        splitted.push(psuedoWord);
    }
    // debugger;
    // console.log({ splitted })

    // debugger;
    return splitted;
} // splitCharacters

function initFogs() {

    // Using someInterval = setInterval(..) and clearInterval stops style from rendering so have to do this approach:
    setInterval(function() {
        if (window.fogsMode === "a") {
            let fogsMax = 2;
            console.log(`Setting style #style-fogs for up to ${fogsMax} every 200ms`);
            document.querySelector("#style-fogs").innerHTML = `
            #old[data-class-level="fog"] .fog {
                background-color: black;
            }
            #old[data-class-level="fog"] .fog.fog-${window.fogs} {
                background-color: transparent;
            }
            `;
            window.fogs++;
            if (window.fogs >= fogsMax) window.fogs = 0;
        }
    }, 200);

    setInterval(function() {
        if (window.fogsMode === "b") {
            let fogsMax = 3;
            console.log(`Setting style #style-fogs for up to ${fogsMax} every 5s`);
            console.log("Setting style #style-fogs");
            document.querySelector("#style-fogs").innerHTML = `
            #old[data-class-level="fog"] .fog {
                background-color: black;
            }
            #old[data-class-level="fog"] .fog.fog-${window.fogs} {
                background-color: transparent;
            }
            `;
            window.fogs++;
            if (window.fogs >= fogsMax) window.fogs = 0;
        }
    }, 5000);
}

function reinitFogs(covers, pollTime) {

    let oldText = $("#old .contents").text();
    let word = splitCharacters(oldText);
    // word = word.map(word => {
    //     // word = decodeURI(word); // %20 becomes space
    //     // word = decodeURIFurther(word); // %22 becomes ", %27 becomes '
    //     word = decodeEntities(word); // &lt; becomes <
    // });
    word = word.map((word, i) => `<span class="fog fog-${i%covers}">` + word + '</span>')
    let newText = word.join("");

    // debugger;
    // newText = decodeEntities(newText);

    // newText = newText.replace(/√/gmi, '</');
    // newText = newText.replace(/£/gmi, '<');
    // newText = newText.replace(/å/gmi, '>');

    newText = newText.replace(/√/gmi, '&lt;/');
    newText = newText.replace(/£/gmi, '&lt;');
    newText = newText.replace(/å/gmi, '&gt;');

    $("#old .contents").html(newText);

    // debugger;
}

// function resetParsedClasses() {
//     var $old = $("#old .contents");
//     var $clonedDom = $old.clone();
//     $clonedDom.find('span.highlight').contents().unwrap();
//     $clonedDom.find('span.fog').contents().unwrap();
//     $old.html($clonedDom.html());
// }

function initLevel1() {
    // resetParsedClasses();

}

function initLevel2() {
    // resetParsedClasses();

    // 200ms, 2 covers
    const covers = 2;
    const pollTime = 200;
    reinitFogs(covers, pollTime);
    window.fogsMode = "a";
}

function initLevel3() {
    // resetParsedClasses();

    // 1000ms, 3 covers
    const covers = 3;
    const pollTime = 5000;
    reinitFogs(covers, pollTime);
    window.fogsMode = "b";
}

initFogs();

function animateExploreCurriculum() {
    $("#explore-curriculum .card-header")
        .animate({ "color": "red" }, 1000)
        .delay(500)
        .animate({ "color": "black" }, 2000)
}


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

// // Always resize
// setInterval(() => {
//     if ($("#side-a").css("display") !== "none" && $("#side-a").css("visibility") !== "hidden")
//         $("#side-b").height($("#side-a").height());
// }, 200);

/**
 * resort-lines
 */
$(document).on("show.bs.modal", "#modal-puzzle", () => {
    $("#modal-puzzle .list-group").html("");
    var $template = $("#old .contents");
    var lines = $template.find("div").toArray(); // Sometimes newlines are actually div's in contenteditable
    if (lines.length === 0) {
        lines = $template.text().split("\n"); // And sometimes it's one whole text node
    } else { // if it's not onewhole text node, you might still have textNode then followed by div's
        let firstNode = $("#old .contents").contents()[0];
        if (firstNode.nodeType === 3) // test for textNode
            lines.unshift(firstNode);
    }
    // lines = lines.split("\n");
    // var template = $template.html();
    // var lines = template.split("\n");
    // debugger;
    var listGroupEl = document.querySelector("#modal-puzzle .list-group");
    if (lines.length <= 1) {
        $("#modal-error .message").text("You need over 1 line to practice rearranging lines.");
        $("#modal-error").modal("show");
        return false;
    }

    function appendLine(line, i, lines) {

        try {
            if (typeof line !== "string") line = line.textContent;
        } catch (err) {

        }
        var listGroupItemEl = document.createElement("div");
        listGroupItemEl.classList = "list-group-item";
        listGroupItemEl.textContent = line;
        listGroupItemEl.setAttribute("contenteditable", true);
        listGroupItemEl.setAttribute("data-correct-order", i);
        listGroupEl.appendChild(listGroupItemEl);
        console.log("Line: " + line);
        if (typeof lines[i] === "undefined") return false;
        else return true;
    }
    var i = 0;
    while (true) {
        var line = lines[i];
        var sublines = [];
        try {
            sublines = line.split("\n");
        } catch (err) {

        }
        if (sublines.length > 1) {
            for (var j = 0; j < sublines.length; j++) {
                if (!appendLine(sublines[j], j, sublines)) break;
            } // for
        } else {
            if (!appendLine(lines[i], i, lines)) break;
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
            $listItems.each((i, el) => {
                var $listItem = $(el);
                var newPos = $listItem.index();
                var correctPos = $listItem.data("correct-order");
                if (newPos === correctPos) {
                    $listItem.addClass("li-correct");
                } else {
                    $listItem.addClass("li-incorrect");
                }
            })
        }
    });
    shuffle($(listGroupEl));
});

function shuffle($listGroup) {
    var listItems = $listGroup.children(); //Extract all listItems from it.
    listItems.sort(function(a, b) { //This function sorts the items.
        var compA = $(a).text().toUpperCase();
        var compB = $(b).text().toUpperCase();
        return (compA < compB) ? -1 : 1; //return a -1 or 1 depending upon specific condition.
    });
    $listGroup.append(listItems);
}
// End: resort-lines

/**
 * Detect presetted topic search in URL
 */
$(() => {
    var params = new URLSearchParams(window.location.search);
    var qtopic = params.get("topic");

    if (qtopic) {
        var checkIframeLoading = setInterval(() => {
            var $curriculumExplorer = $("#explore-curriculum iframe").contents();
            var doesTreeExist = () => $curriculumExplorer.find(".accordion").length > 0;

            if (doesTreeExist) {
                clearInterval(checkIframeLoading);
                setTimeout(() => {
                    $topicField = $curriculumExplorer.find("#searcher-2"),
                        $topicBtn = $curriculumExplorer.find("#searcher-2-btn");;
                    $topicField.val(qtopic);
                    $topicBtn.click();
                }, 1200); // Just because part of a tree exist, doesn't mean the whole tree exists right away
            }
        }, 100);
    }
});
// End: Detect hash then searh

// Autoresize notes textarea
document.querySelector("#summary-inner")?.addEventListener("input", (event) => {
    autoExpand(event.target);
});

window.autoExpandNow = () => {
    if(document.querySelector("#summary-inner")?.length)
        autoExpand(document.querySelector("#summary-inner"));
}
autoExpandNow();
// End: Autoresize notes textarea


// Copy over notes to retype template
function copyOver() {
    var $summary = $("#summary-inner");
    var summary = $summary.val();
    summary = summary.trim();
    if ($summary.val().length) {
        var $template = $("#old .contents");
        // var code = [...summary.matchAll(new RegExp("`\`\`[\n\r]{0,}(.*?)[\n\r]{0,}\`\`\`", "gmi"))].map(regExpItr => regExpItr[1]);
        var code = [...summary.matchAll(new RegExp("\`\`\`((.|\n|\r)*?)\`\`\`", "gmi"))].map(regExpItr => regExpItr[1]);

        // If text has ```___```, then get all text between those backticks, otherwise just get all of the text
        if (code.length) {
            var code = code.join("\n");
            code = code.replaceAll("\n\n", "\n");
            code = code.replaceAll("\r\r", "\r");
            code = code.trim();
            $template.text(code);
            $template.trigger("input");
        } else {
            $template.text(summary);
            $template.trigger("input");
        }
    } else {
        let html = `Nothing loaded in notes. Find a lesson from the curriculum and open it here by clicking the <i class="fa fa-book-reader"></i> icon.`;
        $("#modal-error .message").html(html);
        $("#modal-error").modal("show");
    }
}
// End: Copy over notes to retype template