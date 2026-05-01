const {
  app, BrowserWindow, session, ipcMain,
  Notification, shell, Menu, Tray, nativeImage
} = require('electron');
const path = require('path');

let store;
try {
  const Store = require('electron-store');
  store = new Store();
} catch {
  const data = {};
  store = { get: (k, d) => data[k] ?? d, set: (k, v) => { data[k] = v; } };
}

let mainWindow = null;
let tray = null;
const callNotifs = new Map(); // callerId -> Notification instance

// ═══════════════════════════════════════════════
// ГЛАВНОЕ ОКНО
// ═══════════════════════════════════════════════
function createWindow() {
  const b = store.get('windowBounds', { width: 1200, height: 750 });

  mainWindow = new BrowserWindow({
    width:     b.width  || 1200,
    height:    b.height || 750,
    x:         b.x,
    y:         b.y,
    minWidth:  400,
    minHeight: 600,
    title:     'Pulse',
    backgroundColor: '#050510',
    frame:     true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show:      false,
    icon: path.join(__dirname, 'assets',
      process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
  });

  // Грузим собранный React
  mainWindow.loadFile(
    path.join(__dirname, '..', 'client', 'dist', 'index.html')
  );

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Все разрешения — разрешаем автоматически
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(true));
  session.defaultSession.setPermissionCheckHandler(() => true);

  // Сохранять размер
  mainWindow.on('resize', () => {
    if (!mainWindow.isMaximized())
      store.set('windowBounds', mainWindow.getBounds());
  });
  mainWindow.on('move', () => {
    if (!mainWindow.isMaximized())
      store.set('windowBounds', mainWindow.getBounds());
  });

  // При закрытии — скрыть в трей (Windows/Linux)
  mainWindow.on('close', e => {
    if (process.platform !== 'darwin' && tray) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  // Внешние ссылки → браузер
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  buildMenu();
}

// ═══════════════════════════════════════════════
// МЕНЮ
// ═══════════════════════════════════════════════
function buildMenu() {
  const tpl = [
    ...(process.platform === 'darwin' ? [{
      label: 'Pulse',
      submenu: [
        { role: 'about', label: 'О Pulse' },
        { type: 'separator' },
        { role: 'hide', label: 'Скрыть' },
        { role: 'quit', label: 'Выйти' },
      ]
    }] : []),
    {
      label: 'Правка',
      submenu: [
        { role: 'cut',       label: 'Вырезать' },
        { role: 'copy',      label: 'Копировать' },
        { role: 'paste',     label: 'Вставить' },
        { role: 'selectAll', label: 'Выбрать всё' },
      ]
    },
    {
      label: 'Вид',
      submenu: [
        { role: 'reload',          label: 'Обновить' },
        { role: 'toggleDevTools',  label: 'Инструменты разработчика' },
        { type: 'separator' },
        { role: 'resetZoom',       label: 'Сбросить масштаб' },
        { role: 'zoomIn',          label: 'Увеличить' },
        { role: 'zoomOut',         label: 'Уменьшить' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Полный экран' },
      ]
    },
    {
      label: 'Окно',
      submenu: [
        { role: 'minimize', label: 'Свернуть' },
        ...(process.platform === 'darwin'
          ? [{ role: 'zoom' }]
          : [{ role: 'maximize', label: 'Развернуть' }]),
        { type: 'separator' },
        { label: 'Показать окно', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
      ]
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(tpl));
}

// ═══════════════════════════════════════════════
// ТРЕЙ
// ═══════════════════════════════════════════════
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray.png');
  const img = nativeImage.createFromPath(iconPath);
  tray = new Tray(img.isEmpty() ? nativeImage.createEmpty() : img.resize({ width: 16, height: 16 }));
  tray.setToolTip('Pulse Messenger');

  tray.on('click', () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
  });

  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Открыть Pulse', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { type: 'separator' },
    { label: 'Выйти', click: () => { app.exit(0); } },
  ]));
}

// ═══════════════════════════════════════════════
// IPC — сообщения от renderer
// ═══════════════════════════════════════════════

// Обычное уведомление (новое сообщение)
ipcMain.on('notif:message', (_, { title, body, chatId }) => {
  if (!Notification.isSupported()) return;
  const n = new Notification({
    title,
    body,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    silent: false,
    timeoutType: 'default',
  });
  n.on('click', () => {
    mainWindow?.show();
    mainWindow?.focus();
    if (chatId) mainWindow?.webContents.send('open:chat', chatId);
  });
  n.show();
});

// Уведомление о входящем звонке (с кнопками)
ipcMain.on('notif:call', (_, { callerId, callerName, callerAvatar, isVideo }) => {
  if (!Notification.isSupported()) return;

  // Закрываем предыдущее если есть
  if (callNotifs.has(callerId)) {
    try { callNotifs.get(callerId).close(); } catch {}
    callNotifs.delete(callerId);
  }

  const n = new Notification({
    title: `📞 ${isVideo ? 'Видеозвонок' : 'Голосовой звонок'}`,
    body:  `${callerName} звонит вам`,
    icon:  path.join(__dirname, 'assets', 'icon.png'),
    silent: false,
    timeoutType: 'never', // не исчезает само
    actions: [
      { type: 'button', text: '✅ Принять' },
      { type: 'button', text: '❌ Отклонить' },
    ],
    closeButtonText: 'Закрыть',
    urgency: 'critical',
  });

  // Принять
  n.on('action', (_, idx) => {
    mainWindow?.show();
    mainWindow?.focus();
    if (idx === 0) {
      mainWindow?.webContents.send('call:accept', { callerId });
    } else {
      mainWindow?.webContents.send('call:reject', { callerId });
    }
    callNotifs.delete(callerId);
  });

  // Клик на само уведомление — открыть окно
  n.on('click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  n.on('close', () => callNotifs.delete(callerId));

  n.show();
  callNotifs.set(callerId, n);

  // Показываем окно поверх всех
  mainWindow?.setAlwaysOnTop(true, 'screen-saver');
  setTimeout(() => mainWindow?.setAlwaysOnTop(false), 500);
});

// Закрыть уведомление о звонке (когда звонок отменён)
ipcMain.on('notif:call:close', (_, { callerId }) => {
  if (callNotifs.has(callerId)) {
    try { callNotifs.get(callerId).close(); } catch {}
    callNotifs.delete(callerId);
  }
});

// Управление окном
ipcMain.on('window:minimize',  () => mainWindow?.minimize());
ipcMain.on('window:maximize',  () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
ipcMain.on('window:close',     () => mainWindow?.close());
ipcMain.on('window:show',      () => { mainWindow?.show(); mainWindow?.focus(); });
ipcMain.handle('window:isMax', () => mainWindow?.isMaximized() ?? false);

// Старый API для совместимости
ipcMain.on('show-notification', (_, { title, body }) => {
  ipcMain.emit('notif:message', _, { title, body });
});

// ═══════════════════════════════════════════════
// ЗАПУСК
// ═══════════════════════════════════════════════
app.whenReady().then(() => {
  createWindow();
  if (process.platform !== 'darwin') createTray();

  app.on('activate', () => {
    if (!mainWindow) createWindow();
    else { mainWindow.show(); mainWindow.focus(); }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (tray) { tray.destroy(); tray = null; }
});
