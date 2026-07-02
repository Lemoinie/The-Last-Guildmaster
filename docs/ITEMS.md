# ITEMS.md — The Last Guildmaster Items Design Bible

This document details materials, consumables, gear categories, and summoning stones registries.

---

## 1. Item Hierarchy

### CURRENT
All items inherit from a base `Item` class.

```
Item
├── Material          — Stackable resource (Iron, Wood, Herbs, Stone, Crystal)
├── Consumable        — Single-use potion or elixir (restores HP/MP)
└── Equipment         — Non-stackable gear with stat bonuses
    ├── Weapon        — Class specific (Iron Sword, Oak Staff, Short Bow, Flame Blade)
    ├── Armor         — Class specific (Leather Vest, Iron Plate, Mage Robe)
    └── Accessory     — Universal gear slot (Iron Ring, Scholar Amulet, Guardian Charm)
```

#### Item Registry Examples:
- **`iron_sword`**: Weapon. Slot: `weapon`. Stats: `str: 5, dex: 2`. Rarity: `common`.
- **`health_potion`**: Consumable. Effect: `heal_hp`, value: 50. Rarity: `common`.

### FUTURE
- Equipment durability and repair fees.
- Random suffix modifiers (e.g. "of the Bear" +STR).

---

## 2. Summoning Stones

Stones are consumed to instantly summon an adventurer. Unlocks higher-level pools:

| Stone Grade | Icon | Rarity Pools | Description |
|-------------|------|--------------|-------------|
| Crude | 🪨 | common, uncommon | Attracts squires and scouts |
| Refined | 💎 | uncommon, rare | Attracts veterans |
| Arcane | 🔮 | rare, epic | Attracts elite classes |
| Legendary | 🌟 | epic, legendary | Attracts champions |

---

## 3. Ownership & Dependencies
- **Item Classes**: [items.svelte.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/adventurer/items.svelte.ts) defines registries (`MATERIALS`, `WEAPONS`, etc.) and classes.
- **Resource System**: [resource.system.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/systems/resource.system.ts) updates inventory resource counts.
- **Roster/Tavern System**: Deserializes character gear mappings from registry references during load.

---

## 4. Weight Rules

### CURRENT
All physical items possess a defined `weight` parameter (in kg) within their catalog registry definitions.

- **Usage Cases**:
  - Hero carry capacity offsets.
  - Active expedition party burden values.
- **Exceptions**:
  - **Guild Storage**: Weight is **not** used to restrict storage bounds. Guild storage enforces limits purely via slot capacities (number of items/stacks).

### FUTURE
- Caravan carriage weights for trade logistics and global marketplace hauling.
