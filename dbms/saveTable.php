<?php
    // richiamo lo script responsabile della connessione a MySQL
    require "../connect.php";
    session_start();


    $id = isset($_POST["id"]) ? $_POST["id"] : false;
   /* $user_id = $_SESSION["user_id"];
   $query = 'SELECT * from userslotslist WHERE id=' . $user_id;
    $result = mysqli_query($conn, $query);

    if (!$result) {
        dieMessage(
            "Save error",
            mysqli_error($conn),
            $query
        );
    }*/

    $takings = isset($_POST["takings"]) ? $_POST["takings"] : [];

    /** dapprima cancello i takings e li inserisco dopo che i subscriptions saranno aggiornati **/
    if ($takings){
        for ($i = 0; $i < count($takings); $i+=1){
            $subparameters = explode("=", $takings[$i]);
            if( $subparameters[0] != "subscription"){
                $query = "DELETE from " . $_POST["takingsTableName"] . " WHERE subscription=" . $subparameters[1];
                $result = mysqli_query($conn, $query);
            }
        }
    }

    $field = isset($_POST["field"]) ? $_POST["field"] : "none";
    $value = isset($_POST["value"]) ? $_POST["value"] : -1;


    $query = "DELETE from " . $_POST["target"] . " WHERE " . $field . "=" . $value;
    $result = mysqli_query($conn, $query);


    $params = isset($_POST["params"]) ? $_POST["params"] : [];
    $newSubscriptions = [];

    for ($i = 0; $i < count($params); $i+=1){
        $fields = array();
        $values = array();
        $query = "";
        $tempSubscriptionId = "";
        $parameters = explode("&", $params[$i]);
        for ($j=0; $j < count($parameters); $j+=1) {
            $subparameters = explode("=", $parameters[$j]);
            if ($subparameters[0] != "target" && $subparameters[0] != "id"){
                array_push($fields, $subparameters[0]);
                array_push($values, '"' . $subparameters[1] . '"');
            }
            else{
                if ($subparameters[0] == "id"){
                    $tempSubscriptionId = $subparameters[1];
                }
            }
        }
        $query = "INSERT INTO " . $_POST["target"] . " ( " . implode(",", $fields) . ") " .
            "values (" . implode(",", $values) .")";


        $result = mysqli_query($conn, $query);
        $newSubscriptions[$tempSubscriptionId] = mysqli_insert_id($conn);
    }

    if (count($takings)>0){
       /* foreach ($newSubscriptions as $item => $value){
            echo $item . " ===> " . $value . "<br/>";
        }*/

        //date={{date}}&subscription={{subscription}}&item={{item}}&type={{type}}&amount={{amount}},sum={{sum}}
        for ($i = 0; $i < count($takings); $i+=1){
            $fields = array();
            $values = array();
            $query = "";
            $takingsParameters = explode("&", $takings[$i]);
            for ($j=0; $j < count($takingsParameters); $j+=1) {
                $subparameters = explode("=", $takingsParameters[$j]);
                if ($subparameters[0] == "subscription"){
                    /*echo  $subparameters[1] . "-->" . $newSubscriptions[$subparameters[1]] . "<br/>";*/
                    $subparameters[1] = $newSubscriptions[$subparameters[1]];
                }
                array_push($fields, $subparameters[0]);
                array_push($values, '"' . $subparameters[1] . '"');

            }
            if (count($fields)>0){
                $query = "INSERT INTO takings ( " . implode(",", $fields) . ") " .
                    "values (" . implode(",", $values) .")";

                $result = mysqli_query($conn, $query);
            }
            /*echo $query . "<br/>";*/
        }
    }

    /**/if (!$result) {
        dieMessage(
            "Insert or update error",
            mysqli_error($conn),
            $query
        );
    }
    else{
        echo '{"message" : "ok", "id" : ' . $value . '}';
    }

    mysqli_close($conn);
?>