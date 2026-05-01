const HF = 'https://auragram-telegram-web.hf.space';

export function absUrl(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  // На Android/Electron — добавляем сервер
  const isAbsolute = window.location.protocol === 'file:' 
    || window.location.protocol === 'capacitor:'
    || !!window.Capacitor
    || !!window.electronAPI;
  return isAbsolute ? HF + url : url;
}
