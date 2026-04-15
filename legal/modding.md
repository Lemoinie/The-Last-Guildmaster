# Document 2: Operations & Modding Policy

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
