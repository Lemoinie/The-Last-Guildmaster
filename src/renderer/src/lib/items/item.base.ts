/**
 * item.base.ts — Base Helpers for Taxonomy Item Ecosystem
 */

import type { ItemDefinition } from './item.types'

export function createItem(def: ItemDefinition): ItemDefinition {
  return {
    ...def,
    tags: [...def.tags]
  }
}
