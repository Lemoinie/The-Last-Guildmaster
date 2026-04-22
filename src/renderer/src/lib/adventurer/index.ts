/**
 * index.ts — Barrel export for the Adventurer system
 */

export { Attributes } from './attributes.svelte'
export { Character } from './character.svelte'
export { JOBS, getJob, type Job } from './jobs'
export { SKILLS, getSkill, getAvailableSkills, type Skill } from './skills'
export { TRAITS, getTrait } from './traits'
export {
  Item, Material, Consumable, Equipment, Weapon, Armor, Accessory,
  SummoningStone,
  MATERIALS, CONSUMABLES, WEAPONS, ARMORS, ACCESSORIES,
  EMPTY_STATS, RARITY_CONFIG, STONE_GRADE_CONFIG,
  type ItemRarity, type EquipSlot, type EquipmentStats, type ConsumableEffect,
  type ItemData, type StoneGrade
} from './items.svelte'
export type * from './types'
