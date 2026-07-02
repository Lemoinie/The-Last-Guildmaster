# Tavern Recruitment & Income Wiki

This page explains passive patron systems, recruitment waves, and summoning stones.

---

## 1. Passive Patron Flow

The Tavern attracts visitors based on the guild's Renown score. The hourly patron headcount is resolved logarithmically, capped at 50:
$$\text{patrons} = \min(50, 3 + \lfloor \ln(1 + \text{Renown}) \times 2.5 \rfloor)$$

Every game hour, each visiting patron spends 2 gold, which is credited to the economy store and recorded in the Tavern ledger logs.

---

## 2. Recruitment Waves

Recruit walk-ins appear automatically at intervals determined by Renown:
- **Base Walk-in Interval**: 12 hours.
- **Minimum Walk-in Interval**: 2 hours (at 1000 Renown).
- **Recruit Wave Size**: Scales from 1 to 5 depending on reputation:
  $$\text{waveSize} = \min(5, 1 + \lfloor \frac{\text{Renown}}{200} \rfloor)$$

---

## 3. Summoning Stones Registry

Summoning stones bypass timers, attracting adventurers immediately.
- **Crude Stone (🪨)**: Common/Uncommon squires and archers.
- **Refined Stone (💎)**: Uncommon/Rare veterans.
- **Arcane Stone (🔮)**: Rare/Epic magic practitioners.
- **Legendary Stone (🌟)**: Epic/Legendary guild champions.
