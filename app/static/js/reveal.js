document.addEventListener("DOMContentLoaded", () => {
  const els = Array.from(document.querySelectorAll(".reveal"));
  if (els.length === 0) return;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("show");
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
});
