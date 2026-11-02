# 🎓 Sistem Scan Barcode Wisuda Ke-10 Politeknik PGRI Banten

Aplikasi web terintegrasi untuk prosesi wisuda dengan arsitektur **Multi-Portal Real-Time**:
1. **Beranda & Cek QR Mahasiswa (`/`)**: Portal wisudawan untuk mencari data, download QR Code pribadi (PNG), dan mencetak template gelang barcode.
2. **Panel Kontrol Operator (`/operator.html` atau `/admin`)**: Scan barcode fisik, pendaftaran mahasiswa, import/export CSV, dan kustomisasi display & warna.
3. **Layar Tampilan Panggung / Videotron (`/display.html`)**: Layar proyektor megah dengan lonceng genta, TTS ucapan otomatis, dan animasi scan.
4. **Portal Biodata Mahasiswa (`/biodata.html`)**: Kartu profil wisudawan interaktif.
5. **Template Gelang Barcode (`/gelang.html`)**: Format gelang tiket event (260mm x 25mm) siap cetak di kertas A4.
6. **Cetak Kartu Peserta (`/print-barcode.html`)**: ID card wisudawan dengan barcode Code128 & QR.

---

## 🚀 Cara Menjalankan Lokal

- **Cara 1-Klik**: Dobel-klik `jalankan.bat` di folder ini.
- **Cara Terminal**: `node server.js` atau `npm start`.

---

## 🌐 Panduan Hosting & Deployment

Aplikasi ini sudah dipersiapkan secara penuh (*production-ready*) untuk berbagai pilihan hosting:

### 1. Cloud Hosting Gratis (Render.com / Railway) - *Rekomendasi Utama*
Aplikasi menggunakan **Socket.io (WebSockets)**, sehingga memerlukan hosting yang mendukung koneksi persistent:
1. Buat repositori baru di [GitHub](https://github.com) dan push folder ini:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for hosting"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO-WISUDA.git
   git push -u origin main
   ```
2. Buka [Render.com](https://render.com) dan login dengan akun GitHub.
3. Klik **New +** -> **Web Service** -> Pilih repositori GitHub Anda.
4. Render akan otomatis mendeteksi pengaturan dari file `render.yaml`:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Health Check Path**: `/api/health`
5. Klik **Create Web Service**. Dalam 2 menit aplikasi Anda sudah aktif di domain HTTPS gratis!

---

### 2. Hosting Instan / Public Tunnel (1-Klik Dari Laptop Saat Acara)
Jika Anda sedang bertugas di ruang wisuda dan panitia ingin membuka aplikasi di HP/tablet tanpa harus sewa server atau upload ke GitHub:
1. Pastikan laptop terhubung ke internet (WiFi atau tethering HP).
2. Dobel-klik file `hosting-instan.bat`.
3. Dalam hitungan detik akan muncul link online HTTPS gratis (misal: `https://xxx.loca.lt`) yang bisa langsung dibagikan ke panitia!

---

### 3. VPS Linux Sendiri (Ubuntu / Debian / IDCloudHost / DigitalOcean)
1. Clone repositori ke server:
   ```bash
   git clone https://github.com/USERNAME/REPO-WISUDA.git /var/www/wisuda
   cd /var/www/wisuda
   npm install --omit=dev
   ```
2. Jalankan dengan PM2 agar berjalan di latar belakang:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "wisuda-scanner"
   pm2 save
   pm2 startup
   ```
3. Konfigurasi Nginx:
   - Salin file `nginx-wisuda.conf` ke `/etc/nginx/sites-available/wisuda`.
   - Ganti `server_name` dengan domain kampus Anda.
   - Aktifkan site: `ln -s /etc/nginx/sites-available/wisuda /etc/nginx/sites-enabled/`
   - Reload Nginx: `systemctl reload nginx`
4. Pasang SSL gratis:
   ```bash
   certbot --nginx -d domain-anda.ac.id
   ```

---

### 4. Docker & Docker Compose
Jika server Anda sudah memiliki Docker:
```bash
docker-compose up -d --build
```
Aplikasi akan langsung berjalan di port 3000 dengan volume data persisten di `./proyek/public/data`.

---

## 🎨 Kustomisasi Warna
Buka **Panel Admin** (`/operator.html`), lalu klik tombol **"🎨 Kustomisasi Warna"** di pojok kanan atas untuk mengubah warna latar videotron, bingkai panggung, dan teks biodata mahasiswa secara real-time.
