var first_global = 1;
var second_global = "hello";

function one() {
}

function two() {
}

two.prototype = new one();

function three() {
}

three.prototype = new two();

var third_global = three;
