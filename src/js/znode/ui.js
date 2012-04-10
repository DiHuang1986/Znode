var graph;

$(function () {

    graph = new NodeGraph();
    // composition view

    // consider moving to NodeGraph
    $("#canvas").mousedown(function (e) {
        if ((openWin.css("display") == "none") && (openComp.css("display") == "none")) {
            var children = $(e.target).children();
            if (children.length > 0) {
                var type = children[0].tagName;
                if (type == "desc" || type == "SPAN") {
                    graph.addNodeAtMouse();
                }
            }
        }
    });
    // ui code
    var openWin = $("#openWin");
    openWin.hide();

    var openComp = $('#openComp');
    openComp.hide();

    $(".btn_").mouseenter(function () {
        $(this).animate({
            "backgroundColor": "white"
        }, 200);
    }).mouseleave(function () {
        $(this).animate({
            "backgroundColor": "#efefef"
        });
    });

    $("#clear_canvas").click(function () {
        graph.clearAll();
    });
    $("#help").click(function () {
        window.open("http://www.zreference.com/znode", "_blank");
    });
    $('#inheritance').click(function () {
        // open up a menu with class names
        alert("Open a menu with list of class name.");
    });
    $('#resources').click(function () {
        $('#res').dialog({
            autoOpen: true,
            show: "blind",
            hide: "explode"
        });
    });

    $('#composition_view').click(function () {
        var classNames = $('#classNames');
        classNames.html(''); // clear the top element
        openComp.fadeIn();
        // parse the project and display all the classes.
        classNames.append("<div class='className'>Class Name 1<\/div>");
        classNames.append("<div class='className'>Class Name 2<\/div>");
        classNames.append("<div class='className'>Class Name 3<\/div>");

    });

    $("#save").click(saveFile);

    function saveFile() {
        var name = filename.val();
        if (name == "" || name == nameMessage) {
            alert("Please Name Your File");
            filename[0].focus();
            return;
        }
        $.post("json/save.php", {
            data: graph.toJSON(),
            name: name
        }, function (data) {
            alert("Your file was saved.");
        });
    }


    $("#canvas").mousedown(function () {
        openWin.fadeOut();
        openComp.fadeOut();
    });

    $("#open_json").click(function () {
        var fileList = $("#files");

        $('#OpenJsonFile').modal('show'); 
        fileList.html("<div>loading...<\/div>");
        //openWin.fadeIn();
        fileList.load("json/files.php?" + Math.random() * 1000000);
    });
    
    $('#about').click(function() {
        $('#AboutPopup').modal('show');
    });

    $("#paste_code").click(function () {
        $("#PasteCodePopup").modal('show');
        $("#textarea_code").focus();
    });

    $("#paste_code_close_button").click(function () {
        $("#PasteCodePopup").modal('hide');

    });
    
    $("#paste_code_close_button1").click(function () {
        $("#AboutPopup").modal('hide');
    });
    
    $("#paste_code_close_button2").click(function () {
        $("#OpenJsonFile").modal('hide');
    });
    
    $('#paste_code_close_button3').click(function() {
       $('#OpenCompView').modal('hide'); 
    });

    $("#open_javascript_close_button").click(function () {
        $("#OpenJavascriptPopup").modal('hide');
    });

    $("#source_view").click(function () {
        // Setup the source code for the focused node
        var src = graph.getNodes()[0].getSourceCode();
        $(".source_code").append(src);
        $("pre.source_code").snippet("javascript", { style: "random", transparent: true, showNum: true });
        $("#SourceViewPopup").modal('show');

    });

    $("#parse_button").click(function () {
        // We should now take the code and parse it.
        var code = $("#textarea_code").val();

        parseInit(code, "#PasteCodePopup");
    });

    $("#open_js").click(function () {
        $("#OpenJavascriptPopup").modal('show');
    });


    var nameMessage = $('.search-query').attr('placeholder');
    var filename = $("#filename").val(nameMessage);

    filename.focus(function () {
        if ($(this).val() == nameMessage) {
            $(this).val("");
        }
    }).blur(function () {
        if ($(this).val() == "") {
            $(this).val(nameMessage);
        }
    });

    $("#nameForm").submit(function (e) {
        e.preventDefault();
        saveFile();
    });

    $(".file").live('click', function () {
        var name = $(this).text();
        $.getJSON("files/" + name + ".json", {
            n: Math.random()
        }, function (data) {
            graph.fromJSON(data);

            filename.val(name);
        });
    }).live('mouseover', function () {
        $(this).css({
            "background-color": "#ededed"
        });
    }).live("mouseout", function () {
        $(this).css({
            "background-color": "white"
        });
    });

    $('.className').live('click', function (e) {
        alert($(e.target).html() + " was selected"); // user selected a class
        // This is where we need to check if the selected class exists in other classes by composition
        // and then draw all those classes<nodes> to the compDiv element. If no composition found, alert the user
        
        // draw the composition view here
        var compDiv = $('#composition_data');
        // ========================= This can be deleted ======
        compDiv.html('');
        var zindex = 1;
        var x = 20;
        for (var i = 0; i<3; i++) {
        compDiv.append("<div class='node_test shadow'/>");
        var n = $(".node_test").last();
        n.css({
            "position" : "absolute",
            "left" : x,
            "top" : 90,
            "width" : 100,
            "height" : 100,
            "border" : "1px solid black",
            "background" : "-webkit-gradient(linear, left top, left bottom, from(#5AE), to(#036))",
            "-webkit-border-radius" : "10px"
        });
        n.css("z-index", zindex++);
        x += 120;
        }
        // ===================== end of junk code =======
        
        // call the modal
        $('#OpenCompView').modal('show');
        $('#openComp').fadeOut();
    }).live('mouseover', function () {
        $(this).css({
            "background-color": "#ededed"
        });
    }).live('mouseout', function () {
        $(this).css({
            "background-color": "white"
        });
    });
});

var selectedFiles;

function handleFiles(files) {
  selectedFiles = files;
  
  var table = document.getElementById("js_table");
    
  for (var i = 0; i < files.length; ++i) {
    var rowCount = table.rows.length;
    var row = table.insertRow(rowCount);
    var cell = row.insertCell(0);
    // cell.innerHTML = files[i].name;
    var element = document.createElement("h6");
    var center = document.createElement("center");
    center.innerHTML = files[i].name;
    element.appendChild(center);
    element.type = "text";
    cell.appendChild(element);    
  }
}

//////////////////////////////////////////////////// Parsing API ////////////////////////////////////////////////////
// Global variable for storing the code
var globalCode;
function readFiles() {  
  // Loop through the FileList and render image files as thumbnails.
  for (var i = 0, f; f = selectedFiles[i]; i++) {
    var reader = new FileReader();

    // If we use onloadend, we need to check the readyState.
    reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
            globalCode = evt.target.result;
            parseInit(globalCode, "#OpenJavascriptPopup");           
      }
    };
    
    reader.readAsText(f);
  }
}

function parseInit(code, node_str) {
    
  generate_intellisense(code);

  graph.generateNodes();
  
  $(node_str).modal('hide');  
}
