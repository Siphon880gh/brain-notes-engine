const fs = require('fs');
const path = require('path');

require('dotenv').config(); // Load environment variables from .env file
const DIR_SNIPPETS = process.env.DIR_SNIPPETS;
const HTTP_TO_FILE_PROTOCOL = (process?.env?.HTTP_TO_FILE_PROTOCOL) ? (process?.env?.HTTP_TO_FILE_PROTOCOL) : "";
const WANT_A_TAG_FOR_SEO = (process?.env?.WANT_A_TAG_FOR_SEO==="1") ? "1" : "0";

let warningSearchWillFail_Arr = [];
let sort_spec = "";

let cachedDataFilename = "cachedResData.json"

// Array of folder names to exclude recursively
const excludeFolders = ['.git', 'node_modules'];

function rglob(dir) {
  let files = [];

  try {
    let entries = fs.readdirSync(dir, { withFileTypes: true });
    let hasValidEntries = false; // Flag to check if directory has valid entries

    for (let entry of entries) {
      let entryPath = path.join(dir, entry.name);
      let folderName = entry.name;

      // Check if the entry is in the exclude list
      if (excludeFolders.includes(folderName)) {
        continue; // Skip this folder or file
      }

      if (entry.isDirectory()) {
        // Recursively process the subdirectory
        let subFiles = rglob(entryPath);

        // If subdirectory has valid entries, mark the parent directory as having valid entries
        if (subFiles.length > 0) {
          hasValidEntries = true;
          // Relative path for storing
          let relativeEntryPath = path.relative(DIR_SNIPPETS, entryPath);
          files.push(relativeEntryPath);
          files = files.concat(subFiles);
        } else {
          // Optionally, you can handle empty directories here if needed
        }

        // Check for warnings
        if (folderName.includes(":") || folderName.includes("/")) {
          warningSearchWillFail_Arr.push(folderName);
        }
      } else {
        let ext = path.extname(entry.name).substring(1);
        if (['md', 'json'].includes(ext) && !/\.(no|hide)\.md$/.test(entry.name)) {
          hasValidEntries = true;
          let relativeEntryPath = path.relative(DIR_SNIPPETS, entryPath);
          files.push(relativeEntryPath);
        }
      }
    }

    // If the current directory is the base directory and has valid entries, include it
    // if (dir === DIR_SNIPPETS && hasValidEntries) {
    //   let relativeDir = path.relative(DIR_SNIPPETS, dir) || '.';
    //   files.unshift(relativeDir);
    // }

    return files;
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
    return [];
  }
} // rglob(dir)

/**
 * Processes a relative file or directory path to create a decorated object for building a nested menu structure.
 * It also collects metadata for specific files and reads sorting specifications if available.
 *
 * @function map_tp_to_decorated
 * @param {string} relativePath - The relative path of the file or directory from the base directory.
 * @returns {Object} decorated - An object containing path information and placeholders for nesting.
 * @property {string} decorated.id - The id to keep the DOM minimal characters.
 * @property {string} decorated.current - The current path segment (set during nesting).
 * @property {string} decorated.path - The absolute path of the file or directory.
 * @property {string} decorated.path_tp - The relative path from the base directory.
 * @property {Array} decorated.next - An array for child items in the nested structure.
 * 
 */
let id = -1;
function map_tp_to_decorated(relativePath) {
  // let filePath = path.join(DIR_SNIPPETS, relativePath);


    id++;
    let decorated = {
      id,
      current: path.basename(relativePath),
      path: path.join(DIR_SNIPPETS, relativePath),
      path_tp: relativePath
    };

  let lastChars = relativePath.slice(-11);

  if (lastChars.includes("sortspec.md")) {
    if(sort_spec.length) {
      console.error(`Warning - More than one sortspec detected. Will only use this sortspec:\n`, sort_spec);
    } else {
      try {
        sort_spec = fs.readFileSync(decorated.path, 'utf-8');
        // console.log(sort_spec);
      } catch (err) {
        console.error(`Error reading file ${relativePath}:`, err);
      }
    }
  } else if ( Boolean(lastChars.match(/\.md$/)?.[0]) || Boolean(lastChars.match(/\.json$/)?.[0]) ) {

  } // sortspec // md or json

  // console.log(decorated)

  return decorated;
}

let dirs = rglob(DIR_SNIPPETS);
dirs = dirs.map(map_tp_to_decorated);

// Prepare data to save
let outputData = {
  dir_snippets: DIR_SNIPPETS,
  http_to_file_protocol: HTTP_TO_FILE_PROTOCOL,
  want_a_tag_for_seo: WANT_A_TAG_FOR_SEO,
  dirs,
  sort_spec,
  warnings: warningSearchWillFail_Arr
};

// Save to JSON file
fs.writeFile(cachedDataFilename, JSON.stringify(outputData, null, 2), (err) => {
  if (err) {
    console.error(`Error writing to ${cachedDataFilename}:`, err);
  } else {
    console.log(`Data successfully saved to ${cachedDataFilename}`);
  }
});
