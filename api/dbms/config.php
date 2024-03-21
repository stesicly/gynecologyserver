<?php
    $DB_host     = 'localhost:3000';
    $DB_user     = 'root';
    $DB_password = '';
    $DB_name     = 'gymnasium';

    $max_file_size = [];
    $max_file_size["image"] = 65536;
    $max_file_size["doc"] = 5000000;

        $allowed_file_type = array(
        'doc'  => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'pdf'  => 'application/pdf',
        'zip'  => 'application/zip',
        'jpg' => 'image/jpeg',
        'png' => 'image/png'
    )


?>