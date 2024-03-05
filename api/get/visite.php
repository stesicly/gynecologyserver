<?php
require 'connect.php';

$request_body = file_get_contents('php://input');
$data = json_decode($request_body);

$query = "SELECT * " .
    "FROM " .
    $data->tabId . " " .
    "WHERE CodicePaz=" . $data->codicePaziente . " " .
    "ORDER BY " . $data->dataFieldName . " DESC";

echo generateJsonFromCall($query, $conn);

?>