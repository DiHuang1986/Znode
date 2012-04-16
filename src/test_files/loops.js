var x = 5;
var y = 6;

for (x = 7; x < 10; x += 3) {
    y = 10;
    y = 11;
    y = "myhello";
}

for (x = 7; x < 10; ++x) {
    y = "hello";
}

if (a == 5 || b == 3 || c == "hello") {
    a = 10;
    b = 10;
    c = "ok";
}

while (a < 5 && b > 7) {
    a = 10;
    b = 2;
}

-------------------------------------------------------
var y;

switch(x) {
    case 1: y = 1; break;
    case 2: z = 2; break;
    case 4: getFunc(m, n, 5, "hello"); break;  // Function call
}

--------------------------------------------------------

var x;
x = 10;

function xtest(val) {
    return val * 10;
}

function test() {
    x = 20;
    xtest(x);
    var y;
    y = 11;
}

----------------------------------------------------------
