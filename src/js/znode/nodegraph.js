function get_node_from_id(graph_to_use, id_string) {
    var clicked_element = id_string.split("_");
    var id = parseInt(clicked_element[clicked_element.length - 1]);
    var node = graph_to_use.getNode(id);    
    return node;
}

var g_class_name;
var defaultNodeWidth = 200;
var defaultNodeHeight = 100;
var win = $(window);

var topHeight = 0;
var main_canvas_width = 0;
var main_canvas_height = 0;

//===========
var inheritanceClassLvl=[];
//===========

function initialize() {
    topHeight = $("#top_toolbar").height();
    main_canvas_width = win.width();
    main_canvas_height = win.height() - topHeight;
}

function NodeGraph(canvas_id, canvas_width, canvas_height, canvasName) {
    var canvas = $("#" + canvas_id);
    var overlay = $("#overlay");
    var currentNode;
    var currentConnection = {};
    var connections = {};
    var connectionId = 0;
    var newNode;
    var nodes = {};
    var node_name_id_mapping = {};
    var nodeId = 0;
    var mouseX = 0, mouseY = 0;
    var loops = [];
    var pathEnd = {};
    var zindex = 1;
    var hitConnect;
    var key = {};
    var SHIFT = 16;
    var canvas_name = canvasName;

    var paper = new Raphael(canvas_id, "100", "100");

    function resizePaper(width, height) {
        paper.setSize(width, height);
    }

    this.getPaper = function() {
        return paper;
    }

    this.getNode = function(id) {
        if (nodes.hasOwnProperty(id)) {
            return nodes[id];
        } else {
            alert("Graph doesn't have this object: " + id);            
        }
    }

    win.resize(resizePaper);
    resizePaper(canvas_width, canvas_height);

    function arrowRotate(pointX, pointY, centerX, centerY, angle) {
        var degree = angle * Math.PI / 180;
        var newX = Math.cos(degree) * (pointX - centerX) - Math.sin(degree) * (pointY - centerY);
        var newY = Math.sin(degree) * (pointX - centerX) + Math.cos(degree) * (pointY - centerY);
        return { x: (newX + centerX), y: (newY + centerY) };
    }

    function arrow(x1, y1, x2, y2, linkType) {
        var angle = Math.atan2(x1 - x2, y2 - y1);
        angle = (angle / (2 * Math.PI)) * 360;
        var points;
        if (linkType == "composition") {
            points = [{ x: x2 - 20, y: y2 }, { x: (x2 - 10), y: (y2 - 7) }, { x: (x2 - 10), y: (y2 + 7) }, { x: x2, y: y2}];
        }
        else if (linkType == "inheritance") {
            points = [{ x: x2 - 20, y: y2 }, { x: (x2 - 20), y: (y2 - 8) }, { x: (x2 - 20), y: (y2 + 8) }, { x: x2, y: y2}];
        }
        else {
            
            // Inheritance link
            points = [{ x: x2 - 20, y: y2 }, { x: (x2 - 20), y: (y2 - 8) }, { x: (x2 - 20), y: (y2 + 8) }, { x: x2, y: y2}];
        }

        var newPoints = [];
        var center = { x: x2, y: y2 };

        for (var i = 0; i < points.length; i++)
            newPoints.push(arrowRotate(points[i].x, points[i].y, center.x, center.y, 90 + angle));

        var arrowStr = "M" + x1 + " " + y1 + " L" + newPoints[0].x + " " + newPoints[0].y + " L" + newPoints[1].x + " " + newPoints[1].y + " M" + newPoints[0].x + " " + newPoints[0].y + " L" + newPoints[2].x + " " + newPoints[2].y + " M" + newPoints[3].x + " " + newPoints[3].y + " L" + newPoints[1].x + " " + newPoints[1].y + " M" + newPoints[3].x + " " + newPoints[3].y + " L" + newPoints[2].x + " " + newPoints[2].y;
        return arrowStr;
    };
  

    this.getNodes = function () { return nodes; }

    // canvas.append("<ul id='menu'><li>Left<\/li><li>Right<\/li><li>Top<\/li><li>Bottom<\/li><\/ul>");
    var menu = $("#menu");
    menu.css({
        "position" : "absolute",
        "left" : 100,
        "top" : 0,
        "z-index" : 5000,
        "border" : "1px solid gray",
        "padding" : 0
    });
    menu.hide();
        
    canvas.append("<div id='hit' />");
    hitConnect = $("#hit");
    hitConnect.css({
        "position" : "absolute",
        "left" : 100,
        "top" : 0,
        "z-index" : 4000,
        "border" : "none",
        "width" : 10,
        "height" : 10,
        "cursor" : "pointer",
        "font-size" : "1px"
    });

    $("#menu li").hover(function() {
        $(this).css("background-color", "#cccccc");
    }, function() {
        $(this).css("background-color", "white");
    }).click(function() {
        menu.hide();
        //vsmenu.hide();
        var dir = $(this).text();
        connectNode(dir);
    });

    $("#vsmenu li").hover(function() {
        $(this).css("background-color", "#cccccc");
    }, function() {
        $(this).css("background-color", "white");
    }).click(function() {
        vsmenu.hide();
        var viewName = $(this).text();
        createView(viewName);
    });
    
    function createView(viewName){
        // jQuery code goes here.
        viewName = viewName.toLowerCase();
        if (viewName == 'inheritance'){
            // add parsed data  buildInher...
            $('#inher').dialog({
                autoOpen: true,
                show: "blind",
                hide: "explode"
            });
        }
        if (viewName == 'composition'){
            $('#comp').dialog({
                autoOpen: true,
                show: "blind",
                hide: "explode"
            });
        }
        if (viewName == 'global'){
            var textArea = $('textarea');
            var content = "";
            textArea.each(function(){
                content = $(this).val();
                //$('#global').append("<p>" + content + "</p>");
                $.each(content.split(/[\r\n]+/), function(i, line) { 
                    $('<p>').text(line).appendTo('#global') })
            });
            //$('#global').text(content); // copy textarea context to dialog
            $('#global').highlight(g_selText); // highlight the selected text.
            $('#global').dialog({
                autoOpen: true,
                show: "blind",
                hide: "explode",
                close: function (event, ui) {
                  $('#global').text("");
                }
            });
        }
        if (viewName == 'functions'){
            $('#function').dialog({
                autoOpen: true,
                show: "blind",
                hide: "explode"
            });
        }
        if (viewName == 'resources'){
            $('#res').dialog({
                autoOpen: true,
                show: "blind",
                hide: "explode"
            });
        }
        if (viewName == "exit"){};
    }
    
    function connectNode(dir) {
        var node, x, y;
        dir = dir.toLowerCase();

        if(dir == "left") {
            x = pathEnd.x + 5;
            y = pathEnd.y + topHeight - currentNode.height() / 2;

        } else if(dir == "right") {
            x = pathEnd.x - currentNode.width() - 5;
            y = pathEnd.y + topHeight - currentNode.height() / 2;
        } else if(dir == "top") {
            x = pathEnd.x - currentNode.width() / 2;
            y = pathEnd.y + topHeight + 5;
        } else if(dir == "bottom") {
            x = pathEnd.x - currentNode.width() / 2;
            y = pathEnd.y + topHeight - 5 - currentNode.height();
        }
        node = new Node(x, y, currentNode.width(), currentNode.height());
        saveConnection(node, dir);
        currentNode = node;
    }

    function createConnection(a, conA, b, conB, connType) {
        var link = paper.path("M 0 0 L 1 1");
        link.attr({
            "stroke-width" : 2
        });
        link.parent = a[conA];

        a.addConnection(link);
        currentConnection = link;
        currentNode = a;
        saveConnection(b, conB, connType);
    }

    function saveConnection(node, dir, type) {
        if(!currentConnection)
            return;
        if(!currentConnection.parent)
            return;

        currentConnection.startNode = currentNode;
        currentConnection.endNode = node;
        currentConnection.startConnection = currentConnection.parent;
        currentConnection.endConnection = node[dir.toLowerCase()];
        currentConnection.connType = type;

        currentConnection.id = connectionId;
        connections[connectionId] = currentConnection;
        connectionId++;

        currentNode.updateConnections();
        node.addConnection(currentConnection);

        $(currentConnection.node).mouseenter(function() {
            this.raphael.attr("stroke", "#FF0000");
        }).mouseleave(function() {
            this.raphael.attr("stroke", "#000000");
        }).click(function() {
            if(confirm("Are you sure you want to delete this connection?")) {
                this.raphael.remove();
                delete connections[this.raphael.id];
            }
        });
    }


    canvas.mousedown(function(e) {
        if(menu.css("display") == "block") {
            if(e.target.tagName != "LI") {
                menu.hide();
                currentConnection.remove();
            }
        }
    });

    $(document).keydown(function(e) {
        key[e.keyCode] = true;
    }).keyup(function(e) {
        key[e.keyCode] = false;
    });

    $(document).mousemove(function(e) {
        mouseX = e.pageX;
        mouseY = e.pageY - topHeight;
    }).mouseup(function(e) {
        // overlay.hide();
        var creatingNewNode = newNode;

        hitConnect.css({
            "left" : mouseX - 5,
            "top" : mouseY + topHeight - 5
        });
        for(var i in nodes) {
            if(nodes[i]) {
                var n = nodes[i];
                if(n != currentNode) {
                    var nLoc = n.content.position();
                    if(hitTest(toGlobal(nLoc, n.left), hitConnect)) {
                        saveConnection(n, "left");
                        newNode = false;
                        break;
                    } else if(hitTest(toGlobal(nLoc, n.top), hitConnect)) {
                        saveConnection(n, "top");
                        newNode = false;
                        break;
                    } else if(hitTest(toGlobal(nLoc, n.right), hitConnect)) {
                        saveConnection(n, "right");
                        newNode = false;
                        break;
                    } else if(hitTest(toGlobal(nLoc, n.bottom), hitConnect)) {
                        saveConnection(n, "bottom");
                        newNode = false;
                        break;
                    }
                }
            }
        }
        hitConnect.css("left", "-100px");

        if(newNode) {
            if(key[SHIFT]) {
                menu.css({
                    "left" : mouseX - 10,
                    "top" : mouseY
                });
                menu.show();
            } else {
                var dir;
                var currDir = currentConnection.parent.attr("class");
                if(currDir == "left") {
                    dir = "right";
                } else if(currDir == "right") {
                    dir = "left";
                } else if(currDir == "top") {
                    dir = "bottom";
                } else if(currDir == "bottom") {
                    dir = "top";
                }

                if(pathEnd.x == undefined || pathEnd.y == undefined) {
                    currentConnection.remove();
                } else {
                    connectNode(dir);
                }
            }
        }
        newNode = false;

        for(var i in loops) {
            clearInterval(loops[i]);
        }
        try {
            if(loops.length > 0)
                document.selection.empty();
        } catch(e) {
        }
        loops = [];

        if(creatingNewNode)
            currentNode.txt[0].focus();
    });
    function toGlobal(np, c) {
        var l = c.position();
        return {
            position : function() {
                return {
                    left : l.left + np.left,
                    top : l.top + np.top
                };
            },
            width : function() {
                return c.width();
            },
            height : function() {
                return c.height();
            }
        };
    }


    function startDrag(element, bounds, dragCallback) {
        var startX = mouseX - element.position().left;
        var startY = mouseY - element.position().top;
        if(!dragCallback)
            dragCallback = function() {
            };
        var id = setInterval(function() {
            var x = mouseX - startX;
            var y = mouseY - startY;
            if(bounds) {
                if(x < bounds.left)
                    x = bounds.left;
                if(x > bounds.right)
                    x = bounds.right;
                if(y < bounds.top)
                    y = bounds.top;
                if(y > bounds.bottom)
                    y = bounds.bottom;
            }
            element.css("left", x).css("top", y);
            dragCallback();
        }, topHeight);
        loops.push(id);
    }

    function GetSelectedText() {
        var selText = "";
        if(window.getSelection) {// all browsers, except IE before version 9
            if(document.activeElement && (document.activeElement.tagName.toLowerCase() == "textarea" || document.activeElement.tagName.toLowerCase() == "input")) {
                var text = document.activeElement.value;
                selText = text.substring(document.activeElement.selectionStart, document.activeElement.selectionEnd);
            } else {
                var selRange = window.getSelection();
                selText = selRange.toString();
            }
        } else {
            if(document.selection.createRange) {// Internet Explorer
                var range = document.selection.createRange();
                selText = range.text;
            }
        }
        if(selText !== "") {
            return selText;
        }
        return selText;
    }

    function Node(xp, yp, w, h, intellisense_obj, noDelete, forceId) {
        
        if(forceId) {
            nodeId = forceId;
        }
        
        this.id = nodeId;
        nodes[nodeId] = this;
        nodeId++;
        
        this.intellisenseObj = intellisense_obj;

        var curr = this;
        this.connections = {};
        var connectionIndex = 0;

        this.addConnection = function(c) {
            curr.connections[connectionIndex++] = c;
            return c;
        }

        this.PopoverHide = function() {
            var id = "#" + this.getHtmlIdName("node_text");
            $(id).popover('hide');
        }

        this.getIntellisenseObjName = function () {
            if (this.intellisenseObj == undefined) {
                return "Undefined";
            }

            return getTokenDisplayName(this.intellisenseObj.type) + ": " + this.intellisenseObj.name;
        }

        this.getID = function () {
            return this.id;
        }

        this.getIntellisenseObj = function() {
            return this.intellisenseObj;
        }

        this.getHtmlIdName = function(name) {
            return  canvas_name + "_" + name + "_" + this.id;
        }
        
        canvas.append("<div id='" + this.getHtmlIdName("node") + "' class='node shadow'/>");
        var n = $(".node").last();
        n.css({
            "position" : "absolute",
            "left" : xp,
            "top" : yp,
            "width" : w,
            "height" : h,
            "border" : "1px solid black",
            "background" : "-webkit-gradient(linear, left top, left bottom, from(#5AE), to(#036))",
            // "background": "-webkit-gradient(linear, left bottom, left top, from(#C35617), to(#F88017))",
            "-webkit-border-radius" : "10px"
        });
        n.css("z-index", zindex++);

        if (this.intellisenseObj != null && this.intellisenseObj.type != "defun")
            n.css({ "background": "-webkit-gradient(linear, left bottom, left top, from(#C35617), to(#F88017))" });

        this.content = n;

        this.width = function() {
            return n.width();
        }
        this.height = function() {
            return n.height();
        }
        this.x = function() {
            return n.position().left;
        }
        this.y = function() {
            return n.position().top;
        }

        var nodeWidth = n.width();
        var nodeHeight = n.height();

        this.getSourceCode = function () {
            if (this.intellisenseObj != null) {

                if (this.intellisenseObj.type == "defun" || this.intellisenseObj.type == "function")
                {
                    var src_code;
                    try {
                        src_code = this.intellisenseObj.get_source_code();
                    } catch(e) {
                        src_code = "Not Defined";
                    }
                    return src_code;
                }

                if (this.intellisenseObj.type == "global_var") {
                    var str = "Initial Data Definition: " + this.intellisenseObj.initial_data_type;
                    str += "\nInitial Value: " + this.intellisenseObj.value;
                    return str;
                }
            }

            return "No Source Defined";
        }

        n.append("<div class='bar'></div>");
        var bar = $(".node .bar").last();
        bar.css({
            "border-top-left-radius": "8px",
            "border-top-right-radius": "8px",
            "top": 0,
            "left": 0,
            "height" : "20px",
            "background-color" : "black",
            "padding" : "0",
            "margin" : "0",
            "font": "12px Tahoma, sans-serif",
            "cursor" : "pointer",
            "color" : "white",
            "-webkit-border-top-left-radius" : "8px",
            "-webkit-border-top-right-radius" : "8px"
        });

        var viewButtonsEnabled = false;

        if(!noDelete) {
            n.append("<img class='ex' width=15 height=15 src='img/close.png'><\/img>");
            var ex = $(".node .ex").last();
            ex.css({
                "border-top-left-radius": "8px",              
                "position" : "absolute",
                "padding-right" : 5,
                "padding-top" : 3,
                "padding-left" : 5,
                "padding-bottom" : 2,
                "color" : "white",
                "font-family" : "sans-serif",
                "top" : 0,
                "left" : 0,
                "cursor" : "pointer",
                "font-size" : "10px",
                "background-color" : "black",
                "z-index" : 100
            });
            ex.hover(function () {
                ex.css("color", "black");
            }, function () {
                ex.css("color", "white");
            }).click(function () {

                if (confirm("Are you sure you want to delete this node?")) {
                    curr.remove();
                }
            });
        }


        if (!noDelete) {
            n.append("<img id='" + this.getHtmlIdName("usage") + "' width=15 height=15 src='img/usage.png' rel='tooltip' title='Show where this is used'><\/img>");
            var usage = $("#" + this.getHtmlIdName("usage"));
            usage.css({
                "visibility": "visible",
                "border-top-left-radius": "8px",
                "position": "absolute",
                "padding-right": 5,
                "padding-top": 3,
                "padding-left": 5,
                "padding-bottom": 2,
                "color": "white",
                "font-family": "sans-serif",
                "top": 0,
                "right": 5,
                "cursor": "pointer",
                "font-size": "10px",
                "background-color": "black",
                "z-index": 100
            });

            usage.tooltip('hide');

            usage.click( function(event) {
                var orig_node = get_node_from_id(graph, event.target.id);            
                var obj = orig_node.getIntellisenseObj();
                var count = 0;

                $("#usageViewTableBody").empty();

                var html = "";

                var usage_list = obj.get_usage();

                for (var key in usage_list) {
                    var type = usage_list[key][0];
                    var usage_obj = usage_list[key][1];

                    html = html + "<tr><td style='color:blue;font-weight:bold'><center>" + key + "</center></td>";
                    
                    html += "<td style='color:blue;font-weight:bold'><center>" + type + "</center></td>";

                    html += "<td style='color:red;font-weight:bold'><center>" + usage_obj.get_where_used() + "</center></td>";

                    var code_str = usage_obj.get_code_string();

                    color = ((count % 2) == 0) ? "Indigo" : "Brown";

                    html = html + "<td><center><font color='" + color + "'>" + code_str + "</font></center></td><tr>";
                }

                $("#usageViewTableBody").append(html);                
                $("#UsageViewPopup").modal('show');
            });
        }

       if (!noDelete) {
            n.append("<img id='" + this.getHtmlIdName("source") + "' width=15 height=15 src='img/source.png' rel='tooltip' title='Source View'><\/img>");
            var source = $("#" + this.getHtmlIdName("source"));
            source.css({
                "visibility": "visible",
                "border-top-left-radius": "8px",
                "position": "absolute",
                "padding-right": 5,
                "padding-top": 3,
                "padding-left": 5,
                "padding-bottom": 2,
                "color": "white",
                "font-family": "sans-serif",
                "top": 0,
                "right": 25,
                "cursor": "pointer",
                "font-size": "10px",
                "background-color": "black",
                "z-index": 100
            });

            source.tooltip('hide');
        }

        source.click( function(event) {
            var orig_node = get_node_from_id(graph, event.target.id);            
            var src = orig_node.getSourceCode();
            $("#source_body").empty();
            $("#source_body").append('<pre class="source_code"></pre>');
            $(".source_code").append(src);
            $("pre.source_code").snippet("javascript", { style: "bright", transparent: true, showNum: true });
            $("#SourceViewPopup").modal('show');
        });

        if (this.intellisenseObj != null && this.intellisenseObj.type == "defun") {
            if (!noDelete) {
                n.append("<img id='" + this.getHtmlIdName("inheritance") + "' width=15 height=15 src='img/inheritance.png' rel='tooltip' title='Show Inheritance Diagram'><\/img>");
                var inheritance = $("#" + this.getHtmlIdName("inheritance"));
                inheritance.css({
                    "visibility": "visible",
                    "border-top-left-radius": "8px",
                    "position": "absolute",
                    "padding-right": 5,
                    "padding-top": 3,
                    "padding-left": 5,
                    "padding-bottom": 2,
                    "color": "white",
                    "font-family": "sans-serif",
                    "top": 0,
                    "right": 45,
                    "cursor": "pointer",
                    "font-size": "10px",
                    "background-color": "black",
                    "z-index": 100
                });

                inheritance.tooltip('hide');

                inheritance.click(function (event) {
                    var orig_node = get_node_from_id(graph, event.target.id);

                    try {
                        // Delete the DOM element
                        $("#secondary_canvas").empty();
                    } catch(e) {
                        // Do nothing
                    }
                

                    $("#SecondaryCanvasView").css({ width: win.width() - 300, height: win.height() - 250, background: "#444444", top: 300, left: 400 });
                    var inheritance_graph = new NodeGraph(secondary_canvas_id, win.width() - 300, win.height() - 250, "secondary_canvas");
                    inheritance_graph.clearAll();

                    $("#SecondaryCanvasView").modal('show');
                    var obj = orig_node.getIntellisenseObj();

                    //=============generate single class inheritance tree=====
                    inheritance_graph.generateInheritanceTreeOf(obj);
                    //==========end of generation========

                    /*
                    var startx = 100; var starty = 100;
                    // Get the object
                    var node = inheritance_graph.addNode(startx, starty, defaultNodeWidth, defaultNodeHeight, obj);
                    inheritance_graph.add_node_name_mapping(obj, node);

                    startx += defaultNodeWidth + 20; starty += defaultNodeHeight + 20;

                    for (var i = 0; i < obj.super_classes.length; ++i) {
                        var base_class_name = obj.super_classes[i];
                        var base_class_obj = GlobalIntellisenseRoot.get_from_global_dict(base_class_name);

                        var base_class_node = inheritance_graph.addNode(startx, starty, defaultNodeWidth, defaultNodeHeight, base_class_obj);

                        inheritance_graph.add_node_name_mapping(base_class_obj, base_class_node);

                        var x1 = node.x(); var y1 = node.y(); var x2 = base_class_node.x(); var y2 = base_class_node.y();
                        var arrowStr = arrow(x1, y1, x2, y2, "inheritance");

                        startx += defaultNodeWidth + 20; starty += defaultNodeHeight + 20;
                    }


                    inheritance_graph.generateSingleInheritanceConnection(obj, node);
                    */
                });
            }

            if (!noDelete) {
                n.append("<img id='" + this.getHtmlIdName("composition") + "' width=15 height=15 src='img/composition.png' rel='tooltip' title='Show which classes compose this'><\/img>");
                var composition = $("#" + this.getHtmlIdName("composition"));
                composition.css({
                    "visibility": "visible",
                    "border-top-left-radius": "8px",
                    "position": "absolute",
                    "padding-right": 5,
                    "padding-top": 3,
                    "padding-left": 5,
                    "padding-bottom": 2,
                    "color": "white",
                    "font-family": "sans-serif",
                    "top": 0,
                    "right": 65,
                    "cursor": "pointer",
                    "font-size": "10px",
                    "background-color": "black",
                    "z-index": 100
                });

                composition.click(function (event) {
                    var orig_node = get_node_from_id(graph, event.target.id);

                    try {
                        // Delete the DOM element
                        $("#secondary_canvas").empty();
                    } catch(e) {
                        // Do nothing
                    }

                    $("#SecondaryCanvasView").css({ width: win.width() - 300, height: win.height() - 250, background: "#444444", top: 300, left: 400 });
                    var composition_graph = new NodeGraph(secondary_canvas_id, win.width() - 300, win.height() - 250, "secondary_canvas");
                    composition_graph.clearAll();


                    var startx = 100; var starty = 100;
                    // Get the object
                    var obj = orig_node.getIntellisenseObj();
                    var node = composition_graph.addNode(startx, starty, defaultNodeWidth, defaultNodeHeight, obj);
                    composition_graph.add_node_name_mapping(obj, node);

                    startx += defaultNodeWidth + 20; starty += defaultNodeHeight + 20;

                    for (var key in  obj.classes_where_composed) {
                        var composition_base_class_name = key;
                        var composition_base_class_obj = GlobalIntellisenseRoot.get_from_global_dict(composition_base_class_name);

                        var composition_base_class_node = composition_graph.addNode(startx, starty, defaultNodeWidth, defaultNodeHeight, composition_base_class_obj);

                        composition_graph.add_node_name_mapping(composition_base_class_obj, composition_base_class_node);

                        startx += defaultNodeWidth + 20; starty += defaultNodeHeight + 20;
                    }

                    composition_graph.generateSingleCompositionConnection(obj, node);
                    node.updateConnections();
                    $("#SecondaryCanvasView").modal('show');
                });

                composition.tooltip('hide');
            }

            // Add the view for showing Detailed data members
            if (!noDelete) {
            n.append("<img id='" + this.getHtmlIdName("data_members") + "' width=15 height=15 src='img/data_members.png' rel='tooltip' title='Data Members'><\/img>");
            var data_members = $("#" + this.getHtmlIdName("data_members"));
            data_members.css({
                "visibility": "visible",
                "border-top-left-radius": "8px",
                "position": "absolute",
                "padding-right": 5,
                "padding-top": 3,
                "padding-left": 5,
                "padding-bottom": 2,
                "color": "white",
                "font-family": "sans-serif",
                "top": 0,
                "right": 85,
                "cursor": "pointer",
                "font-size": "10px",
                "background-color": "black",
                "z-index": 100
            });

            data_members.tooltip('hide');
        }

        data_members.click( function(event) {
            var orig_node = get_node_from_id(graph, event.target.id);            
            var obj = orig_node.getIntellisenseObj();
            $("#data_member_body").empty();
            var html = "";
            var count = 0;
            var color = "";

            // $("#DataMembersPopup").css({ width: win.width() - 300, top: 300, left: 400 });

            var inherited_member_list = obj.get_inherited_members();
            var inherited_member_list_count = count_dictionary_items(inherited_member_list);

            if (inherited_member_list_count > 0) {
                
                html = '            <h4>\
                    <center>Inherited Data Members</center>\
                </h4>\
                <table id="data_member_table_1" class="table table-striped table-bordered table-condensed">\
                    <thead>\
                        <tr>\
                            <th><center>Data Member</center></th>\
                            <th><center>Inherits From</center></th>\
                            <th><center>Type</center></th>\
                            <th><center>Defined in</center></th>\
                        </tr>\
                    </thead>\
                    <tbody id="DataMemberViewTableBody1">';


                // Display all the inherited data members
                for (var inherited_class in inherited_member_list) {
                    for (var key in inherited_member_list[inherited_class]) {
                        var tempObj = GlobalIntellisenseRoot.get_from_global_dict(key);
                        var usage_obj = tempObj.get_usage();
                
                        var row_span = count_dictionary_items(usage_obj);
                        html += "<tr><td style='color:blue;font-weight:bold'><center>" + split_name(key) + "</center></td>";
                    
                        html += "<td style='color:blue;font-weight:bold'><center>" + inherited_class + "</center></td>";

                        var type = tempObj.type;
                        html += "<td><center>" + type + "</center></td>";
                
                        html += "<td>";

                        for (var key in usage_obj) {
                            color = ((count % 2) == 0) ? "Indigo" : "Brown";
                            var code_str = usage_obj[key][1].get_code_string();
                            var class_where_used = usage_obj[key][1].get_where_used();
                            html += "<center><font color='" + color + "'><b>" + class_where_used + "</b>: " + code_str + "</font></center>";
                            ++count;
                        }

                        html += "</td>";
                    }
                }

                html += "</tbody></table>";
            }

            $("#data_member_body").append(html);



            // Display all the class data members
            var member_list = obj.get_class_members("all");
            var member_list_count = count_dictionary_items(member_list);
            

            if (member_list_count > 0) {
                html = '            <h4>\
                    <center>Actual Class Data Members</center>\
                </h4>\
                <table id="data_member_table_2" class="table table-striped table-bordered table-condensed">\
                    <thead>\
                        <tr>\
                            <th><center>Data Member</center></th>\
                            <th><center>Type</center></th>\
                            <th><center>Defined in</center></th>\
                        </tr>\
                    </thead>\
                    <tbody id="DataMemberViewTableBody2">';


                for (var key in member_list) {
                    if (split_name(key) == "shutdownVisualGameObject") {
                        var kk = key;
                    }
                    
                    var usage_obj = member_list[key].get_usage();
                
                    var row_span = count_dictionary_items(usage_obj);
                    html = html + "<tr><td style='color:red;font-weight:bold'><center>" + split_name(key) + "</center></td>";
                    
                    var type = member_list[key].type;
                    html = html + "<td><center>" + type + "</center></td>";

                    html += "<td>";

                    for (var key in usage_obj) {
                        color = ((count % 2) == 0) ? "Indigo" : "Brown";
                        var code_str = usage_obj[key][1].get_code_string();
                        var class_where_used = usage_obj[key][1].get_where_used();
                        html += "<center><font color='" + color + "'><b>" + class_where_used + "</b>: " + code_str + "</font></center>";
                        ++count;
                    }

                    html += "</td>";
                }

                html += "</tbody></table>";

                $("#data_member_body").append(html);
            }

            // Display all the Composition Classes
            var composition_class_member_list = obj.get_composition_class_members();
            var composition_class_member_list_count = count_dictionary_items(composition_class_member_list);

            if (composition_class_member_list_count > 0) {
                html = '            <h4>\
                    <center>Composition Class Data Members</center>\
                </h4>\
                <table id="composition_class_member_table" class="table table-striped table-bordered table-condensed">\
                    <thead>\
                        <tr>\
                            <th><center>Data Member</center></th>\
                            <th><center>Composition Class</center></th>\
                            <th><center>Type</center></th>\
                            <th><center>Defined in</center></th>\
                        </tr>\
                    </thead>\
                    <tbody id="Tbody1">';

            
                for (var composition_class in composition_class_member_list) {
                    for (var key in composition_class_member_list[composition_class]) {
                        var tempObj = GlobalIntellisenseRoot.get_from_global_dict(key);
                        var usage_obj = tempObj.get_usage();
                
                        var row_span = count_dictionary_items(usage_obj);
                        html += "<tr><td style='color:blue;font-weight:bold'><center>" + key + "</center></td>";
                    
                        html += "<td style='color:blue;font-weight:bold'><center>" + split_name(composition_class) + "</center></td>";

                        var type = tempObj.type;
                        html += "<td><center>" + type + "</center></td>";
                
                        html += "<td>";

                        for (var key in usage_obj) {
                            color = ((count % 2) == 0) ? "Indigo" : "Brown";
                            var code_str = usage_obj[key][1].get_code_string();
                            var class_where_used = usage_obj[key][1].get_where_used();
                            html += "<center><font color='" + color + "'><b>" + class_where_used + "</b>: " + code_str + "</font></center>";
                            ++count;
                        }

                        html += "</td>";
                    }
                }

                html += "</tbody></table>";

                $("#data_member_body").append(html);
            }

            $("#DataMembersPopup").modal('show');
        });
        
        
        if (!noDelete) {
            n.append("<img id='" + this.getHtmlIdName("function") + "' width=15 height=15 src='img/function.png' rel='tooltip' title='Show function calls'><\/img>");
            var func = $("#" + this.getHtmlIdName("function"));
            func.css({
                "visibility": "visible",
                "border-top-left-radius": "8px",
                "position": "absolute",
                "padding-right": 5,
                "padding-top": 3,
                "padding-left": 5,
                "padding-bottom": 2,
                "color": "white",
                "font-family": "sans-serif",
                "top": 0,
                "right": 105,
                "cursor": "pointer",
                "font-size": "10px",
                "background-color": "black",
                "z-index": 100
            });

            func.tooltip('hide');

            func.click( function(event) {
                var orig_node = get_node_from_id(graph, event.target.id);            
                var obj = orig_node.getIntellisenseObj();
                
                var functionCalls = $('#functionCalls');
                functionCalls.html(''); // clear the top element
                $('#openFunc').fadeIn();
        
                // Display all the function calls.
                g_class_name = obj['name'];
                var obj = GlobalIntellisenseRoot.defun[g_class_name];
                var class_members = obj.get_class_members("all");
                for (member in class_members) {
                    if (class_members[member]['type'] == 'function') {
                        functionCalls.append("<div class='functionsList'>" + member + "<\/div>")
                    }
                }
           });
         }
        
        }
        
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
        $('#openFunc').fadeOut();
        //openComp.fadeOut();
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
     

        // var total_height = nodeHeight - bar.height() - 8;
        var total_height = n.height() - bar.height();
        var text_height = total_height;

        // Add the 1st Textbox
        n.append("<div class='txt' id='" + this.getHtmlIdName("node_text") + "'" + " spellcheck='false' rel='popover' data-content='No Data Members' data-original-title='Data Members'><center><p id='" + this.getHtmlIdName("node_text_p") + "' style='padding-top:20px; font-size: 18px; font-family: sans-serif; font-weight:bold'></p></center></div>");
        var txt = $(".node .txt").last();
        var node_text_p = $("#" + this.getHtmlIdName("node_text_p"));
        var node_text;
        var node_text_name = this.getHtmlIdName("text_area");

        // node_text_p.click(function() {
            // txt.empty();
            // txt.append("<textarea id='" + node_text_name + "'></textarea>");
            // node_text = $("#" + node_text_name);
            // node_text.css({
            // "width" : nodeWidth - 16,
            // "height" : text_height - 17,
            // "resize" : "auto",
            // "overflow" : "auto",
            // "font-size" : "12px",
            // "font-family": "sans-serif",
            // "border": "none",
            // "color": "black",
            // "background": "-webkit-gradient(linear, left bottom, left top, from(#C35617), to(#F88017))",
             // // "background" : "-webkit-gradient(linear, left top, left bottom, from(#5AE), to(#036))",
            // "z-index" : 4,
            // });
        // });

        txt.css("position", "absolute");

        txt.css({
            // "width": nodeWidth - 8,
            "width" : nodeWidth,
            "height" : text_height,
            "readonly" : "readonly",
            "resize" : "none",
            "overflow" : "auto",
            "font-size" : "25px",
            "font-family": "sans-serif",
            "font-weight": "bold",
            "border": "none",
            "color": "black",
            "text-align" : "center",
            // "background": "-webkit-gradient(linear, left bottom, left top, from(#C35617), to(#F88017))",
            "background" : "-webkit-gradient(linear, left top, left bottom, from(#5AE), to(#036))",
            "z-index" : 4,
            "-webkit-border-radius" : "10px",
        });

        if (this.intellisenseObj != null && this.intellisenseObj.type != "defun")
            txt.css({ "background": "-webkit-gradient(linear, left bottom, left top, from(#C35617), to(#F88017))", });

        this.txt = txt;
        var src_code = this.getSourceCode();
        $("#" + this.getHtmlIdName("node_text_p")).text(this.getIntellisenseObjName());
        $("#" + this.getHtmlIdName("node_text")).attr('data-original-title', this.getIntellisenseObjName());

        this.populateClassMembers = function() {
            var intellisense_obj = this.getIntellisenseObj();
            if (intellisense_obj != null && intellisense_obj.type == "defun") {
            var str = "";
            try {
                var class_members = this.getIntellisenseObj().get_class_members("all");
                str = class_members_to_string(class_members);
            } catch(e) {
                // When no definition could be found.
            }
            // Now populate the members of the class into the data content
            $("#" + this.getHtmlIdName("node_text")).attr('data-content', str);
            }
            else if (intellisense_obj != null && intellisense_obj.type == "global_var") {
                var str = "Initial Data Definition: " + this.getIntellisenseObj().initial_data_type;
                str += "\nInitial Value: " + this.getIntellisenseObj().value;
                $("#" + this.getHtmlIdName("node_text")).attr('data-content', str);
            }

        }

        this.populateClassMembers();


        // Add the resizer
        n.append("<div class='resizer' />");
        var resizer = $(".node .resizer").last();

        resizer.css({
            "position" : "absolute",
            "z-index" : 10,
            "width" : "10px",
            "height" : "10px",
            "left" : nodeWidth - 11,
            "top" : nodeHeight - 11,
            "background-color" : "#F2F291",
            "font-size" : "1px",
            "border" : "1px solid gray",
            "cursor" : "pointer",
            "-webkit-border-radius" : "2px"
        });

        n.append("<div class='left'>");
        n.append("<div class='top'>");
        n.append("<div class='right'>");
        n.append("<div class='bottom'>");

        var left = $(".node .left").last();
        left.css("left", "-11px");

        var top = $(".node .top").last();
        top.css("top", "-11px");

        var right = $(".node .right").last();
        var bottom = $(".node .bottom").last();

        setupConnection(left);
        setupConnection(right);
        setupConnection(top);
        setupConnection(bottom);

        positionLeft();
        positionRight();
        positionTop();
        positionBottom();
        
        this.PopoverHide();

        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;

        function positionLeft() {
            left.css("top", n.height() / 2 - 5);
        }

        function positionRight() {
            right.css("left", n.width() + 1).css("top", n.height() / 2 - 5);
        }

        function positionTop() {
            top.css("left", n.width() / 2 - 5);
        }

        function positionBottom() {
            bottom.css("top", n.height() + 1).css("left", n.width() / 2 - 5);
        }

        function setupConnection(div) {
            div.css({
                "position" : "absolute",
                "width" : "10px",
                "padding" : 0,
                "height" : "10px",
                "background-color" : "#aaaaaa",
                "font-size" : "1px",
                "cursor" : "pointer"
            });
        }


        this.connectionPos = function(conn) {
            var loc = conn.position();
            var nLoc = n.position();
            var point = {};
            point.x = nLoc.left + loc.left + 5;
            point.y = nLoc.top - topHeight + loc.top - 7;
            return point;
        }

        function pausecomp(millis) 
{
var date = new Date();
var curDate = null;

do { curDate = new Date(); } 
while(curDate-date < millis);
} 
        
        function updateConnections() {
            for(var i in curr.connections) {
                var c = curr.connections[i];
                if(!c.removed) {
                    var nodeA = c.startNode.connectionPos(c.startConnection);
                    var nodeB = c.endNode.connectionPos(c.endConnection);
                    var updatePath = arrow(nodeA.x, nodeA.y, nodeB.x, nodeB.y, c.connType);
                    // c.attr("path", "M " + nodeA.x + " " + nodeA.y + " L " + nodeB.x + " " + nodeB.y);
                    c.attr("path", updatePath);
                }
            }

        }

        this.updateConnections = updateConnections;

        function addLink(e) {
            currentNode = curr;
            e.preventDefault();
            var link = paper.path("M 0 0 L 1 1");
            link.attr({
                "stroke-width" : 2
            });
            currentConnection = link;
            currentConnection.parent = $(this);

            curr.addConnection(link);
            var loc = $(this).position();
            var nLoc = n.position();
            var x = loc.left + nLoc.left + 5;
            var y = loc.top + nLoc.top - topHeight - 7;
            newNode = true;

            var id = setInterval(function () {
                var my = mouseY - 17;
                // link.attr("path", "M " + x + " " + y + " L " + mouseX + " " + my);
                var updatePath = arrow(x, y, mouseX, mouseY, "inheritance");
                link.attr("path", updatePath);
                pathEnd.x = mouseX;
                pathEnd.y = mouseY;
            }, 30);
            loops.push(id);
        }


        left.mousedown(addLink);
        right.mousedown(addLink);
        top.mousedown(addLink);
        bottom.mousedown(addLink);

        this.remove = function() {
            for(var i in curr.connections) {
                var c = curr.connections[i];
                c.remove();
                delete connections[c.id];
                delete curr.connections[i];
            }
            n.remove();
            delete nodes[this.id];
        }

        resizer.mousedown(function (e) {
            currentNode = curr;
            e.preventDefault();
            startDrag(resizer, {
                left: 20,
                top: 20,
                right: 500,
                bottom: 500
            }, function () {
                var loc = resizer.position();
                var x = loc.left;
                var y = loc.top;
                // var total_height = n.height() - bar.height() - 8;
                var total_height = n.height() - bar.height();
                var text_height = total_height;

                n.css({
                    "width": x + resizer.width() + 1,
                    "height": y + resizer.height() + 1
                });

                txt.css({
                    // "width": n.width() - 8,
                    "width" : n.width(),
                    "height": text_height,
                });

                positionLeft();
                positionRight();
                positionTop();
                positionBottom();
                updateConnections();
            });
        });

        bar.mousedown(function(e) {
            currentNode = curr;
            n.css("z-index", zindex++);
            e.preventDefault();
            startDrag(n, {
                left : 10,
                top : 40,
                right : win.width() - n.width() - 10,
                bottom : win.height() - n.height() - 10
            }, updateConnections);
        });

        n.mouseenter(function() {
            n.css("z-index", zindex++);
        });
    } // End of Node Class

    // ------------------------------------------------ NodeGraph Members ---------------------------------------------------
    function hitTest(a, b) {
        var aPos = a.position();
        var bPos = b.position();

        var aLeft = aPos.left;
        var aRight = aPos.left + a.width();
        var aTop = aPos.top;
        var aBottom = aPos.top + a.height();

        var bLeft = bPos.left;
        var bRight = bPos.left + b.width();
        var bTop = bPos.top;
        var bBottom = bPos.top + b.height();

        // http://tekpool.wordpress.com/2006/10/11/rectangle-intersection-determine-if-two-given-rectangles-intersect-each-other-or-not/
        return !(bLeft > aRight || bRight < aLeft || bTop > aBottom || bBottom < aTop
        );
    }

    function clear() {
        nodeId = 0;
        connectionsId = 0;
        for(var i in nodes) {
            nodes[i].remove();
        }

        node_name_id_mapping = {};
        //inheritanceClassLvl = [];
    }


    //====================Single class inheritance view===============================
    this.generateInheritanceTreeOf = function(classObj) {
        //var intellisense = GlobalIntellisenseRoot;
        var currentGraph = this;
        var inheritanceNodeHeight = defaultNodeHeight;
        var inheritanceNodeWidth = defaultNodeWidth;

        var startx = 50; var starty = 50;
        for(var i=0; i<inheritanceClassLvl.length; i++){
            for(var j=0; j<inheritanceClassLvl[i].length; j++) {
                if(classObj == inheritanceClassLvl[i][j]) {
                    var classLvl = i;
                    var obj = inheritanceClassLvl[i][j];
                    var originNode = currentGraph.addNode(startx, starty+i*1.6*inheritanceNodeHeight, inheritanceNodeWidth, inheritanceNodeHeight, obj);
                    node_name_id_mapping[obj.name] = originNode.getID();
                    var str = "";
                    try {
                        var class_members = obj.get_class_members("all");
                        str = class_members_to_string(class_members);
                    } catch(e) { }
                    originNode.txt[0].value = str;
                    originNode.txt[0].focus();

                    drawSupClassOf(originNode, classLvl, currentGraph);

                    //drawSubClassOf(originNode, classLvl, currentGraph);
                }
            }
        }

        //draw all super class node of given class node and connect them
        function drawSupClassOf(node, classLvl, currentGraph) {
            var obj = node.getIntellisenseObj();
            var subNode = node;
            for(var superClassObj=get_class_obj(obj.super_classes[0]); superClassObj; superClassObj=get_class_obj(superClassObj.super_classes[0])) {
                var supNode = currentGraph.addNode(startx, starty+ (--classLvl)*1.6*inheritanceNodeHeight, inheritanceNodeWidth, inheritanceNodeHeight, superClassObj);
                node_name_id_mapping[obj.name] = supNode.getID();
                var str = "";
                try {
                    var class_members = obj.get_class_members("all");
                    str = class_members_to_string(class_members);
                } catch(e) { }

                supNode.txt[0].value = str;

                supNode.txt[0].focus();

                createConnection(subNode, "top", supNode, "bottom", "inheritance");
                subNode = supNode;
            }
        }

        //draw all sub class node of give class node and connect them
        function drawSubClassOf(node, classLvl, currentGraph) {
            var originObj = node.getIntellisenseObj();
            var starty = 50;
            for(var i = classLvl + 1; i < inheritanceClassLvl.length; i++) {
                var startx = 50;
                for(var j = 0; j < inheritanceClassLvl[i].length; j++) {
                    var subClassObj = inheritanceClassLvl[i][j];
                    var controlClassObj = subClassObj;
                    for(var k = 0; k < i - classLvl; k++){
                        controlClassObj = get_class_obj(controlClassObj.super_classes[0]);
                    }
                    if(controlClassObj == originObj) {
                        var subNode = currentGraph.addNode(startx, starty+ i*1.6*inheritanceNodeHeight, inheritanceNodeWidth, inheritanceNodeHeight, subClassObj);
                        node_name_id_mapping[obj.name] = subNode.getID();
                        var str = "";
                        try {
                            var class_members = subClassObj.get_class_members("all");
                            str = class_members_to_string(class_members);
                        } catch(e) { }

                        subNode.txt[0].value = str;

                        subNode.txt[0].focus();

                        var supClass = subClassObj.super_classes[0]
                        var supNode = currentGraph.getNodeFromName(supClass);
                                //==========BUG HERE==============NO IDEA=========
                        if(supNode)
                            createConnection(subNode, "top", supNode, "bottom", "inheritance");
                        startx = startx + 1.5 * inheritanceNodeWidth;
                    }
                }
            }
        }

    }
    //====================END of single class inheritance view========================
    //==========================Inheritance Tree======================================
    this.generateInheritanceTree = function (display_globals) {
        var intellisense = GlobalIntellisenseRoot;
        var inheritanceNodeHeight = defaultNodeHeight;
        var inheritanceNodeWidth = defaultNodeWidth;

        var startx = 50; var starty = 50;
        for (var i = 0; i < inheritanceClassLvl.length; i++) {
            for(var j = 0; j < inheritanceClassLvl[i].length; j++) {
                var obj = inheritanceClassLvl[i][j];
                var node = this.addNode(startx+j*1.5*inheritanceNodeWidth, starty+i*1.6*inheritanceNodeHeight, inheritanceNodeWidth, inheritanceNodeHeight, obj);
                node_name_id_mapping[obj.name] = node.getID();
                var str = "";
                try {
                    var class_members = obj.get_class_members("all");
                    str = class_members_to_string(class_members);
                } catch(e) { }

                node.txt[0].value = str;

                node.txt[0].focus();
                currentNode = node;
            }
        }

        // Update the startx and start y
        starty += i * 1.6 * inheritanceNodeHeight;

        for (var key in intellisense.defun) {
            var obj = intellisense.defun[key];
            var node = this.getNodeFromName(obj.name);

            if (obj.super_classes) {
                for (var i = 0; i < obj.super_classes.length; ++i) {
                    var parent_class_name = obj.super_classes[i];
                    var parent_node = this.getNodeFromName(parent_class_name);
                    createConnection(node, "top", parent_node, "bottom", "inheritance");
                }
            }
        }

        if (display_globals == true) {
            // Now load the global variables 
            for (var key in GlobalIntellisenseRoot.global_vars) {
                var obj = intellisense.global_vars[key];
                var node = this.addNode(startx, starty, defaultNodeWidth, defaultNodeHeight, obj);
                node_name_id_mapping[obj.name] = node.getID();
                startx += defaultNodeWidth + 20;

                if (startx > win.width()) {
                    startx = 50;
                    starty += defaultNodeHeight + 20;
                }

                node.txt[0].focus();
                currentNode = node;
            }
        }
    }
    //========================end of Inheritance Tree====================================


    this.clearAll = function() {
        clear();
        // defaultNode();
        currentConnection = null;
        currenNode = null;
    }

    this.addNode = function(x, y, w, h, noDelete) {
        return new Node(x, y, w, h, noDelete);
    }

    this.addNodeAtMouse = function() {
    var w, h;
    if (currentNode == undefined) {
                w = defaultNodeWidth;
                h = defaultNodeHeight;
        }
        else {
                w = currentNode.width() || defaultNodeWidth;
                h = currentNode.height() || defaultNodeHeight;
            }
        var temp = this.addNode(mouseX, mouseY + 40, w, h);
        temp.PopoverHide();
        currentNode = temp;
        currentConnection = null;
    }

    this.getNodeFromName = function (name, node_type) {
        // Check if the node is already present or not.
        if (node_name_id_mapping.hasOwnProperty(name)) {
            var id = node_name_id_mapping[name];
            return nodes[id];
        } else {
            // Create a new node and store it. No Object associated
            var new_node = this.addNode(win.width() / 2, win.height() / 2, defaultNodeWidth, defaultNodeHeight, null);
        }
    }
    
    this.generateSingleNode = function (name, startx, starty, obj) {
        var node = this.addNode(startx, starty, defaultNodeWidth, defaultNodeHeight, obj);
        node_name_id_mapping[name] = node.getID();
        
        node.txt[0].focus();
        currentNode = node;
    }

//    this.generateNodes = function () {

//        var intellisense = GlobalIntellisenseRoot;
//        // Generate new Nodes based on the classes found.
//        var startx = 50; var starty = 100;
//        for (var key in intellisense.defun) {
//            var obj = intellisense.defun[key];
//            // var node = this.addNode(startx, starty, defaultNodeWidth, defaultNodeHeight, obj);
//            // node_name_id_mapping[obj.name] = node.getID();
//            startx += defaultNodeWidth + 20;
//            if (startx > win.width()) {
//                startx = 50;
//                starty += defaultNodeHeight + 20;
//            }

//            // Get the data members for this class
//            var str = "";
//            try {
//                var class_members = obj.get_class_members("all");
//                str = class_members_to_string(class_members);
//            } catch(e) { }

//            // node.txt[0].value = str;

//            // node.txt[0].focus();
//            // currentNode = node;
//        }

//        // this.generateInheritanceConnections();
//        this.generateInheritanceTree();

//        // Now load the global variables 
//        for (var key in intellisense.global_vars) {
//            var obj = intellisense.global_vars[key];
//            var node = this.addNode(startx, starty, defaultNodeWidth, defaultNodeHeight, obj);
//            node_name_id_mapping[obj.name] = node.getID();
//            startx += defaultNodeWidth + 20;

//            if (startx > win.width()) {
//                startx = 50;
//                starty += defaultNodeHeight + 20;
//            }

//            node.txt[0].focus();
//            currentNode = node;
//        }
//    }

    this.generateSingleCompositionConnection = function(obj, node) {
        // Now find all its parents and connect them
        if (obj.classes_where_composed != undefined) {
            for (var key in obj.classes_where_composed) {
                var composition_class_name = key;
                var composition_node = this.getNodeFromName(composition_class_name);

                var connectionPts = this.getConnectionPoints(node, composition_node);
                createConnection(node, connectionPts[0], composition_node, connectionPts[1], "composition");
            }
        }
    }

    this.generateSingleInheritanceConnection = function (obj, node) {
        // Now find all its parents and connect them
        if (obj.super_classes != undefined) {
            for (var i = 0; i < obj.super_classes.length; ++i) {
                var parent_class_name = obj.super_classes[i];
                var parent_node = this.getNodeFromName(parent_class_name);

                var connectionPts = this.getConnectionPoints(node, parent_node);
                createConnection(node, connectionPts[0], parent_node, connectionPts[1], "inheritance");
            }
        }
    }
    
    // Generate Connections between the nodes based on the inheritance data
    this.generateInheritanceConnections = function () {
        var intellisense = GlobalIntellisenseRoot;
        // For all global classes find it's parent
        for (var key in intellisense.defun) {
            var obj = intellisense.defun[key];
            var node = this.getNodeFromName(obj.name);

            this.generateSingleInheritanceConnection(obj, node);
        }
    }

    this.getConnectionPoints = function (node1, node2) {
        var connectionPts = ["top", "top"];

        var x1 = node1.x(); var y1 = node1.y();
        var x2 = node2.x(); var y2 = node2.y();
        var width1 = node1.width(); var width2 = node2.width();
        var height1 = node1.height(); var height2 = node2.height();

        if (x1 < x2) {
            if (y1 < y2 + height2) {
                connectionPts[1] = "bottom";
            }
            else if (y1 + height1 > y2) {
                connectionPts[1] = "top";
            }
            else {
                connectionPts[1] = "left";
            }

            connectionPts[0] = "right";
        }

        if (x1 > x2) {
            if (y1 < y2 + height2) {
                connectionPts[1] = "bottom";
            }
            else if (y1 + height1 > y2) {
                connectionPts[1] = "top";
            }
            else {
                connectionPts[1] = "right";
            }

            connectionPts[0] = "left";
        }

        return connectionPts;
    }

    this.add_node_name_mapping = function(obj, node) {
        node_name_id_mapping[obj.name] = node.getID();
    }
    
    //function defaultNode() {
    //	var temp = new Node(win.width() / 2 - defaultNodeWidth / 2, win.height() / 2 - defaultNodeHeight / 2, defaultNodeWidth, defaultNodeHeight, true);
    //	temp.txt[0].focus();
    //	currentNode = temp;
    //	temp.PopoverHide();
    //}
    //
    //defaultNode();
    
    
    this.fromJSON = function(data) {
        clear();
        for(var i in data.nodes) {
            var n = data.nodes[i];
            var ex = (i == "0") ? true : false;
            var temp = new Node(n.x, n.y, n.width, n.height, ex, n.id);
            var addreturns = n.txt.replace(/\\n/g, '\n');
            temp.txt.val(addreturns);
        }
        for(i in data.connections) {
            var c = data.connections[i];
            createConnection(nodes[c.nodeA], c.conA, nodes[c.nodeB], c.conB);
        }
    }

    this.toJSON = function() {
        var json = '{"nodes" : [';
        for(var i in nodes) {
            var n = nodes[i];
            json += '{"id" : ' + n.id + ', ';
            json += '"x" : ' + n.x() + ', ';
            json += '"y" : ' + n.y() + ', ';
            json += '"width" : ' + n.width() + ', ';
            json += '"height" : ' + n.height() + ', ';
            json += '"txt" : "' + addSlashes(n.txt.val()) + '"},';
        }
        json = json.substr(0, json.length - 1);
        json += '], "connections" : [';

        var hasConnections = false;
        for(i in connections) {
            var c = connections[i];
            if(!c.removed) {
                json += '{"nodeA" : ' + c.startNode.id + ', ';
                json += '"nodeB" : ' + c.endNode.id + ', ';
                json += '"conA" : "' + c.startConnection.attr("class") + '", ';
                json += '"conB" : "' + c.endConnection.attr("class") + '"},';
                hasConnections = true;
            }
        }
        if(hasConnections) {
            json = json.substr(0, json.length - 1);
        }
        json += ']}';
        return json;
    }

    function addSlashes(str) {
        str = str.replace(/\\/g, '\\\\');
        str = str.replace(/\'/g, '\\\'');
        str = str.replace(/\"/g, '\\"');
        str = str.replace(/\0/g, '\\0');
        str = str.replace(/\n/g, '\\\\n');
        return str;
    }

}
