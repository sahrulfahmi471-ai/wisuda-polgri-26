/**
 * WisudaSyncClient
 * Sinkronisasi Real-Time Dual-Layer:
 * Layer 1: Socket.io (Untuk sinkronisasi jaringan lokal / lintas perangkat)
 * Layer 2: BroadcastChannel API (Untuk komunikasi instan 0ms antar-tab di browser yang sama)
 */
class WisudaSyncClient {
  constructor(role = 'operator') {
    this.role = role;
    this.socket = null;
    this.broadcastChannel = null;
    this.listeners = {};
    this.isConnectedSocket = false;

    this.initBroadcastChannel();
    this.initSocket();
  }

  initBroadcastChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('wisuda_graduation_channel');
        this.broadcastChannel.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type) {
            this.triggerEvent(type, payload, 'broadcast_channel');
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel tidak didukung di browser ini:', e);
      }
    }

    // Fallback storage event
    window.addEventListener('storage', (e) => {
      if (e.key === 'wisuda_event_bus' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          this.triggerEvent(parsed.type, parsed.payload, 'local_storage');
        } catch (err) {}
      }
    });
  }

  initSocket() {
    if (typeof io !== 'undefined') {
      try {
        this.socket = io({
          reconnectionAttempts: 15,
          timeout: 5000
        });

        this.socket.on('connect', () => {
          this.isConnectedSocket = true;
          this.triggerEvent('connection_status', { connected: true, socketId: this.socket.id });
        });

        this.socket.on('disconnect', () => {
          this.isConnectedSocket = false;
          this.triggerEvent('connection_status', { connected: false });
        });

        this.socket.on('display:show_student', (payload) => {
          this.triggerEvent('show_student', payload, 'socket');
        });

        this.socket.on('display:standby', () => {
          this.triggerEvent('standby', {}, 'socket');
        });

        this.socket.on('display:play_sound', (payload) => {
          this.triggerEvent('play_sound', payload, 'socket');
        });

        this.socket.on('students:updated', (payload) => {
          this.triggerEvent('students_updated', payload, 'socket');
        });

        this.socket.on('settings:updated', (payload) => {
          this.triggerEvent('settings_updated', payload, 'socket');
        });

        this.socket.on('scan:not_found', (payload) => {
          this.triggerEvent('scan_not_found', payload, 'socket');
        });
      } catch (err) {
        console.warn('Socket.io gagal tersambung, beralih ke BroadcastChannel mode lokal.', err);
      }
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  triggerEvent(event, payload, source) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try {
          cb(payload, source);
        } catch (err) {
          console.error(`Error in listener for ${event}:`, err);
        }
      });
    }
  }

  sendShowStudent(student, options = {}) {
    const payload = { student, timestamp: Date.now(), options };

    if (this.socket && this.socket.connected) {
      this.socket.emit('scan:trigger', payload);
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'show_student',
        payload
      });
    }

    try {
      localStorage.setItem('wisuda_event_bus', JSON.stringify({
        type: 'show_student',
        payload,
        rnd: Math.random()
      }));
    } catch (e) {}
  }

  sendStandby() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('display:trigger_standby');
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'standby',
        payload: {}
      });
    }

    try {
      localStorage.setItem('wisuda_event_bus', JSON.stringify({
        type: 'standby',
        payload: {},
        rnd: Math.random()
      }));
    } catch (e) {}
  }

  sendPlaySound(soundType = 'chime') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('display:trigger_sound', soundType);
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'play_sound',
        payload: { type: soundType }
      });
    }
  }

  sendSettings(settings) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('settings:change', settings);
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'settings_updated',
        payload: settings
      });
    }

    try {
      localStorage.setItem('wisuda_event_bus', JSON.stringify({
        type: 'settings_updated',
        payload: settings,
        rnd: Math.random()
      }));
    } catch (e) {}
  }
}

window.WisudaSyncClient = WisudaSyncClient;
