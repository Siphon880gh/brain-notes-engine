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

## CSV content

The CSV should match what [Weng's Quiz app](https://wengindustries.com/app/quiz-gsheet) expects—typically rows exported from the Google Sheets–backed quiz source. For format details and how questions are structured, see the [quiz-gsheet GitHub repo](https://github.com/Siphon880gh/quiz-gsheet).

DevBrain does not validate or transform the CSV; it displays the file as-is for copy/paste.

## Private folders

Quiz files inside a `(PRIVATE)` folder or `PRIVATE` folder follow the same password rules as private notes. If the reader is not logged in, they are prompted to authenticate; after login, the quiz modal opens with the CSV content.

## For developers

| Piece | Role |
|-------|------|
| [`cache_data.js`](cache_data.js) | Includes `*.quiz.csv` in the curriculum scan |
| [`cache_render.js`](cache_render.js) | Renders `is-quiz` rows, `data-quiz="1"`, and the Quiz pill |
| [`index.php`](index.php) | `#quizModal` markup |
| [`assets/js/index.js`](assets/js/index.js) | `openQuiz()`, click routing, copy/open buttons |
| [`local-open.php`](local-open.php) | Serves file content by cached id (same as notes) |

More implementation detail: [`LLM_CODE_REFERENCE-features.md`](LLM_CODE_REFERENCE-features.md) (Quiz CSV Files section).
