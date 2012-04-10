function extend(Child, Parent) {
    var p = Parent.prototype;
    var c = Child.prototype;
    for (var i in p) {
        c[i] = p[i];
    }
    c.uber = p;
}

function type_object() {    
    // Base Class
    this.name = "";
    this.type = "";
    this.parent = null;
    this.child = null;
    this.value = null;
    this.token = null;
    this.initial_data_type = null; // Only valid for variables
    this.usage = {};
    
    this.toString = function() {
        return this.type + ": " + this.name;    
    }   
    
    this.add_usage = function(usage_type, type) {
        try {
            var line = usage_type.line;
            if (!this.usage.hasOwnProperty(line)) {
                var dict = {};
                if (type == undefined) dict[line] = usage_type;
                else dict[line] = [type, usage_type];
                
                this.usage[line] = dict;
            }
        } catch(e) {
            // Do nothing as of now
        }
    }
}

// type = "defun" || "function"
function type_function() {
    // type = arguments[0]
    // name = arguments[1]
    // ast = arguments[2]
    // args = arguments[3]
    type_object.call(this);
    var new_args = arguments;
    if (arguments.length == 1) {
        new_args = arguments[0];
    }

    this.definition_encountered = false;

    if (new_args != null && new_args.length == 4) {
        this.type = new_args[0];
        this.name = new_args[1];
        this.ast = new_args[2];
        this.arguments = new_args[3];
        this.definition_encountered = true;
    }

    this.setArgs = function(args) {
        this.type = args[0];
        this.name = args[1];
        this.ast = args[2];
        this.arguments = args[3];
        this.definition_encountered = true;
    }

    this.isDefinitionEncountered = function() { return this.definition_encountered; }

    this.return_obj = null;
    this.source_code = gen_code(this.ast, {beautify: true});
    
    this.super_classes = [];
    this.sub_classes   = [];
    
    this.classes_where_composed = [];
    this.classes_this_composes = [];
    
    this.dependencies = {};
    
    this.class_members  = {};
        
    this.get_source_code = function() {
        return this.source_code;
    }
    
    this.is_class_member_present = function(name) {
        return this.class_members.hasOwnProperty(name);
    }
        
    this.does_dependency_exist = function(name) {
        return this.dependencies.hasOwnProperty(name);
    }
    
    this.add_dependency = function(name) {
        this.dependencies[name] = GlobalIntellisenseRoot.obj_dict[name];
    }
    
    this.add_class_member = function(class_obj) {
        if (!this.is_class_member_present(class_obj.name)) {
            this.class_members[class_obj.name] = [class_obj];
        }
        else {
            this.class_members[class_obj.name].push(class_obj);
        }
    }

    this.walk_function = function () {
        // Walk the ast for the function alone to generate the dependency graph
        var code_ast = this.ast[1][0][3];

        for (var i = 0; i < code_ast.length; ++i) {
            var expr = walk_tree(code_ast[i]);

            if (expr != null) {
                switch (expr.type) {
                    case "assign_expr":
                        var right_expr = expr.right_expr;
                        var left_expr = expr.left_expr;
                        
                        var left_expr_start_line = -1; var right_expr_start_line = -1;
                        if (Introspect.typeOf(right_expr.token) == "object")
                            right_expr_start_line = right_expr.token.start.line;

                        if (Introspect.typeOf(left_expr.token) == "object")
                            left_expr_start_line = left_expr.token.start.line;

                        var right_expr_usage_obj = create_usage_object(right_expr.name, code_ast[i], right_expr_start_line);
                        var left_expr_usage_obj = create_usage_object(left_expr.name, code_ast[i], left_expr_start_line);

                        var right_expr_name = get_qualified_name(parse_expr(right_expr), ((right_expr.name == "this") ? this : null));
                        var left_expr_name = get_qualified_name(parse_expr(left_expr), ((left_expr.name == "this") ? this : null));

                        if (right_expr.type == "composition") {
                            // @todo: Redo
                            this.classes_this_composes.push(right_expr);
                        }

                        var left_obj = type_object_factory(left_expr_name, left_expr.type, type_object, assign_expression.token, this);

                        var right_obj = null;

                        if (left_expr.name == "this" ||
                            GlobalIntellisenseRoot.is_defun_present(left_expr_name) ||
                            GlobalIntellisenseRoot.is_global_var_present(left_expr_name)) {

                            // Now check if the expr type is "name" or not
                            if (right_expr.type == "name") {
                                this.add_dependency(right_expr_name);
                                right_obj = type_object_factory(right_expr_name, right_expr.type, type_object, right_expr.token, ((right_expr.name == "this") ? this : null));
                                // Check if this is a global variable or defun
                                if (GlobalIntellisenseRoot.is_defun_present(right_expr.name)) {
                                    right_expr.type = "function";
                                }
                                else if (GlobalIntellisenseRoot.is_global_var_present(right_expr.name)) {
                                    right_expr.type = "global_var";
                                }
                                // Add the usage list for this.
                                right_obj.add_usage(right_expr_usage_obj);
                            }

                            if (left_obj.type == "" || left_obj.type == null || left_obj.type == undefined)
                                left_obj.type = right_expr.type;

                            // Add the usage for the class member
                            left_obj.add_usage(left_expr_usage_obj, right_expr.type);

                            // Add the usage of local var
                            if (left_expr.name == "this")
                                this.add_class_member(left_obj);
                        }

                        break;

                    case "return_expr":
                        this.return_obj = expr;
                        break;

                    case "call":
                        // Find if the called function has been defined before or not.
                        // If not then add it to unmet dependencies.
                        var call_expr = expr;
                        break;
                }
            }
        }
    }
            
    this.get_super_classes = function() {
        return this.super_classes;
    }
    
    this.get_sub_classes = function() {
        return this.sub_classes;
    }

    // Functions executed in constructor
    if (this.ast != null)
        this.walk_function();
}

// type_function.prototype = type_object;

function type_expression() {
    type_object.call(this);    
    this.ast = null;
}

function assign_expression() {
    type_object.call(this);    
    this.left_expr = new type_expression();
    this.right_expr = new type_expression();
}

function binary_expression() {
    type_object.call(this);    
    this.operator = "";
    this.binary_lhs = null;
    this.binary_rhs = null;
}

function type_usage() {
    this.code_str = "";
    this.line = -1;
}

function type_function_call() {
    type_object.call(this);
    this.ast = null;
}

type_expression.prototype    = new type_object;
assign_expression.prototype  = new type_object;
binary_expression.prototype  = new type_object;
type_function_call.prototype = new type_object;

function create_usage_object(name, ast, line) {
    var usage_obj = new type_usage();
    ast = ["toplevel", [ast]];
    var code = gen_code(ast, {beautify : true});
    usage_obj.code = code;
    usage_obj.line = line;
    usage_obj.name = name;
    usage_obj.type = "usage_object";
    return usage_obj;
}

// Global Method for creating type_objects. Use this method only
function type_object_factory(name, obj_type, constructor_call, token, parent, args) {
    var found = false;
    if (GlobalIntellisenseRoot.obj_dict.hasOwnProperty(name)) {
        var obj = GlobalIntellisenseRoot.obj_dict[name];
        if (obj.type == "defun" || obj.type == "function") {
            if (!obj.isDefinitionEncountered()) {
                obj.setArgs(args);
                obj.walk_function();
            }
        }

        return obj;
    }
    else {
        var obj = new constructor_call(args);
        obj.name = name;
        obj.type = obj_type;
        obj.token = token;
        obj.parent = parent;
        GlobalIntellisenseRoot.add_to_object_dictionary(name, obj);

        if (obj_type == "defun")
            GlobalIntellisenseRoot._add_global_func(name, obj);
        else if (obj_type == "global_var")
            GlobalIntellisenseRoot._add_global_var(name, obj);

        return obj;
    }
}

function get_qualified_name(name, parent) {
    var obj_qualified_name = name;
    while (Introspect.typeOf(parent) == "object") {
        obj_qualified_name = parent.name + "." + obj_qualified_name;
        parent = parent.parent;
    }
    
    return obj_qualified_name;
}

/////////////////////////////////////////////////////////////////////////////////////////////////
function global_node() {
    // object dictionary - Stores the name and objects for every major "defun" function & global
    // variables found
    this.obj_dict = {};
    this.defun = {};
    this.global_vars = {};

    this._add_global_obj = function (global_var_name, global_var_obj) {
        this.obj_dict[global_var_name] = global_var_obj;
    }

    this._add_global_var = function (global_var_name, global_var_obj) {
        this.global_vars[global_var_name] = global_var_obj;
    }

    this._add_global_func = function (global_var_name, global_func_obj) {
        this.defun[global_var_name] = global_func_obj;
    }

    this.add_obj = function (obj_type, obj) {
        switch (obj_type) {
            case "global_var":
                this._add_global_var(obj.name, obj);
                this._add_global_obj(obj.name, obj);
                break;

            case "defun":
                this._add_global_func(obj.name, obj);
                this._add_global_obj(obj.name, obj);
                break;
        }
    }

    this.get_single_defun = function (name) {
        return this.defun[name];
    }

    this.get_single_global_var = function (name) {
        return this.global_vars[name];
    }

    this.is_global_var_present = function (name) {
        return this.global_vars.hasOwnProperty(name);
    }

    this.is_defun_present = function (name) {
        return this.defun.hasOwnProperty(name);
    }

    // Names stored in Global Object dictionary. This will
    // help to locate all global and local variables
    this.is_present_in_object_dictionary = function (name) {
        return this.obj_dict.hasOwnProperty(name);
    }

    this.add_to_object_dictionary = function (name, obj) {
        // If object already present, copy over the usage
        // This case will happen when we encounter an object name
        // we haven't seen before
        if (this.is_present_in_object_dictionary(name)) {
            var old_obj = this.obj_dict[name];
            obj.usage.concat(old_obj.usage);
        }

        this.obj_dict[name] = obj;
    }

    this.toString = function () {
        var str = "Global Classes\
                   ----------------\n";
        // Display the global classes first
        for (var key in this.defun) {
            str += this.defun[key].toString() + "\n";
        }

        str += "\nGlobal Variables\
                --------------------\n";

        // Display all the global variables
        for (var key in this.global_vars) {
            str += this.global_vars[key].toString() + "\n";
        }

        return str;
    }

    // Getter Functions
    this.get_global_classes = function () {
        return this.defun;
    }

    this.get_global_variables = function () {
        return this.global_vars;
    }
}

var GlobalIntellisenseRoot = new global_node();