<!--
  Estimation Accuracy Chart
  
  Displays time and intensity estimation accuracy over time using D3.js.
  Follows UNIX philosophy: single responsibility for accuracy visualization.
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import * as d3 from 'd3';
  import type { TaskWithDetails } from '$lib/types/database';

  let {
    tasks = [],
    chartType = 'both',
    timeRange = '30d'
  } = $props<{
    tasks?: TaskWithDetails[];
    chartType?: 'time' | 'intensity' | 'both';
    timeRange?: '7d' | '30d' | '90d' | 'all';
  }>();

  let chartContainer: HTMLDivElement;
  let resizeObserver: ResizeObserver;

  // Chart dimensions and margins
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  let width = 800;
  let height = 400;

  // Process task data for accuracy metrics
  const accuracyData = $derived(processAccuracyData(tasks, timeRange));

  $effect(() => {
    if (chartContainer && accuracyData.length > 0) {
      drawChart();
    }
  });

  interface AccuracyPoint {
    date: Date;
    timeAccuracy: number | null;
    intensityAccuracy: number | null;
    taskCount: number;
  }

  function processAccuracyData(tasks: TaskWithDetails[], range: string): AccuracyPoint[] {
    const completedTasks = tasks.filter(task => 
      task.status === 'done' && 
      task.actualMinutes !== null && 
      task.actualIntensity !== null &&
      task.completedAt
    );

    if (completedTasks.length === 0) return [];

    // Filter by time range
    const now = new Date();
    const cutoffDate = new Date();
    switch (range) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case 'all':
      default:
        cutoffDate.setFullYear(2020); // Far enough back
        break;
    }

    const filteredTasks = completedTasks.filter(task => 
      new Date(task.completedAt!) >= cutoffDate
    );

    // Group by day and calculate accuracy
    const grouped = d3.group(filteredTasks, d => {
      const date = new Date(d.completedAt!);
      return d3.timeDay.floor(date).toISOString();
    });

    const data: AccuracyPoint[] = [];
    grouped.forEach((dayTasks, dateStr) => {
      const date = new Date(dateStr);
      
      // Calculate time accuracy
      const timeAccuracies = dayTasks
        .filter(t => t.estimatedMinutes > 0 && t.actualMinutes! > 0)
        .map(t => {
          const timeDiff = Math.abs(t.actualMinutes! - t.estimatedMinutes);
          return Math.max(0, (1 - timeDiff / t.estimatedMinutes) * 100);
        });

      // Calculate intensity accuracy
      const intensityAccuracies = dayTasks
        .filter(t => t.estimatedIntensity > 0 && t.actualIntensity! > 0)
        .map(t => {
          const intensityDiff = Math.abs(t.actualIntensity! - t.estimatedIntensity);
          return Math.max(0, (1 - intensityDiff / 4) * 100);
        });

      data.push({
        date,
        timeAccuracy: timeAccuracies.length > 0 ? 
          d3.mean(timeAccuracies) || null : null,
        intensityAccuracy: intensityAccuracies.length > 0 ? 
          d3.mean(intensityAccuracies) || null : null,
        taskCount: dayTasks.length
      });
    });

    return data.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  function drawChart() {
    if (!chartContainer || accuracyData.length === 0) return;

    // Clear previous chart
    d3.select(chartContainer).selectAll('*').remove();

    // Update dimensions
    const containerRect = chartContainer.getBoundingClientRect();
    width = containerRect.width || 800;
    height = Math.min(400, width * 0.5);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(chartContainer)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'accuracy-chart');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(accuracyData, d => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // Lines
    const timeAccuracyLine = d3.line<AccuracyPoint>()
      .defined(d => d.timeAccuracy !== null)
      .x(d => xScale(d.date))
      .y(d => yScale(d.timeAccuracy!))
      .curve(d3.curveMonotoneX);

    const intensityAccuracyLine = d3.line<AccuracyPoint>()
      .defined(d => d.intensityAccuracy !== null)
      .x(d => xScale(d.date))
      .y(d => yScale(d.intensityAccuracy!))
      .curve(d3.curveMonotoneX);

    const tickLabel = d3.timeFormat('%m/%d');
    const formatAxisTick = (value: Date | d3.NumberValue) => {
      const dateValue = value instanceof Date ? value : new Date(value.valueOf());
      return tickLabel(dateValue);
    };

    // Add axes
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickFormat((value) => formatAxisTick(value))
        .ticks(d3.timeDay.every(Math.max(1, Math.floor(accuracyData.length / 7))))
      );

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale)
        .tickFormat(d => `${d}%`)
        .ticks(5)
      );

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickFormat(() => '')
        .ticks(d3.timeDay.every(Math.max(1, Math.floor(accuracyData.length / 7))))
      );

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(() => '')
        .ticks(5)
      );

    // Add reference line at 80% (good accuracy threshold)
    g.append('line')
      .attr('class', 'reference-line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(80))
      .attr('y2', yScale(80))
      .style('stroke', 'var(--color-success)')
      .style('stroke-dasharray', '5,5')
      .style('opacity', 0.5);

    // Add accuracy lines
    if (chartType === 'time' || chartType === 'both') {
      const timeData = accuracyData.filter(d => d.timeAccuracy !== null);
      if (timeData.length > 0) {
        g.append('path')
          .datum(timeData)
          .attr('class', 'time-accuracy-line')
          .attr('fill', 'none')
          .attr('stroke', 'var(--color-primary)')
          .attr('stroke-width', 3)
          .attr('d', timeAccuracyLine);

        // Add dots
        g.selectAll('.time-accuracy-dot')
          .data(timeData)
          .enter().append('circle')
          .attr('class', 'time-accuracy-dot')
          .attr('cx', d => xScale(d.date))
          .attr('cy', d => yScale(d.timeAccuracy!))
          .attr('r', 4)
          .attr('fill', 'var(--color-primary)')
          .attr('stroke', 'var(--bg-primary)')
          .attr('stroke-width', 2);
      }
    }

    if (chartType === 'intensity' || chartType === 'both') {
      const intensityData = accuracyData.filter(d => d.intensityAccuracy !== null);
      if (intensityData.length > 0) {
        g.append('path')
          .datum(intensityData)
          .attr('class', 'intensity-accuracy-line')
          .attr('fill', 'none')
          .attr('stroke', 'var(--color-purple)')
          .attr('stroke-width', 3)
          .attr('d', intensityAccuracyLine);

        // Add dots
        g.selectAll('.intensity-accuracy-dot')
          .data(intensityData)
          .enter().append('circle')
          .attr('class', 'intensity-accuracy-dot')
          .attr('cx', d => xScale(d.date))
          .attr('cy', d => yScale(d.intensityAccuracy!))
          .attr('r', 4)
          .attr('fill', 'var(--color-purple)')
          .attr('stroke', 'var(--bg-primary)')
          .attr('stroke-width', 2);
      }
    }

    // Add tooltips
    const tooltip = d3.select('body').append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'var(--bg-elevated)')
      .style('border', '1px solid var(--border-default)')
      .style('border-radius', 'var(--radius-md)')
      .style('padding', 'var(--space-sm)')
      .style('font-size', 'var(--font-size-xs)')
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    // Invisible overlay for mouse interaction
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event);
        const date = xScale.invert(mouseX);
        
        // Find closest data point
        const bisect = d3.bisector((d: AccuracyPoint) => d.date).left;
        const index = bisect(accuracyData, date, 1);
        const d0 = accuracyData[index - 1];
        const d1 = accuracyData[index];
        const d = !d1 || (d0 && (date.getTime() - d0.date.getTime() < d1.date.getTime() - date.getTime())) ? d0 : d1;

        if (d) {
          tooltip.transition().duration(200).style('opacity', 1);
          tooltip.html(`
            <div style="font-weight: var(--font-weight-medium)">${d3.timeFormat('%B %d, %Y')(d.date)}</div>
            ${d.timeAccuracy !== null ? `<div>Time Accuracy: ${d.timeAccuracy.toFixed(1)}%</div>` : ''}
            ${d.intensityAccuracy !== null ? `<div>Intensity Accuracy: ${d.intensityAccuracy.toFixed(1)}%</div>` : ''}
            <div>Tasks: ${d.taskCount}</div>
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        }
      })
      .on('mouseout', function() {
        tooltip.transition().duration(500).style('opacity', 0);
      });

    // Add labels
    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (innerHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', 'var(--font-size-sm)')
      .style('fill', 'var(--text-secondary)')
      .text('Accuracy (%)');

    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + margin.bottom - 5})`)
      .style('text-anchor', 'middle')
      .style('font-size', 'var(--font-size-sm)')
      .style('fill', 'var(--text-secondary)')
      .text('Date');
  }

  onMount(() => {
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (chartContainer && accuracyData.length > 0) {
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
    // Clean up tooltip
    if (browser) {
      d3.select('body').selectAll('.chart-tooltip').remove();
    }
  });
</script>

<div class="accuracy-chart-container" bind:this={chartContainer}>
  {#if accuracyData.length === 0}
    <div class="empty-state">
      <div class="empty-icon">□</div>
      <h3 class="empty-title">No Data Available</h3>
      <p class="empty-description">
        Complete some tasks with time tracking to see your estimation accuracy trends.
      </p>
    </div>
  {/if}
</div>

<style>
  .accuracy-chart-container {
    width: 100%;
    min-height: 400px;
    background: var(--bg-elevated);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-default);
    padding: var(--space-md);
    position: relative;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    text-align: center;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: var(--space-md);
    opacity: 0.6;
  }

  .empty-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-sm) 0;
  }

  .empty-description {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin: 0;
    max-width: 400px;
    line-height: var(--line-height-normal);
  }

  /* Chart styling */
  :global(.accuracy-chart .x-axis),
  :global(.accuracy-chart .y-axis) {
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
  }

  :global(.accuracy-chart .x-axis path),
  :global(.accuracy-chart .y-axis path),
  :global(.accuracy-chart .x-axis line),
  :global(.accuracy-chart .y-axis line) {
    stroke: var(--border-default);
  }

  :global(.accuracy-chart .grid line) {
    stroke: var(--border-subtle);
    stroke-opacity: 0.5;
  }

  :global(.accuracy-chart .grid path) {
    stroke-width: 0;
  }

  /* Hover effects */
  :global(.time-accuracy-dot),
  :global(.intensity-accuracy-dot) {
    transition: r 0.2s ease;
    cursor: pointer;
  }

  :global(.time-accuracy-dot:hover),
  :global(.intensity-accuracy-dot:hover) {
    r: 6;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .accuracy-chart-container {
      padding: var(--space-sm);
      min-height: 300px;
    }

    .empty-icon {
      font-size: 2rem;
    }

    .empty-title {
      font-size: var(--font-size-base);
    }

    .empty-description {
      font-size: var(--font-size-xs);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .accuracy-chart-container {
      border-width: 2px;
    }

    :global(.accuracy-chart .grid line) {
      stroke-opacity: 0.8;
    }
  }
</style>
