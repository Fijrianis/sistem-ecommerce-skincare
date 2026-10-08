<?php
// =============================================
//   Rate Limiter — Login Brute Force Protection
//
//   Strategi: sliding window per IP + per email
//   - Max 5 gagal dalam 15 menit per IP
//   - Max 5 gagal dalam 15 menit per email
//   - Lockout 15 menit setelah limit tercapai
//   - Percobaan sukses mereset counter IP & email
// =============================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

define('RATE_LIMIT_MAX_ATTEMPTS', 5);    // maks percobaan gagal
define('RATE_LIMIT_WINDOW',       900);  // window 15 menit (detik)
define('RATE_LIMIT_LOCKOUT',      900);  // lockout 15 menit (detik)

/**
 * Ambil IP address klien, mendukung proxy umum.
 */
function getClientIp(): string {
    $candidates = [
        $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '',   // Cloudflare
        $_SERVER['HTTP_X_FORWARDED_FOR']  ?? '',   // Load balancer / proxy
        $_SERVER['HTTP_X_REAL_IP']        ?? '',   // Nginx proxy
        $_SERVER['REMOTE_ADDR']           ?? '',
    ];

    foreach ($candidates as $ip) {
        // HTTP_X_FORWARDED_FOR bisa berisi daftar IP, ambil yang pertama (klien asli)
        $ip = trim(explode(',', $ip)[0]);
        if ($ip && filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return $ip;
        }
    }

    // Fallback ke REMOTE_ADDR meskipun private (untuk localhost dev)
    return trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '')[0])
        ?: ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

/**
 * Cek apakah IP atau email sedang dalam lockout / mendekati limit.
 * Melempar errorResponse langsung jika diblokir.
 *
 * @param string $email   Email yang sedang dicoba login
 */
function checkRateLimit(string $email): void {
    $db  = getDB();
    $ip  = getClientIp();
    $now = time();

    // Bersihkan record lama yang sudah di luar window (housekeeping ringan)
    $db->prepare('DELETE FROM login_attempts WHERE attempted_at < ?')
       ->execute([$now - RATE_LIMIT_WINDOW]);

    // Hitung percobaan gagal dalam window untuk IP ini
    $stmtIp = $db->prepare(
        'SELECT COUNT(*) FROM login_attempts
         WHERE ip_address = ? AND attempted_at >= ? AND success = 0'
    );
    $stmtIp->execute([$ip, $now - RATE_LIMIT_WINDOW]);
    $ipCount = (int) $stmtIp->fetchColumn();

    // Hitung percobaan gagal dalam window untuk email ini
    $stmtEmail = $db->prepare(
        'SELECT COUNT(*) FROM login_attempts
         WHERE email = ? AND attempted_at >= ? AND success = 0'
    );
    $stmtEmail->execute([$email, $now - RATE_LIMIT_WINDOW]);
    $emailCount = (int) $stmtEmail->fetchColumn();

    if ($ipCount >= RATE_LIMIT_MAX_ATTEMPTS) {
        $retryAfter = RATE_LIMIT_LOCKOUT - ($now - getOldestAttemptTime($db, 'ip_address', $ip, $now));
        $minutes    = max(1, (int) ceil($retryAfter / 60));
        errorResponse("Terlalu banyak percobaan login dari IP ini. Coba lagi dalam {$minutes} menit.", 429);
    }

    if ($emailCount >= RATE_LIMIT_MAX_ATTEMPTS) {
        $retryAfter = RATE_LIMIT_LOCKOUT - ($now - getOldestAttemptTime($db, 'email', $email, $now));
        $minutes    = max(1, (int) ceil($retryAfter / 60));
        errorResponse("Terlalu banyak percobaan login untuk akun ini. Coba lagi dalam {$minutes} menit.", 429);
    }
}

/**
 * Catat percobaan login (berhasil atau gagal).
 *
 * @param string $email
 * @param bool   $success  true = login berhasil, false = gagal
 */
function recordLoginAttempt(string $email, bool $success): void {
    $db  = getDB();
    $ip  = getClientIp();
    $now = time();

    $db->prepare(
        'INSERT INTO login_attempts (ip_address, email, success, attempted_at) VALUES (?, ?, ?, ?)'
    )->execute([$ip, $email, $success ? 1 : 0, $now]);

    // Jika login berhasil, hapus semua record gagal untuk IP & email ini
    // sehingga counter ter-reset
    if ($success) {
        $db->prepare(
            'DELETE FROM login_attempts WHERE (ip_address = ? OR email = ?) AND success = 0'
        )->execute([$ip, $email]);
    }
}

/**
 * Helper: ambil timestamp percobaan tertua dalam window untuk kolom tertentu.
 */
function getOldestAttemptTime(PDO $db, string $column, string $value, int $now): int {
    // kolom hanya bisa 'ip_address' atau 'email' — tidak dari user input
    $allowedColumns = ['ip_address', 'email'];
    if (!in_array($column, $allowedColumns, true)) return $now;

    $stmt = $db->prepare(
        "SELECT MIN(attempted_at) FROM login_attempts
         WHERE {$column} = ? AND attempted_at >= ? AND success = 0"
    );
    $stmt->execute([$value, $now - RATE_LIMIT_WINDOW]);
    return (int)($stmt->fetchColumn() ?: $now);
}
