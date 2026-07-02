# COMBAT.md — The Last Guildmaster Combat Design Bible

This document details the combat mechanics, stat resolutions, turn order formulas, and battle grids.

---

## 1. Combat Mechanics

### CURRENT
- No active combat screens exist.
- Pre-calculated derived combat stats (Max HP, Max MP, ATK, SPD) are stored on the `Attributes` and `Character` class models.

---

## 2. Stat Resolution & Turn Order

### PLANNED
- Turn-based combat where characters face off against enemies.
- **Turn Order**: Determined by sorting combat participants by `SPD` stat descending.
- **Action Execution**: A participant casts a skill from their equipped skills deck.
- **Damage Resolution Formula (Physical Strike)**:
  $$\text{Damage} = \max(1, \lfloor \text{ATK} \times \text{SkillPower} - \text{EnemyDEF} \rfloor)$$

### FUTURE
- Status effects (Stun, Burn, Bleed, Poison).
- Tactical battle grid placements (Frontline, Backline).
- Combat animations and target selections.
- Loot tables rolling materials based on defeated enemy tags.
