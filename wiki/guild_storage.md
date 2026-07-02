# Guild Storage System Wiki

This page explains slot-based storage allocations, stacks, and registry calculations.

---

## 1. Slot-Based Design

Guild storage uses a slot-based layout located at `Game.state.resources.storage`.
- It enforces no physical weight limits. Upkeep and inventory carry capacity calculations are bypassed.
- Stackable items share a slot up to their individual `maxStack` definition.
- Non-stackable items occupy one slot each.
- Empty slots are represented as `null`.

---

## 2. API Operations

The stateless system [storage.system.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/systems/storage.system.ts) handles all operations:
- **`hasSpace(itemId, quantity)`**: Counts empty slots and existing open stacks to verify space.
- **`addItem(itemId, quantity)`**: Fills open matching stacks first, then populates first-found empty slots.
- **`removeItem(itemId, quantity)`**: Deducts quantity starting from the end of the array, clearing slots once they hit zero.
- **`splitStack(slotIndex, amount)`**: Deducts `amount` from the stack at `slotIndex` and creates a new stack in the first empty slot.
- **`mergeStacks()`**: Gathers all items from storage, condenses partial stacks, and refills slots sequentially to optimize space.
