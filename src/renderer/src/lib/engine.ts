/**
 * Game Engine — Manages the game loop and core simulation logic.
 */
import { Game } from './stores/game.svelte'

class Engine {
  tickRate = 1000
  intervalId: ReturnType<typeof setInterval> | null = null

  start() {
    if (this.intervalId) return
    this.intervalId = setInterval(() => this.tick(), this.tickRate)
    console.log('Engine started.')
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  tick() {
    // 1. Advance unified world time clock
    Game.advanceTick()

    // 2. Process Expeditions via Game store action
    Game.resolveExpedition()

    // 3. Process Garden (simulated growth)
    // TODO: Garden logic
  }

  log(message: string) {
    Game.addLog('⚙', message, 'info')
  }
}

export const GameEngine = new Engine()
