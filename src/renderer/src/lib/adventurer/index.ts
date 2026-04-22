/**
 * index.ts — Barrel export for the Adventurer system
 */

export { Attributes } from './attributes.svelte'
export { Character } from './character.svelte'
export { JOBS, getJob, type Job } from './jobs'
export { SKILLS, getSkill, getAvailableSkills, type Skill } from './skills'
export { TRAITS, getTrait } from './traits'
export type * from './types'
