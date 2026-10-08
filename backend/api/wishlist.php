<?php
// =============================================
//   API: Wishlist
//   GET    /api/wishlist.php              → get wishlist items
//   POST   /api/wishlist.php              → toggle (add/remove)  { product_id }
//   DELETE /api/wishlist.php              → remove item          { product_id }
// =============================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
handlePreflight();

$user   = requireAuth();
$userId = $user['user_id'];
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ---- Helper: fetch wishlist for user ----
function fetchWishlist(PDO $db, int $userId): array {
    $stmt = $db->prepare(
        'SELECT w.id, p.id AS product_id, p.name, p.brand,
                p.image_url AS image, p.price, p.original_price,
                p.rating, p.badge, p.category_slug AS category, w.created_at
         FROM wishlist w
         JOIN products p ON p.id = w.product_id
         WHERE w.user_id = ?
         ORDER BY w.created_at DESC'
    );
    $stmt->execute([$userId]);
    $items = $stmt->fetchAll();
    foreach ($items as &$item) {
        $item['id']             = (int) $item['id'];
        $item['product_id']     = (int) $item['product_id'];
        $item['price']          = (int) $item['price'];
        $item['original_price'] = (int) $item['original_price'];
        $item['rating']         = (float) $item['rating'];
    }
    unset($item);
    return $items;
}

// ---- Helper: get wishlist product_ids ----
function fetchWishlistIds(PDO $db, int $userId): array {
    $stmt = $db->prepare('SELECT product_id FROM wishlist WHERE user_id = ?');
    $stmt->execute([$userId]);
    return array_map('intval', array_column($stmt->fetchAll(), 'product_id'));
}

// =============================================
// GET — return wishlist with product details
// =============================================
if ($method === 'GET') {
    if (isset($_GET['ids_only'])) {
        successResponse(['ids' => fetchWishlistIds($db, $userId)]);
    }
    successResponse(fetchWishlist($db, $userId));
}

$body      = getRequestBody();
$productId = (int) ($body['product_id'] ?? 0);
if (!$productId) errorResponse('product_id wajib diisi.');

// =============================================
// POST — toggle wishlist
// =============================================
if ($method === 'POST') {
    // Verify product exists
    $pStmt = $db->prepare('SELECT id FROM products WHERE id = ? AND is_active = 1');
    $pStmt->execute([$productId]);
    if (!$pStmt->fetch()) errorResponse('Produk tidak ditemukan.', 404);

    // Check if already in wishlist
    $wStmt = $db->prepare('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?');
    $wStmt->execute([$userId, $productId]);
    $existing = $wStmt->fetch();

    if ($existing) {
        $db->prepare('DELETE FROM wishlist WHERE id = ?')->execute([$existing['id']]);
        $action = 'removed';
        $msg    = 'Dihapus dari wishlist.';
    } else {
        $db->prepare('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)')
           ->execute([$userId, $productId]);
        $action = 'added';
        $msg    = 'Ditambahkan ke wishlist ❤️';
    }

    successResponse([
        'action'       => $action,
        'product_id'   => $productId,
        'wishlist_ids' => fetchWishlistIds($db, $userId),
    ], $msg);
}

// =============================================
// DELETE — remove from wishlist
// =============================================
if ($method === 'DELETE') {
    $db->prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?')
       ->execute([$userId, $productId]);
    successResponse(['wishlist_ids' => fetchWishlistIds($db, $userId)], 'Dihapus dari wishlist.');
}

errorResponse('Method not allowed.', 405);
