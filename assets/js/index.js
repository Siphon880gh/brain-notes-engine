var app = {
    init: async function() {

        const resource = await fetch("./cachedResData.json").then(response=>response.json());

        window.folders = resource.dirs;
        window.sortSpec = resource.sort_spec;
        
        // initFolderDoms();
        
        this.setupCountNotes();
        this.setupPrint();
        this.setupTooltipInteraction();
        this.setupRefreshPage();
        
        this.setupMoreNotebooks();
        this.setupExploreInteractions();
        this.setupModalOpens();

        this.setupExpandAllFolders._init()
        window.lastClickedNote = null;
        this.setupJumpToTopics._init();
        this.setupExpandNote();
        this.setupRandomNote._init();

    }, // init
    
    setupCountNotes: function() {
        if (document?.getElementById("count-notes")) {
            const countNotes = document.querySelectorAll(".name.is-file").length;
            document.getElementById("count-notes").innerText = `${countNotes - 2} Notes!`;
        }
    }, // setupCountNotes

    setupPrint: function() {
        document.getElementById("print-btn").addEventListener("click", ()=>{
            window.print();
        })
    }, // setupPrint

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
                const row = el.tagName.toLowerCase()==="li"?el:el.closest("li");
                
                window.lastClickedNote = row;

                if(el.parentElement.className.includes("highlight")) {
                    el.parentElement.classList.remove("highlight");
                }

                if(!document.getElementById("share-search-title-wrapper")?.className?.includes("hidden")) {
                    document.getElementById("share-search-title-wrapper").classList.add("hidden")
                }
                
                const btnGroup = row.querySelector(".note-item-buttons")
                if(!btnGroup.querySelector(".fa-book-reader")) {
                    btnGroup.append((()=>{
                        var iTag = document.createElement("i");
                        iTag.className = "fas fa-book-reader";
                        return iTag;
                    })())
                }

                if(!document.getElementById("share-search-title-wrapper")?.className?.includes("hidden")) {
                    document.getElementById("share-search-title-wrapper").classList.add("hidden")
                }

                openNote(id);
            }); // click
        });
    }, // setupExploreInteractions

    setupModalOpens: function() {
        document.querySelectorAll("[data-target]").forEach(el=>{

            el.addEventListener("click", (event)=>{
                var el = event.target;
                if(!el.matches("[data-target")) {
                    el = el.closest("[data-target]");
                }
                var qs = el.getAttribute("data-target");
                if(qs.length>1) {
                    qs = qs.substr(1);
                    document.getElementById(qs).modal("show");
                }
            });
        })
    }, // setupModalOpens

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
        thresholdJumpedTopics: false,
        _init: function() {
            document.querySelector("#jump-curriculum").addEventListener("click", ()=>{
                this.jumpToTopics();
            });
        },
        jumpToTopics: function() {
        
            if (!this.thresholdJumpedTopics && window.lastClickedNote) {
                window.lastClickedNote.closest("ul").scrollIntoView();
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

