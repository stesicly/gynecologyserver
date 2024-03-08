<?php
require "../connect.php";


$query = "SELECT max(CodicePaz) + 1 as newcodice FROM paziente ";

echo generateJsonFromCall($query, $conn);

?>