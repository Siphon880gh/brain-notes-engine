(function () {
    const sourceEl = document.getElementById("practice-source");
    const inputEl = document.getElementById("practice-input");
    const accuracyEl = document.getElementById("practice-accuracy");
    const panelEl = document.getElementById("practice-panel");
    const modalEl = document.getElementById("practice-modal");
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
    const quizModeBtn = document.getElementById("practice-mode-quiz");
    const quizEl = document.getElementById("practice-quiz");
    const quizPromptEl = document.getElementById("practice-quiz-prompt");
    const quizStatusEl = document.getElementById("practice-quiz-status");
    const quizCopyBtn = document.getElementById("practice-quiz-copy");
    const quizChatgptBtn = document.getElementById("practice-quiz-chatgpt");
    const quizClaudeBtn = document.getElementById("practice-quiz-claude");
    const QUIZ_APP_URL = "https://wengindustries.com/app/quiz-gsheet/gsheets/_Special%20-%20User%20Provides/Intake.php";

    if (!sourceEl || !inputEl || !panelEl || !modalEl || !openBtn) return;

    const narrowBtn = document.getElementById("practice-narrow-open");
    const scopeEl = document.getElementById("practice-scope");
    const scopeStatusEl = document.getElementById("practice-scope-status");
    const snippetsChoiceBtn = document.getElementById("practice-scope-snippets");
    const headingsChoiceBtn = document.getElementById("practice-scope-headings");
    const highlightChoiceBtn = document.getElementById("practice-scope-highlight");
    const resetScopeBtn = document.getElementById("practice-scope-reset");
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
        retypeCaretKnown: false,
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

    function quizSourceText() {
        if (state.scopeText != null) return state.scopeText;
        return lessonText();
    }

    function lessonTitle() {
        const title = document.getElementById("summary-title");
        const text = title ? title.textContent.replaceAll("🔗", "").trim() : "";
        return text || "this lesson";
    }

    function buildQuizPrompt() {
        const article = quizSourceText().replaceAll('"""', "'''");
        return [
            "ROLE:",
            "You are a Quiz Coach.",
            "",
            "Assume the article content is authoritative for this quiz.",
            "",
            "GOAL:",
            "Check whether I understood the article by generating a quiz based strictly on the pasted content.",
            "",
            "STEP 1 — Confirm quiz settings",
            "",
            "Before generating the quiz, ask me these questions and wait for my answers:",
            "",
            "1) How many questions total?",
            "",
            "2) Which question formats do you want?",
            "",
            "You can reply with abbreviations separated by spaces or new lines:",
            "",
            "- MC = Multiple Choice",
            "- TF = True/False",
            "- SATA = Select All That Apply",
            "- FIB = Fill in the Blank",
            "- RANK = Ranked / Order in sequence",
            "- MM = Mix & Match",
            "- SA = Short Answer",
            "- FR = Free Response, where I explain or justify my answer",
            "",
            "You may also put a number after an abbreviation to request a specific count.",
            "",
            "Examples:",
            "- MC8 TF4",
            "- MC5 SATA3 SA2",
            "- Mostly MC, occasionally short answer",
            "- 70% MC, 30% SA",
            "",
            "If you request a question type but do not provide a count or total number of questions, generate 3–5 questions for that type.",
            "",
            "If you request multiple question types and provide a preferred total number of questions, but omit counts for some types, aim for the preferred total and distribute the remaining questions evenly across the types without counts.",
            "",
            "3) Difficulty level:",
            "",
            "- E = Easy",
            "- M = Medium",
            "- H = Hard",
            "- MIX = Mixed difficulty",
            "",
            "4) Optional focus:",
            "",
            "Ask me if there are any sections, topics, definitions, claims, examples, or details I want to emphasize or avoid.",
            "",
            "STEP 2 — Generate the quiz",
            "",
            "After I answer the quiz settings:",
            "",
            "- Create questions strictly based on the article content.",
            "- Do not use outside knowledge.",
            "- Avoid trivia that is not supported by the article.",
            "- If a question depends on a specific claim, definition, example, or section, make sure it is clearly grounded in the article.",
            "- If using MC questions, provide 4 options labeled A–D.",
            "- If using SATA questions, provide 5–7 options.",
            "- If using Mix & Match, provide two clear columns.",
            "- If difficulty is set to MIX, include a reasonable blend of easy, medium, and hard questions.",
            "",
            "STEP 3 — Answer handling",
            "",
            "After generating the quiz:",
            "",
            "Ask me to answer using a compact format like this:",
            "",
            "“1) B  2) T  3) A,C,E  4) ...”",
            "",
            "Do not reveal the answer key until I submit my answers.",
            "",
            "Do not include explanations yet unless I ask for them.",
            "",
            "STEP 4 — Grading",
            "",
            "After I submit my answers:",
            "",
            "- Grade my answers.",
            "- Show which questions I got correct and incorrect.",
            "- For each missed question, give:",
            "  - the correct answer",
            "  - a 1–2 sentence explanation grounded in the article content",
            "- If my answer is partially correct, explain what was right and what was missing.",
            "- End with a short “what to review next” list with 3–6 bullets.",
            "",
            "STEP 5 — Quiz app CSV",
            "",
            "After the grade report, output the same quiz as CSV I can paste into Weng's Quiz app:",
            QUIZ_APP_URL,
            "",
            "If I reply \"export\" at any time, skip ahead and output that CSV for the quiz you generated. If I have not chosen settings yet, use 8 questions, MC5 TF1 SATA1 FIB1, difficulty MIX, and output CSV only.",
            "",
            "Print the grade report first (unless I said export). Then print one fenced csv block and no other CSV.",
            "",
            "The CSV is the whole quiz, including questions I got right. It is not a score report.",
            "",
            "Use this header row exactly:",
            "",
            "Number,Title,Question,Instruction,Question Type,Correct Choice,Choice 1,Choice 2,Choice 3,Choice 4,Choice 5,Choice 6,Choice 7,Hint",
            "",
            "Column rules:",
            "",
            "- Number: leave blank. Use -1 only to hide a row.",
            "- Title: a short topic label from the article.",
            "- Question: the question text. No A/B/C labels inside it.",
            "- Instruction: one short line on how to answer.",
            "- Question Type: exactly one of: Multiple Choice, True False, Ranked, Mix and match, Flash card",
            "- Correct Choice: a 1-based index into the Choice columns (Choice 1 is 1). Select-all questions use comma-separated indexes such as 1,3,5. Ranked and Mix and match use N/A.",
            "- Choice columns: answer text only, with no A) B) or 1) prefixes. Leave unused choice cells empty.",
            "- Hint: optional one sentence grounded in the article, or leave blank.",
            "- Quote any field that contains a comma, a double quote, or a line break. Escape a double quote by doubling it.",
            "- Mix and match and flash card cells need real line breaks inside the quotes. Do not write a backslash followed by n.",
            "",
            "Map each quiz format to a row:",
            "",
            "- MC: Question Type Multiple Choice. Four choices. Correct Choice is 1, 2, 3, or 4. Instruction: Select the correct answer.",
            "- TF: Question Type True False. Choice 1 is True. Choice 2 is False. Correct Choice is 1 or 2. Instruction: Select True or False.",
            "- SATA: Question Type Multiple Choice (not the word SATA). Five to seven choices. Correct Choice is every correct index, comma-separated. Instruction: Toggle each correct choice, then press the confirm button.",
            "- FIB: Question Type Multiple Choice. The question uses ___ for the blank. Put the correct wording in one choice and plausible distractors in the others. Correct Choice points at the correct choice. Instruction: Select the answer that fills the blank.",
            "- RANK: Question Type Ranked. Correct Choice is N/A. Choice 1 through Choice N are already in the correct order. Instruction: Drag into the correct order, then press Finished ordering.",
            "- MM: Question Type Mix and match. Correct Choice is N/A. Each matched Choice cell is three lines: the left item, a line that is only ===, then the right item. An extra unmatched distractor is one line with no ===. Instruction: Drag each item on the left into the matching slot on the right.",
            "- SA and FR: Question Type Flash card. The Question cell is three lines: the prompt, a line that is only ====, then a model answer grounded in the article. Choice 1 is Yes. Choice 2 is No. Correct Choice is 1. Instruction: Did you remember correctly?",
            "",
            "Do not use outside knowledge. Do not add Picture, Video, or audio rows.",
            "",
            "YOUR REPLY:",
            "Ask me the STEP 1 questions. The article is already included below. Do not ask me to paste it again.",
            "",
            "INPUT:",
            "Use only this article content as the source material for the quiz.",
            "",
            "Article title: " + lessonTitle(),
            "",
            "Article Content:",
            '"""',
            article,
            '"""'
        ].join("\n");
    }

    function refreshQuizPrompt() {
        if (!quizPromptEl) return;
        quizPromptEl.value = buildQuizPrompt();
    }

    function setQuizStatus(message) {
        if (quizStatusEl) quizStatusEl.textContent = message;
    }

    function copyQuizPrompt() {
        const text = quizPromptEl ? quizPromptEl.value : "";
        const done = () => setQuizStatus("Prompt copied.");
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text).then(done).catch(() => {
                quizPromptEl.focus();
                quizPromptEl.select();
                document.execCommand("copy");
                done();
            });
        }
        quizPromptEl.focus();
        quizPromptEl.select();
        document.execCommand("copy");
        done();
        return Promise.resolve();
    }

    function openQuizChat(homeUrl, queryUrl) {
        const prompt = quizPromptEl ? quizPromptEl.value : "";
        const url = queryUrl + encodeURIComponent(prompt);
        if (url.length > 1800) {
            copyQuizPrompt().then(() => {
                setQuizStatus("Prompt copied. Paste it into the chat.");
                window.open(homeUrl, "_blank", "noopener,noreferrer");
            });
            return;
        }
        setQuizStatus("");
        window.open(url, "_blank", "noopener,noreferrer");
    }

    function syncPracticeAvailability() {
        const hasPractice = selectedText().trim().length > 0;
        emptyEl.hidden = hasPractice;
        retypeEl.hidden = state.mode !== "retype" || !hasPractice;
        rearrangeEl.hidden = state.mode !== "rearrange" || !hasPractice;
        if (quizEl) quizEl.hidden = state.mode !== "quiz" || !hasPractice;
    }

    function updateScopeButtons() {
        const hasSnippets = state.codeSnippets.length > 0;
        const hasHeadings = state.sections.length > 0;
        const hasLesson = lessonText().length > 0;
        snippetsChoiceBtn.disabled = !hasSnippets;
        headingsChoiceBtn.disabled = !hasHeadings;
        highlightChoiceBtn.disabled = !hasLesson;
        resetScopeBtn.disabled = state.scopeText == null;
        snippetsChoiceBtn.title = hasSnippets ? "Pick one code block" : "This lesson has no code snippets";
        headingsChoiceBtn.title = hasHeadings ? "Pick one heading" : "This lesson has no headings";
        highlightChoiceBtn.title = hasLesson ? "Drag across a copy of the lesson" : "This lesson has nothing to highlight";
        resetScopeBtn.title = state.scopeText == null ? "Nothing to reset" : "Practice the full lesson again";
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
        inputEl.style.height = "";
    }

    function setMode(mode) {
        state.mode = mode;
        retypeModeBtn.classList.toggle("is-active", mode === "retype");
        rearrangeModeBtn.classList.toggle("is-active", mode === "rearrange");
        if (quizModeBtn) quizModeBtn.classList.toggle("is-active", mode === "quiz");
        retypeModeBtn.setAttribute("aria-pressed", mode === "retype" ? "true" : "false");
        rearrangeModeBtn.setAttribute("aria-pressed", mode === "rearrange" ? "true" : "false");
        if (quizModeBtn) quizModeBtn.setAttribute("aria-pressed", mode === "quiz" ? "true" : "false");
        const hasPractice = selectedText().trim().length > 0;
        retypeEl.hidden = mode !== "retype" || !hasPractice;
        rearrangeEl.hidden = mode !== "rearrange" || !hasPractice;
        if (quizEl) quizEl.hidden = mode !== "quiz" || !hasPractice;
        if (mode === "rearrange") buildLines();
        if (mode === "quiz") refreshQuizPrompt();
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
            state.retypeCaretKnown = false;
            resizeInput();
            setAccuracy("");
        }
        if (state.mode === "rearrange") buildLines();
        if (state.mode === "quiz") refreshQuizPrompt();
        if (state.level === "1") highlightTyped();
        evalDifferences();
    }

    function expandLesson() {
        const collapser = document.getElementById("summary-collapser");
        const outer = document.getElementById("summary-outer");
        if (collapser && outer && outer.classList.contains("hidden")) collapser.click();
    }

    function resetScope() {
        state.scopeText = null;
        state.scopeLabel = "";
        snippetListEl.querySelectorAll(".is-selected").forEach((item) => item.classList.remove("is-selected"));
        headingListEl.querySelectorAll(".is-selected").forEach((item) => item.classList.remove("is-selected"));
        updateScopeStatus();
        updateScopeButtons();
        syncPracticeAvailability();
        loadSource(true);
    }

    function applyScope(text, label) {
        const passage = (text || "").trim();
        if (!passage) return;
        state.scopeText = passage;
        state.scopeLabel = label;
        updateScopeStatus();
        updateScopeButtons();
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
        modalEl.hidden = false;
        panelEl.hidden = false;
        document.body.classList.add("practice-modal-open");
        openBtn.setAttribute("aria-expanded", "true");
        loadSource(true);
        if (!retypeEl.hidden) inputEl.focus();
    }

    function closePanel() {
        modalEl.hidden = true;
        panelEl.hidden = true;
        document.body.classList.remove("practice-modal-open");
        openBtn.setAttribute("aria-expanded", "false");
        stopFog();
    }

    openBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        if (panelEl.hidden) openPanel();
        else closePanel();
    });
    closeBtn.addEventListener("click", closePanel);
    modalEl.addEventListener("click", (event) => {
        if (event.target === modalEl) closePanel();
    });
    retypeModeBtn.addEventListener("click", () => setMode("retype"));
    rearrangeModeBtn.addEventListener("click", () => setMode("rearrange"));
    if (quizModeBtn) quizModeBtn.addEventListener("click", () => setMode("quiz"));
    if (quizCopyBtn) quizCopyBtn.addEventListener("click", () => copyQuizPrompt());
    if (quizChatgptBtn) quizChatgptBtn.addEventListener("click", () => openQuizChat("https://chatgpt.com/", "https://chatgpt.com/?q="));
    if (quizClaudeBtn) quizClaudeBtn.addEventListener("click", () => openQuizChat("https://claude.ai/new", "https://claude.ai/new?q="));
    narrowBtn.addEventListener("click", toggleScope);
    snippetsChoiceBtn.addEventListener("click", () => showScopeList("snippets"));
    headingsChoiceBtn.addEventListener("click", () => showScopeList("headings"));
    highlightChoiceBtn.addEventListener("click", openHighlightModal);
    resetScopeBtn.addEventListener("click", resetScope);
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
    const isApple = /Mac|iPhone|iPad/.test(navigator.platform);
    const levelModLabel = isApple ? "⇧⌥" : "Alt+";
    const levelPopover = document.getElementById("practice-level-popover");
    if (levelPopover) {
        levelPopover.textContent = levelModLabel + "1 Level 1 · " + levelModLabel + "2 Level 2 · " + levelModLabel + "3 Level 3";
    }
    const levelInfoPopover = document.getElementById("practice-level-info-popover");
    if (levelInfoPopover) {
        levelInfoPopover.textContent = isApple
            ? "Level 1, Level 2, and Level 3 increase in difficulty. Hold OPT to show the shortcut key. Level 1 on Mac is Shift+Opt+1, Level 2 is Shift+Opt+2, and Level 3 is Shift+Opt+3."
            : "Level 1, Level 2, and Level 3 increase in difficulty. Hold Alt to show the shortcut key. Level 1 is Alt+1, Level 2 is Alt+2, and Level 3 is Alt+3.";
    }
    const levelInfoBtn = document.getElementById("practice-level-info");
    const levelInfoWrap = levelInfoBtn ? levelInfoBtn.parentElement : null;
    if (levelInfoBtn && levelInfoWrap) {
        const setLevelInfoOpen = (open) => {
            levelInfoWrap.classList.toggle("is-open", open);
            levelInfoBtn.setAttribute("aria-expanded", open ? "true" : "false");
        };
        levelInfoBtn.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            setLevelInfoOpen(!levelInfoWrap.classList.contains("is-open"));
        });
        document.addEventListener("pointerdown", (event) => {
            if (levelInfoWrap.contains(event.target)) return;
            setLevelInfoOpen(false);
        });
        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape" || !levelInfoWrap.classList.contains("is-open")) return;
            if (highlightModalEl && !highlightModalEl.hidden) return;
            setLevelInfoOpen(false);
            event.stopImmediatePropagation();
        });
    }
    document.querySelectorAll('input[name="practice-level"]').forEach((input) => {
        const keyName = levelModLabel + input.value;
        input.parentElement.setAttribute("aria-keyshortcuts", (isApple ? "Shift+" : "") + "Alt+" + input.value);
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
        state.retypeCaretKnown = true;
    }

    function rememberRetypeCaret() {
        if (document.activeElement !== inputEl && !state.retypeCaretKnown) return;
        saveRetypeCursor();
    }

    function restoreRetypeCursor() {
        const place = () => {
            if (retypeEl.hidden) return;
            const length = inputEl.value.length;
            const saved = state.retypeCursor;
            const start = saved ? Math.min(saved.start, length) : length;
            const end = saved ? Math.min(saved.end, length) : length;
            inputEl.focus({ preventScroll: true });
            inputEl.setSelectionRange(start, end);
        };
        place();
        queueMicrotask(place);
        requestAnimationFrame(() => {
            place();
            requestAnimationFrame(place);
        });
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
        if (event.key !== "Escape") return;
        if (highlightModalEl && !highlightModalEl.hidden) {
            closeHighlightModal();
            return;
        }
        if (!modalEl.hidden) closePanel();
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
        rememberRetypeCaret();
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
    const difficultyEl = document.querySelector(".practice-difficulty");
    document.addEventListener("pointerdown", (event) => {
        if (!event.target.closest || !event.target.closest(".practice-difficulty")) return;
        rememberRetypeCaret();
    }, true);
    difficultyEl.addEventListener("click", (event) => {
        const label = event.target.closest("label");
        if (!label) return;
        rememberRetypeCaret();
        const input = label.querySelector("input");
        if (!input) return;
        if (!input.checked) input.checked = true;
        applyLevel(input.value);
    });
    difficultyEl.addEventListener("focusin", (event) => {
        if (!event.target.matches || !event.target.matches('input[name="practice-level"]')) return;
        restoreRetypeCursor();
    });

    inputEl.addEventListener("input", saveRetypeCursor);
    inputEl.addEventListener("keyup", saveRetypeCursor);
    inputEl.addEventListener("mouseup", saveRetypeCursor);
    inputEl.addEventListener("blur", (event) => {
        const next = event.relatedTarget;
        if (next && next.closest && next.closest(".practice-difficulty")) return;
        if (!next) return;
        saveRetypeCursor();
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
            prepareLesson(true);
            loadSource(true);
        }
    });

    if (document.getElementById("summary-title") && document.getElementById("summary-title").textContent.trim()) {
        openBtn.hidden = false;
    }
})();
