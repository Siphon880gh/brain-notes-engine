<?php

if(isset($_GET["search"])) {
  // echo "HIT 1";
  include("./env/all/pcregrep.php");
  include("./env/dir-snippets.php");
  // $search = $_POST["search"];
  $search = $_GET["search"];
  // pcregrep: case insensitive, I ignoring binary files, recursive search
  // $cmd = 'pcregrep --binary-files=without-match -ri "' . $search . '" "./curriculum"'; 
  // binary-files option doesn't exist on some operating system's pcregrep
  $cmd = $pcregrep . ' -ri  --exclude-dir=node_modules  --exclude-dir=node_modules "' . $search . '" "' . $DIR_SNIPPETS . '"';
  $res = [];
  $stdout = exec($cmd, $res);
  echo json_encode(["res"=>$res, "cmd"=>$cmd, "stdout"=>$stdout]);
  // echo json_encode(["res"=>$res, "debug"=>$cmd]);
} else {
  // echo "HIT 2";
  echo json_encode(["res"=>[], "error"=>"POST search param not found."]);
}
// echo "HIT 3";
?>