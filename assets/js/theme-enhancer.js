/**
 * Homepage theme enhancements that CSS alone cannot express
 * (logos, path labels, numbered section indexes, hire footers).
 * Active theme comes from <html data-theme="..."> set by index.php from config.json.
 */
(function () {
  function themeId() {
    return document.documentElement.getAttribute('data-theme') || 'generic';
  }

  function ensureLogo() {
    const id = themeId();
    let logo = document.querySelector('.theme-logo');
    if (!logo) {
      logo = document.createElement('div');
      logo.className = 'theme-logo';
      logo.setAttribute('aria-hidden', 'true');
    }

    if (id === 'soft-cards') {
      logo.innerHTML = '<span class="orb orb-1"></span><span class="orb orb-2"></span><span class="orb orb-3"></span>';
    } else if (id === 'classic') {
      logo.textContent = 'DB';
    } else {
      logo.innerHTML = '';
    }

    const title = document.getElementById('title');
    if (!title) return;

    if (id === 'classic') {
      let brand = document.querySelector('.site-header-brand');
      if (!brand) {
        brand = document.createElement('div');
        brand.className = 'site-header-brand';
        title.parentNode.insertBefore(brand, title);
        brand.appendChild(logo);
        brand.appendChild(title);
      } else if (!brand.contains(logo)) {
        brand.insertBefore(logo, brand.firstChild);
      }
      if (!document.querySelector('.theme-hero-title')) {
        const hero = document.createElement('div');
        hero.className = 'theme-hero-title';
        hero.innerHTML = 'Developer <span class="brain">Brain.</span>';
        brand.insertAdjacentElement('afterend', hero);
      }
    } else if (id === 'soft-cards') {
      const header = document.querySelector('.site-header');
      if (header && !header.contains(logo)) {
        header.insertBefore(logo, header.firstChild);
      }
    }
  }

  function ensurePathLabel() {
    const id = themeId();
    let path = document.querySelector('.theme-path-label');
    if (id !== 'terminal') {
      if (path) path.remove();
      return;
    }
    if (!path) {
      path = document.createElement('div');
      path.className = 'theme-path-label';
      path.innerHTML = '<span class="tilde">~</span>/developer-brain';
      const header = document.querySelector('.site-header');
      if (header) header.parentNode.insertBefore(path, header);
    }
  }

  function ensureHireFooter() {
    const id = themeId();
    let footer = document.querySelector('.theme-hire-footer');
    if (id !== 'terminal') {
      if (footer) footer.remove();
      return;
    }
    if (!footer) {
      footer = document.createElement('div');
      footer.className = 'theme-hire-footer';
      footer.innerHTML = 'Like this notebook? Hire Weng → <a target="_blank" rel="noopener" href="https://wengindustries.com">WengIndustries.com</a>';
      const container = document.querySelector('.container-off') || document.body;
      container.appendChild(footer);
    }
  }

  function numberSectionDividers() {
    if (themeId() !== 'terminal') return;
    const dividers = document.querySelectorAll('#topics-list > .ul-root > li.explorer-divider--section');
    dividers.forEach(function (el, i) {
      const n = String(i + 1).padStart(2, '0');
      el.setAttribute('data-theme-index', n);
      // Count following sibling folders until next divider
      let count = 0;
      let sib = el.nextElementSibling;
      while (sib && !sib.classList.contains('explorer-divider')) {
        if (sib.classList.contains('accordion')) count += 1;
        sib = sib.nextElementSibling;
      }
      el.setAttribute('data-theme-count', String(count));
    });
  }

  function tweakSearchPlaceholder() {
    const input = document.getElementById('searcher-input');
    if (!input) return;
    const id = themeId();
    if (id === 'terminal') {
      input.placeholder = '>_ search notes';
    } else if (id === 'classic') {
      const countEl = document.getElementById('count-notes');
      const raw = (countEl && countEl.textContent) || '';
      const m = raw.replace(/,/g, '').match(/(\d+)/);
      input.placeholder = m ? ('Search ' + Number(m[1]).toLocaleString() + ' notes...') : 'Search notes...';
    } else {
      input.placeholder = '';
    }
  }

  function resetThemeChrome() {
    document.querySelectorAll('.theme-hero-title, .theme-path-label, .theme-hire-footer').forEach(function (el) {
      el.remove();
    });
    const brand = document.querySelector('.site-header-brand');
    const title = document.getElementById('title');
    const header = document.querySelector('.site-header');
    if (brand && title && header) {
      header.insertBefore(title, brand);
      brand.remove();
    } else if (brand) {
      brand.remove();
    }
    document.querySelectorAll('.theme-logo').forEach(function (el) {
      el.remove();
    });
  }

  function themeStylesheet() {
    return document.getElementById('theme-css');
  }

  function allowedThemes() {
    const cfg = window.DevBrainThemeConfig;
    if (cfg && Array.isArray(cfg.allowed) && cfg.allowed.length) return cfg.allowed;
    return ['generic', 'soft-cards', 'terminal', 'classic'];
  }

  function rememberTheme(id) {
    try {
      localStorage.setItem('devbrain-theme', id);
    } catch (e) {}
  }

  function colorMode() {
    return document.documentElement.getAttribute('data-mode') === 'night' ? 'night' : 'day';
  }

  function syncSwitcher() {
    const select = document.getElementById('theme-switcher-select');
    if (!select) return;
    if (select.value !== themeId()) select.value = themeId();
  }

  function syncColorSwitcher() {
    const select = document.getElementById('color-mode-select');
    if (!select) return;
    if (select.value !== colorMode()) select.value = colorMode();
  }

  function setTheme(id) {
    if (allowedThemes().indexOf(id) === -1) return;
    const changed = themeId() !== id;
    document.documentElement.setAttribute('data-theme', id);
    const link = themeStylesheet();
    if (link) {
      const next = 'themes/' + id + '/theme.css';
      const href = link.getAttribute('href') || '';
      if (href.indexOf('themes/' + id + '/theme.css') === -1) {
        link.href = next;
      }
    }
    if (changed) resetThemeChrome();
    apply();
    if (window.DevBrainThemeConfig && window.DevBrainThemeConfig.showSwitcher) {
      rememberTheme(id);
    }
    syncSwitcher();
  }

  function controlsBar() {
    let bar = document.getElementById('theme-controls');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'theme-controls';
      bar.className = 'theme-controls';
      document.body.appendChild(bar);
    }
    return bar;
  }

  function mountSwitcher(bar) {
    const cfg = window.DevBrainThemeConfig;
    if (!cfg || !cfg.showSwitcher) return;
    if (document.getElementById('theme-switcher')) return;
    const themes = Array.isArray(cfg.themes) ? cfg.themes : [];
    if (!themes.length) return;

    const wrap = document.createElement('div');
    wrap.id = 'theme-switcher';
    wrap.className = 'theme-switcher';

    const label = document.createElement('label');
    label.className = 'theme-switcher__label';
    label.htmlFor = 'theme-switcher-select';
    label.textContent = 'Theme';

    const select = document.createElement('select');
    select.id = 'theme-switcher-select';
    select.setAttribute('aria-label', 'Choose theme');
    themes.forEach(function (theme) {
      if (!theme || !theme.id) return;
      const opt = document.createElement('option');
      opt.value = theme.id;
      opt.textContent = theme.name || theme.id;
      select.appendChild(opt);
    });
    select.value = themeId();
    select.addEventListener('change', function () {
      setTheme(select.value);
    });

    wrap.appendChild(label);
    wrap.appendChild(select);
    bar.appendChild(wrap);
  }

  function setColorMode(mode) {
    if (mode !== 'day' && mode !== 'night') return;
    document.documentElement.setAttribute('data-mode', mode);
    if (window.DevBrainThemeConfig && window.DevBrainThemeConfig.showNightDaySwitcher) {
      try {
        localStorage.setItem('devbrain-color-mode', mode);
      } catch (e) {}
    }
    syncColorSwitcher();
  }

  function mountColorSwitcher(bar) {
    const cfg = window.DevBrainThemeConfig;
    if (!cfg || !cfg.showNightDaySwitcher) return;
    if (document.getElementById('color-mode-switcher')) return;

    const wrap = document.createElement('div');
    wrap.id = 'color-mode-switcher';
    wrap.className = 'theme-switcher color-mode-switcher';

    const label = document.createElement('label');
    label.className = 'theme-switcher__label';
    label.htmlFor = 'color-mode-select';
    label.textContent = 'Mode';

    const select = document.createElement('select');
    select.id = 'color-mode-select';
    select.setAttribute('aria-label', 'Choose day or night');
    [['day', 'Day'], ['night', 'Night']].forEach(function (pair) {
      const opt = document.createElement('option');
      opt.value = pair[0];
      opt.textContent = pair[1];
      select.appendChild(opt);
    });
    select.value = colorMode();
    select.addEventListener('change', function () {
      setColorMode(select.value);
    });

    wrap.appendChild(label);
    wrap.appendChild(select);
    bar.appendChild(wrap);
  }

  function mountControls() {
    const cfg = window.DevBrainThemeConfig || {};
    if (!cfg.showSwitcher && !cfg.showNightDaySwitcher) return;
    const bar = controlsBar();
    mountSwitcher(bar);
    mountColorSwitcher(bar);
  }

  function ensureCornerCluster() {
    const toc = document.getElementById('toc-toggler');
    if (!toc) return;
    let cluster = document.getElementById('corner-controls');
    const key = document.getElementById('private-auth-btn');

    if (themeId() !== 'classic' && themeId() !== 'soft-cards') {
      if (!cluster) return;
      const parent = cluster.parentNode;
      while (cluster.firstChild) parent.insertBefore(cluster.firstChild, cluster);
      cluster.remove();
      return;
    }

    if (!cluster) {
      cluster = document.createElement('div');
      cluster.id = 'corner-controls';
      toc.parentNode.insertBefore(cluster, toc);
    }
    if (key && key.parentNode !== cluster) cluster.insertBefore(key, cluster.firstChild);
    if (toc.parentNode !== cluster) cluster.appendChild(toc);
  }

  function apply() {
    ensureLogo();
    ensurePathLabel();
    ensureHireFooter();
    ensureCornerCluster();
    numberSectionDividers();
    tweakSearchPlaceholder();
  }

  // Run early and again after topics HTML is injected.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }

  const topics = document.getElementById('topics-list');
  if (topics && window.MutationObserver) {
    const obs = new MutationObserver(function () {
      numberSectionDividers();
      tweakSearchPlaceholder();
    });
    obs.observe(topics, { childList: true, subtree: false });
  }

  // count-notes is filled asynchronously
  const countEl = document.getElementById('count-notes');
  if (countEl && window.MutationObserver) {
    const cObs = new MutationObserver(tweakSearchPlaceholder);
    cObs.observe(countEl, { childList: true, characterData: true, subtree: true });
  }

  mountControls();

  if (window.__topicsReady) ensureCornerCluster();
  else document.addEventListener('topics-ready', ensureCornerCluster);

  window.DevBrainTheme = { apply: apply, themeId: themeId, setTheme: setTheme, setColorMode: setColorMode, colorMode: colorMode };
})();
