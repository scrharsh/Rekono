const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('rekonoDesktop', {
  surface: 'ca',
});
