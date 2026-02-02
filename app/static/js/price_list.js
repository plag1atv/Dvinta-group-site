document.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("priceSearch");
  const category = document.getElementById("priceCategory");
  const rows = Array.from(document.querySelectorAll("[data-price-row]"));
  const empty = document.getElementById("priceEmpty");

  function normalize(s) {
    return (s || "").toString().trim().toLowerCase();
  }

  function applyFilter() {
    const term = normalize(search.value);
    const cat = category.value;

    let visibleCount = 0;

    for (const row of rows) {
      const name = normalize(row.dataset.name);
      const rowCat = row.dataset.cat;

      const matchesSearch = term === "" || name.includes(term);
      const matchesCategory = cat === "all" || rowCat === cat;

      const show = matchesSearch && matchesCategory;
      row.style.display = show ? "" : "none";
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
