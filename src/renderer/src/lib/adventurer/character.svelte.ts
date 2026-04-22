/**
 * character.svelte.ts — Character Class (Svelte 5 Runes)
 *
 * Composes Attributes, Job, Trait, and Skills into a single entity.
 * Uses $state for mutable data (level, xp) and $derived for computed values.
 *
 * Growth formula (Java RPG-style exponential):
 *   statGain = floor(growthRate * (level ^ 1.2))
 *
 * This means early levels give small gains, but by level 20+
 * stats start scaling dramatically — rewarding long-term investment.
 */

import { Attributes } from './attributes.svelte'
import { getJob, type Job } from './jobs'
import { getTrait } from './traits'
import { getSkill, type Skill } from './skills'
import type { TraitId, CharacterData } from './types'

/** XP required to reach the next level: 50 * level^1.8 */
function xpToNextLevel(level: number): number {
  return Math.floor(50 * Math.pow(level, 1.8))
}

export class Character {
  // --- Identity ---
  readonly id: string
  name = $state('')

  // --- Progression (mutable) ---
  level = $state(1)
  xp = $state(0)

  // --- Composition ---
  attributes: Attributes
  private _jobId = $state('squire')
  private _traitId = $state<TraitId | null>(null)
  private _skillIds = $state<string[]>([])

  // --- Derived ---
  job = $derived<Job>(getJob(this._jobId))
  xpNeeded = $derived(xpToNextLevel(this.level))
  xpPercent = $derived(Math.min(100, Math.floor((this.xp / this.xpNeeded) * 100)))

  skills = $derived<Skill[]>(
    this._skillIds
      .map(id => getSkill(id))
      .filter((s): s is Skill => s !== undefined)
  )

  constructor(
    name: string,
    jobId: string = 'squire',
    traitId: TraitId | null = null,
    id?: string
  ) {
    this.id = id ?? crypto.randomUUID()
    this.name = name
    this._jobId = jobId
    this._traitId = traitId
    this.attributes = new Attributes(10, 10, 10, 10, getTrait(traitId))
  }

  // ─── Progression ────────────────────────────────────────────────────────────

  /** Add XP and auto-level if threshold is reached */
  addXp(amount: number): void {
    this.xp += amount
    while (this.xp >= this.xpNeeded) {
      this.xp -= this.xpNeeded
      this.levelUp()
    }
  }

  /** Level up: increase base stats using the job's growth rates + exponential formula */
  private levelUp(): void {
    this.level += 1
    const rates = this.job.growthRates
    const lvl = this.level

    // Growth formula: floor(growthRate * (level ^ 1.2))
    // This gives 1-2 points early, 4-8 points by level 20+
    this.attributes.str += Math.floor(rates.str * Math.pow(lvl, 1.2))
    this.attributes.int += Math.floor(rates.int * Math.pow(lvl, 1.2))
    this.attributes.dex += Math.floor(rates.dex * Math.pow(lvl, 1.2))
    this.attributes.con += Math.floor(rates.con * Math.pow(lvl, 1.2))
  }

  // ─── Job & Trait ─────────────────────────────────────────────────────────────

  /** Change the character's job (class change) */
  setJob(jobId: string): void {
    this._jobId = jobId
  }

  /** Set or clear the character's trait */
  setTrait(traitId: TraitId | null): void {
    this._traitId = traitId
    this.attributes.trait = getTrait(traitId)
  }

  get traitId(): TraitId | null {
    return this._traitId
  }

  get jobId(): string {
    return this._jobId
  }

  // ─── Skills ──────────────────────────────────────────────────────────────────

  /** Assign a skill by ID */
  learnSkill(skillId: string): void {
    if (!this._skillIds.includes(skillId)) {
      this._skillIds = [...this._skillIds, skillId]
    }
  }

  /** Remove a skill by ID */
  forgetSkill(skillId: string): void {
    this._skillIds = this._skillIds.filter(id => id !== skillId)
  }

  // ─── Serialization ──────────────────────────────────────────────────────────

  /** Export to plain JSON (for save system) */
  serialize(): CharacterData {
    return {
      id: this.id,
      name: this.name,
      level: this.level,
      xp: this.xp,
      jobId: this._jobId,
      traitId: this._traitId,
      skillIds: [...this._skillIds],
      baseStr: this.attributes.str,
      baseInt: this.attributes.int,
      baseDex: this.attributes.dex,
      baseCon: this.attributes.con
    }
  }

  /** Restore from saved JSON */
  static deserialize(data: CharacterData): Character {
    const char = new Character(data.name, data.jobId, data.traitId, data.id)
    char.level = data.level
    char.xp = data.xp
    char.attributes.str = data.baseStr
    char.attributes.int = data.baseInt
    char.attributes.dex = data.baseDex
    char.attributes.con = data.baseCon
    char._skillIds = [...data.skillIds]
    return char
  }
}
