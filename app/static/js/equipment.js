document.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("equipmentSearch");
  const category = document.getElementById("equipmentCategory");
  const cards = Array.from(document.querySelectorAll("[data-equip-card]"));
  const empty = document.getElementById("equipmentEmpty");

  function normalize(s) {
    return (s || "").toString().trim().toLowerCase();
  }

  function applyFilter() {
    const term = normalize(search.value);
    const cat = category.value;

    let visibleCount = 0;

    for (const card of cards) {
      const name = normalize(card.dataset.name);
      const cardCat = card.dataset.category;

      const matchesSearch = term === "" || name.includes(term);
      const matchesCategory = cat === "all" || cardCat === cat;

      const show = matchesSearch && matchesCategory;
      card.style.display = show ? "" : "none";
      if (show) visibleCount += 1;
    }

    if (visibleCount === 0) {
      empty.classList.remove("hidden");
    } else {
      empty.classList.add("hidden");
    }
  }

  if (search) search.addEventListener("input", applyFilter);
  if (category) category.addEventListener("change", applyFilter);

  applyFilter();
});
