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
    }, 150);
} // goToItem

function shareTutorialSection(trailingHash) {
    document.getElementById("shareSnippet").value = window.location.host + window.location.pathname + `${trailingHash}`
    document.getElementById("shareModal").modal("show");
}


/**
 * 
 * In the note: setTableOfContents makes TOC menu (aka #mobile-tap) at top right appear
 */

document.addEventListener("DOMContentLoaded", function () {
    document.body.addEventListener("click", (event) => {
        if (!event.target.matches('#mobile-tap')) { document.querySelector('#mobile-tap').classList.remove('active'); }
    })
    document.getElementById("mobile-tap").addEventListener("click", (event) => {
        event.target.classList.toggle('active');
    });
});

function setTableOfContents(tocEl, markdownContentEl) {
    var headings = [].slice.call(markdownContentEl.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    tocEl.innerHTML = "";

    // Create a map to store heading elements and their corresponding TOC links
    const headingToLinkMap = new Map();

    headings.forEach(function (heading, i) {
        // ref is either generic (toc-1) or the jump link of the subheading
        var ref = "toc" + i;
        if (heading.hasAttribute("id"))
            ref = heading.getAttribute("id");
        else
            heading.setAttribute("id", ref);

        var link = document.createElement("a");
        link.setAttribute("href", "#" + ref);
        link.textContent = heading.textContent;
        link.textContent = link.textContent.replaceAll("🔗", "").trim()
        link.classList.add("toc-link");

        link.addEventListener("click", () => {
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

        div.appendChild(link);
        tocEl.appendChild(div);

        // Store the mapping between heading and its TOC link
        headingToLinkMap.set(heading, link);
    });

    if (headings.length) {
        document.querySelector('#toc-toggler').classList.add('filled')
    } else {
        document.querySelector('#toc-toggler').classList.remove('filled')
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
                }
            }).use(window.MarkdownItLatex)
                .use(window.markdownItAnchor, {
                    level: [1, 2, 3, 4, 5, 6], // Apply to all heading levels
                    slugify: function (s) {
                        return s.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '');
                    },
                    permalink: true,
                    permalinkHref: (slug, state) => {
                        let s = slug;
                        s = "javascript:window.shareTutorialSection('?open=" + encodeURI(title) + "#" + s + "');"; // ?open=Data%20Lake.md#Section1
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
                            // debugger;
                            matches = a.search.match(/[?&]v=([^&]*)/);
                            id = matches && matches[1];
                        } else if (a.hostname.includes('youtu.be')) {
                            // For URLs like https://youtu.be/xLrLlu6KDss
                            id = a.pathname.substr(1);
                        }

                        // Check that the ID only has alphanumeric characters, to make sure that
                        // we don't introduce any XSS vulnerabilities.
                        var validatedID;
                        if (id && id.match(/^[a-zA-Z0-9\_]*$/)) {
                            validatedID = id;
                        }

                        // debugger;

                        // Add the embedded YouTube video, and remove the link.
                        if (validatedID) {
                            $(a).before('<div class="responsive-iframe-container"><iframe src="https://www.youtube.com/embed/' + validatedID + '" frameborder="0" allowfullscreen></iframe></div>');
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

            try {
                // hljs.highlightAll();

                setTimeout(function () {
                    var pres = document.querySelectorAll("pre>code");
                    for (var i = 0; i < pres.length; i++) {
                        hljs.highlightBlock(pres[i]);
                    }
                    var options = {
                        contentSelector: ".container",
                        // Delay in ms used for `setTimeout` before badging is applied
                        // Use if you need to time highlighting and badge application
                        // since the badges need to be applied afterwards.
                        // 0 - direct execution (ie. you handle timing
                        loadDelay:0,
            
                        // CSS class(es) used to render the copy icon.
                        copyIconClass: "fa fa-copy",
                        // CSS class(es) used to render the done icon.
                        checkIconClass: "fa fa-check text-success",
            
                        // intercept text copying - passed in text return text out
                        onBeforeCodeCopied: function(text) {                
                            // text = "$$$ " + text;
                            return text;
                        }
                    };
                    window.highlightJsBadge(options);
                },10);
            } catch(e) {
                console.log("Error highlighting code blocks", e);
            }
            
            // Make frontmatter properties accessible globally
            window.currentNoteFrontmatter = frontmatterProps;
        }) // fetch md
}; // openNote

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

