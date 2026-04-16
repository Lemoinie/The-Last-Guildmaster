<script lang="ts">
  import { onMount } from 'svelte'
  import { marked } from 'marked'

  interface Props {
    onclose: () => void
    onaccept: () => void
    showToast: (msg: string) => void
  }

  let { onclose, onaccept, showToast }: Props = $props()

  const TOS_ACCEPTED_KEY = 'tlg_tos_accepted_v1'
  let activeTab = $state('tos')
  let agreed = $state(localStorage.getItem(TOS_ACCEPTED_KEY) === '1')

  const tabs = [
    { id: 'tos', label: 'Terms of Service' },
    { id: 'modding', label: 'Modding Policy' },
    { id: 'privacy', label: 'Privacy Policy' }
  ]

  const docs = [
    { file: 'tos.md', id: 'tos' },
    { file: 'modding.md', id: 'modding' },
    { file: 'privacy.md', id: 'privacy' }
  ]

  let panelContents: Record<string, string> = $state({
    tos: '<p class="loading-text">Loading Terms of Service...</p>',
    modding: '<p class="loading-text">Loading Modding Policy...</p>',
    privacy: '<p class="loading-text">Loading Privacy Policy...</p>'
  })

  onMount(async () => {
    if (!window.electronAPI?.readLegalFile) return
    for (const doc of docs) {
      const markdown = await window.electronAPI.readLegalFile(doc.file)
      panelContents[doc.id] = marked.parse(markdown) as string
    }
  })

  function handleCheckboxChange(e: Event) {
    const target = e.target as HTMLInputElement
    agreed = target.checked
    localStorage.setItem(TOS_ACCEPTED_KEY, agreed ? '1' : '0')
  }

  function handleAccept() {
    if (!agreed) return
    localStorage.setItem(TOS_ACCEPTED_KEY, '1')
    onaccept()
  }

  function handleLinkClick(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (target.tagName === 'A') {
      e.preventDefault()
      const href = (target as HTMLAnchorElement).getAttribute('href')?.replace(/^mailto:/, '') || target.textContent || ''
      navigator.clipboard.writeText(href)
      showToast('Address copied to clipboard')
    }
  }
</script>

<!-- Your exact #tos-overlay HTML from index.html -->
<div id="tos-overlay" class="overlay visible" aria-modal="true" role="dialog" aria-labelledby="tos-title">
    <div class="modal-backdrop"></div>
    <div class="tos-modal glass-panel">
        <div class="tos-header">
            <div class="tos-icon">⚖</div>
            <h1 id="tos-title" class="tos-title">Legal Agreements</h1>
            <p class="tos-subtitle">Please review and accept our terms before entering the guild.</p>
        </div>

        <!-- Tab Navigation -->
        <div class="tos-tabs" role="tablist">
            {#each tabs as tab}
                <button
                    class="tos-tab"
                    class:active={activeTab === tab.id}
                    onclick={() => activeTab = tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                >{tab.label}</button>
            {/each}
        </div>

        <!-- Tab Panels -->
        {#each docs as doc}
            <div
                id="{doc.id}-panel"
                class="tos-panel"
                class:active={activeTab === doc.id}
                role="tabpanel"
            >
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div class="tos-scrollarea" onclick={handleLinkClick}>
                    {@html panelContents[doc.id]}
                </div>
            </div>
        {/each}

        <!-- Agreement Footer -->
        <div class="tos-footer">
            <label class="tos-checkbox-label" for="tos-agree-check">
                <input type="checkbox" id="tos-agree-check" aria-required="true" checked={agreed} onchange={handleCheckboxChange}>
                <span class="custom-checkbox"></span>
                I agree.
            </label>
            <div class="tos-actions">
                <button id="tos-return-btn" class="btn-ghost" onclick={onclose}>Return</button>
                <button id="tos-accept-btn" class="btn-primary" disabled={!agreed} onclick={handleAccept}>Enter the Guild</button>
            </div>
        </div>
    </div>
</div>
