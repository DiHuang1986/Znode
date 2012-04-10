<<<<<<< HEAD
<?php

// list all files in the files directory
foreach(glob("../files/*.json") as $filename){
  $name = preg_split("/\//",$filename);
  $name = preg_split("/\.json/", $name[2]);
  echo "<div class='file'>" .  $name[0] . "</div>";
}
=======
<?php

// list all files in the files directory
foreach(glob("../files/*.json") as $filename){
  $name = preg_split("/\//",$filename);
  $name = preg_split("/\.json/", $name[2]);
  echo "<div class='file'>" .  $name[0] . "</div>";
}
>>>>>>> 7e8c6735dc268dee8cb8e92cdc16093baaf3594d
?>