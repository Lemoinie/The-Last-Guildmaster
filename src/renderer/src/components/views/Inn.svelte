<script lang="ts">
  import { Game } from '../../lib/stores/game.svelte'
  import { getJob } from '../../lib/adventurer/jobs'
</script>

<div class="view-header">
  <h2 class="view-title">The Cozy Rest</h2>
  <p class="view-description">Manage your roster of heroes.</p>
</div>

<div class="grid-container">
  {#if Game.state.roster.length > 0}
    {#each Game.state.roster as adv (adv.id)}
      <div class="item-card">
        <h3>{adv.name}</h3>
        <p>Level {adv.level} {getJob(adv.jobId)?.name || adv.jobId}</p>
      </div>
    {/each}
  {:else}
    <p>No adventurers recruited yet.</p>
  {/if}
</div>
