# EVENTS.md — The Last Guildmaster

> The game does **not** have a centralized event bus (no `EventEmitter`, no custom pub/sub). Communication happens through three channels: **Electron IPC**, **Svelte `$state` reactive mutations**, and **direct callback injection**.

---

## 1. Electron IPC Events (Main ↔ Renderer)

These are the only "true" events in the traditional sense. All go through the `preload.js` bridge.

### Renderer → Main (one-way, `ipcRenderer.send`)

| Channel | Sender | Receiver | Effect |
|---------|--------|----------|--------|
| `app:quit` | `MainMenu.svelte` (Exit btn), `window.electronAPI.quit()` | `ipcMain.on('app:quit')` | Calls `app.quit()` |
| `window:set-mode` | `SettingsModal.svelte` → `applySettings()` | `ipcMain.on('window:set-mode')` | `win.setFullScreen(true/false)` |
| `window:set-resolution` | `SettingsModal.svelte` → `applySettings()` | `ipcMain.on('window:set-resolution')` | `win.setSize(w,h)` + `win.center()` |

### Renderer → Main (bidirectional, `ipcRenderer.invoke`)

| Channel | Sender | Handler | Returns |
|---------|--------|---------|---------|
| `app:save-game` | `Game.save()` in `game.svelte.ts` | `ipcMain.handle('app:save-game')` | `{ success: boolean, error?: string }` |
| `app:load-game` | `Game.load()` in `game.svelte.ts` | `ipcMain.handle('app:load-game')` | Parsed JSON or `null` |
| `app:write-log` | `Logger` in `logger.ts` | `ipcMain.handle('app:write-log')` | `boolean` |
| `app:open-debug-console` | `MainMenu.svelte` on mount (if enabled) | `ipcMain.handle('app:open-debug-console')` | `boolean` (spawns PowerShell) |
| `app:check-for-updates` | `MainMenu.svelte` → `checkForUpdates()` | `ipcMain.handle('app:check-for-updates')` | Triggers `autoUpdater.checkForUpdates()` |
| `app:download-update` | `MainMenu.svelte` (Download btn in update UI) | `ipcMain.handle('app:download-update')` | Triggers `autoUpdater.downloadUpdate()` |
| `app:install-update` | `MainMenu.svelte` (Restart btn) | `ipcMain.handle('app:install-update')` | `autoUpdater.quitAndInstall()` |
| `legal:read-file` | `LegalOverlay.svelte` on mount | `ipcMain.handle('legal:read-file')` | File content string |

### Main → Renderer (one-way push, `webContents.send`)

| Channel | Emitter | Listener | Carries |
|---------|---------|----------|---------|
| `update:status` | `autoUpdater` events in main process | `MainMenu.svelte` → `ipcRenderer.on('update:status')` via `onUpdateStatus` | Status string: `'checking'`, `'available'`, `'latest'`, `'ready'`, `'error'`, `'dev'` |
| `update:progress` | `autoUpdater.on('download-progress')` in main | `MainMenu.svelte` → `ipcRenderer.on('update:progress')` via `onUpdateProgress` | `percent: number` |

> ⚠️ **Listener leak risk**: `ipcRenderer.on('update:status', ...)` and `ipcRenderer.on('update:progress', ...)` are registered via `onUpdateStatus` and `onUpdateProgress` in `preload.js` but **never removed** (no `ipcRenderer.removeListener` call). If `MainMenu` mounts and unmounts multiple times (e.g., player goes to game and back to menu), listeners accumulate and fire multiple times per event.

---

## 2. Svelte Reactive State Events (`$state` mutations)

These are not "events" in a traditional sense — they are **reactive data flows**. Any Svelte component reading from `Game.state` automatically updates when a field is mutated. The table below maps meaningful state mutations to their causes and effects.

### `Game.state` Mutations

| State Field | Mutated By | Component(s) That React |
|-------------|------------|--------------------------|
| `gold` | `Tavern.svelte.onMount` (offline catch-up), `Tavern.start` income callback, `GameApp.recruit()`, `DevBubble.applyReputation` | `GameApp.svelte` (top bar display) |
| `renown` | `DevBubble.applyReputation()` | `Tavern.svelte` (`$derived renown`), `GameApp.svelte` (top bar) |
| `adventurers[]` | `Tavern.svelte.handleAccept()`, `Tavern.svelte.handleSummon()`, `GameApp.recruit()`, `DevBubble.addRecruit()` | `GameApp.svelte` (adventurer count pill) |
| `inventory[key]` | `DevBubble.addItem()` | `GameApp.svelte` (Storage view, when rendered) |
| `devMode` | `SettingsModal.applySettings()` | `App.svelte` (`$derived devMode` controls DevBubble render) |
| `debugConsole` | `SettingsModal.applySettings()` | No component currently reacts to this directly |
| `autoSaveInterval` | `SettingsModal.applySettings()` | `Game.startAutoSaveTimer()` re-arms timer |
| `lastSave` | `Game.save()` | No current UI listener |
| `logs[]` | `GameEngine.log()` | No current UI listener |
| `expeditions[]` | `GameEngine.tick()` (status: active → completed) | No current UI listener |

### `Tavern` Internal State Mutations

| State | Mutated By | Effect |
|-------|------------|--------|
| `pendingRecruits[]` | `checkPassiveRecruits()`, `acceptRecruit()`, `dismissRecruit()`, `pruneExpiredRecruits()` | `Tavern.svelte` re-renders recruit grid and tab badge |
| `log[]` | `addLog()` (internal to all Tavern actions) | `Tavern.svelte` ledger tab re-renders |
| `totalGoldEarned` | `processIncomeTick()` | `Tavern.svelte` ledger summary |
| `totalPatronsServed` | `processIncomeTick()` | `Tavern.svelte` ledger summary |
| `summoningStones[grade].quantity` | `summon()`, `addStones()`, `SummoningStone.consume()` | `Tavern.svelte` stone card count + button state |
| `lastIncomeTick` | `processIncomeTick()` | Used for offline catch-up calculation |
| `lastPassiveRecruitAt` | `checkPassiveRecruits()` | Countdown timer display in `Tavern.svelte` |

---

## 3. Timer-Based Events

These fire on `setInterval` and act as the game's heartbeat.

| Timer | Owner | Interval | What It Does |
|-------|-------|----------|--------------|
| Engine tick | `GameEngine` (engine.ts) | 1 second | Decrements expedition timers, calls `finishExpedition()` |
| Tavern income | `Tavern` (tavern.svelte.ts) | 60 seconds | Calls `processIncomeTick()`, fires `onGoldEarned(gold)` callback |
| Tavern recruit check | `Tavern` (tavern.svelte.ts) | 5 minutes | Calls `pruneExpiredRecruits()`, calls `checkPassiveRecruits()`, fires `onRecruitsArrived(recruits)` if any |
| Auto-save | `Game` (game.svelte.ts) | Configurable (0, 5, 10, 30, 60 min) | Calls `Game.save()` |
| Countdown display | `Tavern.svelte` | 1 second | Updates `nextRecruitIn` string in the UI |
| Toast auto-dismiss | `App.svelte` | 2 seconds (one-shot) | Sets `toastVisible = false` |

---

## 4. UI Callback Events (Prop-Drilled)

Because there is no event bus, parent-child communication uses Svelte's `$props()` pattern with callback functions. These are effectively typed event handlers.

| Callback Prop | Defined In | Passed To | When Invoked |
|--------------|------------|-----------|-------------|
| `onplay` | `App.svelte` | `MainMenu.svelte` | Play button click |
| `onsettings` | `App.svelte` | `MainMenu.svelte` | Settings button click |
| `oncredits` | `App.svelte` | `MainMenu.svelte` | Credits button click |
| `onlegal` | `App.svelte` | `MainMenu.svelte` | Legal link click |
| `onclose` | `App.svelte` | `SettingsModal`, `CreditsModal`, `LegalOverlay` | Close/Cancel button |
| `onaccept` | `App.svelte` | `LegalOverlay` | Accept ToS button |
| `onbacktomenu` | `App.svelte` | `GameApp.svelte` | Return to menu button in sidebar |
| `showToast(msg)` | `App.svelte` | `GameApp`, `Tavern`, `SettingsModal`, `LegalOverlay`, `DevBubble` | Any user-facing notification |

---

## 5. Inferred / Missing Event Points

These interactions **should** emit events but currently do not, creating silent state changes that are difficult to trace:

| Missing Event | Current State | Recommended Fix |
|--------------|---------------|-----------------|
| **Save succeeded / failed** | `Game.save()` result is silent | Emit a toast on failure; optionally on success |
| **Expedition completed** | `Engine.finishExpedition()` only sets `status = 'completed'`; no loot, no notification | Emit a result event → award loot → show toast |
| **Level up** | `Character.levelUp()` has no notification | Emit to a character-level event or observable |
| **Recruit expired** | `Tavern.pruneExpiredRecruits()` logs internally but the UI doesn't notify | Trigger a toast when recruits are auto-dismissed |
| **Gold earned (income tick)** | Callback fires but only updates `Game.state.gold`; no per-tick UI feedback | Optional floating "+Xg" indicator |
| **Summoning stone acquired** | No mechanism yet to give stones from expeditions/market | Needs expedition reward system and market purchase system |
