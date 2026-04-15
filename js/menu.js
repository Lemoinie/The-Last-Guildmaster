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
    const tosAccepted = localStorage.getItem(TOS_ACCEPTED_KEY);

    if (tosAccepted) {
        // Already accepted — go straight to main menu
        fadeIn(mainMenu);
        startParticles();
        return;
    }

    // Show ToS overlay
    fadeIn(tosOverlay);
    setupTosTabs();
    setupTosFooter();
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
        localStorage.setItem(TOS_ACCEPTED_KEY, '1');
        fadeOut(tosOverlay, () => {
            fadeIn(mainMenu);
            startParticles();
        });
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
            startParticles();
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

    document.getElementById('settings-save-btn').addEventListener('click', () => {
        // Save to localStorage for persistence
        localStorage.setItem('tlg_volume_master', document.getElementById('setting-volume').value);
        localStorage.setItem('tlg_volume_music',  document.getElementById('setting-music').value);
        localStorage.setItem('tlg_volume_fx',     document.getElementById('setting-fx').value);
        localStorage.setItem('tlg_crash_log',     document.getElementById('setting-crash-log').checked ? '1' : '0');
        fadeOut(settingsModal);
    });
}

// ─── Particle System (Canvas) ────────────────────────────────────────────────
let particleAnimFrame = null;

function startParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    // Respect the "disable particles" setting
    const particlesSetting = document.getElementById('setting-particles');
    if (particlesSetting && !particlesSetting.checked) return;

    const ctx = canvas.getContext('2d');
    const PARTICLE_COUNT = 60;
    let particles = [];

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x     = Math.random() * canvas.width;
            this.y     = Math.random() * canvas.height;
            this.vx    = (Math.random() - 0.5) * 0.4;
            this.vy    = -Math.random() * 0.6 - 0.2;
            this.alpha = Math.random() * 0.5 + 0.1;
            this.size  = Math.random() * 2 + 0.5;
            this.color = Math.random() > 0.7 ? '#FF3131' : '#00FF41';
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= 0.001;
            if (this.alpha <= 0 || this.y < -10) this.reset();
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle   = this.color;
            ctx.shadowBlur  = 8;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    resize();
    window.addEventListener('resize', resize);
    particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());

    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        particleAnimFrame = requestAnimationFrame(loop);
    }

    if (particleAnimFrame) cancelAnimationFrame(particleAnimFrame);
    loop();
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initMainMenu();
    initModalCloseHandlers();
    initSettings();
    initTos(); // Last — decides which screen to show first
});
