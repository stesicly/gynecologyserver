<?php
    $servername = "31.11.39.100";
    $username = "Sql1702274";
    $password = "Mh\$Dom4Mh\$Dom4";
    $dbname = "Sql1702274_1";

    $servername = "localhost";
    $username   = "root";
    $password   = "";
    $dbname = "gynecology";

    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    function generateJsonFromCall($query, $conn){

        $result = $conn->query($query);

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

    }

    function getUserIpAddr(){
        if(!empty($_SERVER['HTTP_CLIENT_IP'])){
            //ip from share internet
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        }elseif(!empty($_SERVER['HTTP_X_FORWARDED_FOR'])){
            //ip pass from proxy
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        }else{
            $ip = $_SERVER['REMOTE_ADDR'];
        }
        return $ip;
    }

    function saveData($query, $conn){
        $result = $conn->query($query);

        if (!$result) {
            die('Invalid query: ' . mysqli_error($conn));
        }

        echo '{"message" : "salvataggio avvenuto"}';
        mysqli_close($conn);
    }
?>