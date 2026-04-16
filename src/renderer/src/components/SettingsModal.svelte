<script lang="ts">
  import { onMount } from 'svelte'
  import { Game } from '../lib/stores/game.svelte'
  import { Logger } from '../lib/logger'

  interface Props {
    onclose: () => void
    showToast: (msg: string) => void
  }

  let { onclose, showToast }: Props = $props()

  let activeTab = $state('general')
  let volume = $state(parseInt(localStorage.getItem('tlg_volume_master') || '80'))
  let music = $state(parseInt(localStorage.getItem('tlg_volume_music') || '60'))
  let fx = $state(parseInt(localStorage.getItem('tlg_volume_fx') || '70'))
  let crashLog = $state(localStorage.getItem('tlg_crash_log') === '1')
  let debugConsole = $state(localStorage.getItem('tlg_debug_console') === '1')
  let windowMode = $state(localStorage.getItem('tlg_window_mode') || 'fullscreen')
  let resolution = $state(localStorage.getItem('tlg_resolution') || '1920x1080')
  let autoSaveInterval = $state(localStorage.getItem('tlg_autosave_interval') || '30')

  let resDisabled = $derived(windowMode === 'fullscreen')

  const settingsTabs = [
    { id: 'general', icon: '⚙', label: 'General' },
    { id: 'audio', icon: '🔊', label: 'Audio' },
    { id: 'video', icon: '👁', label: 'Video' },
    { id: 'gameplay', icon: '⚔', label: 'Gameplay' }
  ]

  function handleSave() {
    Game.save()
    showToast('Guild archives updated manually.')
  }

  function applySettings() {
    localStorage.setItem('tlg_volume_master', String(volume))
    localStorage.setItem('tlg_volume_music', String(music))
    localStorage.setItem('tlg_volume_fx', String(fx))
    localStorage.setItem('tlg_crash_log', crashLog ? '1' : '0')
    localStorage.setItem('tlg_debug_console', debugConsole ? '1' : '0')
    localStorage.setItem('tlg_window_mode', windowMode)
    localStorage.setItem('tlg_resolution', resolution)
    localStorage.setItem('tlg_autosave_interval', autoSaveInterval)

    // Sync with Game state
    Game.state.debugConsole = debugConsole
    Game.state.autoSaveInterval = parseInt(autoSaveInterval)
    Game.startAutoSaveTimer()
    Game.save()

    // Apply Window Settings via Electron
    if (window.electronAPI) {
      window.electronAPI.setWindowMode(windowMode)
      if (windowMode === 'windowed') {
        const [w, h] = resolution.split('x').map(Number)
        window.electronAPI.setResolution(w, h)
      }
    }

    Logger.info('New settings configuration applied.')
    showToast('Configuration Applied')
  }

  function handleBackdropClick() {
    onclose()
  }
</script>

<!-- Your exact #settings-modal HTML from index.html -->
<div id="settings-modal" class="overlay visible" aria-modal="true" role="dialog" aria-labelledby="settings-title">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-backdrop" onclick={handleBackdropClick}></div>
    <div class="sub-modal settings-modal-obsidian glass-panel">
        <div class="sub-modal-header">
            <div class="header-title-group">
                <span class="header-icon">⚙</span>
                <h2 id="settings-title">Guild Configuration</h2>
            </div>
            <button class="modal-close-btn" aria-label="Close" onclick={onclose}>✕</button>
        </div>

        <div class="sub-modal-body settings-layout">
            <nav class="settings-tabs" role="tablist">
                {#each settingsTabs as tab}
                    <button
                        class="settings-tab"
                        class:active={activeTab === tab.id}
                        onclick={() => activeTab = tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                    >
                        <span class="tab-icon">{tab.icon}</span>
                        <span class="tab-text">{tab.label}</span>
                    </button>
                {/each}
            </nav>

            <div class="settings-content">
                <!-- General Category -->
                <div id="settings-general-panel" class="settings-panel" class:active={activeTab === 'general'} role="tabpanel">
                    <div class="settings-group-header">Guild Management</div>

                    <div class="setting-row">
                        <div class="setting-info">
                            <label>Manual Chronography</label>
                            <p class="setting-desc">Instantly record your guild's progress to the archives.</p>
                        </div>
                        <div class="setting-control">
                            <button class="btn-primary-mini" onclick={handleSave}>Save Game</button>
                        </div>
                    </div>

                    <div class="setting-row">
                        <div class="setting-info">
                            <label for="setting-autosave-interval">Auto-Save Frequency</label>
                            <p class="setting-desc">How often the world state is backed up automatically.</p>
                        </div>
                        <div class="setting-control">
                            <select id="setting-autosave-interval" class="styled-select" bind:value={autoSaveInterval}>
                                <option value="0">Disabled</option>
                                <option value="5">Every 5 Minutes</option>
                                <option value="10">Every 10 Minutes</option>
                                <option value="30">Every 30 Minutes</option>
                                <option value="60">Every 1 Hour</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Audio Category -->
                <div id="settings-audio-panel" class="settings-panel" class:active={activeTab === 'audio'} role="tabpanel">
                    <div class="settings-group-header">Acoustics</div>
                    <div class="setting-row">
                        <div class="setting-info">
                            <label for="setting-volume">Master Volume</label>
                            <p class="setting-desc">Overall sound level of the realm.</p>
                        </div>
                        <div class="setting-control">
                            <input type="range" id="setting-volume" min="0" max="100" class="styled-range" bind:value={volume}>
                            <span class="setting-value">{volume}%</span>
                        </div>
                    </div>
                    <div class="setting-row">
                        <div class="setting-info">
                            <label for="setting-music">Atmospheric Music</label>
                            <p class="setting-desc">Volume of the background orchestrations.</p>
                        </div>
                        <div class="setting-control">
                            <input type="range" id="setting-music" min="0" max="100" class="styled-range" bind:value={music}>
                            <span class="setting-value">{music}%</span>
                        </div>
                    </div>
                    <div class="setting-row">
                        <div class="setting-info">
                            <label for="setting-fx">Sound Effects</label>
                            <p class="setting-desc">Volume of combat and interface sounds.</p>
                        </div>
                        <div class="setting-control">
                            <input type="range" id="setting-fx" min="0" max="100" class="styled-range" bind:value={fx}>
                            <span class="setting-value">{fx}%</span>
                        </div>
                    </div>
                </div>

                <!-- Video Category -->
                <div id="settings-video-panel" class="settings-panel" class:active={activeTab === 'video'} role="tabpanel">
                    <div class="settings-group-header">Visuals & Display</div>
                    <div class="setting-row">
                        <div class="setting-info">
                            <label for="setting-window-mode">Display Mode</label>
                            <p class="setting-desc">How the portal to this world is rendered.</p>
                        </div>
                        <select id="setting-window-mode" class="styled-select" bind:value={windowMode}>
                            <option value="fullscreen">Fullscreen</option>
                            <option value="windowed">Windowed</option>
                        </select>
                    </div>
                    <div class="setting-row" id="resolution-row">
                        <div class="setting-info">
                            <label for="setting-resolution">Resolution</label>
                            <p class="setting-desc">Clarity of the visuals (Windowed only).</p>
                        </div>
                        <select id="setting-resolution" class="styled-select" bind:value={resolution} disabled={resDisabled}>
                            <option value="1280x720">1280 x 720</option>
                            <option value="1280x800">1280 x 800</option>
                            <option value="1366x768">1366 x 768</option>
                            <option value="1440x900">1440 x 900</option>
                            <option value="1600x900">1600 x 900</option>
                            <option value="1920x1080">1920 x 1080</option>
                            <option value="1920x1200">1920 x 1200</option>
                            <option value="2560x1440">2560 x 1440</option>
                        </select>
                    </div>
                </div>

                <!-- Gameplay Category -->
                <div id="settings-gameplay-panel" class="settings-panel" class:active={activeTab === 'gameplay'} role="tabpanel">
                    <div class="settings-group-header">Chronicles & Safety</div>
                    <div class="setting-row">
                        <div class="setting-info">
                            <label for="setting-crash-log">Report Transmissions</label>
                            <p class="setting-desc">Send scroll logs if the game collapses.</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="setting-crash-log" bind:checked={crashLog}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-row">
                        <div class="setting-info">
                            <label for="setting-debug-console">Developer Debug Console</label>
                            <p class="setting-desc">Open an external console for real-time logs (Modders only).</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="setting-debug-console" bind:checked={debugConsole}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div class="sub-modal-footer settings-footer-ornamental">
            <button class="btn-ghost" onclick={onclose}>Discard Changes</button>
            <button class="btn-primary" onclick={applySettings}>Apply Configuration</button>
        </div>
    </div>
</div>
