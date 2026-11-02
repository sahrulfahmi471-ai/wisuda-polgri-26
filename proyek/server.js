const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.set('trust proxy', true); // Trust upstream reverse proxy (Render, Nginx, Railway, Cloudflare)

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  },
  pingInterval: 10000,
  pingTimeout: 20000
});

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'public', 'data', 'students.json');
const SETTINGS_FILE = path.join(__dirname, 'public', 'data', 'settings.json');

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Admin Route Aliases
app.get('/admin', (req, res) => res.redirect('/operator.html'));
app.get('/admin.html', (req, res) => res.redirect('/operator.html'));

// Health check endpoint for Cloud Hosting (Render, Railway, Fly.io, AWS, Docker)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'wisuda-scanner-politeknik-pgri-banten',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    port: PORT
  });
});

// Helper to get local IP addresses
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

// Students Database
function loadStudents() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading students data:', err);
  }
  return [];
}

function saveStudents(students) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving students data:', err);
    return false;
  }
}

// Default Settings Template
const DEFAULT_SETTINGS = {
  univName: "POLITEKNIK PGRI BANTEN",
  subTitle: "SIDANG TERBUKA SENAT POLITEKNIK PGRI BANTEN",
  sessionName: "WISUDA KE-10 PROGRAM DIPLOMA TAHUN 2026",
  standbyMessage: "Selamat Datang Para Wisudawan & Tamu Undangan Wisuda Ke-10 Politeknik PGRI Banten",
  displayDuration: 15,
  autoReturnStandby: true,
  enableChime: true,
  enableCumlaudeFanfare: true,
  enableTTS: true,
  ttsRate: 0.95,
  ttsTemplate: "{nama}. Program Studi {prodi}. Predikat {predikat}.",
  soundLocation: "display",
  displayLayout: "centered",
  showPhoto: true,
  showName: true,
  showNim: true,
  showProdi: true,
  showKerja: true,
  showIpk: true,
  showPredikat: true,
  showFaculty: true,
  showParents: false,
  showOrigin: false,
  showThesis: false,
  photoShape: "circle",
  photoSize: "medium",
  photoBorderColor: "#d4af37",
  photoRingEffect: "rotating",
  ambientLightEnabled: true,
  ambientLightColor: "#d4af37",
  ambientLightRadius: "60",
  ambientLightIntensity: "0.75",
  ambientLightAnimation: "breathe",
  theme: "royal-gold",

  // 1. Kostumisasi Warna Layar Scan Display
  dispBgColor1: "#152243",
  dispBgColor2: "#050814",
  dispCardBg: "#10192d",
  dispCardOpacity: "0.94",

  // 2. Kostumisasi Warna Bingkai
  stageBorderColor: "#d4af37",
  stageBorderGlow: "#d4af37",
  cardBorderColor: "#d4af37",
  cardGlowColor: "#d4af37",

  // 3. Kostumisasi Warna Biodata Mahasiswa
  bioNameColor: "#ffffff",
  bioProdiColor: "#93c5fd",
  bioFacultyColor: "#f7e394",
  bioNimColor: "#ffffff",
  bioIpkColor: "#67e8f9",
  bioPredikatColor: "#d4af37",
  bioDetailColor: "#cbd5e1"
};

// Settings Database
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Error reading settings:', err);
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving settings:', err);
    return false;
  }
}

let studentsDatabase = loadStudents();
let appSettings = loadSettings();

// ==========================================
// REST API ROUTES
// ==========================================

// --- 1. Students CRUD ---
app.get('/api/students', (req, res) => {
  res.json({ success: true, data: studentsDatabase });
});

app.get('/api/students/:nim', (req, res) => {
  const { nim } = req.params;
  const student = studentsDatabase.find(s => s.nim.toString().trim() === nim.toString().trim());
  if (student) {
    res.json({ success: true, data: student });
  } else {
    res.status(404).json({ success: false, message: 'Wisudawan tidak ditemukan' });
  }
});

// Tambah / Registrasi Mahasiswa Baru
app.post('/api/students', (req, res) => {
  const newStudent = req.body;
  if (!newStudent.nim || !newStudent.nama) {
    return res.status(400).json({ success: false, message: 'NIM dan Nama wajib diisi' });
  }

  const existingIndex = studentsDatabase.findIndex(s => s.nim.toString().trim() === newStudent.nim.toString().trim());
  
  const studentRecord = {
    nim: newStudent.nim.toString().trim(),
    nama: newStudent.nama.trim(),
    panggilan: newStudent.panggilan || newStudent.nama.split(' ')[0],
    fakultas: newStudent.fakultas || 'Fakultas Umum',
    prodi: newStudent.prodi || 'Program Studi',
    ipk: newStudent.ipk ? newStudent.ipk.toString() : '3.50',
    predikat: newStudent.predikat || (parseFloat(newStudent.ipk || 0) >= 3.8 ? 'DENGAN PUJIAN (CUM LAUDE)' : 'SANGAT MEMUASKAN'),
    isCumlaude: newStudent.isCumlaude !== undefined ? Boolean(newStudent.isCumlaude) : (parseFloat(newStudent.ipk || 0) >= 3.8),
    tempatKerja: newStudent.tempatKerja || '-',
    judulSkripsi: newStudent.judulSkripsi || '-',
    orangTua: newStudent.orangTua || '-',
    asalDaerah: newStudent.asalDaerah || '-',
    foto: newStudent.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    status: newStudent.status || 'Belum Maju',
    waktuScan: newStudent.waktuScan || null
  };

  if (existingIndex >= 0) {
    studentsDatabase[existingIndex] = { ...studentsDatabase[existingIndex], ...studentRecord };
  } else {
    studentsDatabase.push(studentRecord);
  }

  saveStudents(studentsDatabase);
  io.emit('students:updated', studentsDatabase);
  res.json({ success: true, message: 'Data wisudawan berhasil disimpan', data: studentsDatabase });
});

// Edit / Update Mahasiswa yang Sudah Ada
app.put('/api/students/:nim', (req, res) => {
  const { nim } = req.params;
  const updateData = req.body;
  const idx = studentsDatabase.findIndex(s => s.nim.toString().trim() === nim.toString().trim());

  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Mahasiswa tidak ditemukan' });
  }

  studentsDatabase[idx] = {
    ...studentsDatabase[idx],
    ...updateData,
    nim: updateData.nim ? updateData.nim.toString().trim() : studentsDatabase[idx].nim,
    isCumlaude: updateData.isCumlaude !== undefined ? Boolean(updateData.isCumlaude) : studentsDatabase[idx].isCumlaude
  };

  saveStudents(studentsDatabase);
  io.emit('students:updated', studentsDatabase);
  res.json({ success: true, message: 'Data berhasil diperbarui', data: studentsDatabase[idx] });
});

// Hapus Mahasiswa
app.delete('/api/students/:nim', (req, res) => {
  const { nim } = req.params;
  const initialLength = studentsDatabase.length;
  studentsDatabase = studentsDatabase.filter(s => s.nim.toString().trim() !== nim.toString().trim());

  if (studentsDatabase.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Wisudawan tidak ditemukan' });
  }

  saveStudents(studentsDatabase);
  io.emit('students:updated', studentsDatabase);
  res.json({ success: true, message: 'Wisudawan berhasil dihapus' });
});

// Hapus / Kosongkan Seluruh Daftar Mahasiswa
app.delete('/api/students', (req, res) => {
  studentsDatabase = [];
  saveStudents(studentsDatabase);
  io.emit('students:updated', studentsDatabase);
  res.json({ success: true, message: 'Semua data wisudawan berhasil dikosongkan' });
});

// Import Massal (CSV / JSON)
app.post('/api/students/bulk', (req, res) => {
  const { list, mode } = req.body;
  if (!Array.isArray(list)) {
    return res.status(400).json({ success: false, message: 'Format data harus berupa daftar array' });
  }

  const formatted = list.map(item => ({
    nim: item.nim ? item.nim.toString().trim() : Date.now().toString(),
    nama: item.nama ? item.nama.trim() : 'Wisudawan',
    panggilan: item.panggilan || (item.nama ? item.nama.split(' ')[0] : 'Wisudawan'),
    fakultas: item.fakultas || 'Fakultas Umum',
    prodi: item.prodi || 'Program Studi',
    ipk: item.ipk ? item.ipk.toString() : '3.50',
    predikat: item.predikat || (parseFloat(item.ipk || 0) >= 3.8 ? 'DENGAN PUJIAN (CUM LAUDE)' : 'SANGAT MEMUASKAN'),
    isCumlaude: item.isCumlaude !== undefined ? Boolean(item.isCumlaude) : (parseFloat(item.ipk || 0) >= 3.8),
    tempatKerja: item.tempatKerja || item.tempat_kerja || item.perusahaan || '-',
    judulSkripsi: item.judulSkripsi || '-',
    orangTua: item.orangTua || '-',
    asalDaerah: item.asalDaerah || '-',
    foto: item.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    status: 'Belum Maju',
    waktuScan: null
  }));

  if (mode === 'replace') {
    studentsDatabase = formatted;
  } else {
    // Append or update existing by NIM
    formatted.forEach(item => {
      const idx = studentsDatabase.findIndex(s => s.nim.toString().trim() === item.nim.toString().trim());
      if (idx >= 0) {
        studentsDatabase[idx] = { ...studentsDatabase[idx], ...item };
      } else {
        studentsDatabase.push(item);
      }
    });
  }

  saveStudents(studentsDatabase);
  io.emit('students:updated', studentsDatabase);
  res.json({ success: true, message: `Berhasil mengimpor ${formatted.length} wisudawan`, count: studentsDatabase.length });
});

// Reset status kehadiran ke "Belum Maju"
app.post('/api/students/reset', (req, res) => {
  studentsDatabase = studentsDatabase.map(s => ({
    ...s,
    status: 'Belum Maju',
    waktuScan: null
  }));
  saveStudents(studentsDatabase);
  io.emit('students:updated', studentsDatabase);
  io.emit('display:reset');
  res.json({ success: true, message: 'Status kehadiran semua wisudawan telah direset' });
});

// --- 2. Settings (Kustomisasi Teks, Durasi & Suara Display) ---
app.get('/api/settings', (req, res) => {
  res.json({ success: true, data: appSettings });
});

app.post('/api/settings', (req, res) => {
  const newSettings = req.body;
  appSettings = {
    ...appSettings,
    ...newSettings,
    displayDuration: parseInt(newSettings.displayDuration, 10) || 15
  };

  saveSettings(appSettings);
  console.log('[Settings] Pengaturan panggung diperbarui:', appSettings);
  
  // Broadcast update pengaturan secara instan ke layar display & operator
  io.emit('settings:updated', appSettings);
  res.json({ success: true, message: 'Pengaturan berhasil disimpan dan diterapkan', data: appSettings });
});

// --- 3. Info Sistem & Jaringan ---
app.get('/api/info', (req, res) => {
  res.json({
    port: PORT,
    localIPs: getLocalIPs(),
    totalStudents: studentsDatabase.length,
    settings: appSettings
  });
});

// ==========================================
// SOCKET.IO REAL-TIME EVENTS
// ==========================================
io.on('connection', (socket) => {
  console.log(`[Socket] Klien terhubung: ${socket.id}`);

  // Kirim data dan setting saat koneksi awal
  socket.emit('init', {
    totalStudents: studentsDatabase.length,
    settings: appSettings
  });

  // Pemindaian Barcode dari Operator
  socket.on('scan:trigger', (payload) => {
    const rawQuery = (payload.nim || (payload.student && payload.student.nim) || '').toString().trim();
    let target = null;

    if (rawQuery) {
      // 1. Cari exact match
      target = studentsDatabase.find(s => s.nim && s.nim.toString().trim().toLowerCase() === rawQuery.toLowerCase());
      
      // 2. Jika ada AIM Code prefix (]Q1, ]C1, dll) atau spasi
      if (!target) {
        const clean = rawQuery.replace(/^\][A-Za-z0-9]{2}/, '').replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim().toLowerCase();
        target = studentsDatabase.find(s => s.nim && s.nim.toString().trim().toLowerCase() === clean);
      }

      // 3. Substring match jika QR berisi URL atau format teks
      if (!target) {
        target = studentsDatabase.find(s => {
          if (!s.nim) return false;
          const sNim = s.nim.toString().trim().toLowerCase();
          return sNim.length >= 3 && rawQuery.toLowerCase().includes(sNim);
        });
      }
    }

    // Jika masih null tapi payload.student sudah membawa nama lengkap
    if (!target && payload.student && payload.student.nama) {
      target = payload.student;
    }

    if (target) {
      // Perbarui status wisudawan di database
      const idx = studentsDatabase.findIndex(s => s.nim.toString().trim() === target.nim.toString().trim());
      if (idx >= 0) {
        studentsDatabase[idx].status = 'Sudah Maju';
        studentsDatabase[idx].waktuScan = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        saveStudents(studentsDatabase);
        target = studentsDatabase[idx];
      }

      console.log(`[Scan Barcode] Wisudawan: ${target.nama} (${target.nim})`);

      // Kirim event ke seluruh layar proyektor / videotron
      io.emit('display:show_student', {
        student: target,
        timestamp: Date.now(),
        settings: appSettings,
        options: payload.options || {}
      });

      // Update tabel operator
      io.emit('students:updated', studentsDatabase);
    } else {
      socket.emit('scan:not_found', { query: rawQuery });
    }
  });

  // Operator mengubah layar kembali ke Siaga (Standby)
  socket.on('display:trigger_standby', () => {
    io.emit('display:standby');
  });

  // Operator membunyikan suara / lonceng
  socket.on('display:trigger_sound', (type) => {
    io.emit('display:play_sound', { type: type || 'chime' });
  });

  // Operator memperbarui settings via socket
  socket.on('settings:change', (newSettings) => {
    appSettings = { ...appSettings, ...newSettings };
    saveSettings(appSettings);
    io.emit('settings:updated', appSettings);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Klien terputus: ${socket.id}`);
  });
});

function startListening() {
  const ips = getLocalIPs();
  console.log('========================================================');
  console.log('🎓 SISTEM SCAN BARCODE WISUDA AKTIF & SIAP!');
  console.log(`🌐 Akses Lokal   : http://localhost:${PORT}`);
  if (process.env.HOST) {
    console.log(`📡 Bind Host     : ${process.env.HOST}`);
  }
  if (ips.length > 0) {
    ips.forEach(ip => {
      console.log(`📱 Akses Jaringan: http://${ip}:${PORT}`);
    });
  }
  console.log('--------------------------------------------------------');
  console.log(`👉 Beranda & Cek QR : http://localhost:${PORT}`);
  console.log(`👉 Template Gelang  : http://localhost:${PORT}/gelang.html`);
  console.log(`👉 Tab Operator     : http://localhost:${PORT}/operator.html`);
  console.log(`👉 Tab Layar Panggung: http://localhost:${PORT}/display.html`);
  console.log(`👉 Cetak Kartu Barcode: http://localhost:${PORT}/print-barcode.html`);
  console.log(`🩺 Health Check      : http://localhost:${PORT}/api/health`);
  console.log('========================================================');
}

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n⚠️  PORT ${PORT} SEDANG DIGUNAKAN!`);
    console.error(`Kemungkinan ada instance server lain yang masih berjalan di latar belakang.`);
    console.error(`Tips: Tutup server sebelumnya atau ganti port (contoh: PORT=3001 node server.js)\n`);
    process.exit(1);
  } else {
    console.error('Server error:', e);
  }
});

if (process.env.HOST) {
  server.listen(PORT, process.env.HOST, startListening);
} else {
  server.listen(PORT, startListening);
}

module.exports = { app, server, loadSettings, saveSettings };
