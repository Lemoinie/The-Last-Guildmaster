/**
 * Game State Management — Svelte 5 Runes
 * A global Game object using $state for reactive state.
 * Import anywhere: import { Game } from '$lib/stores/game.svelte'
 */

export interface Adventurer {
  name: string
  class: string
  level: number
  id: number
}

export interface Expedition {
  id: number
  name: string
  status: 'active' | 'completed'
  remainingTime: number
}

export interface Inventory {
  wood: number
  stone: number
  herbs: number
  seeds: number
  iron: number
}

export interface GameStateData {
  gold: number
  renown: number
  adventurers: Adventurer[]
  maxAdventurers: number
  inventory: Inventory
  equipment: any[]
  expeditions: Expedition[]
  unlockedBuildings: string[]
  logs: string[]
  lastSave: number
  debugConsole: boolean
  autoSaveInterval: number
}

const STORAGE_KEY = 'the_last_guildmaster_save'

const initialState: GameStateData = {
  gold: 1000,
  renown: 0,
  adventurers: [],
  maxAdventurers: 10,
  inventory: {
    wood: 10,
    stone: 10,
    herbs: 5,
    seeds: 0,
    iron: 2
  },
  equipment: [],
  expeditions: [],
  unlockedBuildings: ['tavern', 'inn', 'storage'],
  logs: ['Welcome, Guildmaster. Your journey begins.'],
  lastSave: Date.now(),
  debugConsole: false,
  autoSaveInterval: 30
}

function createGame() {
  let state = $state<GameStateData>({ ...initialState })
  let autoSaveTimer: ReturnType<typeof setInterval> | null = null

  function startAutoSaveTimer() {
    if (autoSaveTimer) clearInterval(autoSaveTimer)
    const intervalMins = state.autoSaveInterval || 0
    if (intervalMins > 0) {
      console.log(`Auto-save scheduled every ${intervalMins} minutes.`)
      autoSaveTimer = setInterval(() => {
        console.log('Performing scheduled auto-save...')
        save()
      }, intervalMins * 60 * 1000)
    }
  }

  async function save() {
    state.lastSave = Date.now()
    if (window.electronAPI?.saveGame) {
      await window.electronAPI.saveGame(JSON.parse(JSON.stringify(state)))
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    console.log('Game state secured.')
  }

  async function load() {
    if (window.electronAPI?.loadGame) {
      const saved = await window.electronAPI.loadGame()
      if (saved) {
        Object.assign(state, { ...initialState, ...saved })
        console.log('State loaded from file system')
      }
    } else {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        Object.assign(state, { ...initialState, ...JSON.parse(saved) })
      }
    }
    startAutoSaveTimer()
  }

  function reset() {
    Object.assign(state, { ...initialState })
    save()
  }

  return {
    get state() {
      return state
    },
    save,
    load,
    reset,
    startAutoSaveTimer
  }
}

export const Game = createGame()
