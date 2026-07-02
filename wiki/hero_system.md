# Hero & Roster System Wiki

This page explains characters, base stats, level progression, derived attributes, skills, traits, and gear sync.

---

## 1. On-Demand Character Hydration

Roster characters are stored as pure JSON data objects (`CharacterData`) in `Game.state.roster`. When Svelte views render characters, they dynamically construct rich runtime `Character` class instances on-the-fly using `Character.deserialize(data)`.

---

## 2. Attributes & Derived Formulas

- **Base Attributes**: Strength (STR), Intelligence (INT), Dexterity (DEX), Constitution (CON).
- **Derived Combat Stats**:
  - **Max HP**: $\text{CON} \times 10$
  - **Max MP**: $\text{INT} \times 5$
  - **ATK**: $\text{STR} \times 2$
  - **SPD**: $\text{DEX}$

---

## 3. Experience & Stat Growth Curves

- **XP Needed to Level Up**:
  $$\text{xpNeeded} = \lfloor 50 \times \text{level}^{1.8} \rfloor$$
- **Stat Growth Multiplier**: On leveling up, attributes increase based on the job scale:
  $$\text{gain} = \lfloor \text{growthRate} \times \text{level}^{1.2} \rfloor$$

---

## 4. Traits & Equipment Modifiers

- **Gear Sync**: Equipping weapons, armor, or accessories adds flat bonuses to base attributes.
- **Traits Resolution**: Traits apply multiplier bonuses to the sum of base and gear stats:
  $$\text{finalTotal} = \lfloor (\text{base} + \text{gear}) \times (1 + \text{traitModifier}) \rfloor$$
  - *Example*: `Brawler` grants `str: +0.10, int: -0.05`.
