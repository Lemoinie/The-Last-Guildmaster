/**
 * Logger — Global Logging Utility
 * Sends timestamped logs to the file system via Electron IPC.
 */

const LOG_TYPES = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SYSTEM: 'SYSTEM'
} as const

type LogType = (typeof LOG_TYPES)[keyof typeof LOG_TYPES]

async function log(message: string, type: LogType = LOG_TYPES.INFO): Promise<void> {
  if (window.electronAPI?.writeLog) {
    await window.electronAPI.writeLog(type, message)
  } else {
    console.log(`[${type}] ${message}`)
  }
}

export const Logger = {
  info: (msg: string) => log(msg, LOG_TYPES.INFO),
  warn: (msg: string) => log(msg, LOG_TYPES.WARN),
  error: (msg: string) => log(msg, LOG_TYPES.ERROR),
  system: (msg: string) => log(msg, LOG_TYPES.SYSTEM),
  types: LOG_TYPES
}
