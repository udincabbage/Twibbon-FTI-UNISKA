const TemplateManager = (() => {
  const templateGrid = document.getElementById('templateGrid');
  const loadingCard = document.getElementById('templateLoading');
  const apiStatusText = document.getElementById('apiStatusText');

  let templates = [];

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, (match) => map[match]);
  }

  async function init() {
    showLoading(true);
    const result = await TwibbonAPI.fetchTemplates();
    templates = result.templates;
    renderTemplates();
    updateStatus(result.source);
    showLoading(false);
  }

  async function reload() {
    await init();
    App.showToast('Template diperbarui', 'Data template berhasil dimuat ulang.');
  }

  function updateStatus(source) {
    if (source === 'api') {
      apiStatusText.textContent = 'Template berhasil dimuat dari endpoint API lokal.';
    } else {
      apiStatusText.textContent = 'API gagal diakses, data dummy bawaan sedang digunakan.';
    }
  }

  function showLoading(isLoading) {
    loadingCard.classList.toggle('hidden', !isLoading);
    templateGrid.classList.toggle('hidden', isLoading);
  }

  function renderTemplates() {
    templateGrid.innerHTML = templates.map((template) => createTemplateCard(template)).join('');
    templateGrid.querySelectorAll('[data-use-template]').forEach((button) => {
      button.addEventListener('click', () => {
        const templateId = button.getAttribute('data-use-template');
        const template = getTemplateById(templateId);
        if (template) {
          Editor.openTemplate(template);
          App.scrollToSection('editorSection');
        }
      });
    });
  }

  function createTemplateCard(template) {
    const themeClass = template.theme === 'graduation' ? 'template-grad' : 'template-fresh';
    const badgeIcon = template.theme === 'graduation' ? 'fa-graduation-cap' : 'fa-user-graduate';

    return `
      <article class="template-card card-surface ${themeClass}">
        <div class="template-card-inner">
          <div class="frame-sample ${template.theme === 'graduation' ? 'template-graduation' : 'template-newstudent'}">
            <div class="frame-circle"></div>
            <div class="frame-badge"><i class="fa-solid ${badgeIcon}"></i></div>
            <div class="frame-title top">
              <strong>${template.theme === 'graduation' ? 'SELAMAT' : 'SELAMAT DATANG'}</strong>
              <span>${template.theme === 'graduation' ? 'YUDISIUM SARJANA' : 'MAHASISWA BARU'}</span>
            </div>
            <div class="frame-title bottom">
              <span>${escapeHtml(template.subtitle).replace(/\n/g, '<br>')}</span>
            </div>
            ${template.theme === 'graduation'
              ? '<div class="corner-accent left"></div><div class="corner-accent right"></div>'
              : '<div class="wave"></div><div class="confetti"></div>'}
          </div>
          <div class="meta">
            <span>${template.id}</span>
            <span>${template.theme}</span>
          </div>
          <div>
            <h3>${escapeHtml(template.title)}</h3>
            <p>${escapeHtml(template.subtitle).replace(/\n/g, ' · ')}</p>
          </div>
          <button class="btn btn-primary" type="button" data-use-template="${escapeHtml(template.id)}">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Gunakan Template
          </button>
        </div>
      </article>
    `;
  }

  function getTemplateById(id) {
    return templates.find((template) => template.id === id) || null;
  }

  function getTemplates() {
    return templates.slice();
  }

  return {
    init,
    reload,
    getTemplateById,
    getTemplates
  };
})();
