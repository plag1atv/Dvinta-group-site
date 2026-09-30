document.addEventListener(
  "DOMContentLoaded",
  () => {

    const modal =
      document.getElementById(
        "reviewsAdminModal"
      );


    if (!modal) {
      return;
    }


    const password =
      modal.querySelector(
        "input[type='password']"
      );


    const closeButtons =
      modal.querySelectorAll(
        "[data-reviews-admin-close]"
      );


    const openModal = () => {

      modal.hidden = false;

      document.body.classList.add(
        "reviews-admin-modal-open"
      );


      requestAnimationFrame(
        () => {

          modal.classList.add(
            "is-open"
          );

        }
      );


      window.setTimeout(
        () => {

          password?.focus();

        },
        80
      );

    };


    const closeModal = () => {

      modal.classList.remove(
        "is-open"
      );


      document.body.classList.remove(
        "reviews-admin-modal-open"
      );


      window.setTimeout(
        () => {

          modal.hidden = true;

          if (password) {
            password.value = "";
          }

        },
        180
      );

    };


    document.addEventListener(
      "keydown",
      (event) => {

        const adminShortcut =
          event.ctrlKey &&
          event.altKey &&
          event.key.toLowerCase()
            === "r";


        if (adminShortcut) {

          event.preventDefault();


          if (modal.hidden) {

            openModal();

          } else {

            closeModal();

          }

        }


        else if (
          event.key === "Escape" &&
          !modal.hidden
        ) {

          closeModal();

        }

      }
    );


    closeButtons.forEach(
      (button) => {

        button.addEventListener(
          "click",
          closeModal
        );

      }
    );


    modal.addEventListener(
      "click",
      (event) => {

        if (
          event.target === modal
        ) {

          closeModal();

        }

      }
    );


    if (
      modal.dataset.autoOpen
      === "true"
    ) {

      openModal();

    }

  }
);