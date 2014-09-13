<?php

//This comes in
if(isset($_GET['term'])){
    $term = $_GET['term'];
} else {
    $term = '';
}

//From a bunch of data
$val = array("c++", "java", "php", "coldfusion", "javascript", "asp", "ruby", "nodejs");

//Search for a matchin pattern
$return = array();
foreach($val as $word){
    if(strpos($word, $term) !== false){
        $return[] = $word;
    }
}

echo json_encode($return);


