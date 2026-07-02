# Legacy File Audit — The Last Guildmaster

> **Goal:** Confirm which pre-Svelte files are dead weight and safe to delete, before any cleanup.
> **Build system:** `electron-vite` — entry points defined in `electron.vite.config.ts`.

---

## Build Entry Points (Source of Truth)

The `electron-vite` config defines **exactly three** entry points. Nothing outside these trees is loaded by the build:

| Process | Entry | Resolved From |
|---------|-------|---------------|
| Main process | `src/main/index.ts` | Electron's `"main": "./out/main/index.js"` in `package.json` |
| Preload bridge | `src/preload/index.ts` | `webPreferences.preload: path.join(__dirname, '../preload/index.js')` in `src/main/index.ts` |
| Renderer | `src/renderer/index.html` → `src/renderer/src/main.ts` | `win.loadFile(path.join(__dirname, '../renderer/index.html'))` in `src/main/index.ts` |

**Key finding:** `package.json`'s `"main"` field points to `./out/main/index.js` (the compiled output of `src/main/index.ts`). The root `main.js` is **not referenced here**.

---

## DEAD FILES

### Group 1 — Root Legacy JS App

These are the original pre-Svelte Electron app files. They formed a complete standalone app that has been fully superseded.

| File | Size | Why Dead |
|------|------|----------|
| `index.html` (root) | 20,761 bytes | Loaded by **root** `main.js` via `win.loadFile(path.join(__dirname, 'index.html'))`. The active main process is `src/main/index.ts`, which loads `src/renderer/index.html`. The root `index.html` is never touched by electron-vite. |
| `main.js` (root) | 8,979 bytes | CommonJS Electron main process for the old app. `package.json` `"main"` field points to `./out/main/index.js` (compiled from `src/main/index.ts`). This file is not in the build pipeline. |
| `preload.js` (root) | 1,140 bytes | Used by root `main.js` (`preload: path.join(__dirname, 'preload.js')`). Since root `main.js` is dead, this is also dead. The active preload is `src/preload/index.ts`. |

### Group 2 — `js/` Directory (Legacy Vanilla JS Modules)

All five files are ES module scripts loaded by `<script type="module">` tags in the **root** `index.html`. Since that HTML file is dead, these files have no loader.

| File | Size | Legacy Role | Svelte Replacement |
|------|------|--------------|--------------------|
| `js/menu.js` | 17,457 bytes | Screen transitions, ToS flow, update check, modal management, settings UI | `MainMenu.svelte`, `SettingsModal.svelte`, `LegalOverlay.svelte` |
| `js/state.js` | 2,677 bytes | `StateManager` class with Observer pattern (`subscribe`/`notify`) | `src/lib/stores/game.svelte.ts` (Svelte 5 `$state`) |
| `js/engine.js` | 1,400 bytes | `Engine` class, `setInterval` tick, expedition processing | `src/lib/engine.ts` |
| `js/ui.js` | 8,991 bytes | DOM-manipulation UIController, innerHTML building view rendering | `GameApp.svelte`, `Tavern.svelte` |
| `js/logger.js` | 665 bytes | `Logger` utility, Electron IPC log calls | `src/lib/logger.ts` |
| `js/buildings/` | empty dir | Placeholder for building-specific JS modules | N/A |

**Cross-reference check:** No file in `src/` imports from `js/`. Confirmed by grep — zero results for `from 'js/'`, `from '../js/'`, or `from '../../js/'` across all `.ts`, `.svelte`, and `.json` files.

### Group 3 — `css/` Directory (Legacy Stylesheets)

These were loaded by `<link rel="stylesheet">` tags in the **root** `index.html`. The active CSS is in `src/renderer/src/styles/` and imported via `src/renderer/src/global.css` → `src/renderer/src/main.ts`.

| File | Size | Legacy Role | Active Replacement |
|------|------|-------------|-------------------|
| `css/variables.css` | 704 bytes | CSS custom properties, body/reset styles | `src/renderer/src/styles/variables.css` |
| `css/animations.css` | 1,296 bytes | Keyframe animations | `src/renderer/src/styles/animations.css` |
| `css/overlays.css` | 993 bytes | `.overlay`, `.hidden`, `.visible` rules | `src/renderer/src/styles/overlays.css` |
| `css/components.css` | 5,611 bytes | Buttons, cards, toasts, toggles | `src/renderer/src/styles/components.css` |
| `css/layout.css` | 4,102 bytes | Sidebar, top bar, grid, background images | `src/renderer/src/styles/layout.css` |
| `css/main_menu.css` | 5,105 bytes | Main menu layout, animations | `src/renderer/src/styles/main_menu.css` |
| `css/modals.css` | 9,137 bytes | Settings, ToS, credits modal styles | `src/renderer/src/styles/modals.css` |

**Cross-reference check:** No file in `src/` has an `@import` or `import` statement pointing to the root `css/` directory. The chain is: `main.ts` → `global.css` → `src/renderer/src/styles/*.css`.

> ⚠️ **Note on CSS duplication:** The active `src/renderer/src/styles/` files appear to be evolved copies of the root `css/` files. They are not byte-identical — the active versions are larger (e.g., `modals.css` 9,137 → 9,564 bytes, `variables.css` 704 → 734 bytes). The Svelte migration ported and updated these styles. No content in the root `css/` is unique.

### Group 4 — `backup/` Directory

| Path | Size | Why Dead |
|------|------|----------|
| `backup/index.html` | 21,151 bytes | Older snapshot of root `index.html`. Not referenced anywhere. |
| `backup/main.js` | 9,286 bytes | Older snapshot of root `main.js`. |
| `backup/preload.js` | 1,159 bytes | Older snapshot of root `preload.js`. |
| `backup/css/` | (dir) | Older CSS snapshots. |
| `backup/js/` | (dir) | Older JS snapshots. |

The `backup/` directory is also **not in `.gitignore`**, meaning it is tracked in the repository. It is pure development snapshot material with no role in the build.

---

## WHY DEAD — Summary Table

| File/Dir | Mechanism of Death |
|----------|--------------------|
| Root `index.html` | `win.loadFile()` in active `src/main/index.ts` points to `src/renderer/index.html`. Root file unreachable. |
| Root `main.js` | `package.json "main"` field is `./out/main/index.js` (compiled from `src/main/index.ts`). Root `main.js` not an entry point. |
| Root `preload.js` | Its only consumer is root `main.js`, which is itself dead. |
| `js/*.js` | Loaded via `<script>` in root `index.html`, which is dead. Zero imports from `src/`. |
| `js/buildings/` | Empty directory, never had contents. |
| `css/*.css` | Loaded via `<link>` in root `index.html`, which is dead. Zero imports from `src/`. |
| `backup/` | Snapshot directory. No references anywhere. Not in `.gitignore`. |

---

## SAFE DELETE ORDER

Delete in this order (innermost dependencies first, then containers):

**Step 1 — `backup/` (entire directory)**
Zero references anywhere. Pure snapshot. No risk.

```
backup/
```

**Step 2 — `js/buildings/` (empty directory)**
Empty. Trivial.

```
js/buildings/
```

**Step 3 — `js/` module files (leaf files first)**
`logger.js` and `state.js` have no local imports. `engine.js` imports `state.js`. `ui.js` imports all three. `menu.js` imports `logger.js`.

```
js/logger.js
js/state.js
js/engine.js
js/ui.js
js/menu.js
js/           ← directory now empty, safe to remove
```

**Step 4 — `css/` directory**
No dependencies between CSS files (no `@import` within root `css/`).

```
css/variables.css
css/animations.css
css/overlays.css
css/components.css
css/layout.css
css/main_menu.css
css/modals.css
css/              ← directory now empty, safe to remove
```

**Step 5 — Root HTML and process files**
`preload.js` depends on root `main.js` context. Delete both together.

```
preload.js
main.js
index.html
```

---

## RISKS

| Risk | Severity | File(s) Affected | Notes |
|------|----------|-----------------|-------|
| **`.gitignore` doesn't cover `backup/`** | 🟢 Low | `backup/` | The backup directory is committed to git history. Deleting it removes it from the working tree but it remains in git history. Safe to delete — git history provides recovery if needed. |
| **`js/state.js` and `src/.../game.svelte.ts` share the same localStorage key** | 🟢 Low | Both share `'the_last_guildmaster_save'`. If someone ran the old app, their save was in localStorage under that key. The active Svelte app reads the same key as fallback. Deleting the old `state.js` has no effect on this — it's just a file. |
| **Comments in Svelte components reference root `index.html`** | 🟢 Low | `MainMenu.svelte:89`, `SettingsModal.svelte:74`, `LegalOverlay.svelte:66`, `CreditsModal.svelte:13` | These are developer comments like `<!-- Your exact #main-menu HTML from index.html -->`. They are informational only. After deleting `index.html`, these comments become stale but harmless. Should be cleaned up as a separate pass. |
| **Root `main.js` is syntactically valid but not a build entry** | 🟢 Low | `main.js` | If someone ran `node main.js` directly or tried to use it as an alternative entry, it would attempt to load root `index.html`. There is no npm script that calls it. `package.json "main"` correctly points to the compiled output. |
| **`backup/` is not in `.gitignore`** | 🟢 Low | `.gitignore` | After deletion from disk, add `backup/` to `.gitignore` to prevent accidental re-creation. |

### Files That Are NOT Safe to Delete

| File | Reason |
|------|--------|
| `src/renderer/src/styles/*.css` | These are the **active** styles. `global.css` imports all of them. |
| `src/renderer/src/global.css` | Imported by `main.ts`. Removing breaks all styling. |
| `src/preload/` | The actual active preload consumed by electron-vite. |
| `src/main/index.ts` | The actual active main process. |
| `electron.vite.config.ts` | Build configuration. |

---

## Verification Command

After deletion, confirm the build still works:

```powershell
npm run dev
```

Then confirm no 404s for `css/`, `js/`, `index.html`, or `preload.js` in the Electron DevTools network panel (they should never appear since they were never loaded by the active build).
