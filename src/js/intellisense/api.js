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

    // Now since we have all the classes go through them to see if we have source code for all of them and if they are present
    // then generate the data members.
//    for (var key in GlobalIntellisenseRoot.defun) {
//        var dependency_src_code = "";
//        var obj = GlobalIntellisenseRoot.defun[key];
//        obj.generate_data_members();
//    }
    
    return GlobalIntellisenseRoot;
}