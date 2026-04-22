/**
 * attributes.svelte.ts — Reactive Attribute System using Svelte 5 Runes
 *
 * Base stats are mutable via $state.
 * Total stats are computed via $derived, applying trait modifiers.
 * Growth formula: base + floor(growthRate * (level^1.2))
 */

import type { StatKey, Trait } from './types'

export class Attributes {
  // --- Base stats (mutable, grown on level-up) ---
  str = $state(10)
  int = $state(10)
  dex = $state(10)
  con = $state(10)

  // --- Active trait (null = no trait) ---
  trait = $state<Trait | null>(null)

  // --- Total stats (auto-computed with trait modifiers) ---
  totalStr = $derived(this.applyModifier('str', this.str))
  totalInt = $derived(this.applyModifier('int', this.int))
  totalDex = $derived(this.applyModifier('dex', this.dex))
  totalCon = $derived(this.applyModifier('con', this.con))

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

  /** Apply trait modifier to a base stat. Returns the final integer value. */
  private applyModifier(stat: StatKey, base: number): number {
    if (!this.trait) return base
    const mod = this.trait.modifiers[stat] ?? 0
    return Math.floor(base * (1 + mod))
  }
}
