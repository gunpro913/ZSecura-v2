const navWrap = document.querySelector('.nav-wrap');
const nav = document.querySelector('.nav');
const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const video = document.querySelector('.hero-video');
const playButton = document.querySelector('#playVideo');
const hero = document.querySelector('.hero');
const mountains = document.querySelector('.fallback-mountains');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

/* ===== CUSTOM CURSOR ===== */
const initCursor = () => {
  if (isTouchDevice || reduceMotion) return;

  const dot = document.createElement('div');
  const outline = document.createElement('div');
  dot.className = 'cursor-dot';
  outline.className = 'cursor-outline';
  document.body.appendChild(dot);
  document.body.appendChild(outline);

  let mouseX = 0, mouseY = 0;
  let outlineX = 0, outlineY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
  });

  const animateOutline = () => {
    outlineX += (mouseX - outlineX) * 0.15;
    outlineY += (mouseY - outlineY) * 0.15;
    outline.style.left = outlineX + 'px';
    outline.style.top = outlineY + 'px';
    requestAnimationFrame(animateOutline);
  };
  animateOutline();

  // Expand on clickable elements
  const clickables = document.querySelectorAll('a, button, input, textarea, select, .service-card, .team-card, .blog-card');
  clickables.forEach(el => {
    el.addEventListener('mouseenter', () => outline.classList.add('hovering'));
    el.addEventListener('mouseleave', () => outline.classList.remove('hovering'));
    el.addEventListener('mousedown', () => outline.classList.add('clicking'));
    el.addEventListener('mouseup', () => outline.classList.remove('clicking'));
  });
};

/* ===== PRELOADER ===== */
const initPreloader = () => {
  const preloader = document.querySelector('.preloader');
  if (!preloader) return;
  setTimeout(() => { preloader.classList.add('hidden'); }, 1800);
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
    if (!nav?.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

/* ===== NAV SCROLL ===== */
let lastScrollY = window.scrollY;
const updateNav = () => {
  if (!nav) return;
  nav.classList.toggle('is-scrolled', window.scrollY > 18);
  lastScrollY = window.scrollY;
};
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

/* ===== VIDEO CONTROLS ===== */
const setVideoState = () => {
  if (!video || !playButton) return;
  const paused = video.paused;
  playButton.setAttribute('aria-label', paused ? 'Play hero video' : 'Pause hero video');
  playButton.querySelector('.play-icon')?.classList.toggle('is-paused', !paused);
};

if (playButton && video) {
  video.addEventListener('play', setVideoState);
  video.addEventListener('pause', setVideoState);
  playButton.addEventListener('click', async () => {
    if (video.paused) {
      try { await video.play(); } catch (_) {}
    } else {
      video.pause();
    }
    setVideoState();
  });
  setVideoState();
}

/* ===== MOUNTAINS PARALLAX ===== */
if (hero && mountains && !reduceMotion) {
  hero.addEventListener('pointermove', (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;
    mountains.style.transform = `translate3d(${x * -8}px, ${y * -4}px, 0) scale(1.03)`;
  });
  hero.addEventListener('pointerleave', () => {
    mountains.style.transform = 'translate3d(0,0,0) scale(1)';
  });
}

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

/* ===== ACTIVE NAV LINKS ===== */
const sections = [...document.querySelectorAll('section[id]')];
const navItems = [...document.querySelectorAll('.nav-links a')];
if ('IntersectionObserver' in window && navItems.length) {
  const activeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navItems.forEach((item) => item.classList.toggle('active', item.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
  sections.forEach((section) => activeObserver.observe(section));
}

/* ===== PARTICLE NETWORK ===== */
const initParticleNetwork = () => {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  let animationId;
  let isPaused = false;

  const PARTICLE_COUNT = 80;
  const CONNECTION_DISTANCE = 150;
  const MOUSE_DISTANCE = 200;

  let mouse = { x: null, y: null };

  const resize = () => {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  };

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.size = Math.random() * 2 + 1;
      this.baseColor = Math.random() > 0.7 ? '255, 29, 37' : '175, 191, 211';
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_DISTANCE) {
          const force = (MOUSE_DISTANCE - dist) / MOUSE_DISTANCE;
          this.vx += dx * force * 0.001;
          this.vy += dy * force * 0.001;
        }
      }
      this.vx *= 0.99;
      this.vy *= 0.99;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.baseColor}, 0.6)`;
      ctx.fill();
    }
  }

  const drawConnections = () => {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DISTANCE) {
          const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.25;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(175, 191, 211, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
      if (mouse.x !== null && mouse.y !== null) {
        const dx = particles[i].x - mouse.x;
        const dy = particles[i].y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_DISTANCE) {
          const opacity = (1 - dist / MOUSE_DISTANCE) * 0.4;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(255, 29, 37, ${opacity})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
  };

  const animate = () => {
    if (isPaused) return;
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    animationId = requestAnimationFrame(animate);
  };

  const init = () => {
    resize();
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
    animate();
  };

  hero.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  hero.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

  if (playButton) {
    playButton.addEventListener('click', () => {
      isPaused = !isPaused;
      if (!isPaused) animate();
    });
  }

  window.addEventListener('resize', resize);
  init();
};

/* ===== KINETIC TYPOGRAPHY (Scroll-Driven) ===== */
const initKineticText = () => {
  if (reduceMotion) return;

  const kineticElements = document.querySelectorAll('.kinetic-text');
  if (!kineticElements.length) return;

  const updateKinetic = () => {
    kineticElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;
      const distanceFromCenter = (elementCenter - viewportHeight / 2) / viewportHeight;
      const intensity = Math.max(-1, Math.min(1, distanceFromCenter));

      // Compress when scrolling past, expand when approaching
      const weight = 700 - (intensity * 200);
      const letterSpacing = -0.055 + (intensity * 0.03);
      const scaleY = 1 - (Math.abs(intensity) * 0.05);

      el.style.fontVariationSettings = `'wght' ${Math.max(400, Math.min(900, weight))}`;
      el.style.letterSpacing = `${letterSpacing}em`;
      el.style.transform = `scaleY(${scaleY})`;
    });
  };

  window.addEventListener('scroll', updateKinetic, { passive: true });
  updateKinetic();
};

/* ===== TEXT REVEALS ===== */
const initTextReveals = () => {
  const heroHeading = document.querySelector('.typewriter-hero');
  if (heroHeading && window.innerWidth > 800 && !reduceMotion) {
    const text = heroHeading.getAttribute('data-text');
    if (text) {
      heroHeading.textContent = '';
      heroHeading.style.width = '0';
      let i = 0;
      const typeChar = () => {
        if (i < text.length) {
          heroHeading.textContent += text.charAt(i);
          i++;
          setTimeout(typeChar, 45);
        } else {
          heroHeading.innerHTML = text.replace('BUSINESS', '<span class="typewriter-accent">BUSINESS</span>');
          heroHeading.classList.add('typing-done');
        }
      };
      setTimeout(typeChar, 400);
    }
  } else if (heroHeading) {
    heroHeading.classList.add('typing-done');
  }

  const slideElements = document.querySelectorAll('.slide-up-reveal, .reveal-text');
  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = Array.from(slideElements).indexOf(entry.target) * 80;
        setTimeout(() => { entry.target.classList.add('is-visible'); }, delay);
        slideObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });
  slideElements.forEach(el => slideObserver.observe(el));
};

/* ===== 3D TILT CARDS ===== */
const initTiltCards = () => {
  const cards = document.querySelectorAll('.service-card');
  cards.forEach(card => {
    const shine = card.querySelector('.card-shine');
    const glow = card.querySelector('.card-glow');

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

      const percentX = (x / rect.width) * 100;
      const percentY = (y / rect.height) * 100;
      card.style.setProperty('--mouse-x', `${percentX}%`);
      card.style.setProperty('--mouse-y', `${percentY}%`);
      if (shine) { shine.style.setProperty('--mouse-x', `${percentX}%`); shine.style.setProperty('--mouse-y', `${percentY}%`); }
      if (glow) { glow.style.setProperty('--mouse-x', `${percentX}%`); glow.style.setProperty('--mouse-y', `${percentY}%`); }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
    card.addEventListener('mouseenter', () => { card.style.transition = 'transform 0.15s ease-out'; });
    card.addEventListener('mouseleave', () => { card.style.transition = 'transform 0.5s ease-out, border-color 0.35s ease, background 0.35s ease, box-shadow 0.35s ease'; });
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
          field.style.borderColor = 'var(--red)';
          field.style.boxShadow = '0 0 0 3px rgba(255,29,37,.1)';
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

/* ===== INITIALIZE ALL ===== */
const initAll = () => {
  initCursor();
  initPreloader();
  initParticleNetwork();
  initKineticText();
  initTextReveals();
  initTiltCards();
  initForms();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}
