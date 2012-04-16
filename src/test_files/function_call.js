var testVar = new myNewFunc();

function myFunc() {
    function HelloFunc() {
    }

    this.func1 = function(myArgs) {
    }

    HelloFunc();
}

function testFunc() {
    var mf = new myFunc();
    mf.func1();
}
