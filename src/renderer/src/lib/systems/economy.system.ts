import type { GameStateData } from '../stores/game.svelte'
import { calcRecruitInterval } from './tavern.system'

export function spendGold(state: GameStateData, amount: number): void {
  state.economy.gold = Math.max(0, state.economy.gold - amount)
}

export function gainGold(state: GameStateData, amount: number): void {
  state.economy.gold += amount
}

export function gainRenown(state: GameStateData, amount: number): void {
  state.economy.renown += amount
  state.tavern.passiveRecruitIntervalMs = calcRecruitInterval(state.economy.renown)
}

export function loseRenown(state: GameStateData, amount: number): void {
  state.economy.renown = Math.max(0, state.economy.renown - amount)
  state.tavern.passiveRecruitIntervalMs = calcRecruitInterval(state.economy.renown)
}
