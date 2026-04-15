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

  // --- File Storage Setup ---
  const fs = require('fs-extra'); // Using fs-extra for easier dir creation if available, or just fs.promises
  const userDataPath = app.getPath('userData');
  const logsPath = path.join(userDataPath, 'logs');
  const savesPath = path.join(userDataPath, 'saves');

  // Ensure directories exist
  [logsPath, savesPath].forEach(dir => {
    if (!require('fs').existsSync(dir)) {
      require('fs').mkdirSync(dir, { recursive: true });
    }
  });

  ipcMain.handle('app:save-game', async (event, data) => {
    const saveFile = path.join(savesPath, 'savegame.json');
    try {
      await require('fs').promises.writeFile(saveFile, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true };
    } catch (err) {
      console.error('Failed to save game:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('app:load-game', async () => {
    const saveFile = path.join(savesPath, 'savegame.json');
    try {
      const data = await require('fs').promises.readFile(saveFile, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      return null; // No save or error
    }
  });

  ipcMain.handle('app:write-log', async (event, { type, message }) => {
    const logFile = path.join(logsPath, 'session.json');
    const timestamp = new Date().toISOString();
    const entry = { type, message, timestamp };

    try {
      let logs = [];
      try {
        const data = await require('fs').promises.readFile(logFile, 'utf-8');
        logs = JSON.parse(data);
      } catch (e) {
        // File doesn't exist or is empty — create empty array
        await require('fs').promises.writeFile(logFile, '[]', 'utf-8');
      }
      logs.push(entry);
      await require('fs').promises.writeFile(logFile, JSON.stringify(logs, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Failed to write log:', err);
      return false;
    }
  });

  ipcMain.handle('app:open-debug-console', async () => {
    const logFile = path.join(logsPath, 'session.json');
    const { spawn } = require('child_process');

    // 1. Safety Check: Ensure log file exists before spawning PS
    if (!require('fs').existsSync(logFile)) {
      try {
        require('fs').writeFileSync(logFile, '[]', 'utf-8');
      } catch (err) {
        console.error('Failed to pre-create log file:', err);
        return false;
      }
    }

    // 2. Spawn External PowerShell Window
    // Using -Tail 20 as suggested to avoid long dumps
    const psCommand = `Get-Content -Path "${logFile}" -Wait -Tail 20`;
    
    try {
      spawn('powershell.exe', [
        '-NoExit',
        '-Command',
        psCommand
      ], {
        detached: true,
        shell: true
      });
      return true;
    } catch (err) {
      console.error('Failed to launch debug console:', err);
      return false;
    }
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
