<!--
  Minutes Per Day Chart

  Displays minutes worked per day using D3.js bar chart.
  Follows UNIX philosophy: single responsibility for daily minutes visualization.
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';

  export let days: Array<{ date: string; minutes: number; tasksCompleted: number }> = [];
  export let height = 300;

  let chartContainer: HTMLDivElement;
  let resizeObserver: ResizeObserver;

  // Chart dimensions and margins
  const margin = { top: 20, right: 20, bottom: 50, left: 60 };
  let width = 800;

  $: if (chartContainer && days.length > 0) {
    drawChart();
  }

  function drawChart() {
    if (!chartContainer || days.length === 0) return;

    // Clear previous chart
    d3.select(chartContainer).selectAll('*').remove();

    // Update dimensions
    const containerRect = chartContainer.getBoundingClientRect();
    width = containerRect.width || 800;

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

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
      .domain(days.map(d => d.date))
      .range([0, innerWidth])
      .padding(0.2);

    const maxMinutes = d3.max(days, d => d.minutes) || 60;
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
      .data(days)
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
      .data(days)
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
    const dateObj = new Date(d.date);
    const formattedDate = d3.timeFormat('%B %d, %Y')(dateObj);

    tooltip.transition().duration(200).style('opacity', 1);
    tooltip.html(`
      <div style="font-weight: var(--font-weight-medium)">${formattedDate}</div>
      <div>Minutes: ${d.minutes}</div>
      <div>Tasks: ${d.tasksCompleted}</div>
    `)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  }

  function hideTooltip() {
    getTooltip().transition().duration(500).style('opacity', 0);
  }

  function getTooltip() {
    let tooltip = d3.select('body').select('.minutes-chart-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div')
        .attr('class', 'minutes-chart-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'var(--bg-elevated)')
        .style('border', '1px solid var(--border-default)')
        .style('border-radius', 'var(--radius-md)')
        .style('padding', 'var(--space-sm)')
        .style('font-size', 'var(--font-size-xs)')
        .style('pointer-events', 'none')
        .style('z-index', '1000');
    }
    return tooltip;
  }

  onMount(() => {
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (chartContainer && days.length > 0) {
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
    d3.select('body').selectAll('.minutes-chart-tooltip').remove();
  });
</script>

<div class="chart-wrapper">
  <h3 class="chart-title">Minutes Per Day</h3>
  <div class="chart-container" bind:this={chartContainer}>
    {#if days.length === 0}
      <div class="empty-state">
        <div class="empty-icon">⏱</div>
        <p class="empty-description">No time data available</p>
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
