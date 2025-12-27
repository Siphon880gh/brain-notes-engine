## Private notes require a password

If a Markdown file ends with `PRIVATE` or `(PRIVATE)` in the filename, the app should prompt for a password before opening it. If the user enters the correct password, we store their authenticated state in a PHP session to keep them "logged in".

While logged in, private notes are allowed to open normally (same flow as non-private notes).

**Auto-retry after login**: When a user tries to open a private note without being logged in, they see a "Login to View" button. After successful authentication, the note automatically reopens - the user doesn't need to manually click on the note again.

## Security Measures

**Hidden href paths**: When `cachedResPartial.php` is built, private files have their `href=""` set to empty instead of exposing the true file path. This prevents users from right-clicking to copy the link or inspecting the HTML source to find private note paths.

## Hackable for now

Someone can still view the private notes if they really try. We can harden security even more but it isn't worth the effort right now (there's no company secrets in these private files, it's just me being greedy with information and perhaps will add a paywall for all articles in the future).

The hacker can inspect the Network tab, find `cachedResData.json`, then grab the note ID from the DOM. The actual file path is included in `cachedResData.json`. Both `cachedResData.json` and `cachedResDataImaged.json` are only used on the frontend to quickly open random notes (`openRandomNote`), which means if we change the random note mechanism, then we can definitely make hacking into a private note impossible.

If we *do* want to hide it from hackers, we could move the random-note selection server-side—for example, use a PHP endpoint that picks and opens a random note using the cached JSON file. The frontend entry data flow would start like this: When opening a note, `note-opener.js`’s `openNote` calls the PHP endpoint `local-open.php?id=`, which contains the main logic for resolving the note from the cached JSON and opening the file.