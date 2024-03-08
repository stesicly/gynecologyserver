<?php
require "../connect.php";

$request_body = file_get_contents('php://input');
$data = json_decode($request_body);

$query = "SELECT * " .
    "FROM paziente " .
    "WHERE CodicePaz=" . $data->codicePaziente . " " .
    "ORDER BY Cognome, Nome, CodicePaz";

echo generateJsonFromCall($query, $conn);

?>