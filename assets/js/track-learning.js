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
        const hasReached = lesson.reached != null && lesson.reached !== "";
        const reached = hasReached ? Math.max(0, Math.min(100, Math.round(Number(lesson.reached)))) : null;
        const hasScore = lesson.score != null && lesson.score !== "" && Number(lesson.scoreTotal) > 0;
        const score = hasScore ? Math.max(0, Math.round(Number(lesson.score))) : null;
        const scoreTotal = hasScore ? Math.max(1, Math.round(Number(lesson.scoreTotal))) : null;
        const complete = !!lesson.complete;
        if (!complete && !openedAt && reached == null && score == null) return null;
        const record = {};
        if (complete) {
            record.complete = true;
            record.completedAt = Number(lesson.completedAt) || openedAt || Date.now();
        }
        if (openedAt) record.openedAt = openedAt;
        if (reached != null) record.reached = reached;
        if (score != null) {
            record.score = score;
            record.scoreTotal = scoreTotal;
        }
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

    function visitPercent(record) {
        if (!record || record.reached == null || record.reached === "") return null;
        return Math.max(0, Math.min(100, Math.round(Number(record.reached))));
    }

    function visitScore(record) {
        if (!record || record.score == null || record.score === "" || !(Number(record.scoreTotal) > 0)) return "";
        return "Score " + Math.round(Number(record.score)) + "/" + Math.round(Number(record.scoreTotal));
    }

    function visitText(record) {
        if (!record) return "";
        const pct = visitPercent(record);
        const date = record.openedAt ? formatOpened(record.openedAt, false) : "";
        const score = visitScore(record);
        const parts = [];
        if (date) parts.push(date);
        if (pct != null) parts.push(pct + "%");
        else if (date) parts.push("0%");
        if (score) parts.push(score);
        return parts.join(" · ");
    }

    function fillVisit(el, record) {
        const text = visitText(record);
        if (!text) {
            el.hidden = true;
            el.textContent = "";
            el.removeAttribute("title");
            return;
        }
        const pct = visitPercent(record);
        const shown = pct == null ? 0 : pct;
        const score = visitScore(record);
        el.hidden = false;
        el.textContent = text;
        const bits = [];
        if (record.openedAt) bits.push("Last opened " + formatOpened(record.openedAt, true));
        if (pct != null || record.openedAt) bits.push("Reached " + shown + "%");
        if (score) bits.push(score);
        el.title = bits.join(". ") + ".";
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
        if (prev.reached != null && prev.reached !== "") next.reached = prev.reached;
        if (prev.score != null && prev.score !== "" && Number(prev.scoreTotal) > 0) {
            next.score = prev.score;
            next.scoreTotal = prev.scoreTotal;
        }
        if (complete) {
            next.complete = true;
            next.completedAt = Date.now();
        }
        const record = lessonRecord(next);
        if (!record) delete state.lessons[path];
        else state.lessons[path] = record;
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

    const PERCENT_CHOICES = [0, 10, 25, 33, 50, 66, 75, 90, 100];
    let menuEl = null;
    let pendingQuizId = "";

    function parentFolderPath(nameEl) {
        const li = nameEl.closest("li");
        const parent = li && li.parentElement;
        const folderLi = parent && parent.closest("li[data-path]");
        return folderLi ? normalize(folderLi.getAttribute("data-path")) : "";
    }

    function lessonPathForName(nameEl) {
        return idToPath.get(String(nameEl.getAttribute("data-id"))) || "";
    }

    const SCROLL_LOCK_MS = 2000;
    let menuScrollLocked = false;
    let scrollHideArmed = true;
    let scrollLockTimer = 0;

    function preventMenuScroll(event) {
        if (event.ctrlKey || event.metaKey) return;
        event.preventDefault();
    }

    function preventMenuScrollKeys(event) {
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End", " ", "Spacebar"];
        if (keys.indexOf(event.key) === -1) return;
        const target = event.target;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
        event.preventDefault();
    }

    function unlockMenuScroll() {
        window.clearTimeout(scrollLockTimer);
        scrollHideArmed = true;
        if (!menuScrollLocked) return;
        menuScrollLocked = false;
        document.documentElement.classList.remove("learning-menu-open");
        document.documentElement.style.removeProperty("--learning-menu-scrollbar");
        document.removeEventListener("wheel", preventMenuScroll, { capture: true });
        document.removeEventListener("touchmove", preventMenuScroll, { capture: true });
        document.removeEventListener("keydown", preventMenuScrollKeys, true);
    }

    function holdMenuScroll() {
        if (!menuScrollLocked) {
            menuScrollLocked = true;
            const gap = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
            document.documentElement.style.setProperty("--learning-menu-scrollbar", gap + "px");
            document.documentElement.classList.add("learning-menu-open");
            document.addEventListener("wheel", preventMenuScroll, { capture: true, passive: false });
            document.addEventListener("touchmove", preventMenuScroll, { capture: true, passive: false });
            document.addEventListener("keydown", preventMenuScrollKeys, true);
        }
        scrollHideArmed = false;
        window.clearTimeout(scrollLockTimer);
        scrollLockTimer = window.setTimeout(unlockMenuScroll, SCROLL_LOCK_MS);
    }

    function hideMenu() {
        const wasOpen = menuEl && !menuEl.hidden;
        if (menuEl) menuEl.hidden = true;
        if (wasOpen || menuScrollLocked) unlockMenuScroll();
    }

    function onMenuScrollHide() {
        if (!scrollHideArmed || !menuEl || menuEl.hidden) return;
        hideMenu();
    }

    function setReached(path, pct) {
        path = normalize(path);
        if (!isTrackedLesson(path)) return;
        const prev = state.lessons[path] || {};
        state.lessons[path] = lessonRecord(Object.assign({}, prev, { reached: pct }));
        updateVisitLabel(path);
        queueSave();
    }

    function resetVisit(path) {
        path = normalize(path);
        const prev = state.lessons[path] || {};
        const kept = {};
        if (prev.complete) {
            kept.complete = true;
            kept.completedAt = prev.completedAt || Date.now();
        }
        if (prev.score != null && prev.score !== "" && Number(prev.scoreTotal) > 0) {
            kept.score = prev.score;
            kept.scoreTotal = prev.scoreTotal;
        }
        const record = lessonRecord(kept);
        if (record) state.lessons[path] = record;
        else delete state.lessons[path];
        updateVisitLabel(path);
        queueSave();
    }

    function recordScore(correct, total) {
        const path = lessonPathForOpenNote();
        const count = Math.max(0, Math.round(Number(correct)));
        const outOf = Math.max(0, Math.round(Number(total)));
        if (!path || !(outOf > 0)) return false;
        const prev = state.lessons[path] || {};
        const record = lessonRecord(Object.assign({}, prev, { score: count, scoreTotal: outOf }));
        if (!record) return false;
        state.lessons[path] = record;
        updateVisitLabel(path);
        queueSave();
        return true;
    }

    function trackParentFolder(nameEl) {
        const folderPath = parentFolderPath(nameEl);
        if (!folderPath || state.folders[folderPath]) return;
        applyToggle(folderPath);
    }

    function onQuizNoteOpened() {
        if (!pendingQuizId || String(window.currentNoteId) !== String(pendingQuizId)) return;
        pendingQuizId = "";
        document.removeEventListener("noteOpened", onQuizNoteOpened);
        document.dispatchEvent(new CustomEvent("learning-quiz"));
    }

    function startQuiz(nameEl) {
        const id = nameEl.getAttribute("data-id");
        if (!id) return;
        if (nameEl.classList.contains("is-quiz")) {
            if (typeof openQuiz === "function") openQuiz(id);
            return;
        }
        const openTitle = document.getElementById("summary-title");
        const alreadyOpen = String(window.currentNoteId) === String(id) && openTitle && openTitle.textContent.trim() && document.getElementById("summary-inner");
        if (alreadyOpen) {
            document.dispatchEvent(new CustomEvent("learning-quiz"));
            return;
        }
        pendingQuizId = id;
        document.removeEventListener("noteOpened", onQuizNoteOpened);
        document.addEventListener("noteOpened", onQuizNoteOpened);
        if (typeof openNote === "function") openNote(id);
    }

    function menuButton(label, iconClass, onClick) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "learning-menu__item";
        button.setAttribute("role", "menuitem");
        const icon = document.createElement("i");
        icon.className = "fas " + iconClass + " learning-menu__icon";
        icon.setAttribute("aria-hidden", "true");
        const text = document.createElement("span");
        text.className = "learning-menu__label";
        text.textContent = label;
        button.append(icon, text);
        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            hideMenu();
            onClick();
        });
        return button;
    }

    let drawerTimer = null;

    function closePercentDrawer(submenu) {
        if (!submenu) return;
        const drawer = submenu.querySelector(".learning-menu__drawer");
        const trigger = submenu.querySelector(".learning-menu__item--parent");
        if (drawer) drawer.hidden = true;
        if (trigger) trigger.setAttribute("aria-expanded", "false");
    }

    function placePercentDrawer(submenu) {
        const drawer = submenu.querySelector(".learning-menu__drawer");
        if (!drawer) return;
        drawer.hidden = false;
        drawer.classList.remove("is-flip");
        drawer.style.top = "";
        const trigger = submenu.querySelector(".learning-menu__item--parent");
        if (trigger) trigger.setAttribute("aria-expanded", "true");
        const rect = drawer.getBoundingClientRect();
        if (rect.right > window.innerWidth - 8) drawer.classList.add("is-flip");
        const placed = drawer.getBoundingClientRect();
        const overflow = placed.bottom - (window.innerHeight - 8);
        if (overflow > 0) drawer.style.top = (-overflow) + "px";
    }

    function percentDrawer(path) {
        const submenu = document.createElement("div");
        submenu.className = "learning-menu__submenu";
        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "learning-menu__item learning-menu__item--parent";
        trigger.setAttribute("role", "menuitem");
        trigger.setAttribute("aria-haspopup", "true");
        trigger.setAttribute("aria-expanded", "false");
        const icon = document.createElement("i");
        icon.className = "fas fa-percentage learning-menu__icon";
        icon.setAttribute("aria-hidden", "true");
        const label = document.createElement("span");
        label.className = "learning-menu__label";
        label.textContent = "Adjust percentage";
        const caret = document.createElement("span");
        caret.className = "learning-menu__caret";
        caret.setAttribute("aria-hidden", "true");
        caret.textContent = "›";
        trigger.append(icon, label, caret);
        const current = visitPercent(state.lessons[path]);
        if (current != null) {
            const now = document.createElement("span");
            now.className = "learning-menu__current";
            now.textContent = current + "%";
            trigger.insertBefore(now, caret);
        }
        const drawer = document.createElement("div");
        drawer.className = "learning-menu__drawer";
        drawer.hidden = true;
        drawer.setAttribute("role", "menu");
        drawer.setAttribute("aria-label", "Adjust percentage");
        const percents = document.createElement("div");
        percents.className = "learning-menu__percents";
        PERCENT_CHOICES.forEach((pct) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "learning-menu__percent";
            button.setAttribute("role", "menuitemradio");
            button.setAttribute("aria-checked", current === pct ? "true" : "false");
            button.textContent = pct + "%";
            button.addEventListener("click", (clickEvent) => {
                clickEvent.preventDefault();
                clickEvent.stopPropagation();
                hideMenu();
                setReached(path, pct);
            });
            percents.appendChild(button);
        });
        drawer.appendChild(percents);
        const open = () => {
            window.clearTimeout(drawerTimer);
            placePercentDrawer(submenu);
        };
        const scheduleClose = () => {
            window.clearTimeout(drawerTimer);
            drawerTimer = window.setTimeout(() => closePercentDrawer(submenu), 160);
        };
        submenu.addEventListener("pointerenter", open);
        submenu.addEventListener("pointerleave", scheduleClose);
        drawer.addEventListener("pointerenter", open);
        trigger.addEventListener("click", (clickEvent) => {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
            if (drawer.hidden) open();
            else closePercentDrawer(submenu);
        });
        submenu.append(trigger, drawer);
        return submenu;
    }

    function placeMenu(event) {
        holdMenuScroll();
        menuEl.hidden = false;
        menuEl.style.left = "0px";
        menuEl.style.top = "0px";
        const rect = menuEl.getBoundingClientRect();
        let x = event.clientX;
        let y = event.clientY;
        if (x + rect.width > window.innerWidth - 8) x = window.innerWidth - rect.width - 8;
        if (y + rect.height > window.innerHeight - 8) y = window.innerHeight - rect.height - 8;
        menuEl.style.left = Math.max(8, x) + "px";
        menuEl.style.top = Math.max(8, y) + "px";
    }

    function leaveFolderModes() {
        if (typeof window.exitAskFolderMode === "function") window.exitAskFolderMode();
        if (typeof window.exitShareFolderMode === "function") window.exitShareFolderMode();
        if (typeof window.exitTrackLearningMode === "function") window.exitTrackLearningMode();
    }

    function showMenu(event, nameEl) {
        const path = lessonPathForName(nameEl);
        if (!path) return false;
        const tracked = isTrackedLesson(path);
        window.clearTimeout(drawerTimer);
        menuEl.replaceChildren();
        if (tracked) {
            menuEl.appendChild(percentDrawer(path));
            menuEl.appendChild(menuButton("Reset date and percentage", "fa-undo", () => resetVisit(path)));
        } else {
            menuEl.appendChild(menuButton("Start tracking folder", "fa-chart-line", () => trackParentFolder(nameEl)));
        }
        menuEl.appendChild(menuButton("Quiz", "fa-question-circle", () => startQuiz(nameEl)));
        placeMenu(event);
        return true;
    }

    function showFolderMenu(event, nameEl) {
        const folderLi = nameEl.closest("li.accordion.meta[data-path]");
        if (!folderLi) return false;
        const folderPath = normalize(folderLi.getAttribute("data-path"));
        window.clearTimeout(drawerTimer);
        menuEl.replaceChildren();
        const tracking = !!state.folders[folderPath];
        menuEl.appendChild(menuButton(tracking ? "Stop tracking folder" : "Track folder", tracking ? "fa-times-circle" : "fa-chart-line", () => {
            leaveFolderModes();
            const result = applyToggle(folderPath);
            if (result && result.tracked) {
                const ul = folderLi.querySelector(":scope > ul");
                if (ul) ul.style.display = "block";
            }
        }));
        menuEl.appendChild(menuButton("Ask folder", "fa-robot", () => {
            leaveFolderModes();
            if (typeof window.askAboutFolder === "function") window.askAboutFolder(nameEl);
        }));
        menuEl.appendChild(menuButton("Share folder", "fa-share-alt", () => {
            leaveFolderModes();
            if (typeof window.shareFolderLink === "function") window.shareFolderLink(nameEl);
        }));
        placeMenu(event);
        return true;
    }

    function willOpenLearningMenu(event) {
        const topics = document.getElementById("topics-list");
        if (!topics || !event.target.closest || !topics.contains(event.target)) return false;
        const li = event.target.closest("li");
        if (!li || !topics.contains(li)) return false;
        return !!li.querySelector(":scope > .name.is-file, :scope > .name.is-folder");
    }

    function onTopicsContextMenu(event) {
        const li = event.target.closest("li");
        const topics = document.getElementById("topics-list");
        if (!li || !topics || !topics.contains(li)) {
            unlockMenuScroll();
            return;
        }
        const fileName = li.querySelector(":scope > .name.is-file");
        const folderName = li.querySelector(":scope > .name.is-folder");
        let shown = false;
        if (fileName) shown = showMenu(event, fileName);
        else if (folderName) shown = showFolderMenu(event, folderName);
        if (!shown) {
            unlockMenuScroll();
            return;
        }
        event.preventDefault();
        event.stopPropagation();
    }

    function bindUi() {
        const topics = document.getElementById("topics-list");
        if (topics) {
            topics.addEventListener("click", onTopicsClick);
            topics.addEventListener("pointerdown", (event) => {
                if (event.button !== 2 || !willOpenLearningMenu(event)) return;
                holdMenuScroll();
            });
            topics.addEventListener("contextmenu", onTopicsContextMenu);
        }
        menuEl = document.createElement("div");
        menuEl.id = "learning-menu";
        menuEl.className = "learning-menu";
        menuEl.setAttribute("role", "menu");
        menuEl.hidden = true;
        document.body.appendChild(menuEl);
        document.addEventListener("pointerdown", (event) => {
            if (!menuEl || menuEl.hidden || menuEl.contains(event.target)) return;
            if (event.button === 2 && willOpenLearningMenu(event)) return;
            hideMenu();
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") hideMenu();
        });
        document.addEventListener("pointerup", () => {
            window.setTimeout(() => {
                if (menuEl && menuEl.hidden) unlockMenuScroll();
            }, 0);
        });
        window.addEventListener("scroll", onMenuScrollHide, true);
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
        toggleFolder: toggleFolder,
        recordScore: recordScore
    };
})();
