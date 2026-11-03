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
    return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
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
            <span class="price-multiline">${escapeHtml(item.code || "Без кода")}</span>
            <span>${escapeHtml(item.section || "Без раздела")}</span>
          </div>

          <h3 class="price-multiline">${escapeHtml(item.name || "Без названия")}</h3>

          <p class="price-multiline">${escapeHtml(item.range || "Диапазон не указан")}</p>

          ${
            item.note
              ? `<p class="admin-price-note price-multiline">Замечание: ${escapeHtml(item.note)}</p>`
              : ""
          }
        </div>

        <div class="admin-price-values">
          <div>
            <span>Поверка</span>
            <strong class="price-multiline">${escapeHtml(item.verification_price || "—")}</strong>
          </div>

          <div>
            <span>Калибровка</span>
            <strong class="price-multiline">${escapeHtml(item.calibration_price || "—")}</strong>
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


  function createTextField(item, name, title, { wide = false, required = false } = {}) {
    const id = `edit-${item.id}-${name}`;
    return `
      <div class="admin-price-field${wide ? " admin-add-wide" : ""}">
        <div class="admin-price-field__head">
          <label for="${id}">${escapeHtml(title)}</label>
          <button class="admin-newline-btn" type="button" data-line-break-for="${id}"
                  aria-label="Новая строка: ${escapeHtml(title)}" title="Вставить перенос строки в месте курсора">
            <span aria-hidden="true">↵</span> Новая строка
          </button>
        </div>
        <textarea class="admin-price-textarea" id="${id}" name="${name}" rows="${wide ? 3 : 2}"${required ? " required" : ""}>
${escapeHtml(item[name])}</textarea>
      </div>
    `;
  }

  function createEditForm(item) {
    const sections = [...new Set(allItems.map(priceItem => priceItem.section).filter(Boolean))].sort();
    const options = sections.map(section =>
      `<option value="${escapeHtml(section)}"${section === item.section ? " selected" : ""}>${escapeHtml(section)}</option>`
    ).join("");
    return `
      <form class="admin-edit-form" data-id="${item.id}">
        <h3>Редактирование позиции</h3>
        <div class="admin-add-grid">
          ${createTextField(item, "code", "Код")}
          <label>
            Раздел
            <select name="section" required>
              <option value="">Выберите раздел</option>
              ${options}
            </select>
          </label>
          ${createTextField(item, "name", "Название", { required: true })}
          ${createTextField(item, "range", "Диапазон")}
          ${createTextField(item, "verification_price", "Цена поверки")}
          ${createTextField(item, "calibration_price", "Цена калибровки")}
          ${createTextField(item, "note", "Примечание / замечание", { wide: true })}
        </div>
        <div class="admin-edit-actions">
          <button class="btn btn-primary" type="submit">Сохранить изменения</button>
          <button class="btn btn-ghost admin-cancel-edit" type="button">Отмена</button>
        </div>
      </form>
    `;
  }

  function resizeTextField(field) {
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight + 2, 240)}px`;
  }

  // Delegation also covers dynamically created edit forms.
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-line-break-for]");
    if (!button) return;
    const field = document.getElementById(button.dataset.lineBreakFor);
    if (!field || !field.matches(".admin-price-textarea")) return;
    field.focus({ preventScroll: true });
    field.setRangeText("\n", field.selectionStart, field.selectionEnd, "end");
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
  document.addEventListener("input", event => {
    if (event.target.matches(".admin-price-textarea")) resizeTextField(event.target);
  });
  addForm.querySelectorAll(".admin-price-textarea").forEach(resizeTextField);


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
      code: formData.get("code"),
      section: formData.get("section").trim(),
      name: formData.get("name"),
      range: formData.get("range"),
      verification_price: formData.get("verification_price"),
      calibration_price: formData.get("calibration_price"),
      note: formData.get("note"),
    };

    if (!payload.section) {
      alert("Введите раздел.");
      return;
    }

    if (!payload.name.trim()) {
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
      code: addCode.value,
      section: addSection.value.trim(),
      name: addName.value,
      range: addRange.value,
      verification_price: addVerificationPrice.value,
      calibration_price: addCalibrationPrice.value,
      note: addNote.value,
    };

    if (!payload.section) {
      alert("Выберите раздел.");
      return;
    }

    if (!payload.name.trim()) {
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
        addForm.querySelectorAll(".admin-price-textarea").forEach(resizeTextField);
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
      card.nextElementSibling.querySelectorAll(".admin-price-textarea").forEach(resizeTextField);

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