const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    autoHideMenuBar: true,
    fullscreen: true // Open in full screen by default
  });

  win.loadFile('index.html');

  win.once('ready-to-show', () => {
    win.show();
  });

  // --- IPC Handlers ---
  ipcMain.on('app:quit', () => {
    app.quit();
  });

  ipcMain.on('window:set-mode', (event, mode) => {
    if (mode === 'fullscreen') {
      win.setFullScreen(true);
    } else {
      win.setFullScreen(false);
      win.unmaximize();
    }
  });

  ipcMain.on('window:set-resolution', (event, { width, height }) => {
    if (!win.isFullScreen()) {
      win.setSize(width, height);
      win.center();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
