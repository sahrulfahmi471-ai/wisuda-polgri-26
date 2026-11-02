/**
 * DISPLAY CONTROLLER SCRIPT (Layar Panggung / Videotron)
 * Mengatur tampilan megah saat wisudawan discan dan animasi layar siaga.
 * Mendukung pemindaian barcode/QR fisik LANGSUNG di halaman display maupun dari tab operator.
 */

document.addEventListener('DOMContentLoaded', () => {
  const sync = new WisudaSyncClient('display');
  let studentsData = [];

  // DOM Elemen Layar
  const standbyScreen = document.getElementById('standby-screen');
  const studentShowcase = document.getElementById('student-showcase');
  const showcaseCard = document.getElementById('showcase-card');

  // Teks Dinamis Layar Standby
  const mainTitleUniv = document.getElementById('main-title-univ');
  const subTitleEvent = document.getElementById('sub-title-event');
  const ceremonySession = document.getElementById('ceremony-session');
  const standbyFooterMsg = document.getElementById('standby-footer-msg');

  // Elemen Data Wisudawan
  const photoWrapper = document.getElementById('photo-wrapper');
  const dispPhoto = document.getElementById('disp-photo');
  const dispFaculty = document.getElementById('disp-faculty');
  const dispNameWrapper = document.getElementById('disp-name-wrapper');
  const dispName = document.getElementById('disp-name');
  const dispProdiWrapper = document.getElementById('disp-prodi-wrapper');
  const dispProdi = document.getElementById('disp-prodi');
  const dispKerjaBox = document.getElementById('disp-kerja-box');
  const dispKerja = document.getElementById('disp-kerja');
  const dispNim = document.getElementById('disp-nim');
  const dispIpkBox = document.getElementById('disp-ipk-box');
  const dispIpk = document.getElementById('disp-ipk');
  const dispPredikatBox = document.getElementById('disp-predikat-box');
  const dispPredikatText = document.getElementById('disp-predikat-text');
  const dispParentsLine = document.getElementById('disp-parents-line');
  const dispParents = document.getElementById('disp-parents');
  const dispOriginLine = document.getElementById('disp-origin-line');
  const dispOrigin = document.getElementById('disp-origin');
  const dispThesisLine = document.getElementById('disp-thesis-line');
  const dispThesis = document.getElementById('disp-thesis');
  const dispTimerBar = document.getElementById('disp-timer-bar');

  // Status & Controls
  const liveClockTime = document.getElementById('live-clock-time');
  const liveClockDate = document.getElementById('live-clock-date');
  const connStatusPill = document.getElementById('conn-status-pill');
  const btnToggleFullscreen = document.getElementById('btn-toggle-fullscreen');
  const btnToggleMute = document.getElementById('btn-toggle-mute');

  // Konfigurasi Default
  let currentSettings = {
    univName: "UNIVERSITAS NUSANTARA GEMILANG",
    subTitle: "SIDANG TERBUKA SENAT UNIVERSITAS",
    sessionName: "Upacara Wisuda Program Sarjana, Magister & Doktor Periode I 2026",
    standbyMessage: "Selamat Datang Kepada Seluruh Wisudawan, Wisudawati & Tamu Kehormatan",
    displayDuration: 15,
    autoReturnStandby: true,
    enableChime: true,
    enableCumlaudeFanfare: true,
    enableTTS: true,
    ttsRate: 0.95,
    ttsTemplate: "{nama}. Program Studi {prodi}. Predikat {predikat}.",
    soundLocation: "display",
    showPhoto: true,
    showThesis: true,
    showParents: true,
    showOrigin: true,
    showIpk: true,
    theme: "royal-gold"
  };

  let currentTimeout = null;
  let timerInterval = null;

  // ==========================================
  // 1. LOAD DATA MAHASISWA & PENGATURAN
  // ==========================================
  async function fetchStudents() {
    try {
      const res = await fetch('/api/students');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        studentsData = json.data;
        renderQuickScanChips();
      }
    } catch (e) {
      try {
        const fb = await fetch('./data/students.json');
        studentsData = await fb.json();
        renderQuickScanChips();
      } catch (err) {}
    }
  }

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success && json.data) {
        applySettings(json.data);
      }
    } catch (e) {}
  }

  function applySettings(settings) {
    if (!settings) return;
    currentSettings = { ...currentSettings, ...settings };

    if (mainTitleUniv && currentSettings.univName) mainTitleUniv.textContent = currentSettings.univName;
    if (subTitleEvent && currentSettings.subTitle) subTitleEvent.textContent = currentSettings.subTitle;
    if (ceremonySession && currentSettings.sessionName) ceremonySession.textContent = currentSettings.sessionName;
    if (standbyFooterMsg && currentSettings.standbyMessage) standbyFooterMsg.textContent = currentSettings.standbyMessage;

    document.body.className = `display-mode theme-${currentSettings.theme || 'royal-gold'}`;

    // Penerapan Tata Letak (Centered Vertical vs Split Horizontal)
    if (showcaseCard) {
      showcaseCard.classList.remove('layout-centered', 'layout-split-left', 'layout-split-right');
      const layout = currentSettings.displayLayout || 'centered';
      showcaseCard.classList.add(`layout-${layout}`);
    }

    if (photoWrapper) {
      photoWrapper.style.display = currentSettings.showPhoto ? 'flex' : 'none';
      if (showcaseCard) {
        showcaseCard.classList.toggle('no-photo-layout', !currentSettings.showPhoto);
      }
      applyPhotoCustomization(currentSettings);
    }

    // Penerapan Visibility Elemen Biodata Wisudawan
    const dispNimBox = document.getElementById('disp-nim-box');
    const dispPredikatBox = document.getElementById('disp-predikat-box');

    if (dispFaculty) dispFaculty.style.display = currentSettings.showFaculty !== false ? 'inline-flex' : 'none';
    if (dispNameWrapper) dispNameWrapper.style.display = currentSettings.showName !== false ? 'block' : 'none';
    if (dispNimBox) dispNimBox.style.display = currentSettings.showNim !== false ? 'flex' : 'none';
    if (dispProdiWrapper) dispProdiWrapper.style.display = currentSettings.showProdi !== false ? 'flex' : 'none';
    if (dispKerjaBox) dispKerjaBox.style.display = currentSettings.showKerja !== false ? 'inline-flex' : 'none';
    if (dispIpkBox) dispIpkBox.style.display = currentSettings.showIpk !== false ? 'flex' : 'none';
    if (dispPredikatBox) dispPredikatBox.style.display = currentSettings.showPredikat !== false ? 'flex' : 'none';
    if (dispParentsLine) dispParentsLine.style.display = currentSettings.showParents ? 'flex' : 'none';
    if (dispOriginLine) dispOriginLine.style.display = currentSettings.showOrigin ? 'flex' : 'none';
    if (dispThesisLine) dispThesisLine.style.display = currentSettings.showThesis ? 'flex' : 'none';

    // Penerapan Kostumisasi Warna Layar Scan Display, Bingkai, & Biodata
    applyThemeColors(currentSettings);

    window.GradAudio.enableChime = Boolean(currentSettings.enableChime);
    window.GradAudio.enableCumlaudeFanfare = Boolean(currentSettings.enableCumlaudeFanfare);
    window.GradAudio.enableTTS = Boolean(currentSettings.enableTTS);
    window.GradAudio.ttsRate = currentSettings.ttsRate || 0.95;
    window.GradAudio.ttsTemplate = currentSettings.ttsTemplate;
  }

  function applyPhotoCustomization(settings) {
    if (!photoWrapper) return;
    const shape = settings.photoShape || 'circle';
    const size = settings.photoSize || 'medium';
    const color = settings.photoBorderColor || '#d4af37';
    const effect = settings.photoRingEffect || 'rotating';

    photoWrapper.className = `photo-frame-wrapper shape-${shape} effect-${effect}`;

    let width = 320;
    let height = 320;

    if (size === 'small') {
      width = 250;
      height = shape === 'portrait' ? 330 : 250;
    } else if (size === 'medium') {
      width = 320;
      height = shape === 'portrait' ? 420 : 320;
    } else if (size === 'large') {
      width = 380;
      height = shape === 'portrait' ? 500 : 380;
    } else if (size === 'xlarge') {
      width = 440;
      height = shape === 'portrait' ? 570 : 440;
    }

    const card = document.getElementById('showcase-card');
    if (card) {
      card.style.setProperty('--photo-frame-width', `${width}px`);
      card.style.setProperty('--photo-frame-height', `${height}px`);
      card.style.setProperty('--photo-border-color', color);
      card.style.setProperty('--photo-glow-color', hexToRgba(color, 0.45));
      card.style.setProperty('--photo-ring-bg', `linear-gradient(135deg, #ffffff 0%, ${color} 45%, #000000 100%)`);

      // Ambient Light Customization
      const ambEnabled = settings.ambientLightEnabled !== false;
      const ambColor = settings.ambientLightColor || color || '#d4af37';
      const ambRadius = settings.ambientLightRadius || 60;
      const ambIntensity = settings.ambientLightIntensity || 0.75;
      const ambAnim = settings.ambientLightAnimation || 'breathe';

      card.style.setProperty('--ambient-color', ambColor);
      card.style.setProperty('--ambient-radius', `${ambRadius}px`);
      card.style.setProperty('--ambient-intensity', ambIntensity);

      const ambientEl = document.getElementById('photo-ambient');
      if (ambientEl) {
        ambientEl.classList.toggle('ambient-disabled', !ambEnabled);
        if (ambEnabled) {
          ambientEl.className = `photo-ambient-light anim-${ambAnim}`;
        }
      }
    }
  }

  function hexToRgba(hex, alpha) {
    if (!hex || typeof hex !== 'string') return `rgba(212, 175, 55, ${alpha})`;
    let c = hex.replace('#', '').trim();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6) return `rgba(212, 175, 55, ${alpha})`;
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }

  function applyThemeColors(settings) {
    if (!settings) return;
    const root = document.documentElement;

    // 1. Warna Layar Scan Display
    const bg1 = settings.dispBgColor1 || '#152243';
    const bg2 = settings.dispBgColor2 || '#050814';
    root.style.setProperty('--disp-bg-color1', bg1);
    root.style.setProperty('--disp-bg-color2', bg2);
    root.style.setProperty('--disp-bg-custom', `radial-gradient(circle at 50% 30%, ${bg1} 0%, ${bg2} 100%)`);

    const cardBg = settings.dispCardBg || '#10192d';
    const cardOpacity = settings.dispCardOpacity !== undefined ? parseFloat(settings.dispCardOpacity) : 0.94;
    const cardRgba = hexToRgba(cardBg, cardOpacity);
    const cardRgba2 = hexToRgba(bg2, Math.min(1, cardOpacity + 0.04));
    root.style.setProperty('--disp-card-bg', `linear-gradient(135deg, ${cardRgba} 0%, ${cardRgba2} 100%)`);

    // 2. Warna Bingkai (Stage Border & Showcase Card & Photo)
    const stageColor = settings.stageBorderColor || '#d4af37';
    const stageGlow = settings.stageBorderGlow || stageColor;
    root.style.setProperty('--stage-border-color', stageColor);
    root.style.setProperty('--stage-glow-color', hexToRgba(stageGlow, 0.25));
    root.style.setProperty('--stage-border-inner', hexToRgba(stageColor, 0.25));

    const cardBorder = settings.cardBorderColor || '#d4af37';
    const cardGlow = settings.cardGlowColor || cardBorder;
    root.style.setProperty('--card-border-color', cardBorder);
    root.style.setProperty('--card-glow-color', hexToRgba(cardGlow, 0.45));

    const photoBorder = settings.photoBorderColor || '#d4af37';
    root.style.setProperty('--photo-border-color', photoBorder);
    root.style.setProperty('--photo-glow-color', hexToRgba(photoBorder, 0.45));

    // 3. Warna Biodata Mahasiswa
    const nameColor = settings.bioNameColor || '#ffffff';
    const prodiColor = settings.bioProdiColor || '#93c5fd';
    const facultyColor = settings.bioFacultyColor || '#f7e394';
    const nimColor = settings.bioNimColor || '#ffffff';
    const ipkColor = settings.bioIpkColor || '#67e8f9';
    const predikatColor = settings.bioPredikatColor || '#d4af37';
    const detailColor = settings.bioDetailColor || '#cbd5e1';

    root.style.setProperty('--bio-name-color', nameColor);
    root.style.setProperty('--bio-prodi-color', prodiColor);
    root.style.setProperty('--bio-faculty-color', facultyColor);
    root.style.setProperty('--bio-faculty-bg', hexToRgba(facultyColor, 0.15));
    root.style.setProperty('--bio-nim-color', nimColor);
    root.style.setProperty('--bio-ipk-color', ipkColor);
    root.style.setProperty('--bio-predikat-color', predikatColor);
    root.style.setProperty('--bio-predikat-glow', hexToRgba(predikatColor, 0.35));
    root.style.setProperty('--bio-detail-color', detailColor);
    root.style.setProperty('--bio-detail-label-color', hexToRgba(facultyColor, 0.75));
  }

  fetchStudents();
  fetchSettings();

  // ==========================================
  // 2. HARDWARE SCANNER LISTENER DI HALAMAN DISPLAY!
  // ==========================================
  // Memungkinkan pemindaian barcode/QR langsung ketika layar display sedang aktif
  WisudaScannerHelper.attachHardwareScanner(window, (scannedCode) => {
    console.log('[Display Scanner] Kode terbaca langsung di halaman display:', scannedCode);
    handleDirectScan(scannedCode);
  });

  async function handleDirectScan(rawCode) {
    // Pastikan data mahasiswa sudah termuat
    if (!studentsData || studentsData.length === 0) {
      await fetchStudents();
    }

    const found = WisudaScannerHelper.findStudent(studentsData, rawCode);

    if (found) {
      window.GradAudio.playScannerBeep();
      showToastFeedback(`✅ Terdeteksi: ${found.nama} (${found.nim})`, 'success');

      // Tampilkan ke layar panggung
      showStudentDisplay(found);

      // Beritahu tab operator dan server agar status kehadiran diperbarui
      sync.sendShowStudent(found);
    } else {
      window.GradAudio.playWarningBuzzer();
      const clean = WisudaScannerHelper.cleanQuery(rawCode);
      showToastFeedback(`⚠️ Barcode/QR tidak ditemukan: "${clean || rawCode}"`, 'warning');
    }
  }

  // Toast Notifikasi Layar Display
  function showToastFeedback(message, type = 'info') {
    let toast = document.getElementById('display-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'display-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 25px;
        left: 50%;
        transform: translateX(-50%);
        padding: 0.75rem 1.75rem;
        border-radius: 999px;
        font-size: 0.95rem;
        font-weight: 700;
        z-index: 9999;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        transition: all 0.3s ease;
        pointer-events: none;
      `;
      document.body.appendChild(toast);
    }

    if (type === 'success') {
      toast.style.background = 'linear-gradient(135deg, #059669, #10b981)';
      toast.style.color = '#fff';
      toast.style.border = '1px solid #34d399';
    } else {
      toast.style.background = 'linear-gradient(135deg, #b91c1c, #ef4444)';
      toast.style.color = '#fff';
      toast.style.border = '1px solid #f87171';
    }

    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
    }, 4000);
  }

  // ==========================================
  // 3. JAM DIGITAL REAL-TIME
  // ==========================================
  function updateLiveClock() {
    const now = new Date();
    if (liveClockTime) {
      liveClockTime.textContent = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' WIB';
    }

    if (liveClockDate) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      liveClockDate.textContent = now.toLocaleDateString('id-ID', options);
    }
  }

  updateLiveClock();
  setInterval(updateLiveClock, 1000);

  // ==========================================
  // 4. KONEKSI & EVENT SINKRONISASI
  // ==========================================
  sync.on('connection_status', (data) => {
    if (connStatusPill) {
      if (data.connected) {
        connStatusPill.innerHTML = `<span class="status-dot active"></span> Layar Online`;
      } else {
        connStatusPill.innerHTML = `<span class="status-dot active" style="background: #3b82f6;"></span> Tab Lokal Sinkron`;
      }
    }
  });

  // TAMPILKAN WISUDAWAN (Dari Operator maupun Display)
  sync.on('show_student', (payload) => {
    if (payload && payload.student) {
      if (payload.settings) {
        applySettings(payload.settings);
      }
      showStudentDisplay(payload.student, payload.options);
    }
  });

  sync.on('students_updated', (updatedList) => {
    studentsData = updatedList;
    renderQuickScanChips();
  });

  sync.on('standby', () => {
    returnToStandby();
  });

  sync.on('settings_updated', (settings) => {
    applySettings(settings);
  });

  sync.on('play_sound', (payload) => {
    const soundAllowed = currentSettings.soundLocation === 'display' || currentSettings.soundLocation === 'both';
    if (!soundAllowed) return;

    if (payload && payload.type === 'cumlaude') {
      window.GradAudio.playCumLaudeFanfare();
    } else {
      window.GradAudio.playCeremonyChime();
    }
  });

  // ==========================================
  // 5. FUNGSI TAMPILKAN WISUDAWAN
  // ==========================================
  function showStudentDisplay(student, options = {}) {
    if (currentTimeout) clearTimeout(currentTimeout);
    if (timerInterval) clearInterval(timerInterval);

    // Isi data ke elemen
    if (dispPhoto) {
      dispPhoto.src = student.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500';
    }
    if (dispFaculty) {
      dispFaculty.textContent = student.fakultas || currentSettings.univName;
      dispFaculty.style.display = currentSettings.showFaculty !== false ? 'inline-flex' : 'none';
    }
    if (dispName) dispName.textContent = student.nama;
    if (dispProdi) dispProdi.textContent = student.prodi ? `Program Studi ${student.prodi}` : '-';
    if (dispNim) dispNim.textContent = student.nim || '-';
    if (dispIpk) dispIpk.textContent = student.ipk || '-';

    // Tempat Bekerja
    if (dispKerja) {
      dispKerja.textContent = student.tempatKerja || '-';
    }
    if (dispKerjaBox) {
      const hasKerja = student.tempatKerja && student.tempatKerja.trim() !== '' && student.tempatKerja.trim() !== '-';
      dispKerjaBox.style.display = (currentSettings.showKerja !== false && hasKerja) ? 'inline-flex' : 'none';
    }

    if (dispNameWrapper) {
      dispNameWrapper.style.display = currentSettings.showName !== false ? 'block' : 'none';
    }
    if (dispProdiWrapper) {
      dispProdiWrapper.style.display = currentSettings.showProdi !== false ? 'flex' : 'none';
    }

    const dispNimBox = document.getElementById('disp-nim-box');
    if (dispNimBox) {
      dispNimBox.style.display = currentSettings.showNim !== false ? 'flex' : 'none';
    }

    if (dispIpkBox) {
      dispIpkBox.style.display = currentSettings.showIpk !== false ? 'flex' : 'none';
    }

    // Predikat & Cum Laude Badge
    if (dispPredikatText && dispPredikatBox) {
      dispPredikatBox.style.display = currentSettings.showPredikat !== false ? 'flex' : 'none';
      if (student.isCumlaude) {
        dispPredikatBox.className = 'highlight-box cumlaude-box';
        dispPredikatText.className = 'hl-value cumlaude-text';
        dispPredikatText.innerHTML = '★ DENGAN PUJIAN (CUM LAUDE) ★';
      } else {
        dispPredikatBox.className = 'highlight-box';
        dispPredikatText.className = 'hl-value';
        dispPredikatText.textContent = student.predikat || 'MEMUASKAN';
      }
    }

    if (dispParents) {
      dispParents.textContent = student.orangTua || '-';
    }
    if (dispOrigin) {
      dispOrigin.textContent = student.asalDaerah || '-';
    }
    if (dispThesis) {
      dispThesis.textContent = student.judulSkripsi ? `"${student.judulSkripsi}"` : '-';
    }

    // Alihkan ke tampilan kartu mahasiswa
    standbyScreen.classList.add('hidden');
    studentShowcase.classList.remove('hidden');

    if (showcaseCard) {
      showcaseCard.classList.remove('layout-centered', 'layout-split-left', 'layout-split-right');
      const layout = currentSettings.displayLayout || 'centered';
      showcaseCard.classList.add(`layout-${layout}`);
      showcaseCard.style.animation = 'none';
      void showcaseCard.offsetWidth;
      showcaseCard.style.animation = 'revealStudent 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    }

    // Pemutaran Audio jika diizinkan di Display
    const soundAllowed = currentSettings.soundLocation === 'display' || currentSettings.soundLocation === 'both';
    if (soundAllowed) {
      if (student.isCumlaude) {
        window.GradAudio.playCumLaudeFanfare();
      } else {
        window.GradAudio.playCeremonyChime();
      }
      window.GradAudio.speakStudent(student, currentSettings.ttsTemplate);
    }

    // Pengaturan Durasi Tampil
    const durationSec = parseInt(currentSettings.displayDuration, 10) || 15;
    const durationMs = durationSec * 1000;

    if (dispTimerBar) {
      dispTimerBar.style.display = 'block';
      dispTimerBar.style.transition = 'none';
      dispTimerBar.style.transform = 'scaleX(1)';

      if (currentSettings.autoReturnStandby && durationSec > 0) {
        setTimeout(() => {
          dispTimerBar.style.transition = `transform ${durationMs}ms linear`;
          dispTimerBar.style.transform = 'scaleX(0)';
        }, 50);

        currentTimeout = setTimeout(() => {
          returnToStandby();
        }, durationMs);
      } else {
        dispTimerBar.style.display = 'none';
      }
    }
  }

  function returnToStandby() {
    if (currentTimeout) clearTimeout(currentTimeout);
    if (timerInterval) clearInterval(timerInterval);

    studentShowcase.classList.add('hidden');
    standbyScreen.classList.remove('hidden');
  }

  // ==========================================
  // 6. BACKGROUND PARTICLES CANVAS
  // ==========================================
  const canvas = document.getElementById('display-bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const PARTICLE_COUNT = 45;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.5,
        speedY: Math.random() * 0.4 + 0.1,
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.7 + 0.2,
        pulse: Math.random() * 0.02 + 0.005
      });
    }

    function renderParticles() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.y -= p.speedY;
        p.x += p.speedX;
        p.opacity += Math.sin(Date.now() * p.pulse) * 0.008;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${Math.max(0.1, Math.min(0.9, p.opacity))})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#d4af37';
        ctx.fill();
      });
      requestAnimationFrame(renderParticles);
    }

    renderParticles();
  }

  // ==========================================
  // 7. KONTROL FULLSCREEN & SUARA
  // ==========================================
  if (btnToggleFullscreen) {
    btnToggleFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

    if (e.key === 'F11') {
      return; // Biarkan browser menangani F11 native
    }
  });

  if (btnToggleMute) {
    btnToggleMute.addEventListener('click', () => {
      window.GradAudio.isMuted = !window.GradAudio.isMuted;
      btnToggleMute.innerHTML = window.GradAudio.isMuted ? '🔇' : '🔔';
      btnToggleMute.title = window.GradAudio.isMuted ? 'Suara Senyap' : 'Suara Aktif';
    });
  }

  window.addEventListener('click', () => {
    window.GradAudio.ensureAudioContext();
  }, { once: true });

  // ==========================================
  // 8. MODAL TES / SIMULASI SCAN BARCODE DI DISPLAY
  // ==========================================
  const btnManualScanModal = document.getElementById('btn-manual-scan-modal');
  const testScanModal = document.getElementById('display-test-scan-modal');
  const manualScanInput = document.getElementById('manual-scan-input');
  const btnSubmitManualScan = document.getElementById('btn-submit-manual-scan');
  const btnCloseTestScan = document.getElementById('btn-close-test-scan');
  const quickScanChips = document.getElementById('quick-scan-student-chips');

  function renderQuickScanChips() {
    if (!quickScanChips || !studentsData || studentsData.length === 0) return;
    quickScanChips.innerHTML = studentsData.slice(0, 10).map(s => `
      <button type="button" class="chip-btn" data-nim="${s.nim}" style="background: rgba(212,175,55,0.15); border: 1px solid rgba(212,175,55,0.4); color: #f7e394; padding: 0.35rem 0.65rem; border-radius: 6px; font-size: 0.75rem; cursor: pointer; text-align: left; transition: all 0.2s;">
        <strong>${s.nim}</strong> - ${s.nama.split(' ')[0]} (${s.prodi || 'Wisudawan'})
      </button>
    `).join('');

    quickScanChips.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const nim = btn.getAttribute('data-nim');
        if (nim) {
          if (testScanModal) testScanModal.style.display = 'none';
          handleDirectScan(nim);
        }
      });
    });
  }

  if (btnManualScanModal) {
    btnManualScanModal.addEventListener('click', () => {
      renderQuickScanChips();
      if (testScanModal) {
        testScanModal.style.display = 'flex';
        setTimeout(() => {
          if (manualScanInput) {
            manualScanInput.value = '';
            manualScanInput.focus();
          }
        }, 50);
      }
    });
  }

  function doSubmitManualScan() {
    if (!manualScanInput) return;
    const val = manualScanInput.value.trim();
    if (val) {
      if (testScanModal) testScanModal.style.display = 'none';
      handleDirectScan(val);
      manualScanInput.value = '';
    }
  }

  if (btnSubmitManualScan) {
    btnSubmitManualScan.addEventListener('click', doSubmitManualScan);
  }

  if (manualScanInput) {
    manualScanInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doSubmitManualScan();
      }
    });
  }

  if (btnCloseTestScan) {
    btnCloseTestScan.addEventListener('click', () => {
      if (testScanModal) testScanModal.style.display = 'none';
    });
  }

  if (testScanModal) {
    testScanModal.addEventListener('click', (e) => {
      if (e.target === testScanModal) {
        testScanModal.style.display = 'none';
      }
    });
  }

  // ==========================================
  // 9. KAMERA SCANNER OPSIONAL DI LAYAR DISPLAY
  // ==========================================
  const btnToggleCamDisplay = document.getElementById('btn-toggle-cam-display');
  const displayCamModal = document.getElementById('display-cam-modal');
  const btnCloseDisplayCam = document.getElementById('btn-close-display-cam');
  let displayHtml5Qr = null;

  async function startDisplayCamera() {
    if (typeof Html5Qrcode === 'undefined') {
      alert('Library kamera belum siap.');
      return;
    }
    if (displayCamModal) displayCamModal.style.display = 'flex';
    try {
      displayHtml5Qr = new Html5Qrcode('display-cam-reader');
      await displayHtml5Qr.start(
        { facingMode: 'environment' },
        { fps: 15, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          stopDisplayCamera();
          handleDirectScan(decodedText);
        },
        () => {}
      );
    } catch (e) {
      alert('Tidak dapat mengakses kamera: ' + (e.message || e));
      stopDisplayCamera();
    }
  }

  async function stopDisplayCamera() {
    if (displayHtml5Qr) {
      try {
        await displayHtml5Qr.stop();
        displayHtml5Qr.clear();
      } catch (e) {}
      displayHtml5Qr = null;
    }
    if (displayCamModal) displayCamModal.style.display = 'none';
  }

  if (btnToggleCamDisplay) {
    btnToggleCamDisplay.addEventListener('click', () => {
      startDisplayCamera();
    });
  }

  if (btnCloseDisplayCam) {
    btnCloseDisplayCam.addEventListener('click', () => {
      stopDisplayCamera();
    });
  }
});
