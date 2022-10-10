<?php

if(isset($_POST["search"])) {
  $search = $_POST["search"];
  // pcregrep: case insensitive, I ignoring binary files, recursive search
  // $cmd = 'pcregrep --binary-files=without-match -ri "' . $search . '" "./curriculum"'; 
  // binary-files option doesn't exist on some operating system's pcregrep
  $cmd = 'pcregrep -ri "' . $search . '" "./curriculum"';
  $res = [];
  $stdout = exec($cmd, $res);
  echo json_encode(["res"=>$res, "debug"=>$cmd]);
} else {
  echo json_encode(["res"=>[], "error"=>"POST search param not found."]);
}
?>