/**
 * item.loader.ts — Loader for Content-Driven Item Schema
 */

import type { ItemDefinition } from './item.types'
import { validateItem } from './item.validator'

// Static JSON imports resolved by Vite compiler
import herbsJson from './data/items/herbs.json'
import woodsJson from './data/items/woods.json'
import oresJson from './data/items/ores.json'
import ingotsJson from './data/items/ingots.json'
import hidesJson from './data/items/hides.json'
import fishJson from './data/items/fish.json'
import consumablesJson from './data/items/consumables.json'
import utilityJson from './data/items/utility.json'
import equipmentJson from './data/items/equipment.json'

const rawDataLists: any[][] = [
  herbsJson,
  woodsJson,
  oresJson,
  ingotsJson,
  hidesJson,
  fishJson,
  consumablesJson,
  utilityJson,
  equipmentJson
]

export function loadAndValidateItems(): Record<string, ItemDefinition> {
  const registry: Record<string, ItemDefinition> = {}

  for (const list of rawDataLists) {
    if (!Array.isArray(list)) {
      console.error('Expected JSON list of items, got:', list)
      continue
    }
    for (const rawItem of list) {
      try {
        if (validateItem(rawItem)) {
          const normalized: ItemDefinition = {
            id: rawItem.id,
            name: rawItem.name,
            category: rawItem.category,
            family: rawItem.family,
            rarity: rawItem.rarity,
            stackable: rawItem.stackable,
            maxStack: rawItem.maxStack,
            baseValue: rawItem.baseValue,
            tags: [...rawItem.tags],
            weight: rawItem.weight,
            durability: rawItem.durability,
            qualityTier: rawItem.qualityTier,
            professionSource: rawItem.professionSource,
            biomeSource: rawItem.biomeSource,
            seasonalAvailability: rawItem.seasonalAvailability,
            stats: rawItem.stats ? { ...rawItem.stats } : undefined
          }

          if (registry[normalized.id]) {
            console.warn(`Duplicate item registration ID: ${normalized.id}`)
          }
          registry[normalized.id] = normalized
        }
      } catch (e: any) {
        console.error(`Validation failed for item definition:`, rawItem, e.message)
      }
    }
  }

  return registry
}
