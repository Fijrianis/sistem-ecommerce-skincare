<?php
// =============================================
//   API: Upload Gambar Produk
//   POST /api/upload.php   → upload file gambar
//   Hanya admin yang bisa akses
// =============================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
handlePreflight();
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed.', 405);
}

// Cek apakah ada file yang diupload
if (empty($_FILES['image'])) {
    errorResponse('Tidak ada file yang diupload.');
}

$file      = $_FILES['image'];
$uploadDir = __DIR__ . '/../../uploads/products/';

// Buat folder jika belum ada
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Validasi error upload
if ($file['error'] !== UPLOAD_ERR_OK) {
    $errors = [
        UPLOAD_ERR_INI_SIZE   => 'File terlalu besar (melebihi batas server).',
        UPLOAD_ERR_FORM_SIZE  => 'File terlalu besar.',
        UPLOAD_ERR_PARTIAL    => 'Upload tidak selesai, coba lagi.',
        UPLOAD_ERR_NO_FILE    => 'Tidak ada file yang dipilih.',
        UPLOAD_ERR_NO_TMP_DIR => 'Folder sementara tidak ditemukan.',
        UPLOAD_ERR_CANT_WRITE => 'Gagal menyimpan file.',
    ];
    errorResponse($errors[$file['error']] ?? 'Upload gagal.');
}

// Validasi ukuran — maks 5MB
if ($file['size'] > 5 * 1024 * 1024) {
    errorResponse('Ukuran gambar maksimal 5MB.');
}

// Validasi tipe file — hanya gambar
$finfo    = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

$allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
if (!in_array($mimeType, $allowedMimes, true)) {
    errorResponse('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.');
}

// Tentukan ekstensi dari MIME type (lebih aman dari ekstensi asli)
$extMap = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
];
$ext      = $extMap[$mimeType];
$filename = 'product_' . uniqid() . '_' . time() . '.' . $ext;
$destPath = $uploadDir . $filename;

// Pindahkan file ke folder uploads
if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    errorResponse('Gagal menyimpan gambar ke server. Coba lagi.', 500);
}

// URL yang bisa diakses dari browser
$imageUrl = 'uploads/products/' . $filename;

successResponse(
    ['url' => $imageUrl],
    'Gambar berhasil diupload.'
);
