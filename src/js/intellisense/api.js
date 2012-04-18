function clean_global_definitions_found() {
    // Now iterate through the list and find the global definitions
    for (key in GlobalIntellisenseRoot.get_global_variables()) {
        if (!GlobalIntellisenseRoot.is_distinct_global_var_definition_present(key)) {
            GlobalIntellisenseRoot.delete_global_var(key);
        }
    }
}

function clean_defun_definitions_found() {
    // Now iterate through the list and find the global definitions
    for (key in GlobalIntellisenseRoot.get_global_classes()) {
        if (!GlobalIntellisenseRoot.is_distinct_defun_definition_present(key)) {
            GlobalIntellisenseRoot.delete_defun(key);
        }
    }
}

function get_class_obj(class_name) {
    return GlobalIntellisenseRoot.obj_dict[class_name];
}

function generate_class_hierarchy (result, class_obj) {
    var temp_result = [];
    var combined_result = [class_obj];
    if (class_obj.super_classes.length == 0) {
        return class_obj;
    }
    else {
        for (var i = 0; i < class_obj.super_classes.length; ++i) {
            temp_result.push(generate_class_hierarchy(combined_result, get_class_obj(class_obj.super_classes[i])));
        }
    }
    
    combined_result.push(temp_result);
    result.push(combined_result);
    
    return result;
}

function generate_intellisense(code) {
    // 'use strict';    
    var str_results = "";

    var ast = parse(code, false, true);

    clean_global_definitions_found();

    clean_defun_definitions_found();

    GlobalIntellisenseRoot.source = code.split("\n");
    
    return GlobalIntellisenseRoot;
}