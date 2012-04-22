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

function add_parent(obj) {
    try {
        var class_members = obj.get_class_members("all");

        for (var class_member in class_members) {
            var class_member_obj = GlobalIntellisenseRoot.get_from_global_dict(class_member);
            class_member_obj.parent = obj;
            add_parent(class_member_obj);
        }
    } catch(e) {
        // Do nothing. This is just a simple object.
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

function resolve_with_parent_members(obj) {
    // Now get the list of class members and see if the parent nodes have anything
    var class_members = obj.get_class_members("all");

    for (var class_member in class_members) {
        var class_member_obj = class_members[class_member];
        // Now we have one class member. See if there is anything in its parent
        var parent_members = __does_parent_have_member__(class_member_obj.parent, split_name(class_member));

        if (parent_members.length > 1) {
            // parent_members[0] will hold the highest parent which holds this object. So we will associate the
            // child members with this object
            var parent_name = parent_members[0][0];
            var parent_member_name = parent_members[0][1];
            var parent_member_obj = GlobalIntellisenseRoot.get_from_global_dict(parent_member_name);

            // Now we have to do the association.
            // Copy all the usage information.

            for (var usage_key in class_member_obj.usage) {
                parent_member_obj.usage[usage_key] = class_member_obj.usage[usage_key];
            }

            // Now delete the original member from the Global dictionary and from the this object
            delete GlobalIntellisenseRoot.obj_dict[class_member];
            delete obj.class_members[class_member];
        }
    }
}

// Private function. Not to be used outside
function __does_parent_have_member__ (parent, name, list_where_found) {

    if (Introspect.typeOf(list_where_found) == "undefined") {
        list_where_found = [];
    }

    if (parent != null && parent.parent != null)
        list_where_found = __does_parent_have_member__(parent.parent, name, list_where_found);

    // Now search in own.
    var class_members = parent.get_class_members("all");

    for (var class_name in class_members) {
        if (split_name(class_name) == name) {
            list_where_found.push([parent.name, class_name]);
            break; // Do not continue searching the list. We already found the name
        }
    }

    return list_where_found;
}

// This is useful when the function is a data-member function to a major defun
function __get_all_inherited_members__(obj) {
    var list = [];
    while (obj != null) {
        list[obj.name] = obj.get_inherited_members();
        obj = obj.parent;
    }

    return list;
}


function __is_base_class_member__(obj, name) {
    // This could be an internal function
    var all_inherited_members = __get_all_inherited_members__(obj);

    for (var inherited_class in all_inherited_members) {
        
        var inherited_members = all_inherited_members[inherited_class];

        for (var class_name in inherited_members) {
            var class_members = inherited_members[class_name];

            for (var member_key in class_members) {
                if (split_name(member_key) == split_name(name)) {
                    return GlobalIntellisenseRoot.get_from_global_dict(member_key);
                }
            }
        }
    }

    return null;
}

function resolve_with_inherited_members(obj) {
    var class_members = obj.get_class_members("all");

    for (var key in class_members) {
        var class_member_obj = GlobalIntellisenseRoot.get_from_global_dict(key);
        var inheritedObj = __is_base_class_member__(obj, key);

        if (inheritedObj != null) {
            // This is an inherited object. so delete the one from this class and use the other one.
            for (var k in class_member_obj.get_usage()) {
                inheritedObj.usage[k] = class_member_obj.usage[k];
            }

            // Delete the original object
            delete GlobalIntellisenseRoot.obj_dict[key];
            delete obj.class_members[key];
        }

        if (inheritedObj == null && class_member_obj.type == "function") {
            resolve_with_inherited_members(class_member_obj);
        }
    }
}

function generate_intellisense(code) {
    // 'use strict';    
    var str_results = "";

    var ast = parse(code, false, true);

    clean_global_definitions_found();

    clean_defun_definitions_found();

    GlobalIntellisenseRoot.source_array = code.split("\n");
    GlobalIntellisenseRoot.source_code = code;

    // Add parent for all the global classes data members 
    for (var global_class in GlobalIntellisenseRoot.get_global_classes()) {
        var global_class_obj = GlobalIntellisenseRoot.get_single_defun(global_class);
        add_parent(global_class_obj);
    }

    // Now resolve the child class data members with parents
    for (var object_name in GlobalIntellisenseRoot.obj_dict) {
        var g_object = GlobalIntellisenseRoot.get_from_global_dict(object_name);
        if (g_object.type == "function") {
            resolve_with_parent_members(g_object);
        }
    }

    // Now resolve the child class data members with parents
    for (var defun_name in GlobalIntellisenseRoot.get_global_classes()) {
        var g_object = GlobalIntellisenseRoot.get_single_defun(defun_name);
        resolve_with_inherited_members(g_object);
    }

    return GlobalIntellisenseRoot;
}

//generate InheritanceClassLvl and store it in the inheritanceClassLvl(Global Variable)==========
function generateInheritanceLvl(intellisenseRoot) {
    var intellisense = intellisenseRoot;
    var classLvl;
    inheritanceClassLvl = [];

    for(var key in intellisense.defun) {
        classLvl = 0;

        var currentClassObj = intellisense.defun[key];
        var curClassObj = currentClassObj;
        var supClassName;
        if(curClassObj.super_classes)
            supClassName = curClassObj.super_classes[0];

        while (supClassName) {
            curClassObj = get_class_obj(supClassName);
            supClassName = curClassObj.super_classes[0];
            classLvl ++;
        }

        if(!inheritanceClassLvl[classLvl]) {
            inheritanceClassLvl[classLvl] =[];
            inheritanceClassLvl[classLvl].push(currentClassObj);
        } else {
            inheritanceClassLvl[classLvl].push(currentClassObj);
        }
    }
    return inheritanceClassLvl;
}