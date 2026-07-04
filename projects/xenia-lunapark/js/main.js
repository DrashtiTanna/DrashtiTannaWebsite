/* Xenia Lunapark — main page interactions */
(function () {
  'use strict';

  /* ---------- nav ---------- */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });

  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => navLinks.classList.remove('open')));

  /* ---------- scroll reveals ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- facilities (from Board 14) ---------- */
  const FACILITIES = [
    { n: 1,  name: 'Seating',            zone: 'indoor',  price: 'free' },
    { n: 2,  name: 'Bakery / Pastry Shop', zone: 'indoor', price: '€' },
    { n: 3,  name: 'Food Market',        zone: 'indoor',  price: '€' },
    { n: 4,  name: 'Bar',                zone: 'indoor',  price: '€€' },
    { n: 5,  name: 'Café',               zone: 'indoor',  price: '€' },
    { n: 6,  name: 'Reception / Exhibition', zone: 'indoor', price: 'free' },
    { n: 7,  name: 'Mini Golf (indoor)', zone: 'indoor',  price: '€' },
    { n: 8,  name: 'Funhouse',           zone: 'indoor',  price: '€' },
    { n: 9,  name: 'Playhouse',          zone: 'indoor',  price: 'free' },
    { n: 10, name: 'Karaoke Rooms',      zone: 'indoor',  price: '€€', note: 'winter: weekends only' },
    { n: 11, name: 'VR / AR Experience', zone: 'indoor',  price: '€€€', note: 'winter: weekends only' },
    { n: 12, name: 'Escape Room',        zone: 'indoor',  price: '€€', note: 'winter: weekends only' },
    { n: 13, name: 'Seating',            zone: 'outdoor', price: 'free' },
    { n: 14, name: 'Mini Golf (outdoor)', zone: 'outdoor', price: '€' },
    { n: 15, name: 'Hammock Area',       zone: 'outdoor', price: 'free' },
    { n: 16, name: 'Stage',              zone: 'outdoor', price: 'free' },
    { n: 17, name: 'Courtyard Terrace',  zone: 'outdoor', price: 'free' },
    { n: 18, name: 'Playground',         zone: 'outdoor', price: 'free' },
    { n: 19, name: 'Ping Pong Area',     zone: 'outdoor', price: 'free' }
  ];

  const facGrid = document.getElementById('facGrid');
  facGrid.innerHTML = FACILITIES.map(f => `
    <div class="fac-card" data-zone="${f.zone}" data-price="${f.price}">
      <span class="num">No. ${String(f.n).padStart(2, '0')}</span>
      <h4>${f.name}</h4>
      <div class="fac-meta">
        <span class="fac-tag ${f.zone}">${f.zone}</span>
        <span class="fac-price ${f.price === 'free' ? 'free' : ''}">${f.price === 'free' ? 'FREE' : f.price}</span>
      </div>
      ${f.note ? `<p style="font-size:11.5px;color:var(--grey);margin-top:8px;font-family:var(--mono)">* ${f.note}</p>` : ''}
    </div>`).join('');

  document.querySelectorAll('.fac-filters button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fac-filters button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.f;
      facGrid.querySelectorAll('.fac-card').forEach(card => {
        const show =
          f === 'all' ||
          (f === 'free' && card.dataset.price === 'free') ||
          card.dataset.zone === f;
        card.classList.toggle('hide', !show);
      });
    });
  });

  /* ---------- gallery ---------- */
  const CAPTIONS = [
    'Board 01 — Cover · Touristic Modernities of the Mediterranean',
    'Board 02 — Location · Karteros / Heraklion / Crete',
    'Board 03 — Layers of Cretan history',
    'Board 04 — The Xenia Motel · Aris Konstantinidis · 1963',
    'Board 05 — Vision · from ruin to Lunapark',
    'Board 06 — Programme · all year, all ages, all budgets',
    'Board 07 — Business model · partner network',
    'Board 08 — Architectural strategy · cluster to polycentric field',
    'Board 09 — Site plan & elevation 1:1000 · context',
    'Board 10 — Ground floor plan & long section 1:250 · existing vs proposed',
    'Board 11 — First floor plan 1:100 winter day · cross section summer night',
    'Board 12 — Cross sections 1:250 · roof terrace addition',
    'Board 13 — Xenia Motel reconceptualised',
    'Board 14 — Welcome to Xenia Lunapark! · programme board',
    'Board 15 — Bibliography'
  ];

  const galGrid = document.getElementById('galGrid');
  galGrid.innerHTML = CAPTIONS.map((cap, i) => {
    const n = String(i + 1).padStart(2, '0');
    const parts = cap.split(' — ');
    return `
    <div class="gal-item" data-idx="${i}">
      <img loading="lazy" src="assets/thumbs/board-${n}.jpg" alt="${cap}">
      <div class="cap"><b>${parts[0]}</b> — ${parts[1]}</div>
    </div>`;
  }).join('');

  /* ---------- lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbCap = document.getElementById('lbCap');
  let current = 0;

  function openLb(i) {
    current = (i + CAPTIONS.length) % CAPTIONS.length;
    const n = String(current + 1).padStart(2, '0');
    lbImg.src = `assets/boards/board-${n}.jpg`;
    lbCap.textContent = CAPTIONS[current];
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLb() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  galGrid.addEventListener('click', e => {
    const item = e.target.closest('.gal-item');
    if (item) openLb(+item.dataset.idx);
  });
  // inline figures across the page
  document.querySelectorAll('.figure img[data-idx]').forEach(img => {
    img.addEventListener('click', () => openLb(+img.dataset.idx));
  });

  document.getElementById('lbClose').addEventListener('click', closeLb);
  document.getElementById('lbPrev').addEventListener('click', () => openLb(current - 1));
  document.getElementById('lbNext').addEventListener('click', () => openLb(current + 1));
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLb(); });

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') openLb(current - 1);
    if (e.key === 'ArrowRight') openLb(current + 1);
  });
})();
