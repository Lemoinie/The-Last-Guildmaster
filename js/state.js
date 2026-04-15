/**
 * Game State Management
 * Handles persistence and core data structures.
 */

const STORAGE_KEY = 'the_last_guildmaster_save';

export const initialState = {
    gold: 1000,
    renown: 0,
    adventurers: [],
    maxAdventurers: 10,
    inventory: {
        wood: 10,
        stone: 10,
        herbs: 5,
        seeds: 0,
        iron: 2,
    },
    equipment: [],
    expeditions: [],
    unlockedBuildings: ['tavern', 'inn', 'storage'],
    logs: ['Welcome, Guildmaster. Your journey begins.'],
    lastSave: Date.now(),
    debugConsole: false
};

class StateManager {
    constructor() {
        this.state = initialState;
        this.listeners = [];
        this.init();
    }

    async init() {
        if (window.electronAPI?.loadGame) {
            const saved = await window.electronAPI.loadGame();
            if (saved) {
                this.state = { ...initialState, ...saved };
                console.log('State loaded from file system');
            }
        } else {
            // Fallback to localStorage if not in Electron context
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                this.state = { ...initialState, ...JSON.parse(saved) };
            }
        }
        this.notify();
    }

    async save() {
        this.state.lastSave = Date.now();
        
        if (window.electronAPI?.saveGame) {
            await window.electronAPI.saveGame(this.state);
        }
        
        // Keep localStorage as backup
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        this.notify();
    }

    reset() {
        this.state = { ...initialState };
        this.save();
    }

    async update(updater) {
        updater(this.state);
        await this.save();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }
}

export const GameState = new StateManager();
