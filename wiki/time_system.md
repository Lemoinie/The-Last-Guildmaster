# Time, Weather & Invariants System Wiki

This page explains the world calendar clock, ticking routines, environmental weather tables, and strict engine invariants.

---

## 1. Unified Game Heartbeat & Delta Calculations

To maintain consistent speed and simulation accuracy regardless of frame drops or browser suspension (e.g., when the game is tabbed away):
- The engine computes the real-time milliseconds elapsed using `performance.now()`.
- If the elapsed delta is $\ge 1000\text{ms}$, the engine advances the simulation by the integer division of the delta (number of game ticks).
- Catch-up operations (both offline catch-up on game launch and lag compensation) are completely deterministic, executing the time tick transition functions sequentially.

---

## 2. Transition Algorithms & Flow

State progression functions transition sequentially:

### `advanceTick()`
Increments `state.world.time.tick`.
- If `tick >= 60`: Rollover `tick = 0` and trigger `advanceHour()`.

### `advanceHour()`
Increments `state.world.time.hour`.
- Triggers passive income ticks, recruitment wave check countdowns, and prunes expired recruits.
- If `hour >= 24`: Rollover `hour = 0` and trigger `advanceDay()`.

### `advanceDay()`
Increments `state.world.time.day`.
- Re-calculates week slot: `week = Math.floor((day - 1) / 7) + 1`.
- Executes weather rolls using a PRNG seeded deterministically with the day index: `(Year * 336) + (Month * 28) + Day`.
- If `day > 28`: Rollover `day = 1`, reset `week = 1`, and trigger `advanceMonth()`.

### `advanceMonth()`
Increments `state.world.time.month`.
- If `month > 12`: Rollover `month = 1` and increment the global year.

---

## 3. Weather & Environmental Rerolls

Weather is rolled exactly once daily on rollover. The weather condition persists for the full 24-hour cycle. Each season rolls against distinct probability tables:

| Season | Weather Condition | Probability | Game Effect (Future) |
|---|---|---|---|
| **Spring** | Clear (60%) / Drizzle (30%) / Mist (10%) | Dynamic | Fatigue and Ambush penalties |
| **Summer** | Sunny (50%) / Heatwave (30%) / Thunderstorm (20%) | Dynamic | Water depletion & duration delay |
| **Autumn** | Windy (40%) / Rain (45%) / Fog (15%) | Dynamic | Speed and Ambush multipliers |
| **Winter** | Cold (60%) / Snow (30%) / Blizzard (10%) | Dynamic | Extreme duration & fatigue penalties |

---

## 4. Strict Engine Invariants

The game engine enforces strict bounds constraints on time parameters:
- **`tick`**: $t \in [0, 59]$
- **`hour`**: $h \in [0, 23]$
- **`day`**: $d \in [1, 28]$
- **`week`**: $w \in [1, 4]$
- **`month`**: $m \in [1, 12]$

Any transaction attempting to write an out-of-bounds value constitutes a critical logic error.
