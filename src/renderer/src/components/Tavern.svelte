<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { Tavern, type PendingRecruit } from '../lib/game/tavern.svelte'
  import { Game } from '../lib/stores/game.svelte'
  import { STONE_GRADE_CONFIG, type StoneGrade } from '../lib/adventurer/items.svelte'
  import { RARITY_CONFIG } from '../lib/adventurer/items.svelte'

  interface Props {
    showToast: (msg: string) => void
  }

  let { showToast }: Props = $props()

  const STONE_GRADES: StoneGrade[] = ['crude', 'refined', 'arcane', 'legendary']

  // Active tab: 'income' | 'recruits' | 'summon'
  let activeTab = $state<'income' | 'recruits' | 'summon'>('recruits')

  // Countdown for next passive recruit wave
  let nextRecruitIn = $state('')

  let countdownInterval: ReturnType<typeof setInterval> | null = null

  // --- Derived from Tavern store ---
  const renown = $derived(Game.state.renown)
  const patronsThisTick = $derived(Tavern.calcPatrons(renown))
  const goldPerTick = $derived(patronsThisTick * 2)

  function updateCountdown() {
    const remaining = Tavern.lastPassiveRecruitAt + Tavern.passiveRecruitIntervalMs - Date.now()
    if (remaining <= 0) {
      nextRecruitIn = 'Adventurers are at the door!'
      return
    }
    const h = Math.floor(remaining / 3_600_000)
    const m = Math.floor((remaining % 3_600_000) / 60_000)
    const s = Math.floor((remaining % 60_000) / 1_000)
    nextRecruitIn = `${h}h ${m}m ${s}s`
  }

  onMount(() => {
    // Process offline income catch-up
    const offlineGold = Tavern.processOfflineIncome(Game.state.renown)
    if (offlineGold > 0) {
      Game.state.gold += offlineGold
      showToast(`The tavern earned ${offlineGold}g while you were away!`)
    }

    // Check if passive recruits arrived while offline
    const arrived = Tavern.checkPassiveRecruits(Game.state.renown)
    if (arrived.length > 0) {
      showToast(`${arrived.length} adventurer${arrived.length > 1 ? 's' : ''} are waiting in the tavern!`)
      activeTab = 'recruits'
    }

    // Start live timers
    Tavern.start(
      () => Game.state.renown,
      (gold) => { Game.state.gold += gold },
      (recruits) => {
        showToast(`${recruits.length} new adventurer${recruits.length > 1 ? 's' : ''} arrived!`)
      }
    )

    // Start countdown display
    updateCountdown()
    countdownInterval = setInterval(updateCountdown, 1000)
  })

  onDestroy(() => {
    Tavern.stop()
    if (countdownInterval) clearInterval(countdownInterval)
  })

  function handleAccept(recruit: PendingRecruit) {
    if (Game.state.adventurers.length >= Game.state.maxAdventurers) {
      showToast('The inn is full! Dismiss someone first.')
      return
    }
    const char = Tavern.acceptRecruit(recruit.id)
    if (char) {
      // Add to the legacy game state roster (simple format for now)
      Game.state.adventurers.push({
        name: char.name,
        class: char.jobId,
        level: char.level,
        id: Date.now()
      })
      showToast(`${char.name} joined the guild!`)
    }
  }

  function handleDismiss(recruit: PendingRecruit) {
    Tavern.dismissRecruit(recruit.id)
  }

  function handleSummon(grade: StoneGrade) {
    const stone = Tavern.summoningStones[grade]
    if (stone.quantity <= 0) {
      showToast(`No ${STONE_GRADE_CONFIG[grade].label}s remaining.`)
      return
    }
    if (Game.state.adventurers.length >= Game.state.maxAdventurers) {
      showToast('The inn is full! Dismiss someone first.')
      return
    }
    const char = Tavern.summon(grade)
    if (char) {
      Game.state.adventurers.push({
        name: char.name,
        class: char.jobId,
        level: char.level,
        id: Date.now()
      })
      showToast(`${char.name} answered the summon!`)
    }
  }

  function formatTime(ms: number): string {
    const h = Math.floor(ms / 3_600_000)
    const m = Math.floor((ms % 3_600_000) / 60_000)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }
</script>

<div class="tavern-view">
  <!-- Header -->
  <div class="view-header">
    <div class="view-title-group">
      <h2 class="view-title">🍺 The Rusty Goblet</h2>
      <p class="view-description">A warm tavern that draws adventurers from across the land.</p>
    </div>
    <div class="tavern-stats-row">
      <div class="stat-chip">
        <span class="chip-icon">⭐</span>
        <span class="chip-label">Renown</span>
        <span class="chip-value">{renown}</span>
      </div>
      <div class="stat-chip">
        <span class="chip-icon">🍺</span>
        <span class="chip-label">Patrons/tick</span>
        <span class="chip-value">{patronsThisTick}</span>
      </div>
      <div class="stat-chip">
        <span class="chip-icon">💰</span>
        <span class="chip-label">Income/tick</span>
        <span class="chip-value">+{goldPerTick}g</span>
      </div>
      <div class="stat-chip">
        <span class="chip-icon">📊</span>
        <span class="chip-label">Total Earned</span>
        <span class="chip-value">{Tavern.totalGoldEarned}g</span>
      </div>
    </div>
  </div>

  <!-- Tab Navigation -->
  <div class="tavern-tabs">
    <button class="tavern-tab" class:active={activeTab === 'recruits'} onclick={() => activeTab = 'recruits'}>
      <span class="tab-icon">🚪</span>
      Walk-ins
      {#if Tavern.pendingRecruits.length > 0}
        <span class="tab-badge">{Tavern.pendingRecruits.length}</span>
      {/if}
    </button>
    <button class="tavern-tab" class:active={activeTab === 'summon'} onclick={() => activeTab = 'summon'}>
      <span class="tab-icon">🔮</span>
      Summon
      {#if Tavern.totalStones > 0}
        <span class="tab-badge">{Tavern.totalStones}</span>
      {/if}
    </button>
    <button class="tavern-tab" class:active={activeTab === 'income'} onclick={() => activeTab = 'income'}>
      <span class="tab-icon">📜</span>
      Ledger
    </button>
  </div>

  <!-- ─── TAB: Walk-in Recruits ──────────────────────────────────────────────── -->
  {#if activeTab === 'recruits'}
    <div class="tab-content">
      <!-- Timer -->
      <div class="recruit-timer-card glass-panel">
        <div class="timer-left">
          <span class="timer-icon">⏳</span>
          <div>
            <div class="timer-label">Next wave arrives in</div>
            <div class="timer-value">{nextRecruitIn}</div>
          </div>
        </div>
        <div class="timer-right">
          <div class="timer-detail">Wave size: {Tavern.calcPatrons(renown) > 0 ? `${1 + Math.floor(renown / 200)} adventurer${(1 + Math.floor(renown / 200)) > 1 ? 's' : ''}` : '—'}</div>
          <div class="timer-detail">Interval: {formatTime(Tavern.passiveRecruitIntervalMs)}</div>
        </div>
      </div>

      <!-- Pending recruits -->
      {#if Tavern.pendingRecruits.length === 0}
        <div class="empty-state">
          <span class="empty-icon">🪑</span>
          <p>The tavern is quiet. No adventurers waiting to join.</p>
        </div>
      {:else}
        <div class="recruits-grid">
          {#each Tavern.pendingRecruits as recruit (recruit.id)}
            <div class="recruit-card glass-panel" style="--rarity-color: {RARITY_CONFIG[recruit.rarity].color}">
              <div class="recruit-rarity-bar"></div>
              <div class="recruit-header">
                <div class="recruit-identity">
                  <span class="recruit-rarity-badge" style="color: {RARITY_CONFIG[recruit.rarity].color}">
                    {RARITY_CONFIG[recruit.rarity].label}
                  </span>
                  <h3 class="recruit-name">{recruit.character.name}</h3>
                  <span class="recruit-meta">
                    Lv.{recruit.character.level} {recruit.character.job.icon} {recruit.character.job.name}
                    {#if recruit.character.attributes.trait}
                      · {recruit.character.attributes.trait.name}
                    {/if}
                  </span>
                </div>
                <div class="recruit-expires">
                  expires {new Date(recruit.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <!-- Quick stat peek -->
              <div class="recruit-stats">
                <div class="recruit-stat"><span>STR</span><strong>{recruit.character.attributes.totalStr}</strong></div>
                <div class="recruit-stat"><span>INT</span><strong>{recruit.character.attributes.totalInt}</strong></div>
                <div class="recruit-stat"><span>DEX</span><strong>{recruit.character.attributes.totalDex}</strong></div>
                <div class="recruit-stat"><span>CON</span><strong>{recruit.character.attributes.totalCon}</strong></div>
                <div class="recruit-stat"><span>HP</span><strong>{recruit.character.attributes.maxHp}</strong></div>
              </div>

              <div class="recruit-actions">
                <button class="btn-ghost small" onclick={() => handleDismiss(recruit)}>Dismiss</button>
                <button
                  class="btn-primary small"
                  disabled={Game.state.adventurers.length >= Game.state.maxAdventurers}
                  onclick={() => handleAccept(recruit)}
                >
                  Accept
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- ─── TAB: Summoning ─────────────────────────────────────────────────────── -->
  {#if activeTab === 'summon'}
    <div class="tab-content">
      <p class="summon-intro">
        Spend a Summoning Stone to immediately call an adventurer to your guild.
        Higher-grade stones attract more powerful heroes.
      </p>

      <div class="stones-grid">
        {#each STONE_GRADES as grade}
          {@const cfg = STONE_GRADE_CONFIG[grade]}
          {@const stone = Tavern.summoningStones[grade]}
          <div class="stone-card glass-panel" class:empty={stone.quantity <= 0}>
            <div class="stone-icon" style="color: {cfg.color}">{cfg.icon}</div>
            <div class="stone-info">
              <div class="stone-name" style="color: {cfg.color}">{cfg.label}</div>
              <div class="stone-desc">{cfg.description}</div>
              <div class="stone-pool">
                Pool: {cfg.rarityPool.map(r => RARITY_CONFIG[r].label).join(', ')}
              </div>
            </div>
            <div class="stone-actions">
              <div class="stone-count">{stone.quantity} remaining</div>
              <button
                class="btn-primary small"
                disabled={stone.quantity <= 0 || Game.state.adventurers.length >= Game.state.maxAdventurers}
                onclick={() => handleSummon(grade)}
              >
                Summon
              </button>
            </div>
          </div>
        {/each}
      </div>

      <div class="summon-tip glass-panel">
        <span class="tip-icon">💡</span>
        <p>Summoning Stones can be crafted at the Alchemist, found on expeditions, or purchased at the Market.</p>
      </div>
    </div>
  {/if}

  <!-- ─── TAB: Ledger ────────────────────────────────────────────────────────── -->
  {#if activeTab === 'income'}
    <div class="tab-content">
      <div class="ledger-summary glass-panel">
        <div class="ledger-stat"><span>Total Gold Earned</span><strong>{Tavern.totalGoldEarned}g</strong></div>
        <div class="ledger-stat"><span>Total Patrons Served</span><strong>{Tavern.totalPatronsServed}</strong></div>
        <div class="ledger-stat"><span>Current Rate</span><strong>{goldPerTick}g / min</strong></div>
      </div>

      <div class="tavern-log">
        {#if Tavern.log.length === 0}
          <div class="empty-state">
            <span class="empty-icon">📜</span>
            <p>The ledger is empty.</p>
          </div>
        {:else}
          {#each Tavern.log as entry (entry.timestamp)}
            <div class="log-entry log-{entry.type}">
              <span class="log-icon">{entry.icon}</span>
              <span class="log-message">{entry.message}</span>
              <span class="log-time">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .tavern-view {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
  }

  /* --- Header --- */
  .view-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 12px;
  }
  .view-title-group { flex: 1; min-width: 200px; }
  .view-title {
    font-family: 'Cinzel', serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary, #f8fafc);
    margin: 0 0 4px;
  }
  .view-description { color: var(--text-secondary, #94a3b8); font-size: 0.875rem; margin: 0; }

  .tavern-stats-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .stat-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    font-size: 0.8rem;
  }
  .chip-icon { font-size: 1rem; }
  .chip-label { color: var(--text-secondary, #94a3b8); }
  .chip-value { font-weight: 700; color: var(--accent-primary, #7dd3fc); }

  /* --- Tabs --- */
  .tavern-tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    padding-bottom: 0;
  }
  .tavern-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 18px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-secondary, #94a3b8);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    top: 1px;
    font-family: 'Inter', sans-serif;
  }
  .tavern-tab:hover { color: var(--text-primary, #f8fafc); }
  .tavern-tab.active {
    color: var(--accent-primary, #7dd3fc);
    border-bottom-color: var(--accent-primary, #7dd3fc);
  }
  .tab-icon { font-size: 1rem; }
  .tab-badge {
    background: var(--accent-primary, #7dd3fc);
    color: #0f172a;
    font-size: 0.65rem;
    font-weight: 800;
    padding: 1px 6px;
    border-radius: 99px;
    min-width: 18px;
    text-align: center;
  }

  /* --- Tab Content --- */
  .tab-content {
    display: flex;
    flex-direction: column;
    gap: 14px;
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  /* --- Passive Recruit Timer --- */
  .recruit-timer-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    gap: 16px;
  }
  .timer-left { display: flex; align-items: center; gap: 12px; }
  .timer-icon { font-size: 1.5rem; }
  .timer-label { font-size: 0.7rem; color: var(--text-secondary, #94a3b8); text-transform: uppercase; letter-spacing: 1px; }
  .timer-value { font-size: 1.1rem; font-weight: 700; color: var(--accent-primary, #7dd3fc); font-family: 'Cinzel', serif; margin-top: 2px; }
  .timer-right { text-align: right; }
  .timer-detail { font-size: 0.75rem; color: var(--text-secondary, #94a3b8); }

  /* --- Recruits Grid --- */
  .recruits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 14px;
  }
  .recruit-card {
    position: relative;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
    transition: border-color 0.2s ease;
  }
  .recruit-card:hover { border-color: var(--rarity-color, #7dd3fc); }
  .recruit-rarity-bar {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--rarity-color, #94a3b8);
  }
  .recruit-header { display: flex; justify-content: space-between; align-items: flex-start; }
  .recruit-identity { display: flex; flex-direction: column; gap: 3px; }
  .recruit-rarity-badge { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
  .recruit-name { font-family: 'Cinzel', serif; font-size: 1rem; font-weight: 700; color: var(--text-primary, #f8fafc); margin: 0; }
  .recruit-meta { font-size: 0.75rem; color: var(--text-secondary, #94a3b8); }
  .recruit-expires { font-size: 0.65rem; color: var(--text-secondary, #94a3b8); text-align: right; white-space: nowrap; }

  .recruit-stats { display: flex; gap: 12px; }
  .recruit-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .recruit-stat span { font-size: 0.6rem; color: var(--text-secondary, #94a3b8); text-transform: uppercase; letter-spacing: 0.5px; }
  .recruit-stat strong { font-size: 0.85rem; color: var(--text-primary, #f8fafc); }

  .recruit-actions { display: flex; gap: 8px; justify-content: flex-end; }

  /* --- Summon --- */
  .summon-intro { color: var(--text-secondary, #94a3b8); font-size: 0.875rem; margin: 0; }
  .stones-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }
  .stone-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    border: 1px solid rgba(255,255,255,0.08);
    transition: all 0.2s ease;
  }
  .stone-card.empty { opacity: 0.45; }
  .stone-icon { font-size: 2rem; flex-shrink: 0; }
  .stone-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .stone-name { font-weight: 700; font-size: 0.9rem; }
  .stone-desc { font-size: 0.75rem; color: var(--text-secondary, #94a3b8); }
  .stone-pool { font-size: 0.65rem; color: var(--text-secondary, #94a3b8); }
  .stone-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
  .stone-count { font-size: 0.75rem; color: var(--text-secondary, #94a3b8); }

  .summon-tip {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    font-size: 0.8rem;
    color: var(--text-secondary, #94a3b8);
  }
  .tip-icon { font-size: 1.1rem; flex-shrink: 0; }

  /* --- Ledger --- */
  .ledger-summary {
    display: flex;
    gap: 0;
    padding: 0;
    overflow: hidden;
    border-radius: var(--radius-lg, 12px);
  }
  .ledger-stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    gap: 4px;
    border-right: 1px solid rgba(255,255,255,0.06);
  }
  .ledger-stat:last-child { border-right: none; }
  .ledger-stat span { font-size: 0.7rem; color: var(--text-secondary, #94a3b8); text-transform: uppercase; letter-spacing: 1px; }
  .ledger-stat strong { font-size: 1.1rem; color: var(--accent-primary, #7dd3fc); font-weight: 700; }

  .tavern-log {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    overflow-y: auto;
  }
  .log-entry {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 6px;
    background: rgba(255,255,255,0.03);
    font-size: 0.8rem;
    border-left: 2px solid transparent;
  }
  .log-income  { border-left-color: #fbbf24; }
  .log-recruit { border-left-color: #4ade80; }
  .log-summon  { border-left-color: #60a5fa; }
  .log-info    { border-left-color: #94a3b8; }
  .log-icon { font-size: 1rem; flex-shrink: 0; }
  .log-message { flex: 1; color: var(--text-primary, #f8fafc); }
  .log-time { color: var(--text-secondary, #94a3b8); font-size: 0.7rem; white-space: nowrap; }

  /* --- Shared --- */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 60px 20px;
    color: var(--text-secondary, #94a3b8);
    text-align: center;
  }
  .empty-icon { font-size: 2.5rem; opacity: 0.5; }

  /* --- Buttons (local overrides for size) --- */
  :global(.btn-primary.small), :global(.btn-ghost.small) {
    font-size: 0.78rem;
    padding: 6px 14px;
    border-radius: 6px;
  }
</style>
