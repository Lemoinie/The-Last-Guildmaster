# SAVE_SCHEMA.md — The Last Guildmaster Save Schema Design Bible

This document is the canonical source of truth for the JSON persistence schema, dual-persistence layers, and version migrations.

---

## 1. File Path Resolution

The save file is managed by the Electron main process using node file system calls.

| OS Environment | Authority Save File Path | Fallback Path |
|----------------|--------------------------|---------------|
| Packaged Executable | `%APPDATA%/the-last-guildmaster/saves/savegame.json` | `localStorage['the_last_guildmaster_save']` |
| Development Server | `%APPDATA%/Electron/saves/savegame.json` | `localStorage['the_last_guildmaster_save']` |

---

## 2. Canonical JSON Schema (Version 1)

All active saves follow the unified Game store schema:

```json
{
  "roster": [
    {
      "version": 1,
      "id": "char-uuid-1234",
      "name": "Aldric Ironhands",
      "level": 3,
      "xp": 45,
      "jobId": "footman",
      "traitId": "ironclad",
      "attributes": {
        "baseStr": 14,
        "baseInt": 10,
        "baseDex": 11,
        "baseCon": 18
      },
      "equipment": {
        "weaponId": "iron_sword",
        "armorId": "iron_plate",
        "accessoryId": null
      },
      "skills": ["strike", "shield_bash"],
      "professionSkills": []
    }
  ],
  "tavern": {
    "lastIncomeTick": 145,
    "lastPassiveRecruitAt": 120,
    "passiveRecruitIntervalMs": 28800000,
    "totalGoldEarned": 4200,
    "totalPatronsServed": 84,
    "pendingRecruits": [
      {
        "id": "recruit-uuid-5678",
        "character": {
          "version": 1,
          "id": "char-uuid-9999",
          "name": "Elowen the Wise",
          "level": 2,
          "xp": 10,
          "jobId": "apprentice",
          "traitId": "bookworm",
          "attributes": {
            "baseStr": 8,
            "baseInt": 15,
            "baseDex": 10,
            "baseCon": 12
          },
          "equipment": {
            "weaponId": "oak_staff",
            "armorId": null,
            "accessoryId": null
          },
          "skills": ["fireball"],
          "professionSkills": []
        },
        "rarity": "uncommon",
        "expiresAt": 1719999999999
      }
    ],
    "summoningStones": {
      "crude": 3,
      "refined": 1,
      "arcane": 0,
      "legendary": 0
    }
  },
  "economy": {
    "gold": 1200,
    "renown": 150
  },
  "resources": {
    "wood": 25,
    "stone": 15,
    "herbs": 8,
    "seeds": 2,
    "iron": 12
  },
  "expeditions": [
    {
      "id": 1719999000000,
      "name": "Forest Patrol",
      "status": "active",
      "remainingTime": 42
    }
  ],
  "world": {
    "unlockedBuildings": ["tavern", "inn", "storage"],
    "log": [
      {
        "timestamp": 1719999000000,
        "icon": "✅",
        "message": "Forest Patrol deployed.",
        "type": "info"
      }
    ],
    "time": {
      "tick": 42,
      "hour": 6,
      "day: 3",
      "week": 1,
      "month": 1,
      "season": "spring"
    }
  },
  "settings": {
    "maxAdventurers": 10,
    "debugConsole": false,
    "devMode": false,
    "autoSaveInterval": 30,
    "lastSave": 1719999500000
  },
  "meta": {
    "version": 1,
    "saveTimestamp": 1719999500000,
    "playtime": 3600
  }
}
```

---

## 3. Migration Layers

Migrations are structured sequentially, starting from legacy version 0 saves:
- **`migrateLegacyToV1`**: Automatically translates flat structure parameters (such as `gold`, `renown`, `inventory` -> `resources`, `adventurers` -> `roster`) into version 1 format, adding world time values.
- **Save Integrity Hooks**: On `Game.load()`, files are fed into `migrateSave` to normalize schema before UI components ingest state.

---

## 4. Local Client Settings (Browser `localStorage`)

Apart from the primary `savegame.json` file, client-specific settings (such as audio volumes, screen resolution, and window state preferences) are stored directly inside the browser's `localStorage` namespace to avoid cluttering gameplay state.

| Local Storage Key | Data Type | Default Value | Description / Used By |
|-------------------|-----------|---------------|-----------------------|
| `tlg_volume_master` | `string` (int `0–100`) | `'80'` | Main master audio gain control |
| `tlg_volume_music` | `string` (int `0–100`) | `'60'` | Background music level |
| `tlg_volume_fx` | `string` (int `0–100`) | `'70'` | Action/Summoning FX volume level |
| `tlg_window_mode` | `string` (`'fullscreen' \| 'windowed'`) | `'fullscreen'` | Electron display window configuration |
| `tlg_resolution` | `string` (`'WxH'`) | `'1920x1080'` | Screen resolution dimensions |
| `tlg_autosave_interval` | `string` (int) | `'30'` | Autosave trigger timer frequency in minutes |
| `tlg_crash_log` | `string` (`'0' \| '1'`) | `'0'` | Flag to enable crash dump logging |
| `tlg_debug_console` | `string` (`'0' \| '1'`) | `'0'` | Flag to display chromium inspector console |
| `tlg_dev_mode` | `string` (`'0' \| '1'`) | `'0'` | Enables the draggable DevBubble overlay panel |
| `tlg_tos_accepted_v1` | `string` (`'0' \| '1'`) | — | Tracks ToS agreement before loading main menu |
| `the_last_guildmaster_save` | `string` (JSON) | — | Fallback dual-persistence game save cache |

---

## 5. Versioning Principle (Updated for Mod-Friendly Architecture)

The Last Guildmaster utilizes two completely independent versioning systems to maintain save-file compatibility, long-term mod integration, and application stability.

### 5.1. Application Versioning (Semantic Versioning)
The game client version follows the semantic versioning standard:
$$\text{MAJOR}.\text{MINOR}.\text{PATCH}$$

- **MAJOR**: Breaking changes to gameplay loops, core system architecture rewrites, or overhaul of mechanical features.
- **MINOR**: Standard additions of systems (e.g. professions, custom dungeons, guild expansions) and content.
- **PATCH**: Bug fixes, math balance edits, performance improvements, and file reorganization with no structural runtime impact.
- **Pre-releases**: Denoted by `0.x.x` ranges representing active pre-launch milestones.

> 💡 **Rule**: The Application Version represents the player-facing gameplay experience, not backend data format changes.

### 5.2. Save Schema Versioning
Save files carry a dedicated schema tracker (`meta.version`) representing the structure of the JSON fields.
- **Save Version increments** occur *only* when the JSON structure undergoes format changes (adding/removing parameters, restructuring tables, changing inventory layouts).
- **Migration Rule**: Every save version bump must ship with a corresponding deterministic migration function in `migrations.ts`. 

> 💡 **Rule**: Save Version represents serialization compatibility only, completely independent of the Application Version.

### 5.3. Migration Flow
All loaded save files are dynamically validated and normalized through the migration layer before hydration:
$$\text{Raw Save Data} \longrightarrow \text{Sequential Migrations} \longrightarrow \text{Normalized Latest Schema} \longrightarrow \text{State Hydration}$$

- Migrations must be pure functions operating on deep-cloned JSON copies.
- Migrations may rename variables, split tables, or inject defaults, but must **never** execute gameplay mechanics or depend on active runtime stores.
