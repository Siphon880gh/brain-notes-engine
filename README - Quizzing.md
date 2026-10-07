# Quiz CSV files in DevBrain

DevBrain can surface quiz data alongside your notes. Add a CSV file to a folder in `curriculum/`, rebuild, and readers can copy that CSV into [Weng's Quiz app](https://wengindustries.com/app/quiz-gsheet) to be quizzed on the topics in that folder.

## Filename pattern

Quiz files must end with `.quiz.csv`:

```
seo-basics.quiz.csv
ppc-pruning.quiz.csv
ai-film.quiz.csv
```

The `.quiz.csv` suffix is required for quiz modal behavior. Regular `.csv` files (without `.quiz.`) are also supported—they open as notes with a rendered table (see [README.md](README.md) Organizing section).

## Where to put files

Place quiz CSV files anywhere under `curriculum/`, next to the notes they cover. Example:

```
curriculum/
  Marketing/
    SEO/
      seo-basics.md
      seo-basics.quiz.csv
```

After adding or editing a quiz file, rebuild the brain (for example `npm run build-devbrain`) so `cachedResData.json` and `cachedResPartial.html` include it.

## How it appears in the app

- The topic tree shows the file without the `.quiz.csv` suffix (e.g. `seo-basics`).
- A purple **Quiz** pill marks the row as a quiz, not a note.
- **Random Note** and the note count ignore quiz rows; they only apply to regular notes.

## How readers use it

1. Click the quiz row in the topic navigator.
2. A modal opens with the full CSV and short instructions.
3. Click **Copy CSV**, then **Open Quiz App** (opens https://wengindustries.com/app/quiz-gsheet in a new tab).
4. Paste the CSV into the quiz app to start quizzing on that folder's topics.

Quiz files do not open in the main note panel; they always use the quiz modal.

## Quiz an open lesson

Open any lesson, then click **Practice** and choose **Quiz**. The panel fills a prompt with that lesson (or with a passage you narrowed under “Too long to practice?”). Copy it, or open it in ChatGPT or Claude.

The chatbot asks how many questions you want, which formats, and how hard. It waits for your answers before it grades you. After the grade report, it prints CSV for [Weng's Quiz app](https://wengindustries.com/app/quiz-gsheet/gsheets/_Special%20-%20User%20Provides/Intake.php). Reply `export` if you want that CSV without finishing the chat quiz.

Paste the CSV on the quiz app’s intake page. Column layout is below.

## CSV content

The quiz app reads a header row, then one row per question. Columns A–F are fixed by position. From column G on, a header that begins with `Choice` is an answer, and a header that contains `Hint` is a hint. The same layout is what `*.quiz.csv` files and the Practice → Quiz prompt both target. DevBrain does not validate or transform the CSV; it displays a quiz file as-is for copy/paste.

Further app behavior is in the [quiz-gsheet GitHub repo](https://github.com/Siphon880gh/quiz-gsheet). The sample file there is `gsheets/Test/sample-quiz.csv`.

### Header

```csv
Number,Title,Question,Instruction,Question Type,Correct Choice,Choice 1,Choice 2,Choice 3,Choice 4,Choice 5,Choice 6,Choice 7,Hint
```

| Column | Header | What to put |
| --- | --- | --- |
| A | Number | Blank, or `-1` to hide the row. The column must exist. |
| B | Title | Short topic label shown with the question. |
| C | Question | Question text. No `A)` / `B)` prefixes. |
| D | Instruction | One line on how to answer. |
| E | Question Type | Exactly one of: `Multiple Choice`, `True False`, `Ranked`, `Mix and match`, `Flash card`. |
| F | Correct Choice | 1-based index of the correct Choice column. Choice 1 is `1`. |
| G+ | Choice 1 … | Answer text only. Leave unused choice cells empty. Add more `Choice N` columns if a question needs them. |
| last | Hint | Optional one-sentence reminder. Leave blank if there is none. |

`Correct Choice` counts only columns whose header begins with `Choice`, from left to right. Quote any field that contains a comma, a double quote, or a line break. A double quote inside a field is written twice (`""`).

### Question types

- **Multiple choice.** Question Type `Multiple Choice`. Usually four choices. Correct Choice is `1`, `2`, `3`, or `4`.
- **True/false.** Question Type `True False`. Choice 1 is `True`, Choice 2 is `False`, other choice cells empty. Correct Choice is `1` or `2`.
- **Select all that apply.** Question Type stays `Multiple Choice`. Put 5–7 choices in the Choice columns. Correct Choice is every right index, comma-separated, for example `1,3,5`. The comma is what turns on select-all. Do not put `SATA` in Question Type.
- **Fill in the blank.** Question Type `Multiple Choice`. Write the blank as `___` in the question. Put the correct wording in one choice and distractors in the others. Correct Choice points at the correct choice.
- **Ranked / order.** Question Type `Ranked`. Correct Choice is `N/A`. Choice 1, Choice 2, and so on are already in the correct order.
- **Mix and match.** Question Type `Mix and match`. Correct Choice is `N/A`. Each matched Choice cell is three lines inside quotes: the left item, a line that is only `===`, then the matching right item. A distractor with no match is a single line and has no `===`.
- **Flash card.** Question Type `Flash card`. The Question cell is three lines: the front, a line that is only `====`, then the back. Choice 1 is `Yes`, Choice 2 is `No`, Correct Choice is `1`. Short answer and free response from the Practice prompt export as flash cards, because the quiz app does not grade typed prose.

Picture, video, and audio rows are supported by the quiz app (`Picture`, `Video`, `Absolute pitch`, `Relative pitch` in Question Type, with a URL in the question). The Practice prompt does not generate those.

### Example

```csv
Number,Title,Question,Instruction,Question Type,Correct Choice,Choice 1,Choice 2,Choice 3,Choice 4,Choice 5,Choice 6,Choice 7,Hint
,Terms,What does API stand for?,Select the correct answer.,Multiple Choice,2,Application Process Input,Application Programming Interface,Automated Program Install,Active Page Index,,,,
,Facts,The sky is blue on a clear day.,Select True or False.,True False,1,True,False,,,,,,
,Classification,Which of these are mammals?,Toggle each correct choice then press the confirm button.,Multiple Choice,"1,2,4",Dog,Cat,Salmon,Horse,Eagle,,,
,Cells,The ___ is the powerhouse of the cell.,Select the answer that fills the blank.,Multiple Choice,2,nucleus,mitochondria,ribosome,vacuole,,,,
,Steps,Order these steps for hand washing.,Drag into the correct order then press Finished ordering.,Ranked,N/A,Wet hands with water,Apply soap and scrub,Rinse thoroughly,Dry hands,,,,
,Pairs,Match each term to its definition.,Drag each item on the left into the matching slot on the right.,Mix and match,N/A,"HTTP
===
Hypertext Transfer Protocol","DNS
===
Domain Name System",,,,,,
,Recall,"What does API stand for?
====
Application Programming Interface",Did you remember correctly?,Flash card,1,Yes,No,,,,,,
```

## Private folders

Quiz files inside a `(PRIVATE)` folder or `PRIVATE` folder follow the same password rules as private notes. If the reader is not logged in, they are prompted to authenticate; after login, the quiz modal opens with the CSV content.

## For developers

| Piece | Role |
|-------|------|
| [`cache_data.js`](cache_data.js) | Includes `*.quiz.csv` in the curriculum scan |
| [`cache_render.js`](cache_render.js) | Renders `is-quiz` rows, `data-quiz="1"`, and the Quiz pill |
| [`index.php`](index.php) | `#quizModal` markup |
| [`assets/js/index.js`](assets/js/index.js) | `openQuiz()`, click routing, copy/open buttons |
| [`assets/js/game.js`](assets/js/game.js) | Practice → Quiz prompt, copy, and ChatGPT/Claude links |
| [`local-open.php`](local-open.php) | Serves file content by cached id (same as notes) |

More implementation detail: [`LLM_CODE_REFERENCE-features.md`](LLM_CODE_REFERENCE-features.md) (Quiz CSV Files section).
