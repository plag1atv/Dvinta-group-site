document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');

  if (btn && menu) {
    btn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });
  }
  // Parallax background (mountains)
const mountain = document.getElementById('mountain-bg');
const prefersReduced = window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (mountain && !prefersReduced) {
  let latestScrollY = window.scrollY || 0;
  let ticking = false;

  const update = () => {
    // Чем больше коэффициент, тем сильнее «опускается» гора
    const y = latestScrollY * 0.18;
    mountain.style.transform = `translate3d(0, ${y}px, 0)`;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    latestScrollY = window.scrollY || 0;
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  update();
}

// Intro splash (ONLY on home page where #introSplash exists)
const splash = document.getElementById('introSplash');
if (splash) {
  document.body.classList.add('no-scroll');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // total timeline (ms): bar + title + underline + subtitle + small hold
  const fadeOutAt = prefersReduced ? 150 : 3200;
  const removeAt  = prefersReduced ? 300 : 3650;

  window.setTimeout(() => {
    splash.classList.add('is-done');
  }, fadeOutAt);

  window.setTimeout(() => {
    splash.remove();
    document.body.classList.remove('no-scroll');
  }, removeAt);
}

});
