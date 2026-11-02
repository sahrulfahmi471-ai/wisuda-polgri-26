/**
 * SCANNER HELPER UTILITY
 * Menangani parsing cerdas dari berbagai format barcode dan QR code:
 * - AIM Code prefix (]Q1, ]C1, ]e0, dll)
 * - Format URL (http://.../?nim=123 atau #123)
 * - Format JSON ({"nim":"123"})
 * - Format teks "NIM: 123"
 * - Karakter kontrol dan whitespace tersembunyi
 */

class WisudaScannerHelper {
  /**
   * Ekstraksi NIM atau query bersih dari input mentah barcode/QR
   */
  static cleanQuery(raw) {
    if (!raw) return '';
    let str = raw.toString().trim();

    // 1. Hapus AIM Code identifiers yang sering dikirim oleh 2D QR Scanner (]Q1, ]Q2, ]C1, ]e0, ]d2, dll)
    str = str.replace(/^\][A-Za-z0-9]{2}/, '');

    // 2. Hapus karakter kontrol tak terlihat (ASCII 0-31 dan 127-159)
    str = str.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();

    // 3. Jika berupa format JSON
    if (str.startsWith('{') && str.endsWith('}')) {
      try {
        const parsed = JSON.parse(str);
        if (parsed.nim) return parsed.nim.toString().trim();
        if (parsed.id) return parsed.id.toString().trim();
        if (parsed.code) return parsed.code.toString().trim();
      } catch (e) {}
    }

    // 4. Jika QR Code berisi link URL (misal: https://domain.com/biodata.html?nim=202111001 atau /biodata.html?nim=202111001)
    if (str.includes('http://') || str.includes('https://') || str.includes('?') || str.includes('#') || str.includes('biodata') || str.includes('/')) {
      try {
        const urlObj = new URL(str, window.location.origin);
        const nimParam = urlObj.searchParams.get('nim') || urlObj.searchParams.get('id') || urlObj.searchParams.get('barcode');
        if (nimParam) return nimParam.trim();

        if (urlObj.hash) {
          const hashVal = urlObj.hash.replace('#', '').trim();
          if (hashVal) return hashVal;
        }

        const segments = urlObj.pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
          const lastSeg = segments[segments.length - 1];
          if (/\d+/.test(lastSeg)) return lastSeg.trim();
        }
      } catch (e) {}
    }

    // 5. Jika berisi awalan seperti "NIM: 202051001" atau "NIM - 202051001"
    const nimPrefixMatch = str.match(/(?:nim|barcode|id|nomor)\s*[:=\-]?\s*([a-zA-Z0-9_\-]+)/i);
    if (nimPrefixMatch && nimPrefixMatch[1]) {
      return nimPrefixMatch[1].trim();
    }

    // 6. Hapus tanda petik pembuka/penutup jika ada
    str = str.replace(/^["']|["']$/g, '').trim();

    return str;
  }

  /**
   * Mencari data mahasiswa berdasarkan input barcode/QR
   */
  static findStudent(studentsList, query) {
    if (!Array.isArray(studentsList) || studentsList.length === 0 || !query) {
      return null;
    }

    const clean = this.cleanQuery(query).toLowerCase();
    const rawLower = query.toString().trim().toLowerCase();

    // 1. Pencarian kecocokan persis NIM (Exact match)
    let found = studentsList.find(s => s.nim && s.nim.toString().trim().toLowerCase() === clean);
    if (found) return found;

    // 2. Pencarian kecocokan persis NIM dengan rawLower
    found = studentsList.find(s => s.nim && s.nim.toString().trim().toLowerCase() === rawLower);
    if (found) return found;

    // 3. Pencarian jika NIM terkandung di dalam teks QR (Substring match)
    found = studentsList.find(s => {
      if (!s.nim) return false;
      const sNim = s.nim.toString().trim().toLowerCase();
      return sNim.length >= 3 && (rawLower.includes(sNim) || clean.includes(sNim));
    });
    if (found) return found;

    // 4. Pencarian berdasarkan nama mahasiswa
    found = studentsList.find(s => {
      if (!s.nama) return false;
      const sNama = s.nama.toLowerCase();
      return sNama.includes(clean) || (clean.length >= 4 && clean.includes(sNama));
    });
    if (found) return found;

    return null;
  }

  /**
   * Menyiapkan pendengar pemindai fisik (Hardware Barcode & QR Scanner Gun)
   * Bekerja otomatis untuk tombol Enter, Tab, maupun jeda ketukan cepat (auto-flush)
   */
  static attachHardwareScanner(targetWindow, onScanCallback, options = {}) {
    let buffer = '';
    let lastKeyTime = Date.now();
    let idleTimer = null;

    targetWindow.addEventListener('keydown', (e) => {
      // Abaikan jika sedang mengetik pada input form (kecuali input khusus scanner)
      const activeEl = document.activeElement;
      const isInput = activeEl && ['INPUT', 'TEXTAREA'].includes(activeEl.tagName);
      const isScannerInput = activeEl && activeEl.id === 'usb-barcode-input';

      if (isInput && !isScannerInput && !options.allowInAllInputs) {
        return;
      }

      const currentTime = Date.now();
      const interval = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Jika jeda antar karakter lebih dari 200ms, kemungkinan ketukan tangan manual lama -> reset buffer
      if (interval > 250) {
        buffer = '';
      }

      // Scanner selesai scan saat menekan Enter atau Tab
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (buffer.length >= 2) {
          e.preventDefault();
          const finalCode = buffer.trim();
          buffer = '';
          if (idleTimer) clearTimeout(idleTimer);
          onScanCallback(finalCode);
        }
        return;
      }

      // Tangkap karakter tunggal yang dapat dicetak
      if (e.key && e.key.length === 1) {
        buffer += e.key;

        // Auto-flush timer: jika scanner barcode tidak mengirim tombol Enter/Tab di akhir,
        // deteksi ketika ketikan cepat berhenti selama 130ms
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          if (buffer.length >= 3) {
            const finalCode = buffer.trim();
            buffer = '';
            onScanCallback(finalCode);
          }
        }, 130);
      }
    });
  }
}

window.WisudaScannerHelper = WisudaScannerHelper;
