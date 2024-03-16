<?php
require "../connect.php";

$request_body = file_get_contents('php://input');
$item = json_decode($request_body);
$value = $item->value;
$tableName = $item->tableName;

$query = "INSERT INTO " . $tableName . " (Tipo) VALUES ('" . $value . "')";

saveData($query, $conn);

?>