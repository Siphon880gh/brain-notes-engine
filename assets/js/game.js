(function () {
    const sourceEl = document.getElementById("practice-source");
    const inputEl = document.getElementById("practice-input");
    const accuracyEl = document.getElementById("practice-accuracy");
    const panelEl = document.getElementById("practice-panel");
    const openBtn = document.getElementById("practice-open");
    const closeBtn = document.getElementById("practice-close");
    const retypeEl = document.getElementById("practice-retype");
    const rearrangeEl = document.getElementById("practice-rearrange");
    const linesEl = document.getElementById("practice-lines");
    const rearrangeStatusEl = document.getElementById("practice-rearrange-status");
    const shuffleBtn = document.getElementById("practice-shuffle");
    const emptyEl = document.getElementById("practice-empty");
    const retypeModeBtn = document.getElementById("practice-mode-retype");
    const rearrangeModeBtn = document.getElementById("practice-mode-rearrange");

    if (!sourceEl || !inputEl || !panelEl || !openBtn) return;

    const narrowBtn = document.getElementById("practice-narrow-open");
    const scopeEl = document.getElementById("practice-scope");
    const scopeStatusEl = document.getElementById("practice-scope-status");
    const snippetsChoiceBtn = document.getElementById("practice-scope-snippets");
    const headingsChoiceBtn = document.getElementById("practice-scope-headings");
    const highlightChoiceBtn = document.getElementById("practice-scope-highlight");
    const snippetListEl = document.getElementById("practice-scope-snippet-list");
    const headingListEl = document.getElementById("practice-scope-heading-list");
    const highlightModalEl = document.getElementById("practice-highlight-modal");
    const highlightArticleEl = document.getElementById("practice-highlight-article");
    const highlightUseBtn = document.getElementById("practice-highlight-use");
    const highlightCancelBtn = document.getElementById("practice-highlight-cancel");

    const state = {
        codeSnippets: [],
        sections: [],
        scopeText: null,
        scopeLabel: "",
        sourceText: "",
        retypeCursor: null,
        mode: "retype",
        level: "1",
        fogTimer: null,
        fogIndex: 0,
        fogCovers: 2
    };

    function lessonText() {
        const note = document.getElementById("summary-inner");
        return note ? note.innerText.trim() : "";
    }

    function collectCodeSnippets() {
        const snippets = [];
        document.querySelectorAll("#summary-inner pre > code").forEach((code) => {
            const text = code.textContent.replace(/\n$/, "");
            if (text.trim()) snippets.push(text);
        });
        return snippets;
    }

    function readableText(node) {
        const clone = node.cloneNode(true);
        clone.querySelectorAll(".line-numbers-gutter, .code-copy-btn, .scroll-marker").forEach((el) => el.remove());
        return clone.innerText.replaceAll("🔗", "").trim();
    }

    function sectionText(heading) {
        const parts = [readableText(heading)];
        let node = heading.nextElementSibling;
        while (node) {
            if (/^H[1-6]$/.test(node.tagName)) break;
            const text = readableText(node);
            if (text) parts.push(text);
            node = node.nextElementSibling;
        }
        return parts.join("\n").trim();
    }

    function collectSections() {
        const note = document.getElementById("summary-inner");
        if (!note) return [];
        return Array.from(note.querySelectorAll("h1, h2, h3, h4, h5, h6")).map((heading) => {
            const title = heading.textContent.replaceAll("🔗", "").trim();
            const text = sectionText(heading);
            return {
                title: title || "Untitled section",
                level: parseInt(heading.tagName[1], 10) || 1,
                text: text
            };
        }).filter((section) => section.text);
    }

    function countLabel(text) {
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const lines = text.split("\n").filter((line) => line.trim()).length;
        const wordLabel = words === 1 ? "1 word" : words + " words";
        const lineLabel = lines === 1 ? "1 line" : lines + " lines";
        return "(" + wordLabel + ", " + lineLabel + ")";
    }

    function snippetPreview(text) {
        const lines = text.split("\n");
        const preview = lines.slice(0, 4).join("\n");
        return lines.length > 4 ? preview + "\n…" : preview;
    }

    function selectedText() {
        if (state.scopeText != null) return state.scopeText;
        if (state.codeSnippets.length) return state.codeSnippets.join("\n");
        return lessonText();
    }

    function syncPracticeAvailability() {
        const hasPractice = selectedText().trim().length > 0;
        emptyEl.hidden = hasPractice;
        retypeEl.hidden = state.mode !== "retype" || !hasPractice;
        rearrangeEl.hidden = state.mode !== "rearrange" || !hasPractice;
    }

    function updateScopeButtons() {
        const hasSnippets = state.codeSnippets.length > 0;
        const hasHeadings = state.sections.length > 0;
        const hasLesson = lessonText().length > 0;
        snippetsChoiceBtn.disabled = !hasSnippets;
        headingsChoiceBtn.disabled = !hasHeadings;
        highlightChoiceBtn.disabled = !hasLesson;
        snippetsChoiceBtn.title = hasSnippets ? "Pick one code block" : "This lesson has no code snippets";
        headingsChoiceBtn.title = hasHeadings ? "Pick one heading" : "This lesson has no headings";
        highlightChoiceBtn.title = hasLesson ? "Drag across a copy of the lesson" : "This lesson has nothing to highlight";
    }

    function updateScopeStatus() {
        scopeStatusEl.hidden = !state.scopeLabel;
        scopeStatusEl.textContent = state.scopeLabel;
    }

    function prepareLesson(resetScope) {
        if (resetScope) {
            state.scopeText = null;
            state.scopeLabel = "";
        }
        state.codeSnippets = collectCodeSnippets();
        state.sections = collectSections();
        updateScopeButtons();
        updateScopeStatus();
        syncPracticeAvailability();
        if (snippetsChoiceBtn.disabled) {
            snippetListEl.hidden = true;
            snippetsChoiceBtn.classList.remove("is-active");
        }
        if (headingsChoiceBtn.disabled) {
            headingListEl.hidden = true;
            headingsChoiceBtn.classList.remove("is-active");
        }
        if (scopeEl && !scopeEl.hidden) {
            if (!snippetListEl.hidden) renderSnippetChoices();
            if (!headingListEl.hidden) renderHeadingChoices();
        }
    }

    function stopFog() {
        if (state.fogTimer) {
            clearInterval(state.fogTimer);
            state.fogTimer = null;
        }
    }

    function splitCharacters(text) {
        const min = 5;
        const max = 8;
        const chars = text.split("");
        const chunks = [];
        while (chars.length) {
            const size = Math.floor(Math.random() * (max - min + 1) + min);
            chunks.push(chars.splice(0, size).join(""));
        }
        return chunks;
    }

    function revealFog() {
        sourceEl.querySelectorAll(".fog").forEach((span) => {
            span.classList.toggle("is-clear", Number(span.dataset.fog) === state.fogIndex);
        });
    }

    function renderSource() {
        stopFog();
        sourceEl.dataset.level = state.level;
        if (state.level === "1") {
            sourceEl.textContent = state.sourceText;
            return;
        }

        const covers = state.level === "3" ? 3 : 2;
        const interval = state.level === "3" ? 5000 : 200;
        state.fogCovers = covers;
        state.fogIndex = 0;
        sourceEl.innerHTML = "";
        splitCharacters(state.sourceText).forEach((chunk, index) => {
            const span = document.createElement("span");
            span.className = "fog";
            span.dataset.fog = String(index % covers);
            span.textContent = chunk;
            sourceEl.appendChild(span);
        });
        revealFog();
        state.fogTimer = setInterval(() => {
            state.fogIndex = (state.fogIndex + 1) % state.fogCovers;
            revealFog();
        }, interval);
    }

    function stripSpace(text) {
        return text.replace(/\s/g, "");
    }

    function setAccuracy(text, percent) {
        accuracyEl.textContent = text;
        accuracyEl.classList.remove("is-perfect", "is-close", "is-mid", "is-low");
        if (!text) return;
        if (percent === 100) accuracyEl.classList.add("is-perfect");
        else if (percent >= 90) accuracyEl.classList.add("is-close");
        else if (percent >= 85) accuracyEl.classList.add("is-mid");
        else accuracyEl.classList.add("is-low");
    }

    function evalDifferences() {
        let typed = inputEl.value;
        let target = state.sourceText;
        if (!typed.length) {
            setAccuracy("");
            return;
        }
        typed = stripSpace(typed);
        target = stripSpace(target);
        if (typed.length <= target.length) target = target.slice(0, typed.length);
        else typed = typed.slice(0, target.length);
        const percent = (typeof similarity === "function" ? similarity(typed, target) : 0) * 100;
        const shown = String(percent).slice(0, 5);
        setAccuracy("Accuracy: " + shown + "%", parseInt(shown, 10));
    }

    function highlightTyped() {
        if (state.level !== "1") return;
        sourceEl.textContent = state.sourceText;
        const words = [...new Set((inputEl.value.match(/\S+/g) || []).filter((word) => word.length >= 2))];
        words.forEach((word) => {
            $(sourceEl).highlight(word);
        });
    }

    function resizeInput() {
        inputEl.style.height = "inherit";
        const maxHeight = Math.max(160, window.innerHeight - 240);
        const next = Math.min(inputEl.scrollHeight, maxHeight);
        inputEl.style.height = Math.max(next, 160) + "px";
    }

    function setMode(mode) {
        state.mode = mode;
        retypeModeBtn.classList.toggle("is-active", mode === "retype");
        rearrangeModeBtn.classList.toggle("is-active", mode === "rearrange");
        retypeModeBtn.setAttribute("aria-pressed", mode === "retype" ? "true" : "false");
        rearrangeModeBtn.setAttribute("aria-pressed", mode === "rearrange" ? "true" : "false");
        const hasPractice = selectedText().trim().length > 0;
        retypeEl.hidden = mode !== "retype" || !hasPractice;
        rearrangeEl.hidden = mode !== "rearrange" || !hasPractice;
        if (mode === "rearrange") buildLines();
        if (mode === "retype" && state.level === "1") highlightTyped();
    }

    function shuffle(items) {
        const copy = items.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const swap = copy[i];
            copy[i] = copy[j];
            copy[j] = swap;
        }
        const alreadySolved = copy.every((item, index) => item.order === index);
        if (alreadySolved && copy.length > 1) {
            const first = copy[0];
            copy[0] = copy[1];
            copy[1] = first;
        }
        return copy;
    }

    function gradeLines() {
        const rows = linesEl.querySelectorAll(".practice-line");
        let correct = 0;
        rows.forEach((row, index) => {
            const isCorrect = Number(row.dataset.order) === index;
            row.classList.toggle("is-correct", isCorrect);
            row.classList.toggle("is-incorrect", !isCorrect);
            if (isCorrect) correct += 1;
        });
        if (!rows.length) return;
        rearrangeStatusEl.textContent = correct === rows.length
            ? "Every line is in order."
            : correct + " of " + rows.length + " lines are in place.";
    }

    function buildLines() {
        if ($(linesEl).data("ui-sortable")) $(linesEl).sortable("destroy");
        linesEl.innerHTML = "";
        rearrangeStatusEl.textContent = "";
        const lines = state.sourceText.split("\n").filter((line) => line.trim().length > 0);
        if (lines.length <= 1) {
            rearrangeStatusEl.textContent = "This snippet needs more than one line to rearrange.";
            return;
        }

        shuffle(lines.map((text, order) => ({ text, order }))).forEach((item) => {
            const row = document.createElement("div");
            row.className = "practice-line";
            row.dataset.order = String(item.order);

            const up = document.createElement("button");
            up.type = "button";
            up.className = "practice-line__move";
            up.dataset.move = "up";
            up.textContent = "↑";
            up.setAttribute("aria-label", "Move line up");

            const down = document.createElement("button");
            down.type = "button";
            down.className = "practice-line__move";
            down.dataset.move = "down";
            down.textContent = "↓";
            down.setAttribute("aria-label", "Move line down");

            const text = document.createElement("code");
            text.className = "practice-line__text";
            text.textContent = item.text;

            row.append(up, down, text);
            linesEl.appendChild(row);
        });

        $(linesEl).sortable({
            items: ".practice-line",
            axis: "y",
            handle: ".practice-line__text",
            update: gradeLines
        });
        gradeLines();
    }

    function loadSource(resetTyping) {
        state.sourceText = selectedText();
        renderSource();
        if (resetTyping) {
            inputEl.value = "";
            state.retypeCursor = null;
            resizeInput();
            setAccuracy("");
        }
        if (state.mode === "rearrange") buildLines();
        if (state.level === "1") highlightTyped();
        evalDifferences();
    }

    function expandLesson() {
        const collapser = document.getElementById("summary-collapser");
        const outer = document.getElementById("summary-outer");
        if (collapser && outer && outer.classList.contains("hidden")) collapser.click();
    }

    function applyScope(text, label) {
        const passage = (text || "").trim();
        if (!passage) return;
        state.scopeText = passage;
        state.scopeLabel = label;
        updateScopeStatus();
        syncPracticeAvailability();
        loadSource(true);
        sourceEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function renderSnippetChoices() {
        snippetListEl.innerHTML = "";
        state.codeSnippets.forEach((text, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "practice-scope__item practice-scope__item--code";
            const preview = document.createElement("pre");
            preview.textContent = snippetPreview(text);
            const meta = document.createElement("span");
            meta.className = "practice-scope__meta";
            meta.textContent = "Snippet " + (index + 1) + " " + countLabel(text);
            button.append(preview, meta);
            button.addEventListener("click", () => {
                snippetListEl.querySelectorAll(".practice-scope__item").forEach((item) => item.classList.remove("is-selected"));
                button.classList.add("is-selected");
                applyScope(text, "Practicing snippet " + (index + 1) + " " + countLabel(text) + ".");
            });
            snippetListEl.appendChild(button);
        });
    }

    function renderHeadingChoices() {
        headingListEl.innerHTML = "";
        state.sections.forEach((section) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "practice-scope__item";
            button.style.paddingLeft = (8 + (section.level - 1) * 14) + "px";
            const title = document.createElement("span");
            title.className = "practice-scope__title";
            title.textContent = section.title + " ";
            const meta = document.createElement("span");
            meta.className = "practice-scope__meta";
            meta.textContent = countLabel(section.text);
            button.append(title, meta);
            button.addEventListener("click", () => {
                headingListEl.querySelectorAll(".practice-scope__item").forEach((item) => item.classList.remove("is-selected"));
                button.classList.add("is-selected");
                applyScope(section.text, "Practicing “" + section.title + "” " + countLabel(section.text) + ".");
            });
            headingListEl.appendChild(button);
        });
    }

    function showScopeList(which) {
        snippetListEl.hidden = which !== "snippets";
        headingListEl.hidden = which !== "headings";
        snippetsChoiceBtn.classList.toggle("is-active", which === "snippets");
        headingsChoiceBtn.classList.toggle("is-active", which === "headings");
        highlightChoiceBtn.classList.remove("is-active");
        if (which === "snippets") renderSnippetChoices();
        if (which === "headings") renderHeadingChoices();
    }

    function toggleScope() {
        const willOpen = scopeEl.hidden;
        scopeEl.hidden = !willOpen;
        narrowBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
        if (!willOpen) {
            snippetListEl.hidden = true;
            headingListEl.hidden = true;
            snippetsChoiceBtn.classList.remove("is-active");
            headingsChoiceBtn.classList.remove("is-active");
            return;
        }
        prepareLesson(false);
    }

    function highlightedPassage() {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.rangeCount) return "";
        const range = selection.getRangeAt(0);
        const startsInside = highlightArticleEl.contains(range.startContainer);
        const endsInside = highlightArticleEl.contains(range.endContainer);
        if (!startsInside || !endsInside) return "";
        return selection.toString().trim();
    }

    let pendingPassage = "";

    function refreshHighlightButton() {
        if (!highlightModalEl || highlightModalEl.hidden) return;
        pendingPassage = highlightedPassage();
        highlightUseBtn.disabled = pendingPassage.length === 0;
    }

    function openHighlightModal() {
        const clone = document.getElementById("summary-inner").cloneNode(true);
        clone.removeAttribute("id");
        clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
        clone.querySelectorAll(".line-numbers-gutter, .code-copy-btn, .scroll-marker").forEach((el) => el.remove());
        highlightArticleEl.innerHTML = "";
        highlightArticleEl.appendChild(clone);
        pendingPassage = "";
        highlightUseBtn.disabled = true;
        highlightModalEl.hidden = false;
        document.body.classList.add("practice-highlight-open");
        window.getSelection()?.removeAllRanges();
    }

    function closeHighlightModal() {
        highlightModalEl.hidden = true;
        document.body.classList.remove("practice-highlight-open");
        highlightArticleEl.innerHTML = "";
        window.getSelection()?.removeAllRanges();
        pendingPassage = "";
        highlightUseBtn.disabled = true;
    }

    function openPanel() {
        expandLesson();
        prepareLesson(true);
        panelEl.hidden = false;
        openBtn.setAttribute("aria-expanded", "true");
        loadSource(true);
        panelEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function closePanel() {
        panelEl.hidden = true;
        openBtn.setAttribute("aria-expanded", "false");
        stopFog();
    }

    openBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        if (panelEl.hidden) openPanel();
        else closePanel();
    });
    closeBtn.addEventListener("click", closePanel);
    retypeModeBtn.addEventListener("click", () => setMode("retype"));
    rearrangeModeBtn.addEventListener("click", () => setMode("rearrange"));
    narrowBtn.addEventListener("click", toggleScope);
    snippetsChoiceBtn.addEventListener("click", () => showScopeList("snippets"));
    headingsChoiceBtn.addEventListener("click", () => showScopeList("headings"));
    highlightChoiceBtn.addEventListener("click", openHighlightModal);
    highlightCancelBtn.addEventListener("click", closeHighlightModal);
    highlightUseBtn.addEventListener("mousedown", (event) => {
        event.preventDefault();
    });
    highlightUseBtn.addEventListener("click", () => {
        const passage = pendingPassage || highlightedPassage();
        if (!passage) return;
        closeHighlightModal();
        applyScope(passage, "Practicing your highlighted passage " + countLabel(passage) + ".");
    });
    highlightModalEl.addEventListener("click", (event) => {
        if (event.target === highlightModalEl) closeHighlightModal();
    });
    highlightArticleEl.addEventListener("click", (event) => {
        if (event.target.closest("a")) event.preventDefault();
    });
    document.addEventListener("selectionchange", refreshHighlightButton);
    const levelModLabel = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌥" : "Alt+";
    const levelPopover = document.getElementById("practice-level-popover");
    if (levelPopover) {
        levelPopover.textContent = levelModLabel + "1 Level 1 · " + levelModLabel + "2 Level 2 · " + levelModLabel + "3 Level 3";
    }
    document.querySelectorAll('input[name="practice-level"]').forEach((input) => {
        const keyName = levelModLabel + input.value;
        input.parentElement.setAttribute("aria-keyshortcuts", "Alt+" + input.value);
        const title = input.parentElement.getAttribute("title") || "";
        if (title && title.indexOf(keyName) === -1) input.parentElement.setAttribute("title", title + " (" + keyName + ")");
    });

    function retypeShortcutsActive() {
        return !panelEl.hidden && !retypeEl.hidden && highlightModalEl.hidden;
    }

    function saveRetypeCursor() {
        state.retypeCursor = {
            start: inputEl.selectionStart,
            end: inputEl.selectionEnd
        };
    }

    function restoreRetypeCursor() {
        const place = () => {
            const length = inputEl.value.length;
            const saved = state.retypeCursor;
            const start = saved ? Math.min(saved.start, length) : length;
            const end = saved ? Math.min(saved.end, length) : length;
            inputEl.focus();
            inputEl.setSelectionRange(start, end);
        };
        place();
        setTimeout(place, 0);
    }

    function applyLevel(level) {
        level = String(level);
        if (state.level !== level) {
            state.sourceText = sourceEl.textContent;
            state.level = level;
            const input = document.querySelector('input[name="practice-level"][value="' + level + '"]');
            if (input) input.checked = true;
            renderSource();
            if (state.level === "1") highlightTyped();
            evalDifferences();
        }
        restoreRetypeCursor();
    }

    function setLevelHint(on) {
        document.body.classList.toggle("practice-mod-held", on && retypeShortcutsActive());
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && highlightModalEl && !highlightModalEl.hidden) closeHighlightModal();
    });

    document.addEventListener("keydown", (event) => {
        if (!retypeShortcutsActive() || event.metaKey || !event.altKey) return;
        if (event.key === "Alt") {
            setLevelHint(true);
            return;
        }
        const levelByCode = { Digit1: "1", Digit2: "2", Digit3: "3", Numpad1: "1", Numpad2: "2", Numpad3: "3" };
        const level = levelByCode[event.code];
        if (!level) return;
        const target = event.target;
        const inPractice = target === inputEl || (target.closest && target.closest("#practice-panel"));
        const foreignField = target && target.matches && target.matches("input, textarea, select, [contenteditable='true']") && !inPractice;
        if (foreignField) return;
        event.preventDefault();
        event.stopPropagation();
        if (document.activeElement === inputEl) saveRetypeCursor();
        applyLevel(level);
    }, true);

    document.addEventListener("keyup", (event) => {
        if (event.key === "Alt" || !event.altKey) setLevelHint(false);
    });
    window.addEventListener("blur", () => setLevelHint(false));

    document.querySelectorAll('input[name="practice-level"]').forEach((input) => {
        input.addEventListener("change", () => {
            if (!input.checked) return;
            applyLevel(input.value);
        });
    });
    document.querySelector(".practice-difficulty").addEventListener("mousedown", (event) => {
        const label = event.target.closest("label");
        if (!label) return;
        event.preventDefault();
        const input = label.querySelector("input");
        if (!input) return;
        if (document.activeElement === inputEl) saveRetypeCursor();
        if (!input.checked) input.checked = true;
        applyLevel(input.value);
    });

    inputEl.addEventListener("input", saveRetypeCursor);
    inputEl.addEventListener("keyup", saveRetypeCursor);
    inputEl.addEventListener("mouseup", saveRetypeCursor);
    inputEl.addEventListener("blur", saveRetypeCursor);

    sourceEl.addEventListener("input", () => {
        if (state.level === "1") state.sourceText = sourceEl.textContent;
        evalDifferences();
    });
    sourceEl.addEventListener("blur", () => {
        state.sourceText = sourceEl.textContent;
        if (state.level !== "1") renderSource();
        if (state.mode === "rearrange") buildLines();
    });

    inputEl.addEventListener("input", () => {
        resizeInput();
        evalDifferences();
        highlightTyped();
    });
    inputEl.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;
        event.preventDefault();
        const start = inputEl.selectionStart;
        const end = inputEl.selectionEnd;
        inputEl.value = inputEl.value.slice(0, start) + "\t" + inputEl.value.slice(end);
        inputEl.selectionStart = inputEl.selectionEnd = start + 1;
        evalDifferences();
        highlightTyped();
    });

    document.getElementById("practice-erase").addEventListener("click", () => {
        inputEl.value = "";
        resizeInput();
        setAccuracy("");
        highlightTyped();
    });

    shuffleBtn.addEventListener("click", buildLines);
    linesEl.addEventListener("click", (event) => {
        const button = event.target.closest("[data-move]");
        if (!button) return;
        const row = button.closest(".practice-line");
        if (!row) return;
        if (button.dataset.move === "up" && row.previousElementSibling) {
            row.parentNode.insertBefore(row, row.previousElementSibling);
        } else if (button.dataset.move === "down" && row.nextElementSibling) {
            row.parentNode.insertBefore(row.nextElementSibling, row);
        }
        gradeLines();
    });

    document.addEventListener("noteOpened", () => {
        openBtn.hidden = false;
        if (!panelEl.hidden) {
            prepareLesson(true);
            loadSource(true);
        }
    });

    if (document.getElementById("summary-title") && document.getElementById("summary-title").textContent.trim()) {
        openBtn.hidden = false;
    }
})();
