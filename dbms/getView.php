<?php
    // richiamo lo script responsabile della connessione a MySQL
    require "../connect.php";

    /*if (!isset($_SESSION['session_id'])){
        die('{"message":"not connected"}');
    }*/


    $query = 'SELECT * from ';

    $viewName = $_GET["name"];
    //if ($viewName == "customer"){$viewName .= "list";}
    $query .= $viewName;

    if (isset($_GET["where"])){
        $operator = !isset($_GET["like"]) ? "=" : " like ";
        $query .= " WHERE " .  $_GET["where"] . $operator . $_GET["value"];
    }

    if (isset($_GET["order"])){
        $query .= " ORDER BY ";
        if (strpos($_GET["order"], ",desc")){
            $orders = explode(",", $_GET["order"]);
            array_pop($orders);
            for ($i=0; $i < count($orders); $i+=1){
                $query .= $orders[$i] . " desc,";
            }
            $query = rtrim($query, ",");
        }
        else{
            $query .= $_GET["order"];
        }
    }


    $result = mysqli_query($conn, "SHOW COLUMNS FROM $viewName LIKE 'name'");
    $exists = (mysqli_num_rows($result))?TRUE:FALSE;

    if ($exists && !isset($_GET["order"])){
        $query .= " ORDER BY name";
    }

    //echo $query;

    $result = mysqli_query($conn, $query);

    if (!$result) {
        dieMessage(
            "Invalid query",
            mysqli_error($conn),
            $query
        );
    }
    echo getJsonFromSql($result);
    mysqli_close($conn);
?>