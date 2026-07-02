# HERO.md — The Last Guildmaster Character & Roster Design Bible

This document is the canonical source of truth for the character model, stat generation, level-up progression, and job/skills configuration.

---

## 1. Character State Model

### CURRENT
A character is represented in memory at runtime via the `Character` class and persisted in save files as a flat serializable `CharacterData` JSON record (Schema Version 1). State stores only data, not behavior.

#### Persistence Schema (`CharacterData`):
```typescript
export interface CharacterData {
  version: number
  id: string
  name: string
  level: number
  xp: number
  jobId: string
  traitId: TraitId | null
  attributes: {
    baseStr: number
    baseInt: number
    baseDex: number
    baseCon: number
  }
  equipment: {
    weaponId: string | null
    armorId: string | null
    accessoryId: string | null
  }
  skills: string[]
  professionSkills: string[] // future-safe placeholder
}
```

### PLANNED
- Character training schedules.
- Active combat party slot assignments.

### FUTURE
- Morale, wages, permanent injuries, death, retirement.

---

## 2. Stat Calculations & Formulas

### Level-up Progression
XP threshold formula to reach the next level:
$$\text{xpToNextLevel}(L) = \lfloor 50 \times L^{1.8} \rfloor$$

When a character levels up, each base attribute increases according to its job's growth rates:
$$\text{statGain}(L) = \lfloor \text{growthRate} \times L^{1.2} \rfloor$$

### Derived Attributes (Runtime)
Derived properties are calculated dynamically via Svelte 5 `$derived` expressions:
- **Max HP**: $\text{CON} \times 10$
- **Max MP**: $\text{INT} \times 5$
- **ATK**: $\text{STR} \times 2$
- **SPD**: $\text{DEX}$

---

## 3. Jobs & Growth Rates Registry

Jobs define the archetype and growth curve of characters.

| Job ID | Job Name | Icon | STR Growth | INT Growth | DEX Growth | CON Growth |
|--------|----------|------|------------|------------|------------|------------|
| `squire` | Squire | 🛡️ | 0.40 | 0.10 | 0.20 | 0.30 |
| `footman` | Footman | ⚔️ | 0.50 | 0.05 | 0.15 | 0.40 |
| `apprentice` | Apprentice| 🪄 | 0.05 | 0.60 | 0.15 | 0.20 |
| `archer` | Archer | 🏹 | 0.20 | 0.10 | 0.50 | 0.20 |

---

## 4. Skills Registry

Skills are mapped by static registry ID and unlocked by level requirements.

| Skill ID | Skill Name | Category | MP Cost | Power | Scaling | Target | Level Req |
|----------|------------|----------|---------|-------|---------|--------|-----------|
| `strike` | Heavy Strike | Physical | 5 | 1.5 | STR | single_enemy | 1 |
| `shield_bash` | Shield Bash | Physical | 8 | 1.0 | CON | single_enemy | 3 |
| `fireball` | Fireball | Magical | 10 | 2.0 | INT | single_enemy | 1 |
| `heal` | Lesser Heal | Magical | 12 | 1.5 | INT | single_ally | 2 |
| `steady_shot` | Steady Shot | Ranged | 6 | 1.4 | DEX | single_enemy | 1 |
| `rain_arrows` | Rain of Arrows | Ranged | 15 | 0.8 | DEX | all_enemies | 5 |
| `meditate` | Meditate | Magical | 0 | 0.0 | INT | self | 3 |

---

## 5. Inventory & Burden Rules

### CURRENT
Heroes have a personal inventory to hold gear and items.

#### Fields:
- `inventorySlots`: Number of items or stacks the hero can hold.
- `carryCapacity`: Maximum weight (in kg) the hero can transport before being overloaded.
- `currentWeight`: The sum weight of all equipped gear and personal inventory items.

#### Carry Capacity Formula:
$$\text{carryCapacity} = \text{STR} \times 5\text{ kg}$$

#### Encumbrance Thresholds:
The percentage of weight carried ($\frac{\text{currentWeight}}{\text{carryCapacity}}$) dictates the hero's speed and mobility:
- **0–60%**: Light load (no penalties)
- **60–85%**: Medium load
- **85–100%**: Heavy load
- **100%+**: Overloaded

---

## 6. Ownership & Dependencies
- **State Store**: [game.svelte.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/stores/game.svelte.ts) owns the `state.roster` list.
- **Roster System**: [roster.system.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/systems/roster.system.ts) executes additions and removals.
- **Tavern System**: [tavern.system.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/systems/tavern.system.ts) generates recruits utilizing the job growth and trait registries.
