/**
 * items.svelte.ts — Item System for The Last Guildmaster
 *
 * Hierarchy:
 *   Item (base)
 *   ├── Material     — Stackable crafting resources (Iron, Wood, Herbs)
 *   ├── Consumable   — Usable items with effects (Potions)
 *   └── Equipment    — Non-stackable gear with stat bonuses
 *       ├── Weapon
 *       ├── Armor
 *       └── Accessory
 *
 * Uses $state for mutable quantities. Equipment stats are plain objects
 * read by the Attributes class via $derived for total stat calculation.
 */

import type { StatKey } from './types'

// ─── Interfaces ───────────────────────────────────────────────────────────────

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type EquipSlot = 'weapon' | 'armor' | 'accessory'

/** Stat bonuses granted by equipment */
export interface EquipmentStats {
  str: number
  int: number
  dex: number
  con: number
}

/** The zero-stat constant — no bonuses */
export const EMPTY_STATS: EquipmentStats = { str: 0, int: 0, dex: 0, con: 0 }

/** Consumable effect applied to a target */
export interface ConsumableEffect {
  type: 'heal_hp' | 'heal_mp' | 'buff_stat' | 'cure_status'
  stat?: StatKey
  value: number
  duration?: number // turns, if applicable
}

/** Serializable item snapshot for save system */
export interface ItemData {
  id: string
  type: 'material' | 'consumable' | 'weapon' | 'armor' | 'accessory'
  quantity: number
}

// ─── Rarity Metadata ──────────────────────────────────────────────────────────

export const RARITY_CONFIG: Record<ItemRarity, { label: string; color: string; order: number }> = {
  common:    { label: 'Common',    color: '#94a3b8', order: 0 },
  uncommon:  { label: 'Uncommon',  color: '#4ade80', order: 1 },
  rare:      { label: 'Rare',      color: '#60a5fa', order: 2 },
  epic:      { label: 'Epic',      color: '#c084fc', order: 3 },
  legendary: { label: 'Legendary', color: '#fbbf24', order: 4 }
}

// ─── Base Item ────────────────────────────────────────────────────────────────

export class Item {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly icon: string
  readonly rarity: ItemRarity
  readonly stackable: boolean

  quantity = $state(1)

  constructor(
    id: string,
    name: string,
    description: string,
    icon: string,
    rarity: ItemRarity = 'common',
    stackable: boolean = true,
    quantity: number = 1
  ) {
    this.id = id
    this.name = name
    this.description = description
    this.icon = icon
    this.rarity = rarity
    this.stackable = stackable
    this.quantity = quantity
  }
}

// ─── Material (Crafting Resource) ─────────────────────────────────────────────

export class Material extends Item {
  constructor(
    id: string,
    name: string,
    description: string,
    icon: string,
    rarity: ItemRarity = 'common',
    quantity: number = 1
  ) {
    super(id, name, description, icon, rarity, true, quantity) // always stackable
  }
}

// ─── Consumable (Potions, Scrolls) ────────────────────────────────────────────

export class Consumable extends Item {
  readonly effect: ConsumableEffect

  constructor(
    id: string,
    name: string,
    description: string,
    icon: string,
    effect: ConsumableEffect,
    rarity: ItemRarity = 'common',
    quantity: number = 1
  ) {
    super(id, name, description, icon, rarity, true, quantity) // stackable
    this.effect = effect
  }

  /** Use this consumable on a target. Returns true if consumed. */
  use(target: { currentHp?: number; maxHp?: number; currentMp?: number; maxMp?: number }): boolean {
    if (this.quantity <= 0) return false

    switch (this.effect.type) {
      case 'heal_hp':
        if (target.currentHp !== undefined && target.maxHp !== undefined) {
          target.currentHp = Math.min(target.maxHp, target.currentHp + this.effect.value)
        }
        break
      case 'heal_mp':
        if (target.currentMp !== undefined && target.maxMp !== undefined) {
          target.currentMp = Math.min(target.maxMp, target.currentMp + this.effect.value)
        }
        break
      case 'buff_stat':
        // Buff logic handled externally by combat system
        break
      case 'cure_status':
        // Status cure handled externally by combat system
        break
    }

    this.quantity -= 1
    return true
  }
}

// ─── Equipment (Base) ─────────────────────────────────────────────────────────

export class Equipment extends Item {
  readonly slot: EquipSlot
  readonly stats: EquipmentStats

  constructor(
    id: string,
    name: string,
    description: string,
    icon: string,
    slot: EquipSlot,
    stats: Partial<EquipmentStats>,
    rarity: ItemRarity = 'common'
  ) {
    super(id, name, description, icon, rarity, false, 1) // never stackable
    this.slot = slot
    this.stats = { ...EMPTY_STATS, ...stats }
  }
}

// ─── Weapon ───────────────────────────────────────────────────────────────────

export class Weapon extends Equipment {
  readonly weaponType: string // 'sword', 'staff', 'bow', etc.

  constructor(
    id: string,
    name: string,
    description: string,
    icon: string,
    weaponType: string,
    stats: Partial<EquipmentStats>,
    rarity: ItemRarity = 'common'
  ) {
    super(id, name, description, icon, 'weapon', stats, rarity)
    this.weaponType = weaponType
  }
}

// ─── Armor ────────────────────────────────────────────────────────────────────

export class Armor extends Equipment {
  readonly armorType: string // 'plate', 'leather', 'robe', etc.

  constructor(
    id: string,
    name: string,
    description: string,
    icon: string,
    armorType: string,
    stats: Partial<EquipmentStats>,
    rarity: ItemRarity = 'common'
  ) {
    super(id, name, description, icon, 'armor', stats, rarity)
    this.armorType = armorType
  }
}

// ─── Accessory ────────────────────────────────────────────────────────────────

export class Accessory extends Equipment {
  readonly accessoryType: string // 'ring', 'amulet', 'charm', etc.

  constructor(
    id: string,
    name: string,
    description: string,
    icon: string,
    accessoryType: string,
    stats: Partial<EquipmentStats>,
    rarity: ItemRarity = 'common'
  ) {
    super(id, name, description, icon, 'accessory', stats, rarity)
    this.accessoryType = accessoryType
  }
}

// ─── Summoning Stone (Special) ────────────────────────────────────────────────

/**
 * SummoningStone — Consumable special item used for active recruitment.
 * Grade determines the rarity pool of adventurers that can be summoned.
 * Always stackable. Consuming one stone begins the summon.
 */
export type StoneGrade = 'crude' | 'refined' | 'arcane' | 'legendary'

export const STONE_GRADE_CONFIG: Record<StoneGrade, {
  label: string
  icon: string
  rarityPool: ItemRarity[]
  description: string
  color: string
}> = {
  crude:     { label: 'Crude Stone',     icon: '🪨', rarityPool: ['common'],                           description: 'Summons a common adventurer.',                   color: '#94a3b8' },
  refined:   { label: 'Refined Stone',   icon: '💠', rarityPool: ['common', 'uncommon'],               description: 'Summons an uncommon or common adventurer.',       color: '#4ade80' },
  arcane:    { label: 'Arcane Stone',    icon: '🔷', rarityPool: ['uncommon', 'rare', 'epic'],          description: 'Summons a rare or epic adventurer.',              color: '#60a5fa' },
  legendary: { label: 'Legendary Stone', icon: '🌟', rarityPool: ['epic', 'legendary'],                 description: 'Summons an epic or legendary adventurer.',        color: '#fbbf24' }
}

export class SummoningStone extends Item {
  readonly grade: StoneGrade

  constructor(grade: StoneGrade = 'crude', quantity: number = 1) {
    const cfg = STONE_GRADE_CONFIG[grade]
    super(
      `summoning_stone_${grade}`,
      cfg.label,
      cfg.description,
      cfg.icon,
      grade === 'legendary' ? 'legendary' : grade === 'arcane' ? 'rare' : grade === 'refined' ? 'uncommon' : 'common',
      true,   // stackable
      quantity
    )
    this.grade = grade
  }

  /** Consume one stone. Returns the grade for summon resolution. Throws if empty. */
  consume(): StoneGrade {
    if (this.quantity <= 0) throw new Error('No summoning stones remaining.')
    this.quantity -= 1
    return this.grade
  }
}

// ─── Item Registry (Predefined Items) ─────────────────────────────────────────

export const MATERIALS: Record<string, () => Material> = {
  iron:   () => new Material('iron',   'Iron Ore',    'Raw iron, ready for smelting.',     '⛏', 'common'),
  wood:   () => new Material('wood',   'Timber',      'Sturdy wood for crafting.',         '🪵', 'common'),
  herbs:  () => new Material('herbs',  'Wild Herbs',  'Fragrant herbs for potions.',       '🌿', 'common'),
  stone:  () => new Material('stone',  'Rough Stone', 'A chunk of unworked stone.',        '🪨', 'common'),
  crystal:() => new Material('crystal','Mana Crystal','A crystal pulsing with arcane energy.','💎', 'rare')
}

export const CONSUMABLES: Record<string, () => Consumable> = {
  health_potion: () => new Consumable(
    'health_potion', 'Health Potion', 'Restores 50 HP.', '🧪',
    { type: 'heal_hp', value: 50 }, 'common'
  ),
  mana_potion: () => new Consumable(
    'mana_potion', 'Mana Potion', 'Restores 30 MP.', '💧',
    { type: 'heal_mp', value: 30 }, 'common'
  ),
  elixir: () => new Consumable(
    'elixir', 'Elixir', 'Restores 100 HP and 50 MP.', '✨',
    { type: 'heal_hp', value: 100 }, 'rare'
  )
}

export const WEAPONS: Record<string, () => Weapon> = {
  iron_sword: () => new Weapon(
    'iron_sword', 'Iron Sword', 'A sturdy blade forged from iron.', '🗡',
    'sword', { str: 5, dex: 2 }, 'common'
  ),
  oak_staff: () => new Weapon(
    'oak_staff', 'Oak Staff', 'A staff carved from ancient oak.', '🪄',
    'staff', { int: 6, con: 1 }, 'common'
  ),
  short_bow: () => new Weapon(
    'short_bow', 'Short Bow', 'A light bow for quick shots.', '🏹',
    'bow', { dex: 6, str: 1 }, 'common'
  ),
  flame_blade: () => new Weapon(
    'flame_blade', 'Flame Blade', 'A sword wreathed in eternal fire.', '🔥',
    'sword', { str: 12, int: 4, dex: 3 }, 'epic'
  )
}

export const ARMORS: Record<string, () => Armor> = {
  leather_vest: () => new Armor(
    'leather_vest', 'Leather Vest', 'Basic protection for scouts.', '🦺',
    'leather', { dex: 2, con: 3 }, 'common'
  ),
  iron_plate: () => new Armor(
    'iron_plate', 'Iron Plate', 'Heavy armor. Slow but durable.', '🛡',
    'plate', { str: 2, con: 8 }, 'uncommon'
  ),
  mage_robe: () => new Armor(
    'mage_robe', 'Mage Robe', 'Enchanted cloth that amplifies magic.', '🧥',
    'robe', { int: 5, con: 2 }, 'uncommon'
  )
}

export const ACCESSORIES: Record<string, () => Accessory> = {
  iron_ring: () => new Accessory(
    'iron_ring', 'Iron Ring', 'A simple ring. Slightly boosts strength.', '💍',
    'ring', { str: 2 }, 'common'
  ),
  scholar_amulet: () => new Accessory(
    'scholar_amulet', "Scholar's Amulet", 'An amulet favored by mages.', '📿',
    'amulet', { int: 4, dex: 1 }, 'uncommon'
  ),
  guardian_charm: () => new Accessory(
    'guardian_charm', 'Guardian Charm', 'A blessed charm that hardens the body.', '🔮',
    'charm', { con: 5, str: 1 }, 'rare'
  )
}
