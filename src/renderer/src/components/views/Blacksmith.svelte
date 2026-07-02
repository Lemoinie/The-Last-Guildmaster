<script lang="ts">
  import { Game } from '../../lib/stores/game.svelte'

  interface Props {
    showToast: (msg: string) => void
  }
  let { showToast }: Props = $props()

  function forge() {
    showToast('The blacksmith stokes the coals...')
  }
</script>

<div class="view-header">
  <h2 class="view-title">The Iron Anvil</h2>
  <p class="view-description">Forge weapons and armor for your heroes.</p>
</div>

<div class="grid-container">
  <div class="item-card">
    <h3>Iron Sword</h3>
    <p>Requirements: 5 Iron, 2 Wood</p>
    <button class="action-btn" onclick={forge}>Forge</button>
  </div>
</div>
