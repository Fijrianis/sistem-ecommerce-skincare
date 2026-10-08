<?php
// =============================================
//   Admin Panel Gateway
//   Proteksi: hanya admin yang bisa akses.
//   Akses via: http://localhost/sistem_skincare/admin_panel.php
// =============================================

require_once __DIR__ . '/backend/config/database.php';
require_once __DIR__ . '/backend/helpers/response.php';
require_once __DIR__ . '/backend/middleware/auth.php';

startSecureSession();

// Jika belum login → redirect ke halaman utama dengan flag
if (empty($_SESSION['user_id'])) {
    header('Location: index.html?auth=admin');
    exit;
}

// Jika login tapi bukan admin → 403
if (($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    ?>
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Akses Ditolak — Fidéa Glow &amp; Co</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
    </head>
    <body class="min-h-screen bg-rose-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
            <div class="text-6xl mb-4">🚫</div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
            <p class="text-gray-500 text-sm mb-6">
                Akunmu tidak memiliki izin admin.<br/>
                Hubungi administrator untuk mendapatkan akses.
            </p>
            <a href="index.html" class="inline-block px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm rounded-full transition-all">
                <i class="fas fa-arrow-left mr-2"></i>Kembali ke Toko
            </a>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// ✅ Admin terverifikasi — load halaman admin
$adminName  = htmlspecialchars($_SESSION['name'] ?? 'Admin');
$adminEmail = '';

// Ambil email dari DB
$db    = getDB();
$stmt  = $db->prepare('SELECT email FROM users WHERE id = ?');
$stmt->execute([$_SESSION['user_id']]);
$uRow  = $stmt->fetch();
$adminEmail = htmlspecialchars($uRow['email'] ?? '');
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fidéa Glow &amp; Co Admin Panel</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <link rel="stylesheet" href="admin.css" />
</head>
<body class="font-inter bg-gray-50 text-gray-800">

<!-- Inject session ke JS -->
<script>
  const ADMIN_SESSION = {
    name : <?= json_encode($adminName) ?>,
    email: <?= json_encode($adminEmail) ?>,
  };
</script>

<!-- ======== ADMIN PANEL ======== -->
<div id="adminPanel" class="min-h-screen flex">

  <!-- Sidebar -->
  <aside id="sidebar" class="sidebar w-64 flex flex-col fixed top-0 left-0 h-full z-30">
    <!-- Logo -->
    <div class="p-5 border-b" style="border-color:#e8c8d2; background:rgba(244,63,94,0.04)">
      <a href="index.html" target="_blank" class="flex items-center gap-1.5">
        <svg width="36" height="30" viewBox="0 0 44 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="atlg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#f43f5e"/>
              <stop offset="100%" stop-color="#fda4af"/>
            </linearGradient>
          </defs>
          <path d="M22 28 C20 22 18 14 20 7 C21 3 22 1 22 1 C22 1 23 3 24 7 C26 14 24 22 22 28Z"
            stroke="url(#atlg)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M22 28 C19 24 15 19 13 13 C12 9 13 6 15 6 C17 6 18 10 18.5 14 C19.5 19 21 24 22 28Z"
            stroke="url(#atlg)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M22 28 C25 24 29 19 31 13 C32 9 31 6 29 6 C27 6 26 10 25.5 14 C24.5 19 23 24 22 28Z"
            stroke="url(#atlg)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
        <div>
          <div style="font-family:'Playfair Display',serif; font-weight:700; font-size:0.9rem; color:#7a2a3a; line-height:1.2">Fidéa Glow &amp; Co</div>
          <div style="font-size:0.65rem; color:#c4909f; letter-spacing:0.1em; text-transform:uppercase">Admin Panel</div>
        </div>
      </a>
    </div>

    <nav class="flex-1 py-4 overflow-y-auto">
      <div class="px-3 mb-2">
        <p class="text-xs uppercase tracking-widest px-3 mb-2" style="color:#c4909f">Menu Utama</p>
        <button onclick="showPage('dashboard')" class="nav-item active w-full" id="nav-dashboard">
          <i class="fas fa-chart-pie w-5"></i> Dashboard
        </button>
        <button onclick="showPage('orders')" class="nav-item w-full" id="nav-orders">
          <i class="fas fa-shopping-bag w-5"></i> Pesanan
          <span id="badgePending" class="ml-auto bg-rose-500 text-white text-xs rounded-full px-2 py-0.5 hidden">0</span>
        </button>
        <button onclick="showPage('products')" class="nav-item w-full" id="nav-products">
          <i class="fas fa-box w-5"></i> Produk
        </button>
        <button onclick="showPage('users')" class="nav-item w-full" id="nav-users">
          <i class="fas fa-users w-5"></i> Pelanggan
        </button>
        <button onclick="showPage('promos')" class="nav-item w-full" id="nav-promos">
          <i class="fas fa-ticket-alt w-5"></i> Promo Code
        </button>
      </div>
      <div class="px-3 mt-4">
        <p class="text-xs uppercase tracking-widest px-3 mb-2" style="color:#c4909f">Pengaturan</p>
        <button onclick="showPage('shipping')" class="nav-item w-full" id="nav-shipping">
          <i class="fas fa-truck w-5"></i> Kurir & Ongkir
        </button>
        <button onclick="showPage('account')" class="nav-item w-full" id="nav-account">
          <i class="fas fa-user-shield w-5"></i> Akun Admin
        </button>
        <a href="index.html" target="_blank" class="nav-item w-full block">
          <i class="fas fa-store w-5"></i> Lihat Toko
        </a>
      </div>
    </nav>

    <!-- Admin info + Dark mode toggle -->
    <div class="p-4" style="border-top:1px solid #e8c8d2; background:rgba(244,63,94,0.05)">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style="background:linear-gradient(135deg,#f43f5e,#fb7185)">
          <?= strtoupper(substr($adminName, 0, 1)) ?>
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-sm font-semibold truncate" style="color:#7a2a3a"><?= $adminName ?></div>
          <div class="text-xs truncate" style="color:#c4909f"><?= $adminEmail ?></div>
        </div>
      </div>

      <!-- Toggle Dark / Light Mode -->
      <div class="flex items-center justify-between px-1 mb-2">
        <div class="flex items-center gap-2">
          <i id="themeIcon" class="fas fa-sun text-xs" style="color:#c4909f"></i>
          <span id="themeLabel" class="text-xs font-medium" style="color:#a07080">Light Mode</span>
        </div>
        <div id="themeToggleTrack" class="theme-track" onclick="toggleTheme()">
          <div id="themeToggleThumb" class="theme-thumb"></div>
        </div>
      </div>

      <button onclick="adminLogout()" class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all"
        style="color:#c4909f"
        onmouseover="this.style.color='#f43f5e';this.style.background='rgba(244,63,94,0.08)'"
        onmouseout="this.style.color='#c4909f';this.style.background='transparent'">
        <i class="fas fa-sign-out-alt"></i> Logout
      </button>
    </div>
  </aside>

  <!-- Main Content -->
  <div class="flex-1 ml-64 flex flex-col min-h-screen" id="mainContent">

    <!-- Top Bar -->
    <header class="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div class="flex items-center gap-3">
        <button onclick="toggleSidebar()" class="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <i class="fas fa-bars"></i>
        </button>
        <div>
          <h2 id="pageTitle" class="text-lg font-bold text-gray-900">Dashboard</h2>
          <p id="pageSubtitle" class="text-xs text-gray-400">Selamat datang, <?= $adminName ?> 👋</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="refreshPage()" class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all" title="Refresh data">
          <i class="fas fa-sync-alt text-sm"></i>
        </button>
        <span class="text-xs text-gray-300 hidden md:block" id="lastUpdated"></span>
      </div>
    </header>

    <!-- Pages -->
    <main class="flex-1 p-6 overflow-auto">

      <!-- ===== DASHBOARD ===== -->
      <div id="page-dashboard" class="page">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="stat-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all" onclick="showPage('orders')">
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center"><i class="fas fa-money-bill-wave text-rose-500"></i></div>
              <span class="text-xs bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full font-semibold">Revenue</span>
            </div>
            <div class="text-xl font-bold text-gray-900" id="statRevenue">—</div>
            <div class="text-xs text-gray-400 mt-1">Total Pendapatan</div>
          </div>
          <div class="stat-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all" onclick="showPage('orders')">
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><i class="fas fa-shopping-bag text-blue-500"></i></div>
              <span class="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-semibold">Pesanan</span>
            </div>
            <div class="text-xl font-bold text-gray-900" id="statOrders">—</div>
            <div class="text-xs text-gray-400 mt-1">Total Pesanan</div>
          </div>
          <div class="stat-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all" onclick="showPage('users')">
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center"><i class="fas fa-users text-green-500"></i></div>
              <span class="text-xs bg-green-50 text-green-500 px-2 py-0.5 rounded-full font-semibold">User</span>
            </div>
            <div class="text-xl font-bold text-gray-900" id="statUsers">—</div>
            <div class="text-xs text-gray-400 mt-1">Total Pelanggan</div>
          </div>
          <div class="stat-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all" onclick="showPage('products')">
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><i class="fas fa-box text-amber-500"></i></div>
              <span id="statLowStockBadge" class="text-xs px-2 py-0.5 rounded-full font-semibold"></span>
            </div>
            <div class="text-xl font-bold text-gray-900" id="statProducts">—</div>
            <div class="text-xs text-gray-400 mt-1">Produk Aktif</div>
          </div>
        </div>

        <!-- Order Status -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div class="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center cursor-pointer hover:shadow-md transition-all" onclick="showPage('orders','pending')">
            <div class="text-2xl font-bold text-yellow-600" id="statPending">0</div>
            <div class="text-xs text-yellow-600 mt-1">⏳ Pending</div>
          </div>
          <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center cursor-pointer hover:shadow-md transition-all" onclick="showPage('orders','processing')">
            <div class="text-2xl font-bold text-blue-600" id="statProcessing">0</div>
            <div class="text-xs text-blue-600 mt-1">⚙️ Diproses</div>
          </div>
          <div class="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center cursor-pointer hover:shadow-md transition-all" onclick="showPage('orders','shipped')">
            <div class="text-2xl font-bold text-purple-600" id="statShipped">0</div>
            <div class="text-xs text-purple-600 mt-1">🚚 Dikirim</div>
          </div>
          <div class="bg-green-50 border border-green-100 rounded-xl p-4 text-center cursor-pointer hover:shadow-md transition-all" onclick="showPage('orders','delivered')">
            <div class="text-2xl font-bold text-green-600" id="statDelivered">0</div>
            <div class="text-xs text-green-600 mt-1">✅ Selesai</div>
          </div>
          <div class="bg-red-50 border border-red-100 rounded-xl p-4 text-center cursor-pointer hover:shadow-md transition-all" onclick="showPage('orders','cancelled')">
            <div class="text-2xl font-bold text-red-500" id="statCancelled">0</div>
            <div class="text-xs text-red-500 mt-1">❌ Dibatalkan</div>
          </div>
        </div>

        <!-- Recent Orders -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 class="font-bold text-gray-900">Pesanan Terbaru</h3>
            <button onclick="showPage('orders')" class="text-xs text-rose-500 hover:underline font-medium">Lihat semua →</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead><tr class="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
                <th class="px-6 py-3 text-left">Kode</th>
                <th class="px-6 py-3 text-left">Pelanggan</th>
                <th class="px-6 py-3 text-left">Kurir</th>
                <th class="px-6 py-3 text-left">Total</th>
                <th class="px-6 py-3 text-left">Status</th>
                <th class="px-6 py-3 text-left">Tanggal</th>
              </tr></thead>
              <tbody id="recentOrdersBody" class="divide-y divide-gray-50 text-sm"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ===== ORDERS ===== -->
      <div id="page-orders" class="page hidden">
        <div class="flex flex-wrap gap-3 mb-5">
          <input id="orderSearch" type="text" placeholder="Cari kode / nama pelanggan..."
            class="flex-1 min-w-48 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-200 text-sm bg-white"
            oninput="filterOrders()" />
          <select id="orderStatusFilter" onchange="filterOrders()"
            class="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 cursor-pointer">
            <option value="">Semua Status</option>
            <option value="pending">⏳ Pending</option>
            <option value="processing">⚙️ Diproses</option>
            <option value="shipped">🚚 Dikirim</option>
            <option value="delivered">✅ Selesai</option>
            <option value="cancelled">❌ Dibatalkan</option>
          </select>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead><tr class="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
                <th class="px-5 py-3 text-left">Kode Pesanan</th>
                <th class="px-5 py-3 text-left">Pelanggan</th>
                <th class="px-5 py-3 text-left">Kurir</th>
                <th class="px-5 py-3 text-left">Total</th>
                <th class="px-5 py-3 text-left">Status</th>
                <th class="px-5 py-3 text-left">Tanggal</th>
                <th class="px-5 py-3 text-left">Aksi</th>
              </tr></thead>
              <tbody id="ordersBody" class="divide-y divide-gray-50 text-sm"></tbody>
            </table>
          </div>
          <div id="ordersPagination" class="px-5 py-3 border-t border-gray-50 flex justify-between items-center text-sm text-gray-400"></div>
        </div>
      </div>

      <!-- ===== PRODUCTS ===== -->
      <div id="page-products" class="page hidden">
        <div class="flex flex-wrap gap-3 mb-5">
          <input id="productSearch" type="text" placeholder="Cari produk..."
            class="flex-1 min-w-48 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-200 text-sm bg-white"
            oninput="loadAdminProducts()" />
          <select id="productCatFilter" onchange="loadAdminProducts()"
            class="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 cursor-pointer">
            <option value="">Semua Kategori</option>
            <option value="serum">Serum</option>
            <option value="moisturizer">Moisturizer</option>
            <option value="cleanser">Cleanser</option>
            <option value="sunscreen">Sunscreen</option>
            <option value="toner">Toner</option>
            <option value="mask">Mask</option>
            <option value="eye-cream">Eye Cream</option>
          </select>
          <button onclick="openProductModal()" class="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2">
            <i class="fas fa-plus"></i> Tambah Produk
          </button>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead><tr class="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
                <th class="px-5 py-3 text-left">Produk</th>
                <th class="px-5 py-3 text-left">Kategori</th>
                <th class="px-5 py-3 text-left">Harga</th>
                <th class="px-5 py-3 text-left">Stok</th>
                <th class="px-5 py-3 text-left">Rating</th>
                <th class="px-5 py-3 text-left">Status</th>
                <th class="px-5 py-3 text-left">Aksi</th>
              </tr></thead>
              <tbody id="productsBody" class="divide-y divide-gray-50 text-sm"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ===== USERS ===== -->
      <div id="page-users" class="page hidden">
        <div class="flex flex-wrap gap-3 mb-5">
          <input id="userSearch" type="text" placeholder="Cari nama / email..."
            class="flex-1 min-w-48 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-200 text-sm bg-white"
            oninput="loadAdminUsers()" />
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead><tr class="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
                <th class="px-5 py-3 text-left">Pelanggan</th>
                <th class="px-5 py-3 text-left">Email</th>
                <th class="px-5 py-3 text-left">Pesanan</th>
                <th class="px-5 py-3 text-left">Total Belanja</th>
                <th class="px-5 py-3 text-left">Bergabung</th>
                <th class="px-5 py-3 text-left">Status</th>
                <th class="px-5 py-3 text-left">Aksi</th>
              </tr></thead>
              <tbody id="usersBody" class="divide-y divide-gray-50 text-sm"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ===== PROMO CODE ===== -->
      <div id="page-promos" class="page hidden">
        <div class="flex flex-wrap gap-3 mb-5">
          <h3 class="flex-1 text-base font-semibold text-gray-700">Daftar Kode Promo</h3>
          <button onclick="openPromoModal()" class="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2">
            <i class="fas fa-plus"></i> Tambah Promo
          </button>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead><tr class="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
                <th class="px-5 py-3 text-left">Kode</th>
                <th class="px-5 py-3 text-left">Tipe</th>
                <th class="px-5 py-3 text-left">Nilai</th>
                <th class="px-5 py-3 text-left">Min. Pembelian</th>
                <th class="px-5 py-3 text-left">Penggunaan</th>
                <th class="px-5 py-3 text-left">Kadaluarsa</th>
                <th class="px-5 py-3 text-left">Status</th>
                <th class="px-5 py-3 text-left">Aksi</th>
              </tr></thead>
              <tbody id="promosBody" class="divide-y divide-gray-50 text-sm"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ===== SHIPPING MANAGEMENT ===== -->
      <div id="page-shipping" class="page hidden">
        <div class="flex justify-between items-center mb-5">
          <p class="text-sm text-gray-400">Kelola kurir dan tarif ongkos kirim</p>
          <button onclick="openShippingModal()" class="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2">
            <i class="fas fa-plus"></i> Tambah Kurir
          </button>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead><tr class="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
                <th class="px-5 py-3 text-left">Kurir</th>
                <th class="px-5 py-3 text-left">Layanan</th>
                <th class="px-5 py-3 text-left">Deskripsi</th>
                <th class="px-5 py-3 text-left">Estimasi</th>
                <th class="px-5 py-3 text-left">Harga</th>
                <th class="px-5 py-3 text-left">Status</th>
                <th class="px-5 py-3 text-left">Aksi</th>
              </tr></thead>
              <tbody id="shippingBody" class="divide-y divide-gray-50 text-sm"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ===== AKUN ADMIN ===== -->
      <div id="page-account" class="page hidden">
        <div class="max-w-lg">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-2xl font-bold text-white">
                <?= strtoupper(substr($adminName, 0, 1)) ?>
              </div>
              <div>
                <h3 class="font-bold text-gray-900 text-lg" id="accountName"><?= $adminName ?></h3>
                <p class="text-sm text-gray-400" id="accountEmail"><?= $adminEmail ?></p>
                <span class="inline-block mt-1 text-xs bg-rose-100 text-rose-600 px-3 py-0.5 rounded-full font-semibold">
                  <i class="fas fa-shield-alt mr-1"></i>Administrator
                </span>
              </div>
            </div>

            <h4 class="font-semibold text-gray-800 text-sm mb-4 pb-2 border-b border-gray-100">Ubah Password</h4>
            <form onsubmit="changePassword(event)" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">Password Saat Ini</label>
                <input id="oldPassword" type="password" placeholder="••••••••" required
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">Password Baru</label>
                <input id="newPassword" type="password" placeholder="Min. 6 karakter" required
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">Konfirmasi Password Baru</label>
                <input id="confirmPassword" type="password" placeholder="Ulangi password baru" required
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm" />
              </div>
              <p id="pwError" class="text-xs text-red-500 hidden"></p>
              <p id="pwSuccess" class="text-xs text-emerald-600 hidden"></p>
              <button type="submit" class="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition-all">
                <i class="fas fa-key mr-2"></i>Ubah Password
              </button>
            </form>
          </div>

          <div class="bg-red-50 border border-red-100 rounded-2xl p-6">
            <h4 class="font-semibold text-red-700 text-sm mb-2"><i class="fas fa-exclamation-triangle mr-2"></i>Zona Berbahaya</h4>
            <p class="text-xs text-red-500 mb-4">Logout dari semua sesi aktif admin.</p>
            <button onclick="adminLogout()" class="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-all">
              <i class="fas fa-sign-out-alt mr-2"></i>Logout Sekarang
            </button>
          </div>
        </div>
      </div>

    </main>
  </div>
</div>

<!-- ======== ORDER DETAIL MODAL ======== -->
<div id="orderDetailOverlay" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden items-center justify-center p-4">
  <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
    <div class="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
      <h3 class="font-bold text-gray-900 text-lg">Detail Pesanan</h3>
      <div class="flex items-center gap-2">
        <button onclick="printReceipt()" id="btnPrintReceipt"
          class="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-all flex items-center gap-1.5">
          <i class="fas fa-print"></i> Cetak Label Pengiriman
        </button>
        <button onclick="closeOrderDetail()" class="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-all"><i class="fas fa-times"></i></button>
      </div>
    </div>
    <div id="orderDetailContent" class="p-6"></div>
  </div>
</div>

<!-- ======== PRODUCT MODAL ======== -->
<div id="productModalOverlay" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden items-center justify-center p-4">
  <div class="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
    <div class="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
      <h3 id="productModalTitle" class="font-bold text-gray-900 text-lg">Tambah Produk</h3>
      <button onclick="closeProductModal()" class="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-all"><i class="fas fa-times"></i></button>
    </div>
    <form id="productForm" onsubmit="submitProduct(event)" class="p-6 space-y-4">
      <input type="hidden" id="productId" />
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="form-label">Nama Produk</label>
          <input id="pName" type="text" required class="form-input" placeholder="Nama produk" />
        </div>
        <div>
          <label class="form-label">Brand</label>
          <input id="pBrand" type="text" required class="form-input" placeholder="Brand" />
        </div>
        <div>
          <label class="form-label">Kategori</label>
          <select id="pCategory" required class="form-input bg-white">
            <option value="">Pilih kategori</option>
            <option value="serum">Serum</option>
            <option value="moisturizer">Moisturizer</option>
            <option value="cleanser">Cleanser</option>
            <option value="sunscreen">Sunscreen</option>
            <option value="toner">Toner</option>
            <option value="mask">Mask</option>
            <option value="eye-cream">Eye Cream</option>
          </select>
        </div>
        <div>
          <label class="form-label">Harga (Rp)</label>
          <input id="pPrice" type="number" required class="form-input" placeholder="89000" />
        </div>
        <div>
          <label class="form-label">Harga Asli (Rp)</label>
          <input id="pOriginalPrice" type="number" required class="form-input" placeholder="120000" />
        </div>
        <div>
          <label class="form-label">Stok</label>
          <input id="pStock" type="number" required class="form-input" value="100" />
        </div>
        <div>
          <label class="form-label">Badge</label>
          <select id="pBadge" class="form-input bg-white">
            <option value="">Tidak ada</option>
            <option value="new">NEW</option>
            <option value="hot">HOT</option>
            <option value="sale">SALE</option>
            <option value="bestseller">BESTSELLER</option>
          </select>
        </div>
        <div class="col-span-2">
          <label class="form-label">URL Gambar</label>
          <input id="pImage" type="url" required class="form-input" placeholder="https://..." />
        </div>
        <div class="col-span-2">
          <label class="form-label">Deskripsi</label>
          <textarea id="pDescription" required rows="3" class="form-input resize-none" placeholder="Deskripsi produk..."></textarea>
        </div>
        <div>
          <label class="form-label">Jenis Kulit</label>
          <input id="pSkinType" type="text" required class="form-input" placeholder="Berminyak, Kombinasi" />
        </div>
        <div>
          <label class="form-label">Key Ingredients</label>
          <input id="pIngredients" type="text" required class="form-input" placeholder="Niacinamide 10%, Zinc" />
        </div>
      </div>
      <p id="productFormError" class="text-xs text-red-500 hidden"></p>
      <div class="flex gap-3 pt-2">
        <button type="button" onclick="closeProductModal()" class="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">Batal</button>
        <button type="submit" class="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-all">
          <i class="fas fa-save mr-2"></i><span id="productSubmitLabel">Simpan</span>
        </button>
      </div>
    </form>
  </div>
</div>

<!-- ======== SHIPPING MODAL ======== -->
<div id="shippingModalOverlay" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden items-center justify-center p-4">
  <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md">
    <div class="flex items-center justify-between p-6 border-b border-gray-100">
      <h3 id="shippingModalTitle" class="font-bold text-gray-900 text-lg">Tambah Kurir</h3>
      <button onclick="closeShippingModal()" class="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-all"><i class="fas fa-times"></i></button>
    </div>
    <form id="shippingForm" onsubmit="submitShipping(event)" class="p-6 space-y-4">
      <input type="hidden" id="shippingId" />
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Nama Kurir</label>
          <input id="sCourier" type="text" required class="form-input" placeholder="JNE, J&T, dll" />
        </div>
        <div>
          <label class="form-label">Layanan</label>
          <input id="sService" type="text" required class="form-input" placeholder="REG, YES, dll" />
        </div>
        <div class="col-span-2">
          <label class="form-label">Deskripsi</label>
          <input id="sDescription" type="text" required class="form-input" placeholder="JNE Reguler" />
        </div>
        <div>
          <label class="form-label">Estimasi</label>
          <input id="sEstimate" type="text" required class="form-input" placeholder="2-3 hari kerja" />
        </div>
        <div>
          <label class="form-label">Harga (Rp)</label>
          <input id="sPrice" type="number" required class="form-input" placeholder="15000" />
        </div>
      </div>
      <p id="shippingFormError" class="text-xs text-red-500 hidden"></p>
      <div class="flex gap-3 pt-2">
        <button type="button" onclick="closeShippingModal()" class="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">Batal</button>
        <button type="submit" class="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-all">
          <i class="fas fa-save mr-2"></i><span id="shippingSubmitLabel">Simpan</span>
        </button>
      </div>
    </form>
  </div>
</div>

<!-- ======== PROMO MODAL ======== -->
<div id="promoModalOverlay" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden items-center justify-center p-4">
  <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
    <div class="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
      <h3 id="promoModalTitle" class="font-bold text-gray-900 text-lg">Tambah Promo Code</h3>
      <button onclick="closePromoModal()" class="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-all"><i class="fas fa-times"></i></button>
    </div>
    <form id="promoForm" onsubmit="submitPromo(event)" class="p-6 space-y-4">
      <input type="hidden" id="promoId" />
      <div>
        <label class="form-label">Kode Promo</label>
        <input id="promoCode" type="text" required class="form-input uppercase tracking-widest" placeholder="Contoh: GLOW30" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Tipe Diskon</label>
          <select id="promoType" required class="form-input bg-white" onchange="updatePromoValueLabel()">
            <option value="percent">Persen (%)</option>
            <option value="fixed">Nominal (Rp)</option>
          </select>
        </div>
        <div>
          <label class="form-label" id="promoValueLabel">Nilai Diskon (%)</label>
          <input id="promoValue" type="number" required class="form-input" placeholder="30" min="1" />
        </div>
      </div>
      <div>
        <label class="form-label">Minimum Pembelian (Rp)</label>
        <input id="promoMinPurchase" type="number" class="form-input" placeholder="100000" min="0" value="0" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Maks. Penggunaan</label>
          <input id="promoMaxUses" type="number" class="form-input" placeholder="Kosong = tak terbatas" min="1" />
        </div>
        <div>
          <label class="form-label">Kadaluarsa</label>
          <input id="promoExpiry" type="date" class="form-input" />
        </div>
      </div>
      <p id="promoFormError" class="text-xs text-red-500 hidden"></p>
      <div class="flex gap-3 pt-2">
        <button type="button" onclick="closePromoModal()" class="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">Batal</button>
        <button type="submit" class="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-all">
          <i class="fas fa-save mr-2"></i><span id="promoSubmitLabel">Simpan</span>
        </button>
      </div>
    </form>
  </div>
</div>

<!-- ======== TOAST ======== -->
<div id="adminToast" class="fixed bottom-6 right-6 z-[100] transform translate-y-24 transition-all duration-300 opacity-0 pointer-events-none">
  <div class="bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2">
    <i id="adminToastIcon" class="fas fa-check-circle text-green-400"></i>
    <span id="adminToastMsg"></span>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
<script src="admin.js"></script>
</body>
</html>
