<script lang="ts">
  import { Game } from '../../lib/stores/game.svelte'

  interface Props {
    showToast: (msg: string) => void
  }
  let { showToast }: Props = $props()

  const missions = [
    { id: 1, name: 'Forest Patrol', difficulty: 'Easy', time: 60, reward: 'Wood, Herbs' },
    { id: 2, name: 'Iron Mine Delve', difficulty: 'Medium', time: 300, reward: 'Iron, Stone' }
  ]

  function deploy(name: string) {
    Game.startExpedition([])
    showToast(`Deployed party on expedition: "${name}"!`)
  }
</script>

<div class="view-header">
  <h2 class="view-title">Expedition Board</h2>
  <p class="view-description">Send your teams to gather resources.</p>
</div>

<div class="grid-container">
  {#each missions as m (m.id)}
    <div class="item-card">
      <h3>{m.name}</h3>
      <p>Diff: {m.difficulty}</p>
      <p>Duration: {m.time}s</p>
      <p class="accent-text">Reward: {m.reward}</p>
      <button class="action-btn" onclick={() => deploy(m.name)}>Deploy</button>
    </div>
  {/each}
</div>
