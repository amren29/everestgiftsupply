// ===== CONFIG =====
var PRODUCTS_PER_PAGE = 30;
var WHATSAPP_PHONE = '60123456789';

// ===== CART STATE =====
var cart = JSON.parse(localStorage.getItem('everest_cart')) || [];

function saveCart() {
  localStorage.setItem('everest_cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  var counts = document.querySelectorAll('.cart-count');
  var total = cart.reduce(function(sum, item) { return sum + item.qty; }, 0);
  counts.forEach(function(el) {
    el.textContent = total;
    el.style.display = total > 0 ? 'flex' : 'none';
  });
}

function parsePrice(priceStr) {
  var match = String(priceStr).match(/[\d]+\.?\d*/);
  return match ? parseFloat(match[0]) : 0;
}

function addToCart(productId, qty) {
  qty = qty || 1;
  var product = getProduct(productId);
  if (!product) return;

  var existing = cart.find(function(item) { return item.id === productId; });
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, priceNum: parsePrice(product.price), category: product.category, image: product.image, qty: qty });
  }
  saveCart();
  showToast(product.name + ' added to quotation list');
}

function removeFromCart(productId) {
  cart = cart.filter(function(item) { return item.id !== productId; });
  saveCart();
  renderCartItems();
}

function updateCartQty(productId, delta) {
  var item = cart.find(function(i) { return i.id === productId; });
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  renderCartItems();
}

// ===== CART SIDEBAR =====
function openCart() {
  document.getElementById('cartOverlay').classList.add('open');
  document.getElementById('cartSidebar').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCartItems();
}

function closeCart() {
  document.getElementById('cartOverlay').classList.remove('open');
  document.getElementById('cartSidebar').classList.remove('open');
  document.body.style.overflow = '';
}

function renderCartItems() {
  var container = document.getElementById('cartItems');
  var footer = document.getElementById('cartFooter');

  if (cart.length === 0) {
    container.innerHTML = '<div class="cart-empty"><div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div><p>Your quotation list is empty</p></div>';
    footer.style.display = 'none';
    return;
  }

  footer.style.display = 'block';
  var totalQty = cart.reduce(function(sum, item) { return sum + item.qty; }, 0);

  var grandTotal = 0;
  container.innerHTML = cart.map(function(item) {
    var icon = CATEGORY_ICONS[item.category] || '';
    var unitPrice = item.priceNum || parsePrice(item.price);
    var lineTotal = unitPrice * item.qty;
    grandTotal += lineTotal;
    return '<div class="cart-item">' +
      '<div class="cart-item-img">' + (item.image ? '<img src="' + item.image + '" alt="' + item.name + '">' : icon) + '</div>' +
      '<div class="cart-item-details">' +
        '<h4>' + item.name + '</h4>' +
        '<div class="cart-item-price">RM ' + unitPrice.toFixed(2) + ' x ' + item.qty + ' = <strong>RM ' + lineTotal.toFixed(2) + '</strong></div>' +
        '<div class="cart-item-qty">' +
          '<button onclick="updateCartQty(' + item.id + ', -1)">-</button>' +
          '<span>' + item.qty + '</span>' +
          '<button onclick="updateCartQty(' + item.id + ', 1)">+</button>' +
        '</div>' +
      '</div>' +
      '<button class="cart-item-remove" onclick="removeFromCart(' + item.id + ')">&#10005;</button>' +
    '</div>';
  }).join('');

  document.getElementById('cartTotal').textContent = totalQty + ' item(s) — Est. RM ' + grandTotal.toFixed(2);
}

// ===== WHATSAPP QUOTATION =====
function sendWhatsApp() {
  if (cart.length === 0) return;
  var message = 'Hi Everest Gift Supply! I would like to request a quotation for the following items:%0A%0A';
  var waTotal = 0;
  cart.forEach(function(item) {
    var unitPrice = item.priceNum || parsePrice(item.price);
    var lineTotal = unitPrice * item.qty;
    waTotal += lineTotal;
    message += '• ' + item.name + ' - Qty: ' + item.qty + ' (RM ' + unitPrice.toFixed(2) + ' x ' + item.qty + ' = RM ' + lineTotal.toFixed(2) + ')%0A';
  });
  message += '%0AEstimated Total: RM ' + waTotal.toFixed(2) + '%0A%0APlease provide confirmed pricing and availability. Thank you!';
  window.open('https://wa.me/' + WHATSAPP_PHONE + '?text=' + message, '_blank');
}

// ===== DOWNLOAD QUOTATION =====
function downloadQuotation() {
  if (cart.length === 0) return;

  var date = new Date().toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' });
  var refNo = 'EG-' + Date.now().toString(36).toUpperCase();

  var rows = '';
  var dlTotal = 0;
  cart.forEach(function(item, i) {
    var unitPrice = item.priceNum || parsePrice(item.price);
    var lineTotal = unitPrice * item.qty;
    dlTotal += lineTotal;
    rows += '<tr><td>' + (i + 1) + '</td><td>' + item.name + '</td><td>' + item.category + '</td><td>' + item.qty + '</td><td>RM ' + unitPrice.toFixed(2) + '</td><td>RM ' + lineTotal.toFixed(2) + '</td></tr>';
  });
  rows += '<tr style="font-weight:700;background:#e8f4fc"><td colspan="5" style="text-align:right">Estimated Total</td><td>RM ' + dlTotal.toFixed(2) + '</td></tr>';

  var html = '<!DOCTYPE html><html><head><title>Quotation Request - Everest Gift Supply</title><style>' +
    'body{font-family:Segoe UI,sans-serif;padding:40px;color:#1e293b;max-width:800px;margin:0 auto}' +
    '.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;border-bottom:2px solid #0c7ec2;padding-bottom:16px}' +
    '.logo-text{font-size:20px;font-weight:700;color:#1e293b}' +
    '.logo-text span{color:#0c7ec2}' +
    '.meta{text-align:right;font-size:12px;color:#64748b}' +
    'h2{color:#1e293b;font-size:16px;margin-bottom:14px}' +
    'table{width:100%;border-collapse:collapse;margin-bottom:24px}' +
    'th{background:#1e293b;color:#fff;padding:10px 14px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.3px}' +
    'td{padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px}' +
    'tr:nth-child(even){background:#f8fafc}' +
    '.note{background:#f8fafc;padding:16px;border:1px solid #e2e8f0;font-size:12px;color:#64748b;line-height:1.7}' +
    '.footer{margin-top:32px;text-align:center;color:#94a3b8;font-size:11px;border-top:1px solid #e2e8f0;padding-top:14px}' +
    '@media print{body{padding:20px}}' +
    '</style></head><body>' +
    '<div class="header"><div><div class="logo-text">EVEREST<span>GIFT</span></div><div style="font-size:12px;color:#64748b">Corporate & Wholesale Gift Supplier</div></div>' +
    '<div class="meta"><div><strong>Quotation Request</strong></div><div>Ref: ' + refNo + '</div><div>Date: ' + date + '</div></div></div>' +
    '<h2>Quotation Request</h2>' +
    '<table><thead><tr><th>#</th><th>Product</th><th>Category</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<div class="note"><strong>Note:</strong><br>• Prices shown are estimated starting prices. Final pricing depends on quantity, customization, and material selected.<br>• Please contact us for an official quotation with confirmed pricing.<br>• Minimum order quantities may apply.</div>' +
    '<div class="footer">Everest Gift Supply | Corporate & Wholesale Gift Supplier<br>This is a quotation request, not a confirmed order.</div>' +
    '</body></html>';

  var blob = new Blob([html], { type: 'text/html' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'Everest_Gift_Quotation_' + refNo + '.html';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Quotation downloaded!');
}

// ===== TOAST NOTIFICATION =====
function showToast(message) {
  var toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 2500);
}

// ===== MOBILE NAV =====
function toggleMobileNav() {
  document.getElementById('navLinks').classList.toggle('open');
}

// ===== RENDER PRODUCT CARDS =====
function renderProductCards(containerId, products, limit) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var items = limit ? products.slice(0, limit) : products;

  if (items.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px 0;color:#64748b;grid-column:1/-1">No products found.</div>';
    return;
  }

  container.innerHTML = items.map(function(product) {
    var icon = CATEGORY_ICONS[product.category] || '';
    return '<div class="product-card">' +
      '<a href="product-detail.html?id=' + product.id + '">' +
        '<div class="product-card-img">' + (product.image ? '<img src="' + product.image + '" alt="' + product.name + '">' : icon) + '</div>' +
      '</a>' +
      '<div class="product-card-body">' +
        '<div class="product-card-category">' + product.category + '</div>' +
        '<h3><a href="product-detail.html?id=' + product.id + '">' + product.name + '</a></h3>' +
        '<p>' + product.description + '</p>' +
        '<div class="product-card-footer">' +
          '<span class="product-price">' + product.price + '</span>' +
          '<button class="btn btn-primary btn-sm" onclick="addToCart(' + product.id + ')">Add to List</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ===== PAGINATION =====
var currentPage = 1;
var currentCategory = 'All';
var currentSearch = '';

function getFilteredProducts() {
  var filtered = PRODUCTS;
  if (currentCategory !== 'All') {
    filtered = filtered.filter(function(p) { return p.category === currentCategory; });
  }
  if (currentSearch) {
    var q = currentSearch.toLowerCase().trim();
    var keywords = q.split(/\s+/);
    filtered = filtered.filter(function(p) {
      var searchable = (p.name + ' ' + p.code + ' ' + p.description + ' ' + p.category + ' ' + p.price).toLowerCase();
      // All keywords must match
      return keywords.every(function(kw) {
        return searchable.indexOf(kw) !== -1;
      });
    });
  }
  return filtered;
}

function renderPaginated() {
  var filtered = getFilteredProducts();
  var totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  var start = (currentPage - 1) * PRODUCTS_PER_PAGE;
  var pageItems = filtered.slice(start, start + PRODUCTS_PER_PAGE);

  renderProductCards('productGrid', pageItems);
  renderPagination(totalPages);
  updateProductCount(filtered.length, currentCategory !== 'All' ? currentCategory : '');
}

function renderPagination(totalPages) {
  var container = document.getElementById('pagination');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  var html = '';

  // Prev
  html += '<button class="page-btn' + (currentPage === 1 ? ' disabled' : '') + '" onclick="goToPage(' + (currentPage - 1) + ')">&lsaquo; Prev</button>';

  // Page numbers
  var startPage = Math.max(1, currentPage - 2);
  var endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

  if (startPage > 1) {
    html += '<button class="page-btn" onclick="goToPage(1)">1</button>';
    if (startPage > 2) html += '<span class="page-dots">...</span>';
  }

  for (var i = startPage; i <= endPage; i++) {
    html += '<button class="page-btn' + (i === currentPage ? ' active' : '') + '" onclick="goToPage(' + i + ')">' + i + '</button>';
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += '<span class="page-dots">...</span>';
    html += '<button class="page-btn" onclick="goToPage(' + totalPages + ')">' + totalPages + '</button>';
  }

  // Next
  html += '<button class="page-btn' + (currentPage === totalPages ? ' disabled' : '') + '" onclick="goToPage(' + (currentPage + 1) + ')">Next &rsaquo;</button>';

  container.innerHTML = html;
}

function goToPage(page) {
  var filtered = getFilteredProducts();
  var totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE) || 1;
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderPaginated();
  // Scroll to top of products
  var grid = document.getElementById('productGrid');
  if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== FILTER PRODUCTS =====
function filterProducts(category, e) {
  document.querySelectorAll('.sidebar-filter').forEach(function(btn) { btn.classList.remove('active'); });
  var target = e ? (e.target || e.srcElement) : null;
  if (target) target.classList.add('active');
  currentCategory = category;
  currentPage = 1;
  renderPaginated();
}

// ===== SEARCH =====
function searchProducts(query) {
  currentSearch = query;
  currentPage = 1;
  renderPaginated();
}

function updateProductCount(count, category) {
  var countEl = document.getElementById('productCount');
  if (countEl) {
    var text = count + ' product' + (count !== 1 ? 's' : '');
    if (category) text += ' in ' + category;
    if (currentSearch) text += ' matching "' + currentSearch + '"';
    countEl.textContent = text;
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  updateCartCount();

  // Cart button listeners
  document.querySelectorAll('.cart-icon').forEach(function(btn) { btn.addEventListener('click', openCart); });
  var overlay = document.getElementById('cartOverlay');
  if (overlay) overlay.addEventListener('click', closeCart);
  var closeBtn = document.getElementById('cartClose');
  if (closeBtn) closeBtn.addEventListener('click', closeCart);

  // Mobile nav
  var hamburger = document.getElementById('hamburger');
  if (hamburger) hamburger.addEventListener('click', toggleMobileNav);

  // Close mobile nav on link click
  document.querySelectorAll('.nav-links a').forEach(function(link) {
    link.addEventListener('click', function() {
      var navLinks = document.getElementById('navLinks');
      if (navLinks) navLinks.classList.remove('open');
    });
  });

  // Search input
  var searchInput = document.getElementById('productSearch');
  if (searchInput) {
    var debounceTimer;
    searchInput.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      var val = searchInput.value;
      debounceTimer = setTimeout(function() { searchProducts(val); }, 250);
    });
  }
});
