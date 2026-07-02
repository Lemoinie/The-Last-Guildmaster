import type { GameStateData, Expedition } from '../stores/game.svelte'
import { addLog } from './world.system'

export function startExpedition(state: GameStateData, party: string[]): void {
  const newExp: Expedition = {
    id: Date.now(),
    name: 'Forest Patrol',
    status: 'active',
    remainingTime: 60
  }
  state.expeditions = [...state.expeditions, newExp]
}

export function resolveExpedition(state: GameStateData): void {
  state.expeditions.forEach((exp) => {
    if (exp.status === 'active') {
      exp.remainingTime = Math.max(0, exp.remainingTime - 1)
      if (exp.remainingTime === 0) {
        exp.status = 'completed'
        addLog(state, '🗺', `Expedition "${exp.name}" has returned!`, 'info')
      }
    }
  })
}

export function returnExpedition(state: GameStateData, expeditionId: number): void {
  state.expeditions = state.expeditions.filter((exp) => exp.id !== expeditionId)
}
