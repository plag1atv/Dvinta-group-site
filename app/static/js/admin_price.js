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

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

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
            <span>${escapeHtml(item.code || "Без кода")}</span>
            <span>${escapeHtml(item.section || "Без раздела")}</span>
          </div>

          <h3>${escapeHtml(item.name || "Без названия")}</h3>

          <p>${escapeHtml(item.range || "Диапазон не указан")}</p>

          ${
            item.note
              ? `<p class="admin-price-note">Замечание: ${escapeHtml(item.note)}</p>`
              : ""
          }
        </div>

        <div class="admin-price-values">
          <div>
            <span>Поверка</span>
            <strong>${escapeHtml(item.verification_price || "—")}</strong>
          </div>

          <div>
            <span>Калибровка</span>
            <strong>${escapeHtml(item.calibration_price || "—")}</strong>
          </div>
        </div>

        <div class="admin-price-actions">
          <button class="admin-edit-btn" type="button" data-id="${item.id}">
            Редактировать
          </button>

          <button class="admin-delete-btn" type="button" data-id="${item.id}">
            Удалить
          </button>
        </div>
      </article>
    `;
  }


  function createEditForm(item) {
  return `
    <form class="admin-edit-form" data-id="${item.id}">
      <h3>Редактирование позиции</h3>

      <div class="admin-add-grid">
        <label>
          Код
          <input name="code" type="text" value="${escapeHtml(item.code)}">
        </label>

        <label>
          Раздел
          <input name="section" type="text" value="${escapeHtml(item.section)}" required>
        </label>

        <label>
          Название
          <input name="name" type="text" value="${escapeHtml(item.name)}" required>
        </label>

        <label>
          Диапазон
          <input name="range" type="text" value="${escapeHtml(item.range)}">
        </label>

        <label>
          Цена поверки
          <input name="verification_price" type="text" value="${escapeHtml(item.verification_price)}">
        </label>

        <label>
          Цена калибровки
          <input name="calibration_price" type="text" value="${escapeHtml(item.calibration_price)}">
        </label>

        <label class="admin-add-wide">
          Примечание / замечание
          <textarea name="note" rows="3">${escapeHtml(item.note)}</textarea>
        </label>
      </div>

      <div class="admin-edit-actions">
        <button class="btn btn-primary" type="submit">
          Сохранить изменения
        </button>

        <button class="btn btn-ghost admin-cancel-edit" type="button">
          Отмена
        </button>
      </div>
    </form>
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
      const matchesSection = selectedSection === "all" || item.section === selectedSection;

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

  function updateItem(itemId, form) {
    const formData = new FormData(form);

    const payload = {
      code: formData.get("code").trim(),
      section: formData.get("section").trim(),
      name: formData.get("name").trim(),
      range: formData.get("range").trim(),
      verification_price: formData.get("verification_price").trim(),
      calibration_price: formData.get("calibration_price").trim(),
      note: formData.get("note").trim(),
    };

    if (!payload.section) {
      alert("Введите раздел.");
      return;
    }

    if (!payload.name) {
      alert("Введите название товара.");
      return;
    }

    fetch(`/admin/api/price-items/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Ошибка сохранения");
        }

        return response.json();
      })
      .then((updatedItem) => {
        allItems = allItems.map((item) =>
          Number(item.id) === Number(itemId) ? updatedItem : item
        );

        refreshSectionSelects();
        applyFilters();

        alert("Позиция обновлена.");
      })
      .catch(() => {
        alert("Не удалось сохранить изменения.");
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
    const editButton = event.target.closest(".admin-edit-btn");
    const cancelButton = event.target.closest(".admin-cancel-edit");

    if (deleteButton) {
      deleteItem(deleteButton.dataset.id);
      return;
    }

    if (editButton) {
      const itemId = editButton.dataset.id;
      const item = allItems.find((priceItem) => Number(priceItem.id) === Number(itemId));
      const card = editButton.closest(".admin-price-item");

      if (!item || !card) {
        return;
      }

      const openedForm = list.querySelector(".admin-edit-form");

      if (openedForm) {
        openedForm.remove();
      }

      card.insertAdjacentHTML("afterend", createEditForm(item));

      return;
    }

    if (cancelButton) {
      const editForm = cancelButton.closest(".admin-edit-form");

      if (editForm) {
        editForm.hidden = true;
      }
    }
  });

  list.addEventListener("submit", (event) => {
    const editForm = event.target.closest(".admin-edit-form");

    if (!editForm) {
      return;
    }

    event.preventDefault();
    updateItem(editForm.dataset.id, editForm);
  });

  loadItems();
});