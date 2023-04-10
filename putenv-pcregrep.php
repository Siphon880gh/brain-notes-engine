<?php

//putenv not working and even checked php.ini for disable_function
//putenv('PATH=/usr/bin:/bin:/Users/wengffung/anaconda3/bin/pcregrep');
$pcregrep = "/Users/wengffung/anaconda3/bin/pcregrep";
if (file_exists($pcregrep)) {
    //echo "Found anaconda3 version of pcregrep";
} else {
    //echo "No anaconda3 version of pcregrep. Will revert to normal pcregrep";
    $pcregrep = "pcregrep";
}
?>