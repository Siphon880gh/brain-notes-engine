// alert("index.js loaded");

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


function animateExploreCurriculum() {
    $("#explore-curriculum .card-header")
        .animate({ "color": "red" }, 1000)
        .delay(500)
        .animate({ "color": "black" }, 2000)
}


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


$(()=>{
    // UX: Can collapse summary reading to more easily reach the topics navigator
    document.querySelector("#summary-collapser")?.addEventListener("click", (event) => {
        // Reset the bottom expand/collapse shortcut button
        document?.querySelector("#shortcut-summary-collapser")?.classList.toggle("fa-minus");
        document?.querySelector("#shortcut-summary-collapser")?.classList.toggle("fa-plus");
        if(event.target.className.includes("stated")) {
            event.target.classList.remove("stated");
            document.querySelector("#side-a .deemp-fieldset").classList.add("d-none");
        } else {
            event.target.classList.add("stated");
            document.querySelector("#side-a .deemp-fieldset").classList.remove("d-none");
        }

    });


    // UX: Copy summary to practice area
    document.querySelector("#gamify-now")?.addEventListener("click", (event) => {
        $('#retype-container, #rearrange-container').removeClass('hide'); 
        copyOver(); 
        document.querySelector('#retype-container').scrollIntoView()
    });

}); // On index.html ready

// Secondary: Can send topic to friends
function runtimeOnMessageReadyExplorer() {
    setTimeout(()=>{
        if (window.location.search.includes("open=")) {

            const paramVal = window.location.search.replaceAll("%20", " ").replace(/\.md$/, "").replace(/^\?open\=/, "").replace(/#(.*)/, "");
            // $curriculumExplorer = $("#explore-curriculum iframe").contents();
            curriculumExplorerWindow = $("#explore-curriculum iframe")[0].contentWindow
            curriculumExplorerWindow.searchAllTitles({searchText: paramVal, jumpTo: false});
            // debugger;

                var topic = "";
                function attemptOpenTutorial() {
                    var topic = (new URLSearchParams(window.location.search).get("open")); // ?open=topicName
                    var jumpTo = "";
                    if(window.location.hash) { // ?open=topicName#jumpToSection
                        jumpTo = window.location.hash;
                    }
                    var $explorerList = $("#explore-curriculum iframe").contents();
                    var explorerWindow = $("#explore-curriculum iframe")[0].contentWindow;
                    // var $explorer = $explorerList.find(`.name[data-folder-name]:contains('${topic}')`); // files have data-folder-name
                    var $explorerFileLis = $explorerList.find(`.name.is-file:contains('${topic}')`)?.eq(0); // files have data-folder-name
                    
                    if($explorerFileLis.length) {
                        // $explorer.parent().find(".fa-book-reader").click();
                        var title = topic.replaceAll("%20", " ").replace(/\.md$/, "").replace(/^\?open\=/, "");
                        // const url = window.location.href;
                        const url = explorerWindow.titleLooksupPathTp(explorerWindow.folders, title)
                        // console.log({title,url})
                        //debugger

                        explorerWindow.openNote(title, url);
                        // debugger;
                        // Go to specific section of the tutorial, if applicable
                        if(jumpTo) {
                            setTimeout(()=>{
                                console.log({jumpTo})
                                document.querySelector(jumpTo).scrollIntoView();
                            }, 250)
                        }
                        return true;
                    } else {
                        return false;
                    }
                }
                setTimeout(()=>{
                    var success = attemptOpenTutorial();
                    if(!success) {
                        setTimeout(()=>{
                            var success = attemptOpenTutorial();
                            if(!success) {
                                setTimeout(()=>{
                                    var success = attemptOpenTutorial();
                                    if(!success) {
                                        setTimeout(()=>{
                                            var success = attemptOpenTutorial();
                                            alert("The tutorial you are looking for is not found. Please reach out to your friend who shared it.\n" + topic)
                                        }, 300) // if not successful, repeat 3rd time
                                    }
                                }, 300) // if not successful, repeat 2nd time
                            }
                        }, 300)
                    } // if not successful, repeat 2nd time
                }, 300)

        } else if(window.location.search.includes("search-titles=")) {
                
                /**
                 * Detect presetted topic search in URL
                 * #topicName
                 */

                // Decided to phase out so that anchor jumping is possible with # in the URL
                // var explorer = document.querySelector("iframe").contentWindow.document
                // explorer.querySelector("#searcher-2").value = decodeURIComponent(window.location.hash.length?window.location.hash.substr(1):"")

                // var button = explorer.querySelector("#searcher-2-btn");
                // var event = new MouseEvent('click', {
                //     bubbles: false,
                //     cancelable: true
                // });

                // // Dispatch the event to the button
                // button.dispatchEvent(event);

                /**
                 * Detect presetted topic search in URL
                 * ?search-titles=topicName
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

} // runtimeOnMessageReadyExplorer


function htmlTableOfContents(tocEl, markdownContentEl) {
    var headings = [].slice.call(markdownContentEl.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    tocEl.innerHTML = "";

    // var debuggingHeadings = "";
    // alert(headings.length)

    headings.forEach(function(heading, i) {
        // ref is either generic (toc-1) or the jump link of the subheading
        var ref = "toc" + i;
        if (heading.hasAttribute("id"))
            ref = heading.getAttribute("id");
        else
            heading.setAttribute("id", ref);

        // alert(ref)
        var link = document.createElement("a");
        link.setAttribute("href", "#" + ref);
        link.textContent = heading.textContent;
        link.textContent = link.textContent.replaceAll("🔗","").trim()
        link.classList.add("toc-link");

        link.addEventListener("click", ()=>{
            // Make up for the document title covering the heading you jumped to.
            setTimeout(()=>{
                window.scrollTo({top:window.scrollY-60})
            }, 100);
        })

        var div = document.createElement("div");
        div.classList.add(heading.tagName.toLowerCase());

        // div.addEventListener("click", ()=>{
        //     $('#mobile-tap').click()
        //     document.querySelector('#mobile-tap').classList.remove('active');
        // })
        // link.addEventListener("click", ()=>{
        //     document.querySelector('#mobile-tap').classList.remove('active');
        // })
        // link.setAttribute("onclick", "document.querySelector('#mobile-tap').click();")

        div.appendChild(link);
        tocEl.appendChild(div);
    });

    if(headings.length) {
        document.querySelector('#toc-toggler').classList.add('filled')
    } else {
        document.querySelector('#toc-toggler').classList.remove('filled')
    }
    // console.log(debuggingHeadings)
} // htmlTableOfContents


    // Hide brain link that is the current brain
    document.querySelectorAll("[data-hide-if-url-contains]").forEach(el=>{
        const willMatchUrlContains = el.getAttribute("data-hide-if-url-contains")
        const matched = window.location.href.indexOf(willMatchUrlContains)!==-1;
        if(matched) el.classList.add("hidden")
    });
    document.querySelector(".more-notes").classList.remove("invisible");

    // Update See what's changed
    fetch("env/urls.json")
    .then(response=>response.json())
    .then(resource=>{
        const {commitsURL,openURL} = resource;
        // window.commitsURL = commitsURL;
        // window.openURL = openURL;
        document.querySelector("#whats-changed").setAttribute("href", commitsURL);
    })