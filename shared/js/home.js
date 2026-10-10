(() => {
  const header = document.querySelector('.site-header');
  const toggle = document.getElementById('navToggle');
  const navigation = document.getElementById('siteNav');

  if (!header || !toggle || !navigation) return;

  const desktop = window.matchMedia('(min-width: 901px)');
  const icon = toggle.querySelector('[aria-hidden="true"]');

  function updateToggle(isOpen) {
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Menu, close navigation' : 'Menu, open navigation');
    if (icon) icon.textContent = isOpen ? '−' : '+';
  }

  function closeMenu(restoreFocus = false) {
    const wasOpen = header.classList.contains('is-open');
    header.classList.remove('is-open');
    updateToggle(false);
    if (restoreFocus && wasOpen) toggle.focus();
  }

  toggle.addEventListener('click', () => {
    if (desktop.matches) return;
    const isOpen = header.classList.toggle('is-open');
    updateToggle(isOpen);
  });

  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('is-open')) {
      closeMenu(true);
    }
  });

  desktop.addEventListener('change', () => closeMenu());
  closeMenu();
  document.documentElement.classList.add('js');

  // Motion is progressive enhancement: native links and the CV never depend on it.
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionToggle = document.getElementById('motionToggle');
  let paused = false;
  try { paused = sessionStorage.getItem('drashti-motion-paused') === 'true'; } catch (_) { /* Storage may be unavailable. */ }

  // Give the longer CV the same deliberate reveal rhythm as the work panels.
  document.querySelectorAll('.curriculum-header, .education-item, .experience-item, .recognition-list, .competence .section-heading, .skill-group, .practice .section-heading, .practice-details, .languages, .interests, .contact-grid > div').forEach((element) => element.classList.add('reveal'));
  const reveals = [...document.querySelectorAll('.reveal')];
  let revealObserver;

  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        target.classList.add('is-visible');
        revealObserver.unobserve(target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -28px 0px' });
    reveals.forEach((element) => {
      const bounds = element.getBoundingClientRect();
      if (bounds.top < window.innerHeight && bounds.bottom > 0) element.classList.add('is-visible');
      else revealObserver.observe(element);
    });
    root.classList.add('motion-ready');
  }

  function applyMotionPreference() {
    const enabled = !paused && !reducedMotion.matches;
    root.classList.toggle('motion-paused', !enabled);
    if (motionToggle) {
      motionToggle.hidden = false;
      motionToggle.disabled = reducedMotion.matches;
      motionToggle.setAttribute('aria-pressed', String(!enabled));
      motionToggle.textContent = enabled ? 'Motion on' : 'Motion off';
      motionToggle.setAttribute('aria-label', reducedMotion.matches
        ? 'Motion off, reduced-motion preference'
        : enabled ? 'Motion on, pause motion' : 'Motion off, enable motion');
    }
    document.dispatchEvent(new CustomEvent('portfolio:motion', { detail: { enabled } }));
  }

  motionToggle?.addEventListener('click', () => {
    paused = !paused;
    try { sessionStorage.setItem('drashti-motion-paused', String(paused)); } catch (_) { /* Keep the control functional without storage. */ }
    applyMotionPreference();
  });
  reducedMotion.addEventListener('change', applyMotionPreference);
  applyMotionPreference();

  // Start the small-screen panorama at its central map; native horizontal
  // scrolling lets visitors inspect the sketch without shrinking its details.
  const panorama = document.querySelector('.landscape-art');
  const smallScreen = window.matchMedia('(max-width: 767px)');
  function placePanorama() {
    if (panorama) panorama.scrollLeft = smallScreen.matches
      ? Math.max(0, (panorama.scrollWidth - panorama.clientWidth) / 2) : 0;
  }
  placePanorama();
  smallScreen.addEventListener('change', placePanorama);

  window.addEventListener('pagehide', () => revealObserver?.disconnect(), { once: true });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted && revealObserver) reveals.filter((element) => !element.classList.contains('is-visible')).forEach((element) => revealObserver.observe(element));
  });
})();
