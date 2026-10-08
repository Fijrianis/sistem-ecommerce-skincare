<?php
// =============================================
//   API: Auth
//   POST /api/auth.php?action=register
//   POST /api/auth.php?action=login
//   POST /api/auth.php?action=logout
//   POST /api/auth.php?action=update_profile
//   POST /api/auth.php?action=change_password
//   GET  /api/auth.php?action=me
// =============================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/rate_limit.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
handlePreflight();
startSecureSession();

$action = $_GET['action'] ?? '';

// =============================================
// GET /api/auth.php?action=me
// =============================================
if ($action === 'me' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    if (empty($_SESSION['user_id'])) {
        successResponse(['logged_in' => false]);
    }
    $db   = getDB();
    $stmt = $db->prepare('SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    if (!$user) {
        session_destroy();
        errorResponse('Session tidak valid.', 401);
    }

    // Cek voucher pengguna baru — aktif atau sudah terpakai
    $vStmt = $db->prepare(
        "SELECT p.code, p.discount_value, p.expires_at,
                CASE WHEN pu.id IS NOT NULL THEN 1 ELSE 0 END AS is_used
         FROM promo_codes p
         LEFT JOIN promo_usage pu
           ON pu.promo_code = p.code AND pu.user_id = ?
         WHERE p.code LIKE 'NEWUSER%'
           AND p.is_active = 1
           AND (p.expires_at IS NULL OR p.expires_at >= CURDATE())
         ORDER BY p.created_at DESC
         LIMIT 1"
    );
    $vStmt->execute([$_SESSION['user_id']]);
    $voucher = $vStmt->fetch();
    if ($voucher) {
        $voucher['is_used'] = (bool)$voucher['is_used'];
    }

    successResponse([
        'logged_in' => true,
        'user'      => $user,
        'voucher'   => $voucher ?: null,
    ]);
}

requireMethod('POST');
$body = getRequestBody();

// =============================================
// POST /api/auth.php?action=register
// =============================================
if ($action === 'register') {
    $name     = trim($body['name'] ?? '');
    $email    = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';

    // Validation
    if (!$name || !$email || !$password) {
        errorResponse('Nama, email, dan password wajib diisi.');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        errorResponse('Format email tidak valid.');
    }
    if (strlen($password) < 6) {
        errorResponse('Password minimal 6 karakter.');
    }
    if (strlen($name) < 2 || strlen($name) > 150) {
        errorResponse('Nama harus 2-150 karakter.');
    }

    $db = getDB();

    // Check duplicate email
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        errorResponse('Email sudah terdaftar.', 409);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    $stmt = $db->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
    $stmt->execute([$name, $email, $hash]);
    $userId = (int) $db->lastInsertId();

    // ── Buat voucher pengguna baru Rp 20.000 ──
    // Format kode: NEWUSER-{ID}-{RANDOM} agar unik per user
    $voucherCode = 'NEWUSER' . $userId . strtoupper(substr(md5($userId . time()), 0, 4));
    $db->prepare(
        'INSERT INTO promo_codes
            (code, discount_type, discount_value, min_purchase, max_uses, expires_at, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)'
    )->execute([
        $voucherCode,
        'fixed',   // nominal Rp
        20000,     // Rp 20.000
        0,         // minimum pembelian Rp 0 (bebas)
        1,         // hanya bisa dipakai 1 kali
        date('Y-m-d', strtotime('+30 days')), // berlaku 30 hari
    ]);

    // Auto-login setelah register
    $_SESSION['user_id'] = $userId;
    $_SESSION['role']    = 'customer';
    $_SESSION['name']    = $name;

    successResponse([
        'user'           => ['id' => $userId, 'name' => $name, 'email' => $email, 'role' => 'customer'],
        'voucher_code'   => $voucherCode,
        'voucher_value'  => 20000,
        'voucher_expires'=> date('d M Y', strtotime('+30 days')),
    ], 'Registrasi berhasil! Kamu mendapat voucher Rp 20.000 🎁');
}

// =============================================
// POST /api/auth.php?action=login
// =============================================
if ($action === 'login') {
    $email    = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';

    if (!$email || !$password) {
        errorResponse('Email dan password wajib diisi.');
    }

    // Cek rate limit sebelum query ke database
    checkRateLimit($email);

    $db   = getDB();
    $stmt = $db->prepare('SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        // Catat percobaan gagal
        recordLoginAttempt($email, false);
        errorResponse('Email atau password salah.', 401);
    }
    if (!$user['is_active']) {
        // Catat percobaan gagal (akun diblokir bukan salah password, tapi tetap dicatat)
        recordLoginAttempt($email, false);
        errorResponse('Akun dinonaktifkan. Hubungi admin.', 403);
    }

    // Login berhasil — catat & reset counter
    recordLoginAttempt($email, true);

    // Regenerate session ID untuk keamanan
    session_regenerate_id(true);

    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['role']    = $user['role'];
    $_SESSION['name']    = $user['name'];

    unset($user['password_hash'], $user['is_active']);
    $user['id'] = (int) $user['id'];

    successResponse(['user' => $user], 'Login berhasil!');
}

// =============================================
// POST /api/auth.php?action=logout
// =============================================
if ($action === 'logout') {
    session_unset();
    session_destroy();
    successResponse(null, 'Logout berhasil.');
}

// =============================================
// POST /api/auth.php?action=change_password
// =============================================
if ($action === 'change_password') {
    startSecureSession();
    if (empty($_SESSION['user_id'])) {
        errorResponse('Unauthorized.', 401);
    }

    $oldPw  = $body['old_password'] ?? '';
    $newPw  = $body['new_password'] ?? '';

    if (!$oldPw || !$newPw) {
        errorResponse('Password lama dan baru wajib diisi.');
    }
    if (strlen($newPw) < 6) {
        errorResponse('Password baru minimal 6 karakter.');
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT password_hash FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($oldPw, $user['password_hash'])) {
        errorResponse('Password lama tidak sesuai.', 401);
    }

    $newHash = password_hash($newPw, PASSWORD_BCRYPT, ['cost' => 12]);
    $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
       ->execute([$newHash, $_SESSION['user_id']]);

    successResponse(null, 'Password berhasil diubah.');
}

// =============================================
// POST /api/auth.php?action=update_profile
// =============================================
if ($action === 'update_profile') {
    startSecureSession();
    if (empty($_SESSION['user_id'])) {
        errorResponse('Unauthorized.', 401);
    }

    $name    = trim($body['name'] ?? '');
    $phone   = trim($body['phone'] ?? '');
    $address = trim($body['address'] ?? '');

    if (!$name) {
        errorResponse('Nama tidak boleh kosong.');
    }
    if (strlen($name) < 2 || strlen($name) > 150) {
        errorResponse('Nama harus 2-150 karakter.');
    }
    if ($phone && !preg_match('/^[0-9+\-\s]{7,20}$/', $phone)) {
        errorResponse('Format nomor telepon tidak valid.');
    }

    $db = getDB();
    $db->prepare('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?')
       ->execute([$name, $phone ?: null, $address ?: null, (int)$_SESSION['user_id']]);

    // Update session name jika berubah
    $_SESSION['name'] = $name;

    // Kembalikan data terbaru
    $stmt = $db->prepare('SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $updated = $stmt->fetch();

    successResponse(['user' => $updated], 'Profil berhasil diperbarui.');
}

errorResponse('Action tidak dikenali.', 404);
