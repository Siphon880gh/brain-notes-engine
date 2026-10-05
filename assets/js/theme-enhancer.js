/**
 * Keeps theme chrome measurable and stacked after layout changes.
 * The active theme id comes from <html data-theme>, which index.php sets
 * from config.json after checking themes/manifest.json.
 */
(function () {
  "use strict";

  var DEFAULT_THEME = "classic";
  var root = document.documentElement;

  function safeId(id) {
    return typeof id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);
  }

  function applyThemeClass(id) {
    var body = document.body;
    if (!body) return;
    Array.prototype.slice.call(body.classList).forEach(function (cls) {
      if (cls.indexOf("theme-") === 0 && cls !== "theme-ready") {
        body.classList.remove(cls);
      }
    });
    body.classList.add("theme-ready");
    body.classList.add("theme-" + id);
    body.setAttribute("data-theme", id);
  }

  function syncChromeMetrics() {
    var banner = document.querySelector(".promo-banner");
    var offset = 0;
    if (banner && banner.isConnected) {
      var bannerRect = banner.getBoundingClientRect();
      if (bannerRect.bottom > 2 && bannerRect.top < window.innerHeight) {
        offset = Math.ceil(bannerRect.bottom);
      }
    }
    root.style.setProperty("--promo-offset", offset + "px");

    var bar = document.getElementById("bottom-bar");
    var barHeight = 64;
    if (bar) {
      barHeight = Math.ceil(bar.getBoundingClientRect().height);
    }
    root.style.setProperty("--bottom-bar-height", barHeight + "px");

    var jump = document.getElementById("jump-curriculum");
    var clearHeight = jump ? Math.ceil(jump.getBoundingClientRect().height) + 8 : barHeight;
    root.style.setProperty("--bottom-bar-clear", clearHeight + "px");

    var exploreHeader = document.getElementById("explore-header");
    if (exploreHeader) {
      root.style.setProperty(
        "--explore-header-offset",
        Math.ceil(exploreHeader.getBoundingClientRect().height) + "px"
      );
    }

    var docWidth = root.clientWidth;
    if (docWidth > 0 && root.scrollWidth > docWidth + 8) {
      root.classList.add("theme-overflow-guard");
    }
  }

  function repairStickyAndDropdowns() {
    document.querySelectorAll(".summary-sticky-bar, #explore-header").forEach(function (el) {
      if (el.style && el.style.transform) {
        el.style.transform = "";
      }
    });

    var dropdown = document.getElementById("random-note-dropdown");
    if (dropdown && dropdown.style && dropdown.style.transform) {
      dropdown.style.transform = "none";
    }
  }

  function watch(el) {
    if (!el || typeof ResizeObserver === "undefined") return;
    var observer = new ResizeObserver(syncChromeMetrics);
    observer.observe(el);
  }

  function publishAllowlist(manifest, activeId) {
    var allowed = {};
    if (manifest && Array.isArray(manifest.themes)) {
      manifest.themes.forEach(function (entry) {
        if (entry && safeId(entry.id)) allowed[entry.id] = true;
      });
    }
    var fallback = DEFAULT_THEME;
    if (manifest && safeId(manifest.default)) fallback = manifest.default;
    window.DevBrainThemes = {
      active: activeId,
      defaultTheme: fallback,
      allowlist: Object.keys(allowed)
    };
    return allowed;
  }

  function init() {
    var current = root.getAttribute("data-theme");
    if (!safeId(current)) {
      current = DEFAULT_THEME;
      root.setAttribute("data-theme", current);
    }

    applyThemeClass(current);
    repairStickyAndDropdowns();
    syncChromeMetrics();

    watch(document.querySelector(".promo-banner"));
    watch(document.getElementById("bottom-bar"));
    watch(document.getElementById("explore-header"));
    window.addEventListener("resize", syncChromeMetrics);
    var scrollScheduled = false;
    window.addEventListener("scroll", function () {
      if (scrollScheduled) return;
      scrollScheduled = true;
      window.requestAnimationFrame(function () {
        scrollScheduled = false;
        syncChromeMetrics();
      });
    }, { passive: true });

    var banner = document.querySelector(".promo-banner");
    if (banner) {
      banner.addEventListener("transitionend", syncChromeMetrics);
      var closeButton = banner.querySelector(".promo-banner__close");
      if (closeButton) {
        closeButton.addEventListener("click", function () {
          root.style.setProperty("--promo-offset", "0px");
          window.requestAnimationFrame(syncChromeMetrics);
        });
      }
    }

    window.setTimeout(syncChromeMetrics, 0);
    window.setTimeout(syncChromeMetrics, 350);

    fetch("themes/manifest.json", { credentials: "same-origin" })
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function (manifest) {
        var allowed = publishAllowlist(manifest, current);
        if (manifest && !allowed[current] && allowed[window.DevBrainThemes.defaultTheme]) {
          var fallback = window.DevBrainThemes.defaultTheme;
          root.setAttribute("data-theme", fallback);
          applyThemeClass(fallback);
          window.DevBrainThemes.active = fallback;
        }
      })
      .catch(function () {
        publishAllowlist(null, current);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
