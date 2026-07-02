/**
 * Game State Management — Svelte 5 Runes
 * A global Game object using $state for reactive state.
 * All state is unified here under a single source of truth.
 * All gameplay logic is delegated to separate domain systems.
 */

import type { CharacterData } from '../adventurer/types'
import type { StoneGrade, ItemRarity } from '../adventurer/items.svelte'
import { Character } from '../adventurer/character.svelte'
// System Delegations
import * as economySys from '../systems/economy.system'
import * as resourceSys from '../systems/resource.system'
import * as rosterSys from '../systems/roster.system'
import * as worldSys from '../systems/world.system'
import * as expeditionSys from '../systems/expedition.system'
import * as tavernSys from '../systems/tavern.system'
import * as timeSys from '../systems/world.time.system'
import * as storageSys from '../systems/storage.system'
import { registerTimeHooks } from '../systems/time.actions'
import { migrateSave } from '../persistence/migrations'

// Re-export scaling functions for components
export { calcPatrons, calcRecruitInterval, calcRecruitWaveSize, calcPassiveRarityPool } from '../systems/tavern.system'
export { getSeason, isNight } from '../systems/world.time.system'

export interface Expedition {
  id: number
  name: string
  status: 'active' | 'completed'
  remainingTime: number
}

export type AdventurerRarity = ItemRarity

export interface PendingRecruitData {
  id: string
  character: CharacterData
  rarity: AdventurerRarity
  expiresAt: number
}

export interface TavernLogEntry {
  timestamp: number
  icon: string
  message: string
  type: 'income' | 'recruit' | 'summon' | 'info'
}

export interface Resources {
  wood: number
  stone: number
  herbs: number
  seeds: number
  iron: number
  storage: storageSys.GuildStorageData
}

export interface GameStateData {
  roster: CharacterData[]
  tavern: {
    lastIncomeTick: number
    lastPassiveRecruitAt: number
    passiveRecruitIntervalMs: number
    totalGoldEarned: number
    totalPatronsServed: number
    pendingRecruits: PendingRecruitData[]
    summoningStones: Record<StoneGrade, number>
  }
  economy: {
    gold: number
    renown: number
  }
  resources: Resources
  expeditions: Expedition[]
  world: {
    unlockedBuildings: string[]
    log: TavernLogEntry[]
    time: {
      tick: number
      hour: number
      day: number
      week: number
      month: number
      year: number
    }
  }
  settings: {
    maxAdventurers: number
    debugConsole: boolean
    devMode: boolean
    autoSaveInterval: number
    lastSave: number
  }
  meta: {
    version: number
    saveTimestamp: number
    playtime: number
  }
}

const STORAGE_KEY = 'the_last_guildmaster_save'
const DEFAULT_RECRUIT_INTERVAL_MS = 12 * 60 * 60 * 1000

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState: GameStateData = {
  roster: [],
  tavern: {
    lastIncomeTick: 0,
    lastPassiveRecruitAt: -12, // ready immediately in game hours
    passiveRecruitIntervalMs: DEFAULT_RECRUIT_INTERVAL_MS,
    totalGoldEarned: 0,
    totalPatronsServed: 0,
    pendingRecruits: [],
    summoningStones: {
      crude: 3,
      refined: 1,
      arcane: 0,
      legendary: 0
    }
  },
  economy: {
    gold: 1000,
    renown: 0
  },
  resources: {
    wood: 10,
    stone: 10,
    herbs: 5,
    seeds: 0,
    iron: 2,
    storage: {
      maxSlots: 20,
      items: Array(20).fill(null)
    }
  },
  expeditions: [],
  world: {
    unlockedBuildings: ['tavern', 'inn', 'storage'],
    log: [
      {
        timestamp: Date.now(),
        icon: '📜',
        message: 'Welcome, Guildmaster. Your journey begins.',
        type: 'info'
      }
    ],
    time: {
      tick: 0,
      hour: 0,
      day: 1,
      week: 1,
      month: 1,
      year: 1
    }
  },
  settings: {
    maxAdventurers: 10,
    debugConsole: false,
    devMode: false,
    autoSaveInterval: 30,
    lastSave: Date.now()
  },
  meta: {
    version: 1,
    saveTimestamp: Date.now(),
    playtime: 0
  }
}

function createGame() {
  let state = $state<GameStateData>(JSON.parse(JSON.stringify(initialState)))
  let autoSaveTimer: ReturnType<typeof setInterval> | null = null

  // Register time progression hooks for subsystems
  registerTimeHooks()

  // ─── Auto-Save ──────────────────────────────────────────────────────────────
  function startAutoSaveTimer() {
    if (autoSaveTimer) clearInterval(autoSaveTimer)
    const intervalMins = state.settings.autoSaveInterval || 0
    if (intervalMins > 0) {
      console.log(`Auto-save scheduled every ${intervalMins} minutes.`)
      autoSaveTimer = setInterval(() => {
        console.log('Performing scheduled auto-save...')
        save()
      }, intervalMins * 60 * 1000)
    }
  }

  async function save() {
    state.settings.lastSave = Date.now()
    state.meta.saveTimestamp = Date.now()
    if (window.electronAPI?.saveGame) {
      await window.electronAPI.saveGame(JSON.parse(JSON.stringify(state)))
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    console.log('Game state secured.')
  }

  async function load() {
    let rawSaved: any = null

    if (window.electronAPI?.loadGame) {
      rawSaved = await window.electronAPI.loadGame()
      if (rawSaved) {
        console.log('State loaded from file system')
      }
    } else {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        rawSaved = JSON.parse(saved)
      }
    }

    if (rawSaved) {
      // 1. Run root schema migrations
      const migrated = migrateSave(rawSaved)
      // 2. Hydrate state
      Object.assign(state, { ...JSON.parse(JSON.stringify(initialState)), ...migrated })
    }

    // Ensure storage is initialized fallback if missing
    if (!state.resources.storage) {
      state.resources.storage = {
        maxSlots: 20,
        items: Array(20).fill(null)
      }
    }

    // Ensure all time parameters are initialized to prevent NaNs
    if (!state.world.time) {
      state.world.time = { tick: 0, hour: 0, day: 1, week: 1, month: 1, year: 1 }
    } else {
      if (state.world.time.tick === undefined) state.world.time.tick = 0
      if (state.world.time.hour === undefined) state.world.time.hour = 0
      if (state.world.time.day === undefined) state.world.time.day = 1
      if (state.world.time.week === undefined) state.world.time.week = 1
      if (state.world.time.month === undefined) state.world.time.month = 1
      if (state.world.time.year === undefined) state.world.time.year = 1
    }

    // Sanitize tavern timestamps
    if (state.tavern) {
      if (state.tavern.lastPassiveRecruitAt === undefined || state.tavern.lastPassiveRecruitAt > 1000000) {
        state.tavern.lastPassiveRecruitAt = -12
      }
      if (state.tavern.lastIncomeTick === undefined || state.tavern.lastIncomeTick > 1000000) {
        state.tavern.lastIncomeTick = 0
      }
    }

    // Validate and migrate CharacterData in roster
    if (Array.isArray(state.roster)) {
      state.roster = state.roster.map(charData => {
        try {
          const char = Character.deserialize(charData)
          return char.serialize()
        } catch (e) {
          console.error('Failed to deserialize/migrate character data, keeping original:', e)
          return charData
        }
      })
    }

    // Validate and migrate CharacterData in pending recruits
    if (state.tavern && Array.isArray(state.tavern.pendingRecruits)) {
      state.tavern.pendingRecruits = state.tavern.pendingRecruits.map(recruit => {
        try {
          const char = Character.deserialize(recruit.character)
          return {
            ...recruit,
            character: char.serialize()
          }
        } catch (e) {
          console.error('Failed to deserialize/migrate pending recruit character data:', e)
          return recruit
        }
      })
    }

    // Offline Time Catch-up
    const now = Date.now()
    const elapsedMs = now - state.meta.saveTimestamp
    if (elapsedMs > 0) {
      const elapsedSeconds = Math.floor(elapsedMs / 1000)
      if (elapsedSeconds > 0) {
        console.log(`Advancing world clock by ${elapsedSeconds} ticks for offline catch-up.`)
        timeSys.advanceMultipleTicks(state, elapsedSeconds)
      }
    }

    startAutoSaveTimer()
  }

  function reset() {
    state = JSON.parse(JSON.stringify(initialState))
    save()
  }

  // ─── Settings Actions ────────────────────────────────────────────────────────
  function updateSettings(config: { debugConsole?: boolean; devMode?: boolean; autoSaveInterval?: number }) {
    if (config.debugConsole !== undefined) state.settings.debugConsole = config.debugConsole
    if (config.devMode !== undefined) state.settings.devMode = config.devMode
    if (config.autoSaveInterval !== undefined) state.settings.autoSaveInterval = config.autoSaveInterval
    startAutoSaveTimer()
  }

  return {
    get state() {
      return state
    },
    save,
    load,
    reset,
    startAutoSaveTimer,

    // Economy Actions Delegation
    spendGold: (amount: number) => economySys.spendGold(state, amount),
    gainGold: (amount: number) => economySys.gainGold(state, amount),
    gainRenown: (amount: number) => economySys.gainRenown(state, amount),
    loseRenown: (amount: number) => economySys.loseRenown(state, amount),

    // Resource Actions Delegation
    addResource: (type: keyof Resources, amount: number) => resourceSys.addResource(state, type, amount),
    consumeResource: (type: keyof Resources, amount: number) => resourceSys.consumeResource(state, type, amount),

    // Storage Actions Delegation
    addItem: (itemId: string, quantity: number) => storageSys.addItem(state.resources.storage, itemId, quantity),
    removeItem: (itemId: string, quantity: number) => storageSys.removeItem(state.resources.storage, itemId, quantity),
    splitStack: (slotIndex: number, amount: number) => storageSys.splitStack(state.resources.storage, slotIndex, amount),
    mergeStacks: () => storageSys.mergeStacks(state.resources.storage),
    hasSpace: (itemId: string, quantity: number) => storageSys.hasSpace(state.resources.storage, itemId, quantity),

    // Roster Actions Delegation
    addCharacter: (characterData: CharacterData) => rosterSys.addCharacter(state, characterData),
    removeCharacter: (characterId: string) => rosterSys.removeCharacter(state, characterId),

    // Tavern Actions Delegation
    recruitCharacter: (recruitId: string) => tavernSys.recruitCharacter(state, recruitId),
    dismissRecruit: (recruitId: string) => tavernSys.dismissRecruit(state, recruitId),
    pruneExpiredRecruits: () => tavernSys.pruneExpiredRecruits(state),
    checkPassiveRecruits: () => tavernSys.checkPassiveRecruits(state),
    refreshTavern: () => tavernSys.refreshTavern(state),
    summonCharacter: (grade: StoneGrade) => tavernSys.summonCharacter(state, grade),
    addStones: (grade: StoneGrade, amount: number) => tavernSys.addStones(state, grade, amount),
    processOfflineIncome: () => tavernSys.processOfflineIncome(state),
    processIncomeTick: () => tavernSys.processIncomeTick(state),
    
    // Timers are now no-ops driven by unified engine world time ticks
    startTavernTimers: () => {},
    stopTavernTimers: () => {},

    // Expedition Actions Delegation
    startExpedition: (party: string[]) => expeditionSys.startExpedition(state, party),
    resolveExpedition: () => expeditionSys.resolveExpedition(state),
    returnExpedition: (id: number) => expeditionSys.returnExpedition(state, id),

    // Settings Actions
    updateSettings,

    // World Actions Delegation
    addLog: (icon: string, message: string, type: TavernLogEntry['type']) => worldSys.addLog(state, icon, message, type),

    // Time Actions Delegation
    advanceTick: () => timeSys.advanceTick(state),
    advanceHour: () => timeSys.advanceHour(state),
    advanceDay: () => timeSys.advanceDay(state),
    advanceMonth: () => timeSys.advanceMonth(state),
    advanceYear: () => timeSys.advanceYear(state)
  }
}

export const Game = createGame()
