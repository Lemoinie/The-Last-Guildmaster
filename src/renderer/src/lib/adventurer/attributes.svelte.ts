/**
 * attributes.svelte.ts — Reactive Attribute System using Svelte 5 Runes
 *
 * Total stat calculation pipeline:
 *   1. Start with base stat (grown by levelUp)
 *   2. Add equipment bonus (weapon + armor + accessory)
 *   3. Apply trait modifier (e.g. Bookworm: +10% Int, -5% Dex/Con)
 *   4. Floor the result → final integer
 *
 * All steps are $derived — zero manual updates needed.
 */

import type { StatKey, Trait } from './types'
import type { EquipmentStats } from './items.svelte'

export class Attributes {
  // --- Base stats (mutable, grown on level-up) ---
  str = $state(10)
  int = $state(10)
  dex = $state(10)
  con = $state(10)

  // --- Active trait (null = no trait) ---
  trait = $state<Trait | null>(null)

  // --- Equipment stat references (set by Character when gear changes) ---
  equipStr = $state(0)
  equipInt = $state(0)
  equipDex = $state(0)
  equipCon = $state(0)

  // --- Total stats: Base + Equipment, then Trait modifier ---
  totalStr = $derived(this.applyModifier('str', this.str + this.equipStr))
  totalInt = $derived(this.applyModifier('int', this.int + this.equipInt))
  totalDex = $derived(this.applyModifier('dex', this.dex + this.equipDex))
  totalCon = $derived(this.applyModifier('con', this.con + this.equipCon))

  // --- Derived combat values ---
  maxHp = $derived(Math.floor(this.totalCon * 5 + this.totalStr * 2))
  maxMp = $derived(Math.floor(this.totalInt * 3 + this.totalDex))
  physAtk = $derived(Math.floor(this.totalStr * 1.5 + this.totalDex * 0.5))
  magAtk = $derived(Math.floor(this.totalInt * 1.5 + this.totalDex * 0.5))
  speed = $derived(Math.floor(this.totalDex * 1.2 + this.totalCon * 0.3))

  constructor(str = 10, int = 10, dex = 10, con = 10, trait: Trait | null = null) {
    this.str = str
    this.int = int
    this.dex = dex
    this.con = con
    this.trait = trait
  }

  /** Sync equipment bonuses from the character's equipped gear */
  setEquipmentBonuses(stats: EquipmentStats): void {
    this.equipStr = stats.str
    this.equipInt = stats.int
    this.equipDex = stats.dex
    this.equipCon = stats.con
  }

  /**
   * Apply trait modifier to a combined (base + equip) stat.
   * e.g. Bookworm: int * 1.10, dex * 0.95, con * 0.95
   */
  private applyModifier(stat: StatKey, combined: number): number {
    if (!this.trait) return combined
    const mod = this.trait.modifiers[stat] ?? 0
    return Math.floor(combined * (1 + mod))
  }
}
