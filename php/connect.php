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
    echo "Connected successfully";



    // Formulate Query
    // This is the best way to perform an SQL query
    // For more examples, see mysql_real_escape_string()

    $result = $conn->query("SELECT LTRIM(Cognome) as Cognome, " +
        "LTRIM(Nome) as Nome, " +
        "paziente.* " +
        "FROM paziente ORDER BY Cognome, Nome, CodicePaz");
        if ($result) {

            while($obj = $result->fetch_object()){

                $line.=$obj->CodicePaz;

                $line.=$obj->Cognome;

                $line.=$obj->Nome;

            }

        }

        $result->close();

        unset($obj);

        unset($sql);

        unset($query);
?>