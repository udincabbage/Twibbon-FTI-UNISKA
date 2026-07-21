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

  const previewSize = 1000;
  const exportSize = 2000;

  const state = {
    currentTemplate: null,
    image: null,
    imageName: '',
    x: previewSize / 2,
    y: previewSize / 2,
    scale: 1,
    rotation: 0,
    baseScale: 1,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    pointerStartX: 0,
    pointerStartY: 0
  };

  function openTemplate(template) {
    state.currentTemplate = template;
    editorSection.classList.remove('hidden');
    updateEditorTexts();
    applyFrameOverlay(template);
    resetImagePosition(false);
    drawPreview();
    App.showToast('Template dipilih', `${template.title} siap digunakan.`);
  }

  function updateEditorTexts() {
    if (!state.currentTemplate) return;

    editorTitle.textContent = state.currentTemplate.title;
    editorSubtitle.textContent = state.currentTemplate.subtitle.replace(/\n/g, ' · ');
    templateInfoCard.innerHTML = `
      <h3>${state.currentTemplate.title}</h3>
      <p>${state.currentTemplate.subtitle.replace(/\n/g, '<br>')}</p>
      <p>${state.currentTemplate.text}</p>
      <p><strong>Tema:</strong> ${state.currentTemplate.theme}</p>
    `;
  }

  function applyFrameOverlay(template) {
    frameOverlay.className = `frame-overlay ${template.theme === 'graduation' ? 'template-graduation' : 'template-newstudent'}`;

    if (template.theme === 'graduation') {
      frameOverlay.innerHTML = `
        <div class="frame-circle"></div>
        <div class="frame-badge"><i class="fa-solid fa-graduation-cap"></i></div>
        <div class="frame-title top">
          <strong>SELAMAT</strong>
          <span>YUDISIUM SARJANA</span>
        </div>
        <div class="frame-title bottom">
          <span>${template.subtitle.replace(/\n/g, '<br>')}</span>
        </div>
        <div class="corner-accent left"></div>
        <div class="corner-accent right"></div>
      `;
    } else {
      frameOverlay.innerHTML = `
        <div class="frame-circle"></div>
        <div class="frame-badge"><i class="fa-solid fa-user-graduate"></i></div>
        <div class="frame-title top">
          <strong>SELAMAT DATANG</strong>
          <span>MAHASISWA BARU</span>
        </div>
        <div class="frame-title bottom">
          <span>${template.subtitle.replace(/\n/g, '<br>')}</span>
        </div>
        <div class="wave"></div>
        <div class="confetti"></div>
      `;
    }
  }

  function bindEvents() {
    uploadZone.addEventListener('click', () => photoInput.click());
    uploadZone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        photoInput.click();
      }
    });

    photoInput.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (file) handleFile(file);
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
      uploadZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        uploadZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      uploadZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        uploadZone.classList.remove('dragover');
      });
    });

    uploadZone.addEventListener('drop', (event) => {
      const file = event.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    });

    zoomSlider.addEventListener('input', () => {
      state.scale = Number(zoomSlider.value);
      zoomValue.textContent = `${Math.round(state.scale * 100)}%`;
      drawPreview();
    });

    rotateSlider.addEventListener('input', () => {
      state.rotation = Number(rotateSlider.value);
      rotateValue.textContent = `${state.rotation}°`;
      drawPreview();
    });

    resetBtn.addEventListener('click', () => {
      resetImagePosition(true);
      drawPreview();
      App.showToast('Posisi direset', 'Foto kembali ke posisi awal.');
    });

    downloadBtn.addEventListener('click', downloadResult);
    changeTemplateBtn.addEventListener('click', () => {
      App.scrollToSection('template');
      App.showToast('Pilih template lain', 'Silakan pilih template baru dari daftar.');
    });

    canvasStage.addEventListener('dblclick', () => {
      resetImagePosition(true);
      drawPreview();
      App.showToast('Reset cepat', 'Posisi foto diatur ulang melalui double click.');
    });

    canvasStage.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  function onPointerDown(event) {
    if (!state.image) return;

    state.isDragging = true;
    state.pointerStartX = event.clientX;
    state.pointerStartY = event.clientY;
    state.dragStartX = state.x;
    state.dragStartY = state.y;
    if (canvasStage.setPointerCapture) {
      canvasStage.setPointerCapture(event.pointerId);
    }
  }

  function onPointerMove(event) {
    if (!state.isDragging || !state.image) return;

    const rect = canvasStage.getBoundingClientRect();
    const scaleX = previewSize / rect.width;
    const scaleY = previewSize / rect.height;

    state.x = state.dragStartX + (event.clientX - state.pointerStartX) * scaleX;
    state.y = state.dragStartY + (event.clientY - state.pointerStartY) * scaleY;
    drawPreview();
  }

  function onPointerUp() {
    state.isDragging = false;
  }

  function simulateProgress() {
    uploadProgressWrapper.classList.remove('hidden');
    uploadProgressBar.style.width = '0%';
    uploadProgressText.textContent = '0%';

    let progress = 0;
    return new Promise((resolve) => {
      const timer = setInterval(() => {
        progress += 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(timer);
          uploadProgressBar.style.width = `${progress}%`;
          uploadProgressText.textContent = `${progress}%`;
          setTimeout(() => {
            uploadProgressWrapper.classList.add('hidden');
            resolve();
          }, 220);
        } else {
          uploadProgressBar.style.width = `${progress}%`;
          uploadProgressText.textContent = `${progress}%`;
        }
      }, 70);
    });
  }

  async function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      App.showToast('File tidak valid', 'Silakan unggah file gambar.', 'error');
      return;
    }

    if (!state.currentTemplate) {
      App.showToast('Pilih template dulu', 'Silakan pilih salah satu template sebelum upload foto.', 'error');
      return;
    }

    await simulateProgress();

    const dataUrl = await readFileAsDataURL(file);
    const image = await loadImage(dataUrl);

    state.image = image;
    state.imageName = file.name.replace(/\.[^.]+$/, '');
    fitImageToHole();
    canvasEmpty.classList.add('hidden');
    drawPreview();
    App.showToast('Foto berhasil diunggah', `${file.name} siap diedit.`);
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function fitImageToHole() {
    if (!state.image) return;
    const holeRadius = previewSize * 0.315 - previewSize * 0.075;
    const fitScale = Math.max((holeRadius * 1.55) / state.image.width, (holeRadius * 1.55) / state.image.height);
    state.baseScale = fitScale;
    state.x = previewSize / 2;
    state.y = previewSize / 2;
    state.scale = 1;
    state.rotation = 0;
    zoomSlider.value = '1';
    rotateSlider.value = '0';
    zoomValue.textContent = '100%';
    rotateValue.textContent = '0°';
  }

  function resetImagePosition(keepImage = true) {
    if (keepImage && state.image) {
      fitImageToHole();
    } else {
      state.x = previewSize / 2;
      state.y = previewSize / 2;
      state.scale = 1;
      state.rotation = 0;
      zoomSlider.value = '1';
      rotateSlider.value = '0';
      zoomValue.textContent = '100%';
      rotateValue.textContent = '0°';
    }
  }

  function drawPreview() {
    ctx.clearRect(0, 0, previewSize, previewSize);
    ctx.save();

    drawBackground(ctx, previewSize, state.currentTemplate?.theme || 'graduation');

    if (state.image) {
      drawMaskedPhoto(ctx, previewSize);
      canvasEmpty.classList.add('hidden');
    } else {
      canvasEmpty.classList.remove('hidden');
    }

    drawFrameOnCanvas(ctx, previewSize, true);
    ctx.restore();
  }


  function drawBackground(context, size, theme) {
    context.save();
    const gradient = context.createLinearGradient(0, 0, size, size);
    if (theme === 'newstudent') {
      gradient.addColorStop(0, '#eef8ff');
      gradient.addColorStop(1, '#eefaf4');
    } else {
      gradient.addColorStop(0, '#edf4ff');
      gradient.addColorStop(1, '#f8fbff');
    }
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    context.restore();
  }

  function drawMaskedPhoto(context, size) {
    const center = size / 2;
    const innerRadius = size * 0.255;
    context.save();
    context.beginPath();
    context.arc(center, center, innerRadius, 0, Math.PI * 2);
    context.clip();

    context.save();
    context.translate(state.x, state.y);
    context.rotate((state.rotation * Math.PI) / 180);
    const finalScale = state.baseScale * state.scale;
    const drawWidth = state.image.width * finalScale;
    const drawHeight = state.image.height * finalScale;
    context.drawImage(state.image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    context.restore();
    context.restore();
  }
  function drawFrameOnCanvas(context, size, overlayOnly = true) {
    if (!state.currentTemplate) return;

    const center = size / 2;
    const radius = size * 0.315;

    context.save();

    if (state.currentTemplate.theme === 'graduation') {
      drawRibbon(context, size * 0.08, size * 0.06, size * 0.84, size * 0.1, '#1b4da7', '#2a6de0');
      drawRibbon(context, size * 0.1, size * 0.82, size * 0.8, size * 0.11, '#bc8d13', '#f0c45d');

      if (overlayOnly) {
        context.lineWidth = size * 0.035;
        context.strokeStyle = '#1a55b9';
        context.beginPath();
        context.arc(center, center, radius, 0, Math.PI * 2);
        context.stroke();

        context.lineWidth = size * 0.012;
        context.strokeStyle = '#ffffff';
        context.beginPath();
        context.arc(center, center, radius - size * 0.022, 0, Math.PI * 2);
        context.stroke();
      }

      context.lineWidth = size * 0.012;
      context.strokeStyle = '#d8a62c';
      context.beginPath();
      context.arc(center, center, radius + size * 0.025, 0, Math.PI * 2);
      context.stroke();

      context.setLineDash([size * 0.01, size * 0.012]);
      context.lineWidth = size * 0.004;
      context.strokeStyle = 'rgba(255,255,255,0.52)';
      context.beginPath();
      context.arc(center, center, radius + size * 0.06, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);

      drawBadge(context, size * 0.79, size * 0.18, size * 0.055, '#b78300', '#f0c45d', 'cap');
      drawCornerDecoration(context, size * 0.12, size * 0.74, size * 0.09, '#ffffff');
      drawCornerDecoration(context, size * 0.83, size * 0.19, size * 0.09, '#ffffff', true);
      if (overlayOnly) {
        drawTitleBlock(context, size, center, size * 0.15, ['SELAMAT', 'YUDISIUM SARJANA'], '#ffffff');
        drawMultilineText(context, state.currentTemplate.subtitle, center, size * 0.865, size * 0.026, '#ffffff', 1.35, 600, size);
      }
    } else {
      drawWaveBand(context, size, size * 0.68, size * 0.16, '#2a71e2', '#33bb83');

      if (overlayOnly) {
        context.lineWidth = size * 0.028;
        context.strokeStyle = '#ffffff';
        context.beginPath();
        context.arc(center, center, radius, 0, Math.PI * 2);
        context.stroke();

        context.lineWidth = size * 0.012;
        context.strokeStyle = '#1b57bd';
        context.beginPath();
        context.arc(center, center, radius + size * 0.022, 0, Math.PI * 2);
        context.stroke();
      }

      context.lineWidth = size * 0.016;
      context.strokeStyle = 'rgba(30,163,108,0.28)';
      context.beginPath();
      context.arc(center, center, radius + size * 0.05, 0, Math.PI * 2);
      context.stroke();

      drawPartialCircle(context, size * 0.82, size * 0.18, size * 0.12, '#f0c45d', size);
      drawBadge(context, size * 0.76, size * 0.19, size * 0.055, '#1950b0', '#2fc181', 'user');
      drawConfetti(context, size);
      if (overlayOnly) {
        drawTitleBlock(context, size, center, size * 0.13, ['SELAMAT DATANG', 'MAHASISWA BARU'], '#ffffff');
        drawMultilineText(context, state.currentTemplate.subtitle, center, size * 0.86, size * 0.026, '#ffffff', 1.35, 600, size);
      }
    }

    context.restore();
  }

  function drawRibbon(context, x, y, width, height, startColor, endColor) {
    const gradient = context.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + width, y);
    context.lineTo(x + width * 0.94, y + height);
    context.lineTo(x + width * 0.06, y + height);
    context.closePath();
    context.shadowColor = 'rgba(10,27,54,0.18)';
    context.shadowBlur = 18;
    context.fill();
    context.shadowBlur = 0;
  }

  function drawBadge(context, x, y, radius, startColor, endColor, iconType) {
    const gradient = context.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#ffffff';
    context.strokeStyle = '#ffffff';
    context.lineWidth = radius * 0.09;

    if (iconType === 'cap') {
      context.beginPath();
      context.moveTo(x - radius * 0.75, y - radius * 0.12);
      context.lineTo(x, y - radius * 0.5);
      context.lineTo(x + radius * 0.75, y - radius * 0.12);
      context.lineTo(x, y + radius * 0.26);
      context.closePath();
      context.stroke();
      context.beginPath();
      context.moveTo(x - radius * 0.33, y + radius * 0.18);
      context.lineTo(x + radius * 0.33, y + radius * 0.18);
      context.stroke();
      context.beginPath();
      context.moveTo(x + radius * 0.42, y - radius * 0.02);
      context.lineTo(x + radius * 0.58, y + radius * 0.5);
      context.stroke();
    } else {
      context.beginPath();
      context.arc(x, y - radius * 0.14, radius * 0.28, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(x, y + radius * 0.42, radius * 0.5, Math.PI, 0);
      context.stroke();
      context.beginPath();
      context.moveTo(x - radius * 0.66, y - radius * 0.02);
      context.lineTo(x, y - radius * 0.4);
      context.lineTo(x + radius * 0.66, y - radius * 0.02);
      context.lineTo(x, y + radius * 0.3);
      context.closePath();
      context.stroke();
    }
  }

  function drawCornerDecoration(context, x, y, size, color, invert = false) {
    context.save();
    context.translate(x, y);
    context.rotate((invert ? -20 : 20) * Math.PI / 180);
    context.strokeStyle = color;
    context.globalAlpha = 0.22;
    context.lineWidth = 4;
    context.strokeRect(-size / 2, -size / 2, size, size);
    context.restore();
  }

  function drawTitleBlock(context, canvasSize, x, y, lines, color) {
    context.save();
    context.fillStyle = color;
    context.textAlign = 'center';
    context.shadowColor = 'rgba(10,27,54,0.3)';
    context.shadowBlur = 20;
    context.font = `800 ${canvasSize * 0.047}px Poppins`;
    context.fillText(lines[0], x, y);
    context.font = `700 ${canvasSize * 0.034}px Poppins`;
    context.fillText(lines[1], x, y + canvasSize * 0.05);
    context.restore();
  }

  function drawMultilineText(context, text, x, y, relativeFontSize, color, lineHeight = 1.35, fontWeight = 600, canvasSize = previewSize) {
    const lines = text.split('\n');
    context.save();
    context.fillStyle = color;
    context.textAlign = 'center';
    context.font = `${fontWeight} ${relativeFontSize * canvasSize}px Poppins`;
    lines.forEach((line, index) => {
      context.fillText(line, x, y + index * relativeFontSize * canvasSize * lineHeight);
    });
    context.restore();
  }

  function drawWaveBand(context, canvasSize, top, height, startColor, endColor) {
    const gradient = context.createLinearGradient(0, top, canvasSize, top + height);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(-20, top + height * 0.38);
    context.bezierCurveTo(canvasSize * 0.14, top + height * 0.08, canvasSize * 0.28, top + height * 0.72, canvasSize * 0.42, top + height * 0.34);
    context.bezierCurveTo(canvasSize * 0.56, top + height * 0.02, canvasSize * 0.7, top + height * 0.72, canvasSize * 0.86, top + height * 0.24);
    context.bezierCurveTo(canvasSize * 0.94, top + height * 0.06, canvasSize * 1.02, top + height * 0.42, canvasSize + 20, top + height * 0.18);
    context.lineTo(canvasSize + 20, canvasSize + 20);
    context.lineTo(-20, canvasSize + 20);
    context.closePath();
    context.globalAlpha = 0.9;
    context.fill();
    context.globalAlpha = 1;
  }

  function drawPartialCircle(context, x, y, radius, color, canvasSize) {
    context.save();
    context.strokeStyle = color;
    context.lineWidth = canvasSize * 0.018;
    context.globalAlpha = 0.72;
    context.beginPath();
    context.arc(x, y, radius, Math.PI * 0.25, Math.PI * 1.75);
    context.stroke();
    context.restore();
  }

  function drawConfetti(context, canvasSize) {
    const pieces = [
      { x: canvasSize * 0.18, y: canvasSize * 0.18, color: '#f0c45d', rotate: 20 },
      { x: canvasSize * 0.3, y: canvasSize * 0.24, color: '#ffffff', rotate: -14 },
      { x: canvasSize * 0.77, y: canvasSize * 0.31, color: '#2fc181', rotate: 8 },
      { x: canvasSize * 0.12, y: canvasSize * 0.62, color: '#ffffff', rotate: 30 },
      { x: canvasSize * 0.76, y: canvasSize * 0.68, color: '#1b57bd', rotate: -18 }
    ];

    pieces.forEach((piece) => {
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate((piece.rotate * Math.PI) / 180);
      context.fillStyle = piece.color;
      context.fillRect(-7, -7, 14, 14);
      context.restore();
    });
  }

  function downloadResult() {
    if (!state.currentTemplate) {
      App.showToast('Belum ada template', 'Pilih template terlebih dahulu.', 'error');
      return;
    }

    if (!state.image) {
      App.showToast('Belum ada foto', 'Unggah foto sebelum mengunduh hasil.', 'error');
      return;
    }

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const exportContext = exportCanvas.getContext('2d');

    exportContext.clearRect(0, 0, exportSize, exportSize);

    exportContext.save();
    exportContext.translate((state.x / previewSize) * exportSize, (state.y / previewSize) * exportSize);
    exportContext.rotate((state.rotation * Math.PI) / 180);
    const finalScale = state.baseScale * state.scale * (exportSize / previewSize);
    const drawWidth = state.image.width * finalScale;
    const drawHeight = state.image.height * finalScale;
    exportContext.drawImage(state.image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    exportContext.restore();

    drawFrameOnCanvas(exportContext, exportSize);

    exportCanvas.toBlob((blob) => {
      if (!blob) {
        App.showToast('Unduhan gagal', 'Terjadi masalah saat membuat file PNG.', 'error');
        return;
      }

      const link = document.createElement('a');
      const safeName = `${state.currentTemplate.id}-${state.imageName || 'hasil'}.png`;
      link.href = URL.createObjectURL(blob);
      link.download = safeName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
      App.showToast('PNG berhasil dibuat', 'Hasil twibbon telah diunduh dengan resolusi tinggi.');
    }, 'image/png', 1);
  }

  function init() {
    bindEvents();
    drawPreview();
  }

  return {
    init,
    openTemplate,
    drawPreview
  };
})();
