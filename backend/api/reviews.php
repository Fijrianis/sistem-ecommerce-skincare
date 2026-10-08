<?php
// =============================================
//   API: Product Reviews
//   GET  ?product_id=X        → ulasan produk (publik)
//   POST ?action=submit        → kirim ulasan (login)
//   GET  ?action=can_review&product_id=X&order_id=Y → cek boleh review
// =============================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
handlePreflight();

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// =============================================
// GET — ambil ulasan produk (tidak perlu login)
// =============================================
if ($method === 'GET' && !$action && isset($_GET['product_id'])) {
    $productId = (int)$_GET['product_id'];

    $stmt = $db->prepare(
        "SELECT r.id, r.rating, r.comment, r.created_at,
                u.name AS reviewer_name
         FROM product_reviews r
         JOIN users u ON u.id = r.user_id
         WHERE r.product_id = ?
         ORDER BY r.created_at DESC"
    );
    $stmt->execute([$productId]);
    $reviews = $stmt->fetchAll();

    // Hitung rata-rata
    $avg   = 0;
    $total = count($reviews);
    if ($total > 0) {
        $avg = round(array_sum(array_column($reviews, 'rating')) / $total, 1);
    }

    foreach ($reviews as &$r) {
        $r['id']     = (int)$r['id'];
        $r['rating'] = (int)$r['rating'];
        // Sensor nama: tampilkan 2 huruf pertama + ****
        $name = $r['reviewer_name'];
        $r['reviewer_name'] = mb_substr($name, 0, 2) . str_repeat('*', max(2, mb_strlen($name) - 2));
    }
    unset($r);

    successResponse([
        'reviews'    => $reviews,
        'total'      => $total,
        'avg_rating' => $avg,
    ]);
}

// =============================================
// GET ?action=can_review — cek apakah user bisa review
// =============================================
if ($method === 'GET' && $action === 'can_review') {
    $user      = requireAuth();
    $productId = (int)($_GET['product_id'] ?? 0);
    $orderId   = (int)($_GET['order_id'] ?? 0);

    if (!$productId || !$orderId) errorResponse('product_id dan order_id wajib diisi.');

    // Cek apakah pesanan delivered dan berisi produk ini
    $stmt = $db->prepare(
        "SELECT oi.id FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.id = ? AND o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'"
    );
    $stmt->execute([$orderId, $user['user_id'], $productId]);
    $item = $stmt->fetch();

    if (!$item) {
        successResponse(['can_review' => false, 'reason' => 'Pesanan belum selesai atau tidak berisi produk ini.']);
    }

    // Cek apakah sudah pernah review
    $check = $db->prepare(
        'SELECT id FROM product_reviews WHERE user_id = ? AND product_id = ? AND order_id = ?'
    );
    $check->execute([$user['user_id'], $productId, $orderId]);
    if ($check->fetch()) {
        successResponse(['can_review' => false, 'reason' => 'Kamu sudah memberikan ulasan untuk produk ini.']);
    }

    successResponse(['can_review' => true]);
}

// =============================================
// POST ?action=submit — kirim ulasan
// =============================================
if ($method === 'POST' && $action === 'submit') {
    $user      = requireAuth();
    $userId    = $user['user_id'];
    $body      = getRequestBody();
    $productId = (int)($body['product_id'] ?? 0);
    $orderId   = (int)($body['order_id'] ?? 0);
    $rating    = (int)($body['rating'] ?? 0);
    $comment   = trim($body['comment'] ?? '');

    if (!$productId) errorResponse('product_id wajib diisi.');
    if ($rating < 1 || $rating > 5) errorResponse('Rating harus antara 1 sampai 5.');

    // Validasi: pesanan harus delivered dan milik user ini
    if ($orderId) {
        $stmt = $db->prepare(
            "SELECT oi.id FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE o.id = ? AND o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'"
        );
        $stmt->execute([$orderId, $userId, $productId]);
        if (!$stmt->fetch()) {
            errorResponse('Kamu hanya bisa memberikan ulasan setelah pesanan selesai diterima.');
        }
    }

    // Cek duplikasi per user & produk
    $check = $db->prepare('SELECT id FROM product_reviews WHERE user_id = ? AND product_id = ?');
    $check->execute([$userId, $productId]);
    if ($check->fetch()) {
        errorResponse('Kamu sudah memberikan ulasan untuk produk ini.');
    }

    // Simpan ulasan
    $db->prepare(
        'INSERT INTO product_reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)'
    )->execute([$userId, $productId, $rating, $comment ?: null]);

    // Update rating & reviews count
    $db->prepare(
        "UPDATE products SET
            reviews = (SELECT COUNT(*) FROM product_reviews WHERE product_id = ?),
            rating  = (SELECT ROUND(AVG(rating), 1) FROM product_reviews WHERE product_id = ?)
         WHERE id = ?"
    )->execute([$productId, $productId, $productId]);

    successResponse(null, 'Ulasan berhasil dikirim. Terima kasih! ⭐');
}

errorResponse('Request tidak valid.', 400);
