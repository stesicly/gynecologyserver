<?php
require "../connect.php";

    $request_body = file_get_contents('php://input');
    $paziente = json_decode($request_body)->paziente;
    $values = [];


    foreach( $paziente as  $key=>$value ){
        if ($key!=="CodicePaz" && $key!=="rank"){
            array_push($values, ' ' . $key . '="' . ($key!=="" ? $value . '"': '"'));
        }
    };

    $query = "UPDATE paziente " .
        "SET " . implode(",", $values) . " " .
        "WHERE CodicePaz='" . $paziente->CodicePaz . "'";

    saveData($query, $conn);

?>