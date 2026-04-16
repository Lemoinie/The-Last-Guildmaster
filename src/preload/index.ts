import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  quit: () => ipcRenderer.send('app:quit'),
  setWindowMode: (mode: string) => ipcRenderer.send('window:set-mode', mode),
  setResolution: (width: number, height: number) =>
    ipcRenderer.send('window:set-resolution', { width, height }),
  readLegalFile: (filename: string) => ipcRenderer.invoke('legal:read-file', filename),
  saveGame: (data: unknown) => ipcRenderer.invoke('app:save-game', data),
  loadGame: () => ipcRenderer.invoke('app:load-game'),
  writeLog: (type: string, message: string) =>
    ipcRenderer.invoke('app:write-log', { type, message }),
  openDebugConsole: () => ipcRenderer.invoke('app:open-debug-console'),

  // Auto-Updater
  checkForUpdates: () => ipcRenderer.invoke('app:check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('app:download-update'),
  installUpdate: () => ipcRenderer.invoke('app:install-update'),
  onUpdateStatus: (callback: (status: string, version?: string) => void) =>
    ipcRenderer.on('update:status', (_event, status, version) => callback(status, version)),
  onUpdateProgress: (callback: (percent: number) => void) =>
    ipcRenderer.on('update:progress', (_event, percent) => callback(percent))
})
