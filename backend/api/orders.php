<?php
// =============================================
//   API: Orders
//   GET  /api/orders.php                     → list orders milik user login
//   GET  /api/orders.php?id=1                → detail satu order
//   POST /api/orders.php                     → checkout / buat order baru
//   POST /api/orders.php?action=validate_promo → cek kode promo
//   POST /api/orders.php?action=upload_proof → upload bukti pembayaran
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

// =============================================
// GET — list orders or single order
// =============================================
if ($method === 'GET') {

    // ── Auto-complete COD setelah 3 hari sejak shipped ──
    // Jalankan setiap kali user buka halaman pesanan
    $db->prepare(
        "UPDATE orders
         SET status = 'delivered'
         WHERE status = 'shipped'
           AND payment_method = 'cod'
           AND shipped_at IS NOT NULL
           AND shipped_at <= DATE_SUB(NOW(), INTERVAL 3 DAY)"
    )->execute();
    if (isset($_GET['id'])) {
        $orderId = (int) $_GET['id'];
        $stmt    = $db->prepare(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?'
        );
        $stmt->execute([$orderId, $userId]);
        $order = $stmt->fetch();
        if (!$order) errorResponse('Order tidak ditemukan.', 404);

        // Get items
        $iStmt = $db->prepare('SELECT * FROM order_items WHERE order_id = ?');
        $iStmt->execute([$orderId]);
        $order['items'] = $iStmt->fetchAll();

        // Cast types
        $order['id']           = (int) $order['id'];
        $order['subtotal']     = (int) $order['subtotal'];
        $order['shipping_cost'] = (int) $order['shipping_cost'];
        $order['discount']     = (int) $order['discount'];
        $order['total']        = (int) $order['total'];
        foreach ($order['items'] as &$i) {
            $i['id']             = (int) $i['id'];
            $i['qty']            = (int) $i['qty'];
            $i['price_at_order'] = (int) $i['price_at_order'];
            $i['subtotal']       = (int) $i['subtotal'];
        }
        unset($i);

        successResponse($order);
    }

    // List all orders for user
    $stmt = $db->prepare(
        'SELECT id, order_code, status, subtotal, shipping_cost, discount, total,
                payment_method, payment_proof, tracking_number,
                shipping_courier, shipping_service, shipping_estimate, created_at
         FROM orders
         WHERE user_id = ?
         ORDER BY created_at DESC'
    );
    $stmt->execute([$userId]);
    $orders = $stmt->fetchAll();
    foreach ($orders as &$o) {
        $o['id']           = (int) $o['id'];
        $o['subtotal']     = (int) $o['subtotal'];
        $o['shipping_cost'] = (int) $o['shipping_cost'];
        $o['discount']     = (int) $o['discount'];
        $o['total']        = (int) $o['total'];
    }
    unset($o);

    successResponse($orders);
}

$body   = getRequestBody();
$action = $_GET['action'] ?? '';

// =============================================
// POST ?action=upload_proof
// =============================================
if ($method === 'POST' && $action === 'upload_proof') {
    $orderId    = (int) ($body['order_id'] ?? 0);
    $proofData  = $body['proof_image'] ?? ''; // base64 data URL

    if (!$orderId) errorResponse('order_id wajib diisi.');
    if (!$proofData) errorResponse('Gambar bukti pembayaran wajib diisi.');

    // Validasi order milik user ini dan statusnya masih pending
    $stmt = $db->prepare('SELECT id, status, payment_method FROM orders WHERE id = ? AND user_id = ?');
    $stmt->execute([$orderId, $userId]);
    $order = $stmt->fetch();
    if (!$order) errorResponse('Order tidak ditemukan.', 404);
    if ($order['status'] === 'cancelled') errorResponse('Order sudah dibatalkan.');
    if ($order['payment_method'] === 'cod') errorResponse('Order COD tidak memerlukan bukti pembayaran.');

    // Validasi format base64 image
    if (!preg_match('/^data:image\/(jpeg|jpg|png|gif|webp);base64,/', $proofData)) {
        errorResponse('Format gambar tidak valid. Gunakan JPG, PNG, atau WEBP.');
    }

    // Ambil data base64 dan decode
    $imageData  = preg_replace('/^data:image\/\w+;base64,/', '', $proofData);
    $imageData  = base64_decode($imageData);
    if (!$imageData || strlen($imageData) > 5 * 1024 * 1024) { // max 5MB
        errorResponse('Ukuran gambar terlalu besar. Maksimal 5MB.');
    }

    // Simpan ke folder uploads
    $uploadDir = __DIR__ . '/../../uploads/payment_proofs/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Tentukan ekstensi dari data URL
    preg_match('/^data:image\/(\w+);base64,/', $proofData, $matches);
    $ext      = strtolower($matches[1] === 'jpeg' ? 'jpg' : $matches[1]);
    $filename = 'proof_' . $orderId . '_' . time() . '.' . $ext;
    $filepath = $uploadDir . $filename;

    if (file_put_contents($filepath, $imageData) === false) {
        errorResponse('Gagal menyimpan gambar. Coba lagi.', 500);
    }

    $proofUrl = 'uploads/payment_proofs/' . $filename;
    $db->prepare('UPDATE orders SET payment_proof = ? WHERE id = ?')
       ->execute([$proofUrl, $orderId]);

    successResponse(['proof_url' => $proofUrl], 'Bukti pembayaran berhasil dikirim. Menunggu konfirmasi admin.');
}

// =============================================
// POST ?action=confirm_received — user konfirmasi COD diterima
// =============================================
if ($method === 'POST' && $action === 'confirm_received') {
    $orderId = (int)($body['order_id'] ?? 0);
    if (!$orderId) errorResponse('order_id wajib diisi.');

    // Pastikan order milik user, COD, dan status shipped
    $stmt = $db->prepare(
        'SELECT id, status, payment_method FROM orders WHERE id = ? AND user_id = ?'
    );
    $stmt->execute([$orderId, $userId]);
    $order = $stmt->fetch();

    if (!$order) errorResponse('Pesanan tidak ditemukan.', 404);
    if ($order['payment_method'] !== 'cod') {
        errorResponse('Konfirmasi penerimaan hanya untuk pesanan COD.');
    }
    if ($order['status'] !== 'shipped') {
        errorResponse('Pesanan belum dalam status dikirim.');
    }

    $db->prepare('UPDATE orders SET status = ? WHERE id = ?')
       ->execute(['delivered', $orderId]);

    successResponse(null, 'Pesanan dikonfirmasi diterima. Terima kasih!');
}

// =============================================
// POST ?action=cancel — user batalkan pesanan sendiri
// =============================================
if ($method === 'POST' && $action === 'cancel') {
    $orderId = (int)($body['order_id'] ?? 0);
    if (!$orderId) errorResponse('order_id wajib diisi.');

    // Pastikan order milik user ini dan statusnya masih pending
    $stmt = $db->prepare('SELECT id, status, promo_code FROM orders WHERE id = ? AND user_id = ?');
    $stmt->execute([$orderId, $userId]);
    $order = $stmt->fetch();

    if (!$order) errorResponse('Pesanan tidak ditemukan.', 404);
    if ($order['status'] !== 'pending') {
        errorResponse('Pesanan hanya bisa dibatalkan saat status masih Pending.');
    }

    $db->beginTransaction();
    try {
        // Update status ke cancelled
        $db->prepare('UPDATE orders SET status = ? WHERE id = ?')
           ->execute(['cancelled', $orderId]);

        // Kembalikan stok semua item
        $items = $db->prepare('SELECT product_id, qty FROM order_items WHERE order_id = ?');
        $items->execute([$orderId]);
        $restoreStmt = $db->prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
        foreach ($items->fetchAll() as $item) {
            $restoreStmt->execute([(int)$item['qty'], (int)$item['product_id']]);
        }

        // Kembalikan kuota promo & hapus usage record
        if ($order['promo_code']) {
            $db->prepare('UPDATE promo_codes SET used_count = GREATEST(0, used_count - 1) WHERE code = ?')
               ->execute([$order['promo_code']]);
            $db->prepare('DELETE FROM promo_usage WHERE user_id = ? AND promo_code = ?')
               ->execute([$userId, $order['promo_code']]);
        }

        $db->commit();
        successResponse(null, 'Pesanan berhasil dibatalkan. Stok produk telah dikembalikan.');

    } catch (Throwable $e) {
        $db->rollBack();
        error_log('cancel order failed: ' . $e->getMessage());
        errorResponse('Gagal membatalkan pesanan. Silakan coba lagi.', 500);
    }
}

// =============================================
// POST ?action=validate_promo
// =============================================
if ($method === 'POST' && $action === 'validate_promo') {
    $code     = strtoupper(trim($body['code'] ?? ''));
    $subtotal = (int) ($body['subtotal'] ?? 0);

    if (!$code) errorResponse('Kode promo wajib diisi.');

    $stmt = $db->prepare(
        'SELECT * FROM promo_codes
         WHERE code = ? AND is_active = 1
         AND (expires_at IS NULL OR expires_at >= CURDATE())
         AND (max_uses IS NULL OR used_count < max_uses)'
    );
    $stmt->execute([$code]);
    $promo = $stmt->fetch();

    if (!$promo) errorResponse('Kode promo tidak valid atau sudah kadaluarsa.', 404);
    if ($subtotal < $promo['min_purchase']) {
        errorResponse('Minimum pembelian Rp ' . number_format($promo['min_purchase'], 0, ',', '.') . ' untuk kode ini.');
    }

    // Cek apakah user ini sudah pernah pakai kode ini sebelumnya
    if (!empty($_SESSION['user_id'])) {
        $usedStmt = $db->prepare('SELECT id FROM promo_usage WHERE user_id = ? AND promo_code = ?');
        $usedStmt->execute([(int)$_SESSION['user_id'], $promo['code']]);
        if ($usedStmt->fetch()) {
            errorResponse('Kamu sudah pernah menggunakan kode promo ini.');
        }
    }

    $discountAmount = 0;
    if ($promo['discount_type'] === 'percent') {
        $discountAmount = (int) round($subtotal * $promo['discount_value'] / 100);
    } else {
        $discountAmount = (int) $promo['discount_value'];
    }
    $discountAmount = min($discountAmount, $subtotal); // tidak melebihi subtotal

    successResponse([
        'code'            => $promo['code'],
        'discount_type'   => $promo['discount_type'],
        'discount_value'  => (int) $promo['discount_value'],
        'discount_amount' => $discountAmount,
    ], 'Kode promo valid! Diskon ' . ($promo['discount_type'] === 'percent' ? $promo['discount_value'] . '%' : 'Rp ' . number_format($promo['discount_value'], 0, ',', '.')));
}

// =============================================
// POST — create order (checkout)
// =============================================
if ($method === 'POST') {
    // Required fields
    $shippingName     = trim($body['shipping_name'] ?? '');
    $shippingPhone    = trim($body['shipping_phone'] ?? '');
    $shippingAddress  = trim($body['shipping_address'] ?? '');
    $paymentMethod    = trim($body['payment_method'] ?? 'transfer');
    $shippingMethodId = (int) ($body['shipping_method_id'] ?? 0);
    $promoCode        = strtoupper(trim($body['promo_code'] ?? ''));
    $notes            = trim($body['notes'] ?? '');

    if (!$shippingName || !$shippingPhone || !$shippingAddress) {
        errorResponse('Nama, telepon, dan alamat pengiriman wajib diisi.');
    }
    if (!$shippingMethodId) {
        errorResponse('Pilih kurir pengiriman terlebih dahulu.');
    }

    // Get shipping method
    $smStmt = $db->prepare('SELECT * FROM shipping_methods WHERE id = ? AND is_active = 1');
    $smStmt->execute([$shippingMethodId]);
    $shippingMethod = $smStmt->fetch();
    if (!$shippingMethod) {
        errorResponse('Kurir pengiriman tidak valid.');
    }

    // Get cart items — hanya yang dipilih jika ada selected_product_ids
    $selectedIds = [];
    if (!empty($body['selected_product_ids']) && is_array($body['selected_product_ids'])) {
        $selectedIds = array_map('intval', $body['selected_product_ids']);
    }

    $cartStmt = $db->prepare(
        'SELECT c.product_id, c.qty, p.name, p.brand, p.image_url, p.price, p.stock
         FROM cart c
         JOIN products p ON p.id = c.product_id
         WHERE c.user_id = ? AND p.is_active = 1'
    );
    $cartStmt->execute([$userId]);
    $allCartItems = $cartStmt->fetchAll();

    // Filter hanya item yang dipilih (jika ada)
    $cartItems = !empty($selectedIds)
        ? array_filter($allCartItems, fn($i) => in_array((int)$i['product_id'], $selectedIds))
        : $allCartItems;
    $cartItems = array_values($cartItems);

    if (empty($cartItems)) {
        errorResponse('Keranjang kosong. Tidak bisa checkout.', 400);
    }

    // Validate stock for each item
    foreach ($cartItems as $item) {
        if ($item['qty'] > $item['stock']) {
            errorResponse("Stok {$item['name']} tidak mencukupi. Tersedia: {$item['stock']}");
        }
    }

    $subtotal = array_sum(array_map(fn($i) => $i['price'] * $i['qty'], $cartItems));

    // Shipping cost dari kurir yang dipilih
    $shippingCost     = (int) $shippingMethod['price'];
    $shippingCourier  = $shippingMethod['courier'];
    $shippingService  = $shippingMethod['service'];
    $shippingEstimate = $shippingMethod['estimated_days'];

    // Validate & apply promo code if provided
    $discount   = 0;
    $promoRow   = null;
    if ($promoCode) {
        $pStmt = $db->prepare(
            'SELECT * FROM promo_codes
             WHERE code = ? AND is_active = 1
             AND (expires_at IS NULL OR expires_at >= CURDATE())
             AND (max_uses IS NULL OR used_count < max_uses)'
        );
        $pStmt->execute([$promoCode]);
        $promoRow = $pStmt->fetch();

        if (!$promoRow) {
            errorResponse('Kode promo tidak valid atau sudah kadaluarsa.');
        }
        if ($subtotal < $promoRow['min_purchase']) {
            errorResponse('Minimum pembelian Rp ' . number_format($promoRow['min_purchase'], 0, ',', '.') . ' untuk kode ini.');
        }

        // Cek apakah user ini sudah pernah pakai kode ini
        $usedCheck = $db->prepare('SELECT id FROM promo_usage WHERE user_id = ? AND promo_code = ?');
        $usedCheck->execute([$userId, $promoRow['code']]);
        if ($usedCheck->fetch()) {
            errorResponse('Kamu sudah pernah menggunakan kode promo ini.');
        }

        if ($promoRow['discount_type'] === 'percent') {
            $discount = (int) round($subtotal * $promoRow['discount_value'] / 100);
        } else {
            $discount = (int) $promoRow['discount_value'];
        }
        $discount = min($discount, $subtotal); // tidak melebihi subtotal
    }

    $total = $subtotal + $shippingCost - $discount;

    // Generate order code
    $orderCode = 'GS' . strtoupper(substr(uniqid(), -6)) . rand(10, 99);

    // Begin transaction
    $db->beginTransaction();
    try {
        // Insert order
        $oStmt = $db->prepare(
            'INSERT INTO orders (user_id, order_code, subtotal, shipping_cost, discount,
                                  total, promo_code, shipping_name, shipping_phone,
                                  shipping_address, shipping_courier, shipping_service,
                                  shipping_estimate, payment_method, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $oStmt->execute([
            $userId, $orderCode, $subtotal, $shippingCost, $discount,
            $total, $promoCode ?: null, $shippingName, $shippingPhone,
            $shippingAddress, $shippingCourier, $shippingService,
            $shippingEstimate, $paymentMethod, $notes ?: null
        ]);
        $orderId = (int) $db->lastInsertId();

        // Insert order items & reduce stock
        $iStmt = $db->prepare(
            'INSERT INTO order_items (order_id, product_id, product_name, product_brand,
                                       product_image, qty, price_at_order, subtotal)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $sStmt = $db->prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

        foreach ($cartItems as $item) {
            $itemSubtotal = $item['price'] * $item['qty'];
            $iStmt->execute([
                $orderId, $item['product_id'], $item['name'], $item['brand'],
                $item['image_url'], $item['qty'], $item['price'], $itemSubtotal
            ]);
            $sStmt->execute([$item['qty'], $item['product_id']]);
        }

        // Increment promo usage & catat per user
        if ($promoRow) {
            $db->prepare('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?')
               ->execute([$promoRow['id']]);
            // Catat bahwa user ini sudah pakai promo ini
            $db->prepare('INSERT IGNORE INTO promo_usage (user_id, promo_code, order_id) VALUES (?, ?, ?)')
               ->execute([$userId, $promoRow['code'], $orderId]);
        }

        // Clear hanya item yang di-checkout
        if (!empty($selectedIds)) {
            $placeholders = implode(',', array_fill(0, count($selectedIds), '?'));
            $delParams = array_merge([$userId], $selectedIds);
            $db->prepare("DELETE FROM cart WHERE user_id = ? AND product_id IN ($placeholders)")
               ->execute($delParams);
        } else {
            $db->prepare('DELETE FROM cart WHERE user_id = ?')->execute([$userId]);
        }

        $db->commit();

        successResponse([
            'order_id'         => $orderId,
            'order_code'       => $orderCode,
            'subtotal'         => $subtotal,
            'shipping_cost'    => $shippingCost,
            'shipping_courier' => $shippingCourier,
            'shipping_service' => $shippingService,
            'shipping_estimate'=> $shippingEstimate,
            'discount'         => $discount,
            'total'            => $total,
            'status'           => 'pending',
        ], 'Pesanan berhasil dibuat! 🎉', 201);

    } catch (Throwable $e) {
        $db->rollBack();
        error_log('Order creation failed: ' . $e->getMessage());
        errorResponse('Gagal membuat pesanan. Silakan coba lagi.', 500);
    }
}

errorResponse('Method not allowed.', 405);
