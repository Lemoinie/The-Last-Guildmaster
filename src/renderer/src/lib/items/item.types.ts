/**
 * item.types.ts — Type Definitions for the Taxonomy Item Ecosystem
 */

export type ItemCategory =
  | 'herb'
  | 'wood'
  | 'ore'
  | 'ingot'
  | 'hide'
  | 'fish'
  | 'consumable'
  | 'utility'
  | 'weapon'
  | 'armor'
  | 'accessory'

export type ItemFamily =
  | 'flower'
  | 'leaf'
  | 'root'
  | 'softwood'
  | 'hardwood'
  | 'metal_ore'
  | 'metal_ingot'
  | 'beast_hide'
  | 'river_fish'
  | 'lake_fish'
  | 'potion'
  | 'stone'
  | 'crystal'
  | 'summoning_stone'
  | 'sword'
  | 'staff'
  | 'bow'
  | 'plate'
  | 'leather'
  | 'robe'
  | 'ring'
  | 'amulet'
  | 'charm'

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface ItemDefinition {
  id: string
  name: string
  category: ItemCategory
  family: ItemFamily
  rarity: ItemRarity
  stackable: boolean
  maxStack: number
  baseValue: number
  tags: string[]
  weight: number
  durability?: number
  qualityTier?: number
  professionSource?: string
  biomeSource?: string
  seasonalAvailability?: string
  stats?: {
    str?: number
    int?: number
    dex?: number
    con?: number
  }
}
