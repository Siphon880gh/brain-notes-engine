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

$(()=>{
    $("#new .contents").on("keyup blur", (event)=> {
        var keyCode = event.keyCode;
        if(event.type === "blur" ||
            keyCode===9 || // tap
            keyCode===13 || // enter
            keyCode===32 || // space
            keyCode===49 || // 1 or !
            keyCode===186 || // ;
            keyCode===187 || // =
            keyCode===188 || // ,
            keyCode===189 || // -
            keyCode===190 || // .
            keyCode===191 || // /
            keyCode===220 || // \
            keyCode===222 // '
          )
        {
            // left blank
            console.log("*");
        }
        else 
        {
            return;
        }

        if(keyCode===13) {
            $("#new .contents").text($("#new .contents").text() + " \n\r");
            placeCaretAtEnd( $("#new .contents")[0] );
        }

        // Extract words
        var text = $("#new .contents").text();
        var words = text.match(/\b(\w{2,})\b/g);

        // Remove duplicated words
        words = [...new Set(words)];
        console.log(words);

        // Highlight words (have to run through each word individually)
        words.forEach((word)=>{
            $("#old .contents").highlight(word);
        }); // foreach
        
        // recalculateCoverage();
    }); // keyup

}); // dom ready