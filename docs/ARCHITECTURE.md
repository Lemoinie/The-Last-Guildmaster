# ARCHITECTURE.md — The Last Guildmaster

> **Version:** 0.2.0 | **Stack:** Electron 41 + Svelte 5 + TypeScript + Vite (electron-vite)

---

## Overview

The Last Guildmaster is a single-player RPG guild management desktop game built with Electron (Node.js backend) and Svelte 5 (reactive UI frontend). It uses a **two-process Electron architecture** with a clear boundary enforced by a context-isolated preload bridge. All gameplay logic and state run in the renderer process as a Svelte 5 application.

---

## Process Architecture

```
┌─────────────────────────────────────────┐
│            MAIN PROCESS                 │
│  src/main/index.ts  (Node.js / Electron)│
│                                         │
│  ▸ Creates BrowserWindow                │
│  ▸ Manages file I/O (saves, logs)       │
│  ▸ auto-updater (electron-updater)      │
│  ▸ Single-instance lock                 │
│  ▸ IPC handlers (ipcMain)               │
└────────────────┬────────────────────────┘
                 │ IPC (contextBridge)
                 │ preload.js / src/preload/
┌────────────────▼────────────────────────┐
│           RENDERER PROCESS              │
│    Svelte 5 SPA (electron-vite)         │
│                                         │
│  ▸ All game logic lives here            │
│  ▸ Reactive state via Svelte $state     │
│  ▸ No direct Node.js access             │
│  ▸ Calls main via window.electronAPI    │
└─────────────────────────────────────────┘
```

---

## Core Systems

### 1. Electron Shell (`src/main/index.ts`)
**Why it exists:** Provides native OS capabilities (file system access, window management, auto-updater) that a browser environment cannot offer. This is the security boundary — the renderer cannot touch the file system directly.

**Responsibilities:**
- Create and configure the `BrowserWindow` (fullscreen, min-size 1024×768, black background)
- Enforce single-instance lock (prevents save file conflicts)
- Serve IPC handlers for: `app:save-game`, `app:load-game`, `app:write-log`, `app:open-debug-console`, `app:check-for-updates`, `app:download-update`, `app:install-update`, `legal:read-file`
- Manage `userData/saves/` and `userData/logs/` directory creation
- Block browser shortcuts (F5, F12, Ctrl+R, Ctrl+W) to maintain immersion
- Disable GPU shader disk cache (stability fix for cache-permission errors)

### 2. Preload Bridge (`src/preload/index.ts`)
**Why it exists:** Electron's `contextIsolation: true` blocks renderer code from importing Node modules. The preload script runs before the page but with access to `ipcRenderer`, and exposes a sanitized `window.electronAPI` object via `contextBridge.exposeInMainWorld`. This is the **security firewall** between untrusted renderer code and the OS.

---

## State and Domain Systems Refactoring

The codebase utilizes a clean separation between **reactive data ownership** (the global `Game` store) and **stateless gameplay logic** (domain-specific systems).

```
 ┌───────────────────────────────────────────────┐
 │               SVELTE 5 UI                     │
 └──────┬────────────────────────────────────────┘
        │ Read state / dispatch actions
        ▼
 ┌───────────────────────────────────────────────┐
 │                 GAME STORE                    │
 │    (src/renderer/src/lib/stores/game.svelte)  │
 └──────┬────────────────────────────────────────┘
        │ Delegate calls (state passed as parameter)
        ▼
 ┌───────────────────────────────────────────────┐
 │               DOMAIN SYSTEMS                  │
 │    (src/renderer/src/lib/systems/*)           │
 └───────────────────────────────────────────────┘
```

### 1. Global Game State (`src/renderer/src/lib/stores/game.svelte.ts`)
**Why it exists:** A single source of truth for the entire game state. The state is purely raw serializable data (`CharacterData[]`, numbers, string lists). This keeps saving, loading, and hot reloading completely reliable.

**Pattern:** Module-level `createGame()` factory exported as the `Game` singleton. Exposes action functions that delegate execution logic to domain systems.

**Key fields:**
- **`roster`**: Array of plain `CharacterData` representations.
- **`tavern`**: Houses walk-in recruits list, summoning stone counts, gold/patron ledger statistics, and recruit intervals.
- **`economy`**: Unified tracker for `gold` and `renown`.
- **`resources`**: Inventory counts (timber, stone, herbs, seeds, iron).
- **`expeditions`**: List of active and completed forest patrols.
- **`world`**: Unlocked building tags, activity logs, and the **world clock** state.

### 2. Domain Systems (`src/renderer/src/lib/systems/`)
Systems contain implementation logic and operate directly on the reactive `GameStateData` state proxy. They do not store their own state.

- **Economy System (`economy.system.ts`)**: Controls financial transactions (`spendGold`, `gainGold`, `gainRenown`, `loseRenown`).
- **Resource System (`resource.system.ts`)**: Controls items stored in the warehouse (`addResource`, `consumeResource`).
- **Roster System (`roster.system.ts`)**: Manages the recruitment roster limits (`addCharacter`, `removeCharacter`).
- **World System (`world.system.ts`)**: Handles global events and logs (`addLog`).
- **Expedition System (`expedition.system.ts`)**: Ticks expedition remaining times and pushes logs upon completion (`startExpedition`, `resolveExpedition`, `returnExpedition`).
- **Tavern System (`tavern.system.ts`)**: Handles patron generation limits, name/trait creation, dismissals, summoning stone usages, and passive income ticks.
- **Time System (`time.system.ts`)**: Implements the unified world clock (`advanceTick`, `advanceHour`, `advanceDay`, `advanceWeek`, `advanceMonth`).

---

## Unified World Time Clock

All time-based simulation is driven by a single deterministic **world clock** state (`Game.state.world.time`) updated once per second by the `GameEngine` tick loop:

```
1 Engine Tick (1s real-time)
  → TimeSystem.advanceTick()
      → increments state.world.time.tick (0-59)
      → hour rollover (60 ticks) → advanceHour()
          → triggers Tavern income tick (+gold)
          → checks for Walk-in recruit wave arrival
          → day rollover (24 hours) → advanceDay()
              → week rollover (7 days)
              → month rollover (28 days) → advanceMonth()
                  → updates season dynamically (getSeason)
```

### Offline Catch-up
- Standalone timers and intervals are eliminated.
- On save-load, the difference between `Date.now()` and `meta.saveTimestamp` is converted to absolute seconds.
- The load process runs `timeSys.advanceMultipleTicks(state, elapsedSeconds)` to catch up the clock, simulate gold accumulated, and determine if new recruits are waiting at the door.

---

## Adventurer & Roster Serialization

- **No runtime instances in state**: State stores only `CharacterData[]`.
- **On-demand Deserialization**: In Svelte components (such as `Tavern.svelte` and `GameApp.svelte`), character data is instantiated into rich `Character` instances (containing derived stats, equipment multipliers, and traits) on-the-fly inside Svelte `$derived` runes:
  ```typescript
  const pendingRecruits = $derived(
    Game.state.tavern.pendingRecruits.map(r => ({
      ...r,
      character: Character.deserialize(r.character)
    }))
  )
  ```
- **Stat Pipeline**: Derived stats (`totalStr`, `maxHp`, `atk`, `spd`) are computed reactively in the `Attributes` class, wrapping base growth by level and equipment multipliers without manual recalculation.

---

## Identified Weak Spots & Refactoring Status
- **Dual Adventurer Model**: Resolved. The simplified mock object was removed. The entire game now runs on a single unified `CharacterData` representation.
- **State Fragmentation**: Resolved. The old `Tavern` singleton was deleted and merged directly into the Game store and `tavern.system.ts`.
- **Fragile Tick Loop**: Resolved. The engine loop ticks the `TimeSystem` first, driving all subsequent systems deterministically.
- **UI Architecture**: `GameApp.svelte` currently uses `{@html}` injection for some views; this remains a technical debt to be migrated to Svelte components.
- **Notification System**: Remains prop-drilled; still awaiting a dedicated global event-bus or Svelte context provider.
- **Settings Synchronization**: Settings continue to live across `localStorage` and `Game.state` concurrently.
