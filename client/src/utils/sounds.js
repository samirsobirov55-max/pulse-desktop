// ── Pulse Sound Manager — генерация звуков через Web Audio API ──
// Никаких файлов — всё синтезируется в браузере

let ctx = null;
let muted = false;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// Базовая функция: играть ноту
function playTone(freq, startTime, duration, volume = 0.5, type = 'sine', c = null) {
  const ac = c || getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.setValueAtTime(volume, startTime + duration - 0.02);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
  return { osc, gain };
}

export function setMuted(v) { muted = v; }
export function isMuted() { return muted; }
export function preload() { /* ничего не нужно */ }

// ── Звук получения сообщения (два тихих ping) ──
export function playReceive() {
  if (muted) return;
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    playTone(1318, now, 0.08, 0.3, 'sine', ac);
    playTone(1760, now + 0.10, 0.12, 0.25, 'sine', ac);
  } catch {}
}

// ── Звук отправки (короткий whoosh вверх) ──
export function playSend() {
  if (muted) return;
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.12);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.13);
  } catch {}
}

// ── Звук соединения звонка (аккорд) ──
export function playConnect() {
  if (muted) return;
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    playTone(523, now,        0.15, 0.3, 'sine', ac);
    playTone(659, now + 0.05, 0.15, 0.3, 'sine', ac);
    playTone(784, now + 0.10, 0.20, 0.4, 'sine', ac);
  } catch {}
}

// ── Рингтон (мелодия, loopable) ──
let ringtoneTimer = null;
let ringtoneActive = false;

function playRingtoneOnce() {
  if (!ringtoneActive) return;
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    const melody = [
      [880,  0.00, 0.15],
      [1108, 0.17, 0.15],
      [1318, 0.34, 0.22],
      [1108, 0.58, 0.15],
      [880,  0.75, 0.15],
      [1108, 0.92, 0.15],
      [1318, 1.09, 0.22],
    ];
    melody.forEach(([f, t, d]) => playTone(f, now + t, d, 0.4, 'sine', ac));
    // Повтор через 1.6 сек
    ringtoneTimer = setTimeout(() => playRingtoneOnce(), 1600);
  } catch {}
}

export function playRingtone() {
  if (muted) return;
  stopRingtone();
  ringtoneActive = true;
  playRingtoneOnce();
}
export function stopRingtone() {
  ringtoneActive = false;
  if (ringtoneTimer) { clearTimeout(ringtoneTimer); ringtoneTimer = null; }
}

// ── Гудок исходящего звонка (425 Гц, loopable) ──
let incomingTimer = null;
let incomingActive = false;

function playIncomingOnce() {
  if (!incomingActive) return;
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    // 1 сек гудок
    playTone(425, now, 1.0, 0.5, 'sine', ac);
    // Повтор через 1.8 сек (0.8 сек пауза)
    incomingTimer = setTimeout(() => playIncomingOnce(), 1800);
  } catch {}
}

export function playIncoming() {
  if (muted) return;
  stopIncoming();
  incomingActive = true;
  playIncomingOnce();
}
export function stopIncoming() {
  incomingActive = false;
  if (incomingTimer) { clearTimeout(incomingTimer); incomingTimer = null; }
}
