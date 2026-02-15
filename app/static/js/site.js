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

});
