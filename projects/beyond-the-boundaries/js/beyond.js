/* Beyond the Boundaries — page interactions */
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

  /* ---------- gallery ---------- */
  const CAPTIONS = [
    'Board 01 — Project statement · weaving a new network through land and water',
    'Board 02 — Territory: historical review 1975/2012 · layers of preexistent values',
    'Board 03 — Mapping the infraspaces · border definition & strategies A–D',
    'Board 04 — Details & transects of the network · 1:500',
    'Board 05 — Bird-eye perspective · planting plan · vegetation typology'
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
