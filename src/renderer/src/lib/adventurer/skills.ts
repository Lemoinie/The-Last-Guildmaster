/**
 * skills.ts — Skill definitions
 *
 * Skills are flat data objects. Characters hold skill IDs and
 * look them up from this registry at runtime.
 */

import type { SkillTarget, SkillScaling } from './types'

export interface Skill {
  id: string
  name: string
  description: string
  icon: string
  mpCost: number
  power: number           // base damage/heal multiplier
  scaling: SkillScaling   // which stat scales the effect
  target: SkillTarget
  levelReq: number        // minimum level to learn
}

// ─── Skill Registry ───────────────────────────────────────────────────────────

export const SKILLS: Record<string, Skill> = {
  // --- Physical ---
  slash: {
    id: 'slash',
    name: 'Slash',
    description: 'A basic sword strike.',
    icon: '⚔',
    mpCost: 0,
    power: 1.2,
    scaling: 'str',
    target: 'single_enemy',
    levelReq: 1
  },
  power_strike: {
    id: 'power_strike',
    name: 'Power Strike',
    description: 'A heavy blow that deals massive damage.',
    icon: '💥',
    mpCost: 5,
    power: 2.0,
    scaling: 'str',
    target: 'single_enemy',
    levelReq: 5
  },
  shield_bash: {
    id: 'shield_bash',
    name: 'Shield Bash',
    description: 'Slam the enemy with your shield. Scales with Con.',
    icon: '🛡',
    mpCost: 4,
    power: 1.5,
    scaling: 'con',
    target: 'single_enemy',
    levelReq: 3
  },

  // --- Magical ---
  fire_bolt: {
    id: 'fire_bolt',
    name: 'Fire Bolt',
    description: 'Launch a bolt of fire at one enemy.',
    icon: '🔥',
    mpCost: 6,
    power: 1.8,
    scaling: 'int',
    target: 'single_enemy',
    levelReq: 1
  },
  arcane_blast: {
    id: 'arcane_blast',
    name: 'Arcane Blast',
    description: 'Unleash arcane energy on all foes.',
    icon: '✨',
    mpCost: 12,
    power: 1.4,
    scaling: 'int',
    target: 'all_enemies',
    levelReq: 8
  },
  heal: {
    id: 'heal',
    name: 'Heal',
    description: 'Restore HP to one ally.',
    icon: '💚',
    mpCost: 8,
    power: 2.0,
    scaling: 'int',
    target: 'single_ally',
    levelReq: 3
  },

  // --- Ranged ---
  quick_shot: {
    id: 'quick_shot',
    name: 'Quick Shot',
    description: 'A swift arrow. Scales with Dex.',
    icon: '🏹',
    mpCost: 0,
    power: 1.3,
    scaling: 'dex',
    target: 'single_enemy',
    levelReq: 1
  },
  rain_of_arrows: {
    id: 'rain_of_arrows',
    name: 'Rain of Arrows',
    description: 'Shower the battlefield with arrows.',
    icon: '🌧',
    mpCost: 10,
    power: 1.1,
    scaling: 'dex',
    target: 'all_enemies',
    levelReq: 7
  }
}

/** Look up a skill by ID. Returns undefined for unknown IDs. */
export function getSkill(id: string): Skill | undefined {
  return SKILLS[id]
}

/** Get all skills a character can use at a given level */
export function getAvailableSkills(level: number): Skill[] {
  return Object.values(SKILLS).filter(s => s.levelReq <= level)
}
