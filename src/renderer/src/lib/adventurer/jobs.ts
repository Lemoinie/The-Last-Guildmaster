/**
 * jobs.ts — Job System (Class hierarchy)
 *
 * Each Job defines growth rates that determine how much each stat
 * increases per level. Higher rate = faster scaling.
 *
 * Growth formula (applied in Character.levelUp):
 *   statGain = floor(growthRate * (level ^ 1.2))
 *
 * This gives exponential-feeling scaling similar to Java RPG systems
 * like Fire Emblem / Final Fantasy Tactics.
 */

import type { GrowthRates } from './types'

export interface Job {
  id: string
  name: string
  description: string
  icon: string
  growthRates: GrowthRates
}

// ─── Starter Jobs ─────────────────────────────────────────────────────────────

export const JOBS: Record<string, Job> = {
  footman: {
    id: 'footman',
    name: 'Footman',
    description: 'A sturdy frontline fighter. High Str and Con growth.',
    icon: '🗡',
    growthRates: { str: 1.4, int: 0.3, dex: 0.8, con: 1.2 }
  },

  apprentice: {
    id: 'apprentice',
    name: 'Apprentice',
    description: 'A budding mage. High Int growth, fragile.',
    icon: '🔮',
    growthRates: { str: 0.3, int: 1.5, dex: 0.7, con: 0.5 }
  },

  archer: {
    id: 'archer',
    name: 'Archer',
    description: 'A nimble ranged attacker. High Dex growth.',
    icon: '🏹',
    growthRates: { str: 0.6, int: 0.5, dex: 1.5, con: 0.7 }
  },

  squire: {
    id: 'squire',
    name: 'Squire',
    description: 'A balanced recruit. Moderate growth across all stats.',
    icon: '⚔',
    growthRates: { str: 0.9, int: 0.7, dex: 0.9, con: 0.9 }
  }
}

/** Look up a job by ID. Falls back to Squire for unknown IDs. */
export function getJob(id: string): Job {
  return JOBS[id] ?? JOBS.squire
}
