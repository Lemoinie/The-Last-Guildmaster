# BUILDINGS.md — The Last Guildmaster Buildings Design Bible

This document details the layout, upgrade costs, and building locks of the guild.

---

## 1. Building Infrastructure

### CURRENT
Buildings are unlocked when added to `Game.state.world.unlockedBuildings`. Initially, Tavern, Inn, and Storage are unlocked.

#### Active Buildings:
- **Tavern**: Recruiting patrons, walk-ins, ledger tracking.
- **Inn**: Manage the guild roster of heroes.
- **Storage**: Renders materials inventory.
- **Blacksmith**: Under construction forge stubs.
- **Expedition Board**: Displays forest patrol missions.

---

## 2. Upgrade Lifecycle

### PLANNED
- Building levels (e.g. Level 1 to 3).
- Level upgrades require materials (e.g. Upgrade Tavern Level 2: 50 Wood, 30 Stone).
- Upgrades increase maximum capacity settings (e.g. Inn Level 2 increases max roster limit from 10 to 15).

### FUTURE
- Real-time construction timers ticking off the world clock.

---

## 3. Ownership & Dependencies
- **Views Router**: [GameApp.svelte](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/components/GameApp.svelte) manages conditional mounting.
- **UI Components**: Rendered under Svelte component folder `src/renderer/src/components/views/`.
