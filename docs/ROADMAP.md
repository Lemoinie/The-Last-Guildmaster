# ROADMAP.md — The Last Guildmaster Roadmap & Future Milestones

This document details the completed refactoring achievements and planned development phases.

---

## 1. Completed Refactoring (Phase 0)

We successfully refactored the foundation of The Last Guildmaster:
- **Unified State**: Merged isolated Tavern state into the single reactive Game store.
- **Decoupled Business Logic**: Extracted stateless domain systems (`economy`, `resource`, `roster`, `world`, `expedition`, `tavern`, `time`) to isolate mutations.
- **Unified World clock**: Integrated a deterministic game time rollover system inside the engine loop, removing multiple intervals.
- **Componentized UI**: Removed unsafe HTML string injections (`{@html}`) and set-timeout hacks from `GameApp.svelte` in favor of Svelte component views (`Inn`, `Storage`, `Expedition`, `Blacksmith`).
- **Hardened CharacterData**: Replaced the simplified mock model with structured, versioned character serialization records.
- **Save Migration Layer**: Added save schema validations and migrations.

---

## 2. Planned Implementations (Phase 1)

### Blacksmith & Crafting Forgery
- Implement material requirements checking.
- Deduct resources and push forged items (e.g. Iron Sword) to character equipment slots.

### Turn-Based Combat Engine
- Establish combat grid participants.
- Roll turn order based on SPD stats.
- Deduct health points and resolve skills execution using mathematical damage offsets.

---

## 3. Future Enhancements (Phase 2)
- Fully procedural world dungeons.
- Morale, salaries, retirement, and permadeath of guild roster adventurers.
- Multi-party deployments on simultaneous expeditions.
