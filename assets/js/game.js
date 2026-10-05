(function () {
    const sourceEl = document.getElementById("practice-source");
    const inputEl = document.getElementById("practice-input");
    const accuracyEl = document.getElementById("practice-accuracy");
    const panelEl = document.getElementById("practice-panel");
    const openBtn = document.getElementById("practice-open");
    const closeBtn = document.getElementById("practice-close");
    const snippetEl = document.getElementById("practice-snippet");
    const snippetLabel = document.querySelector(".practice-snippet-label");
    const retypeEl = document.getElementById("practice-retype");
    const rearrangeEl = document.getElementById("practice-rearrange");
    const linesEl = document.getElementById("practice-lines");
    const rearrangeStatusEl = document.getElementById("practice-rearrange-status");
    const shuffleBtn = document.getElementById("practice-shuffle");
    const emptyEl = document.getElementById("practice-empty");
    const retypeModeBtn = document.getElementById("practice-mode-retype");
    const rearrangeModeBtn = document.getElementById("practice-mode-rearrange");

    if (!sourceEl || !inputEl || !panelEl || !openBtn) return;

    const state = {
        snippets: [],
        sourceText: "",
        mode: "retype",
        level: "1",
        fogTimer: null,
        fogIndex: 0,
        fogCovers: 2
    };

    function collectSnippets() {
        const snippets = [];
        document.querySelectorAll("#summary-inner pre > code").forEach((code) => {
            const text = code.textContent.replace(/\n$/, "");
            if (text.trim()) snippets.push(text);
        });
        if (!snippets.length) {
            const note = document.getElementById("summary-inner");
            const text = note ? note.innerText.trim() : "";
            if (text) snippets.push(text);
        }
        return snippets;
    }

    function snippetOptionLabel(text, index) {
        const first = (text.split("\n").find((line) => line.trim()) || "").trim();
        const short = first.length > 48 ? first.slice(0, 45) + "..." : first;
        return short ? (index + 1) + ". " + short : "Snippet " + (index + 1);
    }

    function selectedText() {
        if (!state.snippets.length) return "";
        if (snippetEl.value === "all") return state.snippets.join("\n");
        const index = Number(snippetEl.value);
        return state.snippets[index] || "";
    }

    function fillSnippetSelect() {
        const previous = snippetEl.value;
        snippetEl.innerHTML = "";
        state.snippets = collectSnippets();

        if (state.snippets.length > 1) {
            const all = document.createElement("option");
            all.value = "all";
            all.textContent = "All snippets in this lesson";
            snippetEl.appendChild(all);
        }

        state.snippets.forEach((text, index) => {
            const option = document.createElement("option");
            option.value = String(index);
            option.textContent = snippetOptionLabel(text, index);
            snippetEl.appendChild(option);
        });

        const stillThere = previous && snippetEl.querySelector('option[value="' + CSS.escape(previous) + '"]');
        if (stillThere) snippetEl.value = previous;

        const hasSnippets = state.snippets.length > 0;
        snippetLabel.hidden = state.snippets.length <= 1;
        emptyEl.hidden = hasSnippets;
        retypeEl.hidden = state.mode !== "retype" || !hasSnippets;
        rearrangeEl.hidden = state.mode !== "rearrange" || !hasSnippets;
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
        const hasSnippets = state.snippets.length > 0;
        retypeEl.hidden = mode !== "retype" || !hasSnippets;
        rearrangeEl.hidden = mode !== "rearrange" || !hasSnippets;
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

    function openPanel() {
        expandLesson();
        fillSnippetSelect();
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
    snippetEl.addEventListener("change", () => loadSource(true));

    document.querySelectorAll('input[name="practice-level"]').forEach((input) => {
        input.addEventListener("change", () => {
            if (!input.checked) return;
            state.sourceText = sourceEl.textContent;
            state.level = input.value;
            renderSource();
            if (state.level === "1") highlightTyped();
            evalDifferences();
        });
    });

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
            fillSnippetSelect();
            loadSource(true);
        }
    });

    if (document.getElementById("summary-title") && document.getElementById("summary-title").textContent.trim()) {
        openBtn.hidden = false;
    }
})();
