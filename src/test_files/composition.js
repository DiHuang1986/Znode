// Define an object
function brick()
{
  return true;
}

// Define an object
function wall()
{
  this.brick1 = new brick();
  this.brick2 = new brick();
  this.brick3 = new brick();

  return true;
}

