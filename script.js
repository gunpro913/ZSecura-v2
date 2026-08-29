const navWrap = document.querySelector('.nav-wrap');
const nav = document.querySelector('.nav');
const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const video = document.querySelector('.hero-video');
const playButton = document.querySelector('#playVideo');
const hero = document.querySelector('.hero');
const mountains = document.querySelector('.fallback-mountains');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Keep the fixed navigation outside the page shell so no ancestor overflow or
   stacking context can clip/paint over it on mobile or desktop. */
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

let lastScrollY = window.scrollY;
const updateNav = () => {
  if (!nav) return;
  nav.classList.toggle('is-scrolled', window.scrollY > 18);
  lastScrollY = window.scrollY;
};
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

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
      try { await video.play(); } catch (_) { /* autoplay restrictions */ }
    } else {
      video.pause();
    }
    setVideoState();
  });
  setVideoState();
}

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

/* ===== PARTICLE NETWORK HERO ===== */
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

      // Bounce off edges
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Mouse interaction
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

      // Damping
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

      // Connect to mouse
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

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    drawConnections();
    animationId = requestAnimationFrame(animate);
  };

  const init = () => {
    resize();
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }
    animate();
  };

  // Mouse tracking
  hero.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  hero.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Toggle with play button
  if (playButton) {
    playButton.addEventListener('click', () => {
      isPaused = !isPaused;
      if (!isPaused) animate();
    });
  }

  window.addEventListener('resize', resize);
  init();
};

/* ===== TEXT SCRAMBLE REVEAL ===== */
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\/[]{}—=+*^?#________';
    this.originalText = el.getAttribute('data-scramble') || el.innerText;
    this.update = this.update.bind(this);
  }

  scramble() {
    this.queue = [];
    const length = this.originalText.length;

    for (let i = 0; i < length; i++) {
      const from = this.el.innerText[i] || '';
      const to = this.originalText[i];
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 20) + 10;
      this.queue.push({ from, to, start, end });
    }

    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
  }

  update() {
    let output = '';
    let complete = 0;

    for (let i = 0; i < this.queue.length; i++) {
      let { from, to, start, end } = this.queue[i];
      let char = this.queue[i].char;

      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="scramble-char">${char}</span>`;
      } else {
        output += from;
      }
    }

    this.el.innerHTML = output;

    if (complete === this.queue.length) {
      this.el.classList.remove('scrambling');
      return;
    } else {
      this.el.classList.add('scrambling');
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

const initScramble = () => {
  const scrambleElements = document.querySelectorAll('.scramble-text');

  const scrambleObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        // Small delay for staggered effect
        setTimeout(() => {
          const fx = new TextScramble(el);
          fx.scramble();
        }, Math.random() * 300);
        scrambleObserver.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  scrambleElements.forEach(el => scrambleObserver.observe(el));
};

/* ===== 3D TILT SERVICE CARDS ===== */
const initTiltCards = () => {
  const cards = document.querySelectorAll('.service-card');

  cards.forEach(card => {
    const shine = card.querySelector('.card-shine');
    const glow = card.querySelector('.card-glow');

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate rotation (max ±12 degrees)
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;

      // Apply 3D tilt
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

      // Update shine/glow position
      const percentX = (x / rect.width) * 100;
      const percentY = (y / rect.height) * 100;

      card.style.setProperty('--mouse-x', `${percentX}%`);
      card.style.setProperty('--mouse-y', `${percentY}%`);

      if (shine) {
        shine.style.setProperty('--mouse-x', `${percentX}%`);
        shine.style.setProperty('--mouse-y', `${percentY}%`);
      }
      if (glow) {
        glow.style.setProperty('--mouse-x', `${percentX}%`);
        glow.style.setProperty('--mouse-y', `${percentY}%`);
      }
    });

    card.addEventListener('mouseleave', () => {
      // Reset to flat
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });

    card.addEventListener('mouseenter', () => {
      // Slight lift on enter
      card.style.transition = 'transform 0.15s ease-out';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.5s ease-out, border-color 0.35s ease, background 0.35s ease';
    });
  });
};

/* ===== INITIALIZE ALL FEATURES ===== */
const initAll = () => {
  initParticleNetwork();
  initScramble();
  initTiltCards();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}
