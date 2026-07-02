/**
 * Game Engine — Manages the game loop and core simulation logic.
 */
import { Game } from './stores/game.svelte'

class Engine {
  intervalId: ReturnType<typeof setInterval> | null = null
  lastTimestamp = 0
  accumulator = 0

  start() {
    if (this.intervalId) return
    this.lastTimestamp = performance.now()
    this.accumulator = 0
    // Check elapsed delta frequently to ensure tick accuracy and lag recovery
    this.intervalId = setInterval(() => this.loopStep(), 100)
    console.log('Engine started.')
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  loopStep() {
    const now = performance.now()
    const delta = now - this.lastTimestamp
    this.lastTimestamp = now

    this.accumulator += delta
    while (this.accumulator >= 1000) {
      this.tick()
      this.accumulator -= 1000
    }
  }

  tick() {
    // 1. Advance unified world time clock (triggers timeHooks.onTick hooks including expeditions)
    Game.advanceTick()
  }

  log(message: string) {
    Game.addLog('⚙', message, 'info')
  }
}

export const GameEngine = new Engine()
