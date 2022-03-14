function notes1() {
    alert("- RTF supported: You may copy and paste from Word Document or Text Edit and most formatting like bolding, font size, and lists will be copied over.\n- Shortcut keys: You may use shortcut keys for bold or italicized.");
}


$(()=>{
    $("#new .contents").on("keyup", ()=> {
        var text = $("#new .contents").text();
        console.log(text);

    });

});