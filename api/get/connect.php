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


?>