<?php
require "../connect.php";
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    // Imposta gli header CORS per consentire la richiesta preflight
    header('Access-Control-Allow-Origin: http://localhost:3000');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    // Rispondi con un status 200 per indicare che la preflight è accettata
    http_response_code(200);
    exit;
}
session_set_cookie_params(0, '/', '//localhost:3000'); // Sostituisci '.tuo-dominio.com' con il tuo dominio

session_start();

$request_body = file_get_contents('php://input');
$sessionId = json_decode($request_body)->sessionId;
$userId = json_decode($request_body)->userId;
//$sessionId = $_SESSION["session_id"];
$ip = getUserIpAddr();
$query = "SELECT * " .
    "FROM loggeduser " .
    "WHERE ip='" . $ip . "' and user='" . $userId . "' and sessionid='" .  $sessionId . "'";

$result = $conn->query($query);

if (!$result) {
    die('Invalid query: ' . mysqli_error($conn));
}
echo '{"message":"ok"}'
//echo generateJsonFromCall($query, $conn);

/*
try {
    $request_body = file_get_contents('php://input');
    if (isset(json_decode($request_body)->sessionId)){

        $query = "SELECT * " .
            "FROM loggeduser " .
            "WHERE sessionid='" .  json_decode($request_body)->sessionId . "'";


        echo generateJsonFromCall($query, $conn);

    }
    else{
        echo "";
    }
} catch (Exception $e) {
    echo "no data";
}*/
?>