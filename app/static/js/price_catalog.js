document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("keydown", (event) => {
    const isAdminShortcut =
      event.ctrlKey &&
      event.altKey &&
      event.code === "KeyP";

    if (isAdminShortcut) {
      event.preventDefault();
      window.location.href = "/admin/price-login";
    }
  });
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
    const formattedNote = note
      ? note
          .replace(/\s+2\./g, "<br>2.")
          .replace(/^1\./, "1.")
      : "";

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
            ? `<p class="price-card-note">${formattedNote}</p>`
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

  fetch("/api/price-items", {
    cache: "no-store"
  })
    .then((response) => response.json())
    .then((items) => {
      const equipmentType = document.body.dataset.equipment;

      if (equipmentType === "calipers") {

          items = items.filter(item =>
              item.name.toLowerCase().includes("штангенциркул")
          );

      }

      if (equipmentType === "micrometers") {

          items = items.filter(item =>
              item.name.toLowerCase().includes("микрометр")
          );

      }

      if (equipmentType === "depth_gauges") {

          items = items.filter(item =>
              item.name.toLowerCase().includes("штангенглубиномер")
          );

      }

      if (equipmentType === "height_gauges") {

          items = items.filter(item =>
              item.name.toLowerCase().includes("штангенрейсмас")
          );

      }

      if (equipmentType === "pipe_calipers") {

          items = items.filter(item =>
              item.name.toLowerCase().includes("штангентрубомер")
          );
      }

      if (equipmentType === "gear_tooth_calipers") {

          items = items.filter(item => {
              const name = item.name.toLowerCase();

              return (
                  name.includes("штангензубомер") ||
                  name.startsWith("зубомер")
              );
          });
      }

      if (equipmentType === "micrometric_depth_gauges") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .includes("глубиномеры микрометрические")
          );
      }

      if (equipmentType === "snap_gauges") {

          items = items.filter(item => {
              const itemName = item.name.toLowerCase();

              return (
                  itemName.includes("скобы рычажные") ||
                  itemName.includes("скобы индикаторные")
              );
          });
      }

      if (equipmentType === "measuring_heads") {

          items = items.filter(item =>
              item.name.toLowerCase().includes("головки измерительные")
          );
      }

      if (equipmentType === "inductive_transducers") {

          items = items.filter(item => {
              const itemName = item.name.toLowerCase();

              return (
                  itemName.includes("преобразователи, щупы индуктивные") ||
                  itemName.includes("преобразователи линейных перемещений")
              );
          });
      }

      if (equipmentType === "gauge_blocks") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .includes("меры длины концевые плоскопараллельные")
          );
      }

      if (equipmentType === "measuring_rings") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .includes("меры внутренних диаметров")
          );
      }

      if (equipmentType === "gauge_block_accessories") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .includes("наборы принадлежностей к концевым мерам длины")
          );
      }

      if (equipmentType === "bore_gauges") {

          items = items.filter(item => {
              const itemName = item.name.toLowerCase();

              return (
                  itemName.startsWith("нутромеры") ||
                  itemName.includes("вставок к нутромерам")
              );
          });
      }

      if (equipmentType === "measuring_rulers") {

          items = items.filter(item => {
              const itemName = item.name.toLowerCase();

              return (
                  itemName.includes("линейки измерительные металлические") ||
                  itemName.includes("линейки контрольные рабочие") ||
                  itemName.includes("линейки для подбора очковых оправ") ||
                  itemName.includes("линейки для измерения расстояния") ||
                  itemName.includes("линейки поверочные") ||
                  itemName.includes("линейки синусные") ||
                  itemName.includes("линейки охватывающие") ||
                  itemName.includes("линейки усадочные")
              );
          });
      }

      if (equipmentType === "tape_measures_meter_rods") {

          items = items.filter(item => {
              const itemName = item.name.toLowerCase();

              return (
                  itemName.startsWith("рулетки металлические измерительные") ||
                  itemName.startsWith("рулетки измерительные с лотом") ||
                  itemName.startsWith("метроштоки") ||
                  itemName.startsWith("рейки нивелирные") ||
                  itemName.startsWith("рейки водомерные")
              );
          });
      }

      if (equipmentType === "surface_plates") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .startsWith("плиты поверочные")
          );
      }

      if (equipmentType === "levels") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .startsWith("уровни")
          );
      }

      if (equipmentType === "frost_depth_gauges") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .trim() === "мерзлотомеры"
          );
      }

      if (equipmentType === "grindometers") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .trim() === "гриндометры"
          );
      }

      if (equipmentType === "normalemeters_multimar") {

          items = items.filter(item => {
              const itemName = item.name.toLowerCase();

              return (
                  itemName.startsWith("нормалемеры универсальные") &&
                  itemName.includes("multimar 844")
              );
          });
      }

      if (equipmentType === "measuring_wires_rollers") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .startsWith("проволочки, ролики")
          );
      }

      if (equipmentType === "verification_squares") {

          items = items.filter(item => {
              const itemName = item.name.toLowerCase().trim();

              return (
                  itemName.startsWith("угольники поверочные") ||
                  itemName.startsWith("угольники лекальные цилиндрические") ||
                  itemName === "приборы для поверки угольников"
              );
          });
      }

      if (equipmentType === "thickness_wall_gauges") {

          items = items.filter(item => {
              const itemName = item.name.toLowerCase().trim();

              return (
                  itemName.startsWith("толщиномеры индикаторные") ||
                  itemName === "толщиномеры контактные" ||
                  itemName === "толщиномеры-гребенки" ||
                  itemName.startsWith("стенкомеры")
              );
          });
      }

      if (equipmentType === "medical_stadiometers") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .trim() === "ростомеры"
          );
      }

      if (equipmentType === "height_vertical_length_gauges") {

          items = items.filter(item => {
              const itemName = item.name.toLowerCase().trim();

              return (
                  itemName === "высотомеры" ||
                  itemName === "длиномеры вертикальные"
              );
          });
      }

      if (equipmentType === "calipers_snap_gauges") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .trim() ===
                "кронциркули, кронциркули индикаторные, калибры-скобы"
          );
      }

      if (equipmentType === "feeler_gauges_wedges") {

          items = items.filter(item => {
              const itemName = item.name.toLowerCase().trim();

              return (
                  itemName === "щупы измерительные" ||
                  itemName === "клинья для измерения зазоров" ||
                  itemName === "высотомеры клиновые"
              );
          });
      }

      if (equipmentType === "kipr_connection_gauges") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .trim() ===
                "комплекты измерителей присоединительных размеров"
          );
      }

      if (equipmentType === "bearing_clearance_diameter_gauges") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .trim() ===
                "приборы для контроля радиального зазора подшипников"
          );
      }

      if (equipmentType === "laboratory_sieves") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .trim() ===
                "сита лабораторные"
          );
      }

      if (equipmentType === "measuring_illuminated_magnifiers") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .trim() ===
                "лупы измерительные, с подсветкой"
          );
      }

      if (equipmentType === "control_bars_bk") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .trim() ===
                "бруски контрольные (бк)"
          );
      }

      if (equipmentType === "flat_parallel_glass_plates") {

          items = items.filter(item => {
              const itemName = item.name
                .toLowerCase()
                .trim();

              return (
                  itemName === "пластины плоские стеклянные пи" ||
                  itemName === "пластины плоскопараллельные стеклянные пм"
              );
          });
      }

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