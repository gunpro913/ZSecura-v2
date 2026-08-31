const navWrap = document.querySelector('.nav-wrap');
const nav = document.querySelector('.nav');
const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const initPreloader = () => {
  const preloader = document.querySelector('.preloader');
  if (!preloader) return;
  setTimeout(() => { preloader.classList.add('hidden'); }, 1200);
};

if (navWrap && navWrap.parentElement !== document.body) document.body.prepend(navWrap);
document.documentElement.classList.add('js-ready');

const closeMenu = () => {
  if (!menuButton || !navLinks) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
  navLinks.classList.remove('mobile-open');
  document.body.classList.remove('nav-open');
};

if (menuButton && navLinks) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    menuButton.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    navLinks.classList.toggle('mobile-open', !open);
    document.body.classList.toggle('nav-open', !open);
  });
  document.querySelectorAll('.nav-links a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('pointerdown', (event) => {
    if (!nav?.contains(event.target) && navLinks.classList.contains('mobile-open')) closeMenu();
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
}

const updateNav = () => nav?.classList.toggle('is-scrolled', window.scrollY > 18);
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

if (!reduceMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}

const initScrollReveals = () => {
  const slideElements = document.querySelectorAll('.slide-up-reveal, .reveal-text');
  if (!slideElements.length || !('IntersectionObserver' in window)) return;
  if (reduceMotion) { slideElements.forEach((el) => el.classList.add('is-visible')); return; }
  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const delay = Array.from(slideElements).indexOf(entry.target) * 70;
      setTimeout(() => entry.target.classList.add('is-visible'), delay);
      slideObserver.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });
  slideElements.forEach((el) => slideObserver.observe(el));
};

/* Controlled card carousels: buttons/dots drive the state; touch remains gesture-friendly. */
const initCarousels = () => {
  document.querySelectorAll('[data-card-carousel]').forEach((carousel) => {
    const viewport = carousel.querySelector('.card-carousel-viewport');
    const track = carousel.querySelector('.card-carousel-track');
    const cards = track ? Array.from(track.querySelectorAll('.premium-card')) : [];
    const dots = carousel.querySelector('[data-carousel-dots]');
    const prev = carousel.querySelector('[data-carousel-prev]');
    const next = carousel.querySelector('[data-carousel-next]');
    if (!viewport || !track || !dots || !cards.length) return;

    let activeIndex = 0;
    let visibleCount = 1;
    let maxIndex = Math.max(0, cards.length - visibleCount);
    let dragging = false;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let dragOffset = 0;
    let dragActive = false;

    const getVisibleCount = () => {
      if (window.innerWidth >= 1200) return 3;
      if (window.innerWidth >= 768) return 2;
      return 1;
    };

    const syncLayout = () => {
      visibleCount = Math.min(getVisibleCount(), cards.length);
      maxIndex = Math.max(0, cards.length - visibleCount);
      activeIndex = Math.min(activeIndex, maxIndex);
      carousel.style.setProperty('--carousel-index', activeIndex);
      updateControls();
    };

    const updateControls = () => {
      carousel.style.setProperty('--carousel-index', activeIndex);
      prev?.toggleAttribute('disabled', activeIndex === 0);
      next?.toggleAttribute('disabled', activeIndex === maxIndex);
      dots.querySelectorAll('.card-carousel-dot').forEach((dot, index) => {
        const current = index === activeIndex;
        dot.setAttribute('aria-current', String(current));
      });
    };

    const animateActiveCard = () => {
      if (reduceMotion) return;
      cards.forEach((card) => card.classList.remove('is-active'));
      void cards[activeIndex]?.offsetWidth;
      cards[activeIndex]?.classList.add('is-active');
    };

    const goTo = (index) => {
      activeIndex = Math.max(0, Math.min(index, maxIndex));
      dragOffset = 0;
      carousel.style.setProperty('--carousel-drag', '0px');
      updateControls();
      animateActiveCard();
    };

    cards.forEach((card, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'card-carousel-dot';
      dot.setAttribute('aria-label', `Go to ${carousel.dataset.cardCarousel === 'industries' ? 'industry' : 'service'} ${index + 1}`);
      dot.setAttribute('aria-current', String(index === 0));
      dot.addEventListener('click', () => goTo(Math.min(index, maxIndex)));
      dots.appendChild(dot);
    });

    prev?.addEventListener('click', () => goTo(activeIndex - 1));
    next?.addEventListener('click', () => goTo(activeIndex + 1));

    const finishPointer = (event) => {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove('is-dragging');
      viewport.releasePointerCapture?.(event.pointerId);
      if (dragActive) {
        if (dragOffset < -48) goTo(activeIndex + 1);
        else if (dragOffset > 48) goTo(activeIndex - 1);
        else goTo(activeIndex);
      }
      dragOffset = 0;
      dragActive = false;
      carousel.style.setProperty('--carousel-drag', '0px');
    };

    viewport.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragging = true;
      dragActive = false;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      dragOffset = 0;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture?.(event.pointerId);
    });

    viewport.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const dx = event.clientX - pointerStartX;
      const dy = event.clientY - pointerStartY;
      if (!dragActive) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
          dragging = false;
          viewport.classList.remove('is-dragging');
          viewport.releasePointerCapture?.(event.pointerId);
          return;
        }
        if (Math.abs(dx) > 8) dragActive = true;
      }
      if (!dragActive) return;
      event.preventDefault();
      dragOffset = dx;
      carousel.style.setProperty('--carousel-drag', `${dragOffset}px`);
    });

    viewport.addEventListener('pointerup', finishPointer);
    viewport.addEventListener('pointercancel', finishPointer);
    viewport.addEventListener('click', (event) => {
      if (dragActive) { event.preventDefault(); event.stopPropagation(); }
    }, true);

    viewport.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 12) return;
      event.preventDefault();
      goTo(activeIndex + (event.deltaX > 0 ? 1 : -1));
    }, { passive: false });

    viewport.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); goTo(activeIndex + 1); }
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); goTo(activeIndex - 1); }
      else if (event.key === 'Home') { event.preventDefault(); goTo(0); }
      else if (event.key === 'End') { event.preventDefault(); goTo(maxIndex); }
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(syncLayout, 100);
    }, { passive: true });

    syncLayout();
    animateActiveCard();
  });
};

const initForms = () => {
  document.querySelectorAll('form[data-validate]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('[required]').forEach((field) => {
        if (!field.value.trim()) { valid = false; field.style.borderColor = 'var(--accent)'; field.style.boxShadow = '0 0 0 3px rgba(232, 72, 92, 0.1)'; }
        else { field.style.borderColor = ''; field.style.boxShadow = ''; }
      });
      if (valid) {
        const btn = form.querySelector('.form-submit');
        if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }
        setTimeout(() => { if (btn) { btn.textContent = 'Message Sent ✓'; btn.style.background = '#1a3a1a'; } form.reset(); }, 1500);
      }
    });
  });
};

const initYear = () => { const yearEl = document.getElementById('year'); if (yearEl) yearEl.textContent = new Date().getFullYear(); };
const initAll = () => { initPreloader(); initScrollReveals(); initCarousels(); initForms(); initYear(); };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll); else initAll();