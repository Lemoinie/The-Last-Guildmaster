/**
 * character.svelte.ts — Character Class (Svelte 5 Runes)
 *
 * Composes Attributes, Job, Trait, Skills, and Equipment into a single entity.
 * Uses $state for mutable data (level, xp, gear) and $derived for computed values.
 *
 * Growth formula (Java RPG-style exponential):
 *   statGain = floor(growthRate * (level ^ 1.2))
 *
 * Total stat pipeline:
 *   Base Stats + Equipment Stats → Trait Modifier → Final Total
 */

import { Attributes } from './attributes.svelte'
import { getJob, type Job } from './jobs'
import { getTrait } from './traits'
import { getSkill, type Skill } from './skills'
import { Weapon, Armor, Accessory, EMPTY_STATS, type EquipmentStats, WEAPONS, ARMORS, ACCESSORIES } from './items.svelte'
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

  // --- Equipment Slots ---
  weapon = $state<Weapon | null>(null)
  armor = $state<Armor | null>(null)
  accessory = $state<Accessory | null>(null)

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

  // ─── Equipment ──────────────────────────────────────────────────────────────

  /** Equip a weapon (returns the previously equipped weapon, if any) */
  equipWeapon(item: Weapon | null): Weapon | null {
    const prev = this.weapon
    this.weapon = item
    this.syncEquipmentStats()
    return prev
  }

  /** Equip armor (returns the previously equipped armor, if any) */
  equipArmor(item: Armor | null): Armor | null {
    const prev = this.armor
    this.armor = item
    this.syncEquipmentStats()
    return prev
  }

  /** Equip an accessory (returns the previously equipped accessory, if any) */
  equipAccessory(item: Accessory | null): Accessory | null {
    const prev = this.accessory
    this.accessory = item
    this.syncEquipmentStats()
    return prev
  }

  /** Sum all equipped gear stats and push to Attributes */
  private syncEquipmentStats(): void {
    const w = this.weapon?.stats ?? EMPTY_STATS
    const a = this.armor?.stats ?? EMPTY_STATS
    const r = this.accessory?.stats ?? EMPTY_STATS

    this.attributes.setEquipmentBonuses({
      str: w.str + a.str + r.str,
      int: w.int + a.int + r.int,
      dex: w.dex + a.dex + r.dex,
      con: w.con + a.con + r.con
    })
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
      version: 1,
      id: this.id,
      name: this.name,
      level: this.level,
      xp: this.xp,
      jobId: this._jobId,
      traitId: this._traitId,
      attributes: {
        baseStr: this.attributes.str,
        baseInt: this.attributes.int,
        baseDex: this.attributes.dex,
        baseCon: this.attributes.con
      },
      equipment: {
        weaponId: this.weapon?.id ?? null,
        armorId: this.armor?.id ?? null,
        accessoryId: this.accessory?.id ?? null
      },
      skills: [...this._skillIds],
      professionSkills: [] // future-safe placeholder
    }
  }

  /** Restore from saved JSON, with backward compatibility and migration */
  static deserialize(data: any): Character {
    if (!data) {
      throw new Error('Cannot deserialize null or undefined character data.')
    }

    // 1. Determine if it's the old simplified mock adventurer
    const isMock = !('baseStr' in data) && !('attributes' in data) && ('class' in data || 'jobId' in data)
    
    if (isMock) {
      const name = data.name || 'Unknown Adventurer'
      const jobId = data.class || data.jobId || 'squire'
      const id = String(data.id || crypto.randomUUID())
      const level = data.level || 1

      // Construct default character and level them up to restore stats
      const char = new Character(name, jobId, null, id)
      char.level = 1
      char.xp = 0
      for (let lvl = 1; lvl < level; lvl++) {
        char.levelUp()
      }
      return char
    }

    // 2. Determine if it's the older flat CharacterData (pre-refactor)
    const isOldFlat = !('attributes' in data) && ('baseStr' in data)

    let id = data.id || crypto.randomUUID()
    let name = data.name || 'Unnamed'
    let level = data.level || 1
    let xp = data.xp || 0
    let jobId = data.jobId || 'squire'
    let traitId = data.traitId || null
    
    let baseStr = 10
    let baseInt = 10
    let baseDex = 10
    let baseCon = 10
    
    let weaponId: string | null = null
    let armorId: string | null = null
    let accessoryId: string | null = null
    
    let skillIds: string[] = []

    if (isOldFlat) {
      baseStr = typeof data.baseStr === 'number' ? data.baseStr : 10
      baseInt = typeof data.baseInt === 'number' ? data.baseInt : 10
      baseDex = typeof data.baseDex === 'number' ? data.baseDex : 10
      baseCon = typeof data.baseCon === 'number' ? data.baseCon : 10
      
      weaponId = data.weaponId || null
      armorId = data.armorId || null
      accessoryId = data.accessoryId || null
      skillIds = Array.isArray(data.skillIds) ? [...data.skillIds] : []
    } else {
      // New structured layout
      const attrs = data.attributes || {}
      baseStr = typeof attrs.baseStr === 'number' ? attrs.baseStr : 10
      baseInt = typeof attrs.baseInt === 'number' ? attrs.baseInt : 10
      baseDex = typeof attrs.baseDex === 'number' ? attrs.baseDex : 10
      baseCon = typeof attrs.baseCon === 'number' ? attrs.baseCon : 10

      const eq = data.equipment || {}
      weaponId = eq.weaponId || null
      armorId = eq.armorId || null
      accessoryId = eq.accessoryId || null

      skillIds = Array.isArray(data.skills) ? [...data.skills] : []
    }

    const char = new Character(name, jobId, traitId, id)
    char.level = level
    char.xp = xp
    char.attributes.str = baseStr
    char.attributes.int = baseInt
    char.attributes.dex = baseDex
    char.attributes.con = baseCon
    char._skillIds = skillIds

    // Gear restoration from registries
    if (weaponId && WEAPONS[weaponId]) char.weapon = WEAPONS[weaponId]()
    if (armorId && ARMORS[armorId]) char.armor = ARMORS[armorId]()
    if (accessoryId && ACCESSORIES[accessoryId]) char.accessory = ACCESSORIES[accessoryId]()
    char.syncEquipmentStats()

    return char
  }
}
