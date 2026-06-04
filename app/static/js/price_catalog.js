document.addEventListener("DOMContentLoaded", () => {
  const priceGrid = document.getElementById("priceGrid");
  const priceSearch = document.getElementById("priceSearch");
  const sectionFilter = document.getElementById("priceSectionFilter");
  const typeFilter = document.getElementById("priceTypeFilter");
  const resetButton = document.getElementById("priceReset");
  const resultCount = document.getElementById("priceResultCount");
  const emptyBlock = document.getElementById("priceEmpty");
  const prevButton = document.getElementById("pricePrev");
  const nextButton = document.getElementById("priceNext");
  const pageInfo = document.getElementById("pricePageInfo");

  const itemsPerPage = 8;

  let allItems = [];
  let filteredItems = [];
  let currentPage = 1;

  function normalizeText(value) {
    return String(value || "").toLowerCase().trim();
  }

  function getVisiblePrice(item) {
    const type = typeFilter.value;

    if (type === "verification") {
      return {
        label: "Поверка",
        value: item.verification_price || "—",
      };
    }

    if (type === "calibration") {
      return {
        label: "Калибровка",
        value: item.calibration_price || "—",
      };
    }

    return null;
  }

  function createPriceCard(item) {
    const selectedPrice = getVisiblePrice(item);

    const verificationPrice = item.verification_price || "—";
    const calibrationPrice = item.calibration_price || "—";
    const range = item.range || "Диапазон не указан";
    const note = item.note || "";

    let priceHtml = `
      <div class="price-card-prices">
        <div>
          <span>Поверка</span>
          <strong>${verificationPrice}</strong>
        </div>
        <div>
          <span>Калибровка</span>
          <strong>${calibrationPrice}</strong>
        </div>
      </div>
    `;

    if (selectedPrice) {
      priceHtml = `
        <div class="price-card-prices price-card-prices-single">
          <div>
            <span>${selectedPrice.label}</span>
            <strong>${selectedPrice.value}</strong>
          </div>
        </div>
      `;
    }

    return `
      <article class="price-card">
        <div class="price-card-top">
          <span class="price-card-code">${item.code || "Без кода"}</span>
          <span class="price-card-section">${item.section || "Раздел"}</span>
        </div>

        <h3>${item.name || "Без названия"}</h3>

        <p class="price-card-range">${range}</p>

        ${priceHtml}

        ${
          note
            ? `<p class="price-card-note">${note}</p>`
            : ""
        }

        <a class="btn price-card-btn" href="/contacts">
          Оставить заявку
        </a>
      </article>
    `;
  }

  function fillSectionFilter(items) {
    const sections = [...new Set(items.map((item) => item.section))]
      .filter(Boolean)
      .sort();

    sections.forEach((section) => {
      const option = document.createElement("option");
      option.value = section;
      option.textContent = section;
      sectionFilter.appendChild(option);
    });
  }

  function applyFilters() {
    const searchValue = normalizeText(priceSearch.value);
    const selectedSection = sectionFilter.value;
    const selectedType = typeFilter.value;

    filteredItems = allItems.filter((item) => {
      const searchText = normalizeText(
        [
          item.code,
          item.section,
          item.name,
          item.range,
          item.note,
          item.verification_price,
          item.calibration_price,
        ].join(" ")
      );

      const matchesSearch = searchText.includes(searchValue);

      const matchesSection =
        selectedSection === "all" || item.section === selectedSection;

      let matchesType = true;

      if (selectedType === "verification") {
        matchesType = Boolean(item.verification_price);
      }

      if (selectedType === "calibration") {
        matchesType = Boolean(item.calibration_price);
      }

      return matchesSearch && matchesSection && matchesType;
    });

    currentPage = 1;
    renderCards();
  }

  function renderCards() {
    const totalItems = filteredItems.length;
    const totalPages = Math.max(Math.ceil(totalItems / itemsPerPage), 1);

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const visibleItems = filteredItems.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    priceGrid.innerHTML = visibleItems.map(createPriceCard).join("");

    resultCount.textContent = `Найдено позиций: ${totalItems}`;

    emptyBlock.hidden = totalItems > 0;

    pageInfo.textContent = `${currentPage} из ${totalPages}`;

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
  }

  priceSearch.addEventListener("input", applyFilters);
  sectionFilter.addEventListener("change", applyFilters);
  typeFilter.addEventListener("change", applyFilters);

  resetButton.addEventListener("click", () => {
    priceSearch.value = "";
    sectionFilter.value = "all";
    typeFilter.value = "all";
    applyFilters();
  });

  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      renderCards();
      priceGrid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  nextButton.addEventListener("click", () => {
    const totalPages = Math.max(
      Math.ceil(filteredItems.length / itemsPerPage),
      1
    );

    if (currentPage < totalPages) {
      currentPage += 1;
      renderCards();
      priceGrid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  fetch("/static/data/price_items.json")
    .then((response) => response.json())
    .then((items) => {
      allItems = items;
      filteredItems = items;

      fillSectionFilter(items);
      renderCards();
    })
    .catch(() => {
      resultCount.textContent = "Не удалось загрузить прайс-лист.";
      emptyBlock.hidden = false;
    });
});