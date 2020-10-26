<?php
    if (isset($_GET["exploit"])) {
        $bot_url = "http://xssbot:5000/visit";
        $visit_url = "http://web:8088/index.php";

        $ch = curl_init($bot_url);

        $payload = json_encode([
            "url" => $visit_url,
        ]);

        curl_setopt( $ch, CURLOPT_POSTFIELDS, $payload );
        curl_setopt( $ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); 

        $output = curl_exec($ch); 

        curl_close($ch);      
        echo $output;   
    }

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h1>Hi</h1>
</body>
</html>