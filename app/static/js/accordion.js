document.addEventListener("DOMContentLoaded", () => {
  const buttons = Array.from(document.querySelectorAll("[data-acc-btn]"));

  for (const btn of buttons) {
    btn.addEventListener("click", () => {
      const card = btn.closest("div");
      if (!card) return;

      const body = card.querySelector("[data-acc-body]");
      const icon = btn.querySelector("[data-acc-icon]");
      if (!body) return;

      const isOpen = !body.classList.contains("hidden");

      // закрываем все
      for (const b of buttons) {
        const c = b.closest("div");
        if (!c) continue;
        const bd = c.querySelector("[data-acc-body]");
        const ic = b.querySelector("[data-acc-icon]");
        if (bd) bd.classList.add("hidden");
        if (ic) ic.style.transform = "rotate(0deg)";
      }

      // открываем текущий, если был закрыт
      if (!isOpen) {
        body.classList.remove("hidden");
        if (icon) icon.style.transform = "rotate(180deg)";
      }
    });
  }
});
