var app = {
    init: async function() {
        this.setupLatestNotes();

        // Inject the topics tree HTML partial before anything else reads #topics-list.
        // Served as a static .html so the browser can cache it via Last-Modified / 304.
        try {
            const partialHtml = await fetch("./cachedResPartial.html").then(r => r.text());
            const topicsList = document.getElementById("topics-list");
            if (topicsList) topicsList.innerHTML = partialHtml;
        } catch (e) {
            console.error("Failed to load cachedResPartial.html", e);
        }
        window.__topicsReady = true;
        document.dispatchEvent(new CustomEvent("topics-ready"));

        const resource = await fetch("./cachedResData.json").then(response=>response.json());

        window.folders = resource.dirs;
        window.sortSpec = resource.sort_spec;
        
        // Load imaged notes data for random note prioritization
        try {
            const imagedResource = await fetch("./cachedResDataImaged.json").then(response=>response.json());
            window.foldersImaged = imagedResource.dirs;
        } catch (e) {
            console.warn("cachedResDataImaged.json not found, random note will use all notes");
            window.foldersImaged = [];
        }
        
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
        this.setupQuizModal();

    }, // init

    setupLatestNotes: function() {
        const root = document.getElementById("latest-notes");
        const modal = document.getElementById("latestNotesModal");
        if (!root || !modal || !window.commitsURL) return;

        const actionBtn = document.getElementById("latest-notes-action");
        const modeBtn = document.getElementById("latest-notes-mode");
        const menu = document.getElementById("latest-notes-menu");
        const listEl = document.getElementById("latest-notes-list");
        const moreLink = document.getElementById("latest-notes-more");
        const modeKey = "devbrain-latest-notes-mode";
        let mode = "notes";

        try {
            const saved = localStorage.getItem(modeKey);
            if (saved === "commits" || saved === "notes") mode = saved;
        } catch (e) {}

        moreLink.href = window.commitsURL;

        const syncMenu = () => {
            menu.querySelectorAll("[data-mode]").forEach((item) => {
                item.setAttribute("aria-checked", item.getAttribute("data-mode") === mode ? "true" : "false");
            });
        };
        const closeMenu = () => {
            menu.hidden = true;
            modeBtn.setAttribute("aria-expanded", "false");
        };
        const openMenu = () => {
            menu.hidden = false;
            modeBtn.setAttribute("aria-expanded", "true");
        };

        syncMenu();

        modeBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            if (menu.hidden) openMenu();
            else closeMenu();
        });

        menu.addEventListener("click", (event) => {
            const item = event.target.closest("[data-mode]");
            if (!item) return;
            mode = item.getAttribute("data-mode") === "commits" ? "commits" : "notes";
            try { localStorage.setItem(modeKey, mode); } catch (e) {}
            syncMenu();
            closeMenu();
        });

        document.addEventListener("click", (event) => {
            if (!root.contains(event.target)) closeMenu();
        });

        const closeModal = () => {
            modal.style.display = "none";
        };
        modal.querySelectorAll('[data-dismiss="modal"]').forEach((el) => {
            el.addEventListener("click", closeModal);
        });
        modal.addEventListener("click", (event) => {
            if (!event.target.closest(".modal-content")) closeModal();
        });

        const noteLabel = (el) => {
            const clone = el.cloneNode(true);
            clone.querySelectorAll(".custom-icon, .quiz-pill, .csv-pill").forEach((node) => node.remove());
            return clone.textContent.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
        };

        const openMatchedNote = (title) => {
            const wanted = title.trim().toLowerCase();
            const files = Array.from(document.querySelectorAll(".name.is-file"));
            let file = files.find((el) => noteLabel(el) === wanted);
            if (!file) {
                const partial = files.filter((el) => noteLabel(el).includes(wanted));
                if (partial.length === 1) file = partial[0];
            }
            if (!file || !file.dataset.id || typeof openNote !== "function") return;
            const row = file.closest("li");
            if (row && typeof toOpenUp_Exec === "function") toOpenUp_Exec(row);
            openNote(file.dataset.id);
            const side = document.getElementById("side-a");
            if (side) side.scrollIntoView({ behavior: "smooth", block: "start" });
        };

        const searchTitle = (title) => {
            const go = () => {
                const input = document.getElementById("searcher-input");
                if (input) {
                    input.removeAttribute("readonly");
                    input.value = title;
                }
                if (typeof window.searchAllTitles === "function") {
                    window.searchAllTitles({
                        searchText: title,
                        jumpTo: false,
                        recommendContent: true
                    });
                }
                openMatchedNote(title);
            };
            if (window.__topicsReady) go();
            else document.addEventListener("topics-ready", go, { once: true });
        };

        const renderNotes = (groups) => {
            listEl.replaceChildren();
            if (!groups.length) {
                const empty = document.createElement("p");
                empty.className = "latest-notes-modal__empty";
                empty.textContent = "No notes in the last 5 days.";
                listEl.appendChild(empty);
                return;
            }
            groups.forEach((group) => {
                const heading = document.createElement("h5");
                heading.className = "latest-notes-modal__day";
                heading.textContent = group.dateLabel;
                listEl.appendChild(heading);
                group.notes.forEach((title) => {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "latest-notes-modal__note";
                    button.textContent = title;
                    button.addEventListener("click", () => {
                        closeModal();
                        searchTitle(title);
                    });
                    listEl.appendChild(button);
                });
            });
        };

        const loadNotes = async () => {
            listEl.replaceChildren();
            const loading = document.createElement("p");
            loading.className = "latest-notes-modal__empty";
            loading.textContent = "Loading recent notes…";
            listEl.appendChild(loading);

            const cacheKey = "devbrain-latest-notes:" + window.commitsURL;
            try {
                const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
                if (cached && Array.isArray(cached.groups) && Date.now() - cached.at < 10 * 60 * 1000) {
                    renderNotes(cached.groups);
                    return;
                }
            } catch (e) {}

            try {
                const groups = await fetchLatestNoteGroups(window.commitsURL);
                try {
                    sessionStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), groups }));
                } catch (e) {}
                renderNotes(groups);
            } catch (e) {
                listEl.replaceChildren();
                const failed = document.createElement("p");
                failed.className = "latest-notes-modal__empty";
                failed.textContent = "Could not load recent commits.";
                listEl.appendChild(failed);
            }
        };

        actionBtn.addEventListener("click", () => {
            closeMenu();
            if (mode === "commits") {
                window.open(window.commitsURL, "_blank", "noopener");
                return;
            }
            modal.style.display = "block";
            loadNotes();
        });

        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape") return;
            if (!menu.hidden) closeMenu();
            else if (modal.style.display === "block") closeModal();
        });
    }, // setupLatestNotes

    setupQuizModal: function() {
        document.getElementById('openQuizAppButton')?.addEventListener('click', function() {
            window.open('https://wengindustries.com/app/quiz-gsheet/gsheets/_Special%20-%20User%20Provides/Intake.php', '_blank');
        });
    }, // setupQuizModal
    
    setupCountNotes: function() {
        if (document?.getElementById("count-notes")) {
            const countNotes = document.querySelectorAll(".name.is-file:not(.is-quiz)").length;
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

        const topicsList = document.getElementById("topics-list");
        if (topicsList) {
            const clearFolderHighlight = () => {
                topicsList.querySelectorAll(".accordion.meta.highlight").forEach(el => el.classList.remove("highlight"));
            };
            topicsList.addEventListener("click", clearFolderHighlight, true);
            topicsList.addEventListener("mouseenter", clearFolderHighlight, true);
        }

        document.querySelectorAll(".name.is-folder").forEach(el=>{
            el.addEventListener("click", (event)=>{
                const folderEl = event.target.closest('.name.is-folder');
                if (!folderEl) return;

                let interruptDefaultBehaavior = sendToOtherWorkhouses(folderEl)
                if(interruptDefaultBehaavior) {
                    return;
                }
                event.stopPropagation();
                event.preventDefault();

                const row = folderEl.closest('li');
                const ul = row?.querySelector('ul');
                if(ul) {
                    ul.style.display = ul.style.display === 'none' ? 'block' : 'none';
                }
            }); // click
        });
        document.querySelectorAll(".name.is-file").forEach(el=>{
            el.addEventListener("click", (event)=>{
                event.stopPropagation();
                event.preventDefault();
                const el = event.target.closest('.name.is-file');
                if (!el) return;
                const id = el.dataset["id"];
                const row = el.closest("li");

                if (el.classList.contains('is-quiz')) {
                    window.lastClickedNote = row;
                    openQuiz(id);
                    return;
                }
                
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
            const chevron = document.getElementById("random-note-chevron");
            const dropdown = document.getElementById("random-note-dropdown");
            
            button.addEventListener("click", () => {
                this.openRandomNote();
                button.disabled = true; // Disable the button
                setTimeout(() => {
                    button.disabled = false; // Re-enable the button after 2 seconds
                }, 2000); // 2000 milliseconds = 2 seconds
            });
            
            // Toggle dropdown on chevron click
            chevron.addEventListener("click", (e) => {
                e.stopPropagation();
                const isVisible = dropdown.style.display !== "none";
                dropdown.style.display = isVisible ? "none" : "block";
                chevron.classList.toggle("active", !isVisible);
            });
            
            // Close dropdown when clicking outside
            document.addEventListener("click", (e) => {
                if (!e.target.closest("#random-note-wrapper")) {
                    dropdown.style.display = "none";
                    chevron.classList.remove("active");
                }
            });
        },
        openRandomNote: function() {
            const prioritizeImages = document.getElementById("prioritize-images")?.checked ?? true;
            let noteElement = null;
            
            // If prioritize images is enabled and we have imaged notes
            if (prioritizeImages && window.foldersImaged && window.foldersImaged.length > 0) {
                // Filter to only .md files (not directories)
                const imagedNotes = window.foldersImaged.filter(item => item.current.endsWith('.md'));
                
                if (imagedNotes.length > 0) {
                    const i = Math.floor(Math.random() * imagedNotes.length);
                    const selectedNote = imagedNotes[i];
                    
                    // Find the correct ID by matching path_tp in the main folders array
                    const matchingFolder = window.folders.find(f => f.path_tp === selectedNote.path_tp);
                    if (matchingFolder) {
                        noteElement = document.querySelector(`.name.is-file[data-id="${matchingFolder.id}"]`);
                        if (noteElement) {
                            this.expandToNote(noteElement);
                            openNote(matchingFolder.id);
                            return;
                        }
                    }
                }
            }
            
            // Fallback: use all notes from DOM
            const notes = Array.from(document.querySelectorAll(".name.is-file:not(.is-quiz)"));
            const i = Math.floor(Math.random() * notes.length);
            noteElement = notes[i];
            const noteId = noteElement.dataset["id"];
            this.expandToNote(noteElement);
            openNote(noteId);
        },
        expandToNote: function(noteElement) {
            // Expand all parent folders to make the note visible when user navigates to topics
            if (!noteElement) return;
            
            let parent = noteElement.closest('ul');
            while (parent) {
                // Show this ul
                parent.style.display = 'block';
                // Move up to next parent ul
                parent = parent.parentElement?.closest('ul');
            }
            
            // Store reference for "Jump to Topics" functionality
            const row = noteElement.tagName.toLowerCase() === "li" ? noteElement : noteElement.closest("li");
            window.lastClickedNote = row;
            
            // Note: We don't auto-scroll here to keep user at the opened note content at top
            // User can use "See topics" button to jump to the note in the folder tree
        }
    }, // setupRandomNote

} // app

/**
 * Open a quiz CSV file in the quiz modal.
 * @param {string|number} id - cachedResData.json entry id
 */
function openQuiz(id) {
    fetch("local-open.php?id=" + id)
        .then(response => response.text())
        .then((yamlTextish) => {
            const titleMatch = yamlTextish.match(/^title:\s*(.*?)\n/);
            const htmlMatch = yamlTextish.match(/^html:\s*\|([\s\S]*)/m);

            let title = titleMatch ? titleMatch[1].replace(/^ {2}/gm, '').trim() : 'Quiz';
            title = title.replace(/\.quiz\.csv$/i, '');

            let csvContent = htmlMatch ? htmlMatch[1].replace(/^ {2}/gm, '') : '';
            if (csvContent) {
                csvContent = csvContent
                    .split(/\r?\n/)
                    .filter(line => !/^,+$/.test(line.trim()))
                    .join('\n')
                    .trim();
            }

            if (csvContent === '__PRIVATE_BLOCKED__') {
                openPrivateAuthAndRetryQuiz(id);
                return;
            }

            document.getElementById('quizCsvText').value = csvContent;
            document.getElementById('quizModalLabel').textContent = 'Quiz: ' + title;
            document.getElementById('quizModal').modal('show');

            document.getElementById('copyQuizCsvButton').onclick = function() {
                const textarea = document.getElementById('quizCsvText');
                const button = this;
                const originalText = button.innerHTML;
                const onCopied = () => {
                    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    button.classList.add('btn-success');
                    button.classList.remove('btn-primary');
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.classList.remove('btn-success');
                        button.classList.add('btn-primary');
                    }, 2000);
                };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(textarea.value).then(onCopied);
                } else {
                    textarea.select();
                    textarea.setSelectionRange(0, 99999);
                    document.execCommand('copy');
                    onCopied();
                }
            };
        });
}

function openPrivateAuthAndRetryQuiz(quizId) {
    if (window.privateAuthManager) {
        window.privateAuthManager.showModal();

        const authHandler = (event) => {
            if (event.detail.authenticated) {
                window.privateAuthManager.hideModal();
                openQuiz(quizId);
                document.removeEventListener('privateAuthChanged', authHandler);
            }
        };

        document.addEventListener('privateAuthChanged', authHandler);
    }
}

function fetchLatestNoteGroups(commitsURL) {
    const match = String(commitsURL).match(/github\.com\/([^/]+)\/([^/]+)\/commits\/([^/#?]+)/i);
    if (!match) return Promise.reject(new Error("Unrecognized commits URL"));

    const since = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    let pageUrl = "https://api.github.com/repos/" + encodeURIComponent(match[1]) + "/" + encodeURIComponent(match[2])
        + "/commits?sha=" + encodeURIComponent(match[3])
        + "&since=" + encodeURIComponent(since)
        + "&per_page=100";

    const titlesInMessage = (message) => {
        const titles = [];
        const re = /"([^"]+?\.md)"/gi;
        let found;
        while ((found = re.exec(message))) {
            const title = found[1].replace(/\.md$/i, "").trim();
            if (title) titles.push(title);
        }
        return titles;
    };

    const dayLabel = (iso) => new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    const readPage = (url, pagesLeft) => fetch(url, {
        headers: { Accept: "application/vnd.github+json" }
    }).then((response) => {
        if (!response.ok) throw new Error("GitHub commits request failed");
        const next = (response.headers.get("Link") || "").match(/<([^>]+)>;\s*rel="next"/);
        return response.json().then((commits) => {
            if (!Array.isArray(commits)) throw new Error("Unexpected commits payload");
            if (next && pagesLeft > 1) {
                return readPage(next[1], pagesLeft - 1).then((rest) => commits.concat(rest));
            }
            return commits;
        });
    });

    return readPage(pageUrl, 3).then((commits) => {
        const seen = new Set();
        const groups = [];
        commits.forEach((commit) => {
            const iso = commit && commit.commit && commit.commit.author && commit.commit.author.date;
            const message = commit && commit.commit && commit.commit.message;
            if (!iso || !message) return;
            const titles = titlesInMessage(message).filter((title) => {
                const key = title.toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
            if (!titles.length) return;
            const dateKey = iso.slice(0, 10);
            let group = groups.find((item) => item.dateKey === dateKey);
            if (!group) {
                group = { dateKey: dateKey, dateLabel: dayLabel(iso), notes: [] };
                groups.push(group);
            }
            group.notes.push.apply(group.notes, titles);
        });
        return groups;
    });
}

app.init();

// #region TODO: BELOW NEED REFACTOR

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
    return rootUL ? traverseList(rootUL) : '';
  }
  
  function sendToOtherWorkhouses(el) {
    if (window.modeShareFolder) {
        window.modeShareFolder = false;
        const shareFolderBtn = document.getElementById('share-folder-btn');
        if (shareFolderBtn) {
            shareFolderBtn.classList.remove("active");
            shareFolderBtn.querySelector('.share-folder-text').innerHTML = 'Share folder';
        }
        const folderLi = el.closest ? el.closest('li.accordion.meta[data-path]') : null;
        if (!folderLi) return false;
        const path = folderLi.getAttribute('data-path');
        if (!path) return false;
        const url = window.location.origin + window.location.pathname + '?folder=' + encodeURIComponent(path);
        document.getElementById('shareModalLabel').textContent = 'Share folder link';
        document.getElementById('shareSnippet').value = url;
        document.getElementById('shareModal').modal('show');
        return true;
    }
    if(window.modeAskAI) {
        const folderLi = el.closest ? el.closest('li.accordion.meta') : null;
        if (!folderLi) return false;

        // Toggle logic
        window.modeAskAI = false;
        document.getElementById('ai-assist-btn').click();

        // AI prompting logic
        const enums = {OPEN_FOLDER: 0, DONT_OPEN_FOLDER:1}
        const basePath = window.location.origin + window.location.pathname;
        let hierarchyText = htmlToIndentedList(folderLi.outerHTML, "./")
        let folderName = el.textContent.trim();
        let userQuestion = prompt(`Ask the AI about these notes at ${folderName}?\n\nEg. What can I learn here?\nEg. How to get started?\n\nPopup: You needs popups enabled to open properly.\nPaid Version: This free version opens your notes directly in ChatGPT and is limited by the model's input size. Need something more powerful that handles bigger note sets and can handle deeper queries? Email weng@wengindustries.com for details on our paid plan. Thanks!`)
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


    // AI Assistant and Share Folder functionality
    function initFolderOptionsAndAI() {
        const folderOptionsWrapper = document.getElementById('folder-options-wrapper');
        const folderOptionsToggle = document.getElementById('folder-options-toggle');
        const aiBtn = document.getElementById('ai-assist-btn');
        const shareFolderBtn = document.getElementById('share-folder-btn');
        let aiActive = false;
        let shareFolderActive = false;

        if (folderOptionsToggle && folderOptionsWrapper) {
            folderOptionsToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                folderOptionsWrapper.classList.toggle('expanded');
            });
            document.addEventListener('click', function(e) {
                if (!folderOptionsWrapper.contains(e.target)) {
                    folderOptionsWrapper.classList.remove('expanded');
                }
            });
        }


        function deactivateShareFolder() {
            if (shareFolderActive && shareFolderBtn) {
                window.modeShareFolder = false;
                shareFolderBtn.classList.remove("active");
                shareFolderBtn.querySelector('.share-folder-text').innerHTML = 'Share folder';
                shareFolderActive = false;
            }
        }
        function deactivateAI() {
            if (aiActive && aiBtn) {
                window.modeAskAI = false;
                aiBtn.classList.remove("active");
                aiBtn.querySelector('.ai-text').innerHTML = 'Ask folder';
                aiActive = false;
            }
        }

        if (aiBtn) aiBtn.addEventListener('click', function() {
            if (!aiActive) {
                deactivateShareFolder();
                window.modeAskAI = true;
                aiBtn.classList.add("active");
                aiBtn.querySelector('.ai-text').innerHTML = 'AI Active<br><small>Click a folder. Ask it!</small>';
                aiActive = true;
            } else {
                deactivateAI();
            }
        });

        if (shareFolderBtn) {
            shareFolderBtn.addEventListener('click', function() {
                if (!shareFolderActive) {
                    deactivateAI();
                    window.modeShareFolder = true;
                    shareFolderBtn.classList.add("active");
                    shareFolderBtn.querySelector('.share-folder-text').innerHTML = 'Active<br><small>Click a folder</small>';
                    shareFolderActive = true;
                } else {
                    deactivateShareFolder();
                }
            });
        }
    }

    if (window.__topicsReady) {
        initFolderOptionsAndAI();
    } else {
        document.addEventListener('topics-ready', initFolderOptionsAndAI, { once: true });
    }

// #endregion
