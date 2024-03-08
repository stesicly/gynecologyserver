<?php

    require 'config.php';

    //echo $DB_host . "$$$$" . $DB_user . "$$$$" . $DB_password . "$$$$" . $DB_name . "$$$$" ;

    global $conn;
    $conn = mysqli_connect($DB_host, $DB_user, $DB_password);
    if (!$conn) {
        die ('Non riesco a connettermi: ' . mysqli_error());
        echo '{"status":"error", "msg":"non riesco a connettermi"}';
    }
    else{
        //echo '{"status":"ok", "msg":"connessione riuscita"}';
    }

    $db_selected = mysqli_select_db($conn, $DB_name);
    if (!$db_selected) {
        die ("Errore nella selezione del database: " . mysqli_error());
         echo '{"status":"error", "msg":"Errore nella selezione del database"}';
    }

    function getJsonFromSql($result){

        $json=array();
        while($row=mysqli_fetch_array($result,MYSQLI_ASSOC)){
            if (isset($row["photo"])){
               // echo base64_decode($row["photo"]);
                if (strlen($row["photo"]) > 30){
                    unset($row["photo"]);
                }
            }

            /*if (isset($row["photo"])){
                if (strlen($row["photo"]) > 30){
                    unset($row["photo"]);
                }
            }*/
            array_push($json,$row);
        }
        return json_encode($json);
    }

    function getJsonFromObject($object){
        $json=array();
        /*foreach ($object as $item){
            array_push($json,$item);
        }
        return json_encode($json);*/
        $json = '[';
        foreach ($object as $item){
            $json.= '{';
            $json.='"' . $item->name . '":"' .  utf8_encode(utf8_decode($item->value)) . '"},';
        }
        return substr($json, 0, strlen($json)-1) . "]";
    }

    function dieMessage($state, $message, $query){
        global $conn;
        $json = [];
        $json["state"]      = $state;
        $json["message"]    = $message;
        $json["query"]      = $query;
        die(json_encode($json));
    }

    function doQuery($queryString, $successCallback = "", $isMultiQuery = false){
        global $conn;
        $query = $queryString;
        $result = "";
        $multipleRows = array();
        if (!$isMultiQuery){
            $result = mysqli_query($conn, $query);
        }
        else{
           // $result = mysqli_multi_query($conn, $query);

            if ($conn->multi_query($query)) {
                do {
                    /* store first result set */
                    if ($result = $conn->store_result()) {
                        while ($row = $result->fetch_row()) {
                            array_push($multipleRows, $row[0]);
                        }
                        $result->free();
                    }
                } while ($conn->next_result());
            }
        }

        if (!$result) {
            dieMessage(
                "error",
                mysqli_error($conn),
                $query
            );
        }
        else{
            if (!$isMultiQuery){
                $successCallback($result->fetch_assoc());
            }
            else{
                $json["multipleRows"] = $multipleRows;
                $successCallback($multipleRows);
            }
        }
    }
?>