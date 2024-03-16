<?php
require "../connect.php";

    $request_body = file_get_contents('php://input');
    $jsonDecode = json_decode($request_body);

    $codicePaziente = $jsonDecode->codicePaziente;
    $nomeTabella = $jsonDecode->currentTab;
    $idVisita = $jsonDecode->idVisita;

    // Costruisci la query SQL
    $query = "DELETE FROM " . $nomeTabella . " WHERE id=" . $idVisita;


    saveData($query, $conn);



?>