function serialize_binary_expr(expr, return_array) {
    if (expr.left_expr.type != "binary_expr" && expr.right_expr.type != "binary_expr") {
        return_array.push(expr);
    }
    else {
        if (expr.left_expr.type == "binary_expr")
            return_array = serialize_binary_expr(expr.left_expr, return_array);
        else
            return_array.push(expr.left_expr);

        if (expr.right_expr.type == "binary_expr")
            return_array = serialize_binary_expr(expr.right_expr, return_array);
        else
            return_array.push(expr.right_expr);
    }

    return return_array;
}

// token is optional for objects like unary_expr
// Add the type too for usage.
function add_single_object(single_obj, type, keyword_to_match, ast, class_where_used, token) {
    if (single_obj.name != "document") {
        try {
            if (single_obj.type == keyword_to_match && single_obj.name != "this") {

                var global_obj = factory(single_obj.name, type, type_object, single_obj.token, null, []);
                var usage_obj;

                try {
                    usage_obj = create_usage_object(single_obj.name, ast, single_obj.token.start.line, class_where_used);
                } catch (e) {
                    usage_obj = create_usage_object(single_obj.name, ast, single_obj.token, class_where_used);
                }

                global_obj.add_usage(usage_obj, type);
                global_obj.type = "global_var";

                GlobalIntellisenseRoot.add_obj("global_var", global_obj);
            }
        } catch(e) {
            // This might be a unary expr. Then single_obj is just a name
            var global_obj = factory(single_obj, "num", type_object, single_obj, token, null, []);

            var usage_obj = create_usage_object(single_obj, ast, token.start.line, class_where_used);
            global_obj.add_usage(usage_obj, "num");

            GlobalIntellisenseRoot.add_obj("global_var", global_obj);
        }
    }
}

// Add the objects based on whether they are assign expressions or binary_expressions etc
function add_expressions(obj, keyword_to_match, ast, class_where_used) {
    // Decide which ast to send
    var ast_to_send = (ast == undefined) ? obj.ast : ast;

    if (obj.type == "assign_expr" || obj.type == "binary_expr") {

        add_single_object(obj.left_expr, obj.right_expr.type, "name", ast_to_send, class_where_used);
        add_single_object(obj.right_expr, obj.right_expr.type, "name", ast_to_send, class_where_used);

    } else if (obj.type == "unary_expr") {

        add_single_object(obj.name, "num", "name", ast_to_send, class_where_used, obj.token);        
    }
}

// Look at the object and create global vars.
function create_global_vars(obj, class_where_used) {
    // Now loop through the block variable of all the objects and create globals
    if (Introspect.typeOf(obj) == "object") {

        if (obj.type == "for-in" || obj.type == "for_loop" || obj.type == "while_loop" ||
            obj.type == "if_expr" || obj.type == "switch_case" || obj.type == "try_catch") {
            // First see if we have a variable
            switch(obj.type) {
                case "for-in":
                    var name1 = obj.loop_var1;
                    var name2 = obj.loop_var2;

                    add_single_object(name1, "name", obj.ast, class_where_used);
                    add_single_object(name2, "name", obj.ast, class_where_used);

                    break;

                case "for_loop":
                    var assign_expr = obj.loop_var1;
                    add_expressions(assign_expr, "name", obj.ast, class_where_used);

                    var binary_expr = obj.binary_expr;
                    add_expressions(binary_expr, "name", obj.ast, class_where_used);

                    var increment_decrement_expr = obj.increment_decrement;
                    add_expressions(increment_decrement_expr, "name", obj.ast, class_where_used);
                    break;
            
                case "while_loop":
                case "if_expr":
                    var bin_expr = obj.binary_expr;
                    
                    if (bin_expr == "name") {
                        add_single_object(bin_expr, bin_expr.type, "name", bin_expr.ast, class_where_used, bin_expr.token);
                    }

                    if (bin_expr == "binary_expr") {
                        add_expressions(bin_expr, "name", bin_expr.ast, class_where_used);
                    }

                    // Now this should be a list
                    for (var i = 0; i < bin_expr.length; ++i) {
                        add_expressions(bin_expr[i], "name", obj.ast, class_where_used);
                    }
                
                    break;

                case "switch_case":
                    var switch_var = obj.switch_var;
                    add_single_object(switch_var, switch_var.type, "name", obj.ast, class_where_used);
                    break;

                case "try_catch":
                    break;      
            }

            // Now get the blocks and parse them too
            var block = obj.block;
            
            if (block.type == "block_expr") {
                for (var i = 0; i < block.length; ++i) {
                    create_global_vars(block[i]);
                }
            }
            else if (block.type == "assign_expr" || block.type == "binary_expr") {
                add_expressions(block, "name", block.ast, class_where_used);
            }
            else {
                add_single_object(block, block.type, "name", block.ast, class_where_used, block.token);
            }


        } else {
            switch(obj.type) {
                case "assign_expr":
                add_expressions(obj, "name", obj.ast, class_where_used);
                break;

                case "composition":
                add_expressions(obj, "name", obj.ast, class_where_used);
                break;

                case "call":
                for (var i = 0; i < obj.args.length; ++i) {
                    add_single_object(obj.args[i], obj.args[i].type, "name", obj.ast, class_where_used);
                }
                break;

                case "binary_expr":
                add_expressions(obj, "name", obj.ast, class_where_used);
                break;

                case "unary_expr":
                add_expressions(obj, "name", obj.ast, class_where_used);
                break;
            }    
        }
    } else {
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
            var parent_clone = clone(this.parent);
            var assign_expr = new assign_expression();
            assign_expr.token = this.parent;
            assign_expr.type = "assign_expr";
            assign_expr.left_expr = walk_tree(ast[2]);
            assign_expr.ast = ast;

            // Handle a special case in which the rhs could be a function. In this case the function name doesn't show
            // up in the ast and hence we need to manually feed it.
            if (ast[3][0]["name"] == "function" && ast[3][1] == null) {
                ast[3][1] = parse_expr(assign_expr.left_expr, true);
            }

            assign_expr.right_expr = walk_tree(ast[3]);

            assign_expr.name = assign_expr.left_expr.name;
            assign_expr.right_expr.token = parent_clone;
            assign_expr.left_expr.token = parent_clone;
            assign_expr.left_expr.ast = ast;
            assign_expr.right_expr.ast = ast;
            return assign_expr;
        },

        "var": function () {
            var parent_clone = clone(this.parent);
            var assign_expr = new assign_expression();
            assign_expr.token = parent_clone;
            assign_expr.type = "assign_expr";
            assign_expr.ast = ast;

            assign_expr.left_expr = factory(ast[1][0][0], "var", type_object);
            assign_expr.left_expr.token = this.parent;

            if (ast[1][0].length > 1) {
                assign_expr.right_expr = walk_tree(ast[1][0][1]);
            } else {
                assign_expr.right_expr = new type_ignore();
            }
            assign_expr.name = assign_expr.left_expr.name;

            return assign_expr;
        },

        "stat": function () {
            return walk_tree(ast[1]);
        },

        "dot": function () {
            var parent_clone = clone(this.parent);
            var dot_obj = walk_tree(ast[1]);
            dot_obj.child = new type_object();
            dot_obj.child.name = ast[2];
            dot_obj.child.parent = dot_obj;
            dot_obj.ast = ast;
            dot_obj.token = parent_clone;
            return dot_obj;
        },

        "name": function () {
            var parent_clone = clone(this.parent);
            var new_obj = new type_object();
            new_obj.token = parent_clone;
            new_obj.type = "name";
            new_obj.name = ast[1];
            new_obj.ast = ast;
            return new_obj;
        },

        "new": function () {
            var parent_clone = clone(this.parent);
            var expr = walk_tree(ast[1]);
            expr.token = parent_clone;
            expr.type = "composition";
            expr.ast = ast;
            return expr;
        },

        "function": function () {
            var parent_clone = clone(this.parent);
            var func = factory(ast[1], "function", type_function, this.parent, null, ["function", ast[1], ["toplevel", [ast]], ast[2]]);

            func.token = parent_clone;
            return func;
        },

        "call": function () {
            // Call the function. At this point if it is embedded in another function then its
            // data members are inherited.
            var parent_clone = clone(this.parent);
            var call_obj = new type_function_call();
            call_obj.type = "call";
            call_obj.token = parent_clone;
            call_obj.called_obj = walk_tree(ast[1]);
            call_obj.ast = ast;

            // Look at the arguments
            for (var i = 0; i < ast[2].length; ++i) {
                call_obj.args.push(walk_tree(ast[2][i]));
            }

            return call_obj;
        },

        "defun": function () {
            var parent_clone = clone(this.parent);
            var func = factory(ast[1], "defun", type_function, this.parent, null, ["defun", ast[1], ["toplevel", [ast]], ast[2]]);
            func.token = parent_clone;
            return func;
        },

        "return": function () {
            var parent_clone = clone(this.parent);
            var return_expr = new type_expression();
            return_expr.token = parent_clone;
            return_expr.type = "return_expr";
            return_expr.expr = walk_tree(ast[1]);
            return_expr.ast = ast;
            return return_expr;
        },

        "string": function () {
            var parent_clone = clone(this.parent);
            var obj = new type_object();
            obj.token = parent_clone;
            obj.type = "string";
            obj.value = ast[1];
            obj.ast = ast;
            return obj;
        },

        "num": function () {
            var parent_clone = clone(this.parent);
            var obj = new type_object();
            obj.token = parent_clone;
            obj.type = "num";
            obj.value = ast[1];
            obj.ast = ast;
            return obj;
        },

        "binary": function () {
            var parent_clone = clone(this.parent);
            var binary_expr = new binary_expression();
            binary_expr.token = parent_clone;
            binary_expr.type = "binary_expr";
            binary_expr.left_expr = walk_tree(ast[2]);
            binary_expr.right_expr = walk_tree(ast[3]);
            binary_expr.ast = ast;
            return binary_expr;
        },

        "unary-prefix": function () {
            var parent_clone = clone(this.parent);
            var unary_expr = new type_unary_expr();
            unary_expr.type = "unary_expr";
            unary_expr.name = ast[2][1];
            unary_expr.unary = ast[1];
            unary_expr.token = parent_clone;
            unary_expr.ast = ast;
            return unary_expr;
        },

        "unary-postfix": function () {
            var parent_clone = clone(this.parent);
            var unary_expr = new type_unary_expr();
            unary_expr.type = "unary_expr";
            unary_expr.name = ast[2][1];
            unary_expr.unary = ast[1];
            unary_expr.token = parent_clone;
            unary_expr.ast = ast;
            return unary_expr;
        },

        "for": function () {
            var parent_clone = clone(this.parent);
            var for_expr = new type_for_loop();
            for_expr.loop_var1 = walk_tree(ast[1]);
            for_expr.binary_expr = walk_tree(ast[2]);
            for_expr.increment_decrement = walk_tree(ast[3]);
            var block = walk_tree(ast[4]);

            for_expr.block = block.lines;

            for_expr.token = parent_clone;
            for_expr.type = "for_loop";
            for_expr.ast = ast;
            return for_expr;
        },

        "for-in": function () {
            var parent_clone = clone(this.parent);
            var for_expr = new type_for_loop();
            for_expr.type = "for-in";
            for_expr.loop_var1 = walk_tree(ast[1]);
            for_expr.loop_var2 = walk_tree(ast[3]);
            var block = walk_tree(ast[4]);
            for_expr.block = block.lines;
            for_expr.token = parent_clone;
            for_expr.ast = ast;
            return for_expr;
        },

        "block": function () {
            var parent_clone = clone(this.parent);
            var block_expr = new type_block();
            block_expr.type = "block_expr";
            block_expr.token = parent_clone;

            for (var key in ast[1]) {
                var line_obj = walk_tree(ast[1][key]);
                block_expr.lines.push(line_obj);
            }

            block_expr.ast = ast;

            return block_expr;
        },

        "if": function () {
            var parent_clone = clone(this.parent);
            var if_expr = new type_if_expr();
            if_expr.type = "if_expr";
            if_expr.token = parent_clone;
            if_expr.ast = ast;
            if_expr.binary_expr = walk_tree(ast[1]);

            var serialized_list = [];
            if (if_expr.binary_expr.type == "binary_expr")
                if_expr.binary_expr = serialize_binary_expr(if_expr.binary_expr, serialized_list);

            var block = walk_tree(ast[2]);
            if (block.type == "block_expr")
                if_expr.block = block.lines;
            else
                if_expr.block = block;

            return if_expr;
        },

        "do": function () {
            var parent_clone = clone(this.parent);
            var while_expr = new type_while_loop();
            while_expr.type = "while_loop";

            while_expr.binary_expr = walk_tree(ast[1]);
            var serialized_list = [];
            if (while_expr.binary_expr.type == "binary_expr")
                while_expr.binary_expr = serialize_binary_expr(while_expr.binary_expr, serialized_list);

            var block_expr = walk_tree(ast[2]);

            while_expr.block = block_expr.lines;
            while_expr.token = parent_clone;

            while_expr.ast = ast;

            return while_expr;
        },

        "while": function () {
            var parent_clone = clone(this.parent);
            var while_expr = new type_while_loop();
            while_expr.type = "while_loop";

            while_expr.binary_expr = walk_tree(ast[1]);
            var serialized_list = [];
            if (while_expr.binary_expr.type == "binary_expr")
                while_expr.binary_expr = serialize_binary_expr(while_expr.binary_expr, serialized_list);

            var block_expr = walk_tree(ast[2]);

            while_expr.block = block_expr.lines;
            while_expr.token = parent_clone;

            while_expr.ast = ast;

            return while_expr;
        },

        "switch": function () {
            var parent_clone = clone(this.parent);
            var switch_expr = new type_switch_case();
            switch_expr.type = "switch_case";
            switch_expr.switch_var = walk_tree(ast[1]);
            switch_expr.name = switch_expr.switch_var;
            for (var i = 0; i < ast[2].length; ++i) {
                // ast[2][i][0] -- Case call
                for (var j = 0; j < ast[2][i][1].length; ++j) {
                    var case_obj = walk_tree(ast[2][i][1][j]);
                    switch_expr.block.push(case_obj);
                }
            }
            switch_expr.token = parent_clone;
            switch_expr.ast = ast;
            return switch_expr;
        },

        "case": function () { },

        "sub": function () {
            var parent_clone = clone(this.parent);
            // Array subscript 
            var array_obj = walk_tree(ast[1]);
            var array_subscript = walk_tree(ast[2]);
            var sub_expr = new type_array_subscript();
            sub_expr.array = array_obj;
            sub_expr.subscript = array_subscript;

            sub_expr.name = array_obj.name;
            sub_expr.token = parent_clone;
            sub_expr.type = "array_subscript";
            sub_expr.ast = ast;
            return sub_expr;
        },

        "break": function () {
            var ignore = new type_ignore();
            ignore.type = "ignore";
            ignore.name = "ignore";
            return ignore;
        },

        "array": function () {
            var ignore = new type_ignore();
            ignore.type = "ignore";
            ignore.name = "ignore";
            return ignore;
        },

        "conditional": function () {
            var parent_clone = clone(this.parent);
            var conditional_expr = new type_conditional_expr();
            conditional_expr.type = "conditional_expr";
            conditional_expr.expr = walk_tree(ast[1]);
            conditional_expr.results1 = walk_tree(ast[2]);
            conditional_expr.results2 = walk_tree(ast[3]);

            conditional_expr.token = parent_clone;
            return conditional_expr;
        },

        "try": function () {
            var parent_clone = clone(this.parent);
            var try_expr = new type_try_catch();
            try_expr.type = "try_catch";

            for (var j = 1; j < 3; ++j) {
                for (var i = 0; i < ast[1].length; ++i) {
                    try_expr.block.push(walk_tree(ast[1][i]));
                }
            }

            try_expr.token = parent_clone;
            try_expr.ast = ast;

            return try_expr;
        },

        "throw": function () {
            var ignore = new type_ignore();
            ignore.type = "ignore";
            ignore.name = "ignore";
            return ignore;
        }
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
                             "unary-prefix", "unary-postfix", "for", "block", "break", "try", "for-in", "array",
                             "conditional", "throw"];

    if (myImplementedList.indexOf(token_str) == -1)
        alert("Unimplemented token: " + token_str);
    
    var func = walker[token_str];
    
    if (func == undefined)
        return undefined;

    return func(ast);
}

function parse_defun(ast) {
    var defun_func = walk_tree(ast);
    if (defun_func.name != "this") {
        var usage_obj = new type_usage();
        usage_obj.code_str = gen_code(["toplevel", [ast]], { beautify : true });
        usage_obj.line = defun_func.token.start.line;
        usage_obj.class_where_used = "global";
    
        defun_func.add_usage(usage_obj, "Class Definition");
        GlobalIntellisenseRoot.add_obj("defun", defun_func);

        // Indicate that a proper definition has been found for this.
        GlobalIntellisenseRoot.add_distinct_defun_definition_found(defun_func.name);

        return defun_func;
    }
}

function parse_call(ast) {
    var call_obj = walk_tree(ast);
    if (call_obj.name != "this") {
        var usage_obj = create_usage_object(call_obj.name, ast, call_obj.token.start.line, "global");
        
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
    var left_usage_obj = create_usage_object(prototype_expr.left_expr.name, ast, prototype_expr.token.start.line, "global");
    
    var right_expr = prototype_expr.right_expr;
    var right_usage_obj = create_usage_object(prototype_expr.right_expr.name, ast, prototype_expr.token.start.line, "global");
    
    var code = gen_code(["toplevel", [ast]]);

    // Find the classes to setup the inheritance
    var inherited_class = factory(left_expr.name, "defun", type_function, prototype_expr.token, null, null);
    var base_class = factory(right_expr.name, "defun", type_function, prototype_expr.token, null, null);

    inherited_class.add_super_class(base_class.name);
    inherited_class.add_usage(left_usage_obj, "Prototype");
    
    base_class.add_sub_class(inherited_class.name);
    base_class.add_usage(right_usage_obj, "Prototype");
    
    return prototype_expr;
}

function parse_global_vars(ast) {
    var global_var_expr = walk_tree(ast);
    if (global_var_expr.name != "this") {
        var right_expr = global_var_expr.right_expr;
        // Now we get the left expr and add its usage
        var left_expr = global_var_expr.left_expr;
        var left_expr_usage_obj = create_usage_object(left_expr.name, ast, left_expr.token.start.line, "global");    
    
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
    
        // Look at the right side of the expression
        if (right_expr.type == "composition") {
            var right_expr_obj = factory(right_expr.name, "defun", type_function, right_expr.token, null, []);
            GlobalIntellisenseRoot.add_variable_class_mapping(left_expr.name, right_expr.name);
            GlobalIntellisenseRoot.add_obj("defun", right_expr);
        }

        // Indicate that a proper definition has been found for this.
        GlobalIntellisenseRoot.add_distinct_global_var_definition_found(left_expr.name);
    }
}

function parse_assign(ast) {
    parse_global_vars(ast, "global");
}

function parse_for_loop(ast) {
    var for_expr = walk_tree(ast);
    create_global_vars(for_expr, "global");
    // Now check the variables value
    return for_expr;
}

function parse_while_loop(ast) {
    var while_expr = walk_tree(ast);
    create_global_vars(while_expr, "global");
    return while_expr;
}

function parse_switch_case(ast) {
    var switch_expr = walk_tree(ast);
    create_global_vars(switch_expr, "global");
    return switch_expr;
}

function parse_try_catch(ast) {
    var try_catch_expr = walk_tree(ast);
    create_global_vars(try_catch_expr, "global");
    return try_catch_expr;
}

function parse_if(ast) {
    var if_expr = walk_tree(ast);
    create_global_vars(if_expr, "global");
    return if_expr;
}

// Definition list could be null
function populate_function_calls(call_expr) {
    // Find whether a variable has been defined which composes the class
    // from where we are trying to call this function.
    var defunObj;
    var called_obj = call_expr.called_obj;

    // Now check if the called_obj has a child. If it does then its a function call from
    // a composed class.
    var parent = null;
    var child = "";   // This is if its an internal function.
    var mapping_name = "";
    if (called_obj.child != null) {
        parent = called_obj.name;
        child = called_obj.child.name;
        if (GlobalIntellisenseRoot.scratch_class_mapping.hasOwnProperty(parent)) {
            mapping_name = GlobalIntellisenseRoot.scratch_class_mapping[parent];
        }
        else if (GlobalIntellisenseRoot.is_variable_class_mapping_defined(parent)) {
            mapping_name = GlobalIntellisenseRoot.get_variable_class_mapping(parent);
        }
    }    
    else {
        mapping_name = called_obj.name;
    }

    // This should be in global defun. If not then create an object. We will clean it up
    // later
    defunObj = GlobalIntellisenseRoot.get_single_defun(mapping_name)
    if (defunObj == undefined) {
        // Undefined. We need to create a new one
        defunObj = factory(mapping_name, "defun", type_function, null, null, []);
    }

    var usage = create_usage_object(called_obj.name, call_expr.ast, call_expr.token.start.line, "global");

    if (child == "")
        defunObj.add_usage(usage, "Function Call");
    else {
        // This is an internal function of a class. So add it appropriately.
        var internal_func_name = mapping_name + "." + child;

        if (defunObj.class_members.hasOwnProperty(internal_func_name)) {
            var internal_func_obj = GlobalIntellisenseRoot.get_from_global_dict(internal_func_name);
            internal_func_obj.add_usage(usage, "Function Call");
        }
    }
}