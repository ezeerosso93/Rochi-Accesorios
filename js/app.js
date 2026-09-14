'use strict';
const SUPABASE_URL = 'https://krbedelskftedoxqsmib.supabase.co';
const SUPABASE_KEY = 'sb_publishable__ILuKmKH3_IpjxYrbDbUqg_oAOjygV0';

let db;
try {
    if (typeof supabase !== 'undefined') {
        db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else {
        console.error('Supabase library not loaded!');
    }
} catch (e) {
    console.error('Error initializing Supabase:', e);
}

// Default categories (used before DB loads)
const DEFAULT_CATS = [
    { id: 'makeup', slug: 'makeup', name: 'Maquillaje', emoji: '💄', sort_order: 1 },
    { id: 'nails', slug: 'nails', name: 'Uñas & Cejas', emoji: '💅', sort_order: 2 },
    { id: 'skincare', slug: 'skincare', name: 'Estética Facial', emoji: '🧴', sort_order: 3 },
    { id: 'clothes', slug: 'clothes', name: 'Ropa Mujer', emoji: '👗', sort_order: 4 },
    { id: 'gifts', slug: 'gifts', name: 'Regalería', emoji: '🎁', sort_order: 5 },
];
const DEFAULT_PRODS = [
    { id: 1, name: 'Labial Mate Rojo Pasión', category_slug: 'makeup', price: 2800, old_price: 3500, emoji: '💄', badge: 'sale' },
    { id: 2, name: 'Paleta de Sombras Doradas', category_slug: 'makeup', price: 4500, old_price: null, emoji: '👁️', badge: 'new' },
    { id: 3, name: 'Base de Maquillaje Cobertura Total', category_slug: 'makeup', price: 3200, old_price: 4000, emoji: '✨', badge: 'sale' },
    { id: 4, name: 'Set de Brochas Profesionales', category_slug: 'makeup', price: 5800, old_price: null, emoji: '🖌️', badge: null },
    { id: 5, name: 'Iluminador en Polvo Rosado', category_slug: 'makeup', price: 2200, old_price: null, emoji: '🌟', badge: 'new' },
    { id: 6, name: 'Kit Esmaltes Semipermanentes', category_slug: 'nails', price: 4800, old_price: 6000, emoji: '💅', badge: 'sale' },
    { id: 7, name: 'Set de Diseño de Cejas', category_slug: 'nails', price: 2100, old_price: null, emoji: '🦋', badge: null },
    { id: 8, name: 'Nail Art Decoraciones', category_slug: 'nails', price: 1800, old_price: null, emoji: '🌸', badge: 'new' },
    { id: 9, name: 'Kit Limpieza Facial Completo', category_slug: 'skincare', price: 5500, old_price: 7000, emoji: '🧴', badge: 'sale' },
    { id: 10, name: 'Mascarilla de Arcilla Rosa', category_slug: 'skincare', price: 2800, old_price: null, emoji: '🌷', badge: null },
    { id: 11, name: 'Contorno de Ojos Reparador', category_slug: 'skincare', price: 3900, old_price: null, emoji: '👀', badge: 'new' },
    { id: 12, name: 'Remera Floral Romántica', category_slug: 'clothes', price: 3500, old_price: 4500, emoji: '👗', badge: 'sale' },
    { id: 13, name: 'Blusa Satinada Nude', category_slug: 'clothes', price: 4800, old_price: null, emoji: '✨', badge: 'new' },
    { id: 14, name: 'Conjunto Deportivo Pastel', category_slug: 'clothes', price: 6200, old_price: 8000, emoji: '🏃‍♀️', badge: 'sale' },
    { id: 15, name: 'Taza Sublimada Personalizada', category_slug: 'gifts', price: 2500, old_price: null, emoji: '☕', badge: null },
    { id: 16, name: 'Cuadro de Madera Láser', category_slug: 'gifts', price: 4200, old_price: null, emoji: '🪵', badge: 'new' },
    { id: 17, name: 'Remera Personalizada', category_slug: 'gifts', price: 3800, old_price: null, emoji: '👕', badge: null },
    { id: 18, name: 'Kit Regalo Luxe', category_slug: 'gifts', price: 7500, old_price: 9500, emoji: '🎁', badge: 'sale' },
];

let cart = JSON.parse(localStorage.getItem('rochi_cart') || '[]');
let currentUser = null;
let activeFilter = 'all';
let currentPage = 'home';
let allCats = [...DEFAULT_CATS];
let allProds = [...DEFAULT_PRODS];

// ===== AUTH =====
if (db) {
    db.auth.onAuthStateChange((_, s) => { currentUser = s?.user || null; updateAuthUI(); });
}
async function initAuth() {
    if (!db) return;
    const { data: { session: s } } = await db.auth.getSession();
    currentUser = s?.user || null;
    updateAuthUI();
}
function updateAuthUI() {
    const chip = document.getElementById('userChip'), nn = document.getElementById('userChipName'), ml = document.getElementById('mobileAuthLink');
    if (currentUser) { const n = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0]; nn.textContent = n; if (chip) chip.classList.add('visible'); if (ml) ml.textContent = 'Cerrar Sesión'; }
    else { if (chip) chip.classList.remove('visible'); if (ml) ml.textContent = 'Mi Cuenta'; }
}

// ===== LOAD FROM DB =====
async function loadCatsFromDB() {
    if (!db) return;
    const { data, error } = await db.from('categories').select('*').order('sort_order');
    if (!error && data && data.length > 0) allCats = data.map(c => ({ ...c, slug: c.slug || String(c.id) }));
    refreshCategoryUI();
}
async function loadProdsFromDB() {
    if (!db) return;
    const { data, error } = await db.from('products').select('*').order('id');
    if (!error && data && data.length > 0) allProds = data.map(p => ({ ...p, old_price: p.old_price ? Number(p.old_price) : null, transfer_price: p.transfer_price ? Number(p.transfer_price) : null, badge: p.badge || null, description: p.description || '' }));
    renderFeaturedProducts();
    if (currentPage === 'products') renderAllProducts();
}
function refreshCategoryUI() {
    renderCatStrip(); renderNavDropdown(); renderFilterTabs(); renderFooterCats();
}
async function loadSettingsFromDB() {
    if (!db) {
        const bar = document.getElementById('announcementBar');
        if (bar) bar.textContent = 'Bienvenido a Rochi Accesorios';
        return;
    }
    const { data, error } = await db.from('site_settings').select('*');
    if (!error && data) {
        data.forEach(s => {
            if (s.key === 'announcement_banner') {
                const el = document.getElementById('announcementBar');
                if (el) el.textContent = s.value;
                const input = document.getElementById('setBannerText');
                if (input) input.value = s.value;
            }
            if (s.key === 'admin_email') { const el = document.getElementById('setAdminEmail'); if (el) el.value = s.value; }
            if (s.key === 'email_subject') { const el = document.getElementById('setEmailSubject'); if (el) el.value = s.value; }
            if (s.key === 'email_template') { const el = document.getElementById('setEmailTemplate'); if (el) el.value = s.value; }
            if (s.key === 'emailjs_public_key') { const el = document.getElementById('setEmailJSKey'); if (el) el.value = s.value; }
            if (s.key === 'emailjs_service_id') { const el = document.getElementById('setEmailJSService'); if (el) el.value = s.value; }
            if (s.key === 'emailjs_template_id') { const el = document.getElementById('setEmailJSTemplate'); if (el) el.value = s.value; }
            if (s.key === 'contact_email') {
                const input = document.getElementById('setContactEmail'); if (input) input.value = s.value;
                const fEl = document.getElementById('footerContactEmail'); if (fEl) fEl.textContent = s.value;
                const pEl = document.getElementById('contactPageEmail'); if (pEl) pEl.textContent = s.value;
            }
            if (s.key === 'contact_phone') {
                const input = document.getElementById('setContactPhone'); if (input) input.value = s.value;
                const fEl = document.getElementById('footerContactPhone'); if (fEl) fEl.textContent = s.value;
                const pEl = document.getElementById('contactPagePhone'); if (pEl) pEl.textContent = s.value;
                const waEl = document.getElementById('contactSocialWa');
                if (waEl && s.value) {
                    const cleanPhone = s.value.replace(/[^0-9]/g, '');
                    waEl.href = cleanPhone ? `https://wa.me/${cleanPhone}` : '#';
                }
            }
            if (s.key === 'contact_address') {
                const input = document.getElementById('setContactAddress'); if (input) input.value = s.value;
                const fEl = document.getElementById('footerContactAddress'); if (fEl) fEl.textContent = s.value;
                const pEl = document.getElementById('contactPageAddress'); if (pEl) pEl.textContent = s.value;
            }
            if (s.key === 'contact_schedule') {
                const input = document.getElementById('setContactSchedule'); if (input) input.value = s.value;
                const fEl = document.getElementById('footerContactSchedule'); if (fEl) fEl.textContent = s.value;
                const pEl = document.getElementById('contactPageSchedule'); if (pEl) pEl.textContent = s.value;
            }
            if (s.key === 'contact_instagram') {
                const input = document.getElementById('setContactInstagram'); if (input) input.value = s.value;
                const el = document.getElementById('contactSocialInsta'); if (el && s.value) el.href = s.value;
            }
            if (s.key === 'contact_facebook') {
                const input = document.getElementById('setContactFacebook'); if (input) input.value = s.value;
                const el = document.getElementById('contactSocialFb'); if (el && s.value) el.href = s.value;
            }
            if (s.key === 'about_story') {
                const input = document.getElementById('setAboutStory'); if (input) input.value = s.value;
                const el = document.getElementById('aboutStoryText'); if (el) el.textContent = s.value;
            }
        });
    }
    const initField = (inputId, elId, def) => {
        const inp = document.getElementById(inputId);
        if (inp && !inp.value) inp.value = document.getElementById(elId)?.textContent.trim() || def;
    };
    initField('setContactEmail', 'footerContactEmail', 'info@rochiaccesorios.com.ar');
    initField('setContactPhone', 'footerContactPhone', '+54 9 11 2345-6789');
    initField('setContactAddress', 'footerContactAddress', 'Río Grande, Tierra del Fuego');
    initField('setContactSchedule', 'footerContactSchedule', 'Lun–Sáb: 9 a 20 hs.');
    initField('setAboutStory', 'aboutStoryText', 'Lo que comenzó como un pequeño emprendimiento familiar de regalería, creció gracias a la confianza de nuestras clientas hasta convertirnos en un referente de moda y maquillaje en Río Grande.');
}

// ===== NAV =====
function showPage(name, linkEl) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + name);
    if (target) target.classList.add('active');
    currentPage = name; window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelectorAll('nav a.nav-btn').forEach(a => a.classList.remove('active'));
    if (linkEl) linkEl.classList.add('active');
    if (name === 'products') renderAllProducts();
    if (name === 'home') renderFeaturedProducts();
    if (name === 'checkout') renderCheckout();
}

// ===== CATEGORIES =====
function getCatName(slug) { return allCats.find(c => c.slug === slug)?.name || slug; }

function renderCatStrip() {
    const el = document.getElementById('homeCatStrip'); if (!el) return;
    let h = `<button class="cat-btn active" onclick="filterAndGoProducts('all',this)"><span class="cat-icon">✨</span>Todo</button>`;
    allCats.forEach(c => { h += `<button class="cat-btn" onclick="filterAndGoProducts('${c.slug}',this)"><span class="cat-icon">${c.emoji || '🏷️'}</span>${c.name}</button>`; });
    el.innerHTML = h;
}
function renderNavDropdown() {
    const el = document.getElementById('navDropdownMenu'); if (!el) return;
    let h = `<div class="dropdown-item" onclick="filterAndGoProducts('all',null)">✨ Todos los productos</div>`;
    allCats.forEach(c => { h += `<div class="dropdown-item" onclick="filterAndGoProducts('${c.slug}',null)">${c.emoji || '🏷️'} ${c.name}</div>`; });
    el.innerHTML = h;
}
function renderFilterTabs() {
    const el = document.getElementById('filterTabs'); if (!el) return;
    let h = `<button class="filter-tab active" onclick="filterProducts('all',this)">Todo</button>`;
    allCats.forEach(c => { h += `<button class="filter-tab" onclick="filterProducts('${c.slug}',this)">${c.name}</button>`; });
    el.innerHTML = h;
}
function renderFooterCats() {
    const el = document.getElementById('footerCatList'); if (!el) return;
    el.innerHTML = allCats.map(c => `<li style="margin-bottom:.6rem"><a onclick="filterAndGoProducts('${c.slug}',null)" style="font-size:.9rem;color:rgba(255,255,255,.6);cursor:pointer">${c.name}</a></li>`).join('');
}

// ===== PRODUCTS =====
let _cardCtx = '';
function productCard(p) {
    const ic = cart.find(i => i.id === p.id);
    const cx = _cardCtx;
    let urls = Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls : (p.image_url ? [p.image_url] : []);
    let imgContent = '';
    if (urls.length > 1) {
        imgContent = `<div class="carousel-container" id="carousel-${cx}${p.id}" data-idx="0" ontouchstart="handleCarouselTouchStart(event)" ontouchmove="handleCarouselTouchMove(event)" ontouchend="handleCarouselTouchEnd(event, '${cx}${p.id}')"><div class="carousel-inner" id="carousel-inner-${cx}${p.id}" style="width:${urls.length * 100}%">${urls.map(url => `<div class="carousel-slide" style="width:${100 / urls.length}%"><img src="${url}" loading="lazy" alt="${p.name}"></div>`).join('')}</div><button class="carousel-btn prev" onclick="event.stopPropagation();moveCarousel('${cx}${p.id}', -1)">‹</button><button class="carousel-btn next" onclick="event.stopPropagation();moveCarousel('${cx}${p.id}', 1)">›</button><div class="carousel-dots" id="carousel-dots-${cx}${p.id}">${urls.map((_, i) => `<div class="carousel-dot ${i === 0 ? 'active' : ''}" onclick="event.stopPropagation();setCarousel('${cx}${p.id}', ${i})"></div>`).join('')}</div></div>`;
    } else if (urls.length === 1) {
        imgContent = `<img src="${urls[0]}" class="product-image" loading="lazy" alt="${p.name}" onclick="event.stopPropagation(); openProductDetail(${p.id})" style="cursor:pointer">`;
    } else {
        imgContent = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--pink-pale);color:var(--gray);font-family:var(--font-ui);font-size:.8rem;text-transform:uppercase;letter-spacing:.1em" onclick="event.stopPropagation(); openProductDetail(${p.id})">Sin foto</div>`;
    }
    return `<article class="product-card" onclick="if(_isSwiping) return; openProductDetail(${p.id})"><div class="product-img-wrap" onclick="if(_isSwiping) { event.stopPropagation(); return; } openProductDetail(${p.id})">${imgContent}${p.badge ? `<span class="product-badge ${p.badge}">${p.badge === 'new' ? 'Nuevo' : 'Oferta'}</span>` : ''}<button class="product-wishlist" onclick="event.stopPropagation();showToast('💖','Agregado a favoritos')">♡</button></div><div class="product-info"><div class="product-category">${getCatName(p.category_slug || p.category)}</div><div class="product-name" style="cursor:pointer">${p.name}</div>${p.description ? `<div style="font-size:0.8rem;color:var(--gray);margin-bottom:0.4rem;line-height:1.4">${p.description}</div>` : ''}<div class="product-price-wrap"><span class="product-price">$${Number(p.price).toLocaleString('es-AR')}</span>${p.old_price ? `<span class="product-price-old">$${Number(p.old_price).toLocaleString('es-AR')}</span>` : ''}${p.transfer_price ? `<span class="product-price-transfer" title="Precio abonando por transferencia"><span class="transfer-tag">Transf.</span> $${Number(p.transfer_price).toLocaleString('es-AR')}</span>` : ''}</div><button class="btn-add-cart${ic ? ' in-cart' : ''}" onclick="event.stopPropagation(); addToCart(${p.id})">${ic ? '✓ En el carrito' : 'Agregar al carrito'}</button></div></article>`;
}

let _touchStartX = 0;
let _touchStartY = 0;
let _touchMovedX = 0;
let _touchMovedY = 0;
let _isSwiping = false;

function handleCarouselTouchStart(e) {
    if (!e.touches || e.touches.length !== 1) return;
    _touchStartX = e.touches[0].clientX;
    _touchStartY = e.touches[0].clientY;
    _touchMovedX = 0;
    _touchMovedY = 0;
    _isSwiping = false;
}

function handleCarouselTouchMove(e) {
    if (!e.touches || e.touches.length !== 1) return;
    _touchMovedX = e.touches[0].clientX - _touchStartX;
    _touchMovedY = e.touches[0].clientY - _touchStartY;
    if (Math.abs(_touchMovedX) > Math.abs(_touchMovedY) && Math.abs(_touchMovedX) > 10) {
        _isSwiping = true;
    }
}

function handleCarouselTouchEnd(e, key) {
    if (_isSwiping) {
        const threshold = 35;
        if (Math.abs(_touchMovedX) >= threshold) {
            e.stopPropagation();
            if (_touchMovedX < 0) {
                moveCarousel(key, 1);
            } else {
                moveCarousel(key, -1);
            }
        }
        setTimeout(() => { _isSwiping = false; }, 250);
    }
}

function moveCarousel(key, dir) {
    const el = document.getElementById('carousel-' + key); if (!el) return;
    const inner = document.getElementById('carousel-inner-' + key);
    const slides = inner.children.length;
    let idx = parseInt(el.getAttribute('data-idx')) + dir;
    if (idx < 0) idx = slides - 1; else if (idx >= slides) idx = 0;
    setCarousel(key, idx);
}
function setCarousel(key, idx) {
    const el = document.getElementById('carousel-' + key); if (!el) return;
    el.setAttribute('data-idx', idx);
    const inner = document.getElementById('carousel-inner-' + key);
    inner.style.transform = `translateX(-${(100 / inner.children.length) * idx}%)`;
    const dots = document.getElementById('carousel-dots-' + key).children;
    Array.from(dots).forEach((d, i) => d.classList.toggle('active', i === idx));
}

function openProductDetail(id) {
    const p = allProds.find(x => x.id == id);
    if (!p) return;
    const detailModal = document.getElementById('productDetailModal');
    const detailContent = document.getElementById('productDetailContent');
    const ic = cart.find(i => i.id === p.id);
    let urls = Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls : (p.image_url ? [p.image_url] : []);
    let imgHtml = '';
    const cx = 'det-';
    if (urls.length > 1) {
        imgHtml = `<div class="carousel-container" id="carousel-${cx}${p.id}" data-idx="0" style="height:100%" ontouchstart="handleCarouselTouchStart(event)" ontouchmove="handleCarouselTouchMove(event)" ontouchend="handleCarouselTouchEnd(event, '${cx}${p.id}')"><div class="carousel-inner" id="carousel-inner-${cx}${p.id}" style="width:${urls.length * 100}%; height:100%">${urls.map(url => `<div class="carousel-slide" style="width:${100 / urls.length}%; height:100%; display:flex; align-items:center; justify-content:center"><img src="${url}" alt="${p.name}" style="max-width:100%; max-height:100%; width:auto; height:auto; object-fit:contain; background:var(--pink-pale)"></div>`).join('')}</div><button class="carousel-btn prev" onclick="event.stopPropagation(); moveCarousel('${cx}${p.id}', -1)">‹</button><button class="carousel-btn next" onclick="event.stopPropagation(); moveCarousel('${cx}${p.id}', 1)">›</button><div class="carousel-dots" id="carousel-dots-${cx}${p.id}">${urls.map((_, i) => `<div class="carousel-dot ${i === 0 ? 'active' : ''}" onclick="event.stopPropagation(); setCarousel('${cx}${p.id}', ${i})"></div>`).join('')}</div></div>`;
    } else if (urls.length === 1) {
        imgHtml = `<img src="${urls[0]}" alt="${p.name}" style="max-width:100%; max-height:100%; width:auto; height:auto; object-fit:contain; background:var(--pink-pale)">`;
    } else {
        imgHtml = `<div style="font-size:4rem">📦</div>`;
    }
    detailContent.innerHTML = `<div class="product-detail-grid"><div class="product-detail-img-side">${imgHtml}${p.badge ? `<span class="product-badge ${p.badge}" style="top:1.5rem; left:1.5rem">${p.badge === 'new' ? 'Nuevo' : 'Oferta'}</span>` : ''}</div><div class="product-detail-info-side"><div class="product-detail-cat">${getCatName(p.category_slug || p.category)}</div><h2 class="product-detail-name">${p.name}</h2><div class="product-detail-price-row"><span class="product-detail-price">$${Number(p.price).toLocaleString('es-AR')}</span>${p.old_price ? `<span class="product-detail-old-price">$${Number(p.old_price).toLocaleString('es-AR')}</span>` : ''}${p.transfer_price ? `<span class="product-detail-price-transfer" title="Precio abonando por transferencia"><span class="transfer-tag">Transf.</span> $${Number(p.transfer_price).toLocaleString('es-AR')}</span>` : ''}</div><div class="product-detail-desc">${p.description || 'Sin descripción disponible para este producto.'}</div><div class="product-detail-actions"><button class="btn-primary" onclick="addToCart(${p.id}); closeProductDetail()" style="width:100%; padding: 1.2rem;">${ic ? '✓ En el carrito (Sumar otro)' : 'Agregar al carrito'}</button><p style="font-size: 0.75rem; color: var(--gray); text-align: center; font-family: var(--font-ui); letter-spacing: 0.05em;">✨ Envío a todo el país | ✨ Atención personalizada</p></div></div></div>`;
    detailModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeProductDetail() {
    const el = document.getElementById('productDetailModal');
    if (el) el.classList.remove('open');
    document.body.style.overflow = '';
}

function renderFeaturedProducts() {
    _cardCtx = 'feat-';
    const el = document.getElementById('featuredGrid');
    if (el) el.innerHTML = allProds.filter(p => p.badge).slice(0, 8).map(productCard).join('');
}
function renderAllProducts() {
    _cardCtx = 'all-';
    let list = activeFilter === 'all' ? allProds : allProds.filter(p => (p.category_slug || p.category) === activeFilter);
    const el = document.getElementById('allProductsGrid');
    if (el) el.innerHTML = list.length ? list.map(productCard).join('') : `<div style="text-align:center;padding:4rem;color:var(--gray);font-family:var(--font-display);font-size:1.2rem">No hay productos en esta categoría.</div>`;
}
function filterAndGoProducts(cat, btn) {
    activeFilter = cat; showPage('products', null);
    setTimeout(() => {
        document.querySelectorAll('#filterTabs .filter-tab').forEach(b => b.classList.remove('active'));
        const cn = cat === 'all' ? 'Todo' : getCatName(cat);
        document.querySelectorAll('#filterTabs .filter-tab').forEach(b => { if (b.textContent.trim() === cn || (cat === 'all' && b.textContent.trim() === 'Todo')) b.classList.add('active'); });
        renderAllProducts();
    }, 80);
}
function filterProducts(cat, btn) {
    activeFilter = cat;
    document.querySelectorAll('#filterTabs .filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); renderAllProducts();
}
function sortProducts(val) {
    let list = activeFilter === 'all' ? [...allProds] : allProds.filter(p => (p.category_slug || p.category) === activeFilter);
    if (val === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (val === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (val === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    const el = document.getElementById('allProductsGrid'); if (el) el.innerHTML = list.map(productCard).join('');
}

// ===== CART =====
function addToCart(id) {
    const p = allProds.find(x => x.id == id); if (!p) return;
    const ex = cart.find(i => i.id == id); if (ex) ex.qty++; else cart.push({ id: p.id, name: p.name, price: p.price, emoji: p.emoji || '📦', qty: 1 });
    localStorage.setItem('rochi_cart', JSON.stringify(cart)); updateCartBadge(); renderCartItems();
    showToast('🛒', `"${p.name}" agregado al carrito`);
    if (currentPage === 'home') renderFeaturedProducts();
    if (currentPage === 'products') renderAllProducts();
}
function updateCartBadge() { const t = cart.reduce((s, i) => s + i.qty, 0); const b = document.getElementById('cartBadge'); if (b) { b.textContent = t; b.style.display = t > 0 ? 'flex' : 'none'; } }
function renderCartItems() {
    const el = document.getElementById('cartItemsEl'), footer = document.getElementById('cartFooter'); if (!el) return;
    if (!cart.length) { el.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🛒</div><p style="font-family:var(--font-display);font-size:1.1rem;margin-bottom:.5rem">Tu carrito está vacío</p><p style="font-size:.9rem;color:var(--gray-light)">Agregá productos para comenzar</p></div>`; if (footer) footer.style.display = 'none'; return; }
    if (footer) footer.style.display = 'block';
    el.innerHTML = cart.map(item => `<div class="cart-item"><div class="cart-item-img">${item.emoji}</div><div><div class="cart-item-name">${item.name}</div><div class="cart-item-price">$${(item.price * item.qty).toLocaleString('es-AR')}</div><div class="cart-item-qty"><button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button><span class="qty-num">${item.qty}</span><button class="qty-btn" onclick="changeQty(${item.id},1)">+</button></div></div><button class="cart-remove" onclick="removeFromCart(${item.id})">✕</button></div>`).join('');
    const totalEl = document.getElementById('cartTotalEl'); if (totalEl) totalEl.textContent = '$' + cart.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString('es-AR');
}
function changeQty(id, d) { const item = cart.find(i => i.id == id); if (!item) return; item.qty += d; if (item.qty <= 0) cart = cart.filter(i => i.id != id); localStorage.setItem('rochi_cart', JSON.stringify(cart)); updateCartBadge(); renderCartItems(); }
function removeFromCart(id) { cart = cart.filter(i => i.id != id); localStorage.setItem('rochi_cart', JSON.stringify(cart)); updateCartBadge(); renderCartItems(); showToast('✕', 'Producto eliminado del carrito'); }
function openCart() { const ov = document.getElementById('cartOverlay'), pa = document.getElementById('cartPanel'); if (ov) ov.classList.add('open'); if (pa) pa.classList.add('open'); renderCartItems(); }
function closeCart() { const ov = document.getElementById('cartOverlay'), pa = document.getElementById('cartPanel'); if (ov) ov.classList.remove('open'); if (pa) pa.classList.remove('open'); }
function goToCheckout() { closeCart(); showPage('checkout', null); }

// ===== CHECKOUT =====
function renderCheckout() {
    const cc = document.getElementById('checkoutContent'), cs = document.getElementById('checkoutSuccess');
    if (cc) cc.classList.remove('hidden'); if (cs) cs.classList.add('hidden');
    if (!cart.length) { if (cc) cc.innerHTML = `<div style="text-align:center;padding:4rem 2rem"><p style="font-family:var(--font-display);font-size:1.5rem;color:var(--gray)">Tu carrito está vacío.</p><button class="btn-primary" style="border:none;margin-top:1.5rem" onclick="showPage('products',null)">Ver Productos</button></div>`; return; }
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const ln = currentUser?.user_metadata?.full_name || '', le = currentUser?.email || '';
    if (cc) cc.innerHTML = `<div class="checkout-page"><div class="checkout-grid"><div><div class="checkout-section-title">Tus datos</div><div class="form-group"><label class="form-label">Nombre completo *</label><input class="form-input" id="chkName" type="text" value="${ln}" placeholder="Tu nombre y apellido"></div><div class="form-group"><label class="form-label">Email *</label><input class="form-input" id="chkEmail" type="email" value="${le}" placeholder="tucorreo@email.com"></div><div class="form-group"><label class="form-label">Teléfono / WhatsApp *</label><input class="form-input" id="chkPhone" type="tel" placeholder="+54 9 11 0000-0000"></div><div class="form-group"><label class="form-label">Dirección de entrega</label><input class="form-input" id="chkAddress" type="text" placeholder="Calle, número, ciudad"></div><div class="form-group"><label class="form-label">Método de pago preferido *</label><select class="form-input" id="chkPayment"><option value="">Seleccioná una opción</option><option value="Débito">Débito</option><option value="Crédito">Crédito</option><option value="Transferencia">Transferencia</option><option value="Link de pago">Link de pago</option><option value="Efectivo">Efectivo</option></select></div></div><div><div class="checkout-section-title">Notas adicionales</div><div class="form-group"><label class="form-label">Notas del pedido (opcional)</label><textarea class="form-input" id="chkNotes" rows="4" placeholder="Indicaciones especiales..."></textarea></div><div style="background:var(--pink-pale);padding:1rem;border:1px solid var(--pink-light);margin-top:1rem"><p style="font-family:var(--font-ui);font-size:.66rem;color:var(--gray);line-height:1.7">📌 <strong>IMPORTANTE:</strong> Este formulario confirma tu pedido. Nos contactaremos por WhatsApp para coordinar el pago y envío. No requiere pago online.</p></div></div><div style="grid-column:1/-1"><div class="checkout-section-title">Resumen del pedido</div>${cart.map(item => `<div class="checkout-item-row"><div class="checkout-item-icon">${item.emoji}</div><div class="checkout-item-name">${item.name}</div><div class="checkout-item-qty">× ${item.qty}</div><div class="checkout-item-price">$${(item.price * item.qty).toLocaleString('es-AR')}</div></div>`).join('')}<div class="checkout-total-row"><span>Total estimado</span><span>$${total.toLocaleString('es-AR')}</span></div></div></div><button class="btn-confirm" id="confirmBtn" onclick="submitOrder()">Confirmar y Enviar Pedido →</button></div>`;
}
async function submitOrder() {
    const name = document.getElementById('chkName')?.value.trim();
    const email = document.getElementById('chkEmail')?.value.trim();
    const phone = document.getElementById('chkPhone')?.value.trim();
    const address = document.getElementById('chkAddress')?.value.trim() || '';
    const notes = document.getElementById('chkNotes')?.value.trim() || '';
    const payment = document.getElementById('chkPayment')?.value;
    if (!name || !email || !phone) { showToast('⚠️', 'Completá los campos obligatorios'); return; }
    if (!payment) { showToast('⚠️', 'Seleccioná un método de pago'); return; }
    const btn = document.getElementById('confirmBtn'); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Enviando...';
    const oid = 'RA' + Date.now().toString().slice(-6);
    const uname = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Invitado';
    const { error } = await db.from('orders').insert({ id: oid, customer_name: name, customer_email: email, customer_phone: phone, customer_address: address, notes, payment_method: payment, items: cart, total: cart.reduce((s, i) => s + i.price * i.qty, 0), username: uname, status: 'pending' });
    if (error) { showToast('❌', 'Error al enviar el pedido. Intentá de nuevo.'); btn.disabled = false; btn.innerHTML = 'Confirmar y Enviar Pedido →'; return; }

    sendOrderEmails({ id: oid, name, email, phone, address, notes, payment, items: [...cart], total: cart.reduce((s, i) => s + i.price * i.qty, 0) });

    cart = []; localStorage.setItem('rochi_cart', JSON.stringify(cart)); updateCartBadge();
    const cc = document.getElementById('checkoutContent'), cs = document.getElementById('checkoutSuccess');
    if (cc) cc.classList.add('hidden'); if (cs) cs.classList.remove('hidden');
    const onum = document.getElementById('orderNumberDisplay'); if (onum) onum.textContent = 'N° de pedido: ' + oid;
}

// ===== AUTH MODALS =====
function handleAuthClick() { if (currentUser) { if (confirm('¿Querés cerrar sesión?')) { db.auth.signOut(); showToast('👋', 'Sesión cerrada correctamente'); } } else openAuthModal(); }
function openAuthModal() { const el = document.getElementById('authModal'); if (el) el.classList.add('open'); }
function closeAuthModal() { const el = document.getElementById('authModal'); if (el) el.classList.remove('open'); }
function switchAuthTab(tab, btn) {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active')); btn.classList.add('active');
    const lf = document.getElementById('loginForm'), rf = document.getElementById('registerForm');
    if (lf) lf.classList.toggle('active', tab === 'login');
    if (rf) rf.classList.toggle('active', tab === 'register');
}
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim(), pass = document.getElementById('loginPass').value;
    const errEl = document.getElementById('loginError'), btn = document.getElementById('loginBtn');
    if (errEl) errEl.classList.remove('show');
    if (!email || !pass) { if (errEl) { errEl.textContent = 'Completá email y contraseña.'; errEl.classList.add('show'); } return; }
    if (btn) { btn.innerHTML = '<span class="spinner"></span>'; btn.disabled = true; }
    const { error } = await db.auth.signInWithPassword({ email, password: pass });
    if (btn) { btn.innerHTML = 'Iniciar Sesión'; btn.disabled = false; }
    if (error) { if (errEl) { errEl.textContent = 'Email o contraseña incorrectos.'; errEl.classList.add('show'); } }
    else { closeAuthModal(); showToast('👋', '¡Bienvenido/a de nuevo!'); }
}
async function handleRegister() {
    const name = document.getElementById('regName').value.trim(), email = document.getElementById('regEmail').value.trim(), pass = document.getElementById('regPass').value;
    const errEl = document.getElementById('registerError'), succEl = document.getElementById('registerSuccess'), btn = document.getElementById('registerBtn');
    if (errEl) errEl.classList.remove('show'); if (succEl) succEl.classList.remove('show');
    if (!name || !email || pass.length < 6) { if (errEl) { errEl.textContent = 'Completá todos los campos (contraseña mín. 6 caracteres).'; errEl.classList.add('show'); } return; }
    if (btn) { btn.innerHTML = '<span class="spinner"></span>'; btn.disabled = true; }
    const { error } = await db.auth.signUp({ email, password: pass, options: { data: { full_name: name } } });
    if (btn) { btn.innerHTML = 'Crear Cuenta'; btn.disabled = false; }
    if (error) { if (errEl) { errEl.textContent = error.message.includes('already') ? 'Este email ya está registrado.' : 'Error al crear la cuenta.'; errEl.classList.add('show'); } }
    else { if (succEl) { succEl.textContent = '✅ ¡Cuenta creada! Revisá tu email para confirmar.'; succEl.classList.add('show'); } setTimeout(() => { closeAuthModal(); showToast('🎉', `¡Bienvenido/a, ${name}!`); }, 2000); }
}

// ===== CONTACT =====
async function sendContactForm() {
    const name = document.getElementById('cName').value.trim(), email = document.getElementById('cEmail').value.trim();
    const phone = document.getElementById('cPhone').value.trim(), subject = document.getElementById('cSubject').value, message = document.getElementById('cMsg').value.trim();
    const succEl = document.getElementById('contactSuccess'), errEl = document.getElementById('contactError'), btn = document.getElementById('contactBtn');
    if (succEl) succEl.classList.remove('show'); if (errEl) errEl.classList.remove('show');
    if (!name || !email || !message || !subject) { showToast('⚠️', 'Completá todos los campos obligatorios'); return; }
    if (btn) { btn.innerHTML = '<span class="spinner"></span>'; btn.disabled = true; }
    const { error } = await db.from('contact_messages').insert({ name, email, phone, subject, message });
    if (btn) { btn.innerHTML = 'Enviar Mensaje →'; btn.disabled = false; }
    if (error) { if (errEl) { errEl.textContent = '❌ Error al enviar. Intentá de nuevo.'; errEl.classList.add('show'); } }
    else { if (succEl) succEl.classList.add('show');['cName', 'cEmail', 'cPhone', 'cMsg'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); const sub = document.getElementById('cSubject'); if (sub) sub.value = ''; setTimeout(() => { if (succEl) succEl.classList.remove('show'); }, 6000); }
}

// ===== NEWSLETTER =====
async function subscribeNewsletter() {
    const email = document.getElementById('newsletterEmail').value.trim();
    if (!email || !email.includes('@')) { showToast('⚠️', 'Ingresá un email válido'); return; }
    const { error } = await db.from('newsletter').insert({ email });
    if (error && error.code === '23505') showToast('💌', 'Este email ya está suscripto');
    else if (error) showToast('❌', 'Error al suscribirse.');
    else { const el = document.getElementById('newsletterEmail'); if (el) el.value = ''; showToast('💌', '¡Suscripción confirmada! Gracias.'); }
}

// ===== SEARCH =====
function toggleSearch() { const o = document.getElementById('searchOverlay'); if (o) { o.classList.toggle('open'); if (o.classList.contains('open')) { setTimeout(() => { const i = document.getElementById('searchInput'); if (i) i.focus(); }, 100); const i = document.getElementById('searchInput'); if (i) i.value = ''; const r = document.getElementById('searchResults'); if (r) r.innerHTML = ''; } } }
function handleSearch(q) {
    const el = document.getElementById('searchResults'); if (!el) return; if (q.length < 2) { el.innerHTML = ''; return; }
    const res = allProds.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || getCatName(p.category_slug || p.category).toLowerCase().includes(q.toLowerCase()));
    if (!res.length) { el.innerHTML = `<p style="font-family:var(--font-ui);font-size:.75rem;color:var(--gray);text-align:center;letter-spacing:.1em">Sin resultados para "${q}"</p>`; return; }
    el.innerHTML = res.slice(0, 6).map(p => `<div onclick="addToCart(${p.id});toggleSearch()" style="display:flex;align-items:center;gap:1rem;padding:.8rem;background:rgba(255,255,255,.85);margin-bottom:.4rem;cursor:pointer;border:1px solid var(--pink-light)" onmouseover="this.style.background='var(--pink-pale)'" onmouseout="this.style.background='rgba(255,255,255,.85)'"><span style="font-size:1.8rem">${p.emoji || '📦'}</span><div style="flex:1"><div style="font-family:var(--font-display);font-size:.95rem;font-weight:600">${p.name}</div><div style="font-family:var(--font-ui);font-size:.62rem;color:var(--gray);text-transform:uppercase;letter-spacing:.1em">${getCatName(p.category_slug || p.category)}</div></div><span style="font-family:var(--font-ui);font-weight:600">$${Number(p.price).toLocaleString('es-AR')}</span></div>`).join('');
}

// ===== ADMIN =====
async function adminLogin() {
    const email = document.getElementById('adminUser').value.trim(), password = document.getElementById('adminPass').value;
    const errEl = document.getElementById('adminLoginError');
    if (errEl) errEl.classList.remove('show');
    if (!email || !password) { if (errEl) { errEl.textContent = 'Completá todos los campos.'; errEl.classList.add('show'); } return; }
    const allowedAdmins = ['rochiregaleria@gmail.com'];
    if (!allowedAdmins.includes(email.toLowerCase())) { if (errEl) { errEl.textContent = 'Este usuario no tiene permisos de administrador.'; errEl.classList.add('show'); } return; }
    const btn = document.querySelector('.admin-login-box .btn-primary');
    let orgText = btn ? btn.innerHTML : '';
    if (btn) { btn.innerHTML = '<span class="spinner"></span>'; btn.disabled = true; }
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (btn) { btn.innerHTML = orgText; btn.disabled = false; }
    if (error) { if (errEl) { errEl.textContent = 'Credenciales incorrectas o problema de red.'; errEl.classList.add('show'); } }
    else { const s1 = document.getElementById('adminLoginSection'), s2 = document.getElementById('adminDashboardSection'); if (s1) s1.style.display = 'none'; if (s2) s2.classList.remove('hidden'); loadAdminData(); }
}
function adminLogout() {
    db.auth.signOut();
    const s1 = document.getElementById('adminLoginSection'), s2 = document.getElementById('adminDashboardSection');
    if (s1) s1.style.display = ''; if (s2) s2.classList.add('hidden');
}
function switchAdminTab(tab, btn) {
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active')); if (btn) btn.classList.add('active');
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    const t = document.getElementById('adminTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (t) t.classList.add('active');
    if (tab === 'products') renderAdminProducts();
    if (tab === 'categories') renderAdminCategories();
    if (tab === 'settings') loadSettingsFromDB();
}
async function loadAdminData() { await loadAdminStats(); await loadAdminOrders(); }
async function loadAdminStats() {
    const { data: orders } = await db.from('orders').select('total,status');
    const { count: subCount } = await db.from('newsletter').select('*', { count: 'exact', head: true });
    const total = (orders || []).reduce((s, o) => s + Number(o.total), 0);
    const pending = (orders || []).filter(o => o.status === 'pending').length;
    const el = document.getElementById('adminStats');
    if (el) el.innerHTML = `<div class="admin-stat-card"><div class="admin-stat-label">Total Pedidos</div><div class="admin-stat-value">${(orders || []).length}</div></div><div class="admin-stat-card"><div class="admin-stat-label">Pendientes</div><div class="admin-stat-value">${pending}</div></div><div class="admin-stat-card"><div class="admin-stat-label">Facturación</div><div class="admin-stat-value">$${total.toLocaleString('es-AR')}</div></div><div class="admin-stat-card"><div class="admin-stat-label">Suscriptores</div><div class="admin-stat-value">${subCount || 0}</div></div><div class="admin-stat-card"><div class="admin-stat-label">Productos</div><div class="admin-stat-value">${allProds.length}</div></div><div class="admin-stat-card"><div class="admin-stat-label">Categorías</div><div class="admin-stat-value">${allCats.length}</div></div>`;
}

// --- ORDERS ---
async function loadAdminOrders(filters = {}) {
    const el = document.getElementById('adminOrdersContent'); if (!el) return;
    el.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--gray);font-family:var(--font-ui);font-size:.8rem;letter-spacing:.15em;text-transform:uppercase">Cargando...</div>`;
    let q = db.from('orders').select('*').order('created_at', { ascending: false });
    if (filters.status) q = q.eq('status', filters.status);
    if (filters.dateFrom) q = q.gte('created_at', filters.dateFrom + 'T00:00:00');
    if (filters.dateTo) q = q.lte('created_at', filters.dateTo + 'T23:59:59');
    const { data: orders, error } = await q;
    if (error) { el.innerHTML = `<div class="admin-empty"><div class="admin-empty-icon">❌</div><p>Error: ${error.message}</p></div>`; return; }
    if (!orders || !orders.length) { el.innerHTML = `<div class="admin-empty"><div class="admin-empty-icon">📋</div><p style="font-family:var(--font-display);font-size:1.2rem">No hay pedidos que mostrar</p></div>`; return; }
    const rows = orders.map(o => {
        const items = Array.isArray(o.items) ? o.items : [];
        const summary = items.map(i => `${i.emoji || ''} ${i.name} (×${i.qty})`).join(', ');
        const qty = items.reduce((s, i) => s + i.qty, 0);
        const date = new Date(o.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        return `<tr><td><strong>${o.id}</strong></td><td style="white-space:nowrap">${date}</td><td>${o.customer_name}</td><td>${o.username || 'Invitado'}</td><td style="max-width:260px;white-space:normal;font-size:.72rem">${summary}</td><td style="text-align:center">${qty}</td><td><strong>$${Number(o.total).toLocaleString('es-AR')}</strong></td><td>${o.customer_phone}</td><td>${o.payment_method || '—'}</td><td><span class="order-status status-${o.status}">${o.status === 'pending' ? 'Pendiente' : 'Confirmado'}</span></td><td><button onclick="toggleOrderStatus('${o.id}','${o.status}')" style="background:var(--black);color:white;border:none;padding:.3rem .7rem;font-size:.6rem;cursor:pointer;font-family:var(--font-ui)">${o.status === 'pending' ? '✓ Confirmar' : '↩ Pendiente'}</button></td></tr>`;
    }).join('');
    el.innerHTML = `<table class="admin-table"><thead><tr><th>N° Pedido</th><th>Fecha</th><th>Cliente</th><th>Usuario</th><th>Items</th><th>Cant.</th><th>Total</th><th>Teléfono</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function applyOrderFilters() { loadAdminOrders({ status: document.getElementById('filterStatus')?.value, dateFrom: document.getElementById('filterDateFrom')?.value, dateTo: document.getElementById('filterDateTo')?.value }); }
function clearOrderFilters() { const s = document.getElementById('filterStatus'), df = document.getElementById('filterDateFrom'), dt = document.getElementById('filterDateTo'); if (s) s.value = ''; if (df) df.value = ''; if (dt) dt.value = ''; loadAdminOrders(); }
async function toggleOrderStatus(id, current) { await db.from('orders').update({ status: current === 'pending' ? 'confirmed' : 'pending' }).eq('id', id); applyOrderFilters(); }

// --- ADMIN PRODUCTS ---
let adminSortKey = 'id';
let adminSortDir = 'desc';
function sortAdminTable(key) { if (adminSortKey === key) adminSortDir = adminSortDir === 'asc' ? 'desc' : 'asc'; else { adminSortKey = key; adminSortDir = 'asc'; } renderAdminProducts(); }

async function updateProductBadge(id, newBadge) {
    const { error } = await db.from('products').update({ badge: newBadge || null }).eq('id', id);
    if (error) { showToast('❌', 'Error: ' + error.message); renderAdminProducts(); }
    else { const p = allProds.find(x => String(x.id) === String(id)); if (p) p.badge = newBadge || null; showToast('✨', 'Badge actualizado'); }
}

let currentEditImages = [];
let pendingUploadFiles = [];

function openProductForm(product = null) {
    const wrap = document.getElementById('productFormWrap'); if (!wrap) return;
    const ti = document.getElementById('productFormTitle'); if (ti) ti.textContent = product ? 'Editar Producto' : 'Nuevo Producto';
    const idEl = document.getElementById('productEditId'); if (idEl) idEl.value = product?.id || '';
    const na = document.getElementById('pName'); if (na) na.value = product?.name || '';
    const pr = document.getElementById('pPrice'); if (pr) pr.value = product?.price || '';
    const pt = document.getElementById('pTransferPrice'); if (pt) pt.value = product?.transfer_price || '';
    const op = document.getElementById('pOldPrice'); if (op) op.value = product?.old_price || '';
    const de = document.getElementById('pDesc'); if (de) de.value = product?.description || '';
    const ba = document.getElementById('pBadge'); if (ba) ba.value = product?.badge || '';
    const catSel = document.getElementById('pCategory');
    if (catSel) catSel.innerHTML = allCats.map(c => `<option value="${c.slug}"${(product?.category_slug || product?.category) === c.slug ? ' selected' : ''}>${c.name}</option>`).join('');
    const fi = document.getElementById('pImageFile'); if (fi) fi.value = '';

    currentEditImages = Array.isArray(product?.image_urls) ? [...product.image_urls] : (product?.image_url ? [product.image_url] : []);
    pendingUploadFiles = [];
    renderAdminImagePreviews();

    wrap.classList.add('open'); wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderAdminImagePreviews() {
    const container = document.getElementById('pImagesPreviewContainer'); if (!container) return;
    const allImgs = [...currentEditImages.map((url, i) => ({ type: 'existing', idx: i, src: url })), ...pendingUploadFiles.map((fObj, i) => ({ type: 'pending', idx: i, src: fObj.data }))];
    let html = '';
    allImgs.forEach((img, i) => {
        html += `<div class="preview-thumb" draggable="true" data-drag-idx="${i}" style="background-image:url('${img.src}');cursor:grab"><span style="position:absolute;top:2px;left:4px;font-size:.55rem;background:rgba(0,0,0,.55);color:#fff;padding:1px 5px;border-radius:3px;pointer-events:none">${i + 1}</span><button class="preview-remove" onclick="removeUnifiedImage(${i})" type="button">✕</button></div>`;
    });
    if (allImgs.length > 1) html += '<div style="width:100%;font-size:.65rem;color:var(--gray);margin-top:.3rem;font-family:var(--font-ui)">Arrastrá para reordenar</div>';
    container.innerHTML = html;
    container.querySelectorAll('.preview-thumb[draggable]').forEach(el => {
        el.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', el.dataset.dragIdx); el.style.opacity = '0.4'; });
        el.addEventListener('dragend', () => { el.style.opacity = '1'; });
        el.addEventListener('dragover', e => { e.preventDefault(); el.style.outline = '2px solid var(--pink-deep)'; });
        el.addEventListener('dragleave', () => { el.style.outline = ''; });
        el.addEventListener('drop', e => {
            e.preventDefault(); el.style.outline = '';
            const from = parseInt(e.dataTransfer.getData('text/plain'));
            const to = parseInt(el.dataset.dragIdx);
            if (from !== to) reorderUnifiedImages(from, to);
        });
    });
}
function removeUnifiedImage(idx) { const te = currentEditImages.length; if (idx < te) currentEditImages.splice(idx, 1); else pendingUploadFiles.splice(idx - te, 1); renderAdminImagePreviews(); }
function reorderUnifiedImages(from, to) {
    const all = [...currentEditImages.map(url => ({ type: 'existing', url })), ...pendingUploadFiles.map(f => ({ type: 'pending', fileObj: f }))];
    const [moved] = all.splice(from, 1); all.splice(to, 0, moved);
    currentEditImages = all.filter(x => x.type === 'existing').map(x => x.url);
    pendingUploadFiles = all.filter(x => x.type === 'pending').map(x => x.fileObj);
    renderAdminImagePreviews();
}
function previewProductImageMulti(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        if (file.size > 2 * 1024 * 1024) { showToast('⚠️', 'Máx 2MB: ' + file.name); return; }
        const reader = new FileReader(); reader.onload = ev => { pendingUploadFiles.push({ file: file, data: ev.target.result }); renderAdminImagePreviews(); }; reader.readAsDataURL(file);
    });
    e.target.value = '';
}
function closeProductForm() { const el = document.getElementById('productFormWrap'); if (el) el.classList.remove('open'); }

async function saveProduct() {
    const editId = document.getElementById('productEditId')?.value;
    const name = document.getElementById('pName')?.value.trim();
    const category_slug = document.getElementById('pCategory')?.value;
    const price = Number(document.getElementById('pPrice')?.value);
    const transfer_price = document.getElementById('pTransferPrice')?.value ? Number(document.getElementById('pTransferPrice').value) : null;
    const old_price = document.getElementById('pOldPrice')?.value ? Number(document.getElementById('pOldPrice').value) : null;
    const description = document.getElementById('pDesc')?.value.trim();
    const badge = document.getElementById('pBadge')?.value || null;
    if (!name || !category_slug || !price) { showToast('⚠️', 'Completá los campos obligatorios'); return; }

    const btn = document.querySelector('#productFormWrap .btn-primary');
    let orgTxt = btn ? btn.innerHTML : '';
    if (btn) { btn.innerHTML = '<span class="spinner"></span> Guardando...'; btn.disabled = true; }

    for (const fObj of pendingUploadFiles) {
        const file = fObj.file; const ext = file.name.split('.').pop();
        const fName = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
        const { data: ud, error: ue } = await db.storage.from('products').upload(fName, file);
        if (ue) { showToast('❌', 'Error al subir: ' + ue.message); if (btn) { btn.innerHTML = orgTxt; btn.disabled = false; } return; }
        const { data: { publicUrl } } = db.storage.from('products').getPublicUrl(ud.path);
        currentEditImages.push(publicUrl);
    }
    const payload = { name, category_slug, price, old_price, transfer_price, description, badge, image_urls: currentEditImages, image_url: currentEditImages.length > 0 ? currentEditImages[0] : null };
    let error;
    if (editId) {
        ({ error } = await db.from('products').update(payload).eq('id', editId));
        if (!error) { const idx = allProds.findIndex(p => String(p.id) === String(editId)); if (idx > -1) allProds[idx] = { ...allProds[idx], ...payload, id: Number(editId) }; }
    } else {
        const { data, error: e } = await db.from('products').insert(payload).select().single();
        error = e; if (!error && data) allProds.push({ ...data, transfer_price: data.transfer_price ? Number(data.transfer_price) : null }); else if (!error) allProds.push({ ...payload, id: Date.now() });
    }
    if (btn) { btn.innerHTML = orgTxt; btn.disabled = false; }
    if (error) { showToast('❌', 'Error: ' + error.message); return; }
    showToast('✅', editId ? 'Actualizado' : 'Creado');
    closeProductForm(); renderAdminProducts(); renderFeaturedProducts(); if (currentPage === 'products') renderAllProducts();
}
async function deleteProduct(id) { if (!confirm('¿Eliminás este producto?')) return; await db.from('products').delete().eq('id', id); allProds = allProds.filter(p => p.id != id); showToast('🗑️', 'Eliminado'); renderAdminProducts(); renderFeaturedProducts(); if (currentPage === 'products') renderAllProducts(); }

function renderAdminProducts() {
    const el = document.getElementById('adminProductsContent'); if (!el) return;
    if (!allProds.length) { el.innerHTML = `<div class="admin-empty"><div class="admin-empty-icon">📦</div><p style="font-family:var(--font-display);font-size:1.2rem">No hay productos</p></div>`; return; }
    const sorted = [...allProds].sort((a, b) => {
        let vA = a[adminSortKey], vB = b[adminSortKey];
        if (adminSortKey === 'category') { vA = getCatName(a.category_slug || a.category); vB = getCatName(b.category_slug || b.category); }
        if (adminSortKey === 'price' || adminSortKey === 'old_price' || adminSortKey === 'transfer_price') {
            vA = vA != null ? Number(vA) : 0;
            vB = vB != null ? Number(vB) : 0;
        }
        if (typeof vA === 'string') vA = vA.toLowerCase(); if (typeof vB === 'string') vB = vB.toLowerCase();
        if (vA < vB) return adminSortDir === 'asc' ? -1 : 1; if (vA > vB) return adminSortDir === 'asc' ? 1 : -1; return 0;
    });
    const getSortIcon = (key) => adminSortKey === key ? (adminSortDir === 'asc' ? ' ▴' : ' ▾') : '';
    el.innerHTML = `<table class="admin-table"><thead><tr><th>Emoji/Img</th><th onclick="sortAdminTable('name')" style="cursor:pointer">Nombre${getSortIcon('name')}</th><th onclick="sortAdminTable('category')" style="cursor:pointer">Categoría${getSortIcon('category')}</th><th onclick="sortAdminTable('price')" style="cursor:pointer">Precio${getSortIcon('price')}</th><th onclick="sortAdminTable('transfer_price')" style="cursor:pointer">Precio transf.${getSortIcon('transfer_price')}</th><th onclick="sortAdminTable('old_price')" style="cursor:pointer">Precio ant.${getSortIcon('old_price')}</th><th onclick="sortAdminTable('badge')" style="cursor:pointer">Badge${getSortIcon('badge')}</th><th>Acciones</th></tr></thead><tbody>${sorted.map(p => `<tr><td>${p.image_url ? `<img src="${p.image_url}" style="width:30px;height:30px;object-fit:cover;border-radius:4px">` : p.emoji || '📦'}</td><td><strong>${p.name}</strong></td><td>${getCatName(p.category_slug || p.category)}</td><td>$${Number(p.price).toLocaleString('es-AR')}</td><td>${p.transfer_price ? '$' + Number(p.transfer_price).toLocaleString('es-AR') : '—'}</td><td>${p.old_price ? '$' + Number(p.old_price).toLocaleString('es-AR') : '—'}</td><td><select onchange="updateProductBadge('${p.id}', this.value)" class="admin-badge-select ${p.badge || ''}"><option value="">— Sin —</option><option value="new" ${p.badge === 'new' ? 'selected' : ''}>Nuevo</option><option value="offer" ${p.badge === 'offer' ? 'selected' : ''}>Oferta</option><option value="hot" ${p.badge === 'hot' ? 'selected' : ''}>Destacado</option></select></td><td><div class="crud-actions"><button class="btn-edit" onclick="openProductForm(allProds.find(x=>String(x.id)===String(${p.id})))">✏️</button><button class="btn-delete" onclick="deleteProduct(${p.id})">🗑️</button></div></td></tr>`).join('')}</tbody></table>`;
}

// --- ADMIN CATEGORIES ---
function openCategoryForm(cat = null) {
    const wrap = document.getElementById('categoryFormWrap'); if (!wrap) return;
    const ti = document.getElementById('categoryFormTitle'); if (ti) ti.textContent = cat ? 'Editar Categoría' : 'Nueva Categoría';
    const idEl = document.getElementById('categoryEditId'); if (idEl) idEl.value = cat?.id || '';
    const na = document.getElementById('catName'); if (na) na.value = cat?.name || '';
    const sl = document.getElementById('catSlug'); if (sl) sl.value = cat?.slug || '';
    const em = document.getElementById('catEmoji'); if (em) em.value = cat?.emoji || '';
    const or = document.getElementById('catOrder'); if (or) or.value = cat?.sort_order || '';
    wrap.classList.add('open'); wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function closeCategoryForm() { const el = document.getElementById('categoryFormWrap'); if (el) el.classList.remove('open'); }
async function saveCategory() {
    const editId = document.getElementById('categoryEditId')?.value;
    const name = document.getElementById('catName')?.value.trim();
    const slug = document.getElementById('catSlug')?.value.trim().toLowerCase().replace(/\s+/g, '-');
    const emoji = document.getElementById('catEmoji')?.value.trim() || '🏷️';
    const sort_order = Number(document.getElementById('catOrder')?.value) || 99;
    if (!name || !slug) { showToast('⚠️', 'Completá nombre y slug'); return; }
    const payload = { name, slug, emoji, sort_order };
    let error;
    if (editId) {
        ({ error } = await db.from('categories').update(payload).eq('id', editId));
        if (!error) { const idx = allCats.findIndex(c => String(c.id) === String(editId)); if (idx > -1) allCats[idx] = { ...allCats[idx], ...payload }; }
    } else {
        const { data, error: e } = await db.from('categories').insert(payload).select().single();
        error = e; if (!error && data) allCats.push(data); else if (!error) allCats.push({ ...payload, id: slug });
    }
    if (error) { showToast('❌', 'Error: ' + error.message); return; }
    allCats.sort((a, b) => a.sort_order - b.sort_order);
    showToast('✅', editId ? 'Actualizada' : 'Creada'); closeCategoryForm(); renderAdminCategories(); refreshCategoryUI();
}
async function deleteCategory(id, slug) { if (!confirm('¿Eliminás esta categoría?')) return; await db.from('categories').delete().eq('id', id); allCats = allCats.filter(c => c.id != id && c.slug !== slug); showToast('🗑️', 'Eliminada'); renderAdminCategories(); refreshCategoryUI(); }
function renderAdminCategories() {
    const el = document.getElementById('adminCategoriesContent'); if (!el) return;
    if (!allCats.length) { el.innerHTML = `<div class="admin-empty"><div class="admin-empty-icon">🏷️</div><p style="font-family:var(--font-display);font-size:1.2rem">No hay categorías</p></div>`; return; }
    el.innerHTML = `<table class="admin-table"><thead><tr><th>Emoji</th><th>Nombre</th><th>Slug</th><th>Orden</th><th>Productos</th><th>Acciones</th></tr></thead><tbody>${allCats.map(c => `<tr><td>${c.emoji || '🏷️'}</td><td><strong>${c.name}</strong></td><td><code style="font-size:.8rem;background:var(--pink-pale);padding:.2rem .5rem">${c.slug}</code></td><td>${c.sort_order || '—'}</td><td>${allProds.filter(p => (p.category_slug || p.category) === c.slug).length}</td><td><div class="crud-actions"><button class="btn-edit" onclick="openCategoryForm(allCats.find(x=>x.slug==='${c.slug}'))">✏️</button><button class="btn-delete" onclick="deleteCategory('${c.id}','${c.slug}')">🗑️</button></div></td></tr>`).join('')}</tbody></table>`;
}

// --- EMAILS ---
async function sendOrderEmails(order) {
    const ejsKey = document.getElementById('setEmailJSKey')?.value.trim();
    const ejsService = document.getElementById('setEmailJSService')?.value.trim();
    const ejsTemplate = document.getElementById('setEmailJSTemplate')?.value.trim();
    if (!ejsKey || !ejsService || !ejsTemplate) { console.warn('EmailJS no configurado'); return; }
    const adminEmail = document.getElementById('setAdminEmail')?.value.trim();
    const subject = document.getElementById('setEmailSubject')?.value.trim();
    const template = document.getElementById('setEmailTemplate')?.value.trim();
    const itemsDetail = order.items.map(i => `- ${i.name} (${i.emoji}) x ${i.qty}: $${(i.price * i.qty).toLocaleString('es-AR')}`).join('\n');
    const totalStr = '$' + order.total.toLocaleString('es-AR');
    const body = (template || '')
        .replace(/{{id}}/g, order.id).replace(/{{nombre}}/g, order.name)
        .replace(/{{detalle}}/g, itemsDetail).replace(/{{total}}/g, totalStr).replace(/{{pago}}/g, order.payment);
    try {
        emailjs.init(ejsKey);
        await emailjs.send(ejsService, ejsTemplate, { to_email: order.email, subject: subject, message: body, order_id: order.id });
        if (adminEmail && adminEmail !== order.email) { await emailjs.send(ejsService, ejsTemplate, { to_email: adminEmail, subject: 'NUEVO PEDIDO: ' + order.id, message: `De: ${order.name}\n\n${body}`, order_id: order.id }); }
    } catch (err) { console.error('Error EmailJS:', err); }
}

function toggleEmailJSSettings(btn) {
    const keys = ['setEmailJSKey', 'setEmailJSService', 'setEmailJSTemplate'];
    const inputs = keys.map(k => document.getElementById(k));
    const isLocked = inputs[0]?.disabled;
    inputs.forEach(i => { if (i) i.disabled = !isLocked; });
    if (btn) btn.textContent = isLocked ? '🔓' : '🔒';
    if (isLocked) { if (inputs[0]) inputs[0].focus(); showToast('🔓', 'Desbloqueado'); } else showToast('🔒', 'Bloqueado');
}

async function saveSiteSettings() {
    const keys = [
        'announcement_banner', 'admin_email', 'email_subject', 'email_template',
        'emailjs_public_key', 'emailjs_service_id', 'emailjs_template_id',
        'contact_email', 'contact_phone', 'contact_address', 'contact_schedule',
        'contact_instagram', 'contact_facebook', 'about_story'
    ];
    const ids = [
        'setBannerText', 'setAdminEmail', 'setEmailSubject', 'setEmailTemplate',
        'setEmailJSKey', 'setEmailJSService', 'setEmailJSTemplate',
        'setContactEmail', 'setContactPhone', 'setContactAddress', 'setContactSchedule',
        'setContactInstagram', 'setContactFacebook', 'setAboutStory'
    ];
    const values = ids.map(id => document.getElementById(id)?.value.trim() ?? '');
    const btn = document.getElementById('saveSettingsBtn');
    let orgTxt = btn ? btn.innerHTML : '';
    if (btn) { btn.innerHTML = '<span class="spinner"></span>...'; btn.disabled = true; }
    const settings = keys.map((key, i) => ({ key, value: values[i] }));
    const { error } = await db.from('site_settings').upsert(settings, { onConflict: 'key' });
    if (btn) { btn.innerHTML = orgTxt; btn.disabled = false; }
    if (error) { showToast('❌', 'Error: ' + error.message); return; }
    showToast('✅', 'Ajustes guardados');

    const bannerVal = document.getElementById('setBannerText')?.value;
    const bar = document.getElementById('announcementBar'); if (bar && bannerVal) bar.textContent = bannerVal;

    const emailVal = document.getElementById('setContactEmail')?.value;
    if (emailVal) {
        const fEl = document.getElementById('footerContactEmail'); if (fEl) fEl.textContent = emailVal;
        const pEl = document.getElementById('contactPageEmail'); if (pEl) pEl.textContent = emailVal;
    }
    const phoneVal = document.getElementById('setContactPhone')?.value;
    if (phoneVal) {
        const fEl = document.getElementById('footerContactPhone'); if (fEl) fEl.textContent = phoneVal;
        const pEl = document.getElementById('contactPagePhone'); if (pEl) pEl.textContent = phoneVal;
        const waEl = document.getElementById('contactSocialWa');
        if (waEl) {
            const cleanPhone = phoneVal.replace(/[^0-9]/g, '');
            waEl.href = cleanPhone ? `https://wa.me/${cleanPhone}` : '#';
        }
    }
    const addressVal = document.getElementById('setContactAddress')?.value;
    if (addressVal) {
        const fEl = document.getElementById('footerContactAddress'); if (fEl) fEl.textContent = addressVal;
        const pEl = document.getElementById('contactPageAddress'); if (pEl) pEl.textContent = addressVal;
    }
    const scheduleVal = document.getElementById('setContactSchedule')?.value;
    if (scheduleVal) {
        const fEl = document.getElementById('footerContactSchedule'); if (fEl) fEl.textContent = scheduleVal;
        const pEl = document.getElementById('contactPageSchedule'); if (pEl) pEl.textContent = scheduleVal;
    }
    const instaVal = document.getElementById('setContactInstagram')?.value;
    const instaEl = document.getElementById('contactSocialInsta');
    if (instaEl && instaVal) instaEl.href = instaVal;
    const fbVal = document.getElementById('setContactFacebook')?.value;
    const fbEl = document.getElementById('contactSocialFb');
    if (fbEl && fbVal) fbEl.href = fbVal;

    const aboutVal = document.getElementById('setAboutStory')?.value;
    if (aboutVal) {
        const el = document.getElementById('aboutStoryText'); if (el) el.textContent = aboutVal;
    }
}

// ===== UI =====
function openMobileNav() { const el = document.getElementById('mobileNav'); if (el) el.classList.add('open'); }
function closeMobileNav() { const el = document.getElementById('mobileNav'); if (el) el.classList.remove('open'); }
let toastTimeout;
function showToast(icon, msg) {
    const ic = document.getElementById('toastIcon'), ms = document.getElementById('toastMsg'), to = document.getElementById('toast');
    if (ic) ic.textContent = icon; if (ms) ms.textContent = msg; if (to) { to.classList.add('show'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => to.classList.remove('show'), 3200); }
}
window.addEventListener('scroll', () => { const btn = document.getElementById('backToTop'); if (btn) btn.classList.toggle('visible', window.scrollY > 500); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (document.getElementById('searchOverlay')?.classList.contains('open')) toggleSearch(); closeCart(); closeAuthModal(); closeMobileNav(); closeProductDetail(); } });

async function handleAuthCallback() {
    if (!db) return; const h = window.location.hash;
    if (h && (h.includes('access_token') || h.includes('error'))) {
        if (h.includes('error')) { const p = new URLSearchParams(h.replace('#', '')); setTimeout(() => showToast('❌', p.get('error_description') || 'Error'), 500); }
        else { await new Promise(r => setTimeout(r, 800)); const { data } = await db.auth.getSession(); if (data?.session) { currentUser = data.session.user; updateAuthUI(); showToast('🎉', '¡Bienvenido/a!'); } }
        history.replaceState(null, '', window.location.pathname);
    }
}

// ===== INIT =====
(function () {
    updateCartBadge(); refreshCategoryUI(); renderFeaturedProducts(); initAuth(); handleAuthCallback();
    loadSettingsFromDB(); loadCatsFromDB().then(() => loadProdsFromDB());
})();
