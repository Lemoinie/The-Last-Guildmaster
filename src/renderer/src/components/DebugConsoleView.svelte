<script lang="ts">
  import { onMount, tick } from 'svelte'

  interface LogEntry {
    type: string
    message: string
    timestamp: string
  }

  let logs = $state<LogEntry[]>([])
  let filterText = $state('')
  let filterType = $state('ALL')
  let logContainer = $state<HTMLDivElement | null>(null)
  let autoScroll = true

  const filteredLogs = $derived(
    logs.filter((log) => {
      const matchesText = log.message.toLowerCase().includes(filterText.toLowerCase())
      const matchesType = filterType === 'ALL' || log.type.toUpperCase() === filterType
      return matchesText && matchesType
    })
  )

  onMount(async () => {
    // Load log history
    if (window.electronAPI && typeof window.electronAPI.getLogsHistory === 'function') {
      try {
        const history = await window.electronAPI.getLogsHistory()
        if (Array.isArray(history)) {
          logs = history
        }
      } catch (err) {
        console.error('Failed to load logs history:', err)
      }
      await scrollToBottom()
    }

    // Bind log receiver
    if (window.electronAPI && typeof window.electronAPI.onConsoleLog === 'function') {
      window.electronAPI.onConsoleLog((entry: LogEntry) => {
        logs.push(entry)
        if (autoScroll) {
          scrollToBottom()
        }
      })
    }
  })

  async function scrollToBottom() {
    await tick()
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight
    }
  }

  function handleScroll(e: Event) {
    const el = e.target as HTMLDivElement
    const threshold = 15
    autoScroll = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
  }

  function clearLogs() {
    logs = []
  }

  function formatTime(isoStr: string) {
    try {
      const d = new Date(isoStr)
      return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0')
    } catch {
      return ''
    }
  }
</script>

<div class="console-window">
  <header class="console-header">
    <div class="header-main">
      <span class="console-logo">📜</span>
      <h1>Guild Chronicler</h1>
      <span class="subtitle">Real-time Debug System</span>
    </div>
    <div class="header-controls">
      <input type="text" placeholder="Filter logs..." class="search-input" bind:value={filterText} />
      <select class="type-filter" bind:value={filterType}>
        <option value="ALL">All Types</option>
        <option value="INFO">Info</option>
        <option value="WARN">Warnings</option>
        <option value="ERROR">Errors</option>
        <option value="RECRUIT">Recruits</option>
      </select>
      <button class="btn-clear" onclick={clearLogs}>Clear</button>
    </div>
  </header>

  <div class="console-body" bind:this={logContainer} onscroll={handleScroll}>
    {#if filteredLogs.length === 0}
      <div class="empty-state">No logs recorded for the current filter.</div>
    {:else}
      <div class="logs-list">
        {#each filteredLogs as log}
          <div class="log-row" class:error={log.type === 'ERROR'} class:warn={log.type === 'WARN'} class:recruit={log.type === 'recruit' || log.type === 'RECRUIT'}>
            <span class="log-time">[{formatTime(log.timestamp)}]</span>
            <span class="log-tag">[{log.type.toUpperCase()}]</span>
            <span class="log-message">{log.message}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .console-window {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    background-color: #030508;
    color: #e2e8f0;
    font-family: 'Consolas', 'Courier New', Courier, monospace;
    overflow: hidden;
  }

  .console-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: rgba(10, 15, 24, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
  }

  .header-main {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .console-logo {
    font-size: 20px;
  }

  .console-header h1 {
    font-size: 16px;
    font-weight: 600;
    color: #f8fafc;
    font-family: 'Inter', sans-serif;
  }

  .subtitle {
    font-size: 11px;
    color: #64748b;
    margin-left: 6px;
    border-left: 1px solid rgba(255, 255, 255, 0.15);
    padding-left: 10px;
    font-family: 'Inter', sans-serif;
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .search-input {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 6px 12px;
    color: #f8fafc;
    font-size: 12px;
    outline: none;
    font-family: 'Inter', sans-serif;
    transition: all 0.2s;
    width: 180px;
  }

  .search-input:focus {
    border-color: #7dd3fc;
    background: rgba(255, 255, 255, 0.07);
  }

  .type-filter {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 6px 10px;
    color: #f8fafc;
    font-size: 12px;
    outline: none;
    font-family: 'Inter', sans-serif;
  }

  .btn-clear {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: 6px;
    padding: 6px 14px;
    color: #fca5a5;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: all 0.2s;
  }

  .btn-clear:hover {
    background: rgba(239, 68, 68, 0.25);
    color: #fee2e2;
  }

  .console-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    background-color: #030508;
  }

  .empty-state {
    color: #475569;
    text-align: center;
    padding-top: 40px;
    font-size: 13px;
  }

  .logs-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .log-row {
    font-size: 12px;
    line-height: 1.5;
    word-break: break-all;
    color: #94a3b8;
  }

  .log-time {
    color: #475569;
    margin-right: 6px;
  }

  .log-tag {
    color: #38bdf8;
    margin-right: 8px;
    font-weight: 600;
  }

  .log-message {
    color: #f1f5f9;
  }

  /* Warn Type color */
  .log-row.warn {
    color: #fbbf24;
  }
  .log-row.warn .log-tag {
    color: #fbbf24;
  }
  .log-row.warn .log-message {
    color: #fef08a;
  }

  /* Error Type color */
  .log-row.error {
    color: #f87171;
  }
  .log-row.error .log-tag {
    color: #f87171;
  }
  .log-row.error .log-message {
    color: #fee2e2;
  }

  /* Recruit Type color */
  .log-row.recruit {
    color: #34d399;
  }
  .log-row.recruit .log-tag {
    color: #34d399;
  }
  .log-row.recruit .log-message {
    color: #d1fae5;
  }
</style>
