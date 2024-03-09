<?php
require "../connect.php";

    $request_body = file_get_contents('php://input');
    $paziente = json_decode($request_body)->paziente;
    $fields = [];
    $values = [];


    foreach( $paziente as  $key=>$value ){
        if ($key!=="rank"){
            array_push($fields, $key);
            array_push($values,$key!=="" ? '"' . $value . '"': '\"\"');
        }
    };


    $query = "INSERT INTO paziente (" . implode(",", $fields) . ") " .
        "VALUES  (" . implode(",", $values) . ") ";

    saveData($query, $conn);

?>