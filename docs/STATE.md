# STATE.md — The Last Guildmaster

---

## State Architecture Overview

There are **three separate reactive state containers** in the game, each with different scopes and persistence characteristics:

| Container | File | Scope | Persisted? |
|-----------|------|-------|------------|
| `Game` store | `lib/stores/game.svelte.ts` | Global singleton | ✅ Yes (file + localStorage) |
| `Tavern` store | `lib/game/tavern.svelte.ts` | Game session singleton | ⚠️ Partially (via serialization API) |
| Component-local `$state` | Various `.svelte` files | Component lifetime | ❌ No |

There is also a fourth, **implicit** state layer in `localStorage` for settings values that are **separate from game state**.

---

## 1. Global Game State (`Game.state`)

**Type:** `GameStateData` — defined in `game.svelte.ts`

### Full Structure

```typescript
interface GameStateData {
  // --- Economy ---
  gold: number                    // Player's current gold
  renown: number                  // Guild reputation score (drives tavern scaling)

  // --- Adventurers (simplified) ---
  adventurers: Adventurer[]       // [{name, class, level, id}] — SIMPLIFIED format
  maxAdventurers: number          // Roster cap (default: 10)

  // --- Resources ---
  inventory: {
    wood: number
    stone: number
    herbs: number
    seeds: number
    iron: number
  }
  equipment: any[]                // Currently unused — placeholder for future item system

  // --- Expeditions ---
  expeditions: Expedition[]       // [{id, name, status:'active'|'completed', remainingTime}]
  unlockedBuildings: string[]     // IDs of buildings accessible in sidebar

  // --- Meta / Logging ---
  logs: string[]                  // In-game log messages (max 50, FIFO)
  lastSave: number                // Unix timestamp of last successful save

  // --- System Settings (persisted in save) ---
  debugConsole: boolean           // Whether to auto-open debug console
  devMode: boolean                // Whether to show DevBubble in-game
  autoSaveInterval: number        // Minutes between auto-saves (0 = disabled)
}
```

### Initial Values

```typescript
const initialState = {
  gold: 1000,
  renown: 0,
  adventurers: [],
  maxAdventurers: 10,
  inventory: { wood: 10, stone: 10, herbs: 5, seeds: 0, iron: 2 },
  equipment: [],
  expeditions: [],
  unlockedBuildings: ['tavern', 'inn', 'storage'],
  logs: ['Welcome, Guildmaster. Your journey begins.'],
  lastSave: Date.now(),
  debugConsole: false,
  devMode: false,
  autoSaveInterval: 30
}
```

---

## 2. Tavern State (`Tavern`)

**Lives in:** `lib/game/tavern.svelte.ts` (module-level `$state` variables)

### Structure

```typescript
// --- Timekeeping (used for offline catch-up) ---
lastIncomeTick: number           // Timestamp of last income tick processed
lastPassiveRecruitAt: number     // Timestamp of last passive recruit wave
passiveRecruitIntervalMs: number // Dynamic interval (shrinks with renown)

// --- Lifetime Statistics ---
totalGoldEarned: number
totalPatronsServed: number

// --- Active State ---
pendingRecruits: PendingRecruit[]  // Adventurers waiting in tavern to be accepted/dismissed
log: TavernLogEntry[]              // Activity feed (max 50, newest first)

// --- Summoning Stones ---
summoningStones: Record<StoneGrade, SummoningStone>  // {crude, refined, arcane, legendary}

// --- Derived (not stored) ---
passiveRecruitsReady: boolean     // $derived from timestamps
totalStones: number               // $derived sum of all stone quantities
```

### Tavern Serialization Schema (`TavernSaveData`)

The Tavern exposes `serialize()` and `deserialize(data)` methods, but **these are NOT currently called by `Game.save()` or `Game.load()`**. The Tavern state is currently **lost on reload** except for what's incidentally captured in `Game.state`.

```typescript
interface TavernSaveData {
  lastIncomeTick: number
  lastPassiveRecruitAt: number
  passiveRecruitIntervalMs: number
  totalGoldEarned: number
  totalPatronsServed: number
  pendingRecruits: {        // Serialized as minimal data (no full Character object)
    id: string
    name: string
    jobId: string
    traitId: TraitId | null
    rarity: AdventurerRarity
    expiresAt: number
  }[]
}
```

> ⚠️ **Critical gap**: Summoning stone inventory (`summoningStones`) is **also not included** in `TavernSaveData`. Stones are reset to defaults (crude:3, refined:1, arcane:0, legendary:0) on every reload.

---

## 3. Character State (`Character` class)

**Lives in:** `lib/adventurer/character.svelte.ts`

This is the **rich entity** model used at runtime by the Tavern to generate recruits. It is **not persisted in the save file**.

### Runtime Structure

```typescript
class Character {
  // Identity (immutable after creation)
  readonly id: string              // crypto.randomUUID()
  name: $state<string>

  // Progression (mutable)
  level: $state<number>
  xp: $state<number>

  // Composition references
  attributes: Attributes           // Reactive stat block
  _jobId: $state<string>
  _traitId: $state<TraitId | null>
  _skillIds: $state<string[]>

  // Equipment slots
  weapon: $state<Weapon | null>
  armor: $state<Armor | null>
  accessory: $state<Accessory | null>

  // Derived (auto-computed)
  job: $derived<Job>               // Looks up JOBS[jobId]
  xpNeeded: $derived<number>       // 50 * level^1.8
  xpPercent: $derived<number>      // 0–100
  skills: $derived<Skill[]>        // Maps _skillIds → SKILLS registry
}
```

### The Dual Adventurer Model Problem

The `Game.state.adventurers` array stores **a different, simplified type**:

```typescript
interface Adventurer {   // in game.svelte.ts
  name: string
  class: string          // jobId string, not a Job object
  level: number
  id: number             // Date.now() — not the Character's UUID!
}
```

When a `Character` is accepted from the tavern, it is **downgraded**:
```typescript
// In Tavern.svelte handleAccept():
Game.state.adventurers.push({
  name: char.name,
  class: char.jobId,   // drops job object
  level: char.level,   // drops XP, attributes, traits, skills, equipment
  id: Date.now()       // new ID, different from char.id!
})
```

This means **skills, traits, equipment, attributes, XP progress** are all discarded when an adventurer joins the guild. The rich `Character` object exists only in `Tavern.pendingRecruits` while the adventurer is waiting.

---

## 4. Settings State (`localStorage`)

Settings are stored separately from game state in `localStorage` using `tlg_*` keys. These are **not versioned, not migrated, not validated**.

| Key | Type | Default | Used By |
|-----|------|---------|---------|
| `tlg_volume_master` | string (int 0–100) | `'80'` | SettingsModal |
| `tlg_volume_music` | string (int 0–100) | `'60'` | SettingsModal |
| `tlg_volume_fx` | string (int 0–100) | `'70'` | SettingsModal |
| `tlg_window_mode` | `'fullscreen'` \| `'windowed'` | `'fullscreen'` | SettingsModal |
| `tlg_resolution` | `'WxH'` string | `'1920x1080'` | SettingsModal |
| `tlg_autosave_interval` | string (int) | `'30'` | SettingsModal |
| `tlg_crash_log` | `'0'` \| `'1'` | `'0'` | SettingsModal |
| `tlg_debug_console` | `'0'` \| `'1'` | `'0'` | SettingsModal, MainMenu |
| `tlg_dev_mode` | `'0'` \| `'1'` | `'0'` | SettingsModal |
| `tlg_tos_accepted_v1` | `'0'` \| `'1'` | — | App.svelte, LegalOverlay |
| `the_last_guildmaster_save` | JSON string | — | Game store (fallback persistence) |

> ⚠️ **Overlap**: `debugConsole`, `devMode`, and `autoSaveInterval` exist in **both** `Game.state` (saved to file) and `localStorage` (as `tlg_*` keys). `SettingsModal.applySettings()` writes both, but on load only `Game.state` values are restored from the save file; localStorage values are only read by `SettingsModal` for its local UI state.

---

## 5. Component-Local State

These are ephemeral — they reset every time the component mounts.

| Component | Local State |
|-----------|------------|
| `App.svelte` | `currentScreen`, `showLegal`, `showSettings`, `showCredits`, `toastMessage`, `toastVisible` |
| `GameApp.svelte` | `showSettings`, `currentView`, `viewHtml` |
| `Tavern.svelte` | `activeTab`, `nextRecruitIn`, `countdownInterval` |
| `SettingsModal.svelte` | `activeTab`, `volume`, `music`, `fx`, `crashLog`, `debugConsole`, `devMode`, `windowMode`, `resolution`, `autoSaveInterval` |
| `DevBubble.svelte` | `open`, `bubbleX`, `bubbleY`, drag state, form field values |
| `LegalOverlay.svelte` | `activeTab`, `agreed`, `panelContents` |
| `MainMenu.svelte` | `updateStatusClass`, `updateStatusHtml` |

---

## 6. State Persistence Classification

### Persisted (both Electron file + localStorage fallback)
- `gold`, `renown`
- `adventurers[]` (simplified format)
- `maxAdventurers`
- `inventory` (resource quantities)
- `equipment[]` (empty/unused)
- `expeditions[]` (active/completed status + remainingTime)
- `unlockedBuildings[]`
- `logs[]` (last 50 entries)
- `lastSave`
- `debugConsole`, `devMode`, `autoSaveInterval`

### NOT Persisted (runtime only)
- Full `Character` objects (skills, traits, equipment, attributes, XP curve)
- `Tavern.pendingRecruits[]` (pending adventurers in the tavern)
- `Tavern.summoningStones` (stone inventory — **resets to defaults each session**)
- `Tavern.log[]` (activity feed)
- `Tavern.totalGoldEarned`, `Tavern.totalPatronsServed`
- `Tavern.lastIncomeTick`, `Tavern.lastPassiveRecruitAt` (critical for offline catch-up — **not saved**)
- Engine tick state (no persistent tick counter)

---

## 7. State Mutation Flow

### Correct mutation path (Svelte 5 Runes):
```
Component reads Game.state.gold
    ↓
User clicks "Recruit" → GameApp.recruit()
    ↓
Game.state.gold -= 100   ← direct mutation on $state proxy
    ↓
Svelte fine-grained reactivity fires
    ↓
All {Game.state.gold} bindings in templates re-render
```

### Problematic mutations (bypass Svelte):
- `GameApp.svelte` calls `renderView()` manually after mutations, updating `viewHtml` with innerHTML strings
- `Engine.tick()` mutates `expedition.status` directly on the object inside the array — this works because `$state` creates deep reactive proxies in Svelte 5, but it's unclear and fragile

---

## 8. Identified Risks

| Risk | Severity | Description |
|------|----------|-------------|
| **Tavern state not saved** | 🔴 High | `Tavern.lastIncomeTick`, `pendingRecruits`, summoning stones are all lost on reload. Offline catch-up won't work correctly without `lastIncomeTick` being saved. |
| **Dual Adventurer model** | 🔴 High | The rich `Character` object is discarded when joining the guild. The game fundamentally cannot implement equipment or skill systems with current roster storage. |
| **Equipment[] is `any[]`** | 🟡 Medium | `Game.state.equipment` is typed as `any[]`, completely untyped. No item instance management exists. |
| **IDs are inconsistent** | 🟡 Medium | Tavern uses `crypto.randomUUID()` for recruits and characters. GameApp uses `Date.now()`. The saved Adventurer `id` is a `number`, while `Character.id` is a `string`. |
| **Settings/Game state overlap** | 🟡 Medium | `devMode` etc. stored in two places. On load, only the file version is authoritative, but localStorage might show stale values. |
| **No save schema versioning** | 🟡 Medium | If fields are added/removed, loading old saves will silently fail or use `undefined` values (mitigated by `{ ...initialState, ...saved }` spread but not robust). |
| **`Game.state.logs[]` unused** | 🟢 Low | `GameEngine.log()` pushes to `state.logs`, but no UI component displays this array. |
| **Uncontrolled `Game.state` access** | 🟢 Low | Any component can directly mutate any field. No encapsulation or access control. Scales poorly as the game grows. |
