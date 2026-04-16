import { app, BrowserWindow, ipcMain, screen } from 'electron'
import path from 'path'
import { autoUpdater } from 'electron-updater'
import fs from 'fs'

// --- Emergency Error Handling ---
process.on('uncaughtException', (error) => {
  const crashFile = path.join(app.getPath('userData'), 'crash-report.txt')
  const msg = `CRASH AT ${new Date().toISOString()}:\n${error.stack || error}\n`
  try {
    fs.appendFileSync(crashFile, msg, 'utf-8')
  } catch (e) {
    console.error('Critical failure: Could not even write crash report.', e)
  }
  app.quit()
})

// --- Absolute Path Globals ---
let logsPath: string
let savesPath: string

// --- Stability & Compatibility Fixes ---
// 1. Full Hardware Acceleration enabled (Disabled previously for compatibility).
// app.disableHardwareAcceleration(); // Restored to enable 60FPS performance.

// 2. Fixes "Access is denied" cache errors by disabling disk-based shader caching.
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')

// 3. Ensures only one copy of the game runs at a time to prevent file conflicts.
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

// Configure autoUpdater
autoUpdater.autoDownload = false

let win: BrowserWindow | null = null

function createWindow() {
  // Initialize Paths only when app is ready
  logsPath = path.join(app.getPath('userData'), 'logs')
  savesPath = path.join(app.getPath('userData'), 'saves')

  // Ensure directories exist using native fs
  ;[logsPath, savesPath].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true })
      } catch (err) {
        console.error(`Failed to create directory ${dir}:`, err)
      }
    }
  })

  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, '../preload/index.js')
    },
    show: false,
    autoHideMenuBar: true,
    fullscreen: true
  })

  // --- Diagnostics for Black Screen Issues ---
  const logDiagnostic = (msg: string) => {
    const logFile = path.join(app.getPath('userData'), 'logs', 'session.json')
    const timestamp = new Date().toISOString()
    const entry = { type: 'ERROR', message: `DIAGNOSTIC: ${msg}`, timestamp }
    try {
      let logs: any[] = []
      if (fs.existsSync(logFile)) {
        logs = JSON.parse(fs.readFileSync(logFile, 'utf-8'))
      }
      logs.push(entry)
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf-8')
    } catch (e) {
      console.error('Failed to write diagnostic log:', e)
    }
  }

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    logDiagnostic(`Failed to load: ${errorCode} - ${errorDescription}`)
  })

  win.webContents.on('render-process-gone', (_event, details) => {
    logDiagnostic(`Renderer process gone: ${details.reason} (${details.exitCode})`)
  })

  // --- Auto-Updater Event Listeners ---
  autoUpdater.on('checking-for-update', () => {
    win?.webContents.send('update:status', 'checking')
  })

  autoUpdater.on('update-available', (info) => {
    win?.webContents.send('update:status', 'available', info.version)
  })

  autoUpdater.on('update-not-available', () => {
    win?.webContents.send('update:status', 'latest')
  })

  autoUpdater.on('error', (err) => {
    win?.webContents.send('update:status', 'error', err.message)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    win?.webContents.send('update:progress', Math.floor(progressObj.percent))
  })

  autoUpdater.on('update-downloaded', () => {
    win?.webContents.send('update:status', 'ready')
  })

  // Load the renderer
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  win.once('ready-to-show', () => {
    win?.show()
  })

  // --- Immersion Lock (Disable standard browser shortcuts) ---
  win.webContents.on('before-input-event', (event, input) => {
    const isControl = process.platform === 'darwin' ? input.meta : input.control
    if (input.key === 'F5' || (isControl && input.key.toLowerCase() === 'r')) {
      event.preventDefault()
    }
    if (input.key === 'F12' || (isControl && input.shift && input.key.toLowerCase() === 'i')) {
      event.preventDefault()
    }
    if (isControl && input.shift && input.key.toLowerCase() === 'j') {
      event.preventDefault()
    }
    if (isControl && input.key.toLowerCase() === 'w') {
      event.preventDefault()
    }
  })

  win.webContents.on('context-menu', (e) => e.preventDefault())

  // --- IPC Handlers ---
  ipcMain.on('app:quit', () => app.quit())

  ipcMain.on('window:set-mode', (_event, mode: string) => {
    if (mode === 'fullscreen') {
      win?.setFullScreen(true)
    } else {
      win?.setFullScreen(false)
      win?.unmaximize()
    }
  })

  ipcMain.on('window:set-resolution', (_event, { width, height }: { width: number; height: number }) => {
    if (!win?.isFullScreen()) {
      win?.setSize(width, height)
      win?.center()
    }
  })

  // --- File Storage Handlers ---
  ipcMain.handle('app:save-game', async (_event, data: unknown) => {
    if (!savesPath) return { success: false, error: 'Storage not initialized' }
    const saveFile = path.join(savesPath, 'savegame.json')
    try {
      await fs.promises.writeFile(saveFile, JSON.stringify(data, null, 2), 'utf-8')
      return { success: true }
    } catch (err: any) {
      console.error('Failed to save game:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('app:load-game', async () => {
    if (!savesPath) return null
    const saveFile = path.join(savesPath, 'savegame.json')
    try {
      const data = await fs.promises.readFile(saveFile, 'utf-8')
      return JSON.parse(data)
    } catch {
      return null
    }
  })

  ipcMain.handle('app:write-log', async (_event, { type, message }: { type: string; message: string }) => {
    if (!logsPath) return false
    const logFile = path.join(logsPath, 'session.json')
    const timestamp = new Date().toISOString()
    const entry = { type, message, timestamp }

    try {
      let logs: any[] = []
      try {
        if (fs.existsSync(logFile)) {
          const data = await fs.promises.readFile(logFile, 'utf-8')
          logs = JSON.parse(data)
        }
      } catch {
        await fs.promises.writeFile(logFile, '[]', 'utf-8')
      }
      logs.push(entry)
      await fs.promises.writeFile(logFile, JSON.stringify(logs, null, 2), 'utf-8')
      return true
    } catch (err) {
      console.error('Failed to write log:', err)
      return false
    }
  })

  ipcMain.handle('app:open-debug-console', async () => {
    if (!logsPath) return false
    const logFile = path.join(logsPath, 'session.json')
    const { spawn } = require('child_process')

    if (!fs.existsSync(logFile)) {
      try {
        fs.writeFileSync(logFile, '[]', 'utf-8')
      } catch {
        return false
      }
    }

    const psCommand = `Get-Content -Path "${logFile}" -Wait -Tail 20`
    try {
      spawn('powershell.exe', ['-NoExit', '-Command', psCommand], {
        detached: true,
        stdio: 'ignore'
      }).unref()
      return true
    } catch {
      return false
    }
  })

  // --- Auto-Updater IPC ---
  ipcMain.handle('app:check-for-updates', () => {
    if (!app.isPackaged) {
      win?.webContents.send('update:status', 'dev')
      return
    }
    autoUpdater.checkForUpdates()
  })

  ipcMain.handle('app:download-update', () => autoUpdater.downloadUpdate())
  ipcMain.handle('app:install-update', () => autoUpdater.quitAndInstall())

  ipcMain.handle('legal:read-file', async (_event, filename: string) => {
    const legalPath = app.isPackaged
      ? path.join(process.resourcesPath, 'legal', filename)
      : path.join(__dirname, '../../legal', filename)
    try {
      const content = await fs.promises.readFile(legalPath, 'utf-8')
      return content
    } catch (err) {
      console.error(`Failed to read legal file ${filename}:`, err)
      return `Error: Could not load ${filename}`
    }
  })
}

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
