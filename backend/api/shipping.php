<?php
// =============================================
//   API: Shipping Methods
//   GET  /backend/api/shipping.php          → list aktif (untuk checkout)
//   GET  ?all=1                             → list semua (admin)
//   POST ?action=add                        → tambah (admin)
//   POST ?action=edit                       → edit   (admin)
//   POST ?action=toggle                     → aktif/nonaktif (admin)
// =============================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
handlePreflight();

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ---- GET ----
if ($method === 'GET') {
    $showAll = !empty($_GET['all']);

    // Jika minta semua (admin only)
    if ($showAll) {
        requireAdmin();
        $stmt = $db->query('SELECT * FROM shipping_methods ORDER BY courier ASC, price ASC');
    } else {
        $stmt = $db->query('SELECT id, courier, service, description, estimated_days, price FROM shipping_methods WHERE is_active = 1 ORDER BY price ASC');
    }

    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) {
        $r['id']        = (int) $r['id'];
        $r['price']     = (int) $r['price'];
        $r['is_active'] = isset($r['is_active']) ? (int) $r['is_active'] : 1;
    }
    unset($r);

    // Group by courier
    $grouped = [];
    foreach ($rows as $r) {
        $grouped[$r['courier']][] = $r;
    }

    successResponse(['shipping_methods' => $rows, 'grouped' => $grouped]);
}

// ---- POST (admin only) ----
requireAdmin();
requireMethod('POST');
$body   = getRequestBody();
$action = $_GET['action'] ?? '';

// Tambah kurir
if ($action === 'add') {
    $courier  = trim($body['courier'] ?? '');
    $service  = trim($body['service'] ?? '');
    $desc     = trim($body['description'] ?? '');
    $estimate = trim($body['estimated_days'] ?? '');
    $price    = (int) ($body['price'] ?? 0);

    if (!$courier || !$service || !$desc || !$estimate || $price <= 0) {
        errorResponse('Semua field wajib diisi dan harga harus > 0.');
    }

    $db->prepare('INSERT INTO shipping_methods (courier, service, description, estimated_days, price) VALUES (?,?,?,?,?)')
       ->execute([$courier, $service, $desc, $estimate, $price]);

    successResponse(['id' => (int) $db->lastInsertId()], 'Kurir berhasil ditambahkan.', 201);
}

// Edit kurir
if ($action === 'edit') {
    $id       = (int) ($body['id'] ?? 0);
    $courier  = trim($body['courier'] ?? '');
    $service  = trim($body['service'] ?? '');
    $desc     = trim($body['description'] ?? '');
    $estimate = trim($body['estimated_days'] ?? '');
    $price    = (int) ($body['price'] ?? 0);

    if (!$id || !$courier || !$service || !$desc || !$estimate || $price <= 0) {
        errorResponse('Semua field wajib diisi.');
    }

    $db->prepare('UPDATE shipping_methods SET courier=?, service=?, description=?, estimated_days=?, price=? WHERE id=?')
       ->execute([$courier, $service, $desc, $estimate, $price, $id]);

    successResponse(null, 'Kurir berhasil diperbarui.');
}

// Toggle aktif/nonaktif
if ($action === 'toggle') {
    $id = (int) ($body['id'] ?? 0);
    if (!$id) errorResponse('id wajib diisi.');
    $db->prepare('UPDATE shipping_methods SET is_active = 1 - is_active WHERE id = ?')->execute([$id]);
    successResponse(null, 'Status kurir diperbarui.');
}

errorResponse('Action tidak dikenali.', 404);
