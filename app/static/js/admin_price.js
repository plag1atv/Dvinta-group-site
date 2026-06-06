document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("adminPriceList");
  const searchInput = document.getElementById("adminPriceSearch");
  const sectionFilter = document.getElementById("adminSectionFilter");
  const resetButton = document.getElementById("adminReset");
  const countText = document.getElementById("adminPriceCount");
  const emptyBlock = document.getElementById("adminPriceEmpty");

  const addForm = document.getElementById("adminAddForm");
  const addCode = document.getElementById("addCode");
  const addSection = document.getElementById("addSection");
  const addName = document.getElementById("addName");
  const addRange = document.getElementById("addRange");
  const addVerificationPrice = document.getElementById("addVerificationPrice");
  const addCalibrationPrice = document.getElementById("addCalibrationPrice");
  const addNote = document.getElementById("addNote");

  let allItems = [];
  let filteredItems = [];

  function normalizeText(value) {
    return String(value || "").toLowerCase().trim();
  }

  function fillSelect(selectElement, items, withAllOption = false) {
    const currentValue = selectElement.value;

    selectElement.innerHTML = withAllOption
      ? '<option value="all">Все разделы</option>'
      : '<option value="">Выберите раздел</option>';

    const sections = [...new Set(items.map((item) => item.section))]
      .filter(Boolean)
      .sort();

    sections.forEach((section) => {
      const option = document.createElement("option");
      option.value = section;
      option.textContent = section;
      selectElement.appendChild(option);
    });

    if ([...selectElement.options].some((option) => option.value === currentValue)) {
      selectElement.value = currentValue;
    }
  }

  function refreshSectionSelects() {
    fillSelect(sectionFilter, allItems, true);
    fillSelect(addSection, allItems, false);
  }

  function createItemRow(item) {
    return `
      <article class="admin-price-item" data-id="${item.id}">
        <div class="admin-price-main">
          <div class="admin-price-meta">
            <span>${item.code || "Без кода"}</span>
            <span>${item.section || "Без раздела"}</span>
          </div>

          <h3>${item.name || "Без названия"}</h3>

          <p>${item.range || "Диапазон не указан"}</p>

          ${
            item.note
              ? `<p class="admin-price-note">Замечание: ${item.note}</p>`
              : ""
          }
        </div>

        <div class="admin-price-values">
          <div>
            <span>Поверка</span>
            <strong>${item.verification_price || "—"}</strong>
          </div>

          <div>
            <span>Калибровка</span>
            <strong>${item.calibration_price || "—"}</strong>
          </div>
        </div>

        <button
          class="admin-delete-btn"
          type="button"
          data-id="${item.id}"
        >
          Удалить
        </button>
      </article>
    `;
  }

  function applyFilters() {
    const searchValue = normalizeText(searchInput.value);
    const selectedSection = sectionFilter.value;

    filteredItems = allItems.filter((item) => {
      const searchText = normalizeText(
        [
          item.id,
          item.code,
          item.section,
          item.name,
          item.range,
          item.verification_price,
          item.calibration_price,
          item.note,
        ].join(" ")
      );

      const matchesSearch = searchText.includes(searchValue);

      const matchesSection =
        selectedSection === "all" || item.section === selectedSection;

      return matchesSearch && matchesSection;
    });

    renderList();
  }

  function renderList() {
    list.innerHTML = filteredItems.map(createItemRow).join("");

    countText.textContent = `Найдено позиций: ${filteredItems.length}`;

    emptyBlock.hidden = filteredItems.length > 0;
  }

  function loadItems() {
    fetch("/admin/api/price-items")
      .then((response) => response.json())
      .then((items) => {
        allItems = items;
        filteredItems = items;

        refreshSectionSelects();
        renderList();
      })
      .catch(() => {
        countText.textContent = "Не удалось загрузить прайс-лист.";
      });
  }

  function deleteItem(itemId) {
    const isConfirmed = confirm(
      "Удалить эту позицию из прайс-листа? Действие сохранится в JSON-файле."
    );

    if (!isConfirmed) {
      return;
    }

    fetch(`/admin/api/price-items/${itemId}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Ошибка удаления");
        }

        allItems = allItems.filter((item) => Number(item.id) !== Number(itemId));
        refreshSectionSelects();
        applyFilters();
      })
      .catch(() => {
        alert("Не удалось удалить позицию.");
      });
  }

  function addItem(event) {
    event.preventDefault();

    const payload = {
      code: addCode.value.trim(),
      section: addSection.value.trim(),
      name: addName.value.trim(),
      range: addRange.value.trim(),
      verification_price: addVerificationPrice.value.trim(),
      calibration_price: addCalibrationPrice.value.trim(),
      note: addNote.value.trim(),
    };

    if (!payload.section) {
      alert("Выберите раздел.");
      return;
    }

    if (!payload.name) {
      alert("Введите название товара.");
      return;
    }

    fetch("/admin/api/price-items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Ошибка добавления");
        }

        return response.json();
      })
      .then((newItem) => {
        allItems.push(newItem);

        addForm.reset();
        refreshSectionSelects();
        applyFilters();

        alert("Позиция добавлена.");
      })
      .catch(() => {
        alert("Не удалось добавить позицию.");
      });
  }

  searchInput.addEventListener("input", applyFilters);
  sectionFilter.addEventListener("change", applyFilters);
  addForm.addEventListener("submit", addItem);

  resetButton.addEventListener("click", () => {
    searchInput.value = "";
    sectionFilter.value = "all";
    applyFilters();
  });

  list.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".admin-delete-btn");

    if (!deleteButton) {
      return;
    }

    deleteItem(deleteButton.dataset.id);
  });

  loadItems();
});