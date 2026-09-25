document.addEventListener("DOMContentLoaded", () => {
  const carousel = document.querySelector("[data-partners-carousel]");

  if (!carousel) {
    return;
  }

  const cards = Array.from(
    carousel.querySelectorAll("[data-partner-card]")
  );

  const prevButton = carousel.querySelector("[data-partners-prev]");
  const nextButton = carousel.querySelector("[data-partners-next]");
  const dotsContainer = carousel.querySelector("[data-partners-dots]");
  const viewport = carousel.querySelector(".partners-carousel__viewport");

  if (!cards.length) {
    return;
  }

  let activeIndex = 0;

  let touchStartX = 0;
  let touchEndX = 0;


  /*
   * Создаём точки навигации.
   */
  const dots = cards.map((card, index) => {
    const dot = document.createElement("button");

    dot.type = "button";
    dot.className = "partners-carousel__dot";

    dot.setAttribute(
      "aria-label",
      `Показать партнёра ${index + 1}`
    );

    dot.addEventListener("click", () => {
      activeIndex = index;
      updateCarousel();
    });

    dotsContainer.appendChild(dot);

    return dot;
  });


  /*
   * Обновление положения карточек.
   */
  function updateCarousel() {
    const total = cards.length;

    const prevIndex =
      (activeIndex - 1 + total) % total;

    const nextIndex =
      (activeIndex + 1) % total;


    cards.forEach((card, index) => {
      card.classList.remove(
        "is-active",
        "is-prev",
        "is-next",
        "is-hidden"
      );


      if (index === activeIndex) {
        card.classList.add("is-active");

        card.setAttribute(
          "aria-hidden",
          "false"
        );
      }

      else if (index === prevIndex) {
        card.classList.add("is-prev");

        card.setAttribute(
          "aria-hidden",
          "true"
        );
      }

      else if (index === nextIndex) {
        card.classList.add("is-next");

        card.setAttribute(
          "aria-hidden",
          "true"
        );
      }

      else {
        card.classList.add("is-hidden");

        card.setAttribute(
          "aria-hidden",
          "true"
        );
      }
    });


    dots.forEach((dot, index) => {
      dot.classList.toggle(
        "is-active",
        index === activeIndex
      );
    });
  }


  /*
   * Следующая карточка.
   */
  function showNext() {
    activeIndex =
      (activeIndex + 1) % cards.length;

    updateCarousel();
  }


  /*
   * Предыдущая карточка.
   */
  function showPrev() {
    activeIndex =
      (activeIndex - 1 + cards.length) %
      cards.length;

    updateCarousel();
  }


  /*
   * Стрелки.
   */
  if (nextButton) {
    nextButton.addEventListener(
      "click",
      showNext
    );
  }

  if (prevButton) {
    prevButton.addEventListener(
      "click",
      showPrev
    );
  }


  /*
   * Управление стрелками клавиатуры.
   */
  carousel.addEventListener(
    "keydown",
    (event) => {

      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrev();
      }

    }
  );


  /*
   * Свайп на телефонах.
   */
  if (viewport) {

    viewport.addEventListener(
      "touchstart",
      (event) => {
        touchStartX =
          event.changedTouches[0].screenX;
      },
      {
        passive: true
      }
    );


    viewport.addEventListener(
      "touchend",
      (event) => {

        touchEndX =
          event.changedTouches[0].screenX;

        handleSwipe();

      },
      {
        passive: true
      }
    );

  }


  function handleSwipe() {
    const difference =
      touchStartX - touchEndX;

    const swipeThreshold = 45;


    if (
      Math.abs(difference) <
      swipeThreshold
    ) {
      return;
    }


    /*
     * Палец двигается справа налево.
     */
    if (difference > 0) {
      showNext();
    }


    /*
     * Палец двигается слева направо.
     */
    else {
      showPrev();
    }
  }


  /*
   * Начальное состояние.
   */
  updateCarousel();
});