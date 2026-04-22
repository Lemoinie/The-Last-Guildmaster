/**
 * traits.ts — Predefined character traits
 *
 * Each trait applies percentage-based modifiers to total stats.
 * Positive = buff, negative = debuff.
 */

import type { Trait, TraitId } from './types'

export const TRAITS: Record<TraitId, Trait> = {
  bookworm: {
    id: 'bookworm',
    name: 'Bookworm',
    description: '+10% Int, -5% Dex, -5% Con',
    modifiers: { int: 0.10, dex: -0.05, con: -0.05 }
  },
  brawler: {
    id: 'brawler',
    name: 'Brawler',
    description: '+10% Str, -5% Int, -5% Dex',
    modifiers: { str: 0.10, int: -0.05, dex: -0.05 }
  },
  nimble: {
    id: 'nimble',
    name: 'Nimble',
    description: '+10% Dex, -5% Str, -5% Con',
    modifiers: { dex: 0.10, str: -0.05, con: -0.05 }
  },
  ironclad: {
    id: 'ironclad',
    name: 'Ironclad',
    description: '+10% Con, -5% Str, -5% Dex',
    modifiers: { con: 0.10, str: -0.05, dex: -0.05 }
  }
}

/** Look up a trait by ID. Returns null for unknown IDs. */
export function getTrait(id: TraitId | null): Trait | null {
  if (!id) return null
  return TRAITS[id] ?? null
}
