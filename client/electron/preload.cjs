const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  notify:      (title, body) => ipcRenderer.send('notify', { title, body }),
  minimize:    ()            => ipcRenderer.send('win:minimize'),
  maximize:    ()            => ipcRenderer.send('win:maximize'),
  close:       ()            => ipcRenderer.send('win:close'),
  isElectron:  true,
});
