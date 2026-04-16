<script lang="ts">
  import { onMount } from 'svelte'
  import { Logger } from '../lib/logger'

  interface Props {
    onplay: () => void
    onsettings: () => void
    oncredits: () => void
    onlegal: () => void
  }

  let { onplay, onsettings, oncredits, onlegal }: Props = $props()

  const APP_VERSION = '0.1.0'
  let updateStatusClass = $state('update-status status-checking')
  let updateStatusHtml = $state('<span class="status-icon">⟳</span> Checking for updates...')

  onMount(() => {
    checkForUpdates()
    if (localStorage.getItem('tlg_debug_console') === '1') {
      window.electronAPI?.openDebugConsole()
    }
  })

  function checkForUpdates() {
    if (!window.electronAPI?.checkForUpdates) return

    window.electronAPI.onUpdateStatus((status: string, version?: string) => {
      switch (status) {
        case 'checking':
          updateStatusClass = 'update-status status-checking'
          updateStatusHtml = '<span class="status-icon">⟳</span> Checking for updates...'
          break
        case 'dev':
          updateStatusClass = 'update-status status-error'
          updateStatusHtml = '<span class="status-icon">⚙</span> Development Build (Update Check Skipped)'
          break
        case 'available':
          updateStatusClass = 'update-status status-update-available'
          updateStatusHtml = `<span class="status-icon">✦</span> v${version} available <button class="btn-mini" id="btn-download-update">Download</button>`
          setTimeout(() => {
            document.getElementById('btn-download-update')?.addEventListener('click', () => {
              window.electronAPI?.downloadUpdate()
            })
          }, 0)
          break
        case 'latest':
          updateStatusClass = 'update-status status-up-to-date'
          updateStatusHtml = `<span class="status-icon">✓</span> Guild is up-to-date (${APP_VERSION})`
          break
        case 'ready':
          updateStatusClass = 'update-status status-update-available'
          updateStatusHtml = `<span class="status-icon">✪</span> Update Ready <button class="btn-primary-mini" id="btn-install-update">Restart</button>`
          setTimeout(() => {
            document.getElementById('btn-install-update')?.addEventListener('click', () => {
              window.electronAPI?.installUpdate()
            })
          }, 0)
          break
        case 'error':
          updateStatusClass = 'update-status status-error'
          updateStatusHtml = '<span class="status-icon">✕</span> Update check failed'
          break
      }
    })

    window.electronAPI.onUpdateProgress((percent: number) => {
      updateStatusClass = 'update-status status-checking'
      updateStatusHtml = `<span class="status-icon">⟳</span> Downloading: ${percent}%`
    })

    window.electronAPI.checkForUpdates()
  }

  function handleExit() {
    if (window.electronAPI?.quit) {
      window.electronAPI.quit()
    } else {
      window.close()
    }
  }

  function handlePlay() {
    Logger.system('Starting new game session.')
    onplay()
  }
</script>

<!-- Your exact #main-menu HTML from index.html -->
<div id="main-menu" class="overlay visible" aria-label="Main Menu">
    <div class="menu-bg-particles" id="particles-canvas"></div>
    <div class="menu-overlay-gradient"></div>

    <div class="menu-content">
        <!-- Title Section -->
        <div class="menu-title-block">
            <div class="menu-title-ornament">⚔</div>
            <h1 class="menu-game-title">The Last<br><span class="title-accent">Guildmaster</span></h1>
            <p class="menu-tagline">Lead. Recruit. Survive.</p>
        </div>

        <!-- Menu Buttons -->
        <nav class="menu-nav" aria-label="Main Menu Navigation">
            <button id="menu-play-btn" class="menu-btn" onclick={handlePlay}>
                <span class="menu-btn-icon">⚔</span>
                <span class="menu-btn-label">Play</span>
                <span class="menu-btn-arrow">→</span>
            </button>
            <button id="menu-settings-btn" class="menu-btn" onclick={onsettings}>
                <span class="menu-btn-icon">⚙</span>
                <span class="menu-btn-label">Settings</span>
                <span class="menu-btn-arrow">→</span>
            </button>
            <button id="menu-credits-btn" class="menu-btn" onclick={oncredits}>
                <span class="menu-btn-icon">📜</span>
                <span class="menu-btn-label">Credits</span>
                <span class="menu-btn-arrow">→</span>
            </button>
            <button id="menu-exit-btn" class="menu-btn menu-btn-danger" onclick={handleExit}>
                <span class="menu-btn-icon">✕</span>
                <span class="menu-btn-label">Exit</span>
                <span class="menu-btn-arrow">→</span>
            </button>
        </nav>

        <!-- Version / Legal Footer -->
        <div class="menu-footer">
            <div class={updateStatusClass}>
                {@html updateStatusHtml}
            </div>
            <div class="menu-footer-info">
                <span class="menu-version">v0.1.0 Early Alpha</span>
                <span class="menu-sep">·</span>
                <span class="menu-license">Apache License 2.0</span>
            </div>
        </div>
    </div>

    <!-- Corner Legal Link -->
    <div class="menu-corner-legal">
        <button class="menu-legal-link" id="menu-legal-btn" title="Re-read Legal Agreements" onclick={onlegal}>⚖</button>
    </div>
</div>
