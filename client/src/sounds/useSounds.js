/**
 * Pulse Sound Manager
 * Использует WAV файлы из /sounds/, fallback на Web Audio API
 */

class SoundManager {
  constructor() {
    this.ctx    = null;
    this.sounds = {};
    this.enabled = true;
    this._ringtoneAudio  = null;
    this._incomingAudio  = null;
  }

  _ctx() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    }
    return this.ctx;
  }

  // Загрузить WAV файл
  _load(name) {
    if (this.sounds[name]) return this.sounds[name];
    const a = new Audio(`/sounds/${name}.wav`);
    a.preload = 'auto';
    this.sounds[name] = a;
    return a;
  }

  // Воспроизвести WAV (только в обычном браузере, не в Electron/Android)
  _playWav(name, { loop=false, volume=1 } = {}) {
    if (!this.enabled) return null;
    // В Electron и Android WAV файлы недоступны — используем только Web Audio
    const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
    const isAndroid  = typeof window !== 'undefined' && (!!window.Capacitor || window.location?.protocol === 'file:');
    if (isElectron || isAndroid) return null;
    try {
      const clone = this._load(name).cloneNode();
      clone.volume = volume;
      clone.loop   = loop;
      clone.play().catch(() => {});
      return clone;
    } catch { return null; }
  }

  // ── Генерация звука через Web Audio API (fallback) ──

  // Гудок исходящего: "пи-и-и" 440Hz
  _genDialtone(duration = 1.2) {
    const ctx = this._ctx(); if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 440;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.3, ctx.currentTime + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  // Рингтон: нарастающий "ди-ди-ди-дааа"
  _genRingtone() {
    const ctx = this._ctx(); if (!ctx) return;
    const notes = [880, 988, 1046, 784];
    let t = ctx.currentTime;
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'triangle';
      const dur = i === notes.length-1 ? 0.5 : 0.15;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.setValueAtTime(0.25, t + dur - 0.03);
      gain.gain.linearRampToValueAtTime(0, t + dur);
      osc.start(t); osc.stop(t + dur);
      t += dur + (i < notes.length-1 ? 0.02 : 0);
    });
  }

  // Звук отправки: короткий "пик" вверх
  _genSend() {
    const ctx = this._ctx(); if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.1);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.13);
  }

  // Звук получения: "пинг" вниз
  _genReceive() {
    const ctx = this._ctx(); if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(1100, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.15);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
  }

  // Звук соединения: "та-дааа"
  _genConnect() {
    const ctx = this._ctx(); if (!ctx) return;
    [[523, 0], [659, 0.12], [784, 0.24]].forEach(([freq, delay]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'triangle';
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.03);
      gain.gain.setValueAtTime(0.2, t + 0.18);
      gain.gain.linearRampToValueAtTime(0, t + 0.22);
      osc.start(t); osc.stop(t + 0.25);
    });
  }

  // ── Публичные методы ──

  send() {
    if (!this.enabled) return;
    const a = this._playWav('send', { volume: 0.5 });
    if (!a) this._genSend();
  }

  receive() {
    if (!this.enabled) return;
    const a = this._playWav('receive', { volume: 0.6 });
    if (!a) this._genReceive();
  }

  connect() {
    if (!this.enabled) return;
    const a = this._playWav('connect', { volume: 0.7 });
    if (!a) this._genConnect();
  }

  // Гудок исходящего звонка (зацикленный)
  startDialtone() {
    if (!this.enabled) return;
    this.stopDialtone();
    const a = this._playWav('ringtone', { loop: true, volume: 0.6 });
    if (a) { this._ringtoneAudio = a; return; }
    // Fallback: повторяем через setInterval
    this._genDialtone(1.0);
    this._ringtoneInterval = setInterval(() => this._genDialtone(1.0), 2000);
  }

  stopDialtone() {
    if (this._ringtoneAudio) {
      this._ringtoneAudio.pause();
      this._ringtoneAudio.currentTime = 0;
      this._ringtoneAudio = null;
    }
    clearInterval(this._ringtoneInterval);
    this._ringtoneInterval = null;
  }

  // Рингтон входящего звонка
  startRingtone() {
    if (!this.enabled) return;
    this.stopRingtone();
    const a = this._playWav('incoming', { loop: true, volume: 0.8 });
    if (a) { this._incomingAudio = a; return; }
    this._genRingtone();
    this._incomingInterval = setInterval(() => this._genRingtone(), 1800);
  }

  stopRingtone() {
    if (this._incomingAudio) {
      this._incomingAudio.pause();
      this._incomingAudio.currentTime = 0;
      this._incomingAudio = null;
    }
    clearInterval(this._incomingInterval);
    this._incomingInterval = null;
  }

  stopAll() {
    this.stopDialtone();
    this.stopRingtone();
  }

  toggle() { this.enabled = !this.enabled; return this.enabled; }
}

export const soundManager = new SoundManager();

// Preload при первом взаимодействии пользователя
if (typeof window !== 'undefined') {
  const unlock = () => {
    // Разблокировать AudioContext
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf; src.connect(ctx.destination); src.start(0);
      soundManager.ctx = ctx;
    } catch {}
    // Preload WAV файлы
    ['ringtone','incoming','send','receive','connect'].forEach(n => soundManager._load(n));
    window.removeEventListener('click',      unlock);
    window.removeEventListener('touchstart', unlock);
    window.removeEventListener('keydown',    unlock);
  };
  window.addEventListener('click',      unlock, { once: true });
  window.addEventListener('touchstart', unlock, { once: true });
  window.addEventListener('keydown',    unlock, { once: true });
}
