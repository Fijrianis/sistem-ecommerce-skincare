// =============================================
//   Fidéa Glow & Co Admin JS
//   Digunakan oleh admin_panel.php
//   Session sudah diverifikasi di PHP
// =============================================

const ADMIN_API = {
  auth    : 'backend/api/auth.php',
  admin   : 'backend/api/admin.php',
  products: 'backend/api/products.php',
  shipping: 'backend/api/shipping.php',
};

let currentPage  = 'dashboard';
let ordersFilter = { status: '', search: '', page: 1 };

const PAGE_TITLES = {
  dashboard: ['Dashboard',          'Ringkasan data toko'],
  orders   : ['Manajemen Pesanan',  'Kelola semua pesanan pelanggan'],
  products : ['Manajemen Produk',   'Tambah, edit, dan nonaktifkan produk'],
  users    : ['Manajemen Pelanggan','Lihat dan kelola akun pelanggan'],
  promos   : ['Promo Code',         'Tambah dan kelola kode diskon'],
  shipping : ['Kurir & Ongkir',     'Kelola pilihan kurir pengiriman'],
  account  : ['Akun Admin',         'Pengaturan akun administrator'],
};

// =============================================
//   Theme (Dark / Light Mode)
// =============================================
function applyTheme(theme) {
  const html   = document.documentElement;
  const icon   = document.getElementById('themeIcon');
  const label  = document.getElementById('themeLabel');
  const track  = document.getElementById('themeToggleTrack');

  const isDark = theme === 'dark';
  html[isDark ? 'setAttribute' : 'removeAttribute']('data-theme', 'dark');

  const colors = isDark ? {
    pageBg    : '#12050a',
    surface   : '#1f080e',
    surfaceBg : '#250a11',
    border    : '#3a1520',
    textH     : '#ffe4ec',
    textBody  : '#fda4af',
    textMuted : '#c4707e',
    headerBg  : 'rgba(22,6,12,0.97)',
    inputBg   : '#1f080e',
    inputText : '#ffe4ec',
    inputBorder: '#3a1520',
  } : {
    pageBg    : '#fdf6f0',
    surface   : '#ffffff',
    surfaceBg : '#fff5f7',
    border    : '#fce7f3',
    textH     : '',
    textBody  : '',
    textMuted : '',
    headerBg  : 'rgba(255,255,255,0.95)',
    inputBg   : '#ffffff',
    inputText : '',
    inputBorder: '#f0c5d0',
  };

  // body & main
  document.body.style.backgroundColor = colors.pageBg;
  const main = document.getElementById('mainContent');
  if (main) main.style.backgroundColor = colors.pageBg;

  // header
  const header = document.querySelector('header');
  if (header) {
    header.style.background = colors.headerBg;
    header.style.borderBottomColor = colors.border;
  }

  // semua surface card (kecuali sidebar & toast)
  document.querySelectorAll('.bg-white, .bg-gray-50, .rounded-2xl, .rounded-3xl').forEach(el => {
    if (el.closest('.sidebar') || el.closest('#adminToast') || el.closest('.fixed.inset-0')) return;
    el.style.backgroundColor = colors.surface;
    el.style.borderColor     = colors.border;
    if (colors.textH) el.style.color = colors.textH;
    else el.style.color = '';
  });

  // table head
  document.querySelectorAll('thead th, thead tr').forEach(el => {
    el.style.backgroundColor = isDark ? colors.surfaceBg : '';
    el.style.color = isDark ? colors.textMuted : '';
  });

  // teks
  document.querySelectorAll('.text-gray-900,.text-gray-800').forEach(el => el.style.color = colors.textH);
  document.querySelectorAll('.text-gray-700').forEach(el => el.style.color = isDark ? colors.textBody : '');
  document.querySelectorAll('.text-gray-500,.text-gray-400,.text-gray-300').forEach(el => el.style.color = isDark ? colors.textMuted : '');

  // input / select / textarea
  document.querySelectorAll('input:not([type=hidden]), select, textarea').forEach(el => {
    if (el.closest('.sidebar')) return;
    el.style.backgroundColor = colors.inputBg;
    el.style.color           = colors.inputText;
    el.style.borderColor     = colors.inputBorder;
  });

  // order status cards
  document.querySelectorAll('.bg-yellow-50,.bg-blue-50,.bg-purple-50,.bg-green-50,.bg-red-50').forEach(el => {
    el.style.backgroundColor = isDark ? colors.surfaceBg : '';
  });

  // sidebar ikut gelap/terang
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList[isDark ? 'add' : 'remove']('dark-sb');
    // Update warna teks logo di sidebar
    const logoTitle = sidebar.querySelector('.font-bold.text-sm');
    const logoSub   = sidebar.querySelector('.text-xs[style*="c4909f"], .text-xs[style*="Admin"]');
    if (logoTitle) logoTitle.style.color = isDark ? '#fecdd3' : '#7a2a3a';
    if (logoSub)   logoSub.style.color   = isDark ? 'rgba(253,164,175,0.55)' : '#c4909f';
  }

  // toggle icon & label warna sesuai mode
  if (icon) {
    icon.className = `fas fa-${isDark ? 'moon' : 'sun'} text-xs`;
    icon.style.color = isDark ? 'rgba(253,164,175,0.7)' : '#c4909f';
  }
  if (label) {
    label.textContent = isDark ? 'Dark Mode' : 'Light Mode';
    label.style.color = isDark ? 'rgba(253,164,175,0.6)' : '#a07080';
  }
  if (track) track.classList[isDark ? 'add' : 'remove']('is-dark');

  localStorage.setItem('fidea_admin_theme', theme);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}

// Re-apply theme setiap kali konten halaman berubah (navigasi panel)
const _origShowPage = typeof showPage !== 'undefined' ? showPage : null;

(function initTheme() {
  document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('fidea_admin_theme') || 'light';
    applyTheme(saved);
    // Re-apply setiap 400ms selama 2 detik untuk tangkap elemen dinamis
    [200, 600, 1200].forEach(ms => setTimeout(() => applyTheme(saved), ms));
  });
})();

// =============================================
//   Utility
// =============================================
function fmt(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}
function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function statusBadge(status) {
  const map = {
    pending   : ['status-pending',    '⏳ Pending'],
    processing: ['status-processing', '⚙️ Diproses'],
    shipped   : ['status-shipped',    '🚚 Dikirim'],
    delivered : ['status-delivered',  '✅ Selesai'],
    cancelled : ['status-cancelled',  '❌ Dibatalkan'],
  };
  const [cls, lbl] = map[status] || ['', status];
  return `<span class="status-badge ${cls}">${lbl}</span>`;
}
async function apiFetch(url, opts = {}) {
  try {
    const res = await fetch(url, { credentials: 'include', ...opts });
    return await res.json();
  } catch {
    return { success: false, message: 'Koneksi ke server gagal.' };
  }
}
function showToast(msg, isErr = false) {
  const t = document.getElementById('adminToast');
  document.getElementById('adminToastMsg').textContent = msg;
  document.getElementById('adminToastIcon').className  =
    isErr ? 'fas fa-times-circle text-red-400' : 'fas fa-check-circle text-green-400';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// =============================================
//   Navigation
// =============================================
function showPage(page, filterVal = '') {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById(`page-${page}`);
  const navEl  = document.getElementById(`nav-${page}`);
  if (!pageEl) return;

  pageEl.classList.remove('hidden');
  navEl?.classList.add('active');

  const [title, subtitle] = PAGE_TITLES[page] || [page, ''];
  document.getElementById('pageTitle').textContent    = title;
  document.getElementById('pageSubtitle').textContent = subtitle || '';
  currentPage = page;

  if (page === 'dashboard') loadDashboard();
  else if (page === 'orders') {
    if (filterVal) {
      document.getElementById('orderStatusFilter').value = filterVal;
      ordersFilter.status = filterVal;
    }
    loadAdminOrders();
  }
  else if (page === 'products') loadAdminProducts();
  else if (page === 'users')    loadAdminUsers();
  else if (page === 'promos')   loadAdminPromos();
  else if (page === 'shipping') loadShipping();

  // Re-apply tema setelah konten dimuat
  const saved = localStorage.getItem('fidea_admin_theme') || 'light';
  if (saved === 'dark') setTimeout(() => applyTheme('dark'), 400);
}

function refreshPage() { showPage(currentPage); }

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// =============================================
//   Auth
// =============================================
async function adminLogout() {
  await apiFetch(`${ADMIN_API.auth}?action=logout`, { method: 'POST' });
  window.location.href = 'index.html';
}

async function changePassword(e) {
  e.preventDefault();
  const oldPw  = document.getElementById('oldPassword').value;
  const newPw  = document.getElementById('newPassword').value;
  const confPw = document.getElementById('confirmPassword').value;
  const errEl  = document.getElementById('pwError');
  const okEl   = document.getElementById('pwSuccess');

  errEl.classList.add('hidden');
  okEl.classList.add('hidden');

  if (newPw !== confPw) {
    errEl.textContent = 'Konfirmasi password tidak cocok.';
    errEl.classList.remove('hidden');
    return;
  }

  const res = await apiFetch(`${ADMIN_API.auth}?action=change_password`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ old_password: oldPw, new_password: newPw }),
  });

  if (res.success) {
    okEl.textContent = '✅ ' + res.message;
    okEl.classList.remove('hidden');
    document.getElementById('oldPassword').value    = '';
    document.getElementById('newPassword').value    = '';
    document.getElementById('confirmPassword').value= '';
    showToast('Password berhasil diubah.');
  } else {
    errEl.textContent = res.message;
    errEl.classList.remove('hidden');
  }
}

// =============================================
//   Dashboard
// =============================================
async function loadDashboard() {
  const res = await apiFetch(`${ADMIN_API.admin}?action=stats`);
  if (!res.success) { showToast('Gagal memuat data.', true); return; }
  const s = res.data;

  document.getElementById('statRevenue').textContent    = fmt(s.total_revenue);
  document.getElementById('statOrders').textContent     = s.total_orders;
  document.getElementById('statUsers').textContent      = s.total_users;
  document.getElementById('statProducts').textContent   = s.total_products;
  document.getElementById('statPending').textContent    = s.pending_orders;
  document.getElementById('statProcessing').textContent = s.processing;
  document.getElementById('statShipped').textContent    = s.shipped;
  document.getElementById('statDelivered').textContent  = s.delivered;
  document.getElementById('statCancelled').textContent  = s.cancelled;

  if (s.low_stock > 0) {
    const el = document.getElementById('statLowStockBadge');
    el.textContent  = `⚠️ ${s.low_stock} stok rendah`;
    el.className    = 'text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-semibold';
  }

  // Pending badge sidebar
  if (s.pending_orders > 0) {
    const b = document.getElementById('badgePending');
    b.textContent = s.pending_orders;
    b.classList.remove('hidden');
  }

  // Recent orders
  const tbody = document.getElementById('recentOrdersBody');
  if (!s.recent_orders?.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-300 text-sm">Belum ada pesanan</td></tr>';
    return;
  }
  tbody.innerHTML = s.recent_orders.map(o => `
    <tr class="cursor-pointer hover:bg-rose-50 transition-all" onclick="openOrderDetail(${o.id})">
      <td class="px-6 py-3 font-mono text-xs text-rose-600 font-bold">${esc(o.order_code)}</td>
      <td class="px-6 py-3 text-gray-700 text-sm">${esc(o.customer_name)}</td>
      <td class="px-6 py-3 text-gray-400 text-xs">${esc(o.shipping_courier || '—')}</td>
      <td class="px-6 py-3 font-semibold text-gray-900">${fmt(o.total)}</td>
      <td class="px-6 py-3">${statusBadge(o.status)}</td>
      <td class="px-6 py-3 text-gray-400 text-xs">${fmtDate(o.created_at)}</td>
    </tr>
  `).join('');

  document.getElementById('lastUpdated').textContent = 'Update: ' + new Date().toLocaleTimeString('id-ID');

  // ---- Revenue Chart ----
  renderRevenueChart(s.chart || []);
}

let revenueChartInstance = null;

function renderRevenueChart(chartData) {
  const canvas = document.getElementById('revenueChart');
  if (!canvas) return;

  // Isi hari yang kosong dalam 7 hari terakhir
  const days = [];
  const revenues = [];
  const orders = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const found = chartData.find(c => c.day === key);
    days.push(d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }));
    revenues.push(found ? parseInt(found.revenue) : 0);
    orders.push(found ? parseInt(found.orders) : 0);
  }

  if (revenueChartInstance) revenueChartInstance.destroy();

  revenueChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [
        {
          label: 'Pendapatan (Rp)',
          data: revenues,
          backgroundColor: 'rgba(244,63,94,0.15)',
          borderColor: 'rgba(244,63,94,0.8)',
          borderWidth: 2,
          borderRadius: 8,
          yAxisID: 'y',
        },
        {
          label: 'Jumlah Pesanan',
          data: orders,
          type: 'line',
          borderColor: 'rgba(99,102,241,0.8)',
          backgroundColor: 'rgba(99,102,241,0.1)',
          pointBackgroundColor: 'rgba(99,102,241,1)',
          pointRadius: 4,
          tension: 0.4,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 14 } },
        tooltip: {
          callbacks: {
            label: ctx => ctx.dataset.yAxisID === 'y'
              ? `Rp ${Number(ctx.raw).toLocaleString('id-ID')}`
              : `${ctx.raw} pesanan`,
          },
        },
      },
      scales: {
        y : { position: 'left',  ticks: { callback: v => 'Rp ' + (v/1000).toFixed(0) + 'K', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
        y1: { position: 'right', ticks: { stepSize: 1, font: { size: 10 } }, grid: { drawOnChartArea: false } },
        x : { ticks: { font: { size: 10 } } },
      },
    },
  });

  document.getElementById('chartUpdated').textContent = 'Data 7 hari terakhir';
}

// =============================================
//   Orders
// =============================================
async function loadAdminOrders() {
  ordersFilter.status = document.getElementById('orderStatusFilter').value;
  ordersFilter.search = document.getElementById('orderSearch').value;

  const params = new URLSearchParams({ action: 'orders', page: ordersFilter.page });
  if (ordersFilter.status) params.set('status', ordersFilter.status);
  if (ordersFilter.search) params.set('search', ordersFilter.search);

  const res = await apiFetch(`${ADMIN_API.admin}?${params}`);
  if (!res.success) { showToast('Gagal memuat pesanan.', true); return; }

  const orders    = res.data.orders;
  const total     = res.data.total;
  const page      = res.data.page;
  const perPage   = res.data.per_page;

  // Table
  const tbody = document.getElementById('ordersBody');
  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-5 py-10 text-center text-gray-300 text-sm">Tidak ada pesanan</td></tr>';
  } else {
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td class="px-5 py-3 font-mono text-xs text-rose-600 font-bold">${esc(o.order_code)}</td>
        <td class="px-5 py-3 text-gray-700 text-sm">${esc(o.customer_name)}</td>
        <td class="px-5 py-3 text-gray-400 text-xs">${o.shipping_courier ? esc(o.shipping_courier) + ' ' + esc(o.shipping_service) : '—'}</td>
        <td class="px-5 py-3 font-semibold text-gray-900">${fmt(o.total)}</td>
        <td class="px-5 py-3">${statusBadge(o.status)}</td>
        <td class="px-5 py-3 text-gray-400 text-xs">${fmtDate(o.created_at)}</td>
        <td class="px-5 py-3">
          <div class="flex gap-2">
            <button onclick="openOrderDetail(${o.id})"
              class="px-3 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all">
              Detail
            </button>
            <select onchange="updateOrderStatus(${o.id}, this.value); this.value='';"
              class="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-200">
              <option value="">Ubah status</option>
              <option value="pending">⏳ Pending</option>
              <option value="processing">⚙️ Diproses</option>
              <option value="shipped">🚚 Dikirim</option>
              <option value="delivered">✅ Selesai</option>
              <option value="cancelled">❌ Batalkan</option>
            </select>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Pagination
  document.getElementById('ordersPagination').innerHTML = `
    <span class="text-xs">${total} pesanan ditemukan</span>
    <div class="flex gap-2">
      ${page > 1 ? `<button onclick="changePage(${page-1})" class="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs">← Prev</button>` : ''}
      <span class="px-3 py-1 text-xs text-gray-500">Hal ${page} / ${Math.ceil(total/perPage)||1}</span>
      ${total > page * perPage ? `<button onclick="changePage(${page+1})" class="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs">Next →</button>` : ''}
    </div>`;
}

function changePage(p) { ordersFilter.page = p; loadAdminOrders(); }

let filterTimer;
function filterOrders() {
  clearTimeout(filterTimer);
  filterTimer = setTimeout(() => { ordersFilter.page = 1; loadAdminOrders(); }, 300);
}

async function updateOrderStatus(orderId, status) {
  if (!status) return;
  const res = await apiFetch(`${ADMIN_API.admin}?action=order_status`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ order_id: orderId, status }),
  });
  if (res.success) {
    showToast('Status pesanan diperbarui.');
    loadAdminOrders();
    // Refresh dashboard stats juga
    if (currentPage === 'dashboard') loadDashboard();
    else loadDashboard(); // update stats card di background
  }
  else showToast(res.message, true);
}

// Data order yang sedang dibuka (untuk print)
let currentOrderDetail = null;

async function openOrderDetail(id) {
  const res = await apiFetch(`${ADMIN_API.admin}?action=orders&id=${id}`);
  if (!res.success) { showToast('Gagal memuat detail.', true); return; }
  const o = res.data;
  currentOrderDetail = o; // simpan untuk fungsi print

  document.getElementById('orderDetailContent').innerHTML = `
    <div class="space-y-5">
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-gray-50 rounded-xl p-4"><p class="text-xs text-gray-400 mb-1">Kode Pesanan</p><p class="font-mono font-bold text-rose-600">${esc(o.order_code)}</p></div>
        <div class="bg-gray-50 rounded-xl p-4"><p class="text-xs text-gray-400 mb-1">Status</p>${statusBadge(o.status)}</div>
        <div class="bg-gray-50 rounded-xl p-4"><p class="text-xs text-gray-400 mb-1">Pelanggan</p><p class="font-semibold text-sm">${esc(o.customer_name)}</p><p class="text-xs text-gray-400">${esc(o.customer_email)}</p></div>
        <div class="bg-gray-50 rounded-xl p-4"><p class="text-xs text-gray-400 mb-1">Pembayaran</p><p class="text-sm font-semibold capitalize">${esc(o.payment_method)}</p></div>
      </div>
      <div class="bg-blue-50 rounded-xl p-4">
        <p class="text-xs font-bold text-blue-600 mb-2">📦 Alamat Pengiriman</p>
        <p class="text-sm font-semibold">${esc(o.shipping_name)} · ${esc(o.shipping_phone)}</p>
        <p class="text-sm text-gray-600 mt-1">${esc(o.shipping_address)}</p>
        ${o.shipping_courier ? `<p class="text-sm text-blue-600 font-semibold mt-2">🚚 ${esc(o.shipping_courier)} ${esc(o.shipping_service)} <span class="text-gray-400 font-normal text-xs">(${esc(o.shipping_estimate||'')})</span></p>` : ''}
      </div>
      <div>
        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Item Pesanan</p>
        <div class="space-y-2">
          ${o.items.map(i => `
            <div class="flex gap-3 items-center bg-gray-50 rounded-xl p-3">
              <img src="${esc(i.product_image)}" class="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold line-clamp-1">${esc(i.product_name)}</p>
                <p class="text-xs text-gray-400">${esc(i.product_brand)} × ${i.qty}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="text-sm font-bold">${fmt(i.subtotal)}</p>
                <p class="text-xs text-gray-400">${fmt(i.price_at_order)}/pcs</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="border-t pt-4 space-y-1.5">
        <div class="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>${fmt(o.subtotal)}</span></div>
        <div class="flex justify-between text-sm text-gray-500"><span>Ongkir (${esc(o.shipping_courier||'—')})</span><span>${fmt(o.shipping_cost)}</span></div>
        ${o.discount > 0 ? `<div class="flex justify-between text-sm text-emerald-600"><span>Diskon</span><span>- ${fmt(o.discount)}</span></div>` : ''}
        <div class="flex justify-between font-bold text-gray-900 border-t pt-2"><span>Total</span><span class="text-rose-600">${fmt(o.total)}</span></div>
      </div>
      <div class="bg-amber-50 rounded-xl p-4">
        <p class="text-xs font-bold text-amber-700 mb-2">Update Status</p>
        <div class="space-y-3">
          <select id="detailStatusSelect" class="w-full text-sm border border-amber-200 rounded-xl px-3 py-2 bg-white focus:outline-none cursor-pointer"
            onchange="toggleTrackingInput(this.value)">
            <option value="pending"    ${o.status==='pending'?'selected':''}>⏳ Pending</option>
            <option value="processing" ${o.status==='processing'?'selected':''}>⚙️ Diproses</option>
            <option value="shipped"    ${o.status==='shipped'?'selected':''}>🚚 Dikirim</option>
            <option value="delivered"  ${o.status==='delivered'?'selected':''}>✅ Selesai</option>
            <option value="cancelled"  ${o.status==='cancelled'?'selected':''}>❌ Dibatalkan</option>
          </select>
          <div id="trackingNumberWrap" class="${o.status==='shipped' ? '' : 'hidden'}">
            <label class="block text-xs font-semibold text-amber-700 mb-1">Nomor Resi <span class="text-red-400">*</span></label>
            <input id="detailTrackingInput" type="text" placeholder="Contoh: JNE123456789"
              value="${esc(o.tracking_number || '')}"
              class="w-full text-sm border border-amber-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 font-mono tracking-wider uppercase" />
          </div>
          <button onclick="saveOrderStatus(${o.id})"
            class="w-full px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-all">
            <i class="fas fa-save mr-2"></i>Simpan Perubahan
          </button>
        </div>
      </div>
      ${o.payment_proof ? `
      <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
        <p class="text-xs font-bold text-emerald-700 mb-2">📸 Bukti Pembayaran</p>
        <img src="${esc(o.payment_proof)}" alt="Bukti Pembayaran"
          class="w-full max-h-64 object-contain rounded-lg border border-emerald-200 cursor-pointer"
          onclick="window.open('${esc(o.payment_proof)}','_blank')" />
        <p class="text-xs text-emerald-600 mt-2">Klik gambar untuk memperbesar</p>
      </div>` : `
      <div class="bg-gray-50 border border-gray-100 rounded-xl p-4">
        <p class="text-xs text-gray-400 text-center"><i class="fas fa-image mr-1"></i>Belum ada bukti pembayaran</p>
      </div>`}
    </div>`;

  const ov = document.getElementById('orderDetailOverlay');
  ov.classList.remove('hidden');
  ov.classList.add('flex');
}

function closeOrderDetail() {
  const ov = document.getElementById('orderDetailOverlay');
  ov.classList.add('hidden'); ov.classList.remove('flex');
  currentOrderDetail = null;
}

function printReceipt() {
  if (!currentOrderDetail) return;
  const o = currentOrderDetail;

  const printDate = new Date().toLocaleDateString('id-ID', {
    day:'2-digit', month:'long', year:'numeric',
    hour:'2-digit', minute:'2-digit'
  });

  const itemsHTML = (o.items || []).map(i => `
    <tr>
      <td style="padding:6px 0;border-bottom:1px dashed #eee">${i.product_name}<br/><small style="color:#999">${i.product_brand}</small></td>
      <td style="padding:6px 8px;text-align:center;border-bottom:1px dashed #eee">${i.qty}</td>
      <td style="padding:6px 0;text-align:right;border-bottom:1px dashed #eee">Rp ${Number(i.price_at_order).toLocaleString('id-ID')}</td>
      <td style="padding:6px 0 6px 8px;text-align:right;border-bottom:1px dashed #eee;font-weight:600">Rp ${Number(i.subtotal).toLocaleString('id-ID')}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Label Pengiriman — ${o.order_code}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', monospace; font-size: 11px; color: #1a1a1a; background: #fff; }
    .receipt { width: 76mm; margin: 0 auto; padding: 8mm 6mm; }
    .header { text-align: center; margin-bottom: 10px; border-bottom: 2px dashed #f43f5e; padding-bottom: 10px; }
    .header .brand { font-size: 15px; font-weight: 900; color: #f43f5e; letter-spacing: 1px; }
    .header .tagline { font-size: 9px; color: #999; margin-top: 2px; }
    .order-code { text-align: center; font-size: 13px; font-weight: 700; color: #f43f5e; margin: 8px 0; }
    .section { margin: 10px 0; }
    .section-title { font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 5px; border-bottom: 1px solid #f0f0f0; padding-bottom: 3px; }
    .info-row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 10px; }
    .info-row span:first-child { color: #666; min-width: 55px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { font-size: 9px; text-transform: uppercase; color: #999; padding: 3px 0; border-bottom: 2px solid #333; }
    th:last-child, th:nth-child(3), th:nth-child(2) { text-align: right; }
    td { vertical-align: top; }
    .total-section { margin-top: 8px; border-top: 2px dashed #333; padding-top: 6px; }
    .total-row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 11px; }
    .grand-total { font-size: 14px; font-weight: 900; color: #f43f5e; margin-top: 5px; border-top: 1px solid #333; padding-top: 5px; }
    .footer { text-align: center; margin-top: 12px; padding-top: 10px; border-top: 2px dashed #f43f5e; font-size: 9px; color: #999; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 700;
      background: ${o.status==='delivered'?'#dcfce7':o.status==='shipped'?'#ede9fe':o.status==='cancelled'?'#fee2e2':'#fef9c3'};
      color: ${o.status==='delivered'?'#166534':o.status==='shipped'?'#6d28d9':o.status==='cancelled'?'#dc2626':'#854d0e'}; }
    @media print {
      @page { size: 80mm auto; margin: 0; }
      body { margin: 0; }
      .receipt { width: 76mm; padding: 4mm 3mm; }
    }
  </style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <div class="brand">🌸 FIDÉA GLOW & CO</div>
    <div class="tagline">Premium Skincare Store</div>
    <div style="margin-top:6px;font-size:10px;color:#999">${printDate}</div>
  </div>

  <div class="order-code">${o.order_code}</div>

  <div class="section">
    <div class="section-title">Informasi Pelanggan</div>
    <div class="info-row"><span>Nama</span><span><b>${o.customer_name}</b></span></div>
    <div class="info-row"><span>Email</span><span>${o.customer_email}</span></div>
    <div class="info-row"><span>Pembayaran</span><span style="text-transform:capitalize">${o.payment_method}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Pengiriman</div>
    <div class="info-row"><span>Pengirim</span><span><b>Fidéa Glow &amp; Co</b></span></div>
    <div style="font-size:10px;color:#777;margin-bottom:6px">Jl. Raya Puspiptek No. 46, Buaran,<br/>Kec. Pamulang, Kota Tangerang Selatan, Banten<br/>WA: 081511735040 | fideaglow@gmail.com</div>
    <div style="border-top:1px dashed #ddd;padding-top:6px;margin-top:2px">
    <div class="info-row"><span>Penerima</span><span><b>${o.shipping_name}</b></span></div>
    <div class="info-row"><span>Telepon</span><span>${o.shipping_phone}</span></div>
    <div style="margin-top:4px;font-size:11px;color:#555">${o.shipping_address}</div>
    ${o.shipping_courier ? `<div class="info-row" style="margin-top:4px"><span>Kurir</span><span><b>${o.shipping_courier} ${o.shipping_service}</b></span></div>` : ''}
    ${o.tracking_number ? `<div class="info-row"><span>No. Resi</span><span style="font-family:monospace;font-weight:700">${o.tracking_number}</span></div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Item Pesanan</div>
    <table>
      <thead><tr>
        <th style="text-align:left">Produk</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Harga</th>
        <th style="text-align:right">Total</th>
      </tr></thead>
      <tbody>${itemsHTML}</tbody>
    </table>
  </div>

  <div class="total-section">
    <div class="total-row"><span>Subtotal</span><span>Rp ${Number(o.subtotal).toLocaleString('id-ID')}</span></div>
    <div class="total-row"><span>Ongkos Kirim</span><span>Rp ${Number(o.shipping_cost).toLocaleString('id-ID')}</span></div>
    ${o.discount > 0 ? `<div class="total-row" style="color:#16a34a"><span>Diskon</span><span>- Rp ${Number(o.discount).toLocaleString('id-ID')}</span></div>` : ''}
    ${o.promo_code ? `<div class="total-row" style="color:#16a34a;font-size:10px"><span>Kode Promo</span><span>${o.promo_code}</span></div>` : ''}
    <div class="total-row grand-total"><span>TOTAL</span><span>Rp ${Number(o.total).toLocaleString('id-ID')}</span></div>
  </div>

  ${o.notes ? `<div class="section"><div class="section-title">Catatan</div><div style="font-size:11px;color:#555">${o.notes}</div></div>` : ''}

  <div class="footer">
    <p>Terima kasih telah berbelanja!</p>
    <p style="margin-top:4px">✨ Fidéa Glow & Co — Premium Skincare</p>
    ${o.payment_method === 'cod' ? `
    <div style="margin-top:10px;padding:8px;background:#fff9e6;border:1px dashed #f59e0b;border-radius:6px;text-align:left">
      <p style="font-weight:700;color:#92400e;font-size:10px">📌 INSTRUKSI COD UNTUK KURIR:</p>
      <p style="color:#78350f;font-size:10px;margin-top:3px">Setelah paket diterima pembeli, mohon konfirmasi ke toko:</p>
      <p style="font-weight:700;color:#92400e;font-size:11px;margin-top:3px">WA: 081511735040</p>
      <p style="color:#78350f;font-size:10px">Email: fideaglow@gmail.com</p>
    </div>` : ''}
    <p style="margin-top:8px;font-size:9px">Label ini dicetak oleh sistem pada ${printDate}</p>
  </div>
</div>
<script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body></html>`;

  const win = window.open('', '_blank', 'width=360,height=750,scrollbars=yes');
  if (!win) { showToast('Popup diblokir browser. Izinkan popup untuk cetak struk.', true); return; }
  win.document.write(html);
  win.document.close();
}

function toggleTrackingInput(status) {
  const wrap = document.getElementById('trackingNumberWrap');
  if (wrap) wrap.classList.toggle('hidden', status !== 'shipped');
}

async function saveOrderStatus(orderId) {
  const status  = document.getElementById('detailStatusSelect').value;
  const tracking = (document.getElementById('detailTrackingInput')?.value || '').trim().toUpperCase();

  const res = await apiFetch(`${ADMIN_API.admin}?action=order_status`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ order_id: orderId, status, tracking_number: tracking }),
  });

  if (res.success) {
    showToast('Status pesanan diperbarui.');
    closeOrderDetail();
    // Refresh halaman yang sedang aktif + dashboard stats
    if (currentPage === 'orders') loadAdminOrders();
    else if (currentPage === 'dashboard') loadDashboard();
    // Selalu refresh dashboard stats agar kartu status terbaru
    loadDashboard();
  } else {
    showToast(res.message, true);
  }
}

// =============================================
//   Products
// =============================================
async function loadAdminProducts() {
  const search = document.getElementById('productSearch').value;
  const cat    = document.getElementById('productCatFilter').value;
  const params = new URLSearchParams({ action: 'products' });
  if (search) params.set('search', search);
  if (cat)    params.set('category', cat);

  const res = await apiFetch(`${ADMIN_API.admin}?${params}`);
  if (!res.success) { showToast('Gagal memuat produk.', true); return; }

  const tbody = document.getElementById('productsBody');
  if (!res.data.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-5 py-10 text-center text-gray-300 text-sm">Tidak ada produk</td></tr>';
    return;
  }
  tbody.innerHTML = res.data.map(p => `
    <tr>
      <td class="px-5 py-3">
        <div class="flex items-center gap-3">
          <img src="${esc(p.image_url)}" class="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
          <div class="min-w-0">
            <p class="font-semibold text-sm line-clamp-1">${esc(p.name)}</p>
            <p class="text-xs text-gray-400">${esc(p.brand)}</p>
          </div>
        </div>
      </td>
      <td class="px-5 py-3 text-xs text-gray-500 capitalize">${p.category_slug.replace('-',' ')}</td>
      <td class="px-5 py-3 font-semibold text-sm">${fmt(p.price)}</td>
      <td class="px-5 py-3 text-sm ${p.stock < 10 ? 'stock-low' : 'text-gray-700'}">${p.stock}</td>
      <td class="px-5 py-3 text-sm text-amber-500">⭐ ${p.rating}</td>
      <td class="px-5 py-3"><span class="status-badge ${p.is_active ? 'status-delivered':'status-cancelled'}">${p.is_active ? '✅ Aktif':'❌ Nonaktif'}</span></td>
      <td class="px-5 py-3">
        <div class="flex gap-2">
          <button onclick="openProductModal(${p.id})" class="px-3 py-1.5 text-xs rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all">Edit</button>
          <button onclick="toggleProduct(${p.id})" class="px-3 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all">${p.is_active ? 'Nonaktifkan':'Aktifkan'}</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function toggleProduct(id) {
  const res = await apiFetch(`${ADMIN_API.admin}?action=toggle_product`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (res.success) { showToast('Status produk diperbarui.'); loadAdminProducts(); }
  else showToast(res.message, true);
}

let editingProductId = null;

// =============================================
//   Product Image Upload
// =============================================
function switchImageTab(tab) {
  const uploadWrap = document.getElementById('imageUploadWrap');
  const urlWrap    = document.getElementById('imageUrlWrap');
  const tabUpload  = document.getElementById('tabUpload');
  const tabUrl     = document.getElementById('tabUrl');
  if (!uploadWrap) return;

  if (tab === 'upload') {
    uploadWrap.classList.remove('hidden');
    urlWrap.classList.add('hidden');
    tabUpload.className = 'flex-1 py-2 text-xs font-semibold bg-rose-500 text-white transition-all';
    tabUrl.className    = 'flex-1 py-2 text-xs font-semibold bg-white text-gray-500 hover:bg-gray-50 transition-all';
  } else {
    uploadWrap.classList.add('hidden');
    urlWrap.classList.remove('hidden');
    tabUpload.className = 'flex-1 py-2 text-xs font-semibold bg-white text-gray-500 hover:bg-gray-50 transition-all';
    tabUrl.className    = 'flex-1 py-2 text-xs font-semibold bg-rose-500 text-white transition-all';
  }
}

function previewImageFromUrl(url) {
  const preview    = document.getElementById('pImagePreview');
  const previewImg = document.getElementById('pImagePreviewImg');
  const finalInput = document.getElementById('pImageFinal');
  if (!url) {
    preview.classList.add('hidden');
    if (finalInput) finalInput.value = '';
    return;
  }
  if (previewImg) previewImg.src = url;
  preview.classList.remove('hidden');
  if (finalInput) finalInput.value = url;
}

async function handleProductImageUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const dropZone  = document.getElementById('imageDropZone');
  const preview   = document.getElementById('pImagePreview');
  const previewImg= document.getElementById('pImagePreviewImg');
  const finalInput= document.getElementById('pImageFinal');

  // Validasi sisi client
  if (file.size > 5 * 1024 * 1024) {
    showToast('Ukuran gambar maksimal 5MB', true);
    input.value = '';
    return;
  }

  // Tampilkan loading di drop zone
  dropZone.innerHTML = `
    <i class="fas fa-spinner fa-spin text-rose-400 text-2xl mb-2 block"></i>
    <p class="text-xs font-semibold text-gray-600">Mengupload gambar...</p>`;

  // Upload ke server
  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch('backend/api/upload.php', {
      method     : 'POST',
      credentials: 'include',
      body       : formData,
    });
    const data = await res.json();

    if (data.success) {
      // Preview
      if (previewImg) previewImg.src = data.data.url;
      preview.classList.remove('hidden');
      if (finalInput) finalInput.value = data.data.url;

      // Update drop zone jadi sukses
      dropZone.innerHTML = `
        <i class="fas fa-check-circle text-green-500 text-2xl mb-2 block"></i>
        <p class="text-xs font-semibold text-gray-600">${file.name}</p>
        <p class="text-xs text-green-500 mt-1">Upload berhasil! Klik untuk ganti</p>`;
      showToast('Gambar berhasil diupload.');
    } else {
      showToast(data.message || 'Upload gagal.', true);
      dropZone.innerHTML = `
        <i class="fas fa-cloud-upload-alt text-rose-400 text-2xl mb-2 block"></i>
        <p class="text-xs font-semibold text-gray-600">Klik untuk pilih gambar</p>
        <p class="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — Maks. 5MB</p>`;
    }
  } catch {
    showToast('Koneksi gagal saat upload.', true);
    dropZone.innerHTML = `
      <i class="fas fa-cloud-upload-alt text-rose-400 text-2xl mb-2 block"></i>
      <p class="text-xs font-semibold text-gray-600">Klik untuk pilih gambar</p>
      <p class="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — Maks. 5MB</p>`;
  }
}

function resetImageUploadUI() {
  const dropZone   = document.getElementById('imageDropZone');
  const preview    = document.getElementById('pImagePreview');
  const fileInput  = document.getElementById('pImageFile');
  const urlInput   = document.getElementById('pImage');
  const finalInput = document.getElementById('pImageFinal');

  if (dropZone) dropZone.innerHTML = `
    <i class="fas fa-cloud-upload-alt text-rose-400 text-2xl mb-2 block"></i>
    <p class="text-xs font-semibold text-gray-600">Klik untuk pilih gambar</p>
    <p class="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — Maks. 5MB</p>`;
  if (preview)    preview.classList.add('hidden');
  if (fileInput)  fileInput.value  = '';
  if (urlInput)   urlInput.value   = '';
  if (finalInput) finalInput.value = '';
  switchImageTab('upload');
}

async function openProductModal(id = null) {
  editingProductId = id;
  document.getElementById('productForm').reset();
  document.getElementById('productFormError').classList.add('hidden');

  if (id) {
    document.getElementById('productModalTitle').textContent  = 'Edit Produk';
    document.getElementById('productSubmitLabel').textContent = 'Perbarui';
    document.getElementById('productId').value = id;
    const res = await apiFetch(`${ADMIN_API.products}?id=${id}`);
    if (res.success) {
      const p = res.data;
      document.getElementById('pName').value          = p.name;
      document.getElementById('pBrand').value         = p.brand;
      document.getElementById('pCategory').value      = p.category;
      document.getElementById('pPrice').value         = p.price;
      document.getElementById('pOriginalPrice').value = p.original_price;
      document.getElementById('pStock').value         = p.stock;
      document.getElementById('pBadge').value         = p.badge || '';
      document.getElementById('pImage').value         = p.image;
      document.getElementById('pDescription').value   = p.description;
      document.getElementById('pSkinType').value      = p.skin_type;
      document.getElementById('pIngredients').value   = p.key_ingredients;
    }
  } else {
    document.getElementById('productModalTitle').textContent  = 'Tambah Produk';
    document.getElementById('productSubmitLabel').textContent = 'Simpan';
    document.getElementById('productId').value = '';
  }

  const ov = document.getElementById('productModalOverlay');
  ov.classList.remove('hidden'); ov.classList.add('flex');
}

function closeProductModal() {
  const ov = document.getElementById('productModalOverlay');
  ov.classList.add('hidden'); ov.classList.remove('flex');
}

async function submitProduct(e) {
  e.preventDefault();
  const errEl = document.getElementById('productFormError');
  errEl.classList.add('hidden');

  const isEdit = !!editingProductId;
  const data   = {
    name           : document.getElementById('pName').value.trim(),
    brand          : document.getElementById('pBrand').value.trim(),
    category_slug  : document.getElementById('pCategory').value,
    price          : parseInt(document.getElementById('pPrice').value),
    original_price : parseInt(document.getElementById('pOriginalPrice').value),
    stock          : parseInt(document.getElementById('pStock').value),
    badge          : document.getElementById('pBadge').value || null,
    image_url      : document.getElementById('pImage').value.trim(),
    description    : document.getElementById('pDescription').value.trim(),
    skin_type      : document.getElementById('pSkinType').value.trim(),
    key_ingredients: document.getElementById('pIngredients').value.trim(),
  };
  if (isEdit) data.id = editingProductId;

  const res = await apiFetch(`${ADMIN_API.admin}?action=${isEdit ? 'edit_product' : 'add_product'}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });

  if (res.success) { showToast(isEdit ? 'Produk diperbarui.' : 'Produk ditambahkan.'); closeProductModal(); loadAdminProducts(); }
  else { errEl.textContent = res.message; errEl.classList.remove('hidden'); }
}

// =============================================
//   Users
// =============================================
async function loadAdminUsers() {
  const search = document.getElementById('userSearch').value;
  const params = new URLSearchParams({ action: 'users' });
  if (search) params.set('search', search);

  const res = await apiFetch(`${ADMIN_API.admin}?${params}`);
  if (!res.success) { showToast('Gagal memuat data.', true); return; }

  const tbody = document.getElementById('usersBody');
  if (!res.data.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-5 py-10 text-center text-gray-300 text-sm">Belum ada pelanggan</td></tr>';
    return;
  }
  tbody.innerHTML = res.data.map(u => `
    <tr>
      <td class="px-5 py-3">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-rose-100 text-rose-500 font-bold text-sm flex items-center justify-center flex-shrink-0">
            ${esc(u.name.charAt(0).toUpperCase())}
          </div>
          <span class="font-semibold text-sm">${esc(u.name)}</span>
        </div>
      </td>
      <td class="px-5 py-3 text-sm text-gray-500">${esc(u.email)}</td>
      <td class="px-5 py-3 text-sm text-center">${u.total_orders}</td>
      <td class="px-5 py-3 font-semibold text-sm">${fmt(u.total_spent)}</td>
      <td class="px-5 py-3 text-xs text-gray-400">${fmtDate(u.created_at)}</td>
      <td class="px-5 py-3"><span class="status-badge ${u.is_active ? 'status-delivered':'status-cancelled'}">${u.is_active ? '✅ Aktif':'❌ Nonaktif'}</span></td>
      <td class="px-5 py-3">
        <button onclick="toggleUser(${u.id})"
          class="px-3 py-1.5 text-xs rounded-lg ${u.is_active ? 'bg-red-50 hover:bg-red-100 text-red-500':'bg-green-50 hover:bg-green-100 text-green-600'} transition-all">
          ${u.is_active ? 'Nonaktifkan':'Aktifkan'}
        </button>
      </td>
    </tr>
  `).join('');
}

async function toggleUser(id) {
  const res = await apiFetch(`${ADMIN_API.admin}?action=toggle_user`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
  });
  if (res.success) { showToast('Status user diperbarui.'); loadAdminUsers(); }
  else showToast(res.message, true);
}

// =============================================
//   Shipping Management
// =============================================
let editingShippingId = null;

async function loadShipping() {
  const res = await apiFetch(`${ADMIN_API.shipping}?all=1`);
  if (!res.success) { showToast('Gagal memuat kurir.', true); return; }

  const tbody = document.getElementById('shippingBody');
  if (!res.data.shipping_methods.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-5 py-10 text-center text-gray-300 text-sm">Belum ada kurir</td></tr>';
    return;
  }
  tbody.innerHTML = res.data.shipping_methods.map(s => `
    <tr>
      <td class="px-5 py-3 font-bold text-sm text-gray-800">${esc(s.courier)}</td>
      <td class="px-5 py-3 text-sm text-rose-600 font-semibold">${esc(s.service)}</td>
      <td class="px-5 py-3 text-sm text-gray-500">${esc(s.description)}</td>
      <td class="px-5 py-3 text-sm text-gray-500"><i class="fas fa-clock text-gray-300 mr-1"></i>${esc(s.estimated_days)}</td>
      <td class="px-5 py-3 font-bold text-sm">${fmt(s.price)}</td>
      <td class="px-5 py-3"><span class="status-badge ${s.is_active ? 'status-delivered':'status-cancelled'}">${s.is_active ? '✅ Aktif':'❌ Nonaktif'}</span></td>
      <td class="px-5 py-3">
        <div class="flex gap-2">
          <button onclick="openShippingModal(${s.id})" class="px-3 py-1.5 text-xs rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all">Edit</button>
          <button onclick="toggleShipping(${s.id})" class="px-3 py-1.5 text-xs rounded-lg ${s.is_active ? 'bg-gray-100 hover:bg-gray-200 text-gray-600':'bg-green-50 hover:bg-green-100 text-green-600'} transition-all">
            ${s.is_active ? 'Nonaktifkan':'Aktifkan'}
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function openShippingModal(id = null) {
  editingShippingId = id;
  document.getElementById('shippingForm').reset();
  document.getElementById('shippingFormError').classList.add('hidden');

  if (id) {
    document.getElementById('shippingModalTitle').textContent  = 'Edit Kurir';
    document.getElementById('shippingSubmitLabel').textContent = 'Perbarui';
    document.getElementById('shippingId').value = id;

    // Load data dari list yang sudah ada (atau fetch ulang)
    const res = await apiFetch(`${ADMIN_API.shipping}?all=1`);
    if (res.success) {
      const s = res.data.shipping_methods.find(x => x.id === id);
      if (s) {
        document.getElementById('sCourier').value     = s.courier;
        document.getElementById('sService').value     = s.service;
        document.getElementById('sDescription').value = s.description;
        document.getElementById('sEstimate').value    = s.estimated_days;
        document.getElementById('sPrice').value       = s.price;
      }
    }
  } else {
    document.getElementById('shippingModalTitle').textContent  = 'Tambah Kurir';
    document.getElementById('shippingSubmitLabel').textContent = 'Simpan';
    document.getElementById('shippingId').value = '';
  }

  const ov = document.getElementById('shippingModalOverlay');
  ov.classList.remove('hidden'); ov.classList.add('flex');
}

function closeShippingModal() {
  const ov = document.getElementById('shippingModalOverlay');
  ov.classList.add('hidden'); ov.classList.remove('flex');
}

async function submitShipping(e) {
  e.preventDefault();
  const errEl  = document.getElementById('shippingFormError');
  errEl.classList.add('hidden');

  const isEdit = !!editingShippingId;
  const data   = {
    courier      : document.getElementById('sCourier').value.trim(),
    service      : document.getElementById('sService').value.trim(),
    description  : document.getElementById('sDescription').value.trim(),
    estimated_days: document.getElementById('sEstimate').value.trim(),
    price        : parseInt(document.getElementById('sPrice').value),
  };
  if (isEdit) data.id = editingShippingId;

  const res = await apiFetch(`${ADMIN_API.shipping}?action=${isEdit ? 'edit' : 'add'}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });

  if (res.success) { showToast(isEdit ? 'Kurir diperbarui.' : 'Kurir ditambahkan.'); closeShippingModal(); loadShipping(); }
  else { errEl.textContent = res.message; errEl.classList.remove('hidden'); }
}

async function toggleShipping(id) {
  const res = await apiFetch(`${ADMIN_API.shipping}?action=toggle`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
  });
  if (res.success) { showToast('Status kurir diperbarui.'); loadShipping(); }
  else showToast(res.message, true);
}

// =============================================
//   Promo Code Management
// =============================================
let editingPromoId = null;

async function loadAdminPromos() {
  const res = await apiFetch(`${ADMIN_API.admin}?action=promos`);
  if (!res.success) { showToast('Gagal memuat promo.', true); return; }

  const tbody = document.getElementById('promosBody');
  if (!res.data.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="px-5 py-10 text-center text-gray-300 text-sm">Belum ada promo code</td></tr>';
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  tbody.innerHTML = res.data.map(p => {
    const isExpired = p.expires_at && p.expires_at < today;
    const usageLabel = p.max_uses ? `${p.used_count} / ${p.max_uses}` : `${p.used_count} / ∞`;
    const expiryLabel = p.expires_at
      ? `<span class="${isExpired ? 'text-red-500' : 'text-gray-500'}">${p.expires_at}</span>`
      : '<span class="text-gray-300">—</span>';
    const valueLabel = p.discount_type === 'percent'
      ? `<span class="font-bold text-emerald-600">${p.discount_value}%</span>`
      : `<span class="font-bold text-emerald-600">${fmt(p.discount_value)}</span>`;
    return `
    <tr>
      <td class="px-5 py-3 font-mono font-bold text-rose-600 tracking-widest text-sm">${esc(p.code)}</td>
      <td class="px-5 py-3 text-xs text-gray-500 capitalize">${p.discount_type === 'percent' ? 'Persen' : 'Nominal'}</td>
      <td class="px-5 py-3 text-sm">${valueLabel}</td>
      <td class="px-5 py-3 text-sm text-gray-500">${fmt(p.min_purchase)}</td>
      <td class="px-5 py-3 text-sm text-gray-500">${usageLabel}</td>
      <td class="px-5 py-3 text-xs">${expiryLabel}</td>
      <td class="px-5 py-3">
        <span class="status-badge ${p.is_active && !isExpired ? 'status-delivered' : 'status-cancelled'}">
          ${p.is_active && !isExpired ? '✅ Aktif' : isExpired ? '⏰ Kadaluarsa' : '❌ Nonaktif'}
        </span>
      </td>
      <td class="px-5 py-3">
        <div class="flex gap-2">
          <button onclick="openPromoModal(${p.id})" class="px-3 py-1.5 text-xs rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all">Edit</button>
          <button onclick="togglePromo(${p.id})" class="px-3 py-1.5 text-xs rounded-lg ${p.is_active ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' : 'bg-green-50 hover:bg-green-100 text-green-600'} transition-all">
            ${p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

async function openPromoModal(id = null) {
  editingPromoId = id;
  document.getElementById('promoForm').reset();
  document.getElementById('promoFormError').classList.add('hidden');
  updatePromoValueLabel();

  if (id) {
    document.getElementById('promoModalTitle').textContent  = 'Edit Promo Code';
    document.getElementById('promoSubmitLabel').textContent = 'Perbarui';
    document.getElementById('promoId').value = id;

    const res = await apiFetch(`${ADMIN_API.admin}?action=promos`);
    if (res.success) {
      const p = res.data.find(x => x.id === id);
      if (p) {
        document.getElementById('promoCode').value        = p.code;
        document.getElementById('promoType').value        = p.discount_type;
        document.getElementById('promoValue').value       = p.discount_value;
        document.getElementById('promoMinPurchase').value = p.min_purchase;
        document.getElementById('promoMaxUses').value     = p.max_uses ?? '';
        document.getElementById('promoExpiry').value      = p.expires_at ?? '';
        updatePromoValueLabel();
      }
    }
  } else {
    document.getElementById('promoModalTitle').textContent  = 'Tambah Promo Code';
    document.getElementById('promoSubmitLabel').textContent = 'Simpan';
    document.getElementById('promoId').value = '';
  }

  const ov = document.getElementById('promoModalOverlay');
  ov.classList.remove('hidden'); ov.classList.add('flex');
}

function closePromoModal() {
  document.getElementById('promoModalOverlay').classList.add('hidden');
  document.getElementById('promoModalOverlay').classList.remove('flex');
}

function updatePromoValueLabel() {
  const type = document.getElementById('promoType')?.value;
  const label = document.getElementById('promoValueLabel');
  if (label) label.textContent = type === 'percent' ? 'Nilai Diskon (%)' : 'Nilai Diskon (Rp)';
}

async function submitPromo(e) {
  e.preventDefault();
  const errEl  = document.getElementById('promoFormError');
  errEl.classList.add('hidden');

  const isEdit = !!editingPromoId;
  const data   = {
    code           : document.getElementById('promoCode').value.trim().toUpperCase(),
    discount_type  : document.getElementById('promoType').value,
    discount_value : parseInt(document.getElementById('promoValue').value),
    min_purchase   : parseInt(document.getElementById('promoMinPurchase').value) || 0,
    max_uses       : document.getElementById('promoMaxUses').value || '',
    expires_at     : document.getElementById('promoExpiry').value || '',
  };
  if (isEdit) data.id = editingPromoId;

  const res = await apiFetch(`${ADMIN_API.admin}?action=${isEdit ? 'edit_promo' : 'add_promo'}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });

  if (res.success) {
    showToast(isEdit ? 'Promo diperbarui.' : 'Promo ditambahkan.');
    closePromoModal();
    loadAdminPromos();
  } else {
    errEl.textContent = res.message;
    errEl.classList.remove('hidden');
  }
}

async function togglePromo(id) {
  const res = await apiFetch(`${ADMIN_API.admin}?action=toggle_promo`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
  });
  if (res.success) { showToast('Status promo diperbarui.'); loadAdminPromos(); }
  else showToast(res.message, true);
}

// =============================================
//   Close modals & keyboard
// =============================================
['orderDetailOverlay','productModalOverlay','shippingModalOverlay','promoModalOverlay'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', e => {
    if (e.target.id === id) {
      document.getElementById(id).classList.add('hidden');
      document.getElementById(id).classList.remove('flex');
    }
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeOrderDetail();
    closeProductModal();
    closeShippingModal();
    closePromoModal();
  }
});

// =============================================
//   Init — langsung load dashboard
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  if (typeof ADMIN_SESSION !== 'undefined') {
    document.getElementById('adminName')?.textContent && (document.getElementById('adminName').textContent = ADMIN_SESSION.name || 'Admin');
  }
  loadDashboard();
});
