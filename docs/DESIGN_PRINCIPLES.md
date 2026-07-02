# DESIGN_PRINCIPLES.md — The Last Guildmaster Design Principles

This document is the canonical source of truth for the core philosophy, vision, player fantasy, and design boundaries of The Last Guildmaster.

---

## 1. What Makes This Game Unique

- **State Separation & System Purity**: Gameplay state is represented as flat, clean serializable data structures (`CharacterData[]`). Systems do not hold state—they are stateless operational pipelines. This enforces reliable saves and transparent offline calculations.
- **Unified World-Time Heartbeat**: Standalone intervals are banned. Time moves deterministically on a single shared world clock advanced by the engine loop. Active play and offline catch-ups share the exact same code execution paths.
- **On-Demand Derived Hydration**: Rich object behaviors (stat multipliers, equipment bonuses, level-ups) are computed reactively at the UI boundary using `$derived` runes, rather than poll-mutating raw state properties.

---

## 2. What Should Never Be Compromised

- **Save File Integrity & Backwards Compatibility**: Save formats must follow integer schemas. Loading older versions must pass through deterministic migration layers (`migrations.ts`) before hydration. Code changes should never break historical saves.
- **Determinism of Progression**: Timing-based calculations (patron visits, gold income, recruit arrivals) must run predictably off the world clock ticks, avoiding erratic variations caused by browser throttling or CPU ticks.
- **Fine-Grained UI Reactivity**: Layout elements bind directly to Svelte 5 runes (`$state` / `$derived`), bypassing DOM query selectors or string injection hacks (`{@html}`).

---

## 3. The Player Fantasy

The player is **The Guildmaster**—not a front-line hero. The core fantasy focuses on:
- **Management & Logistics**: Assigning correct recruits, managing storage resources, upgrading town structures, and choosing when to deploy squads.
- **Roster Attachment**: Watching squires level up into legendary archers or footmen, learning unique skills, and accumulating traits.
- **Tavern Hospitality**: Ensuring the local Rusty Goblet stays busy, welcoming walk-ins, and using summoning stones to draw powerful allies.

---

## 4. What Systems Should Prioritize

- **Stateless Operations**: Systems should take the mutable `GameStateData` state proxy as an input and perform changes in-place.
- **Strict Separation of Concerns**: Roster actions reside in `roster.system`, gold inside `economy.system`, and logs inside `world.system`.
- **Offline catch-up integrity**: Any time-based progress must calculate exactly how many clock ticks have passed offline and advance the game clock, keeping active play and offline gains 100% identical.

---

## 5. What Systems Should Avoid

- **Direct In-State Mutations by UI**: Components should never write directly to store properties (`Game.state.economy.gold = x`). They must dispatch explicit actions (`Game.gainGold(x)`).
- **Inline Class Constructors in Stores**: The store must never save active instances of classes (`new Character()`). Stores contain data; classes are instantiated only on-demand at runtime.
- **Duplicate Clock Timers**: No component or sub-system should run its own `setInterval` loops for progression. Everything ticks off the unified world time system.

---

## 6. Failure Must Create Stories

Losses are not dead ends.
Failed expeditions, injuries, deaths, and shortages should create meaningful recovery arcs.

Failure should:
- alter guild history
- affect future decisions
- generate memorable narratives

Failure should not:
- feel random
- hardlock progression
- erase strategic options

---

## 7. Economy Must Create Pressure

Gold, food, materials, and upkeep must force prioritization.

A healthy economy should create:
- tradeoffs
- delayed gratification
- opportunity cost

The player should never be able to sustain infinite growth without strategic decisions.

---

## 8. Data-Driven Content vs. Code-Driven Behavior

Game design must separate static game data definitions from dynamic systems logic to enable expansion scalability, easy balancing tweaks, and future modding capabilities.

> 💡 **Core Rule**: Data defines "what exists". Code defines "how it behaves".

### Game Content (Data-Driven - JSON representation)
Static content must live in external JSON structures (or static registry declarations acting as JSON representations). This allows mod loaders to merge core data files with custom mod files (e.g. `mods/my-custom-pack/items.json`).

**YES (Must be Data/JSON structures):**
- **Items**: Item names, categories, rarity levels, base values, and weights.
- **Recipes**: Crafting cost materials and output mappings.
- **Traits**: Roster talent modifiers and description keys.
- **Enemy Archetypes**: Combat opponent base stats, types, and skills.
- **Expeditions & Loot Tables**: Mission timers, rewards weight ratios.
- **World Events & Dialogue Pools**: Dialogue strings and event requirements.
- **Building Definitions**: Building names, cost metrics, and unlocked building limits.

### Game Systems (Code-Driven - TypeScript code)
Dynamic mechanics, progression math, and state mutation laws must remain code-driven, isolated within system files.

**NO (Must remain System Code):**
- **Game Store**: Central reactive state handling.
- **Time System**: Unified clock ticking and season rollover limits.
- **Economy System**: Renown scaling equations and passive gold distributions.
- **Combat Resolution**: Turn orders and damage resolution algorithms.
- **Tavern System**: Generation mechanics, walk-in timers, and stones resolution.
- **Save Migrations**: Iterative version update functions.
- **Inventory Algorithms**: Stacking and capacity management methods.