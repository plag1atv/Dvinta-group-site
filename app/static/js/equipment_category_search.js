document.addEventListener("DOMContentLoaded", () => {
    const searchRoot = document.querySelector(
        "[data-equipment-search]"
    );

    const grid = document.querySelector(
        "[data-equipment-grid]"
    );

    /*
    На страницах без карточек поиск отсутствует.
    В таком случае просто прекращаем выполнение.
    */
    if (!searchRoot || !grid) {
        return;
    }

    const searchInput = document.getElementById(
        "equipmentCardSearch"
    );

    const clearButton = document.getElementById(
        "equipmentCardSearchClear"
    );

    const resultCount = document.getElementById(
        "equipmentCardSearchCount"
    );

    const emptyState = document.getElementById(
        "equipmentCardSearchEmpty"
    );

    const cards = Array.from(
        grid.querySelectorAll("[data-equipment-card]")
    );

    if (
        !searchInput ||
        !clearButton ||
        !resultCount ||
        !emptyState
    ) {
        return;
    }

    /*
    Приводим текст к единому виду:
    - убираем разницу между заглавными и строчными буквами;
    - считаем ё и е одинаковыми;
    - убираем лишние пробелы.
    */
    const normalizeText = (value) => {
        return String(value || "")
            .toLowerCase()
            .replace(/ё/g, "е")
            .replace(/\s+/g, " ")
            .trim();
    };

    /*
    Для каждой карточки отдельно получаем:
    - название;
    - описание.

    Текст кнопки «Подробнее» в поиск не попадает.
    */
    const preparedCards = cards.map((card) => {
        const titleElement = card.querySelector(
            "[data-equipment-card-title]"
        );

        const descriptionElement = card.querySelector(
            "[data-equipment-card-description]"
        );

        const title = normalizeText(
            titleElement?.textContent
        );

        const description = normalizeText(
            descriptionElement?.textContent
        );

        return {
            element: card,
            searchText: `${title} ${description}`,
        };
    });

    const updateResults = () => {
        const query = normalizeText(searchInput.value);

        let visibleCount = 0;

        preparedCards.forEach((cardData) => {
            const isVisible =
                query === "" ||
                cardData.searchText.includes(query);

            cardData.element.hidden = !isVisible;

            if (isVisible) {
                visibleCount += 1;
            }
        });

        /*
        Крестик показываем только тогда,
        когда в строке есть текст.
        */
        clearButton.hidden = query === "";

        /*
        Сообщение показываем только при нуле результатов.
        */
        emptyState.hidden = visibleCount !== 0;

        if (query === "") {
            resultCount.textContent =
                `Показано: ${visibleCount}`;
        } else {
            resultCount.textContent =
                `Найдено: ${visibleCount}`;
        }
    };

    const clearSearch = () => {
        searchInput.value = "";

        updateResults();

        searchInput.focus();
    };

    /*
    Поиск запускается сразу во время ввода.
    */
    searchInput.addEventListener(
        "input",
        updateResults
    );

    /*
    Очистка по нажатию на крестик.
    */
    clearButton.addEventListener(
        "click",
        clearSearch
    );

    /*
    Очистка по клавише Escape.
    */
    searchInput.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Escape" &&
                searchInput.value !== ""
            ) {
                event.preventDefault();

                clearSearch();
            }
        }
    );

    /*
    Первоначальное отображение количества карточек.
    */
    updateResults();
});