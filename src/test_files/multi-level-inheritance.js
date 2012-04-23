var first_global = 1;
var second_global = "hello";

function one() {
    this.var1 = 5;
    this.var1 = 10;
    this.var1func = function(test) { return "hello"; }
}

function two() {
    this.var2 = 10;
    this.var2 = 15;
    this.var2func = function(myTest) { return "newHello"; }
}

two.prototype = new one();

function three() {
    this.var3 = 15;
    this.var3func = function(helloTest) { return "new new hello"; }
    this.var4 = new two();
}

three.prototype = new two();

function threeB(){}
threeB.prototype = new two();

function twoB () {}
twoB.prototype = new one();

function threeC() {}
threeC.prototype = new twoB();
function threeD(){}
threeD.prototype = new twoB();

var third_global = three;
