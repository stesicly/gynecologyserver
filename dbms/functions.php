<?php

    function microtime_float()
    {
        list($usec, $sec) = explode(" ", microtime());
        return intval(round(((float)$usec + (float)$sec)*1000));
    }

?>