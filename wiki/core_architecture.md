# Core Architecture & State Flow Wiki

This page explains the Electron and Svelte process design, state structures, and mutations flow of The Last Guildmaster.

---

## 1. Process Separation

The game uses a **two-process desktop architecture**:
- **Main Process (`src/main/`)**: Run in Node.js. Manages windows, binds native system event listeners, and executes authoritative file reads and writes (saves and logs).
- **Renderer Process (`src/renderer/`)**: Run in a Svelte 5 single-page application. Manages UI, layouts, and all gameplay mechanics. Direct Node.js access is prohibited for security.
- **Preload Bridge (`src/preload/`)**: Enforces communication via standard IPC pipelines (`window.electronAPI.saveGame` / `loadGame`).

---

## 2. Unified Game Store State

The entire state is centralized inside Svelte's reactive `$state` proxy inside [game.svelte.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/stores/game.svelte.ts).

### Structure overview:
- **`roster`**: Flat serializable `CharacterData[]` entries.
- **`tavern`**: Store parameters for income rates, walk-in timers, summoning stones counts, and pending recruits.
- **`economy`**: Gold and renown totals.
- **`resources`**: Stack quantities and the slot-based `storage` array.
- **`expeditions`**: List of deployed and completed missions.
- **`world`**: Building unlock flags, activity log, and unified calendar clock.
- **`settings`**: Client options.
- **`meta`**: Save version tags and Unix timestamps.

---

## 3. Stateless Domain Systems

State mutation actions are isolated in stateless TypeScript systems under `src/renderer/src/lib/systems/`:
- **`economy.system.ts`**: Coordinates gold balance updates and renown scaling.
- **`resource.system.ts`**: Updates raw item inventory quantities.
- **`roster.system.ts`**: Manages recruitment additions and roster retirements.
- **`world.system.ts`**: Injects ledger entries into the world log queue.
- **`expedition.system.ts`**: Handles deployment, ticking, and completion rewards.
- **`tavern.system.ts`**: Calculates gold ticks and waves.
- **`time.system.ts`**: Rollovers ticks, days, and months.
- **`storage.system.ts`**: Performs slot additions, stack merges, and splits.
