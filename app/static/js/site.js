// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');
  if (btn && menu) {
    btn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });
  }

  // Desktop dropdowns
  const dropdownButtons = document.querySelectorAll('[data-dropdown]');
  dropdownButtons.forEach((btn) => {
    const key = btn.getAttribute('data-dropdown');
    const menu = document.querySelector(`[data-dropdown-menu="${key}"]`);
    if (!menu) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      menu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (!btn.contains(target) && !menu.contains(target)) {
        menu.classList.add('hidden');
      }
    });
  });
});
