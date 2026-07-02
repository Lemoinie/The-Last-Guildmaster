# Changelog & Update Log

This page records the changes introduced in every application version.

---

## [0.2.0] — 2026-07-02
### Added
- **Unified State Store**: Merged isolated Tavern state into the single reactive Game store in `game.svelte.ts`.
- **Stateless Domain Systems**: Reorganized all business logic out of stores into stateless modules (`economy`, `resource`, `roster`, `world`, `expedition`, `tavern`, `time`, `storage`).
- **Unified World clock**: Integrated a deterministic game time progression system inside the engine loop, removing multiple intervals.
- **Offline Catch-Up**: Added real-world duration calculation during load to advance clock ticks and capture Tavern income and recruits offline.
- **Moddable JSON Item Registry**: Converted item registries into external JSON content lists under `data/items/`, with dynamic loading and validation checks.
- **Slot-Based Guild Storage**: Added slot-bound items storage, including operations for splits, merges, additions, and deletions.
- **Clean Svelte Views**: Replaced unsafe HTML string injections (`{@html}`) and delayed timeout DOM handlers in `GameApp.svelte` with conditional Svelte components (`Inn`, `Storage`, `Expedition`, `Blacksmith`).
- **Versioned Save Migration**: Added in-memory migrations pipeline to support upgrades of legacy saves.

---

## [0.1.0] — 2026-04-22
### Added
- **Tavern Recruitment Tab**: Walk-in recruits tabs and timer countdowns.
- **Summoning Stones Panel**: Stones mechanics to instantly spawn adventurers of specific rarity pools.
- **Ledger Logs**: Detailed logs for gold transactions.
- **Dev Mode & Bubble**: Draggable overlay bubble panel with developer cheat controls for renown, recruits, and materials.
- **Auto-Save Option**: Persisted auto-save intervals.

---

## [0.0.1] — 2026-04-16
### Added
- **Initial Setup**: Core electron-vite layout configurations.
- **Roster & Attributes**: Character classes and base attribute growth rates.
- **Main Menu**: Basic window loading and play triggers.
