(function () {
    const DB_NAME = "devbrain-track-learning";
    const STORE = "brains";
    const SKIP_NAMES = new Set(["sortspec.md", "readme.md", "package.json", "package-lock.json"]);

    let started = false;
    let loaded = false;
    let useLocal = false;
    let readyPromise = Promise.resolve();
    let saveChain = Promise.resolve();
    let state = emptyState();
    let idToPath = new Map();
    let fileById = new Map();

    function emptyState() {
        return { folders: {}, lessons: {} };
    }

    function normalize(value) {
        return String(value || "").replace(/\\/g, "/").replace(/\/+$/, "");
    }

    function scopeKey() {
        return String(window.dirSnippets || window.location.pathname || "brain");
    }

    function isLessonPath(rel) {
        const base = (rel.split("/").pop() || "").toLowerCase();
        if (!base || SKIP_NAMES.has(base)) return false;
        if (/\.(no|hide)\.md$/i.test(base)) return false;
        if (/\.quiz\.csv$/i.test(base)) return true;
        if (/\.csv$/i.test(base)) return false;
        return /\.(md|json)$/i.test(base);
    }

    function normalizeState(raw) {
        const next = emptyState();
        if (!raw || typeof raw !== "object") return next;
        if (raw.folders && typeof raw.folders === "object") {
            Object.keys(raw.folders).forEach((key) => {
                const folder = raw.folders[key];
                if (!folder || folder.mode !== "completeness") return;
                next.folders[normalize(key)] = {
                    mode: "completeness",
                    trackedAt: Number(folder.trackedAt) || Date.now()
                };
            });
        }
        if (raw.lessons && typeof raw.lessons === "object") {
            Object.keys(raw.lessons).forEach((key) => {
                const lesson = raw.lessons[key];
                if (!lesson || !lesson.complete) return;
                next.lessons[normalize(key)] = {
                    complete: true,
                    completedAt: Number(lesson.completedAt) || Date.now()
                };
            });
        }
        return next;
    }

    function localKey() {
        return "devbrain-track-learning:" + scopeKey();
    }

    function readLocal() {
        try {
            return normalizeState(JSON.parse(localStorage.getItem(localKey()) || "null"));
        } catch (e) {
            return emptyState();
        }
    }

    function writeLocal(next) {
        localStorage.setItem(localKey(), JSON.stringify(next));
    }

    function openDb() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error("IndexedDB is unavailable"));
                return;
            }
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    function loadState() {
        return openDb().then((db) => new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, "readonly");
            const request = tx.objectStore(STORE).get(scopeKey());
            request.onsuccess = () => {
                db.close();
                useLocal = false;
                resolve(normalizeState(request.result));
            };
            request.onerror = () => {
                db.close();
                reject(request.error);
            };
        })).catch(() => {
            useLocal = true;
            return readLocal();
        });
    }

    function writeState(next) {
        if (useLocal) {
            writeLocal(next);
            return Promise.resolve();
        }
        return openDb().then((db) => new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, "readwrite");
            const request = tx.objectStore(STORE).put(next, scopeKey());
            request.onsuccess = () => {
                db.close();
                resolve();
            };
            request.onerror = () => {
                db.close();
                reject(request.error);
            };
        })).catch(() => {
            useLocal = true;
            writeLocal(next);
        });
    }

    function queueSave() {
        const snapshot = JSON.parse(JSON.stringify(state));
        saveChain = saveChain.then(() => writeState(snapshot)).catch((err) => {
            console.error("Track learning save failed", err);
        });
    }

    function indexLessons() {
        idToPath = new Map();
        (window.folders || []).forEach((item) => {
            const rel = normalize(item.path_tp);
            if (!isLessonPath(rel)) return;
            idToPath.set(String(item.id), rel);
        });
        fileById = new Map();
        document.querySelectorAll("#topics-list .name.is-file[data-id]").forEach((el) => {
            fileById.set(el.getAttribute("data-id"), el);
        });
    }

    function isLessonVisible(el) {
        const hiddenRoot = el.closest('[data-private="1"]');
        return !(hiddenRoot && hiddenRoot.style.display === "none");
    }

    function lessonsUnder(folderPath) {
        const prefix = normalize(folderPath) + "/";
        const lessons = [];
        idToPath.forEach((rel, id) => {
            if (!rel.startsWith(prefix)) return;
            const el = fileById.get(id);
            if (!el || !isLessonVisible(el)) return;
            lessons.push({ id: id, path: rel });
        });
        return lessons;
    }

    function isTrackedLesson(path) {
        if (!path) return false;
        return Object.keys(state.folders).some((folderPath) => path.startsWith(normalize(folderPath) + "/"));
    }

    function findFolderLi(folderPath) {
        const want = normalize(folderPath);
        return Array.from(document.querySelectorAll("#topics-list li.accordion.meta[data-path]")).find((li) => {
            return normalize(li.getAttribute("data-path")) === want;
        }) || null;
    }

    function makeCheck(path, complete) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "learning-check" + (complete ? " is-complete" : "");
        btn.setAttribute("data-lesson", path);
        btn.setAttribute("aria-pressed", complete ? "true" : "false");
        btn.setAttribute("aria-label", complete ? "Completed. Mark incomplete." : "Mark complete");
        return btn;
    }

    function clearPaint() {
        document.querySelectorAll("#topics-list .learning-check, #topics-list .learning-progress").forEach((el) => el.remove());
        document.querySelectorAll("#topics-list li.learning-done").forEach((el) => el.classList.remove("learning-done"));
    }

    function paint() {
        clearPaint();
        const painted = new Set();
        Object.keys(state.folders).forEach((folderPath) => {
            const lessons = lessonsUnder(folderPath);
            const done = lessons.filter((lesson) => state.lessons[lesson.path] && state.lessons[lesson.path].complete).length;
            const folderLi = findFolderLi(folderPath);
            const name = folderLi && folderLi.querySelector(":scope > .name.is-folder");
            if (name) {
                const pill = document.createElement("span");
                pill.className = "learning-progress";
                pill.title = "Completeness mode";
                pill.textContent = "Completeness " + done + "/" + lessons.length;
                name.appendChild(pill);
            }
            lessons.forEach((lesson) => {
                if (painted.has(lesson.path)) return;
                painted.add(lesson.path);
                const el = fileById.get(lesson.id);
                const li = el && el.closest("li");
                if (!li) return;
                const complete = !!(state.lessons[lesson.path] && state.lessons[lesson.path].complete);
                li.insertBefore(makeCheck(lesson.path, complete), li.firstChild);
                li.classList.toggle("learning-done", complete);
            });
        });
    }

    function lessonPathForOpenNote() {
        if (window.currentNoteId == null || window.currentNoteId === "") return "";
        return idToPath.get(String(window.currentNoteId)) || "";
    }

    function syncOpenNote() {
        const btn = document.getElementById("learning-complete");
        if (!btn) return;
        const path = lessonPathForOpenNote();
        if (!isTrackedLesson(path)) {
            btn.hidden = true;
            btn.removeAttribute("data-lesson");
            return;
        }
        const complete = !!(state.lessons[path] && state.lessons[path].complete);
        btn.hidden = false;
        btn.setAttribute("data-lesson", path);
        btn.setAttribute("aria-pressed", complete ? "true" : "false");
        btn.textContent = complete ? "Completed" : "Mark complete";
        btn.classList.toggle("is-complete", complete);
    }

    function toggleLesson(path) {
        path = normalize(path);
        const complete = !(state.lessons[path] && state.lessons[path].complete);
        if (complete) state.lessons[path] = { complete: true, completedAt: Date.now() };
        else delete state.lessons[path];
        paint();
        syncOpenNote();
        queueSave();
    }

    function flashTrackButton(message) {
        const el = document.querySelector("#track-learning-btn .track-learning-text");
        if (!el) return;
        el.textContent = message;
        window.setTimeout(() => {
            if (!window.modeTrackLearning && el.textContent === message) {
                el.textContent = "Track learning";
            }
        }, 2200);
    }

    function applyToggle(folderPath) {
        folderPath = normalize(folderPath);
        if (state.folders[folderPath]) {
            delete state.folders[folderPath];
            paint();
            syncOpenNote();
            queueSave();
            return { untracked: true };
        }
        const lessons = lessonsUnder(folderPath);
        if (!lessons.length) {
            flashTrackButton("No lessons in that folder");
            return { empty: true };
        }
        state.folders[folderPath] = { mode: "completeness", trackedAt: Date.now() };
        paint();
        syncOpenNote();
        queueSave();
        return { tracked: true };
    }

    function toggleFolder(folderPath) {
        if (!loaded) return readyPromise.then(() => applyToggle(folderPath));
        return applyToggle(folderPath);
    }

    function onTopicsClick(event) {
        const btn = event.target.closest(".learning-check");
        if (!btn) return;
        event.preventDefault();
        event.stopPropagation();
        const path = btn.getAttribute("data-lesson");
        if (path) toggleLesson(path);
    }

    function bindUi() {
        const topics = document.getElementById("topics-list");
        if (topics) topics.addEventListener("click", onTopicsClick);
        const completeBtn = document.getElementById("learning-complete");
        if (completeBtn) {
            completeBtn.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                const path = completeBtn.getAttribute("data-lesson");
                if (path) toggleLesson(path);
            });
        }
        document.addEventListener("noteOpened", syncOpenNote);
        document.addEventListener("privateAuthChanged", () => {
            if (loaded) paint();
        });
    }

    function start() {
        if (started) return readyPromise;
        if (!window.folders || !document.getElementById("topics-list")) return Promise.resolve();
        started = true;
        bindUi();
        indexLessons();
        readyPromise = loadState().then((loadedState) => {
            state = loadedState;
            loaded = true;
            paint();
            syncOpenNote();
        }).catch((err) => {
            console.error("Track learning load failed", err);
            loaded = true;
        });
        return readyPromise;
    }

    window.TrackLearning = {
        start: start,
        toggleFolder: toggleFolder
    };
})();
