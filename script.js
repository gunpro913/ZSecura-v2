const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const nav = document.querySelector('.nav');
const video = document.querySelector('.hero-video');
const playButton = document.querySelector('#playVideo');
const hero = document.querySelector('.hero');
const mountains = document.querySelector('.fallback-mountains');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.documentElement.classList.add('js-ready');

const closeMenu = () => {
  if (!menuButton || !navLinks) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
  navLinks.classList.remove('mobile-open');
};

if (menuButton && navLinks) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    menuButton.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    navLinks.classList.toggle('mobile-open', !open);
  });

  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (event) => {
    if (!navLinks.classList.contains('mobile-open')) return;
    if (nav?.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

const updateNavDepth = () => {
  nav?.classList.toggle('is-scrolled', window.scrollY > 24);
};
updateNavDepth();
window.addEventListener('scroll', updateNavDepth, { passive: true });

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
