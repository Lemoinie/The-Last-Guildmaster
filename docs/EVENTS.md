# EVENTS.md — The Last Guildmaster Events Design Bible

This document details the activity logs, notifications, and interactive event triggers.

---

## 1. Global Activity Log

### CURRENT
Activity logs are stored under `Game.state.world.log` containing unified log entries.

```typescript
export interface TavernLogEntry {
  timestamp: number
  icon: string
  message: string
  type: 'income' | 'recruit' | 'summon' | 'info'
}
```

The log is treated as a FIFO queue, capped at a maximum of 50 entries via the world system.

#### Log Event Categories:
- **`income`**: Processed on hour tick gold earnings (e.g. `12 patrons visited — earned 24g`).
- **`recruit`**: Triggered when walk-ins arrive or are accepted (e.g. `Sera joined the guild`).
- **`summon`**: Stones resolved for immediate arrivals.
- **`info`**: Mission updates and saves notification.

---

## 2. Notification Overlay

Toasts are dispatched from components via direct prop-drilled callbacks (`showToast`) to display quick, 2-second notification boxes.

### FUTURE
- Central event-bus or Svelte context provider to trigger notification triggers from deep systems without drilling.
- Interactive choice dialogue events (e.g., choosing to pay local guards or fight off thieves, costing/gaining gold or renown).

---

## 3. Ownership & Dependencies
- **World System**: [world.system.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/systems/world.system.ts) handles pushing new records and slicing the queue.
- **UI Render**: `Tavern.svelte` renders logs in the Ledger view.
