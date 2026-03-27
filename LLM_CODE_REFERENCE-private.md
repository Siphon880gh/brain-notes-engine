# DevBrain - Private Notes & Folders

> **Note for AI Tools:** Line references in this file are intentionally approximate. Use these as navigation hints, then search or read the actual file for precision.

## Overview

DevBrain protects notes and folders that end with `PRIVATE` or `(PRIVATE)` (case insensitive). Unauthenticated users cannot see private folders in the file tree or open private notes. A key icon in the top right allows login with a password stored in `.env-password.php`.

## Naming Convention

### Files
- Must end with `PRIVATE.md` or `(PRIVATE).md`
- Examples: `My Secret Note PRIVATE.md`, `Credentials (PRIVATE).md`, `API Keys private.md`

### Folders
- Must end with `(PRIVATE)` or `PRIVATE`
- Examples: `Secrets (PRIVATE)`, `Drafts PRIVATE`, `Work-in-Progress PRIVATE`
- All files and subfolders inside are treated as private

### Case Insensitivity
- `PRIVATE`, `Private`, `private` all match

## Authentication Flow

1. Private folders and their contents are hidden from the file tree until authenticated
2. User clicks on a private note (or opens via random note) in the file tree
3. If not authenticated, a blocked content message is shown with a "Login to View" button
4. User clicks the key icon (🔑) in top right or the login button
5. Password is verified against `.env-password.php`
6. PHP session stores authentication state
7. User can now view all private notes and folders until session expires
8. **Auto-retry**: After successful login, a blocked private note automatically reopens

## Architecture

### Build-Time (cache_render.js)
- **Private detection**: `isPrivateFolderName()` checks folder names; `isInPrivateFolder()` checks path segments
- **HTML output**: Private items get `data-private="1"` on the `<li>` element
- **Path hiding**: Private files and files in private folders get `href=""` instead of the real path

### Runtime (private-auth.js)
- **Visibility**: `updatePrivateElementsVisibility()` hides/shows `[data-private="1"]` based on auth state
- **Initial load**: Private elements hidden immediately (before auth check) to prevent flash
- **Auth changes**: Visibility updated in `updateUI()` on login/logout

### Backend (local-open.php)
- **Access check**: Blocks when `isPrivateFile($filename)` or `isInPrivateFolder($pathTp)` and not authenticated
- **Response**: Returns `__PRIVATE_BLOCKED__` which the frontend renders as the login prompt

## Key Components

| File | Purpose |
|------|---------|
| `.env-password.php` | Password storage (gitignored) |
| `check-private-auth.php` | Login/logout/check JSON API |
| `local-open.php` | File access gate; blocks private content when unauthenticated |
| `assets/js/private-auth.js` | PrivateAuthManager: modal, auth state, visibility toggle |
| `assets/css/private-auth.css` | Key button, modal, blocked content styling |
| `cache_render.js` | Marks private items with `data-private`, hides href |
| `assets/js/note-opener.js` | Renders blocked content UI, triggers auth retry |

## UI Elements

- **Key Icon**: Fixed top-right button (🔑), turns green when authenticated
- **Login Modal**: Password input, login/logout buttons
- **Blocked Content**: Yellow-bordered message with "Login to View" when accessing private notes

## Security Notes

- **Path exposure**: Private paths are hidden from HTML source (`href=""`)
- **cachedResData.json**: Still contains full paths; used for random note and lookup. Direct access is blocked by `local-open.php`
- **README - Private Notes.md**: Documents current security posture and hackability
