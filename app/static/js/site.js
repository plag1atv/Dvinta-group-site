document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('mobileMenuBtn');
  const closeBtn = document.getElementById('mobileMenuCloseBtn');
  const menu = document.getElementById('mobileMenu');

  if (btn && menu) {
    const openMenu = () => {
      menu.classList.remove('hidden');
      document.body.classList.add('mobile-menu-open');
      btn.setAttribute('aria-expanded', 'true');
    };

    const closeMenu = () => {
      menu.classList.add('hidden');
      document.body.classList.remove('mobile-menu-open');
      btn.setAttribute('aria-expanded', 'false');
    };

    btn.addEventListener('click', openMenu);

    if (closeBtn) {
      closeBtn.addEventListener('click', closeMenu);
    }

    menu.addEventListener('click', (event) => {
      if (event.target === menu) {
        closeMenu();
      }
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !menu.classList.contains('hidden')) {
        closeMenu();
      }
    });
  }

  // Современный интерактивный фон
  const modernBackgroundScene = document.getElementById(
    'modernBackgroundScene'
  );

  const reduceBackgroundMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (modernBackgroundScene && !reduceBackgroundMotion) {
    let targetX = 0;
    let targetY = 0;
    let animationFrameId = null;

    const renderBackgroundMovement = () => {
      modernBackgroundScene.style.transform =
        `translate3d(${targetX}px, ${targetY}px, 0)`;

      animationFrameId = null;
    };

    const requestBackgroundRender = () => {
      if (animationFrameId !== null) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(
        renderBackgroundMovement
      );
    };

    window.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') {
        return;
      }

      const horizontalPosition =
        event.clientX / window.innerWidth - 0.5;

      const verticalPosition =
        event.clientY / window.innerHeight - 0.5;

      targetX = horizontalPosition * 18;
      targetY = verticalPosition * 14;

      requestBackgroundRender();
    });

    document.documentElement.addEventListener('mouseleave', () => {
      targetX = 0;
      targetY = 0;

      requestBackgroundRender();
    });
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

  // Floating request button bubble
  const floatingRequestBubble = document.getElementById('floatingRequestBubble');
  const floatingRequestClose = document.getElementById('floatingRequestClose');

  if (floatingRequestBubble && floatingRequestClose) {
    const showFloatingRequestBubble = window.setTimeout(() => {
      floatingRequestBubble.classList.add('is-visible');
    }, 30000);

    floatingRequestClose.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      window.clearTimeout(showFloatingRequestBubble);
      floatingRequestBubble.classList.remove('is-visible');
    });
  }

});
