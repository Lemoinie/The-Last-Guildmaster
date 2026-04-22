<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { Game } from '../lib/stores/game.svelte'
  import { GameEngine } from '../lib/engine'
  import { Logger } from '../lib/logger'
  import SettingsModal from './SettingsModal.svelte'

  interface Props {
    onbacktomenu: () => void
    showToast: (msg: string) => void
  }

  let { onbacktomenu, showToast }: Props = $props()

  let showSettings = $state(false)

  let currentView = $state('tavern')
  let viewHtml = $state('')

  const navButtons = [
    { id: 'tavern', icon: '⚔', label: 'Tavern' },
    { id: 'inn', icon: '🛏', label: 'Inn' },
    { id: 'storage', icon: '📦', label: 'Storage' },
    { id: 'expedition', icon: '🗺', label: 'Expeditions' },
    { id: 'market', icon: '🏪', label: 'Market' },
    { id: 'blacksmith', icon: '🔨', label: 'Blacksmith' },
    { id: 'garden', icon: '🌿', label: 'Garden' },
    { id: 'alchemist', icon: '⚗', label: 'Alchemist' },
    { id: 'church', icon: '🕯', label: 'Church' }
  ]

  const NAMES = ['Aldric', 'Elowen', 'Kael', 'Lyra', 'Brom', 'Sera', 'Varis']

  onMount(async () => {
    await Game.load()
    GameEngine.start()
    Logger.system('Starting new game session.')
    switchView('tavern')
  })

  onDestroy(() => {
    GameEngine.stop()
  })

  function switchView(viewId: string) {
    Logger.info(`Navigating to ${viewId}`)
    currentView = viewId
    renderView()
  }

  function renderView() {
    const state = Game.state
    switch (currentView) {
      case 'tavern':
        viewHtml = `
          <div class="view-header">
            <h2 class="view-title">The Rusty Goblet</h2>
            <p class="view-description">Recruit brave souls for your guild.</p>
          </div>
          <div class="grid-container">
            <div class="item-card">
              <h3>Common Adventurer</h3>
              <p>Basic stats, high availability.</p>
              <p class="accent-text">Cost: 100 Gold</p>
              <button class="action-btn" id="recruit-btn">Recruit</button>
            </div>
          </div>`
        setTimeout(() => {
          document.getElementById('recruit-btn')?.addEventListener('click', () => recruit())
        }, 0)
        break
      case 'inn':
        const list = state.adventurers.length > 0
          ? state.adventurers.map(adv => `<div class="item-card"><h3>${adv.name}</h3><p>Level ${adv.level} ${adv.class}</p></div>`).join('')
          : '<p>No adventurers recruited yet.</p>'
        viewHtml = `
          <div class="view-header">
            <h2 class="view-title">The Cozy Rest</h2>
            <p class="view-description">Manage your roster of heroes.</p>
          </div>
          <div class="grid-container">${list}</div>`
        break
      case 'storage':
        const resources = Object.entries(state.inventory).map(([key, val]) => `
          <div class="item-card">
            <h3>${key.charAt(0).toUpperCase() + key.slice(1)}</h3>
            <p class="value">${val}</p>
          </div>`).join('')
        viewHtml = `
          <div class="view-header">
            <h2 class="view-title">Guild Vault</h2>
            <p class="view-description">Items and resources gathered from expeditions.</p>
          </div>
          <div class="grid-container">${resources}</div>`
        break
      case 'expedition':
        const missions = [
          { id: 1, name: 'Forest Patrol', difficulty: 'Easy', time: 60, reward: 'Wood, Herbs' },
          { id: 2, name: 'Iron Mine Delve', difficulty: 'Medium', time: 300, reward: 'Iron, Stone' }
        ]
        const missionList = missions.map(m => `
          <div class="item-card">
            <h3>${m.name}</h3>
            <p>Diff: ${m.difficulty}</p>
            <p>Duration: ${m.time}s</p>
            <p class="accent-text">Reward: ${m.reward}</p>
            <button class="action-btn">Deploy</button>
          </div>`).join('')
        viewHtml = `
          <div class="view-header">
            <h2 class="view-title">Expedition Board</h2>
            <p class="view-description">Send your teams to gather resources.</p>
          </div>
          <div class="grid-container">${missionList}</div>`
        break
      case 'blacksmith':
        viewHtml = `
          <div class="view-header">
            <h2 class="view-title">The Iron Anvil</h2>
            <p class="view-description">Forge weapons and armor for your heroes.</p>
          </div>
          <div class="grid-container">
            <div class="item-card">
              <h3>Iron Sword</h3>
              <p>Requirements: 5 Iron, 2 Wood</p>
              <button class="action-btn">Forge</button>
            </div>
          </div>`
        break
      default:
        viewHtml = `
          <div class="view-header">
            <h2 class="view-title">${currentView.charAt(0).toUpperCase() + currentView.slice(1)}</h2>
            <p class="view-description">This building is currently under construction...</p>
          </div>`
    }
  }

  function recruit() {
    const state = Game.state
    if (state.gold >= 100 && state.adventurers.length < state.maxAdventurers) {
      state.gold -= 100
      state.adventurers.push({
        name: NAMES[Math.floor(Math.random() * NAMES.length)] + ' ' + Math.floor(Math.random() * 99),
        class: 'Squire',
        level: 1,
        id: Date.now()
      })
      showToast('A new adventurer has joined the guild!')
      renderView()
    } else if (state.gold < 100) {
      showToast('Not enough gold!')
    } else {
      showToast('Guild is full!')
    }
  }
</script>

<!-- Game App Shell -->
<div id="game-app">
    <!-- Sidebar Navigation -->
    <aside id="sidebar" class="glass-panel">
        <div class="logo">
            <h1>Guildmaster</h1>
        </div>
        <nav>
            {#each navButtons as btn}
                <button
                    class="nav-btn"
                    class:active={currentView === btn.id}
                    onclick={() => switchView(btn.id)}
                >{btn.icon} {btn.label}</button>
            {/each}
        </nav>
        <div class="sidebar-footer">
            <button class="sidebar-menu-btn" id="open-settings-btn" title="Settings" onclick={() => showSettings = true}>⚙ Settings</button>
            <button class="sidebar-menu-btn" id="back-to-menu-btn" title="Return to Main Menu" onclick={onbacktomenu}>☰ Menu</button>
        </div>
    </aside>

    <!-- Main Content Area -->
    <main id="main-content">
        <header id="top-bar" class="glass-panel">
            <div class="resource-pill">
                <span class="label">Gold:</span>
                <span id="gold-value" class="value accent-text">{Math.floor(Game.state.gold)}</span>
            </div>
            <div class="resource-pill">
                <span class="label">Renown:</span>
                <span id="renown-value" class="value">{Game.state.renown}</span>
            </div>
            <div class="resource-pill">
                <span class="label">Adventurers:</span>
                <span id="adventurer-count" class="value">{Game.state.adventurers.length} / {Game.state.maxAdventurers}</span>
            </div>
        </header>

        <section id="view-container" class="glass-panel bg-{currentView}">
            {@html viewHtml}
        </section>
    </main>

    <!-- Notification Toast System -->
    <div id="notification-container"></div>
</div>

{#if showSettings}
  <SettingsModal
    onclose={() => showSettings = false}
    {showToast}
  />
{/if}

<style>
    #notification-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 1000;
    }
    :global(.action-btn) {
        margin-top: 15px;
        background: var(--accent-primary);
        border: none;
        color: black;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
        width: 100%;
        transition: filter 0.2s;
    }
    :global(.action-btn:hover) {
        filter: brightness(1.2);
    }
</style>
