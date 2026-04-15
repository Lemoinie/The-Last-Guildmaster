# Legal Documents — The Last Guildmaster
*Version 0.1.0 · Effective Date: April 15, 2026*

---

# Document 1: Terms of Service (ToS)

> **📋 Summary for Humans**
> By playing *The Last Guildmaster*, you agree to these rules. The game is a platform you can mod and extend. You keep ownership of your mods, but you must not use them for harm. We are not liable for crashes caused by third-party mods.

---

## 1. Acceptance of Terms

By downloading, installing, or running *The Last Guildmaster* (the "Game"), you agree to be bound by these Terms of Service ("ToS"). If you do not agree, do not use the Game.

## 2. The Game as a Platform and Engine

*The Last Guildmaster* is designed as a **moddable platform and engine**. Its core functionality serves as a runtime environment for official content and user-created modules ("mods"). The core engine is open-source under the **Apache License 2.0**.

## 3. User Generated Content (UGC)

- **Ownership**: You retain full intellectual property rights over any mod logic, scripts, assets, or content you create ("Your Mods").
- **License Grant**: By distributing or running Your Mods within the Game, you grant the Game and its developers a **perpetual, worldwide, royalty-free, non-exclusive license** to execute, display, and distribute Your Mods as part of the Game's runtime environment.
- **No Endorsement**: Publishing a mod does not imply endorsement by the developers.

## 4. Safety Clause

You agree that Your Mods **must not**:
- Contain malicious code, viruses, ransomware, spyware, or any unauthorized data-collection mechanisms;
- Violate any applicable law, including but not limited to copyright, privacy, or computer fraud laws;
- Include content that is illegal, exploitative, or harmful to minors;
- Attempt to circumvent, override, or tamper with the Game's core security or save systems.

Violations may result in immediate removal of content and reporting to appropriate authorities.

## 5. Disclaimer of Liability for Third-Party Modules

The Game is an open and moddable platform. **The developers are not responsible for**:
- Crashes, data corruption, or performance issues caused by third-party mods;
- Content, functionality, or legality of mods created by third parties;
- Any damage to your system resulting from running unofficial or unverified modules.

You install and run third-party mods entirely at your own risk.

## 6. Disclaimer of Warranties

The Game is provided **"AS IS"** under the Apache License 2.0, without warranties of any kind, express or implied.

## 7. Changes to Terms

We reserve the right to update these Terms at any time. Continued use of the Game after changes constitutes acceptance.

---

# Document 2: Operations & Modding Policy

> **📋 Summary for Humans**
> This is version 0.1.0 — things will break and change. Play fair, don't cheat, don't monetize our engine, and give credit where it's due when you publish mods.

---

## 1. Version Status and Breaking Changes

*The Last Guildmaster* is currently at **version 0.1.0** (Early Development / Alpha). This means:

- The core API, module schema, save-data format, and engine interfaces are **unstable**.
- **Breaking changes are expected** in future updates without backward-compatibility guarantees until version 1.0.0.
- Developers of third-party mods should pin their dependencies to a specific engine version and monitor the [CHANGELOG] for migration notes.

We will make reasonable efforts to document breaking changes, but we make no guarantees of notice.

## 2. Fair Play Policy

All players and mod authors agree to the following Fair Play rules:

| Rule | Description |
|------|-------------|
| **No Cheating** | Modifying game state to gain unfair advantages in competitive multiplayer modules is prohibited. |
| **No Exploits** | Deliberately exploiting bugs to bypass intended gameplay systems is not permitted. |
| **No Unauthorized Monetization** | You may not sell, license, or commercially distribute the **core engine** itself. You may monetize your own mod content provided it does not re-sell the core engine. |
| **No Impersonation** | Do not present your mod as an official release or as being made by the core development team. |

## 3. Attribution Rule (Apache 2.0 Compliance)

Based on the **Apache License 2.0**, the following attribution requirements apply to all mod authors and derivative works:

1. **Credit the Core Engine**: Any mod, fork, or derivative work based on *The Last Guildmaster* core engine must include a clear and readable attribution notice, for example:
   > *"This mod is built using The Last Guildmaster Engine, licensed under the Apache License 2.0."*
2. **Preserve Notices**: You must retain all existing copyright, patent, trademark, and attribution notices from the core engine's source files.
3. **Mark Modifications**: Modified source files must include prominent notices stating that you changed those files.
4. **NOTICE File**: If distributed as a binary, include a copy of the `NOTICE` or `LICENSE` file with your distribution.

Failure to attribute the core engine is a violation of the Apache License 2.0 and these policies.

## 4. Mod Distribution Guidelines

- Mods distributed publicly should include a `README.md` describing their purpose, dependencies, and version compatibility.
- Mods must not bundle or redistribute the core engine source without proper attribution.
- Community mod hubs and forums may establish their own additional guidelines.

---

# Document 3: Privacy Policy

> **📋 Summary for Humans**
> We collect very little data — just basic hardware info for performance, crash logs to fix bugs, and your local save data. We don't sell your data. You can ask us to delete it. If you are under 13 (or 16 in the EU), please do not play.

---

## 1. Introduction

The developers of *The Last Guildmaster* ("we", "us", "our") are committed to protecting your privacy. This Privacy Policy explains what data we may collect, how we use it, and your rights regarding that data.

This policy is written to comply with the **General Data Protection Regulation (GDPR)**, the **California Consumer Privacy Act (CCPA 2026 revision)**, and applicable international privacy standards.

**Effective Date**: April 15, 2026

## 2. Data We Collect

We collect only the minimum data necessary for the Game to function and improve:

| Data Type | Purpose | Storage Location | Shared? |
|-----------|---------|-----------------|---------|
| **Basic Hardware Specs** | Performance optimization (GPU model, RAM, OS version) | Local device only | No |
| **Crash Logs** | Debugging and stability improvements | Local device + optional opt-in report | Only if you opt in |
| **Local Save Data** | Preserving your game progress | Local device (`%APPDATA%\the-last-guildmaster`) | No |

**We do not collect**:
- Your name, email address, or any personal identifiers
- Online activity, browsing history, or cross-app data
- Payment information

## 3. How We Use Your Data

- **Hardware specs** are read locally at startup to adjust default graphics settings. They are not transmitted without your explicit consent.
- **Crash logs** are stored locally. If you choose to submit a bug report, logs may be shared with us for debugging purposes only.
- **Save data** never leaves your device.

## 4. Data Sharing and Third Parties

We do not sell, trade, or rent your personal data to third parties.

If you have installed third-party mods, those mods operate under their own data practices. We are not responsible for data collected by third-party modules. Refer to each mod's own privacy documentation.

## 5. Your Rights

Depending on your jurisdiction, you have the following rights:

### Right to Access
You may request a summary of any data associated with your use of the Game.

### Right to Deletion ("Right to be Forgotten")
You have the right to request deletion of any data we hold about you. To exercise this right:
1. Delete your local save data from `%APPDATA%\the-last-guildmaster\`.
2. Contact us at **[your-contact@email.com]** with Subject: "Data Deletion Request".
3. We will process your request within **30 days** and confirm deletion.

### Right to Portability
You may export your local save data at any time by copying the files from the save location listed in Section 2.

### Right to Object / Opt Out
You may opt out of crash log reporting in the Game's Settings menu at any time. No data that requires opt-out is collected by default.

## 6. Minor Protection Clause

> **⚠️ Age Restriction**
>
> *The Last Guildmaster* is **not intended for users under the age of 13** (or **under the age of 16** in the European Union and countries following EU GDPR standards).
>
> By using this Game, you confirm that you meet the minimum age requirement for your jurisdiction. If you are a parent or guardian and believe your child has used this Game in violation of this clause, please contact us immediately at **[your-contact@email.com]** for data deletion.

We do not knowingly collect any data from minors. If we become aware that a minor has provided us with data, we will delete it promptly.

## 7. Data Security

We take reasonable measures to protect any data stored on your device. However, as the Game is a local application, the security of your data also depends on the security of your own device and operating system.

## 8. Changes to This Policy

We may update this Privacy Policy as the Game develops. When changes are made, we will update the "Effective Date" at the top of this document. Continued use of the Game after changes constitutes your acceptance.

## 9. Contact

For privacy-related inquiries, data deletion requests, or questions about these policies:

📧 **[your-contact@email.com]**
🌐 **[your-project-homepage-url]**

---

*The Last Guildmaster · Open Source under Apache License 2.0 · v0.1.0*
