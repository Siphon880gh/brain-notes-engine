const fs = require('fs');
const path = require('path');
const icons = require('./env/icons.js');

// Path to your output.json file
const outputJsonPath = 'cachedResData.json';

// Path where the generated HTML partial will be saved.
// HTML (not PHP) so the browser can cache it via conditional GET (Last-Modified / 304).
const outputHtmlPath = 'cachedResPartial.html';

// Read the output.json file
let outputData;
try {
  const data = fs.readFileSync(outputJsonPath, 'utf8');
  outputData = JSON.parse(data);
} catch (err) {
  console.error('Error reading output.json:', err);
  process.exit(1);
}

// Extract the 'dirs' array
const folders = (outputData && outputData.dirs) ? outputData.dirs : undefined;
const dir_snippets = (outputData && outputData.dir_snippets) ? outputData.dir_snippets : "";
const http_to_file_protocol = (outputData && outputData.http_to_file_protocol) ? outputData.http_to_file_protocol : "";
const want_a_tag_for_seo = (outputData && outputData.want_a_tag_for_seo === "1") ? true : false;
const sortSpec = (outputData && outputData.sort_spec) ? outputData.sort_spec : undefined;

function parseSortSpecEntries(raw) {
  if (!raw || typeof raw !== 'string') return [];

  let body = raw.trim();
  const sortingSpecMatch = body.match(/sorting-spec:\s*\|-?\s*\r?\n([\s\S]*?)(?:\r?\n---\s*$|\r?\n---\r?\n|$)/);
  if (sortingSpecMatch) {
    body = sortingSpecMatch[1];
  } else if (body.startsWith('---')) {
    body = body.replace(/^---[\s\S]*?---\s*\r?\n?/, '');
  }

  return body
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s+/, '').trim())
    .filter((line) => line.length > 0);
}

const sortEntries = parseSortSpecEntries(sortSpec);

function isSortSpecDivider(entry) {
  return entry === '---' || entry === '%' || /^---\s+/.test(entry);
}

function getSortSpecDividerTitle(entry) {
  if (entry === '---' || entry === '%') return '';
  const match = entry.match(/^---\s+(.+)$/);
  return match ? match[1].trim() : '';
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSortSpecDivider(entry) {
  const title = getSortSpecDividerTitle(entry);
  if (title) {
    return `<li class="explorer-divider explorer-divider--section" aria-hidden="true"><span class="explorer-divider__title">${escapeHtml(title)}</span><hr></li>`;
  }
  return `<li class="explorer-divider" aria-hidden="true"><hr></li>`;
}

function loadExplorerConfig() {
  try {
    const config = JSON.parse(fs.readFileSync('config-explorer.json', 'utf8'));
    return (config && config.explorer) ? config.explorer : {};
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Error reading config-explorer.json:', err);
    }
    return {};
  }
}

function compileHideRootFolderPatterns(patterns) {
  if (!Array.isArray(patterns)) return [];
  return patterns
    .filter((pattern) => typeof pattern === 'string' && pattern.length > 0)
    .map((pattern) => {
      try {
        return new RegExp(pattern);
      } catch (err) {
        console.error(`Invalid hideRootFolderPatterns regex "${pattern}":`, err);
        return null;
      }
    })
    .filter(Boolean);
}

const explorerConfig = loadExplorerConfig();
const hideRootFolderPatterns = compileHideRootFolderPatterns(explorerConfig.hideRootFolderPatterns);

function isHiddenRootFolder(name) {
  return hideRootFolderPatterns.some((pattern) => pattern.test(name));
}

function filterHiddenRootFolders(items) {
  return items.filter((item) => !isHiddenRootFolder(item.current));
}

// Function to merge folders by common path and build the nested structure
function mergeByCommonPath(data) {
  const nestnext = function (folders, item, index) {
    const newObj = { ...item };
    newObj.current = folders[index];

    newObj.next =
      index + 1 < folders.length
        ? nestnext(folders, item, index + 1)
        : [];

    return newObj;
  };

  return data.map((item) => {
    const folders = item.path_tp.split('/');
    return nestnext(folders, item, 0);
  });
}

// Function to merge items by key
function mergeByKey(array) {
  const output = array.reduce((o, cur) => {
    const occurs = o.findIndex((item) => item.current === cur.current);

    if (occurs >= 0 && o[occurs]) {
      const tempNext = o[occurs].next;
      o[occurs] = { ...o[occurs], ...cur };
      o[occurs].next = tempNext.concat(cur.next);
    } else {
      if (cur.current !== undefined) {
        const tempNext = [cur.next];
        const obj = { ...cur, next: tempNext };
        o.push(obj);
      }
    }

    return o;
  }, []);

  output.forEach((item) => {
    item.next = mergeByKey(item.next);
  });

  return output;
}


/**
 * Function to sorts the items to ensure folders come before files.
 *
 * @param {Array} items - The array of items to sort.
 * @param {number} level - The current depth level (0 for root).
 */
function sortByFoldersFirstAndObsidianSpecs({items, level = 0, sortEntries}) {
  items.sort((a, b) => {
    // Determine if items are folders or files
    const isFolderA = a.next.length && !a.current.includes('.md');
    const isFolderB = b.next.length && !b.current.includes('.md');

    if (isFolderA && !isFolderB) {
      return -1; // a is folder, b is file: a comes first
    } else if (!isFolderA && isFolderB) {
      return 1; // b is folder, a is file: b comes first
    } else {
      // Both are folders or both are files
      // Apply custom sort criteria at root level
      if (level === 0 && sortEntries && sortEntries.length > 0) {
        const indexA = sortEntries.indexOf(a.current);
        const indexB = sortEntries.indexOf(b.current);

        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB; // both in ordered list
        } else if (indexA !== -1) {
          return -1; // only a is in ordered list
        } else if (indexB !== -1) {
          return 1; // only b is in ordered list
        } else {
          return a.current.localeCompare(b.current); // neither in ordered list
        }
      } else {
        // Not at root level or no sortSpec, sort alphabetically
        return a.current.localeCompare(b.current);
      }
    }
  });

  // Recursively sort the next arrays
  for (const item of items) {
    if (item.next && item.next.length > 0) {
      sortByFoldersFirstAndObsidianSpecs({items: item.next, level: level + 1, sortEntries});
    }
  }

  return nestedFolders;
} // sortByFoldersFirstAndObsidianSpecs

// Merge folders to create a nested structure

console.log("\n\n>> Data merging by common path, merging by path, then sorting by folders first and by Obsidian sortspec:\nProcessed successfully.");
let nestedFolders = mergeByCommonPath(folders);
nestedFolders = mergeByKey(nestedFolders);
nestedFolders = sortByFoldersFirstAndObsidianSpecs({items: nestedFolders, sortEntries});
nestedFolders = filterHiddenRootFolders(nestedFolders);

// Function to generate HTML markup using EJS templates
function generateHtml(folders) {
  // Helper: folder name ends with (PRIVATE) or PRIVATE (case insensitive)
  const isPrivateFolderName = (name) => /(?:\(PRIVATE\)|PRIVATE)$/i.test(name);
  // Helper: path contains any private folder segment
  const isInPrivateFolder = (pathStr) => pathStr ? pathStr.split('/').some(isPrivateFolderName) : false;

  // Helper function to render each item
  const renderItem = (item, parentPath = '') => {
    let html = '';

    const isQuizFile = /\.quiz\.csv$/i.test(item.current);
    const isCsvFile = /\.csv$/i.test(item.current) && !isQuizFile;
    const isFolder = item.next.length && !item.current.includes('.md');
    const itemClass = isFolder ? 'is-folder' : (isQuizFile ? 'is-file is-quiz' : (isCsvFile ? 'is-file is-csv' : 'is-file'));
    const iconClass = isFolder ? 'fas fa-folder' : '';

    // Skip certain files
    const skipFiles = ['sortspec.md', 'README.md', 'package.json', 'package-lock.json'];
    if (skipFiles.includes(item.current)) {
      return '';
    }

    // Build the full path for the item
    const itemPath = parentPath ? `${parentPath}/${item.current}` : item.current;

    // Escape single quotes in attributes
    // const escapedItemCurrent = item.current.replace(/'/g, "\\'").replace(/\.md$/, '').replace(/\.json$/, '');
    const escapedItemCurrent = item.current.replace(/\.md$/, '').replace(/\.json$/, '').replace(/\.quiz\.csv$/i, '').replace(/\.csv$/i, '');

    // For files, store the path in a data attribute (if needed)
    // const dataPathAttr = isFolder ? '' : ` data-path="${escapedItemPath}"`;
    const dataIDAttr = ` data-id=${item.id}`;

    // Check if file is private (ends with PRIVATE.md or (PRIVATE).md, case insensitive)
    const isPrivateFile = !isFolder && /(?:PRIVATE|\(PRIVATE\))\.md$/i.test(item.current);
    // Check if folder is private (ends with (PRIVATE) or PRIVATE) or item is inside a private folder
    const isPrivateFolder = isFolder && isPrivateFolderName(item.current);
    const inPrivateFolder = isInPrivateFolder(parentPath);
    const isPrivate = isPrivateFile || isPrivateFolder || inPrivateFolder;

    const dataPrivateAttr = isPrivate ? ' data-private="1"' : '';
    const dataQuizAttr = isQuizFile ? ' data-quiz="1"' : '';
    const dataPathAttr = isFolder ? ` data-path="${itemPath.replace(/"/g, '&quot;')}"` : '';

    html += `<li class="accordion meta"${dataPrivateAttr}${dataQuizAttr}${dataPathAttr}>`;
    if (isFolder) {
      html += `<span class="name ${itemClass}"${dataIDAttr}>`;
    } else if(!want_a_tag_for_seo)
      html += `<span class="name ${itemClass}"${dataIDAttr}>`;
    else if(want_a_tag_for_seo) {
      // Hide href for private files/folders to prevent path exposure
      const hrefValue = isPrivate ? '' : http_to_file_protocol+dir_snippets+itemPath;
      html += `<a class="name ${itemClass}"${dataIDAttr} href="${hrefValue}">`;
    }
    
    // Insert custom icon if available. It will hide the fa book icon because of css selector `.custom-icon+.fa-folder {`
    if (icons[escapedItemCurrent]) {
      html += `<span class="custom-icon">${icons[escapedItemCurrent]}</span>`;
    }
    html += iconClass ? `<span class="${iconClass}"></span>&nbsp;` : '';

    html += `${escapedItemCurrent}`;
    if (isQuizFile) {
      html += `<span class="quiz-pill"><i class="fas fa-question-circle"></i> Quiz</span>`;
    } else if (isCsvFile) {
      html += `<span class="csv-pill"><i class="fas fa-file-csv"></i> CSV</span>`;
    }
    html += isFolder || !want_a_tag_for_seo ? `</span>` : `</a>`;

    // Add placeholder for note-item-buttons
    html += `<span class="note-item-buttons"></span>`;

    if (item.next && item.next.length) {
      // Initially hide the nested ul
      html += '<ul style="display:none;">';
      item.next.forEach((child) => {
        html += renderItem(child, itemPath);
      });
      html += '</ul>';
    }

    html += '</li>';

    return html;
  };

  const renderRootItems = (rootFolders) => {
    let html = '';
    const visibleRootFolders = filterHiddenRootFolders(rootFolders);
    const folderByName = Object.fromEntries(visibleRootFolders.map((item) => [item.current, item]));
    const rendered = new Set();

    if (sortEntries.length > 0) {
      for (const entry of sortEntries) {
        if (isSortSpecDivider(entry)) {
          html += renderSortSpecDivider(entry);
        } else if (folderByName[entry] && !rendered.has(entry)) {
          html += renderItem(folderByName[entry]);
          rendered.add(entry);
        }
      }
    }

    visibleRootFolders
      .filter((item) => !rendered.has(item.current))
      .sort((a, b) => a.current.localeCompare(b.current))
      .forEach((item) => {
        html += renderItem(item);
      });

    return html;
  };

  return renderRootItems(folders);
}

// Generate the HTML content
const htmlContent = generateHtml(nestedFolders);

// Wrap the content as a plain HTML partial
const htmlDoc = `<!-- This file is auto-generated. Do not edit manually. -->
<ul class="ul-root">
${htmlContent}
</ul>`;

// Save the HTML partial
fs.writeFile(outputHtmlPath, htmlDoc, (err) => {
  if (err) {
    console.error(`ERROR: Problems writing to ${outputHtmlPath}: `, err);
  } else {
    console.log(`\n\n>> HTML partial successfully saved to:\n${outputHtmlPath}`);
  }
});
