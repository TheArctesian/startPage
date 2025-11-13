<!--
  Time Tracking Chart
  
  Displays time spent on projects and tasks using D3.js.
  Follows UNIX philosophy: single responsibility for time visualization.
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import * as d3 from 'd3';
  import type { TaskWithDetails, Project } from '$lib/types/database';

  let {
    tasks = [],
    projects = [],
    chartType = 'daily',
    timeRange = '30d'
  } = $props<{
    tasks?: TaskWithDetails[];
    projects?: Project[];
    chartType?: 'daily' | 'weekly' | 'project';
    timeRange?: '7d' | '30d' | '90d';
  }>();

  let chartContainer: HTMLDivElement;
  let resizeObserver: ResizeObserver;

  // Chart dimensions and margins
  const margin = { top: 20, right: 60, bottom: 40, left: 60 };
  let width = 800;
  let height = 400;

  // Process time data
  const timeData = $derived(processTimeData(tasks, projects, chartType, timeRange));

  $effect(() => {
    if (chartContainer && timeData.length > 0) {
      drawChart();
    }
  });

  interface TimePoint {
    date: Date;
    value: number;
    label: string;
    projectId?: number;
    color?: string;
  }

  function processTimeData(
    tasks: TaskWithDetails[], 
    projects: Project[], 
    type: string, 
    range: string
  ): TimePoint[] {
    const completedTasks = tasks.filter(task => 
      task.status === 'done' && 
      task.actualMinutes !== null &&
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
    }

    const filteredTasks = completedTasks.filter(task => 
      new Date(task.completedAt!) >= cutoffDate
    );

    if (type === 'project') {
      // Group by project
      const projectTotals = new Map<number, number>();
      const projectColors = new Map<number, string>();
      
      filteredTasks.forEach(task => {
        if (task.projectId) {
          const current = projectTotals.get(task.projectId) || 0;
          projectTotals.set(task.projectId, current + (task.actualMinutes || 0));
        }
      });

      // Assign colors to projects
      const colors = ['var(--nord8)', 'var(--nord15)', 'var(--nord14)', 'var(--nord12)', 'var(--nord13)'];
      let colorIndex = 0;
      
      return Array.from(projectTotals.entries())
        .map(([projectId, totalMinutes]) => {
          const project = projects.find(p => p.id === projectId);
          const color = colors[colorIndex % colors.length];
          colorIndex++;
          
          return {
            date: new Date(), // Not used for project view
            value: Math.round(totalMinutes / 60 * 10) / 10, // Convert to hours
            label: project?.name || `Project ${projectId}`,
            projectId,
            color
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Top 10 projects
    } else {
      // Group by day or week
      const timeUnit = type === 'weekly' ? d3.timeWeek : d3.timeDay;
      
      const grouped = d3.group(filteredTasks, d => {
        const date = new Date(d.completedAt!);
        return timeUnit.floor(date).toISOString();
      });

      const data: TimePoint[] = [];
      grouped.forEach((periodTasks, dateStr) => {
        const date = new Date(dateStr);
        const totalMinutes = d3.sum(periodTasks, t => t.actualMinutes || 0);
        const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
        
        data.push({
          date,
          value: totalHours,
          label: type === 'weekly' ? 
            `Week of ${d3.timeFormat('%m/%d')(date)}` :
            d3.timeFormat('%m/%d')(date)
        });
      });

      return data.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
  }

  function drawChart() {
    if (!chartContainer || timeData.length === 0) return;

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
      .attr('class', 'time-chart');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    if (chartType === 'project') {
      drawBarChart(g, innerWidth, innerHeight);
    } else {
      drawLineChart(g, innerWidth, innerHeight);
    }
  }

  function drawLineChart(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    innerWidth: number,
    innerHeight: number
  ) {
    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(timeData, d => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(timeData, d => d.value) || 1])
      .nice()
      .range([innerHeight, 0]);

    // Line generator
    const line = d3.line<TimePoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    const dateFormatter = d3.timeFormat('%m/%d');
    const formatAxisTick = (value: Date | d3.NumberValue) => {
      const dateValue = value instanceof Date ? value : new Date(value.valueOf());
      return dateFormatter(dateValue);
    };

    // Add axes
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickFormat((value) => formatAxisTick(value))
        .ticks(Math.min(timeData.length, 8))
      );

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale)
        .tickFormat(d => `${d}h`)
        .ticks(5)
      );

    // Add grid
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3.axisBottom(xScale)
          .tickSize(-innerHeight)
          .tickFormat(() => '')
          .ticks(Math.min(timeData.length, 8))
      );

    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
          .ticks(5)
      );

    // Add area under curve
    const area = d3.area<TimePoint>()
      .x(d => xScale(d.date))
      .y0(innerHeight)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(timeData)
      .attr('class', 'time-area')
      .attr('d', area)
      .style('fill', 'var(--color-primary)')
      .style('opacity', 0.2);

    // Add line
    g.append('path')
      .datum(timeData)
      .attr('class', 'time-line')
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-primary)')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add dots
    g.selectAll('.time-dot')
      .data(timeData)
      .enter().append('circle')
      .attr('class', 'time-dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.value))
      .attr('r', 4)
      .attr('fill', 'var(--color-primary)')
      .attr('stroke', 'var(--bg-primary)')
      .attr('stroke-width', 2);

    // Add tooltips
    addTooltips(g, xScale, yScale);

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
      .text('Hours');

    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + margin.bottom - 5})`)
      .style('text-anchor', 'middle')
      .style('font-size', 'var(--font-size-sm)')
      .style('fill', 'var(--text-secondary)')
      .text('Date');
  }

  function drawBarChart(g: d3.Selection<SVGGElement, unknown, null, undefined>, innerWidth: number, innerHeight: number) {
    // Scales
    const xScale = d3.scaleBand()
      .domain(timeData.map(d => d.label))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(timeData, d => d.value) || 1])
      .nice()
      .range([innerHeight, 0]);

    // Add axes
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale)
        .tickFormat(d => `${d}h`)
        .ticks(5)
      );

    // Add bars
    g.selectAll('.time-bar')
      .data(timeData)
      .enter().append('rect')
      .attr('class', 'time-bar')
      .attr('x', d => xScale(d.label)!)
      .attr('width', xScale.bandwidth())
      .attr('y', d => yScale(d.value))
      .attr('height', d => innerHeight - yScale(d.value))
      .attr('fill', d => d.color || 'var(--color-primary)')
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
      .data(timeData)
      .enter().append('text')
      .attr('class', 'bar-label')
      .attr('x', d => xScale(d.label)! + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.value) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', 'var(--font-size-xs)')
      .style('fill', 'var(--text-secondary)')
      .text(d => `${d.value}h`);

    // Add label
    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (innerHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', 'var(--font-size-sm)')
      .style('fill', 'var(--text-secondary)')
      .text('Hours');
  }

  function addTooltips(
    g: d3.Selection<SVGGElement, unknown, null, undefined>, 
    xScale: d3.ScaleTime<number, number, never>, 
    yScale: d3.ScaleLinear<number, number, never>
  ) {
    // Invisible overlay for mouse interaction
    g.append('rect')
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', 'transparent')
      .on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event);
        const date = xScale.invert(mouseX);
        
        // Find closest data point
        const bisect = d3.bisector((d: TimePoint) => d.date).left;
        const index = bisect(timeData, date, 1);
        const d0 = timeData[index - 1];
        const d1 = timeData[index];
        const d = !d1 || (d0 && (date.getTime() - d0.date.getTime() < d1.date.getTime() - date.getTime())) ? d0 : d1;

        if (d) {
          showTooltip(event, d);
        }
      })
      .on('mouseout', hideTooltip);
  }

  function showTooltip(event: MouseEvent, d: TimePoint) {
    const tooltip = getTooltip();
    tooltip.transition().duration(200).style('opacity', 1);
    tooltip.html(`
      <div style="font-weight: var(--font-weight-medium)">${d.label}</div>
      <div>Time: ${d.value} hours</div>
    `);
    tooltip
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`);
  }

  function hideTooltip() {
    getTooltip().transition().duration(500).style('opacity', 0);
  }

  type TooltipSelection = d3.Selection<HTMLDivElement, undefined, HTMLElement, any>;

  function getTooltip(): TooltipSelection {
    if (!browser) {
      return d3.select(null as unknown as HTMLDivElement) as TooltipSelection;
    }

    const bodySelection = d3.select<HTMLBodyElement>('body');
    let tooltip = bodySelection.select<HTMLDivElement>('.time-chart-tooltip');
    if (tooltip.empty()) {
      tooltip = bodySelection
        .append<HTMLDivElement>('div')
        .attr('class', 'time-chart-tooltip')
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
    return tooltip as TooltipSelection;
  }

  onMount(() => {
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (chartContainer && timeData.length > 0) {
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
      d3.select('body').selectAll('.time-chart-tooltip').remove();
    }
  });
</script>

<div class="time-chart-container" bind:this={chartContainer}>
  {#if timeData.length === 0}
    <div class="empty-state">
      <div class="empty-icon">○</div>
      <h3 class="empty-title">No Time Data</h3>
      <p class="empty-description">
        Complete some tasks with time tracking to see your time patterns.
      </p>
    </div>
  {/if}
</div>

<style>
  .time-chart-container {
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
  :global(.time-chart .x-axis),
  :global(.time-chart .y-axis) {
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
  }

  :global(.time-chart .x-axis path),
  :global(.time-chart .y-axis path),
  :global(.time-chart .x-axis line),
  :global(.time-chart .y-axis line) {
    stroke: var(--border-default);
  }

  :global(.time-chart .grid line) {
    stroke: var(--border-subtle);
    stroke-opacity: 0.5;
  }

  :global(.time-chart .grid path) {
    stroke-width: 0;
  }

  /* Hover effects */
  :global(.time-dot) {
    transition: r 0.2s ease;
    cursor: pointer;
  }

  :global(.time-dot:hover) {
    r: 6;
  }

  :global(.time-bar) {
    transition: opacity 0.2s ease;
    cursor: pointer;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .time-chart-container {
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
    .time-chart-container {
      border-width: 2px;
    }

    :global(.time-chart .grid line) {
      stroke-opacity: 0.8;
    }
  }
</style>
