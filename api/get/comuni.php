<?php
require "../connect.php";

$result = $conn->query("SELECT * " .
    "FROM " .
    "elencocomuni " .
    "ORDER BY NomeComune");

if (!$result) {
    die('Invalid query: ' . mysqli_error($conn));
}

$json = '[';
while($rows=mysqli_fetch_array($result,MYSQLI_ASSOC)) {
    $json.= '{';

    foreach( $rows as  $key=>$value ){
        $json.='"' . $key . '":"' .  utf8_encode(utf8_decode($value)) . '",';

    }
    $json = substr($json, 0, strlen($json)-1) . '},';
}
echo substr($json, 0, strlen($json)-1) . "]";
mysqli_close($conn);


?>