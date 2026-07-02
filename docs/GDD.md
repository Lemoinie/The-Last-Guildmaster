# GDD.md — The Last Guildmaster Game Design Document

This document serves as the comprehensive Game Design Document (GDD) for **The Last Guildmaster**, summarizing all gameplay mechanics and organizing them into logical dependency layers.

```
┌────────────────────────────────────────────────────────┐
│               LAYER 5: MACRO LOOPS                     │
│       Demon Raids ── Threat Scaling ── Loss States     │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│            LAYER 4: RESOLUTION MECHANICS               │
│      Turn-Based Combat ── Injuries ── World Events     │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│             LAYER 3: ACTIVITY SYSTEMS                  │
│     Expeditions ── Crafting ── Gardening ── Tavern     │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│             LAYER 2: ENTITY STRUCTURES                 │
│      Adventurers & Jobs ── Stockpiles ── Buildings     │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│             LAYER 1: ATOMIC FOUNDATIONS                │
│    Game Time Clock ── Item Registries ── Attribute Math │
└────────────────────────────────────────────────────────┘
```

---

## 1. Vision & Core Philosophy
The Last Guildmaster focuses on tension, strategic trade-offs, and survival. Players manage resources under pressure, direct characters with mortal risk, and defend their guildhall against an encroaching demon invasion.

---

## 2. Layer 1: Atomic Foundations (Core Engine)

The bottom layer defines the environment and data types on which all subsequent systems rely.

### 2.1 Game Time Clock
- **Progression Rates**: 
  - 60 Ticks = 1 Hour
  - 24 Hours = 1 Day
  - 7 Days = 1 Week
  - 4 Weeks = 1 Month (28 Days)
  - 12 Months = 1 Year (336 Days)
- **Season Division**: Derived dynamically from month index: Months 1–3 (Spring), 4–6 (Summer), 7–9 (Autumn), 10–12 (Winter).
- **Execution Heartbeat**: Ticks are calculated via real-time deltas (`performance.now()`) to ensure execution consistency across frame-rate drops or system sleep states.

### 2.2 Item Taxonomy & registries
- **Three-Tier Taxonomy**: Category (e.g. `weapon`) $\rightarrow$ Family (e.g. `sword`) $\rightarrow$ Specific Item (e.g. `iron_sword`).
- **Data Properties**: ID, Name, Rarity (Common, Uncommon, Rare, Epic, Legendary), Stackable, Max Stack, Base Value, Durability, Weight (in kg), Stat Modifiers, and Tags.
- **Data-Driven Architecture**: Loaded dynamically from static JSON registry collections, validated on application boot.

### 2.3 Attributes & Core Math
- **Base Attributes**: Strength (STR), Intelligence (INT), Dexterity (DEX), Constitution (CON).
- **Derived Combat Stats**:
  - $\text{Max HP} = \text{CON} \times 10$
  - $\text{Max MP} = \text{INT} \times 5$
  - $\text{ATK} = \text{STR} \times 2$
  - $\text{SPD} = \text{DEX}$

### 2.4 PRNG & Seed Generation
- Deterministic random calculations (such as daily weather and event rolls) are resolved using a pseudo-random number generator (PRNG) seeded with the active day formula:
  $$\text{Seed} = (\text{Year} \times 336) + (\text{Month} \times 28) + \text{Day}$$

---

## 3. Layer 2: Entity Structures (Roster & Assets)

This layer introduces stateful gameplay entities that interact with Layer 1.

### 3.1 Adventurers & Jobs
- ** Roster States**: Adventurers exist in either the Active Roster, Reserve Roster (upkeep-free resting), or Dead Roster (crypt storage).
- **Experience Curves**: Level caps require exponential progression points:
  $$\text{XP Cap} = \lfloor 50 \times \text{level}^{1.8} \rfloor$$
- **Job Growth curves**: Squries, Footmen, Archers, and Apprentices apply class-specific decimal multipliers to base attribute increases on level rolls.

### 3.2 Equipment & Traits Modifiers
- **Gear Slots**: Adventurers carry up to three equipment pieces: Weapon, Armor, and Accessory.
- **Traits**: Permanent character perks/debuffs applying multiplier modifiers to the aggregate of base and gear stats:
  $$\text{Final Attribute} = \lfloor (\text{Base Stat} + \text{Equipped Gear Stat}) \times (1 + \text{Trait Modifier}) \rfloor$$

### 3.3 Guild Storage & Stockpiles
- **Guild Storage**: Enforces strict slot capacity constraints (`maxSlots: 20` base). Ignores item weight, grouping stackable items up to their max stack counts.
- **Global Stockpiles**: Tracks raw values for high-frequency materials (Wood, Stone, Iron, Herbs, Seeds).

### 3.4 Buildings
- Buildings (Tavern, Inn, Storage, etc.) carry unlock costs (Renown and Gold) and require monthly gold upkeep. Upgrades expand slot capacities, recruitment rates, or unlock crafting tiers.

---

## 4. Layer 3: Activity Systems (Active Interactions)

This layer governs interactions between resources, adventurers, and buildings over elapsed clock cycles.

### 4.1 Tavern & Recruitment
- **Patron Footcount**: Attracts patrons every hour based on Renown:
  $$\text{Patrons} = \min(50, 3 + \lfloor \ln(1 + \text{Renown}) \times 2.5 \rfloor)$$
- **Passive Income**: Each patron spends 2 gold per hour, recorded in the ledger logs.
- **Recruit Walk-ins**: Walk-in pools roll every $N$ hours (scaling down from 12 hours to 2 hours at 1000 Renown).
- **Summoning Stones**: Instantly pulls recruits from specific rarity brackets.

### 4.2 Gardening & Farming
- **Maturation Ticks**: Seeds planted in Garden slots grow on daily time rolls.
- **Environmental Modifiers**: Drought or heatwave weather rolls reduce harvest yields, while rainy conditions accelerate maturation speeds.

### 4.3 Blacksmith Crafting
- **Blueprints**: Requires specific Guild Renown ranks to learn.
- **Crafting Resolution**: Consumes raw resources from the Guild Storage to fabricate weapons, armor, accessories, or consumables.

### 4.4 Deployed Expeditions
- **Party Composition**: Up to 4 active roster characters deployed to specific map regions.
- **Travel Weight Burden**: Calculates total weight of equipped gear and collected loot:
  - If $\text{Total Weight} > \sum \text{Character Carry Capacity}$: The party is encumbered, applying scaling multipliers that increase patrol duration, fatigue rates, and ambush probability.

---

## 5. Layer 4: Resolution Mechanics (Tension & Combat)

This layer resolves active hazards, combat encounters, and environmental rolls triggered during activities.

### 5.1 Tactical Combat
- **Turn Queue**: Turn order is calculated dynamically based on character and enemy Dexterity (SPD).
- **Damage Calculations**:
  - **Physical Damage**: ATK (STR-scaled) modified by gear multipliers, mitigated by target Armor ratings.
  - **Magical Damage**: Scaling base spell power (INT-scaled) mitigated by target Magical Resistance ratings.

### 5.2 Injuries & Death
- **HP Zero Trigger**: If a character's health hits zero in combat:
  - **Survival Check**: Rolls a CON-based survival rate.
  - **Outcome**: The character either dies permanently (transferring to the Dead Roster) or gains a severe trait injury (e.g. *Scarred*, *Maimed*).

### 5.3 Daily & Weekly Events
- Daily rollovers update global weather states.
- Weekly rollovers trigger random economic events (e.g. market shortages, merchant visits, high resource demands).

---

## 6. Layer 5: Macro Loops (The Endgame)

The top layer coordinates the campaign's ultimate challenge, tension, and victory/defeat boundaries.

### 6.1 Demon War & Threat Progression
- **Threat Level**: The ambient threat score increments with elapsed weeks and active expeditions.
- **Monthly Demon Raids**: At the final hour of each month, demon forces strike the guildhall directly.
- **Defensive Assignments**: Players must assign roster characters to fortifications. Roster stats determine combat defense scores.

### 6.2 Threat & Strength Equation
Raid challenge ratings scale exponentially over time and are modified by campaign progression:
$$\text{Raid Strength} = \text{Base Value} \times (1.5^{\text{Month}-1}) \times (2.0^{\text{Generals Slain}})$$

### 6.3 Campaign Victory & Milestones
- **Demon Generals**: Defeating regional bosses advances story progression, unlocking access to the Demon King's Citadel.
- **Citadel Confrontation**: Defeating the Demon King wins the campaign.

### 6.4 Failure Conditions
The game triggers a Game Over state if:
- **Guildhall Destruction**: A monthly raid breaches defensive lines and reduces Guildhall HP to zero.
- **Deficit Deflation**: Gold reserves remain below zero for more than 7 consecutive game days.
- **Roster Extinction**: Roster size hits zero with no remaining Gold or Renown to recruit new adventurers.
