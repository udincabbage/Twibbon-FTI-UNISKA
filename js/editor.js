
const Editor = (() => {
  const editorSection = document.getElementById('editorSection');
  const previewCanvas = document.getElementById('previewCanvas');
  const canvasStage = document.getElementById('canvasStage');
  const frameOverlay = document.getElementById('frameOverlay');
  const canvasEmpty = document.getElementById('canvasEmpty');
  const photoInput = document.getElementById('photoInput');
  const uploadZone = document.getElementById('uploadZone');
  const uploadProgressWrapper = document.getElementById('uploadProgressWrapper');
  const uploadProgressBar = document.getElementById('uploadProgressBar');
  const uploadProgressText = document.getElementById('uploadProgressText');
  const zoomSlider = document.getElementById('zoomSlider');
  const rotateSlider = document.getElementById('rotateSlider');
  const zoomValue = document.getElementById('zoomValue');
  const rotateValue = document.getElementById('rotateValue');
  const resetBtn = document.getElementById('resetBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const changeTemplateBtn = document.getElementById('changeTemplateBtn');
  const editorTitle = document.getElementById('editorTitle');
  const editorSubtitle = document.getElementById('editorSubtitle');
  const templateInfoCard = document.getElementById('templateInfoCard');
  const ctx = previewCanvas.getContext('2d');
  const PREVIEW = 1000, EXPORT = 2000, HOLE = 0.255;
  const state = { template: null, image: null, x: PREVIEW / 2, y: PREVIEW / 2, scale: 1, rotation: 0, baseScale: 1, dragging: false, px: 0, py: 0, sx: 0, sy: 0 };

  function openTemplate(template) {
    state.template = template;
    editorSection.classList.remove('hidden');
    renderOverlay();
    fitToPortraitPreset();
    draw();
    App.showToast('Template dipilih', `${template.title} siap digunakan.`);
  }

  function renderOverlay() {
    editorTitle.textContent = state.template.title;
    editorSubtitle.textContent = state.template.subtitle.replace(/\n/g, ' · ');
    templateInfoCard.innerHTML = `<h3>${state.template.title}</h3><p>${state.template.subtitle.replace(/\n/g, '<br>')}</p><p>${state.template.text}</p><p><strong>Tema:</strong> ${state.template.theme}</p>`;
    frameOverlay.className = `frame-overlay template-${state.template.theme}`;
    frameOverlay.innerHTML = state.template.theme === 'graduation' ? `
      <div class="frame-circle"></div><div class="frame-badge"><i class="fa-solid fa-graduation-cap"></i></div>
      <div class="frame-title top"><strong>SELAMAT</strong><span>YUDISIUM SARJANA</span></div>
      <div class="frame-title bottom"><span>${state.template.subtitle.replace(/\n/g, '<br>')}</span></div>
      <div class="corner-accent left"></div><div class="corner-accent right"></div>
    ` : `
      <div class="frame-circle"></div><div class="frame-badge"><i class="fa-solid fa-user-graduate"></i></div>
      <div class="frame-title top"><strong>SELAMAT DATANG</strong><span>MAHASISWA BARU</span></div>
      <div class="frame-title bottom"><span>${state.template.subtitle.replace(/\n/g, '<br>')}</span></div>
      <div class="wave"></div><div class="confetti"></div>
    `;
  }

  function bind() {
    uploadZone.addEventListener('click', () => photoInput.click());
    uploadZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); photoInput.click(); } });
    photoInput.addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (f) loadFile(f); });
    ['dragenter', 'dragover'].forEach(ev => uploadZone.addEventListener(ev, e => { e.preventDefault(); uploadZone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(ev => uploadZone.addEventListener(ev, e => { e.preventDefault(); uploadZone.classList.remove('dragover'); }));
    uploadZone.addEventListener('drop', e => { const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) loadFile(f); });
    zoomSlider.addEventListener('input', () => { state.scale = Number(zoomSlider.value); zoomValue.textContent = `${Math.round(state.scale * 100)}%`; draw(); });
    rotateSlider.addEventListener('input', () => { state.rotation = Number(rotateSlider.value); rotateValue.textContent = `${state.rotation}°`; draw(); });
    resetBtn.addEventListener('click', () => { fitToPortraitPreset(); draw(); App.showToast('Reset', 'Preset portrait diterapkan ulang.'); });
    downloadBtn.addEventListener('click', download);
    changeTemplateBtn.addEventListener('click', () => App.scrollToSection('template'));
    canvasStage.addEventListener('dblclick', () => { fitToPortraitPreset(); draw(); });
    canvasStage.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  function onDown(e) { if (!state.image) return; state.dragging = true; state.px = e.clientX; state.py = e.clientY; state.sx = state.x; state.sy = state.y; canvasStage.setPointerCapture && canvasStage.setPointerCapture(e.pointerId); }
  function onMove(e) { if (!state.dragging || !state.image) return; const r = canvasStage.getBoundingClientRect(); state.x = state.sx + (e.clientX - state.px) * (PREVIEW / r.width); state.y = state.sy + (e.clientY - state.py) * (PREVIEW / r.height); draw(); }
  function onUp() { state.dragging = false; }

  function progress() {
    uploadProgressWrapper.classList.remove('hidden'); uploadProgressBar.style.width = '0%'; uploadProgressText.textContent = '0%';
    return new Promise(resolve => { let p = 0; const t = setInterval(() => { p += 20; if (p >= 100) { p = 100; clearInterval(t); setTimeout(() => { uploadProgressWrapper.classList.add('hidden'); resolve(); }, 120); } uploadProgressBar.style.width = `${p}%`; uploadProgressText.textContent = `${p}%`; }, 45); });
  }

  async function loadFile(file) {
    if (!file.type.startsWith('image/')) return App.showToast('File tidak valid', 'Pilih gambar.', 'error');
    if (!state.template) return App.showToast('Pilih template dulu', 'Pilih template sebelum upload foto.', 'error');
    await progress();
    const url = await readFile(file); const img = await loadImage(url);
    state.image = img; fitToPortraitPreset(); canvasEmpty.classList.add('hidden'); draw(); App.showToast('Foto siap', 'Foto berhasil dimuat.');
  }

  function readFile(file) { return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); }); }
  function loadImage(src) { return new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = src; }); }

  function fitToPortraitPreset() {
    if (!state.image) { state.x = PREVIEW / 2; state.y = PREVIEW / 2; state.scale = 1; state.rotation = 0; zoomSlider.value = '1'; rotateSlider.value = '0'; zoomValue.textContent = '100%'; rotateValue.textContent = '0°'; return; }
    const hole = PREVIEW * HOLE, target = hole * 2.12;
    state.baseScale = Math.max(target / state.image.width, target / state.image.height);
    state.x = PREVIEW / 2; state.y = PREVIEW / 2; state.scale = 1; state.rotation = 0;
    zoomSlider.value = '1'; rotateSlider.value = '0'; zoomValue.textContent = '100%'; rotateValue.textContent = '0°';
  }

  function drawBg(c, size, theme) {
    c.save(); const g = c.createLinearGradient(0, 0, size, size);
    if (theme === 'newstudent') { g.addColorStop(0, '#f2fbff'); g.addColorStop(1, '#eefaf4'); } else { g.addColorStop(0, '#eef5ff'); g.addColorStop(1, '#f8fbff'); }
    c.fillStyle = g; c.fillRect(0,0,size,size); c.restore();
  }

  function drawPhoto(c, size) {
    const hole = size * HOLE;
    c.save();
    c.beginPath();
    c.arc(size/2, size/2, hole, 0, Math.PI * 2);
    c.clip();
    c.translate(state.x, state.y); c.rotate(state.rotation * Math.PI / 180);
    const s = state.baseScale * state.scale, w = state.image.width * s, h = state.image.height * s;
    c.drawImage(state.image, -w/2, -h/2, w, h);
    c.restore();
  }

  function drawFrame(c, size) {
    const center = size / 2, hole = size * HOLE;
    c.save();
    if (state.template.theme === 'graduation') {
      c.fillStyle = '#1b57bd'; c.beginPath(); c.moveTo(size*0.07, size*0.06); c.lineTo(size*0.93, size*0.06); c.lineTo(size*0.86, size*0.17); c.lineTo(size*0.14, size*0.17); c.closePath(); c.fill();
      c.fillStyle = '#f0c45d'; c.beginPath(); c.moveTo(size*0.11, size*0.83); c.lineTo(size*0.89, size*0.83); c.lineTo(size*0.85, size*0.92); c.lineTo(size*0.15, size*0.92); c.closePath(); c.fill();
      c.strokeStyle = '#1a55b9'; c.lineWidth = size * 0.028; c.beginPath(); c.arc(center, center, hole + size * 0.02, 0, Math.PI * 2); c.stroke();
      c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(center, center, hole, 0, Math.PI * 2); c.fill(); c.restore();
      c.strokeStyle = 'rgba(255,255,255,.88)'; c.lineWidth = size * 0.008; c.setLineDash([size*0.01, size*0.012]); c.beginPath(); c.arc(center, center, hole + size * 0.045, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#d8a62c'; c.beginPath(); c.arc(size*0.79, size*0.18, size*0.055, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.font = `800 ${size*0.05}px Poppins`; c.textAlign = 'center'; c.fillText('SELAMAT', center, size*0.16); c.font = `700 ${size*0.036}px Poppins`; c.fillText('YUDISIUM SARJANA', center, size*0.215);
    } else {
      c.fillStyle = '#2eb96f'; c.beginPath(); c.moveTo(0, size*0.0); c.lineTo(size, size*0.0); c.lineTo(size, size*0.25); c.lineTo(0, size*0.15); c.closePath(); c.fill();
      c.fillStyle = '#1b57bd'; c.beginPath(); c.arc(size*0.68, size*0.18, size*0.08, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f0c45d'; c.beginPath(); c.arc(size*0.84, size*0.16, size*0.11, 0, Math.PI * 2); c.strokeStyle = '#f0c45d'; c.lineWidth = size * 0.02; c.stroke();
      c.strokeStyle = '#2ea96a'; c.lineWidth = size * 0.03; c.beginPath(); c.arc(center, center, hole + size * 0.022, 0.95 * Math.PI, 2.1 * Math.PI); c.stroke();
      c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(center, center, hole, 0, Math.PI * 2); c.fill(); c.restore();
      c.fillStyle = '#fff'; c.font = `800 ${size*0.05}px Poppins`; c.textAlign = 'center'; c.fillText('SELAMAT DATANG', center, size*0.16); c.font = `700 ${size*0.036}px Poppins`; c.fillText('MAHASISWA BARU', center, size*0.215);
    }
    c.restore();
  }

  function draw() { ctx.clearRect(0,0,PREVIEW,PREVIEW); drawBg(ctx, PREVIEW, state.template ? state.template.theme : 'graduation'); if (state.template && state.image) drawPhoto(ctx, PREVIEW); if (state.template) drawFrame(ctx, PREVIEW); if (!state.image) canvasEmpty.classList.remove('hidden'); }

  function download() {
    if (!state.template) return App.showToast('Belum ada template', 'Pilih template terlebih dahulu.', 'error');
    if (!state.image) return App.showToast('Belum ada foto', 'Unggah foto sebelum mengunduh.', 'error');
    const c = document.createElement('canvas'); c.width = EXPORT; c.height = EXPORT; const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    drawBg(x, EXPORT, state.template.theme);
    x.save(); x.beginPath(); x.arc(EXPORT/2, EXPORT/2, EXPORT * HOLE, 0, Math.PI * 2); x.clip(); x.translate((state.x / PREVIEW) * EXPORT, (state.y / PREVIEW) * EXPORT); x.rotate(state.rotation * Math.PI / 180); const s = (state.baseScale * state.scale) * (EXPORT / PREVIEW); const w = state.image.width * s, h = state.image.height * s; x.drawImage(state.image, -w/2, -h/2, w, h); x.restore();
    drawFrame(x, EXPORT);
    c.toBlob(blob => { if (!blob) return App.showToast('Gagal', 'PNG gagal dibuat.', 'error'); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${state.template.id}-portrait-twibbon.png`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href); App.showToast('PNG siap', 'Hasil siap diunduh.'); }, 'image/png');
  }

  function init() { bind(); draw(); }
  return { init, openTemplate };
})();
