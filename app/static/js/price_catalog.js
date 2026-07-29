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

      // geometric equipment cards
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

      if (equipmentType === "surface_roughness_samples") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .trim() ===
                "образцы шероховатости поверхности (сравнения) ошс"
          );
      }

      if (equipmentType === "surface_roughness_profilometers") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .trim() ===
                "приборы для измерений параметров шероховатости поверхности, профилометры, профилографы-профилометры"
          );
      }

      if (equipmentType === "microscopes_video_measurement_systems") {

          items = items.filter(item => {
              const itemName = item.name
                .toLowerCase()
                .trim();

              return (
                  itemName ===
                    "микроскопы отсчетные, микроскопы измерительные упрощенные" ||
                  itemName ===
                    "микроскопы двухкоординатные, инструментальные, универсальные измерительные" ||
                  itemName ===
                    "системы, комплексы и микроскопы видеоизмерительные (консольные, портативные)"
              );
          });
      }

      if (equipmentType === "microstructure_image_analysis_systems") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .trim() ===
                "комплексы аппаратно-программные анализа изображений микроструктуры поверхности твердых тел; анализаторы фрагментов микроструктуры твердых тел; системы анализа микроструктуры объектов"
          );
      }

      if (equipmentType === "object_micrometers") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .trim() ===
                "объект-микрометры"
          );
      }

      if (equipmentType === "measuring_projectors") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .trim() ===
                "проекторы измерительные"
          );
      }

      if (equipmentType === "automated_optimeters") {

          items = items.filter(item => {
              const itemName = item.name
                .toLowerCase()
                .trim();

              return (
                  itemName ===
                    "оптиметры (автоматизированные) вертикальные" ||
                  itemName ===
                    "оптиметры(автоматизированные) горизонтальные"
              );
          });
      }

      if (equipmentType === "length_measuring_machines_comparators") {

          items = items.filter(item => {
              const itemName = item.name
                .toLowerCase()
                .trim();

              return (
                  itemName === "длиномеры вертикальные" ||
                  itemName === "длиномеры горизонтальные" ||
                  itemName === "длиномеры голографические"
              );
          });
      }

      if (equipmentType === "universal_length_measuring_instruments") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .trim() ===
                "приборы универсальные для измерений длины"
          );
      }

      if (equipmentType === "izm_length_measuring_machines") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .trim() ===
                "машины измерительные (электронные, автоматизированные)"
          );
      }

      if (equipmentType === "coordinate_measuring_machines") {

          items = items.filter(item =>
              item.name
                .toLowerCase()
                .trim() ===
                "машины координатно-измерительные"
          );
      }

      if (equipmentType === "contact_interferometers") {

          items = items.filter(item => {
              const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

              return (
                  itemName ===
                    "интерферометры контактные (окулярные, компьютеризированные) вертикальные" ||
                  itemName ===
                    "интерферометры контактные (окулярные, компьютеризированные) горизонтальные"
              );
          });
      }

      if (equipmentType === "gauge_block_verification_systems") {

          items = items.filter(item => {
              const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

              return (
                  itemName ===
                  "приборы, установки для поверки концевых мер длины, компараторы"
              );
          });
      }

      if (equipmentType === "measuring_head_indicator_verification_instruments") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "приборы для поверки измерительных головок, индикаторов и индикаторных нутромеров";
        });
      }

      if (equipmentType === "pb_runout_testers") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return (
                itemName ===
                "приборы для измерений (проверки) изделий на биение в центрах"
            );
        });
      }

      if (equipmentType === "deflection_gauges") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return (
                itemName === "прогибомеры" ||
                itemName === "прогибомеры электронные"
            );
        });
      }

      if (equipmentType === "kmf_strain_sensor_calibrators") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName === "калибраторы датчиков деформаций";
        });
      }

      if (equipmentType === "gluten_deformation_meters") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName === "измерители деформации клейковины";
        });
      }

      if (equipmentType === "groove_sensitivity_standards") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName === "эталоны чувствительности канавочные";
        });
      }

      if (equipmentType === "kdsk_control_equipment_delivery_complexes") {
          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName === "комплексы доставки средств контроля";
        });
      }

      if (equipmentType === "holex_chamfer_gauges") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName === "шаблоны для фасок";
        });
      }

      if (equipmentType === "welder_and_ndt_inspection_gauges") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return (
                itemName === "шаблоны сварщика универсальные" ||
                itemName === "шаблоны специалиста неразрушающего контроля"
            );
        });
      }

      if (equipmentType === "cable_and_extended_object_length_measuring_devices") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "измерители, устройства для измерений длины кабеля, материалов, протяженных объектов";
        });
      }

      if (equipmentType === "scantrack_2000_bulk_material_volume_systems") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "установки для измерения объема сыпучих материалов";
        });
      }

      if (equipmentType === "cargo_dimension_measurement_systems") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "установки для измерений габаритных размеров грузов, геометрических параметров движущихся объектов";
        });
      }

      if (equipmentType === "scantrack_moving_object_geometry_system") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "установки для измерений габаритных размеров грузов, геометрических параметров движущихся объектов";
        });
      }

      if (equipmentType === "laser_length_measurement_systems") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "системы для измерений длины лазерные";
        });
      }

      if (equipmentType === "elcometer_224_surface_profile_gauge") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName === "профилемеры поверхности";
        });
      }

      if (equipmentType === "measuring_video_endoscopes") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName === "видеоэндоскопы измерительные";
        });
      }

      if (equipmentType === "coating_thickness_measures") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName === "меры толщины покрытий";
        });
      }

      if (equipmentType === "coating_thickness_gauges") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName === "толщиномеры (измерители) покрытий";
        });
      }

      if (equipmentType === "coating_impact_resistance_testers") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "измерители, приборы прочности покрытий при ударе";
        });
      }

      if (equipmentType === "rebar_sample_geometry_instruments") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "приборы для измерений геометрических параметров образцов арматуры";
        });
      }

      if (equipmentType === "ultrasonic_uks_mg4_instruments") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName === "приборы ультразвуковые укс-мг4";
        });
      }

      if (equipmentType === "rebar_diameter_and_depth_meters") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "измерители диаметров и глубины залегания арматуры";
        });
      }

      if (equipmentType === "concrete_cover_meters") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "приборы для измерений толщины защитного слоя бетона, измерители защитного слоя бетона";
        });
      }

      if (equipmentType === "corrosion_erosion_monitoring_systems") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "системы мониторинга коррозии и эрозии";
        });
      }

      if (equipmentType === "erichsen_stamps_and_instruments") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName === "приборы, штампы эриксена";
        });
      }

      if (equipmentType === "kotik_ak_television_measurement_control_systems") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "комплексы телевизионного измерительного контроля";
        });
      }

      if (equipmentType === "universal_track_templates_psh00316") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "шаблоны универсальные пш00316, пш00316а";
        });
      }

      if (equipmentType === "railway_track_templates_and_measurement_systems") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "шаблоны путевые, путеизмерительные, путевые электронные, комплексы измерительные железнодорожные прочие";
        });
      }

      if (equipmentType === "track_template_verification_calibration_stands") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "стенды для поверки, калибровки, контроля путевых шаблонов";
        });
      }

      if (equipmentType === "okhta_threshold_elevation_meters") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "измерители возвышения порогов металлоконструкций и криволинейных рельсов электронные";
        });
      }

      if (equipmentType === "mga_contact_wire_wear_meters") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "измерители износа контактного провода ручные электронные";
        });
      }

      if (equipmentType === "iznos_laser_contact_wire_geometry_modules") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "модули измерений геометрических параметров контактного провода лазерные";
        });
      }

      if (equipmentType === "idk_wheelset_diameter_measuring_calipers") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "скобы измерительные диаметров колесных пар";
        });
      }

      if (equipmentType === "k624_wheel_alignment_checking_ruler") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "линейки для проверки схождения колес автомобиля";
        });
      }

      if (equipmentType === "psk_front_wheel_alignment_control_devices") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "приборы для контроля схождения передних колес автомобилей";
        });
      }

      if (equipmentType === "universal_road_rulers") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "рейки дорожные универсальные";
        });
      }

      if (equipmentType === "zehntner_zmm5000_road_marking_thickness_gauge") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "измерители толщины дорожной разметки";
        });
      }

      if (equipmentType === "road_field_curvimeters") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "курвиметры дорожные, полевые, электронные";
        });
      }

      if (equipmentType === "laser_alignment_surface_positioning_systems") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "системы лазерной центровки валов, системы центровки и измерения взаимного расположения поверхностей";
        });
      }

      if (equipmentType === "autocollimators") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName === "автоколлиматоры";
        });
      }

      if (equipmentType === "mn2_microlevels") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName === "микронивелиры";
        });
      }

      if (equipmentType === "electronic_levels") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName === "уровни электронные";
        });
      }

      if (equipmentType === "level_examiners") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName === "экзаменаторы";
        });
      }

      if (equipmentType === "prismatic_angle_measures") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName === "меры угловые призматические";
        });
      }

      if (equipmentType === "kpu3_angle_measure_verification_devices") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "приборы для поверки угловых мер кпу-3";
        });
      }

      // mechanical equipment cards
      if (equipmentType === "roller_brake_test_stands") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "стенды тормозные, стенды тормозные роликовые силовые";
        });
      }

      if (equipmentType === "wheel_balancing_stands_and_machines") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName === "стенды, станки балансировочные";
        });
      }

      if (equipmentType === "torque_screwdrivers") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "отвертки моментные динамометрические, предельные регулируемые (электронные)";
        });
      }

      if (equipmentType === "torque_and_dynamometric_wrenches") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "ключи динамометрические, моментные шкальные, предельные (электронные)";
        });
      }

      if (equipmentType === "testing_and_tensile_machines") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName ===
                "машины разрывные, испытательные, прессы гидравлические измерительные";
        });
      }

      if (equipmentType === "spring_testing_machines") {

          items = items.filter(item => {
            const itemName = item.name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            return itemName === "машины для испытания пружин";
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