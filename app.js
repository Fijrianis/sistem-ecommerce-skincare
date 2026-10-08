// =============================================
//   Fidéa Glow & Co App Logic — with PHP Backend
// =============================================

const API = {
  products : 'backend/api/products.php',
  auth     : 'backend/api/auth.php',
  cart     : 'backend/api/cart.php',
  wishlist : 'backend/api/wishlist.php',
  orders   : 'backend/api/orders.php',
  shipping : 'backend/api/shipping.php',
  reviews  : 'backend/api/reviews.php',
};

// ---- State ----
let products    = [];
let cart        = [];         // [{ product_id, qty, name, brand, image, price, original_price }]
let wishlistIds = new Set();  // Set of product_id (int)
let currentUser = null;       // null = guest
let selectedCartIds = new Set(); // Set product_id yang dipilih untuk checkout

let activeFilter = 'all';
let searchQuery  = '';
let sortMode     = 'default';

// =============================================
//   Utility
// =============================================
function formatPrice(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = '';
  for (let i = 0; i < 5; i++) {
    if (i < full)              html += '<i class="fas fa-star text-amber-400 text-xs"></i>';
    else if (i === full && half) html += '<i class="fas fa-star-half-alt text-amber-400 text-xs"></i>';
    else                       html += '<i class="far fa-star text-gray-200 text-xs"></i>';
  }
  return html;
}

function badgeHTML(badge) {
  if (!badge) return '';
  const map = { new: ['badge-new','NEW'], hot: ['badge-hot','🔥 HOT'], sale: ['badge-sale','SALE'], bestseller: ['badge-bestseller','⭐ BEST'] };
  const [cls, label] = map[badge] || ['',''];
  return `<span class="product-badge ${cls}">${label}</span>`;
}

async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(url, { credentials: 'include', ...options });
    return await res.json();
  } catch {
    return { success: false, message: 'Koneksi ke server gagal.' };
  }
}

// =============================================
//   Auth
// =============================================

// Helper: fetch voucher terbaru dan render di dropdown
async function fetchAndRenderVoucher() {
  if (!currentUser || currentUser.role === 'admin') return;
  const res = await apiFetch(`${API.auth}?action=me`);
  if (res.success && res.data?.voucher) {
    renderVoucherBadge(res.data.voucher);
  } else {
    // Hapus badge lama jika voucher sudah tidak ada
    document.getElementById('voucherBadgeItem')?.remove();
  }
}

async function checkAuth() {
  const res = await apiFetch(`${API.auth}?action=me`);
  if (res.success && res.data?.logged_in) {
    currentUser = res.data.user;
    await Promise.all([loadCart(), loadWishlist()]);
    if (res.data.voucher) {
      renderVoucherBadge(res.data.voucher);
    }
  }
  renderAuthUI();
}

function renderAuthUI() {
  const authBtn   = document.getElementById('authBtn');
  const userMenu  = document.getElementById('userMenu');
  const userName  = document.getElementById('userName');
  const adminLink = document.getElementById('adminPanelLink');

  if (currentUser) {
    // Sembunyikan tombol Login
    if (authBtn)  authBtn.style.display  = 'none';
    // Tampilkan user menu
    if (userMenu) userMenu.style.display = 'block';
    if (userName) userName.textContent   = currentUser.name.split(' ')[0];

    const isAdmin = currentUser.role === 'admin';

    // Admin Panel link
    if (adminLink) {
      adminLink.style.display = isAdmin ? 'flex' : 'none';
    }

    // Sembunyikan cart icon untuk admin
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) cartBtn.style.display = isAdmin ? 'none' : '';

    // Sembunyikan menu Pesanan, Wishlist, Voucher untuk admin
    const menuPesanan  = document.getElementById('menuPesanan');
    const menuWishlist = document.getElementById('menuWishlist');
    const menuVoucher  = document.getElementById('voucherBadgeItem');
    const menuProfil   = document.getElementById('menuProfil');

    if (menuPesanan)  menuPesanan.style.display  = isAdmin ? 'none' : '';
    if (menuWishlist) menuWishlist.style.display = isAdmin ? 'none' : '';
    if (menuVoucher)  menuVoucher.style.display  = isAdmin ? 'none' : '';

    // Sembunyikan banner promo pendaftaran
    const banner = document.getElementById('promoBanner');
    if (banner) banner.style.display = isAdmin ? 'none' : (currentUser ? 'none' : '');

  } else {
    if (authBtn)  authBtn.style.display  = window.innerWidth >= 768 ? 'flex' : 'none';
    if (userMenu) userMenu.style.display = 'none';
    if (adminLink) adminLink.style.display = 'none';

    // Tampilkan kembali cart icon
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) cartBtn.style.display = '';

    // Tampilkan kembali banner promo
    const banner = document.getElementById('promoBanner');
    if (banner) banner.style.display = '';

    cart = [];
    wishlistIds = new Set();
    updateCartUI();
  }
}

async function logout() {
  await apiFetch(`${API.auth}?action=logout`, { method: 'POST' });
  currentUser = null;
  cart = [];
  wishlistIds = new Set();
  selectedCartIds = new Set();
  // Bersihkan voucher badge dari DOM agar tidak muncul saat login akun lain
  document.getElementById('voucherBadgeItem')?.remove();
  renderAuthUI();
  renderProducts();
  showToast('Sampai jumpa! 👋');
  closeUserDropdown();
}

function closeUserDropdown() {
  document.getElementById('userDropdown')?.classList.add('hidden');
}

// =============================================
//   Products
// =============================================
let currentProductPage = 1;
let totalProducts      = 0;
const PRODUCTS_PER_PAGE = 20;

async function loadProducts(page = null) {
  if (page !== null) currentProductPage = page;

  const params = new URLSearchParams({
    sort    : sortMode,
    page    : currentProductPage,
    per_page: PRODUCTS_PER_PAGE,
  });
  if (activeFilter !== 'all') params.set('category', activeFilter);
  if (searchQuery)            params.set('search', searchQuery);

  const res = await apiFetch(`${API.products}?${params}`);
  if (!res.success) { showToast('Gagal memuat produk.'); return; }

  products      = res.data.products;
  totalProducts = res.data.total;
  const totalPages = res.data.total_pages;

  document.getElementById('productCount').textContent = totalProducts;
  renderProducts();
  renderProductPagination(currentProductPage, totalPages);
  // Scroll ke section produk saat ganti halaman
  if (page !== null) {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderProductPagination(page, totalPages) {
  const container = document.getElementById('productPagination');
  if (!container) return;
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  const btnBase   = 'px-4 py-2 rounded-full text-sm font-semibold transition-all';
  const btnActive = `${btnBase} bg-rose-500 text-white shadow-md`;
  const btnInactive = `${btnBase} bg-white text-gray-600 border border-rose-200 hover:bg-rose-50`;

  let pages = '';
  // Selalu tampilkan halaman 1, halaman terakhir, dan ±2 dari halaman aktif
  const range = new Set([1, totalPages]);
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) range.add(i);
  const sorted = [...range].sort((a, b) => a - b);

  let prev = null;
  for (const p of sorted) {
    if (prev && p - prev > 1) pages += `<span class="px-2 text-gray-300 self-center">…</span>`;
    pages += `<button onclick="loadProducts(${p})" class="${p === page ? btnActive : btnInactive}">${p}</button>`;
    prev = p;
  }

  container.innerHTML = `
    <button onclick="loadProducts(${page - 1})" ${page <= 1 ? 'disabled' : ''}
      class="${btnInactive} ${page <= 1 ? 'opacity-40 cursor-not-allowed' : ''}">
      <i class="fas fa-chevron-left text-xs"></i>
    </button>
    ${pages}
    <button onclick="loadProducts(${page + 1})" ${page >= totalPages ? 'disabled' : ''}
      class="${btnInactive} ${page >= totalPages ? 'opacity-40 cursor-not-allowed' : ''}">
      <i class="fas fa-chevron-right text-xs"></i>
    </button>`;
}

function renderProducts() {
  const grid      = document.getElementById('productGrid');
  const noResults = document.getElementById('noResults');

  if (products.length === 0) {
    grid.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }
  noResults.classList.add('hidden');

  const discount = p => Math.round((1 - p.price / p.original_price) * 100);

  grid.innerHTML = products.map(p => `
    <div class="product-card fade-in" data-id="${p.id}" onclick="openModal(${p.id})">
      <div class="product-card-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        ${badgeHTML(p.badge)}
        <button class="wishlist-btn ${wishlistIds.has(p.id) ? 'active' : ''}"
          onclick="toggleWishlist(event, ${p.id})" title="Wishlist">
          <i class="${wishlistIds.has(p.id) ? 'fas' : 'far'} fa-heart text-rose-400 text-xs"></i>
        </button>
        <div class="product-card-overlay">
          <button class="quick-view-btn" onclick="openModal(${p.id}); event.stopPropagation()">
            <i class="fas fa-eye mr-1"></i> Quick View
          </button>
        </div>
      </div>
      <div class="product-card-body">
        <p class="text-gray-400 text-xs mb-0.5">${p.brand}</p>
        <h3 class="font-semibold text-gray-800 text-xs md:text-sm leading-snug line-clamp-2 mb-1.5">${p.name}</h3>
        <div class="flex items-center gap-1 mb-2">
          ${renderStars(p.rating)}
          <span class="text-gray-400 text-xs ml-1">(${Number(p.reviews).toLocaleString()})</span>
        </div>
        <div class="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span class="font-bold text-rose-600 text-sm">${formatPrice(p.price)}</span>
          <span class="text-gray-300 text-xs line-through">${formatPrice(p.original_price)}</span>
          <span class="text-xs font-semibold text-emerald-500">-${discount(p)}%</span>
        </div>
        <button class="add-cart-btn" onclick="addToCart(event, ${p.id})">
          <i class="fas fa-shopping-bag text-xs"></i> Tambah
        </button>
      </div>
    </div>
  `).join('');

  requestAnimationFrame(() => {
    document.querySelectorAll('.fade-in').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 40);
    });
  });
}

// =============================================
//   Cart
// =============================================
async function loadCart() {
  if (!currentUser) return;
  const res = await apiFetch(API.cart);
  if (res.success) {
    cart = res.data.items;
    updateCartUI();
  }
}

function updateCartUI() {
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById('cartCount').textContent = totalQty;

  const footerEl = document.getElementById('cartFooter');
  const itemsEl  = document.getElementById('cartItems');

  if (cart.length === 0) {
    footerEl.classList.add('hidden');
    selectedCartIds = new Set();
    itemsEl.innerHTML = `
      <div class="text-center py-16">
        <div class="text-6xl mb-4">🛍️</div>
        <p class="text-gray-400 text-sm font-medium">Keranjangmu masih kosong</p>
        <p class="text-gray-300 text-xs mt-1">Yuk tambahkan produk favoritmu!</p>
      </div>`;
    return;
  }

  // Pastikan item baru otomatis tercentang
  cart.forEach(item => selectedCartIds.add(item.product_id));

  footerEl.classList.remove('hidden');
  itemsEl.innerHTML = cart.map(item => {
    const checked = selectedCartIds.has(item.product_id);
    return `
    <div class="cart-item ${checked ? '' : 'opacity-50'}">
      <!-- Checkbox -->
      <input type="checkbox" ${checked ? 'checked' : ''}
        onchange="toggleCartItem(${item.product_id}, this.checked)"
        class="w-4 h-4 rounded accent-rose-500 cursor-pointer flex-shrink-0 mr-1" />
      <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
      <div class="flex-1 min-w-0">
        <p class="text-xs text-gray-400">${item.brand}</p>
        <p class="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">${item.name}</p>
        <p class="text-rose-600 font-bold text-sm mt-1">${formatPrice(item.price)}</p>
      </div>
      <div class="flex flex-col items-center gap-2 ml-2">
        <div class="flex items-center gap-1 bg-white rounded-full border border-rose-100 px-1">
          <button onclick="changeQty(${item.product_id}, -1)" class="w-6 h-6 flex items-center justify-center text-rose-400 hover:text-rose-600 font-bold text-lg">−</button>
          <span class="text-sm font-semibold text-gray-700 w-5 text-center">${item.qty}</span>
          <button onclick="changeQty(${item.product_id}, 1)" class="w-6 h-6 flex items-center justify-center text-rose-400 hover:text-rose-600 font-bold text-lg">+</button>
        </div>
        <button onclick="removeFromCart(${item.product_id})" class="text-gray-300 hover:text-red-400 transition-colors text-xs">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>`;
  }).join('');

  updateCartTotal();
}

function toggleCartItem(productId, checked) {
  if (checked) selectedCartIds.add(productId);
  else         selectedCartIds.delete(productId);
  updateCartTotal();

  // Update opacity item
  const items = document.querySelectorAll('.cart-item');
  items.forEach(el => {
    const cb = el.querySelector('input[type=checkbox]');
    if (cb) el.classList.toggle('opacity-50', !cb.checked);
  });

  // Sync "pilih semua" checkbox
  const allCb = document.getElementById('selectAllCart');
  if (allCb) allCb.checked = selectedCartIds.size === cart.length;
}

function toggleSelectAll(checked) {
  if (checked) cart.forEach(item => selectedCartIds.add(item.product_id));
  else         selectedCartIds.clear();

  // Re-render untuk update semua checkbox & opacity
  updateCartUI();

  // Kembalikan state checkbox selectAll karena updateCartUI reset semua ke checked
  if (!checked) {
    selectedCartIds.clear();
    // Uncheck semua item checkbox
    document.querySelectorAll('.cart-item input[type=checkbox]').forEach(cb => {
      cb.checked = false;
      cb.closest('.cart-item').classList.add('opacity-50');
    });
    const allCb = document.getElementById('selectAllCart');
    if (allCb) allCb.checked = false;
    updateCartTotal();
  }
}

function updateCartTotal() {
  const selected = cart.filter(c => selectedCartIds.has(c.product_id));
  const total    = selected.reduce((s, c) => s + c.price * c.qty, 0);
  const count    = selected.length;

  document.getElementById('cartTotal').textContent = formatPrice(total);

  const countEl = document.getElementById('selectedCount');
  if (countEl) countEl.textContent = count > 0 ? `${count} item dipilih` : '';

  // Update selectAll checkbox
  const allCb = document.getElementById('selectAllCart');
  if (allCb && cart.length > 0) allCb.checked = selectedCartIds.size === cart.length;
}

async function addToCart(e, productId) {
  e.stopPropagation();
  if (!currentUser) { openAuthModal('login'); showToast('Login dulu untuk menambah ke keranjang 🔐'); return; }

  const res = await apiFetch(API.cart, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ product_id: productId, qty: 1 }),
  });

  if (res.success) {
    cart = res.data.items;
    updateCartUI();
    const p = products.find(x => x.id === productId);
    showToast(`${(p?.name || 'Produk').substring(0, 25)}... ditambahkan! 🛍️`);
  } else {
    showToast(res.message);
  }
}

async function changeQty(productId, delta) {
  const item   = cart.find(c => c.product_id === productId);
  if (!item) return;
  const newQty = item.qty + delta;

  const res = await apiFetch(API.cart, {
    method : 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ product_id: productId, qty: newQty }),
  });
  if (res.success) { cart = res.data.items; updateCartUI(); }
  else showToast(res.message);
}

async function removeFromCart(productId) {
  const res = await apiFetch(API.cart, {
    method : 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ product_id: productId }),
  });
  if (res.success) { cart = res.data.items; updateCartUI(); showToast('Produk dihapus dari keranjang'); }
}

// =============================================
//   Wishlist
// =============================================
async function loadWishlist() {
  if (!currentUser) return;
  const res = await apiFetch(`${API.wishlist}?ids_only=1`);
  if (res.success) {
    wishlistIds = new Set(res.data.ids.map(Number));
  }
}

async function toggleWishlist(e, productId) {
  e.stopPropagation();
  if (!currentUser) { openAuthModal('login'); showToast('Login dulu untuk menyimpan wishlist 🔐'); return; }

  const res = await apiFetch(API.wishlist, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ product_id: productId }),
  });

  if (res.success) {
    wishlistIds = new Set(res.data.wishlist_ids.map(Number));
    renderProducts();
    showToast(res.message);
    // Update ikon wishlist di modal detail jika sedang terbuka
    const modalWishBtn = document.querySelector('#modalBox .wishlist-btn');
    if (modalWishBtn) {
      const isWished = wishlistIds.has(productId);
      modalWishBtn.classList.toggle('active', isWished);
      modalWishBtn.classList.toggle('bg-rose-50', isWished);
      const icon = modalWishBtn.querySelector('i');
      if (icon) icon.className = `${isWished ? 'fas' : 'far'} fa-heart text-rose-400`;
    }
  } else {
    showToast(res.message);
  }
}

// =============================================
//   Checkout Modal
// =============================================

// State kurir
let shippingMethods   = [];   // list dari API
let selectedShipping  = null; // { id, courier, service, description, estimated_days, price }
let appliedPromo      = null; // { code, discount_type, discount_value, discount_amount }

async function openCheckoutModal() {
  if (!currentUser) { openAuthModal('login'); return; }
  if (cart.length === 0) { showToast('Keranjang kosong!'); return; }

  // Hanya item yang dicentang
  const selectedItems = cart.filter(c => selectedCartIds.has(c.product_id));
  if (selectedItems.length === 0) {
    showToast('Pilih minimal 1 produk untuk checkout!');
    return;
  }

  closeCartSidebar();
  const overlay = document.getElementById('checkoutOverlay');
  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
  document.body.style.overflow = 'hidden';

  // Auto-fill dari profil jika field masih kosong
  const nameEl    = document.getElementById('ckName');
  const phoneEl   = document.getElementById('ckPhone');
  const addressEl = document.getElementById('ckAddress');
  if (currentUser.name    && !nameEl.value)    nameEl.value    = currentUser.name;
  if (currentUser.phone   && !phoneEl.value)   phoneEl.value   = currentUser.phone;
  if (currentUser.address && !addressEl.value) addressEl.value = currentUser.address;

  // Load kurir jika belum
  if (shippingMethods.length === 0) await loadShippingMethods();

  renderCheckoutSummary();
}

function closeCheckoutModal() {
  const overlay = document.getElementById('checkoutOverlay');
  overlay.classList.add('hidden');
  overlay.classList.remove('flex');
  document.body.style.overflow = '';
  selectedShipping = null;
  appliedPromo     = null;
  renderCheckoutSummary();
}

async function loadShippingMethods() {
  const res = await apiFetch(API.shipping);
  if (res.success) {
    shippingMethods = res.data.shipping_methods;
    renderShippingOptions();
  }
}

function renderShippingOptions() {
  const container = document.getElementById('shippingOptions');
  if (!container) return;

  // Group by courier
  const grouped = {};
  shippingMethods.forEach(s => {
    if (!grouped[s.courier]) grouped[s.courier] = [];
    grouped[s.courier].push(s);
  });

  const courierLogos = {
    'JNE'     : '📦',
    'J&T'     : '🟠',
    'SiCepat' : '⚡',
    'Anteraja': '🔵',
    'GoSend'  : '🟢',
  };

  container.innerHTML = Object.entries(grouped).map(([courier, services]) => `
    <div class="mb-3">
      <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
        ${courierLogos[courier] || '📬'} ${courier}
      </p>
      <div class="space-y-2">
        ${services.map(s => `
          <label class="shipping-option flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
            ${selectedShipping?.id === s.id ? 'border-rose-400 bg-rose-50' : 'border-gray-100 hover:border-rose-200 bg-white'}"
            onclick="selectShipping(${s.id})">
            <input type="radio" name="shipping" value="${s.id}"
              ${selectedShipping?.id === s.id ? 'checked' : ''}
              class="accent-rose-500" onchange="selectShipping(${s.id})" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-gray-900">${s.service}</span>
                <span class="text-xs text-gray-400">${s.description}</span>
              </div>
              <div class="flex items-center gap-1 mt-0.5">
                <i class="fas fa-clock text-gray-300 text-xs"></i>
                <span class="text-xs text-gray-400">Estimasi ${s.estimated_days}</span>
              </div>
            </div>
            <span class="text-sm font-bold text-rose-600 shrink-0">${formatPrice(s.price)}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function selectShipping(id) {
  selectedShipping = shippingMethods.find(s => s.id === id) || null;
  renderShippingOptions();
  renderCheckoutSummary();
}

function renderCheckoutSummary() {
  const selectedItems = cart.filter(c => selectedCartIds.has(c.product_id));
  const subtotal      = selectedItems.reduce((s, c) => s + c.price * c.qty, 0);
  const shippingCost  = selectedShipping ? selectedShipping.price : 0;
  const discountAmt   = appliedPromo ? appliedPromo.discount_amount : 0;
  const total         = subtotal + shippingCost - discountAmt;

  document.getElementById('ckSubtotal').textContent = formatPrice(subtotal);
  document.getElementById('ckShipping').textContent = selectedShipping
    ? `${selectedShipping.courier} ${selectedShipping.service} — ${formatPrice(shippingCost)}`
    : 'Pilih kurir';
  document.getElementById('ckTotal').textContent = formatPrice(total);

  // Discount row
  const discountRow = document.getElementById('ckDiscountRow');
  if (appliedPromo) {
    document.getElementById('ckPromoLabel').textContent = appliedPromo.code;
    document.getElementById('ckDiscount').textContent   = '- ' + formatPrice(discountAmt);
    discountRow.classList.remove('hidden');
  } else {
    discountRow.classList.add('hidden');
  }

  // Tampilkan hanya item yang dipilih
  const itemsEl = document.getElementById('ckItems');
  itemsEl.innerHTML = selectedItems.map(i => `
    <div class="flex gap-3 items-center">
      <img src="${i.image}" class="w-10 h-10 rounded-xl object-cover" />
      <div class="flex-1 min-w-0">
        <p class="text-xs font-semibold text-gray-800 line-clamp-1">${i.name}</p>
        <p class="text-xs text-gray-400">${i.brand} × ${i.qty}</p>
      </div>
      <span class="text-xs font-bold text-rose-600">${formatPrice(i.price * i.qty)}</span>
    </div>
  `).join('');
}

async function applyPromo() {
  const input  = document.getElementById('ckPromoInput');
  const msgEl  = document.getElementById('ckPromoMsg');
  const btn    = document.getElementById('ckPromoBtn');
  const code   = input.value.trim().toUpperCase();

  // Reset promo jika input kosong
  if (!code) {
    appliedPromo = null;
    msgEl.className = 'text-xs mt-1 hidden';
    msgEl.textContent = '';
    renderCheckoutSummary();
    return;
  }

  const subtotal = cart
    .filter(c => selectedCartIds.has(c.product_id))
    .reduce((s, c) => s + c.price * c.qty, 0);

  btn.disabled    = true;
  btn.textContent = '...';

  const res = await apiFetch(`${API.orders}?action=validate_promo`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ code, subtotal }),
  });

  btn.disabled    = false;
  btn.textContent = 'Gunakan';

  msgEl.classList.remove('hidden');
  if (res.success) {
    appliedPromo    = res.data;
    input.value     = res.data.code;
    msgEl.className = 'text-xs mt-1 text-emerald-600';
    msgEl.textContent = '✅ ' + res.message;
  } else {
    appliedPromo    = null;
    msgEl.className = 'text-xs mt-1 text-red-500';
    msgEl.textContent = '❌ ' + res.message;
  }
  renderCheckoutSummary();
}

async function submitOrder() {
  const name    = document.getElementById('ckName').value.trim();
  const phone   = document.getElementById('ckPhone').value.trim();
  const address = document.getElementById('ckAddress').value.trim();
  const payment = document.getElementById('ckPayment').value;
  const notes   = document.getElementById('ckNotes').value.trim();

  // Ambil hanya item yang dipilih
  const selectedItems = cart.filter(c => selectedCartIds.has(c.product_id));
  if (selectedItems.length === 0) {
    showToast('Pilih minimal 1 produk untuk checkout!');
    return;
  }

  if (!name || !phone || !address) {
    showToast('Nama, telepon, dan alamat wajib diisi!');
    return;
  }
  if (!selectedShipping) {
    showToast('Pilih kurir pengiriman terlebih dahulu!');
    document.getElementById('shippingOptions')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const btn = document.getElementById('ckSubmitBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Memproses...';

  const res = await apiFetch(API.orders, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({
      shipping_name     : name,
      shipping_phone    : phone,
      shipping_address  : address,
      payment_method    : payment,
      notes,
      shipping_method_id: selectedShipping.id,
      promo_code        : appliedPromo ? appliedPromo.code : '',
      selected_product_ids: selectedItems.map(i => i.product_id),
    }),
  });

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-lock mr-2"></i>Buat Pesanan';

  if (res.success) {
    // Hapus hanya item yang sudah di-checkout dari selectedCartIds
    selectedItems.forEach(i => selectedCartIds.delete(i.product_id));
    // Cart diupdate dari server (item tidak dipilih tetap ada)
    const cartRes = await apiFetch(API.cart);
    if (cartRes.success) {
      cart = cartRes.data.items;
    } else {
      cart = [];
    }
    selectedShipping = null;
    appliedPromo     = null;
    updateCartUI();
    closeCheckoutModal();
    openSuccessModal(res.data, payment);
  } else {
    showToast(res.message);
  }
}

function openSuccessModal(order) {
  const overlay = document.getElementById('successOverlay');
  document.getElementById('successOrderCode').textContent = order.order_code;
  document.getElementById('successTotal').textContent     = formatPrice(order.total);

  // Tampilkan info kurir
  if (order.shipping_courier) {
    document.getElementById('successCourier').textContent  = `${order.shipping_courier} ${order.shipping_service}`;
    document.getElementById('successEstimate').textContent = `Estimasi: ${order.shipping_estimate}`;
    document.getElementById('successShipping').classList.remove('hidden');
  } else {
    document.getElementById('successShipping').classList.add('hidden');
  }

  // Tampilkan reminder upload bukti jika bukan COD
  const proofReminder = document.getElementById('successProofReminder');
  if (proofReminder) {
    if (order.payment_method && order.payment_method !== 'cod') {
      proofReminder.classList.remove('hidden');
      // Set order_id ke tombol upload
      const uploadBtn = document.getElementById('successUploadBtn');
      if (uploadBtn) uploadBtn.setAttribute('data-order-id', order.order_id);
    } else {
      proofReminder.classList.add('hidden');
    }
  }

  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closeSuccessModal() {
  document.getElementById('successOverlay').classList.add('hidden');
  document.getElementById('successOverlay').classList.remove('flex');
  document.body.style.overflow = '';
}

// =============================================
//   Auth Modal
// =============================================
function openAuthModal(tab = 'login') {
  const overlay = document.getElementById('authOverlay');
  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
  document.body.style.overflow = 'hidden';
  switchAuthTab(tab);
}

function closeAuthModal() {
  document.getElementById('authOverlay').classList.add('hidden');
  document.getElementById('authOverlay').classList.remove('flex');
  document.body.style.overflow = '';
  clearAuthErrors();
}

function switchAuthTab(tab) {
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tabLogin').classList.toggle('auth-tab-active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('auth-tab-active', tab === 'register');
  clearAuthErrors();
}

function clearAuthErrors() {
  document.querySelectorAll('.auth-error').forEach(el => el.textContent = '');
}

async function doLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');

  const res = await apiFetch(`${API.auth}?action=login`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ email, password }),
  });

  if (res.success) {
    currentUser = res.data.user;
    await Promise.all([loadCart(), loadWishlist()]);
    renderAuthUI();
    renderProducts();
    closeAuthModal();
    showToast(`Selamat datang, ${currentUser.name.split(' ')[0]}! 🌸`);
    // Fetch dan tampilkan voucher tanpa perlu refresh
    fetchAndRenderVoucher();
  } else {
    errEl.textContent = res.message;
  }
}

async function doRegister(e) {
  e.preventDefault();

  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm  = document.getElementById('regConfirm').value;
  const errEl    = document.getElementById('registerError');

  if (password !== confirm) {
    errEl.textContent = 'Konfirmasi password tidak cocok.';
    return;
  }

  const res = await apiFetch(`${API.auth}?action=register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email,
      password
    }),
  });

  if (res.success) {
    currentUser = res.data.user;
    await Promise.all([loadCart(), loadWishlist()]);
    renderAuthUI();
    renderProducts();
    closeAuthModal();

    // Tampilkan popup voucher dulu, lalu fetch badge untuk dropdown
    if (res.data?.voucher_code) {
      showVoucherPopup(res.data.voucher_code, res.data.voucher_value, res.data.voucher_expires);
    } else {
      showToast(`Selamat bergabung, ${currentUser.name.split(' ')[0]}! 🌸`);
    }
    // Fetch dan render voucher di dropdown tanpa perlu refresh
    fetchAndRenderVoucher();
  } else {
    errEl.textContent = res.message;
  }
}

// =============================================
//   Voucher Badge di Dropdown
// =============================================
function renderVoucherBadge(voucher) {
  // Jangan tampilkan voucher untuk admin
  if (currentUser?.role === 'admin') return;

  const dropdown = document.getElementById('userDropdown');
  if (!dropdown) return;

  // Hapus badge lama kalau ada
  const old = document.getElementById('voucherBadgeItem');
  if (old) old.remove();

  const expires = voucher.expires_at
    ? new Date(voucher.expires_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
    : 'Selamanya';

  const isUsed = voucher.is_used;

  const item = document.createElement('div');
  item.id = 'voucherBadgeItem';

  if (isUsed) {
    // Tampilan voucher sudah terpakai
    item.innerHTML = `
      <div class="mx-2 mb-1 mt-1 bg-gray-50 border border-gray-200 rounded-xl p-3 opacity-60">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold text-gray-400">🎁 Voucher Baru</span>
          <span class="text-xs font-semibold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Terpakai</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs font-bold text-gray-400 tracking-widest line-through">${voucher.code}</span>
          <span class="text-xs text-gray-400 line-through">Rp ${Number(voucher.discount_value).toLocaleString('id-ID')}</span>
        </div>
      </div>
      <hr class="my-1 border-rose-50" />`;
  } else {
    // Tampilan voucher masih aktif
    item.innerHTML = `
      <div class="mx-2 mb-1 mt-1 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-3 cursor-pointer"
        onclick="copyVoucherCode('${voucher.code}')">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold text-rose-600">🎁 Voucher Baru</span>
          <span class="text-xs font-bold text-emerald-600">Rp ${Number(voucher.discount_value).toLocaleString('id-ID')}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs font-bold text-rose-500 tracking-widest">${voucher.code}</span>
          <span class="text-xs text-gray-400">s/d ${expires}</span>
        </div>
        <p class="text-xs text-gray-400 mt-1">Klik untuk salin kode</p>
      </div>
      <hr class="my-1 border-rose-50" />`;
  }

  // Sisipkan di paling atas dropdown
  const hr = dropdown.querySelector('hr');
  if (hr) dropdown.insertBefore(item, hr);
  else dropdown.prepend(item);
}

function copyVoucherCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    showToast(`Kode ${code} disalin! Gunakan saat checkout 🎁`);
    closeUserDropdown();
  }).catch(() => {
    showToast(`Kode voucher kamu: ${code}`);
  });
}

// =============================================
//   Voucher Popup (setelah register)
// =============================================
function showVoucherPopup(code, value, expires) {
  // Buat overlay popup
  const popup = document.createElement('div');
  popup.id = 'voucherPopup';
  popup.className = 'fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm';
  popup.innerHTML = `
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm text-center overflow-hidden animate-bounce-in">
      <!-- Header gradient -->
      <div class="bg-gradient-to-br from-rose-400 to-pink-500 p-8 relative">
        <div class="text-6xl mb-2">🎁</div>
        <h2 class="font-playfair text-2xl font-bold text-white">Selamat Bergabung!</h2>
        <p class="text-rose-100 text-sm mt-1">Kamu mendapat voucher spesial</p>
      </div>
      <!-- Voucher card -->
      <div class="p-6">
        <div class="border-2 border-dashed border-rose-200 rounded-2xl p-5 mb-5 bg-rose-50">
          <p class="text-xs text-gray-400 uppercase tracking-widest mb-1">Kode Voucher</p>
          <div class="flex items-center justify-center gap-2 mb-3">
            <span class="font-mono font-bold text-rose-600 text-xl tracking-widest">${code}</span>
            <button onclick="navigator.clipboard.writeText('${code}'); this.innerHTML='<i class=\\'fas fa-check text-green-500\\'></i>'"
              class="text-gray-400 hover:text-rose-500 transition-colors" title="Salin kode">
              <i class="fas fa-copy text-sm"></i>
            </button>
          </div>
          <div class="bg-white rounded-xl px-4 py-2 inline-block">
            <span class="font-bold text-rose-600 text-2xl">Rp ${Number(value).toLocaleString('id-ID')}</span>
          </div>
          <p class="text-xs text-gray-400 mt-2">Min. pembelian Rp 50.000 · Berlaku sampai ${expires}</p>
        </div>
        <p class="text-xs text-gray-400 mb-5">Gunakan kode ini saat checkout untuk mendapatkan diskon ✨</p>
        <button onclick="document.getElementById('voucherPopup').remove(); showToast('Akun berhasil dibuat! Silakan masuk 🌸')"
          class="w-full py-3.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg">
          Siap! Mulai Belanja
        </button>
      </div>
    </div>`;

  document.body.appendChild(popup);

  // Tutup saat klik background
  popup.addEventListener('click', e => {
    if (e.target === popup) {
      popup.remove();
      showToast('Akun berhasil dibuat! Silakan masuk 🌸');
    }
  });
}

// =============================================
//   Product Modal
// =============================================
async function openModal(id) {
  const res = await apiFetch(`${API.products}?id=${id}`);
  if (!res.success) return;
  const p = res.data;

  const overlay  = document.getElementById('modalOverlay');
  const box      = document.getElementById('modalBox');
  const discount = Math.round((1 - p.price / p.original_price) * 100);

  box.innerHTML = `
    <div class="relative">
      <button onclick="closeModal()" class="absolute top-4 right-4 z-10 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
        <i class="fas fa-times"></i>
      </button>
      <div class="grid md:grid-cols-2 gap-0">
        <div class="relative bg-gradient-to-br from-rose-50 to-pink-50 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none overflow-hidden" style="min-height:280px">
          <img src="${p.image}" alt="${p.name}" class="w-full h-72 md:h-full object-cover" />
          ${badgeHTML(p.badge)}
          <div class="absolute bottom-3 right-3 bg-white/90 text-emerald-600 font-bold text-sm px-3 py-1 rounded-full shadow">-${discount}%</div>
        </div>
        <div class="p-6 md:p-8">
          <span class="text-rose-400 text-xs font-semibold uppercase tracking-widest">${p.brand}</span>
          <h2 class="font-playfair text-xl md:text-2xl font-bold text-gray-900 mt-1 mb-3">${p.name}</h2>
          <div class="flex items-center gap-2 mb-4">
            <div class="flex gap-0.5">${renderStars(p.rating)}</div>
            <span class="text-gray-500 text-sm font-semibold">${p.rating}</span>
            <span class="text-gray-300 text-sm">(${Number(p.reviews).toLocaleString()} ulasan)</span>
          </div>
          <div class="flex items-baseline gap-3 mb-5">
            <span class="font-playfair text-2xl font-bold text-rose-600">${formatPrice(p.price)}</span>
            <span class="text-gray-300 text-base line-through">${formatPrice(p.original_price)}</span>
          </div>
          <p class="text-gray-500 text-sm leading-relaxed mb-5">${p.description}</p>
          <div class="space-y-2 mb-6">
            <div class="flex gap-2">
              <span class="text-xs font-semibold text-gray-500 w-28 shrink-0">Skin Type</span>
              <span class="text-xs text-gray-700">${p.skin_type}</span>
            </div>
            <div class="flex gap-2">
              <span class="text-xs font-semibold text-gray-500 w-28 shrink-0">Key Ingredients</span>
              <span class="text-xs text-gray-700">${p.key_ingredients}</span>
            </div>
            <div class="flex gap-2">
              <span class="text-xs font-semibold text-gray-500 w-28 shrink-0">Stok</span>
              <span class="text-xs ${p.stock < 10 ? 'text-red-500 font-semibold' : 'text-gray-700'}">${p.stock > 0 ? p.stock + ' tersedia' : 'Habis'}</span>
            </div>
          </div>
          <div class="flex gap-3">
            <button onclick="addToCart(event, ${p.id}); closeModal()"
              class="flex-1 btn-primary py-3.5 rounded-full text-white font-semibold text-sm flex items-center justify-center gap-2 ${p.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
              ${p.stock === 0 ? 'disabled' : ''}>
              <i class="fas fa-shopping-bag"></i> ${p.stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
            </button>
            <button onclick="toggleWishlist(event, ${p.id})"
              class="wishlist-btn relative static w-12 h-12 rounded-full border border-rose-200 ${wishlistIds.has(p.id) ? 'active bg-rose-50' : ''}">
              <i class="${wishlistIds.has(p.id) ? 'fas' : 'far'} fa-heart text-rose-400"></i>
            </button>
          </div>
          <!-- Ulasan produk -->
          <div id="productReviewsSection" class="mt-4 pt-4 border-t border-gray-100">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Ulasan Pembeli</span>
            </div>
            <div id="productReviewsList" class="space-y-2">
              <div class="text-xs text-gray-300 text-center py-3">
                <i class="fas fa-spinner fa-spin mr-1"></i> Memuat ulasan...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => box.classList.add('scale-100'));

  // Load ulasan produk setelah modal terbuka
  loadProductReviews(id);
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  const box     = document.getElementById('modalBox');
  box.classList.remove('scale-100');
  overlay.classList.add('hidden');
  overlay.classList.remove('flex');
  document.body.style.overflow = '';
}

// Load status review untuk semua item di satu order
async function loadOrderReviewStatuses(orderId, items) {
  if (!currentUser) return;
  const stars = n => Array.from({length:5}, (_,i) =>
    `<i class="fas fa-star text-xs ${i < n ? 'text-amber-400' : 'text-gray-200'}"></i>`).join('');

  for (const item of items) {
    const statusEl = document.getElementById(`reviewStatus_${orderId}_${item.product_id}`);
    if (!statusEl) continue;

    // Cek sudah review atau belum
    const res = await apiFetch(
      `${API.reviews}?action=can_review&product_id=${item.product_id}&order_id=${orderId}`
    );

    if (!res.success) continue;

    if (res.data.can_review) {
      // Belum review — tampilkan tombol tulis ulasan
      statusEl.innerHTML = `
        <button onclick="openReviewModal(${item.product_id}, '${item.product_name.replace(/'/g,"\\'")}', ${orderId})"
          class="flex items-center gap-1 mt-0.5 text-xs text-rose-500 font-semibold hover:text-rose-700 transition-colors">
          <i class="fas fa-star text-amber-400 text-xs"></i> Tulis ulasan
          <i class="fas fa-chevron-right text-xs opacity-50"></i>
        </button>`;
    } else {
      // Sudah review — tampilkan ulasan yang sudah dikirim
      const rvRes = await apiFetch(`${API.reviews}?product_id=${item.product_id}`);
      let myReview = null;
      if (rvRes.success) {
        // Cari ulasan milik user ini berdasarkan order (karena nama disensor, pakai order_id di backend)
        myReview = rvRes.data.reviews[0]; // ambil terbaru sebagai approx
      }

      if (myReview) {
        statusEl.innerHTML = `
          <div class="mt-1">
            <div class="flex gap-0.5 mb-0.5">${stars(myReview.rating)}</div>
            ${myReview.comment
              ? `<p class="text-xs text-gray-500 italic leading-relaxed">"${myReview.comment}"</p>`
              : `<p class="text-xs text-gray-400">Sudah diulas ✓</p>`}
          </div>`;
      } else {
        statusEl.innerHTML = `<p class="text-xs text-gray-400 mt-0.5">Sudah diulas ✓</p>`;
      }
    }
  }
}

// Refresh satu item setelah submit review
async function refreshReviewItem(productId, orderId) {
  const statusEl = document.getElementById(`reviewStatus_${orderId}_${productId}`);
  if (!statusEl) return;

  const rvRes = await apiFetch(`${API.reviews}?product_id=${productId}`);
  const stars = n => Array.from({length:5}, (_,i) =>
    `<i class="fas fa-star text-xs ${i < n ? 'text-amber-400' : 'text-gray-200'}"></i>`).join('');

  if (rvRes.success && rvRes.data.reviews.length > 0) {
    const r = rvRes.data.reviews[0];
    statusEl.innerHTML = `
      <div class="mt-1">
        <div class="flex gap-0.5 mb-0.5">${stars(r.rating)}</div>
        ${r.comment
          ? `<p class="text-xs text-gray-500 italic">"${r.comment}"</p>`
          : `<p class="text-xs text-gray-400">Sudah diulas ✓</p>`}
      </div>`;
  } else {
    statusEl.innerHTML = `<p class="text-xs text-gray-400 mt-0.5">Sudah diulas ✓</p>`;
  }
}

async function loadProductReviews(productId) {
  const listEl = document.getElementById('productReviewsList');
  if (!listEl) return;

  const res = await apiFetch(`${API.reviews}?product_id=${productId}`);
  if (!res.success) { listEl.innerHTML = '<p class="text-xs text-gray-300 text-center py-2">Gagal memuat ulasan.</p>'; return; }

  const { reviews, total, avg_rating } = res.data;

  // Update section header dengan rata-rata
  const section = document.getElementById('productReviewsSection');
  if (section) {
    const header = section.querySelector('.flex');
    if (header && total > 0) {
      header.innerHTML = `
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Ulasan Pembeli</span>
        <span class="ml-auto flex items-center gap-1">
          <i class="fas fa-star text-amber-400 text-xs"></i>
          <span class="text-sm font-bold text-gray-700">${avg_rating}</span>
          <span class="text-xs text-gray-400">(${total} ulasan)</span>
        </span>`;
    }
  }

  if (!reviews.length) {
    listEl.innerHTML = '<p class="text-xs text-gray-400 text-center py-3">Belum ada ulasan. Jadilah yang pertama!</p>';
    return;
  }

  const stars = n => Array.from({length:5}, (_,i) =>
    `<i class="fas fa-star text-xs ${i < n ? 'text-amber-400' : 'text-gray-200'}"></i>`).join('');

  listEl.innerHTML = reviews.map(r => `
    <div class="bg-gray-50 rounded-xl p-3">
      <div class="flex items-center justify-between mb-1">
        <div class="flex gap-0.5">${stars(r.rating)}</div>
        <span class="text-xs text-gray-400">${new Date(r.created_at).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'})}</span>
      </div>
      <p class="text-xs font-semibold text-gray-600 mb-0.5">${r.reviewer_name}</p>
      ${r.comment ? `<p class="text-xs text-gray-500 leading-relaxed">${r.comment}</p>` : ''}
    </div>`).join('');
}

// =============================================
//   Filter / Sort / Search
// =============================================
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    currentProductPage = 1;
    loadProducts();
    document.getElementById('products').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

document.getElementById('sortSelect').addEventListener('change', e => {
  sortMode = e.target.value;
  currentProductPage = 1;
  loadProducts();
});

const searchInput = document.getElementById('searchInput');
let searchTimer;
searchInput.addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = e.target.value;
    currentProductPage = 1;
    loadProducts();
  }, 300);
});

document.getElementById('searchToggle').addEventListener('click', () => {
  const bar = document.getElementById('searchBar');
  bar.classList.toggle('hidden');
  if (!bar.classList.contains('hidden')) searchInput.focus();
});

// =============================================
//   Cart Sidebar
// =============================================
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');

document.getElementById('cartBtn').addEventListener('click', () => {
  cartSidebar.classList.add('open');
  cartOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
});

function closeCartSidebar() {
  cartSidebar.classList.remove('open');
  cartOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

document.getElementById('closeCart').addEventListener('click', closeCartSidebar);
cartOverlay.addEventListener('click', closeCartSidebar);

// =============================================
//   Mobile Menu
// =============================================
document.getElementById('mobileMenuBtn').addEventListener('click', () => {
  document.getElementById('mobileMenu').classList.toggle('hidden');
});
document.querySelectorAll('#mobileMenu a').forEach(a => {
  a.addEventListener('click', () => document.getElementById('mobileMenu').classList.add('hidden'));
});

// =============================================
//   Toast
// =============================================
function showToast(msg) {
  const toast    = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  toastMsg.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// =============================================
//   Navbar scroll effect
// =============================================
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  navbar.style.boxShadow = window.scrollY > 50
    ? '0 4px 20px rgba(0,0,0,0.08)'
    : '0 1px 3px rgba(0,0,0,0.04)';
});

// =============================================
//   Global click / keyboard handlers
// =============================================
document.addEventListener('click', e => {
  // Close mobile menu
  const menu = document.getElementById('mobileMenu');
  const btn  = document.getElementById('mobileMenuBtn');
  if (!menu.contains(e.target) && e.target !== btn) menu.classList.add('hidden');

  // Close user dropdown
  const dropdown = document.getElementById('userDropdown');
  const userBtn  = document.getElementById('userMenuBtn');
  if (dropdown && !dropdown.contains(e.target) && e.target !== userBtn && !userBtn?.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeCartSidebar();
    closeAuthModal();
    closeCheckoutModal();
    closeSuccessModal();
    closeOrderHistory();
    closeOrderDetailUser();
    closeProfileModal();
    closeWishlistModal();
  }
});

document.getElementById('wishlistOverlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('wishlistOverlay')) closeWishlistModal();
});

document.getElementById('profileOverlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('profileOverlay')) closeProfileModal();
});

document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

document.getElementById('orderHistoryOverlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('orderHistoryOverlay')) closeOrderHistory();
});

document.getElementById('orderDetailUserOverlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('orderDetailUserOverlay')) closeOrderDetailUser();
});

// =============================================
//   Order History
// =============================================
async function openOrderHistory() {
  if (!currentUser) { openAuthModal('login'); return; }
  const overlay = document.getElementById('orderHistoryOverlay');
  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
  document.body.style.overflow = 'hidden';
  await loadOrderHistory();
}

function closeOrderHistory() {
  document.getElementById('orderHistoryOverlay').classList.add('hidden');
  document.getElementById('orderHistoryOverlay').classList.remove('flex');
  document.body.style.overflow = '';
}

async function loadOrderHistory() {
  const listEl = document.getElementById('orderHistoryList');
  listEl.innerHTML = `<div class="text-center py-12 text-gray-300">
    <i class="fas fa-spinner fa-spin text-3xl mb-3 block"></i>
    <p class="text-sm">Memuat pesanan...</p>
  </div>`;

  const res = await apiFetch(API.orders);
  if (!res.success) {
    listEl.innerHTML = `<div class="text-center py-12"><p class="text-red-400 text-sm">${res.message}</p></div>`;
    return;
  }

  const orders = res.data;
  if (!orders.length) {
    listEl.innerHTML = `<div class="text-center py-16">
      <div class="text-5xl mb-4">📦</div>
      <p class="text-gray-400 text-sm font-medium">Belum ada pesanan</p>
      <p class="text-gray-300 text-xs mt-1">Yuk mulai belanja produk favoritmu!</p>
    </div>`;
    return;
  }

  const statusMap = {
    pending   : ['bg-yellow-50 text-yellow-600 border-yellow-100', '⏳ Pending'],
    processing: ['bg-blue-50 text-blue-600 border-blue-100',       '⚙️ Diproses'],
    shipped   : ['bg-purple-50 text-purple-600 border-purple-100', '🚚 Dikirim'],
    delivered : ['bg-green-50 text-green-600 border-green-100',    '✅ Selesai'],
    cancelled : ['bg-red-50 text-red-500 border-red-100',          '❌ Dibatalkan'],
  };

  listEl.innerHTML = orders.map(o => {
    const [cls, label] = statusMap[o.status] || ['bg-gray-50 text-gray-500 border-gray-100', o.status];
    const needsProof = o.status === 'pending' && o.payment_method !== 'cod' && !o.payment_proof;
    return `
    <div class="bg-white border ${needsProof ? 'border-amber-200' : 'border-gray-100'} rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer"
         onclick="openOrderDetailUser(${o.id})">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <p class="font-mono font-bold text-rose-600 text-sm">${o.order_code}</p>
          <p class="text-xs text-gray-400 mt-0.5">${new Date(o.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })}</p>
        </div>
        <span class="text-xs font-semibold px-3 py-1 rounded-full border flex-shrink-0 ${cls}">${label}</span>
      </div>
      ${needsProof ? `
      <div class="mt-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
        <i class="fas fa-exclamation-triangle text-amber-500 text-xs flex-shrink-0"></i>
        <p class="text-xs text-amber-700 font-semibold">Belum upload bukti pembayaran — klik untuk upload</p>
      </div>` : ''}
      <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <div class="text-xs text-gray-400">
          <span class="capitalize">${o.payment_method || 'transfer'}</span>
          ${o.shipping_cost > 0 ? `<span class="mx-1">·</span><span>Ongkir ${formatPrice(o.shipping_cost)}</span>` : ''}
        </div>
        <span class="font-bold text-gray-900 text-sm">${formatPrice(o.total)}</span>
      </div>
    </div>`;
  }).join('');
}

async function openOrderDetailUser(orderId) {
  const overlay = document.getElementById('orderDetailUserOverlay');
  const content = document.getElementById('orderDetailUserContent');
  overlay.classList.remove('hidden');
  overlay.classList.add('flex');

  content.innerHTML = `<div class="text-center py-10 text-gray-300">
    <i class="fas fa-spinner fa-spin text-2xl"></i>
  </div>`;

  const res = await apiFetch(`${API.orders}?id=${orderId}`);
  if (!res.success) {
    content.innerHTML = `<p class="text-red-400 text-sm text-center py-8">${res.message}</p>`;
    return;
  }
  const o = res.data;

  const statusMap = {
    pending   : 'bg-yellow-50 text-yellow-600',
    processing: 'bg-blue-50 text-blue-600',
    shipped   : 'bg-purple-50 text-purple-600',
    delivered : 'bg-green-50 text-green-600',
    cancelled : 'bg-red-50 text-red-500',
  };
  const statusLabel = {
    pending:'⏳ Pending', processing:'⚙️ Diproses',
    shipped:'🚚 Dikirim', delivered:'✅ Selesai', cancelled:'❌ Dibatalkan'
  };

  // Blok bukti pembayaran
  const isCOD      = o.payment_method === 'cod';
  const needsProof = !isCOD && (o.status === 'pending' || o.status === 'processing');
  const hasProof   = !!o.payment_proof;

  let proofBlock = '';
  if (!isCOD) {
    if (hasProof) {
      proofBlock = `
        <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <p class="text-xs font-bold text-emerald-700 mb-2">✅ Bukti Pembayaran Terkirim</p>
          <img src="${o.payment_proof}" alt="Bukti Pembayaran"
            class="w-full max-h-48 object-contain rounded-lg border border-emerald-200 cursor-pointer"
            onclick="window.open('${o.payment_proof}','_blank')" />
          <p class="text-xs text-emerald-600 mt-2">Klik gambar untuk memperbesar</p>
        </div>`;
    } else if (needsProof) {
      proofBlock = `
        <div class="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p class="text-xs font-bold text-amber-700 mb-2">📸 Upload Bukti Pembayaran</p>
          <p class="text-xs text-amber-600 mb-3">Silakan upload screenshot/foto bukti transfer untuk mempercepat proses pesanan.</p>
          <label class="block w-full cursor-pointer">
            <div id="proofPreview_${o.id}" class="border-2 border-dashed border-amber-300 rounded-xl p-4 text-center hover:bg-amber-50 transition-colors">
              <i class="fas fa-camera text-amber-400 text-2xl mb-2 block"></i>
              <p class="text-xs text-amber-500 font-semibold">Pilih gambar (JPG/PNG, maks. 5MB)</p>
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden"
              onchange="previewProof(this, ${o.id})" />
          </label>
          <button id="proofUploadBtn_${o.id}" onclick="uploadProof(${o.id})" disabled
            class="mt-3 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <i class="fas fa-upload mr-2"></i>Kirim Bukti Pembayaran
          </button>
        </div>`;
    }
  }

  // Mapping URL tracking per kurir
  const trackingUrls = {
    'JNE'     : `https://www.jne.co.id/id/tracking/trace`,
    'J&T'     : `https://jet.co.id/track`,
    'SiCepat' : `https://www.sicepat.com/checkAwb`,
    'Anteraja': `https://anteraja.id/tracking`,
    'GoSend'  : `https://driver.gojek.com/`,
    'Wahana'  : `https://www.wahana.com/tracking`,
    'Pos Indonesia': `https://www.posindonesia.co.id/id/tracking`,
  };

  // Blok nomor resi
  const trackingBlock = (o.tracking_number && (o.status === 'shipped' || o.status === 'delivered'))
    ? (() => {
        const courierKey = Object.keys(trackingUrls).find(k =>
          o.shipping_courier && o.shipping_courier.toLowerCase().includes(k.toLowerCase())
        );
        const trackUrl = courierKey ? trackingUrls[courierKey] : null;
        return `<div class="bg-purple-50 border border-purple-100 rounded-xl p-4">
          <p class="text-xs font-bold text-purple-700 mb-2">📬 Nomor Resi Pengiriman</p>
          <div class="flex items-center gap-2 mb-2">
            <p class="font-mono font-bold text-purple-700 text-sm tracking-wider flex-1">${o.tracking_number}</p>
            <button onclick="navigator.clipboard.writeText('${o.tracking_number}'); showToast('Nomor resi disalin!')"
              class="text-purple-400 hover:text-purple-600 transition-colors flex-shrink-0" title="Salin">
              <i class="fas fa-copy text-xs"></i>
            </button>
          </div>
          <p class="text-xs text-purple-500 mb-3">${o.shipping_courier} ${o.shipping_service} — Est. ${o.shipping_estimate || '—'}</p>
          ${trackUrl ? `
          <a href="${trackUrl}" target="_blank"
            class="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all">
            <i class="fas fa-search-location"></i>
            Lacak Paket di Website ${o.shipping_courier}
          </a>` : `
          <p class="text-xs text-purple-400 text-center">Cek status di website resmi ${o.shipping_courier}</p>`}
        </div>`;
      })()
    : '';

  content.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="font-mono font-bold text-rose-600">${o.order_code}</p>
          <p class="text-xs text-gray-400 mt-0.5">${new Date(o.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
        </div>
        <span class="text-xs font-semibold px-3 py-1.5 rounded-full ${statusMap[o.status] || 'bg-gray-50 text-gray-500'}">${statusLabel[o.status] || o.status}</span>
      </div>
      ${trackingBlock}
      ${proofBlock}
      <div class="bg-blue-50 rounded-xl p-4 text-sm">
        <p class="font-semibold text-blue-700 text-xs mb-2">📦 Pengiriman</p>
        <p class="font-semibold text-gray-800">${o.shipping_name} · ${o.shipping_phone}</p>
        <p class="text-gray-500 text-xs mt-1">${o.shipping_address}</p>
        ${o.shipping_courier ? `<p class="text-blue-600 font-semibold text-xs mt-2">🚚 ${o.shipping_courier} ${o.shipping_service}</p>` : ''}
      </div>
      <div>
        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Item</p>
        <div class="space-y-2">
          ${(o.items || []).map(i => `
            <div class="flex gap-3 items-center">
              <img src="${i.product_image}" class="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-gray-800 line-clamp-1">${i.product_name}</p>
                <p class="text-xs text-gray-400">${i.product_brand} × ${i.qty}</p>
              </div>
              <p class="text-xs font-bold text-rose-600 flex-shrink-0">${formatPrice(i.subtotal)}</p>
            </div>`).join('')}
        </div>
      </div>
      <div class="border-t pt-3 space-y-1.5">
        <div class="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>${formatPrice(o.subtotal)}</span></div>
        <div class="flex justify-between text-xs text-gray-500"><span>Ongkos Kirim</span><span>${formatPrice(o.shipping_cost)}</span></div>
        ${o.discount > 0 ? `<div class="flex justify-between text-xs text-emerald-600"><span>Diskon</span><span>- ${formatPrice(o.discount)}</span></div>` : ''}
        <div class="flex justify-between font-bold text-sm text-gray-900 border-t pt-2"><span>Total</span><span class="text-rose-600">${formatPrice(o.total)}</span></div>
      </div>
      ${o.status === 'pending' ? `
      <div class="mt-4 pt-4 border-t border-gray-100">
        <p class="text-xs text-gray-400 mb-2">Pesanan masih bisa dibatalkan selama status <strong>Pending</strong></p>
        <button onclick="cancelOrder(${o.id})"
          class="w-full py-2.5 rounded-xl border-2 border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-all">
          <i class="fas fa-times-circle mr-2"></i>Batalkan Pesanan
        </button>
      </div>` : ''}
      ${o.status === 'delivered' && (o.items||[]).length > 0 ? `
      <div class="mt-4 pt-4 border-t border-gray-100">
        <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">⭐ Ulasan Produk</p>
        <div class="space-y-2" id="reviewItemsWrap_${o.id}">
          ${(o.items||[]).map(i => `
          <div id="reviewItem_${o.id}_${i.product_id}"
            class="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
            <img src="${i.product_image}" class="w-10 h-10 rounded-xl object-cover flex-shrink-0"/>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-gray-800 line-clamp-1">${i.product_name}</p>
              <div id="reviewStatus_${o.id}_${i.product_id}">
                <p class="text-xs text-rose-400 mt-0.5"><i class="fas fa-spinner fa-spin mr-1"></i>Memeriksa...</p>
              </div>
            </div>
          </div>`).join('')}
        </div>
      </div>` : ''}
      ${o.status === 'shipped' && o.payment_method === 'cod' ? `
      <div class="mt-4 pt-4 border-t border-gray-100">
        <div class="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
          <p class="text-xs font-bold text-green-700 mb-1">📦 Pesanan dalam pengiriman</p>
          <p class="text-xs text-green-600 mb-1">Setelah menerima paket dan membayar ke kurir, klik tombol di bawah.</p>
          ${o.shipped_at ? `<p class="text-xs text-gray-400">
            <i class="fas fa-clock mr-1"></i>
            Otomatis selesai dalam <strong>${Math.max(0, 3 - Math.floor((Date.now() - new Date(o.shipped_at).getTime()) / 86400000))} hari</strong> jika tidak dikonfirmasi
          </p>` : ''}
        </div>
        <button onclick="confirmOrderReceived(${o.id})"
          class="w-full py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-all shadow-sm">
          <i class="fas fa-check-circle mr-2"></i>Pesanan Sudah Diterima & Dibayar
        </button>
      </div>` : ''}
    </div>`;

  // Load status review semua item jika pesanan delivered
  if (o.status === 'delivered' && o.items?.length > 0) {
    loadOrderReviewStatuses(o.id, o.items);
  }
}

// Simpan data image yang dipilih (keyed by orderId)
const proofImages = {};

function closeOrderDetailUser() {
  const overlay = document.getElementById('orderDetailUserOverlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
  overlay.classList.remove('flex');
  document.body.style.overflow = '';
}

async function confirmOrderReceived(orderId) {
  // Custom confirm modal
  const modal = document.createElement('div');
  modal.id = 'confirmReceivedModal';
  modal.className = 'fixed inset-0 z-[80] flex items-center justify-center p-4';
  modal.style.background = 'rgba(0,0,0,0.5)';
  modal.style.backdropFilter = 'blur(4px)';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
         style="animation: bounceIn 0.3s ease">
      <div class="bg-gradient-to-br from-green-50 to-emerald-50 px-8 pt-8 pb-6 text-center">
        <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-box-open text-green-500 text-3xl"></i>
        </div>
        <h3 class="font-playfair text-xl font-bold text-gray-900 mb-2">Konfirmasi Penerimaan</h3>
        <p class="text-gray-500 text-sm leading-relaxed">
          Pastikan paket sudah kamu terima dalam kondisi baik dan pembayaran sudah dilakukan ke kurir.
        </p>
      </div>
      <div class="px-8 py-5 flex gap-3">
        <button onclick="document.getElementById('confirmReceivedModal').remove()"
          class="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all">
          Belum
        </button>
        <button id="btnConfirmReceived" onclick="executeConfirmReceived(${orderId})"
          class="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-all shadow-md">
          <i class="fas fa-check mr-1.5"></i>Sudah Diterima
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

async function executeConfirmReceived(orderId) {
  const btn = document.getElementById('btnConfirmReceived');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i>Memproses...'; }

  const res = await apiFetch(`${API.orders}?action=confirm_received`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ order_id: orderId }),
  });

  document.getElementById('confirmReceivedModal')?.remove();

  if (res.success) {
    showToast('Terima kasih! Pesanan ditandai selesai ✅');
    closeOrderDetailUser();
    await loadOrderHistory();
  } else {
    showToast(res.message);
  }
}
async function cancelOrder(orderId) {
  // Tampilkan custom confirm modal
  showCancelConfirm(orderId);
}

function showCancelConfirm(orderId) {
  // Hapus modal lama kalau ada
  document.getElementById('cancelConfirmModal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'cancelConfirmModal';
  modal.className = 'fixed inset-0 z-[80] flex items-center justify-center p-4';
  modal.style.background = 'rgba(0,0,0,0.5)';
  modal.style.backdropFilter = 'blur(4px)';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
         style="animation: bounceIn 0.3s ease">
      <!-- Icon area -->
      <div class="bg-gradient-to-br from-rose-50 to-red-50 px-8 pt-8 pb-6 text-center">
        <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-times-circle text-red-400 text-3xl"></i>
        </div>
        <h3 class="font-playfair text-xl font-bold text-gray-900 mb-2">Batalkan Pesanan?</h3>
        <p class="text-gray-500 text-sm leading-relaxed">
          Pesanan yang dibatalkan tidak dapat dipulihkan kembali.
        </p>
      </div>
      <!-- Buttons -->
      <div class="px-8 py-5 flex gap-3">
        <button onclick="document.getElementById('cancelConfirmModal').remove()"
          class="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all">
          Kembali
        </button>
        <button id="confirmCancelBtn" onclick="executeCancelOrder(${orderId})"
          class="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all shadow-md">
          <i class="fas fa-times mr-1.5"></i>Ya, Batalkan
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  // Tutup saat klik background
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });
}

async function executeCancelOrder(orderId) {
  const btn = document.getElementById('confirmCancelBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i>Memproses...'; }

  const res = await apiFetch(`${API.orders}?action=cancel`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ order_id: orderId }),
  });

  document.getElementById('cancelConfirmModal')?.remove();

  if (res.success) {
    showToast('Pesanan berhasil dibatalkan ✅');
    closeOrderDetailUser();
    await loadOrderHistory();
    // Refresh voucher badge otomatis tanpa perlu refresh halaman
    fetchAndRenderVoucher();
  } else {
    showToast(res.message);
  }
}

function previewProof(input, orderId) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('Ukuran gambar maks. 5MB'); input.value = ''; return; }

  const reader = new FileReader();
  reader.onload = e => {
    proofImages[orderId] = e.target.result;
    const preview = document.getElementById(`proofPreview_${orderId}`);
    if (preview) {
      preview.innerHTML = `<img src="${e.target.result}" class="max-h-40 mx-auto rounded-lg object-contain" />
        <p class="text-xs text-amber-500 mt-2">${file.name}</p>`;
    }
    const btn = document.getElementById(`proofUploadBtn_${orderId}`);
    if (btn) btn.disabled = false;
  };
  reader.readAsDataURL(file);
}

async function uploadProof(orderId) {
  const imageData = proofImages[orderId];
  if (!imageData) { showToast('Pilih gambar terlebih dahulu.'); return; }

  const btn = document.getElementById(`proofUploadBtn_${orderId}`);
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Mengirim...'; }

  const res = await apiFetch(`${API.orders}?action=upload_proof`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ order_id: orderId, proof_image: imageData }),
  });

  if (res.success) {
    showToast('Bukti pembayaran berhasil dikirim! ✅');
    delete proofImages[orderId];
    // Reload detail
    await openOrderDetailUser(orderId);
    // Reload list
    await loadOrderHistory();
  } else {
    showToast(res.message);
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-upload mr-2"></i>Kirim Bukti Pembayaran'; }
  }
}

// =============================================
//   Wishlist Modal
// =============================================
async function openWishlistModal() {
  if (!currentUser) { openAuthModal('login'); return; }
  const overlay = document.getElementById('wishlistOverlay');
  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
  document.body.style.overflow = 'hidden';
  await loadWishlistModal();
}

function closeWishlistModal() {
  document.getElementById('wishlistOverlay').classList.add('hidden');
  document.getElementById('wishlistOverlay').classList.remove('flex');
  document.body.style.overflow = '';
}

async function loadWishlistModal() {
  const content = document.getElementById('wishlistContent');
  content.innerHTML = `<div class="text-center py-12 text-gray-300">
    <i class="fas fa-spinner fa-spin text-3xl mb-3 block"></i>
    <p class="text-sm">Memuat wishlist...</p>
  </div>`;

  const res = await apiFetch(API.wishlist);
  if (!res.success) {
    content.innerHTML = `<p class="text-center text-red-400 text-sm py-8">${res.message}</p>`;
    return;
  }

  const items = res.data;
  if (!items.length) {
    content.innerHTML = `
      <div class="text-center py-16">
        <div class="text-6xl mb-4">🤍</div>
        <p class="text-gray-400 text-sm font-medium">Wishlist masih kosong</p>
        <p class="text-gray-300 text-xs mt-1">Klik ikon ❤️ di produk untuk menyimpannya</p>
      </div>`;
    return;
  }

  const discount = p => Math.round((1 - p.price / p.original_price) * 100);

  content.innerHTML = `
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
      ${items.map(p => `
        <div class="bg-white border border-rose-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div class="relative bg-gradient-to-br from-rose-50 to-pink-50 aspect-square cursor-pointer"
            onclick="closeWishlistModal(); openModal(${p.product_id})">
            <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover" loading="lazy"/>
            ${p.badge ? `<span class="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full
              ${p.badge==='bestseller'?'bg-amber-400 text-white':p.badge==='hot'?'bg-rose-500 text-white':p.badge==='new'?'bg-emerald-500 text-white':'bg-purple-500 text-white'}">
              ${p.badge==='bestseller'?'⭐ BEST':p.badge==='hot'?'🔥 HOT':p.badge==='new'?'NEW':'SALE'}
            </span>` : ''}
          </div>
          <div class="p-3">
            <p class="text-xs text-gray-400 mb-0.5">${p.brand}</p>
            <p class="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug mb-2">${p.name}</p>
            <div class="flex items-center gap-1.5 mb-2">
              <span class="font-bold text-rose-600 text-sm">${formatPrice(p.price)}</span>
              <span class="text-gray-300 text-xs line-through">${formatPrice(p.original_price)}</span>
              <span class="text-xs font-semibold text-emerald-500">-${discount(p)}%</span>
            </div>
            <div class="flex gap-2">
              <button onclick="addToCart(event, ${p.product_id})"
                class="flex-1 py-1.5 rounded-full text-xs font-semibold border border-rose-300 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                <i class="fas fa-shopping-bag mr-1"></i>Keranjang
              </button>
              <button onclick="removeFromWishlistModal(${p.product_id})"
                class="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all text-gray-300 hover:text-red-400">
                <i class="fas fa-trash text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>`;
}

async function removeFromWishlistModal(productId) {
  const res = await apiFetch(API.wishlist, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ product_id: productId }),
  });
  if (res.success) {
    wishlistIds = new Set(res.data.wishlist_ids.map(Number));
    renderProducts();
    showToast('Dihapus dari wishlist');
    await loadWishlistModal();
  } else {
    showToast(res.message);
  }
}
// =============================================
//   Review Modal
// =============================================
function openReviewModal(productId, productName, orderId) {
  document.getElementById('reviewModal')?.remove();
  selectedRating = 0;

  const modal = document.createElement('div');
  modal.id = 'reviewModal';
  modal.className = 'fixed inset-0 z-[80] flex items-center justify-center p-4';
  modal.style.background = 'rgba(0,0,0,0.55)';
  modal.style.backdropFilter = 'blur(4px)';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
         style="animation: bounceIn 0.3s ease">
      <div class="flex items-center justify-between p-5 border-b border-gray-100">
        <h3 class="font-playfair font-bold text-gray-900">Beri Ulasan</h3>
        <button onclick="document.getElementById('reviewModal').remove()"
          class="p-2 rounded-full hover:bg-gray-100 text-gray-400"><i class="fas fa-times"></i></button>
      </div>
      <div class="p-5">
        <p class="text-sm text-gray-700 font-semibold line-clamp-2 mb-1">${productName}</p>
        <p class="text-xs text-gray-400 mb-4">Bagaimana pengalaman kamu dengan produk ini?</p>
        <div class="flex gap-2 justify-center mb-2" id="starRating">
          ${[1,2,3,4,5].map(n => `
            <button type="button" onclick="setStarRating(${n})" data-star="${n}"
              class="star-btn text-3xl transition-colors" style="color:#e5e7eb">
              <i class="fas fa-star"></i>
            </button>`).join('')}
        </div>
        <p id="starLabel" class="text-xs text-center text-gray-400 mb-4">Pilih bintang dulu</p>
        <textarea id="reviewComment" rows="3" placeholder="Ceritakan pengalamanmu (opsional)..."
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm resize-none mb-4"></textarea>
        <p id="reviewError" class="text-xs text-red-500 mb-2 hidden"></p>
        <button id="reviewSubmitBtn" onclick="submitReview(${productId}, ${orderId})"
          class="w-full py-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-md">
          <i class="fas fa-paper-plane mr-2"></i>Kirim Ulasan
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

let selectedRating = 0;

function setStarRating(n) {
  selectedRating = n;
  const labels = ['', 'Jelek 😞', 'Kurang 😐', 'Cukup 🙂', 'Bagus 😊', 'Sangat Bagus ✨'];
  const lbl = document.getElementById('starLabel');
  if (lbl) lbl.textContent = labels[n];
  document.querySelectorAll('#starRating .star-btn').forEach((btn, i) => {
    btn.style.color = i < n ? '#fbbf24' : '#e5e7eb';
  });
}

async function submitReview(productId, orderId) {
  const comment = document.getElementById('reviewComment')?.value.trim();
  const errEl   = document.getElementById('reviewError');
  const btn     = document.getElementById('reviewSubmitBtn');

  if (!selectedRating) {
    errEl.textContent = 'Pilih bintang terlebih dahulu.';
    errEl.classList.remove('hidden');
    return;
  }

  btn.disabled  = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Mengirim...';

  const res = await apiFetch(`${API.reviews}?action=submit`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ product_id: productId, order_id: orderId, rating: selectedRating, comment }),
  });

  if (res.success) {
    document.getElementById('reviewModal')?.remove();
    selectedRating = 0;
    showToast('Ulasan berhasil dikirim! ⭐');
    // Refresh tampilan review item yang baru disubmit
    refreshReviewItem(productId, orderId);
  } else {
    errEl.textContent = res.message;
    errEl.classList.remove('hidden');
    btn.disabled  = false;
    btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Kirim Ulasan';
  }
}

function openProfileModal() {
  if (!currentUser) { openAuthModal('login'); return; }

  document.getElementById('profileAvatar').textContent  = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('profileEmail').textContent   = currentUser.email || '';
  document.getElementById('profileJoined').textContent  = currentUser.created_at
    ? 'Bergabung ' + new Date(currentUser.created_at).toLocaleDateString('id-ID', { month:'long', year:'numeric' })
    : '';
  document.getElementById('profileName').value    = currentUser.name || '';
  document.getElementById('profilePhone').value   = currentUser.phone || '';
  document.getElementById('profileAddress').value = currentUser.address || '';
  document.getElementById('profileInfoError').classList.add('hidden');
  document.getElementById('profilePwdError').classList.add('hidden');
  document.getElementById('profilePwdSuccess').classList.add('hidden');
  document.getElementById('profilePwdForm').reset();
  switchProfileTab('info');

  const overlay = document.getElementById('profileOverlay');
  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closeProfileModal() {
  document.getElementById('profileOverlay').classList.add('hidden');
  document.getElementById('profileOverlay').classList.remove('flex');
  document.body.style.overflow = '';
}

function switchProfileTab(tab) {
  const infoForm = document.getElementById('profileInfoForm');
  const pwdForm  = document.getElementById('profilePwdForm');
  const tabInfo  = document.getElementById('tabProfileInfo');
  const tabPwd   = document.getElementById('tabProfilePwd');
  const active   = 'flex-1 py-4 text-sm font-semibold transition-all border-b-2 border-rose-500 text-rose-600';
  const inactive = 'flex-1 py-4 text-sm font-semibold text-gray-400 hover:text-rose-500 transition-all border-b-2 border-transparent';
  if (tab === 'info') {
    infoForm.classList.remove('hidden'); pwdForm.classList.add('hidden');
    tabInfo.className = active; tabPwd.className = inactive;
  } else {
    infoForm.classList.add('hidden'); pwdForm.classList.remove('hidden');
    tabInfo.className = inactive; tabPwd.className = active;
  }
}

async function saveProfile(e) {
  e.preventDefault();
  const errEl = document.getElementById('profileInfoError');
  const btn   = document.getElementById('profileSaveBtn');
  errEl.classList.add('hidden');
  btn.disabled  = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Menyimpan...';

  const res = await apiFetch(`${API.auth}?action=update_profile`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({
      name   : document.getElementById('profileName').value.trim(),
      phone  : document.getElementById('profilePhone').value.trim(),
      address: document.getElementById('profileAddress').value.trim(),
    }),
  });

  btn.disabled  = false;
  btn.innerHTML = '<i class="fas fa-save mr-2"></i>Simpan Perubahan';

  if (res.success) {
    currentUser = { ...currentUser, ...res.data.user };
    // Update semua tampilan nama di navbar (desktop & mobile)
    const unEl = document.getElementById('userName');
    if (unEl) unEl.textContent = currentUser.name.split(' ')[0];
    // Update avatar inisial di modal profil
    document.getElementById('profileAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
    showToast('Profil berhasil diperbarui! ✅');
    closeProfileModal();
  } else {
    errEl.textContent = res.message;
    errEl.classList.remove('hidden');
  }
}

async function changeProfilePassword(e) {
  e.preventDefault();
  const errEl = document.getElementById('profilePwdError');
  const okEl  = document.getElementById('profilePwdSuccess');
  errEl.classList.add('hidden');
  okEl.classList.add('hidden');

  const oldPw  = document.getElementById('profileOldPwd').value;
  const newPw  = document.getElementById('profileNewPwd').value;
  const confPw = document.getElementById('profileConfirmPwd').value;

  if (newPw !== confPw)  { errEl.textContent = 'Konfirmasi password tidak cocok.'; errEl.classList.remove('hidden'); return; }
  if (newPw.length < 6)  { errEl.textContent = 'Password baru minimal 6 karakter.'; errEl.classList.remove('hidden'); return; }

  const res = await apiFetch(`${API.auth}?action=change_password`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ old_password: oldPw, new_password: newPw }),
  });

  if (res.success) {
    okEl.textContent = '✅ Password berhasil diubah.';
    okEl.classList.remove('hidden');
    document.getElementById('profilePwdForm').reset();
    showToast('Password berhasil diubah!');
  } else {
    errEl.textContent = res.message;
    errEl.classList.remove('hidden');
  }
}

// =============================================
//   Init
// =============================================
(async () => {
  await checkAuth();
  await loadProducts();
})();

// ===== PEMBAYARAN =====

const ckPayment = document.getElementById('ckPayment');

if (ckPayment) {

  ckPayment.addEventListener('change', function () {

    const qrisBox = document.getElementById('qrisPaymentBox');
    const transferBox = document.getElementById('transferInfoBox');

    // Sembunyikan semua dulu
    if (qrisBox) {
      qrisBox.classList.add('hidden');
    }

    if (transferBox) {
      transferBox.classList.add('hidden');
    }

    // QRIS
    if (this.value === 'qris') {
      if (qrisBox) {
        qrisBox.classList.remove('hidden');
      }
    }

    // TRANSFER
    if (this.value === 'transfer') {
      if (transferBox) {
        transferBox.classList.remove('hidden');
      }
    }

  });

}


// ===== PILIH BANK =====

const transferBank = document.getElementById('transferBank');

if (transferBank) {

  transferBank.addEventListener('change', function () {

    const vaInfo = document.getElementById('vaInfo');
    const vaBankName = document.getElementById('vaBankName');
    const vaNumber = document.getElementById('vaNumber');

    const dataVA = {

      bca: {
        name: 'BCA Virtual Account',
        number: '1234567890123456'
      },

      bni: {
        name: 'BNI Virtual Account',
        number: '8808123456789012'
      },

      bri: {
        name: 'BRI Virtual Account',
        number: '8888123456789012'
      },

      mandiri: {
        name: 'Mandiri Virtual Account',
        number: '8900812345678901'
      },

      cimb: {
        name: 'CIMB Niaga Virtual Account',
        number: '1234567890123456'
      }

    };

    const bank = dataVA[this.value];

    if (bank) {

      vaInfo.classList.remove('hidden');

      vaBankName.textContent = bank.name;

      vaNumber.textContent = bank.number;

    } else {

      vaInfo.classList.add('hidden');

    }

  });

}


// ===== COPY VA =====

function copyVANumber() {

  const vaNumber = document.getElementById('vaNumber');

  if (!vaNumber || !vaNumber.textContent) {
    showToast('Pilih bank terlebih dahulu!');
    return;
  }

  navigator.clipboard.writeText(vaNumber.textContent);

  showToast('Nomor VA berhasil disalin!');

}