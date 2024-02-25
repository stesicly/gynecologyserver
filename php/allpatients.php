<?php
    $servername = "31.11.39.100";
    $username = "Sql1702274";
    $password = "Mh\$Dom4Mh\$Dom4";
    $dbname = "Sql1702274_1";

    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Check connection
    if ($conn->connect_error) {
      die("Connection failed: " . $conn->connect_error);
    }



    $result = $conn->query("SELECT LTRIM(Cognome) as Cognome, " .
        "LTRIM(Nome) as Nome, " .
        "paziente.* " .
        "FROM paziente ORDER BY Cognome, Nome, CodicePaz limit 100");

    if (!$result) {
        die('Invalid query: ' . mysqli_error($conn));
    }
    //echo '{"msg":"ha funzionato!"}';

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