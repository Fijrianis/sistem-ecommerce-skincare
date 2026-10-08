<?php
// =============================================
//   API: Admin
//   GET  ?action=stats           → dashboard stats
//   GET  ?action=orders          → semua order (+ filter status)
//   GET  ?action=orders&id=X     → detail order
//   GET  ?action=products        → semua produk
//   GET  ?action=users           → semua user
//   GET  ?action=promos          → semua promo code
//   POST ?action=order_status    → update status order  { order_id, status }
//   POST ?action=add_product     → tambah produk baru
//   POST ?action=edit_product    → edit produk          { id, ...fields }
//   POST ?action=toggle_product  → aktif/nonaktif produk { id }
//   POST ?action=toggle_user     → aktif/nonaktif user   { id }
//   POST ?action=add_promo       → tambah promo code
//   POST ?action=edit_promo      → edit promo code       { id, ...fields }
//   POST ?action=toggle_promo    → aktif/nonaktif promo  { id }
// =============================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
handlePreflight();

requireAdmin();   // hanya admin bisa akses

$db     = getDB();
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// =============================================
// GET: stats
// =============================================
if ($method === 'GET' && $action === 'stats') {
    $stats = [];

    // Total revenue (delivered orders)
    // Total revenue hanya dari pesanan yang sudah selesai
$r = $db->query("
    SELECT COALESCE(SUM(total), 0)
    FROM orders
    WHERE status = 'delivered'
")->fetchColumn();

$stats['total_revenue'] = (int) $r;

    // Orders count
    $stats['total_orders']  = (int) $db->query("SELECT COUNT(*) FROM orders")->fetchColumn();
    $stats['pending_orders']= (int) $db->query("SELECT COUNT(*) FROM orders WHERE status='pending'")->fetchColumn();
    $stats['processing']    = (int) $db->query("SELECT COUNT(*) FROM orders WHERE status='processing'")->fetchColumn();
    $stats['shipped']       = (int) $db->query("SELECT COUNT(*) FROM orders WHERE status='shipped'")->fetchColumn();
    $stats['delivered']     = (int) $db->query("SELECT COUNT(*) FROM orders WHERE status='delivered'")->fetchColumn();
    $stats['cancelled']     = (int) $db->query("SELECT COUNT(*) FROM orders WHERE status='cancelled'")->fetchColumn();

    // Users
    $stats['total_users']   = (int) $db->query("SELECT COUNT(*) FROM users WHERE role='customer'")->fetchColumn();

    // Products
    $stats['total_products']= (int) $db->query("SELECT COUNT(*) FROM products WHERE is_active=1")->fetchColumn();
    $stats['low_stock']     = (int) $db->query("SELECT COUNT(*) FROM products WHERE stock < 10 AND is_active=1")->fetchColumn();

    // Revenue last 7 days (daily)
    $chart = $db->query(
        "SELECT DATE(created_at) AS day, SUM(total) AS revenue, COUNT(*) AS orders
         FROM orders
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  AND status = 'delivered'
         GROUP BY DATE(created_at)
         ORDER BY day ASC"
    )->fetchAll();
    $stats['chart'] = $chart;

    // Recent 5 orders
    $recent = $db->query(
        "SELECT o.id, o.order_code, o.status, o.total, o.created_at,
                o.shipping_courier, o.shipping_service,
                u.name AS customer_name
         FROM orders o JOIN users u ON u.id = o.user_id
         ORDER BY o.created_at DESC LIMIT 5"
    )->fetchAll();
    foreach ($recent as &$o) { $o['id'] = (int)$o['id']; $o['total'] = (int)$o['total']; }
    unset($o);
    $stats['recent_orders'] = $recent;

    successResponse($stats);
}

// =============================================
// GET: orders list
// =============================================
if ($method === 'GET' && $action === 'orders') {
    // Single order
    if (isset($_GET['id'])) {
        $stmt = $db->prepare(
            "SELECT o.*, u.name AS customer_name, u.email AS customer_email
             FROM orders o JOIN users u ON u.id = o.user_id
             WHERE o.id = ?"
        );
        $stmt->execute([(int)$_GET['id']]);
        $order = $stmt->fetch();
        if (!$order) errorResponse('Order tidak ditemukan.', 404);

        $iStmt = $db->prepare('SELECT * FROM order_items WHERE order_id = ?');
        $iStmt->execute([$order['id']]);
        $order['items'] = $iStmt->fetchAll();
        foreach ($order['items'] as &$i) {
            $i['id'] = (int)$i['id']; $i['qty'] = (int)$i['qty'];
            $i['price_at_order'] = (int)$i['price_at_order'];
            $i['subtotal'] = (int)$i['subtotal'];
        }
        unset($i);
        $order['id']            = (int)$order['id'];
        $order['total']         = (int)$order['total'];
        $order['subtotal']      = (int)$order['subtotal'];
        $order['shipping_cost'] = (int)$order['shipping_cost'];
        $order['discount']      = (int)$order['discount'];
        successResponse($order);
    }

    // List with optional status filter
    $where  = [];
    $params = [];
    if (!empty($_GET['status'])) {
        $where[]  = 'o.status = ?';
        $params[] = $_GET['status'];
    }
    if (!empty($_GET['search'])) {
        $where[]  = '(o.order_code LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
        $t = '%' . $_GET['search'] . '%';
        $params[] = $t; $params[] = $t; $params[] = $t;
    }
    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = 20;
    $offset  = ($page - 1) * $perPage;

    $total = $db->prepare("SELECT COUNT(*) FROM orders o JOIN users u ON u.id=o.user_id $whereSQL");
    $total->execute($params);
    $totalCount = (int)$total->fetchColumn();

    $stmt = $db->prepare(
        "SELECT o.id, o.order_code, o.status, o.total, o.shipping_courier,
                o.shipping_service, o.created_at, u.name AS customer_name
         FROM orders o JOIN users u ON u.id = o.user_id
         $whereSQL ORDER BY o.created_at DESC
         LIMIT $perPage OFFSET $offset"
    );
    $stmt->execute($params);
    $orders = $stmt->fetchAll();
    foreach ($orders as &$o) { $o['id']=(int)$o['id']; $o['total']=(int)$o['total']; }
    unset($o);

    successResponse(['orders' => $orders, 'total' => $totalCount, 'page' => $page, 'per_page' => $perPage]);
}

// =============================================
// GET: products list
// =============================================
if ($method === 'GET' && $action === 'products') {
    $search = $_GET['search'] ?? '';
    $cat    = $_GET['category'] ?? '';
    $where  = []; $params = [];
    if ($search) { $where[] = '(name LIKE ? OR brand LIKE ?)'; $t = "%$search%"; $params[]=$t; $params[]=$t; }
    if ($cat)    { $where[] = 'category_slug = ?'; $params[] = $cat; }
    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $stmt = $db->prepare("SELECT * FROM products $whereSQL ORDER BY id ASC");
    $stmt->execute($params);
    $products = $stmt->fetchAll();
    foreach ($products as &$p) {
        $p['id']=(int)$p['id']; $p['price']=(int)$p['price'];
        $p['original_price']=(int)$p['original_price'];
        $p['rating']=(float)$p['rating']; $p['reviews']=(int)$p['reviews'];
        $p['stock']=(int)$p['stock']; $p['is_active']=(int)$p['is_active'];
    }
    unset($p);
    successResponse($products);
}

// =============================================
// GET: users list
// =============================================
if ($method === 'GET' && $action === 'users') {
    $search = $_GET['search'] ?? '';
    $where  = ["role = 'customer'"]; $params = [];
    if ($search) { $where[] = '(name LIKE ? OR email LIKE ?)'; $t = "%$search%"; $params[]=$t; $params[]=$t; }
    $whereSQL = 'WHERE ' . implode(' AND ', $where);

    $stmt = $db->prepare(
        "SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at,
                COUNT(o.id) AS total_orders, COALESCE(SUM(o.total),0) AS total_spent
         FROM users u
         LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
         $whereSQL GROUP BY u.id ORDER BY u.created_at DESC"
    );
    $stmt->execute($params);
    $users = $stmt->fetchAll();
    foreach ($users as &$u) {
        $u['id']=(int)$u['id']; $u['is_active']=(int)$u['is_active'];
        $u['total_orders']=(int)$u['total_orders']; $u['total_spent']=(int)$u['total_spent'];
    }
    unset($u);
    successResponse($users);
}

// =============================================
// GET: promo codes list
// =============================================
if ($method === 'GET' && $action === 'promos') {
    $stmt = $db->query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    $promos = $stmt->fetchAll();
    foreach ($promos as &$p) {
        $p['id']             = (int) $p['id'];
        $p['discount_value'] = (int) $p['discount_value'];
        $p['min_purchase']   = (int) $p['min_purchase'];
        $p['max_uses']       = $p['max_uses'] !== null ? (int) $p['max_uses'] : null;
        $p['used_count']     = (int) $p['used_count'];
        $p['is_active']      = (int) $p['is_active'];
    }
    unset($p);
    successResponse($promos);
}

// =============================================
// POST actions
// =============================================
requireMethod('POST');
$body = getRequestBody();

// Update order status
if ($action === 'order_status') {
    $orderId        = (int)($body['order_id'] ?? 0);
    $status         = $body['status'] ?? '';
    $trackingNumber = trim($body['tracking_number'] ?? '');
    $allowed        = ['pending','processing','shipped','delivered','cancelled'];

    if (!$orderId || !in_array($status, $allowed)) errorResponse('Data tidak valid.');

    // Wajib isi nomor resi saat status shipped
    if ($status === 'shipped' && !$trackingNumber) {
        errorResponse('Nomor resi wajib diisi saat status menjadi "Dikirim".');
    }

    // Ambil status order saat ini — cegah restore stok dua kali
    $currentStmt = $db->prepare('SELECT status FROM orders WHERE id = ?');
    $currentStmt->execute([$orderId]);
    $currentOrder = $currentStmt->fetch();
    if (!$currentOrder) errorResponse('Order tidak ditemukan.', 404);

    $currentStatus = $currentOrder['status'];

    $db->beginTransaction();
    try {
        // Update status + tracking + shipped_at
        if ($trackingNumber) {
            if ($status === 'shipped') {
                $db->prepare('UPDATE orders SET status = ?, tracking_number = ?, shipped_at = NOW() WHERE id = ?')
                   ->execute([$status, $trackingNumber, $orderId]);
            } else {
                $db->prepare('UPDATE orders SET status = ?, tracking_number = ? WHERE id = ?')
                   ->execute([$status, $trackingNumber, $orderId]);
            }
        } else {
            $db->prepare('UPDATE orders SET status = ? WHERE id = ?')
               ->execute([$status, $orderId]);
        }

        // Kembalikan stok jika status berubah menjadi cancelled
        // dan sebelumnya BUKAN cancelled (cegah restore dua kali)
        if ($status === 'cancelled' && $currentStatus !== 'cancelled') {
            $items = $db->prepare('SELECT product_id, qty FROM order_items WHERE order_id = ?');
            $items->execute([$orderId]);
            $orderItems = $items->fetchAll();

            $restoreStmt = $db->prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
            foreach ($orderItems as $item) {
                $restoreStmt->execute([(int)$item['qty'], (int)$item['product_id']]);
            }

            // Kembalikan juga used_count promo jika ada
            $promoStmt = $db->prepare('SELECT promo_code FROM orders WHERE id = ?');
            $promoStmt->execute([$orderId]);
            $promoCode = $promoStmt->fetchColumn();
            if ($promoCode) {
                $db->prepare(
                    'UPDATE promo_codes SET used_count = GREATEST(0, used_count - 1) WHERE code = ?'
                )->execute([$promoCode]);
                // Hapus record usage agar user bisa pakai lagi di order berikutnya
                $orderUserStmt = $db->prepare('SELECT user_id FROM orders WHERE id = ?');
                $orderUserStmt->execute([$orderId]);
                $orderUserId = $orderUserStmt->fetchColumn();
                if ($orderUserId) {
                    $db->prepare('DELETE FROM promo_usage WHERE user_id = ? AND promo_code = ?')
                       ->execute([$orderUserId, $promoCode]);
                }
            }
        }

        $db->commit();
        successResponse(
            ['order_id' => $orderId, 'status' => $status],
            $status === 'cancelled'
                ? 'Order dibatalkan. Stok produk telah dikembalikan.'
                : 'Status order diperbarui.'
        );

    } catch (Throwable $e) {
        $db->rollBack();
        error_log('order_status update failed: ' . $e->getMessage());
        errorResponse('Gagal memperbarui status. Silakan coba lagi.', 500);
    }
}

// Add product
if ($action === 'add_product') {
    $required = ['name','brand','category_slug','price','original_price','description','skin_type','key_ingredients','image_url'];
    foreach ($required as $f) {
        if (empty($body[$f])) errorResponse("Field '$f' wajib diisi.");
    }
    $stmt = $db->prepare(
        'INSERT INTO products (name,brand,category_slug,price,original_price,rating,reviews,badge,description,skin_type,key_ingredients,image_url,stock)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'
    );
    $stmt->execute([
        $body['name'], $body['brand'], $body['category_slug'],
        (int)$body['price'], (int)$body['original_price'],
        (float)($body['rating'] ?? 0), (int)($body['reviews'] ?? 0),
        $body['badge'] ?: null, $body['description'],
        $body['skin_type'], $body['key_ingredients'], $body['image_url'],
        (int)($body['stock'] ?? 100),
    ]);
    successResponse(['id' => (int)$db->lastInsertId()], 'Produk berhasil ditambahkan.', 201);
}

// Edit product
if ($action === 'edit_product') {
    $id = (int)($body['id'] ?? 0);
    if (!$id) errorResponse('id produk wajib diisi.');

    $fields = ['name','brand','category_slug','price','original_price','rating','reviews','badge','description','skin_type','key_ingredients','image_url','stock','is_active'];
    $sets = []; $params = [];
    foreach ($fields as $f) {
        if (array_key_exists($f, $body)) {
            $sets[]   = "$f = ?";
            $params[] = in_array($f, ['price','original_price','reviews','stock','is_active']) ? (int)$body[$f] : ($f === 'rating' ? (float)$body[$f] : ($body[$f] ?: null));
        }
    }
    if (!$sets) errorResponse('Tidak ada field yang diubah.');
    $params[] = $id;
    $db->prepare('UPDATE products SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);
    successResponse(null, 'Produk berhasil diperbarui.');
}

// Toggle product active
if ($action === 'toggle_product') {
    $id = (int)($body['id'] ?? 0);
    if (!$id) errorResponse('id wajib diisi.');
    $db->prepare('UPDATE products SET is_active = 1 - is_active WHERE id = ?')->execute([$id]);
    $stmt = $db->prepare('SELECT is_active FROM products WHERE id = ?');
    $stmt->execute([$id]);
    $isActive = (int)$stmt->fetchColumn();
    successResponse(['is_active' => $isActive], 'Status produk diperbarui.');
}

// Toggle user active
if ($action === 'toggle_user') {
    $id = (int)($body['id'] ?? 0);
    if (!$id) errorResponse('id wajib diisi.');
    $db->prepare('UPDATE users SET is_active = 1 - is_active WHERE id = ? AND role != "admin"')->execute([$id]);
    successResponse(null, 'Status user diperbarui.');
}

// =============================================
// Promo code management
// =============================================

// Add promo
if ($action === 'add_promo') {
    $code      = strtoupper(trim($body['code'] ?? ''));
    $type      = $body['discount_type'] ?? '';
    $value     = (int)($body['discount_value'] ?? 0);
    $minPurch  = (int)($body['min_purchase'] ?? 0);
    $maxUses   = isset($body['max_uses']) && $body['max_uses'] !== '' ? (int)$body['max_uses'] : null;
    $expiresAt = !empty($body['expires_at']) ? $body['expires_at'] : null;

    if (!$code || !in_array($type, ['percent','fixed']) || $value <= 0) {
        errorResponse('Kode, tipe, dan nilai diskon wajib diisi dengan benar.');
    }
    if ($type === 'percent' && $value > 100) errorResponse('Diskon persen tidak boleh melebihi 100%.');

    // Cek duplikasi kode
    $dup = $db->prepare('SELECT id FROM promo_codes WHERE code = ?');
    $dup->execute([$code]);
    if ($dup->fetch()) errorResponse('Kode promo sudah digunakan.', 409);

    $db->prepare(
        'INSERT INTO promo_codes (code, discount_type, discount_value, min_purchase, max_uses, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)'
    )->execute([$code, $type, $value, $minPurch, $maxUses, $expiresAt]);

    successResponse(['id' => (int)$db->lastInsertId()], 'Promo code berhasil ditambahkan.', 201);
}

// Edit promo
if ($action === 'edit_promo') {
    $id        = (int)($body['id'] ?? 0);
    $code      = strtoupper(trim($body['code'] ?? ''));
    $type      = $body['discount_type'] ?? '';
    $value     = (int)($body['discount_value'] ?? 0);
    $minPurch  = (int)($body['min_purchase'] ?? 0);
    $maxUses   = isset($body['max_uses']) && $body['max_uses'] !== '' ? (int)$body['max_uses'] : null;
    $expiresAt = !empty($body['expires_at']) ? $body['expires_at'] : null;

    if (!$id || !$code || !in_array($type, ['percent','fixed']) || $value <= 0) {
        errorResponse('Data tidak lengkap atau tidak valid.');
    }

    // Cek duplikasi kode (kecuali milik sendiri)
    $dup = $db->prepare('SELECT id FROM promo_codes WHERE code = ? AND id != ?');
    $dup->execute([$code, $id]);
    if ($dup->fetch()) errorResponse('Kode promo sudah digunakan oleh promo lain.', 409);

    $db->prepare(
        'UPDATE promo_codes SET code=?, discount_type=?, discount_value=?, min_purchase=?, max_uses=?, expires_at=? WHERE id=?'
    )->execute([$code, $type, $value, $minPurch, $maxUses, $expiresAt, $id]);

    successResponse(null, 'Promo code berhasil diperbarui.');
}

// Toggle promo active
if ($action === 'toggle_promo') {
    $id = (int)($body['id'] ?? 0);
    if (!$id) errorResponse('id wajib diisi.');
    $db->prepare('UPDATE promo_codes SET is_active = 1 - is_active WHERE id = ?')->execute([$id]);
    successResponse(null, 'Status promo diperbarui.');
}

errorResponse('Action tidak dikenali.', 404);
