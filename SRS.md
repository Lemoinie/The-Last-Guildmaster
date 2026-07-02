# Software Requirements Specification (SRS) — The Last Guildmaster

This document establishes the functional requirements, non-functional constraints, data schemas, system constraints, event logic, and progression rules for **The Last Guildmaster**.

---

## 1. Introduction

### 1.1 Scope & Definition
- **Game Name**: The Last Guildmaster
- **Genre**: Persistent Guild Management Roguelite RPG
- **Target Platform**: Desktop (Windows)
- **Target Audience**: Fans of strategy, resource management, and systems-driven roguelites.
- **High-Level Premise**: The player is the last remaining Guildmaster of a fallen realm. They must rebuild a ruined guildhall, recruit and train diverse adventurers, stockpile critical materials, manage a complex economy, deploy teams on dangerous expeditions, and coordinate defenses against escalating monthly demon raids until they defeat the Demon King.

---

## 2. Core Functional Requirements (FR)

### 2.1 Time System (FR-1.0)
- **FR-1.1**: The system shall track game time using a deterministic calendar consisting of Ticks, Hours, Days, Weeks, Months, and Years.
- **FR-1.2**: The engine shall calculate frame deltas in real-time, converting elapsed milliseconds into discrete tick counts to prevent speed inconsistency under thread lag or system suspension.
- **FR-1.3**: The system shall calculate offline progress sequentially upon loading a save file, simulating time steps step-by-step.
- **FR-1.4**: The system shall derive the current season dynamically at access time based on the active month.

### 2.2 Characters & Roster System (FR-2.0)
- **FR-2.1**: The system shall track characters across three distinct states: Active Roster, Reserve Roster, and Dead Roster.
- **FR-2.2**: The system shall generate walk-in recruits at the Tavern at intervals determined by the guild's Renown score.
- **FR-2.3**: The system shall allow players to dismiss active adventurers.
- **FR-2.4**: The system shall support instant recruit generation via the consumption of Crude, Refined, Arcane, and Legendary Summoning Stones.
- **FR-2.5**: The system shall update character level and experience, scaling primary attributes (STR, INT, DEX, CON) according to job-specific growth curves.
- **FR-2.6**: The system shall allow characters to equip items in defined slots (Weapon, Armor, Accessory), updating derived combat attributes.

### 2.3 Resource & Items System (FR-3.0)
- **FR-3.1**: The system shall maintain global stockpiles of construction materials (Wood, Stone, Iron) and alchemical supplies (Herbs, Seeds).
- **FR-3.2**: The system shall categorize all items under a strict 3-tier taxonomy: Category, Family, and Specific Item.
- **FR-3.3**: The system shall enforce item-specific stack size limits inside the Guild Storage.
- **FR-3.4**: The system shall calculate character carrying capacity based on Strength, enforcing movement speed and fatigue modifiers during transport.

### 2.4 Guild Buildings System (FR-4.0)
- **FR-4.1**: The system shall manage the unlock states and upgrades of individual structures (Tavern, Inn, Storage, Expedition Board, Market, Blacksmith, Garden, Alchemist, Church).
- **FR-4.2**: The system shall charge building-specific maintenance gold costs at monthly rollovers.

### 2.5 Expedition System (FR-5.0)
- **FR-5.1**: The system shall allow deploying parties of up to 4 characters to specific world zones.
- **FR-5.2**: The system shall track active expeditions, decreasing remaining duration on clock ticks.
- **FR-5.3**: The system shall calculate party weight encumbrance, applying soft penalties (increased durations, high fatigue rates, ambush probability scaling) if a party is overweight.
- **FR-5.4**: The system shall trigger random zone-specific encounters (combat skirmishes, resource node harvesting, environmental hazards, ambushes) based on elapsed ticks.

### 2.6 Combat System (FR-6.0)
- **FR-6.1**: The system shall resolve combat encounters in turn-based rounds using character Dexterity to determine action queue order.
- **FR-6.2**: The system shall calculate damage output using attacker attributes (STR for physical, INT for magical) offset by target defensive mitigation rates.
- **FR-6.3**: The system shall apply injuries, health depletion, and permanent character death when HP reaches zero.

### 2.7 Crafting System (FR-7.0)
- **FR-7.1**: The system shall support crafting recipes for weapons, armor, accessories, and consumables.
- **FR-7.2**: The system shall verify and consume raw material requirements from the Guild Storage when a craft action is triggered.

### 2.8 Farming & Garden System (FR-8.0)
- **FR-8.1**: The system shall allow planting seeds in garden slots.
- **FR-8.2**: The system shall track crop growth cycles on daily ticks, modifying crop yields based on current weather conditions.

### 2.9 World Events System (FR-9.0)
- **FR-9.1**: The system shall trigger random world events (famines, high trade demands, seasonal festivals, local ambushes) at day and week rollovers.
- **FR-9.2**: The system shall maintain an action log tracking economic transactions, recruitment updates, and expedition results.

### 2.10 Demon War & Raids System (FR-10.0)
- **FR-10.1**: The system shall schedule demon raids at the end of each game month.
- **FR-10.2**: The system shall scale raid strength dynamically based on active month and defeated Demon Generals.
- **FR-10.3**: The system shall allow assigning roster adventurers to guard defensive stations during a raid.

### 2.11 Endgame System (FR-11.0)
- **FR-11.1**: The system shall register the death of specific Demon Generals to advance the campaign threat.
- **FR-11.2**: The system shall trigger the final Demon King confrontation once all Demon Generals have been defeated.

---

## 3. Non-Functional Requirements (NFR)

- **NFR-1**: Save file compatibility must be maintained sequentially using deterministic migrations.
- **NFR-2**: All game state modifications must pass through a centralized store, banning direct state writes from components.
- **NFR-3**: Autosave serialization must complete within 500ms without blocking UI interactions.
- **NFR-4**: Game data (items, recipes, monster stats, character job stats) must be externalized in JSON registries to allow modding.
- **NFR-5**: Time simulation ticks must execute without UI frame drops.

---

## 4. Data Requirements (DR)

### 4.1 Character Schema (DR-1.0)
Each adventurer entity must record:
- Unique ID (UUID)
- Name & Job ID
- Roster State (Active, Reserve, Dead)
- Level & XP
- Attributes (STR, INT, DEX, CON)
- Equipped Gear IDs (Weapon, Armor, Accessory)
- Active Traits list
- Current HP & MP
- Active Injuries list

### 4.2 Storage Schema (DR-2.0)
The Guild Storage must record:
- Max Slots limit
- Array of Inventory Slots (Item ID and Quantity, or Null)

### 4.3 Time State Schema (DR-3.0)
The calendar time must record:
- Tick (0–59)
- Hour (0–23)
- Day (1–28)
- Week (1–4)
- Month (1–12)
- Year

---

## 5. System Constraints

- **SC-1**: Single save authority: Game state must reside entirely under a unified, serializable client store.
- **SC-2**: Dead characters cannot be returned to active duty, except through explicit, high-tier alchemical or divine resurrection items.
- **SC-3**: Active party carrying capacities limit maximum expedition loot collection during deployment.
- **SC-4**: Duplicate items, recipes, or character IDs within registries are prohibited.

---

## 6. Event Rules

- **EV-1**: Nighttime hours (20:00 to 05:59) increase expedition ambush probability by 20%.
- **EV-2**: The "Harvest Moon" event increases agricultural yields by 30%.
- **EV-3**: Mist weather decreases scouting efficiency, doubling ambush chance.
- **EV-4**: Demon scouts trigger logs and increase ambient threat levels 3 days before a raid.
- **EV-5**: Defeating a Demon General upgrades standard demon spawn rates to elite forces.

---

## 7. Progression Rules

- **PR-1**: Building upgrades require specific Guild Renown milestones and gold.
- **PR-2**: Raid Strength scales according to:
  $$\text{Raid Strength} = \text{Base Raid Value} \times (1.5^{\text{Month}-1}) \times (2.0^{\text{Generals Slain}})$$
- **PR-3**: Character XP caps scale according to:
  $$\text{XP Needed} = \lfloor 50 \times \text{level}^{1.8} \rfloor$$

---

## 8. Failure Conditions

- **FC-1**: The monthly demon raid breaches defenses and reduces Guildhall HP to zero.
- **FC-2**: The economy runs at a deficit for more than 7 consecutive game days.
- **FC-3**: Roster extinction: Roster count is zero with insufficient gold/renown to hire walk-in recruits.
