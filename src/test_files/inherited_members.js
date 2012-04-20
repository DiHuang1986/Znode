function FuncOne() {
    this.zOrder = 0;
    this.xOrder = 6;
}

function FuncTwo() {
    this.zOrder = 10;

    this.changeOrder = function() {
        this.xOrder = 8;
    }
}

FuncTwo.prototype = new FuncOne();
