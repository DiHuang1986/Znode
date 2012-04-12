// Define an object
function wall()
{
  this.brick1 = new brick();
  this.brick2 = new brick();
  this.brick3 = new brick();
  
  this.brick_no = 5;
  this.brick_color = "brown";

  return true;
}

function wall2()
{
    this.brick = new brick();
}

// Define an object
function brick()
{
  return true;
}
