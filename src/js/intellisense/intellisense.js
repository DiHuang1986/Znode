// Look at the object and create global vars.
function create_global_vars(obj) {
    // Now loop through the block variable of all the objects and create globals
    if (Introspect.typeOf(obj) == "object") {
        // First see if we have a variable
        var global_obj = factory(obj.name, obj.type, type_object, obj.token, null, []);
        GlobalIntellisenseRoot.add_obj("global_var", global_obj);
        switch(obj.type) {
            case "for-in":
                var name1 = global_obj.loop_var1;
                var name2 = global_obj.loop_var2;

                var global_obj1 = factory(name1, name1.type, type_object, name1.token, null, []);
                var global_obj2 = factory(name2, name2.type, type_object, name2.token, null, []);
                
                GlobalIntellisenseRoot.add_obj("global_var", global_obj1);
                GlobalIntellisenseRoot.add_obj("global_var", global_obj2);
                break;

            case "for_loop":
                break;
            
            case "while_loop":
                break;
                
            case "switch_case":
                break;
                
            case "try_catch":
                break;      
        }
    }
    else {
        alert("Invalid object sent to create global variables");
    }
}


////////////////////////////////////// Helper Functions ////////////////////////////////////////
function parse_expr(expr, keep_this) {
    var str = "";
    while (expr.child != null) {
        if (keep_this || expr.name != "this") {
            str += expr.name + ".";
        }
        expr = expr.child;
    }
    
    str += expr.name;
    return str;
}
    
/////////////////////////////////////////////////////// Helper Functions ////////////////////////////////////////////////
// Walk the ast tree
function walk_tree(ast) {
    var walker = {
        "assign": function () {
            var assign_expr = new assign_expression();
            assign_expr.token = this.parent;
            assign_expr.type = "assign_expr";
            assign_expr.left_expr = walk_tree(ast[2]);

            // Handle a special case in which the rhs could be a function. In this case the function name doesn't show
            // up in the ast and hence we need to manually feed it.
            if (ast[3][0]["name"] == "function" && ast[3][1] == null) {
                ast[3][1] = parse_expr(assign_expr.left_expr, true);
            }

            assign_expr.right_expr = walk_tree(ast[3]);

            assign_expr.name = assign_expr.left_expr.name;
            assign_expr.right_expr.token = this.parent;
            assign_expr.left_expr.token = this.parent;
            assign_expr.left_expr.ast = ast;
            assign_expr.right_expr.ast = ast;
            return assign_expr;
        },

        "var": function () {
            var assign_expr = new assign_expression();
            assign_expr.token = this.parent;
            assign_expr.type = "assign_expr";

            assign_expr.left_expr = factory(ast[1][0][0], "var", type_object);
            assign_expr.left_expr.token = this.parent;
            // assign_expr.left_expr.name = ast[1][0][0];
            assign_expr.right_expr = walk_tree(ast[1][0][1]);
            assign_expr.name = assign_expr.left_expr.name;

            return assign_expr;
        },

        "stat": function () {
            return walk_tree(ast[1]);
        },

        "dot": function () {
            var dot_obj = walk_tree(ast[1]);
            dot_obj.child = new type_object();
            dot_obj.child.name = ast[2];
            dot_obj.child.parent = dot_obj;
            return dot_obj;
        },

        "name": function () {
            var new_obj = new type_object();
            new_obj.token = this.parent;
            new_obj.type = "name";
            new_obj.name = ast[1];
            return new_obj;
        },

        "new": function () {
            var expr = walk_tree(ast[1]);
            expr.token = this.parent;
            expr.type = "composition";
            return expr;
        },

        "function": function () {
            var func = factory(ast[1], "function", type_function, this.parent, null, ["function", ast[1], ["toplevel", [ast]], ast[2]]);
            
            // This is a hack. Not the right way but we don't have time to do anything more.
            // We don't need to add to global intellisense root if it's a local function. We are 
            // going to do it inside the defun parse call itself again with the qualified name.
            delete GlobalIntellisenseRoot.obj_dict[ast[1]];

            func.token = this.parent;
            return func;
        },

        "call": function () {
            // Call the function. At this point if it is embedded in another function then its
            // data members are inherited.
            var call_obj = new type_object();
            call_obj.type = "call";
            call_obj.token = this.parent;
            var called_obj = walk_tree(ast[1]);
            call_obj.name = called_obj.name;
            call_obj.obj = called_obj;
            return call_obj;
        },

        "defun": function () {
            var func = factory(ast[1], "defun", type_function, this.parent, null, ["defun", ast[1], ["toplevel", [ast]], ast[2]]);
            func.token = this.parent;
            return func;
        },

        "return": function () {
            var return_expr = new type_expression();
            return_expr.token = this.parent;
            return_expr.type = "return_expr";
            return_expr.expr = walk_tree(ast[1]);
            return return_expr;
        },

        "string": function () {
            var obj = new type_object();
            obj.token = this.parent;
            obj.type = "string";
            obj.value = ast[1];
            return obj;
        },

        "num": function () {
            var obj = new type_object();
            obj.token = this.parent;
            obj.type = "num";
            obj.value = ast[1];
            return obj;
        },

        "binary": function () {
            var binary_expr = new binary_expression();
            binary_expr.token = this.parent;
            binary_expr.type = "binary_expr";
            binary_expr.binary_lhs = walk_tree(ast[2]);
            binary_expr.binary_rhs = walk_tree(ast[3]);
            return binary_expr;
        },

        "unary-prefix": function() {
            var unary_expr = new type_unary_expr();
            unary_expr.name = ast[2][1];
            unary_expr.unary = ast[1];
            unary_expr.token = this.parent;
            return unary_expr;
        },

        "unary-postfix": function() {
            var unary_expr = new type_unary_expr();
            unary_expr.name = ast[2][1];
            unary_expr.unary = ast[1];
            unary_expr.token = this.parent;
            return unary_expr;              
        },

        "for" : function() {
            var for_expr = new type_for_loop();
            for_expr.loop_var1 = walk_tree(ast[1]);
            for_expr.binary_expr = walk_tree(ast[2]);
            for_expr.increment_decrement = walk_tree(ast[3]);
            var block = walk_tree(ast[4]);

            for_expr.block = block.lines;

            for_expr.token = this.parent;
            for_expr.type = "for_loop";
            return for_expr;
        },

        "for-in" : function() {
            var for_expr = new type_for_loop();
            for_expr.type = "for-in";
            for_expr.loop_var1 = walk_tree(ast[1]);
            for_expr.loop_var2 = walk_tree(ast[3]);
            var block = walk_tree(ast[4]);
            for_expr.block = block.lines;
            for_expr.token = this.parent;
            return for_expr;
        },

        "block" : function() {
            var block_expr = new type_block();

            for (var key in ast[1]) {
                var line_obj = walk_tree(ast[1][key]);
                block_expr.lines.push(line_obj);
            }

            return block_expr;
        },

        "if": function () { },

        "do": function () {
            var while_expr = new type_while_loop();
            while_expr.type = "while_loop";

            while_expr.loop_var = walk_tree(ast[1]);
            var block_expr = walk_tree(ast[2]);

            while_expr.block = block_expr.lines;
            while_expr.name = while_expr.loop_var.name;
            while_expr.token = this.parent;

            return while_expr;            
        },

        "while": function () { 
            var while_expr = new type_while_loop();
            while_expr.type = "while_loop";
            
            while_expr.loop_var = walk_tree(ast[1]);
            
            var block_expr = walk_tree(ast[2]);
    
            while_expr.block = block_expr.lines;
            while_expr.name = while_expr.loop_var.name;
            while_expr.token = this.token;

            return while_expr; 
        },

        "switch": function () { 
            var switch_expr = new type_switch_case();
            switch_expr.type = "switch_case";
            switch_expr.switch_var = ast[1][1];
            switch_expr.name = switch_expr.switch_var;
            for (var i = 0; i < ast[2].length; ++i) {
                // ast[2][i][0] -- Case call
                for (var j = 0; j < ast[2][i][1].length; ++j) {
                    var case_obj = walk_tree(ast[2][i][1][j]);
                    switch_expr.block.push(case_obj);
                }
            }
            switch_expr.token = this.parent;

            return switch_expr;
        },

        "case": function () { },

        "sub": function () {
            // Array subscript 
            var array_obj = walk_tree(ast[1]);
            var array_subscript = walk_tree(ast[2]);
            var sub_expr = new type_array_subscript();
            sub_expr.array = array_obj;
            sub_expr.subscript = array_subscript;
            
            sub_expr.name = array_obj.name;
            sub_expr.token = this.parent;
            sub_expr.type = "array_subscript";
            return sub_expr;
        },

        "break" : function() {
            // Do nothing
        },

        "try" : function() {
            var try_expr = new type_try_catch();
            try_expr.type = "try_catch";
            
            for (var j = 1; j < 3; ++j) {
                for (var i = 0; i < ast[1].length; ++i) {
                    try_expr.block.push(walk_tree(ast[1][i]));
                }
            }

            try_expr.token = this.parent;

            return try_expr;
        },
    }
    
    this.parent = ast[0];
    
    var token_str = "";
    
    if (Introspect.typeOf(this.parent) == "object") {
        token_str = this.parent.name;
    } else {
        token_str = this.parent;
    }

    // Debug Code... If we encounter something for which we haven't speculated yet. Lets see it
    var myImplementedList = ["binary", "num", "string", "return", "defun", "call", "function", "new", "name",
                             "dot", "stat", "var", "assign", "if", "do", "while", "switch", "case", "sub", 
                             "unary-prefix", "for", "block", "break", "try", "for-in"];

    if (myImplementedList.indexOf(token_str) == -1)
        alert("Unimplemented token: " + token_str);
    
    var func = walker[token_str];
    
    if (func == undefined)
        return undefined;

    return func(ast);
}

function parse_defun(func_name, ast) {
    var defun_func = walk_tree(ast);
    var usage_obj = new type_usage();
    usage_obj.code_str = gen_code(["toplevel", [ast]], { beautify : true });
    usage_obj.line = defun_func.token.start.line;
    
    defun_func.add_usage(usage_obj, "Class Definition");
    GlobalIntellisenseRoot.add_obj("defun", defun_func);
    return defun_func;
}

function parse_call(ast) {
    var call_obj = walk_tree(ast);
    if (call_obj.name != "this") {
        var usage_obj = create_usage_object(call_obj.name, ast, call_obj.token.start.line);
        
        // Get the object for this one.
        var call_function_obj = factory(call_obj.name, "call", type_function_call, call_obj.token, null, null);
        call_function_obj.add_usage(usage_obj, "Function Call");
    }
    
    return call_obj;
}

function parse_prototype_ast(ast) {
    var prototype_expr = null;
    prototype_expr = walk_tree(ast);
    
    var left_expr = prototype_expr.left_expr;
    var left_usage_obj = create_usage_object(prototype_expr.left_expr.name, ast, prototype_expr.token.start.line);
    
    var right_expr = prototype_expr.right_expr;
    var right_usage_obj = create_usage_object(prototype_expr.right_expr.name, ast, prototype_expr.token.start.line);
    
    var code = gen_code(["toplevel", [ast]]);

    // Find the classes to setup the inheritance
    var inherited_class = factory(left_expr.name, "defun", type_function, prototype_expr.token, null, null);
    var base_class = factory(right_expr.name, "defun", type_function, prototype_expr.token, null, null);
    
    inherited_class.super_classes.push(base_class.name);
    inherited_class.add_usage(left_usage_obj, "Prototype");
    
    base_class.sub_classes.push(inherited_class.name);
    base_class.add_usage(right_usage_obj, "Prototype");
    
    return prototype_expr;
}

function parse_global_vars(ast) {
    var global_var_expr = walk_tree(ast);
    var right_expr = global_var_expr.right_expr;
    // Now we get the left expr and add its usage
    var left_expr = global_var_expr.left_expr;
    var left_expr_usage_obj = create_usage_object(left_expr.name, ast, left_expr.token.start.line);    
    
    if (GlobalIntellisenseRoot.is_defun_present(right_expr.name)) {
        right_expr.type = "defun";
    }
    else if (GlobalIntellisenseRoot.is_global_var_present(right_expr.name)) {
        right_expr.type = "global_var";
    }       
    
    left_expr.add_usage(left_expr_usage_obj, right_expr.type);
    left_expr.type = "global_var";

    // Set the value for the left expression.
    left_expr.value = right_expr.value;
    if (right_expr.type == "defun") {
        left_expr.initial_data_type = "Function";
        left_expr.value = right_expr.name;
    }
    else
        left_expr.initial_data_type = right_expr.type;

    GlobalIntellisenseRoot.add_obj("global_var", left_expr);
}

function parse_for_loop(ast) {
    var for_expr = walk_tree(ast);
    create_global_vars(for_expr);
    // Now check the variables value
    return for_expr;
}

function parse_while_loop(ast) {
    var while_expr = walk_tree(ast);
    create_global_vars(while_expr);
    return while_expr;
}

function parse_switch_case(ast) {
    var switch_expr = walk_tree(ast);
    create_global_vars(switch_expr);
    return switch_expr;
}

function parse_try_catch(ast) {
    var try_catch_expr = walk_tree(ast);
    create_global_vars(try_catch_expr);
    return try_catch_expr;
}