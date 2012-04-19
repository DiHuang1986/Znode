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
    this.ast = null;
    this.usage = {};
    
    this.toString = function() {
        return this.type + ": " + this.name;    
    }   
    
    this.add_usage = function(usage_type, type) {
        try {
            // Line numbers start from 0. We need to make it from 1
            var line = usage_type.line + 1;
            if (!this.usage.hasOwnProperty(line)) {
                if (type == undefined) 
                    this.usage[line] = ["undefined", usage_type];
                else 
                    this.usage[line] = [type, usage_type];
            }
        } catch(e) {
            // Do nothing as of now
        }
    }

    this.get_usage = function () { return this.usage; }
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

    this.ast = null;

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
    if (this.ast != null)
        this.source_code = gen_code(this.ast, { beautify: true });
    else
        this.source_code = "";

    this.super_classes = [];
    this.sub_classes = [];
    
    this.classes_where_composed = {};
    this.classes_this_composes = {};
    
    this.dependencies = {};

    this.class_members = {};

    this.variable_class_mapping = {}; // From composition we want to store a list of
                                      // variables which compose some class in order to call
                                      // functions from it.
       
    this.add_classes_where_composed = function(name, obj) {
        if (!this.classes_where_composed.hasOwnProperty(name)) {
            this.classes_where_composed[name] = obj;            
        }
    }

    this.get_source_code = function () {
        if (this.source_code == "") {
            if (this.ast != null) {
                this.source_code = gen_code(this.ast, { beautify: true });
            }
        }

        return "\n" + this.source_code + "\n";
    }

    this.generate_dependency_src_code = function () {
        var src = "";
        for (var key in this.dependencies) {
            var obj = this.dependencies[key];
            src = src + obj.generate_dependency_src_code();
        }

        src += "\n" + this.get_source_code() + "\n";

        return src;
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
            this.class_members[class_obj.name] = class_obj;
        }
    }

    this.add_super_class = function (class_name) {
        if (this.super_classes.indexOf(class_name) == -1)
            this.super_classes.push(class_name);
    }

    this.add_sub_class = function (class_name) {
        if (this.sub_classes.indexOf(class_name) == -1)
            this.sub_classes.push(class_name);
    }

    this.get_dependencies = function () {
        return this.dependencies;
    }

    this.get_inherited_members = function (inherited_member_list) {
        // Look at all the super classes. this will be a recursive process
        // The initial function call will be an empty list
        if (Introspect.typeOf(inherited_member_list) == "undefined") {
            var initial_data_call = true;
            inherited_member_list = {};
        }

        for (var i = 0; i < this.super_classes.length; ++i) {
            var super_class_name = this.super_classes[i];
            var super_class_obj = GlobalIntellisenseRoot.get_single_defun(super_class_name);
            inherited_member_list = super_class_obj.get_inherited_members(inherited_member_list);
        }

        // Now concat its own data if this is not an initial data call
        if (Introspect.typeOf(initial_data_call) == "undefined") {
            var class_members = this.get_class_members("all");
            inherited_member_list[this.name] = class_members;
        }

        return inherited_member_list;
    }

    this.get_composition_class_members = function () {
        composition_class_members = {};

        for (var composition_class in this.classes_this_composes) {
            var composition_class_obj = GlobalIntellisenseRoot.get_single_defun(composition_class);
            var class_members = composition_class_obj.get_class_members("all");

            composition_class_members[composition_class] = class_members;
        }

        return composition_class_members;
    }

    // type choices: 
    // object - returns all composition or objects
    // non-object - returns all numbers & strings
    // all
    this.get_class_members = function (type) {
        if (type == "all") {
            return this.class_members;
        }

        var members = {};
        if (type == "non-object") {
            for (var key in this.class_members) {
                var obj = GlobalIntellisenseRoot.get_from_global_dict(key);
                if (obj.type == "num" || obj.type == "string")
                    members[key] = obj;
            }
        }

        if (type == "object") {

            for (var key in this.class_members) {
                var obj = GlobalIntellisenseRoot.get_from_global_dict(key);
                if (obj.type == "name" || obj.type == "composition")
                    members[key] = obj;
            }
        }

        return members;
    }

    this.get_super_classes = function () {
        return this.super_classes;
    }

    this.get_sub_classes = function () {
        return this.sub_classes;
    }

    this.get_composition_classes = function () {
        return this.classes_this_composes;
    }

    this.walk_function = function () {
        // Walk the ast for the function alone to generate the dependency graph
        var code_ast = this.ast[1][0][3];

        for (var i = 0; i < code_ast.length; ++i) {
            var expr = walk_tree(code_ast[i]);
            create_global_vars(expr, this.name);

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

                        var right_expr_usage_obj = create_usage_object(right_expr.name, code_ast[i], right_expr_start_line, this.name);
                        var left_expr_usage_obj = create_usage_object(left_expr.name, code_ast[i], left_expr_start_line, this.name);

                        var right_expr_name = get_qualified_name(parse_expr(right_expr), ((right_expr.name == "this") ? this : null));
                        var left_expr_name = get_qualified_name(parse_expr(left_expr), ((left_expr.name == "this") ? this : null));

                        if (right_expr.type == "composition") {
                            this.classes_this_composes[right_expr.name] = right_expr;
                            // Now add it to the class which is composed (but don't add if it derives from Object
                            var class_composed = factory(right_expr.name, right_expr.type, type_function, right_expr.token, null, []);
                            class_composed.add_classes_where_composed(this.name, this);

                            this.add_dependency(right_expr.name);
                            GlobalIntellisenseRoot.scratch_class_mapping[left_expr_name] = right_expr_name;

                            if (right_expr.name == "Array" || right_expr.name == "Object") {
                                GlobalIntellisenseRoot.add_obj("global_var", class_composed);
                                GlobalIntellisenseRoot.add_distinct_global_var_definition_found(right_expr.name);
                            }
                        }


                        var right_obj = null;

                        if (left_expr.name == "this" ||
                            GlobalIntellisenseRoot.is_defun_present(left_expr_name) ||
                            GlobalIntellisenseRoot.is_global_var_present(left_expr_name)) {

                            var alternate_search_name = null;

                            if (left_expr.name == "this") {

                                if (left_expr.type == "array_subscript") {
                                    alternate_search_name + left_expr.array.name + "." + left_expr.array.child.name;
                                } else {
                                    alternate_search_name = left_expr.name + "." + left_expr.child.name;
                                }
                            }

                            var left_obj = factory(left_expr_name, left_expr.type, type_object, assign_expression.token, this, [], alternate_search_name);

                            // Delete the global object name if it is different from the left_expr name
                            if (left_expr_name != left_expr.name) {
                                delete GlobalIntellisenseRoot.obj_dict[alternate_search_name];
                            }

                            // Now check if the expr type is "name" or not
                            if (right_expr.type == "name" || right_expr.type == "composition") {
                                this.add_dependency(right_expr_name);
                                right_obj = factory(right_expr_name, right_expr.type, type_object, right_expr.token, ((right_expr.name == "this") ? this : null));

                                // Check if this is a global variable or defun
                                if (GlobalIntellisenseRoot.is_defun_present(right_expr.name)) {
                                    right_expr.type = "function";
                                }
                                else if (GlobalIntellisenseRoot.is_global_var_present(right_expr.name)) {
                                    right_expr.type = "global_var";
                                }
                                // Add the usage list for this.
                                right_obj.add_usage(right_expr_usage_obj, right_expr.type);
                            }

                            // if (left_obj.type == "" || left_obj.type == null || left_obj.type == undefined)
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
                        if (expr.called_obj.name == "this") {

                            var func_obj = factory(this.name + "." + expr.called_obj.child.name, "function", type_function, expr.token, this, []);

                            // func_obj = GlobalIntellisenseRoot.get_from_global_dict(this.name + "." + expr.called_obj.child.name);

                            var func_usage = create_usage_object(func_obj.name, code_ast[i], expr.token.start.line, this.name);

                            func_obj.add_usage(func_usage, "Function Call");

                            if (expr.called_obj.name == "this")
                                this.add_class_member(func_obj);

                        } else {
                            populate_function_calls(expr);
                        }
                        break;

                    case "for-in":
                    case "for_loop":
                    case "while_loop":
                    case "switch_case":
                    case "try_catch":
                    case "if_expr":
                    case "function":
                        var block = expr.block;

                        if (block.type == "block_expr") {
                            for (var kcounter = 0; kcounter < block.length; ++kcounter) {
                                var block_expr = block[kcounter];
                                if (block_expr.type == "call") {
                                    if (block_expr.name == "this") {
                                        var func_obj = GlobalIntellisenseRoot.get_from_global_dict(split_name(this.name) + "." + block_expr.called_obj.child.name);
                                        func_obj.add_usage(block_expr, "Function Call");
                                    } else {
                                        populate_function_calls(block_expr);
                                    }
                                }
                            }
                        } else {
                            // Need to see if we need it now.
                        }

                        break

                    case "sub":
                        var array_sub_expr = expr;
                        break;
                }
            }
        }
    }

    // Functions executed in constructor
    if (this.ast != null)
        this.walk_function();
            
//    this.generate_data_members = function () {
//        if (this.ast != null) {
//            try {
//                'use strict';
//                this.code = this.generate_dependency_src_code();

//                var eval_code = eval("(" + this.code + ")");
//                this.obj = new eval_code();
//                this.data_members = Introspect.get_all_variables(this, this.obj);
//            } catch (e) {
//                alert(e);
//            }
//        }
//    }
}

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
    this.left_expr = null;
    this.right_expr = null;
}

function type_usage() {
    this.code_str = "";
    this.line = -1;
    this.class_where_used = "";

    this.get_code_string = function () { return GlobalIntellisenseRoot.source_array[this.line]; }
    this.get_line_number = function () { return this.line; }
    this.get_where_used = function () { return this.class_where_used; }
}

function type_function_call() {
    type_object.call(this);
    this.ast = null;
}

function type_array_subscript() {
    type_object.call(this);
    this.array = null;
    this.subscript = null;
}

function type_unary_expr() {
    type_object.call(this);
    this.unary = "";
}

function type_for_loop() {
    type_object.call(this);
    this.loop_var1 = null;
    this.loop_var2 = null;
    this.binary_expr = null;
    this.increment_decrement = null;
    this.block = [];
}

function type_while_loop() {
    type_object.call(this);
    this.binary_expr = null;
    this.block = [];
}

function type_switch_case() {
    type_object.call(this);
    this.switch_var = null;
    this.block = [];
}

function type_if_expr() {
    type_object.call(this);
    this.binary_expr = null;
    this.block = [];
}

function type_try_catch() {
    type_object.call(this);
    this.block = [];
}

function type_block() {
    type_object.call(this);
    this.lines = [];
}

function type_function_call() {
    type_object.call(this);
    this.called_obj = null;
    this.args = [];
}

function type_conditional_expr() {
    type_object.call(this);
    this.expr = null;
    this.result1 = null;
    this.result2 = null;
}

function type_ignore() {
    type_object.call(this);
}


type_expression.prototype      = new type_object;
assign_expression.prototype    = new type_object;
binary_expression.prototype    = new type_object;
type_function_call.prototype   = new type_object;
type_array_subscript.prototype = new type_object;
type_unary_expr.prototype      = new type_object;
type_for_loop.prototype        = new type_object;
type_block.prototype           = new type_object;
type_try_catch.prototype       = new type_object;
type_if_expr.prototype         = new type_object;
type_function_call.prototype = new type_object;
type_conditional_expr.prototype = new type_object;

function create_usage_object(name, ast, line, class_where_used) {
    var usage_obj = new type_usage();
    ast = ["toplevel", [ast]];
    var code = gen_code(ast, {beautify : true});
    usage_obj.code_str = code;
    usage_obj.line = line;
    usage_obj.name = name;
    usage_obj.class_where_used = class_where_used;
    usage_obj.type = "usage_object";
    return usage_obj;
}

// Global Method for creating type_objects. Use this method only
function factory(name, obj_type, constructor_call, token, parent, args, alternate_search_name) {
    var found = false;

    if (GlobalIntellisenseRoot.obj_dict.hasOwnProperty(name) ||
        ((alternate_search_name != undefined) && (alternate_search_name != null) && (GlobalIntellisenseRoot.obj_dict.hasOwnProperty(alternate_search_name)))) {
        var obj = GlobalIntellisenseRoot.obj_dict[name];

        if (obj == undefined && alternate_search_name != undefined && alternate_search_name != null) {
            obj = GlobalIntellisenseRoot.obj_dict[alternate_search_name];
            obj = GlobalIntellisenseRoot.obj_dict[name] = clone(obj);
            obj.name = name;
            obj.type = obj_type;
        }

        if (obj_type == "defun" || obj_type == "function") {
            if (!obj.isDefinitionEncountered() && args != null) {
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
    this.distinct_global_var_definition_found = {}; // For global variables
    this.distinct_defun_found = {};
    this.variable_class_mapping = {};               // For global variables holding composition.
    this.source_code = "";
    this.source_array = [];

    this.scratch_class_mapping = {};                // Used by internal functions

    this._add_global_var = function (global_var_name, global_var_obj) {
        this.global_vars[global_var_name] = global_var_obj;
    }

    this._add_global_func = function (global_var_name, global_func_obj) {
        this.defun[global_var_name] = global_func_obj;
    }

    this.add_obj = function (obj_type, obj) {
        switch (obj_type) {
            case "global_var":
                obj.type = "global_var";
                this._add_global_var(obj.name, obj);
                this.add_to_object_dictionary(obj.name, obj);
                break;

            case "defun":
                obj.type = "defun";
                this._add_global_func(obj.name, obj);
                this.add_to_object_dictionary(obj.name, obj);
                break;
        }
    }

    this.add_distinct_defun_definition_found = function (name) {
        this.distinct_defun_found[name] = true;
    }

    this.add_distinct_global_var_definition_found = function(name) {
        this.distinct_global_var_definition_found[name] = true;
    }

    this.is_distinct_defun_definition_present = function(name) {
        return this.distinct_defun_found.hasOwnProperty(name);
    }

    this.is_distinct_global_var_definition_present = function (name) {
        return this.distinct_global_var_definition_found.hasOwnProperty(name);
    }

    this.get_variable_class_mapping = function (name) {
        return this.variable_class_mapping[name];
    }

    this.is_variable_class_mapping_defined = function(name) {
        return this.variable_class_mapping.hasOwnProperty(name);
    }

    this.add_variable_class_mapping = function (var_name, class_name) {
        this.variable_class_mapping[var_name] = class_name;
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

    this.delete_global_var = function (name) {
        if (this.global_vars.hasOwnProperty(name)) {
            delete this.global_vars[name];
        }
    }

    this.delete_defun = function (name) {
        if (this.defun.hasOwnProperty(name)) {
            delete this.defun[name];
        }
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
        // Null values don't need to go into the object dictionary
        if (name != "null") {
            if (this.is_present_in_object_dictionary(name)) {
                var old_obj = this.obj_dict[name];
                // obj.usage.concat(old_obj.usage);
                for (attr in old_obj.usage) { obj.usage[attr] = old_obj.usage[attr]; }
            }

            this.obj_dict[name] = obj;
        }
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

    this.get_from_global_dict = function (name) {
        if (this.obj_dict.hasOwnProperty(name)) {
            return this.obj_dict[name];
        } else {
            alert(name + " has not been seen previously");
        }
    }
}

var GlobalIntellisenseRoot = new global_node();