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
if (navWrap && navWrap.parentElement !== document.body) {
  document.body.prepend(navWrap);
}

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
  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!nav?.contains(event.target) && navLinks.classList.contains('mobile-open')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

/* ===== NAV SCROLL ===== */
const updateNav = () => {
  if (!nav) return;
  nav.classList.toggle('is-scrolled', window.scrollY > 18);
};
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

/* ===== SCROLL REVEALS (headings / copy) ===== */
const initScrollReveals = () => {
  const slideElements = document.querySelectorAll('.slide-up-reveal, .reveal-text');
  if (!slideElements.length || !('IntersectionObserver' in window)) return;
  if (reduceMotion) {
    slideElements.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = Array.from(slideElements).indexOf(entry.target) * 70;
        setTimeout(() => { entry.target.classList.add('is-visible'); }, delay);
        slideObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });
  slideElements.forEach((el) => slideObserver.observe(el));
};

/* ===== CAPABILITY CAROUSEL ===== */
const initCarousels = () => {
  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const track = carousel.querySelector('.capability-track');
    if (!track) return;
    const prev = carousel.querySelector('[data-carousel-prev]');
    const next = carousel.querySelector('[data-carousel-next]');
    const scrollByCard = (direction) => {
      const card = track.querySelector('.capability-card');
      const distance = card ? card.getBoundingClientRect().width + 24 : track.clientWidth * 0.8;
      track.scrollBy({ left: direction * distance, behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    prev?.addEventListener('click', () => scrollByCard(-1));
    next?.addEventListener('click', () => scrollByCard(1));
  });
};

/* ===== FORM VALIDATION ===== */
const initForms = () => {
  const forms = document.querySelectorAll('form[data-validate]');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      const required = form.querySelectorAll('[required]');
      required.forEach(field => {
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

/* ===== AUTO-UPDATE COPYRIGHT YEAR ===== */
const initYear = () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
};

/* ===== INITIALIZE ALL ===== */
const initAll = () => {
  initPreloader();
  initScrollReveals();
  initCarousels();
  initForms();
  initYear();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}
