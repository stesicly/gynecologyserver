<?php
// richiamo lo script responsabile della connessione a MySQL
require "../connect.php";

function get_ip_address(){
    foreach (array('HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_X_CLUSTER_CLIENT_IP', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR') as $key){
        if (array_key_exists($key, $_SERVER) === true){
            foreach (explode(',', $_SERVER[$key]) as $ip){
                $ip = trim($ip); // just to be safe

                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false){
                    return $ip;
                }
            }
        }
    }
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

    if ($num_rows == 1){
        session_start();
        $rows = mysqli_fetch_array($result,MYSQLI_ASSOC);
        foreach( $rows as  $key=>$value ){
            if ($key == "id"){
                $_SESSION["user_id"] = $value;
            }

        }
        echo '{"msg":"ok","description":"utente valido", "ip" : "' . $ip .'", "userid":"' . $_SESSION["user_id"] .'"}';

        $_SESSION['session_id'] = session_id();/** da salvare nel db **/
        $_SESSION['session_user'] = $username;
    }
    else {
        echo '{"msg":"error", "description":"Credenziali non valide", "ip" : "' . $ip .'"}';
    }


?>