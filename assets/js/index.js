var app = {
    init: async function() {

        const resource = await fetch("./cachedResData.json").then(response=>response.json());

        window.folders = resource.dirs;
        window.sortSpec = resource.sort_spec;
        
        // initFolderDoms();
        
        this.setupCountNotes();
        this.setupTooltipInteraction();
        this.setupRefreshPage();
        
        this.setupMoreNotebooks();
        this.setupExploreInteractions();
        this.setupExpandAllFolders._init()
        this.setupJumpToTopics._init();
        this.setupExpandNote();
        this.setupCanReceiveSharedNote();
        this.setupRandomNote._init();

    }, // init



    setupCountNotes: function() {
        if (document?.getElementById("count-notes")) {
            const countNotes = document.querySelectorAll(".name.is-file").length;
            document.getElementById("count-notes").innerText = `${countNotes - 2} Notes!`;
        }
    }, // setupCountNotes

    setupTooltipInteraction: function() {
        // Close tooltip if clicked outside
        setTimeout(() => {
            $('body').on('click', function (e) {
                //debugger;
                var $el = $(e.target);
                if ($el?.data('toggle') !== 'tooltip' && $el.closest(".tooltip").length === 0) {
                    $(".tooltip-inner").closest(".tooltip").prev().click();
                }
            });

        }, 100)
    }, // setupTooltipInteraction

    setupRefreshPage: function() {
        // Clicking title refreshes page
        document.getElementById("title").addEventListener("click", ()=>{
            window.location.search="";
        });
    }, // setupRefreshPage

    setupMoreNotebooks: function() {

        // Hide brain link that is the current brain
        document.querySelectorAll("[data-hide-if-url-contains]").forEach(el => {
            const willMatchUrlContains = el.getAttribute("data-hide-if-url-contains")
            const matched = window.location.href.indexOf(willMatchUrlContains) !== -1;
            if (matched) el.classList.add("hidden")
        });
        document.querySelector(".more-notes").classList.remove("invisible");
    }, // setupMoreNotebooks

    setupExploreInteractions: function() {

        document.querySelectorAll(".name.is-folder").forEach(el=>{
            el.addEventListener("click", (event)=>{
                event.stopPropagation();
                event.preventDefault();
                const el = event.target;
                const id = el.dataset["id"];

                var ul = el.querySelector('ul'); 
                if(ul) { 
                    ul.style.display = ul.style.display === 'none' ? 'block' : 'none';
                }
            }); // click
        });
        document.querySelectorAll(".name.is-file").forEach(el=>{
            el.addEventListener("click", (event)=>{
                event.stopPropagation();
                event.preventDefault();
                const el = event.target;
                const id = el.dataset["id"];

                openNote(id)
            }); // click
        });
    }, // setupExploreInteractions

    setupExpandNote: function() {
        // UX: Can collapse summary reading to more easily reach the topics navigator
        document.getElementById("summary-collapser")?.addEventListener("click", (event) => {
            // Reset the bottom expand/collapse shortcut button
            if (event.target.className.includes("stated")) {
                event.target.classList.remove("stated");
                document.getElementById("summary-outer").classList.add("hidden");
            } else {
                event.target.classList.add("stated");
                document.getElementById("summary-outer").classList.remove("hidden");
            }

        });
    }, // setupExpandNote

    setupCanReceiveSharedNote: function() {
        setTimeout(() => {
            if (window.location.search.includes("open=")) {
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
                                    noteHeadingElement.scrollIntoView();
                                }
                            }, 250);
                        }
                        return true;
                    } else {
                        return false;
                    }
                }
    
                setTimeout(() => {
                    var success = attemptOpenTutorial();
                    if (!success) {
                        setTimeout(() => {
                            var success = attemptOpenTutorial();
                            if (!success) {
                                setTimeout(() => {
                                    var success = attemptOpenTutorial();
                                    if (!success) {
                                        setTimeout(() => {
                                            var success = attemptOpenTutorial();
                                            alert("The tutorial you are looking for is not found. Please reach out to your friend who shared it.\n" + topic)
                                        }, 300) // if not successful, repeat 3rd time
                                    }
                                }, 300) // if not successful, repeat 2nd time
                            }
                        }, 300)
                    } // if not successful, repeat 2nd time
                }, 300)
    
            } else if (window.location.search.includes("search-titles=")) {
    
                /**
                 * Detect presetted topic search in URL
                 */
                var params = new URLSearchParams(window.location.search);
                var qtopic = params.get("search-titles");
    
    
                // remove ?search-titles=topicName, so when you click jump anchor link, the url doesn't become ?search-titles=topicName#subtopic
                (function pushStateWithoutSearch() {
                    // Get the current URL
                    const currentUrl = new URL(window.location);
    
                    // Modify the URL to remove the search part (query parameters)
                    currentUrl.search = '';
    
                    // Use history.pushState to change the URL without reloading
                    history.pushState({}, '', currentUrl);
                })();
    
                if (qtopic) {
                    var checkIframeLoading = setInterval(() => {
                        window.$curriculumExplorer = $("#explore-curriculum iframe").contents();
                        var doesTreeExist = () => $curriculumExplorer.find(".accordion").length > 0;
    
                        if (doesTreeExist) {
                            clearInterval(checkIframeLoading);
                            setTimeout(() => {
                                $topicField = $curriculumExplorer.find("#searcher"),
                                    $topicBtn = $curriculumExplorer.find("#searcher-2-btn");;
                                $topicField.val(qtopic);
                                $topicBtn.click();
                            }, 1200); // Just because part of a tree exist, doesn't mean the whole tree exists right away
                        }
                    }, 100);
                }
            } // if search-titles
        }, 300)
    
    }, // setupCanReceiveSharedNote
    
    setupExpandAllFolders: {
        _init: function() {
            document.getElementById("expand-all-folders").addEventListener("click", ()=>{
                this.expandAllFolders();
            })
        }, // init

        expandAllFolders: function() {
            const $styleBlock = $("#style-toggle-all-expand");
            const isOn = $styleBlock.text().trim().length > 0;
            if (isOn) {
                $styleBlock.text("");
            } else {
                $styleBlock.html("ul { display: block !important; }");
            }
        } // expandAllFolders
    }, // setupExpandAllFolders

    setupJumpToTopics: {
        /**
         * Setup Jump to Topics
         * First click Jump to Topics will show folder of all the notes that the opened note is from
         * And if clicked within 2 seconds, jumps up to the top of the topics showing the search controls
         */
        lastClickedNote: null,
        thresholdJumpedTopics: false,
        _init: function() {
            document.querySelector("#jump-curriculum").addEventListener("click", ()=>{
                this.jumpToTopics();
            });
        },
        jumpToTopics: function() {
        
            if (!this.thresholdJumpedTopics && this.lastClickedNote) {
                this.lastClickedNote.closest("ul").scrollIntoView();
                // document.querySelector('#side-b').scrollIntoView({ behavior: 'smooth' });
                window.addEventListener("scrollend", () => {
                    window.scrollBy({ top: -30, left: 0, behavior: "smooth" });
                }, { once: true });
                this.thresholdJumpedTopics = true;
                setTimeout(() => {
                    this.thresholdJumpedTopics = false;
                }, 2000);
                return;
            }
            // document.querySelector('#side-b').scrollIntoView({ behavior: 'smooth' });
            // document.querySelector('#side-b').querySelector('iframe').contentWindow.scrollTo({ top: 0 });
            document.querySelector('#side-b').scrollIntoView({ behavior: 'smooth' });
            // window.scrollTo({ top: 0 });
        }, // jumpToTopics

    }, // setupJumpToTopics

    setupRandomNote: {
        _init: function() {
            document.getElementById("get-random-note").addEventListener("click", ()=>{
                this.openRandomNote();
            });
        },
        openRandomNote: function() {
            const randomIndex = Math.floor(Math.random() * window.folders.length);
            const noteId = folders[randomIndex].id;
            openNote(noteId);
        }
    }, // setupRandomNote

} // app
app.init();


/** @ ACCORDION LOGIC */

var toOpenUp = [];

function toOpenUp_Exec(row) {

    toOpenUp = [];
    toOpenUp.unshift(row);

    // closest looks on itself and ancestors
    while (row.parentElement.closest("li")) {
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


/** @ JUMP/SCROLL TO **/

/* When scrolling to a topic, the row also gets highlighted */
function highlightRow(row) {
    row.classList.add("highlight");
}
