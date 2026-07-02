import type { GameStateData, PendingRecruitData } from '../stores/game.svelte'
import { Character } from '../adventurer/character.svelte'
import { getJob } from '../adventurer/jobs'
import { TRAITS } from '../adventurer/traits'
import { STONE_GRADE_CONFIG } from '../adventurer/items.svelte'
import type { CharacterData, TraitId } from '../adventurer/types'
import type { StoneGrade, ItemRarity } from '../adventurer/items.svelte'
import { addLog } from './world.system'
import { gainGold } from './economy.system'
import { addCharacter } from './roster.system'

export type AdventurerRarity = ItemRarity

// ─── Constants ────────────────────────────────────────────────────────────────
const INCOME_TICK_MS = 60_000
const DEFAULT_RECRUIT_INTERVAL_MS = 12 * 60 * 60 * 1000

const FIRST_NAMES = [
  'Aldric', 'Elowen', 'Kael', 'Lyra', 'Brom', 'Sera', 'Varis', 'Mira',
  'Torin', 'Faelan', 'Cyra', 'Drust', 'Nira', 'Colt', 'Sable', 'Wyn',
  'Theron', 'Isolde', 'Gareth', 'Rowena', 'Cade', 'Lirien', 'Osric', 'Brynn'
]
const EPITHETS = [
  'the Bold', 'Ironhands', 'Swiftfoot', 'the Wise', 'Stoneback',
  'the Silent', 'Dawnblade', 'the Mender', 'of the Mist', 'the Faithful'
]

// ─── Renown Scaling Helpers ───────────────────────────────────────────────────
export function calcPatrons(renown: number): number {
  return Math.min(50, 3 + Math.floor(Math.log1p(renown) * 2.5))
}

export function calcRecruitInterval(renown: number): number {
  const reductionFactor = Math.min(0.83, renown / 1000)
  return Math.max(
    2 * 60 * 60 * 1000,
    DEFAULT_RECRUIT_INTERVAL_MS * (1 - reductionFactor)
  )
}

export function calcRecruitWaveSize(renown: number): number {
  return Math.min(5, 1 + Math.floor(renown / 200))
}

export function calcPassiveRarityPool(renown: number): AdventurerRarity[] {
  if (renown >= 800) return ['uncommon', 'rare', 'rare', 'epic']
  if (renown >= 400) return ['common', 'uncommon', 'rare']
  if (renown >= 100) return ['common', 'common', 'uncommon']
  return ['common', 'common', 'common', 'common', 'uncommon']
}

// ─── Generation Logic ──────────────────────────────────────────────────────────
export function generateName(rarity: AdventurerRarity): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') {
    const epithet = EPITHETS[Math.floor(Math.random() * EPITHETS.length)]
    return `${first} ${epithet}`
  }
  return first
}

const RARITY_JOB_POOLS: Record<AdventurerRarity, string[]> = {
  common:    ['squire', 'squire', 'squire', 'footman', 'apprentice', 'archer'],
  uncommon:  ['footman', 'footman', 'apprentice', 'apprentice', 'archer', 'archer'],
  rare:      ['footman', 'apprentice', 'archer'],
  epic:      ['footman', 'apprentice', 'archer'],
  legendary: ['footman', 'apprentice', 'archer']
}

const RARITY_TRAIT_CHANCE: Record<AdventurerRarity, number> = {
  common:    0.10,
  uncommon:  0.30,
  rare:      0.60,
  epic:      0.85,
  legendary: 1.00
}

const RARITY_LEVEL_RANGE: Record<AdventurerRarity, [number, number]> = {
  common:    [1, 3],
  uncommon:  [3, 7],
  rare:      [7, 12],
  epic:      [12, 18],
  legendary: [18, 25]
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateAdventurerData(rarity: AdventurerRarity): CharacterData {
  const jobId = pickRandom(RARITY_JOB_POOLS[rarity])
  const traitChance = RARITY_TRAIT_CHANCE[rarity]
  const traitId: TraitId | null = Math.random() < traitChance
    ? pickRandom(Object.keys(TRAITS) as TraitId[])
    : null

  const [minLvl, maxLvl] = RARITY_LEVEL_RANGE[rarity]
  const targetLevel = minLvl + Math.floor(Math.random() * (maxLvl - minLvl + 1))

  const name = generateName(rarity)
  const char = new Character(name, jobId, traitId)

  // Simulate level-ups
  for (let lvl = 1; lvl < targetLevel; lvl++) {
    char.addXp(50 * Math.pow(lvl, 1.8))
  }

  return char.serialize()
}

// ─── Operations ───────────────────────────────────────────────────────────────
export function recruitCharacter(state: GameStateData, recruitId: string): boolean {
  if (state.roster.length >= state.settings.maxAdventurers) {
    return false
  }
  const recruitIndex = state.tavern.pendingRecruits.findIndex(r => r.id === recruitId)
  if (recruitIndex === -1) return false

  const recruit = state.tavern.pendingRecruits[recruitIndex]
  state.tavern.pendingRecruits = state.tavern.pendingRecruits.filter(r => r.id !== recruitId)
  addCharacter(state, recruit.character)
  addLog(state, '✅', `${recruit.character.name} joined the guild.`, 'recruit')
  return true
}

export function dismissRecruit(state: GameStateData, recruitId: string): void {
  const recruit = state.tavern.pendingRecruits.find(r => r.id === recruitId)
  if (!recruit) return
  state.tavern.pendingRecruits = state.tavern.pendingRecruits.filter(r => r.id !== recruitId)
  addLog(state, '👋', `${recruit.character.name} was turned away.`, 'recruit')
}

export function pruneExpiredRecruits(state: GameStateData): void {
  const now = Date.now()
  const expired = state.tavern.pendingRecruits.filter(r => r.expiresAt <= now)
  if (expired.length > 0) {
    state.tavern.pendingRecruits = state.tavern.pendingRecruits.filter(r => r.expiresAt > now)
    addLog(state, '⌛', `${expired.length} adventurer${expired.length > 1 ? 's' : ''} left after waiting too long.`, 'info')
  }
}

export function checkPassiveRecruits(state: GameStateData): PendingRecruitData[] {
  const now = Date.now()
  if (now < state.tavern.lastPassiveRecruitAt + state.tavern.passiveRecruitIntervalMs) return []

  const waveSize = calcRecruitWaveSize(state.economy.renown)
  const pool = calcPassiveRarityPool(state.economy.renown)
  const arrived: PendingRecruitData[] = []

  for (let i = 0; i < waveSize; i++) {
    const rarity = pickRandom(pool)
    const charData = generateAdventurerData(rarity)
    arrived.push({
      id: crypto.randomUUID(),
      character: charData,
      rarity,
      expiresAt: now + 24 * 60 * 60 * 1000
    })
  }

  state.tavern.pendingRecruits = [...state.tavern.pendingRecruits, ...arrived]
  state.tavern.lastPassiveRecruitAt = now
  state.tavern.passiveRecruitIntervalMs = calcRecruitInterval(state.economy.renown)

  addLog(
    state,
    '🚪',
    `${waveSize} adventurer${waveSize > 1 ? 's' : ''} wandered into the tavern seeking work.`,
    'recruit'
  )

  return arrived
}

export function refreshTavern(state: GameStateData): void {
  pruneExpiredRecruits(state)
  const waveSize = calcRecruitWaveSize(state.economy.renown)
  const pool = calcPassiveRarityPool(state.economy.renown)
  const arrived: PendingRecruitData[] = []
  const now = Date.now()

  for (let i = 0; i < waveSize; i++) {
    const rarity = pickRandom(pool)
    const charData = generateAdventurerData(rarity)
    arrived.push({
      id: crypto.randomUUID(),
      character: charData,
      rarity,
      expiresAt: now + 24 * 60 * 60 * 1000
    })
  }

  state.tavern.pendingRecruits = [...state.tavern.pendingRecruits, ...arrived]
  state.tavern.lastPassiveRecruitAt = now
  state.tavern.passiveRecruitIntervalMs = calcRecruitInterval(state.economy.renown)

  addLog(state, '🚪', `Tavern refreshed! ${waveSize} new adventurer${waveSize > 1 ? 's' : ''} arrived.`, 'recruit')
}

export function summonCharacter(state: GameStateData, grade: StoneGrade): CharacterData | null {
  const currentQty = state.tavern.summoningStones[grade] || 0
  if (currentQty <= 0) {
    addLog(state, '❌', `No ${STONE_GRADE_CONFIG[grade].label}s remaining.`, 'summon')
    return null
  }

  if (state.roster.length >= state.settings.maxAdventurers) {
    return null
  }

  // Spend stone
  state.tavern.summoningStones[grade] -= 1

  const pool = STONE_GRADE_CONFIG[grade].rarityPool
  const rarity = pickRandom(pool)
  const charData = generateAdventurerData(rarity)

  const rarityLabels: Record<ItemRarity, string> = {
    common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary'
  }

  addLog(
    state,
    STONE_GRADE_CONFIG[grade].icon,
    `Summoned: ${charData.name} (${rarityLabels[rarity]} ${charData.jobId})`,
    'summon'
  )

  addCharacter(state, charData)
  return charData
}

export function addStones(state: GameStateData, grade: StoneGrade, amount: number): void {
  if (state.tavern.summoningStones[grade] !== undefined) {
    state.tavern.summoningStones[grade] += amount
    addLog(state, '💎', `Received ${amount}x ${STONE_GRADE_CONFIG[grade].label}.`, 'info')
  }
}

export function processIncomeTick(state: GameStateData): number {
  const patrons = calcPatrons(state.economy.renown)
  const gold = patrons * 2

  state.tavern.totalPatronsServed += patrons
  state.tavern.totalGoldEarned += gold
  state.tavern.lastIncomeTick = Date.now()

  gainGold(state, gold)
  addLog(state, '🍺', `${patrons} patrons visited — earned ${gold}g`, 'income')
  return gold
}

export function processOfflineIncome(state: GameStateData): number {
  const elapsed = Date.now() - state.tavern.lastIncomeTick
  const ticks = Math.floor(elapsed / INCOME_TICK_MS)
  if (ticks <= 0) return 0

  let totalGold = 0
  for (let i = 0; i < Math.min(ticks, 1440); i++) {
    totalGold += processIncomeTick(state)
  }
  return totalGold
}
