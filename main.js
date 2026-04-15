const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');

// --- Emergency Error Handling ---
// If the app crashes silently, this will try to save the error to a file in the game folder.
process.on('uncaughtException', (error) => {
  const crashFile = path.join(app.getPath('userData'), 'crash-report.txt');
  const msg = `CRASH AT ${new Date().toISOString()}:\n${error.stack || error}\n`;
  try {
    fs.appendFileSync(crashFile, msg, 'utf-8');
  } catch (e) {
    console.error('Critical failure: Could not even write crash report.', e);
  }
  app.quit();
});

// --- Absolute Path Globals ---
let logsPath, savesPath;

// --- Stability & Compatibility Fixes ---
// 1. Full Hardware Acceleration enabled (Disabled previously for compatibility).
// app.disableHardwareAcceleration(); // Restored to enable 60FPS performance.

// 2. Fixes "Access is denied" cache errors by disabling disk-based shader caching.
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

// 3. Ensures only one copy of the game runs at a time to prevent file conflicts.
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

// Configure autoUpdater
autoUpdater.autoDownload = false; // We want to show a button first

let win;

function createWindow() {
  // Initialize Paths only when app is ready
  logsPath = path.join(app.getPath('userData'), 'logs');
  savesPath = path.join(app.getPath('userData'), 'saves');

  // Ensure directories exist using native fs
  [logsPath, savesPath].forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.error(`Failed to create directory ${dir}:`, err);
      }
    }
  });

  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Relax sandbox for better asset loading in packaged apps
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    autoHideMenuBar: true,
    fullscreen: true // Open in full screen by default
  });

  // --- Diagnostics for Black Screen Issues ---
  const logDiagnostic = (msg) => {
    const logFile = path.join(app.getPath('userData'), 'logs', 'session.json');
    const timestamp = new Date().toISOString();
    const entry = { type: 'ERROR', message: `DIAGNOSTIC: ${msg}`, timestamp };
    try {
      const fs = require('fs');
      let logs = [];
      if (fs.existsSync(logFile)) {
        logs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
      }
      logs.push(entry);
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write diagnostic log:', e);
    }
  };

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    logDiagnostic(`Failed to load index.html: ${errorCode} - ${errorDescription}`);
  });

  win.webContents.on('render-process-gone', (event, details) => {
    logDiagnostic(`Renderer process gone: ${details.reason} (${details.exitCode})`);
  });

  // --- Auto-Updater Event Listeners ---
  autoUpdater.on('checking-for-update', () => {
    win.webContents.send('update:status', 'checking');
  });

  autoUpdater.on('update-available', (info) => {
    win.webContents.send('update:status', 'available', info.version);
  });

  autoUpdater.on('update-not-available', () => {
    win.webContents.send('update:status', 'latest');
  });

  autoUpdater.on('error', (err) => {
    win.webContents.send('update:status', 'error', err.message);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    win.webContents.send('update:progress', Math.floor(progressObj.percent));
  });

  autoUpdater.on('update-downloaded', () => {
    win.webContents.send('update:status', 'ready');
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  win.once('ready-to-show', () => {
    win.show();
  });

  // --- Immersion Lock (Disable standard browser shortcuts) ---
  win.webContents.on('before-input-event', (event, input) => {
    const isControl = process.platform === 'darwin' ? input.meta : input.control;

    // Block F5, Ctrl+R, Ctrl+Shift+R (Reload)
    if (input.key === 'F5' || (isControl && input.key.toLowerCase() === 'r')) {
      event.preventDefault();
    }
    // Block F12, Ctrl+Shift+I (DevTools)
    if (input.key === 'F12' || (isControl && input.shift && input.key.toLowerCase() === 'i')) {
      event.preventDefault();
    }
    // Block Ctrl+Shift+J (Console)
    if (isControl && input.shift && input.key.toLowerCase() === 'j') {
      event.preventDefault();
    }
    // Block Ctrl+W (Close Window/Tab)
    if (isControl && input.key.toLowerCase() === 'w') {
      event.preventDefault();
    }
  });

  // Disable Right-Click context menu
  win.webContents.on('context-menu', (e) => e.preventDefault());

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

  // --- File Storage Handlers ---
  ipcMain.handle('app:save-game', async (event, data) => {
    if (!savesPath) return { success: false, error: 'Storage not initialized' };
    const saveFile = path.join(savesPath, 'savegame.json');
    try {
      await fs.promises.writeFile(saveFile, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true };
    } catch (err) {
      console.error('Failed to save game:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('app:load-game', async () => {
    if (!savesPath) return null;
    const saveFile = path.join(savesPath, 'savegame.json');
    try {
      const data = await fs.promises.readFile(saveFile, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      return null;
    }
  });

  ipcMain.handle('app:write-log', async (event, { type, message }) => {
    if (!logsPath) return false;
    const logFile = path.join(logsPath, 'session.json');
    const timestamp = new Date().toISOString();
    const entry = { type, message, timestamp };

    try {
      let logs = [];
      try {
        if (fs.existsSync(logFile)) {
          const data = await fs.promises.readFile(logFile, 'utf-8');
          logs = JSON.parse(data);
        }
      } catch (e) {
        await fs.promises.writeFile(logFile, '[]', 'utf-8');
      }
      logs.push(entry);
      await fs.promises.writeFile(logFile, JSON.stringify(logs, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Failed to write log:', err);
      return false;
    }
  });

  ipcMain.handle('app:open-debug-console', async () => {
    if (!logsPath) return false;
    const logFile = path.join(logsPath, 'session.json');
    const { spawn } = require('child_process');

    if (!fs.existsSync(logFile)) {
      try {
        fs.writeFileSync(logFile, '[]', 'utf-8');
      } catch (err) {
        return false;
      }
    }

    const psCommand = `Get-Content -Path "${logFile}" -Wait -Tail 20`;
    
    try {
      spawn('powershell.exe', [
        '-NoExit',
        '-Command',
        psCommand
      ], {
        detached: true,
        stdio: 'ignore'
      }).unref();

      return true;
    } catch (err) {
      return false;
    }
  });

  // --- Auto-Updater IPC ---
  ipcMain.handle('app:check-for-updates', () => {
    if (!app.isPackaged) {
      win.webContents.send('update:status', 'dev');
      return;
    }
    autoUpdater.checkForUpdates();
  });

  ipcMain.handle('app:download-update', () => {
    autoUpdater.downloadUpdate();
  });

  ipcMain.handle('app:install-update', () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.handle('legal:read-file', async (event, filename) => {
    const fs = require('fs').promises;
    const legalPath = path.join(__dirname, 'legal', filename);
    try {
      const content = await fs.readFile(legalPath, 'utf-8');
      return content;
    } catch (err) {
      console.error(`Failed to read legal file ${filename}:`, err);
      return `Error: Could not load ${filename}`;
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
