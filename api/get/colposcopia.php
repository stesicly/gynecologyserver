<?php
require "../connect.php";

    $request_body = file_get_contents('php://input');
    $data = json_decode($request_body);
    $codicePaziente = $data->codicePaziente;

    $query = "SELECT * FROM colposcopia WHERE CodicePaz='" . $codicePaziente . "' ORDER BY DataColpo DESC";
    echo generateJsonFromCall($query, $conn);

?>