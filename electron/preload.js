const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // ── Уведомления ──
  // Новое сообщение
  notifyMessage: (title, body, chatId) =>
    ipcRenderer.send('notif:message', { title, body, chatId }),

  // Входящий звонок (с кнопками Принять/Отклонить)
  notifyCall: (callerId, callerName, callerAvatar, isVideo) =>
    ipcRenderer.send('notif:call', { callerId, callerName, callerAvatar, isVideo }),

  // Закрыть уведомление о звонке
  closeCallNotif: (callerId) =>
    ipcRenderer.send('notif:call:close', { callerId }),

  // ── Слушатели событий от main ──
  // Пользователь нажал "Принять" в уведомлении
  onCallAccept: (cb) => {
    ipcRenderer.on('call:accept', (_, data) => cb(data));
  },
  // Пользователь нажал "Отклонить" в уведомлении
  onCallReject: (cb) => {
    ipcRenderer.on('call:reject', (_, data) => cb(data));
  },
  // Открыть конкретный чат
  onOpenChat: (cb) => {
    ipcRenderer.on('open:chat', (_, chatId) => cb(chatId));
  },

  // ── Управление окном ──
  minimize:    () => ipcRenderer.send('window:minimize'),
  maximize:    () => ipcRenderer.send('window:maximize'),
  close:       () => ipcRenderer.send('window:close'),
  show:        () => ipcRenderer.send('window:show'),
  isMaximized: () => ipcRenderer.invoke('window:isMax'),

  // Снять все листенеры (cleanup)
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
