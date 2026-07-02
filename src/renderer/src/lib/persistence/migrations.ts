/**
 * migrations.ts — Save File Schema Migration Layer
 */

function migrateLegacyToV1(old: any): any {
  const result: any = {
    roster: [],
    tavern: {
      lastIncomeTick: 0,
      lastPassiveRecruitAt: -12,
      passiveRecruitIntervalMs: 12 * 60 * 60 * 1000,
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

  // 1. Map legacy adventurers or roster list
  if (Array.isArray(old.adventurers)) {
    result.roster = old.adventurers
  } else if (Array.isArray(old.roster)) {
    result.roster = old.roster
  }

  // 2. Map gold & renown
  if (typeof old.gold === 'number') {
    result.economy.gold = old.gold
  } else if (old.economy && typeof old.economy.gold === 'number') {
    result.economy.gold = old.economy.gold
  }

  if (typeof old.renown === 'number') {
    result.economy.renown = old.renown
  } else if (old.economy && typeof old.economy.renown === 'number') {
    result.economy.renown = old.economy.renown
  }

  // 3. Map resources (inventory vs resources)
  const legacyInventory = old.inventory || old.resources || {}
  const targetResources = result.resources
  for (const key of Object.keys(targetResources)) {
    if (typeof legacyInventory[key] === 'number') {
      targetResources[key] = legacyInventory[key]
    }
  }
  if (legacyInventory.storage) {
    targetResources.storage = JSON.parse(JSON.stringify(legacyInventory.storage))
  }

  // 4. Map unlocked buildings list
  if (Array.isArray(old.unlockedBuildings)) {
    result.world.unlockedBuildings = old.unlockedBuildings
  } else if (old.world && Array.isArray(old.world.unlockedBuildings)) {
    result.world.unlockedBuildings = old.world.unlockedBuildings
  }

  // 4.5. Map world time clock properties if present
  if (old.world && old.world.time) {
    const legacyTime = old.world.time
    const targetTime = result.world.time
    if (typeof legacyTime.tick === 'number') targetTime.tick = legacyTime.tick
    if (typeof legacyTime.hour === 'number') targetTime.hour = legacyTime.hour
    if (typeof legacyTime.day === 'number') targetTime.day = legacyTime.day
    if (typeof legacyTime.week === 'number') targetTime.week = legacyTime.week
    if (typeof legacyTime.month === 'number') targetTime.month = legacyTime.month
    if (typeof legacyTime.year === 'number') targetTime.year = legacyTime.year
  } else if (old.time) {
    const legacyTime = old.time
    const targetTime = result.world.time
    if (typeof legacyTime.tick === 'number') targetTime.tick = legacyTime.tick
    if (typeof legacyTime.hour === 'number') targetTime.hour = legacyTime.hour
    if (typeof legacyTime.day === 'number') targetTime.day = legacyTime.day
    if (typeof legacyTime.week === 'number') targetTime.week = legacyTime.week
    if (typeof legacyTime.month === 'number') targetTime.month = legacyTime.month
    if (typeof legacyTime.year === 'number') targetTime.year = legacyTime.year
  }

  // 5. Map settings
  const settingsKeys = ['maxAdventurers', 'debugConsole', 'devMode', 'autoSaveInterval']
  const legacySettings = old.settings || old
  for (const key of settingsKeys) {
    if (legacySettings[key] !== undefined) {
      result.settings[key] = legacySettings[key]
    }
  }

  // 6. Set meta values
  result.meta.version = 1
  result.meta.saveTimestamp = old.lastSave || old.meta?.saveTimestamp || Date.now()
  result.meta.playtime = old.meta?.playtime || 0

  return result
}

export function migrateSave(saveData: any): any {
  if (!saveData) return null

  // Clean deep clone to maintain purity
  let cloned = JSON.parse(JSON.stringify(saveData))

  let currentVersion = cloned.meta?.version ?? 0
  const TARGET_VERSION = 1

  const migrations: Record<number, (data: any) => any> = {
    0: migrateLegacyToV1
  }

  while (currentVersion < TARGET_VERSION) {
    const migration = migrations[currentVersion]
    if (!migration) {
      console.warn(`No migration handler found for version ${currentVersion}.`)
      break
    }
    cloned = migration(cloned)
    currentVersion = cloned.meta?.version ?? (currentVersion + 1)
  }

  // Ensure lastPassiveRecruitAt and lastIncomeTick are not legacy real-world timestamps
  if (cloned.tavern) {
    if (typeof cloned.tavern.lastPassiveRecruitAt === 'number' && cloned.tavern.lastPassiveRecruitAt > 1000000) {
      cloned.tavern.lastPassiveRecruitAt = -12
    }
    if (typeof cloned.tavern.lastIncomeTick === 'number' && cloned.tavern.lastIncomeTick > 1000000) {
      cloned.tavern.lastIncomeTick = 0
    }
  }

  return cloned
}
