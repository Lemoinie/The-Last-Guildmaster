import { GameState } from './state.js';
import { GameEngine } from './engine.js';

class UIController {
    constructor() {
        this.currentView = 'tavern';
        this.viewContainer = document.getElementById('view-container');
        this.navButtons = document.querySelectorAll('.nav-btn');
        
        this.init();
    }

    init() {
        // Setup navigation
        this.navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // Subscribe to state changes
        GameState.subscribe(state => this.render(state));

        // Start engine
        GameEngine.start();
        
        // Initial render
        this.render(GameState.state);
        this.switchView('tavern');
    }

    switchView(viewId) {
        this.currentView = viewId;
        this.navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
        });

        // Update background
        this.viewContainer.className = 'glass-panel bg-' + viewId;
        
        this.renderView();
    }

    render(state) {
        // Update top bar stats
        document.getElementById('gold-value').textContent = Math.floor(state.gold);
        document.getElementById('renown-value').textContent = state.renown;
        document.getElementById('adventurer-count').textContent = `${state.adventurers.length} / ${state.maxAdventurers}`;
        
        // Render current view content
        this.renderView();
    }

    renderView() {
        if (!this.viewContainer) return;

        const state = GameState.state;
        let content = '';

        switch (this.currentView) {
            case 'tavern':
                content = this.renderTavern(state);
                break;
            case 'inn':
                content = this.renderInn(state);
                break;
            case 'storage':
                content = this.renderStorage(state);
                break;
            case 'expedition':
                content = this.renderExpeditions(state);
                break;
            case 'blacksmith':
                content = this.renderBlacksmith(state);
                break;
            default:
                content = `<div class="view-header">
                            <h2 class="view-title">${this.currentView.charAt(0).toUpperCase() + this.currentView.slice(1)}</h2>
                            <p class="view-description">This building is currently under construction...</p>
                          </div>`;
        }

        this.viewContainer.innerHTML = content;
        this.attachEventListeners();
    }

    renderTavern(state) {
        return `
            <div class="view-header">
                <h2 class="view-title">The Rusty Goblet</h2>
                <p class="view-description">Recruit brave souls for your guild.</p>
            </div>
            <div class="grid-container">
                <div class="item-card">
                    <h3>Common Adventurer</h3>
                    <p>Basic stats, high availability.</p>
                    <p class="accent-text">Cost: 100 Gold</p>
                    <button class="action-btn" onclick="window.recruit('common')">Recruit</button>
                </div>
            </div>
        `;
    }

    renderInn(state) {
        const list = state.adventurers.length > 0 
            ? state.adventurers.map(adv => `<div class="item-card"><h3>${adv.name}</h3><p>Level ${adv.level} ${adv.class}</p></div>`).join('')
            : '<p>No adventurers recruited yet.</p>';
            
        return `
            <div class="view-header">
                <h2 class="view-title">The Cozy Rest</h2>
                <p class="view-description">Manage your roster of heroes.</p>
            </div>
            <div class="grid-container">
                ${list}
            </div>
        `;
    }

    renderStorage(state) {
        const resources = Object.entries(state.inventory).map(([key, val]) => `
            <div class="item-card">
                <h3>${key.charAt(0).toUpperCase() + key.slice(1)}</h3>
                <p class="value">${val}</p>
            </div>
        `).join('');

        return `
            <div class="view-header">
                <h2 class="view-title">Guild Vault</h2>
                <p class="view-description">Items and resources gathered from expeditions.</p>
            </div>
            <div class="grid-container">
                ${resources}
            </div>
        `;
    }

    renderExpeditions(state) {
        const missions = [
            { id: 1, name: 'Forest Patrol', difficulty: 'Easy', time: 60, reward: 'Wood, Herbs' },
            { id: 2, name: 'Iron Mine Delve', difficulty: 'Medium', time: 300, reward: 'Iron, Stone' }
        ];

        const list = missions.map(m => `
            <div class="item-card">
                <h3>${m.name}</h3>
                <p>Diff: ${m.difficulty}</p>
                <p>Duration: ${m.time}s</p>
                <p class="accent-text">Reward: ${m.reward}</p>
                <button class="action-btn" onclick="window.startExpedition(${m.id})">Deploy</button>
            </div>
        `).join('');

        return `
            <div class="view-header">
                <h2 class="view-title">Expedition Board</h2>
                <p class="view-description">Send your teams to gather resources.</p>
            </div>
            <div class="grid-container">
                ${list}
            </div>
        `;
    }

    renderBlacksmith(state) {
        return `
            <div class="view-header">
                <h2 class="view-title">The Iron Anvil</h2>
                <p class="view-description">Forge weapons and armor for your heroes.</p>
            </div>
            <div class="grid-container">
                <div class="item-card">
                    <h3>Iron Sword</h3>
                    <p>Requirements: 5 Iron, 2 Wood</p>
                    <button class="action-btn">Forge</button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Simple global exposure for prototype actions
        window.recruit = (type) => {
            GameState.update(state => {
                if (state.gold >= 100 && state.adventurers.length < state.maxAdventurers) {
                    state.gold -= 100;
                    state.adventurers.push({
                        name: this.generateName(),
                        class: 'Squire',
                        level: 1,
                        id: Date.now()
                    });
                    this.notify(`A new adventurer has joined the guild!`);
                } else if (state.gold < 100) {
                    this.notify(`Not enough gold!`, 'error');
                } else {
                    this.notify(`Guild is full!`, 'error');
                }
            });
        };
    }

    generateName() {
        const names = ['Aldric', 'Elowen', 'Kael', 'Lyra', 'Brom', 'Sera', 'Varis'];
        return names[Math.floor(Math.random() * names.length)] + ' ' + (Math.floor(Math.random() * 99));
    }

    notify(message, type = 'success') {
        const container = document.getElementById('notification-container');
        const toast = document.createElement('div');
        toast.className = `toast glass-panel ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Global styles for toast
const style = document.createElement('style');
style.textContent = `
    #notification-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 1000;
    }
    .toast {
        padding: 12px 20px;
        border-left: 4px solid var(--accent-primary);
        animation: slideIn 0.3s ease;
    }
    .toast.error {
        border-left-color: var(--accent-red);
    }
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    .action-btn {
        margin-top: 15px;
        background: var(--accent-primary);
        border: none;
        color: black;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
        width: 100%;
        transition: filter 0.2s;
    }
    .action-btn:hover {
        filter: brightness(1.2);
    }
`;
document.head.appendChild(style);

// Only initialize the game when the player clicks "Play" from the main menu.
let uiControllerInstance = null;
document.addEventListener('game:start', () => {
    if (!uiControllerInstance) {
        uiControllerInstance = new UIController();
    }
});
