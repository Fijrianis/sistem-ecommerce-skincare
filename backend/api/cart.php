<?php
// =============================================
//   API: Cart
//   GET    /api/cart.php              → get cart items
//   POST   /api/cart.php              → add / update item  { product_id, qty }
//   PUT    /api/cart.php              → set exact qty      { product_id, qty }
//   DELETE /api/cart.php              → remove item        { product_id }
//   DELETE /api/cart.php?clear=1      → clear entire cart
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

// ---- Helper: fetch cart for user ----
function fetchCart(PDO $db, int $userId): array {
    $stmt = $db->prepare(
        'SELECT c.id, c.product_id, c.qty,
                p.name, p.brand, p.image_url AS image,
                p.price, p.original_price, p.stock, p.category_slug AS category
         FROM cart c
         JOIN products p ON p.id = c.product_id
         WHERE c.user_id = ?
         ORDER BY c.created_at ASC'
    );
    $stmt->execute([$userId]);
    $items = $stmt->fetchAll();
    foreach ($items as &$item) {
        $item['id']             = (int) $item['id'];
        $item['product_id']     = (int) $item['product_id'];
        $item['qty']            = (int) $item['qty'];
        $item['price']          = (int) $item['price'];
        $item['original_price'] = (int) $item['original_price'];
        $item['stock']          = (int) $item['stock'];
    }
    unset($item);

    $total = array_sum(array_map(fn($i) => $i['price'] * $i['qty'], $items));
    $qty   = array_sum(array_column($items, 'qty'));
    return ['items' => $items, 'total' => $total, 'total_qty' => $qty];
}

// =============================================
// GET — return cart
// =============================================
if ($method === 'GET') {
    successResponse(fetchCart($db, $userId));
}

$body = getRequestBody();

// =============================================
// POST — add item (atau increment jika sudah ada)
// =============================================
if ($method === 'POST') {
    $productId = (int) ($body['product_id'] ?? 0);
    $qty       = max(1, (int) ($body['qty'] ?? 1));

    if (!$productId) errorResponse('product_id wajib diisi.');

    // Cek produk ada & aktif
    $pStmt = $db->prepare('SELECT id, stock FROM products WHERE id = ? AND is_active = 1');
    $pStmt->execute([$productId]);
    $product = $pStmt->fetch();
    if (!$product) errorResponse('Produk tidak ditemukan.', 404);

    // Cek apakah sudah di cart
    $cStmt = $db->prepare('SELECT id, qty FROM cart WHERE user_id = ? AND product_id = ?');
    $cStmt->execute([$userId, $productId]);
    $existing = $cStmt->fetch();

    if ($existing) {
        $newQty = $existing['qty'] + $qty;
        if ($newQty > $product['stock']) {
            errorResponse('Stok tidak mencukupi. Stok tersedia: ' . $product['stock']);
        }
        $db->prepare('UPDATE cart SET qty = ? WHERE id = ?')
           ->execute([$newQty, $existing['id']]);
    } else {
        if ($qty > $product['stock']) {
            errorResponse('Stok tidak mencukupi. Stok tersedia: ' . $product['stock']);
        }
        $db->prepare('INSERT INTO cart (user_id, product_id, qty) VALUES (?, ?, ?)')
           ->execute([$userId, $productId, $qty]);
    }

    successResponse(fetchCart($db, $userId), 'Produk ditambahkan ke keranjang.');
}

// =============================================
// PUT — set exact quantity
// =============================================
if ($method === 'PUT') {
    $productId = (int) ($body['product_id'] ?? 0);
    $qty       = (int) ($body['qty'] ?? 0);

    if (!$productId) errorResponse('product_id wajib diisi.');

    if ($qty <= 0) {
        // qty 0 or negative → remove
        $db->prepare('DELETE FROM cart WHERE user_id = ? AND product_id = ?')
           ->execute([$userId, $productId]);
    } else {
        // check stock
        $pStmt = $db->prepare('SELECT stock FROM products WHERE id = ? AND is_active = 1');
        $pStmt->execute([$productId]);
        $product = $pStmt->fetch();
        if (!$product) errorResponse('Produk tidak ditemukan.', 404);
        if ($qty > $product['stock']) {
            errorResponse('Stok tidak mencukupi. Stok tersedia: ' . $product['stock']);
        }

        $db->prepare('UPDATE cart SET qty = ? WHERE user_id = ? AND product_id = ?')
           ->execute([$qty, $userId, $productId]);
    }

    successResponse(fetchCart($db, $userId), 'Keranjang diperbarui.');
}

// =============================================
// DELETE — remove item or clear cart
// =============================================
if ($method === 'DELETE') {
    if (!empty($_GET['clear'])) {
        $db->prepare('DELETE FROM cart WHERE user_id = ?')->execute([$userId]);
        successResponse(['items' => [], 'total' => 0, 'total_qty' => 0], 'Keranjang dikosongkan.');
    }

    $body      = getRequestBody();
    $productId = (int) ($body['product_id'] ?? 0);
    if (!$productId) errorResponse('product_id wajib diisi.');

    $db->prepare('DELETE FROM cart WHERE user_id = ? AND product_id = ?')
       ->execute([$userId, $productId]);

    successResponse(fetchCart($db, $userId), 'Produk dihapus dari keranjang.');
}

errorResponse('Method not allowed.', 405);
