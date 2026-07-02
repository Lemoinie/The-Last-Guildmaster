# Save Migration & Dual-Persistence Wiki

This page explains versioned saves, migrations, and file parsing.

---

## 1. Dual-Persistence Path

Save files are written concurrently to:
1. **Autoritative Desktop Location**: Managed by Electron file systems (`saves/savegame.json` in packaged AppData).
2. **Fallback Location**: Browser `localStorage.getItem('the_last_guildmaster_save')`.

---

## 2. In-Memory Migration Pipeline

On application startup:
1. The raw JSON is loaded.
2. It passes through the migrations manager [migrations.ts](file:///c:/Repositories/The-Last-Guildmaster/src/renderer/src/lib/persistence/migrations.ts).
3. The schema version (`meta.version`) is read. If missing, it defaults to `0`.
4. The loader maps migrations sequentially (e.g. `0` -> `1`).
5. After parsing, `Object.assign` is called to hydate Svelte's reactive `state`.
6. Roster and Tavern recruits are deserialized, verified, and re-serialized to clean version 1 structures.

---

## 3. Versioning Isolation Rule

Application versions (e.g. `0.2.0`) represent gameplay modifications (semantic versioning rules). Save versions (e.g. `1`) represent data structure models only. They are completely decoupled.
