<?php
require "../connect.php";

    $request_body = file_get_contents('php://input');
    $jsonDecode = json_decode($request_body);
    $nomeTabella = $jsonDecode->nomeTabella;
    $codicePaz = $jsonDecode->codicePaz;
    $id = $jsonDecode->id;
    $visita = $jsonDecode->visita;
    $whereCondition = " WHERE " . ($nomeTabella!=="colposcopia" ? "id=" . $id : "CodicePaz=" . $codicePaz);

    $fields = [];
    $values = [];
    $query;

    if ($id === -1 || $id === null) {
        foreach ($visita as $key => $value) {
            if ($key !== "id") {
                $fields[] = $key;
                $values[] = $value !== "" ? '"' . $value . '"' : '""';
            }
        }
        if (!in_array("CodicePaz", $fields)) {
            $fields[] = "CodicePaz";
            $values[] = $codicePaz;
        }

        $query = "INSERT INTO " . $nomeTabella . " (" . implode(",", $fields) . ") " .
            "VALUES  (" . implode(",", $values) . ") ";

        // Eseguire la query e inviare il risultato
        // $res->send($result);
    } else {
        $setValues = [];
        foreach ($visita as $key => $value) {
            $setValues[] = ' ' . $key . '="' . ($value !== "" ? $value . '"' : '"');
        }
        $query = "UPDATE " . $nomeTabella . " " .
            "SET " . implode(",", $setValues) . $whereCondition;

        // Eseguire la query e inviare il risultato
        // $res->send($result);
    }


    saveData($query, $conn);



?>