import { Logger } from './logger.js';

const TOS_ACCEPTED_KEY = 'tlg_tos_accepted_v1';
const APP_VERSION = '0.1.0';
const VERSION_URL = 'https://raw.githubusercontent.com/Lemoinie/The-Last-Guildmaster/main/package.json';

// ─── Layer References ────────────────────────────────────────────────────────
const tosOverlay     = document.getElementById('tos-overlay');
const mainMenu       = document.getElementById('main-menu');
const appDiv         = document.getElementById('app');
const settingsModal  = document.getElementById('settings-modal');
const creditsModal   = document.getElementById('credits-modal');

// ─── Utility Helpers ─────────────────────────────────────────────────────────
function show(el)  { el.classList.remove('hidden'); el.classList.add('visible'); }
function hide(el)  { el.classList.remove('visible'); el.classList.add('hidden'); }

function fadeIn(el) {
    el.classList.remove('hidden');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.add('visible'));
    });
}

function fadeOut(el, callback) {
    el.classList.remove('visible');
    el.addEventListener('transitionend', function handler() {
        el.classList.add('hidden');
        el.removeEventListener('transitionend', handler);
        if (callback) callback();
    });
}

// ─── ToS Flow ────────────────────────────────────────────────────────────────
async function initTos() {
    // Always initialize listeners so tabs/footer work during re-reads
    setupTosTabs();
    setupTosFooter();

    // Load MD files from the legal/ directory
    await loadLegalDocuments();

    // ALWAYS show main menu first for a cleaner experience
    fadeIn(mainMenu);
}

async function loadLegalDocuments() {
    if (!window.electronAPI?.readLegalFile || !window.marked) return;

    const docs = [
        { file: 'tos.md', container: 'tos-scroll' },
        { file: 'modding.md', container: 'modding-scroll' },
        { file: 'privacy.md', container: 'privacy-scroll' }
    ];

    for (const doc of docs) {
        const markdown = await window.electronAPI.readLegalFile(doc.file);
        const container = document.getElementById(doc.container);
        if (container) {
            container.innerHTML = marked.parse(markdown);
            
            // Add click listener for links to copy instead of follow
            container.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const textToCopy = link.getAttribute('href')?.replace(/^mailto:/, '') || link.textContent;
                    navigator.clipboard.writeText(textToCopy);
                    showToastNotification('Address copied to clipboard');
                });
            });
        }
    }
}

function setupTosTabs() {
    const tabs   = tosOverlay.querySelectorAll('.tos-tab');
    const panels = tosOverlay.querySelectorAll('.tos-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            const targetId = tab.getAttribute('data-tab') + '-panel';
            document.getElementById(targetId)?.classList.add('active');
        });
    });
}

function setupTosFooter() {
    const checkbox  = document.getElementById('tos-agree-check');
    const acceptBtn = document.getElementById('tos-accept-btn');

    checkbox.addEventListener('change', () => {
        acceptBtn.disabled = !checkbox.checked;
    });

    acceptBtn.addEventListener('click', () => {
        if (!checkbox.checked) return;
        
        const alreadyAccepted = localStorage.getItem(TOS_ACCEPTED_KEY) === '1';
        localStorage.setItem(TOS_ACCEPTED_KEY, '1');
        
        Logger.info('Legal agreements accepted by user.');
        
        fadeOut(tosOverlay, () => {
            if (!alreadyAccepted) {
                fadeIn(mainMenu);
            }
        });
    });

    document.getElementById('tos-return-btn').addEventListener('click', () => {
        // Just return to the main menu
        fadeOut(tosOverlay);
    });
}

async function checkForUpdates() {
    const statusEl = document.getElementById('update-status');
    if (!statusEl) return;

    if (!navigator.onLine) {
        statusEl.className = 'update-status status-error';
        statusEl.innerHTML = '<span class="status-icon">⚠</span> No internet connection';
        return;
    }

    try {
        // Simple fetch with a short timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(VERSION_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Version fetch failed');
        
        const data = await response.json();
        const remoteVersion = data.version;

        if (remoteVersion === APP_VERSION) {
            statusEl.className = 'update-status status-up-to-date';
            statusEl.innerHTML = `<span class="status-icon">✓</span> Guild is up-to-date (${APP_VERSION})`;
        } else {
            statusEl.className = 'update-status status-update-available';
            statusEl.innerHTML = `<span class="status-icon">✦</span> Update available: v${remoteVersion}`;
        }
    } catch (err) {
        console.warn('Update check failed:', err);
        statusEl.className = 'update-status status-error';
        statusEl.innerHTML = '<span class="status-icon">✕</span> Connection failed';
    }
}

function initMainMenu() {
    // Check for updates on startup
    checkForUpdates();

    // Developer Debug Console (only if enabled in settings)
    if (localStorage.getItem('tlg_debug_console') === '1') {
        window.electronAPI?.openDebugConsole();
    }

    // Play button
    document.getElementById('menu-play-btn').addEventListener('click', () => {
        const tosAccepted = localStorage.getItem(TOS_ACCEPTED_KEY) === '1';

        if (!tosAccepted) {
            // Force ToS acceptance before playing
            fadeIn(tosOverlay);
            return;
        }

        Logger.system('Starting new game session.');

        fadeOut(mainMenu, () => {
            fadeIn(appDiv);
            // Trigger game init — dispatched so ui.js can listen
            document.dispatchEvent(new CustomEvent('game:start'));
        });
    });

    // Settings button
    document.getElementById('menu-settings-btn').addEventListener('click', () => {
        fadeIn(settingsModal);
    });

    // Credits button
    document.getElementById('menu-credits-btn').addEventListener('click', () => {
        fadeIn(creditsModal);
    });

    // Exit button (Electron-aware)
    document.getElementById('menu-exit-btn').addEventListener('click', () => {
        if (window.electronAPI?.quit) {
            window.electronAPI.quit();
        } else {
            window.close();
        }
    });

    // Legal link (re-opens ToS viewer)
    document.getElementById('menu-legal-btn').addEventListener('click', () => {
        fadeIn(tosOverlay);
    });

    // Back to menu from game
    document.getElementById('back-to-menu-btn').addEventListener('click', () => {
        fadeOut(appDiv, () => {
            fadeIn(mainMenu);
        });
    });
}

// ─── Modal Close Logic ────────────────────────────────────────────────────────
function initModalCloseHandlers() {
    document.querySelectorAll('[data-close]').forEach(el => {
        el.addEventListener('click', () => {
            const target = document.getElementById(el.getAttribute('data-close'));
            if (target) fadeOut(target);
        });
    });

    // Escape key closes any open modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            [settingsModal, creditsModal].forEach(m => {
                if (m.classList.contains('visible')) fadeOut(m);
            });
        }
    });
}

// ─── Settings ────────────────────────────────────────────────────────────────
function initSettings() {
    setupSettingsTabs();
    loadSettings();

    // Volume Sliders
    const ranges = [
        { range: 'setting-volume',  display: 'volume-display' },
        { range: 'setting-music',   display: 'music-display' },
        { range: 'setting-fx',      display: 'fx-display' },
    ];

    ranges.forEach(({ range, display }) => {
        const input = document.getElementById(range);
        const label = document.getElementById(display);
        input?.addEventListener('input', () => {
            if (label) label.textContent = input.value + '%';
        });
    });

    // Window Mode & Resolution Logic
    const modeSelect = document.getElementById('setting-window-mode');
    const resSelect  = document.getElementById('setting-resolution');

    const updateResState = () => {
        if (modeSelect.value === 'fullscreen') {
            resSelect.disabled = true;
        } else {
            resSelect.disabled = false;
        }
    };

    modeSelect?.addEventListener('change', updateResState);
    updateResState();

    // Save Logic
    document.getElementById('settings-save-btn').addEventListener('click', () => {
        // Save to localStorage for persistence
        localStorage.setItem('tlg_volume_master', document.getElementById('setting-volume').value);
        localStorage.setItem('tlg_volume_music',  document.getElementById('setting-music').value);
        localStorage.setItem('tlg_volume_fx',     document.getElementById('setting-fx').value);
        localStorage.setItem('tlg_crash_log',     document.getElementById('setting-crash-log').checked ? '1' : '0');
        
        const mode = modeSelect.value;
        const res  = resSelect.value;
        localStorage.setItem('tlg_window_mode', mode);
        localStorage.setItem('tlg_resolution',  res);
        localStorage.setItem('tlg_debug_console', document.getElementById('setting-debug-console').checked ? '1' : '0');

        // Sync with GameState
        import('./state.js').then(({ GameState }) => {
            GameState.state.debugConsole = document.getElementById('setting-debug-console').checked;
            GameState.save();
        });

        // Apply Window Settings via Electron
        if (window.electronAPI) {
            window.electronAPI.setWindowMode(mode);
            if (mode === 'windowed') {
                const [w, h] = res.split('x').map(Number);
                window.electronAPI.setResolution(w, h);
            }
        }

        Logger.info('New settings configuration applied.');

        // Notify user instead of closing
        showToastNotification('Configuration Applied');
    });
}

function showToastNotification(message) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast glass-panel success';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '2000';
    toast.textContent = message;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 2000);
}

function setupSettingsTabs() {
    const tabs   = settingsModal.querySelectorAll('.settings-tab');
    const panels = settingsModal.querySelectorAll('.settings-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            const targetId = 'settings-' + tab.getAttribute('data-settings-tab') + '-panel';
            document.getElementById(targetId)?.classList.add('active');
        });
    });
}

function loadSettings() {
    // Volume
    document.getElementById('setting-volume').value = localStorage.getItem('tlg_volume_master') || 80;
    document.getElementById('setting-music').value  = localStorage.getItem('tlg_volume_music')  || 60;
    document.getElementById('setting-fx').value     = localStorage.getItem('tlg_volume_fx')     || 70;
    
    // Updates the displayed percentages
    ['volume', 'music', 'fx'].forEach(key => {
        const val = document.getElementById(`setting-${key}`).value;
        const display = document.getElementById(`${key}-display`);
        if (display) display.textContent = val + '%';
    });

    // Switches
    document.getElementById('setting-crash-log').checked = localStorage.getItem('tlg_crash_log') === '1';
    document.getElementById('setting-debug-console').checked = localStorage.getItem('tlg_debug_console') === '1';

    // Window Mode & Res
    const savedMode = localStorage.getItem('tlg_window_mode') || 'fullscreen';
    const savedRes  = localStorage.getItem('tlg_resolution')  || '1920x1080';
    
    const modeSelect = document.getElementById('setting-window-mode');
    const resSelect  = document.getElementById('setting-resolution');

    if (modeSelect) modeSelect.value = savedMode;
    if (resSelect) resSelect.value = savedRes;

    // Apply initially if on Electon
    if (window.electronAPI) {
        window.electronAPI.setWindowMode(savedMode);
        if (savedMode === 'windowed') {
            const [w, h] = savedRes.split('x').map(Number);
            window.electronAPI.setResolution(w, h);
        }
    }
}


// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initMainMenu();
    initModalCloseHandlers();
    initSettings();
    initTos(); // Last — decides which screen to show first
});
