
$(() => {
    // Show can Share the Search Results
    $(window).scroll(function () {
        $("#share-search-title-wrapper").addClass("hidden");
    });
})

// If user erases content in input, dynamically erase any present search results
// If user presses enter on input, then click the search
function checkIfEmptiedSearch(event, $btn) {
    $searcher = $("#searcher");
    if ($searcher.val().length === 0) {
        toggleSearchResults(false);
        // $(".ui-autocomplete").hide();
    }
} // checkSearcherSubmit

function openFromSearchedContentsResults(filename) {
    var url = new URL(window.location.href);
    url.searchParams.set('open', filename.replace(/\.md$/, ""));
    url = url.toString().replace("explorer.php", "index.php").replace(/\+/g, '%20');;
    window.open(url);
} // openFromSearchedContentsResults


function searchAllContents(query) {
    if (query.length === 0) {
        alert("Error: Nothing typed!");
        return false;
    }
    // Sanitize user input when you need to include it in a regular expression but don't want it to accidentally create unexpected regex patterns.
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }
    const originalQuery = query;
    query = escapeRegExp(query);
    if (query.length === 0) return;

    $div = $("#search-results .contents");
    fetch("search.php?search=" + query)
        .then(response => response.text())
        .then(greps => {
            try {
                greps = JSON.parse(greps); // grep results array
            } catch (err) {
                if (greps.length === 0) {
                    alert("No results found for: " + originalQuery);
                    return;
                }
                console.error(err);
                console.log({ greps });
            }
            greps = greps["res"];
            console.log(greps);

            // Reset
            $div.html(`<div><table id="table-search-results">
          <thead>
            <th>Concept (Folder)</th>
            <th>File</th>
            <th>Context</th>
          <thead>
          <tbody>
          </tbody>
        </table></div>`)
            $tbody = $div.find("tbody");

            // Match and render
            greps.forEach(res => {
                // x/y/z/filepath: surrounding_text
                // Eg. [ 0: "/Users/wengffung/Library/CloudStorage/GoogleDrive-siphon880g@gmail.com/My Drive/_Obsidian MD/Document Vaults/Content-Published/Dev/AI Engineer/Models - Text Generation/Llama 2.md:Testing the llama2.ai 70 billion parameter model"

                // Find the index of the first colon to split the string
                const firstColonIndex = res.indexOf(":");

                // Extract the full file path
                const fullPath = res.substring(0, firstColonIndex);

                // Extract the matching text (trim to remove any leading/trailing whitespace)
                const matchText = res.substring(firstColonIndex + 1).trim();

                // Split the path into parts using '/' as the separator
                const pathParts = fullPath.split('/').filter(Boolean); // filter(Boolean) removes empty elements

                // Get the filename (last element of the pathParts array)
                const filename = pathParts[pathParts.length - 1];

                // Get the folder name (second last element of the pathParts array)
                const folderName = pathParts[pathParts.length - 2];

                // Now you can use filename, folderName, and matchText as needed
                console.log(`Filename: ${filename}`);
                console.log(`Folder Name: ${folderName}`);
                console.log(`Match Text: ${matchText}`);

                $tbody.append(`
            <tr>
              <td><a onclick="scrollToFolderName('${folderName}')" href="javascript:void(0);">${folderName}</a></td>
              <td><a onclick="openFromSearchedContentsResults('${filename}')" href="javascript:void(0)">${filename}</a></td>
              <td class="context"><pre>${matchText}</pre></td>
              </tr>`);
                //   <td><a onclick="var url = new URL(window.location.href); url.search = '?open=${filename}'; window.open(url.toString());">${filename}</a></td>
                // <td><a onclick="var url = new URL(window.location.href); url.searchParams.set('open', ${filename})'; window.open(url.toString());">${filename}</a></td>
                //   <td><a onclick="window.location.search = '?open=${filename}'">${filename}</a></td>

            }); // foreach
            // $("#table-search-results pre").highlight($("#searcher").val());

            // Highlight keyword across the in-text search results
            var value = document.getElementById("searcher").value;
            (function(keyword) {
                if (!keyword) return;
                const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                document.querySelectorAll('#table-search-results pre').forEach(pre => {
                  pre.innerHTML = pre.innerHTML.replace(regex, '<span class="highlight">$1</span>');
                });
              })(value);
              

            toggleSearchResults(true);

            // Scroll to bottom where search results are
            // window.scrollTo(0, document.body.scrollHeight);
            document.getElementById("search-results").scrollIntoView({behavior: "smooth"});
        });
} // searchAllContents

function searchAllTitles({ searchText, jumpTo = false, callback }) {
    if (searchText.length === 0) {
        alert("Error: Nothing typed!");
        return false;
    }
    const $finalJumpTo = scrollToText(searchText, callback);

    if (jumpTo) {
        setTimeout(() => {
            if ($finalJumpTo)
                $finalJumpTo[0].scrollIntoView();
            setTimeout(() => {
                if (callback)
                    callback();
            }, 500)
        }, 800);
    }
} // searchAllTitles

function toggleSearchResults(display) {
    $div = $("#search-results");
    if (display)
        $div.fadeIn(200);
    else
        $div.fadeOut(500);
}
function clearSearcher($searcher) {
    $searcher.val("");
    toggleSearchResults(false);
    $(".highlight").removeClass("highlight");
}



function scrollToText(partial, callback = false) {
    let finalJumpTo = null;
    const foundRows = document.querySelectorAll("li");

    let found = false;
    foundRows.forEach((row) => {
        if (row.textContent.toLowerCase().includes(partial.toLowerCase())) {
            toOpenUp_Exec(row);
            if (row.textContent.toLowerCase().includes(partial.toLowerCase())) {
                highlightRow(row);
                finalJumpTo = row;
                found = true;
                if (callback) callback(row); // If a callback is provided, call it
            }
        }
    });

    if (!found) {
        alert("The search returned blank:\n" + partial);
    }

    return finalJumpTo;
} // scrollToText


function scrollToFolderName(partial) {
    partial = partial.toLowerCase();
    if (partial.length === 0) return;

    if (partial[0] === '+') partial = partial.substr(1);
    var $foundRow = $(".name.is-folder").filter((i, el) => {
        return el.parentElement.dataset["path"].toLowerCase().indexOf(partial) >= 0
    }
    );
    $foundRow = $foundRow.map((i, el) => $(el).closest("li"));

    $foundRow.each((i, row) => {
        var $row = $(row)
        toOpenUp_Exec($row);
        highlightRow($row);
        $row[0].scrollIntoView();
    });
} // scrollToFolderName