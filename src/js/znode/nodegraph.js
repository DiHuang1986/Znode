var defaultNodeWidth = 200;
var defaultNodeHeight = 100;
var win = $(window);

var topHeight = 0;
var main_canvas_width = 0;
var main_canvas_height = 0;

function initialize() {
    topHeight = $("#top_toolbar").height();
    main_canvas_width = win.width();
    main_canvas_height = win.height() - topHeight;
}

function NodeGraph(canvas_id, canvas_width, canvas_height) {
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

    var paper = new Raphael(canvas_id, "100", "100");

    function resizePaper(width, height) {
        paper.setSize(width, height);
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
            var id = "#node_text1_" + this.id;
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
        
        canvas.append("<div class='node shadow'/>");
        var n = $(".node").last();
        n.css({
            "position" : "absolute",
            "left" : xp,
            "top" : yp,
            "width" : w,
            "height" : h,
            "border" : "1px solid black",
            "background" : "-webkit-gradient(linear, left top, left bottom, from(#5AE), to(#036))",
            "-webkit-border-radius" : "10px"
        });
        n.css("z-index", zindex++);

        if (this.intellisenseObj != null && this.intellisenseObj.type == "global_var")
            n.css({ "background": "-webkit-gradient(linear, left bottom, left top, from(#C35617), to(#F88017))" });

//        n.mouseup(function(){
//        g_selText = GetSelectedText();
//        if (g_selText.length != 0){
//            vsmenu.css({"left":mouseX - 10, "top":mouseY});
//            vsmenu.show();
//            }
//        });

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
                    return this.intellisenseObj.get_source_code();

                if (this.intellisenseObj.type == "global_var") {
                    var str = "Initial Data Definition: " + this.intellisenseObj.initial_data_type;
                    str += "\nInitial Value: " + this.intellisenseObj.value;
                    return str;
                }
            }

            return "No Source Defined";
        }

        if (!noDelete) {
            n.append("<img id='inheritance_" + this.id + "' width=15 height=15 src='img/inheritance.png'><\/img>");
            var inheritance = $("#inheritance_" + this.id);
            inheritance.css({
                "visibility": "hidden",
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

            inheritance.click(function (event) {
                var clicked_element = event.target.id;
                var id = parseInt(clicked_element.split("_")[1]);

                var inheritance_graph = new NodeGraph(inheritance_canvas_id);
                var orig_node = graph.getNode(id);

                $("#InheritanceView").css({ width: win.width() - 300, height: win.height() - 250, background: "#444444", top: 300, left: 400 });
                $("#InheritanceView").modal('show');
                // inheritance_graph.addNode(50, 50, defaultNodeWidth, defaultNodeHeight, false);

                var startx = 100; var starty = 100;
                // Get the object
                var obj = orig_node.getIntellisenseObj();
                var node = inheritance_graph.addNode(startx, starty, defaultNodeWidth, defaultNodeHeight, obj);
                inheritance_graph.add_node_name_mapping(obj, node);

                startx += defaultNodeWidth + 20; starty += defaultNodeHeight + 20;

                for (var i = 0; i < obj.super_classes.length; ++i) {
                    var base_class_name = obj.super_classes[i];
                    var base_class_obj = GlobalIntellisenseRoot.get_from_global_dict(base_class_name);

                    var base_class_node = inheritance_graph.addNode(startx, starty, defaultNodeWidth, defaultNodeHeight, base_class_obj);

                    inheritance_graph.add_node_name_mapping(base_class_obj, base_class_node);

                    startx += defaultNodeWidth + 20; starty += defaultNodeHeight + 20;
                }

                inheritance_graph.generateSingleInheritanceConnection(obj, node);
            });
        }

        if (!noDelete) {
            n.append("<img id='composition_" + this.id + "' width=15 height=15 src='img/composition.png'><\/img>");
            var composition = $("#composition_" + this.id);
            composition.css({
                "visibility": "hidden",
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
        }

        if (!noDelete) {
            n.append("<img id='usage_" + this.id + "' width=15 height=15 src='img/usage.png'><\/img>");
            var usage = $("#usage_" + this.id);
            usage.css({
                "visibility": "hidden",
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
        }

        function viewButtonsToggle(show) {
            if (show == false) {
                inheritance.css({ 'visibility': 'hidden' });
                composition.css({ 'visibility': 'hidden' });
                usage.css({ 'visibility': 'hidden' });
            } else {
                inheritance.css({ 'visibility': 'visible' });
                composition.css({ 'visibility': 'visible' });
                usage.css({ 'visibility': 'visible' });                
            }
        }


        n.append("<div class='bar'><center><b>" + this.getIntellisenseObjName() + "</center></div>");
        var bar = $(".node .bar").last();
        bar.css({
            "border-top-left-radius": "8px",
            "border-top-right-radius": "8px",
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

        bar.click(function () {
            viewButtonsToggle(!viewButtonsEnabled);
            viewButtonsEnabled = !viewButtonsEnabled;
        });
        

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

        var total_height = nodeHeight - bar.height() - 10;
        var text1_height = total_height / 2;
        var text2_height = total_height / 2;

        // Add the 1st Textbox
        n.append("<textarea class='txt' id='node_text1_" + this.id + "'" + " spellcheck='false' rel='popover' data-content='No Source Currently' data-original-title='Source Code'/>");
        var txt = $(".node .txt").last();
        txt.css("position", "absolute");

        txt.css({
            "width": nodeWidth - 8,
            "height" : text1_height,
            "resize" : "none",
            "overflow" : "auto",
            "font-size" : "12px",
            "font-family": "sans-serif",
            "font-weight": "bold",
            "border": "none",
            "color": "white",
            "background" : "-webkit-gradient(linear, left top, left bottom, from(#5AE), to(#036))",
            "z-index" : 4
        });

        if (this.intellisenseObj != null && this.intellisenseObj.type == "global_var")
            txt.css({ "background": "-webkit-gradient(linear, left bottom, left top, from(#C35617), to(#F88017))" });

        this.txt = txt;
        var src_code = this.getSourceCode();
        $("#node_text1_" + this.id).attr('data-original-title', this.getIntellisenseObjName());
        $("#node_text1_" + this.id).attr('data-content', src_code);

        // Add the 2nd TextBox
        n.append("<textarea class='txt' id='node_text2_" + this.id + "'" + " spellcheck='false' rel='popover' data-content='No Source Currently' data-original-title='Source Code'/>");
        var txt2 = $(".node .txt").last();
        txt2.css("position", "relative");

        txt2.css({
            "width": nodeWidth - 8,
            "height": text2_height - 8,
            "top" : text1_height + 8,
            "resize": "none",
            "overflow": "auto",
            "font-size": "12px",
            "font-family": "sans-serif",
            "border": "none",
            "color": "white",
            "background": "-webkit-gradient(linear, left top, left bottom, from(#FBB917), to(#AF7817))",
            "z-index": 4
        });

        if (this.intellisenseObj != null && this.intellisenseObj.type == "global_var")
            txt2.css({ "background": "-webkit-gradient(linear, left bottom, left top, from(#C35617), to(#F88017))" });

        this.txt2 = txt2;
        var src_code = this.getSourceCode();
        $("#node_text2_" + this.id).attr('data-original-title', this.getIntellisenseObjName());
        $("#node_text2_" + this.id).attr('data-content', src_code);


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
            "-webkit-border-radius" : "3px"
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
                var updatePath = arrow(x, y, mouseX, mouseY, type, "inheritance");
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
                var total_height = n.height() - bar.height() - 10;
                var text1_height = total_height / 2;
                var text2_height = text1_height - 8;

                n.css({
                    "width": x + resizer.width() + 1,
                    "height": y + resizer.height() + 1
                });

                txt.css({
                    "width": n.width() - 8,
                    "height": text1_height
                });

                txt2.css({
                    "width": n.width() - 8,
                    "top": text1_height + 8,
                    "height": text2_height + 1
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
    }


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

    this.generateNodes = function () {

        var intellisense = GlobalIntellisenseRoot;
        // Generate new Nodes based on the classes found.
        var startx = 50; var starty = 100;
        for (var key in intellisense.defun) {
            var obj = intellisense.defun[key];
            var node = this.addNode(startx, starty, defaultNodeWidth, defaultNodeHeight, obj);
            node_name_id_mapping[obj.name] = node.getID();
            startx += defaultNodeWidth + 20;
            if (startx > win.width()) {
                startx = 50;
                starty += defaultNodeHeight + 20;
            }

            // Get the data members for this class
            var class_members = obj.get_class_members("all");
            var str = class_members_to_string(class_members);

            node.txt[0].value = str;

            node.txt[0].focus();
            currentNode = node;
        }

        this.generateInheritanceConnections();

        // Now load the global variables 
        for (var key in intellisense.global_vars) {
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

    this.generateSingleCompositionConnection = function(obj, node) {
        // Now find all its parents and connect them
        for (var i = 0; i < obj.classes_where_composed.length; ++i) {
            var composition_class_name = obj.classes_where_composed[i];
            var composition_node = this.getNodeFromName(composition_class_name);

            var connectionPts = this.getConnectionPoints(node, composition_node);
            createConnection(node, connectionPts[0], composition_node, connectionPts[1], "composition");
        }
    }

    this.generateSingleInheritanceConnection = function (obj, node) {
        // Now find all its parents and connect them
        for (var i = 0; i < obj.super_classes.length; ++i) {
            var parent_class_name = obj.super_classes[i];
            var parent_node = this.getNodeFromName(parent_class_name);

            var connectionPts = this.getConnectionPoints(node, parent_node);
            createConnection(node, connectionPts[0], parent_node, connectionPts[1], "inheritance");
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
