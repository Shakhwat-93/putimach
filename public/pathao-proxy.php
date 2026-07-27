<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, Accept");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Check if PHP has the getallheaders function, otherwise use custom fallback
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            } elseif ($name == 'CONTENT_TYPE') {
                $headers['Content-Type'] = $value;
            } elseif ($name == 'CONTENT_LENGTH') {
                $headers['Content-Length'] = $value;
            }
        }
        return $headers;
    }
}

// Config (Change this to https://api-hermes.pathao.com for live production)
$baseUrl = 'https://api-hermes.pathao.com';

$route = isset($_GET['route']) ? $_GET['route'] : '';

if (empty($route)) {
    echo json_encode(["error" => "No route specified in query param 'route'"]);
    exit(1);
}

// Build destination URL
$url = $baseUrl . $route;

// Init cURL request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

// Forward body content
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// Forward essential headers
$headers = [];
$incomingHeaders = getallheaders();

// Check if Authorization was stripped by Apache/cPanel and restore it if possible
$authHeader = null;
if (isset($incomingHeaders['Authorization'])) {
    $authHeader = $incomingHeaders['Authorization'];
} elseif (isset($incomingHeaders['authorization'])) {
    $authHeader = $incomingHeaders['authorization'];
} elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
}

if ($authHeader) {
    $headers[] = "Authorization: $authHeader";
}

foreach ($incomingHeaders as $name => $value) {
    $lowerName = strtolower($name);
    if ($lowerName === 'content-type' || $lowerName === 'accept') {
        $headers[] = "$name: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(["error" => curl_error($ch)]);
} else {
    http_response_code($httpCode);
    echo $response;
}
curl_close($ch);
?>
