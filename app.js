/* ============================================================
   Fabriku SPA — compiled application script
   Combines the homepage, catalog, stock and 12 product pages
   into a single hash-routed single-page app.
   Routes:
     #/                      -> home
     #/catalog[?cat=|?q=]    -> catalog (filters read from hash)
     #/stock                 -> stock
     #/product/<slug>        -> product detail
   ============================================================ */
(function(){
  'use strict';

  /* -------- per-view lifecycle: auto-clean listeners & intervals -------- */
  var V = {
    _l: [], _i: [],
    on: function(t, ty, fn, op){ t.addEventListener(ty, fn, op); this._l.push([t, ty, fn, op]); },
    interval: function(fn, ms){ var id = setInterval(fn, ms); this._i.push(id); return id; },
    clear: function(){
      this._l.forEach(function(x){ try{ x[0].removeEventListener(x[1], x[2], x[3]); }catch(e){} });
      this._l = [];
      this._i.forEach(function(id){ clearInterval(id); });
      this._i = [];
    }
  };
  window.V = V;

  /* -------- product route table (slug -> template + init) -------- */
  var PRODUCTS = {
  'bamboo-cotton-30s': {tpl:'tpl-product-bamboo-cotton-30s', init:init_product_bamboo_cotton_30s},
  'cotton-combed-20s': {tpl:'tpl-product-cotton-combed-20s', init:init_product_cotton_combed_20s},
  'cotton-combed-24s': {tpl:'tpl-product-cotton-combed-24s', init:init_product_cotton_combed_24s},
  'cotton-combed-30s': {tpl:'tpl-product-cotton-combed-30s', init:init_product_cotton_combed_30s},
  'cotton-elastech-30s': {tpl:'tpl-product-cotton-elastech-30s', init:init_product_cotton_elastech_30s},
  'cvc-20s-lacoste-36': {tpl:'tpl-product-cvc-20s-lacoste-36', init:init_product_cvc_20s_lacoste_36},
  'cvc-24s-lacoste-36': {tpl:'tpl-product-cvc-24s-lacoste-36', init:init_product_cvc_24s_lacoste_36},
  'cvc-24s-lacoste-42': {tpl:'tpl-product-cvc-24s-lacoste-42', init:init_product_cvc_24s_lacoste_42},
  'knitease-danball-200': {tpl:'tpl-product-knitease-danball-200', init:init_product_knitease_danball_200},
  'rocky-cotton-16s': {tpl:'tpl-product-rocky-cotton-16s', init:init_product_rocky_cotton_16s},
  'starter-versa-cotton-24s': {tpl:'tpl-product-starter-versa-cotton-24s', init:init_product_starter_versa_cotton_24s},
  'versa-heavy-weight-rocky-hard-36': {tpl:'tpl-product-versa-heavy-weight-rocky-hard-36', init:init_product_versa_heavy_weight_rocky_hard_36}
  };

  var app = null;

  function mountTemplate(tplId){
    var tpl = document.getElementById(tplId);
    if(!tpl){ return false; }
    app.innerHTML = '';
    app.appendChild(tpl.content.cloneNode(true));
    return true;
  }

  function parseHash(){
    var h = location.hash || '';
    // in-page anchors (e.g. #top, #artikel) are not routes — ignore them
    if(h && h !== '#' && h.indexOf('#/') !== 0){ return {ignore:true}; }
    if(h.indexOf('#/product/') === 0){
      var rest = h.slice('#/product/'.length);
      return {route:'product', slug: rest.split('?')[0]};
    }
    if(h.indexOf('#/catalog') === 0){
      return {route:'catalog'};
    }
    if(h.indexOf('#/stock') === 0){
      return {route:'stock'};
    }
    return {route:'home'};
  }

  function render(){
    var r = parseHash();
    if(r.ignore){ return; }        // leave current view for in-page anchors
    V.clear();                     // tear down previous view's listeners/intervals

    if(r.route === 'product'){
      var p = PRODUCTS[r.slug];
      if(!p){ location.replace('#/catalog'); return; }
      if(mountTemplate(p.tpl)){ window.scrollTo(0, 0); safeInit(p.init); }
      return;
    }
    var map = { home:['tpl-home', typeof init_home==='function'?init_home:null],
                catalog:['tpl-catalog', typeof init_catalog==='function'?init_catalog:null],
                stock:['tpl-stock', typeof init_stock==='function'?init_stock:null] };
    var m = map[r.route] || map.home;
    if(mountTemplate(m[0])){ window.scrollTo(0, 0); safeInit(m[1]); }
  }

  function safeInit(fn){
    if(typeof fn === 'function'){
      try { fn(); } catch(e){ console.error('view init error:', e); }
    }
  }

  /* -------- protect route links from page-level click hijackers --------
     Some source pages attach smooth-scroll handlers to every .nav-link[href^="#"]
     that call preventDefault() then document.querySelector(href). For a route
     href like "#/stock" that querySelector throws ("invalid selector") and the
     link dies. We intercept clicks on route links in the CAPTURE phase and stop
     propagation, so the browser performs the normal hash navigation and the
     page's own bubble-phase handlers never run for these links. */
  document.addEventListener('click', function(e){
    if(e.target.closest && e.target.closest('.navbar .nav-item .chev')) return; /* chev toggles dropdown */
    var a = e.target.closest && e.target.closest('a[href^="#/"]');
    if(a){ e.stopPropagation(); }
  }, true);

  /* -------- shared navbar: dropdowns, outside-click, escape (delegated once) -------- */
  document.addEventListener('click', function(e){
    var chev = e.target.closest && e.target.closest('.navbar .nav-item .chev');
    if(chev){
      e.preventDefault(); e.stopPropagation();
      var item = chev.closest('.nav-item');
      document.querySelectorAll('.navbar .nav-item').forEach(function(i){ if(i!==item) i.classList.remove('open'); });
      item.classList.toggle('open');
      return;
    }
    if(!(e.target.closest && e.target.closest('.navbar .nav-item'))){
      document.querySelectorAll('.navbar .nav-item.open').forEach(function(i){ i.classList.remove('open'); });
    }
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      document.querySelectorAll('.navbar .nav-item.open, .m-group.open').forEach(function(i){ i.classList.remove('open'); });
    }
  });
  /* keep dead placeholder links (href="#") from triggering navigation */
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href="#"]');
    if(a){ e.preventDefault(); }
  });

  window.addEventListener('hashchange', render);
  document.addEventListener('DOMContentLoaded', function(){
    app = document.getElementById('app');
    render();
  });
})();


/* ================= view init functions ================= */
function init_home(){

// ═══════════════════ MOBILE MENU ═══════════════════
function toggleMobileMenu() {
  var m = document.getElementById('mobileMenu');
  var b = document.getElementById('mobileMenuBackdrop');
  var h = document.getElementById('hamburgerBtn');
  m.classList.toggle('open');
  b.classList.toggle('open');
  h.classList.toggle('open');
}
function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
  document.getElementById('mobileMenuBackdrop').classList.remove('open');
  document.getElementById('hamburgerBtn').classList.remove('open');
  // Also collapse any open mobile groups
  document.querySelectorAll('.m-group.open').forEach(function(g){ g.classList.remove('open'); });
}
function toggleMobileGroup(id) {
  var el = document.getElementById(id);
  if (!el) return;
  // Close others (accordion behavior)
  document.querySelectorAll('.m-group').forEach(function(g){
    if (g !== el) g.classList.remove('open');
  });
  el.classList.toggle('open');
}

// ═══════════════════ DESKTOP DROPDOWN (touch / click-outside) ═══════════════════
(function(){
  var items = document.querySelectorAll('.navbar .nav-item');
  items.forEach(function(item){
    var trigger = item.querySelector('.nav-link');
    var chev = item.querySelector('.chev');
    if (!trigger || !chev) return;
    // Tapping the chevron opens/closes the dropdown instead of following the link.
    chev.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      items.forEach(function(i){ if (i !== item) i.classList.remove('open'); });
      item.classList.toggle('open');
    });
  });
  // Close dropdowns when clicking outside
  V.on(document,'click', function(e){
    if (!e.target.closest('.navbar .nav-item')) {
      items.forEach(function(i){ i.classList.remove('open'); });
    }
  });
  // Close on Escape
  V.on(document,'keydown', function(e){
    if (e.key === 'Escape') items.forEach(function(i){ i.classList.remove('open'); });
  });
})();

function scrollToTop(e) {
  e.preventDefault();
  closeMobileMenu();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.querySelectorAll('.bottom-nav-item').forEach(function(b) { b.classList.remove('active'); });
  e.currentTarget.classList.add('active');
}

function scrollToSection(e, id) {
  e.preventDefault();
  closeMobileMenu();
  var target = document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.querySelectorAll('.bottom-nav-item').forEach(function(b) { b.classList.remove('active'); });
  e.currentTarget.classList.add('active');
}

// Set active state on desktop nav links
function setActiveNav(el) {
  document.querySelectorAll('.navbar .nav-links .nav-link').forEach(function(l) { l.classList.remove('active'); });
  el.classList.add('active');
}

// Highlight "Beranda" bottom-nav item when near top
V.on(window,'scroll', function() {
  var isTop = window.scrollY < 200;
  var homeBtn = document.querySelector('.bottom-nav-item[href="#top"]');
  if (homeBtn && isTop) {
    document.querySelectorAll('.bottom-nav-item').forEach(function(b) { b.classList.remove('active'); });
    homeBtn.classList.add('active');
  }
});

// ═══════════════════ SCROLL REVEAL ═══════════════════
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

let promoIndex = 0;

function promoVisible(){

    if(window.innerWidth<=768) return 1;

    if(window.innerWidth<=1024) return 2;

    return 3;

}

function promoMax(){

    return document.querySelectorAll('.promo-item').length-promoVisible();

}

function updatePromo(){

    const visible=promoVisible();

    document.getElementById("promoTrack").style.transform=
    `translateX(-${promoIndex*(100/visible)}%)`;

    renderPromoDots();

}

function promoNext(){

    if(promoIndex<promoMax())
        promoIndex++;
    else
        promoIndex=0;

    updatePromo();

}

function promoPrev(){

    if(promoIndex>0)
        promoIndex--;
    else
        promoIndex=promoMax();

    updatePromo();

}

function renderPromoDots(){

    const dots=document.getElementById("promoDots");

    dots.innerHTML="";

    for(let i=0;i<=promoMax();i++){

        let d=document.createElement("span");

        if(i==promoIndex)
            d.classList.add("active");

        d.onclick=()=>{

            promoIndex=i;

            updatePromo();

        }

        dots.appendChild(d);

    }

}

V.on(window,"resize",updatePromo);

let promoAutoplay = V.interval(promoNext,5000);

updatePromo();

// ── Promo lightbox (click image to view full) ──
function openPromoLightbox(src){
    const box = document.getElementById("promoLightbox");
    const img = document.getElementById("promoLightboxImg");
    if(!box || !img) return;
    img.src = src;
    box.classList.add("open");
    document.body.style.overflow = "hidden";
    // Pause autoplay while viewing
    clearInterval(promoAutoplay);
}
function closePromoLightbox(){
    const box = document.getElementById("promoLightbox");
    if(!box) return;
    box.classList.remove("open");
    document.body.style.overflow = "";
    // Resume autoplay
    clearInterval(promoAutoplay);
    promoAutoplay = V.interval(promoNext,5000);
}
V.on(document,"keydown", function(e){
    if(e.key === "Escape") closePromoLightbox();
});

// ── Outlet carousel arrows (mobile) ──
(function(){
    var grid = document.getElementById('outletGrid');
    var prev = document.getElementById('outletPrev');
    var next = document.getElementById('outletNext');
    if(!grid || !prev || !next) return;

    function stepSize(){
        var card = grid.querySelector('.outlet-card');
        if(!card) return grid.clientWidth * 0.8;
        var gap = parseFloat(getComputedStyle(grid).columnGap || getComputedStyle(grid).gap || 14) || 14;
        return card.getBoundingClientRect().width + gap;
    }
    function updateArrows(){
        var maxScroll = grid.scrollWidth - grid.clientWidth - 2;
        prev.disabled = grid.scrollLeft <= 2;
        next.disabled = grid.scrollLeft >= maxScroll;
    }
    prev.addEventListener('click', function(){
        grid.scrollBy({ left: -stepSize(), behavior: 'smooth' });
    });
    next.addEventListener('click', function(){
        grid.scrollBy({ left: stepSize(), behavior: 'smooth' });
    });
    grid.addEventListener('scroll', updateArrows, { passive: true });
    V.on(window,'resize', updateArrows);
    updateArrows();
})();
// ═══════════════════ PRODUCT CATEGORY (grid) ═══════════════════
// Carousel retired — this section now renders as a grid of cards
// identical to the Recommended cards (see renderCategoryProducts below).

// Smooth nav links
document.querySelectorAll('.nav-link[href^="#"]').forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    var target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active'); });
    this.classList.add('active');
    closeMobileMenu();
  });
});

// ═══════════════════ HERO SLIDER ═══════════════════
var heroSlides = [
  { image: 'Image/kantor 3.jpg', alt: 'Kantor Fabriku' },
  { image: 'Image/Kantor 2.jpg', alt: 'Kantor 2' },
  { image: 'Image/Kantor Kenari Front.webp', alt: 'kantor 3' },
  { image: 'Image/Kantor 4.jpg', alt: 'kantor 4' },
];
var heroIndex = 0;
var heroAutoTimer = null;

function updateHeroSlider() {
  var img = document.getElementById('heroBgImg');
  img.style.opacity = '0';
  setTimeout(function() {
    img.src = heroSlides[heroIndex].image;
    img.alt = heroSlides[heroIndex].alt;
    img.style.opacity = '1';
  }, 300);
  renderHeroDots();
}

function heroSliderNext() {
  heroIndex = (heroIndex + 1) % heroSlides.length;
  updateHeroSlider();
  resetHeroAuto();
}

function heroSliderPrev() {
  heroIndex = (heroIndex - 1 + heroSlides.length) % heroSlides.length;
  updateHeroSlider();
  resetHeroAuto();
}

function renderHeroDots() {
  var container = document.getElementById('heroIndicators');
  container.innerHTML = '';
  for (var i = 0; i < heroSlides.length; i++) {
    var dot = document.createElement('button');
    dot.className = 'hero-dot ' + (i === heroIndex ? 'active' : 'inactive');
    dot.setAttribute('data-i', i);
    dot.setAttribute('aria-label', 'Slide ' + (i + 1));
    dot.onclick = function() {
      heroIndex = parseInt(this.getAttribute('data-i'));
      updateHeroSlider();
      resetHeroAuto();
    };
    container.appendChild(dot);
  }
}

function startHeroAuto() {
  heroAutoTimer = V.interval(heroSliderNext, 5000);
}

function resetHeroAuto() {
  clearInterval(heroAutoTimer);
  startHeroAuto();
}

// Hero touch swipe
var heroTouchStartX = null;
var heroEl = document.getElementById('heroSection');
heroEl.addEventListener('touchstart', function(e) { heroTouchStartX = e.touches[0].clientX; }, { passive: true });
heroEl.addEventListener('touchend', function(e) {
  if (heroTouchStartX === null) return;
  var diff = heroTouchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) { diff > 0 ? heroSliderNext() : heroSliderPrev(); }
  heroTouchStartX = null;
});

// Add transition to hero bg image
(function() {
  var img = document.getElementById('heroBgImg');
  img.style.transition = 'opacity 0.4s ease';
})();

renderHeroDots();
startHeroAuto();

// ═══════════════════ RECOMMENDED PRODUCTS ═══════════════════
// Edit array ini untuk menambah/mengubah produk rekomendasi.
var WA_PHONE = '6281111116110';
var recommendedProducts = [
  {
    name: 'Cotton Combed 30s 42"',
    jenis: 'Cotton Combed',
    image: 'Image/cotton-combed-30s-42.png',
    priceFrom: 'Rp 111.500',
    warna: 75,
    detailUrl: '#/product/cotton-combed-30s'
  },
  {
    name: 'Cotton Combed 24s 42"',
    jenis: 'Cotton Combed',
    image: 'Image/cotton-combed-24s-42.png',
    priceFrom: 'Rp 110.000',
    warna: 77,
    detailUrl: '#/product/cotton-combed-24s'
  },
  {
    name: 'CVC 24s Lacoste 36"',
    jenis: 'CVC Lacoste',
    image: 'Image/cvc-24s-lacoste-36.png',
    priceFrom: 'Rp 100.000',
    warna: 67,
    detailUrl: '#/product/cvc-24s-lacoste-36'
  },
  {
    name: 'CVC 20s Lacoste 36"',
    jenis: 'CVC Lacoste',
    image: 'Image/cvc-20s-lacoste-36.png',
    priceFrom: 'Rp 96.000',
    warna: 31,
    detailUrl: '#/product/cvc-20s-lacoste-36'
  },
  {
    name: 'Versa Heavy Weight Rocky Hard 36"',
    jenis: 'Cotton Special',
    image: 'Image/versa-heavy-weight-rocky-hard-36-uSHb.png',
    priceFrom: 'Rp 122.500',
    warna: 1,
    detailUrl: '#/product/versa-heavy-weight-rocky-hard-36'
  },
  {
    name: 'Cotton Combed 20s 42"',
    jenis: 'Cotton Combed',
    image: 'Image/cotton__combed_20.png',
    priceFrom: 'Rp 108.000',
    warna: 65,
    detailUrl: '#/product/cotton-combed-20s'
  }
];

function buildWaLink(productName) {
  var text = 'Halo Fabriku, saya tertarik dengan ' + productName + '. Boleh info lebih lanjut & minta penawaran harga?';
  return 'https://api.whatsapp.com/send/?phone=' + WA_PHONE + '&text=' + encodeURIComponent(text);
}

// Sample swatch dots shown on each product card. Decorative preview only.
// To show real colours per product, add a `colors: ['#hex', ...]` field to
// that product in the data arrays below — it overrides this default.
var DEFAULT_SWATCHES = ['#1f2937', '#0f766e', '#c8a96e', '#b91c1c', '#1e3a8a'];
function renderColorDots(colors) {
  var list = (colors && colors.length) ? colors.slice(0, 5) : DEFAULT_SWATCHES;
  return list.map(function(c) {
    return '<span class="dot" style="background:' + c + '"></span>';
  }).join('');
}
function buildInfoRow(p) {
  return '<div class="product-info-row">' +
      '<div class="pi-price">' +
        '<span class="pi-price-label">Mulai</span>' +
        '<span class="pi-price-value">' + p.priceFrom + '</span>' +
      '</div>' +
      '<div class="pi-warna">' +
        '<span class="pi-dots">' + renderColorDots(p.colors) + '</span>' +
        '<span class="pi-warna-text">' + p.warna + ' Warna</span>' +
      '</div>' +
    '</div>';
}

function renderRecommendedProducts() {
  var grid = document.getElementById('recommendedGrid');
  if (!grid) return;
  grid.innerHTML = recommendedProducts.map(function(p) {
    var waLink = buildWaLink(p.name);
    var safeAlt = p.name.replace(/"/g, '&quot;');
    return '' +
      '<div class="product-card product-card-rec">' +
        '<div class="product-card-img">' +
          '<img src="' + p.image + '" alt="' + safeAlt + '" loading="lazy">' +
          '<span class="product-badge-rec">Rekomendasi</span>' +
        '</div>' +
        '<div class="product-card-body">' +
          '<h3>' + p.name + '</h3>' +
          '<div class="product-card-meta">' +
            '<span class="product-jenis">' + p.jenis + '</span>' +
          '</div>' +
          buildInfoRow(p) +
          '<div class="product-card-cta">' +
            '<a class="btn-order" href="' + waLink + '" target="_blank" rel="noopener" aria-label="Pesan ' + safeAlt + ' via WhatsApp">' +
              'Pesan Sekarang' +
            '</a>' +
            '<a class="btn-detail" href="' + p.detailUrl + '">' +
              'Lihat Detail' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>';
  }).join('');
}
renderRecommendedProducts();

// ═══════════════════ PRODUCT CATEGORY ═══════════════════
// Edit array ini untuk menambah/mengubah kartu kategori produk.
// Kartu memakai layout yang sama persis dengan kartu Rekomendasi.
var categoryProducts = [
  {
    name: 'CVC Premium',
    jenis: 'CVC',
    image: 'Image/cover homepage utama-01.png',
    priceFrom: 'Rp 96.000',
    warna: 42,
    detailUrl: '#/catalog'
  },
  {
    name: 'Cotton Combed',
    jenis: 'Cotton',
    image: 'Image/cover homepage utama-03.png',
    priceFrom: 'Rp 108.000',
    warna: 77,
    detailUrl: '#/catalog'
  },
  {
    name: 'Cotton Special',
    jenis: 'Cotton Special',
    image: 'Image/cover homepage utama-04.png',
    priceFrom: 'Rp 103.000',
    warna: 36,
    detailUrl: '#/catalog'
  },
  {
    name: 'Cotton Fleece',
    jenis: 'Fleece',
    image: 'Image/cover homepage utama-06.png',
    priceFrom: 'Rp 112.000',
    warna: 28,
    detailUrl: '#/catalog'
  },
  {
    name: 'Knitease Danball',
    jenis: 'M-TIIS Flexxair',
    image: 'Image/cover homepage utama-02.png',
    priceFrom: 'Rp 98.000',
    warna: 18,
    detailUrl: '#/catalog'
  }
];

function renderCategoryProducts() {
  var grid = document.getElementById('categoryGrid');
  if (!grid) return;
  grid.innerHTML = categoryProducts.map(function(p) {
    var waLink = buildWaLink(p.name);
    var safeAlt = p.name.replace(/"/g, '&quot;');
    return '' +
      '<div class="product-card product-card-rec">' +
        '<div class="product-card-img">' +
          '<img src="' + p.image + '" alt="' + safeAlt + '" loading="lazy">' +
          '<span class="product-badge-rec">Baru</span>' +
        '</div>' +
        '<div class="product-card-body">' +
          '<h3>' + p.name + '</h3>' +
          '<div class="product-card-meta">' +
            '<span class="product-jenis">' + p.jenis + '</span>' +
          '</div>' +
          buildInfoRow(p) +
          '<div class="product-card-cta">' +
            '<a class="btn-order" href="' + waLink + '" target="_blank" rel="noopener" aria-label="Pesan ' + safeAlt + ' via WhatsApp">' +
              'Pesan Sekarang' +
            '</a>' +
            '<a class="btn-detail" href="' + p.detailUrl + '">' +
              'Lihat Detail' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>';
  }).join('');
}
renderCategoryProducts();

// ═══════════════════ TESTIMONIALS ═══════════════════
// Data-driven testimonial list.
// - type: 'ig'     → Instagram post/reel. videoId = post ID (from URL /p/POST_ID/)
// - type: 'gdrive' → Google Drive video.  videoId = file ID (from URL /file/d/FILE_ID/)
// Ganti GDRIVE_FILE_ID_X dengan File ID Google Drive yang sesungguhnya.
var testimonials = [
    { name: "SixAntemMeridiem",       role: "Komunitas Running Bandung",          type: "gdrive",     videoId: "1WnkeyuLvtq3SrZH4wGvgvdWD2CK94Dz6" },
    { name: "Rio Hefriyanto",  role: "Owner Insurgent Club",            type: "ig",     videoId: "DZW-QKip77I" },
    { name: "Christian Kesu",  role: "Founder Sekolah Sablon Indonesia", type: "ig",     videoId: "DamtpgYtBHy" },
    { name: "Dion",            role: "Noid Studio",                     type: "ig",     videoId: "DXdR7CakTQJ" },
    { name: "Dwi",             role: "Index Screen Printing",           type: "gdrive", videoId: "1q2X7tMRUn7Ju0HTsog6d7qiVN_LkWSD6" },
    { name: "Raka",            role: "Genyo Sablon",                    type: "gdrive", videoId: "1YFQWswk9vd8Fnc8CRDN1qO8mCgAn_Eh3" },
];

function getInitials(name){
    return name.split(/\s+/).filter(Boolean).slice(0,2).map(function(w){ return w[0].toUpperCase(); }).join('');
}
function getEmbedUrl(t){
    if (t.type === 'ig')     return 'https://www.instagram.com/p/' + t.videoId + '/embed/';
    if (t.type === 'gdrive') return 'https://drive.google.com/file/d/' + t.videoId + '/preview';
    return '';
}

function renderTestimonials(){
    var list = document.getElementById('testimonialList');
    list.innerHTML = testimonials.map(function(t, i){
        return '<button type="button" class="tst-chip' + (i === 0 ? ' active' : '') + '" data-index="' + i + '">' +
            '<span class="tst-chip-avatar">' + getInitials(t.name) + '</span>' +
            '<span class="tst-chip-name">' + t.name + '</span>' +
        '</button>';
    }).join('');
    list.querySelectorAll('.tst-chip').forEach(function(chip){
        chip.addEventListener('click', function(){
            selectTestimonial(parseInt(this.getAttribute('data-index')));
        });
    });
    // load first video
    selectTestimonial(0, true);
}

function selectTestimonial(index, skipAnim){
    var t = testimonials[index];
    if (!t) return;
    var frame  = document.getElementById('testimonialFrame');
    var screen = document.getElementById('testimonialScreen');
    var nameEl = document.getElementById('tstName');
    var roleEl = document.getElementById('tstRole');
    var url    = getEmbedUrl(t);

    // Update active chip
    document.querySelectorAll('.tst-chip').forEach(function(c, i){
        c.classList.toggle('active', i === index);
    });

    // Update info panel text
    nameEl.textContent = t.name;
    roleEl.textContent = t.role;

    if (skipAnim){
        screen.setAttribute('data-type', t.type);
        frame.src = url;
        return;
    }
    frame.style.opacity = '0';
    setTimeout(function(){
        screen.setAttribute('data-type', t.type);
        frame.src = url;
        frame.style.opacity = '1';
    }, 200);
}

renderTestimonials();

// ═══════════════════ ARTIKEL / BLOG ═══════════════════
// Data manual — update array ini untuk mengganti artikel yang tampil di homepage.
// Ambil 4 artikel terbaru dari https://fabriku.com/blog secara manual.
var artikelData = [
  {
    title: "Kenapa Kaos Warna Hitam Populer? Simak 7 Alasan di Baliknya",
    url: "https://fabriku.com/blog/kenapa-kaos-warna-hitam-populer",
    image: "https://fabriku.com/storage/uploads/YbXEnM6ZD0iV4FiGdORGhojPyW7syHBXrFPKEGLS.png",
    date: "15 Jul 2025",
    category: "Umum"
  },
  {
    title: "CVC Lacoste Dusty Rose: Bahan Premium untuk Fashion Elegan",
    url: "https://fabriku.com/blog/kain-cvc-lacoste-fabric-dusty-rose",
    image: "https://fabriku.com/storage/uploads/ERiLmr9JbzzAVCGkYSZuUgWV5KFiqrBv5NhFMKNK.png",
    date: "13 Jul 2025",
    category: "Umum"
  },
  {
    title: "Kenali Apa itu Bahan Oxford: Pengertian, Kelebihan, Kekurangan, dan Kegunaannya",
    url: "https://fabriku.com/blog/apa-itu-bahan-oxford",
    image: "https://fabriku.com/storage/uploads/WIPM27qqY4vMxnrWIK6B7MdqfolhRww4vyugkJIV.webp",
    date: "08 Jul 2025",
    category: "Umum"
  },
  {
    title: "Bahan Katun Mikro: Kenapa Banyak Brand Memilih Kain Ini?",
    url: "https://fabriku.com/blog/bahan-katun-mikro-kenapa-banyak-brand-memilih-kain-ini",
    image: "https://fabriku.com/storage/uploads/aJ8SjiFHqTAXrjq6KLMibBimttfo6lkkTa9tk3E4.png",
    date: "30 Jun 2025",
    category: "Bahan"
  }
];

function renderArtikelCards() {
  var grid = document.getElementById('artikelGrid');
  grid.innerHTML = artikelData.map(function(a) {
    var img = a.image
      ? '<img src="' + a.image + '" alt="' + a.title.replace(/"/g,'&quot;') + '" loading="lazy" onerror="this.style.display=\'none\'">'
      : '';
    var cat = a.category
      ? '<span class="artikel-category">' + a.category + '</span>'
      : '';
    var date = a.date
      ? '<span class="artikel-date">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
          a.date +
        '</span>'
      : '';
    return '<a class="artikel-card" href="' + a.url + '" target="_blank" rel="noopener">' +
      '<div class="artikel-card-img">' + cat + img + '</div>' +
      '<div class="artikel-card-body">' +
        date +
        '<h3>' + a.title + '</h3>' +
        '<span class="artikel-cta">Baca Selengkapnya ' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
        '</span>' +
      '</div>' +
    '</a>';
  }).join('');
}

// Init
renderArtikelCards();


  try{window.toggleMobileMenu=toggleMobileMenu;}catch(e){}
  try{window.closeMobileMenu=closeMobileMenu;}catch(e){}
  try{window.toggleMobileGroup=toggleMobileGroup;}catch(e){}
  try{window.closePromoLightbox=closePromoLightbox;}catch(e){}
  try{window.heroSliderNext=heroSliderNext;}catch(e){}
  try{window.heroSliderPrev=heroSliderPrev;}catch(e){}
  try{window.openPromoLightbox=openPromoLightbox;}catch(e){}
  try{window.promoNext=promoNext;}catch(e){}
  try{window.promoPrev=promoPrev;}catch(e){}
  try{window.scrollToTop=scrollToTop;}catch(e){}
  try{window.setActiveNav=setActiveNav;}catch(e){}
}

function init_catalog(){

    // Mobile menu toggle
    function toggleMobileMenu() {
      document.getElementById('mobileMenu').classList.toggle('open');
      document.getElementById('mobileMenuBackdrop').classList.toggle('open');
      document.getElementById('hamburgerBtn').classList.toggle('open');
    }
    function closeMobileMenu() {
      document.getElementById('mobileMenu').classList.remove('open');
      document.getElementById('mobileMenuBackdrop').classList.remove('open');
      document.getElementById('hamburgerBtn').classList.remove('open');
      document.querySelectorAll('.m-group.open').forEach(function(g){ g.classList.remove('open'); });
    }
    function toggleMobileGroup(id) {
      var el = document.getElementById(id);
      if (!el) return;
      document.querySelectorAll('.m-group').forEach(function(g){
        if (g !== el) g.classList.remove('open');
      });
      el.classList.toggle('open');
    }

    // Desktop dropdowns — tap chevron to toggle, click outside to close
    (function(){
      var items = document.querySelectorAll('.navbar .nav-item');
      items.forEach(function(item){
        var chev = item.querySelector('.chev');
        if (!chev) return;
        chev.addEventListener('click', function(e){
          e.preventDefault();
          e.stopPropagation();
          items.forEach(function(i){ if (i !== item) i.classList.remove('open'); });
          item.classList.toggle('open');
        });
      });
      V.on(document,'click', function(e){
        if (!e.target.closest('.navbar .nav-item')) {
          items.forEach(function(i){ i.classList.remove('open'); });
        }
      });
      V.on(document,'keydown', function(e){
        if (e.key === 'Escape') items.forEach(function(i){ i.classList.remove('open'); });
      });
    })();

    // ============================================
    // CATALOG: search + category chips + toko + sort
    // ============================================
    (function(){
      var searchInput = document.getElementById('catalogSearch');
      var chips       = document.querySelectorAll('.chips .chip');
      var tokoSelect  = document.getElementById('tokoFilter');
      var sortSelect  = document.getElementById('sortFilter');
      var grid        = document.querySelector('.grid-section .grid');
      if (!grid) return;
      var cards       = Array.prototype.slice.call(grid.querySelectorAll('.card'));

      // Keep the original DOM order so "Terpopuler" can restore it
      var originalOrder = cards.slice();

      // Parse price from ".price" text, e.g. "Rp 104.000/kg" -> 104000
      function priceOf(card){
        var el = card.querySelector('.price');
        if (!el) return 0;
        var digits = el.textContent.replace(/[^0-9]/g, '');
        return digits ? parseInt(digits, 10) : 0;
      }

      // Build a lowercase haystack per card (title + specs + category)
      cards.forEach(function(card){
        var title = card.querySelector('.card-title');
        var specs = card.querySelectorAll('.specs .spec-value');
        var parts = [];
        if (title) parts.push(title.textContent);
        specs.forEach(function(s){ parts.push(s.textContent); });
        parts.push(card.getAttribute('data-category') || '');
        card.dataset.searchText = parts.join(' ').toLowerCase();
      });

      var state = {
        q: '',
        category: 'all',
        toko: 'all',
        sort: 'popular'
      };

      function applyFilters(){
        // 1. Sort a working copy
        var working = originalOrder.slice();
        if (state.sort === 'price-asc') {
          working.sort(function(a,b){ return priceOf(a) - priceOf(b); });
        } else if (state.sort === 'price-desc') {
          working.sort(function(a,b){ return priceOf(b) - priceOf(a); });
        } else if (state.sort === 'newest') {
          // Treat later-in-DOM as newer
          working.reverse();
        } // else 'popular' = originalOrder

        // 2. Reattach in the new order (only if it differs) — keeps things cheap
        working.forEach(function(card){ grid.appendChild(card); });

        // 3. Filter visibility
        var q = state.q.trim().toLowerCase();
        var visible = 0;
        working.forEach(function(card){
          var cat  = card.getAttribute('data-category') || '';
          var toko = card.getAttribute('data-toko') || 'all';

          var okCategory = (state.category === 'all') || (cat === state.category);
          var okToko     = (state.toko === 'all') || (toko === 'all') || (toko === state.toko);
          var okSearch   = !q || card.dataset.searchText.indexOf(q) !== -1;

          if (okCategory && okToko && okSearch) {
            card.style.display = '';
            visible++;
          } else {
            card.style.display = 'none';
          }
        });

        renderEmptyState(visible);
      }

      // Empty-state message
      var emptyEl = null;
      function renderEmptyState(visible){
        if (visible > 0) {
          if (emptyEl) emptyEl.style.display = 'none';
          return;
        }
        if (!emptyEl) {
          emptyEl = document.createElement('div');
          emptyEl.className = 'catalog-empty';
          emptyEl.style.cssText = 'grid-column: 1 / -1; padding: 48px 20px; text-align:center; color:#555; font-size:15px; line-height:1.6;';
          emptyEl.innerHTML = '<div style="font-size:32px; margin-bottom:8px;">🔍</div>' +
                              '<div style="font-weight:600; color:#111; margin-bottom:4px;">Tidak ada produk yang cocok</div>' +
                              '<div>Coba ubah kata kunci atau reset filter.</div>';
          grid.appendChild(emptyEl);
        }
        emptyEl.style.display = '';
      }

      // Search input — debounced
      if (searchInput) {
        var t;
        searchInput.addEventListener('input', function(){
          clearTimeout(t);
          t = setTimeout(function(){
            state.q = searchInput.value;
            applyFilters();
          }, 120);
        });
      }

      // Cmd/Ctrl + K focuses search
      V.on(document,'keydown', function(e){
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          if (searchInput) { searchInput.focus(); searchInput.select(); }
        }
      });

      // Category chips
      chips.forEach(function(chip){
        chip.addEventListener('click', function(){
          chips.forEach(function(c){ c.classList.remove('active'); });
          chip.classList.add('active');
          state.category = chip.getAttribute('data-filter') || 'all';
          applyFilters();
        });
      });

      // Toko + Sort selects
      if (tokoSelect) {
        tokoSelect.addEventListener('change', function(){
          state.toko = tokoSelect.value;
          applyFilters();
        });
      }
      if (sortSelect) {
        sortSelect.addEventListener('change', function(){
          state.sort = sortSelect.value;
          applyFilters();
        });
      }

      // Apply filter/search from URL (?cat= or ?q=) — used by the navbar Katalog dropdown
      (function applyFromUrl(){
        var params = new URLSearchParams((location.hash.split('?')[1]||''));
        var cat = params.get('cat');
        var q   = params.get('q');
        if (cat) {
          state.category = cat;
          var matched = false;
          chips.forEach(function(c){
            var isMatch = (c.getAttribute('data-filter') === cat);
            c.classList.toggle('active', isMatch);
            if (isMatch) matched = true;
          });
          // No chip matches (e.g. a category with no products) -> clear all active chips
          if (!matched) chips.forEach(function(c){ c.classList.remove('active'); });
        }
        if (q && searchInput) {
          searchInput.value = q;
          state.q = q;
        }
        if (cat || q) {
          applyFilters();
          // Bring the results into view under the sticky filter bar
          var fb = document.querySelector('.filter-bar');
          if (fb) {
            requestAnimationFrame(function(){
              var y = fb.getBoundingClientRect().top + window.pageYOffset - 8;
              window.scrollTo({ top: y, behavior: 'smooth' });
            });
          }
        }
      })();

      // Favorite heart toggle (nice-to-have while we're here)
      document.querySelectorAll('.card-fav').forEach(function(btn){
        btn.addEventListener('click', function(e){
          e.preventDefault();
          btn.classList.toggle('is-fav');
          var svg = btn.querySelector('svg');
          if (svg) svg.setAttribute('fill', btn.classList.contains('is-fav') ? 'currentColor' : 'none');
        });
      });
    })();
  

/* Make catalog cards navigate to their product page */
(function(){
  document.querySelectorAll('.card[data-href]').forEach(function(card){
    card.style.cursor = 'pointer';
    card.addEventListener('click', function(e){
      if (e.target.closest('a, button, select, input, label')) return;
      window.location.href = card.getAttribute('data-href');
    });
  });
})();


  try{window.toggleMobileMenu=toggleMobileMenu;}catch(e){}
  try{window.closeMobileMenu=closeMobileMenu;}catch(e){}
  try{window.toggleMobileGroup=toggleMobileGroup;}catch(e){}
}

function init_stock(){

/* ============================================================
   1) NOMOR WHATSAPP  (format internasional tanpa + / spasi)
   ============================================================ */
const WA_NUMBER = "628123456789";

/* ============================================================
   2) DAFTAR CABANG
   ============================================================ */
const BRANCHES = [
  "Cabang Kenari - Bandung",
  "Cabang Pasirkoja - Bandung",
  "Cabang Yogyakarta - Yogyakarta",
  "Cabang Surabaya - Surabaya"
];

/* ============================================================
   3) DATA KATALOG  (kategori -> varian -> warna)
      warna: { n:"Nama", s:"ready|low|out", h:"#hex"?, img:"url"? }
      - "warna X" pada varian dihitung otomatis dari jumlah warna.
   ============================================================ */
/* Palet warna umum (dipakai utk chip contoh). Tambah nama warna di sini. */
const PALETTE = ["Putih","Hitam","Abu","Abu Muda","Navy","Misty","Maroon","Mustard",
  "Army Green","Biru Baby","Tosca","Mocca","Dusty","Cream","Olive","Merah","Kuning",
  "Orange","Peach","Salem","Pink","Lavender","Ungu","Coklat","Sage","Beige","Turkis",
  "Hijau Botol","Biru Benhur","Gold"];
/* Buat SEMUA warna sebanyak count. Nama dari PALETTE dulu, sisanya
   jadi placeholder "Warna N" (silakan diganti dgn nama asli). */
function sampleColors(count){
  const arr=[];
  for(let i=0;i<count;i++){
    let s="ready"; if(i%9===4) s="low"; if(i===7 && count>25) s="out";
    arr.push({ n: i < PALETTE.length ? PALETTE[i] : "Warna "+(i+1), s });
  }
  return arr;
}
/* Gabung daftar warna asli + placeholder sampai jumlah "total". */
function pad(real,total){
  const arr=real.slice();
  for(let i=real.length;i<total;i++) arr.push({ n:"Warna "+(i+1), s:"ready" });
  return arr;
}

/* ============================================================
   3) DATA KATALOG  (kategori -> varian -> warna)
   FIELD PENTING per varian:
     name   : nama varian (tampil di badge)
     count  : JUMLAH WARNA ASLI  -> muncul sbg "X Warna"
     colors : daftar warna yg ditampilkan. Kalau lebih sedikit dari
              count, otomatis muncul "+N warna lainnya".
   warna: { n:"Nama", s:"ready|low|out", h:"#hex"?, img:"url"? }
   Ganti sampleColors(count) dgn [ {n:"..",s:".."}, ... ] utk daftar asli.
   ============================================================ */
const CATALOG = [
  { cat:"Cotton", ic:"cotton", img:"Image/cotton stock.png", variants:[
    { name:'Cotton Combed 20s 42"', count:4, colors:sampleColors(4) },
    /* 32 warna asli dari screenshot + placeholder sampai 77. */
    { name:'Cotton Combed 24s 42"', count:77, colors:pad([
      {n:"Abu",s:"ready"},{n:"Abu Muda",s:"ready"},{n:"Aqua Foam",s:"ready"},{n:"Army Green",s:"low"},
      {n:"Banana Cream",s:"ready"},{n:"Beige",s:"ready"},{n:"Biru Baby",s:"ready"},{n:"Biru New",s:"ready"},
      {n:"Biru Pon",s:"low"},{n:"Biru Sedang",s:"ready"},{n:"Coklat",s:"ready"},{n:"Cream",s:"ready"},
      {n:"Dusty",s:"ready"},{n:"Hijau Botol",s:"ready"},{n:"Hijau Tosca",s:"low"},{n:"Hitam",s:"ready"},
      {n:"Kuning",s:"ready"},{n:"Lavender",s:"ready"},{n:"Maroon",s:"ready"},{n:"Merah",s:"ready"},
      {n:"Merah Bata",s:"ready"},{n:"Mocca",s:"low"},{n:"Mustard",s:"ready"},{n:"Navy",s:"ready"},
      {n:"Olive",s:"ready"},{n:"Orange",s:"ready"},{n:"Peach",s:"ready"},{n:"Pink",s:"ready"},
      {n:"Putih",s:"ready"},{n:"Salem",s:"ready"},{n:"Tosca",s:"ready"},{n:"Ungu",s:"out"}
    ], 77) },
    { name:'Cotton Combed 30s 42"', count:75, colors:sampleColors(75) }
  ]},
  { cat:"CVC", ic:"weave", img:"Image/cvc stock.png", variants:[
    { name:'CVC 20s Lacoste 36"', count:31, colors:sampleColors(31) },
    { name:'CVC 24s Lacoste 36"', count:67, colors:sampleColors(67) },
    { name:'CVC 24s Lacoste 42"', count:2, colors:[{n:"Putih",s:"ready"},{n:"Hitam",s:"ready"}] }
  ]},
  { cat:"Cotton Special", ic:"drop", img:"Image/cotton special stock.png", variants:[
    { name:'Rocky Cotton', count:13, colors:sampleColors(13) },
    { name:'Versa Heavy Weight Rocky Hard 36"', count:1, colors:[{n:"Putih",s:"ready"}] },
    { name:'Cotton Elastech 30s 72"', count:4, colors:sampleColors(4) }
  ]},
  { cat:"Bamboo Cotton", ic:"leaf", img:"Image/bamboo stock.png", variants:[
    { name:'Bamboo Cotton 30s 42"', count:8, colors:sampleColors(8) }
  ]},
  { cat:"Knitease Danball", ic:"grid", img:"Image/danball stock.png", variants:[
    { name:'Knitease Danball 200 64"', count:6, colors:sampleColors(6) }
  ]},
  { cat:"STARTER PACK", ic:"box", img:"Image/starterpack stock.png", variants:[
    { name:'Starter Versa Cotton 24s 42"', count:1, colors:[{n:"Putih",s:"ready"}] }
  ]}
];

/* ============================================================
   KAMUS WARNA  -> tebak hex dari nama (boleh ditambah)
   ============================================================ */
const COLOR_MAP = {
  "putih":"#f6f5f1","hitam":"#20232a","abu":"#9aa1a6","abu muda":"#c3c8cc","abu tua":"#6b7075","abu misty":"#b7bcbf",
  "misty":"#c6cbce","navy":"#1f2a52","biru baby":"#a9d3e8","biru new":"#20418c","biru pon":"#2f6fd0",
  "biru sedang":"#3f78d6","biru benhur":"#2a4a9c","merah":"#c33636","merah bata":"#b25a3e","marun":"#6e2230",
  "maroon":"#6e2230","mocca":"#8a6a4f","dusty":"#b79aa3","army green":"#4b5320","olive":"#6f7331",
  "hijau botol":"#1f5138","hijau tosca":"#1fae9a","tosca":"#1fae9a","sage":"#9caf88","aqua foam":"#a9e5d0",
  "banana cream":"#f4e6a1","beige":"#e6d8bf","cream":"#f1e9d2","coklat":"#6a4a34","kuning":"#f2c43d",
  "mustard":"#d1962a","lavender":"#c3b5e0","ungu":"#7a4fae","orange":"#e08535","peach":"#f4c1a3",
  "pink":"#e79bb6","salem":"#e9a58c"
};
function guessHex(name){
  const k = name.trim().toLowerCase();
  if (COLOR_MAP[k]) return COLOR_MAP[k];
  // cocokkan kata kunci di dalam nama
  for (const key in COLOR_MAP){ if (k.includes(key)) return COLOR_MAP[key]; }
  // hash sederhana sebagai fallback agar tetap berwarna
  let h=0; for (let i=0;i<k.length;i++) h=(h*31+k.charCodeAt(i))>>>0;
  return `hsl(${h%360} 32% 62%)`;
}
function isLight(hex){
  if (!hex.startsWith("#")) return false;
  const c=hex.slice(1); const n=c.length===3?c.split("").map(x=>x+x).join(""):c;
  const r=parseInt(n.slice(0,2),16),g=parseInt(n.slice(2,4),16),b=parseInt(n.slice(4,6),16);
  return (0.299*r+0.587*g+0.114*b) > 200;
}
const ICONS = {
  leaf:'<path d="M4 20C4 9 20 4 20 4s-1 16-12 16c-3 0-4-2-4-2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 16l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  drop:'<path d="M12 3s6 6.5 6 11a6 6 0 11-12 0c0-4.5 6-11 6-11z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  spring:'<path d="M5 5h14M5 19h14M7 5c0 3 10 3 10 7s-10 4-10 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  spool:'<rect x="7" y="4" width="10" height="16" rx="2" stroke="currentColor" stroke-width="2"/><path d="M4 8h3M17 8h3M4 16h3M17 16h3M9 8v8M15 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  weave:'<path d="M4 4v16M10 4v16M16 4v16M4 8h16M4 14h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  grid:'<rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2"/><path d="M4 10h16M4 15h16M10 4v16M15 4v16" stroke="currentColor" stroke-width="1.6"/>',
  box:'<path d="M12 3l8 4v10l-8 4-8-4V7l8-4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4 7l8 4 8-4M12 11v10" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  cotton:'<circle cx="12" cy="8" r="2.3" stroke="currentColor" stroke-width="1.6"/><circle cx="8.5" cy="10.5" r="2.3" stroke="currentColor" stroke-width="1.6"/><circle cx="15.5" cy="10.5" r="2.3" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="2.6" stroke="currentColor" stroke-width="1.6"/><path d="M12 14.5V20M9.5 20h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
};

/* ===================== RENDER ===================== */
const listEl = document.getElementById("list");
const cart = new Map();   // key -> {label, branch}

function chevron(){ return '<svg class="chev-r" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
function stockLabel(s){ return s==="out"?"Habis":s==="low"?"Menipis":"Ready"; }
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

function buildCatalog(){
  listEl.innerHTML = "";
  let totVar=0, totCol=0;
  CATALOG.forEach((cat,ci)=>{
    totVar += cat.variants.length;
    const cat_el = document.createElement("section");
    cat_el.className = "cat";
    const nVar = cat.variants.length;

    let variantsHTML = "";
    cat.variants.forEach((v,vi)=>{
      const total = v.count ?? v.colors.length;   // jumlah warna asli
      totCol += total;
      let colorsHTML = "";
      v.colors.forEach((col,coi)=>{
        const hex = col.h || guessHex(col.n);
        const full = (v.name + " " + col.n).toUpperCase();  // utk pencarian & pesanan
        const bg = col.img ? `background-image:url('${col.img}');` : `--c:${hex};`;
        const wov = col.img ? "" : "woven";
        const out = col.s==="out";
        const key = cat.cat+"|"+v.name+"|"+col.n;
        colorsHTML += `
          <button class="color" ${out?"disabled":""} data-name="${esc(full.toLowerCase())}"
            data-key="${esc(key)}" data-label="${esc(full)}" title="${esc(full)} — ${stockLabel(col.s)}">
            <span class="swatch ${wov}" style="${bg}">
              <span class="dot ${col.s}"></span>
              <span class="tick"><svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
            </span>
            <span class="c-name">${esc(col.n.toUpperCase())}</span>
          </button>`;
      });

      const moreN = total - v.colors.length;
      const moreHTML = moreN > 0
        ? `<div class="more">+${moreN} warna lainnya belum ditampilkan</div>` : "";

      variantsHTML += `
        <div class="variant" data-var="${esc(v.name.toLowerCase())}">
          <button class="var-head" onclick="toggleVar(this)">
            <b>${esc(v.name.toUpperCase())}</b>
            <span class="warna">${total} Warna</span>
            ${chevron()}
          </button>
          <div class="var-body"><div><div class="colors">${colorsHTML}</div>${moreHTML}</div></div>
        </div>`;
    });

    const coverImg = cat.img ? `<img src="${esc(cat.img)}" alt="${esc(cat.cat)}" loading="lazy" onerror="this.remove()">` : "";
    const catIcon = '<svg viewBox="0 0 24 24" fill="none">'+(ICONS[cat.ic]||ICONS.spool)+'</svg>';
    cat_el.innerHTML = `
      <button class="cat-head" onclick="toggleCat(this)">
        <span class="cat-cover"><span class="cover-bg"></span>${coverImg}</span>
        <span class="cat-title"><b>${esc(cat.cat)}</b>${catIcon}</span>
        <span class="cat-variants">${nVar} varian</span>
        <span class="cat-spacer"></span>
        ${chevron()}
      </button>
      <div class="cat-body"><div><div class="cat-inner">${variantsHTML}</div></div></div>`;
    listEl.appendChild(cat_el);
  });

  document.getElementById("stCat").textContent = CATALOG.length;
  document.getElementById("stVar").textContent = totVar;
  document.getElementById("stCol").textContent = totCol;
}

function toggleCat(btn){ btn.closest(".cat").classList.toggle("open"); }
function toggleVar(btn){ btn.closest(".variant").classList.toggle("open"); }

/* ---- Panel info warna (expand penuh di bawah baris grid) ---- */
function colorStock(key){
  // PLACEHOLDER stok per warna — ganti dgn data asli kalau sudah ada.
  let h=0; for(let i=0;i<key.length;i++) h=(h*31+key.charCodeAt(i))>>>0;
  return { ecer:((h%900)/10).toFixed(2), roll:(h%25), rib:(((h>>3)%1600)/10).toFixed(2) };
}
function buildColorInfo(tile){
  const key=tile.dataset.key, label=tile.dataset.label;
  const swStyle=(tile.querySelector(".swatch").getAttribute("style")||"");
  const st=colorStock(key);
  const branch=(document.getElementById("branch")||{}).value||"";
  const inCart=cart.has(key);
  const cartIcon='<svg viewBox="0 0 24 24" fill="none"><path d="M6 6h15l-1.5 9h-12z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M6 6L5 3H2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="20" r="1.4" fill="currentColor"/><circle cx="18" cy="20" r="1.4" fill="currentColor"/></svg>';
  return `
    <div class="ci-head">
      <span class="ci-sw" style="${swStyle}"></span>
      <div class="ci-title"><b>${esc(label)}</b><small>${esc(branch)}</small></div>
    </div>
    <div class="ci-stock">
      <div class="ci-group">
        <span class="ci-label">Body</span>
        <div class="ci-row"><span>ecer</span><b>${st.ecer} kg</b></div>
        <div class="ci-row"><span>roll</span><b>${st.roll} roll</b></div>
      </div>
      <div class="ci-group">
        <span class="ci-label">Aksesoris</span>
        <div class="ci-row"><span>rib</span><b>${st.rib} kg</b></div>
      </div>
    </div>
    <button class="ci-add ${inCart?'in':''}" data-key="${esc(key)}" data-label="${esc(label)}">
      ${cartIcon}<span class="ci-add-txt">${inCart?'Hapus dari pesanan':'Tambah ke pesanan'}</span>
    </button>`;
}
function openColorInfo(tile){
  const grid=tile.closest(".colors");
  const existing=grid.querySelector(".color-info");
  const same=existing && existing.dataset.for===tile.dataset.key;
  if (existing) existing.remove();
  grid.querySelectorAll(".color.active").forEach(t=>t.classList.remove("active"));
  if (same) return;                        // klik warna yg sama = tutup panel
  tile.classList.add("active");
  const tiles=Array.from(grid.querySelectorAll(".color"));
  const top=tile.offsetTop; let last=tile;
  tiles.forEach(t=>{ if (Math.abs(t.offsetTop-top)<2) last=t; });   // tile terakhir di baris yg sama
  const panel=document.createElement("div");
  panel.className="color-info"; panel.dataset.for=tile.dataset.key;
  panel.innerHTML=buildColorInfo(tile);
  last.insertAdjacentElement("afterend", panel);
}

/* klik warna -> buka panel info; tombol di dalam panel -> tambah/hapus pesanan */
listEl.addEventListener("click", e=>{
  const add = e.target.closest(".ci-add");
  if (add){ addItem(add.dataset.key, add.dataset.label); return; }
  const btn = e.target.closest(".color");
  if (!btn || btn.disabled) return;
  openColorInfo(btn);
});

/* (search bar dihapus) */

/* ===================== CABANG ===================== */
const branchEl = document.getElementById("branch");
BRANCHES.forEach(b=>{ const o=document.createElement("option"); o.value=b; o.textContent=b; branchEl.appendChild(o); });
branchEl.addEventListener("change", ()=> toast("Cabang: "+branchEl.value));

/* ===================== KERANJANG / ORDER ===================== */
const tray=document.getElementById("tray"), trayCount=document.getElementById("trayCount"),
      trayTitle=document.getElementById("trayTitle"), traySub=document.getElementById("traySub");

function cssKey(key){ return (window.CSS&&CSS.escape)?CSS.escape(key):key; }
function addItem(key,label){
  if (cart.has(key)){ cart.delete(key); toast("Dihapus dari pesanan"); }
  else { cart.set(key,label); toast("Ditambahkan ke pesanan"); }
  const inCart=cart.has(key);
  document.querySelectorAll(`.color[data-key="${cssKey(key)}"]`).forEach(el=>el.classList.toggle("sel", inCart));
  const ci=document.querySelector(`.ci-add[data-key="${cssKey(key)}"]`);
  if (ci){ ci.classList.toggle("in", inCart); const t=ci.querySelector(".ci-add-txt"); if(t) t.textContent = inCart ? "Hapus dari pesanan" : "Tambah ke pesanan"; }
  refreshTray();
}
function refreshTray(){
  const n=cart.size;
  trayCount.textContent=n;
  trayTitle.textContent = n+" item dipilih";
  traySub.textContent = n ? "Cabang: "+branchEl.value : "Siap dipesan";
  tray.classList.toggle("show", n>0);
}
document.getElementById("trayClr").addEventListener("click", ()=>{
  cart.clear();
  document.querySelectorAll(".color.sel").forEach(el=>el.classList.remove("sel"));
  refreshTray();
});
document.getElementById("trayWa").addEventListener("click", ()=>{
  if (!cart.size) return;
  const lines = [...cart.values()].map((l,i)=>`${i+1}. ${l}`).join("%0A");
  const msg = `Halo Fabriku 👋%0ASaya mau tanya stok/pesan kain berikut (${branchEl.value}):%0A%0A${lines}`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
});

/* ===================== TOAST ===================== */
let toastT;
const toastEl=document.getElementById("toast");
function toast(m){ toastEl.textContent=m; toastEl.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>toastEl.classList.remove("show"),1600); }

/* ===================== STICKY SHADOW ===================== */
const sb=document.getElementById("searchbar");
const sentinel=document.createElement("div"); sb.parentNode.insertBefore(sentinel, sb);
new IntersectionObserver(([e])=> sb.classList.toggle("stuck", !e.isIntersecting), {rootMargin:"-1px 0px 0px 0px", threshold:1}).observe(sentinel);

/* init */
buildCatalog();
document.querySelector(".cat")?.classList.add("open");   // buka kategori pertama biar terlihat isi
document.querySelector(".variant")?.classList.add("open");


  try{window.toggleMobileMenu=toggleMobileMenu;}catch(e){}
  try{window.closeMobileMenu=closeMobileMenu;}catch(e){}
  try{window.toggleMobileGroup=toggleMobileGroup;}catch(e){}
  try{window.toggleCat=toggleCat;}catch(e){}
  try{window.toggleVar=toggleVar;}catch(e){}
}

function init_product_bamboo_cotton_30s(){

    var PRODUCT = "BAMBOO COTTON 30S 42\"";
    var BASE_PRICE = 104000;
    var IMG_DIR = "Image/bamboo-cotton-30s/";
    var FAMILIES = [
      { id:"all", label:"Semua", swatch:null },
      { id:"netral", label:"Putih & Abu", swatch:"#C9C9C4" },
      { id:"hitam", label:"Hitam", swatch:"#16181C" },
      { id:"merah", label:"Merah & Pink", swatch:"#D0342C" },
      { id:"kuning", label:"Kuning & Orange", swatch:"#F4C430" },
      { id:"hijau", label:"Hijau", swatch:"#3E8E4F" },
      { id:"biru", label:"Biru", swatch:"#2B6FA8" },
      { id:"ungu", label:"Ungu", swatch:"#6B4E9E" },
      { id:"coklat", label:"Coklat & Netral", swatch:"#8A6D52" }
    ];
    var COLORS = [
      { name:"Natural", hex:"#E8DDD0", family:"netral" },
      { name:"Hitam", hex:"#22242A", family:"hitam", price:110000 },
      { name:"Maroon", hex:"#8B2E2E", family:"merah", price:110000 },
      { name:"Sage Green", hex:"#6B8E5A", family:"hijau" },
      { name:"Dusty Blue", hex:"#3B6B8E", family:"biru" },
      { name:"Terracotta", hex:"#C97B4E", family:"coklat" },
      { name:"Abu Muda", hex:"#B9BCC0", family:"netral" },
      { name:"Mocca", hex:"#8A6D52", family:"coklat" }
    ];

    function slug(s){ return s.toLowerCase().replace(/["']/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
    function rupiah(n){ return "Rp " + n.toLocaleString("id-ID") + ",-"; }
    function isLight(hex){ var c=hex.replace("#",""); if(c.length===3) c=c.replace(/(.)/g,"$1$1"); var r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16); return (0.299*r+0.587*g+0.114*b)>186; }
    var grid=document.getElementById("colorGrid"), chipsWrap=document.getElementById("familyChips"),
        searchInp=document.getElementById("colorSearch"), sortSel=document.getElementById("sortFilter"),
        countEl=document.getElementById("colorCount");
    var state={ q:"", family:"all", sort:"default" };
    function familyCount(id){ return id==="all" ? COLORS.length : COLORS.filter(function(c){ return c.family===id; }).length; }
    FAMILIES.forEach(function(f){
      var count=familyCount(f.id); if(count===0 && f.id!=="all") return;
      var btn=document.createElement("button"); btn.className="chip"+(f.id==="all"?" active":""); btn.setAttribute("data-family",f.id); btn.setAttribute("role","tab");
      var dot=f.swatch?'<span class="dot" style="background:'+f.swatch+'"></span>':"";
      btn.innerHTML=dot+f.label+' <span class="chip-count">'+count+'</span>';
      btn.addEventListener("click",function(){ chipsWrap.querySelectorAll(".chip").forEach(function(c){ c.classList.remove("active"); }); btn.classList.add("active"); state.family=f.id; render(); });
      chipsWrap.appendChild(btn);
    });
    function cardHTML(c){
      var price=(typeof c.price==="number")?c.price:BASE_PRICE;
      var title=PRODUCT+" "+c.name.toUpperCase(); var s=slug(c.name); var light=isLight(c.hex);
      var titleAttr=title.replace(/"/g,"&quot;");
      var tagStyle=light?' style="background:rgba(255,255,255,.92)"':'';
      return '<a class="pv-card" href="#" data-name="'+c.name.toLowerCase()+'" data-family="'+c.family+'" data-price="'+price+'" aria-label="'+titleAttr+'">'+
        '<div class="pv-img" style="background:'+c.hex+(light?'; box-shadow: inset 0 0 0 1px rgba(0,0,0,.06)':'')+'">'+
        '<img src="'+IMG_DIR+s+'.png" alt="'+titleAttr+'" loading="lazy" onerror="this.style.display=\'none\'">'+
        '<span class="pv-tag"'+tagStyle+'>'+c.name+'</span></div>'+
        '<div class="pv-body"><h3 class="pv-title">'+title+'</h3><div class="pv-price">'+rupiah(price)+'</div><span class="pv-brand">Fabriku</span></div></a>';
    }
    function render(){
      var list=COLORS.slice();
      if(state.family!=="all") list=list.filter(function(c){ return c.family===state.family; });
      var q=state.q.trim().toLowerCase(); if(q) list=list.filter(function(c){ return c.name.toLowerCase().indexOf(q)!==-1; });
      if(state.sort==="name-asc") list.sort(function(a,b){ return a.name.localeCompare(b.name); });
      else if(state.sort==="price-asc") list.sort(function(a,b){ return (a.price||BASE_PRICE)-(b.price||BASE_PRICE); });
      else if(state.sort==="price-desc") list.sort(function(a,b){ return (b.price||BASE_PRICE)-(a.price||BASE_PRICE); });
      countEl.textContent=list.length;
      if(list.length===0){ grid.innerHTML='<div class="catalog-empty"><div class="big">🎨</div><div class="t">Warna tidak ditemukan</div><div>Coba kata kunci lain atau pilih kategori warna lain.</div></div>'; return; }
      grid.innerHTML=list.map(cardHTML).join("");
    }
    var st; searchInp.addEventListener("input",function(){ clearTimeout(st); st=setTimeout(function(){ state.q=searchInp.value; render(); },100); });
    sortSel.addEventListener("change",function(){ state.sort=sortSel.value; render(); });
    render();

    function toggleMobileMenu(){ document.getElementById('mobileMenu').classList.toggle('open'); document.getElementById('mobileMenuBackdrop').classList.toggle('open'); document.getElementById('hamburgerBtn').classList.toggle('open'); }
    function closeMobileMenu(){ document.getElementById('mobileMenu').classList.remove('open'); document.getElementById('mobileMenuBackdrop').classList.remove('open'); document.getElementById('hamburgerBtn').classList.remove('open'); document.querySelectorAll('.m-group.open').forEach(function(g){ g.classList.remove('open'); }); }
    function toggleMobileGroup(id){ var el=document.getElementById(id); if(!el) return; document.querySelectorAll('.m-group').forEach(function(g){ if(g!==el) g.classList.remove('open'); }); el.classList.toggle('open'); }
    (function(){ var items=document.querySelectorAll('.navbar .nav-item'); items.forEach(function(item){ var chev=item.querySelector('.chev'); if(!chev) return; chev.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); items.forEach(function(i){ if(i!==item) i.classList.remove('open'); }); item.classList.toggle('open'); }); }); V.on(document,'click',function(e){ if(!e.target.closest('.navbar .nav-item')) items.forEach(function(i){ i.classList.remove('open'); }); }); V.on(document,'keydown',function(e){ if(e.key==='Escape') items.forEach(function(i){ i.classList.remove('open'); }); }); })();

  

  try{window.toggleMobileMenu=toggleMobileMenu;}catch(e){}
  try{window.closeMobileMenu=closeMobileMenu;}catch(e){}
  try{window.toggleMobileGroup=toggleMobileGroup;}catch(e){}
}

function init_product_cotton_combed_20s(){

    var PRODUCT = "COTTON COMBED 20S 42\"";
    var BASE_PRICE = 108000;
    var IMG_DIR = "Image/cotton-combed-20s/";
    var FAMILIES = [
      { id:"all", label:"Semua", swatch:null },
      { id:"netral", label:"Putih & Abu", swatch:"#C9C9C4" },
      { id:"hitam", label:"Hitam", swatch:"#16181C" },
      { id:"merah", label:"Merah & Pink", swatch:"#D0342C" },
      { id:"kuning", label:"Kuning & Orange", swatch:"#F4C430" },
      { id:"hijau", label:"Hijau", swatch:"#3E8E4F" },
      { id:"biru", label:"Biru", swatch:"#2B6FA8" },
      { id:"ungu", label:"Ungu", swatch:"#6B4E9E" },
      { id:"coklat", label:"Coklat & Netral", swatch:"#8A6D52" }
    ];
    var COLORS = [
      { name:"Putih", hex:"#FFFFFF", family:"netral" },
      { name:"Hitam", hex:"#16181C", family:"hitam", price:114000 },
      { name:"Misty", hex:"#8E8E8E", family:"netral" },
      { name:"Abu Muda", hex:"#B4B7BA", family:"netral" }
    ];

    function slug(s){ return s.toLowerCase().replace(/["']/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
    function rupiah(n){ return "Rp " + n.toLocaleString("id-ID") + ",-"; }
    function isLight(hex){ var c=hex.replace("#",""); if(c.length===3) c=c.replace(/(.)/g,"$1$1"); var r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16); return (0.299*r+0.587*g+0.114*b)>186; }
    var grid=document.getElementById("colorGrid"), chipsWrap=document.getElementById("familyChips"),
        searchInp=document.getElementById("colorSearch"), sortSel=document.getElementById("sortFilter"),
        countEl=document.getElementById("colorCount");
    var state={ q:"", family:"all", sort:"default" };
    function familyCount(id){ return id==="all" ? COLORS.length : COLORS.filter(function(c){ return c.family===id; }).length; }
    FAMILIES.forEach(function(f){
      var count=familyCount(f.id); if(count===0 && f.id!=="all") return;
      var btn=document.createElement("button"); btn.className="chip"+(f.id==="all"?" active":""); btn.setAttribute("data-family",f.id); btn.setAttribute("role","tab");
      var dot=f.swatch?'<span class="dot" style="background:'+f.swatch+'"></span>':"";
      btn.innerHTML=dot+f.label+' <span class="chip-count">'+count+'</span>';
      btn.addEventListener("click",function(){ chipsWrap.querySelectorAll(".chip").forEach(function(c){ c.classList.remove("active"); }); btn.classList.add("active"); state.family=f.id; render(); });
      chipsWrap.appendChild(btn);
    });
    function cardHTML(c){
      var price=(typeof c.price==="number")?c.price:BASE_PRICE;
      var title=PRODUCT+" "+c.name.toUpperCase(); var s=slug(c.name); var light=isLight(c.hex);
      var titleAttr=title.replace(/"/g,"&quot;");
      var tagStyle=light?' style="background:rgba(255,255,255,.92)"':'';
      return '<a class="pv-card" href="#" data-name="'+c.name.toLowerCase()+'" data-family="'+c.family+'" data-price="'+price+'" aria-label="'+titleAttr+'">'+
        '<div class="pv-img" style="background:'+c.hex+(light?'; box-shadow: inset 0 0 0 1px rgba(0,0,0,.06)':'')+'">'+
        '<img src="'+IMG_DIR+s+'.png" alt="'+titleAttr+'" loading="lazy" onerror="this.style.display=\'none\'">'+
        '<span class="pv-tag"'+tagStyle+'>'+c.name+'</span></div>'+
        '<div class="pv-body"><h3 class="pv-title">'+title+'</h3><div class="pv-price">'+rupiah(price)+'</div><span class="pv-brand">Fabriku</span></div></a>';
    }
    function render(){
      var list=COLORS.slice();
      if(state.family!=="all") list=list.filter(function(c){ return c.family===state.family; });
      var q=state.q.trim().toLowerCase(); if(q) list=list.filter(function(c){ return c.name.toLowerCase().indexOf(q)!==-1; });
      if(state.sort==="name-asc") list.sort(function(a,b){ return a.name.localeCompare(b.name); });
      else if(state.sort==="price-asc") list.sort(function(a,b){ return (a.price||BASE_PRICE)-(b.price||BASE_PRICE); });
      else if(state.sort==="price-desc") list.sort(function(a,b){ return (b.price||BASE_PRICE)-(a.price||BASE_PRICE); });
      countEl.textContent=list.length;
      if(list.length===0){ grid.innerHTML='<div class="catalog-empty"><div class="big">🎨</div><div class="t">Warna tidak ditemukan</div><div>Coba kata kunci lain atau pilih kategori warna lain.</div></div>'; return; }
      grid.innerHTML=list.map(cardHTML).join("");
    }
    var st; searchInp.addEventListener("input",function(){ clearTimeout(st); st=setTimeout(function(){ state.q=searchInp.value; render(); },100); });
    sortSel.addEventListener("change",function(){ state.sort=sortSel.value; render(); });
    render();

    function toggleMobileMenu(){ document.getElementById('mobileMenu').classList.toggle('open'); document.getElementById('mobileMenuBackdrop').classList.toggle('open'); document.getElementById('hamburgerBtn').classList.toggle('open'); }
    function closeMobileMenu(){ document.getElementById('mobileMenu').classList.remove('open'); document.getElementById('mobileMenuBackdrop').classList.remove('open'); document.getElementById('hamburgerBtn').classList.remove('open'); document.querySelectorAll('.m-group.open').forEach(function(g){ g.classList.remove('open'); }); }
    function toggleMobileGroup(id){ var el=document.getElementById(id); if(!el) return; document.querySelectorAll('.m-group').forEach(function(g){ if(g!==el) g.classList.remove('open'); }); el.classList.toggle('open'); }
    (function(){ var items=document.querySelectorAll('.navbar .nav-item'); items.forEach(function(item){ var chev=item.querySelector('.chev'); if(!chev) return; chev.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); items.forEach(function(i){ if(i!==item) i.classList.remove('open'); }); item.classList.toggle('open'); }); }); V.on(document,'click',function(e){ if(!e.target.closest('.navbar .nav-item')) items.forEach(function(i){ i.classList.remove('open'); }); }); V.on(document,'keydown',function(e){ if(e.key==='Escape') items.forEach(function(i){ i.classList.remove('open'); }); }); })();

  

  try{window.toggleMobileMenu=toggleMobileMenu;}catch(e){}
  try{window.closeMobileMenu=closeMobileMenu;}catch(e){}
  try{window.toggleMobileGroup=toggleMobileGroup;}catch(e){}
}

function init_product_cotton_combed_24s(){

    /* ═══════════════════════════════════════════════════════════
       CONFIG — edit these to adjust the whole page
       ═══════════════════════════════════════════════════════════ */
    var PRODUCT = "COTTON COMBED 24S 42\"";   // prefix for every card title
    var BASE_PRICE = 112000;                    // default price in Rupiah (per kg)
    var IMG_DIR = "Image/cotton-combed-24s/";   // where you'll put the photos
    // Card image filename = IMG_DIR + <color slug> + ".png"  (e.g. Image/cotton-combed-24s/navy.png)
    // Until a photo exists there, the card shows the flat colour instead — nothing breaks.

    /* Colour families → used by the filter chips. label + swatch shown on the chip. */
    var FAMILIES = [
      { id: "all",     label: "Semua",           swatch: null },
      { id: "netral",  label: "Putih & Abu",     swatch: "#C9C9C4" },
      { id: "hitam",   label: "Hitam",           swatch: "#16181C" },
      { id: "merah",   label: "Merah & Pink",    swatch: "#D0342C" },
      { id: "kuning",  label: "Kuning & Orange", swatch: "#F4C430" },
      { id: "hijau",   label: "Hijau",           swatch: "#3E8E4F" },
      { id: "biru",    label: "Biru",            swatch: "#2B6FA8" },
      { id: "ungu",    label: "Ungu",            swatch: "#6B4E9E" },
      { id: "coklat",  label: "Coklat & Netral", swatch: "#8A6D52" }
    ];

    /* ═══════════════════════════════════════════════════════════
       COLOURS — the full list. Edit / add / remove freely.
       Each item: { name, hex, family, price? }
       - name    : shown on the card + used to build the photo filename
       - hex     : the swatch colour (shows until you drop in a photo)
       - family  : must match a FAMILIES id above (for the filter)
       - price   : OPTIONAL. Leave it out to use BASE_PRICE (Rp 112.000).
                   Add a number only for colours that cost more/less.
       ═══════════════════════════════════════════════════════════ */
    var COLORS = [
      /* — Putih & Abu — */
      { name: "Putih",           hex: "#FFFFFF", family: "netral" },
      { name: "Broken White",    hex: "#F3EFE6", family: "netral" },
      { name: "Misty",           hex: "#C9C9C4", family: "netral" },
      { name: "Abu Muda",        hex: "#B8BBBE", family: "netral" },
      { name: "Silver",          hex: "#C0C4C8", family: "netral" },
      { name: "Abu Misty Tua",   hex: "#8E9295", family: "netral" },
      { name: "Abu Tua",         hex: "#5B5F63", family: "netral" },
      { name: "Grey Steel",      hex: "#6E7377", family: "netral" },

      /* — Hitam — */
      { name: "Hitam",           hex: "#16181C", family: "hitam", price: 118000 },
      { name: "Black Solid",     hex: "#0A0C10", family: "hitam", price: 118000 },

      /* — Merah & Pink — */
      { name: "Merah Cabe",      hex: "#D0342C", family: "merah" },
      { name: "Merah",           hex: "#C41E1E", family: "merah" },
      { name: "Maroon",          hex: "#6E1F2A", family: "merah", price: 118000 },
      { name: "Marun",           hex: "#7A2230", family: "merah", price: 118000 },
      { name: "Coral",           hex: "#F0715A", family: "merah" },
      { name: "Salem",           hex: "#E8A08D", family: "merah" },
      { name: "Peach",           hex: "#F3B7A3", family: "merah" },
      { name: "Pink",            hex: "#F3A6C4", family: "merah" },
      { name: "Dusty Pink",      hex: "#D99AA8", family: "merah" },
      { name: "Pink Fanta",      hex: "#E85D9A", family: "merah" },
      { name: "Fanta",           hex: "#E23E7A", family: "merah" },
      { name: "Rose",            hex: "#D26B7E", family: "merah" },

      /* — Kuning & Orange — */
      { name: "Kuning",          hex: "#F4C430", family: "kuning" },
      { name: "Kuning Kunyit",   hex: "#E8A81C", family: "kuning" },
      { name: "Lemon",           hex: "#F2E06B", family: "kuning" },
      { name: "Mustard",         hex: "#C8912A", family: "kuning" },
      { name: "Gold",            hex: "#C9A94A", family: "kuning" },
      { name: "Cream",           hex: "#EFE6CE", family: "kuning" },
      { name: "Banana Cream",    hex: "#F0E1A8", family: "kuning" },
      { name: "Orange",          hex: "#E8792B", family: "kuning" },
      { name: "Orange Tua",      hex: "#D2621C", family: "kuning" },
      { name: "Stabilo Orange",  hex: "#FF7A00", family: "kuning", price: 128000 },

      /* — Hijau — */
      { name: "Hijau Botol",     hex: "#1E5B3E", family: "hijau", price: 118000 },
      { name: "Hijau Army",      hex: "#4B5320", family: "hijau", price: 118000 },
      { name: "Army Green",      hex: "#556B2F", family: "hijau", price: 123000 },
      { name: "Olive",           hex: "#6B6E3A", family: "hijau", price: 118000 },
      { name: "Hijau Daun",      hex: "#3E8E4F", family: "hijau" },
      { name: "Hijau Muda",      hex: "#7DB37A", family: "hijau" },
      { name: "Hijau Pupus",     hex: "#B4CBA0", family: "hijau" },
      { name: "Sage",            hex: "#A3B18A", family: "hijau" },
      { name: "Tosca",           hex: "#2BB5A0", family: "hijau" },
      { name: "Tosca Tua",       hex: "#1E8C7E", family: "hijau" },
      { name: "Aqua",            hex: "#7FD6C9", family: "hijau" },
      { name: "Aqua Foam",       hex: "#9BE0CF", family: "hijau" },
      { name: "Mint",            hex: "#B6E3CE", family: "hijau" },
      { name: "Stabilo Green",   hex: "#7CFC00", family: "hijau", price: 128000 },

      /* — Biru — */
      { name: "Navy",            hex: "#1E2A4A", family: "biru", price: 118000 },
      { name: "Dongker",         hex: "#17223F", family: "biru", price: 118000 },
      { name: "Biru Dongker Tua",hex: "#131B33", family: "biru", price: 118000 },
      { name: "Biru Benhur",     hex: "#3F6FB0", family: "biru" },
      { name: "Cobalt",          hex: "#2B4FA0", family: "biru" },
      { name: "Biru Elektrik",   hex: "#1F53C4", family: "biru" },
      { name: "Biru Laut",       hex: "#2B6FA8", family: "biru" },
      { name: "Denim",           hex: "#3E5C78", family: "biru" },
      { name: "Biru Turki",      hex: "#1CA4C4", family: "biru" },
      { name: "Sky",             hex: "#86BEE8", family: "biru" },
      { name: "Biru Muda",       hex: "#9CC4E8", family: "biru" },
      { name: "Baby Blue",       hex: "#BFDCEF", family: "biru" },

      /* — Ungu — */
      { name: "Ungu",            hex: "#6B4E9E", family: "ungu" },
      { name: "Violet",          hex: "#7A4EA8", family: "ungu" },
      { name: "Purple Tua",      hex: "#4A2E6E", family: "ungu", price: 118000 },
      { name: "Lavender",        hex: "#B7A6D9", family: "ungu" },
      { name: "Lilac",           hex: "#C2A8DE", family: "ungu" },

      /* — Coklat & Netral — */
      { name: "Coklat",          hex: "#6B4A2E", family: "coklat" },
      { name: "Coklat Tua",      hex: "#4A3020", family: "coklat", price: 118000 },
      { name: "Mocca",           hex: "#8A6D52", family: "coklat" },
      { name: "Milo",            hex: "#7A5638", family: "coklat" },
      { name: "Copper",          hex: "#B0724A", family: "coklat" },
      { name: "Camel",           hex: "#C89B6C", family: "coklat" },
      { name: "Tan",             hex: "#C8A98A", family: "coklat" },
      { name: "Khaki",           hex: "#B0A177", family: "coklat" },
      { name: "Taupe",           hex: "#9A8B78", family: "coklat" },
      { name: "Beige",           hex: "#D8C7A8", family: "coklat" }
    ];

    /* ═══════════════════════════════════════════════════════════
       RENDERING + FILTERING (no need to touch below to add colours)
       ═══════════════════════════════════════════════════════════ */
    function slug(s){ return s.toLowerCase().replace(/["']/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
    function rupiah(n){ return "Rp " + n.toLocaleString("id-ID") + ",-"; }
    // Is a hex colour light? (choose readable pill/border treatment)
    function isLight(hex){
      var c = hex.replace("#",""); if (c.length === 3) c = c.replace(/(.)/g,"$1$1");
      var r=parseInt(c.substr(0,2),16), g=parseInt(c.substr(2,2),16), b=parseInt(c.substr(4,2),16);
      return (0.299*r + 0.587*g + 0.114*b) > 186;
    }

    var grid       = document.getElementById("colorGrid");
    var chipsWrap  = document.getElementById("familyChips");
    var searchInp  = document.getElementById("colorSearch");
    var sortSel     = document.getElementById("sortFilter");
    var countEl    = document.getElementById("colorCount");

    var state = { q: "", family: "all", sort: "default" };

    // Precompute counts per family
    function familyCount(id){
      if (id === "all") return COLORS.length;
      return COLORS.filter(function(c){ return c.family === id; }).length;
    }

    // Build family chips
    FAMILIES.forEach(function(f, i){
      var count = familyCount(f.id);
      if (count === 0 && f.id !== "all") return;
      var btn = document.createElement("button");
      btn.className = "chip" + (f.id === "all" ? " active" : "");
      btn.setAttribute("data-family", f.id);
      btn.setAttribute("role", "tab");
      var dot = f.swatch ? '<span class="dot" style="background:'+f.swatch+'"></span>' : "";
      btn.innerHTML = dot + f.label + ' <span class="chip-count">'+count+'</span>';
      btn.addEventListener("click", function(){
        chipsWrap.querySelectorAll(".chip").forEach(function(c){ c.classList.remove("active"); });
        btn.classList.add("active");
        state.family = f.id;
        render();
      });
      chipsWrap.appendChild(btn);
    });

    function cardHTML(c){
      var price = (typeof c.price === "number") ? c.price : BASE_PRICE;
      var title = PRODUCT + " " + c.name.toUpperCase();
      var s = slug(c.name);
      var light = isLight(c.hex);
      var tagStyle = light ? ' style="background:rgba(255,255,255,.92)"' : '';
      // The <img> tries to load a real photo; if it 404s we hide it so the colour shows.
      return '' +
        '<a class="pv-card" href="#" data-name="'+c.name.toLowerCase()+'" data-family="'+c.family+'" data-price="'+price+'" aria-label="'+title+'">' +
          '<div class="pv-img" style="background:'+c.hex+ (light ? '; box-shadow: inset 0 0 0 1px rgba(0,0,0,.06)' : '') +'">' +
            '<img src="'+IMG_DIR+s+'.png" alt="'+title+'" loading="lazy" onerror="this.style.display=\'none\'">' +
            '<span class="pv-tag"'+tagStyle+'>'+c.name+'</span>' +
          '</div>' +
          '<div class="pv-body">' +
            '<h3 class="pv-title">'+title+'</h3>' +
            '<div class="pv-price">'+rupiah(price)+'</div>' +
            '<span class="pv-brand">Fabriku</span>' +
          '</div>' +
        '</a>';
    }

    function render(){
      var list = COLORS.slice();

      // filter: family
      if (state.family !== "all") list = list.filter(function(c){ return c.family === state.family; });
      // filter: search
      var q = state.q.trim().toLowerCase();
      if (q) list = list.filter(function(c){ return c.name.toLowerCase().indexOf(q) !== -1; });

      // sort
      if (state.sort === "name-asc") list.sort(function(a,b){ return a.name.localeCompare(b.name); });
      else if (state.sort === "price-asc") list.sort(function(a,b){ return (a.price||BASE_PRICE)-(b.price||BASE_PRICE); });
      else if (state.sort === "price-desc") list.sort(function(a,b){ return (b.price||BASE_PRICE)-(a.price||BASE_PRICE); });

      countEl.textContent = list.length;

      if (list.length === 0){
        grid.innerHTML = '<div class="catalog-empty"><div class="big">🎨</div><div class="t">Warna tidak ditemukan</div><div>Coba kata kunci lain atau pilih kategori warna lain.</div></div>';
        return;
      }
      grid.innerHTML = list.map(cardHTML).join("");
    }

    // Search (debounced)
    var st;
    searchInp.addEventListener("input", function(){
      clearTimeout(st);
      st = setTimeout(function(){ state.q = searchInp.value; render(); }, 100);
    });
    sortSel.addEventListener("change", function(){ state.sort = sortSel.value; render(); });

    render();

    /* ═══════════ NAV / MOBILE MENU (from v6) ═══════════ */
    function toggleMobileMenu() {
      document.getElementById('mobileMenu').classList.toggle('open');
      document.getElementById('mobileMenuBackdrop').classList.toggle('open');
      document.getElementById('hamburgerBtn').classList.toggle('open');
    }
    function closeMobileMenu() {
      document.getElementById('mobileMenu').classList.remove('open');
      document.getElementById('mobileMenuBackdrop').classList.remove('open');
      document.getElementById('hamburgerBtn').classList.remove('open');
      document.querySelectorAll('.m-group.open').forEach(function(g){ g.classList.remove('open'); });
    }
    function toggleMobileGroup(id) {
      var el = document.getElementById(id);
      if (!el) return;
      document.querySelectorAll('.m-group').forEach(function(g){ if (g !== el) g.classList.remove('open'); });
      el.classList.toggle('open');
    }
    (function(){
      var items = document.querySelectorAll('.navbar .nav-item');
      items.forEach(function(item){
        var chev = item.querySelector('.chev');
        if (!chev) return;
        chev.addEventListener('click', function(e){
          e.preventDefault(); e.stopPropagation();
          items.forEach(function(i){ if (i !== item) i.classList.remove('open'); });
          item.classList.toggle('open');
        });
      });
      V.on(document,'click', function(e){
        if (!e.target.closest('.navbar .nav-item')) items.forEach(function(i){ i.classList.remove('open'); });
      });
      V.on(document,'keydown', function(e){
        if (e.key === 'Escape') items.forEach(function(i){ i.classList.remove('open'); });
      });
    })();
  

  try{window.toggleMobileMenu=toggleMobileMenu;}catch(e){}
  try{window.closeMobileMenu=closeMobileMenu;}catch(e){}
  try{window.toggleMobileGroup=toggleMobileGroup;}catch(e){}
}

function init_product_cotton_combed_30s(){

    var PRODUCT = "COTTON COMBED 30S 42\"";
    var BASE_PRICE = 111500;
    var IMG_DIR = "Image/cotton-combed-30s/";
    var FAMILIES = [
      { id:"all", label:"Semua", swatch:null },
      { id:"netral", label:"Putih & Abu", swatch:"#C9C9C4" },
      { id:"hitam", label:"Hitam", swatch:"#16181C" },
      { id:"merah", label:"Merah & Pink", swatch:"#D0342C" },
      { id:"kuning", label:"Kuning & Orange", swatch:"#F4C430" },
      { id:"hijau", label:"Hijau", swatch:"#3E8E4F" },
      { id:"biru", label:"Biru", swatch:"#2B6FA8" },
      { id:"ungu", label:"Ungu", swatch:"#6B4E9E" },
      { id:"coklat", label:"Coklat & Netral", swatch:"#8A6D52" }
    ];
    var COLORS = [
      { name:"Putih", hex:"#FFFFFF", family:"netral" },
      { name:"Hitam", hex:"#16181C", family:"hitam", price:117500 },
      { name:"Misty", hex:"#8E8E8E", family:"netral" },
      { name:"Abu Muda", hex:"#B4B7BA", family:"netral" },
      { name:"Broken White", hex:"#F3EFE6", family:"netral" },
      { name:"Silver", hex:"#C0C4C8", family:"netral" },
      { name:"Abu Misty Tua", hex:"#6E7377", family:"netral" },
      { name:"Abu Tua", hex:"#4E5256", family:"netral" },
      { name:"Black Solid", hex:"#0A0C10", family:"hitam", price:117500 },
      { name:"Merah Cabe", hex:"#D0342C", family:"merah" },
      { name:"Merah", hex:"#C41E1E", family:"merah" },
      { name:"Maroon", hex:"#6E1F2A", family:"merah", price:117500 },
      { name:"Marun", hex:"#7A2230", family:"merah", price:117500 },
      { name:"Coral", hex:"#F0715A", family:"merah" },
      { name:"Salem", hex:"#E8A08D", family:"merah" },
      { name:"Peach", hex:"#F3B7A3", family:"merah" },
      { name:"Pink", hex:"#F3A6C4", family:"merah" },
      { name:"Dusty Pink", hex:"#D99AA8", family:"merah" },
      { name:"Pink Fanta", hex:"#E85D9A", family:"merah" },
      { name:"Fanta", hex:"#E23E7A", family:"merah" },
      { name:"Rose", hex:"#D26B7E", family:"merah" },
      { name:"Magenta", hex:"#B83280", family:"merah" },
      { name:"Kuning", hex:"#F4C430", family:"kuning" },
      { name:"Kuning Kunyit", hex:"#E8A81C", family:"kuning" },
      { name:"Lemon", hex:"#F2E06B", family:"kuning" },
      { name:"Mustard", hex:"#C8912A", family:"kuning" },
      { name:"Gold", hex:"#C9A94A", family:"kuning" },
      { name:"Cream", hex:"#EFE6CE", family:"kuning" },
      { name:"Banana Cream", hex:"#F0E1A8", family:"kuning" },
      { name:"Orange", hex:"#E8792B", family:"kuning" },
      { name:"Orange Tua", hex:"#D2621C", family:"kuning" },
      { name:"Stabilo Orange", hex:"#FF7A00", family:"kuning", price:127500 },
      { name:"Hijau Botol", hex:"#1E5B3E", family:"hijau", price:117500 },
      { name:"Hijau Army", hex:"#4B5320", family:"hijau", price:117500 },
      { name:"Army Green", hex:"#556B2F", family:"hijau", price:117500 },
      { name:"Olive", hex:"#6B6E3A", family:"hijau", price:117500 },
      { name:"Hijau Daun", hex:"#3E8E4F", family:"hijau" },
      { name:"Hijau Muda", hex:"#7DB37A", family:"hijau" },
      { name:"Hijau Pupus", hex:"#B4CBA0", family:"hijau" },
      { name:"Sage", hex:"#A3B18A", family:"hijau" },
      { name:"Tosca", hex:"#2BB5A0", family:"hijau" },
      { name:"Tosca Tua", hex:"#1E8C7E", family:"hijau" },
      { name:"Aqua", hex:"#7FD6C9", family:"hijau" },
      { name:"Aqua Foam", hex:"#9BE0CF", family:"hijau" },
      { name:"Mint", hex:"#B6E3CE", family:"hijau" },
      { name:"Stabilo Green", hex:"#7CFC00", family:"hijau", price:127500 },
      { name:"Navy", hex:"#1E2A4A", family:"biru", price:117500 },
      { name:"Dongker", hex:"#17223F", family:"biru", price:117500 },
      { name:"Biru Dongker Tua", hex:"#131B33", family:"biru", price:117500 },
      { name:"Biru Benhur", hex:"#3F6FB0", family:"biru" },
      { name:"Cobalt", hex:"#2B4FA0", family:"biru" },
      { name:"Biru Elektrik", hex:"#1F53C4", family:"biru" },
      { name:"Biru Laut", hex:"#2B6FA8", family:"biru" },
      { name:"Denim", hex:"#3E5C78", family:"biru" },
      { name:"Biru Turki", hex:"#1CA4C4", family:"biru" },
      { name:"Sky", hex:"#86BEE8", family:"biru" },
      { name:"Biru Muda", hex:"#9CC4E8", family:"biru" },
      { name:"Baby Blue", hex:"#BFDCEF", family:"biru" },
      { name:"Ungu", hex:"#6B4E9E", family:"ungu" },
      { name:"Violet", hex:"#7A4EA8", family:"ungu" },
      { name:"Purple Tua", hex:"#4A2E6E", family:"ungu", price:117500 },
      { name:"Lavender", hex:"#B7A6D9", family:"ungu" },
      { name:"Lilac", hex:"#C2A8DE", family:"ungu" },
      { name:"Coklat", hex:"#6B4A2E", family:"coklat" },
      { name:"Coklat Tua", hex:"#4A3020", family:"coklat", price:117500 },
      { name:"Mocca", hex:"#8A6D52", family:"coklat" },
      { name:"Milo", hex:"#7A5638", family:"coklat" },
      { name:"Copper", hex:"#B0724A", family:"coklat" },
      { name:"Camel", hex:"#C89B6C", family:"coklat" },
      { name:"Tan", hex:"#C8A98A", family:"coklat" },
      { name:"Khaki", hex:"#B0A177", family:"coklat" },
      { name:"Taupe", hex:"#9A8B78", family:"coklat" },
      { name:"Beige", hex:"#D8C7A8", family:"coklat" },
      { name:"Sand", hex:"#E4D5B7", family:"coklat" },
      { name:"Chocolate", hex:"#3E2A1E", family:"coklat", price:117500 }
    ];

    function slug(s){ return s.toLowerCase().replace(/["']/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
    function rupiah(n){ return "Rp " + n.toLocaleString("id-ID") + ",-"; }
    function isLight(hex){ var c=hex.replace("#",""); if(c.length===3) c=c.replace(/(.)/g,"$1$1"); var r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16); return (0.299*r+0.587*g+0.114*b)>186; }
    var grid=document.getElementById("colorGrid"), chipsWrap=document.getElementById("familyChips"),
        searchInp=document.getElementById("colorSearch"), sortSel=document.getElementById("sortFilter"),
        countEl=document.getElementById("colorCount");
    var state={ q:"", family:"all", sort:"default" };
    function familyCount(id){ return id==="all" ? COLORS.length : COLORS.filter(function(c){ return c.family===id; }).length; }
    FAMILIES.forEach(function(f){
      var count=familyCount(f.id); if(count===0 && f.id!=="all") return;
      var btn=document.createElement("button"); btn.className="chip"+(f.id==="all"?" active":""); btn.setAttribute("data-family",f.id); btn.setAttribute("role","tab");
      var dot=f.swatch?'<span class="dot" style="background:'+f.swatch+'"></span>':"";
      btn.innerHTML=dot+f.label+' <span class="chip-count">'+count+'</span>';
      btn.addEventListener("click",function(){ chipsWrap.querySelectorAll(".chip").forEach(function(c){ c.classList.remove("active"); }); btn.classList.add("active"); state.family=f.id; render(); });
      chipsWrap.appendChild(btn);
    });
    function cardHTML(c){
      var price=(typeof c.price==="number")?c.price:BASE_PRICE;
      var title=PRODUCT+" "+c.name.toUpperCase(); var s=slug(c.name); var light=isLight(c.hex);
      var titleAttr=title.replace(/"/g,"&quot;");
      var tagStyle=light?' style="background:rgba(255,255,255,.92)"':'';
      return '<a class="pv-card" href="#" data-name="'+c.name.toLowerCase()+'" data-family="'+c.family+'" data-price="'+price+'" aria-label="'+titleAttr+'">'+
        '<div class="pv-img" style="background:'+c.hex+(light?'; box-shadow: inset 0 0 0 1px rgba(0,0,0,.06)':'')+'">'+
        '<img src="'+IMG_DIR+s+'.png" alt="'+titleAttr+'" loading="lazy" onerror="this.style.display=\'none\'">'+
        '<span class="pv-tag"'+tagStyle+'>'+c.name+'</span></div>'+
        '<div class="pv-body"><h3 class="pv-title">'+title+'</h3><div class="pv-price">'+rupiah(price)+'</div><span class="pv-brand">Fabriku</span></div></a>';
    }
    function render(){
      var list=COLORS.slice();
      if(state.family!=="all") list=list.filter(function(c){ return c.family===state.family; });
      var q=state.q.trim().toLowerCase(); if(q) list=list.filter(function(c){ return c.name.toLowerCase().indexOf(q)!==-1; });
      if(state.sort==="name-asc") list.sort(function(a,b){ return a.name.localeCompare(b.name); });
      else if(state.sort==="price-asc") list.sort(function(a,b){ return (a.price||BASE_PRICE)-(b.price||BASE_PRICE); });
      else if(state.sort==="price-desc") list.sort(function(a,b){ return (b.price||BASE_PRICE)-(a.price||BASE_PRICE); });
      countEl.textContent=list.length;
      if(list.length===0){ grid.innerHTML='<div class="catalog-empty"><div class="big">🎨</div><div class="t">Warna tidak ditemukan</div><div>Coba kata kunci lain atau pilih kategori warna lain.</div></div>'; return; }
      grid.innerHTML=list.map(cardHTML).join("");
    }
    var st; searchInp.addEventListener("input",function(){ clearTimeout(st); st=setTimeout(function(){ state.q=searchInp.value; render(); },100); });
    sortSel.addEventListener("change",function(){ state.sort=sortSel.value; render(); });
    render();

    function toggleMobileMenu(){ document.getElementById('mobileMenu').classList.toggle('open'); document.getElementById('mobileMenuBackdrop').classList.toggle('open'); document.getElementById('hamburgerBtn').classList.toggle('open'); }
    function closeMobileMenu(){ document.getElementById('mobileMenu').classList.remove('open'); document.getElementById('mobileMenuBackdrop').classList.remove('open'); document.getElementById('hamburgerBtn').classList.remove('open'); document.querySelectorAll('.m-group.open').forEach(function(g){ g.classList.remove('open'); }); }
    function toggleMobileGroup(id){ var el=document.getElementById(id); if(!el) return; document.querySelectorAll('.m-group').forEach(function(g){ if(g!==el) g.classList.remove('open'); }); el.classList.toggle('open'); }
    (function(){ var items=document.querySelectorAll('.navbar .nav-item'); items.forEach(function(item){ var chev=item.querySelector('.chev'); if(!chev) return; chev.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); items.forEach(function(i){ if(i!==item) i.classList.remove('open'); }); item.classList.toggle('open'); }); }); V.on(document,'click',function(e){ if(!e.target.closest('.navbar .nav-item')) items.forEach(function(i){ i.classList.remove('open'); }); }); V.on(document,'keydown',function(e){ if(e.key==='Escape') items.forEach(function(i){ i.classList.remove('open'); }); }); })();

  

  try{window.toggleMobileMenu=toggleMobileMenu;}catch(e){}
  try{window.closeMobileMenu=closeMobileMenu;}catch(e){}
  try{window.toggleMobileGroup=toggleMobileGroup;}catch(e){}
}

function init_product_cotton_elastech_30s(){

    var PRODUCT = "COTTON ELASTECH 30S 72\"";
    var BASE_PRICE = 123000;
    var IMG_DIR = "Image/cotton-elastech-30s/";
    var FAMILIES = [
      { id:"all", label:"Semua", swatch:null },
      { id:"netral", label:"Putih & Abu", swatch:"#C9C9C4" },
      { id:"hitam", label:"Hitam", swatch:"#16181C" },
      { id:"merah", label:"Merah & Pink", swatch:"#D0342C" },
      { id:"kuning", label:"Kuning & Orange", swatch:"#F4C430" },
      { id:"hijau", label:"Hijau", swatch:"#3E8E4F" },
      { id:"biru", label:"Biru", swatch:"#2B6FA8" },
      { id:"ungu", label:"Ungu", swatch:"#6B4E9E" },
      { id:"coklat", label:"Coklat & Netral", swatch:"#8A6D52" }
    ];
    var COLORS = [
      { name:"Putih", hex:"#FFFFFF", family:"netral" },
      { name:"Hitam", hex:"#1E2024", family:"hitam", price:129000 },
      { name:"Navy", hex:"#1E3A5F", family:"biru", price:129000 },
      { name:"Misty", hex:"#8E9194", family:"netral" }
    ];

    function slug(s){ return s.toLowerCase().replace(/["']/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
    function rupiah(n){ return "Rp " + n.toLocaleString("id-ID") + ",-"; }
    function isLight(hex){ var c=hex.replace("#",""); if(c.length===3) c=c.replace(/(.)/g,"$1$1"); var r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16); return (0.299*r+0.587*g+0.114*b)>186; }
    var grid=document.getElementById("colorGrid"), chipsWrap=document.getElementById("familyChips"),
        searchInp=document.getElementById("colorSearch"), sortSel=document.getElementById("sortFilter"),
        countEl=document.getElementById("colorCount");
    var state={ q:"", family:"all", sort:"default" };
    function familyCount(id){ return id==="all" ? COLORS.length : COLORS.filter(function(c){ return c.family===id; }).length; }
    FAMILIES.forEach(function(f){
      var count=familyCount(f.id); if(count===0 && f.id!=="all") return;
      var btn=document.createElement("button"); btn.className="chip"+(f.id==="all"?" active":""); btn.setAttribute("data-family",f.id); btn.setAttribute("role","tab");
      var dot=f.swatch?'<span class="dot" style="background:'+f.swatch+'"></span>':"";
      btn.innerHTML=dot+f.label+' <span class="chip-count">'+count+'</span>';
      btn.addEventListener("click",function(){ chipsWrap.querySelectorAll(".chip").forEach(function(c){ c.classList.remove("active"); }); btn.classList.add("active"); state.family=f.id; render(); });
      chipsWrap.appendChild(btn);
    });
    function cardHTML(c){
      var price=(typeof c.price==="number")?c.price:BASE_PRICE;
      var title=PRODUCT+" "+c.name.toUpperCase(); var s=slug(c.name); var light=isLight(c.hex);
      var titleAttr=title.replace(/"/g,"&quot;");
      var tagStyle=light?' style="background:rgba(255,255,255,.92)"':'';
      return '<a class="pv-card" href="#" data-name="'+c.name.toLowerCase()+'" data-family="'+c.family+'" data-price="'+price+'" aria-label="'+titleAttr+'">'+
        '<div class="pv-img" style="background:'+c.hex+(light?'; box-shadow: inset 0 0 0 1px rgba(0,0,0,.06)':'')+'">'+
        '<img src="'+IMG_DIR+s+'.png" alt="'+titleAttr+'" loading="lazy" onerror="this.style.display=\'none\'">'+
        '<span class="pv-tag"'+tagStyle+'>'+c.name+'</span></div>'+
        '<div class="pv-body"><h3 class="pv-title">'+title+'</h3><div class="pv-price">'+rupiah(price)+'</div><span class="pv-brand">Fabriku</span></div></a>';
    }
    function render(){
      var list=COLORS.slice();
      if(state.family!=="all") list=list.filter(function(c){ return c.family===state.family; });
      var q=state.q.trim().toLowerCase(); if(q) list=list.filter(function(c){ return c.name.toLowerCase().indexOf(q)!==-1; });
      if(state.sort==="name-asc") list.sort(function(a,b){ return a.name.localeCompare(b.name); });
      else if(state.sort==="price-asc") list.sort(function(a,b){ return (a.price||BASE_PRICE)-(b.price||BASE_PRICE); });
      else if(state.sort==="price-desc") list.sort(function(a,b){ return (b.price||BASE_PRICE)-(a.price||BASE_PRICE); });
      countEl.textContent=list.length;
      if(list.length===0){ grid.innerHTML='<div class="catalog-empty"><div class="big">🎨</div><div class="t">Warna tidak ditemukan</div><div>Coba kata kunci lain atau pilih kategori warna lain.</div></div>'; return; }
      grid.innerHTML=list.map(cardHTML).join("");
    }
    var st; searchInp.addEventListener("input",function(){ clearTimeout(st); st=setTimeout(function(){ state.q=searchInp.value; render(); },100); });
    sortSel.addEventListener("change",function(){ state.sort=sortSel.value; render(); });
    render();

    function toggleMobileMenu(){ document.getElementById('mobileMenu').classList.toggle('open'); document.getElementById('mobileMenuBackdrop').classList.toggle('open'); document.getElementById('hamburgerBtn').classList.toggle('open'); }
    function closeMobileMenu(){ document.getElementById('mobileMenu').classList.remove('open'); document.getElementById('mobileMenuBackdrop').classList.remove('open'); document.getElementById('hamburgerBtn').classList.remove('open'); document.querySelectorAll('.m-group.open').forEach(function(g){ g.classList.remove('open'); }); }
    function toggleMobileGroup(id){ var el=document.getElementById(id); if(!el) return; document.querySelectorAll('.m-group').forEach(function(g){ if(g!==el) g.classList.remove('open'); }); el.classList.toggle('open'); }
    (function(){ var items=document.querySelectorAll('.navbar .nav-item'); items.forEach(function(item){ var chev=item.querySelector('.chev'); if(!chev) return; chev.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); items.forEach(function(i){ if(i!==item) i.classList.remove('open'); }); item.classList.toggle('open'); }); }); V.on(document,'click',function(e){ if(!e.target.closest('.navbar .nav-item')) items.forEach(function(i){ i.classList.remove('open'); }); }); V.on(document,'keydown',function(e){ if(e.key==='Escape') items.forEach(function(i){ i.classList.remove('open'); }); }); })();

  

  try{window.toggleMobileMenu=toggleMobileMenu;}catch(e){}
  try{window.closeMobileMenu=closeMobileMenu;}catch(e){}
  try{window.toggleMobileGroup=toggleMobileGroup;}catch(e){}
}

function init_product_cvc_20s_lacoste_36(){

    var PRODUCT = "CVC 20S LACOSTE 36\"";
    var BASE_PRICE = 96000;
    var IMG_DIR = "Image/cvc-20s-lacoste-36/";
    var FAMILIES = [
      { id:"all", label:"Semua", swatch:null },
      { id:"netral", label:"Putih & Abu", swatch:"#C9C9C4" },
      { id:"hitam", label:"Hitam", swatch:"#16181C" },
      { id:"merah", label:"Merah & Pink", swatch:"#D0342C" },
      { id:"kuning", label:"Kuning & Orange", swatch:"#F4C430" },
      { id:"hijau", label:"Hijau", swatch:"#3E8E4F" },
      { id:"biru", label:"Biru", swatch:"#2B6FA8" },
      { id:"ungu", label:"Ungu", swatch:"#6B4E9E" },
      { id:"coklat", label:"Coklat & Netral", swatch:"#8A6D52" }
    ];
    var COLORS = [
      { name:"Navy", hex:"#1E3A8F", family:"biru", price:102000 },
      { name:"Hitam", hex:"#1E2024", family:"hitam", price:102000 },
      { name:"Putih", hex:"#FFFFFF", family:"netral" },
      { name:"Broken White", hex:"#F1ECE2", family:"netral" },
      { name:"Abu Muda", hex:"#B7BABD", family:"netral" },
      { name:"Misty", hex:"#8C9194", family:"netral" },
      { name:"Abu Tua", hex:"#55585C", family:"netral" },
      { name:"Silver Grey", hex:"#C3C6CA", family:"netral" },
      { name:"Merah", hex:"#C21F24", family:"merah" },
      { name:"Merah Bata", hex:"#B8452E", family:"merah" },
      { name:"Maroon", hex:"#4A1F1F", family:"merah", price:102000 },
      { name:"Marun", hex:"#6E2531", family:"merah", price:102000 },
      { name:"Coral", hex:"#EE6F5B", family:"merah" },
      { name:"Salem", hex:"#E39C8A", family:"merah" },
      { name:"Peach", hex:"#F0B49F", family:"merah" },
      { name:"Pink", hex:"#EF9FC0", family:"merah" },
      { name:"Fanta", hex:"#E14C86", family:"merah" },
      { name:"Dusty Rose", hex:"#CE7B8A", family:"merah" },
      { name:"Kuning", hex:"#F1C02E", family:"kuning" },
      { name:"Kuning Kunyit", hex:"#E0A11C", family:"kuning" },
      { name:"Mustard", hex:"#C08A28", family:"kuning" },
      { name:"Gold", hex:"#C4A44A", family:"kuning" },
      { name:"Cream", hex:"#ECE3CB", family:"kuning" },
      { name:"Orange", hex:"#E5762A", family:"kuning" },
      { name:"Orange Tua", hex:"#CE5F1C", family:"kuning" },
      { name:"Hijau Botol", hex:"#1F5A3E", family:"hijau", price:102000 },
      { name:"Army", hex:"#4C5322", family:"hijau", price:102000 },
      { name:"Olive", hex:"#6A6D3A", family:"hijau", price:102000 },
      { name:"Hijau Daun", hex:"#3C8A4C", family:"hijau" },
      { name:"Hijau Pupus", hex:"#B0C89E", family:"hijau" },
      { name:"Sage", hex:"#A0AE88", family:"hijau" }
    ];

    function slug(s){ return s.toLowerCase().replace(/["']/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
    function rupiah(n){ return "Rp " + n.toLocaleString("id-ID") + ",-"; }
    function isLight(hex){ var c=hex.replace("#",""); if(c.length===3) c=c.replace(/(.)/g,"$1$1"); var r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16); return (0.299*r+0.587*g+0.114*b)>186; }
    var grid=document.getElementById("colorGrid"), chipsWrap=document.getElementById("familyChips"),
        searchInp=document.getElementById("colorSearch"), sortSel=document.getElementById("sortFilter"),
        countEl=document.getElementById("colorCount");
    var state={ q:"", family:"all", sort:"default" };
    function familyCount(id){ return id==="all" ? COLORS.length : COLORS.filter(function(c){ return c.family===id; }).length; }
    FAMILIES.forEach(function(f){
      var count=familyCount(f.id); if(count===0 && f.id!=="all") return;
      var btn=document.createElement("button"); btn.className="chip"+(f.id==="all"?" active":""); btn.setAttribute("data-family",f.id); btn.setAttribute("role","tab");
      var dot=f.swatch?'<span class="dot" style="background:'+f.swatch+'"></span>':"";
      btn.innerHTML=dot+f.label+' <span class="chip-count">'+count+'</span>';
      btn.addEventListener("click",function(){ chipsWrap.querySelectorAll(".chip").forEach(function(c){ c.classList.remove("active"); }); btn.classList.add("active"); state.family=f.id; render(); });
      chipsWrap.appendChild(btn);
    });
    function cardHTML(c){
      var price=(typeof c.price==="number")?c.price:BASE_PRICE;
      var title=PRODUCT+" "+c.name.toUpperCase(); var s=slug(c.name); var light=isLight(c.hex);
      var titleAttr=title.replace(/"/g,"&quot;");
      var tagStyle=light?' style="background:rgba(255,255,255,.92)"':'';
      return '<a class="pv-card" href="#" data-name="'+c.name.toLowerCase()+'" data-family="'+c.family+'" data-price="'+price+'" aria-label="'+titleAttr+'">'+
        '<div class="pv-img" style="background:'+c.hex+(light?'; box-shadow: inset 0 0 0 1px rgba(0,0,0,.06)':'')+'">'+
        '<img src="'+IMG_DIR+s+'.png" alt="'+titleAttr+'" loading="lazy" onerror="this.style.display=\'none\'">'+
        '<span class="pv-tag"'+tagStyle+'>'+c.name+'</span></div>'+
        '<div class="pv-body"><h3 class="pv-title">'+title+'</h3><div class="pv-price">'+rupiah(price)+'</div><span class="pv-brand">Fabriku</span></div></a>';
    }
    function render(){
      var list=COLORS.slice();
      if(state.family!=="all") list=list.filter(function(c){ return c.family===state.family; });
      var q=state.q.trim().toLowerCase(); if(q) list=list.filter(function(c){ return c.name.toLowerCase().indexOf(q)!==-1; });
      if(state.sort==="name-asc") list.sort(function(a,b){ return a.name.localeCompare(b.name); });
      else if(state.sort==="price-asc") list.sort(function(a,b){ return (a.price||BASE_PRICE)-(b.price||BASE_PRICE); });
      else if(state.sort==="price-desc") list.sort(function(a,b){ return (b.price||BASE_PRICE)-(a.price||BASE_PRICE); });
      countEl.textContent=list.length;
      if(list.length===0){ grid.innerHTML='<div class="catalog-empty"><div class="big">🎨</div><div class="t">Warna tidak ditemukan</div><div>Coba kata kunci lain atau pilih kategori warna lain.</div></div>'; return; }
      grid.innerHTML=list.map(cardHTML).join("");
    }
    var st; searchInp.addEventListener("input",function(){ clearTimeout(st); st=setTimeout(function(){ state.q=searchInp.value; render(); },100); });
    sortSel.addEventListener("change",function(){ state.sort=sortSel.value; render(); });
    render();

    function toggleMobileMenu(){ document.getElementById('mobileMenu').classList.toggle('open'); document.getElementById('mobileMenuBackdrop').classList.toggle('open'); document.getElementById('hamburgerBtn').classList.toggle('open'); }
    function closeMobileMenu(){ document.getElementById('mobileMenu').classList.remove('open'); document.getElementById('mobileMenuBackdrop').classList.remove('open'); document.getElementById('hamburgerBtn').classList.remove('open'); document.querySelectorAll('.m-group.open').forEach(function(g){ g.classList.remove('open'); }); }
    function toggleMobileGroup(id){ var el=document.getElementById(id); if(!el) return; document.querySelectorAll('.m-group').forEach(function(g){ if(g!==el) g.classList.remove('open'); }); el.classList.toggle('open'); }
    (function(){ var items=document.querySelectorAll('.navbar .nav-item'); items.forEach(function(item){ var chev=item.querySelector('.chev'); if(!chev) return; chev.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); items.forEach(function(i){ if(i!==item) i.classList.remove('open'); }); item.classList.toggle('open'); }); }); V.on(document,'click',function(e){ if(!e.target.closest('.navbar .nav-item')) items.forEach(function(i){ i.classList.remove('open'); }); }); V.on(document,'keydown',function(e){ if(e.key==='Escape') items.forEach(function(i){ i.classList.remove('open'); }); }); })();

  

  try{window.toggleMobileMenu=toggleMobileMenu;}catch(e){}
  try{window.closeMobileMenu=closeMobileMenu;}catch(e){}
  try{window.toggleMobileGroup=toggleMobileGroup;}catch(e){}
}

function init_product_cvc_24s_lacoste_36(){

    var PRODUCT = "CVC 24S LACOSTE 36\"";
    var BASE_PRICE = 100000;
    var IMG_DIR = "Image/cvc-24s-lacoste-36/";
    var FAMILIES = [
      { id:"all", label:"Semua", swatch:null },
      { id:"netral", label:"Putih & Abu", swatch:"#C9C9C4" },
      { id:"hitam", label:"Hitam", swatch:"#16181C" },
      { id:"merah", label:"Merah & Pink", swatch:"#D0342C" },
      { id:"kuning", label:"Kuning & Orange", swatch:"#F4C430" },
      { id:"hijau", label:"Hijau", swatch:"#3E8E4F" },
      { id:"biru", label:"Biru", swatch:"#2B6FA8" },
      { id:"ungu", label:"Ungu", swatch:"#6B4E9E" },
      { id:"coklat", label:"Coklat & Netral", swatch:"#8A6D52" }
    ];
    var COLORS = [
      { name:"Navy", hex:"#1E3A8F", family:"biru", price:106000 },
      { name:"Hitam", hex:"#1E2024", family:"hitam", price:106000 },
      { name:"Putih", hex:"#FFFFFF", family:"netral" },
      { name:"Broken White", hex:"#F1ECE2", family:"netral" },
      { name:"Abu Muda", hex:"#B7BABD", family:"netral" },
      { name:"Misty", hex:"#8C9194", family:"netral" },
      { name:"Abu Tua", hex:"#55585C", family:"netral" },
      { name:"Silver Grey", hex:"#C3C6CA", family:"netral" },
      { name:"Merah", hex:"#C21F24", family:"merah" },
      { name:"Merah Bata", hex:"#B8452E", family:"merah" },
      { name:"Maroon", hex:"#4A1F1F", family:"merah", price:106000 },
      { name:"Marun", hex:"#6E2531", family:"merah", price:106000 },
      { name:"Coral", hex:"#EE6F5B", family:"merah" },
      { name:"Salem", hex:"#E39C8A", family:"merah" },
      { name:"Peach", hex:"#F0B49F", family:"merah" },
      { name:"Pink", hex:"#EF9FC0", family:"merah" },
      { name:"Fanta", hex:"#E14C86", family:"merah" },
      { name:"Dusty Rose", hex:"#CE7B8A", family:"merah" },
      { name:"Kuning", hex:"#F1C02E", family:"kuning" },
      { name:"Kuning Kunyit", hex:"#E0A11C", family:"kuning" },
      { name:"Mustard", hex:"#C08A28", family:"kuning" },
      { name:"Gold", hex:"#C4A44A", family:"kuning" },
      { name:"Cream", hex:"#ECE3CB", family:"kuning" },
      { name:"Orange", hex:"#E5762A", family:"kuning" },
      { name:"Orange Tua", hex:"#CE5F1C", family:"kuning" },
      { name:"Hijau Botol", hex:"#1F5A3E", family:"hijau", price:106000 },
      { name:"Army", hex:"#4C5322", family:"hijau", price:106000 },
      { name:"Olive", hex:"#6A6D3A", family:"hijau", price:106000 },
      { name:"Hijau Daun", hex:"#3C8A4C", family:"hijau" },
      { name:"Hijau Pupus", hex:"#B0C89E", family:"hijau" },
      { name:"Sage", hex:"#A0AE88", family:"hijau" },
      { name:"Tosca", hex:"#2FB0A0", family:"hijau" },
      { name:"Tosca Tua", hex:"#1E897C", family:"hijau" },
      { name:"Aqua", hex:"#7CD2C6", family:"hijau" },
      { name:"Mint", hex:"#B2DFCB", family:"hijau" },
      { name:"Biru Turki", hex:"#2E8FB8", family:"biru" },
      { name:"Baby Turki", hex:"#6BC4D9", family:"biru" },
      { name:"Dongker", hex:"#16213C", family:"biru", price:106000 },
      { name:"Benhur", hex:"#3C6BAC", family:"biru" },
      { name:"Cobalt", hex:"#2A4E9E", family:"biru" },
      { name:"Biru Laut", hex:"#2A6DA6", family:"biru" },
      { name:"Denim", hex:"#3B5A76", family:"biru" },
      { name:"Sky", hex:"#83BCE6", family:"biru" },
      { name:"Biru Muda", hex:"#99C2E6", family:"biru" },
      { name:"Baby Blue", hex:"#BDDAED", family:"biru" },
      { name:"Ungu", hex:"#684B9B", family:"ungu" },
      { name:"Violet", hex:"#784CA6", family:"ungu" },
      { name:"Purple Tua", hex:"#472C6B", family:"ungu", price:106000 },
      { name:"Lavender", hex:"#B4A3D7", family:"ungu" },
      { name:"Lilac", hex:"#C0A6DC", family:"ungu" },
      { name:"Coklat", hex:"#6A492D", family:"coklat" },
      { name:"Coklat Tua", hex:"#48301F", family:"coklat", price:106000 },
      { name:"Mocca", hex:"#886B50", family:"coklat" },
      { name:"Milo", hex:"#785436", family:"coklat" },
      { name:"Copper", hex:"#AE7048", family:"coklat" },
      { name:"Camel", hex:"#C69A6A", family:"coklat" },
      { name:"Tan", hex:"#C6A788", family:"coklat" },
      { name:"Khaki", hex:"#AE9F75", family:"coklat" },
      { name:"Taupe", hex:"#988976", family:"coklat" },
      { name:"Beige", hex:"#D6C5A6", family:"coklat" },
      { name:"Sand", hex:"#E2D3B5", family:"coklat" },
      { name:"Abu Benhur", hex:"#6E7A88", family:"netral" },
      { name:"Grey Melange", hex:"#9A9EA2", family:"netral" },
      { name:"Charcoal", hex:"#3A3D42", family:"netral", price:106000 },
      { name:"Merah Cabe", hex:"#CE332B", family:"merah" },
      { name:"Kuning Muda", hex:"#EFDE69", family:"kuning" },
      { name:"Biru Elektrik", hex:"#1E51C2", family:"biru" }
    ];

    function slug(s){ return s.toLowerCase().replace(/["']/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
    function rupiah(n){ return "Rp " + n.toLocaleString("id-ID") + ",-"; }
    function isLight(hex){ var c=hex.replace("#",""); if(c.length===3) c=c.replace(/(.)/g,"$1$1"); var r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16); return (0.299*r+0.587*g+0.114*b)>186; }
    var grid=document.getElementById("colorGrid"), chipsWrap=document.getElementById("familyChips"),
        searchInp=document.getElementById("colorSearch"), sortSel=document.getElementById("sortFilter"),
        countEl=document.getElementById("colorCount");
    var state={ q:"", family:"all", sort:"default" };
    function familyCount(id){ return id==="all" ? COLORS.length : COLORS.filter(function(c){ return c.family===id; }).length; }
    FAMILIES.forEach(function(f){
      var count=familyCount(f.id); if(count===0 && f.id!=="all") return;
      var btn=document.createElement("button"); btn.className="chip"+(f.id==="all"?" active":""); btn.setAttribute("data-family",f.id); btn.setAttribute("role","tab");
      var dot=f.swatch?'<span class="dot" style="background:'+f.swatch+'"></span>':"";
      btn.innerHTML=dot+f.label+' <span class="chip-count">'+count+'</span>';
      btn.addEventListener("click",function(){ chipsWrap.querySelectorAll(".chip").forEach(function(c){ c.classList.remove("active"); }); btn.classList.add("active"); state.family=f.id; render(); });
      chipsWrap.appendChild(btn);
    });
    function cardHTML(c){
      var price=(typeof c.price==="number")?c.price:BASE_PRICE;
      var title=PRODUCT+" "+c.name.toUpperCase(); var s=slug(c.name); var light=isLight(c.hex);
      var titleAttr=title.replace(/"/g,"&quot;");
      var tagStyle=light?' style="background:rgba(255,255,255,.92)"':'';
      return '<a class="pv-card" href="#" data-name="'+c.name.toLowerCase()+'" data-family="'+c.family+'" data-price="'+price+'" aria-label="'+titleAttr+'">'+
        '<div class="pv-img" style="background:'+c.hex+(light?'; box-shadow: inset 0 0 0 1px rgba(0,0,0,.06)':'')+'">'+
        '<img src="'+IMG_DIR+s+'.png" alt="'+titleAttr+'" loading="lazy" onerror="this.style.display=\'none\'">'+
        '<span class="pv-tag"'+tagStyle+'>'+c.name+'</span></div>'+
        '<div class="pv-body"><h3 class="pv-title">'+title+'</h3><div class="pv-price">'+rupiah(price)+'</div><span class="pv-brand">Fabriku</span></div></a>';
    }
    function render(){
      var list=COLORS.slice();
      if(state.family!=="all") list=list.filter(function(c){ return c.family===state.family; });
      var q=state.q.trim().toLowerCase(); if(q) list=list.filter(function(c){ return c.name.toLowerCase().indexOf(q)!==-1; });
      if(state.sort==="name-asc") list.sort(function(a,b){ return a.name.localeCompare(b.name); });
      else if(state.sort==="price-asc") list.sort(function(a,b){ return (a.price||BASE_PRICE)-(b.price||BASE_PRICE); });
      else if(state.sort==="price-desc") list.sort(function(a,b){ return (b.price||BASE_PRICE)-(a.price||BASE_PRICE); });
      countEl.textContent=list.length;
      if(list.length===0){ grid.innerHTML='<div class="catalog-empty"><div class="big">🎨</div><div class="t">Warna tidak ditemukan</div><div>Coba kata kunci lain atau pilih kategori warna lain.</div></div>'; return; }
      grid.innerHTML=list.map(cardHTML).join("");
    }
    var st; searchInp.addEventListener("input",function(){ clearTimeout(st); st=setTimeout(function(){ state.q=searchInp.value; render(); },100); });
    sortSel.addEventListener("change",function(){ state.sort=sortSel.value; render(); });
    render();

    function toggleMobileMenu(){ document.getElementById('mobileMenu').classList.toggle('open'); document.getElementById('mobileMenuBackdrop').classList.toggle('open'); document.getElementById('hamburgerBtn').classList.toggle('open'); }
    function closeMobileMenu(){ document.getElementById('mobileMenu').classList.remove('open'); document.getElementById('mobileMenuBackdrop').classList.remove('open'); document.getElementById('hamburgerBtn').classList.remove('open'); document.querySelectorAll('.m-group.open').forEach(function(g){ g.classList.remove('open'); }); }
    function toggleMobileGroup(id){ var el=document.getElementById(id); if(!el) return; document.querySelectorAll('.m-group').forEach(function(g){ if(g!==el) g.classList.remove('open'); }); el.classList.toggle('open'); }
    (function(){ var items=document.querySelectorAll('.navbar .nav-item'); items.forEach(function(item){ var chev=item.querySelector('.chev'); if(!chev) return; chev.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); items.forEach(function(i){ if(i!==item) i.classList.remove('open'); }); item.classList.toggle('open'); }); }); V.on(document,'click',function(e){ if(!e.target.closest('.navbar .nav-item')) items.forEach(function(i){ i.classList.remove('open'); }); }); V.on(document,'keydown',function(e){ if(e.key==='Escape') items.forEach(function(i){ i.classList.remove('open'); }); }); })();

  

  try{window.toggleMobileMenu=toggleMobileMenu;}catch(e){}
  try{window.closeMobileMenu=closeMobileMenu;}catch(e){}
  try{window.toggleMobileGroup=toggleMobileGroup;}catch(e){}
}

function init_product_cvc_24s_lacoste_42(){

    var PRODUCT = "CVC 24S LACOSTE 42\"";
    var BASE_PRICE = 108000;
    var IMG_DIR = "Image/cvc-24s-lacoste-42/";
    var FAMILIES = [
      { id:"all", label:"Semua", swatch:null },
      { id:"netral", label:"Putih & Abu", swatch:"#C9C9C4" },
      { id:"hitam", label:"Hitam", swatch:"#16181C" },
      { id:"merah", label:"Merah & Pink", swatch:"#D0342C" },
      { id:"kuning", label:"Kuning & Orange", swatch:"#F4C430" },
      { id:"hijau", label:"Hijau", swatch:"#3E8E4F" },
      { id:"biru", label:"Biru", swatch:"#2B6FA8" },
      { id:"ungu", label:"Ungu", swatch:"#6B4E9E" },
      { id:"coklat", label:"Coklat & Netral", swatch:"#8A6D52" }
    ];
    var COLORS = [
      { name:"Navy", hex:"#1E3A8F", family:"biru", price:114000 },
      { name:"Hitam", hex:"#1E2024", family:"hitam", price:114000 }
    ];

    function slug(s){ return s.toLowerCase().replace(/["']/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
    function rupiah(n){ return "Rp " + n.toLocaleString("id-ID") + ",-"; }
    function isLight(hex){ var c=hex.replace("#",""); if(c.length===3) c=c.replace(/(.)/g,"$1$1"); var r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16); return (0.299*r+0.587*g+0.114*b)>186; }
    var grid=document.getElementById("colorGrid"), chipsWrap=document.getElementById("familyChips"),
        searchInp=document.getElementById("colorSearch"), sortSel=document.getElementById("sortFilter"),
        countEl=document.getElementById("colorCount");
    var state={ q:"", family:"all", sort:"default" };
    function familyCount(id){ return id==="all" ? COLORS.length : COLORS.filter(function(c){ return c.family===id; }).length; }
    FAMILIES.forEach(function(f){
      var count=familyCount(f.id); if(count===0 && f.id!=="all") return;
      var btn=document.createElement("button"); btn.className="chip"+(f.id==="all"?" active":""); btn.setAttribute("data-family",f.id); btn.setAttribute("role","tab");
      var dot=f.swatch?'<span class="dot" style="background:'+f.swatch+'"></span>':"";
      btn.innerHTML=dot+f.label+' <span class="chip-count">'+count+'</span>';
      btn.addEventListener("click",function(){ chipsWrap.querySelectorAll(".chip").forEach(function(c){ c.classList.remove("active"); }); btn.classList.add("active"); state.family=f.id; render(); });
      chipsWrap.appendChild(btn);
    });
    function cardHTML(c){
      var price=(typeof c.price==="number")?c.price:BASE_PRICE;
      var title=PRODUCT+" "+c.name.toUpperCase(); var s=slug(c.name); var light=isLight(c.hex);
      var titleAttr=title.replace(/"/g,"&quot;");
      var tagStyle=light?' style="background:rgba(255,255,255,.92)"':'';
      return '<a class="pv-card" href="#" data-name="'+c.name.toLowerCase()+'" data-family="'+c.family+'" data-price="'+price+'" aria-label="'+titleAttr+'">'+
        '<div class="pv-img" style="background:'+c.hex+(light?'; box-shadow: inset 0 0 0 1px rgba(0,0,0,.06)':'')+'">'+
        '<img src="'+IMG_DIR+s+'.png" alt="'+titleAttr+'" loading="lazy" onerror="this.style.display=\'none\'">'+
        '<span class="pv-tag"'+tagStyle+'>'+c.name+'</span></div>'+
        '<div class="pv-body"><h3 class="pv-title">'+title+'</h3><div class="pv-price">'+rupiah(price)+'</div><span class="pv-brand">Fabriku</span></div></a>';
    }
    function render(){
      var list=COLORS.slice();
      if(state.family!=="all") list=list.filter(function(c){ return c.family===state.family; });
      var q=state.q.trim().toLowerCase(); if(q) list=list.filter(function(c){ return c.name.toLowerCase().indexOf(q)!==-1; });
      if(state.sort==="name-asc") list.sort(function(a,b){ return a.name.localeCompare(b.name); });
      else if(state.sort==="price-asc") list.sort(function(a,b){ return (a.price||BASE_PRICE)-(b.price||BASE_PRICE); });
      else if(state.sort==="price-desc") list.sort(function(a,b){ return (b.price||BASE_PRICE)-(a.price||BASE_PRICE); });
      countEl.textContent=list.length;
      if(list.length===0){ grid.innerHTML='<div class="catalog-empty"><div class="big">🎨</div><div class="t">Warna tidak ditemukan</div><div>Coba kata kunci lain atau pilih kategori warna lain.</div></div>'; return; }
      grid.innerHTML=list.map(cardHTML).join("");
    }
    var st; searchInp.addEventListener("input",function(){ clearTimeout(st); st=setTimeout(function(){ state.q=searchInp.value; render(); },100); });
    sortSel.addEventListener("change",function(){ state.sort=sortSel.value; render(); });
    render();

    function toggleMobileMenu(){ document.getElementById('mobileMenu').classList.toggle('open'); document.getElementById('mobileMenuBackdrop').classList.toggle('open'); document.getElementById('hamburgerBtn').classList.toggle('open'); }
    function closeMobileMenu(){ document.getElementById('mobileMenu').classList.remove('open'); document.getElementById('mobileMenuBackdrop').classList.remove('open'); document.getElementById('hamburgerBtn').classList.remove('open'); document.querySelectorAll('.m-group.open').forEach(function(g){ g.classList.remove('open'); }); }
    function toggleMobileGroup(id){ var el=document.getElementById(id); if(!el) return; document.querySelectorAll('.m-group').forEach(function(g){ if(g!==el) g.classList.remove('open'); }); el.classList.toggle('open'); }
    (function(){ var items=document.querySelectorAll('.navbar .nav-item'); items.forEach(function(item){ var chev=item.querySelector('.chev'); if(!chev) return; chev.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); items.forEach(function(i){ if(i!==item) i.classList.remove('open'); }); item.classList.toggle('open'); }); }); V.on(document,'click',function(e){ if(!e.target.closest('.navbar .nav-item')) items.forEach(function(i){ i.classList.remove('open'); }); }); V.on(document,'keydown',function(e){ if(e.key==='Escape') items.forEach(function(i){ i.classList.remove('open'); }); }); })();

  

  try{window.toggleMobileMenu=toggleMobileMenu;}catch(e){}
  try{window.closeMobileMenu=closeMobileMenu;}catch(e){}
  try{window.toggleMobileGroup=toggleMobileGroup;}catch(e){}
}

function init_product_knitease_danball_200(){

    var PRODUCT = "KNITEASE DANBALL 200 64\"";
    var BASE_PRICE = 122000;
    var IMG_DIR = "Image/knitease-danball-200/";
    var FAMILIES = [
      { id:"all", label:"Semua", swatch:null },
      { id:"netral", label:"Putih & Abu", swatch:"#C9C9C4" },
      { id:"hitam", label:"Hitam", swatch:"#16181C" },
      { id:"merah", label:"Merah & Pink", swatch:"#D0342C" },
      { id:"kuning", label:"Kuning & Orange", swatch:"#F4C430" },
      { id:"hijau", label:"Hijau", swatch:"#3E8E4F" },
      { id:"biru", label:"Biru", swatch:"#2B6FA8" },
      { id:"ungu", label:"Ungu", swatch:"#6B4E9E" },
      { id:"coklat", label:"Coklat & Netral", swatch:"#8A6D52" }
    ];
    var COLORS = [
      { name:"Broken White", hex:"#E8E5DE", family:"netral" },
      { name:"Hitam", hex:"#22242A", family:"hitam", price:128000 },
      { name:"Abu", hex:"#8E9194", family:"netral" },
      { name:"Olive", hex:"#7B7A5A", family:"hijau" },
      { name:"Coklat", hex:"#4A3A2E", family:"coklat", price:128000 },
      { name:"Choco Tua", hex:"#5C3B2E", family:"coklat", price:128000 }
    ];

    function slug(s){ return s.toLowerCase().replace(/["']/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
    function rupiah(n){ return "Rp " + n.toLocaleString("id-ID") + ",-"; }
    function isLight(hex){ var c=hex.replace("#",""); if(c.length===3) c=c.replace(/(.)/g,"$1$1"); var r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16); return (0.299*r+0.587*g+0.114*b)>186; }
    var grid=document.getElementById("colorGrid"), chipsWrap=document.getElementById("familyChips"),
        searchInp=document.getElementById("colorSearch"), sortSel=document.getElementById("sortFilter"),
        countEl=document.getElementById("colorCount");
    var state={ q:"", family:"all", sort:"default" };
    function familyCount(id){ return id==="all" ? COLORS.length : COLORS.filter(function(c){ return c.family===id; }).length; }
    FAMILIES.forEach(function(f){
      var count=familyCount(f.id); if(count===0 && f.id!=="all") return;
      var btn=document.createElement("button"); btn.className="chip"+(f.id==="all"?" active":""); btn.setAttribute("data-family",f.id); btn.setAttribute("role","tab");
      var dot=f.swatch?'<span class="dot" style="background:'+f.swatch+'"></span>':"";
      btn.innerHTML=dot+f.label+' <span class="chip-count">'+count+'</span>';
      btn.addEventListener("click",function(){ chipsWrap.querySelectorAll(".chip").forEach(function(c){ c.classList.remove("active"); }); btn.classList.add("active"); state.family=f.id; render(); });
      chipsWrap.appendChild(btn);
    });
    function cardHTML(c){
      var price=(typeof c.price==="number")?c.price:BASE_PRICE;
      var title=PRODUCT+" "+c.name.toUpperCase(); var s=slug(c.name); var light=isLight(c.hex);
      var titleAttr=title.replace(/"/g,"&quot;");
      var tagStyle=light?' style="background:rgba(255,255,255,.92)"':'';
      return '<a class="pv-card" href="#" data-name="'+c.name.toLowerCase()+'" data-family="'+c.family+'" data-price="'+price+'" aria-label="'+titleAttr+'">'+
        '<div class="pv-img" style="background:'+c.hex+(light?'; box-shadow: inset 0 0 0 1px rgba(0,0,0,.06)':'')+'">'+
        '<img src="'+IMG_DIR+s+'.png" alt="'+titleAttr+'" loading="lazy" onerror="this.style.display=\'none\'">'+
        '<span class="pv-tag"'+tagStyle+'>'+c.name+'</span></div>'+
        '<div class="pv-body"><h3 class="pv-title">'+title+'</h3><div class="pv-price">'+rupiah(price)+'</div><span class="pv-brand">Fabriku</span></div></a>';
    }
    function render(){
      var list=COLORS.slice();
      if(state.family!=="all") list=list.filter(function(c){ return c.family===state.family; });
      var q=state.q.trim().toLowerCase(); if(q) list=list.filter(function(c){ return c.name.toLowerCase().indexOf(q)!==-1; });
      if(state.sort==="name-asc") list.sort(function(a,b){ return a.name.localeCompare(b.name); });
      else if(state.sort==="price-asc") list.sort(function(a,b){ return (a.price||BASE_PRICE)-(b.price||BASE_PRICE); });
      else if(state.sort==="price-desc") list.sort(function(a,b){ return (b.price||BASE_PRICE)-(a.price||BASE_PRICE); });
      countEl.textContent=list.length;
      if(list.length===0){ grid.innerHTML='<div class="catalog-empty"><div class="big">🎨</div><div class="t">Warna tidak ditemukan</div><div>Coba kata kunci lain atau pilih kategori warna lain.</div></div>'; return; }
      grid.innerHTML=list.map(cardHTML).join("");
    }
    var st; searchInp.addEventListener("input",function(){ clearTimeout(st); st=setTimeout(function(){ state.q=searchInp.value; render(); },100); });
    sortSel.addEventListener("change",function(){ state.sort=sortSel.value; render(); });
    render();

    function toggleMobileMenu(){ document.getElementById('mobileMenu').classList.toggle('open'); document.getElementById('mobileMenuBackdrop').classList.toggle('open'); document.getElementById('hamburgerBtn').classList.toggle('open'); }
    function closeMobileMenu(){ document.getElementById('mobileMenu').classList.remove('open'); document.getElementById('mobileMenuBackdrop').classList.remove('open'); document.getElementById('hamburgerBtn').classList.remove('open'); document.querySelectorAll('.m-group.open').forEach(function(g){ g.classList.remove('open'); }); }
    function toggleMobileGroup(id){ var el=document.getElementById(id); if(!el) return; document.querySelectorAll('.m-group').forEach(function(g){ if(g!==el) g.classList.remove('open'); }); el.classList.toggle('open'); }
    (function(){ var items=document.querySelectorAll('.navbar .nav-item'); items.forEach(function(item){ var chev=item.querySelector('.chev'); if(!chev) return; chev.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); items.forEach(function(i){ if(i!==item) i.classList.remove('open'); }); item.classList.toggle('open'); }); }); V.on(document,'click',function(e){ if(!e.target.closest('.navbar .nav-item')) items.forEach(function(i){ i.classList.remove('open'); }); }); V.on(document,'keydown',function(e){ if(e.key==='Escape') items.forEach(function(i){ i.classList.remove('open'); }); }); })();

  

  try{window.toggleMobileMenu=toggleMobileMenu;}catch(e){}
  try{window.closeMobileMenu=closeMobileMenu;}catch(e){}
  try{window.toggleMobileGroup=toggleMobileGroup;}catch(e){}
}

function init_product_rocky_cotton_16s(){

    var PRODUCT = "ROCKY COTTON 16S 35\"";
    var BASE_PRICE = 103000;
    var IMG_DIR = "Image/rocky-cotton-16s/";
    var FAMILIES = [
      { id:"all", label:"Semua", swatch:null },
      { id:"netral", label:"Putih & Abu", swatch:"#C9C9C4" },
      { id:"hitam", label:"Hitam", swatch:"#16181C" },
      { id:"merah", label:"Merah & Pink", swatch:"#D0342C" },
      { id:"kuning", label:"Kuning & Orange", swatch:"#F4C430" },
      { id:"hijau", label:"Hijau", swatch:"#3E8E4F" },
      { id:"biru", label:"Biru", swatch:"#2B6FA8" },
      { id:"ungu", label:"Ungu", swatch:"#6B4E9E" },
      { id:"coklat", label:"Coklat & Netral", swatch:"#8A6D52" }
    ];
    var COLORS = [
      { name:"Putih", hex:"#F4F1EA", family:"netral" },
      { name:"Hitam", hex:"#1A1C20", family:"hitam", price:109000 },
      { name:"Misty", hex:"#8C9093", family:"netral" },
      { name:"Abu Tua", hex:"#53575B", family:"netral" },
      { name:"Navy", hex:"#26364F", family:"biru", price:109000 },
      { name:"Dusty Blue", hex:"#6BA5C9", family:"biru" },
      { name:"Maroon", hex:"#5C3B4A", family:"merah", price:109000 },
      { name:"Merah Bata", hex:"#B8452E", family:"merah" },
      { name:"Mustard", hex:"#C9A94A", family:"kuning" },
      { name:"Terracotta", hex:"#D67A3A", family:"coklat" },
      { name:"Army", hex:"#556B2F", family:"hijau", price:109000 },
      { name:"Sage", hex:"#6B8E5A", family:"hijau" },
      { name:"Mocca", hex:"#8A6D52", family:"coklat" }
    ];

    function slug(s){ return s.toLowerCase().replace(/["']/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
    function rupiah(n){ return "Rp " + n.toLocaleString("id-ID") + ",-"; }
    function isLight(hex){ var c=hex.replace("#",""); if(c.length===3) c=c.replace(/(.)/g,"$1$1"); var r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16); return (0.299*r+0.587*g+0.114*b)>186; }
    var grid=document.getElementById("colorGrid"), chipsWrap=document.getElementById("familyChips"),
        searchInp=document.getElementById("colorSearch"), sortSel=document.getElementById("sortFilter"),
        countEl=document.getElementById("colorCount");
    var state={ q:"", family:"all", sort:"default" };
    function familyCount(id){ return id==="all" ? COLORS.length : COLORS.filter(function(c){ return c.family===id; }).length; }
    FAMILIES.forEach(function(f){
      var count=familyCount(f.id); if(count===0 && f.id!=="all") return;
      var btn=document.createElement("button"); btn.className="chip"+(f.id==="all"?" active":""); btn.setAttribute("data-family",f.id); btn.setAttribute("role","tab");
      var dot=f.swatch?'<span class="dot" style="background:'+f.swatch+'"></span>':"";
      btn.innerHTML=dot+f.label+' <span class="chip-count">'+count+'</span>';
      btn.addEventListener("click",function(){ chipsWrap.querySelectorAll(".chip").forEach(function(c){ c.classList.remove("active"); }); btn.classList.add("active"); state.family=f.id; render(); });
      chipsWrap.appendChild(btn);
    });
    function cardHTML(c){
      var price=(typeof c.price==="number")?c.price:BASE_PRICE;
      var title=PRODUCT+" "+c.name.toUpperCase(); var s=slug(c.name); var light=isLight(c.hex);
      var titleAttr=title.replace(/"/g,"&quot;");
      var tagStyle=light?' style="background:rgba(255,255,255,.92)"':'';
      return '<a class="pv-card" href="#" data-name="'+c.name.toLowerCase()+'" data-family="'+c.family+'" data-price="'+price+'" aria-label="'+titleAttr+'">'+
        '<div class="pv-img" style="background:'+c.hex+(light?'; box-shadow: inset 0 0 0 1px rgba(0,0,0,.06)':'')+'">'+
        '<img src="'+IMG_DIR+s+'.png" alt="'+titleAttr+'" loading="lazy" onerror="this.style.display=\'none\'">'+
        '<span class="pv-tag"'+tagStyle+'>'+c.name+'</span></div>'+
        '<div class="pv-body"><h3 class="pv-title">'+title+'</h3><div class="pv-price">'+rupiah(price)+'</div><span class="pv-brand">Fabriku</span></div></a>';
    }
    function render(){
      var list=COLORS.slice();
      if(state.family!=="all") list=list.filter(function(c){ return c.family===state.family; });
      var q=state.q.trim().toLowerCase(); if(q) list=list.filter(function(c){ return c.name.toLowerCase().indexOf(q)!==-1; });
      if(state.sort==="name-asc") list.sort(function(a,b){ return a.name.localeCompare(b.name); });
      else if(state.sort==="price-asc") list.sort(function(a,b){ return (a.price||BASE_PRICE)-(b.price||BASE_PRICE); });
      else if(state.sort==="price-desc") list.sort(function(a,b){ return (b.price||BASE_PRICE)-(a.price||BASE_PRICE); });
      countEl.textContent=list.length;
      if(list.length===0){ grid.innerHTML='<div class="catalog-empty"><div class="big">🎨</div><div class="t">Warna tidak ditemukan</div><div>Coba kata kunci lain atau pilih kategori warna lain.</div></div>'; return; }
      grid.innerHTML=list.map(cardHTML).join("");
    }
    var st; searchInp.addEventListener("input",function(){ clearTimeout(st); st=setTimeout(function(){ state.q=searchInp.value; render(); },100); });
    sortSel.addEventListener("change",function(){ state.sort=sortSel.value; render(); });
    render();

    function toggleMobileMenu(){ document.getElementById('mobileMenu').classList.toggle('open'); document.getElementById('mobileMenuBackdrop').classList.toggle('open'); document.getElementById('hamburgerBtn').classList.toggle('open'); }
    function closeMobileMenu(){ document.getElementById('mobileMenu').classList.remove('open'); document.getElementById('mobileMenuBackdrop').classList.remove('open'); document.getElementById('hamburgerBtn').classList.remove('open'); document.querySelectorAll('.m-group.open').forEach(function(g){ g.classList.remove('open'); }); }
    function toggleMobileGroup(id){ var el=document.getElementById(id); if(!el) return; document.querySelectorAll('.m-group').forEach(function(g){ if(g!==el) g.classList.remove('open'); }); el.classList.toggle('open'); }
    (function(){ var items=document.querySelectorAll('.navbar .nav-item'); items.forEach(function(item){ var chev=item.querySelector('.chev'); if(!chev) return; chev.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); items.forEach(function(i){ if(i!==item) i.classList.remove('open'); }); item.classList.toggle('open'); }); }); V.on(document,'click',function(e){ if(!e.target.closest('.navbar .nav-item')) items.forEach(function(i){ i.classList.remove('open'); }); }); V.on(document,'keydown',function(e){ if(e.key==='Escape') items.forEach(function(i){ i.classList.remove('open'); }); }); })();

  

  try{window.toggleMobileMenu=toggleMobileMenu;}catch(e){}
  try{window.closeMobileMenu=closeMobileMenu;}catch(e){}
  try{window.toggleMobileGroup=toggleMobileGroup;}catch(e){}
}

function init_product_starter_versa_cotton_24s(){

    function toggleMobileMenu(){ document.getElementById('mobileMenu').classList.toggle('open'); document.getElementById('mobileMenuBackdrop').classList.toggle('open'); document.getElementById('hamburgerBtn').classList.toggle('open'); }
    function closeMobileMenu(){ document.getElementById('mobileMenu').classList.remove('open'); document.getElementById('mobileMenuBackdrop').classList.remove('open'); document.getElementById('hamburgerBtn').classList.remove('open'); document.querySelectorAll('.m-group.open').forEach(function(g){ g.classList.remove('open'); }); }
    function toggleMobileGroup(id){ var el=document.getElementById(id); if(!el) return; document.querySelectorAll('.m-group').forEach(function(g){ if(g!==el) g.classList.remove('open'); }); el.classList.toggle('open'); }
    (function(){ var items=document.querySelectorAll('.navbar .nav-item'); items.forEach(function(item){ var chev=item.querySelector('.chev'); if(!chev) return; chev.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); items.forEach(function(i){ if(i!==item) i.classList.remove('open'); }); item.classList.toggle('open'); }); }); V.on(document,'click',function(e){ if(!e.target.closest('.navbar .nav-item')) items.forEach(function(i){ i.classList.remove('open'); }); }); V.on(document,'keydown',function(e){ if(e.key==='Escape') items.forEach(function(i){ i.classList.remove('open'); }); }); })();


  try{window.toggleMobileMenu=toggleMobileMenu;}catch(e){}
  try{window.closeMobileMenu=closeMobileMenu;}catch(e){}
  try{window.toggleMobileGroup=toggleMobileGroup;}catch(e){}
}

function init_product_versa_heavy_weight_rocky_hard_36(){

    function toggleMobileMenu(){ document.getElementById('mobileMenu').classList.toggle('open'); document.getElementById('mobileMenuBackdrop').classList.toggle('open'); document.getElementById('hamburgerBtn').classList.toggle('open'); }
    function closeMobileMenu(){ document.getElementById('mobileMenu').classList.remove('open'); document.getElementById('mobileMenuBackdrop').classList.remove('open'); document.getElementById('hamburgerBtn').classList.remove('open'); document.querySelectorAll('.m-group.open').forEach(function(g){ g.classList.remove('open'); }); }
    function toggleMobileGroup(id){ var el=document.getElementById(id); if(!el) return; document.querySelectorAll('.m-group').forEach(function(g){ if(g!==el) g.classList.remove('open'); }); el.classList.toggle('open'); }
    (function(){ var items=document.querySelectorAll('.navbar .nav-item'); items.forEach(function(item){ var chev=item.querySelector('.chev'); if(!chev) return; chev.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); items.forEach(function(i){ if(i!==item) i.classList.remove('open'); }); item.classList.toggle('open'); }); }); V.on(document,'click',function(e){ if(!e.target.closest('.navbar .nav-item')) items.forEach(function(i){ i.classList.remove('open'); }); }); V.on(document,'keydown',function(e){ if(e.key==='Escape') items.forEach(function(i){ i.classList.remove('open'); }); }); })();


  try{window.toggleMobileMenu=toggleMobileMenu;}catch(e){}
  try{window.closeMobileMenu=closeMobileMenu;}catch(e){}
  try{window.toggleMobileGroup=toggleMobileGroup;}catch(e){}
}
