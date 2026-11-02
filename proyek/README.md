# 🎓 Sistem Informasi & Scan Barcode Wisuda Ke-10 Politeknik PGRI Banten

Aplikasi web terintegrasi untuk prosesi wisuda dengan arsitektur **Multi-Portal Real-Time**:
1. **Beranda Resmi & Cek QR Mahasiswa (`/`)**: Portal wisudawan untuk mencari data, mendownload QR Code pribadi (PNG), dan mencetak template gelang barcode.
2. **Template Gelang Barcode Wisuda (`/gelang.html`)**: Desain gelang event standar (260mm x 25mm) siap cetak di kertas A4 / Tyvek gelang.
3. **Panel Kontrol Operator (`/operator.html`)**: Meja scan barcode fisik (gun scanner USB/Bluetooth), pendaftaran mahasiswa, import/export CSV, dan kustomisasi display.
4. **Layar Tampilan Panggung / Videotron (`/display.html`)**: Layar proyektor panggung yang menampilkan profil wisudawan secara megah dengan lonceng genta dan ucapan nama otomatis (TTS).
5. **Cetak Kartu Tanda Peserta (`/print-barcode.html`)**: ID card wisudawan dengan foto, barcode Code128, dan QR Code.

---

## 🌟 Fitur Unggulan Terbaru

### 1. 🏠 Beranda Resmi Wisuda Ke-10 Politeknik PGRI Banten
- **Pencarian Mandiri Wisudawan**: Wisudawan cukup mengetikkan NIM atau Nama Lengkap pada kolom pencarian utama.
- **Download QR Code Instan**: Tombol untuk mengunduh file gambar QR Code (`.png`) beresolusi tinggi langsung ke HP/laptop mahasiswa.
- **Akses Langsung ke Gelang Barcode**: Tombol satu-klik untuk melihat dan mencetak gelang wisuda mahasiswa yang bersangkutan.

### 2. 🎫 Template Gelang Barcode Wisuda (`/gelang.html`)
- **Format Gelang Resmi**: Didesain dengan ukuran proporsional (260mm x 25mm) menyerupai gelang tiket/wristband event resmi.
- **Komponen Gelang**:
  - Area perekat (Adhesive Peel Tab).
  - Logo & tulisan *"POLITEKNIK PGRI BANTEN - WISUDA KE-10 • 2026"*.
  - Nama Mahasiswa, Gelar Akademik, NIM, dan Program Studi.
  - Informasi Tempat Bekerja (*"🏢 PT Krakatau Steel / PT Chandra Asri / dll"*).
  - Barcode Code128 (mudah dibaca scanner laser dari jarak jauh) dan QR Code 2D.
  - Nomor seri keamanan (Security serial).
- **Cetak Lembar A4**: Menggunakan `@media print` presisi sehingga muat 6-8 gelang per lembar kertas A4 siap gunting.
- **Tema Gelang**: Pilihan tema *Navy & Gold* dan *Putih Bersih (Hemat Tinta Printer)*.

### 3. ⚙️ Data Mahasiswa Fleksibel & Opsional di Layar Panggung
Semua elemen berikut kini bersifat **opsional (dapat diaktifkan/dinonaktifkan)** dari tombol *"Pengaturan Display"* di tab Operator:
- `showName`: Tampilkan/sembunyikan Nama Mahasiswa
- `showProdi`: Tampilkan/sembunyikan Program Studi (D3 Teknik Mesin, D3 Manajemen Informatika, D3 Teknik Kimia, D3 Teknik Elektronika)
- `showIpk`: Tampilkan/sembunyikan Angka IPK
- `showKerja`: Tampilkan/sembunyikan Status *"Sudah Bekerja Di Mana"* (dengan badge hijau elegan)
- `showPhoto`: Tampilkan/sembunyikan Foto Profil
- `showParents`: Tampilkan/sembunyikan Nama Orang Tua
- `showOrigin`: Tampilkan/sembunyikan Asal Daerah
- `showThesis`: Tampilkan/sembunyikan Judul Karya Akhir / Skripsi

### 4. 🔫 Pemindaian Barcode Langsung di Layar Display
- Layar panggung (`display.html`) telah dilengkapi penerima hardware scanner mandiri.
- Panitia dapat menembakkan scanner barcode/QR gun **langsung saat sedang membuka tab Display**, dan kartu mahasiswa akan seketika muncul tanpa harus berpindah ke tab operator.
- Dilengkapi modul pembersih kode cerdas (`scanner-helper.js`) yang otomatis menghapus kode awalan scanner (AIM ID `]Q1`, `]C1`) dan karakter kontrol tak terlihat.

### 5. 🎨 Kustomisasi Warna Lengkap dari Panel Admin / Operator
Panitia/admin kini dapat mengubah warna tampilan secara visual dan real-time lewat tombol **"🎨 Kustomisasi Warna"** pada halaman Operator (`/operator.html` atau `/admin`):
- **1. Layar Scan Display**:
  - Warna Pusat Gradasi Layar Panggung (Center/Top Gradient)
  - Warna Luar Gradasi Layar Panggung (Outer/Base Gradient)
  - Warna Background Kartu Biodata (Showcase Card)
  - Pengatur Transparansi / Opasitas Kartu Biodata (50% - 100%)
- **2. Bingkai (Frame & Border)**:
  - Warna Garis Bingkai Layar Panggung & 4 Ornamen Sudut (*Corner Ornaments*)
  - Warna Pendaran Cahaya (*Glow Effect*) Bingkai Panggung
  - Warna Garis Bingkai Kartu Wisudawan
  - Warna Pendaran Cahaya (*Glow Effect*) Kartu Wisudawan
  - Warna Bingkai & Cincin Luar Foto Wisudawan
- **3. Biodata Mahasiswa**:
  - Warna Teks Nama Lengkap & Gelar Mahasiswa
  - Warna Teks Program Studi (Prodi)
  - Warna Badge Fakultas / Politeknik
  - Warna Angka NIM (Nomor Induk Mahasiswa)
  - Warna Angka IPK (Indeks Prestasi)
  - Warna Predikat Kelulusan & Badge Cum Laude
  - Warna Teks Detail Keterangan (Orang Tua, Asal Daerah, Judul Skripsi)
- **⚡ Preset Tema 1-Klik**:
  - 👑 *Royal Navy & Gold* (Resmi Politeknik PGRI Banten)
  - 🌿 *Emerald Islamic Green* (Nuansa Hijau Islami / Prestasi)
  - 🍷 *Ruby Maroon Luxury* (Nuansa Merah Marun Mewah)
  - 🌌 *Cyber Blue & Neon* (Nuansa Modern Futuristik)
  - 🖤 *Obsidian & Platinum* (Nuansa Monokrom Elegan)
- **👁️ Simulasi Pratinjau Real-Time**:
  - Dilengkapi jendela panggung mini di dalam form pengaturan yang langsung berubah saat warna dipilih sebelum disimpan ke layar panggung.
- **🔄 Sinkronisasi Instan Tanpa Reload**:
  - Perubahan warna otomatis diterapkan seketika ke tab Layar Panggung (`/display.html`) dan Portal Biodata Mahasiswa (`/biodata.html`) melalui Socket.io dan BroadcastChannel.

---

## 🚀 Panduan Menjalankan Aplikasi

1. Buka Terminal / PowerShell di folder proyek ini:
   ```bash
   npm start
   ```
2. Buka browser dan kunjungi:
   - **Beranda Resmi & Cek QR**: [http://localhost:3000](http://localhost:3000)
   - **Panel Admin / Operator**: [http://localhost:3000/admin](http://localhost:3000/admin) atau [http://localhost:3000/operator.html](http://localhost:3000/operator.html)
   - **Layar Panggung**: [http://localhost:3000/display.html](http://localhost:3000/display.html)
   - **Portal Biodata Wisudawan**: [http://localhost:3000/biodata.html](http://localhost:3000/biodata.html)
   - **Template Gelang Barcode**: [http://localhost:3000/gelang.html](http://localhost:3000/gelang.html)
   - **Cetak Kartu**: [http://localhost:3000/print-barcode.html](http://localhost:3000/print-barcode.html)
