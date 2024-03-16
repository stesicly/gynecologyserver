<?php
    // richiamo lo script responsabile della connessione a MySQL
    require "../connect.php";
    session_start();

    $user_id = $_SESSION["user_id"];
    $query = 'SELECT * from userslotslist WHERE id=' . $user_id;

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