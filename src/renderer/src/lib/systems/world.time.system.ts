import type { GameStateData } from '../stores/game.svelte'

export interface TimeState {
  tick: number   // 0–59
  hour: number   // 0–23
  day: number    // 1–28
  week: number   // 1–4
  month: number  // 1–12
  year: number   // >= 1
}

// Extensible Hooks Registry
export type TimeHookCallback = (state: GameStateData) => void

export const timeHooks = {
  onTick: [] as TimeHookCallback[],
  onHour: [] as TimeHookCallback[],
  onDay: [] as TimeHookCallback[],
  onMonth: [] as TimeHookCallback[],
  onYear: [] as TimeHookCallback[]
}

/**
 * Validates strict time domain ranges (invariants).
 */
export function validateInvariants(time: TimeState): void {
  if (time.tick < 0 || time.tick > 59) {
    throw new Error(`Time invariant violation: tick is ${time.tick} (expected 0-59)`)
  }
  if (time.hour < 0 || time.hour > 23) {
    throw new Error(`Time invariant violation: hour is ${time.hour} (expected 0-23)`)
  }
  if (time.day < 1 || time.day > 28) {
    throw new Error(`Time invariant violation: day is ${time.day} (expected 1-28)`)
  }
  if (time.week < 1 || time.week > 4) {
    throw new Error(`Time invariant violation: week is ${time.week} (expected 1-4)`)
  }
  if (time.month < 1 || time.month > 12) {
    throw new Error(`Time invariant violation: month is ${time.month} (expected 1-12)`)
  }
  if (time.year < 1) {
    throw new Error(`Time invariant violation: year is ${time.year} (expected >= 1)`)
  }
}

/**
 * Advances the simulation by exactly one clock tick (second).
 */
export function advanceTick(state: GameStateData): void {
  // Validate time invariants prior to state modifications
  validateInvariants(state.world.time)

  state.world.time.tick++

  // Execute tick hooks (e.g. expedition updates)
  for (const hook of timeHooks.onTick) {
    try {
      hook(state)
    } catch (e) {
      console.error('Error executing time onTick hook:', e)
    }
  }

  if (state.world.time.tick >= 60) {
    state.world.time.tick = 0
    advanceHour(state)
  }
}

/**
 * Advances the simulation clock by exactly one hour.
 */
export function advanceHour(state: GameStateData): void {
  state.world.time.hour++

  // Execute hourly hooks (e.g. passive income roll, recruit arrivals check)
  for (const hook of timeHooks.onHour) {
    try {
      hook(state)
    } catch (e) {
      console.error('Error executing time onHour hook:', e)
    }
  }

  if (state.world.time.hour >= 24) {
    state.world.time.hour = 0
    advanceDay(state)
  }
}

/**
 * Advances the simulation clock by exactly one day.
 */
export function advanceDay(state: GameStateData): void {
  state.world.time.day++

  // Update week dynamically (1-7 -> w1, 8-14 -> w2, 15-21 -> w3, 22-28 -> w4)
  state.world.time.week = Math.floor((state.world.time.day - 1) / 7) + 1

  // Execute daily hooks (e.g. weather roll, garden ticking, events)
  for (const hook of timeHooks.onDay) {
    try {
      hook(state)
    } catch (e) {
      console.error('Error executing time onDay hook:', e)
    }
  }

  if (state.world.time.day > 28) {
    state.world.time.day = 1
    state.world.time.week = 1
    advanceMonth(state)
  }
}

/**
 * Advances the simulation clock by exactly one month.
 */
export function advanceMonth(state: GameStateData): void {
  state.world.time.month++
  state.world.time.week = 1 // Reset week to 1

  // Execute monthly hooks (e.g. building maintenance upkeep, demon raid check)
  for (const hook of timeHooks.onMonth) {
    try {
      hook(state)
    } catch (e) {
      console.error('Error executing time onMonth hook:', e)
    }
  }

  if (state.world.time.month > 12) {
    state.world.time.month = 1
    advanceYear(state)
  }
}

/**
 * Advances the simulation clock by exactly one year.
 */
export function advanceYear(state: GameStateData): void {
  state.world.time.year++

  // Execute annual hooks
  for (const hook of timeHooks.onYear) {
    try {
      hook(state)
    } catch (e) {
      console.error('Error executing time onYear hook:', e)
    }
  }
}

/**
 * Derived helper: Returns active season from month index.
 */
export function getSeason(month: number): 'spring' | 'summer' | 'autumn' | 'winter' {
  if (month >= 1 && month <= 3) return 'spring'
  if (month >= 4 && month <= 6) return 'summer'
  if (month >= 7 && month <= 9) return 'autumn'
  return 'winter'
}

/**
 * Derived helper: Returns whether the given hour is nighttime (20:00 to 05:59).
 */
export function isNight(hour: number): boolean {
  return hour >= 20 || hour < 6
}

/**
 * Sequentially ticks the simulation clock for a defined count of ticks.
 */
export function advanceMultipleTicks(state: GameStateData, count: number): void {
  for (let i = 0; i < count; i++) {
    advanceTick(state)
  }
}
