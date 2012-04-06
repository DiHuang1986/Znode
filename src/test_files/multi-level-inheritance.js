function one() {
}

function two() {
}

two.prototype = new one();

function three() {
}

three.prototype = new two();
