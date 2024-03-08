<?php
require "../connect.php";

$request_body = file_get_contents('php://input');
$data = json_decode($request_body);

$query = "SELECT * " .
    "FROM " .
    "ginecologica " .
    "WHERE CodicePaz=" . $data->codicePaziente . " " .
    "ORDER BY DataVisitaGin DESC";;

echo generateJsonFromCall($query, $conn);

?>