<?php
require "../connect.php";

// Costruisci la query SQL
$query = "SELECT esamiraccoglitore.id as folderID, esamiraccoglitore.titolo as foldertitle, " .
    "esami.id as examinationsID, esami.titolo as examinationstitle, esame.id as examinationID, esame.nome as 'name' " .
    "FROM esamiraccoglitoreesami " .
    "INNER JOIN esamiraccoglitore ON esamiraccoglitore.id=esamiraccoglitoreesami.esameraccoglitoreid " .
    "INNER JOIN esami ON esami.id=esamiraccoglitoreesami.esamiid " .
    "INNER JOIN esamiesame ON esamiesame.esamiid=esami.id " .
    "INNER JOIN esame ON esame.id=esamiesame.esameid";


echo generateJsonFromCall($query, $conn);

?>