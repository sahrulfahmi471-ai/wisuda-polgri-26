/**
 * Audio Synthesizer & Speech Module for Graduation System
 * Menggunakan Web Audio API murni (100% offline, tanpa file mp3 eksternal)
 */
class GraduationAudio {
  constructor() {
    this.audioCtx = null;
    this.speechSynth = window.speechSynthesis;
    this.voiceID = null;
    this.isMuted = false;
    this.volume = 0.85;
    this.enableTTS = true;
    this.enableChime = true;
    this.enableCumlaudeFanfare = true;
    this.ttsRate = 0.95;
    this.ttsTemplate = "{nama}. Program Studi {prodi}. Predikat {predikat}.";

    this.initAudioContext();
    this.initVoices();
  }

  initAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.audioCtx = new AudioContext();
    }
  }

  ensureAudioContext() {
    if (!this.audioCtx) {
      this.initAudioContext();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  initVoices() {
    if (!this.speechSynth) return;
    const findVoice = () => {
      const voices = this.speechSynth.getVoices();
      // Prioritaskan suara Bahasa Indonesia
      const idVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID') || v.lang.toLowerCase().includes('indonesian'));
      this.voiceID = idVoice || voices[0];
    };

    findVoice();
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = findVoice;
    }
  }

  /**
   * Bunyi 'Pip!' Konfirmasi Barcode Scanner Fisik
   */
  playScannerBeep() {
    if (this.isMuted) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, now); // A6 high crisp beep

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25 * this.volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Bunyi Peringatan Barcode Tidak Ditemukan (Buzzer pendek)
   */
  playWarningBuzzer() {
    if (this.isMuted) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Membunyikan Chime / Lonceng Wisuda Megah (Tubular Bell chord harmonic)
   */
  playCeremonyChime() {
    if (this.isMuted || !this.enableChime) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Frekuensi chord megah: G4, B4, D5, G5 (Do-Mi-Sol mayor megah)
    const notes = [392.00, 493.88, 587.33, 783.99];

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = index % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + (index * 0.08));

      const startTime = now + (index * 0.08);
      const duration = 2.8;

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.35 * this.volume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  /**
   * Bunyikan fanfare / kembang api suara untuk wisudawan Cum Laude
   */
  playCumLaudeFanfare() {
    if (this.isMuted || !this.enableCumlaudeFanfare) {
      if (this.enableChime) this.playCeremonyChime();
      return;
    }
    this.ensureAudioContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Arpeggio fanfare megah: C4, E4, G4, C5, E5, G5
    const fanfareNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    fanfareNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      const startTime = now + idx * 0.1;
      const dur = idx === fanfareNotes.length - 1 ? 2.8 : 0.6;

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.35 * this.volume, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + dur);
    });
  }

  /**
   * Text To Speech membacakan nama wisudawan dengan template dinamis
   */
  speakStudent(student, customTemplate = null) {
    if (this.isMuted || !this.enableTTS || !this.speechSynth) return;

    // Batalkan ucapan sebelumnya jika ada
    this.speechSynth.cancel();

    const template = customTemplate || this.ttsTemplate || "{nama}. Program Studi {prodi}. Predikat {predikat}.";

    let text = template
      .replace(/{nama}/gi, student.nama || '')
      .replace(/{nim}/gi, student.nim || '')
      .replace(/{prodi}/gi, student.prodi || '')
      .replace(/{fakultas}/gi, student.fakultas || '')
      .replace(/{ipk}/gi, student.ipk || '')
      .replace(/{predikat}/gi, student.predikat || (student.isCumlaude ? 'Dengan Pujian' : 'Memuaskan'));

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voiceID) {
      utterance.voice = this.voiceID;
    }
    utterance.lang = 'id-ID';
    utterance.rate = this.ttsRate || 0.95;
    utterance.pitch = 1.0;
    utterance.volume = this.volume;

    // Tunggu lonceng berbunyi sebelum membacakan nama
    setTimeout(() => {
      this.speechSynth.speak(utterance);
    }, 700);
  }
}

// Inisialisasi instance singleton
window.GradAudio = new GraduationAudio();
