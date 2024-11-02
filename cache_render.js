const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

// Path to your output.json file
const outputJsonPath = 'cachedResData.json';

// Path where the generated PHP partial will be saved
const outputPhpPath = 'cachedResPartial.php';

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
const folders = outputData.dirs;
const dir_snippets = outputData.dir_snippets;
const http_to_file_protocol = outputData.http_to_file_protocol;
const want_a_tag_for_seo = outputData.want_a_tag_for_seo==="1"?true:false;
const sortSpec = outputData.sort_spec;

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

// Merge folders to create a nested structure
let nestedFolders = mergeByCommonPath(folders);
nestedFolders = mergeByKey(nestedFolders);

// console.log({nestedFolders});
// If sortSpec is available, parse it and apply sorting to the root level of folders
if (sortSpec) {
  const sortCriteria = sortSpec;

  if (sortCriteria.length > 0) {
    // Apply custom sorting to root-level folders
    nestedFolders.sort((a, b) => {
      const indexA = sortCriteria.indexOf(a.current);
      const indexB = sortCriteria.indexOf(b.current);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB; // both in ordered list, sort by their order
      } else if (indexA !== -1) {
        return -1; // only a is in ordered list, a comes first
      } else if (indexB !== -1) {
        return 1; // only b is in ordered list, b comes first
      } else {
        return a.current.localeCompare(b.current); // neither in ordered list, sort alphabetically
      }
    });
  }
} // sortSpec

// Function to generate HTML markup using EJS templates
function generateHtml(folders) {
  // EJS template for the menu
  const template = `
  <% folders.forEach(function(item) { %>
    <%- renderItem(item) %>
  <% }); %>
  `;

  // Helper function to render each item
  const renderItem = (item, parentPath = '') => {
    let html = '';

    const isFolder = item.next.length && !item.current.includes('.md');
    const itemClass = isFolder ? 'is-folder' : 'is-file';
    const iconClass = isFolder ? 'fas fa-folder' : '';

    // Skip certain files
    const skipFiles = ['sortspec.md', 'README.md', 'package.json'];
    if (skipFiles.includes(item.current)) {
      return '';
    }

    // Build the full path for the item
    const itemPath = parentPath ? `${parentPath}/${item.current}` : item.current;

    // Escape single quotes in attributes
    const escapedItemCurrent = item.current.replace(/'/g, "\\'").replace(/\.md$/, '').replace(/\.json$/, '');
    // const escapedItemPath = itemPath.replace(/'/g, "\\'");

    // For files, store the path in a data attribute (if needed)
    // const dataPathAttr = isFolder ? '' : ` data-path="${escapedItemPath}"`;
    const dataIDAttr = ` data-id=${item.id}`;

    // For folders, add onclick to toggle display of child ul
    // let onclickAttr = '';
    // if (isFolder) {
    //   onclickAttr = ` onclick="var ul = this.parentElement.querySelector('ul'); if(ul){ ul.style.display = ul.style.display === 'none' ? 'block' : 'none'; }"`;
    // } else {
    //   // For files, add onclick to openNote function
    //   onclickAttr = ` onclick="openNote('${escapedItemCurrent}', '${escapedItemPath}')"`;
    // }

    html += `<li class="accordion meta">`;
    // html += `<span class="name ${itemClass}"${onclickAttr}${dataPathAttr}>`;
    if (isFolder) {
      html += `<span class="name ${itemClass}"${dataIDAttr}>`;
    } else if(!want_a_tag_for_seo)
      html += `<span class="name ${itemClass}"${dataIDAttr}>`;
    else if(want_a_tag_for_seo) {
      html += `<a class="name ${itemClass}"${dataIDAttr} href="${http_to_file_protocol+dir_snippets+itemPath}">`;
    }
    
    html += iconClass ? `<span class="${iconClass}"></span>&nbsp;` : '';
    html += `${escapedItemCurrent}`;
    html += `</a>`;

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

  // Render the template
  const htmlContent = ejs.render(template, { folders, renderItem });

  return htmlContent;
}

// Generate the HTML content
const htmlContent = generateHtml(nestedFolders);

// Wrap the content in a PHP file
const phpContent = `<?php
// This file is auto-generated. Do not edit manually.
?>
<ul class="ul-root">
${htmlContent}
</ul>`;

// Save the PHP partial
fs.writeFile(outputPhpPath, phpContent, (err) => {
  if (err) {
    console.error(`Error writing to ${outputPhpPath}: `, err);
  } else {
    console.log(`PHP partial successfully saved to ${outputPhpPath}`);
  }
});
