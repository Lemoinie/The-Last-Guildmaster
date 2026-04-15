const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  quit: () => ipcRenderer.send('app:quit'),
  setWindowMode: (mode) => ipcRenderer.send('window:set-mode', mode),
  setResolution: (width, height) => ipcRenderer.send('window:set-resolution', { width, height }),
  readLegalFile: (filename) => ipcRenderer.invoke('legal:read-file', filename),
  saveGame: (data) => ipcRenderer.invoke('app:save-game', data),
  loadGame: () => ipcRenderer.invoke('app:load-game'),
  writeLog: (type, message) => ipcRenderer.invoke('app:write-log', { type, message }),
  openDebugConsole: () => ipcRenderer.invoke('app:open-debug-console')
});
