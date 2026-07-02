# ROADMAP.md — The Last Guildmaster

> Inferred from the current codebase structure. This is not an official plan — it identifies what appears **unfinished, stubbed, or implied** by the existing code and data models.

---

## Current State Summary

The project is a functional **tech demo / vertical slice** with:
- ✅ Full Electron shell with save/load/IPC/auto-updater
- ✅ Reactive Svelte 5 architecture with game state
- ✅ Complete Tavern building (passive income, passive recruitment, active summoning)
- ✅ Full Character/Attributes/Job/Trait/Skill/Item class hierarchy (data models only)
- ✅ Developer tools (DevBubble)
- ✅ Settings, legal, credits screens
- ⚠️ All other buildings are **placeholder stubs** (HTML strings in `GameApp.svelte`)
- ❌ No working combat system
- ❌ No working economy/market
- ❌ No working crafting
- ❌ No full character roster management (Inn view is a stub)
- ❌ Rich character data not saved

---

## Priority 1 — Critical Fixes (Foundation)

These should be addressed before building new features, as they affect data integrity and the core gameplay loop.

### 1.1 Fix Save System — Integrate Tavern State
**Problem:** `Tavern.serialize()` / `Tavern.deserialize()` exist but are never called.
**Fix:** Update `Game.save()` and `Game.load()` to call these, and add a `tavern` sub-object to the save format. Also save summoning stone quantities.

### 1.2 Fix Save System — Replace Simplified Adventurer with `CharacterData`
**Problem:** Accepting a recruit discards all rich character data (skills, traits, equipment, XP).
**Fix:** Replace `Game.state.adventurers: Adventurer[]` with `Game.state.roster: CharacterData[]`. Use `Character.serialize()` / `Character.deserialize()`. The `Adventurer` interface in `game.svelte.ts` is superseded by `CharacterData` in `types.ts`.

### 1.3 Add Save Versioning + Validation
**Problem:** No schema version field; loading old saves is fragile.
**Fix:** Add `"version": 1` to save format. Implement a migration function that upgrades older saves to the current schema.

### 1.4 Fix IPC Listener Leak in MainMenu
**Problem:** `ipcRenderer.on('update:status', ...)` listeners accumulate if MainMenu mounts multiple times.
**Fix:** Add `ipcRenderer.removeAllListeners` on component destroy, or switch to `ipcRenderer.once`.

### 1.5 Save on Exit
**Problem:** There is no `save()` call when the game exits.
**Fix:** Add an `'app:before-quit'` IPC handler, or save in `GameApp.svelte.onDestroy()`. Ensure the save completes before the window closes.

### 1.6 Remove Legacy Files
**Problem:** Root `css/`, `js/`, `index.html`, `preload.js` are not used by the build but add confusion.
**Fix:** Delete or move to a `legacy/` archive folder.

---

## Priority 2 — Near-Term (Core Gameplay)

### 2.1 Inn View — Full Roster Management
**What's implied:** The `Inn` is listed in `navButtons` and `unlockedBuildings`. The `AdventurerCard.svelte` component exists but is not used anywhere in the current game.
**What's needed:**
- Replace the stub Inn HTML in `GameApp.svelte` with a dedicated `Inn.svelte` component
- Display a scrollable grid of `AdventurerCard` components for each character in the roster
- Implement character detail view (expand a card to see full stats/skills)
- Implement "Dismiss" (remove from roster, possibly for gold refund)

### 2.2 Convert `GameApp.svelte` Building Views to Components
**What's implied:** All non-Tavern building content is rendered as `{@html viewHtml}` with `setTimeout`-patched event listeners. This architecture breaks Svelte reactivity.
**What's needed:**
- Extract each building view into its own `.svelte` component (Storage, Expedition, Market, Blacksmith, Garden, Alchemist, Church)
- Replace `{@html viewHtml}` with conditional component rendering using `{#if currentView === 'storage'}<Storage />{/if}`

### 2.3 Storage View
**What's implied:** `Game.state.inventory` has `{wood, stone, herbs, seeds, iron}`. The UI stub shows item cards.
**What's needed:**
- A `Storage.svelte` component that reactively displays inventory quantities
- Visual indicators (icons from `MATERIALS` registry) for each resource type
- Capacity limits (future: building upgrades expand capacity)

### 2.4 Expedition System — Full Implementation
**What's implied:** `Game.state.expeditions[]` and `Engine.tick()` partially process expeditions. The `GameApp.svelte` expedition view hardcodes two missions with "Deploy" buttons that do nothing.
**What's needed:**
- Expedition assignment UI: pick an adventurer + pick a mission
- Reward calculation system when expedition completes (loot from inventory items)
- Expedition history log
- Multiple simultaneous expeditions
- Adventurer "busy" state (can't send same adventurer twice)

---

## Priority 3 — Medium-Term (Building Systems)

### 3.1 Market
**What's implied:** `navButtons` includes `{ id: 'market', icon: '🏪', label: 'Market' }`. Tavern hints mention "Summoning Stones can be purchased at the Market."
**What's needed:**
- Buy/sell interface for resources and items
- Pricing based on supply/demand or static tables
- Summoning stone purchases (gold → stones)
- Renown-gated stock (rare items only at high renown)

### 3.2 Blacksmith
**What's implied:** `WEAPONS`, `ARMORS`, `ACCESSORIES` registries exist in `items.svelte.ts`. The stub Blacksmith view shows an "Iron Sword" forge with a requirements list (5 Iron, 2 Wood).
**What's needed:**
- Crafting recipes tied to resource inventory
- Crafted items go to an equipment pool
- Equipment pool managed in `Game.state.equipment` (currently `any[]`)

### 3.3 Alchemist
**What's implied:** Exists as a building. Tavern hints mention "Summoning Stones can be crafted at the Alchemist." `CONSUMABLES` registry exists.
**What's needed:**
- Herb/material → potion conversion
- Stone crafting recipes (e.g., herbs + iron → crude stone)
- Potion inventory management

### 3.4 Garden
**What's implied:** `Engine.tick()` has a `// TODO: Garden logic` comment. `Game.state.inventory.seeds` exists but is always 0 initially.
**What's needed:**
- Plant seeds → grow over time (using engine ticks)
- Harvest herbs/food items
- Resource chain: seeds → herbs → potions (Alchemist)

### 3.5 Church
**What's implied:** Exists as a building with the background image `church_bg.png`.
**What's needed:** (speculative)
- Character healing between expeditions
- Blessing buffs (temporary stat bonuses)
- Adventurer resurrection or morale system

---

## Priority 4 — Long-Term (Game Loop Completion)

### 4.1 Combat System
**What's implied:** `Skill` has `mpCost`, `power`, `scaling`, `target` (single enemy / all enemies / ally). `Attributes` has `maxHp`, `maxMp`, `physAtk`, `magAtk`, `speed`. The entire combat model is defined but no combat implementation exists.
**What's needed:**
- Turn-based combat engine (adventurers vs. enemies)
- Enemy definitions (stats, skills, loot tables)
- Combat resolution flow (expedition combat as instanced battle)
- HP/MP tracking during combat (currently only max values exist)
- Status effects (`buff_stat`, `cure_status` from `ConsumableEffect`)

### 4.2 Equipment Management
**What's implied:** `Character` has `weapon`, `armor`, `accessory` slots. `equipWeapon()`, `equipArmor()`, `equipAccessory()` methods exist. `Game.state.equipment: any[]` is a placeholder.
**What's needed:**
- An equipment pool/vault (items owned by the guild)
- UI to equip/unequip items from character slots
- Crafted items from Blacksmith flowing into the vault
- Loot from expeditions flowing into the vault

### 4.3 Renown Progression System
**What's implied:** `renown` drives tavern income and recruit quality. No system currently increases renown.
**What's needed:**
- Expedition completion → renown reward
- Guild level milestones unlocking new buildings
- Renown decay (optional) for challenge

### 4.4 Building Upgrade System
**What's implied:** `unlockedBuildings: string[]` suggests buildings can be locked/unlocked. No upgrade system exists.
**What's needed:**
- Resource cost to unlock new buildings (Church, Market, etc.)
- Upgrade tiers for existing buildings (Tavern tier 2 = more patrons, etc.)
- Persistent building state in save

### 4.5 Multiple Save Slots
**What's needed:**
- Rename saves to `savegame_1.json`, `savegame_2.json`, etc.
- Save slot selection UI in Main Menu
- Slot deletion

### 4.6 Audio System
**What's implied:** `SettingsModal` has volume/music/fx sliders but the values are stored in localStorage and never connected to any audio API.
**What's needed:**
- Web Audio API or Howler.js integration
- Background music per building
- Sound effects for actions (recruit, summon, expedition)
- Respect the volume slider values from settings

### 4.7 Router / Navigation System
**What's implied:** `currentScreen: 'menu' | 'game'` is a two-value toggle. As more screens are added (character detail, crafting, combat), a proper router is needed.
**What's needed:**
- A lightweight client-side router (or state machine) for screen navigation
- Back-button support within buildings
- Navigation history (breadcrumbs)

---

## Technical Debt Summary

| Item | Priority |
|------|----------|
| `{@html viewHtml}` for building views | 🔴 Replace ASAP |
| Tavern state not saved | 🔴 Fix before any further tavern development |
| Dual adventurer model | 🔴 Resolve before implementing Inn or combat |
| `Game.state.equipment: any[]` | 🟡 Needs a type and implementation |
| No event bus / router | 🟡 Manageable now, will become critical at 5+ screens |
| IPC listener leak (update status) | 🟡 Minor UX bug |
| Log file unbounded growth | 🟢 Add rotation |
| Legacy root files | 🟢 Cleanup |
