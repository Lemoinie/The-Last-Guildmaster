/**
 * tavern.svelte.ts — The Rusty Goblet Tavern System
 *
 * Three responsibilities:
 *
 * 1. PASSIVE INCOME
 *    Adventurers from across the realm visit the tavern for food & drink.
 *    Footfall and gold earned scale with guild renown.
 *    A tick runs every real-world minute (configurable).
 *
 * 2. PASSIVE RECRUITMENT
 *    Every 12 hours (default, scales with renown), a batch of free
 *    adventurers wanders in and can be accepted or dismissed.
 *
 * 3. ACTIVE RECRUITMENT (Summoning)
 *    Spend a SummoningStone to immediately summon an adventurer.
 *    Stone grade determines the rarity pool of the result.
 *
 * All timers are wall-clock based (stored as timestamps) so they
 * persist across saves/reloads correctly.
 */

import { Character } from '../adventurer/character.svelte'
import { JOBS, getJob } from '../adventurer/jobs'
import { TRAITS, getTrait } from '../adventurer/traits'
import { SummoningStone, STONE_GRADE_CONFIG, type StoneGrade, type ItemRarity } from '../adventurer/items.svelte'
import type { TraitId } from '../adventurer/types'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Minimum renown to get any passive income */
const MIN_INCOME_RENOWN = 0
/** Gold earned per patron visit (base) */
const GOLD_PER_PATRON = 2
/** Patrons per income tick at renown 0 */
const BASE_PATRONS = 3
/** Income tick interval in milliseconds (1 real-world minute) */
const INCOME_TICK_MS = 60_000

/** Default passive recruit interval (12 hours in ms) */
const DEFAULT_RECRUIT_INTERVAL_MS = 12 * 60 * 60 * 1000

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdventurerRarity = ItemRarity

/** A pending adventurer waiting to be accepted or dismissed */
export interface PendingRecruit {
  id: string
  character: Character
  rarity: AdventurerRarity
  expiresAt: number   // timestamp — dismissed automatically after 24h if ignored
}

/** A log entry for the tavern activity feed */
export interface TavernLogEntry {
  timestamp: number
  icon: string
  message: string
  type: 'income' | 'recruit' | 'summon' | 'info'
}

/** Serializable tavern state for the save system */
export interface TavernSaveData {
  lastIncomeTick: number
  lastPassiveRecruitAt: number
  passiveRecruitIntervalMs: number
  totalGoldEarned: number
  totalPatronsServed: number
  pendingRecruits: {
    id: string
    name: string
    jobId: string
    traitId: TraitId | null
    rarity: AdventurerRarity
    expiresAt: number
  }[]
}

// ─── Name Generation ──────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Aldric', 'Elowen', 'Kael', 'Lyra', 'Brom', 'Sera', 'Varis', 'Mira',
  'Torin', 'Faelan', 'Cyra', 'Drust', 'Nira', 'Colt', 'Sable', 'Wyn',
  'Theron', 'Isolde', 'Gareth', 'Rowena', 'Cade', 'Lirien', 'Osric', 'Brynn'
]
const EPITHETS = [
  'the Bold', 'Ironhands', 'Swiftfoot', 'the Wise', 'Stoneback',
  'the Silent', 'Dawnblade', 'the Mender', 'of the Mist', 'the Faithful'
]

function generateName(rarity: AdventurerRarity): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') {
    const epithet = EPITHETS[Math.floor(Math.random() * EPITHETS.length)]
    return `${first} ${epithet}`
  }
  return first
}

// ─── Adventurer Generation ────────────────────────────────────────────────────

/** Rarity → job pool weighting */
const RARITY_JOB_POOLS: Record<AdventurerRarity, string[]> = {
  common:    ['squire', 'squire', 'squire', 'footman', 'apprentice', 'archer'],
  uncommon:  ['footman', 'footman', 'apprentice', 'apprentice', 'archer', 'archer'],
  rare:      ['footman', 'apprentice', 'archer'],
  epic:      ['footman', 'apprentice', 'archer'],
  legendary: ['footman', 'apprentice', 'archer']
}

/** Rarity → trait probability (null = no trait) */
const RARITY_TRAIT_CHANCE: Record<AdventurerRarity, number> = {
  common:    0.10,
  uncommon:  0.30,
  rare:      0.60,
  epic:      0.85,
  legendary: 1.00
}

/** Rarity → starting level range [min, max] */
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

/** Generate a fully-formed Character based on rarity */
function generateAdventurer(rarity: AdventurerRarity): Character {
  const jobId = pickRandom(RARITY_JOB_POOLS[rarity])
  const traitChance = RARITY_TRAIT_CHANCE[rarity]
  const traitId: TraitId | null = Math.random() < traitChance
    ? pickRandom(Object.keys(TRAITS) as TraitId[])
    : null

  const [minLvl, maxLvl] = RARITY_LEVEL_RANGE[rarity]
  const targetLevel = minLvl + Math.floor(Math.random() * (maxLvl - minLvl + 1))

  const name = generateName(rarity)
  const char = new Character(name, jobId, traitId)

  // Simulate leveling to reach target level
  for (let lvl = 1; lvl < targetLevel; lvl++) {
    char.addXp(50 * Math.pow(lvl, 1.8))
  }

  return char
}

// ─── Renown Scaling Helpers ───────────────────────────────────────────────────

/**
 * How many patrons visit per income tick.
 * Base 3, scales logarithmically with renown (capped at 50).
 */
function calcPatrons(renown: number): number {
  return Math.min(50, BASE_PATRONS + Math.floor(Math.log1p(renown) * 2.5))
}

/**
 * Passive recruit interval in ms. Starts at 12h, decreases with renown.
 * Floor of 2 hours.
 */
function calcRecruitInterval(renown: number): number {
  const reductionFactor = Math.min(0.83, renown / 1000) // up to 83% reduction
  return Math.max(
    2 * 60 * 60 * 1000,                           // 2h minimum
    DEFAULT_RECRUIT_INTERVAL_MS * (1 - reductionFactor)
  )
}

/**
 * How many adventurers arrive in a passive recruit wave.
 * Base 1, up to 5 at very high renown.
 */
function calcRecruitWaveSize(renown: number): number {
  return Math.min(5, 1 + Math.floor(renown / 200))
}

/**
 * Rarity distribution for passive recruits based on renown.
 * Higher renown → higher chance of rare+ adventurers.
 */
function calcPassiveRarityPool(renown: number): AdventurerRarity[] {
  if (renown >= 800) return ['uncommon', 'rare', 'rare', 'epic']
  if (renown >= 400) return ['common', 'uncommon', 'rare']
  if (renown >= 100) return ['common', 'common', 'uncommon']
  return ['common', 'common', 'common', 'common', 'uncommon']
}

// ─── Tavern Store ─────────────────────────────────────────────────────────────

function createTavern() {
  // --- State ---
  let lastIncomeTick = $state(Date.now())
  let lastPassiveRecruitAt = $state(Date.now() - DEFAULT_RECRUIT_INTERVAL_MS) // ready immediately
  let passiveRecruitIntervalMs = $state(DEFAULT_RECRUIT_INTERVAL_MS)
  let totalGoldEarned = $state(0)
  let totalPatronsServed = $state(0)
  let pendingRecruits = $state<PendingRecruit[]>([])
  let log = $state<TavernLogEntry[]>([])

  // Summoning stone inventory (player's stash)
  let summoningStones = $state<Record<StoneGrade, SummoningStone>>({
    crude:     new SummoningStone('crude', 3),
    refined:   new SummoningStone('refined', 1),
    arcane:    new SummoningStone('arcane', 0),
    legendary: new SummoningStone('legendary', 0)
  })

  let incomeTimer: ReturnType<typeof setInterval> | null = null
  let recruitTimer: ReturnType<typeof setInterval> | null = null

  // --- Derived ---
  const passiveRecruitsReady = $derived(
    Date.now() >= lastPassiveRecruitAt + passiveRecruitIntervalMs
  )

  const totalStones = $derived(
    Object.values(summoningStones).reduce((sum, s) => sum + s.quantity, 0)
  )

  // ─── Logging ────────────────────────────────────────────────────────────────

  function addLog(icon: string, message: string, type: TavernLogEntry['type']) {
    log = [{
      timestamp: Date.now(),
      icon,
      message,
      type
    }, ...log].slice(0, 50) // keep last 50 entries
  }

  // ─── Income Tick ────────────────────────────────────────────────────────────

  /**
   * Process one income tick.
   * Called automatically by the timer or manually for offline catch-up.
   * @param renown Current guild renown
   * @returns Gold earned this tick
   */
  function processIncomeTick(renown: number): number {
    const patrons = calcPatrons(renown)
    const gold = patrons * GOLD_PER_PATRON

    totalPatronsServed += patrons
    totalGoldEarned += gold
    lastIncomeTick = Date.now()

    addLog('🍺', `${patrons} patrons visited — earned ${gold}g`, 'income')
    return gold
  }

  /**
   * Calculate offline income for time elapsed since last tick.
   * Called on load to catch up. Returns total gold earned.
   */
  function processOfflineIncome(renown: number): number {
    const elapsed = Date.now() - lastIncomeTick
    const ticks = Math.floor(elapsed / INCOME_TICK_MS)
    if (ticks <= 0) return 0

    let totalGold = 0
    for (let i = 0; i < Math.min(ticks, 1440); i++) { // cap at 24h of ticks
      totalGold += processIncomeTick(renown)
    }
    return totalGold
  }

  // ─── Passive Recruitment ─────────────────────────────────────────────────────

  /**
   * Check if a passive recruit wave is ready and process it.
   * Returns the newly arrived recruits (empty array if not yet ready).
   */
  function checkPassiveRecruits(renown: number): PendingRecruit[] {
    const now = Date.now()
    if (now < lastPassiveRecruitAt + passiveRecruitIntervalMs) return []

    const waveSize = calcRecruitWaveSize(renown)
    const pool = calcPassiveRarityPool(renown)
    const arrived: PendingRecruit[] = []

    for (let i = 0; i < waveSize; i++) {
      const rarity = pickRandom(pool)
      const char = generateAdventurer(rarity)
      const recruit: PendingRecruit = {
        id: crypto.randomUUID(),
        character: char,
        rarity,
        expiresAt: now + 24 * 60 * 60 * 1000 // expires in 24h
      }
      arrived.push(recruit)
    }

    pendingRecruits = [...pendingRecruits, ...arrived]
    lastPassiveRecruitAt = now
    passiveRecruitIntervalMs = calcRecruitInterval(renown)

    addLog(
      '🚪',
      `${waveSize} adventurer${waveSize > 1 ? 's' : ''} wandered into the tavern seeking work.`,
      'recruit'
    )

    return arrived
  }

  /** Accept a pending recruit — returns the Character for adding to the roster */
  function acceptRecruit(recruitId: string): Character | null {
    const recruit = pendingRecruits.find(r => r.id === recruitId)
    if (!recruit) return null
    pendingRecruits = pendingRecruits.filter(r => r.id !== recruitId)
    addLog('✅', `${recruit.character.name} joined the guild.`, 'recruit')
    return recruit.character
  }

  /** Dismiss a pending recruit */
  function dismissRecruit(recruitId: string): void {
    const recruit = pendingRecruits.find(r => r.id === recruitId)
    if (!recruit) return
    pendingRecruits = pendingRecruits.filter(r => r.id !== recruitId)
    addLog('👋', `${recruit.character.name} was turned away.`, 'recruit')
  }

  /** Expire pending recruits that have been waiting too long */
  function pruneExpiredRecruits(): void {
    const now = Date.now()
    const expired = pendingRecruits.filter(r => r.expiresAt <= now)
    if (expired.length > 0) {
      pendingRecruits = pendingRecruits.filter(r => r.expiresAt > now)
      addLog('⌛', `${expired.length} adventurer${expired.length > 1 ? 's' : ''} left after waiting too long.`, 'info')
    }
  }

  // ─── Active Recruitment (Summoning) ─────────────────────────────────────────

  /**
   * Spend one summoning stone of the given grade to summon an adventurer.
   * Returns the summoned Character, or null if no stones available.
   */
  function summon(grade: StoneGrade): Character | null {
    const stone = summoningStones[grade]
    if (stone.quantity <= 0) {
      addLog('❌', `No ${STONE_GRADE_CONFIG[grade].label}s remaining.`, 'summon')
      return null
    }

    // Consume the stone
    stone.consume()

    // Pick rarity from the stone's pool
    const pool = STONE_GRADE_CONFIG[grade].rarityPool
    const rarity = pickRandom(pool)

    // Generate the adventurer
    const char = generateAdventurer(rarity)
    const rarityLabels: Record<ItemRarity, string> = {
      common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary'
    }

    addLog(
      STONE_GRADE_CONFIG[grade].icon,
      `Summoned: ${char.name} (${rarityLabels[rarity]} ${getJob(char.jobId).name})`,
      'summon'
    )

    return char
  }

  /** Add stones to the player's inventory */
  function addStones(grade: StoneGrade, amount: number): void {
    summoningStones[grade].quantity += amount
    addLog('💎', `Received ${amount}x ${STONE_GRADE_CONFIG[grade].label}.`, 'info')
  }

  // ─── Timer Management ────────────────────────────────────────────────────────

  /**
   * Start the real-time tavern timers.
   * Call once when entering the game, passing a renown getter and gold callback.
   */
  function start(
    getRenown: () => number,
    onGoldEarned: (amount: number) => void,
    onRecruitsArrived: (recruits: PendingRecruit[]) => void
  ): void {
    stop()

    // Income tick every minute
    incomeTimer = setInterval(() => {
      const gold = processIncomeTick(getRenown())
      onGoldEarned(gold)
    }, INCOME_TICK_MS)

    // Recruit check every 5 minutes (lightweight poll)
    recruitTimer = setInterval(() => {
      pruneExpiredRecruits()
      const arrived = checkPassiveRecruits(getRenown())
      if (arrived.length > 0) onRecruitsArrived(arrived)
    }, 5 * 60 * 1000)
  }

  function stop(): void {
    if (incomeTimer) { clearInterval(incomeTimer); incomeTimer = null }
    if (recruitTimer) { clearInterval(recruitTimer); recruitTimer = null }
  }

  // ─── Serialization ───────────────────────────────────────────────────────────

  function serialize(): TavernSaveData {
    return {
      lastIncomeTick,
      lastPassiveRecruitAt,
      passiveRecruitIntervalMs,
      totalGoldEarned,
      totalPatronsServed,
      pendingRecruits: pendingRecruits.map(r => ({
        id: r.id,
        name: r.character.name,
        jobId: r.character.jobId,
        traitId: r.character.traitId,
        rarity: r.rarity,
        expiresAt: r.expiresAt
      }))
    }
  }

  function deserialize(data: TavernSaveData): void {
    lastIncomeTick = data.lastIncomeTick
    lastPassiveRecruitAt = data.lastPassiveRecruitAt
    passiveRecruitIntervalMs = data.passiveRecruitIntervalMs
    totalGoldEarned = data.totalGoldEarned
    totalPatronsServed = data.totalPatronsServed
    pendingRecruits = data.pendingRecruits.map(r => ({
      id: r.id,
      character: new Character(r.name, r.jobId, r.traitId),
      rarity: r.rarity,
      expiresAt: r.expiresAt
    }))
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  return {
    // Readable state
    get pendingRecruits()           { return pendingRecruits },
    get log()                       { return log },
    get totalGoldEarned()           { return totalGoldEarned },
    get totalPatronsServed()        { return totalPatronsServed },
    get lastPassiveRecruitAt()      { return lastPassiveRecruitAt },
    get passiveRecruitIntervalMs()  { return passiveRecruitIntervalMs },
    get summoningStones()           { return summoningStones },
    get passiveRecruitsReady()      { return passiveRecruitsReady },
    get totalStones()               { return totalStones },

    // Actions
    processOfflineIncome,
    checkPassiveRecruits,
    acceptRecruit,
    dismissRecruit,
    summon,
    addStones,
    start,
    stop,
    serialize,
    deserialize,

    // Internals exposed for time display
    calcRecruitInterval,
    calcPatrons
  }
}

export const Tavern = createTavern()
