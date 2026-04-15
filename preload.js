const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  quit: () => ipcRenderer.send('app:quit'),
  setWindowMode: (mode) => ipcRenderer.send('window:set-mode', mode),
  setResolution: (width, height) => ipcRenderer.send('window:set-resolution', { width, height })
});
