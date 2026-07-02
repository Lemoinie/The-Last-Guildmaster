# Item Registry & JSON Schema Wiki

This page explains taxonomy guidelines, JSON formats, and validation checks.

---

## 1. Taxonomy Layers

All item assets follow a 3-tier hierarchy:
1. **Category**: High-level slot (e.g. `herb`, `wood`, `ore`, `ingot`, `hide`, `fish`, `consumable`, `utility`, `weapon`, `armor`, `accessory`).
2. **Family**: Grouping type (e.g. `flower`, `softwood`, `metal_ore`, `potion`, `sword`, `plate`, `ring`).
3. **Specific Item**: The unique entity (e.g. `poppy`, `oak_wood`, `iron_ore`, `health_potion`, `iron_sword`).

---

## 2. Content JSON Schema

All static items are defined in external JSON lists inside `data/items/`.

```json
[
  {
    "id": "iron_sword",
    "name": "Iron Sword",
    "category": "weapon",
    "family": "sword",
    "rarity": "common",
    "stackable": false,
    "maxStack": 1,
    "baseValue": 50,
    "tags": ["weapon", "melee", "physical"],
    "durability": 100,
    "weight": 1.2,
    "stats": {
      "str": 5,
      "dex": 2
    }
  }
]
```

---

## 3. Loader & Runtime Validator

On application boot, [item.loader.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/items/item.loader.ts) loads all JSON arrays and passes them through [item.validator.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/items/item.validator.ts):
- Verifies that ID, name, category, rarity, stack limits, and value properties are populated and typings are valid.
- Normalizes and loads items into `ALL_ITEMS`.
- Duplicate IDs trigger a warnings log in the developer console.
