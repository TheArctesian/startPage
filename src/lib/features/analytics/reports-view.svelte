<!--
  Reports View
  
  Daily/weekly/monthly summaries and productivity reports.
  Follows UNIX philosophy: focused on report generation and display.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import type { TaskWithDetails, Project } from '$lib/types/database';

  export let isOpen = false;

  let tasks: TaskWithDetails[] = [];
  let projects: Project[] = [];
  let loading = true;
  let reportType: 'daily' | 'weekly' | 'monthly' = 'weekly';
  let selectedDate = new Date().toISOString().split('T')[0];

  // Report data
  $: reportData = generateReport(tasks, projects, reportType, selectedDate);

  interface ReportData {
    period: string;
    totalTasks: number;
    completedTasks: number;
    totalTimeSpent: number;
    averageTaskTime: number;
    projectBreakdown: Array<{ project: string; tasks: number; time: number }>;
    intensityBreakdown: Array<{ level: number; count: number; percentage: number }>;
    dailyPattern: Array<{ day: string; tasks: number; time: number }>;
    topProjects: Array<{ name: string; time: number; tasks: number }>;
    productivityTrend: 'up' | 'down' | 'stable';
    insights: string[];
  }

  function generateReport(
    tasks: TaskWithDetails[], 
    projects: Project[], 
    type: string, 
    date: string
  ): ReportData {
    const selectedDateTime = new Date(date);
    let startDate: Date, endDate: Date, period: string;

    // Calculate date range based on report type
    switch (type) {
      case 'daily':
        startDate = new Date(selectedDateTime);
        endDate = new Date(selectedDateTime);
        endDate.setDate(endDate.getDate() + 1);
        period = d3.timeFormat('%B %d, %Y')(selectedDateTime);
        break;
      case 'weekly':
        const weekStart = d3.timeWeek.floor(selectedDateTime);
        startDate = new Date(weekStart);
        endDate = new Date(weekStart);
        endDate.setDate(endDate.getDate() + 7);
        period = `Week of ${d3.timeFormat('%B %d, %Y')(weekStart)}`;
        break;
      case 'monthly':
        startDate = d3.timeMonth.floor(selectedDateTime);
        endDate = d3.timeMonth.offset(startDate, 1);
        period = d3.timeFormat('%B %Y')(selectedDateTime);
        break;
      default:
        startDate = new Date();
        endDate = new Date();
        period = 'Unknown';
    }

    // Filter tasks for the period
    const periodTasks = tasks.filter(task => {
      if (!task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return completedDate >= startDate && completedDate < endDate;
    });

    const completedTasks = periodTasks.filter(t => t.status === 'done');
    const totalTimeSpent = completedTasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0);

    // Project breakdown
    const projectMap = new Map<number, { tasks: number; time: number }>();
    completedTasks.forEach(task => {
      if (task.projectId) {
        const current = projectMap.get(task.projectId) || { tasks: 0, time: 0 };
        projectMap.set(task.projectId, {
          tasks: current.tasks + 1,
          time: current.time + (task.actualMinutes || 0)
        });
      }
    });

    const projectBreakdown = Array.from(projectMap.entries()).map(([projectId, data]) => {
      const project = projects.find(p => p.id === projectId);
      return {
        project: project?.name || `Project ${projectId}`,
        tasks: data.tasks,
        time: data.time
      };
    }).sort((a, b) => b.time - a.time);

    // Intensity breakdown
    const intensityMap = new Map<number, number>();
    completedTasks.forEach(task => {
      if (task.actualIntensity) {
        const current = intensityMap.get(task.actualIntensity) || 0;
        intensityMap.set(task.actualIntensity, current + 1);
      }
    });

    const intensityBreakdown = Array.from(intensityMap.entries()).map(([level, count]) => ({
      level,
      count,
      percentage: Math.round((count / Math.max(1, completedTasks.length)) * 100)
    })).sort((a, b) => a.level - b.level);

    // Daily pattern (for weekly/monthly reports)
    const dailyPattern: Array<{ day: string; tasks: number; time: number }> = [];
    if (type !== 'daily') {
      const dailyMap = new Map<string, { tasks: number; time: number }>();
      
      completedTasks.forEach(task => {
        if (task.completedAt) {
          const day = d3.timeFormat('%a')(new Date(task.completedAt));
          const current = dailyMap.get(day) || { tasks: 0, time: 0 };
          dailyMap.set(day, {
            tasks: current.tasks + 1,
            time: current.time + (task.actualMinutes || 0)
          });
        }
      });

      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      weekDays.forEach(day => {
        const data = dailyMap.get(day) || { tasks: 0, time: 0 };
        dailyPattern.push({ day, ...data });
      });
    }

    // Top projects
    const topProjects = projectBreakdown.slice(0, 5).map(p => ({
      name: p.project,
      time: Math.round(p.time / 60 * 10) / 10, // Convert to hours
      tasks: p.tasks
    }));

    // Productivity trend (simple comparison with previous period)
    let productivityTrend: 'up' | 'down' | 'stable' = 'stable';
    const previousPeriodStart = new Date(startDate);
    const previousPeriodEnd = new Date(endDate);
    
    if (type === 'daily') {
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
    } else if (type === 'weekly') {
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 7);
    } else {
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
      previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1);
    }

    const previousTasks = tasks.filter(task => {
      if (!task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return completedDate >= previousPeriodStart && completedDate < previousPeriodEnd;
    }).filter(t => t.status === 'done');

    const currentScore = completedTasks.length + (totalTimeSpent / 60);
    const previousScore = previousTasks.length + (previousTasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0) / 60);
    
    if (currentScore > previousScore * 1.1) productivityTrend = 'up';
    else if (currentScore < previousScore * 0.9) productivityTrend = 'down';

    // Generate insights
    const insights: string[] = [];
    
    if (completedTasks.length === 0) {
      insights.push('No tasks completed in this period. Consider setting smaller, achievable goals.');
    } else {
      if (completedTasks.length >= 5) {
        insights.push(`Great productivity! You completed ${completedTasks.length} tasks.`);
      }
      
      if (totalTimeSpent > 0) {
        const avgTime = totalTimeSpent / completedTasks.length;
        if (avgTime > 120) {
          insights.push('Your tasks took longer than average. Consider breaking them down into smaller chunks.');
        } else if (avgTime < 30) {
          insights.push('You\'re completing tasks quickly! This could indicate good efficiency or tasks that are too small.');
        }
      }

      const highIntensityTasks = completedTasks.filter(t => (t.actualIntensity || 0) >= 4).length;
      const totalWithIntensity = completedTasks.filter(t => t.actualIntensity).length;
      
      if (totalWithIntensity > 0) {
        const highIntensityPercentage = (highIntensityTasks / totalWithIntensity) * 100;
        if (highIntensityPercentage > 50) {
          insights.push('High intensity focus! Make sure to balance with easier tasks to avoid burnout.');
        } else if (highIntensityPercentage < 20) {
          insights.push('Mostly low-intensity tasks. Consider tackling some challenging work for growth.');
        }
      }

      if (productivityTrend === 'up') {
        insights.push('Productivity is trending upward! Keep up the momentum.');
      } else if (productivityTrend === 'down') {
        insights.push('Productivity has decreased. Consider what might be causing this and how to address it.');
      }

      if (projectBreakdown.length > 3) {
        insights.push('You\'re working on multiple projects. Make sure you\'re maintaining focus and not spreading too thin.');
      }
    }

    if (insights.length === 0) {
      insights.push('Keep tracking your tasks to generate more personalized insights!');
    }

    return {
      period,
      totalTasks: periodTasks.length,
      completedTasks: completedTasks.length,
      totalTimeSpent,
      averageTaskTime: completedTasks.length > 0 ? totalTimeSpent / completedTasks.length : 0,
      projectBreakdown,
      intensityBreakdown,
      dailyPattern,
      topProjects,
      productivityTrend,
      insights
    };
  }

  async function loadData() {
    loading = true;

    try {
      const [tasksResponse, projectsResponse] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects')
      ]);

      if (!tasksResponse.ok || !projectsResponse.ok) {
        throw new Error('Failed to load data');
      }

      tasks = await tasksResponse.json();
      projects = await projectsResponse.json();
    } catch (err) {
      console.error('Error loading reports data:', err);
    } finally {
      loading = false;
    }
  }

  function handleClose() {
    isOpen = false;
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  function formatHours(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  function formatAverage(minutes: number): string {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    return `${Math.round(minutes / 60 * 10) / 10}h`;
  }

  function getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up': return '▲';
      case 'down': return '▼';
      default: return '■';
    }
  }

  function getTrendColor(trend: string): string {
    switch (trend) {
      case 'up': return 'var(--color-success)';
      case 'down': return 'var(--color-error)';
      default: return 'var(--text-secondary)';
    }
  }

  function getIntensityColor(level: number): string {
    const colors = [
      'var(--intensity-1)',
      'var(--intensity-2)', 
      'var(--intensity-3)',
      'var(--intensity-4)',
      'var(--intensity-5)'
    ];
    return colors[level - 1] || 'var(--text-secondary)';
  }

  // Load data when opened
  $: if (isOpen) {
    loadData();
  }
</script>

{#if isOpen}
  <div 
    class="reports-modal"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="reports-title"
    tabindex="-1"
  >
    <div class="reports-content">
      <!-- Header -->
      <div class="reports-header">
        <h2 id="reports-title" class="reports-title">
          Productivity Reports
        </h2>
        <button 
          class="close-btn"
          onclick={handleClose}
          aria-label="Close reports"
        >
          ✕
        </button>
      </div>

      <!-- Content -->
      <div class="reports-body">
        {#if loading}
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Generating reports...</p>
          </div>
        {:else}
          <!-- Controls -->
          <div class="report-controls">
            <div class="control-group">
              <label for="report-type">Report Type:</label>
              <select id="report-type" bind:value={reportType} class="control-select">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div class="control-group">
              <label for="report-date">Date:</label>
              <input 
                id="report-date" 
                type="date" 
                bind:value={selectedDate} 
                class="control-input"
              />
            </div>
          </div>

          <!-- Report Header -->
          <div class="report-summary">
            <div class="summary-header">
              <h3 class="summary-title">{reportData.period}</h3>
              <div class="summary-trend" style="color: {getTrendColor(reportData.productivityTrend)}">
                <span class="trend-icon">{getTrendIcon(reportData.productivityTrend)}</span>
                <span class="trend-label">
                  {reportData.productivityTrend === 'up' ? 'Trending Up' : 
                   reportData.productivityTrend === 'down' ? 'Trending Down' : 'Stable'}
                </span>
              </div>
            </div>

            <!-- Key Metrics -->
            <div class="summary-metrics">
              <div class="metric">
                <div class="metric-value">{reportData.completedTasks}</div>
                <div class="metric-label">Tasks Completed</div>
              </div>
              <div class="metric">
                <div class="metric-value">{formatHours(reportData.totalTimeSpent)}</div>
                <div class="metric-label">Total Time</div>
              </div>
              <div class="metric">
                <div class="metric-value">{formatAverage(reportData.averageTaskTime)}</div>
                <div class="metric-label">Avg per Task</div>
              </div>
              <div class="metric">
                <div class="metric-value">{Math.round((reportData.completedTasks / Math.max(1, reportData.totalTasks)) * 100)}%</div>
                <div class="metric-label">Completion Rate</div>
              </div>
            </div>
          </div>

          <!-- Report Sections -->
          <div class="report-sections">
            <!-- Project Breakdown -->
            {#if reportData.topProjects.length > 0}
              <div class="report-section">
                <h4 class="section-title">Project Breakdown</h4>
                <div class="project-list">
                  {#each reportData.topProjects as project}
                    <div class="project-item">
                      <div class="project-info">
                        <div class="project-name">{project.name}</div>
                        <div class="project-stats">
                          {project.tasks} tasks • {project.time}h
                        </div>
                      </div>
                      <div class="project-bar">
                        <div 
                          class="project-fill"
                          style="width: {(project.time / Math.max(...reportData.topProjects.map(p => p.time))) * 100}%"
                        ></div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Intensity Breakdown -->
            {#if reportData.intensityBreakdown.length > 0}
              <div class="report-section">
                <h4 class="section-title">💪 Task Intensity</h4>
                <div class="intensity-chart">
                  {#each reportData.intensityBreakdown as intensity}
                    <div class="intensity-bar">
                      <div class="intensity-label">
                        Level {intensity.level}
                      </div>
                      <div class="intensity-visual">
                        <div 
                          class="intensity-fill"
                          style="width: {intensity.percentage}%; background-color: {getIntensityColor(intensity.level)}"
                        ></div>
                      </div>
                      <div class="intensity-count">
                        {intensity.count} ({intensity.percentage}%)
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Daily Pattern (for weekly/monthly) -->
            {#if reportType !== 'daily' && reportData.dailyPattern.some(d => d.tasks > 0)}
              <div class="report-section">
                <h4 class="section-title">Daily Pattern</h4>
                <div class="daily-chart">
                  {#each reportData.dailyPattern as day}
                    <div class="day-column">
                      <div class="day-label">{day.day}</div>
                      <div class="day-bar">
                        <div 
                          class="day-fill"
                          style="height: {Math.max(5, (day.tasks / Math.max(...reportData.dailyPattern.map(d => d.tasks))) * 100)}%"
                          title="{day.tasks} tasks, {formatHours(day.time)}"
                        ></div>
                      </div>
                      <div class="day-stats">
                        <div>{day.tasks}</div>
                        <div class="day-time">{formatHours(day.time)}</div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Insights -->
            <div class="report-section">
              <h4 class="section-title">Insights & Recommendations</h4>
              <div class="insights-list">
                {#each reportData.insights as insight}
                  <div class="insight-item">
                    <div class="insight-icon">•</div>
                    <div class="insight-text">{insight}</div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .reports-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(46, 52, 64, 0.8);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    z-index: var(--z-modal);
    padding: var(--space-md);
    backdrop-filter: blur(4px);
    overflow-y: auto;
  }

  .reports-content {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-default);
    width: 100%;
    max-width: 900px;
    margin: var(--space-md) 0;
    box-shadow: var(--shadow-xl);
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 2rem);
  }

  .reports-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-lg);
    border-bottom: 1px solid var(--border-subtle);
    background: var(--bg-secondary);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .reports-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: var(--font-size-lg);
    cursor: pointer;
    padding: var(--space-xs);
    border-radius: var(--radius-sm);
    transition: all var(--transition-normal);
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    background: var(--hover-bg);
    color: var(--text-primary);
  }

  .reports-body {
    flex: 1;
    padding: var(--space-lg);
    overflow-y: auto;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    text-align: center;
  }

  .loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid var(--border-default);
    border-top: 3px solid var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: var(--space-md);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .report-controls {
    display: flex;
    gap: var(--space-lg);
    margin-bottom: var(--space-xl);
    padding: var(--space-md);
    background: var(--bg-elevated);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-default);
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .control-group label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .control-select,
  .control-input {
    padding: var(--space-xs) var(--space-sm);
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
  }

  .report-summary {
    background: var(--bg-elevated);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    border: 1px solid var(--border-default);
    margin-bottom: var(--space-xl);
  }

  .summary-header {
    display: flex;
    justify-content: between;
    align-items: center;
    margin-bottom: var(--space-lg);
  }

  .summary-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  .summary-trend {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }

  .trend-icon {
    font-size: 1rem;
  }

  .summary-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--space-lg);
  }

  .metric {
    text-align: center;
  }

  .metric-value {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  }

  .metric-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-weight: var(--font-weight-medium);
    margin-top: var(--space-xs);
  }

  .report-sections {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }

  .report-section {
    background: var(--bg-elevated);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    border: 1px solid var(--border-default);
  }

  .section-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-lg) 0;
  }

  .project-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .project-item {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .project-info {
    flex: 1;
    min-width: 0;
  }

  .project-name {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .project-stats {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  }

  .project-bar {
    width: 100px;
    height: 8px;
    background: var(--bg-secondary);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .project-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: var(--radius-full);
    transition: width var(--transition-normal);
  }

  .intensity-chart {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .intensity-bar {
    display: grid;
    grid-template-columns: 80px 1fr 80px;
    align-items: center;
    gap: var(--space-sm);
  }

  .intensity-label {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    font-weight: var(--font-weight-medium);
  }

  .intensity-visual {
    height: 20px;
    background: var(--bg-secondary);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .intensity-fill {
    height: 100%;
    border-radius: var(--radius-sm);
    transition: width var(--transition-normal);
  }

  .intensity-count {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    text-align: right;
    font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  }

  .daily-chart {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--space-sm);
    height: 150px;
  }

  .day-column {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .day-label {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    font-weight: var(--font-weight-medium);
    margin-bottom: var(--space-xs);
  }

  .day-bar {
    flex: 1;
    width: 100%;
    background: var(--bg-secondary);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: flex-end;
    overflow: hidden;
  }

  .day-fill {
    width: 100%;
    background: var(--color-primary);
    border-radius: var(--radius-sm);
    transition: height var(--transition-normal);
    min-height: 2px;
  }

  .day-stats {
    margin-top: var(--space-xs);
    text-align: center;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }

  .day-time {
    font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  }

  .insights-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .insight-item {
    display: flex;
    gap: var(--space-sm);
    align-items: flex-start;
  }

  .insight-icon {
    color: var(--color-primary);
    font-weight: var(--font-weight-bold);
    margin-top: 2px;
  }

  .insight-text {
    flex: 1;
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    line-height: var(--line-height-normal);
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .reports-modal {
      padding: 0;
      align-items: stretch;
    }

    .reports-content {
      margin: 0;
      border-radius: 0;
      max-height: 100vh;
    }

    .reports-header {
      border-radius: 0;
    }

    .report-controls {
      flex-direction: column;
      gap: var(--space-md);
    }

    .summary-header {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-sm);
    }

    .summary-metrics {
      grid-template-columns: repeat(2, 1fr);
    }

    .project-item {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-sm);
    }

    .project-bar {
      width: 100%;
    }

    .intensity-bar {
      grid-template-columns: 1fr;
      gap: var(--space-xs);
      text-align: center;
    }

    .daily-chart {
      grid-template-columns: repeat(7, 1fr);
      height: 120px;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .reports-content,
    .report-summary,
    .report-section {
      border-width: 2px;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .loading-spinner {
      animation: none;
    }

    .project-fill,
    .intensity-fill,
    .day-fill {
      transition: none;
    }
  }
</style>