import type { GameStateData } from '../stores/game.svelte'
import * as tavernSys from './tavern.system'

export function advanceTick(state: GameStateData): void {
  // Advance tick counter
  state.world.time.tick++
  if (state.world.time.tick >= 60) {
    state.world.time.tick = 0
    advanceHour(state)
  }
}

export function advanceHour(state: GameStateData): void {
  state.world.time.hour++
  
  // 1. Process passive income tick
  tavernSys.processIncomeTick(state)

  // 2. Check passive recruit wave
  const currentHour = state.world.time.hour + (state.world.time.day - 1) * 24 + (state.world.time.month - 1) * 28 * 24
  const intervalHours = Math.floor(state.tavern.passiveRecruitIntervalMs / 60_000)
  
  if (currentHour >= state.tavern.lastPassiveRecruitAt + intervalHours) {
    tavernSys.checkPassiveRecruits(state)
    state.tavern.lastPassiveRecruitAt = currentHour
  }

  // 3. Hourly prune expired recruits
  tavernSys.pruneExpiredRecruits(state)

  if (state.world.time.hour >= 24) {
    state.world.time.hour = 0
    advanceDay(state)
  }
}

export function advanceDay(state: GameStateData): void {
  state.world.time.day++
  state.world.time.week = Math.floor((state.world.time.day - 1) / 7) + 1

  if (state.world.time.day > 28) {
    state.world.time.day = 1
    state.world.time.week = 1
    advanceMonth(state)
  }
}

export function advanceWeek(state: GameStateData): void {
  // No-op: week is dynamically computed from day
}

export function advanceMonth(state: GameStateData): void {
  state.world.time.month++
  if (state.world.time.month > 12) {
    state.world.time.month = 1
  }
  state.world.time.season = getSeason(state.world.time.month)
}

export function getSeason(month: number): 'spring' | 'summer' | 'autumn' | 'winter' {
  if (month >= 1 && month <= 3) return 'spring'
  if (month >= 4 && month <= 6) return 'summer'
  if (month >= 7 && month <= 9) return 'autumn'
  return 'winter'
}

export function advanceMultipleTicks(state: GameStateData, count: number): void {
  for (let i = 0; i < count; i++) {
    advanceTick(state)
  }
}
