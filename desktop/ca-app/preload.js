const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rekonoDesktop', {
  surface: 'ca',
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
});
