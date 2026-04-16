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
    const state = Game.state
    // Process Expeditions
    state.expeditions.forEach((exp) => {
      if (exp.status === 'active') {
        exp.remainingTime -= 1
        if (exp.remainingTime <= 0) {
          this.finishExpedition(exp)
        }
      }
    })

    // Process Garden (simulated growth)
    // TODO: Garden logic
  }

  finishExpedition(expedition: { status: string }) {
    expedition.status = 'completed'
  }

  log(message: string) {
    const state = Game.state
    state.logs.push(`[${new Date().toLocaleTimeString()}] ${message}`)
    if (state.logs.length > 50) state.logs.shift()
  }
}

export const GameEngine = new Engine()
