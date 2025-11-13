<!--
  Minutes Per Day Chart

  Displays minutes worked per day using D3.js bar chart with week navigation.
  Follows UNIX philosophy: single responsibility for daily minutes visualization.
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import * as d3 from 'd3';
  import WeekNavigator from '$lib/components/analytics/week-navigator.svelte';

  let { height = 300 } = $props<{ height?: number }>();

  let weekOffset = $state(0);
  let currentWeekData = $state<Array<{ date: string; minutes: number; tasksCompleted: number }>>([]);
  let dataCache = $state(new Map<number, Array<{ date: string; minutes: number; tasksCompleted: number }>>());
  let hasNextWeek = $state(false);
  let hasPrevWeek = $state(true);

  let chartContainer: HTMLDivElement;
  let resizeObserver: ResizeObserver;

  // Chart dimensions and margins
  const margin = { top: 20, right: 20, bottom: 50, left: 60 };
  let width = 800;

  // Fetch data when week changes
  $effect(() => {
    fetchWeekData(weekOffset);
    // Preload adjacent weeks
    preloadWeek(weekOffset - 1);
    preloadWeek(weekOffset + 1);
  });

  // Redraw chart when data changes
  $effect(() => {
    if (chartContainer && currentWeekData.length > 0) {
      drawChart();
    }
  });

  function getWeekDateRange(offset: number): { start: Date; end: Date } {
    const today = new Date();
    const currentWeekStart = d3.timeWeek.floor(today);
    const targetWeekStart = new Date(currentWeekStart);
    targetWeekStart.setDate(targetWeekStart.getDate() + (offset * 7));

    const targetWeekEnd = new Date(targetWeekStart);
    targetWeekEnd.setDate(targetWeekEnd.getDate() + 6);

    return { start: targetWeekStart, end: targetWeekEnd };
  }

  async function fetchWeekData(offset: number) {
    // Check cache first
    if (dataCache.has(offset)) {
      currentWeekData = dataCache.get(offset)!;
      updateNavigationState();
      return;
    }

    const { start, end } = getWeekDateRange(offset);

    try {
      const response = await fetch(
        `/api/analytics/daily?start=${start.toISOString()}&end=${end.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        const weekData = data.days || [];

        // Cache the data
        dataCache.set(offset, weekData);
        currentWeekData = weekData;
        updateNavigationState();
      }
    } catch (error) {
      console.error('Failed to fetch week data:', error);
    }
  }

  async function preloadWeek(offset: number) {
    // Don't preload if already cached or if it's a future week
    if (dataCache.has(offset) || offset > 0) return;

    const { start, end } = getWeekDateRange(offset);

    try {
      const response = await fetch(
        `/api/analytics/daily?start=${start.toISOString()}&end=${end.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        dataCache.set(offset, data.days || []);
      }
    } catch (error) {
      // Silently fail for preloading
    }
  }

  function updateNavigationState() {
    // Can go to next week only if it's not the current week
    hasNextWeek = weekOffset < 0;

    // Can go to previous week if there's data
    const prevWeekData = dataCache.get(weekOffset - 1);
    hasPrevWeek = prevWeekData ? prevWeekData.some(d => d.minutes > 0 || d.tasksCompleted > 0) : true;
  }

  function handleWeekChange(newOffset: number) {
    weekOffset = newOffset;
  }

  function drawChart() {
    if (!chartContainer || currentWeekData.length === 0) return;

    // Clear previous chart
    d3.select(chartContainer).selectAll('*').remove();

    // Update dimensions
    const containerRect = chartContainer.getBoundingClientRect();
    width = containerRect.width || 800;

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Filter out days with no data for display
    const displayData = currentWeekData.filter(d => d.minutes > 0 || d.tasksCompleted > 0);

    // If no data at all, show all days with zero values
    const chartData = displayData.length > 0 ? displayData : currentWeekData;

    // Create SVG
    const svg = d3.select(chartContainer)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'minutes-chart');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(chartData.map(d => d.date))
      .range([0, innerWidth])
      .padding(0.2);

    const maxMinutes = d3.max(chartData, d => d.minutes) || 60;
    const yScale = d3.scaleLinear()
      .domain([0, maxMinutes])
      .nice()
      .range([innerHeight, 0]);

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(() => '')
        .ticks(5)
      );

    // Add axes
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickFormat((date: string) => {
          const d = new Date(date);
          return d3.timeFormat('%m/%d')(d);
        })
      )
      .selectAll('text')
      .style('text-anchor', 'middle');

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale)
        .tickFormat(d => `${d}m`)
        .ticks(5)
      );

    // Add bars
    g.selectAll('.minutes-bar')
      .data(chartData)
      .enter().append('rect')
      .attr('class', 'minutes-bar')
      .attr('x', d => xScale(d.date)!)
      .attr('width', xScale.bandwidth())
      .attr('y', d => yScale(d.minutes))
      .attr('height', d => innerHeight - yScale(d.minutes))
      .attr('fill', 'var(--nord8)')
      .attr('rx', 4)
      .style('opacity', 0.8)
      .on('mouseover', function(event, d) {
        d3.select(this).style('opacity', 1);
        showTooltip(event, d);
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 0.8);
        hideTooltip();
      });

    // Add value labels on bars
    g.selectAll('.bar-label')
      .data(chartData)
      .enter().append('text')
      .attr('class', 'bar-label')
      .attr('x', d => xScale(d.date)! + xScale.bandwidth() / 2)
      .attr('y', d => d.minutes > 0 ? yScale(d.minutes) - 5 : innerHeight - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', 'var(--font-size-xs)')
      .style('fill', 'var(--text-secondary)')
      .text(d => d.minutes > 0 ? `${d.minutes}m` : '');

    // Add y-axis label
    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (innerHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', 'var(--font-size-sm)')
      .style('fill', 'var(--text-secondary)')
      .text('Minutes Worked');
  }

  function showTooltip(event: MouseEvent, d: { date: string; minutes: number; tasksCompleted: number }) {
    const tooltip = getTooltip();
    if (!tooltip) return;
    const dateObj = new Date(d.date);
    const formattedDate = d3.timeFormat('%B %d, %Y')(dateObj);

    tooltip.transition().duration(200).style('opacity', 1);
    tooltip.html(`
      <div style="font-weight: var(--font-weight-medium)">${formattedDate}</div>
      <div>Minutes: ${d.minutes}</div>
      <div>Tasks: ${d.tasksCompleted}</div>
    `);
    tooltip
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`);
  }

  function hideTooltip() {
    const tooltip = getTooltip();
    if (!tooltip) return;
    tooltip.transition().duration(500).style('opacity', 0);
  }

  type TooltipSelection = d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;

  function getTooltip(): TooltipSelection | null {
    if (!browser) {
      return null;
    }

    const bodySelection = d3.select('body');
    let tooltip = bodySelection.select('.minutes-chart-tooltip') as TooltipSelection;
    if (tooltip.empty()) {
      tooltip = bodySelection
        .append('div')
        .attr('class', 'minutes-chart-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'var(--bg-elevated)')
        .style('border', '1px solid var(--border-default)')
        .style('border-radius', 'var(--radius-md)')
        .style('padding', 'var(--space-sm)')
        .style('font-size', 'var(--font-size-xs)')
        .style('pointer-events', 'none')
        .style('z-index', '1000') as TooltipSelection;
    }
    return tooltip;
  }

  onMount(() => {
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (chartContainer && currentWeekData.length > 0) {
          drawChart();
        }
      });
      resizeObserver.observe(chartContainer);
    }
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    if (browser) {
      d3.select('body').selectAll('.minutes-chart-tooltip').remove();
    }
  });
</script>

<div class="chart-wrapper">
  <h3 class="chart-title">Minutes Per Day</h3>
  <WeekNavigator
    {weekOffset}
    {hasNextWeek}
    {hasPrevWeek}
    onWeekChange={handleWeekChange}
  />
  <div class="chart-container" bind:this={chartContainer}>
    {#if currentWeekData.length === 0 || currentWeekData.every(d => d.minutes === 0 && d.tasksCompleted === 0)}
      <div class="empty-state">
        <div class="empty-icon">⏱</div>
        <p class="empty-description">No time data available for this week</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .chart-wrapper {
    background: var(--bg-elevated);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-default);
    padding: var(--space-md);
    margin-bottom: var(--space-lg);
  }

  .chart-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-md) 0;
  }

  .chart-container {
    width: 100%;
    min-height: 300px;
    position: relative;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    text-align: center;
  }

  .empty-icon {
    font-size: 2.5rem;
    margin-bottom: var(--space-sm);
    opacity: 0.6;
  }

  .empty-description {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin: 0;
  }

  /* Chart styling */
  :global(.minutes-chart .x-axis),
  :global(.minutes-chart .y-axis) {
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
  }

  :global(.minutes-chart .x-axis path),
  :global(.minutes-chart .y-axis path),
  :global(.minutes-chart .x-axis line),
  :global(.minutes-chart .y-axis line) {
    stroke: var(--border-default);
  }

  :global(.minutes-chart .grid line) {
    stroke: var(--border-subtle);
    stroke-opacity: 0.3;
  }

  :global(.minutes-chart .grid path) {
    stroke-width: 0;
  }

  :global(.minutes-bar) {
    transition: opacity 0.2s ease;
    cursor: pointer;
  }

  @media (max-width: 768px) {
    .chart-wrapper {
      padding: var(--space-sm);
    }

    .chart-container {
      min-height: 250px;
    }

    .chart-title {
      font-size: var(--font-size-base);
    }
  }
</style>
