const API = 'http://localhost:4000/api';
let cart = [];
let currentUser = null;
let lastSaleId = null;
let currentCategory = 'all';
let pinResolve = null;

// ── Auth helpers ──
function token() { return localStorage.getItem('bb_token'); }
function authHeaders() { return { 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' }; }

function setUser(user, tok) {
    currentUser = user;
    if (tok) localStorage.setItem('bb_token', tok);
    document.getElementById('user-display').textContent = user ? `👤 ${user.username} (${user.role})` : '';
    document.getElementById('logout-btn').style.display = user ? 'inline-block' : 'none';
    document.getElementById('admin-login-btn').style.display = user ? 'none' : 'inline-block';
    document.getElementById('cashier-login-btn').style.display = user ? 'none' : 'inline-block';
    document.getElementById('admin-panel').style.display = user?.role === 'admin' ? 'block' : 'none';
    document.getElementById('product-form-card').style.display = user ? 'block' : 'none';
    // Cashiers can't add/edit/delete products
    const productFormBtns = document.querySelector('#product-form .btn-primary');
    if (productFormBtns) productFormBtns.style.display = user?.role === 'admin' ? 'block' : 'none';
    if (user?.role === 'admin') loadCashiers();
    loadProducts();
    loadSales();
    loadSummary();
}

// ── API calls ──
async function api(method, path, body) {
    const res = await fetch(`${API}${path}`, {
        method,
        headers: authHeaders(),
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// ── Products ──
async function loadProducts() {
    if (!token()) { document.getElementById('products-tbody').innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999">Please login to view products</td></tr>'; return; }
    try {
        const search = document.getElementById('product-search').value.trim();
        let url = `/products?category=${currentCategory}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        const products = await api('GET', url);
        renderProducts(products);
        document.getElementById('products-count').textContent = `${products.length} items`;
        document.getElementById('summary-products').textContent = products.reduce((s, p) => s + p.quantity, 0);
    } catch (e) { console.error(e); }
}

function renderProducts(products) {
    const tbody = document.getElementById('products-tbody');
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:20px">No products found</td></tr>';
        return;
    }
    tbody.innerHTML = products.map(p => `
        <tr>
            <td><strong>${p.name}</strong></td>
            <td>${p.category}</td>
            <td>KSh ${parseFloat(p.price).toFixed(2)}</td>
            <td><span style="color:${p.quantity < 5 ? '#dc3545' : '#28a745'};font-weight:700">${p.quantity}</span></td>
            <td>${p.variant || '—'}</td>
            <td>
                <div class="actions-cell">
                    <button class="btn btn-primary btn-sm" onclick="addToCart(${p.id},'${escHtml(p.name)}',${p.price},${p.quantity})">+ Cart</button>
                    ${currentUser?.role === 'admin' ? `
                        <button class="btn btn-outline btn-sm" onclick="editProduct(${p.id},'${escHtml(p.name)}',${p.price},${p.quantity},'${escHtml(p.variant||'')}','${p.category}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Del</button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function escHtml(str) { return String(str).replace(/'/g, "\\'"); }

async function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('product-id').value;
    const data = {
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        quantity: parseInt(document.getElementById('product-qty').value),
        variant: document.getElementById('product-variant').value,
        category: document.getElementById('product-category').value
    };
    try {
        if (id) { await api('PUT', `/products/${id}`, data); }
        else { await api('POST', '/products', data); }
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
        document.getElementById('form-mode').textContent = 'New product';
        document.getElementById('cancel-edit-btn').style.display = 'none';
        loadProducts();
    } catch (e) { alert('❌ ' + e.message); }
}

function editProduct(id, name, price, qty, variant, category) {
    document.getElementById('product-id').value = id;
    document.getElementById('product-name').value = name;
    document.getElementById('product-price').value = price;
    document.getElementById('product-qty').value = qty;
    document.getElementById('product-variant').value = variant;
    document.getElementById('product-category').value = category;
    document.getElementById('form-mode').textContent = 'Editing product';
    document.getElementById('cancel-edit-btn').style.display = 'inline-block';
    document.getElementById('product-form-card').scrollIntoView({ behavior: 'smooth' });
}

async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    try { await api('DELETE', `/products/${id}`); loadProducts(); }
    catch (e) { alert('❌ ' + e.message); }
}

// ── Cart ──
function addToCart(id, name, price, stock) {
    if (!currentUser) { alert('Please login first'); return; }
    const existing = cart.find(i => i.id === id);
    if (existing) {
        if (existing.qty >= stock) { alert('Not enough stock'); return; }
        existing.qty++;
    } else {
        if (stock < 1) { alert('Out of stock'); return; }
        cart.push({ id, name, price, qty: 1, stock });
    }
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cart-list');
    if (cart.length === 0) {
        list.innerHTML = '<p class="muted" style="text-align:center;padding:16px">Cart is empty</p>';
        document.getElementById('cart-count').textContent = '0 items';
        document.getElementById('cart-total').textContent = '0.00';
        return;
    }
    list.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div>
                <div class="name">${item.name}</div>
                <div class="muted">KSh ${item.price.toFixed(2)} each</div>
            </div>
            <div class="qty-controls">
                <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
                <span>${item.qty}</span>
                <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
                <button class="qty-btn" style="background:#dc3545" onclick="removeFromCart(${item.id})">✕</button>
            </div>
        </div>
    `).join('');
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    document.getElementById('cart-total').textContent = total.toFixed(2);
    document.getElementById('cart-count').textContent = `${cart.reduce((s,i)=>s+i.qty,0)} items`;
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty > item.stock) { item.qty = item.stock; alert('Max stock reached'); }
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    renderCart();
}

function removeFromCart(id) { cart = cart.filter(i => i.id !== id); renderCart(); }

async function checkout() {
    if (cart.length === 0) { alert('Cart is empty'); return; }
    if (!currentUser) { alert('Please login first'); return; }
    const pin = await requestPin();
    if (!pin) return;
    try {
        const result = await api('POST', '/sales/checkout', {
            items: cart.map(i => ({ id: i.id, qty: i.qty, name: i.name })),
            payment_method: document.getElementById('payment-method').value
        });
        lastSaleId = result.saleId;
        alert(`✅ Sale complete!\nTotal: KSh ${parseFloat(result.total).toFixed(2)}\nSale #${result.saleId}`);
        cart = [];
        renderCart();
        loadProducts();
        loadSales();
        loadSummary();
    } catch (e) { alert('❌ ' + e.message); }
}

// ── PIN ──
function requestPin() {
    return new Promise(resolve => {
        pinResolve = resolve;
        let pin = '';
        const modal = document.getElementById('pin-modal');
        const display = document.getElementById('pin-display');
        modal.classList.add('active');
        const update = () => { display.textContent = pin.length ? '●'.repeat(pin.length) + '_'.repeat(4 - pin.length) : '_ _ _ _'; };
        update();
        document.querySelectorAll('.pin-key[data-digit]').forEach(btn => {
            btn.onclick = () => { if (pin.length < 4) { pin += btn.dataset.digit; update(); } };
        });
        document.getElementById('pin-clear').onclick = () => { pin = ''; update(); };
        document.getElementById('pin-backspace').onclick = () => { pin = pin.slice(0, -1); update(); };
        document.getElementById('pin-confirm').onclick = () => {
            if (pin.length < 4) { alert('Enter 4-digit PIN'); return; }
            modal.classList.remove('active');
            resolve(pin);
        };
        document.getElementById('pin-cancel').onclick = () => { modal.classList.remove('active'); resolve(null); };
    });
}

// ── Sales ──
async function loadSales() {
    if (!token()) return;
    try {
        const sales = await api('GET', '/sales?limit=15');
        const list = document.getElementById('sales-list');
        if (sales.length === 0) { list.innerHTML = '<p class="muted" style="text-align:center;padding:16px">No sales yet</p>'; return; }
        list.innerHTML = sales.map(s => `
            <div class="sale-entry">
                <div class="sale-top">
                    <span>#${s.id} — KSh ${parseFloat(s.total).toFixed(2)}</span>
                    <span class="muted">${new Date(s.created_at).toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
                <div class="sale-items">${s.items_summary || '—'} · ${s.cashier_name || 'unknown'} · ${s.payment_method}</div>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
}

async function loadSummary() {
    if (!token()) return;
    try {
        const s = await api('GET', '/sales/summary');
        document.getElementById('summary-sales').textContent = s.total_transactions || 0;
        document.getElementById('summary-revenue').textContent = `KSh ${parseFloat(s.total_revenue || 0).toFixed(0)}`;
    } catch (e) {}
}

async function printLast() {
    if (!lastSaleId) { alert('No recent sale to print'); return; }
    try {
        const { sale, items } = await api('GET', `/sales/${lastSaleId}`);
        const win = window.open('', '_blank', 'width=400,height=600');
        win.document.write(`
            <html><head><title>Receipt</title>
            <style>body{font-family:monospace;padding:20px;max-width:300px;margin:auto}
            h2{text-align:center}hr{border:1px dashed #ccc}.total{font-weight:bold;font-size:1.2rem}</style>
            </head><body>
            <h2>Ben's Beauty</h2><p style="text-align:center">Skincare & Cosmetics</p><hr>
            <p>Receipt #${sale.id}<br>Date: ${new Date(sale.created_at).toLocaleString()}<br>Cashier: ${sale.cashier_name}</p><hr>
            ${items.map(i=>`<p>${i.product_name} x${i.quantity} — KSh ${parseFloat(i.subtotal).toFixed(2)}</p>`).join('')}
            <hr><p class="total">TOTAL: KSh ${parseFloat(sale.total).toFixed(2)}</p>
            <p>Payment: ${sale.payment_method}</p><hr>
            <p style="text-align:center">Thank you for shopping!<br>+254 748 648 015</p>
            </body></html>`);
        win.print();
    } catch (e) { alert('❌ ' + e.message); }
}

// ── Auth ──
async function loginAs(role, username, password, errorEl) {
    try {
        const data = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        }).then(r => r.json());
        if (data.error) throw new Error(data.error);
        if (data.user.role !== role) throw new Error(`This account is not a ${role}`);
        setUser(data.user, data.token);
        return true;
    } catch (e) {
        document.getElementById(errorEl).textContent = e.message;
        document.getElementById(errorEl).style.display = 'block';
        return false;
    }
}

async function loadCashiers() {
    try {
        const cashiers = await api('GET', '/auth/cashiers');
        const list = document.getElementById('cashier-list');
        const sel = document.getElementById('change-password-user');
        list.innerHTML = cashiers.length === 0 ? '<p class="muted">No cashiers yet</p>' :
            cashiers.map(c => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f5eef3">
                    <span>👤 ${c.username}</span>
                    <button class="btn btn-danger btn-sm" onclick="deleteCashier(${c.id},'${c.username}')">Remove</button>
                </div>`).join('');
        sel.innerHTML = cashiers.map(c => `<option value="${c.id}">${c.username}</option>`).join('');
    } catch (e) {}
}

async function deleteCashier(id, name) {
    if (!confirm(`Remove cashier "${name}"?`)) return;
    try { await api('DELETE', `/auth/cashiers/${id}`); loadCashiers(); }
    catch (e) { alert('❌ ' + e.message); }
}

// ── Event listeners ──
document.getElementById('product-form').addEventListener('submit', saveProduct);

document.getElementById('cancel-edit-btn').addEventListener('click', () => {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('form-mode').textContent = 'New product';
    document.getElementById('cancel-edit-btn').style.display = 'none';
});

document.getElementById('checkout-btn').addEventListener('click', checkout);
document.getElementById('clear-cart-btn').addEventListener('click', () => { cart = []; renderCart(); });
document.getElementById('print-last-btn').addEventListener('click', printLast);
document.getElementById('refresh-sales-btn').addEventListener('click', loadSales);

document.getElementById('search-btn').addEventListener('click', loadProducts);
document.getElementById('product-search').addEventListener('keydown', e => { if (e.key === 'Enter') loadProducts(); });

document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.cat;
        loadProducts();
    });
});

// Admin login
document.getElementById('admin-login-btn').addEventListener('click', () => {
    document.getElementById('admin-login-modal').classList.add('active');
});
document.getElementById('admin-login-cancel').addEventListener('click', () => {
    document.getElementById('admin-login-modal').classList.remove('active');
});
document.getElementById('admin-login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const ok = await loginAs('admin',
        document.getElementById('admin-username').value,
        document.getElementById('admin-password').value,
        'admin-login-error'
    );
    if (ok) { document.getElementById('admin-login-modal').classList.remove('active'); document.getElementById('admin-login-form').reset(); }
});

// Cashier login
document.getElementById('cashier-login-btn').addEventListener('click', () => {
    document.getElementById('cashier-login-modal').classList.add('active');
});
document.getElementById('cashier-login-cancel').addEventListener('click', () => {
    document.getElementById('cashier-login-modal').classList.remove('active');
});
document.getElementById('cashier-login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const ok = await loginAs('cashier',
        document.getElementById('cashier-username-login').value,
        document.getElementById('cashier-password-login').value,
        'cashier-login-error'
    );
    if (ok) { document.getElementById('cashier-login-modal').classList.remove('active'); document.getElementById('cashier-login-form').reset(); }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('bb_token');
    setUser(null, null);
    cart = [];
    renderCart();
});

// Create cashier
document.getElementById('create-cashier-form').addEventListener('submit', async e => {
    e.preventDefault();
    try {
        await api('POST', '/auth/cashiers', {
            username: document.getElementById('cashier-username').value,
            password: document.getElementById('cashier-password').value
        });
        document.getElementById('create-cashier-form').reset();
        loadCashiers();
        alert('✅ Cashier created');
    } catch (e) { alert('❌ ' + e.message); }
});

// Change password
document.getElementById('change-password-form').addEventListener('submit', async e => {
    e.preventDefault();
    const np = document.getElementById('change-password-new').value;
    try {
        await api('PUT', '/auth/password', {
            userId: document.getElementById('change-password-user').value,
            newPassword: np
        });
        document.getElementById('change-password-form').reset();
        alert('✅ Password updated');
    } catch (e) { alert('❌ ' + e.message); }
});

// ── Init ──
const savedToken = localStorage.getItem('bb_token');
if (savedToken) {
    try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
            setUser({ id: payload.id, username: payload.username, role: payload.role }, null);
        } else {
            localStorage.removeItem('bb_token');
        }
    } catch { localStorage.removeItem('bb_token'); }
}
renderCart();
