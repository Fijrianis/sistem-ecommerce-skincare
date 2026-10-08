<?php
// =============================================
//   Auth Middleware (Session-based)
// =============================================

require_once __DIR__ . '/../helpers/response.php';

/**
 * Deteksi apakah request masuk melalui HTTPS.
 * Mendukung reverse proxy / load balancer umum.
 */
function isHttps(): bool {
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') return true;
    if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') return true;
    if (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443) return true;
    return false;
}

function startSecureSession(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => 86400 * 7,   // 7 hari
            'path'     => '/',
            'secure'   => isHttps(),    // true otomatis saat HTTPS, false saat localhost HTTP
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_name('glowskin_sess');
        session_start();
    }
}

/**
 * Hanya bisa diakses user yang sudah login.
 * Jika tidak, langsung return 401.
 */
function requireAuth(): array {
    startSecureSession();
    if (empty($_SESSION['user_id'])) {
        errorResponse('Unauthorized. Silakan login terlebih dahulu.', 401);
    }
    return [
        'user_id' => $_SESSION['user_id'],
        'role'    => $_SESSION['role'] ?? 'customer',
        'name'    => $_SESSION['name'] ?? '',
    ];
}

/**
 * Hanya bisa diakses admin.
 */
function requireAdmin(): array {
    $user = requireAuth();
    if ($user['role'] !== 'admin') {
        errorResponse('Forbidden. Hanya admin yang bisa mengakses.', 403);
    }
    return $user;
}

/**
 * Return info user jika login, atau null jika tidak.
 * Tidak memblokir akses.
 */
function optionalAuth(): ?array {
    startSecureSession();
    if (!empty($_SESSION['user_id'])) {
        return [
            'user_id' => $_SESSION['user_id'],
            'role'    => $_SESSION['role'] ?? 'customer',
            'name'    => $_SESSION['name'] ?? '',
        ];
    }
    return null;
}
