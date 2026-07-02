<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { Game } from '../lib/stores/game.svelte'
  import { GameEngine } from '../lib/engine'
  import { Logger } from '../lib/logger'
  import SettingsModal from './SettingsModal.svelte'
  
  // Views
  import Tavern from './Tavern.svelte'
  import Inn from './views/Inn.svelte'
  import Storage from './views/Storage.svelte'
  import Expedition from './views/Expedition.svelte'
  import Blacksmith from './views/Blacksmith.svelte'
  import UnderConstruction from './views/UnderConstruction.svelte'

  interface Props {
    onbacktomenu: () => void
    showToast: (msg: string) => void
  }

  let { onbacktomenu, showToast }: Props = $props()

  let showSettings = $state(false)
  let currentView = $state('tavern')

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

  onMount(async () => {
    await Game.load()
    GameEngine.start()
    Logger.system('Starting new game session.')
  })

  onDestroy(() => {
    GameEngine.stop()
  })

  function switchView(viewId: string) {
    Logger.info(`Navigating to ${viewId}`)
    currentView = viewId
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
                <span id="gold-value" class="value accent-text">{Math.floor(Game.state.economy.gold)}</span>
            </div>
            <div class="resource-pill">
                <span class="label">Renown:</span>
                <span id="renown-value" class="value">{Game.state.economy.renown}</span>
            </div>
            <div class="resource-pill">
                <span class="label">Adventurers:</span>
                <span id="adventurer-count" class="value">{Game.state.roster.length} / {Game.state.settings.maxAdventurers}</span>
            </div>
        </header>

        <section id="view-container" class="glass-panel bg-{currentView}">
            {#if currentView === 'tavern'}
              <Tavern {showToast} />
            {:else if currentView === 'inn'}
              <Inn />
            {:else if currentView === 'storage'}
              <Storage />
            {:else}
              {#if currentView === 'expedition'}
                <Expedition {showToast} />
              {:else if currentView === 'blacksmith'}
                <Blacksmith {showToast} />
              {:else}
                <UnderConstruction title={currentView.charAt(0).toUpperCase() + currentView.slice(1)} />
              {/if}
            {/if}
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
