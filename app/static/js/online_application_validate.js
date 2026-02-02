document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("onlineAppForm");
  const topError = document.getElementById("formTopError");

  if (!form) return;

  const fields = {
    fName: { min: 1 },
    fPhone: { phone: true },
    fEmail: { email: true },
    fService: { required: true },
    fMessage: { min: 10 },
  };

  function digitsOnly(s) {
    return (s || "").toString().replace(/\D/g, "");
  }

  function isEmail(v) {
    const s = (v || "").toString().trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  function showErr(id, show) {
    const el = document.querySelector(`[data-err-for="${id}"]`);
    if (!el) return;
    el.classList.toggle("hidden", !show);
  }

  function validate() {
    let ok = true;

    for (const [id, rule] of Object.entries(fields)) {
      const input = document.getElementById(id);
      if (!input) continue;

      const value = (input.value || "").toString().trim();

      let valid = true;

      if (rule.required) {
        valid = value !== "";
      }

      if (rule.min != null) {
        valid = value.length >= rule.min;
      }

      if (rule.email) {
        valid = isEmail(value);
      }

      if (rule.phone) {
        const d = digitsOnly(value);
        valid = d.length >= 10;
      }

      showErr(id, !valid);
      if (!valid) ok = false;
    }

    if (topError) topError.classList.toggle("hidden", ok);
    return ok;
  }

  // Live validation
  form.addEventListener("input", (e) => {
    const t = e.target;
    if (!t || !t.id) return;
    if (fields[t.id]) validate();
  });

  form.addEventListener("change", (e) => {
    const t = e.target;
    if (!t || !t.id) return;
    if (fields[t.id]) validate();
  });

  form.addEventListener("submit", (e) => {
    if (!validate()) {
      e.preventDefault();
      const firstErr = form.querySelector('[data-err-for]:not(.hidden)');
      if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
});
