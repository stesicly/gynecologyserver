<?php
    // richiamo lo script responsabile della connessione a MySQL
    require "../connect.php";
    session_start();

    $user_id = $_SESSION["user_id"];
    $id = isset($_POST["id"]) ? $_POST["id"] : false;
    $query = 'SELECT * from userslotslist WHERE id=' . $user_id;
    $result = mysqli_query($conn, $query);

    if (!$result) {
        dieMessage(
            "Save error",
            mysqli_error($conn),
            $query
        );
    }

    $fields = array();
    $values = array();
    $both = array();
    $attachments = array();

    foreach ($_POST as $key => $value) {
        if ($key !== "target" && $key !== "attachments" && $key !== "tempFolder"){
            array_push($fields, $key);
            array_push($values, '"' . $value . '"');
            array_push($both, $key . ' = "' . $value . '"');
        }
        else{
            if ($key == "attachments"){
                $attachments = json_decode($value); /* explode(",", $value);*/
            }
        }
    }

    if ($id){
        $query = "UPDATE " . $_POST["target"] .
                " SET " . implode(",", $both) .
                " WHERE id=" . $id;
    }
    else{
        $query = "INSERT INTO " . $_POST["target"] . " ( " . implode(",", $fields) . ") " .
                "values (" . implode(",", $values) .")";
    }

    $result = mysqli_query($conn, $query);

    if (!$result) { dieMessage(
        "Insert or update error",
        mysqli_error($conn),
        $query
    );}

    $postId = $id ? $id : mysqli_insert_id($conn);
    $tempFolder = isset($_POST["tempFolder"]) ? $_POST["tempFolder"] : $postId;


    if ($attachments && count($attachments) > 0 && $attachments[0] !=""){
        $startingFolder = "../docs/temporary-folder" . "/" . $tempFolder;
        $finalFolder = "../docs/" . $postId;

        if (!file_exists($finalFolder)) {
            mkdir($finalFolder, 0777, true);
        }

        $query = "DELETE from documents WHERE idcustomer=" . $postId;
        $result = mysqli_query($conn, $query);

        /*$attachmentsArray = array();
        foreach ($attachments as $key => $value) {

                echo $key . "\n\r\n\n";
                echo $value . "\n\r\n\n";
                array_push($attachmentsArray, $key . ' = "' . $value . '"');

        }*/

        for ($i = 0; $i < count($attachments); $i++) {
           /* echo $attachments[$i]->name . "\n\r";*/
            $query = 'INSERT INTO documents (idcustomer, name, documenttype, releasedate, expirydate) ' .
                'values (' .   $postId . ',"' .
                $attachments[$i]->name . '",' .
                (isset($attachments[$i]->documenttype) &&  isset($attachments[$i]->documenttype)!="" ? $attachments[$i]->documenttype : "null") . ',"' .
                (isset($attachments[$i]->releasedate) ? $attachments[$i]->releasedate : null) . '","' .
                (isset($attachments[$i]->expirydate ) ? $attachments[$i]->expirydate : null) . '")';

            /*$query = "INSERT INTO documents (idcustomer, name, documenttype, releasedate, expirydate) " .
                "values (" .   implode(",", $attachmentsArray ) .  ")";*/



            /*echo $query . "\n\r";*/
            $result = mysqli_query($conn, $query);
            if ($result){
               /* echo $startingFolder . "/" .  $attachments[$i]->name . "\n\r";
                echo $finalFolder . "/" .  $attachments[$i]->name . "\n\r";*/
                if (file_exists($startingFolder . "/" .  $attachments[$i]->name)) {
                    rename($startingFolder . "/" .  $attachments[$i]->name, $finalFolder . "/" .  $attachments[$i]->name);
                }

            }
        }
        /*foreach ($attachments as $attachment) {
            $query = 'INSERT INTO documents (idcustomer, name, documenttype, releasedate, expirydate) ' .
                     'values (' .   $postId . ',"' .
                                    $attachment->{'name'} . '","' .
                                    $attachment->{'documenttype'} . ',' .
                                    $attachment->{'releasedate'} . ',' .
                                    $attachment->{'expirydate'} . ')';

            $result = mysqli_query($conn, $query);
            if ($result){
                rename($startingFolder . "/" . $attachment, $finalFolder . "/" . $attachment);
            }
        }*/
        if (file_exists($startingFolder)) {
            rmdir($startingFolder);
        }
    }

    if (!$result) {
        dieMessage(
            "Insert or update error",
            mysqli_error($conn),
            $query
        );
    }
    else{
        echo '{"message" : "ok", "id" : ' . $postId . '}';
    }

    mysqli_close($conn);
?>