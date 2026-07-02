# SAVE_FORMAT.md — The Last Guildmaster

---

## Overview

The game uses a **dual-persistence strategy**: saves are written to both a JSON file (via Electron IPC) and browser `localStorage` (as a fallback). The file system is authoritative; localStorage is only read if the Electron API is unavailable.

---

## Save File Location

| Environment | Path |
|-------------|------|
| **Windows (packaged)** | `%APPDATA%\the-last-guildmaster\saves\savegame.json` |
| **Windows (dev)** | `%APPDATA%\Electron\saves\savegame.json` |
| **Non-Electron fallback** | `localStorage['the_last_guildmaster_save']` |

The exact `userData` path is determined by Electron's `app.getPath('userData')`.

---

## Current Save Format (JSON)

The save file is a single `savegame.json` — **one save slot only**, no multiple saves.

```json
{
  "gold": 1000,
  "renown": 0,
  "adventurers": [
    {
      "name": "Aldric",
      "class": "squire",
      "level": 3,
      "id": 1719876543210
    }
  ],
  "maxAdventurers": 10,
  "inventory": {
    "wood": 25,
    "stone": 10,
    "herbs": 5,
    "seeds": 0,
    "iron": 7
  },
  "equipment": [],
  "expeditions": [
    {
      "id": 1,
      "name": "Forest Patrol",
      "status": "active",
      "remainingTime": 43
    }
  ],
  "unlockedBuildings": ["tavern", "inn", "storage"],
  "logs": [
    "Welcome, Guildmaster. Your journey begins.",
    "[12:34:56] Forest Patrol expedition started."
  ],
  "lastSave": 1719876543210,
  "debugConsole": false,
  "devMode": false,
  "autoSaveInterval": 30
}
```

### Field Notes

| Field | Type | Notes |
|-------|------|-------|
| `gold` | `number` | Decimal allowed (Math.floor shown in UI) |
| `renown` | `number` | Integer in practice |
| `adventurers[].id` | `number` | `Date.now()` — not a UUID; collision risk on fast bulk adds |
| `adventurers[].class` | `string` | Job ID string (e.g., `"squire"`) — not validated against JOBS registry on load |
| `equipment` | `any[]` | Always empty — not implemented |
| `expeditions[].status` | `'active' \| 'completed'` | Only `'active'` expeditions have meaningful `remainingTime` |
| `logs` | `string[]` | Capped at 50 entries (FIFO in engine, but save includes all 50) |
| `lastSave` | `number` | Unix ms timestamp |

---

## What Is NOT Saved

These are critical gaps that affect gameplay continuity across sessions:

| Missing Data | Impact |
|-------------|--------|
| `Tavern.lastIncomeTick` | Offline income catch-up starts from session start, not last session end — **underreports offline earnings** |
| `Tavern.lastPassiveRecruitAt` | Recruit wave timer resets each session — passive recruitment interval ignores real-world time |
| `Tavern.passiveRecruitIntervalMs` | Computed each session from renown — functionally OK but inconsistent |
| `Tavern.pendingRecruits[]` | Adventurers waiting in tavern are lost on reload |
| `Tavern.summoningStones` | Stone inventory resets to `{crude:3, refined:1, arcane:0, legendary:0}` each session |
| `Tavern.totalGoldEarned` / `totalPatronsServed` | Lifetime statistics reset each session |
| Full `Character` data | Skills, traits, equipment, XP curve, derived stats all discarded |
| Audio settings | Volume sliders stored in `localStorage` separately, not in save file |
| Window settings | Window mode/resolution stored in `localStorage` separately |

---

## Save / Load Lifecycle

### Save (`Game.save()` in `game.svelte.ts`)

```
1. state.lastSave = Date.now()
2. if window.electronAPI:
     await window.electronAPI.saveGame(JSON.parse(JSON.stringify(state)))
     └─ IPC: app:save-game
        └─ Main: fs.promises.writeFile(savesPath/savegame.json, JSON, 'utf-8')
3. localStorage.setItem('the_last_guildmaster_save', JSON.stringify(state))
```

**Triggering conditions:**
- Auto-save timer (`setInterval`, every N minutes)
- Manual save button in `SettingsModal`
- `SettingsModal.applySettings()` always saves after applying
- `Game.reset()` saves the initial state

**Notable:** `JSON.parse(JSON.stringify(state))` is used to deep-clone the state before sending via IPC. This is correct (avoids proxy issues) but strips any non-JSON values (functions, `undefined`, etc.).

### Load (`Game.load()` in `game.svelte.ts`)

```
1. if window.electronAPI:
     saved = await window.electronAPI.loadGame()
     └─ IPC: app:load-game
        └─ Main: fs.promises.readFile(savesPath/savegame.json)
              → JSON.parse(data)
              → return parsed object (or null if file not found)
2. else:
     saved = JSON.parse(localStorage.getItem('the_last_guildmaster_save'))
3. Object.assign(state, { ...initialState, ...saved })
   // initialState is spread first → saved values override → new fields get defaults
4. startAutoSaveTimer()
```

**Load is called once** in `GameApp.svelte.onMount()`.

### Reset (`Game.reset()`)

```
Object.assign(state, { ...initialState })
save()
```

There is no confirmation dialog. No current UI exposes this action (it exists but is not wired to any button).

---

## Persistence Logic Flow

```
GameApp.onMount()
    │
    ▼
Game.load()
    ├─ [Electron] → IPC → Main → readFile(savegame.json) → parsed JSON
    └─ [Browser]  → localStorage.getItem(STORAGE_KEY) → parsed JSON
    │
    ▼
Object.assign(state, { ...initialState, ...saved })
    │
    ▼
GameEngine.start()   ← 1-second tick begins
Tavern.start(...)    ← When Tavern.svelte mounts
    │
    [time passes...]
    │
    ▼
Auto-save timer fires every N minutes
    │
    ▼
Game.save()
    ├─ electronAPI.saveGame(deepClone) → IPC → fs.writeFile
    └─ localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
```

---

## Log File Format

Separate from game saves. Located at `userData/logs/session.json`.

```json
[
  {
    "type": "SYSTEM",
    "message": "Starting new game session.",
    "timestamp": "2026-07-02T04:35:49.000Z"
  },
  {
    "type": "INFO",
    "message": "Navigating to tavern",
    "timestamp": "2026-07-02T04:35:50.123Z"
  }
]
```

Entries are appended on each write. The file grows unboundedly — **no rotation, no size limit**.

---

## Missing Future-Proofing

### ❌ No Schema Versioning
The save file has no `version` field. If fields are renamed or removed between updates, loading old saves will:
- **Silently use initial defaults** for new fields (handled by `{...initialState, ...saved}`)
- **Retain removed/stale fields** (they remain in the object but may not be read)
- **Fail silently** if types change (e.g., `id` from `number` to `string`)

**Recommended fix:**
```json
{
  "version": 1,
  "data": { ... }
}
```
With a migration function: `if (save.version < CURRENT_VERSION) migrate(save)`

### ❌ No Data Validation on Load
`Game.load()` does `Object.assign(state, saved)` directly without validating field types, ranges, or required fields. A corrupted or hand-edited save file can inject invalid state.

**Recommended fix:** Zod schema or a manual validation pass before `Object.assign`.

### ❌ Single Save Slot
Only `savegame.json` — no multiple save files, no auto-backup. A failed save write could corrupt the only save.

**Recommended fix:** Write to `savegame.tmp` → rename to `savegame.json` (atomic write), keep `savegame.bak` as a backup.

### ❌ No Save Integrity Check
No checksum or hash to detect corruption.

### ❌ Tavern State Not Integrated
`Tavern.serialize()` and `Tavern.deserialize()` exist but are never called from `Game.save()` / `Game.load()`. The save format needs a `tavern` sub-object to be meaningful.

**Required addition to save format:**
```json
{
  "version": 1,
  "game": { ... current GameStateData fields ... },
  "tavern": {
    "lastIncomeTick": 1719876543210,
    "lastPassiveRecruitAt": 1719870000000,
    "passiveRecruitIntervalMs": 43200000,
    "totalGoldEarned": 1250,
    "totalPatronsServed": 625,
    "summoningStones": {
      "crude": 2, "refined": 1, "arcane": 0, "legendary": 0
    },
    "pendingRecruits": [...]
  }
}
```

### ❌ Adventurers Should Use Rich Character Data
The save format needs to store full `CharacterData` (from `character.svelte.ts` → `serialize()`) instead of the simplified `{name, class, level, id}` shape.

**Required addition:**
```json
"roster": [
  {
    "id": "uuid-...",
    "name": "Aldric",
    "level": 3,
    "xp": 142,
    "jobId": "squire",
    "traitId": "nimble",
    "skillIds": ["slash"],
    "baseStr": 14, "baseInt": 10, "baseDex": 13, "baseCon": 12,
    "weaponId": "iron_sword",
    "armorId": null,
    "accessoryId": null
  }
]
```
