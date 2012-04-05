function create_usage_dictionary(line_no, obj, type) {

}

////////////////////////////////////// Helper Functions ////////////////////////////////////////
function parse_expr(expr) {
    var str = "";
    while (expr.child != null) {
        if (expr.name != "this") {
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
        "assign" : function() {
            var assign_expr = new assign_expression();
            assign_expr.token = this.parent;
            assign_expr.type = "assign_expr";
            assign_expr.left_expr = walk_tree(ast[2]);
            assign_expr.right_expr = walk_tree(ast[3]);
            assign_expr.name = assign_expr.left_expr.name;
            assign_expr.right_expr.token = this.parent;
            assign_expr.left_expr.token = this.parent;
            assign_expr.left_expr.ast = ast;
            assign_expr.right_expr.ast = ast;
            return assign_expr;
        },
        
        "var" : function() {
            var assign_expr = new assign_expression();
            assign_expr.token = this.parent;
            assign_expr.type = "assign_expr";
            
            assign_expr.left_expr = type_object_factory(ast[1][0][0], type_object);
            assign_expr.left_expr.token = this.parent;
            // assign_expr.left_expr.name = ast[1][0][0];
            assign_expr.right_expr = walk_tree(ast[1][0][1]);
            assign_expr.name = assign_expr.left_expr.name;
            
            return assign_expr;            
        },
        
        "stat" : function() {
            return walk_tree(ast[1]);
        },
        
        "dot" : function() {
            var dot_obj = walk_tree(ast[1]);
            dot_obj.child = new type_object();
            dot_obj.child.name = ast[2];
            dot_obj.child.parent = dot_obj;
            return dot_obj;
        },
        
        "name" : function() {
            var new_obj = new type_object();
            new_obj.token = this.parent;
            new_obj.type = "name";
            new_obj.name = ast[1];
            return new_obj;
        },
        
        "new" : function() {
            var expr = walk_tree(ast[1]);
            expr.token = this.parent;
            expr.type = "composition";
            return expr;
        },
        
        "function" : function() {
            var func = type_object_factory(ast[1], type_function, this.parent, null, ["function", ast[1], ["toplevel", [ast]], ast[2]]);            
            // var func = new type_function("function", ast[1], ["toplevel", [ast]], ast[2]);
            func.token = this.parent;
            return func;
        },
        
        "call" : function() {
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
        
        "defun" : function() {
            var func = type_object_factory(ast[1], type_function, this.parent, null, ["defun", ast[1], ["toplevel", [ast]], ast[2]]);
            // var func = new type_function("defun", ast[1], ["toplevel", [ast]], ast[2]);
            func.token = this.parent;
            return func;
        },
        
        "return" : function() {
            var return_expr = new type_expression();
            return_expr.token = this.parent;
            return_expr.type = "return_expr";
            return_expr.expr = walk_tree(ast[1]);
            return return_expr;
        },
        
        "string" : function() {
            var obj = new type_object();
            obj.token = this.parent;
            obj.type = "string";
            obj.value = ast[1];
            return obj;
        },
        
        "num" : function() {
            var obj = new type_object();
            obj.token = this.parent;
            obj.type = "num";
            obj.value = ast[1];
            return obj;
        },
        
        "binary" : function() {
            var binary_expr = new binary_expression();
            binary_expr.token = this.parent;
            binary_expr.type = "binary_expr";
            binary_expr.binary_lhs = walk_tree(ast[2]);
            binary_expr.binary_rhs = walk_tree(ast[3]);
        },

        "if": function() {
           // do nothing now.
        },

        "do" : function() {

        },

        "while" : function() {
            
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
    var myImplementedList = ["binary", "num", "string", "return", "defun", "call", "function", "new", "name", "dot", "stat", "var", "assign"];

    if (myImplementedList.indexOf(token_str) == -1)
        alert(token_str);
    
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
    
    defun_func.add_usage(usage_obj);
    GlobalIntellisenseRoot.add_obj("defun", defun_func);
    return defun_func;
}

function parse_call(ast) {
    var call_obj = walk_tree(ast);
    if (call_obj.name != "this") {
        var usage_obj = new type_usage();
        usage_obj.code_str = gen_code(["toplevel", [ast]], { beautify : true });
        usage_obj.line = call_obj.token.start.line;
        
        // Get the object for this one.
        // var call_function_obj = type_object_factory(call_obj.name, type_function, call_obj.token, null, ["defun", ast[1], ["toplevel", [ast]], ast[2]]);
        var call_function_obj = type_object_factory(call_obj.name, type_function_call, call_obj.token, null, null);
        call_function_obj.add_usage(usage_obj);
    }
    
    return call_obj;
}

function parse_prototype_ast(ast) {
    var prototype_expr = null;
    prototype_expr = walk_tree(ast);
    
    // Find the classes to setup the inheritance
    var inherited_class = GlobalIntellisenseRoot.get_single_defun(prototype_expr.left_expr.name);
    var base_class = GlobalIntellisenseRoot.get_single_defun(prototype_expr.right_expr.name);
    
    inherited_class.super_classes.push(base_class.name);
    base_class.sub_classes.push(inherited_class.name);
    
    return prototype_expr;
}

function parse_global_vars(ast) {
    var global_var_expr = walk_tree(ast);
    var right_expr = global_var_expr.right_expr;
    // Now we get the left expr and add its usage
    var left_expr = global_var_expr.left_expr;
    var left_expr_usage_obj = create_usage_object(left_expr.name, ast, left_expr.token.start.line);    
    
    if (GlobalIntellisenseRoot.is_defun_present(right_expr.name)) {
        right_expr.type = "function";
    }
    else if (GlobalIntellisenseRoot.is_global_var_present(right_expr.name)) {
        right_expr.type = "global_var";
    }       
    
    left_expr.add_usage(left_expr_usage_obj, right_expr.type);
    
    GlobalIntellisenseRoot.add_obj("global_var", left_expr);
}

// Get the intellisense function to run
function parse_composition_ast(ast, intl_func) {
    var search_item = "new";
    
    var lvalue = new type_object();
    var rvalue = new type_object();
}