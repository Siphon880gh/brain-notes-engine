(function () {
    const DB_NAME = "devbrain-track-learning";
    const STORE = "brains";
    const SKIP_NAMES = new Set(["sortspec.md", "readme.md", "package.json", "package-lock.json"]);

    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    let started = false;
    let loaded = false;
    let useLocal = false;
    let readyPromise = Promise.resolve();
    let saveChain = Promise.resolve();
    let saveTimer = 0;
    let scrollTick = false;
    let watchPath = "";
    let state = emptyState();
    let idToPath = new Map();
    let fileById = new Map();
    let visitEls = new Map();

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
                const record = lessonRecord(raw.lessons[key]);
                if (record) next.lessons[normalize(key)] = record;
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

    function lessonRecord(lesson) {
        if (!lesson || typeof lesson !== "object") return null;
        const openedAt = Number(lesson.openedAt) || 0;
        const reached = Math.max(0, Math.min(100, Math.round(Number(lesson.reached) || 0)));
        const complete = !!lesson.complete;
        if (!complete && !openedAt && !reached) return null;
        const record = {};
        if (complete) {
            record.complete = true;
            record.completedAt = Number(lesson.completedAt) || openedAt || Date.now();
        }
        if (openedAt) record.openedAt = openedAt;
        if (reached) record.reached = reached;
        return record;
    }

    function queueSave() {
        if (saveTimer) {
            window.clearTimeout(saveTimer);
            saveTimer = 0;
        }
        const snapshot = JSON.parse(JSON.stringify(state));
        saveChain = saveChain.then(() => writeState(snapshot)).catch((err) => {
            console.error("Track learning save failed", err);
        });
    }

    function scheduleSave() {
        if (saveTimer) return;
        saveTimer = window.setTimeout(() => {
            saveTimer = 0;
            queueSave();
        }, 400);
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

    function formatOpened(ts, withYear) {
        const date = new Date(ts);
        if (Number.isNaN(date.getTime())) return "";
        const label = MONTHS[date.getMonth()] + " " + date.getDate();
        if (withYear || date.getFullYear() !== new Date().getFullYear()) return label + ", " + date.getFullYear();
        return label;
    }

    function visitText(record) {
        if (!record || !record.openedAt) return "";
        const pct = Math.max(0, Math.min(100, Math.round(Number(record.reached) || 0)));
        return formatOpened(record.openedAt, false) + " · " + pct + "%";
    }

    function fillVisit(el, record) {
        const text = visitText(record);
        if (!text) {
            el.hidden = true;
            el.textContent = "";
            el.removeAttribute("title");
            return;
        }
        const pct = Math.max(0, Math.min(100, Math.round(Number(record.reached) || 0)));
        el.hidden = false;
        el.textContent = text;
        el.title = "Last opened " + formatOpened(record.openedAt, true) + ". Reached " + pct + "%.";
    }

    function updateVisitLabel(path) {
        const el = visitEls.get(path);
        if (el) fillVisit(el, state.lessons[path]);
    }

    function clearPaint() {
        visitEls = new Map();
        document.querySelectorAll("#topics-list .learning-check, #topics-list .learning-progress, #topics-list .learning-visit").forEach((el) => el.remove());
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
                const record = state.lessons[lesson.path];
                const complete = !!(record && record.complete);
                li.insertBefore(makeCheck(lesson.path, complete), li.firstChild);
                li.classList.toggle("learning-done", complete);
                const visit = document.createElement("span");
                visit.className = "learning-visit";
                visit.setAttribute("data-lesson", lesson.path);
                fillVisit(visit, record);
                el.appendChild(visit);
                visitEls.set(lesson.path, visit);
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
        const prev = state.lessons[path] || {};
        const complete = !prev.complete;
        const next = {};
        if (prev.openedAt) next.openedAt = prev.openedAt;
        if (prev.reached) next.reached = prev.reached;
        if (complete) {
            next.complete = true;
            next.completedAt = Date.now();
        }
        if (!next.complete && !next.openedAt && !next.reached) delete state.lessons[path];
        else state.lessons[path] = next;
        paint();
        syncOpenNote();
        queueSave();
    }

    function measureReached() {
        const panel = document.querySelector("#summary-inner");
        if (!panel || panel.scrollHeight < 80) return null;
        const rect = panel.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return null;
        const markers = panel.querySelectorAll(".scroll-marker");
        let max = 0;
        markers.forEach((marker) => {
            if (marker.getBoundingClientRect().top > window.innerHeight / 4) return;
            const pct = parseInt(marker.textContent, 10);
            if (pct > max) max = pct;
        });
        const fits = markers.length === 0 && panel.scrollHeight <= window.innerHeight + 8;
        if (fits) max = 100;
        return max;
    }

    function measureAndStore() {
        if (!watchPath || !isTrackedLesson(watchPath)) return;
        const reached = measureReached();
        if (reached == null) return;
        const prev = state.lessons[watchPath] || {};
        if (reached <= (Number(prev.reached) || 0)) return;
        state.lessons[watchPath] = Object.assign({}, prev, { reached: reached });
        updateVisitLabel(watchPath);
        scheduleSave();
    }

    function onTrackedNoteOpened() {
        syncOpenNote();
        const path = lessonPathForOpenNote();
        if (!loaded || !isTrackedLesson(path)) {
            watchPath = "";
            return;
        }
        watchPath = path;
        const prev = state.lessons[path] || {};
        state.lessons[path] = Object.assign({}, prev, { openedAt: Date.now() });
        updateVisitLabel(path);
        queueSave();
        window.requestAnimationFrame(() => {
            measureAndStore();
            window.requestAnimationFrame(measureAndStore);
        });
    }

    function onScroll() {
        if (scrollTick || !watchPath) return;
        scrollTick = true;
        window.requestAnimationFrame(() => {
            scrollTick = false;
            measureAndStore();
        });
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
        document.addEventListener("noteOpened", () => {
            if (!loaded) readyPromise.then(onTrackedNoteOpened);
            else onTrackedNoteOpened();
        });
        window.addEventListener("scroll", onScroll, { passive: true });
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
            onTrackedNoteOpened();
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
