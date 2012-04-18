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

    if (i == 4) {
        mf.func1();
    }

    this.myTest = function() {
        mf.func1();
    }

    this.myTest();
}
