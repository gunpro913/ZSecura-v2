const navWrap = document.querySelector('.nav-wrap');
const nav = document.querySelector('.nav');
const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===== PRELOADER ===== */
const initPreloader = () => {
  const preloader = document.querySelector('.preloader');
  if (!preloader) return;
  setTimeout(() => { preloader.classList.add('hidden'); }, 1200);
};

/* ===== NAV FIX ===== */
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

/* ===== NAV SCROLL ===== */
const updateNav = () => nav?.classList.toggle('is-scrolled', window.scrollY > 18);
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

/* ===== REVEAL OBSERVER ===== */
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

/* ===== SCROLL REVEALS ===== */
const initScrollReveals = () => {
  const slideElements = document.querySelectorAll('.slide-up-reveal, .reveal-text');
  if (!slideElements.length || !('IntersectionObserver' in window)) return;
  if (reduceMotion) {
    slideElements.forEach((el) => el.classList.add('is-visible'));
    return;
  }
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

/* ===== LIGHTWEIGHT CAROUSELS ===== */
const initCarousels = () => {
  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const track = carousel.querySelector('.capability-track, .service-carousel-track, .industry-track');
    if (!track) return;
    const cards = Array.from(track.children);
    const dots = carousel.querySelector('.carousel-dots');
    if (!cards.length) return;

    const scrollToCard = (index) => {
      const card = cards[Math.max(0, Math.min(index, cards.length - 1))];
      track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
    };

    if (dots) {
      dots.innerHTML = '';
      cards.forEach((card, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Go to card ${index + 1}`);
        dot.addEventListener('click', () => scrollToCard(index));
        dots.appendChild(dot);
      });
    }

    const updateActive = () => {
      if (!dots) return;
      const left = track.scrollLeft;
      let active = 0;
      cards.forEach((card, index) => {
        if (Math.abs(card.offsetLeft - track.offsetLeft - left) < Math.abs(cards[active].offsetLeft - track.offsetLeft - left)) active = index;
      });
      dots.querySelectorAll('.carousel-dot').forEach((dot, index) => {
        dot.classList.toggle('is-active', index === active);
        dot.setAttribute('aria-current', index === active ? 'true' : 'false');
      });
    };

    track.addEventListener('scroll', updateActive, { passive: true });
    updateActive();

    let pointerStartX = 0;
    let pointerStartScroll = 0;
    let dragging = false;
    let horizontalIntent = false;

    track.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      pointerStartX = event.clientX;
      pointerStartScroll = track.scrollLeft;
      dragging = true;
      horizontalIntent = false;
    });
    track.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const dx = event.clientX - pointerStartX;
      if (!horizontalIntent && Math.abs(dx) < 8) return;
      if (!horizontalIntent) horizontalIntent = true;
      event.preventDefault();
      track.classList.add('is-dragging');
      track.scrollLeft = pointerStartScroll - dx;
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      if (horizontalIntent) {
        const nearest = cards.reduce((best, card, index) => {
          const distance = Math.abs(card.offsetLeft - track.offsetLeft - track.scrollLeft);
          const bestDistance = Math.abs(cards[best].offsetLeft - track.offsetLeft - track.scrollLeft);
          return distance < bestDistance ? index : best;
        }, 0);
        scrollToCard(nearest);
      }
      horizontalIntent = false;
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', () => { if (dragging) endDrag(); });
  });
};

/* ===== FORM VALIDATION ===== */
const initForms = () => {
  document.querySelectorAll('form[data-validate]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('[required]').forEach((field) => {
        if (!field.value.trim()) {
          valid = false;
          field.style.borderColor = 'var(--accent)';
          field.style.boxShadow = '0 0 0 3px rgba(232, 72, 92, 0.1)';
        } else {
          field.style.borderColor = '';
          field.style.boxShadow = '';
        }
      });
      if (valid) {
        const btn = form.querySelector('.form-submit');
        if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }
        setTimeout(() => {
          if (btn) { btn.textContent = 'Message Sent ✓'; btn.style.background = '#1a3a1a'; }
          form.reset();
        }, 1500);
      }
    });
  });
};

const initYear = () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
};

const initAll = () => {
  initPreloader();
  initScrollReveals();
  initCarousels();
  initForms();
  initYear();
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
else initAll();
