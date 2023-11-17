/** @ UTILITY FUNCTIONS **/
// alert("explorer.js loaded");

// New :contains that is case-insensitive
$.expr[":"].contains = $.expr.createPseudo(function (arg) {
    return function (elem) {
        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/** @ RECURSIVE LOGIC - Rendering all */

function mergeByCommonPath(data) {
    // the function where the nesting magic happens
    // this function generates an object for each folder recursively
    var nestnext = function (folders, item, index) {

        var newObj = {};
        Object.assign(newObj, item);
        newObj.current = folders[index]; // title is based on folder name

        newObj.next = (index + 1 < folders.length) ?
            nestnext(folders, item, index + 1) // If there is next element, that is `index` is lesser than `folders` length, run this function recursively with the `index` of the next item
            :
            [] // else return empty object

        return newObj;

    } // nestnext

    // Iterate over each item in data array
    return data.map(function (item) {
        // Separate the item's current by /
        //console.log({"item-path-tp":item.path_tp})
        var folders = item.path_tp.split('/')
        // console.log(folders)

        // Return nested folders starting from the top-level folder
        return nestnext(folders, item, 0)
    })
} // nestFolders

// console.log(folders);
folders = mergeByCommonPath(folders);
// console.log(folders);

function mergeByKey(array) {

    var output = array.reduce(function (o, cur) {

        // Get the index of the key-value pair.
        var occurs = o.reduce(function (n, item, i) {
            // if((item.current === cur.current)) debugger;
            return (item.current === cur.current) ? i : n;
        }, -1);
        // debugger;

        // If the current is found,
        if (occurs >= 0 && o[occurs] !== undefined) {

            // copy over the properties
            tempPath = o[occurs].path;
            tempPathTP = o[occurs].path_tp;
            tempNext = o[occurs].next;
            Object.assign(o[occurs], cur);
            o[occurs].path = tempPath;
            o[occurs].path_tp = tempPathTP;
            o[occurs].next = tempNext;

            // append the current value to its list of values.
            o[occurs].next = o[occurs].next.concat(cur.next);

            // Otherwise,
        } else {

            // add the current item to o (but make sure the value is an array).
            if (cur.current !== undefined) {
                // copy over the properties
                var tempNext = [cur.next];
                var obj = {};
                Object.assign(obj, cur);
                obj.next = tempNext;
                // var obj = {current: cur.current, next: };
                o = o.concat([obj]);
            }
        }

        return o;
    }, []); // those with the same key "current" becomes one entity and their former values "next" pushed into the new entity's array "next"

    // debugger;
    for (var i = 0; i < output.length; i++) {
        output[i].next = mergeByKey(output[i].next);
    }

    return output;
} // mergeByKey

folders = mergeByKey(folders);

// console.log(folders);
window.summary = "";

/**
 * @function objToHtml
 * @description Receives the array of topic objects, and converts them into <li>
 */
function objToHtml(type, item) {
    function getBasePath(filePath) {
        // Get the last index of the directory separator ("/" or "\\")
        const separatorIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));

        // Extract the substring from the start to the separator index
        const basePath = filePath.substring(0, separatorIndex + 1);

        return basePath;
    } // getBasePath

    //console.log({"item-current": item.current})

    // var uniqueId = lookupUniqueIds[item.path];
    // uniqueId = uniqueId.substr(1);
    // var $liDom = $(`<li class="accordion meta" data-uid="${uniqueId}" data-path="${item.path}"></li>`);
    var $liDom = $(`<li class="accordion meta" data-path="${item.path}"></li>`);
    $liDom.append($(`<span class="name">${item.current}</span>`));
    $contain = $(`<span class="contain"></span>`);
    var $meta = $liDom;
    // var $meta = $liDom.find(".meta");

    if (lookupMetas[item.path]) {
        // Extract property from metas. If property not defined at +meta.json, then it'll be value undefined
        var { summary, footerFile, titleOverridden, desc, gotos } = lookupMetas[item.path];
        // debugger;

        // Folder text overridden vs not overridden
        $meta.find(".name").attr("data-folder-name", item.current);
        if (titleOverridden && titleOverridden.length) {
            $meta.find(".name").html(titleOverridden);
        }

        if (desc && desc.length) {
            var $info = $(`<span class="fas fa-info"></span>`);
            $info.attr("data-toggle", "tooltip");
            $info.attr("data-trigger", "click");
            $dom = $(`<div>${desc}</div>`);
            var $imgs = $dom.find("img");
            var $a = $dom.find("a");

            $imgs.each((i, el) => {
                var $img = $(el);
                var src = $img.attr("src");
                if (src.indexOf("./") == 0) {
                    // debugger;
                    // console.log(getBasePath(item.path_tp));
                    // src = getBasePath(item.path) + src.substr(2);
                    // No more getBasePath because that's going to depend on developer local environment vs production environment
                    // src = "./img-pathing.php?image=" + item.path_tp;
                    src = "img-pathing.php?image=" + getBasePath(item.path_tp) + src;
                    $img.attr("src", src);
                }
            }); // imgs

            $a.each((i, el) => {
                var $a = $(el);
                var href = $a.attr("href");
                if (href.indexOf("./") == 0) {
                    href = getBasePath(item.path) + href.substr(2);
                    $a.attr("href", href);
                }
            });

            // debugger;
            // Tooltip attributes
            $info.attr("title", `
          <b style="font-size:21px;">Description</b><p/>
          <u>${titleOverridden || item.current}</u>:<br/>
          ${$dom.html()}
        `);
            $info.tooltip({ placement: "bottom", html: true, delay: { show: 50 } });
            $contain.append($info);
        } // if desc

        var summaryText = "",
            footerFileText = "";

        // Prepare summary text if exists
        if (summary && summary.length) {
            if (Array.isArray(summary))
                summaryText = summary.join("<br/>");
            else
                summaryText = summary;

            // console.log(summaryText);
        }

        // Get and prepare summary file text if exists, then render
        if (footerFile && footerFile.length) {
            var url = footerFile;
            if (url.length && url[0] === ".") {
                var path = $meta.attr("data-path");
                url = path + url;
            }
            console.log($contain)
            $.ajax({
                cache: false,
                url: url,
                success: function (footerFileContent) {
                    var $contain = this;

                    if (typeof footerFileContent === "object")
                        footerFileContent = "<textarea class=fullwidth100>" + encodeURI(JSON.stringify(footerFileContent)) + "</textarea>"; // if you're referencing a json file with footerFile, force type to be string. 

                    footerFileContent = footerFileContent.replace(/\n/g, "<br>").replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
                    summaryFinalText = (summaryText && summaryText.length) ? `${summaryText}<br/>${footerFileContent}` : footerFileContent;
                    createSummaryIconAndContents(summaryFinalText, $contain, true);
                }.bind($contain),
                error: function (error) {
                    var $contain = this;
                    if (summaryText && summaryText.length) {
                        createSummaryIconAndContents(summaryText, $contain, true);
                    }
                }.bind($contain) // fail
            })

            // Render summary text if summary file text does not exist and summary text does exist
        } else if (summaryText && summaryText.length) {
            createSummaryIconAndContents(summaryText, $contain, false);
        }

        function createSummaryIconAndContents(text, $contain, ajaxed) {
            var $summary = $(`<span class="fas fa-book-reader"></span>`);
            $summary.data("summary", text);
            $summary.on("click", (event) => {
                parent.document.querySelector(".side-by-side-possible.hidden")?.classList?.remove("hidden");
                var $this = $(event.target);
                var summary = $this.data("summary");
                // alert(summary);

                // Show notes in textarea
                let summaryInnerEl = parent.document.querySelector("#summary-inner");
                summaryInnerEl.classList.remove("hide");

                var md = window.markdownit({
                    html: true,
                    linkify: true
                });

                // md.renderer.rules.newline = (tokens, idx) => {
                //     return '\n';
                // };

                // const doubleNewLine = (source) => {
                //     return source.replace(/([^\n])\n([^\n])/g, '$1\n\n$2');
                // };
                // summary = doubleNewLine(summary);

                var summaryHTML = md.render(summary);
                parent.document.querySelector("#summary-title").textContent = event.target.closest("li").querySelector(".name").textContent;
                parent.document.querySelector("#summary-collapser").classList.remove("d-none");
                parent.document.querySelector("#summary-collapser").classList.add("stated");
                parent.document.querySelector("#side-a .deemp-fieldset").classList.remove("d-none");
                parent.document.querySelector("#dashboard").classList.add("active");

                // When copied HTML from W3School to Obsidian, it's a special space character. 
                // This special space character will get rid of // from https:// in src
                // So lets convert back to typical space

                summaryHTML = summaryHTML.replaceAll(/\xA0/g, " ");
                console.log(summaryHTML)
                summaryInnerEl.innerHTML = summaryHTML;
                // summaryInnerEl.innerHTML = `<iframe src="https://www.w3schools.com" title="W3Schools Free Online Web Tutorials!!"></iframe>`;
                summaryInnerEl.querySelectorAll("a").forEach(a=>{
                    a.target = "_blank"
                })

                // Allow copy from textarea to practice areas
                let guideCopyToPractice = parent.document.querySelector("#js-visible-if-contents");
                guideCopyToPractice.classList.remove("hide");

            });
            $queriedInfoButton = $contain.find(".fa-info");
            if ($queriedInfoButton.length) {
                $summary.insertAfter($queriedInfoButton);
            } else {
                $contain.prepend($summary);
            }
        } // createSummaryIconAndContents

        if (gotos && gotos.length) {
            $meta.data("gotos", gotos);
            var count = gotos.length;
            var $gotosBtn = $(`<span class="fas fa-globe gotos-click"> ${count}</span>`);

            $gotosBtn.on("click", (event) => {
                for (var i = 0; i < gotos.length; i++) {
                    var url = gotos[i];
                    var randomNum = Math.floor((Math.random() * 1000) + 1);
                    if (url.length && url[0] === ".") {
                        var path = $meta.attr("data-path");
                        url = path + url;
                    }
                    window.open(url, "target_blank_" + randomNum);
                } // for
            });

            $contain.append($gotosBtn);
        } // gotos
    } // hasMeta

    $liDom.append($contain);

    return $liDom;
} // objToHtml


$(() => {
    var $ul = $("<ul>");
    //console.log({folders})

    for (var i = 0; i < folders.length; i++) {
        var item = folders[i];
        var func = (item, $ul) => {
            var $newLi = objToHtml("snippet-list-item", item);
            // console.log(`var $newLi = objToHtml(item);`);
            // debugger;
            var $newUl = $("<ul>");
            if (item.next && item.next.length) {
                for (var j = 0; j < item.next.length; j++) {
                    func(item.next[j], $newUl);
                }
            } else {
                $newLi.addClass("empty");
            }
            $newLi.append($newUl)
            $ul.append($newLi);
        }
        func(item, $ul);
    }
    $ul.appendTo("#target");

    // Open up accordions initially
    $(".accordion").each((i, li) => {
        var $this = $(li);
        $this.children(".contain, ul").toggle("active");
    });

    // Accordion onclicks
    $(".name").on("click", (event) => {
        var $name = $(event.target);

        // Expanding/collapsing
        $li = $name.closest("li.accordion");
        $li.children(".contain, ul").toggle("active");
        $name.toggleClass("minus");

        // Open command
        path = $li.attr("data-path");
        $("#open-command").val(`cd '${realpath}/${path}'`);


        event.preventDefault();
        event.stopPropagation();
    });

    setTimeout(() => {
        //close tooltip if clicked outside
        $('body').on('click', function (e) {
            //debugger;
            var $el = $(e.target);
            if ($el?.data('toggle') !== 'tooltip' && $el.closest(".tooltip").length === 0) {
                $(".tooltip-inner").closest(".tooltip").prev().click();
            }
        });

    }, 100)
}); // on dom


$(() => {

    function recurseAllFolderObjects(folders) {

        let folderFlattenedNames = [];

        // recurseFolderObjects
        let rFO = (nestedObject) => {
            if (nestedObject.next.length)
                nestedObject.next.forEach(rFO);
            folderFlattenedNames.push(nestedObject.current);
        }
        folders.forEach(rFO);

        return folderFlattenedNames;
    }

    const folderFlattenedNames = recurseAllFolderObjects(folders)

    $("#searcher-2").autocomplete({
        source: folderFlattenedNames
    });
})

/** @ ACCORDION LOGIC */

var toOpenUp = [];

function toOpenUp_Exec($row) {
    // console.log($row);

    toOpenUp = [];
    toOpenUp.unshift($row);

    // closest looks on itself and ancestors
    while ($row.parent().closest("li").length) {
        $row = $row.parent().closest("li");
        toOpenUp.unshift($row);
    }

    toOpenUp.forEach((li) => {
        var $li = $(li),
            isCollapsed = $li.children(".contain").css("display") === "none";
        if (isCollapsed) {
            $li.children(".contain, ul",).toggle("active");
        }
        // debugger;
    }); // 1st li is outermost
}

function toOpenUp_Highlight($row) {
    $row.css("border", "1px solid black");
    $row.css("border-radius", "3px");
    // $row.css("padding", "1px");
    $row.on("hover", () => {
        $row.css("border", "none");
        $row.css("border-radius", "none");
        // $row.css("padding", "0");
        $row.off("hover");
    });
}


/** @ JUMP/SCROLL TO **/

function scrollToText(partial, callback=false) {
    let $finalJumpTo = null;
    var $foundRow = $(`li:contains(${partial})`);
    if ($foundRow.length === 0) alert(`Error: Not found among topic names: ${partial}`)
    $foundRow.each((i, row) => {
        var $row = $(row)
        toOpenUp_Exec($row);
        toOpenUp_Highlight($row);
        if (i === $row.length - 1)
            $finalJumpTo = $row[0];
    });


    setTimeout(() => {
        if ($finalJumpTo)
            $finalJumpTo.scrollIntoView();
        setTimeout(()=>{
            if(callback)
                callback();
        }, 500)
    }, 800);

} // scrollToText

function scrollToNonoverridden(partial) {
    partial = partial.toLowerCase();
    if (partial.length === 0) return;

    if (partial[0] === '+') partial = partial.substr(1);
    var $foundRow = $(".name[data-folder-name]").filter((i, el) =>
        $(el).attr("data-folder-name").toLowerCase().indexOf(partial) >= 0
    );
    $foundRow = $foundRow.map((i, el) => $(el).closest("li"));

    $foundRow.each((i, row) => {
        var $row = $(row)
        toOpenUp_Exec($row);
        toOpenUp_Highlight($row);
        $row[0].scrollIntoView();
    });
} // scrollToNonoverridden


/** EXPLORER BUTTONS **/
function toggleAllExpand() {
    const $styleBlock = $("#style-toggle-all-expand");
    const isOn = $styleBlock.text().trim().length > 0;
    if (isOn) {
        $styleBlock.text("");
    } else {
        $styleBlock.html("ul { display: block !important; }");
    }
}


/** SEARCH */

// If user erases content in input, dynamically erase any present search results
// If user presses enter on input, then click the search
function checkSearcherSubmit(event, $btn) {
    $searcher = $("#searcher");
    if ($searcher.val().length === 0)
        toggleSearchResults(false);

    if (event.keyCode === 13) {
        $(".ui-autocomplete").hide();
        event.preventDefault();
        $btn.click();
    }
} // checkSearcherSubmit

function doSearcher() {
    $searcher = $("#searcher");
    query = $searcher.val();
    query = escapeRegExp(query);
    if (query.length === 0) return;

    $div = $("#search-results .contents");
    $.post("search.php", { search: query })
        .done(greps => {
            greps = JSON.parse(greps); // grep results array
            greps = greps["res"];
            console.log(greps);

            // Reset
            $div.html(`<div><table id="table-search-results">
          <thead>
            <th>Concept (Folder)</th>
            <th>File</th>
            <th>Context</th>
          <thead>
          <tbody>
          </tbody>
        </table></div>`)
            $tbody = $div.find("tbody");

            // Match and render
            greps.forEach(res => {
                // x/y/z/filepath: surrounding_text

                // Reset placeholders
                var afterFirstDoubleColon = "", beforeFirstDoubleColon = "", folder = ""; file = "", context = "";

                afterFirstDoubleColon = res.match(/:(.*)/im);
                afterFirstDoubleColon = afterFirstDoubleColon[1];
                afterFirstDoubleColon = afterFirstDoubleColon.trim();
                context = afterFirstDoubleColon;

                beforeFirstDoubleColon = res.match(/(.*?):/im);
                beforeFirstDoubleColon = beforeFirstDoubleColon[1];
                beforeFirstDoubleColon = beforeFirstDoubleColon.trim();

                i = beforeFirstDoubleColon.lastIndexOf("/")
                file = beforeFirstDoubleColon.substr(i + 1);

                folder = beforeFirstDoubleColon.split("/").slice(-2, -1);

                $tbody.append(`
            <tr>
              <td><a onclick="scrollToNonoverridden('${folder}')" href="javascript:void(0);">${folder}</a></td>
              <td>${file}</td>
              <td class="context"><pre>${context}</pre></td>
            </tr>`);
            }); // foreach
            $("#table-search-results pre").highlight($("#searcher").val());
            toggleSearchResults(true);

            // Scroll to bottom where search results are
            window.scrollTo(0, document.body.scrollHeight);
        });
} // doSearcher

function doSearcher2(searchText, callback) {
    if (searchText.length === 0) {
        alert("Error: Nothing typed!");
        return false;
    }
    scrollToText(searchText, callback);
}

function toggleSearchResults(display) {
    $div = $("#search-results");
    if (display)
        $div.fadeIn(800);
    else
        $div.fadeOut(500);
}

function clearSearcher() {
    $searcher = $("#searcher");
    $searcher.val("");
    toggleSearchResults(false);
}

$(()=>{
    // Secondary: Can send topic to friends
    window.parent.runtimeOnMessageReadyExplorer();
})