function initFolderDoms() {
    document.getElementById("topics-list").innerHTML = "";
    // console.log(folders);

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

    // Sort the folders array based on the order defined in sortCriteria
    // Please note this only work on remote because the remote copy will switch out the path to some Obsidian path in another ~ folder, 
    // whereas remote copy will have Obsidian path in the same root folder

    // debugger;
    if (window?.sortSpec) {

        var sortCriteriaMd = window.sortSpec;

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
    } // if sortspec


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
        }

        $name.click((event) => {
            var $self = $(event.target);
            if ($self.hasClass("is-file")) {
                $self.parent().find(".fa-book-reader").click();
                window.lastClickedNote = $self[0];
            }
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

        // console.log(`lookupMetas[item.path]: `, lookupMetas[item.path])
        if (lookupMetas[item.path]) {
            // Extract property from metas. If property not defined at +meta.json, then it'll be value undefined
            var { summary, footerFile, titleOverridden, desc, gotos } = lookupMetas[item.path];
            if (titleOverridden)
                console.log({ titleOverridden })

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

                $summary.on("click", (event) => {
                    const row = event.target.closest("li");
                    if (row.className.includes("highlight")) { row.classList.remove("highlight"); }
                    let title = row.querySelector(".name").textContent;
                    title = title.replace(/\.md$/, "");
                    console.log({ title, url })
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

        // // Update See what's changed and Link sharing
        // fetch("env/urls.json")
        //     .then(response => response.json())
        //     .then(resource => {
        //         const { commitsURL, openURL } = resource
        //         window.commitsURL = commitsURL;
        //         window.openURL = openURL;

        //         // Update See what's changed
        //         window.document.querySelector("#whats-changed").setAttribute("href", commitsURL);
        //     })


        var $ul = $("<ul>");
        $ul.addClass("ul-root")

        for (var i = 0; i < folders.length; i++) {
            // debugger;
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
        $ul.appendTo("#topics-list");

        countNotes();

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
            // // path = $li.attr("data-path");
            // path = titleLookupsPath(folders, name);
            // $("#open-command").val(`cd '${realpath}/${path}'`);

            event.preventDefault();
            event.stopPropagation();
        });

        // Root icons
        // Would not be performant if done at all levels
        $("#topics-list > ul > li > span.name.is-folder").each((i, el) => {

            const folderName = $(el).text().trim();
            if (typeof icons !== "undefined" && icons) {
                if (icons[folderName]) {
                    el.innerHTML = '<span class="custom-icon">' + icons[folderName] + "</span>" + el.innerHTML;
                }
            }
        });

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

        // document.getElementById("searcher").autocomplete({
        //     source: folderFlattenedNames
        // });
    })


} // initFolderDoms
// initFolderDoms();
