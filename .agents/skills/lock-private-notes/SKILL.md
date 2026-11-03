---
name: lock-private-notes
description: >-
  Password-locks DevBrain notes and folders. Use when Weng asks to lock a note
  with a password, hide a PRIVATE note, add (PRIVATE) to a filename or folder,
  or wonders why See what's unlocked says nothing is locked.
---

# Lock a DevBrain note with the password

App root: `/Users/wengffung/dev/web/weng/app/devbrain`. The vault is `DIR_SNIPPETS` in `.env` (local Obsidian folder). The password is `$password` in `.env-password.php`. Do not print that password. Do not commit `.env-password.php`.

A note is password-locked only when the built tree marks it `data-private="1"`. The chevron list stays empty until a name matches and the app is rebuilt.

## Names that lock

Case does not matter. The token must be at the end. `(PRIVATED)`, `(SUPERPRIVATE)`, and `(SuperPrivated)` do not lock.

| Lock this | Rename so it ends with |
|---|---|
| One note | `(PRIVATE).md` |
| A folder and everything inside it | `(PRIVATE)` |

Examples: `API Keys (PRIVATE).md`, `Drafts (PRIVATE)`.

`(SUPERPRIVATE)` / an `obsidian://` link is a different lock. Those notes open in Obsidian and show under **Can't be unlocked**. The password does not reveal them.

## Steps

1. Rename the note or folder in the vault. Do not only edit the title inside the file.
2. From the app root, run `npm run build-devbrain`.
3. Reload the app. Logged-out visitors do not see the note. After login, the chevron **See what's unlocked** lists it under **Unlocked**.

To change the password, edit `$password` in `.env-password.php` only. No rebuild is required for a password change.
