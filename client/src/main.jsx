import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { preload } from './utils/sounds.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// Preload звуков при первом взаимодействии
const unlock = () => {
  preload();
  document.removeEventListener('click', unlock);
  document.removeEventListener('touchstart', unlock);
};
document.addEventListener('click', unlock);
document.addEventListener('touchstart', unlock);

// Запрашиваем разрешения
// Применяем сохранённую тему
(function() {
  const theme = localStorage.getItem('pulse_theme');
  const themes = {
    dark:   { bg:'#050510', accent:'#7C5CFC' },
    darker: { bg:'#000000', accent:'#7C5CFC' },
    purple: { bg:'#0d0520', accent:'#a855f7' },
    blue:   { bg:'#050b1a', accent:'#3b82f6' },
    green:  { bg:'#051a0d', accent:'#22c55e' },
  };
  const t = themes[theme] || themes.dark;
  document.documentElement.style.setProperty('--bg-dark',   t.bg);
  document.documentElement.style.setProperty('--accent',    t.accent);
  document.documentElement.style.setProperty('--bg-base',   t.bg);
  const fs = localStorage.getItem('pulse_fontsize');
  if (fs) document.documentElement.style.fontSize = fs + 'px';
})();

setTimeout(() => {
  if ('Notification' in window && Notification.permission === 'default')
    Notification.requestPermission().catch(() => {});
  if (navigator.mediaDevices?.getUserMedia)
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then(s => s.getTracks().forEach(t => t.stop())).catch(() => {});
  if (navigator.geolocation)
    navigator.geolocation.getCurrentPosition(() => {}, () => {});
}, 1500);
