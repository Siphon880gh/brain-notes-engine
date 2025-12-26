// imported config.imgHostedUrl from index.php (which imported from 3dbrain.config.json)

/**
 * 
 * In the note: Share note modal has Copy button
 */
document.addEventListener("DOMContentLoaded", function () {
    var copyButton = document.getElementById("copyButton");

    copyButton.addEventListener("click", function () {
        var copyText = document.getElementById("shareSnippet");
        copyText.select();
        document.execCommand("copy");
        // alert("Copied the text: " + copyText.value); // Optional: alert message
    });
});

/**
 * 
 * In the note: shareTutorial share icon at the top generates the note share link
 * In the note: shareTutorialSection share icon at a heading generates the note section share link
 */
function shareTutorial() {
    document.getElementById("shareSnippet").value = window.location.host + window.location.pathname + `?open=${encodeURI(document.getElementById("summary-title").textContent)}`
    document.getElementById("shareModal").modal("show");
}

function shareTutorialSection(trailingHash) {
    document.getElementById("shareSnippet").value = window.location.host + encodeURI(window.location.pathname + `${trailingHash}`)
    document.getElementById("shareModal").modal("show");
}


function goToItem() {
    const noteTitle = document.getElementById("summary-title").textContent;
    const noteTitleElement = Array.from(document.querySelectorAll('.name.is-file')).find(el => 
        el.textContent.trim() === noteTitle
    );
    const noteLiElement = noteTitleElement.closest("li");

    noteLiElement.classList.add("highlight");
    toOpenUp_Exec(noteLiElement); // Expand li up to root

    setTimeout(() => {
        noteLiElement.scrollIntoView({behavior: 'smooth'});
        setTimeout(() => {
            window.scrollBy({top: 100, behavior: 'smooth'});
        }, 500);
    }, 150);
} // goToItem


/**
 * 
 * In the note: setTableOfContents makes TOC menu (aka #mobile-tap) at top right appear
 */

document.addEventListener("DOMContentLoaded", function () {
    document.body.addEventListener("click", (event) => {
        if (!event.target.matches('#toc-toggler') && !event.target.closest('#toc-toggler')) { 
            document.querySelector('#mobile-tap').classList.remove('active'); 
        }
    })
    document.getElementById("toc-toggler").addEventListener("click", (event) => {
        event.preventDefault();
        document.querySelector('#mobile-tap').classList.toggle('active');
    });
});

function setTableOfContents(tocEl, markdownContentEl) {
    // Check if TOC has already been numbered to prevent duplicates
    if (tocEl.classList.contains('toc-numbered')) {
        return;
    }
    
    var headings = [].slice.call(markdownContentEl.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    tocEl.innerHTML = "";

    // Create a map to store heading elements and their corresponding TOC links
    const headingToLinkMap = new Map();
    
    // Initialize counters for each heading level
    const counters = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    
    // Add class to prevent duplicate numbering
    tocEl.classList.add('toc-numbered');

    headings.forEach(function (heading, i) {
        // ref is either generic (toc-1) or the jump link of the subheading
        var ref = "toc" + i;
        if (heading.hasAttribute("id"))
            ref = heading.getAttribute("id");
        else
            heading.setAttribute("id", ref);

        var link = document.createElement("a");
        link.setAttribute("href", "#" + ref);
        
        // Get heading level and tag name
        const headingLevel = parseInt(heading.tagName[1]);
        const tagName = heading.tagName.toLowerCase();
        
        // Reset all deeper level counters (levels below current heading)
        for (let level = headingLevel + 1; level <= 6; level++) {
            counters[`h${level}`] = 0;
        }
        
        // Increment counter for this heading level
        counters[tagName]++;
        
        // Build the numbering string with hierarchical format (only current level)
        const formatType = ((headingLevel - 1) % 4) + 1; // Cycle through 1-4 every 4 levels
        const levelCounter = counters[tagName];
        
        let numbering = "";
        switch (formatType) {
            case 1: // Roman numerals (I, II, III, ...)
                numbering = toRomanNumeral(levelCounter);
                break;
            case 2: // Letters (A, B, C, ...)
                numbering = toLetter(levelCounter);
                break;
            case 3: // Numbers (1, 2, 3, ...)
                numbering = levelCounter.toString();
                break;
            case 4: // Lowercase Roman numerals (i, ii, iii, ...)
                numbering = toRomanNumeral(levelCounter).toLowerCase();
                break;
        }
        numbering += ". ";
        
        // Set the link text with numbering
        const originalText = heading.textContent.replaceAll("🔗", "").trim();
        link.textContent = numbering + originalText;
        link.classList.add("toc-link");

        link.addEventListener("click", (event) => {
            // Get the href from the link
            const href = link.getAttribute('href');
            
            // Update the URL in the address bar
            if (href && href.startsWith('#')) {
                // Update the URL hash
                window.location.hash = href;
                
                // Also update the browser history
                history.pushState(null, null, href);
            }
            
            // Make up for the document title covering the heading you jumped to.
            setTimeout(() => {
                window.scrollTo({ top: window.scrollY - 60 })
            }, 100);
        })

        var div = document.createElement("div");
        div.classList.add(heading.tagName.toLowerCase());

        // Add toc-group-end class if this is the last heading of its type before a different type
        if (i < headings.length - 1 && heading.tagName !== headings[i + 1].tagName) {
            div.classList.add("toc-group-end");
        }

        // Ensure the div doesn't interfere with link clicks
        // div.style.pointerEvents = "none";
        // link.style.pointerEvents = "auto";

        div.appendChild(link);
        tocEl.appendChild(div);

        // Store the mapping between heading and its TOC link
        headingToLinkMap.set(heading, link);
    });

    if (headings.length) {
        document.querySelector('#toc-toggler').classList.add('filled')
        document.querySelector('#toc-toggler').style.display = 'flex'
    } else {
        document.querySelector('#toc-toggler').classList.remove('filled')
        document.querySelector('#toc-toggler').style.display = 'none'
    }

    // Set up Intersection Observer to track which headings are in view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const heading = entry.target;
            const link = headingToLinkMap.get(heading);
            
            if (entry.isIntersecting) {
                // Remove active class from all links
                tocEl.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
                // Add active class to current link
                link.classList.add('active');
            }
        });
    }, {
        // Adjust these values to control when a heading is considered "in view"
        rootMargin: '-20% 0px -80% 0px',
        threshold: 0
    });

    // Start observing all headings
    headings.forEach(heading => observer.observe(heading));
} // setTableOfContents

// Helper function to convert numbers to Roman numerals
function toRomanNumeral(num) {
    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    
    let result = '';
    for (let i = 0; i < values.length; i++) {
        while (num >= values[i]) {
            result += symbols[i];
            num -= values[i];
        }
    }
    return result;
}

// Helper function to convert numbers to letters (A, B, C, ...)
function toLetter(num) {
    let result = '';
    while (num > 0) {
        num--; // Convert to 0-based index
        result = String.fromCharCode(65 + (num % 26)) + result;
        num = Math.floor(num / 26);
    }
    return result;
}

/**
 * 
 * In the note: scrollWithOffset so user sees it's been scrolled down pass the image
 */
function scrollWithOffset(element, offset = -70) {
    // Scrolls to the element smoothly
    element.scrollIntoView({ behavior: "smooth" });

    // After a slight delay, apply the offset
    window.addEventListener("scrollend", () => {
        window.scrollBy({ top: offset, left: 0, behavior: "smooth" });
        console.log("scrollend");
    }, { once: true });
} // scrollWithOffset

/**
 * New note is loaded. Check if any settings for img or youtube iframes have been saved to apply to all persistently
 */
function loadAnyPersistentNoteConfigs() {
    // Function to process each key
    function processKey(storageKey, selector) {
        var value = localStorage.getItem(storageKey);
        
        // console.log({value});
        // debugger;
        
        if (value) {
            var classesToAdd = [];
            if (value.includes('centered')) {
                classesToAdd.push('centered');
            }
            if (value.includes('state-1')) {
                classesToAdd.push('state-1');
            }
            if (value.includes('state-2')) {
                classesToAdd.push('state-2');
            }

            var elements = document.querySelectorAll(selector);
            elements.forEach(element=>{
                if (element) {
                    classesToAdd.forEach(function (cls) {
                        element.classList.add(cls);
                    });
                }
            });
        }
    }

    // Process 'wi__brain__img'
    processKey('wi__brain__img', '.img-wrapper > img');

    // Process 'wi__brain__yt'
    processKey('wi__brain__yt', '.img-wrapper > .responsive-iframe-container');


} // loadAnyPersistentNoteConfigs

/**
 * Used by openNote to add image buttons into the note
 * 
 * @function enhanceWithImageButtons
 * @param {String} id "1"
 */
function enhanceWithImageButtons(img, type) {
    // Create a wrapper div with the specified classes
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'img-wrapper flex flex-row flex-start';

    // Insert the image inside the wrapper div
    img.parentNode.insertBefore(wrapperDiv, img);
    wrapperDiv.appendChild(img);

    // Create the sibling div with icons
    const iconContainer = document.createElement('div');
    iconContainer.className = 'flex flex-col justify-start img-btns';

    const iconGroupA = document.createElement('div');
    iconGroupA.className = 'flex flex-col gap-6 p-2';

    const iconGroupB = document.createElement('div');
    iconGroupB.className = 'flex flex-col gap-6 p-2';

    const iconGroupC = document.createElement('div');
    iconGroupC.className = 'flex flex-col gap-6 p-2';

    // Add the icons
    const icon1 = document.createElement('i');
    icon1.className = 'fas fa-search-plus clickable';
    icon1.onclick = (event) => {
        const imgWrapper = event.target.closest(".img-wrapper")
        // const img = imgWrapper.querySelector("img");
        const img = imgWrapper.children[0];
        function removeAllStates() {
            img.classList.remove("state-1");
            img.classList.remove("state-2");
            img.classList.remove("state-3");
        }
        if (img.className.includes("state-1")) {
            removeAllStates();
            img.classList.add("state-2");
        } else if (img.className.includes("state-2")) {
            removeAllStates();
        } else {
            img.classList.add("state-1");
        }
    } // icon1

    // const icon2 = document.createElement('i');
    // icon2.className = 'fas fa-align-center clickable';
    // icon2.onclick = (event) => {
    //     const imgWrapper = event.target.closest(".img-wrapper")
    //     // const img = imgWrapper.querySelector("img");
    //     const img = imgWrapper.children[0];
    //     img.classList.toggle("centered");
    // } // icon2

    iconGroupA.appendChild(icon1);
    // iconGroupA.appendChild(icon2);

    const icon3 = document.createElement('i');
    icon3.className = 'fas fa-level-down-alt clickable';
    icon3.onclick = (event) => {
        const imgWrapper = event.target.closest(".img-wrapper");
        const nextLine = (imgWrapper.parentElement.id === "summary-inner" ?
            imgWrapper.nextElementSibling :
            (() => {
                let currentElement = imgWrapper;

                // Traverse up until you find the #summary-inner parent
                while (currentElement && !currentElement?.nextElementSibling) {
                    currentElement = currentElement.parentElement; // Move to the parent element
                }

                // After the loop, correctChild will hold the correct previous sibling
                // console.log(currentElement);
                const nextElementSibling = currentElement?.nextElementSibling;

                if (nextElementSibling)
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
    iconContainer.append(iconGroupC);
    wrapperDiv.append(iconContainer);
} // enhanceWithImageButtons

/**
 * @function openNote
 * @param {String} id "1"
 * @param {String} yamlTextish "title: ...\nhtml: ..."
 * 
 */
function openNote(id) {
    fetch("local-open.php?id=" + id)
        .then(response => response.text()).then((yamlTextish) => {
            const titleMatch = yamlTextish.match(/^title:\s*(.*?)\n/);
            const htmlMatch = yamlTextish.match(/^html:\s*\|([\s\S]*)/m);

            // Extract the title
            let title = titleMatch ? titleMatch[1].replace(/^ {2}/gm, '') : null;
            title = title?.replace(/\.md$/i, ""); // Remove .md from the title
            title = title?.replace(/\.json$/i, ""); // Remove .md from the title
            if (!title) { title = ""; }

            // Extract and clean up HTML content
            let summary = htmlMatch ? htmlMatch[1].replace(/^ {2}/gm, '') : null;
            console.log('Initial summary (raw):', JSON.stringify(summary));
            console.log('Initial summary length:', summary?.length);

            // Trim any leading/trailing whitespace before checking for frontmatter
            if (summary) {
                summary = summary.trim();
            }

            // Extract frontmatter from the HTML content
            const frontmatterMatch = summary?.match(/^---\n([\s\S]*?)\n---/);
            console.log('Frontmatter match:', frontmatterMatch);
            console.log('Frontmatter regex test:', /^---\n([\s\S]*?)\n---/.test(summary));
            console.log('First 20 chars of summary:', summary?.substring(0, 20));
            
            const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
            console.log('Frontmatter content:', frontmatter);
            
            // Parse frontmatter properties
            const frontmatterProps = {};
            if (frontmatter) {
                frontmatter.split('\n').forEach(line => {
                    const [key, ...valueParts] = line.split(':');
                    if (key && valueParts.length) {
                        frontmatterProps[key.trim()] = valueParts.join(':').trim();
                    }
                });
            }
            console.log('Parsed frontmatter props:', frontmatterProps);

            // Remove frontmatter from content before processing
            if (frontmatterMatch) {
                // Count the number of lines in the frontmatter (including the --- markers)
                const frontmatterLines = frontmatterMatch[0].split('\n').length;
                // Split the content into lines
                const contentLines = summary.split('\n');
                // Remove the frontmatter lines from the start
                summary = contentLines.slice(frontmatterLines).join('\n');
                console.log('Summary after removing frontmatter:', summary);
            }

            parent.document.querySelector(".side-by-side-possible.hidden")?.classList?.remove("hidden");

            // Show notes in textarea

            let summaryInnerEl = parent.document.querySelector("#summary-inner");
            summaryInnerEl.classList.remove("hidden");

            var md = window.markdownit({
                html: true,
                linkify: {
                    encode: true
                },
                breaks: false,
                typographer: false
            }).use(window.MarkdownItLatex)
                .use(window.markdownItAnchor, {
                    level: [1, 2, 3, 4, 5, 6], // Apply to all heading levels
                    slugify: function (s) {
                        s = s.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '');

                        if(s?.length) {
                            if (!/[a-zA-Z]/.test(s[0])) {
                                s = "at" + s;
                            }
                        }

                        return s;

                    },
                    permalink: true,
                    permalinkHref: (slug, state) => {
                        let s = slug;
                        href = "javascript:window.shareTutorialSection('?open=" + encodeURI(title) + "#" + s + "');"; // ?open=Data%20Lake.md#Section1
                        return href;
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
            if(summary) {
                summary = (function doubleNewLine(text) {
                    return text.replace(/(.+)(\n)(?!\n)/g, "$1  \n");
                })(summary);
            }
            
            // Obsidian glitch where pasted images are in the format of links
            // Thus preventing MarkdownIt from rendering them as images
            // ![[Pasted image 20250130224740.png]] => ![](Pasted image 20250130224740.png)
            if(summary) {
                summary = (function pastedImagesToImg(text) {
                    // OLD: Convert Obsidian pasted image format to standard markdown image format
                    // text = text.replace(/!\[\[Pasted image ([^\]]+)\]\]/g, '![](Pasted image $1)');

                    // NEW: Go by file extension and not starting with http
                    text = text.replace(/!\[\[(?!http)([^\/\]]+\.(png|bmp|jpg|jpeg|gif))\]\]/gi, '![]($1)');

                    // Replace spaces with encoded spaces in image filenames
                    text = text.replace(/!\[\]\(([^)]*)\)/g, (match, p1) => {
                        return `![](${p1.replace(/ /g, '%20')})`;
                    });
                    return text;
                })(summary);
            }

            // Convert Obsidian highlight syntax ==text== to <mark>text</mark>
            if(summary) {
                summary = (function convertHighlights(text) {
                    // Match ==text== but not inside code blocks
                    return text.replace(/==([^=]+)==/g, '<mark>$1</mark>');
                })(summary);
            }

            // Convert strikethrough syntax ~~text~~ to <del>text</del>
            if(summary) {
                summary = (function convertStrikethrough(text) {
                    // Match ~~text~~ but not inside code blocks
                    return text.replace(/~~([^~]+)~~/g, '<del>$1</del>');
                })(summary);
            }

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

                        let content = contentLines.join('\n');
                        // var md = window.markdownit({
                        //     html: true,
                        //     linkify: true
                        // }).use(window.MarkdownItLatex)
                        //     .use(window.markdownItAnchor);
                        content = md.render(content);

                        // Highlight code blocks
                        try {
                            content = hljs.highlight(content).value;
                        } catch(e) {
                            console.log("Error highlighting code blocks", e);
                        }

                        let detailsHtml = `\n<details>\n<summary>${summaryText}</summary>\n<div class="border ml-3 p-1">${content}<br/></div>\n</details>\n`;
                        // detailsHtml = detailsHtml.replaceAll("\n", "<br/>");

                        outputLines.push(detailsHtml);
                        outputLines.push("\n");
                        // console.log("**************");
                        console.log({detailsHtml});
                    } else {
                        outputLines.push(line);
                        i++;
                    }
                }

                return outputLines.join('\n');
            }  // convertNotesToDetails

            summary = convertNotesToDetails(summary);
            
            // Add your text transformations here
            if(summary) {
                // Replace $...$ with @...@ for LaTeX content, preserving surrounding whitespace
                summary = (function yourTextTransformation(text) {
                    text = text.replace(/(\s|^)\$([^$]+)\$(\s|$)/g, '$1`@$2@`$3');
                    return text;
                })(summary);

                // Center layout if requested in frontmatter yaml (brain_layout: center)
                if(frontmatterProps?.brain_layout === "center") {
                    summary = (function centerLayout(text) {
                        text = "<center>" + text + "</center>";
                        return text;
                    })(summary);
                }
            }

            // Check for AGE encryption before rendering
            console.log('🔍 Checking for AGE encryption...', {
                hasEncryptionManager: !!window.encryptionManager,
                summaryLength: summary?.length,
                summaryPreview: summary?.substring(0, 100) + '...',
                isAgeEncrypted: window.encryptionManager?.isAgeEncrypted(summary)
            });
            
            if (window.encryptionManager && window.encryptionManager.isAgeEncrypted(summary)) {
                console.log('🔒 AGE encryption detected! Handling encrypted content...');
                handleEncryptedContent(summary, title, summaryInnerEl, frontmatterProps);
                return; // Exit early for encrypted content
            } else {
                console.log('📄 No encryption detected, rendering normally...');
            }

            var summaryHTML = md.render(summary);

            // Img src domain with base url:
            summaryHTML = summaryHTML.replace(/\<img src="(.+)"/g, function(match, p1) {
                return '<img src="' + config.imgHostedUrl + p1 + '"';
            });

            document.getElementById("summary-title").textContent = title;
            document.getElementById("summary-collapser").classList.remove("hidden");
            document.getElementById("summary-collapser").classList.add("stated");
            document.getElementById("summary-sharer").classList.remove("hidden");
            document.getElementById("scroll-to-item").classList.remove("hidden");
            document.getElementById("summary-outer").classList.remove("hidden");
            // parent.document.querySelector("#dashboard").classList.add("active");

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


            summaryInnerEl.innerHTML = summaryHTML;

            // Apply hierarchical indentation based on heading levels
            applyHierarchicalIndentationWithResets(summaryInnerEl);

            // Re-scan for link popover previews after content is loaded
            if (window.linkPopoverPreview) {
                window.linkPopoverPreview.rescan();
            }

            // setTimeout(() => {
                // target blank for links
                summaryInnerEl.querySelectorAll("a").forEach(a => {
                    if (a.href.includes(window.openURL) || a.href.includes("localhost") || a.innerText.includes("🔗"))
                        return true;

                    a.setAttribute("target", "_blank");


                    // Exit quickly if this is the wrong type of URL
                    if (a.protocol !== 'http:' && a.protocol !== 'https:') {
                        // Good
                    } else if (a.hostname.includes('youtube.com') || a.hostname.includes('youtu.be')) {
                        // Find the ID of the YouTube video
                        var id, matches;
                        if (a.hostname.includes('youtube.com')) {
                            // For URLs like https://www.youtube.com/watch?v=xLrLlu6KDss
                            matches = a.search.match(/[?&]v=([^&]*)/);
                            id = matches && matches[1];
                            
                            // Handle YouTube Shorts URLs like https://www.youtube.com/shorts/xLrLlu6KDss
                            if (!id && a.pathname.includes('/shorts/')) {
                                matches = a.pathname.match(/\/shorts\/([^/?]+)/);
                                id = matches && matches[1];
                            }
                            
                            // Handle YouTube Live URLs like https://www.youtube.com/live/xLrLlu6KDss
                            if (!id && a.pathname.includes('/live/')) {
                                matches = a.pathname.match(/\/live\/([^/?]+)/);
                                id = matches && matches[1];
                            }
                        } else if (a.hostname.includes('youtu.be')) {
                            // For URLs like https://youtu.be/xLrLlu6KDss or https://youtu.be/xLrLlu6KDss?si=xxx
                            // Extract just the video ID, ignoring query parameters
                            id = a.pathname.substr(1).split('?')[0];
                        }

                        // Check that the ID only has valid YouTube ID characters (alphanumeric, hyphen, underscore)
                        // to prevent XSS vulnerabilities.
                        var validatedID;
                        if (id && id.match(/^[a-zA-Z0-9_-]+$/)) {
                            validatedID = id;
                        }

                        // Add the embedded YouTube video, and remove the link.
                        // Use youtube-nocookie.com for privacy-enhanced mode and add referrerpolicy to fix Error 153
                        if (validatedID) {
                            $(a).before('<div class="responsive-iframe-container"><iframe src="https://www.youtube-nocookie.com/embed/' + validatedID + '" frameborder="0" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>');
                            const $ytWrapper = $(a).prev('.responsive-iframe-container');
                            enhanceWithImageButtons($ytWrapper[0], "yt");
                            $(a).remove();
                        }

                    } // ^ youtube


                }) // for all a in the tutorial
            // }, 250);

            // Scroll up
            // Jump up to content
            // window.document.getElementById("summary-title").scrollIntoView();
            window.document.getElementById("explore-curriculum").scrollIntoView({
                behavior: "smooth",
            });

            // Image buttons
            window.document
                .querySelector("#summary-inner")
                .querySelectorAll('img').forEach(img => {
                    enhanceWithImageButtons(img, "img");
                });

            // Render table of contents at top right
            let tocEl = window.document.querySelector("#toc")
            let markdownContentEl = window.document.querySelector("#summary-inner")
            // Reset TOC numbering class for new note
            tocEl.classList.remove('toc-numbered');
            setTableOfContents(tocEl, markdownContentEl);

            // Add progress markers on the left
            const notePanel = window.document.querySelector("#summary-inner");
            const parentWindow = window;
            parentWindow.removeScrollProgressMarkers(notePanel);
            parentWindow.hydrateAnimationOnProgressMarkers(notePanel);
            parentWindow.addScrollProgressMarkers(notePanel);

            // If had been collapsed, make it not collapsed
            var summaryCollapser = document.getElementById("summary-collapser");
            if (!summaryCollapser.className.includes("stated")) {
                summaryCollapser.click();
            }

            // Load any persistent settings for images and Youtube embeds
            loadAnyPersistentNoteConfigs();

            // Dispatch noteOpened event
            document.dispatchEvent(new Event('noteOpened'));

            // Initialize mindmap feature after content is loaded
            if (typeof initializeMindmapFeature === 'function') {
                initializeMindmapFeature();
            }
            if (typeof onMarkdownContentUpdated === 'function') {
                onMarkdownContentUpdated();
            }

            try {
                setTimeout(function () {
                    var pres = document.querySelectorAll("pre>code");
                    for (var i = 0; i < pres.length; i++) {
                        hljs.highlightBlock(pres[i]);
                    }
                    
                    // Add line numbers and copy button to code blocks
                    addLineNumbersToCodeBlocks();
                }, 10);
            } catch(e) {
                console.log("Error highlighting code blocks", e);
            }
            
            // Make frontmatter properties accessible globally
            window.currentNoteFrontmatter = frontmatterProps;
        }) // fetch md
}; // openNote

/**
 * Add line numbers and copy button to all code blocks
 * Creates a line numbers gutter on the left side and copy button on top-right
 */
function addLineNumbersToCodeBlocks() {
    const codeBlocks = document.querySelectorAll('#summary-inner pre > code');
    
    codeBlocks.forEach(function(codeElement) {
        const preElement = codeElement.parentElement;
        
        // Skip if already has line numbers
        if (preElement.classList.contains('has-line-numbers')) {
            return;
        }
        
        // Mark as processed
        preElement.classList.add('has-line-numbers');
        
        // Get the code text and split into lines
        const codeText = codeElement.textContent;
        const lines = codeText.split('\n');
        
        // Remove trailing empty line if exists (common in code blocks)
        if (lines.length > 0 && lines[lines.length - 1] === '') {
            lines.pop();
        }
        
        // Create line numbers container
        const lineNumbersDiv = document.createElement('div');
        lineNumbersDiv.className = 'line-numbers-gutter';
        
        // Generate line numbers
        for (let i = 1; i <= lines.length; i++) {
            const lineNum = document.createElement('span');
            lineNum.className = 'line-number';
            lineNum.textContent = i;
            lineNumbersDiv.appendChild(lineNum);
        }
        
        // Create copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'code-copy-btn';
        copyButton.innerHTML = '<i class="fa fa-copy"></i> Copy';
        copyButton.title = 'Copy to clipboard';
        
        // Add click handler for copy functionality
        copyButton.addEventListener('click', function() {
            const textToCopy = codeElement.textContent;
            
            navigator.clipboard.writeText(textToCopy).then(function() {
                // Success - show checkmark
                copyButton.innerHTML = '<i class="fa fa-check"></i> Copied!';
                copyButton.classList.add('copied');
                
                // Reset after 2 seconds
                setTimeout(function() {
                    copyButton.innerHTML = '<i class="fa fa-copy"></i> Copy';
                    copyButton.classList.remove('copied');
                }, 2000);
            }).catch(function(err) {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = textToCopy;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    copyButton.innerHTML = '<i class="fa fa-check"></i> Copied!';
                    copyButton.classList.add('copied');
                    setTimeout(function() {
                        copyButton.innerHTML = '<i class="fa fa-copy"></i> Copy';
                        copyButton.classList.remove('copied');
                    }, 2000);
                } catch (e) {
                    console.error('Copy failed:', e);
                }
                document.body.removeChild(textarea);
            });
        });
        
        // Wrap the code block structure
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        
        // Insert wrapper before pre element
        preElement.parentNode.insertBefore(wrapper, preElement);
        
        // Move pre element into wrapper and add components
        wrapper.appendChild(copyButton);
        wrapper.appendChild(lineNumbersDiv);
        wrapper.appendChild(preElement);
    });
}

function addScrollProgressMarkers(div) {
    const windowHeight = window.innerHeight;
    const divHeight = div.scrollHeight;
    let percentageMarkers = [];

    // Determine how many markers to add based on div height vs. window height
    if (divHeight > 3 * windowHeight) {
        percentageMarkers = [10, 20, 30, 40, 50, 60, 70, 80, 90];
    } else if (divHeight > 2 * windowHeight) {
        percentageMarkers = [25, 50, 75];
    } else if (divHeight > windowHeight) {
        percentageMarkers = [33, 66];
    }

    // Create marker elements and position them
    percentageMarkers.forEach(percentage => {
        const marker = document.createElement('div');
        marker.classList.add('scroll-marker');
        marker.style.top = `${(percentage / 100) * divHeight}px`;
        marker.textContent = `${percentage}%`;

        div.appendChild(marker);
    });

} // addScrollProgressMarkers

function hydrateAnimationOnProgressMarkers(div) {
    window.addEventListener('scroll', hydrateAnimationScrollHandler.bind(this, div));
    window.addEventListener('resize', () => {

        removeScrollProgressMarkers();
        addScrollProgressMarkers(div);
        hydrateAnimationScrollHandler(div);

    });
} // hydrateAnimationOnProgressMarkers

function hydrateAnimationScrollHandler(div) {
    // Update markers' opacity based on scroll position, with only those in top quarter visible
    const divRect = div.getBoundingClientRect(); // Get div's position relative to viewport
    document.querySelectorAll('.scroll-marker').forEach((marker, i) => {
        const markerRect = marker.getBoundingClientRect(); // Marker position relative to viewport

        // Check if marker falls within the top quarter of the viewport
        if (markerRect.top <= window.innerHeight / 4) {
            marker.classList.add("past");
        } else {
            marker.classList.remove("past");
        }
    });
} // hydrateAnimationScrollHandler

function removeScrollProgressMarkers(div) {
    // Select all markers within the div
    const markers = document.querySelectorAll('.scroll-marker');

    // Remove each marker element
    markers.forEach(marker => marker.remove());

    // Optionally, remove the scroll event listener if it's no longer needed
    window.removeEventListener('scroll', hydrateAnimationScrollHandler);
} // removeScrollProgressMarkers

/**
 * Apply hierarchical indentation to content based on heading levels
 * @param {HTMLElement} container - The container element with rendered markdown
 */
function applyHierarchicalIndentation(container) {
    const elements = Array.from(container.children);
    const headingLevels = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
    
    // Create a new container for the restructured content
    const newContainer = document.createElement('div');
    
    let i = 0;
    while (i < elements.length) {
        const element = elements[i];
        const tagName = element.tagName;
        
        if (headingLevels.includes(tagName)) {
            const headingLevel = parseInt(tagName[1]);
            const indentLevel = Math.max(0, headingLevel - 2);
            
            // Create a wrapper for this section
            const sectionWrapper = document.createElement('div');
            sectionWrapper.classList.add('heading-section');
            sectionWrapper.classList.add(`indent-level-${indentLevel}`);
            
            // Add the heading to the wrapper
            const headingClone = element.cloneNode(true);
            sectionWrapper.appendChild(headingClone);
            
            // Collect content and process nested headings
            let j = i + 1;
            const sectionContent = [];
            
            while (j < elements.length) {
                const nextElement = elements[j];
                const nextTagName = nextElement.tagName;
                
                if (headingLevels.includes(nextTagName)) {
                    const nextHeadingLevel = parseInt(nextTagName[1]);
                    if (nextHeadingLevel <= headingLevel) {
                        break; // Stop if we hit a heading of same or higher level
                    }
                }
                
                sectionContent.push(nextElement.cloneNode(true));
                j++;
            }
            
            // If there's content in this section, recursively process it
            if (sectionContent.length > 0) {
                const contentContainer = document.createElement('div');
                sectionContent.forEach(el => contentContainer.appendChild(el));
                
                // Recursively apply indentation to nested content
                applyHierarchicalIndentationRecursive(contentContainer, headingLevel);
                
                // Add the processed content to the section wrapper
                Array.from(contentContainer.children).forEach(child => {
                    sectionWrapper.appendChild(child);
                });
            }
            
            newContainer.appendChild(sectionWrapper);
            i = j;
        } else {
            // Non-heading element at root level
            newContainer.appendChild(element.cloneNode(true));
            i++;
        }
    }
    
    // Replace the original content
    container.innerHTML = '';
    Array.from(newContainer.children).forEach(child => {
        container.appendChild(child);
    });
} // applyHierarchicalIndentation

/**
 * Recursively apply hierarchical indentation to nested content
 * @param {HTMLElement} container - The container element with content
 * @param {number} parentLevel - The heading level of the parent section
 */
function applyHierarchicalIndentationRecursive(container, parentLevel) {
    const elements = Array.from(container.children);
    const headingLevels = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
    
    const processedElements = [];
    
    let i = 0;
    while (i < elements.length) {
        const element = elements[i];
        const tagName = element.tagName;
        
        if (headingLevels.includes(tagName)) {
            const headingLevel = parseInt(tagName[1]);
            
            // Only process headings that are deeper than the parent level
            if (headingLevel > parentLevel) {
                const indentLevel = Math.max(0, headingLevel - 2);
                
                // Create a wrapper for this nested section
                const sectionWrapper = document.createElement('div');
                sectionWrapper.classList.add('heading-section');
                sectionWrapper.classList.add(`indent-level-${indentLevel}`);
                
                // Add the heading to the wrapper
                const headingClone = element.cloneNode(true);
                sectionWrapper.appendChild(headingClone);
                
                // Collect content for this nested section
                let j = i + 1;
                const sectionContent = [];
                
                while (j < elements.length) {
                    const nextElement = elements[j];
                    const nextTagName = nextElement.tagName;
                    
                    if (headingLevels.includes(nextTagName)) {
                        const nextHeadingLevel = parseInt(nextTagName[1]);
                        if (nextHeadingLevel <= headingLevel) {
                            break; // Stop if we hit a heading of same or higher level
                        }
                    }
                    
                    sectionContent.push(nextElement.cloneNode(true));
                    j++;
                }
                
                // If there's content in this nested section, recursively process it
                if (sectionContent.length > 0) {
                    const contentContainer = document.createElement('div');
                    sectionContent.forEach(el => contentContainer.appendChild(el));
                    
                    // Recursively apply indentation to even deeper nested content
                    applyHierarchicalIndentationRecursive(contentContainer, headingLevel);
                    
                    // Add the processed content to the section wrapper
                    Array.from(contentContainer.children).forEach(child => {
                        sectionWrapper.appendChild(child);
                    });
                }
                
                processedElements.push(sectionWrapper);
                i = j;
            } else {
                // Heading at same or higher level - shouldn't happen in this context
                processedElements.push(element.cloneNode(true));
                i++;
            }
        } else {
            // Non-heading element
            processedElements.push(element.cloneNode(true));
            i++;
        }
    }
    
    // Replace the container content with processed elements
    container.innerHTML = '';
    processedElements.forEach(element => {
        container.appendChild(element);
    });
} // applyHierarchicalIndentationRecursive

/**
 * Apply hierarchical indentation with support for reset markers (<<<)
 * @param {HTMLElement} container - The container element with rendered markdown
 */
function applyHierarchicalIndentationWithResets(container) {
    // First, find all elements that contain the reset marker
    const allElements = Array.from(container.querySelectorAll('*'));
    const resetMarkers = [];
    
    // Look for paragraphs or other elements that contain only "<<<" 
    allElements.forEach((element, index) => {
        if (element.textContent.trim() === '<<<') {
            resetMarkers.push(element);
        }
    });
    
    // If no reset markers found, use the original function
    if (resetMarkers.length === 0) {
        applyHierarchicalIndentation(container);
        return;
    }
    
    // Split content into sections based on reset markers
    const sections = [];
    const containerChildren = Array.from(container.children);
    let currentSection = [];
    
    containerChildren.forEach(child => {
        if (resetMarkers.includes(child)) {
            // This is a reset marker - finish current section and start new one
            if (currentSection.length > 0) {
                sections.push(currentSection);
                currentSection = [];
            }
            // Don't include the reset marker in any section
        } else {
            currentSection.push(child);
        }
    });
    
    // Add the last section if it has content
    if (currentSection.length > 0) {
        sections.push(currentSection);
    }
    
    // Clear the container
    container.innerHTML = '';
    
    // Process each section independently
    sections.forEach(sectionElements => {
        // Create a temporary container for this section
        const sectionContainer = document.createElement('div');
        sectionElements.forEach(element => {
            sectionContainer.appendChild(element.cloneNode(true));
        });
        
        // Apply hierarchical indentation to this section
        applyHierarchicalIndentation(sectionContainer);
        
        // Add the processed section back to the main container
        Array.from(sectionContainer.children).forEach(child => {
            container.appendChild(child);
        });
    });
} // applyHierarchicalIndentationWithResets

/**
 * Handle encrypted content display and decryption
 */
function handleEncryptedContent(encryptedContent, title, summaryInnerEl, frontmatterProps) {
    // Set title
    document.getElementById("summary-title").textContent = title;
    document.getElementById("summary-collapser").classList.remove("hidden");
    document.getElementById("summary-collapser").classList.add("stated");
    document.getElementById("summary-sharer").classList.remove("hidden");
    document.getElementById("scroll-to-item").classList.remove("hidden");
    document.getElementById("summary-outer").classList.remove("hidden");

    // Show encrypted content indicator
    const encryptedIndicator = `
        <div class="encrypted-content-indicator">
            <i class="fas fa-lock"></i>
            <div>
                <div class="font-semibold">This note contains encrypted content</div>
                <div class="text-sm opacity-75">Enter the password to decrypt and view the content</div>
            </div>
            <button onclick="requestDecryption('${title.replace(/'/g, "\\'")}')">
                <i class="fas fa-unlock"></i> Decrypt
            </button>
        </div>
    `;

    summaryInnerEl.innerHTML = encryptedIndicator;

    // Scroll to content
    window.document.getElementById("explore-curriculum").scrollIntoView({
        behavior: "smooth",
    });

    // Store encrypted content for later decryption
    summaryInnerEl.dataset.encryptedContent = encryptedContent;
    summaryInnerEl.dataset.frontmatterProps = JSON.stringify(frontmatterProps || {});
    
    // Encrypted content stored for decryption
}

/**
 * Request password and decrypt content
 */
function requestDecryption(title) {
    const summaryInnerEl = window.document.querySelector("#summary-inner");
    const encryptedContent = summaryInnerEl.dataset.encryptedContent;
    const frontmatterProps = JSON.parse(summaryInnerEl.dataset.frontmatterProps || '{}');

    if (!encryptedContent) {
        console.error('❌ No encrypted content found');
        return;
    }

    // Show password dialog
    window.passwordDialog.show(async (password) => {
        try {
            // Show loading state
            summaryInnerEl.innerHTML = `
                <div class="decryption-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <div>Decrypting content...</div>
                </div>
            `;

            // Decrypt content
            const decryptedContent = await window.encryptionManager.decrypt(encryptedContent, password);

            // Process and render decrypted content
            await renderDecryptedContent(decryptedContent, title, summaryInnerEl, frontmatterProps);

            // Close password dialog
            window.passwordDialog.hide();

        } catch (error) {
            console.error('Decryption failed:', error);
            
            // Extract debug info if available
            let debugInfo = '';
            if (error.debug_content_preview) {
                debugInfo = `
                    <div class="mt-2 p-2 bg-gray-100 rounded text-sm">
                        <strong>Debug - Content Preview:</strong><br>
                        <code>${error.debug_content_preview}</code>
                    </div>
                `;
            }
            
            // Show error in content area
            summaryInnerEl.innerHTML = `
                <div class="decryption-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Decryption Failed:</strong> ${error.message}
                    ${debugInfo}
                    <div class="mt-2">
                        <button onclick="requestDecryption('${title.replace(/'/g, "\\'")}')">
                            <i class="fas fa-redo"></i> Try Again
                        </button>
                    </div>
                </div>
            `;
            
            throw error; // Re-throw to show error in password dialog
        }
    });
}

/**
 * Render decrypted content using the same pipeline as regular content
 */
async function renderDecryptedContent(decryptedContent, title, summaryInnerEl, frontmatterProps) {
    // Initialize markdown renderer (same as in openNote)
    var md = window.markdownit({
        html: true,
        linkify: {
            encode: true
        },
        breaks: false,
        typographer: false
    }).use(window.MarkdownItLatex)
        .use(window.markdownItAnchor, {
            level: [1, 2, 3, 4, 5, 6],
            slugify: function (s) {
                s = s.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '');
                if(s?.length) {
                    if (!/[a-zA-Z]/.test(s[0])) {
                        s = "at" + s;
                    }
                }
                return s;
            },
            permalink: true,
            permalinkHref: (slug, state) => {
                let s = slug;
                href = "javascript:window.shareTutorialSection('?open=" + encodeURI(title) + "#" + s + "');";
                return href;
            },
            permalinkSymbol: '🔗'
        });

    // Apply same content processing as regular notes
    let processedContent = decryptedContent;

    // Apply line break fixes
    processedContent = processedContent.replace(/(.+)(\n)(?!\n)/g, "$1  \n");

    // Fix Obsidian image links
    processedContent = processedContent.replace(/!\[\[(?!http)([^\/\]]+\.(png|bmp|jpg|jpeg|gif))\]\]/gi, '![]($1)');
    processedContent = processedContent.replace(/!\[\]\(([^)]*)\)/g, (match, p1) => {
        return `![](${p1.replace(/ /g, '%20')})`;
    });

    // Convert Obsidian highlight syntax ==text== to <mark>text</mark>
    processedContent = processedContent.replace(/==([^=]+)==/g, '<mark>$1</mark>');

    // Convert strikethrough syntax ~~text~~ to <del>text</del>
    processedContent = processedContent.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // Convert Obsidian notes to details
    processedContent = convertNotesToDetails(processedContent);

    // Apply center layout if requested
    if(frontmatterProps?.brain_layout === "center") {
        processedContent = "<center>" + processedContent + "</center>";
    }

    // Render markdown
    var summaryHTML = md.render(processedContent);

    // Fix image URLs
    summaryHTML = summaryHTML.replace(/\<img src="(.+)"/g, function(match, p1) {
        return '<img src="' + (window.config?.imgHostedUrl || '') + p1 + '"';
    });

    // Fix special characters
    summaryHTML = summaryHTML.replaceAll(/\xA0/g, " ");

    // Replace Obsidian links
    summaryHTML = summaryHTML.replace(/\[\[(.*?)\]\]/g, function (match, p1) {
        const encodedText = encodeURIComponent(p1);
        return `<a target="_blank" href="${window.openURL}${encodedText}">${p1}</a>`;
    });

    // Add decrypted content wrapper
    summaryHTML = `<div class="decrypted-content">${summaryHTML}</div>`;

    // Set content
    summaryInnerEl.innerHTML = summaryHTML;

    // Apply hierarchical indentation
    applyHierarchicalIndentationWithResets(summaryInnerEl);

    // Re-scan for link popover previews
    if (window.linkPopoverPreview) {
        window.linkPopoverPreview.rescan();
    }

    // Highlight code blocks and add line numbers
    try {
        setTimeout(function () {
            var pres = summaryInnerEl.querySelectorAll("pre>code");
            for (var i = 0; i < pres.length; i++) {
                hljs.highlightBlock(pres[i]);
            }
            
            // Add line numbers and copy button to code blocks
            addLineNumbersToCodeBlocks();
        }, 10);
    } catch(e) {
        console.log("Error highlighting code blocks in decrypted content", e);
    }

    // Start fade-out timer after 1 second
    setTimeout(() => {
        const decryptedContentEl = summaryInnerEl.querySelector('.decrypted-content');
        if (decryptedContentEl) {
            decryptedContentEl.classList.add('fade-out');
        }
    }, 1000);

    // Handle links and embeds (same as regular notes)
    summaryInnerEl.querySelectorAll("a").forEach(a => {
        if (a.href.includes(window.openURL) || a.href.includes("localhost") || a.innerText.includes("🔗"))
            return true;

        a.setAttribute("target", "_blank");

        // Handle YouTube embeds
        if (a.protocol === 'http:' || a.protocol === 'https:') {
            if (a.hostname.includes('youtube.com') || a.hostname.includes('youtu.be')) {
                var id, matches;
                if (a.hostname.includes('youtube.com')) {
                    matches = a.search.match(/[?&]v=([^&]*)/);
                    id = matches && matches[1];
                    
                    // Handle YouTube Shorts URLs like https://www.youtube.com/shorts/xLrLlu6KDss
                    if (!id && a.pathname.includes('/shorts/')) {
                        matches = a.pathname.match(/\/shorts\/([^/?]+)/);
                        id = matches && matches[1];
                    }
                    
                    // Handle YouTube Live URLs like https://www.youtube.com/live/xLrLlu6KDss
                    if (!id && a.pathname.includes('/live/')) {
                        matches = a.pathname.match(/\/live\/([^/?]+)/);
                        id = matches && matches[1];
                    }
                } else if (a.hostname.includes('youtu.be')) {
                    // For URLs like https://youtu.be/xLrLlu6KDss or https://youtu.be/xLrLlu6KDss?si=xxx
                    id = a.pathname.substr(1).split('?')[0];
                }

                // Check that the ID only has valid YouTube ID characters (alphanumeric, hyphen, underscore)
                var validatedID;
                if (id && id.match(/^[a-zA-Z0-9_-]+$/)) {
                    validatedID = id;
                }

                // Use youtube-nocookie.com for privacy-enhanced mode and add referrerpolicy to fix Error 153
                if (validatedID) {
                    $(a).before('<div class="responsive-iframe-container"><iframe src="https://www.youtube-nocookie.com/embed/' + validatedID + '" frameborder="0" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>');
                    const $ytWrapper = $(a).prev('.responsive-iframe-container');
                    if (typeof enhanceWithImageButtons === 'function') {
                        enhanceWithImageButtons($ytWrapper[0], "yt");
                    }
                    $(a).remove();
                }
            }
        }
    });

    // Add image buttons
    summaryInnerEl.querySelectorAll('img').forEach(img => {
        if (typeof enhanceWithImageButtons === 'function') {
            enhanceWithImageButtons(img, "img");
        }
    });

    // Generate table of contents
    let tocEl = window.document.querySelector("#toc");
    let markdownContentEl = summaryInnerEl;
    tocEl.classList.remove('toc-numbered');
    if (typeof setTableOfContents === 'function') {
        setTableOfContents(tocEl, markdownContentEl);
    }

    // Generate mindmap if available
    if (typeof generateMindmapFromLists === 'function') {
        generateMindmapFromLists();
    }
}

// Helper function - extract from existing code if needed
function convertNotesToDetails(inputText) {
    const lines = inputText.split('\n');
    const outputLines = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const noteMatch = line.match(/^>\s*\[!note\]\s*(.*)$/i);

        if (noteMatch) {
            const summaryText = noteMatch[1].trim();
            const contentLines = [];

            i++;
            while (i < lines.length && lines[i].startsWith('>')) {
                const contentLine = lines[i].replace(/^>\s*/, '');
                contentLines.push(contentLine);
                i++;
            }

            let content = contentLines.join('\n');
            const detailsHtml = `<details><summary>${summaryText}</summary>\n\n${content}\n\n</details>`;
            outputLines.push(detailsHtml);
        } else {
            outputLines.push(line);
            i++;
        }
    }

    return outputLines.join('\n');
}

