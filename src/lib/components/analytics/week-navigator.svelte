<!--
  Week Navigator Component

  Reusable week navigation with prev/next buttons and week range display.
  Follows UNIX philosophy: single responsibility for week navigation.
-->

<script lang="ts">
  import * as d3 from 'd3';

  let {
    weekOffset = 0,
    hasNextWeek = false,
    hasPrevWeek = false,
    onWeekChange
  } = $props<{
    weekOffset?: number;
    hasNextWeek?: boolean;
    hasPrevWeek?: boolean;
    onWeekChange: (offset: number) => void;
  }>();

  let weekStart = $derived(getWeekStart(weekOffset));
  let weekEnd = $derived(getWeekEnd(weekStart));
  let weekLabel = $derived(formatWeekRange(weekStart, weekEnd));
  let isCurrentWeek = $derived(weekOffset === 0);

  function getWeekStart(offset: number): Date {
    const today = new Date();
    const currentWeekStart = d3.timeWeek.floor(today);
    const targetWeek = new Date(currentWeekStart);
    targetWeek.setDate(targetWeek.getDate() + (offset * 7));
    return targetWeek;
  }

  function getWeekEnd(start: Date): Date {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return end;
  }

  function formatWeekRange(start: Date, end: Date): string {
    const startMonth = d3.timeFormat('%b %d')(start);
    const endMonth = d3.timeFormat('%b %d, %Y')(end);
    return `${startMonth} - ${endMonth}`;
  }

  function handlePrev() {
    onWeekChange(weekOffset - 1);
  }

  function handleNext() {
    onWeekChange(weekOffset + 1);
  }

  function handleToday() {
    onWeekChange(0);
  }
</script>

<div class="week-navigator">
  <button
    class="nav-button"
    onclick={handlePrev}
    disabled={!hasPrevWeek}
    aria-label="Previous week"
    title="Previous week"
  >
    ‹
  </button>

  <div class="week-info">
    <div class="week-label">{weekLabel}</div>
    {#if !isCurrentWeek}
      <button class="today-button" onclick={handleToday}>
        Today
      </button>
    {/if}
  </div>

  <button
    class="nav-button"
    onclick={handleNext}
    disabled={!hasNextWeek}
    aria-label="Next week"
    title="Next week"
  >
    ›
  </button>
</div>

<style>
  .week-navigator {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-sm);
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-default);
    margin-bottom: var(--space-md);
  }

  .nav-button {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    color: var(--text-primary);
    font-size: 1.25rem;
    font-weight: bold;
    cursor: pointer;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
    transition: all var(--transition-normal);
    min-width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-button:hover:not(:disabled) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--nord0);
    transform: scale(1.05);
  }

  .nav-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .week-info {
    flex: 1;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
  }

  .week-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  }

  .today-button {
    font-size: var(--font-size-xs);
    padding: var(--space-xs) var(--space-sm);
    background: var(--color-primary);
    color: var(--nord0);
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-normal);
    font-weight: var(--font-weight-medium);
  }

  .today-button:hover {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    .week-navigator {
      padding: var(--space-xs);
      gap: var(--space-sm);
    }

    .week-label {
      font-size: var(--font-size-xs);
    }

    .nav-button {
      min-width: 1.75rem;
      height: 1.75rem;
      font-size: 1rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .nav-button:hover,
    .today-button:hover {
      transform: none;
    }
  }
</style>
