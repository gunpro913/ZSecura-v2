const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const video = document.querySelector('.hero-video');
const playButton = document.querySelector('#playVideo');

if (menuButton) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    navLinks?.classList.toggle('mobile-open', !open);
  });
}

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    navLinks?.classList.remove('mobile-open');
  });
});

if (playButton && video) {
  playButton.addEventListener('click', () => {
    if (video.readyState < 2) return;
    if (video.paused) {
      video.play();
      playButton.querySelector('.play-icon')?.classList.remove('is-paused');
    } else {
      video.pause();
      playButton.querySelector('.play-icon')?.classList.add('is-paused');
    }
  });
}

// Add a subtle depth response to the hero atmosphere on pointer movement.
const hero = document.querySelector('.hero');
const mountains = document.querySelector('.fallback-mountains');

if (hero && mountains && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  hero.addEventListener('pointermove', (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;
    mountains.style.transform = `translate3d(${x * -8}px, ${y * -4}px, 0) scale(1.03)`;
  });

  hero.addEventListener('pointerleave', () => {
    mountains.style.transform = 'translate3d(0, 0, 0) scale(1)';
  });
}
