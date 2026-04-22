/**
 * types.ts — Shared type definitions for the Adventurer System
 */

/** The four core attributes */
export type StatKey = 'str' | 'int' | 'dex' | 'con'

/** Trait identifiers that modify attribute calculations */
export type TraitId = 'bookworm' | 'brawler' | 'nimble' | 'ironclad'

/** Trait definition: multipliers applied to total stats */
export interface Trait {
  id: TraitId
  name: string
  description: string
  modifiers: Partial<Record<StatKey, number>> // e.g. { int: 0.10, dex: -0.05, con: -0.05 }
}

/** Growth rates per stat — used by Jobs to scale attributes on level-up */
export interface GrowthRates {
  str: number
  int: number
  dex: number
  con: number
}

/** Skill target type */
export type SkillTarget = 'single_enemy' | 'all_enemies' | 'self' | 'single_ally' | 'all_allies'

/** Skill scaling stat */
export type SkillScaling = StatKey

/** Serializable snapshot of a character */
export interface CharacterData {
  id: string
  name: string
  level: number
  xp: number
  jobId: string
  traitId: TraitId | null
  skillIds: string[]
  baseStr: number
  baseInt: number
  baseDex: number
  baseCon: number
}
