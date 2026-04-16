import { GameState } from './state.js';

/**
 * Game Engine
 * Manages the game loop and core simulation logic.
 */
class Engine {
    constructor() {
        this.tickRate = 1000; // 1 second
        this.intervalId = null;
    }

    start() {
        if (this.intervalId) return;
        this.intervalId = setInterval(() => this.tick(), this.tickRate);
        console.log('Engine started.');
    }

    stop() {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }

    tick() {
        GameState.update(state => {
            // Process Expeditions
            state.expeditions.forEach(exp => {
                if (exp.status === 'active') {
                    exp.remainingTime -= 1;
                    if (exp.remainingTime <= 0) {
                        this.finishExpedition(exp);
                    }
                }
            });

            // Process Garden (simulated growth)
            // TODO: Garden logic
        });
    }

    finishExpedition(expedition) {
        // Logic to award items and notify UI
        expedition.status = 'completed';
        // Add more logic here later
    }

    log(message) {
        GameState.update(state => {
            state.logs.push(`[${new Date().toLocaleTimeString()}] ${message}`);
            if (state.logs.length > 50) state.logs.shift();
        });
    }
}

export const GameEngine = new Engine();
