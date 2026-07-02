# The Last Guildmaster

**The Last Guildmaster** is a premium, single-player RPG guild management game. Take on the role of the Guildmaster, recruit brave adventurers, manage your resources, and lead your guild to glory in a dark fantasy world.

Built as a standalone desktop application using **Electron**, **Svelte 5**, **TypeScript**, and **Vite**, the game features a modern **Dark Glassmorphic** aesthetic with high-contrast neon accents and full offline support.

---

## 📚 Specifications & Systems Wiki

- **[Software Requirements Specification (SRS)](./SRS.md)** — Core functional behavior specs, system constraints, invariants, event logic, and progression rules.
- **[Game Design Document (GDD)](./docs/GDD.md)** — Layered dependency overview detailing atomic, stateful, and macro loops.
- **[State Flow Diagram (STATEFLOW)](./STATEFLOW.md)** — Visual representations of reactive rendering, boot initialization, clocks, save pipelines, and expeditions.
- **[Game Systems Wiki](./wiki/)**:
  - **[Core Process Architecture](./wiki/core_architecture.md)** — Dual-process data flow.
  - **[Time & Catch-up System](./wiki/time_system.md)** — Heartbeats, rollovers, and offline ticking.
  - **[Hero & Roster System](./wiki/hero_system.md)** — Base attributes, derived equations, levels, traits, and gear.
  - **[Tavern & Income System](./wiki/tavern_system.md)** — Logarithmic patron counts, income equations, and summoning pools.
  - **[JSON Item Registry Schema](./wiki/item_registry.json_schema.md)** — Moddable item databases.
  - **[Guild Storage System](./wiki/guild_storage.md)** — Slot allocation, split, and merge operations.
  - **[Save Migrations](./wiki/save_migration.md)** — Dual-persistence pipelines.
  - **[Application Update Log](./wiki/changelog.md)** — Version log history.

---

## 🚀 Getting Started

### Installation
Once the project is built, you can install the game using the generated setup file.

*   **Default Installation Path**: `%LOCALAPPDATA%\Programs\the-last-guildmaster`
    *   (Typically: `C:\Users\<YourUsername>\AppData\Local\Programs\the-last-guildmaster`)

### Running the App
After installation, you can launch the game via the shortcut or by running `the-last-guildmaster.exe` in the installation folder.

---

## 💾 Save Data & Persistence

Your progress is automatically saved locally on your machine. We use both native Electron file system saving and browser `localStorage` as a fallback.

*   **Save File Location**: `%APPDATA%\the-last-guildmaster\saves\savegame.json`
    *   (Typically: `C:\Users\<YourUsername>\AppData\Roaming\the-last-guildmaster\saves\savegame.json`)
*   **Data Integrity**: Do not modify or delete the files in this directory unless you wish to reset your game progress entirely.

---

## 🛠 Developer Instructions

If you are developing or modifying the game:

### Prerequisites
*   [Node.js](https://nodejs.org/) (v20.19+ or v22.12+)
*   npm (comes with Node.js)

### Setup
1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd The-Last-Guildmaster
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```

### Development Commands
*   **Launch in Dev Mode**: Runs the Electron app with Vite HMR for instant UI updates.
    ```bash
    npm run dev
    ```
*   **Build for Production**: Compiles the TypeScript & Svelte source into optimized bundles.
    ```bash
    npm run build
    ```
*   **Compile Directory**: Packs the Electron app binaries into an unpacked folder (`dist/win-unpacked`).
    ```bash
    npm run postbuild
    ```
*   **Package Inno Setup Installer**: Runs the automated compiler script to generate a customized installer (`The-Last-Guildmaster-Setup.exe`) and `latest.yml` update descriptor (requires Inno Setup 6).
    ```bash
    npm run package
    ```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| **Framework** | Electron |
| **UI** | Svelte 5 (Runes) |
| **Language** | TypeScript |
| **Build Tool** | electron-vite (Vite 6) |
| **Installer** | Inno Setup 6 (Install, Repair, Uninstall) |
| **Packaging** | electron-builder |
| **Auto-Update** | electron-updater |

### Project Structure
```
src/
├── main/          → Electron Main Process (Node.js)
├── preload/       → Context Bridge (IPC type-safe API)
└── renderer/      → Svelte 5 UI (Browser)
    └── src/
        ├── components/    → Svelte components
        ├── lib/           → Stores, engine, logger
        └── styles/        → Global CSS (glassmorphic theme)
```

---

## 🏰 Core Buildings
*   **Tavern**: Recruit new adventurers for your guild.
*   **Inn**: Manage your roster and view adventurer stats.
*   **Storage**: Monitor your stockpile of wood, stone, iron, and herbs.
*   **Expedition Board**: Send adventurers on dangerous missions for rewards.
*   **Market**: Trade resources for gold.
*   **Blacksmith**: Craft powerful weapons and armor.
*   **Garden**: Plant seeds to grow alchemical ingredients.
*   **Alchemist**: Brew potions to aid your heroes.
*   **Church**: A somber place to remember the fallen and offer prayers.

---

## 🎨 Visual Direction
The game utilizes a **Dark Glassmorphism** design system with:
*   **Primary Accent**: `#7dd3fc` (Cold Spiritual Blue)
*   **Alert Accent**: `#ef4444` (Cold Red)
*   **Backdrop**: 20px Gaussian Blur with deep charcoal panels.
*   **Typography**: Cinzel (headings) + Inter (body) via Google Fonts.
*   **Assets**: All building backgrounds are stored locally in `assets/` for zero-latency loading.

---

## ⚖ License
This project is licensed under the **Apache License 2.0**. See the [`LICENSE`](./LICENSE) file for full details.

[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](https://opensource.org/licenses/Apache-2.0)