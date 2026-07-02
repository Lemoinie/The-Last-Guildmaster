import type { GameStateData, TavernLogEntry } from '../stores/game.svelte'

export function addLog(state: GameStateData, icon: string, message: string, type: TavernLogEntry['type']): void {
  state.world.log = [{
    timestamp: Date.now(),
    icon,
    message,
    type
  }, ...state.world.log].slice(0, 50)
}
