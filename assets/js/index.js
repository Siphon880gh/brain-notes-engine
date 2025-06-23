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
            const possibleMatches = willMatchUrlContains.split(',').map(s => s.trim());
            const matched = possibleMatches.some(match => window.location.href.indexOf(match) !== -1);
            if (matched) el.classList.add("hidden")
        });
        document.querySelector(".more-notes").classList.remove("invisible");

        // Handle clicks on the ::after pseudo-element area (mobile expand text)
        $(document).on('click', '.more-notes:not(.mobile-active)', function(e) {
            // Get the position of the click relative to the element
            const rect = this.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            const elementHeight = $(this).outerHeight();
            
            // Check if click is in the bottom area where ::after pseudo-element appears
            // The ::after element appears below the main content
            if (clickY > elementHeight - 25) { // 25px is approximate area of ::after content
                $(this).toggleClass('mobile-active');
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }, // setupMoreNotebooks

    setupExploreInteractions: function() {

        document.querySelectorAll(".name.is-folder").forEach(el=>{
            el.addEventListener("click", (event)=>{
                let interruptDefaultBehaavior = sendToOtherWorkhouses(event.target)
                if(interruptDefaultBehaavior) {
                    return;
                }
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
            document.querySelector('#side-b').scrollIntoView({ behavior: 'smooth' });
        }, // jumpToTopics

    }, // setupJumpToTopics

    setupRandomNote: {
        _init: function() {
            const button = document.getElementById("get-random-note");
            button.addEventListener("click", () => {
                this.openRandomNote();
                button.disabled = true; // Disable the button
                setTimeout(() => {
                    button.disabled = false; // Re-enable the button after 2 seconds
                }, 2000); // 2000 milliseconds = 2 seconds
            });
        },
        openRandomNote: function() {
            const notes = Array.from(document.querySelectorAll(".name.is-file"));
            const i = Math.floor(Math.random() * notes.length);
            const noteId = notes[i].dataset["id"];
            openNote(noteId);
        }
    }, // setupRandomNote

} // app
app.init();

/**
 * 
 * @param {*} html 
 * @param {*} prefixCurriculumUrl Blank string by default. Otherwise we show links next to documents with the URL prefix here.
 * @returns 
 */
function htmlToIndentedList(html, prefixCurriculumUrl="", maxDepth=2, maxItems=20) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
  
    function traverseList(ulElement, indent = 0, currentDepth = 0) {
      if (currentDepth >= maxDepth) {
        return '';
      }

      const items = [];
      const liElements = Array.from(ulElement.children).slice(0, maxItems);
      
      for (let li of liElements) {
        const textEl = li.querySelector('.name');
        if (textEl) {
          let label = textEl.textContent.trim();
  
          if (prefixCurriculumUrl && textEl.tagName === 'A' && textEl.href) {
            label += ` (${textEl.getAttribute('href')})`;
          }
  
          items.push(`${'\t'.repeat(indent)}${label}`);
        }
  
        const nestedUL = li.querySelector('ul');
        if (nestedUL) {
          const nestedItems = traverseList(nestedUL, indent + 1, currentDepth + 1);
          if (nestedItems) {
            items.push(nestedItems);
          }
        }
      }

      if (ulElement.children.length > maxItems) {
        items.push(`${'\t'.repeat(indent)}... ${ulElement.children.length - maxItems} more items`);
      }

      return items.join('\n');
    }
  
    const rootUL = doc.querySelector('ul');
    return traverseList(rootUL);
  }
  
  function sendToOtherWorkhouses(el) {
    if(window.modeAskAI) {
        // Toggle logic
        window.modeAskAI = false;
        document.getElementById("ai-assist-btn").classList.remove("active");

        // AI prompting logic
        const enums = {OPEN_FOLDER: 0, DONT_OPEN_FOLDER:1}
        const basePath = window.location.origin + window.location.pathname;
        let hierarchyText = htmlToIndentedList(el.outerHTML, "./")
        let folderName = Array.from(el.childNodes).reduce((str, el) => {
            if(el.nodeType === Node.TEXT_NODE || el.tagName.toLowerCase() !== "ul") {
                return str + (el.textContent || '');
            }
            return str;
        }, '').trim(); // Add empty string as initial value
        let userQuestion = prompt(`Ask the AI about these notes at ${folderName}?\n\nEg. What can I learn here?\nEg. How to get started?\n\nNote: This free version opens your notes directly in ChatGPT and is limited by the model’s input size. If you see an HTTP 431 error, the folder you’re sending is too large. Need something more powerful that handles bigger note sets? Email weng@wengindustries.com for details on our paid plan. Thanks!`)
        if (!userQuestion) return enums.OPEN_FOLDER;
        
        // Sanitize user input by removing special characters and limiting length
        userQuestion = userQuestion
            .replace(/[^\w\s?.,]/g, '') // Remove special chars except basic punctuation
            .trim()
            .slice(0, 250); // Limit lengt
            
        
        let promptText = `Given this hierarchy of topics, answer user's question. If it cannot answer user's question, then tell the user that the knowledge isn't part of the notes and that they can reach out to Weng if they want specific notes for this at "weng@wengindustries.com". But then provide your knowledge. You may visit the relative URLs to get more information if needed. The basepath for those relative URLs is ${basePath}
    
    User's question:
    ${userQuestion.trim()}
    
    Hiearchy of topics:
    """
    ${hierarchyText}
    """`;
        
        // Check if prompt is too large (over 4000 characters)
        if (promptText.length > 4000) {
            // Show modal with prompt for manual copy/paste
            document.getElementById('largePromptText').value = promptText;
            document.getElementById('largePromptModal').modal('show');
            
            // Setup copy button functionality
            document.getElementById('copyLargePromptButton').onclick = function() {
                const textarea = document.getElementById('largePromptText');
                textarea.select();
                textarea.setSelectionRange(0, 99999); // For mobile devices
                document.execCommand('copy');
                
                // Visual feedback
                const button = this;
                const originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i> Copied!';
                button.classList.add('btn-success');
                button.classList.remove('btn-primary');
                
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.classList.remove('btn-success');
                    button.classList.add('btn-primary');
                }, 2000);
            };
            
            // Setup open ChatGPT button functionality
            document.getElementById('openChatGPTButton').onclick = function() {
                window.open('https://chatgpt.com/?m=I%20will%20paste%20the%20prompt.', '_blank');
            };
        } else {
            window.open(`https://chatgpt.com/?m=${promptText}`);
        }
        return enums.OPEN_FOLDER;
    } // modeAskAI

    

  } // sendToOtherWorkhouses