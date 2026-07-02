<script lang="ts">
  import { Game } from '../../lib/stores/game.svelte'
</script>

<div class="view-header">
  <h2 class="view-title">Guild Vault</h2>
  <p class="view-description">Items and resources gathered from expeditions.</p>
</div>

<div class="grid-container">
  {#each Object.entries(Game.state.resources) as [key, val] (key)}
    <div class="item-card">
      <h3>{key.charAt(0).toUpperCase() + key.slice(1)}</h3>
      <p class="value">{val}</p>
    </div>
  {/each}
</div>
