/**
 * logger.js — Global Logging Utility
 * Sends timestamped logs to the file system via Electron IPC.
 */

const LOG_TYPES = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    SYSTEM: 'SYSTEM'
};

async function log(message, type = LOG_TYPES.INFO) {
    if (window.electronAPI?.writeLog) {
        await window.electronAPI.writeLog(type, message);
    } else {
        console.log(`[${type}] ${message}`);
    }
}

export const Logger = {
    info: (msg) => log(msg, LOG_TYPES.INFO),
    warn: (msg) => log(msg, LOG_TYPES.WARN),
    error: (msg) => log(msg, LOG_TYPES.ERROR),
    system: (msg) => log(msg, LOG_TYPES.SYSTEM),
    types: LOG_TYPES
};
