document.addEventListener("DOMContentLoaded", () => {
  const typeEl = document.getElementById("calType");
  const qtyEl = document.getElementById("calQty");
  const resEl = document.getElementById("calResult");

  if (!typeEl || !qtyEl || !resEl) return;

  function clampInt(v, min, max) {
    const n = parseInt(v, 10);
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function estimateDays(type, qty) {
    // Базовые сроки (рабочие дни) — очень приблизительно
    // simple: 1 день на 1-3 шт, 2 дня на 4-8, 3+ дальше
    // standard: 2 дня на 1-3, 3 дня на 4-8, 4+ дальше
    // complex: 3 дня на 1-2, 5 дней на 3-5, 7+ дальше
    if (type === "simple") {
      if (qty <= 3) return [1, 2];
      if (qty <= 8) return [2, 3];
      return [3, 5];
    }
    if (type === "standard") {
      if (qty <= 3) return [2, 3];
      if (qty <= 8) return [3, 5];
      return [5, 7];
    }
    // complex
    if (qty <= 2) return [3, 5];
    if (qty <= 5) return [5, 7];
    return [7, 10];
  }

  function render() {
    const type = typeEl.value;
    const qty = clampInt(qtyEl.value, 1, 999);
    qtyEl.value = qty;

    const [minD, maxD] = estimateDays(type, qty);

    if (minD === maxD) {
      resEl.textContent = `${minD} рабочих дней`;
    } else {
      resEl.textContent = `${minD}–${maxD} рабочих дней`;
    }
  }

  typeEl.addEventListener("change", render);
  qtyEl.addEventListener("input", render);

  render();
});
