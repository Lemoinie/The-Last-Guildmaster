/**
 * item.validator.ts — Validator for Content-Driven Item Schema
 */

import type { ItemDefinition } from './item.types'

export function validateItem(item: any): item is ItemDefinition {
  if (!item || typeof item !== 'object') {
    throw new Error('Item definition must be an object.')
  }
  if (typeof item.id !== 'string' || !item.id.trim()) {
    throw new Error('Item property [id] must be a non-empty string.')
  }
  if (typeof item.name !== 'string' || !item.name.trim()) {
    throw new Error(`Item [${item.id}] property [name] must be a non-empty string.`)
  }
  if (typeof item.category !== 'string') {
    throw new Error(`Item [${item.id}] property [category] must be a string.`)
  }
  if (typeof item.family !== 'string') {
    throw new Error(`Item [${item.id}] property [family] must be a string.`)
  }
  if (typeof item.rarity !== 'string') {
    throw new Error(`Item [${item.id}] property [rarity] must be a string.`)
  }
  if (typeof item.stackable !== 'boolean') {
    throw new Error(`Item [${item.id}] property [stackable] must be a boolean.`)
  }
  if (typeof item.maxStack !== 'number' || item.maxStack <= 0) {
    throw new Error(`Item [${item.id}] property [maxStack] must be a positive integer.`)
  }
  if (typeof item.baseValue !== 'number' || item.baseValue < 0) {
    throw new Error(`Item [${item.id}] property [baseValue] must be a non-negative number.`)
  }
  if (typeof item.weight !== 'number' || item.weight < 0) {
    throw new Error(`Item [${item.id}] property [weight] must be a non-negative number.`)
  }
  if (!Array.isArray(item.tags)) {
    throw new Error(`Item [${item.id}] property [tags] must be an array.`)
  }
  return true
}
