function notes1() {
    alert("- RTF supported: You may copy and paste from Word Document or Text Edit and most formatting like bolding, font size, and lists will be copied over.\n- Shortcut keys: You may use shortcut keys for bold or italicized.\n- As you are rewording the notes on the left side, words get highlighted on this side. That's how you know you covered the concepts.");
}

// function recalculateCoverage() {
//     var selectedElement = $("#old .contents").contents(); 
    
//     var textNodes = selectedElement.filter(function () {
//         var skip = this.nodeValue===" "; 
//         if(skip) 
//             return false;
//         else
//             return this.nodeType === Node.TEXT_NODE; 
//     }); 
//     debugger;
// };


function evalDifferences() {
    var newText = $("#new .contents").val();
    var oldText = $("#old .contents").text();

    newText = newText.replace(/\s/g, ''); // space, tab, newline
    oldText = oldText.replace(/\s/g, ''); // space, tab, newline

    var percent = similarity(newText, oldText); // 0 - 0.XXXX - 1
    percent*=100;
    percent = "" + percent;
    percent = percent.substr(0,5);
    console.log("Percent: ", percent);
    $("#diff").text(percent);
}

function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection != "undefined"
            && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
} // placeCaretAtEnd

window.words = [];

function readjustInputHeight($field) {
    var minHeightTextarea = 25;
    var field = $field[0];
    if(field.value.length===0) {
      field.style.height = 25;
      return;
    }
    
    // Reset field height
    field.style.height = 'inherit';
  
    // Get the computed styles for the element
    var computed = window.getComputedStyle(field);
  
    // Calculate the height
    var height = parseInt(computed.getPropertyValue('border-top-width'), 10)
                  + parseInt(computed.getPropertyValue('padding-top'), 10)
                  + field.scrollHeight
                  + parseInt(computed.getPropertyValue('padding-bottom'), 10)
                  + parseInt(computed.getPropertyValue('border-bottom-width'), 10);
  
    field.style.height = height + 'px';

    // textareaTop = parseInt(textareaTop);
    // windowHeight = parseInt(windowHeight);
    // if( windowHeight-(textareaTop*2) >= minHeightTextarea )
    // $textarea.height( windowHeight-(textareaTop*2) );
  } // readjustInputHeight

$(()=>{
    $("#new .contents").on("keyup blur", (event)=> {
        readjustInputHeight($("#new .contents"));

        // var keyCode = event.keyCode;
        // if(event.type === "blur" ||
        //     keyCode===9 || // tap
        //     keyCode===13 || // enter
        //     keyCode===32 || // space
        //     keyCode===49 || // 1 or !
        //     keyCode===186 || // ;
        //     keyCode===187 || // =
        //     keyCode===188 || // ,
        //     keyCode===189 || // -
        //     keyCode===190 || // .
        //     keyCode===191 || // /
        //     keyCode===220 || // \
        //     keyCode===222 // '
        //   )
        // {
        //     // left blank
        //     console.log("*");
        // }
        // else 
        // {
        //     return;
        // }

        // if(keyCode===13) {
        //     $("#new .contents").text($("#new .contents").text() + " \n\r");
        //     placeCaretAtEnd( $("#new .contents")[0] );
        // }

        // Extract words
        var text = $("#new .contents").val();
        // var words = text.match(/\b(\w{2,})\b/g);
        words = text.match(/([^\s]+)[\s$]/g);

        // Remove duplicated words
        words = [...new Set(words)];
        console.log(words);

        // Highlight words (have to run through each word individually)
        words.forEach((word)=>{
            $("#old .contents").highlight(word);
        }); // foreach
        
        // recalculateCoverage();
    }); // keyup

    $("#old .contents").on("input", ()=>{
        var oldText = $("#old .contents").text(); // html -> text
        localStorage.setItem("old", oldText);
        window.location.hash = oldText;
        console.log("setItem old, set hash: ", oldText);
    });

    $("#old .contents").on("input", evalDifferences);
    $("#new .contents").on("keyup", evalDifferences);

    $('#new .contents', 'keydown', function(e) {
        if(e.keyCode===9){var v=this.value,s=this.selectionStart,e=this.selectionEnd;this.value=v.substring(0, s)+'\t'+v.substring(e);this.selectionStart=this.selectionEnd=s+1;return false;}
    });

    if(window.location.hash.length) {
        var overrideByHash = window.location.hash;
        overrideByHash = overrideByHash.substr(1);
        overrideByHash = decodeURI(overrideByHash);
        $("#old .contents").text(overrideByHash);  // html -> text
    } else if(localStorage.getItem("old")) {
        var overrideByLocalStorage = localStorage.getItem("old");
        $("#old .contents").text(overrideByLocalStorage);  // html -> text
    }
}); // dom ready