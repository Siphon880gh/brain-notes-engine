// Folder and note icons. Rules run before the exact names in icons.js.
// The first matching pattern wins. If none match, icons.js is used.
//
// pattern is a JavaScript regular expression. flags defaults to "i".
// You can also write pattern as "/Android/i".
// Set one of: emoji, font, svg, src.
// font is a class from a library loaded by env/icon-fonts.php.
//
// { pattern: "Android", emoji: "📱" },
// { pattern: "^AWS\\b", font: "fab fa-aws" },
// { pattern: "Regex", svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='currentColor' d='M4 6h16v12H4z'/></svg>" },
// { pattern: "Scraping", src: "./assets/icons/online_scraper.png" },
var iconRules = [];

if (typeof module !== "undefined" && module.exports) {
  module.exports = iconRules;
}
