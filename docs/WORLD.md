# WORLD.md — The Last Guildmaster World Design Bible

This document describes the environment, time clock flow, logs, calendar, and environmental systems.

---

## 1. Unified Time System & Engine Heartbeat

### 1.1 Engine Ticking Semantics
- **Deterministic Elapsed Tracking**: The game engine does **NOT** assume a fixed execution frequency of the UI loop (e.g. a simple `setInterval`).
- **Delta-Based Progression**: The engine MUST track the real-time delta between frames using high-resolution timestamps (`performance.now()`).
- **Lag, Sleep, and Tab Pauses**: If the system encounters frame lag, background CPU throttling, or system sleep/pause, the elapsed real-time delta is calculated upon wake/next tick. The engine MUST divide this delta by the tick rate (1000ms) and advance the simulation by the resulting number of ticks sequentially.
- **Deterministic Catch-up**: During both offline catch-up (real-world time delta computed on load) and lag compensation, the engine MUST run transition functions step-by-step for each elapsed tick to guarantee simulation consistency.

---

## 2. Formal Transition Functions

```
                             [ advanceTick() ]
                                     │
                             tick >= 60? ── No ──> (End)
                                     │ Yes
                                     ▼
                                  tick = 0
                             [ advanceHour() ]
                                     │
                             hour >= 24?  ── No ──> (End)
                                     │ Yes
                                     ▼
                                  hour = 0
                              [ advanceDay() ]
                                     │
                             day > 28?    ── No ──> (End)
                                     │ Yes
                                     ▼
                                   day = 1
                             [ advanceMonth() ]
                                     │
                             month > 12?  ── No ──> (End)
                                     │ Yes
                                     ▼
                                  month = 1
                             (Increment Year)
```

### 2.1 Execution Algorithms
State progressions are strictly defined by the following sequential execution rules:

#### `advanceTick(state)`
1. Increment `state.world.time.tick` by 1.
2. If `state.world.time.tick >= 60`:
   - Set `state.world.time.tick = 0`.
   - Call `advanceHour(state)`.

#### `advanceHour(state)`
1. Increment `state.world.time.hour` by 1.
2. Trigger hourly events:
   - Calculate and process passive guild tavern income.
   - Run passive walk-in recruit wave interval checks.
   - Prune expired tavern recruits.
3. If `state.world.time.hour >= 24`:
   - Set `state.world.time.hour = 0`.
   - Call `advanceDay(state)`.

#### `advanceDay(state)`
1. Increment `state.world.time.day` by 1.
2. Recompute the week:
   - `state.world.time.week = Math.floor((state.world.time.day - 1) / 7) + 1`.
3. Trigger daily events:
   - Reroll global weather conditions using the daily weather table.
4. If `state.world.time.day > 28`:
   - Set `state.world.time.day = 1`.
   - Set `state.world.time.week = 1`.
   - Call `advanceMonth(state)`.

#### `advanceMonth(state)`
1. Increment `state.world.time.month` by 1.
2. If `state.world.time.month > 12`:
   - Set `state.world.time.month = 1`.
   - Increment `state.world.time.year` (if year tracking is enabled).

---

## 3. Season Derivation

- **Zero-Redundancy Rule**:
  - **CURRENT**: The season is stored in the `GameStateData` store for save compatibility with v1 structure.
  - **FUTURE/PLANNED**: The season MUST always be computed dynamically from the current month at access time. It MUST NOT be persisted in state.
- **Season Formula**:
  - **Months 1–3**: `spring`
  - **Months 4–6**: `summer`
  - **Months 7–9**: `autumn`
  - **Months 10–12**: `winter`

---

## 4. Weather & Environmental Systems

### 4.1 Weather Rollover Rules
- **Frequency**: Weather is rerolled exactly once on daily rollover (`advanceDay()`) and remains persistent for the entire 24-hour day cycle.
- **Scope**: Global (applies to all active maps/panels). In the future, this will scale to biome-dependent local regions.
- **RNG Seed Source**: Deterministic weather rolls are calculated using a PRNG seeded with `(Year * 336) + (Month * 28) + Day` to ensure that identical days always have identical weather paths.

### 4.2 Probability Tables
Depending on the active season (derived from the current month), weather transitions roll against the following probability tables:

| Season | Weather Condition | Probability | Effect / Penalty (Future) |
|---|---|---|---|
| **Spring** | Clear | 60% | None |
| | Drizzle | 30% | +5% Fatigue on Expeditions |
| | Mist | 10% | +10% Ambush Chance |
| **Summer** | Sunny | 50% | None |
| | Heatwave | 30% | +20% Water Consumption / Fatigue |
| | Thunderstorm | 20% | +15% Duration, +10% Ambush Chance |
| **Autumn** | Windy | 40% | None |
| | Rain | 45% | +10% Duration, +5% Fatigue |
| | Fog | 15% | +20% Ambush Chance |
| **Winter** | Cold | 60% | +5% Fatigue |
| | Snow | 30% | +15% Duration, +10% Fatigue |
| | Blizzard | 10% | +30% Duration, +25% Fatigue, +15% Ambush |

---

## 5. System Invariants & Hard Constraints

The time system must enforce the following strict ranges at all times:

| Parameter | Domain Constraint | Description |
|---|---|---|
| `tick` | $t \in [0, 59]$ | Minutes division |
| `hour` | $h \in [0, 23]$ | Day division |
| `day` | $d \in [1, 28]$ | Month division |
| `week` | $w \in [1, 4]$ | Week division; derived as $\lfloor \frac{d - 1}{7} \rfloor + 1$ |
| `month` | $m \in [1, 12]$ | Year division |

> [!IMPORTANT]
> These bounds represent strict engine invariants. Any attempt to modify these state values outside these bounds must trigger an engine panic or assert crash.

---

## 6. Ownership & Dependencies
- **State Store**: [game.svelte.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/stores/game.svelte.ts) holds clock state under `state.world.time`.
- **Engine**: [engine.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/engine.ts) ticks `Game.advanceTick()` first every second.
- **Time System**: [time.system.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/systems/time.system.ts) owns the progression rollovers and fast-forwards.
- **Tavern System**: [tavern.system.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/systems/tavern.system.ts) reads clock tick and hours to process income.
