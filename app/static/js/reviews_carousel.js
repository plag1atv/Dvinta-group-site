document.addEventListener("DOMContentLoaded", () => {

  const root = document.querySelector(
    "[data-reviews-carousel]"
  );

  if (!root) {
    return;
  }


  const cards = Array.from(
    root.querySelectorAll(
      "[data-review-card]"
    )
  );


  const prev = root.querySelector(
    "[data-reviews-prev]"
  );

  const next = root.querySelector(
    "[data-reviews-next]"
  );

  const counter = root.querySelector(
    "[data-reviews-page]"
  );


  let page = 0;


  /*
   * Desktop — 3
   * Tablet  — 2
   * Mobile  — 1
   */
  const perPage = () => {

    if (window.innerWidth >= 980) {
      return 3;
    }

    if (window.innerWidth >= 680) {
      return 2;
    }

    return 1;
  };


  const render = () => {

    const count = perPage();

    const pages = cards.length
      ? Math.ceil(
          cards.length / count
        )
      : 0;


    if (
      pages &&
      page >= pages
    ) {
      page = pages - 1;
    }


    if (!pages) {
      page = 0;
    }


    const start =
      page * count;

    const end =
      start + count;


    cards.forEach(
      (card, index) => {

        card.hidden =
          index < start ||
          index >= end;

      }
    );


    const canMove =
      pages > 1;


    if (prev) {
      prev.disabled = !canMove;
    }


    if (next) {
      next.disabled = !canMove;
    }


    if (counter) {

      counter.textContent =
        pages
          ? `${page + 1} / ${pages}`
          : "0 / 0";

    }

  };


  prev?.addEventListener(
    "click",
    () => {

      const pages =
        Math.ceil(
          cards.length / perPage()
        );


      if (!pages) {
        return;
      }


      page =
        (
          page - 1 + pages
        )
        % pages;


      render();

    }
  );


  next?.addEventListener(
    "click",
    () => {

      const pages =
        Math.ceil(
          cards.length / perPage()
        );


      if (!pages) {
        return;
      }


      page =
        (page + 1)
        % pages;


      render();

    }
  );


  let timer;


  window.addEventListener(
    "resize",
    () => {

      window.clearTimeout(
        timer
      );


      timer =
        window.setTimeout(
          () => {

            page = 0;

            render();

          },
          120
        );

    }
  );


  render();

});