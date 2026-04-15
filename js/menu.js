/**
 * menu.js — Main Menu & ToS Controller
 * Handles: ToS acceptance flow, main menu navigation, settings, credits, exit.
 */

const TOS_ACCEPTED_KEY = 'tlg_tos_accepted_v1';

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
function initTos() {
    // Always initialize listeners so tabs/footer work during re-reads
    setupTosTabs();
    setupTosFooter();

    const tosAccepted = localStorage.getItem(TOS_ACCEPTED_KEY);

    if (tosAccepted) {
        // Already accepted — go straight to main menu
        fadeIn(mainMenu);
        return;
    }

    // Show ToS overlay for first-run
    fadeIn(tosOverlay);
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
        
        fadeOut(tosOverlay, () => {
            if (!alreadyAccepted) {
                fadeIn(mainMenu);
            }
        });
    });

    document.getElementById('tos-return-btn').addEventListener('click', () => {
        const alreadyAccepted = localStorage.getItem(TOS_ACCEPTED_KEY) === '1';
        
        if (alreadyAccepted) {
            // Just re-reading, go back to menu
            fadeOut(tosOverlay);
        } else {
            // First run and didn't agree? Quit the app.
            if (window.electronAPI?.quit) {
                window.electronAPI.quit();
            } else {
                window.close();
            }
        }
    });
}

// ─── Main Menu ────────────────────────────────────────────────────────────────
function initMainMenu() {
    // Play button
    document.getElementById('menu-play-btn').addEventListener('click', () => {
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

        // Apply Window Settings via Electron
        if (window.electronAPI) {
            window.electronAPI.setWindowMode(mode);
            if (mode === 'windowed') {
                const [w, h] = res.split('x').map(Number);
                window.electronAPI.setResolution(w, h);
            }
        }

        // Notify user instead of closing
        showSettingsNotification('Configuration Applied');
    });
}

function showSettingsNotification(message) {
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
