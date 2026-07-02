# ECONOMY.md — The Last Guildmaster Economy Design Bible

This document details gold, renown, passive income equations, and recruitment scaling rates.

---

## 1. Core Currencies & Scaling

### CURRENT
The economy runs on two primary resources:
- **Gold**: Spendable currency for recruitments and crafting.
- **Renown**: Reputation score. Unlocks better recruit intervals and larger waves.

---

## 2. Economy Formulas

### Passive Patron Arrivals
The number of patrons visiting the Tavern per hour (or real-world minute tick) scales logarithmically with Renown, capped at 50:
$$\text{patronsThisTick}(R) = \min(50, 3 + \lfloor \ln(1 + R) \times 2.5 \rfloor)$$

### Hourly Income
Every hour rollover of the world clock, the guild earns gold:
$$\text{goldEarned} = \text{patronsThisTick} \times 2$$

### Passive Recruit Timer
Recruit waves arrive based on game hour intervals. The base interval is 12 hours, decreasing down to a minimum of 2 hours at 1000 Renown:
$$\text{reductionFactor}(R) = \min(0.83, \frac{R}{1000})$$
$$\text{recruitIntervalHours}(R) = \max(2, 12 \times (1 - \text{reductionFactor}(R)))$$

### Passive Recruit Wave Size
Wave size increases with renown, capped at 5 recruits:
$$\text{waveSize}(R) = \min(5, 1 + \lfloor \frac{R}{200} \rfloor)$$

---

## 3. Ownership & Dependencies
- **Economy System**: [economy.system.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/systems/economy.system.ts) coordinates renown additions and gold spendings.
- **Tavern System**: [tavern.system.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/systems/tavern.system.ts) processes income ticks and passive wave size/timing calculations.
