# EXPEDITIONS.md — The Last Guildmaster Expeditions Design Bible

This document details expedition setups, difficulty tiers, reward parameters, and ticking routines.

---

## 1. Expedition Missions

### CURRENT
Expedition state is stored in `Game.state.expeditions` containing active patrol info.

```typescript
export interface Expedition {
  id: number
  name: string
  status: 'active' | 'completed'
  remainingTime: number
}
```

#### Predefined Expeditions:
- **Forest Patrol**: Easy, duration: 60s, reward: Wood, Herbs.
- **Iron Mine Delve**: Medium, duration: 300s, reward: Iron, Stone.

#### Deployment Resolution:
Deploying spawns a forest patrol, which ticks down. Once `remainingTime === 0`, status changes to `'completed'` and a log is printed to the world log.

### PLANNED
- Assigning specific characters to an expedition.
- Locking deployed characters from Tavern/Inn views while deployed.

### FUTURE
- Combat resolutions or loot rolls based on the deployed party's average stat ratings.

---

## 2. Burden Rules

### CURRENT
No active burden check logic is integrated within current ticking loops.

### PLANNED
Party carry weight affects expedition outcomes. If a deployed party's collected loot weight exceeds their total combined carry capacity:
- **Expedition Duration**: Increases dynamically (slows down travel).
- **Ambush Chance**: Increases (heavy parties make easy targets).
- **Fatigue Chance**: Increases (exhausting journey).

*Note: Overweight does NOT block expeditions from completing. It applies soft penalties only.*

---

## 3. Ownership & Dependencies
- **State Store**: [game.svelte.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/stores/game.svelte.ts) holds the `state.expeditions` array.
- **Expedition System**: [expedition.system.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/systems/expedition.system.ts) handles deploying and updating patrol times.
- **Engine**: [engine.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/engine.ts) calls `Game.resolveExpedition()` on every tick to decrement active timers.
