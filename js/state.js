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
    lastSave: Date.now()
};

class StateManager {
    constructor() {
        this.state = this.load();
        this.listeners = [];
    }

    load() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return { ...initialState, ...parsed };
            } catch (e) {
                console.error('Failed to parse save data', e);
                return { ...initialState };
            }
        }
        return { ...initialState };
    }

    save() {
        this.state.lastSave = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        this.notify();
    }

    reset() {
        this.state = { ...initialState };
        this.save();
    }

    update(updater) {
        updater(this.state);
        this.save();
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
