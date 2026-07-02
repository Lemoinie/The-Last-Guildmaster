/**
 * storage.system.ts — Guild Storage System
 */

import { getItemDefinition } from '../items/item.registry'

export interface InventorySlot {
  itemId: string
  quantity: number
}

export interface GuildStorageData {
  maxSlots: number
  items: (InventorySlot | null)[]
}

/** Check if there is enough slot space to add the quantity of an item */
export function hasSpace(storage: GuildStorageData, itemId: string, quantity: number): boolean {
  const itemDef = getItemDefinition(itemId)
  if (!itemDef) return false

  let remaining = quantity
  const maxStack = itemDef.stackable ? itemDef.maxStack : 1

  // 1. Check existing partial stacks if stackable
  if (itemDef.stackable) {
    for (let i = 0; i < storage.maxSlots; i++) {
      const slot = storage.items[i]
      if (slot && slot.itemId === itemId && slot.quantity < maxStack) {
        remaining -= (maxStack - slot.quantity)
        if (remaining <= 0) return true
      }
    }
  }

  // 2. Count empty slots
  let emptySlots = 0
  for (let i = 0; i < storage.maxSlots; i++) {
    if (storage.items[i] === null || storage.items[i] === undefined) {
      emptySlots++
    }
  }

  const slotsNeeded = Math.ceil(remaining / maxStack)
  return emptySlots >= slotsNeeded
}

/** Add item quantity to guild storage, returning true if successful */
export function addItem(storage: GuildStorageData, itemId: string, quantity: number): boolean {
  if (!hasSpace(storage, itemId, quantity)) return false

  const itemDef = getItemDefinition(itemId)
  if (!itemDef) return false

  let remaining = quantity
  const maxStack = itemDef.stackable ? itemDef.maxStack : 1

  // 1. Fill existing slots if stackable
  if (itemDef.stackable) {
    for (let i = 0; i < storage.maxSlots; i++) {
      const slot = storage.items[i]
      if (slot && slot.itemId === itemId && slot.quantity < maxStack) {
        const addAmount = Math.min(remaining, maxStack - slot.quantity)
        slot.quantity += addAmount
        remaining -= addAmount
        if (remaining <= 0) break
      }
    }
  }

  // 2. Allocate new slots for leftovers
  if (remaining > 0) {
    for (let i = 0; i < storage.maxSlots; i++) {
      if (storage.items[i] === null || storage.items[i] === undefined) {
        const addAmount = Math.min(remaining, maxStack)
        storage.items[i] = { itemId, quantity: addAmount }
        remaining -= addAmount
        if (remaining <= 0) break
      }
    }
  }

  return true
}

/** Remove item quantity from guild storage, returning true if successful */
export function removeItem(storage: GuildStorageData, itemId: string, quantity: number): boolean {
  // Count total current items
  let totalHas = 0
  for (let i = 0; i < storage.maxSlots; i++) {
    const slot = storage.items[i]
    if (slot && slot.itemId === itemId) {
      totalHas += slot.quantity
    }
  }

  if (totalHas < quantity) return false

  let remaining = quantity
  for (let i = storage.maxSlots - 1; i >= 0; i--) {
    const slot = storage.items[i]
    if (slot && slot.itemId === itemId) {
      const deduct = Math.min(remaining, slot.quantity)
      slot.quantity -= deduct
      remaining -= deduct
      if (slot.quantity <= 0) {
        storage.items[i] = null
      }
      if (remaining <= 0) break
    }
  }

  return true
}

/** Split a stack at a specified slot, moving the amount to a new slot */
export function splitStack(storage: GuildStorageData, slotIndex: number, amount: number): boolean {
  if (slotIndex < 0 || slotIndex >= storage.maxSlots) return false
  const sourceSlot = storage.items[slotIndex]
  if (!sourceSlot || sourceSlot.quantity <= amount || amount <= 0) return false

  // Find first empty slot
  let emptyIndex = -1
  for (let i = 0; i < storage.maxSlots; i++) {
    if (storage.items[i] === null || storage.items[i] === undefined) {
      emptyIndex = i
      break
    }
  }

  if (emptyIndex === -1) return false // No empty slot

  sourceSlot.quantity -= amount
  storage.items[emptyIndex] = {
    itemId: sourceSlot.itemId,
    quantity: amount
  }

  return true
}

/** Condense and merge similar item stacks in storage */
export function mergeStacks(storage: GuildStorageData): void {
  const itemsMap: Record<string, number> = {}

  // Gather total counts and clear slots
  for (let i = 0; i < storage.maxSlots; i++) {
    const slot = storage.items[i]
    if (slot) {
      itemsMap[slot.itemId] = (itemsMap[slot.itemId] || 0) + slot.quantity
      storage.items[i] = null
    }
  }

  // Refill slots
  let currentSlotIndex = 0
  for (const [itemId, totalQty] of Object.entries(itemsMap)) {
    const itemDef = getItemDefinition(itemId)
    if (!itemDef) continue

    const maxStack = itemDef.stackable ? itemDef.maxStack : 1
    let remaining = totalQty

    while (remaining > 0 && currentSlotIndex < storage.maxSlots) {
      const fillAmount = Math.min(remaining, maxStack)
      storage.items[currentSlotIndex] = {
        itemId,
        quantity: fillAmount
      }
      remaining -= fillAmount
      currentSlotIndex++
    }
  }
}
