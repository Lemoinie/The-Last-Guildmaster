# PROFESSIONS.md — The Last Guildmaster Professions Design Bible

This document details character professions, crafting, gathering, and production schedules.

---

## 1. Crafting & Gathering Jobs

### CURRENT
- `CharacterData` contains a `professionSkills: string[]` future-proof placeholder.
- Crafting and gathering buildings (Blacksmith, Alchemist, Garden) are locked under construction stubs or basic view representations.
- Crafting materials (Iron, Wood, Herbs, Stone) exist in storage.

### FUTURE
- Characters can level up secondary gathering/production skills (Mining, Logging, Herbalism, Forging, Alchemy).
- Blacksmithing crafts weapons and armor (e.g. Iron Sword recipe: 5 Iron, 2 Wood).
- Alchemy brews consumables (e.g. Healing Potion recipe: 3 Herbs).
- Gardening allows growing herbs from seeds gathered on forest expeditions.

---

## 2. Ownership & Dependencies
- **UI Views**: Blacksmith, Alchemist, and Garden views render modular Svelte components under `src/renderer/src/components/views/`.
- **System**: Future `profession.system.ts` will process material consumption and item forgery.
