import type { GameStateData, Resources } from '../stores/game.svelte'

export function addResource(state: GameStateData, type: keyof Resources, amount: number): void {
  if (state.resources[type] !== undefined) {
    state.resources[type] += amount
  }
}

export function consumeResource(state: GameStateData, type: keyof Resources, amount: number): void {
  if (state.resources[type] !== undefined) {
    state.resources[type] = Math.max(0, state.resources[type] - amount)
  }
}
