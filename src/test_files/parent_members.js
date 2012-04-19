function parentFunc() {
    this.zOrder = 0;

    this.firstFunc = function() { return 6; }

    this.secondFunc = function() {
        this.zOrder = 10;

        this.firstFunc();
    }
}
