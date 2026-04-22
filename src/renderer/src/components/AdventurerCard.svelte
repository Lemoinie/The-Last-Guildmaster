<script lang="ts">
  import type { Character } from '../lib/adventurer/character.svelte'

  interface Props {
    character: Character
  }

  let { character }: Props = $props()

  const statBars: { label: string; key: 'totalStr' | 'totalInt' | 'totalDex' | 'totalCon'; color: string }[] = [
    { label: 'STR', key: 'totalStr', color: '#ef4444' },
    { label: 'INT', key: 'totalInt', color: '#818cf8' },
    { label: 'DEX', key: 'totalDex', color: '#34d399' },
    { label: 'CON', key: 'totalCon', color: '#fbbf24' }
  ]
</script>

<div class="adventurer-card glass-panel">
  <!-- Header: Name, Job, Level -->
  <div class="card-header">
    <div class="card-identity">
      <span class="card-job-icon">{character.job.icon}</span>
      <div>
        <h3 class="card-name">{character.name}</h3>
        <span class="card-job">{character.job.name}</span>
        {#if character.attributes.trait}
          <span class="card-trait">· {character.attributes.trait.name}</span>
        {/if}
      </div>
    </div>
    <div class="card-level">
      <span class="level-number">Lv.{character.level}</span>
    </div>
  </div>

  <!-- XP Bar -->
  <div class="xp-bar-container">
    <div class="xp-bar" style="width: {character.xpPercent}%"></div>
    <span class="xp-label">{character.xp} / {character.xpNeeded} XP</span>
  </div>

  <!-- Stat Bars -->
  <div class="card-stats">
    {#each statBars as stat}
      <div class="stat-row">
        <span class="stat-label">{stat.label}</span>
        <div class="stat-bar-track">
          <div
            class="stat-bar-fill"
            style="width: {Math.min(100, character.attributes[stat.key])}%; background: {stat.color};"
          ></div>
        </div>
        <span class="stat-value">{character.attributes[stat.key]}</span>
      </div>
    {/each}
  </div>

  <!-- Derived Combat Stats -->
  <div class="card-combat">
    <div class="combat-stat">
      <span class="combat-icon">❤</span>
      <span class="combat-value">{character.attributes.maxHp}</span>
      <span class="combat-label">HP</span>
    </div>
    <div class="combat-stat">
      <span class="combat-icon">💧</span>
      <span class="combat-value">{character.attributes.maxMp}</span>
      <span class="combat-label">MP</span>
    </div>
    <div class="combat-stat">
      <span class="combat-icon">⚔</span>
      <span class="combat-value">{character.attributes.physAtk}</span>
      <span class="combat-label">ATK</span>
    </div>
    <div class="combat-stat">
      <span class="combat-icon">✦</span>
      <span class="combat-value">{character.attributes.magAtk}</span>
      <span class="combat-label">MAG</span>
    </div>
    <div class="combat-stat">
      <span class="combat-icon">⚡</span>
      <span class="combat-value">{character.attributes.speed}</span>
      <span class="combat-label">SPD</span>
    </div>
  </div>

  <!-- Skills -->
  {#if character.skills.length > 0}
    <div class="card-skills">
      {#each character.skills as skill}
        <span class="skill-badge" title="{skill.description} (Lv.{skill.levelReq})">
          {skill.icon} {skill.name}
        </span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .adventurer-card {
    padding: 20px;
    border-radius: var(--radius-lg, 16px);
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 280px;
    max-width: 360px;
  }

  /* --- Header --- */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .card-identity {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .card-job-icon {
    font-size: 1.8rem;
  }
  .card-name {
    font-family: 'Cinzel', serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary, #f8fafc);
    margin: 0;
  }
  .card-job {
    font-size: 0.75rem;
    color: var(--accent-primary, #7dd3fc);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .card-trait {
    font-size: 0.7rem;
    color: var(--text-secondary, #94a3b8);
    font-style: italic;
  }
  .card-level {
    background: rgba(125, 211, 252, 0.1);
    border: 1px solid rgba(125, 211, 252, 0.2);
    border-radius: 8px;
    padding: 4px 10px;
  }
  .level-number {
    font-family: 'Cinzel', serif;
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--accent-primary, #7dd3fc);
  }

  /* --- XP Bar --- */
  .xp-bar-container {
    position: relative;
    height: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    overflow: hidden;
  }
  .xp-bar {
    height: 100%;
    background: linear-gradient(90deg, #7dd3fc, #38bdf8);
    border-radius: 8px;
    transition: width 0.4s ease;
  }
  .xp-label {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    color: var(--text-primary, #f8fafc);
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0,0,0,0.6);
  }

  /* --- Stat Bars --- */
  .card-stats {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .stat-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .stat-label {
    width: 32px;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-secondary, #94a3b8);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .stat-bar-track {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
    overflow: hidden;
  }
  .stat-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.4s ease;
  }
  .stat-value {
    width: 28px;
    text-align: right;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-primary, #f8fafc);
  }

  /* --- Combat Stats --- */
  .card-combat {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
  .combat-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .combat-icon {
    font-size: 0.9rem;
  }
  .combat-value {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-primary, #f8fafc);
  }
  .combat-label {
    font-size: 0.6rem;
    color: var(--text-secondary, #94a3b8);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* --- Skills --- */
  .card-skills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
  .skill-badge {
    font-size: 0.7rem;
    padding: 3px 8px;
    background: rgba(125, 211, 252, 0.08);
    border: 1px solid rgba(125, 211, 252, 0.15);
    border-radius: 6px;
    color: var(--text-secondary, #94a3b8);
    cursor: default;
    transition: all 0.2s ease;
  }
  .skill-badge:hover {
    background: rgba(125, 211, 252, 0.15);
    color: var(--text-primary, #f8fafc);
  }
</style>
