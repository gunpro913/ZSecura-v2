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

/* ===== DOT-CONTROLLED CARD CAROUSELS ===== */
const initCarousels = () => {
  document.querySelectorAll('[data-card-carousel]').forEach((carousel) => {
    const viewport = carousel.querySelector('.card-carousel-viewport');
    const track = carousel.querySelector('.card-carousel-track');
    const cards = track ? Array.from(track.querySelectorAll('.premium-card')) : [];
    const dots = carousel.querySelector('[data-carousel-dots]');
    if (!viewport || !track || !dots || !cards.length) return;

    let activeIndex = 0;
    let isPointerDragging = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let dragMoved = false;

    const getTargetLeft = (index) => {
      const card = cards[index];
      if (!card) return 0;
      return Math.max(0, card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2);
    };

    const setActive = (index, scroll = true) => {
      activeIndex = Math.max(0, Math.min(index, cards.length - 1));
      dots.querySelectorAll('.card-carousel-dot').forEach((dot, dotIndex) => {
        dot.setAttribute('aria-current', String(dotIndex === activeIndex));
      });
      if (scroll) {
        viewport.scrollTo({
          left: getTargetLeft(activeIndex),
          behavior: reduceMotion ? 'auto' : 'smooth'
        });
      }
    };

    cards.forEach((card, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'card-carousel-dot';
      dot.setAttribute('aria-label', `Go to ${carousel.dataset.cardCarousel === 'industries' ? 'industry' : 'service'} ${index + 1}`);
      dot.setAttribute('aria-current', String(index === 0));
      dot.addEventListener('click', () => setActive(index));
      dots.appendChild(dot);
    });

    const updateFromScroll = () => {
      if (isPointerDragging) return;
      const center = viewport.scrollLeft + viewport.clientWidth / 2;
      let nearest = 0;
      let distance = Infinity;
      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const nextDistance = Math.abs(cardCenter - center);
        if (nextDistance < distance) {
          distance = nextDistance;
          nearest = index;
        }
      });
      if (nearest !== activeIndex) setActive(nearest, false);
    };

    viewport.addEventListener('scroll', updateFromScroll, { passive: true });

    viewport.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      isPointerDragging = true;
      dragMoved = false;
      dragStartX = event.clientX;
      dragStartScroll = viewport.scrollLeft;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture?.(event.pointerId);
    });

    viewport.addEventListener('pointermove', (event) => {
      if (!isPointerDragging) return;
      const delta = event.clientX - dragStartX;
      if (Math.abs(delta) > 6) dragMoved = true;
      viewport.scrollLeft = dragStartScroll - delta;
    });

    const endPointerDrag = (event) => {
      if (!isPointerDragging) return;
      isPointerDragging = false;
      viewport.classList.remove('is-dragging');
      viewport.releasePointerCapture?.(event.pointerId);
      if (dragMoved) {
        updateFromScroll();
        setActive(activeIndex);
      }
    };

    viewport.addEventListener('pointerup', endPointerDrag);
    viewport.addEventListener('pointercancel', endPointerDrag);

    viewport.addEventListener('click', (event) => {
      if (dragMoved) {
        event.preventDefault();
        event.stopPropagation();
        dragMoved = false;
      }
    }, true);

    viewport.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        setActive(activeIndex + 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        setActive(activeIndex - 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        setActive(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        setActive(cards.length - 1);
      }
    });

    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(() => setActive(activeIndex, false)) : null;
    resizeObserver?.observe(viewport);
    setActive(0, false);
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
