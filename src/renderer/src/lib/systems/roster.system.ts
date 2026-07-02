import type { GameStateData } from '../stores/game.svelte'
import type { CharacterData } from '../adventurer/types'

export function addCharacter(state: GameStateData, characterData: CharacterData): boolean {
  if (state.roster.length < state.settings.maxAdventurers) {
    state.roster = [...state.roster, characterData]
    return true
  }
  return false
}

export function removeCharacter(state: GameStateData, characterId: string): void {
  state.roster = state.roster.filter(char => char.id !== characterId)
}
