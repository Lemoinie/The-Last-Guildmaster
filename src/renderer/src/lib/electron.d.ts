export interface ElectronAPI {
  quit: () => void
  setWindowMode: (mode: string) => void
  setResolution: (width: number, height: number) => void
  readLegalFile: (filename: string) => Promise<string>
  saveGame: (data: unknown) => Promise<{ success: boolean; error?: string }>
  loadGame: () => Promise<any | null>
  writeLog: (type: string, message: string) => Promise<boolean>
  openDebugConsole: () => Promise<boolean>
  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  installUpdate: () => Promise<void>
  onUpdateStatus: (callback: (status: string, version?: string) => void) => void
  onUpdateProgress: (callback: (percent: number) => void) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
