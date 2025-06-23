var addonSearch = {
    init: function() {
        this.setupClearingByEmptyingSearchInput();
        this.setupSearchControls._init();
        this.setupCanReceiveSharedNote_Or_SharedSearch();

        window.searchAllTitles = addonSearch.setupSearchControls.searchAllTitles;
        window.openFolderFromSearchedContentsResults = addonSearch.setupSearchControls.__openFolderFromSearchedContentsResults;
        window.openNoteFromSearchedContentsResults = addonSearch.setupSearchControls.__openNoteFromSearchedContentsResults;

        this.setupSearchAutocomplete();
    }, // init
    setupClearingByEmptyingSearchInput: function() {
        // If user erases all text at search input, erase any current search titles results (highlighted rows) and search content results (search results section)
        document.getElementById("searcher-input").addEventListener("keyup", function(event) {
            var searcher = document.getElementById("searcher-input");
            document.getElementById("search-results").style.display = "none";
        })
    }, // setupClearingByEmptyingSearchInput
    setupSearchControls: {
        _init: function() {
            document.getElementById("searcher-btn-titles").addEventListener("click", ()=>{
                this.searchAllTitles({
                    searchText: document.getElementById('searcher-input').value, 
                    jumpTo: true, 
                    callback: ()=> { 
                        /* Show search results button at bottom right */
                        document.getElementById('shareSnippet').value = (window.location.host + window.location.pathname).replaceAll('explorer.php', '') + `?search-titles=${encodeURI(document.getElementById('searcher-input').value)}`;
                        document.getElementById('share-search-title-wrapper').classList.remove('hidden');
                    }
                });
            }); // searcher-btn-titles
            
            document.getElementById("searcher-btn-contents").addEventListener("click", ()=>{
                this.searchAllContents(document.getElementById('searcher-input').value);
            }); // searcher-btn-contents
            
            document.getElementById("searcher-clear").addEventListener("click", ()=>{
                if(confirm('Clear Search?')) this.clearSearcher($('#searcher-input'));
            }); // searcher-clear
        }, // _init
        
        __openFolderFromSearchedContentsResults: function(partial) {
            partial = partial.toLowerCase();
            if (partial.length === 0) return;
            
            let foundRows = Array.from(document.querySelectorAll(".name.is-folder")).filter(el => {
                var index = el.textContent.toLowerCase().indexOf(partial);
                return index>=0 && index<3;
            });
            if (foundRows.length) {
                var row = foundRows[0];
                row.classList.add("highlight");
                toOpenUp_Exec(row);
                // row.scrollIntoView({ behavior: "smooth", left: 0 });
                window.scrollTo({top: row.offsetTop, left: 0, behavior:"smooth"})
            }
        }, // openFolderFromSearchedContentsResults
        
        __openNoteFromSearchedContentsResults: function(filename) {
            var url = new URL(window.location.href);
            url.searchParams.set('open', filename.replace(/\.md$/, ""));
            url = url.toString().replace("explorer.php", "index.php").replace(/\+/g, '%20');;
            window.open(url);
        }, // openNoteFromSearchedContentsResults
        
        searchAllContents: function(query) {
            if (query.length === 0) {
                alert("Error: Nothing typed!");
                return false;
            }
            // Sanitize user input when you need to include it in a regular expression but don't want it to accidentally create unexpected regex patterns.
            function escapeRegExp(string) {
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
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
                    if (greps.length === 0) {
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
                            <td><a onclick="openFolderFromSearchedContentsResults('${folderName}')" href="javascript:void(0);">${folderName}</a></td>
                            <td><a onclick="openNoteFromSearchedContentsResults('${filename}')" href="javascript:void(0)">${filename}</a></td>
                            <td class="context"><pre>${matchText}</pre></td>
                            </tr>`);
                            //   <td><a onclick="var url = new URL(window.location.href); url.search = '?open=${filename}'; window.open(url.toString());">${filename}</a></td>
                            // <td><a onclick="var url = new URL(window.location.href); url.searchParams.set('open', ${filename})'; window.open(url.toString());">${filename}</a></td>
                            //   <td><a onclick="window.location.search = '?open=${filename}'">${filename}</a></td>
                            
                        }); // foreach
                        
                        // Highlight keyword across the in-text search results
                        var value = document.getElementById("searcher-input").value;
                        (function(keyword) {
                            if (!keyword) return;
                            const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                            document.querySelectorAll('#table-search-results pre').forEach(pre => {
                                pre.innerHTML = pre.innerHTML.replace(regex, '<span class="highlight">$1</span>');
                            });
                        })(value);
                        
                        
                        document.getElementById("search-results").style.display = "block";
                        
                        // Scroll to bottom where search results are
                        // window.scrollTo(0, document.body.scrollHeight);
                        document.getElementById("search-results").scrollIntoView({behavior: "smooth"});
                    });
                }, // searchAllContents
                
                searchAllTitles: function({ searchText, jumpTo = false, callback }) {
                    if (searchText.length === 0) {
                        alert("Error: Nothing typed!");
                        return false;
                    }
                    const finalJumpTo = scrollToRow(searchText, callback);
                    
                    if (jumpTo) {
                        setTimeout(() => {
                            if (finalJumpTo)
                                finalJumpTo.scrollIntoView();
                            setTimeout(() => {
                                if (callback)
                                    callback();
                            }, 500)
                        }, 800);
                    }
                }, // searchAllTitles
                
                clearSearcher: function($searcher) {
                    $searcher.val("");
                    document.getElementById("search-results").style.display = "none";
                    $(".highlight").removeClass("highlight");
                }, // clearSearcher
                
            }, // setupSearchControls
            
            setupCanReceiveSharedNote_Or_SharedSearch: function() {
                setTimeout(() => {
                    if(window.location.search.length === 0) return;

                    // Remove Facebook click ID parameter if it exists
                    if (window.location.search.includes('fbclid=')) {
                        const urlParams = new URLSearchParams(window.location.search);
                        urlParams.delete('fbclid');
                        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '') + window.location.hash;
                        window.history.replaceState({}, '', newUrl);
                    }
                    
                    function _openNoteFromUrl() {
                        const paramVal = window.location.search
                        .replaceAll("%20", " ")
                        .replace(/\.md$/, "")
                        .replace(/^\?open=/, "")
                        .replace(/#(.*)/, "");
                        
                        searchAllTitles({ searchText: paramVal, jumpTo: false });
                        
                        let topic = "";
                        
                        function attemptOpenTutorial() {

                            topic = new URLSearchParams(window.location.search).get("open");
                            let jumpToNoteHeading = "";
                            
                            if (window.location.hash) {
                                jumpToNoteHeading = window.location.hash;
                            }
                            
                            const explorerList = document.querySelectorAll(".name.is-file");
                            const topicLowerCase = topic.toLowerCase();
                            const explorerFileLis = Array.from(explorerList)
                            .find(element => element.textContent.toLowerCase().includes(topicLowerCase));
                            
                            if (explorerFileLis) {
                                const title = topic.replaceAll("%20", " ").replace(/\.md$/, "").replace(/^\?open=/, "");
                                const folderMeta = (function titleLookupsFolderMeta(data, searchPhrase) {
                                    for (const item of data) {
                                        if (item.current && item.current.toLowerCase().includes(searchPhrase.toLowerCase())) {
                                            return item;
                                        } else if (item.next && item.next.length) {
                                            const result = titleLookupsFolderMeta(item.next, searchPhrase);
                                            if (result) return result;
                                        }
                                    }
                                    return null; // if not found
                                })(folders, title);

                                if(folderMeta === null) return false;
                                
                                const id = folderMeta.id;
                                openNote(id);
                                
                                if (jumpToNoteHeading) {
                                    setTimeout(() => {
                                        const noteHeadingElement = document.querySelector(jumpToNoteHeading);
                                        if (noteHeadingElement) {
                                            noteHeadingElement.scrollIntoView({behavior:"instant"});
                                            window.addEventListener("scrollend", () => {
                                                window.scrollBy({ top: -30, behavior: "smooth" });
                                            }, { once: true });
                                        }
                                    }, 250);
                                }
                                return true;
                            } else {
                                return false;
                            }
                        }
                        

                        var pollOpenTutorial = setInterval(() => {
                            if(document.readyState === "complete" && typeof folders !== "undefined") {
                                var success = attemptOpenTutorial();
                                if (!success) {
                                    alert("The tutorial you are looking for is not found. Please reach out to your friend who shared it.\n" + topic)
                                }
                                clearInterval(pollOpenTutorial);
                            }
                        }, 50)
                        
                        
                    } // _openNoteFromUrl
                    
                    function _openSearchFromUrl() {
                        
                        var params = new URLSearchParams(window.location.search);
                        var qtopic = params.get("search-titles");
                        var searchInput = document.getElementById("searcher-input");
                        searchAllTitles({ searchText: qtopic, jumpTo: false });
                        
                    } // _openNoteFromUrl
                    
                    if (window.location.search.includes("open=")) {
                        _openNoteFromUrl();
                        
                    } else if (window.location.search.includes("search-titles=")) {
                        _openSearchFromUrl();
                    } // if search-titles
                    
                    
                    
                }, 300)
                
            }, // setupCanReceiveSharedNote
            
            setupSearchAutocomplete: function() {
                (()=>{
                    const noteEls = Array.from(document.querySelectorAll(".name.is-file"));
                    const noteTitles = noteEls.map(element => element.textContent);
                    
                    $("#searcher-input").autocomplete({
                        source: noteTitles
                    });
                 })();
            }, // setupSearchAutocomplete

        } // addonSearch
        
        addonSearch.init();
        
        function scrollToRow(partial, callback = false) {
            let finalJumpTo = null;
            const foundFiles = document.querySelectorAll(".name.is-file");

    let found = false;
    foundFiles.forEach((file) => {
        const row = file.closest("li");
        if (row.textContent.toLowerCase().includes(partial.toLowerCase())) {
            toOpenUp_Exec(row);
            if (row.textContent.toLowerCase().includes(partial.toLowerCase())) {
                row.classList.add("highlight");
                finalJumpTo = row;
                if (callback) callback(row); // If a callback is provided, call it
            }
        }
    });

    if (!finalJumpTo) {
        alert("The search returned blank:\n" + partial);
        return false;
    }

    return finalJumpTo;
} // scrollToRow

function toOpenUp_Exec(row) {

    toOpenUp = [];
    toOpenUp.unshift(row);

    // closest looks on itself and ancestors
    while (row.parentElement?.closest("li")) {
        row = row.parentElement.closest("li");
        toOpenUp.unshift(row);
    }

    // let ran = false;
    toOpenUp.forEach((li) => {
        if(!li.querySelector("ul")) return;

        const isCollapsed = li.querySelector("ul").style.display === "none";
        if (isCollapsed) {
            li.querySelector("ul").style.display = "block";
        }
    }); // 1st li is outermost    
} // toOpenUp_Exec