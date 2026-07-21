const App = (() => {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const themeToggle = document.getElementById('themeToggle');
  const reloadTemplatesBtn = document.getElementById('reloadTemplatesBtn');
  const openAboutBtn = document.getElementById('openAboutBtn');
  const toastStack = document.getElementById('toastStack');

  let currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  function initTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeButton();

    themeToggle.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', currentTheme);
      updateThemeButton();
      showToast('Tema diperbarui', `Mode ${currentTheme === 'dark' ? 'gelap' : 'terang'} aktif.`);
    });
  }

  function updateThemeButton() {
    themeToggle.innerHTML = currentTheme === 'dark'
      ? '<i class="fa-solid fa-sun"></i><span>Light</span>'
      : '<i class="fa-solid fa-moon"></i><span>Dark</span>';
    themeToggle.setAttribute('aria-label', currentTheme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
  }

  function initNav() {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function initButtons() {
    reloadTemplatesBtn.addEventListener('click', () => TemplateManager.reload());
    openAboutBtn.addEventListener('click', () => scrollToSection('tentang'));
  }

  function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function showToast(title, message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';

    const iconClass = type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check';
    const iconColor = type === 'error' ? 'var(--color-danger)' : 'var(--color-accent)';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass}" style="color:${iconColor}"></i>
      <div>
        <strong>${title}</strong>
        <p>${message}</p>
      </div>
      <button class="toast-close" type="button" aria-label="Tutup notifikasi">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => toast.remove());

    toastStack.appendChild(toast);
    window.setTimeout(() => {
      toast.remove();
    }, 3600);
  }

  function initReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
  }

  async function init() {
    initTheme();
    initNav();
    initButtons();
    initReveal();
    Editor.init();
    await TemplateManager.init();
  }

  return {
    init,
    scrollToSection,
    showToast
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
