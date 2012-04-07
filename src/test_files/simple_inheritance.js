// Declare two objects - we're going to want Lion to
// inherit from cat
function cat()
{
  this.eyes = 2;
  this.legs = 4;
  this.diet = 'carnivore';

  return true;
}

function lion()
{
  this.mane = true;
  this.origin = 'Africa';

  return true;
}

// Now comes the inheritance
lion.prototype = new cat();

// We can now obtain lion.diet
var simba = new lion();
var simba_diet = simba.diet;

