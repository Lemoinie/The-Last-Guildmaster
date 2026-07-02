import { timeHooks } from './world.time.system'
import * as tavernSys from './tavern.system'
import * as expeditionSys from './expedition.system'
import { addLog } from './world.system'

/**
 * Registers all domain hooks to link the unified clock rollover events with active gameplay modules.
 */
export function registerTimeHooks(): void {
  // Clear any existing callback hooks to prevent duplicate triggers (e.g. on Hot Module Replacement)
  timeHooks.onTick = []
  timeHooks.onHour = []
  timeHooks.onDay = []
  timeHooks.onMonth = []
  timeHooks.onYear = []

  // ─── Tick Hooks ─────────────────────────────────────────────────────────────
  // Resolve active patrols (decrements timer parameters)
  timeHooks.onTick.push((state) => {
    expeditionSys.resolveExpedition(state)
  })

  // ─── Hour Hooks ────────────────────────────────────────────────────────────
  // Accumulate tavern patron visits income
  timeHooks.onHour.push((state) => {
    tavernSys.processIncomeTick(state)
  })

  // Check passive walk-in recruit arrivals
  timeHooks.onHour.push((state) => {
    const currentHour =
      state.world.time.hour +
      (state.world.time.day - 1) * 24 +
      (state.world.time.month - 1) * 28 * 24 +
      (state.world.time.year - 1) * 336 * 24

    const intervalHours = Math.floor(state.tavern.passiveRecruitIntervalMs / 3600000)

    if (currentHour >= state.tavern.lastPassiveRecruitAt + intervalHours) {
      tavernSys.checkPassiveRecruits(state)
      state.tavern.lastPassiveRecruitAt = currentHour
    }

    // Prune stale recruits
    tavernSys.pruneExpiredRecruits(state)
  })

  // ─── Day Hooks ─────────────────────────────────────────────────────────────
  timeHooks.onDay.push((state) => {
    // Generate daily weather roll based on deterministic seed formulas
    const seed =
      state.world.time.year * 336 + state.world.time.month * 28 + state.world.time.day
    console.log(`[Clock Engine] Daily Rollover — Seed: ${seed}`)
    
    // Future expansion points:
    // - weatherSys.rollWeather(state, seed)
    // - gardenSys.tickGarden(state)
  })

  // ─── Month Hooks ───────────────────────────────────────────────────────────
  timeHooks.onMonth.push((state) => {
    addLog(state, '🪙', `Month rollover processed: Deducting structures upkeep.`, 'info')
    
    // Future expansion points:
    // - buildingSys.deductUpkeeps(state)
    // - raidSys.checkDemonRaid(state)
  })

  // ─── Year Hooks ────────────────────────────────────────────────────────────
  timeHooks.onYear.push((state) => {
    addLog(
      state,
      '🎆',
      `A new year begins! The guild celebrates year ${state.world.time.year}.`,
      'info'
    )
  })
}
