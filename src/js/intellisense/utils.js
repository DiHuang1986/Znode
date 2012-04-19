/* -----[ Utilities ]----- */
function curry(f) {
        var args = slice(arguments, 1);
        return function() { return f.apply(this, args.concat(slice(arguments))); };
};

function prog1(ret) {
        if (ret instanceof Function)
                ret = ret();
        for (var i = 1, n = arguments.length; --n > 0; ++i)
                arguments[i]();
        return ret;
};

function array_to_hash(a) {
        var ret = {};
        for (var i = 0; i < a.length; ++i)
                ret[a[i]] = true;
        return ret;
};

function slice(a, start) {
        return Array.prototype.slice.call(a, start || 0);
};

function characters(str) {
        return str.split("");
};

function member(name, array) {
        for (var i = array.length; --i >= 0;)
                if (array[i] == name)
                        return true;
        return false;
};

function HOP(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
};

var warn = function() {};

function serialize(serialized_ast, ast) {
    // Serialize an ast to turn it into a single 1D array
    for (var i = 0; i < ast.length; ++i) {
        if (Introspect.typeOf(ast[i]) == "object") {
            serialized_ast = serialize(serialized_ast, ast[i]);
        }
        else {
            serialized_ast.push(ast[i]);
        }
    }
    
    return serialized_ast;
}

function get_serialized_ast(ast) {
    var serialized_ast = [];
    serialized_ast = serialize(serialized_ast, ast);
    return serialized_ast;
}

function array_contains_type(serialized_array, search_term) {
    for (var i = 0; i < serialized_array.length; ++i) {
        if (serialized_array[i] == search_term) {
            return true;
        }
    }
    
    return false;
}

var _is_ = {    
    "prototype" : function(ast) {
        var serialized_ast = get_serialized_ast(ast);
        var is_prototype_stmt = array_contains_type(serialized_ast, "prototype");
        return is_prototype_stmt;
    },
}

function getTokenDisplayName(token_name) {
    switch(token_name) {
        case "defun":
        case "function":
            return "Function";
            break;

        case "global_var":
            return "Globals";
            break;
    }

    return token_name;
}

// Returns the name & type of the object
function class_members_to_string(class_members) {
    var str = "";
    for (var key in class_members) {
        var obj = GlobalIntellisenseRoot.get_from_global_dict(key);
        str = str + key + ": " + obj.type + "\n"; 
    }

    return str;
}

function clone(orig_obj) {
    var clone = jQuery.extend(true, {}, orig_obj);
    return clone;
}

function count_dictionary_items(dict) {
    var count = 0;
    for (var key in dict) {
        ++count;
    }

    return count;
}

function split_name(qualified_name) {
    var split_arr = qualified_name.split(".");
    return split_arr[split_arr.length - 1];
}