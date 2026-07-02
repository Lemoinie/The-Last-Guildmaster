/**
 * item.registry.ts — Combined Authoritative Items Registry
 */

import type { ItemDefinition } from './item.types'
import { loadAndValidateItems } from './item.loader'

export const ALL_ITEMS: Record<string, ItemDefinition> = loadAndValidateItems()

/** Utility to retrieve item by ID */
export function getItemDefinition(id: string): ItemDefinition | undefined {
  return ALL_ITEMS[id]
}
