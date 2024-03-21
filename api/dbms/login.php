<?php
// richiamo lo script responsabile della connessione a MySQL
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
session_set_cookie_params(0, '/', '//localhost:3000');
session_start();
$sessionId = session_id();
$_SESSION['session_id'] = $sessionId;/** da salvare nel db **/





    $request_body = file_get_contents('php://input');
    $username = json_decode($request_body)->username;
    $password = json_decode($request_body)->password;


    $query = "SELECT id,username, password FROM user WHERE username = '" . $username . "' and password='" . $password . "'";
    $result = mysqli_query($conn, $query);

    if (!$result) {
        dieMessage(
            "Invalid query",
            mysqli_error($conn),
            $query
        );
    }
    $num_rows = mysqli_num_rows($result);
    $ip = getUserIpAddr();
    //$record = geoip_record_by_name($ip);

    $userId = "";
    if ($num_rows == 1){
        $rows = mysqli_fetch_array($result,MYSQLI_ASSOC);
        foreach( $rows as  $key=>$value ){
            if ($key == "id"){
                $_SESSION["user_id"] = $value;
                $userId = $value;
            }

        }
        echo '{"msg":"ok","description":"utente valido", 
                "userid":"' . $_SESSION["user_id"] .'", "sessionid" : "' . $sessionId . '"}';

        $query = "INSERT INTO loggeduser(user, sessionid, ip) " .
                "VALUES(" . $userId . ",'" . $sessionId . "','" . $ip . "')";


        $result = mysqli_query($conn, $query);

        $_SESSION['session_user'] = $username;
    }
    else {
        echo '{"msg":"error", "description":"Credenziali non valide", "ip" : "' . $ip .'"}';
    }
    mysqli_close($conn);

?>