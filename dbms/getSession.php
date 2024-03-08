<?php
// richiamo lo script responsabile della connessione a MySQL
    session_start();
    if(!isset($_SESSION['session_id'])) {
        die( '{"msg":"error"}');
    }
    else{
        echo '{"msg":"sessione valida", "id":"' . $_SESSION["user_id"] . '"}';
    }
?>