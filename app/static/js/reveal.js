document.addEventListener("DOMContentLoaded", () => {
  const els = Array.from(document.querySelectorAll(".reveal"));
  if (els.length === 0) return;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;

      // поддержка data-delay="0.1s" / "120ms"
      const delay = e.target.dataset.delay;
      if (delay) e.target.style.transitionDelay = delay;

      e.target.classList.add("show");
      io.unobserve(e.target);
    }
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
});
