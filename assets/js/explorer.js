/** @ UTILITY FUNCTIONS **/
// alert("explorer.js loaded");

window.countNotes = 0;

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



// Sort the folders array based on the order defined in sortCriteria
// Please note this only work on remote because the remote copy will switch out the path to some Obsidian path in another ~ folder, 
// whereas remote copy will have Obsidian path in the same root folder

if (window?.sortspecs) {

    var sortCriteriaMd = window.sortspecs;

    // This is the content of sortspec.md
    // const sortCriteriaMd = `
    // ---
    // sorting-spec: |
    //   AI App Development
    //   Game Development, Unreal
    //   Web Development
    //   Web Development - Rapid Development
    // ---
    // `;
    // console.log({sortCriteriaMd})

    // Function to parse the sorting spec
    function parseSortSpec(content) {
        // Find the sorting-spec block and extract the folders
        const match = content.match(/sorting-spec:\s*\|\s*([\s\S]*?)\s*---/);
        if (match && match[1]) {
            // Split the block into lines and trim whitespace
            return match[1].split('\n').map(s => s.trim()).filter(Boolean);
        }
        return [];
    }

    // Get the ordered folders from the sort spec
    const sortCriteria = parseSortSpec(sortCriteriaMd);
    console.log({ sortCriteria }); // Logs the ordered folder names criteria

    // Sort the folders array based on the order defined in sortCriteria
    let hadSortSpec = false;
    folders = folders.sort((a, b) => {
        const indexA = sortCriteria.indexOf(a.path_tp);
        const indexB = sortCriteria.indexOf(b.path_tp);

        if (!hadSortSpec && (indexA !== -1 || indexB !== -1)) {
            hadSortSpec = true;
        }

        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB; // both in ordered list, sort by their order
        } else if (indexA !== -1) {
            return -1; // only a is in ordered list, a comes first
        } else if (indexB !== -1) {
            return 1; // only b is in ordered list, b comes first
        } else {
            return a.path_tp.localeCompare(b.path_tp); // neither in ordered list, sort alphabetically
        }
    });


    // Sort so that folders come first
    // if(!hadSortSpec) {
    //     folders = folders.sort((a, b) => {
    //         // Check if "fa-folder" is a substring of the path_tp
    //         const hasFaFolderA = !a.path_tp.includes('.') && a.path_tp.includes('/');
    //         const hasFaFolderB = !b.path_tp.includes('.') && b.path_tp.includes('/');

    //         // Prioritize those with "fa-folder"
    //         if (hasFaFolderA && !hasFaFolderB) {
    //             return -1; // a has "fa-folder", so it comes first
    //         } else if (!hasFaFolderA && hasFaFolderB) {
    //             return 1; // b has "fa-folder", so it comes first
    //         } else {
    //             return -1;
    //         }
    //     })
    // }

    // console.log("Retrieved sortspec.md from Obsidian and rearranged folders:\n" + folders.map(f=>f.path_tp))

} // if sortspec

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

function scrollWithOffset(element, offset = -70) {
    // Scrolls to the element smoothly
    element.scrollIntoView({ behavior: "smooth" });

    // After a slight delay, apply the offset
    // setTimeout(() => {
    //     window.scrollBy({ top: offset, left: 0, behavior: "smooth" });
    // }, 300); // Adjust the delay if needed
    window.parent.addEventListener("scrollend", () => {
        window.parent.scrollBy({ top: offset, left: 0, behavior: "smooth" });
        console.log("scrollend");
    }, { once: true });
} // scrollWithOffset

function openNote(title, url="") {
    // return;
    url = url.replaceAll("+", "___plus___"); // encodeURI doesn't encode +, so we do it manually, and decode it in php
    url = url.replaceAll("&", "___and___");
    var newUrl = window.dirSnippets + url;
    newUrl = encodeURI(newUrl);
    console.log({ dirSnippetsFilePath: newUrl });

    fetch("local-open.php?filepath=" + newUrl)
    .then(response => response.text()).then((summary) => {

        parent.document.querySelector(".side-by-side-possible.hidden")?.classList?.remove("hidden");

        // Show notes in textarea
        var hasParent = Boolean(parent.document.querySelector("#summary-inner"))

        let summaryInnerEl = parent.document.querySelector("#summary-inner");
        if (hasParent)
            summaryInnerEl.classList.remove("hide");

        var md = window.markdownit({
            html: true,
            linkify: true
        }).use(window.MarkdownItLatex)
        .use(window.markdownItAnchor, {
            level: [1, 2, 3, 4, 5, 6], // Apply to all heading levels
            slugify: function (s) {
                return s.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '');
            },
            permalink: true,
            permalinkHref: (slug, state) => {
                let s = slug;
                s = "javascript:window.parent.shareTutorialSection('?open=" + encodeURI(title) + "#" + s + "');"; // ?open=Data%20Lake.md#Section1
                return s;
            },
            permalinkSymbol: '🔗' // Set to true if you want a permalink symbol
            // Other options as needed
        });

        // md.renderer.rules.newline = (tokens, idx) => {
        //     return '\n';
        // };

        // Fixes: I have separate lines in md format. How come they're run-on's when rendered with markdown?
        // Principle: Markdown's Line Break Rules: In Markdown, simply pressing "Enter" once at the end of a line does not create a new paragraph or line break in the rendered output. Instead, lines directly below each other without an empty line between them are treated as part of the same paragraph and are joined together.
        // Solution: Add two spaces at the end of each line to force a line break, unless the adjacent line is a blank line.
        summary = (function doubleNewLine(text) {
            return text.replace(/(.+)(\n)(?!\n)/g, "$1  \n");
        })(summary);

        function convertNotesToDetails(inputText) {
            const lines = inputText.split('\n');
            const outputLines = [];
            let i = 0;

            while (i < lines.length) {
                const line = lines[i];
                const noteMatch = line.match(/^>\s*\[!note\]\s*(.*)$/i);

                if (noteMatch) {
                    // Start of a note block
                    const summaryText = noteMatch[1].trim();
                    const contentLines = [];

                    i++;
                    // Collect the content lines that start with '>'
                    while (i < lines.length && lines[i].startsWith('>')) {
                        const contentLine = lines[i].replace(/^>\s*/, ''); // Remove '>' and possible spaces
                        contentLines.push(contentLine);
                        i++;
                    }

                    const content = contentLines.join('\n');
                    const detailsHtml = `<details>\n<summary>${summaryText}</summary>\n<div class="border ml-3 p-1">${content}</div>\n</details><br/>`;
                    outputLines.push(detailsHtml);
                } else {
                    outputLines.push(line);
                    i++;
                }
            }

            return outputLines.join('\n');
        }  // convertNotesToDetails

        summary = convertNotesToDetails(summary);


        var summaryHTML = md.render(summary);
        if (hasParent) {
            parent.document.querySelector("#summary-title").textContent = title;
            parent.document.querySelector("#summary-collapser").classList.remove("d-none");
            parent.document.querySelector("#summary-collapser").classList.add("stated");
            parent.document.querySelector("#summary-sharer").classList.remove("d-none");
            parent.document.querySelector("#side-a .deemp-fieldset").classList.remove("d-none");
            // parent.document.querySelector("#dashboard").classList.add("active");
        }

        // When copied HTML from W3School to Obsidian, it's a special space character. 
        // This special space character will get rid of // from https:// in src
        // So lets convert back to typical space

        summaryHTML = summaryHTML.replaceAll(/\xA0/g, " ");

        function replaceBracketsWithLinks(htmlString) {
            return htmlString.replace(/\[\[(.*?)\]\]/g, function (match, p1) {
                const encodedText = encodeURIComponent(p1); // To handle special characters in URLs
                return `<a target="_blank" href="${window.openURL}${encodedText}">${p1}</a>`;
            });
        }
        summaryHTML = replaceBracketsWithLinks(summaryHTML);

        if (hasParent) {

            summaryInnerEl.innerHTML = summaryHTML;
            setTimeout(() => {
                // target blank for links
                summaryInnerEl.querySelectorAll("a").forEach(a => {
                    if (a.href.includes(window.openURL) || a.href.includes("localhost") || a.innerText.includes("🔗"))
                        return true;

                    a.setAttribute("target", "_blank");

                    // Youtube Embeds
                    (function () {
                        // Exit quickly if this is the wrong type of URL
                        if (this.protocol !== 'http:' && this.protocol !== 'https:') {
                            return;
                        }

                        // Find the ID of the YouTube video
                        var id, matches;
                        if (this.hostname === 'youtube.com' || this.hostname === 'www.youtube.com') {
                            // For URLs like https://www.youtube.com/watch?v=xLrLlu6KDss
                            // debugger;
                            matches = this.search.match(/[?&]v=([^&]*)/);
                            id = matches && matches[1];
                        } else if (this.hostname === 'youtu.be') {
                            // For URLs like https://youtu.be/xLrLlu6KDss
                            id = this.pathname.substr(1);
                        }
                        // console.log({ hostname: this.hostname })

                        // Check that the ID only has alphanumeric characters, to make sure that
                        // we don't introduce any XSS vulnerabilities.
                        var validatedID;
                        if (id && id.match(/^[a-zA-Z0-9\_]*$/)) {
                            validatedID = id;
                        }

                        // Add the embedded YouTube video, and remove the link.
                        if (validatedID) {
                            $(this)
                                .before('<div class="responsive-iframe-container"><iframe src="https://www.youtube.com/embed/' + validatedID + '" frameborder="0" allowfullscreen></iframe></div>')
                                .remove();
                        }

                    }).call(a);

                }) // for all a in the tutorial
            }, 250);

            // Scroll up
            // Jump up to content
            // window.parent.document.getElementById("summary-title").scrollIntoView();
            window.parent.document.getElementById("explore-curriculum").scrollIntoView({
                behavior: "smooth",
            });

            // Render table of contents at top right
            let tocEl = window.parent.document.querySelector("#toc")
            let markdownContentEl = window.parent.document.querySelector("#summary-inner")
            window.parent.htmlTableOfContents(tocEl, markdownContentEl);

            // Allow copy from textarea to practice areas
            let guideCopyToPractice = parent.document.querySelector("#js-visible-if-contents");
            guideCopyToPractice.classList.remove("hide");

        } // if has parent

        if (!hasParent) {
            var newTab = window.open("about:blank");
            newTab.document.write(summaryHTML);
            newTab.document.close();
        }
        
        window.parent.document
            .querySelector("#summary-inner")
            .querySelectorAll('img').forEach(img => {
                // Create a wrapper div with the specified classes
                const wrapperDiv = document.createElement('div');
                wrapperDiv.className = 'img-wrapper flex flex-row flex-start';
                
                // Insert the image inside the wrapper div
                img.parentNode.insertBefore(wrapperDiv, img);
                wrapperDiv.appendChild(img);
                
                // Create the sibling div with icons
                const iconContainer = document.createElement('div');
                iconContainer.className = 'flex flex-col justify-start';

                const iconGroupA = document.createElement('div');
                iconGroupA.className = 'flex flex-col gap-6 p-2';
                
                const iconGroupB = document.createElement('div');
                iconGroupB.className = 'flex flex-col gap-6 p-2';
                
                // Add the icons
                const icon1 = document.createElement('i');
                icon1.className = 'fas fa-columns clickable';
                icon1.onclick=(event)=>{
                    const imgWrapper = event.target.closest(".img-wrapper")
                    const img = imgWrapper.querySelector("img");
                    function removeAllStates() {
                        img.classList.remove("state-1");
                        img.classList.remove("state-2");
                        img.classList.remove("state-3");
                    }
                    if(img.className.includes("state-1")) {
                        removeAllStates();
                        img.classList.add("state-2");
                    } else if(img.className.includes("state-2")) {
                        removeAllStates();
                    } else {
                        img.classList.add("state-1");
                    }
                } // icon1
                
                const icon2 = document.createElement('i');
                icon2.className = 'fas fa-align-center clickable';
                icon2.onclick=(event)=>{
                    const imgWrapper = event.target.closest(".img-wrapper")
                    const img = imgWrapper.querySelector("img");
                    img.classList.toggle("centered");
                } // icon2

                iconGroupA.appendChild(icon1);
                iconGroupA.appendChild(icon2);

                const icon3 = document.createElement('i');
                icon3.className = 'fas fa-level-down-alt clickable';
                icon3.onclick=(event)=>{
                    const imgWrapper = event.target.closest(".img-wrapper");
                    const nextLine = (imgWrapper.parentElement.id==="summary-inner" ? 
                        imgWrapper.nextElementSibling : 
                        (()=>{
                            let currentElement = imgWrapper;

                            // Traverse up until you find the #summary-inner parent
                            while (currentElement && !currentElement?.nextElementSibling) {
                                currentElement = currentElement.parentElement; // Move to the parent element
                            }

                            // After the loop, correctChild will hold the correct previous sibling
                            console.log(currentElement);
                            const nextElementSibling = currentElement?.nextElementSibling;

                            if(nextElementSibling)
                                return nextElementSibling;
                            else
                                return null;
                        })(imgWrapper)
                    );
                    // nextLine.scrollIntoView({ behavior: "smooth", top:"-40px" });
                    // debugger;
                    scrollWithOffset(nextLine);
                } // icon3
                iconGroupB.appendChild(icon3);
                
                // Append the icon div as a sibling to the image's wrapper div
                iconContainer.append(iconGroupA);
                iconContainer.append(iconGroupB);
                wrapperDiv.append(iconContainer);
        });

        // Add progress markers on the left
        const notePanel = window.parent.document.querySelector("#summary-inner");
        const parentWindow = window.parent;
        parentWindow.removeScrollProgressMarkers(notePanel);
        parentWindow.hydrateAnimationOnProgressMarkers(notePanel);
        parentWindow.addScrollProgressMarkers(notePanel);

    }) // fetch md
}; // openNote

// console.log(folders);
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
    // var $liDom = $(`<li class="accordion meta" data-path="${item.path}"></li>`);
    var $liDom = $(`<li class="accordion meta"></li>`);

    var possFolderStr = (() => {
        if (item.next.length && !item.current.includes(".md"))
            return `<span class="fas fa-folder"></span>&nbsp;`
        else
            return "";
    })();
    var name = possFolderStr + item.current
    var $name = $(`<span class="name">${name}</span>`);
    if (possFolderStr.length) {
        $name.addClass("is-folder");
    } else {
        $name.addClass("is-file");
        window.countNotes++;
    }

    $name.click((event) => {
        var $self = $(event.target);
        if ($self.hasClass("is-file"))
            $self.parent().find(".fa-book-reader").click();
    })
    $liDom.append($name);

    // sortspec.md wasn't hidden from the php side because we needed it in js for custom sorting criteria. Now hide it from user though
    if (item.current.includes("sortspec.md")) {
        $liDom.hide();
    }

    // Hide README
    if (item.current === "README.md") {
        $liDom.hide();
    }

    // package.json hidden (for now have client do this)
    if (item.current.includes("package.json")) {
        $liDom.hide();
    }
    $noteBtns = $(`<span class="note-item-buttons"></span>`);
    var $meta = $liDom;
    // var $meta = $liDom.find(".meta");

    if (lookupMetas[item.path]) {
        // Extract property from metas. If property not defined at +meta.json, then it'll be value undefined
        // var { summary, footerFile, titleOverridden, desc, gotos } = lookupMetas[item.path];

        // Folder text overridden vs not overridden
        // $meta.find(".name").attr("data-folder-name", item.current);
        // if (titleOverridden && titleOverridden.length) {
        //     $meta.find(".name").html(titleOverridden);
        // }

        createSummaryIconAndContents(item.path_tp, $noteBtns);

        function createSummaryIconAndContents(url, $noteBtns) {
            // TODO: item.path
            // debugger;

            var $summary = $(`<span class="fas fa-book-reader"></span>`);

            $summary.on("click", (event)=>{
                const row = event.target.closest("li");
                if(row.className.includes("highlight")) { row.classList.remove("highlight"); } 
                let title = row.querySelector(".name").textContent;
                title = title.replace(/\.md$/, "");
                console.log({title,url})
                openNote(title, url);


            })
            // For future intern () [] feature
            // $queriedInfoButton = $noteBtns.find(".fa-info");
            // if ($queriedInfoButton.length) {
            //     $summary.insertAfter($queriedInfoButton);
            // } else {
            //     $noteBtns.prepend($summary);
            // }

            $noteBtns.prepend($summary);
        } // createSummaryIconAndContents

    } // hasMeta

    $liDom.append($noteBtns);

    return $liDom;
} // objToHtml


$(() => {


    // Update See what's changed
    fetch("env/urls.json")
        .then(response => response.json())
        .then(resource => {
            const { commitsURL, openURL } = resource
            window.commitsURL = commitsURL;
            window.openURL = openURL;
        })


    var $ul = $("<ul>");
    $ul.addClass("ul-root")
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
        $this.children(".note-item-buttons, ul").toggle("active");
    });

    // Accordion onclicks
    $(".name").on("click", (event) => {
        var $name = $(event.target);
        var name = $name.text()

        // Expanding/collapsing
        $li = $name.closest("li.accordion");
        $li.children(".note-item-buttons, ul").toggle("active");
        $name.toggleClass("minus");

        // Open command
        // path = $li.attr("data-path");
        path = titleLookupsPath(folders, name);
        $("#open-command").val(`cd '${realpath}/${path}'`);


        event.preventDefault();
        event.stopPropagation();
    });

    // Root icons
    // Would not be performant if done at all levels
    $("#target > ul > li > span.name.is-folder").each((i, el) => {

        const folderName = $(el).text().trim();
        if (typeof icons !== "undefined" && icons) {
            if (icons[folderName]) {
                el.innerHTML = '<span class="custom-icon">' + icons[folderName] + "</span>" + el.innerHTML;
            }
        }
    });

    if (window?.parent?.document?.querySelector("#count-notes"))
        window.parent.document.querySelector("#count-notes").innerText = `${window.countNotes - 2} Notes!`;

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

    $("#searcher").autocomplete({
        source: folderFlattenedNames
    });
})

/** @ ACCORDION LOGIC */

var toOpenUp = [];

function toOpenUp_Exec($row) {
    // console.log($row);
    // console.log("RAAAAANN")

    toOpenUp = [];
    toOpenUp.unshift($row);

    // closest looks on itself and ancestors
    while ($row.parent().closest("li").length) {
        $row = $row.parent().closest("li");
        toOpenUp.unshift($row);
    }
    // var ran = false;
    toOpenUp.forEach((li) => {
        // if(ran) return;

        var $li = $(li),
            isCollapsed = $li.children("ul").css("display") === "none";
        if (isCollapsed) {
            // $li.children("ul",).toggle("active");
            $li.children("ul",).css("display", "block");
        }
        // debugger;

        // if(!ran) { ran = true }
    }); // 1st li is outermost
}

function highlightRow($row) {
    $row.addClass("highlight");
}


/** @ JUMP/SCROLL TO **/

function scrollToText(partial, callback = false) {
    let $finalJumpTo = null;
    var $foundRow = $(`li:contains(${partial})`);
    if ($foundRow.length === 0)
        alert("The search returned blank:\n" + partial)
    
    $foundRow.each((i, row) => {
        var $row = $(row)
        toOpenUp_Exec($row);
        // debugger
        if($row?.children(0)?.[0]?.textContent?.toLowerCase()?.includes(partial.toLowerCase())) {
            highlightRow($row);
            // setTimeout(()=>{
            //     $row[0].scrollIntoView();
            // }, 500)
            $finalJumpTo = $row;
        }
    });

    return $finalJumpTo;

} // scrollToText

function scrollToFolderName(partial) {
    partial = partial.toLowerCase();
    if (partial.length === 0) return;

    if (partial[0] === '+') partial = partial.substr(1);
    var $foundRow = $(".name.is-folder").filter((i, el) => {
        return el.parentElement.dataset["path"].toLowerCase().indexOf(partial) >= 0
    }
    );
    $foundRow = $foundRow.map((i, el) => $(el).closest("li"));

    $foundRow.each((i, row) => {
        var $row = $(row)
        toOpenUp_Exec($row);
        highlightRow($row);
        $row[0].scrollIntoView();
    });
} // scrollToFolderName


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
function checkIfEmptiedSearch(event, $btn) {
    $searcher = $("#searcher");
    if ($searcher.val().length === 0) {
        toggleSearchResults(false);
        // $(".ui-autocomplete").hide();
    }

    // if (event.keyCode === 13) {
    //     $(".ui-autocomplete").hide();
    //     event.preventDefault();
    //     $btn.click();
    // }
} // checkSearcherSubmit

function searchAllContents(query) {
    if (query.length === 0) {
        alert("Error: Nothing typed!");
        return false;
    }
    const originalQuery = query;
    query = escapeRegExp(query);
    if (query.length === 0) return;

    $div = $("#search-results .contents");
    fetch("search.php?search=" + query)
        .then(response => response.text())
        .then(greps => {
            try {
                greps = JSON.parse(greps); // grep results array
            } catch (err) {
                if(greps.length===0) {
                    alert("No results found for: " + originalQuery);
                    return;
                }
                console.error(err);
                console.log({ greps });
            }
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
                // Eg. [ 0: "/Users/wengffung/Library/CloudStorage/GoogleDrive-siphon880g@gmail.com/My Drive/_Obsidian MD/Document Vaults/Content-Published/Dev/AI Engineer/Models - Text Generation/Llama 2.md:Testing the llama2.ai 70 billion parameter model"

                // Find the index of the first colon to split the string
                const firstColonIndex = res.indexOf(":");

                // Extract the full file path
                const fullPath = res.substring(0, firstColonIndex);

                // Extract the matching text (trim to remove any leading/trailing whitespace)
                const matchText = res.substring(firstColonIndex + 1).trim();

                // Split the path into parts using '/' as the separator
                const pathParts = fullPath.split('/').filter(Boolean); // filter(Boolean) removes empty elements

                // Get the filename (last element of the pathParts array)
                const filename = pathParts[pathParts.length - 1];

                // Get the folder name (second last element of the pathParts array)
                const folderName = pathParts[pathParts.length - 2];

                // Now you can use filename, folderName, and matchText as needed
                console.log(`Filename: ${filename}`);
                console.log(`Folder Name: ${folderName}`);
                console.log(`Match Text: ${matchText}`);

                $tbody.append(`
            <tr>
              <td><a onclick="scrollToFolderName('${folderName}')" href="javascript:void(0);">${folderName}</a></td>
              <td><a onclick="openFromSearchedContentsResults('${filename}')" href="javascript:void(0)">${filename}</a></td>
              <td class="context"><pre>${matchText}</pre></td>
              </tr>`);
                //   <td><a onclick="var url = new URL(window.location.href); url.search = '?open=${filename}'; window.open(url.toString());">${filename}</a></td>
                // <td><a onclick="var url = new URL(window.location.href); url.searchParams.set('open', ${filename})'; window.open(url.toString());">${filename}</a></td>
                //   <td><a onclick="window.parent.location.search = '?open=${filename}'">${filename}</a></td>

            }); // foreach
            $("#table-search-results pre").highlight($("#searcher").val());
            toggleSearchResults(true);

            // Scroll to bottom where search results are
            window.scrollTo(0, document.body.scrollHeight);
        });
} // searchAllContents

function searchAllTitles({searchText, jumpTo=false, callback}) {
    if (searchText.length === 0) {
        alert("Error: Nothing typed!");
        return false;
    }
    const $finalJumpTo = scrollToText(searchText, callback);

    if(jumpTo) {
        setTimeout(() => {
            if ($finalJumpTo)
                $finalJumpTo[0].scrollIntoView();
            setTimeout(() => {
                if (callback)
                    callback();
            }, 500)
        }, 800);
    }
} // searchAllTitles

function toggleSearchResults(display) {
    $div = $("#search-results");
    if (display)
        $div.fadeIn(800);
    else
        $div.fadeOut(500);
}

function clearSearcher($searcher) {
    $searcher.val("");
    toggleSearchResults(false);
    $(".highlight").removeClass("highlight");
}

function titleLookupsPathTp(data, searchPhrase) {
    for (const item of data) {
        if (item.current && item.current.toLowerCase().includes(searchPhrase.toLowerCase())) {
        return item.path_tp;
        } else if (item.next && item.next.length) {
        const result = titleLookupsPathTp(item.next, searchPhrase);
        if (result) return result;
        }
    }
    return null; // if not found
}


function titleLookupsPath(data, searchPhrase) {
    for (const item of data) {
        if (item.current && item.current.toLowerCase().includes(searchPhrase.toLowerCase())) {
        return item.path;
        } else if (item.next && item.next.length) {
        const result = titleLookupsPath(item.next, searchPhrase);
        if (result) return result;
        }
    }
    return null; // if not found
}

$(() => {
    // Secondary: Can send topic to friends
    if (window?.parent?.runtimeOnMessageReadyExplorer)
        window.parent.runtimeOnMessageReadyExplorer();

    $('#copyButton').click(function () {
        var copyText = document.getElementById("shareSnippet");
        copyText.select();
        document.execCommand("copy");
        // alert("Copied the text: " + copyText.value); // Optional: alert message
    });

    $(window).scroll(function () {
        // if($(window).scrollTop() + $(window).height() == $(document).height()) {
        // alert("bottom!");
        // window.print();
        // }
        $("#share-search-title-wrapper").addClass("hidden");
    });
})


$(() => {
    function expandIframeInParent() {
        // setTimeout(()=>{
        let parentWindow = window.parent;
        let originalScrollPos = parentWindow.scrollY + window.parent;
        // debugger
        originalScrollPos = window.scrollY

        console.log({ originalScrollPos })

        var scrollHeight = document.body.clientHeight + 50;
        window.parent.document.querySelector("#explorer-iframe").style.height = (scrollHeight + 10) + "px";

        parentWindow.scrollTo({ top: originalScrollPos })

        console.log({ parentWindow })
        // }, 500);
    } // expandIframeInParent

    function sortSuchThatFoldersFirst() {
        $('#target ul').each(function () {
            var $ul = $(this);

            // Skip the root 'ul' with the class 'ul-root'
            if (!$ul.hasClass('ul-root')) {
                var $li = $ul.children('li');

                // Separate the 'li' elements into folders and files
                var $folders = $li.filter(function () {
                    return $(this).children('span.name').hasClass('is-folder');
                });

                var $files = $li.filter(function () {
                    return $(this).children('span.name').hasClass('is-file');
                });

                // Append folders and files back to the 'ul' to reorder them
                // This moves the existing elements without removing them, preserving event handlers
                $ul.append($folders).append($files);
            }
        });
    } // sortSuchThatFoldersFirst

    // const expandIframeInParent_X1 = ()=>{
    //     expandIframeInParent();
    //     $('.is-folder').off('click', expandIframeInParent_X1);
    // }

    // Sort so folders before files
    const sortSuchThatFoldersFirst_X1 = () => {
        sortSuchThatFoldersFirst();
        $('.is-folder').off('click', sortSuchThatFoldersFirst_X1);
    }

    // $(".is-folder").click(expandIframeInParent_X1);
    $('.is-folder').on('click', sortSuchThatFoldersFirst_X1);

    if(window.innerWidth>768) {
        $(".is-folder").click(expandIframeInParent);
    }

    // $('#target ul').each(function() {
    //     // Check if this 'ul' is not the root level
    //     // if ($(this).parentsUntil('#target', 'ul').length >= 1) {
    //     if (!$(this).hasClass("ul-root")) {
    //         var $ul = $(this);
    //         var $li = $ul.children('li');

    //         // Separate the 'li' elements into folders and files
    //         var $folders = $li.filter(function() {
    //             return $(this).children('span.name').hasClass('is-folder');
    //         });

    //         var $files = $li.filter(function() {
    //             return $(this).children('span.name').hasClass('is-file');
    //         });

    //         // Clear the current 'ul' and append folders first, then files
    //         $ul.empty().append($folders).append($files);
    //     }
    // });

    // setTimeout(()=>{


    // }, 2000)


})

function openFromSearchedContentsResults(filename) {
    var url = new URL(window.location.href); 
    url.searchParams.set('open', filename);
    url = url.toString().replace("explorer.php", "index.php").replace(/\+/g, '%20');;
    window.open(url);
} // openFromSearchedContentsResults

const randomNoteSystem = {
    flattened: [],

    _flatten: function(data) {
        for (const item of data) {
            this.flattened.push(item); // Add the current item to flattened
            if (item.next && item.next.length) {
                this._flatten(item.next); // Recursively add nested items
            }
        }
    },

    _filterInMD: function() {
        this.flattened = this.flattened.filter(obj=>obj.current.substr(-3).toLowerCase()===".md")
    },

    init: function(data) {
        this.flattened = []; // Reset flattened array
        this._flatten(data); // Populate flattened array with all items
        this._filterInMD(); // Filter out folders
        return this; // Return this for chaining
    },

    get: function() {
        // Check if flattened array is populated
        if (this.flattened.length === 0) {
            console.warn("No items found. Ensure init(data) is called with a valid dataset.");
            return null;
        }
        // Return a random item from the flattened array
        return this.flattened[Math.floor(Math.random() * this.flattened.length)];
    }
};

// Usage:
const aRandomNoteSystem = randomNoteSystem.init(folders);
function getRandomNoteLogical() {
    const {current, path_tp} = aRandomNoteSystem.get();
    return {title:current, url:path_tp}
}
// console.log("Random Object:", getRandomNote());

function getRandomNoteByUser() {
    const randomNote = getRandomNoteLogical()
    openNote(randomNote.title, randomNote.url)
    searchAllTitles({searchText: randomNote.title, jumpTo: false});
}