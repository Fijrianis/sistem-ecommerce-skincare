<?php
// =============================================
//   API: Products
//   GET /api/products.php                   → semua produk (+ filter & sort)
//   GET /api/products.php?id=1              → detail satu produk
//   GET /api/products.php?category=serum    → filter per kategori
//   GET /api/products.php?search=niacinamide
//   GET /api/products.php?sort=price-low|price-high|rating
//   GET /api/products.php?categories=1      → list semua kategori
// =============================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

setCorsHeaders();
handlePreflight();
requireMethod('GET');

$db = getDB();

// ---- List categories ----
if (isset($_GET['categories'])) {
    $stmt = $db->query('SELECT slug, name, icon FROM categories ORDER BY sort_order ASC');
    successResponse($stmt->fetchAll());
}

// ---- Single product by id ----
if (isset($_GET['id'])) {
    $id = (int) $_GET['id'];
    $stmt = $db->prepare(
        'SELECT id, name, brand, category_slug AS category, price, original_price,
                rating, reviews, badge, description, skin_type, key_ingredients,
                image_url AS image, stock
         FROM products WHERE id = ? AND is_active = 1'
    );
    $stmt->execute([$id]);
    $product = $stmt->fetch();
    if (!$product) errorResponse('Produk tidak ditemukan.', 404);

    $product['id']             = (int) $product['id'];
    $product['price']          = (int) $product['price'];
    $product['original_price'] = (int) $product['original_price'];
    $product['rating']         = (float) $product['rating'];
    $product['reviews']        = (int) $product['reviews'];
    $product['stock']          = (int) $product['stock'];

    successResponse($product);
}

// ---- Products list ----
$where  = ['p.is_active = 1'];
$params = [];

// Filter by category
if (!empty($_GET['category']) && $_GET['category'] !== 'all') {
    $where[]  = 'p.category_slug = ?';
    $params[] = $_GET['category'];
}

// Filter by badge
if (!empty($_GET['badge'])) {
    $where[]  = 'p.badge = ?';
    $params[] = $_GET['badge'];
}

// Search by name or brand
if (!empty($_GET['search'])) {
    $where[]  = '(p.name LIKE ? OR p.brand LIKE ?)';
    $term     = '%' . $_GET['search'] . '%';
    $params[] = $term;
    $params[] = $term;
}

$whereSQL = 'WHERE ' . implode(' AND ', $where);

// Sort
$sortMap = [
    'price-low'  => 'p.price ASC',
    'price-high' => 'p.price DESC',
    'rating'     => 'p.rating DESC',
    'newest'     => 'p.id DESC',
    'default'    => 'p.id ASC',
];
$sortKey  = $_GET['sort'] ?? 'default';
$orderSQL = 'ORDER BY ' . ($sortMap[$sortKey] ?? $sortMap['default']);

// Pagination
$page     = max(1, (int) ($_GET['page'] ?? 1));
$perPage  = min(50, max(1, (int) ($_GET['per_page'] ?? 20)));
$offset   = ($page - 1) * $perPage;

// Count total
$countStmt = $db->prepare("SELECT COUNT(*) FROM products p $whereSQL");
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();

// Fetch
$sql  = "SELECT p.id, p.name, p.brand, p.category_slug AS category, p.price,
                p.original_price, p.rating, p.reviews, p.badge,
                p.description, p.skin_type, p.key_ingredients, p.image_url AS image, p.stock
         FROM products p
         $whereSQL $orderSQL
         LIMIT $perPage OFFSET $offset";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$products = $stmt->fetchAll();

// Cast numeric types
foreach ($products as &$p) {
    $p['id']             = (int) $p['id'];
    $p['price']          = (int) $p['price'];
    $p['original_price'] = (int) $p['original_price'];
    $p['rating']         = (float) $p['rating'];
    $p['reviews']        = (int) $p['reviews'];
    $p['stock']          = (int) $p['stock'];
}
unset($p);

successResponse([
    'products'   => $products,
    'total'      => $total,
    'page'       => $page,
    'per_page'   => $perPage,
    'total_pages' => (int) ceil($total / $perPage),
]);
