<?php
// =============================================
//   Response & CORS Helpers
// =============================================

/**
 * Daftar origin yang diizinkan.
 * Tambahkan domain production kamu di sini, contoh: 'https://glowskin.com'
 */
function getAllowedOrigins(): array {
    return [
        'http://localhost',
        'http://localhost:3000',
        'http://localhost:8080',
        'http://127.0.0.1',
        'http://sistem_skincare.test',
    ];
}

function setCorsHeaders(): void {
    $requestOrigin  = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = getAllowedOrigins();

    // Izinkan jika origin ada di whitelist, atau jika request tidak membawa Origin header
    // (misal dari browser same-origin / tool testing)
    if (empty($requestOrigin) || in_array($requestOrigin, $allowedOrigins, true)) {
        $origin = empty($requestOrigin) ? '*' : $requestOrigin;
    } else {
        // Origin tidak dikenal — tolak dengan 403
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Origin tidak diizinkan.']);
        exit;
    }

    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');
    // Cegah browser cache respons CORS preflight terlalu lama
    header('Vary: Origin');
}

function handlePreflight(): void {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function jsonResponse(mixed $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function successResponse(mixed $data = null, string $message = 'OK', int $status = 200): void {
    $response = ['success' => true, 'message' => $message];
    if ($data !== null) $response['data'] = $data;
    jsonResponse($response, $status);
}

function errorResponse(string $message, int $status = 400): void {
    jsonResponse(['success' => false, 'message' => $message], $status);
}

function getRequestBody(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function requireMethod(string ...$methods): void {
    if (!in_array($_SERVER['REQUEST_METHOD'], $methods, true)) {
        errorResponse('Method not allowed', 405);
    }
}
