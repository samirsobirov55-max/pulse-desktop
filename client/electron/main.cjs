const { app, BrowserWindow, shell, ipcMain, Notification } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:  1200,
    height: 800,
    minWidth:  800,
    minHeight: 600,
    frame: false,          // убираем нативный фрейм — Pulse рисует свой
    titleBarStyle: 'hidden',
    backgroundColor: '#050510',
    icon: path.join(__dirname, '../public/icon.svg'),
    webPreferences: {
      preload:               path.join(__dirname, 'preload.cjs'),
      nodeIntegration:       false,
      contextIsolation:      true,
      webSecurity:           true,
      // Разрешаем захват медиа
      experimentalFeatures:  true,
    },
  });

  // Загружаем URL сервера (Pulse на HF Spaces)
  // URL задаётся при сборке через VITE_API_URL или вписывается сюда
  const SERVER_URL = process.env.PULSE_SERVER_URL || 'https://auragra-telegram-web.hf.space';

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(SERVER_URL);
  }

  // Запрашиваем разрешения автоматически
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'geolocation', 'notifications', 'microphone', 'camera'];
    callback(allowed.includes(permission));
  });

  // Открываем внешние ссылки в браузере
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Системные уведомления через Electron
  ipcMain.on('notify', (_, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body, silent: false }).show();
    }
  });

  // Управление окном (без нативного фрейма)
  ipcMain.on('win:minimize', () => mainWindow.minimize());
  ipcMain.on('win:maximize', () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
  ipcMain.on('win:close',    () => mainWindow.close());
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
