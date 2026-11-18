// Shared matcher for env/icon-rules.js and the exact-name map in env/icons.js.
(function (root) {
  function plainLabel(label) {
    return String(label || "").replace(/<[^>]*>/g, "");
  }

  function escapeText(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeAttr(value) {
    return escapeText(value).replace(/"/g, "&quot;");
  }

  function compilePattern(rule) {
    if (Object.prototype.hasOwnProperty.call(rule, "_re")) return rule._re;

    var source = String(rule.pattern || "");
    var flags = rule.flags != null ? String(rule.flags) : "i";
    var wrapped = source.match(/^\/([\s\S]*)\/([a-z]*)$/);
    if (wrapped) {
      source = wrapped[1];
      flags = wrapped[2] || "";
    }
    flags = flags.replace(/g/g, "");

    try {
      rule._re = source ? new RegExp(source, flags) : null;
    } catch (err) {
      rule._re = null;
    }
    return rule._re;
  }

  function safeSrc(src) {
    var value = String(src || "").trim();
    if (!value || /^\s*javascript:/i.test(value) || /^\s*data:/i.test(value)) return "";
    if (/^(?:https?:)?\/\//i.test(value) || /^\.\.?\//.test(value) || /^[a-z0-9_./-]+$/i.test(value)) {
      return value;
    }
    return "";
  }

  function innerFromRule(rule) {
    if (rule.emoji != null && String(rule.emoji) !== "") return escapeText(rule.emoji);
    if (rule.font) {
      var cls = String(rule.font).trim();
      if (!/^[\w\-\s]+$/.test(cls)) return "";
      return "<i class=\"" + cls + "\" aria-hidden=\"true\"></i>";
    }
    if (rule.svg) return String(rule.svg);
    if (rule.src) {
      var src = safeSrc(rule.src);
      if (!src) return "";
      return "<img src=\"" + escapeAttr(src) + "\" alt=\"\" class=\"playlist-icon-img\">";
    }
    return "";
  }

  function resolveIconInnerHtml(name, rules, exactMap) {
    var label = plainLabel(name);
    var list = rules || [];
    for (var i = 0; i < list.length; i++) {
      var rule = list[i];
      if (!rule || !rule.pattern) continue;
      var re = compilePattern(rule);
      if (!re) continue;
      if (re.global) re.lastIndex = 0;
      if (re.test(label)) return innerFromRule(rule);
    }
    if (exactMap && Object.prototype.hasOwnProperty.call(exactMap, label) && typeof exactMap[label] === "string") {
      return exactMap[label];
    }
    return "";
  }

  function plainName(nameEl) {
    var clone = nameEl.cloneNode(true);
    var removable = clone.querySelectorAll(".custom-icon, .quiz-pill, .csv-pill, .fa-folder");
    for (var i = 0; i < removable.length; i++) removable[i].parentNode.removeChild(removable[i]);
    return clone.textContent.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }

  function applyIconRules(rootEl) {
    if (!rootEl || typeof iconRules === "undefined" || !iconRules || !iconRules.length) return;
    var names = rootEl.querySelectorAll(".name");
    for (var i = 0; i < names.length; i++) {
      var nameEl = names[i];
      var inner = resolveIconInnerHtml(plainName(nameEl), iconRules, null);
      if (!inner) continue;

      var icon = null;
      var children = nameEl.children;
      for (var c = 0; c < children.length; c++) {
        if (children[c].classList && children[c].classList.contains("custom-icon")) {
          icon = children[c];
          break;
        }
      }
      if (!icon) {
        icon = root.document.createElement("span");
        icon.className = "custom-icon";
        nameEl.insertBefore(icon, nameEl.firstChild);
      }
      icon.innerHTML = inner;
    }
  }

  root.resolveIconInnerHtml = resolveIconInnerHtml;
  root.applyIconRules = applyIconRules;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      resolveIconInnerHtml: resolveIconInnerHtml
    };
  }
})(typeof window !== "undefined" ? window : global);
