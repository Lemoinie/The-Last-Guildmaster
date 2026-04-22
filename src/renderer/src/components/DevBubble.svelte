<script lang="ts">
  /**
   * DevBubble.svelte — Developer Mode floating panel
   *
   * A draggable bubble that expands into a dev tools panel.
   * Features: Add Recruit, Edit Reputation, Add Item to Storage.
   * Only renders when devMode is enabled in Settings.
   */
  import { Game } from '../lib/stores/game.svelte'
  import { Tavern } from '../lib/game/tavern.svelte'
  import { Character } from '../lib/adventurer/character.svelte'
  import { JOBS } from '../lib/adventurer/jobs'
  import { TRAITS } from '../lib/adventurer/traits'
  import type { TraitId } from '../lib/adventurer/types'

  interface Props {
    showToast: (msg: string) => void
  }
  let { showToast }: Props = $props()

  // --- Bubble State ---
  let open = $state(false)
  let bubbleX = $state(32)
  let bubbleY = $state(window.innerHeight - 120)

  // --- Drag State ---
  let dragging = false
  let dragOffsetX = 0
  let dragOffsetY = 0
  let hasDragged = false

  function onPointerDown(e: PointerEvent) {
    dragging = true
    hasDragged = false
    dragOffsetX = e.clientX - bubbleX
    dragOffsetY = e.clientY - bubbleY
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging) return
    hasDragged = true
    bubbleX = Math.max(0, Math.min(window.innerWidth - 64, e.clientX - dragOffsetX))
    bubbleY = Math.max(0, Math.min(window.innerHeight - 64, e.clientY - dragOffsetY))
  }

  function onPointerUp() {
    if (dragging && !hasDragged) {
      open = !open  // only toggle if it was a click (not a drag)
    }
    dragging = false
  }

  // ─── Add Recruit ─────────────────────────────────────────────────────────────
  let recruitJobId = $state('squire')
  let recruitTraitId = $state<TraitId | 'none'>('none')
  let recruitLevel = $state(1)

  function addRecruit() {
    const traitId = recruitTraitId === 'none' ? null : recruitTraitId as TraitId
    const char = new Character(
      `Dev-${Date.now().toString(36).slice(-4).toUpperCase()}`,
      recruitJobId,
      traitId
    )
    // Level up to target
    for (let i = 1; i < recruitLevel; i++) {
      char.addXp(50 * Math.pow(i, 1.8))
    }
    // Push directly to pending recruits via Tavern
    Tavern['pendingRecruits'] // access via the returned getter — use the public addStones workaround
    // We inject directly via Game state for simplicity
    Game.state.adventurers.push({
      name: char.name,
      class: char.jobId,
      level: char.level,
      id: Date.now()
    })
    showToast(`Dev: ${char.name} (Lv.${char.level} ${JOBS[recruitJobId]?.name ?? recruitJobId}) added to roster.`)
  }

  // ─── Edit Reputation ─────────────────────────────────────────────────────────
  let reputationValue = $state(Game.state.renown)

  function applyReputation() {
    const val = Math.max(0, Math.floor(reputationValue))
    Game.state.renown = val
    showToast(`Dev: Reputation set to ${val}.`)
  }

  // ─── Add Item ────────────────────────────────────────────────────────────────
  type StorageKey = keyof typeof Game.state.inventory
  const STORAGE_ITEMS: { key: StorageKey; label: string; icon: string }[] = [
    { key: 'wood',  label: 'Timber',    icon: '🪵' },
    { key: 'stone', label: 'Stone',     icon: '🪨' },
    { key: 'herbs', label: 'Herbs',     icon: '🌿' },
    { key: 'seeds', label: 'Seeds',     icon: '🌱' },
    { key: 'iron',  label: 'Iron Ore',  icon: '⛏'  }
  ]
  let addItemKey = $state<StorageKey>('wood')
  let addItemQty = $state(10)

  function addItem() {
    const qty = Math.max(1, Math.floor(addItemQty))
    Game.state.inventory[addItemKey] += qty
    const meta = STORAGE_ITEMS.find(i => i.key === addItemKey)!
    showToast(`Dev: Added ${qty}x ${meta.icon} ${meta.label}.`)
  }

  const jobList = Object.values(JOBS)
  const traitList = Object.keys(TRAITS) as TraitId[]
</script>

<!-- Floating Bubble -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="dev-bubble"
  style="left: {bubbleX}px; top: {bubbleY}px;"
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  title="Dev Tools"
>
  <span class="bubble-icon">{open ? '✕' : '🛠'}</span>
  <span class="bubble-label">DEV</span>
</div>

<!-- Dev Panel Modal -->
{#if open}
  <div class="dev-panel glass-panel" style="left: {Math.min(bubbleX + 72, window.innerWidth - 400)}px; top: {Math.max(8, bubbleY - 460)}px;">
    <div class="dev-panel-header">
      <span class="dev-panel-title">🛠 Developer Tools</span>
      <button class="dev-close" onclick={() => open = false}>✕</button>
    </div>

    <!-- ─── Add Recruit ─────────────────────────────────────────── -->
    <section class="dev-section">
      <div class="dev-section-title">⚔ Add Recruit to Roster</div>
      <div class="dev-field-row">
        <label class="dev-label" for="dev-job">Job</label>
        <select id="dev-job" class="dev-select" bind:value={recruitJobId}>
          {#each jobList as job}
            <option value={job.id}>{job.icon} {job.name}</option>
          {/each}
        </select>
      </div>
      <div class="dev-field-row">
        <label class="dev-label" for="dev-trait">Trait</label>
        <select id="dev-trait" class="dev-select" bind:value={recruitTraitId}>
          <option value="none">— None —</option>
          {#each traitList as tid}
            <option value={tid}>{TRAITS[tid].name}</option>
          {/each}
        </select>
      </div>
      <div class="dev-field-row">
        <label class="dev-label" for="dev-level">Level</label>
        <input id="dev-level" type="number" min="1" max="50" class="dev-input" bind:value={recruitLevel} />
      </div>
      <button class="dev-btn dev-btn-action" onclick={addRecruit}>Add to Roster</button>
    </section>

    <div class="dev-divider"></div>

    <!-- ─── Edit Reputation ────────────────────────────────────── -->
    <section class="dev-section">
      <div class="dev-section-title">⭐ Edit Reputation</div>
      <div class="dev-field-row">
        <label class="dev-label" for="dev-rep">Renown</label>
        <input id="dev-rep" type="number" min="0" max="99999" class="dev-input" bind:value={reputationValue} />
      </div>
      <div class="dev-current">Current: {Game.state.renown}</div>
      <button class="dev-btn dev-btn-action" onclick={applyReputation}>Apply</button>
    </section>

    <div class="dev-divider"></div>

    <!-- ─── Add Item ───────────────────────────────────────────── -->
    <section class="dev-section">
      <div class="dev-section-title">📦 Add Item to Storage</div>
      <div class="dev-field-row">
        <label class="dev-label" for="dev-item">Item</label>
        <select id="dev-item" class="dev-select" bind:value={addItemKey}>
          {#each STORAGE_ITEMS as item}
            <option value={item.key}>{item.icon} {item.label}</option>
          {/each}
        </select>
      </div>
      <div class="dev-field-row">
        <label class="dev-label" for="dev-qty">Qty</label>
        <input id="dev-qty" type="number" min="1" max="9999" class="dev-input" bind:value={addItemQty} />
      </div>
      <button class="dev-btn dev-btn-action" onclick={addItem}>Add to Storage</button>
    </section>
  </div>
{/if}

<style>
  /* ─── Bubble ─────────────────────────────────────────────────────────────── */
  .dev-bubble {
    position: fixed;
    z-index: 9999;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    border: 2px solid rgba(167, 139, 250, 0.4);
    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.5), 0 0 0 4px rgba(124, 58, 237, 0.15);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: grab;
    user-select: none;
    touch-action: none;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    gap: 1px;
  }
  .dev-bubble:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 28px rgba(124, 58, 237, 0.7), 0 0 0 6px rgba(124, 58, 237, 0.2);
  }
  .dev-bubble:active { cursor: grabbing; }
  .bubble-icon { font-size: 1.4rem; line-height: 1; }
  .bubble-label {
    font-size: 0.55rem;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: rgba(255,255,255,0.8);
    text-transform: uppercase;
  }

  /* ─── Panel ──────────────────────────────────────────────────────────────── */
  .dev-panel {
    position: fixed;
    z-index: 9998;
    width: 360px;
    max-height: 80vh;
    overflow-y: auto;
    padding: 0;
    border: 1px solid rgba(124, 58, 237, 0.35);
    border-radius: 16px;
    background: rgba(15, 10, 30, 0.96);
    backdrop-filter: blur(24px);
    box-shadow: 0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.1);
    animation: dev-pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  @keyframes dev-pop {
    from { opacity: 0; transform: scale(0.92) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .dev-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid rgba(124, 58, 237, 0.2);
    position: sticky;
    top: 0;
    background: rgba(15, 10, 30, 0.98);
    border-radius: 16px 16px 0 0;
    z-index: 1;
  }
  .dev-panel-title {
    font-weight: 700;
    font-size: 0.9rem;
    color: #a78bfa;
    font-family: 'Cinzel', serif;
    letter-spacing: 0.5px;
  }
  .dev-close {
    background: none;
    border: none;
    color: #64748b;
    font-size: 1rem;
    cursor: pointer;
    line-height: 1;
    padding: 4px 6px;
    border-radius: 6px;
    transition: color 0.2s, background 0.2s;
  }
  .dev-close:hover { color: #f8fafc; background: rgba(255,255,255,0.06); }

  /* ─── Sections ───────────────────────────────────────────────────────────── */
  .dev-section { padding: 14px 18px; display: flex; flex-direction: column; gap: 8px; }
  .dev-section-title {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #7c3aed;
    margin-bottom: 4px;
  }
  .dev-divider { height: 1px; background: rgba(124, 58, 237, 0.15); margin: 0 18px; }

  /* ─── Fields ─────────────────────────────────────────────────────────────── */
  .dev-field-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .dev-label {
    font-size: 0.75rem;
    color: #94a3b8;
    width: 44px;
    flex-shrink: 0;
    text-align: right;
  }
  .dev-select,
  .dev-input {
    flex: 1;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(124, 58, 237, 0.25);
    border-radius: 8px;
    color: #f8fafc;
    padding: 6px 10px;
    font-size: 0.8rem;
    font-family: 'Inter', sans-serif;
    outline: none;
    transition: border-color 0.2s;
  }
  .dev-select:focus, .dev-input:focus { border-color: rgba(124, 58, 237, 0.6); }
  .dev-select option { background: #1e1b4b; }
  .dev-input[type="number"] { width: 80px; }

  .dev-current {
    font-size: 0.72rem;
    color: #64748b;
  }

  .dev-btn {
    align-self: flex-end;
    padding: 7px 18px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-family: 'Inter', sans-serif;
  }
  .dev-btn-action {
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    color: #fff;
    box-shadow: 0 2px 10px rgba(124, 58, 237, 0.35);
  }
  .dev-btn-action:hover {
    filter: brightness(1.15);
    transform: translateY(-1px);
  }
</style>
