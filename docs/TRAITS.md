# TRAITS.md — The Last Guildmaster Traits Design Bible

This document details character traits and stat multipliers.

---

## 1. Traits Registry

### CURRENT
Traits apply percentage-based modifiers to the final attribute totals.

| Trait ID | Trait Name | Modifiers Applied | Description |
|----------|------------|-------------------|-------------|
| `bookworm` | Bookworm | `int: +0.10`, `str: -0.05` | Amplifies magical studies |
| `brawler` | Brawler | `str: +0.10`, `int: -0.05` | Fierce physical power |
| `nimble` | Nimble | `dex: +0.10`, `con: -0.05` | Quick-footed combatant |
| `ironclad` | Ironclad | `con: +0.10`, `dex: -0.05` | Unwavering defense |

---

## 2. Stat Pipeline Resolution

Base attribute values are scaled by trait multipliers during derived computations:
$$\text{finalStat} = \lfloor (\text{baseStat} + \text{equipmentBonus}) \times (1 + \text{traitModifier}) \rfloor$$

---

## 3. Ownership & Dependencies
- **Traits Definition**: [traits.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/adventurer/traits.ts) holds definition rules.
- **Attributes**: [attributes.svelte.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/adventurer/attributes.svelte.ts) derives final values reactively via `$derived`.
