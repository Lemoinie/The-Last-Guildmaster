<script lang="ts">
  import MainMenu from './components/MainMenu.svelte'
  import LegalOverlay from './components/LegalOverlay.svelte'
  import SettingsModal from './components/SettingsModal.svelte'
  import CreditsModal from './components/CreditsModal.svelte'
  import GameApp from './components/GameApp.svelte'
  import Toast from './components/Toast.svelte'
  import DevBubble from './components/DevBubble.svelte'
  import { Game } from './lib/stores/game.svelte'

  let currentScreen = $state<'menu' | 'game'>('menu')
  let showLegal = $state(false)
  let showSettings = $state(false)
  let showCredits = $state(false)
  let toastMessage = $state('')
  let toastVisible = $state(false)

  // Dev mode — reactive, driven by Game.state so any settings modal updates it instantly
  const devMode = $derived(Game.state.devMode)

  function showToast(message: string) {
    toastMessage = message
    toastVisible = true
    setTimeout(() => { toastVisible = false }, 2000)
  }

  function handlePlay() {
    const tosAccepted = localStorage.getItem('tlg_tos_accepted_v1') === '1'
    if (!tosAccepted) {
      showLegal = true
      return
    }
    currentScreen = 'game'
  }

  function handleBackToMenu() {
    currentScreen = 'menu'
  }
</script>

<!-- Screens (base layer) -->
{#if currentScreen === 'menu'}
  <MainMenu
    onplay={handlePlay}
    onsettings={() => showSettings = true}
    oncredits={() => showCredits = true}
    onlegal={() => showLegal = true}
  />
{/if}

{#if currentScreen === 'game'}
  <GameApp onbacktomenu={handleBackToMenu} {showToast} />
{/if}

<!-- Modals (on top of screens) -->
{#if showSettings}
  <SettingsModal
    onclose={() => showSettings = false}
    {showToast}
  />
{/if}

{#if showCredits}
  <CreditsModal onclose={() => showCredits = false} />
{/if}

{#if showLegal}
  <LegalOverlay
    onclose={() => showLegal = false}
    onaccept={() => showLegal = false}
    {showToast}
  />
{/if}

<!-- Dev Bubble — only shown during game, only when Dev Mode is active -->
{#if devMode && currentScreen === 'game'}
  <DevBubble {showToast} />
{/if}

{#if toastVisible}
  <Toast message={toastMessage} />
{/if}
