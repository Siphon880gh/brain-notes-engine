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
    const QUIZ_SUGGESTED_REPLY = "1. 10. 2. You choose. 3. A Mix.";

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
            "A short reply is enough. Read it like this:",
            "",
            "- \"You choose\" for formats means you pick a sensible mix.",
            "- \"A Mix\" or \"Mix\" means MIX difficulty.",
            "- If I answer questions 1–3 and say nothing about focus, skip focus and generate the quiz.",
            "",
            "I may send this exact reply in a later message:",
            "",
            QUIZ_SUGGESTED_REPLY,
            "",
            "That means 10 questions, you choose the formats, mixed difficulty, and no focus. Wait until I send it. Do not treat this instruction as my answer.",
            "",
            "STEP 2 — Generate the quiz",
            "",
            "After I answer the quiz settings:",
            "",
            "- Create questions strictly based on the article content.",
            "- Do not use outside knowledge.",
            "- Avoid trivia that is not supported by the article.",
            "- If a question depends on a specific claim, definition, example, or section, make sure it is clearly grounded in the article.",
            "- If difficulty is set to MIX, include a reasonable blend of easy, medium, and hard questions.",
            "",
            "Output in this order:",
            "",
            "1. Before the CSV and the questions, explain in this sentence, with this link:",
            "I will give you csv for Weng's quiz app (" + QUIZ_APP_URL + ") as well as the questions we can answer immediately",
            "2. One fenced csv code block (header + data rows) using the schema in STEP 5. This block is the file I paste into the quiz app. It includes the correct answers.",
            "3. Then the generated questions, written so I can answer them in this chat. Do not repeat which choice is correct in that question list.",
            "4. End with exactly these two lines:",
            "Answer in a compact format: 1) B  2) T  3) A,C,E  4) ...",
            "Or ask me to quiz you interactively",
            "",
            "For the questions after the CSV:",
            "",
            "- MC: 4 options labeled A–D.",
            "- SATA: 5–7 options, and say to select all that apply.",
            "- FIB: a blank written as ___.",
            "- TF: ask me to answer True or False.",
            "- RANK: list the items and ask me to put them in order.",
            "- MM: two columns to match.",
            "- FC, SA, and FR: the prompt only. The answer stays on the back of the flash card inside the CSV.",
            "",
            "STEP 3 — Answer handling",
            "",
            "The two lines at the end of STEP 2 are how I choose what happens next.",
            "",
            "If I answer in the compact format, grade that submission. Do not reveal the answer key until I submit my answers. Do not include explanations yet unless I ask for them.",
            "",
            "If I ask you to quiz me interactively, ask one question at a time, wait for my answer, then tell me whether it was right before the next question. Do not show the CSV again.",
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
            "The csv code block is the whole quiz, not a score report. I paste it into the quiz intake.",
            "",
            "If I reply \"export\" at any time, output that CSV for the quiz you generated. If I have not chosen settings yet, use 8 questions, MC5 TF1 SATA1 FIB1, difficulty MIX, and output the csv code block only.",
            "",
            "Question type codes",
            "",
            "MC = Multiple Choice. Question Type column: Multiple Choice",
            "TF = True/False. Question Type column: True False",
            "SATA = Select All That Apply. Question Type column: Multiple Choice. Correct Choice is comma-separated.",
            "FIB = Fill in the Blank. Question Type column: Multiple Choice. The question text contains ___.",
            "RANK = Ranked / Order in sequence. Question Type column: Ranked",
            "MM = Mix & Match. Question Type column: Mix and match",
            "FC = Flash Card. Question Type column: Flash card",
            "",
            "Aliases (treat the same): ORD, SEQ, ORDER mean RANK. FLASH means FC. MATCH means MM. T/F means TF. SA and FR become FC.",
            "",
            "CSV column schema (required order)",
            "",
            "Every row has these columns, in this exact order:",
            "",
            "1. Number — optional sort key; use a blank cell",
            "2. Title — short label shown in the quiz UI (for example Multiple choice, True or false)",
            "3. Question — question text",
            "4. Instruction — how to answer, shown under the question",
            "5. Question Type — drives rendering",
            "6. Correct Choice — 1-based index into the choice columns, or N/A for ranked and mix-and-match, or comma-separated for SATA",
            "7. Choice 1 through Choice N — answer options. Use as many columns as needed. Trailing empty columns may be omitted.",
            "",
            "Header row, included once at the top of the csv block:",
            "",
            "\"\",\"Title\",\"Question\",\"Instruction\",\"Question Type\",\"Correct Choice\",\"Choice 1\",\"Choice 2\",\"Choice 3\",\"Choice 4\",\"Choice 5\",\"Choice 6\",\"Choice 7\"",
            "",
            "Global CSV rules",
            "",
            "- Correct Choice indices are 1-based: Choice 1 = 1, Choice 2 = 2, and so on.",
            "- Do not prefix choices with a), b), 1., or similar. The column position is the label.",
            "- Do not wrap values in quotes unless required (commas or multiline content inside a cell).",
            "- For multiline cells, use real newlines inside double quotes. Do not write a backslash followed by n.",
            "- SATA is detected when Correct Choice contains commas (for example 1,2,4), not by writing SATA in Question Type.",
            "- Ranked and Mix and match ignore Correct Choice. Use N/A.",
            "- Escape a double quote inside a quoted field by doubling it.",
            "",
            "How to generate each type",
            "",
            "MC — Multiple Choice",
            "Question Type: Multiple Choice",
            "Correct Choice: a single number pointing at the right choice column",
            "Choice columns: 3–6 plausible options (4 is typical)",
            "Instruction: Select the correct answer.",
            "Example row: ,Multiple choice,What is 2 + 2?,Select the correct answer.,Multiple Choice,2,3,4,5,6",
            "",
            "FIB — Fill in the Blank",
            "Question Type: Multiple Choice (not a separate FIB type)",
            "Question text: use ___ for each blank",
            "Correct Choice: index of the choice that fills the blank",
            "Put the correct wording in the indexed choice column and add 3–4 plausible distractors",
            "Instruction: Select the answer that best fills the blank.",
            "Example row: ,Fill in the blank,The ___ is the powerhouse of the cell.,Select the answer that best fills the blank.,Multiple Choice,2,nucleus,mitochondria,ribosome,vacuole",
            "",
            "TF — True/False",
            "Question Type: True False",
            "Correct Choice: 1 = True, 2 = False",
            "Exactly two choice columns: True, then False",
            "Instruction: Select True or False.",
            "Example row: ,True or false,The sky is blue on a clear day.,Select True or False.,True False,1,True,False",
            "",
            "SATA — Select All That Apply",
            "Question Type: Multiple Choice",
            "Correct Choice: comma-separated indices of all correct choices",
            "Instruction: Toggle each correct choice, then press the confirm button.",
            "Provide 4–6 choices with 2–4 correct answers",
            "Example row: ,Select all that apply,Which of these are mammals? (Select all that apply.),Toggle each correct choice then press the confirm button.,Multiple Choice,\"1,2,4\",Dog,Cat,Salmon,Horse,Eagle",
            "",
            "FC — Flash Card",
            "Question cell: front side, then a line of exactly four equals signs ====, then the back side. That is one cell, so quote it and use a real line break.",
            "Question Type: Flash card",
            "Correct Choice: 1 (Yes, I remembered, is the success path)",
            "Choice 1: Yes. Choice 2: No.",
            "Instruction: Flip the card to see the answer, then choose whether you remembered it.",
            "",
            "RANK — Ranked / Order in Correct Sequence",
            "Question Type: Ranked",
            "Correct Choice: N/A",
            "Choice columns: items in the correct order from left to right. The app shuffles them for the learner.",
            "Instruction: Drag into the correct order, then press Finished ordering.",
            "Example row: ,Ranked,Order these steps for hand washing.,Drag into the correct order then press Finished ordering.,Ranked,N/A,Wet hands with water,Apply soap and scrub,Rinse thoroughly,Dry hands",
            "",
            "MM — Mix and Match",
            "Question Type: Mix and match",
            "Correct Choice: N/A",
            "Each paired choice cell is three lines: the left term, a line that is only ===, then the right definition. Quote the cell.",
            "Optional distractor: a choice with text only and no === line (an extra left-side item with no match slot).",
            "Do not shuffle pairs. List the correct pairings in the choice columns.",
            "Instruction: Drag items from the left into the matching slot on the right.",
            "",
            "Output format for the csv block",
            "",
            "The block starts with ```csv and ends with ```.",
            "Inside it: the header row, then one data row per question.",
            "The explanation sentence comes first. Then the csv fence. Immediately after the closing fence, write the generated questions, then the two ending lines from STEP 2.",
            "If the output is truncated, I will say \"continue the same CSV format\". Append more rows without repeating the header, then continue the questions.",
            "",
            "Do not use outside knowledge. Do not add Picture, Video, or audio rows.",
            "",
            "YOUR REPLY:",
            "Ask me the STEP 1 questions. The article is already included below. Do not ask me to paste it again. You can also suggest \"" + QUIZ_SUGGESTED_REPLY + "\" for the user to copy as a response, or to say to go by your suggestion.",
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

    function fallbackCopy(text) {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.left = "-9999px";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
    }

    function copyText(text, message) {
        const done = () => setQuizStatus(message);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text).then(done).catch(() => {
                fallbackCopy(text);
                done();
            });
        }
        fallbackCopy(text);
        done();
        return Promise.resolve();
    }

    function copyQuizPrompt() {
        return copyText(quizPromptEl ? quizPromptEl.value : "", "Prompt copied.");
    }

    function openQuizChat(homeUrl, queryUrl) {
        const prompt = quizPromptEl ? quizPromptEl.value : "";
        const url = queryUrl + encodeURIComponent(prompt);
        showWhatNow();
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

    function showWhatNow() {
        const section = document.getElementById("practice-quiz-next");
        const quiz = document.getElementById("practice-quiz");
        if (!section) return;
        section.hidden = false;
        if (quiz) quiz.classList.add("is-next-open");
        requestAnimationFrame(() => {
            if (!quiz) {
                section.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
            }
            const delta = section.getBoundingClientRect().top - quiz.getBoundingClientRect().top;
            quiz.scrollTo({ top: quiz.scrollTop + delta, behavior: "smooth" });
        });
    }

    function extractCsv(raw) {
        const text = String(raw || "").replace(/^\uFEFF/, "").trim();
        const fenced = text.match(/```(?:csv)?\s*([\s\S]*?)```/i);
        return (fenced ? fenced[1] : text).trim();
    }

    function parseCsv(text) {
        const rows = [];
        let row = [];
        let cell = "";
        let quoted = false;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (quoted) {
                if (ch === '"') {
                    if (text[i + 1] === '"') {
                        cell += '"';
                        i++;
                    } else quoted = false;
                } else cell += ch;
            } else if (ch === '"') quoted = true;
            else if (ch === ",") {
                row.push(cell);
                cell = "";
            } else if (ch === "\n") {
                row.push(cell);
                rows.push(row);
                row = [];
                cell = "";
            } else if (ch !== "\r") cell += ch;
        }
        if (cell.length || row.length) {
            row.push(cell);
            rows.push(row);
        }
        return rows.filter((line) => line.some((value) => String(value).trim() !== ""));
    }

    function questionsFromCsv(raw) {
        const rows = parseCsv(extractCsv(raw));
        if (!rows.length) return [];
        const head = rows[0].map((cell) => cell.trim().toLowerCase());
        const headered = head.indexOf("question") !== -1 && (head.indexOf("question type") !== -1 || head.indexOf("correct choice") !== -1);
        const col = (names, fallback) => {
            if (!headered) return fallback;
            for (let i = 0; i < names.length; i++) {
                const at = head.indexOf(names[i]);
                if (at !== -1) return at;
            }
            return fallback;
        };
        const iTitle = col(["title"], 1);
        const iQuestion = col(["question"], 2);
        const iInstruction = col(["instruction"], 3);
        const iType = col(["question type"], 4);
        const iCorrect = col(["correct choice"], 5);
        let iChoice = 6;
        if (headered) {
            const named = head.findIndex((name) => name.indexOf("choice ") === 0 || name === "choice 1");
            iChoice = named === -1 ? iCorrect + 1 : named;
        }
        const questions = [];
        for (let r = headered ? 1 : 0; r < rows.length; r++) {
            const cells = rows[r];
            const choices = [];
            for (let c = iChoice; c < cells.length; c++) {
                if (String(cells[c] || "").trim() !== "") choices.push(String(cells[c]));
            }
            const question = String(cells[iQuestion] || "").trim();
            if (!question || !choices.length) continue;
            questions.push({
                title: String(cells[iTitle] || "").trim(),
                question: question,
                instruction: String(cells[iInstruction] || "").trim(),
                type: String(cells[iType] || "").trim(),
                correct: String(cells[iCorrect] || "").trim(),
                choices: choices
            });
        }
        return questions;
    }

    function questionKind(q) {
        const type = q.type.toLowerCase().replace(/\s+/g, " ");
        if (type === "true false" || type === "true/false" || type === "tf" || type === "t/f") return "tf";
        if (type === "ranked" || type === "rank" || type === "ord" || type === "seq" || type === "order") return "rank";
        if (type === "mix and match" || type === "mix & match" || type === "mm" || type === "match") return "mm";
        if (type === "flash card" || type === "flashcard" || type === "fc" || type === "flash") return "fc";
        if (q.correct.indexOf(",") !== -1) return "sata";
        return "mc";
    }

    function shuffleItems(list) {
        const copy = list.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = copy[i];
            copy[i] = copy[j];
            copy[j] = tmp;
        }
        return copy;
    }

    function splitMarker(text, marker) {
        const lines = String(text).split(/\r?\n/);
        const at = lines.findIndex((line) => line.trim() === marker);
        if (at === -1) return null;
        return {
            left: lines.slice(0, at).join("\n").trim(),
            right: lines.slice(at + 1).join("\n").trim()
        };
    }

    function quizNode(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function kindLabel(kind) {
        if (kind === "tf") return "True or false";
        if (kind === "sata") return "Select all that apply";
        if (kind === "rank") return "Ranked";
        if (kind === "mm") return "Mix and match";
        if (kind === "fc") return "Flash card";
        return "Multiple choice";
    }

    function moveRank(row, dir) {
        const parent = row.parentNode;
        if (!parent) return;
        if (dir < 0 && row.previousElementSibling) parent.insertBefore(row, row.previousElementSibling);
        if (dir > 0 && row.nextElementSibling) parent.insertBefore(row.nextElementSibling, row);
    }

    function renderIntake(questions) {
        const runner = document.getElementById("practice-quiz-runner");
        if (!runner) return;
        runner.innerHTML = "";
        questions.forEach((q, index) => {
            const kind = questionKind(q);
            const card = quizNode("article", "quiz-card");
            card.setAttribute("data-kind", kind);
            card.setAttribute("data-correct", q.correct);
            card.appendChild(quizNode("h5", "quiz-card__title", (index + 1) + ". " + (q.title || kindLabel(kind))));
            if (kind === "fc") {
                const sides = splitMarker(q.question, "====") || { left: q.question, right: "" };
                card.appendChild(quizNode("p", "quiz-card__text", sides.left));
                const back = quizNode("p", "quiz-card__back", sides.right);
                back.hidden = true;
                const flip = quizNode("button", "quiz-card__flip", "Show answer");
                flip.type = "button";
                flip.addEventListener("click", () => {
                    back.hidden = false;
                    flip.hidden = true;
                });
                card.appendChild(flip);
                card.appendChild(back);
            } else {
                card.appendChild(quizNode("p", "quiz-card__text", kind === "mm" ? q.question.split("\n")[0] : q.question));
            }
            if (q.instruction) card.appendChild(quizNode("p", "quiz-card__instruction", q.instruction));
            const choices = quizNode("div", "quiz-card__choices");
            if (kind === "rank") {
                shuffleItems(q.choices.map((text, choiceIndex) => ({ text: text, index: choiceIndex }))).forEach((item) => {
                    const row = quizNode("div", "quiz-rank");
                    row.setAttribute("data-index", String(item.index));
                    const up = quizNode("button", "quiz-rank__move", "Up");
                    const down = quizNode("button", "quiz-rank__move", "Down");
                    up.type = "button";
                    down.type = "button";
                    up.addEventListener("click", () => moveRank(row, -1));
                    down.addEventListener("click", () => moveRank(row, 1));
                    row.appendChild(quizNode("span", "quiz-rank__label", item.text));
                    row.appendChild(up);
                    row.appendChild(down);
                    choices.appendChild(row);
                });
            } else if (kind === "mm") {
                const pairs = [];
                const lefts = [];
                q.choices.forEach((choice) => {
                    const pair = splitMarker(choice, "===");
                    if (pair && pair.left && pair.right) {
                        pairs.push(pair);
                        lefts.push(pair.left);
                    } else if (choice.trim()) lefts.push(choice.trim());
                });
                const options = shuffleItems(lefts);
                pairs.forEach((pair) => {
                    const row = quizNode("label", "quiz-match");
                    const select = document.createElement("select");
                    select.setAttribute("data-answer", pair.left);
                    const blank = document.createElement("option");
                    blank.value = "";
                    blank.textContent = "Choose";
                    select.appendChild(blank);
                    options.forEach((left) => {
                        const option = document.createElement("option");
                        option.value = left;
                        option.textContent = left;
                        select.appendChild(option);
                    });
                    row.appendChild(select);
                    row.appendChild(quizNode("span", "quiz-match__right", pair.right));
                    choices.appendChild(row);
                });
            } else {
                const multi = kind === "sata";
                q.choices.forEach((choice, choiceIndex) => {
                    const row = quizNode("label", "quiz-choice");
                    const input = document.createElement("input");
                    input.type = multi ? "checkbox" : "radio";
                    input.name = "quiz-q-" + index;
                    input.value = String(choiceIndex + 1);
                    row.appendChild(input);
                    row.appendChild(document.createTextNode(" " + choice));
                    choices.appendChild(row);
                });
            }
            card.appendChild(choices);
            const result = quizNode("p", "quiz-card__result", "");
            result.hidden = true;
            card.appendChild(result);
            runner.appendChild(card);
        });
        const check = quizNode("button", "quiz-check", "Check answers");
        check.type = "button";
        check.addEventListener("click", () => gradeIntake(runner));
        runner.appendChild(check);
        runner.appendChild(quizNode("p", "quiz-score", ""));
        runner.lastChild.id = "practice-quiz-score";
        runner.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function numberSet(values) {
        return values.map((value) => parseInt(value, 10)).filter((value) => !Number.isNaN(value)).sort((a, b) => a - b).join(",");
    }

    function gradeCard(card) {
        const kind = card.getAttribute("data-kind");
        const correct = card.getAttribute("data-correct") || "";
        if (kind === "rank") {
            const order = Array.from(card.querySelectorAll(".quiz-rank")).map((row) => row.getAttribute("data-index"));
            return order.every((value, index) => value === String(index));
        }
        if (kind === "mm") {
            const selects = Array.from(card.querySelectorAll("select"));
            return selects.length > 0 && selects.every((select) => select.value === select.getAttribute("data-answer"));
        }
        if (kind === "sata") {
            const wanted = numberSet(correct.split(","));
            const got = numberSet(Array.from(card.querySelectorAll("input:checked")).map((input) => input.value));
            return wanted !== "" && wanted === got;
        }
        const picked = card.querySelector("input:checked");
        return !!picked && picked.value === String(correct).trim();
    }

    function gradeIntake(runner) {
        const cards = Array.from(runner.querySelectorAll(".quiz-card"));
        let correct = 0;
        cards.forEach((card) => {
            const ok = gradeCard(card);
            if (ok) correct += 1;
            card.classList.toggle("is-correct", ok);
            card.classList.toggle("is-incorrect", !ok);
            const result = card.querySelector(".quiz-card__result");
            if (result) {
                result.hidden = false;
                result.textContent = ok ? "Correct" : "Not quite";
            }
        });
        const scoreEl = document.getElementById("practice-quiz-score");
        const saved = window.TrackLearning && window.TrackLearning.recordScore && window.TrackLearning.recordScore(correct, cards.length);
        if (scoreEl) scoreEl.textContent = "Score " + correct + "/" + cards.length + (saved ? ". Saved next to this lesson." : ".");
    }

    function startIntake() {
        const intake = document.getElementById("practice-quiz-intake");
        const runner = document.getElementById("practice-quiz-runner");
        const questions = questionsFromCsv(intake ? intake.value : "");
        if (!questions.length) {
            if (runner) {
                runner.innerHTML = "";
                runner.appendChild(quizNode("p", "quiz-score", "Paste a CSV with a header and at least one question."));
            }
            return;
        }
        renderIntake(questions);
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
        const next = document.getElementById("practice-quiz-next");
        if (next) next.hidden = true;
        const quiz = document.getElementById("practice-quiz");
        if (quiz) quiz.classList.remove("is-next-open");
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
    document.addEventListener("learning-quiz", () => {
        if (panelEl.hidden) openPanel();
        setMode("quiz");
    });
    if (quizCopyBtn) quizCopyBtn.addEventListener("click", () => copyQuizPrompt());
    const quizCopyReplyBtn = document.getElementById("practice-quiz-copy-reply");
    if (quizCopyReplyBtn) quizCopyReplyBtn.addEventListener("click", () => copyText(QUIZ_SUGGESTED_REPLY, "Reply copied."));
    if (quizChatgptBtn) quizChatgptBtn.addEventListener("click", () => openQuizChat("https://chatgpt.com/", "https://chatgpt.com/?q="));
    if (quizClaudeBtn) quizClaudeBtn.addEventListener("click", () => openQuizChat("https://claude.ai/new", "https://claude.ai/new?q="));
    const quizIntakeBtn = document.getElementById("practice-quiz-intake-start");
    if (quizIntakeBtn) quizIntakeBtn.addEventListener("click", startIntake);
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
