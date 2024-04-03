<?php
require "../connect.php";

// Costruisci la query SQL
$query = "SELECT esamiraccoglitore.id as folderID, esamiraccoglitore.titolo as foldertitle,  " .
    "IF( esami.id IS NULL , '--', esami.id) as examinationsID, " .
    "IF(esami.titolo is NULL, '--', esami.titolo) as examinationstitle, " .
    "IF(esame.id is NULL, '--', esame.id) as examinationID, " .
    "IF(esame.nome is NULL,'--',esame.nome) as 'name' " .
    "FROM esamiraccoglitore " .
    "left JOIN esamiraccoglitoreesami ON esamiraccoglitore.id=esamiraccoglitoreesami.esameraccoglitoreid " .
    "LEFT JOIN esami ON esami.id=esamiraccoglitoreesami.esamiid " .
    "LEFT JOIN esamiesame ON esamiesame.esamiid=esami.id " .
    "LEFT JOIN esame ON esame.id=esamiesame.esameid";


echo generateJsonFromCall($query, $conn);

?>