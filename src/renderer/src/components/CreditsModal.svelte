<script lang="ts">
  interface Props {
    onclose: () => void
  }

  let { onclose }: Props = $props()

  function handleBackdropClick() {
    onclose()
  }
</script>

<!-- Your exact #credits-modal HTML from index.html -->
<div id="credits-modal" class="overlay visible" aria-modal="true" role="dialog" aria-labelledby="credits-title">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-backdrop" onclick={handleBackdropClick}></div>
    <div class="sub-modal glass-panel">
        <div class="sub-modal-header">
            <h2 id="credits-title">📜 Credits</h2>
            <button class="modal-close-btn" aria-label="Close" onclick={onclose}>✕</button>
        </div>
        <div class="sub-modal-body credits-body">
            <div class="credit-section">
                <h3 class="credit-role">Game Design & Development</h3>
                <p class="credit-name accent-text">Lemoinie</p>
            </div>
            <div class="credit-divider"></div>
            <div class="credit-section">
                <h3 class="credit-role">Engine Framework</h3>
                <p class="credit-name">Electron · Svelte 5 · TypeScript · Vite</p>
            </div>
            <div class="credit-divider"></div>
            <div class="credit-section">
                <h3 class="credit-role">Typography</h3>
                <p class="credit-name">Cinzel & Inter · Google Fonts</p>
            </div>
            <div class="credit-divider"></div>
            <div class="credit-section">
                <h3 class="credit-role">Open Source License</h3>
                <p class="credit-name">Apache License 2.0</p>
            </div>
            <div class="credits-thank-you">
                <p>✦ Thank you for playing ✦</p>
                <p class="credits-tagline">"Every guild begins with a single Guildmaster."</p>
            </div>
        </div>
    </div>
</div>
