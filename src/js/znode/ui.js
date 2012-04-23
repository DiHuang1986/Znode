var graph;
var main_canvas_id = "main_canvas";
var secondary_canvas_id = "secondary_canvas";
var g_class_name;

$(function () {
    initialize();
    graph = new NodeGraph(main_canvas_id, main_canvas_width, main_canvas_height, "main_canvas");
    // composition view

    // consider moving to NodeGraph

    $("#" + main_canvas_id).mousedown(function (e) {
        if ((openWin.css("display") == "none") && (openFunc.css("display") == "none")) {
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

    var openFunc = $('#openFunc');
    openFunc.hide();

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
        // Clear the Intellisense object
        GlobalIntellisenseRoot = new global_node();
        graph.clearAll();
    });
    $("#help").click(function () {
        window.open("http://www.zreference.com/znode", "_blank");
    });
    $('#inheritance').click(function () {
        // open up a menu with class names
        alert("Open a menu with list of class name.");
    });

    $('#resource_view').click(function () {
        $('#OpenResourceView').modal('show');		
    });

    $('#composition_view').click(function () {
        var classNames = $('#classNames');
        classNames.html(''); // clear the top element
        openComp.fadeIn();
        // Loop through all the global classes found.
        for (var key in GlobalIntellisenseRoot.defun) {
            classNames.append("<div class='className'>" + key + "<\/div>");
        }
    });

    $('#function_view').click(function () {
        var classNames = $('#classNames');
        classNames.html(''); // clear the top element
        openComp.fadeIn();
        // Loop through all the global classes found.
        for (var key in GlobalIntellisenseRoot.defun) {
            classNames.append("<div class='classNameFun'>" + key + "<\/div>");
        }
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


    $("#" + main_canvas_id).mousedown(function () {
        openWin.fadeOut();
        openComp.fadeOut();
        openFunc.fadeOut();
    });

    $("#open_json").click(function () {
        var fileList = $("#files");

        $('#OpenJsonFile').modal('show');
        fileList.html("<div>loading...<\/div>");
        //openWin.fadeIn();
        fileList.load("json/files.php?" + Math.random() * 1000000);
    });

    $('#about').click(function () {
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

    $('#paste_code_close_button3').click(function () {
        $('#OpenCompView').modal('hide');
    });

    $('#paste_code_close_button5').click(function () {
        $('#OpenResourceView').modal('hide');
    });

    $("#open_javascript_close_button").click(function () {
        $("#OpenJavascriptPopup").modal('hide');
    });

    $("#source_view").click(function () {
        // Setup the source code for the focused node
        var src = GlobalIntellisenseRoot.source_code;
        $(".source_code").append(src);
        $("pre.source_code").snippet("javascript", { style: "random", transparent: true, showNum: true });
        $("#SourceViewPopup").modal('show');
    });

    $('#all_view').click(function () {
        graph.clearAll();
        graph.generateInheritanceTree(true);
    });
    //===============inheritance View
    $('#inheritance_view').click(function() {
        graph.clearAll();
        graph.generateInheritanceTree(false);
    });
    //===============end of inheritance view
    $("#parse_button").click(function () {
        // We should now take the code and parse it.
        var code = $("#textarea_code").val();
        graph.clearAll();
        parseInit(code, "#PasteCodePopup");
    });

    $("#open_js").click(function () {
        $("#OpenJavascriptPopup").modal('show');
    });


    var nameMessage = $('.search-query').attr('placeholder');
    var filename = $(".search-query").val(nameMessage);

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

    $('.classNameFun').live('click', function (e) {
        // open the function call window
        var functionCalls = $('#functionCalls');
        functionCalls.html(''); // clear the top element
        openFunc.fadeIn();
        
        // Display all the function calls.
        g_class_name = $(e.target).html();
        var obj = GlobalIntellisenseRoot.defun[g_class_name];
        var class_members = obj.get_class_members("all");
        for (member in class_members) {
            if (class_members[member]['type'] == 'function') {
                functionCalls.append("<div class='functionsList'>" + member + "<\/div>")
            }
        }
    }).live('mouseover', function () {
        $(this).css({
            "background-color": "#ededed"
        });
    }).live('mouseout', function () {
        $(this).css({
            "background-color": "white"
        });
    });


    // an even handler for the function calls list.
    $('.functionsList').live('click', function(e) {
        var obj = GlobalIntellisenseRoot.defun[g_class_name];
        var class_members = obj.get_class_members("all");
        $("#usageViewTableBody").empty();
        var html = "";
        
        for (member in class_members) {
            if (member == $(e.target).html()) {
                var usage_list = class_members[member]['usage'];
                for (key in usage_list) {
                    html = html + "<tr><td><center>" + usage_list[key][1]['line'] + "</center></td>";
                    html = html + "<td><center>" + usage_list[key][0] + "</center></td>";
                    html = html + "<td><center>" + usage_list[key][1]['code_str'] + "</center></td><tr>";
                    //console.log(usage_list[key][1]['line']);
                    //console.log(usage_list[key][1]['code_str']);
                    //console.log(usage_list[key][0]);
            }
          }
        }
        $("#usageViewTableBody").append(html);
        openFunc.fadeOut();
        openComp.fadeOut();
        $("#UsageViewPopup").modal('show');
        //alert('You selected ' + $(e.target).html());
    }).live('mouseover', function () {
        $(this).css({
            "background-color": "#ededed"
        });
    }).live('mouseout', function () {
        $(this).css({
            "background-color": "white"
        });
    });


    $('.className').live('click', function (e) {
        var class_name = $(e.target).html();
        var obj = GlobalIntellisenseRoot.get_single_defun(class_name);
        var intellisense = GlobalIntellisenseRoot;
        var arr = [];
        var startx = 500;
        var starty = 100;
        var i = 0;
        graph.clearAll();
        for (var key in intellisense.defun) {
            arr.push(intellisense.defun[key]);
        }
        // This is where we need to check if the selected class exists in other classes by composition
        // and then draw all those classes<nodes> to the compDiv element. If no composition found, alert the user

        // draw the composition view here
        graph.generateSingleNode(class_name, startx, starty, arr[i]);
        startx = 200;
        starty = defaultNodeHeight + 250;
        i++;
        var composition_classes = obj.get_composition_classes();
        for (var key in composition_classes) {
            graph.generateSingleNode(key, startx, starty, arr[i]);
            startx += defaultNodeWidth + 20;
            if (startx > $(window).width()) {
                startx = 50;
                starty += defaultNodeHeight + 20;
            }
            i++;
        }
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
    reader.onloadend = (function(f){
        return function(evt){
            if (evt.target.readyState == FileReader.DONE) { // DONE == 2
                var typeLowerCase = f.type.toLowerCase();
                globalCode = evt.target.result;

                // if the file is any sort of html file, don't let it through the
                // parser rather add it to the resoure window				
                if (typeLowerCase.indexOf("html") != -1) {
                    parseHtmlFile(f, globalCode);
                }
                else {
                    parseInit(globalCode, "#OpenJavascriptPopup");           
                }
            }
        };
    })(f);
    
    reader.readAsText(f);
  }
}

function parseHtmlFile(file, htmlFileCode){

     var lines = htmlFileCode.split("\r"); // Will separate each line into an array
     var i;
     var line;
     var lineLowerCase
     var count = 0;	 
    
     for (i = 0; i < lines.length; i++){

        var htmlCode = "";
        line = lines[i].toString(); 
        lineLowerCase = line.toLowerCase();
        
        // <link rel="stylesheet" href="css/jquery.snippet.css" />
        if ((lineLowerCase.indexOf("link") !=-1) && (lineLowerCase.indexOf("href") !=-1)){
            var index = line.indexOf("href");
            var string2 = line.substring(index+6);
            var index2 = string2.indexOf("\"");
            var resource = line.substring((index+6), (index+6)+index2);
            
            htmlCode = "<tr><td><center>" + file.name + "</center></td>";
            htmlCode = htmlCode + "<td><center>" + i + "</center></td>";
            htmlCode = htmlCode + "<td><center>" + resource + "</center></td>";			
            
            count++;
            
            $("#resourceViewTableBody").append(htmlCode);
        }
        // <script type="text/javascript" src="js/libs/jquery-1.7.1.min.js"></script>
        else if ((lineLowerCase.indexOf("script") !=-1) && (lineLowerCase.indexOf("src") !=-1)){
            var index = line.indexOf("src");
            var string2 = line.substring(index+5);
            var index2 = string2.indexOf("\"");
            var resource = line.substring((index+5), (index+5)+index2);
            htmlCode = "<tr><td><center>" + file.name + "</center></td>";
            htmlCode = htmlCode + "<td><center>" + i + "</center></td>";
            htmlCode = htmlCode + "<td><center>" + resource + "</center></td>";			

            count++;
            
            $("#resourceViewTableBody").append(htmlCode);
        }
     }
}

function parseInit(code, node_str) {
    generate_intellisense(code);
    // initial InheritanceLvl========
    generateInheritanceLvl(GlobalIntellisenseRoot);

    graph.clearAll();
    graph.generateInheritanceTree(true);

    $(node_str).modal('hide');
}
