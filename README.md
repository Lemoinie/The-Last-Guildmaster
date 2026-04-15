# The Last Guildmaster

**The Last Guildmaster** is a premium, single-player RPG guild management game. Take on the role of the Guildmaster, recruit brave adventurers, manage your resources, and lead your guild to glory in a dark fantasy world.

Built as a standalone desktop application using **Electron**, the game features a modern **Dark Glassmorphic** aesthetic with high-contrast neon accents and full offline support.

---

## 🚀 Getting Started

### Installation
Once the project is built, you can install the game using the generated setup file.

*   **Default Installation Path**: `%LOCALAPPDATA%\Programs\the-last-guildmaster`
    *   (Typically: `C:\Users\<YourUsername>\AppData\Local\Programs\the-last-guildmaster`)

### Running the App
After installation, you can launch the game via the desktop shortcut or by running `the-last-guildmaster.exe` in the installation folder.

---

## 💾 Save Data & Persistence

Your progress is automatically saved locally on your machine. We use `localStorage` to ensure your guild's data remains persistent even after app updates.

*   **Save File Location**: `%APPDATA%\the-last-guildmaster\Local Storage`
    *   (Typically: `C:\Users\<YourUsername>\AppData\Roaming\the-last-guildmaster\Local Storage`)
*   **Data Integrity**: Do not modify or delete the files in this directory unless you wish to reset your game progress entirely.

---

## 🛠 Developer Instructions

If you are developing or modifying the game:

### Prerequisites
*   [Node.js](https://nodejs.org/) (Latest LTS recommended)
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
*   **Launch in Debug Mode**: Runs the Electron app with hot-reloading (if configured) or standard launch.
    ```bash
    npm start
    ```
*   **Build Installer**: Generates a production-ready Windows installer (`.exe`) in the `dist/` folder.
    ```bash
    npm run build
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
*   **Primary Accent**: `#00FF41` (Neon Green)
*   **Secondary Accent**: `#FF3131` (Neon Red)
*   **Backdrop**: 15px Gaussian Blur with deep charcoal panels.
*   **Assets**: All building backgrounds are stored locally in `assets/` for zero-latency loading.

---

## ⚖ License
This project is licensed under the **Apache License 2.0**. See the [`LICENSE`](./LICENSE) file for full details.

[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](https://opensource.org/licenses/Apache-2.0)