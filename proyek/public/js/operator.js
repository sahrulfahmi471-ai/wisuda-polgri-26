/**
 * OPERATOR CONTROLLER SCRIPT
 * Mengatur pemindai barcode fisik, kamera webcam, manajemen pendaftaran mahasiswa,
 * kustomisasi pengaturan panggung, import/export CSV, dan sinkronisasi real-time.
 */

document.addEventListener('DOMContentLoaded', () => {
  const sync = new WisudaSyncClient('operator');
  let studentsData = [];
  let currentScannedStudent = null;
  let html5QrScanner = null;
  let isCameraScanning = false;
  let currentSettings = {};

  // Elemen Header & Stats
  const connStatusBadge = document.getElementById('conn-status-badge');
  const countTotalEl = document.getElementById('count-total');
  const countPresentEl = document.getElementById('count-present');
  const countPendingEl = document.getElementById('count-pending');
  const headerUnivName = document.getElementById('header-univ-name');

  // Elemen Scanner Fisik & Input
  const usbInput = document.getElementById('usb-barcode-input');
  const autofocusCheck = document.getElementById('check-autofocus');
  const gunStatusCard = document.getElementById('gun-status-card');
  const scannerReadyBadge = document.getElementById('scanner-ready-badge');
  const btnToggleCamera = document.getElementById('btn-toggle-camera');
  const cameraSelect = document.getElementById('camera-select');
  const cameraPlaceholder = document.getElementById('camera-placeholder');

  // Preview Card DOM
  const activePreviewCard = document.getElementById('active-preview-card');
  const activePhoto = document.getElementById('active-photo');
  const activeName = document.getElementById('active-name');
  const activeNimProdi = document.getElementById('active-nim-prodi');
  const activeBadge = document.getElementById('active-badge');

  // Database Table & Filter
  const tableBody = document.getElementById('student-table-body');
  const searchInput = document.getElementById('search-input');
  const filterFakultas = document.getElementById('filter-fakultas');

  // Tombol Kontrol Panggung Cepat
  const btnTriggerStandby = document.getElementById('btn-trigger-standby');
  const btnTestChime = document.getElementById('btn-test-chime');
  const btnTestTTS = document.getElementById('btn-test-tts');
  const btnResendActive = document.getElementById('btn-resend-active');
  const btnSimulateNext = document.getElementById('btn-simulate-next');
  const btnSimulateRandom = document.getElementById('btn-simulate-random');
  const btnResetAll = document.getElementById('btn-reset-all');

  // Modal Pendaftaran Mahasiswa
  const btnOpenRegisterModal = document.getElementById('btn-open-register-modal');
  const registerModal = document.getElementById('register-modal');
  const formRegisterStudent = document.getElementById('form-register-student');
  const modalFormTitle = document.getElementById('modal-form-title');
  const editOriginalNim = document.getElementById('edit-original-nim');
  const regNim = document.getElementById('reg-nim');
  const regNama = document.getElementById('reg-nama');
  const regFakultas = document.getElementById('reg-fakultas');
  const regProdi = document.getElementById('reg-prodi');
  const regIpk = document.getElementById('reg-ipk');
  const regPredikat = document.getElementById('reg-predikat');
  const regIsCumlaude = document.getElementById('reg-is-cumlaude');
  const regOrangtua = document.getElementById('reg-orangtua');
  const regAsal = document.getElementById('reg-asal');
  const regTempatKerja = document.getElementById('reg-tempat-kerja');
  const regSkripsi = document.getElementById('reg-skripsi');
  const regFilePhoto = document.getElementById('reg-file-photo');
  const regUrlPhoto = document.getElementById('reg-url-photo');
  const regPhotoPreview = document.getElementById('reg-photo-preview');

  // Modal Pengaturan (Settings)
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const settingsModal = document.getElementById('settings-modal');
  const btnSaveSettings = document.getElementById('btn-save-settings');

  // Modal Import CSV
  const btnOpenImportModal = document.getElementById('btn-open-import-modal');
  const importModal = document.getElementById('import-modal');
  const btnDownloadCsvTemplate = document.getElementById('btn-download-csv-template');
  const csvFileInput = document.getElementById('csv-file-input');
  const csvFileName = document.getElementById('csv-file-name');
  const csvImportMode = document.getElementById('csv-import-mode');
  const csvPreviewContainer = document.getElementById('csv-preview-container');
  const csvPreviewText = document.getElementById('csv-preview-text');
  const btnProcessImport = document.getElementById('btn-process-import');
  const btnExportCsv = document.getElementById('btn-export-csv');

  let parsedCsvData = [];

  // ==========================================
  // 1. SINKRONISASI REAL-TIME
  // ==========================================
  sync.on('connection_status', (data) => {
    if (data.connected) {
      connStatusBadge.innerHTML = `<span class="status-dot active"></span> Server Online (${data.socketId ? data.socketId.substr(0, 5) : 'OK'})`;
      connStatusBadge.className = 'badge badge-present';
    } else {
      connStatusBadge.innerHTML = `<span class="status-dot inactive"></span> Mode Tab Lokal`;
      connStatusBadge.className = 'badge badge-pending';
    }
  });

  sync.on('students_updated', (updatedList) => {
    studentsData = updatedList;
    renderTable();
    updateStats();
  });

  sync.on('settings_updated', (settings) => {
    currentSettings = settings;
    if (headerUnivName && settings.univName) {
      headerUnivName.textContent = settings.univName;
    }
  });

  sync.on('show_student', (payload) => {
    if (payload && payload.student) {
      displayScannedStudentPreview(payload.student);
    }
  });

  // ==========================================
  // 2. PEMINDAIAN BARCODE ALAT SCAN FISIK (USB / GUN)
  // ==========================================
  WisudaScannerHelper.attachHardwareScanner(window, (scannedCode) => {
    const isModalOpen = (registerModal && registerModal.classList.contains('active')) ||
                        (settingsModal && settingsModal.classList.contains('active')) ||
                        (importModal && importModal.classList.contains('active'));
    if (isModalOpen) return;

    console.log('[Operator Scanner] Kode terbaca:', scannedCode);
    triggerStudent(scannedCode);
    if (usbInput) usbInput.value = '';
  });

  // Handler input box scanner manual
  if (usbInput) {
    usbInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = usbInput.value.trim();
        if (value) {
          triggerStudent(value);
          usbInput.value = '';
        }
      }
    });

    // Pertahankan fokus otomatis ke input scanner
    setInterval(() => {
      if (autofocusCheck && autofocusCheck.checked) {
        const active = document.activeElement;
        const isTypingSomewhere = active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);
        const isModalOpen = (registerModal && registerModal.classList.contains('active')) ||
                            (settingsModal && settingsModal.classList.contains('active')) ||
                            (importModal && importModal.classList.contains('active'));

        if (!isTypingSomewhere && !isModalOpen && active !== usbInput) {
          usbInput.focus();
        }
      }
    }, 1200);
  }

  // ==========================================
  // 3. PEMICU TAMPILAN WISUDAWAN
  // ==========================================
  window.triggerStudent = function(nimOrBarcode) {
    if (!nimOrBarcode) return;

    // Efek visual scanner fisik sedang menembak
    if (gunStatusCard) {
      gunStatusCard.classList.add('scanning');
      setTimeout(() => gunStatusCard.classList.remove('scanning'), 400);
    }

    // Cari di daftar mahasiswa menggunakan helper pencocokan cerdas
    const found = WisudaScannerHelper.findStudent(studentsData, nimOrBarcode);

    if (found) {
      // Bunyikan pip! konfirmasi pada scanner
      window.GradAudio.playScannerBeep();

      // Perbarui status kehadiran
      found.status = 'Sudah Maju';
      found.waktuScan = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Kirim event ke seluruh klien (Tab Layar Panggung & Display)
      sync.sendShowStudent(found, { settings: currentSettings });

      // Jika soundLocation diatur 'operator' atau 'both', bunyikan juga di laptop operator
      if (currentSettings.soundLocation === 'operator' || currentSettings.soundLocation === 'both') {
        if (found.isCumlaude) {
          window.GradAudio.playCumLaudeFanfare();
        } else {
          window.GradAudio.playCeremonyChime();
        }
        window.GradAudio.speakStudent(found, currentSettings.ttsTemplate);
      }

      displayScannedStudentPreview(found);
      renderTable();
      updateStats();

      if (usbInput) {
        usbInput.value = '';
        if (autofocusCheck && autofocusCheck.checked) usbInput.focus();
      }
    } else {
      // Bunyikan buzzer tanda barcode tidak dikenal
      window.GradAudio.playWarningBuzzer();
      const clean = WisudaScannerHelper.cleanQuery(nimOrBarcode);
      alert(`⚠️ Mahasiswa dengan Barcode/NIM "${clean || nimOrBarcode}" belum terdaftar dalam sistem!\nSilakan klik "Daftarkan Mahasiswa" untuk menambahkannya.`);
      if (usbInput) usbInput.select();
    }
  };

  function displayScannedStudentPreview(student) {
    currentScannedStudent = student;
    if (activePreviewCard) activePreviewCard.style.display = 'block';
    if (activePhoto) activePhoto.src = student.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';
    if (activeName) activeName.textContent = student.nama;
    if (activeNimProdi) activeNimProdi.textContent = `${student.nim} • ${student.prodi}`;
    if (activeBadge) {
      if (student.isCumlaude) {
        activeBadge.className = 'badge badge-cumlaude';
        activeBadge.textContent = '★ CUM LAUDE';
      } else {
        activeBadge.className = 'badge badge-present';
        activeBadge.textContent = student.predikat || 'LULUS';
      }
    }
  }

  // ==========================================
  // 4. LOAD DATA WISUDAWAN & PENGATURAN
  // ==========================================
  async function fetchStudents() {
    try {
      const res = await fetch('/api/students');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        studentsData = json.data;
      }
    } catch (err) {
      try {
        const fallbackRes = await fetch('./data/students.json');
        studentsData = await fallbackRes.json();
      } catch (e) {}
    }
    populateFakultasFilter();
    renderTable();
    updateStats();
  }

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success && json.data) {
        currentSettings = json.data;
        if (headerUnivName && currentSettings.univName) {
          headerUnivName.textContent = currentSettings.univName;
        }
      }
    } catch (e) {}
  }

  function updateStats() {
    const total = studentsData.length;
    const present = studentsData.filter(s => s.status === 'Sudah Maju').length;
    const pending = total - present;

    if (countTotalEl) countTotalEl.textContent = total;
    if (countPresentEl) countPresentEl.textContent = present;
    if (countPendingEl) countPendingEl.textContent = pending;
  }

  function populateFakultasFilter() {
    if (!filterFakultas) return;
    const fakultasSet = new Set(studentsData.map(s => s.fakultas).filter(Boolean));
    filterFakultas.innerHTML = '<option value="">Semua Fakultas</option>';
    fakultasSet.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f;
      filterFakultas.appendChild(opt);
    });
  }

  // ==========================================
  // 5. RENDER TABEL MAHASISWA & AKSI (EDIT/HAPUS)
  // ==========================================
  function renderTable() {
    if (!tableBody) return;
    const query = (searchInput.value || '').toLowerCase().trim();
    const selectedFakultas = filterFakultas.value;

    const filtered = studentsData.filter(student => {
      const matchSearch =
        student.nim.toString().toLowerCase().includes(query) ||
        student.nama.toLowerCase().includes(query) ||
        (student.prodi && student.prodi.toLowerCase().includes(query));

      const matchFakultas = !selectedFakultas || student.fakultas === selectedFakultas;
      return matchSearch && matchFakultas;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            Tidak ada data mahasiswa yang cocok dengan pencarian.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.map(student => {
      const isPresent = student.status === 'Sudah Maju';
      const isActiveNow = currentScannedStudent && currentScannedStudent.nim === student.nim;

      return `
        <tr class="${isActiveNow ? 'row-active' : ''}">
          <td>
            <div class="student-row-info">
              <img src="${student.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="student-thumb" alt="${student.nama}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'">
              <div>
                <strong style="color: #fff; display: block;">${student.nama}</strong>
                <span style="font-size: 0.75rem; color: var(--gold-400); font-family: monospace;">NIM: ${student.nim}</span>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight: 600; color: #e2e8f0;">${student.prodi || '-'}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${student.fakultas || '-'}</div>
            ${student.tempatKerja && student.tempatKerja !== '-' ? `<div style="margin-top: 3px;"><span style="display: inline-block; background: rgba(16, 185, 129, 0.15); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.3); padding: 1px 6px; border-radius: 4px; font-size: 0.72rem;">🏢 ${student.tempatKerja}</span></div>` : ''}
          </td>
          <td>
            <div style="font-weight: 700; color: #fff;">IPK ${student.ipk || '-'}</div>
            ${student.isCumlaude ? '<span class="badge badge-cumlaude" style="font-size: 0.65rem;">CUM LAUDE</span>' : `<span style="font-size: 0.75rem; color: var(--text-muted);">${student.predikat || ''}</span>`}
          </td>
          <td>
            <span class="badge ${isPresent ? 'badge-present' : 'badge-pending'}">
              ${student.status || 'Belum Maju'}
            </span>
            ${student.waktuScan ? `<div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 3px;">Pukul ${student.waktuScan}</div>` : ''}
          </td>
          <td>
            <div class="action-cell">
              <button class="btn btn-gold btn-sm" onclick="triggerStudent('${student.nim}')" title="Tampilkan ke Layar Panggung">
                🚀 Tampil
              </button>
              <button class="btn btn-secondary btn-sm" onclick="openEditStudentModal('${student.nim}')" title="Edit Data Mahasiswa">
                ✏️
              </button>
              <button class="btn btn-danger btn-sm" onclick="deleteStudent('${student.nim}')" title="Hapus dari Daftar">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ==========================================
  // 6. PENDAFTARAN & EDIT DATA MAHASISWA
  // ==========================================
  function resetRegisterForm() {
    formRegisterStudent.reset();
    editOriginalNim.value = '';
    modalFormTitle.textContent = '➕ Daftarkan Mahasiswa Wisuda';
    regPhotoPreview.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
    regIsCumlaude.checked = false;
    if (regTempatKerja) regTempatKerja.value = '';
  }

  if (btnOpenRegisterModal) {
    btnOpenRegisterModal.addEventListener('click', () => {
      resetRegisterForm();
      registerModal.classList.add('active');
      regNim.focus();
    });
  }

  // Auto-detect Predikat & Cumlaude saat IPK diketik
  if (regIpk) {
    regIpk.addEventListener('input', () => {
      const ipkVal = parseFloat(regIpk.value) || 0;
      if (ipkVal >= 3.80) {
        regPredikat.value = 'DENGAN PUJIAN (CUM LAUDE)';
        regIsCumlaude.checked = true;
      } else if (ipkVal >= 3.50) {
        regPredikat.value = 'SANGAT MEMUASKAN';
        regIsCumlaude.checked = false;
      } else if (ipkVal >= 3.00) {
        regPredikat.value = 'MEMUASKAN';
        regIsCumlaude.checked = false;
      }
    });
  }

  // Pratinjau Foto Upload (Konversi File ke DataURL Base64)
  if (regFilePhoto) {
    regFilePhoto.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          regPhotoPreview.src = evt.target.result;
          regUrlPhoto.value = ''; // Kosongkan URL jika upload file
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (regUrlPhoto) {
    regUrlPhoto.addEventListener('input', () => {
      if (regUrlPhoto.value.trim()) {
        regPhotoPreview.src = regUrlPhoto.value.trim();
      }
    });
  }

  // Edit Mahasiswa
  window.openEditStudentModal = function(nim) {
    const student = studentsData.find(s => s.nim.toString().trim() === nim.toString().trim());
    if (!student) return;

    modalFormTitle.textContent = `✏️ Edit Data: ${student.nama}`;
    editOriginalNim.value = student.nim;
    regNim.value = student.nim;
    regNama.value = student.nama || '';
    regFakultas.value = student.fakultas || '';
    regProdi.value = student.prodi || '';
    regIpk.value = student.ipk || '';
    regPredikat.value = student.predikat || '';
    regIsCumlaude.checked = Boolean(student.isCumlaude);
    regOrangtua.value = student.orangTua || '';
    regAsal.value = student.asalDaerah || '';
    if (regTempatKerja) regTempatKerja.value = student.tempatKerja || '';
    regSkripsi.value = student.judulSkripsi || '';
    regUrlPhoto.value = student.foto || '';
    regPhotoPreview.src = student.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';

    registerModal.classList.add('active');
  };

  // Submit Simpan Pendaftaran / Edit
  if (formRegisterStudent) {
    formRegisterStudent.addEventListener('submit', async (e) => {
      e.preventDefault();

      const studentData = {
        nim: regNim.value.trim(),
        nama: regNama.value.trim(),
        fakultas: regFakultas.value.trim(),
        prodi: regProdi.value.trim(),
        ipk: regIpk.value.trim() || '3.50',
        predikat: regPredikat.value.trim() || (parseFloat(regIpk.value || 0) >= 3.8 ? 'DENGAN PUJIAN (CUM LAUDE)' : 'SANGAT MEMUASKAN'),
        isCumlaude: regIsCumlaude.checked,
        tempatKerja: regTempatKerja ? regTempatKerja.value.trim() : '-',
        orangTua: regOrangtua.value.trim() || '-',
        asalDaerah: regAsal.value.trim() || '-',
        judulSkripsi: regSkripsi.value.trim() || '-',
        foto: regPhotoPreview.src
      };

      const originalNim = editOriginalNim.value;

      try {
        let res;
        if (originalNim) {
          // Edit
          res = await fetch(`/api/students/${originalNim}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
          });
        } else {
          // Tambah Baru
          res = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
          });
        }

        const json = await res.json();
        if (json.success) {
          alert('Data mahasiswa berhasil disimpan!');
        }
      } catch (err) {
        // Fallback simpan lokal
        const existingIdx = studentsData.findIndex(s => s.nim.toString().trim() === studentData.nim);
        if (existingIdx >= 0) {
          studentsData[existingIdx] = { ...studentsData[existingIdx], ...studentData };
        } else {
          studentsData.push({ ...studentData, status: 'Belum Maju', waktuScan: null });
        }
      }

      registerModal.classList.remove('active');
      fetchStudents();
    });
  }

  // Hapus Mahasiswa
  window.deleteStudent = async function(nim) {
    const student = studentsData.find(s => s.nim.toString().trim() === nim.toString().trim());
    const name = student ? student.nama : nim;

    if (confirm(`Yakin ingin menghapus wisudawan "${name}" (${nim}) dari sistem?`)) {
      try {
        await fetch(`/api/students/${nim}`, { method: 'DELETE' });
      } catch (e) {}

      studentsData = studentsData.filter(s => s.nim.toString().trim() !== nim.toString().trim());
      renderTable();
      updateStats();
    }
  };

  // ==========================================
  // 7. KUSTOMISASI PENGATURAN LAYAR & ACARA
  // ==========================================
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener('click', () => {
      // Isi form pengaturan dengan setting saat ini
      document.getElementById('set-univ-name').value = currentSettings.univName || '';
      document.getElementById('set-sub-title').value = currentSettings.subTitle || '';
      document.getElementById('set-session-name').value = currentSettings.sessionName || '';
      document.getElementById('set-standby-msg').value = currentSettings.standbyMessage || '';
      document.getElementById('set-duration-sec').value = currentSettings.displayDuration || 15;
      document.getElementById('set-auto-return').checked = currentSettings.autoReturnStandby !== false;
      document.getElementById('set-sound-location').value = currentSettings.soundLocation || 'display';
      document.getElementById('set-enable-chime').checked = currentSettings.enableChime !== false;
      document.getElementById('set-enable-fanfare').checked = currentSettings.enableCumlaudeFanfare !== false;
      document.getElementById('set-enable-tts').checked = currentSettings.enableTTS !== false;
      document.getElementById('set-tts-template').value = currentSettings.ttsTemplate || '{nama}. Program Studi {prodi}. Predikat {predikat}.';
      document.getElementById('set-theme').value = currentSettings.theme || 'royal-gold';

      // Tata Letak Panggung
      if (document.getElementById('set-display-layout')) {
        document.getElementById('set-display-layout').value = currentSettings.displayLayout || 'centered';
      }

      // Visibility Elemen Biodata
      if (document.getElementById('set-show-name')) document.getElementById('set-show-name').checked = currentSettings.showName !== false;
      if (document.getElementById('set-show-nim')) document.getElementById('set-show-nim').checked = currentSettings.showNim !== false;
      if (document.getElementById('set-show-prodi')) document.getElementById('set-show-prodi').checked = currentSettings.showProdi !== false;
      if (document.getElementById('set-show-kerja')) document.getElementById('set-show-kerja').checked = currentSettings.showKerja !== false;
      if (document.getElementById('set-show-ipk')) document.getElementById('set-show-ipk').checked = currentSettings.showIpk !== false;
      if (document.getElementById('set-show-predikat')) document.getElementById('set-show-predikat').checked = currentSettings.showPredikat !== false;
      if (document.getElementById('set-show-faculty')) document.getElementById('set-show-faculty').checked = currentSettings.showFaculty !== false;
      if (document.getElementById('set-show-photo')) document.getElementById('set-show-photo').checked = currentSettings.showPhoto !== false;
      if (document.getElementById('set-show-parents')) document.getElementById('set-show-parents').checked = currentSettings.showParents === true;
      if (document.getElementById('set-show-origin')) document.getElementById('set-show-origin').checked = currentSettings.showOrigin === true;
      if (document.getElementById('set-show-thesis')) document.getElementById('set-show-thesis').checked = currentSettings.showThesis === true;

      // Kostumisasi Foto
      if (document.getElementById('set-photo-shape')) document.getElementById('set-photo-shape').value = currentSettings.photoShape || 'circle';
      if (document.getElementById('set-photo-size')) document.getElementById('set-photo-size').value = currentSettings.photoSize || 'medium';
      if (document.getElementById('set-photo-border-color')) document.getElementById('set-photo-border-color').value = currentSettings.photoBorderColor || '#d4af37';
      if (document.getElementById('set-photo-border-hex')) document.getElementById('set-photo-border-hex').value = currentSettings.photoBorderColor || '#d4af37';
      if (document.getElementById('set-photo-ring-effect')) document.getElementById('set-photo-ring-effect').value = currentSettings.photoRingEffect || 'rotating';

      // Kostumisasi Ambient Light
      if (document.getElementById('set-ambient-enabled')) document.getElementById('set-ambient-enabled').checked = currentSettings.ambientLightEnabled !== false;
      if (document.getElementById('set-ambient-color')) document.getElementById('set-ambient-color').value = currentSettings.ambientLightColor || '#d4af37';
      if (document.getElementById('set-ambient-hex')) document.getElementById('set-ambient-hex').value = currentSettings.ambientLightColor || '#d4af37';
      if (document.getElementById('set-ambient-anim')) document.getElementById('set-ambient-anim').value = currentSettings.ambientLightAnimation || 'breathe';
      if (document.getElementById('set-ambient-radius')) document.getElementById('set-ambient-radius').value = currentSettings.ambientLightRadius || '60';
      if (document.getElementById('set-ambient-intensity')) document.getElementById('set-ambient-intensity').value = currentSettings.ambientLightIntensity || '0.75';

      // 🌈 Kostumisasi Warna Layar Display, Bingkai & Biodata
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
      };

      setVal('set-disp-bg1', currentSettings.dispBgColor1 || '#152243');
      setVal('set-disp-bg1-hex', currentSettings.dispBgColor1 || '#152243');
      setVal('set-disp-bg2', currentSettings.dispBgColor2 || '#050814');
      setVal('set-disp-bg2-hex', currentSettings.dispBgColor2 || '#050814');
      setVal('set-disp-card-bg', currentSettings.dispCardBg || '#10192d');
      setVal('set-disp-card-bg-hex', currentSettings.dispCardBg || '#10192d');
      
      const cardOp = currentSettings.dispCardOpacity !== undefined ? currentSettings.dispCardOpacity : 0.94;
      setVal('set-disp-card-opacity', cardOp);
      if (document.getElementById('label-card-opacity')) {
        document.getElementById('label-card-opacity').textContent = `${Math.round(cardOp * 100)}%`;
      }

      setVal('set-stage-border-color', currentSettings.stageBorderColor || '#d4af37');
      setVal('set-stage-border-hex', currentSettings.stageBorderColor || '#d4af37');
      setVal('set-stage-border-glow', currentSettings.stageBorderGlow || currentSettings.stageBorderColor || '#d4af37');
      setVal('set-stage-border-glow-hex', currentSettings.stageBorderGlow || currentSettings.stageBorderColor || '#d4af37');
      setVal('set-card-border-color', currentSettings.cardBorderColor || '#d4af37');
      setVal('set-card-border-hex', currentSettings.cardBorderColor || '#d4af37');
      setVal('set-card-glow-color', currentSettings.cardGlowColor || currentSettings.cardBorderColor || '#d4af37');
      setVal('set-card-glow-hex', currentSettings.cardGlowColor || currentSettings.cardBorderColor || '#d4af37');

      setVal('set-bio-name-color', currentSettings.bioNameColor || '#ffffff');
      setVal('set-bio-name-hex', currentSettings.bioNameColor || '#ffffff');
      setVal('set-bio-prodi-color', currentSettings.bioProdiColor || '#93c5fd');
      setVal('set-bio-prodi-hex', currentSettings.bioProdiColor || '#93c5fd');
      setVal('set-bio-faculty-color', currentSettings.bioFacultyColor || '#f7e394');
      setVal('set-bio-faculty-hex', currentSettings.bioFacultyColor || '#f7e394');
      setVal('set-bio-nim-color', currentSettings.bioNimColor || '#ffffff');
      setVal('set-bio-nim-hex', currentSettings.bioNimColor || '#ffffff');
      setVal('set-bio-ipk-color', currentSettings.bioIpkColor || '#67e8f9');
      setVal('set-bio-ipk-hex', currentSettings.bioIpkColor || '#67e8f9');
      setVal('set-bio-predikat-color', currentSettings.bioPredikatColor || '#d4af37');
      setVal('set-bio-predikat-hex', currentSettings.bioPredikatColor || '#d4af37');
      setVal('set-bio-detail-color', currentSettings.bioDetailColor || '#cbd5e1');
      setVal('set-bio-detail-hex', currentSettings.bioDetailColor || '#cbd5e1');

      updatePhotoSettingPreview();
      updateLiveColorPreview();

      settingsModal.classList.add('active');
    });
  }

  const btnOpenColors = document.getElementById('btn-open-colors');
  if (btnOpenColors && btnOpenSettings) {
    btnOpenColors.addEventListener('click', () => {
      btnOpenSettings.click();
      setTimeout(() => {
        const colorTabBtn = document.querySelector('.settings-tab-btn[data-target="tab-set-colors"]');
        if (colorTabBtn) colorTabBtn.click();
      }, 10);
    });
  }

  // Live preview photo setting listeners
  const setPhotoShape = document.getElementById('set-photo-shape');
  const setPhotoBorderColor = document.getElementById('set-photo-border-color');
  const setPhotoBorderHex = document.getElementById('set-photo-border-hex');
  const setAmbientEnabled = document.getElementById('set-ambient-enabled');
  const setAmbientColor = document.getElementById('set-ambient-color');
  const setAmbientHex = document.getElementById('set-ambient-hex');
  const setAmbientRadius = document.getElementById('set-ambient-radius');
  const setAmbientIntensity = document.getElementById('set-ambient-intensity');

  if (setPhotoShape) setPhotoShape.addEventListener('change', updatePhotoSettingPreview);
  if (setPhotoBorderColor) {
    setPhotoBorderColor.addEventListener('input', (e) => {
      if (setPhotoBorderHex) setPhotoBorderHex.value = e.target.value;
      updatePhotoSettingPreview();
    });
  }
  if (setPhotoBorderHex) {
    setPhotoBorderHex.addEventListener('input', (e) => {
      if (setPhotoBorderColor) setPhotoBorderColor.value = e.target.value;
      updatePhotoSettingPreview();
    });
  }

  if (setAmbientEnabled) setAmbientEnabled.addEventListener('change', updatePhotoSettingPreview);
  if (setAmbientColor) {
    setAmbientColor.addEventListener('input', (e) => {
      if (setAmbientHex) setAmbientHex.value = e.target.value;
      updatePhotoSettingPreview();
    });
  }
  if (setAmbientHex) {
    setAmbientHex.addEventListener('input', (e) => {
      if (setAmbientColor) setAmbientColor.value = e.target.value;
      updatePhotoSettingPreview();
    });
  }
  if (setAmbientRadius) setAmbientRadius.addEventListener('change', updatePhotoSettingPreview);
  if (setAmbientIntensity) setAmbientIntensity.addEventListener('change', updatePhotoSettingPreview);

  function updatePhotoSettingPreview() {
    const shape = document.getElementById('set-photo-shape')?.value || 'circle';
    const color = document.getElementById('set-photo-border-color')?.value || '#d4af37';
    const box = document.getElementById('photo-setting-preview-box');
    const img = document.getElementById('photo-setting-preview-img');
    const ambient = document.getElementById('photo-setting-preview-ambient');

    if (box && img) {
      if (shape === 'circle') {
        box.style.borderRadius = '50%';
        img.style.borderRadius = '50%';
        box.style.aspectRatio = '1/1';
        box.style.clipPath = 'none';
        img.style.clipPath = 'none';
        if (ambient) {
          ambient.style.borderRadius = '50%';
          ambient.style.clipPath = 'none';
        }
      } else if (shape === 'rounded') {
        box.style.borderRadius = '24px';
        img.style.borderRadius = '20px';
        box.style.aspectRatio = '1/1';
        box.style.clipPath = 'none';
        img.style.clipPath = 'none';
        if (ambient) {
          ambient.style.borderRadius = '28px';
          ambient.style.clipPath = 'none';
        }
      } else if (shape === 'portrait') {
        box.style.borderRadius = '16px';
        img.style.borderRadius = '12px';
        box.style.aspectRatio = '3/4';
        box.style.clipPath = 'none';
        img.style.clipPath = 'none';
        if (ambient) {
          ambient.style.borderRadius = '20px';
          ambient.style.clipPath = 'none';
        }
      } else if (shape === 'square') {
        box.style.borderRadius = '8px';
        img.style.borderRadius = '6px';
        box.style.aspectRatio = '1/1';
        box.style.clipPath = 'none';
        img.style.clipPath = 'none';
        if (ambient) {
          ambient.style.borderRadius = '12px';
          ambient.style.clipPath = 'none';
        }
      } else if (shape === 'hexagon') {
        box.style.clipPath = 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)';
        img.style.clipPath = 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)';
        box.style.borderRadius = '0';
        img.style.borderRadius = '0';
        if (ambient) {
          ambient.style.clipPath = 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)';
          ambient.style.borderRadius = '0';
        }
      }

      box.style.background = `linear-gradient(135deg, #ffffff 0%, ${color} 50%, #000000 100%)`;
      box.style.boxShadow = `0 0 15px ${color}80`;

      // Update Ambient Halo Preview
      if (ambient) {
        const ambEnabled = document.getElementById('set-ambient-enabled') ? document.getElementById('set-ambient-enabled').checked : true;
        const ambColor = document.getElementById('set-ambient-color')?.value || color;
        const ambRadius = parseInt(document.getElementById('set-ambient-radius')?.value || 60, 10);
        const ambIntensity = parseFloat(document.getElementById('set-ambient-intensity')?.value || 0.75);

        if (ambEnabled) {
          ambient.style.display = 'block';
          ambient.style.background = `radial-gradient(circle, ${ambColor} 0%, transparent 70%)`;
          ambient.style.filter = `blur(${Math.round(ambRadius * 0.45)}px)`;
          ambient.style.opacity = ambIntensity;
        } else {
          ambient.style.display = 'none';
        }
      }
    }
  }

  window.setPresetPhotoColor = function(color) {
    const cp = document.getElementById('set-photo-border-color');
    const hex = document.getElementById('set-photo-border-hex');
    if (cp) cp.value = color;
    if (hex) hex.value = color;
    updatePhotoSettingPreview();
  };

  window.setPresetAmbientColor = function(color) {
    const cp = document.getElementById('set-ambient-color');
    const hex = document.getElementById('set-ambient-hex');
    if (cp) cp.value = color;
    if (hex) hex.value = color;
    updatePhotoSettingPreview();
  };

  // Tab switching di modal settings
  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.settings-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');
    });
  });

  // ==========================================
  // KOSTUMISASI WARNA: LAYAR SCAN DISPLAY, BINGKAI & BIODATA
  // ==========================================
  function hexToRgbaStr(hex, alpha) {
    if (!hex || typeof hex !== 'string') return `rgba(212, 175, 55, ${alpha})`;
    let c = hex.replace('#', '').trim();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6) return `rgba(212, 175, 55, ${alpha})`;
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }

  function bindColorSync(colorId, hexId) {
    const cEl = document.getElementById(colorId);
    const hEl = document.getElementById(hexId);
    if (cEl && hEl) {
      cEl.addEventListener('input', (e) => {
        hEl.value = e.target.value;
        updateLiveColorPreview();
      });
      hEl.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          cEl.value = val;
        }
        updateLiveColorPreview();
      });
    }
  }

  bindColorSync('set-disp-bg1', 'set-disp-bg1-hex');
  bindColorSync('set-disp-bg2', 'set-disp-bg2-hex');
  bindColorSync('set-disp-card-bg', 'set-disp-card-bg-hex');
  bindColorSync('set-stage-border-color', 'set-stage-border-hex');
  bindColorSync('set-stage-border-glow', 'set-stage-border-glow-hex');
  bindColorSync('set-card-border-color', 'set-card-border-hex');
  bindColorSync('set-card-glow-color', 'set-card-glow-hex');
  bindColorSync('set-bio-name-color', 'set-bio-name-hex');
  bindColorSync('set-bio-prodi-color', 'set-bio-prodi-hex');
  bindColorSync('set-bio-faculty-color', 'set-bio-faculty-hex');
  bindColorSync('set-bio-nim-color', 'set-bio-nim-hex');
  bindColorSync('set-bio-ipk-color', 'set-bio-ipk-hex');
  bindColorSync('set-bio-predikat-color', 'set-bio-predikat-hex');
  bindColorSync('set-bio-detail-color', 'set-bio-detail-hex');

  const cardOpacityEl = document.getElementById('set-disp-card-opacity');
  if (cardOpacityEl) {
    cardOpacityEl.addEventListener('input', (e) => {
      const lbl = document.getElementById('label-card-opacity');
      if (lbl) lbl.textContent = `${Math.round(e.target.value * 100)}%`;
      updateLiveColorPreview();
    });
  }

  function updateLiveColorPreview() {
    const bg1 = document.getElementById('set-disp-bg1')?.value || '#152243';
    const bg2 = document.getElementById('set-disp-bg2')?.value || '#050814';
    const cardBg = document.getElementById('set-disp-card-bg')?.value || '#10192d';
    const opacity = parseFloat(document.getElementById('set-disp-card-opacity')?.value || '0.94');
    const stageBorder = document.getElementById('set-stage-border-color')?.value || '#d4af37';
    const stageGlow = document.getElementById('set-stage-border-glow')?.value || stageBorder;
    const cardBorder = document.getElementById('set-card-border-color')?.value || '#d4af37';
    const cardGlow = document.getElementById('set-card-glow-color')?.value || cardBorder;
    const photoBorder = document.getElementById('set-photo-border-color')?.value || '#d4af37';

    const bioName = document.getElementById('set-bio-name-color')?.value || '#ffffff';
    const bioProdi = document.getElementById('set-bio-prodi-color')?.value || '#93c5fd';
    const bioFaculty = document.getElementById('set-bio-faculty-color')?.value || '#f7e394';
    const bioNim = document.getElementById('set-bio-nim-color')?.value || '#ffffff';
    const bioIpk = document.getElementById('set-bio-ipk-color')?.value || '#67e8f9';
    const bioPredikat = document.getElementById('set-bio-predikat-color')?.value || '#d4af37';
    const bioDetail = document.getElementById('set-bio-detail-color')?.value || '#cbd5e1';

    // 1. Stage Background
    const stageEl = document.getElementById('mini-stage-preview');
    if (stageEl) {
      stageEl.style.background = `radial-gradient(circle at 50% 30%, ${bg1} 0%, ${bg2} 100%)`;
    }

    // 2. Stage Border & Corners
    const stageBorderEl = document.getElementById('mini-preview-stage-border');
    if (stageBorderEl) {
      stageBorderEl.style.borderColor = stageBorder;
      stageBorderEl.style.boxShadow = `0 0 15px ${hexToRgbaStr(stageGlow, 0.4)}`;
    }
    ['tl', 'tr', 'bl', 'br'].forEach(corner => {
      const c = document.getElementById(`mini-preview-corner-${corner}`);
      if (c) {
        if (corner === 'tl') { c.style.borderTopColor = stageBorder; c.style.borderLeftColor = stageBorder; }
        if (corner === 'tr') { c.style.borderTopColor = stageBorder; c.style.borderRightColor = stageBorder; }
        if (corner === 'bl') { c.style.borderBottomColor = stageBorder; c.style.borderLeftColor = stageBorder; }
        if (corner === 'br') { c.style.borderBottomColor = stageBorder; c.style.borderRightColor = stageBorder; }
      }
    });

    // 3. Showcase Card
    const cardEl = document.getElementById('mini-preview-card');
    if (cardEl) {
      cardEl.style.backgroundColor = hexToRgbaStr(cardBg, opacity);
      cardEl.style.borderColor = cardBorder;
      cardEl.style.boxShadow = `0 10px 30px rgba(0,0,0,0.8), 0 0 20px ${hexToRgbaStr(cardGlow, 0.45)}`;
    }

    // 4. Photo ambient & ring
    const photoAmb = document.getElementById('mini-preview-photo-ambient');
    if (photoAmb) {
      photoAmb.style.background = `radial-gradient(circle, ${photoBorder} 0%, transparent 70%)`;
    }
    const photoRing = document.getElementById('mini-preview-photo-ring');
    if (photoRing) {
      photoRing.style.background = `linear-gradient(135deg, #fff 0%, ${photoBorder} 50%, #000 100%)`;
    }

    // 5. Biodata Elements
    const fEl = document.getElementById('mini-preview-faculty');
    if (fEl) {
      fEl.style.borderColor = bioFaculty;
      fEl.style.color = bioFaculty;
      fEl.style.backgroundColor = hexToRgbaStr(bioFaculty, 0.15);
    }
    const nEl = document.getElementById('mini-preview-name');
    if (nEl) nEl.style.color = bioName;
    const pEl = document.getElementById('mini-preview-prodi');
    if (pEl) pEl.style.color = bioProdi;
    const nimEl = document.getElementById('mini-preview-nim');
    if (nimEl) nimEl.style.color = bioNim;
    const ipkEl = document.getElementById('mini-preview-ipk');
    if (ipkEl) ipkEl.style.color = bioIpk;
    const predikatEl = document.getElementById('mini-preview-predikat');
    if (predikatEl) {
      predikatEl.style.color = bioPredikat;
      predikatEl.style.borderColor = bioPredikat;
      predikatEl.style.backgroundColor = hexToRgbaStr(bioPredikat, 0.2);
    }
    const dEl = document.getElementById('mini-preview-detail');
    if (dEl) dEl.style.color = bioDetail;
  }

  const COLOR_PRESETS = {
    'royal-gold': {
      dispBgColor1: '#152243',
      dispBgColor2: '#050814',
      dispCardBg: '#10192d',
      dispCardOpacity: 0.94,
      stageBorderColor: '#d4af37',
      stageBorderGlow: '#d4af37',
      cardBorderColor: '#d4af37',
      cardGlowColor: '#d4af37',
      photoBorderColor: '#d4af37',
      bioNameColor: '#ffffff',
      bioProdiColor: '#93c5fd',
      bioFacultyColor: '#f7e394',
      bioNimColor: '#ffffff',
      bioIpkColor: '#67e8f9',
      bioPredikatColor: '#d4af37',
      bioDetailColor: '#cbd5e1'
    },
    'emerald-green': {
      dispBgColor1: '#0a3325',
      dispBgColor2: '#02140e',
      dispCardBg: '#09291e',
      dispCardOpacity: 0.94,
      stageBorderColor: '#d4af37',
      stageBorderGlow: '#10b981',
      cardBorderColor: '#10b981',
      cardGlowColor: '#10b981',
      photoBorderColor: '#10b981',
      bioNameColor: '#ffffff',
      bioProdiColor: '#a7f3d0',
      bioFacultyColor: '#6ee7b7',
      bioNimColor: '#ffffff',
      bioIpkColor: '#34d399',
      bioPredikatColor: '#fbbf24',
      bioDetailColor: '#d1fae5'
    },
    'ruby-maroon': {
      dispBgColor1: '#420915',
      dispBgColor2: '#130206',
      dispCardBg: '#2b060e',
      dispCardOpacity: 0.94,
      stageBorderColor: '#f6c358',
      stageBorderGlow: '#e11d48',
      cardBorderColor: '#f6c358',
      cardGlowColor: '#f43f5e',
      photoBorderColor: '#f6c358',
      bioNameColor: '#ffffff',
      bioProdiColor: '#fca5a5',
      bioFacultyColor: '#fecdd3',
      bioNimColor: '#ffffff',
      bioIpkColor: '#fb7185',
      bioPredikatColor: '#fbbf24',
      bioDetailColor: '#ffe4e6'
    },
    'cyber-neon': {
      dispBgColor1: '#0a1936',
      dispBgColor2: '#030914',
      dispCardBg: '#081a38',
      dispCardOpacity: 0.94,
      stageBorderColor: '#06b6d4',
      stageBorderGlow: '#06b6d4',
      cardBorderColor: '#06b6d4',
      cardGlowColor: '#06b6d4',
      photoBorderColor: '#06b6d4',
      bioNameColor: '#ffffff',
      bioProdiColor: '#38bdf8',
      bioFacultyColor: '#67e8f9',
      bioNimColor: '#ffffff',
      bioIpkColor: '#22d3ee',
      bioPredikatColor: '#a855f7',
      bioDetailColor: '#bae6fd'
    },
    'obsidian-silver': {
      dispBgColor1: '#1b212d',
      dispBgColor2: '#090b10',
      dispCardBg: '#141822',
      dispCardOpacity: 0.94,
      stageBorderColor: '#cbd5e1',
      stageBorderGlow: '#e2e8f0',
      cardBorderColor: '#cbd5e1',
      cardGlowColor: '#94a3b8',
      photoBorderColor: '#cbd5e1',
      bioNameColor: '#ffffff',
      bioProdiColor: '#e2e8f0',
      bioFacultyColor: '#f1f5f9',
      bioNimColor: '#ffffff',
      bioIpkColor: '#cbd5e1',
      bioPredikatColor: '#f8fafc',
      bioDetailColor: '#94a3b8'
    }
  };

  window.applyColorThemePreset = function(presetKey) {
    const p = COLOR_PRESETS[presetKey];
    if (!p) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };

    setVal('set-disp-bg1', p.dispBgColor1);
    setVal('set-disp-bg1-hex', p.dispBgColor1);
    setVal('set-disp-bg2', p.dispBgColor2);
    setVal('set-disp-bg2-hex', p.dispBgColor2);
    setVal('set-disp-card-bg', p.dispCardBg);
    setVal('set-disp-card-bg-hex', p.dispCardBg);
    setVal('set-disp-card-opacity', p.dispCardOpacity);
    if (document.getElementById('label-card-opacity')) {
      document.getElementById('label-card-opacity').textContent = `${Math.round(p.dispCardOpacity * 100)}%`;
    }

    setVal('set-stage-border-color', p.stageBorderColor);
    setVal('set-stage-border-hex', p.stageBorderColor);
    setVal('set-stage-border-glow', p.stageBorderGlow);
    setVal('set-stage-border-glow-hex', p.stageBorderGlow);
    setVal('set-card-border-color', p.cardBorderColor);
    setVal('set-card-border-hex', p.cardBorderColor);
    setVal('set-card-glow-color', p.cardGlowColor);
    setVal('set-card-glow-hex', p.cardGlowColor);
    setVal('set-photo-border-color', p.photoBorderColor);
    setVal('set-photo-border-hex', p.photoBorderColor);

    setVal('set-bio-name-color', p.bioNameColor);
    setVal('set-bio-name-hex', p.bioNameColor);
    setVal('set-bio-prodi-color', p.bioProdiColor);
    setVal('set-bio-prodi-hex', p.bioProdiColor);
    setVal('set-bio-faculty-color', p.bioFacultyColor);
    setVal('set-bio-faculty-hex', p.bioFacultyColor);
    setVal('set-bio-nim-color', p.bioNimColor);
    setVal('set-bio-nim-hex', p.bioNimColor);
    setVal('set-bio-ipk-color', p.bioIpkColor);
    setVal('set-bio-ipk-hex', p.bioIpkColor);
    setVal('set-bio-predikat-color', p.bioPredikatColor);
    setVal('set-bio-predikat-hex', p.bioPredikatColor);
    setVal('set-bio-detail-color', p.bioDetailColor);
    setVal('set-bio-detail-hex', p.bioDetailColor);

    updateLiveColorPreview();
    updatePhotoSettingPreview();
  };

  const btnResetColors = document.getElementById('btn-reset-default-colors');
  if (btnResetColors) {
    btnResetColors.addEventListener('click', () => {
      window.applyColorThemePreset('royal-gold');
    });
  }

  // Simpan Pengaturan
  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', async () => {
      const updatedSettings = {
        univName: document.getElementById('set-univ-name').value.trim(),
        subTitle: document.getElementById('set-sub-title').value.trim(),
        sessionName: document.getElementById('set-session-name').value.trim(),
        standbyMessage: document.getElementById('set-standby-msg').value.trim(),
        displayDuration: parseInt(document.getElementById('set-duration-sec').value, 10) || 15,
        autoReturnStandby: document.getElementById('set-auto-return').checked,
        soundLocation: document.getElementById('set-sound-location').value,
        enableChime: document.getElementById('set-enable-chime').checked,
        enableCumlaudeFanfare: document.getElementById('set-enable-fanfare').checked,
        enableTTS: document.getElementById('set-enable-tts').checked,
        ttsTemplate: document.getElementById('set-tts-template').value.trim(),
        theme: document.getElementById('set-theme').value,
        displayLayout: document.getElementById('set-display-layout') ? document.getElementById('set-display-layout').value : 'centered',
        showName: document.getElementById('set-show-name') ? document.getElementById('set-show-name').checked : true,
        showNim: document.getElementById('set-show-nim') ? document.getElementById('set-show-nim').checked : true,
        showProdi: document.getElementById('set-show-prodi') ? document.getElementById('set-show-prodi').checked : true,
        showKerja: document.getElementById('set-show-kerja') ? document.getElementById('set-show-kerja').checked : true,
        showIpk: document.getElementById('set-show-ipk') ? document.getElementById('set-show-ipk').checked : true,
        showPredikat: document.getElementById('set-show-predikat') ? document.getElementById('set-show-predikat').checked : true,
        showFaculty: document.getElementById('set-show-faculty') ? document.getElementById('set-show-faculty').checked : true,
        showPhoto: document.getElementById('set-show-photo') ? document.getElementById('set-show-photo').checked : true,
        showParents: document.getElementById('set-show-parents') ? document.getElementById('set-show-parents').checked : false,
        showOrigin: document.getElementById('set-show-origin') ? document.getElementById('set-show-origin').checked : false,
        showThesis: document.getElementById('set-show-thesis') ? document.getElementById('set-show-thesis').checked : false,
        photoShape: document.getElementById('set-photo-shape') ? document.getElementById('set-photo-shape').value : 'circle',
        photoSize: document.getElementById('set-photo-size') ? document.getElementById('set-photo-size').value : 'medium',
        photoBorderColor: document.getElementById('set-photo-border-color') ? document.getElementById('set-photo-border-color').value : '#d4af37',
        photoRingEffect: document.getElementById('set-photo-ring-effect') ? document.getElementById('set-photo-ring-effect').value : 'rotating',
        ambientLightEnabled: document.getElementById('set-ambient-enabled') ? document.getElementById('set-ambient-enabled').checked : true,
        ambientLightColor: document.getElementById('set-ambient-color') ? document.getElementById('set-ambient-color').value : '#d4af37',
        ambientLightRadius: document.getElementById('set-ambient-radius') ? document.getElementById('set-ambient-radius').value : '60',
        ambientLightIntensity: document.getElementById('set-ambient-intensity') ? document.getElementById('set-ambient-intensity').value : '0.75',
        ambientLightAnimation: document.getElementById('set-ambient-anim') ? document.getElementById('set-ambient-anim').value : 'breathe',

        // 🌈 Nilai Kustomisasi Warna
        dispBgColor1: document.getElementById('set-disp-bg1')?.value || '#152243',
        dispBgColor2: document.getElementById('set-disp-bg2')?.value || '#050814',
        dispCardBg: document.getElementById('set-disp-card-bg')?.value || '#10192d',
        dispCardOpacity: parseFloat(document.getElementById('set-disp-card-opacity')?.value || '0.94'),
        stageBorderColor: document.getElementById('set-stage-border-color')?.value || '#d4af37',
        stageBorderGlow: document.getElementById('set-stage-border-glow')?.value || '#d4af37',
        cardBorderColor: document.getElementById('set-card-border-color')?.value || '#d4af37',
        cardGlowColor: document.getElementById('set-card-glow-color')?.value || '#d4af37',
        bioNameColor: document.getElementById('set-bio-name-color')?.value || '#ffffff',
        bioProdiColor: document.getElementById('set-bio-prodi-color')?.value || '#93c5fd',
        bioFacultyColor: document.getElementById('set-bio-faculty-color')?.value || '#f7e394',
        bioNimColor: document.getElementById('set-bio-nim-color')?.value || '#ffffff',
        bioIpkColor: document.getElementById('set-bio-ipk-color')?.value || '#67e8f9',
        bioPredikatColor: document.getElementById('set-bio-predikat-color')?.value || '#d4af37',
        bioDetailColor: document.getElementById('set-bio-detail-color')?.value || '#cbd5e1'
      };

      currentSettings = updatedSettings;

      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSettings)
        });
      } catch (err) {}

      // Kirim lewat socket & broadcast channel instan
      sync.sendSettings(updatedSettings);

      if (headerUnivName && updatedSettings.univName) {
        headerUnivName.textContent = updatedSettings.univName;
      }

      settingsModal.classList.remove('active');
      alert('Pengaturan tampilan panggung & audio berhasil disimpan dan diterapkan!');
    });
  }

  // ==========================================
  // 8. IMPORT & EXPORT DATA CSV
  // ==========================================
  if (btnOpenImportModal) {
    btnOpenImportModal.addEventListener('click', () => {
      parsedCsvData = [];
      csvFileName.textContent = 'Belum ada file yang dipilih';
      csvPreviewContainer.style.display = 'none';
      importModal.classList.add('active');
    });
  }

  // Download Contoh Template CSV
  if (btnDownloadCsvTemplate) {
    btnDownloadCsvTemplate.addEventListener('click', () => {
      const sampleCsv = `nim,nama,fakultas,prodi,ipk,predikat,tempat_kerja,orangtua,asal,skripsi,foto\n202111001,"Ahmad Fauzi Rahman, A.Md.T.","Teknologi Industri","D3 Teknik Mesin",3.88,"DENGAN PUJIAN (CUM LAUDE)","PT Krakatau Steel (Persero) Tbk","Bpk. Mulyadi & Ibu Siti Aminah","Cilegon","Rancang Bangun Alat Uji Ketahanan Bearing","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500"\n202112002,"Siti Nurhaliza, A.Md.Kom.","Teknologi Informasi","D3 Manajemen Informatika",3.94,"DENGAN PUJIAN (CUM LAUDE)","PT Bank Central Asia (BCA) Tbk","Bpk. H. Tb. Syarifuddin & Ibu Hj. Marhamah","Serang","Sistem Informasi Pergudangan Berbasis Web","https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500"`;

      const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_wisudawan_pgri_banten.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Parse File CSV saat dipilih
  if (csvFileInput) {
    csvFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      csvFileName.textContent = `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        parsedCsvData = parseCsvText(text);

        if (parsedCsvData.length > 0) {
          csvPreviewContainer.style.display = 'block';
          csvPreviewText.innerHTML = `Terdeteksi <strong>${parsedCsvData.length} mahasiswa</strong> siap diimpor.<br>Contoh: ${parsedCsvData[0].nama} (${parsedCsvData[0].nim})`;
        } else {
          alert('Format CSV tidak valid atau baris data kosong.');
        }
      };
      reader.readAsText(file);
    });
  }

  function parseCsvText(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const values = [];
      let match;
      while ((match = regex.exec(lines[i])) !== null) {
        let val = match[1];
        if (val === undefined) break;
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/""/g, '"');
        }
        values.push(val.trim());
        if (regex.lastIndex >= lines[i].length) break;
      }

      if (values.length >= 2) {
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx] || '';
        });

        if (obj.nim && obj.nama) {
          rows.push({
            nim: obj.nim,
            nama: obj.nama,
            fakultas: obj.fakultas || 'Fakultas Umum',
            prodi: obj.prodi || 'Program Studi',
            ipk: obj.ipk || '3.50',
            predikat: obj.predikat || (parseFloat(obj.ipk || 0) >= 3.8 ? 'DENGAN PUJIAN (CUM LAUDE)' : 'SANGAT MEMUASKAN'),
            isCumlaude: parseFloat(obj.ipk || 0) >= 3.8 || (obj.predikat && obj.predikat.toLowerCase().includes('cum laude')),
            tempatKerja: obj.tempat_kerja || obj.tempatkerja || obj.perusahaan || '-',
            orangTua: obj.orangtua || obj.orang_tua || '-',
            asalDaerah: obj.asal || obj.asal_daerah || '-',
            judulSkripsi: obj.skripsi || obj.judul_skripsi || '-',
            foto: obj.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'
          });
        }
      }
    }
    return rows;
  }

  // Proses Simpan Import CSV
  if (btnProcessImport) {
    btnProcessImport.addEventListener('click', async () => {
      if (parsedCsvData.length === 0) {
        alert('Silakan pilih file CSV terlebih dahulu.');
        return;
      }

      const mode = csvImportMode.value; // 'append' or 'replace'

      try {
        const res = await fetch('/api/students/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ list: parsedCsvData, mode })
        });
        const json = await res.json();
        alert(json.message || 'Import data massal berhasil!');
      } catch (e) {
        alert('Gagal mengirim ke server.');
      }

      importModal.classList.remove('active');
      fetchStudents();
    });
  }

  // Export ke File CSV
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      if (studentsData.length === 0) {
        alert('Tidak ada data wisudawan untuk diekspor.');
        return;
      }

      let csv = 'nim,nama,fakultas,prodi,ipk,predikat,tempat_kerja,status,waktu_scan,orangtua,asal,skripsi\n';
      studentsData.forEach(s => {
        csv += `"${s.nim}","${s.nama}","${s.fakultas || ''}","${s.prodi || ''}","${s.ipk || ''}","${s.predikat || ''}","${s.tempatKerja || '-'}","${s.status || ''}","${s.waktuScan || ''}","${s.orangTua || ''}","${s.asalDaerah || ''}","${s.judulSkripsi || ''}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data_wisudawan_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Tombol Close Semua Modal
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    });
  });

  // ==========================================
  // 9. KAMERA SCANNER (OPSIONAL WEBCAM)
  // ==========================================
  const tabBtnUsb = document.getElementById('tab-mode-usb');
  const tabBtnCam = document.getElementById('tab-mode-cam');
  const viewUsb = document.getElementById('view-mode-usb');
  const viewCam = document.getElementById('view-mode-cam');

  if (tabBtnUsb && tabBtnCam) {
    tabBtnUsb.addEventListener('click', () => {
      tabBtnUsb.classList.add('active');
      tabBtnCam.classList.remove('active');
      if (viewUsb) viewUsb.style.display = 'flex';
      if (viewCam) viewCam.style.display = 'none';
      if (isCameraScanning) stopCamera();
    });

    tabBtnCam.addEventListener('click', () => {
      tabBtnCam.classList.add('active');
      tabBtnUsb.classList.remove('active');
      if (viewCam) viewCam.style.display = 'flex';
      if (viewUsb) viewUsb.style.display = 'none';
      initCameraList();
    });
  }

  async function initCameraList() {
    if (typeof Html5Qrcode === 'undefined') return;
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length && cameraSelect) {
        cameraSelect.innerHTML = devices.map(d => `<option value="${d.id}">${d.label || 'Kamera ' + d.id}</option>`).join('');
      }
    } catch (err) {}
  }

  async function toggleCamera() {
    if (isCameraScanning) stopCamera();
    else startCamera();
  }

  async function startCamera() {
    if (typeof Html5Qrcode === 'undefined') {
      alert('Library Html5Qrcode belum dimuat.');
      return;
    }
    try {
      const selectedCameraId = cameraSelect.value;
      html5QrScanner = new Html5Qrcode('camera-reader');
      const config = { fps: 15, qrbox: { width: 250, height: 250 } };
      const cameraIdOrConfig = selectedCameraId || { facingMode: 'environment' };

      await html5QrScanner.start(
        cameraIdOrConfig,
        config,
        (decodedText) => {
          triggerStudent(decodedText);
          html5QrScanner.pause(true);
          setTimeout(() => {
            if (isCameraScanning && html5QrScanner) {
              try { html5QrScanner.resume(); } catch (e) {}
            }
          }, 1800);
        },
        () => {}
      );

      isCameraScanning = true;
      if (cameraPlaceholder) cameraPlaceholder.style.display = 'none';
      if (btnToggleCamera) {
        btnToggleCamera.innerHTML = '⏹ Hentikan Kamera';
        btnToggleCamera.className = 'btn btn-danger';
      }
    } catch (err) {
      alert('Gagal menyalakan kamera: ' + (err.message || err));
      stopCamera();
    }
  }

  async function stopCamera() {
    if (html5QrScanner) {
      try {
        await html5QrScanner.stop();
        html5QrScanner.clear();
      } catch (err) {}
      html5QrScanner = null;
    }
    isCameraScanning = false;
    if (cameraPlaceholder) cameraPlaceholder.style.display = 'flex';
    if (btnToggleCamera) {
      btnToggleCamera.innerHTML = '📹 Nyalakan Kamera';
      btnToggleCamera.className = 'btn btn-gold';
    }
  }

  if (btnToggleCamera) btnToggleCamera.addEventListener('click', toggleCamera);

  // ==========================================
  // 10. KONTROL PANGGUNG MANUAL
  // ==========================================
  if (btnTriggerStandby) {
    btnTriggerStandby.addEventListener('click', () => {
      sync.sendStandby();
    });
  }

  if (btnTestChime) {
    btnTestChime.addEventListener('click', () => {
      window.GradAudio.playCeremonyChime();
      sync.sendPlaySound('chime');
    });
  }

  if (btnTestTTS) {
    btnTestTTS.addEventListener('click', () => {
      if (currentScannedStudent) {
        window.GradAudio.speakStudent(currentScannedStudent, currentSettings.ttsTemplate);
      } else if (studentsData.length > 0) {
        window.GradAudio.speakStudent(studentsData[0], currentSettings.ttsTemplate);
      } else {
        alert('Belum ada data mahasiswa.');
      }
    });
  }

  if (btnResendActive) {
    btnResendActive.addEventListener('click', () => {
      if (currentScannedStudent) {
        sync.sendShowStudent(currentScannedStudent, { settings: currentSettings });
      }
    });
  }

  if (btnSimulateNext) {
    btnSimulateNext.addEventListener('click', () => {
      const nextStudent = studentsData.find(s => s.status !== 'Sudah Maju');
      if (nextStudent) {
        triggerStudent(nextStudent.nim);
      } else {
        alert('Semua wisudawan sudah dipanggil / maju!');
      }
    });
  }

  if (btnSimulateRandom) {
    btnSimulateRandom.addEventListener('click', () => {
      if (studentsData.length > 0) {
        const randomIndex = Math.floor(Math.random() * studentsData.length);
        triggerStudent(studentsData[randomIndex].nim);
      }
    });
  }

  if (btnResetAll) {
    btnResetAll.addEventListener('click', async () => {
      if (confirm('Yakin ingin mereset kehadiran semua mahasiswa kembali ke "Belum Maju"?')) {
        try {
          await fetch('/api/students/reset', { method: 'POST' });
        } catch (e) {}

        studentsData.forEach(s => {
          s.status = 'Belum Maju';
          s.waktuScan = null;
        });
        sync.sendStandby();
        renderTable();
        updateStats();
        alert('Status kehadiran semua mahasiswa telah direset.');
      }
    });
  }

  // Filter & Search input listener
  if (searchInput) searchInput.addEventListener('input', renderTable);
  if (filterFakultas) filterFakultas.addEventListener('change', renderTable);

  // Inisialisasi awal
  fetchStudents();
  fetchSettings();
});
