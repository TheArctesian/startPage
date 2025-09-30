<!--
  Analytics Dashboard
  
  Main analytics interface combining multiple charts and metrics.
  Follows UNIX philosophy: orchestrates focused components.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import AccuracyChart from './AccuracyChart.svelte';
  import TimeChart from './TimeChart.svelte';
  import type { TaskWithDetails, Project } from '$lib/types/database';

  export let isOpen = false;

  let tasks: TaskWithDetails[] = [];
  let projects: Project[] = [];
  let loading = true;
  let error: string | null = null;

  // Chart controls
  let timeRange: '7d' | '30d' | '90d' = '30d';
  let accuracyType: 'time' | 'intensity' | 'both' = 'both';
  let timeChartType: 'daily' | 'weekly' | 'project' = 'daily';

  // Summary metrics
  $: completedTasks = tasks.filter(t => t.status === 'done' && t.actualMinutes !== null);
  $: totalTimeSpent = completedTasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0);
  $: averageAccuracy = calculateAverageAccuracy(completedTasks);
  $: productivityScore = calculateProductivityScore(completedTasks);

  interface SummaryMetrics {
    totalTasks: number;
    totalHours: number;
    avgTimeAccuracy: number;
    avgIntensityAccuracy: number;
    productivityScore: number;
  }

  function calculateAverageAccuracy(tasks: TaskWithDetails[]): { time: number; intensity: number } {
    const timeAccuracies = tasks
      .filter(t => t.estimatedMinutes > 0 && t.actualMinutes! > 0)
      .map(t => {
        const timeDiff = Math.abs(t.actualMinutes! - t.estimatedMinutes);
        return Math.max(0, (1 - timeDiff / t.estimatedMinutes) * 100);
      });

    const intensityAccuracies = tasks
      .filter(t => t.estimatedIntensity > 0 && t.actualIntensity! > 0)
      .map(t => {
        const intensityDiff = Math.abs(t.actualIntensity! - t.estimatedIntensity);
        return Math.max(0, (1 - intensityDiff / 4) * 100);
      });

    return {
      time: timeAccuracies.length > 0 ? timeAccuracies.reduce((sum, acc) => sum + acc, 0) / timeAccuracies.length : 0,
      intensity: intensityAccuracies.length > 0 ? intensityAccuracies.reduce((sum, acc) => sum + acc, 0) / intensityAccuracies.length : 0
    };
  }

  function calculateProductivityScore(tasks: TaskWithDetails[]): number {
    if (tasks.length === 0) return 0;

    const factors = {
      completion: tasks.length / Math.max(1, tasks.length + tasks.filter(t => t.status !== 'done').length),
      timeAccuracy: averageAccuracy.time / 100,
      intensityAccuracy: averageAccuracy.intensity / 100,
      consistency: calculateConsistency(tasks)
    };

    return Math.round((factors.completion * 0.3 + factors.timeAccuracy * 0.3 + factors.intensityAccuracy * 0.2 + factors.consistency * 0.2) * 100);
  }

  function calculateConsistency(tasks: TaskWithDetails[]): number {
    if (tasks.length < 7) return 0.5; // Default for insufficient data

    // Calculate daily task completion consistency
    const dailyCompletions = new Map<string, number>();
    tasks.forEach(task => {
      if (task.completedAt) {
        const day = new Date(task.completedAt).toDateString();
        dailyCompletions.set(day, (dailyCompletions.get(day) || 0) + 1);
      }
    });

    const completionCounts = Array.from(dailyCompletions.values());
    const avgDaily = completionCounts.reduce((sum, count) => sum + count, 0) / completionCounts.length;
    const variance = completionCounts.reduce((sum, count) => sum + Math.pow(count - avgDaily, 2), 0) / completionCounts.length;
    const stdDev = Math.sqrt(variance);
    
    // Higher consistency = lower relative standard deviation
    return Math.max(0, 1 - (stdDev / Math.max(1, avgDaily)));
  }

  async function loadData() {
    loading = true;
    error = null;

    try {
      // Load tasks and projects in parallel
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
      error = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error loading analytics data:', err);
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

  function getScoreColor(score: number): string {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-info)';
    if (score >= 40) return 'var(--color-warning)';
    return 'var(--color-error)';
  }

  function getScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  }

  // Load data when opened
  $: if (isOpen) {
    loadData();
  }
</script>

{#if isOpen}
  <div 
    class="analytics-modal"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="analytics-title"
    tabindex="-1"
  >
    <div class="analytics-content">
      <!-- Header -->
      <div class="analytics-header">
        <h2 id="analytics-title" class="analytics-title">
          Analytics Dashboard
        </h2>
        <button 
          class="close-btn"
          onclick={handleClose}
          aria-label="Close analytics"
        >
          ✕
        </button>
      </div>

      <!-- Content -->
      <div class="analytics-body">
        {#if loading}
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading analytics data...</p>
          </div>
        {:else if error}
          <div class="error-state">
            <div class="error-icon">!</div>
            <h3>Error Loading Data</h3>
            <p>{error}</p>
            <button class="btn-retry" onclick={loadData}>
              Try Again
            </button>
          </div>
        {:else}
          <!-- Controls -->
          <div class="analytics-controls">
            <div class="control-group">
              <label for="time-range">Time Range:</label>
              <select id="time-range" bind:value={timeRange} class="control-select">
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>

          <!-- Summary Metrics -->
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-icon">✓</div>
              <div class="metric-content">
                <div class="metric-value">{completedTasks.length}</div>
                <div class="metric-label">Tasks Completed</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">T</div>
              <div class="metric-content">
                <div class="metric-value">{formatHours(totalTimeSpent)}</div>
                <div class="metric-label">Total Time</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">%</div>
              <div class="metric-content">
                <div class="metric-value">{Math.round(averageAccuracy.time)}%</div>
                <div class="metric-label">Time Accuracy</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">💪</div>
              <div class="metric-content">
                <div class="metric-value">{Math.round(averageAccuracy.intensity)}%</div>
                <div class="metric-label">Intensity Accuracy</div>
              </div>
            </div>

            <div class="metric-card productivity-score">
              <div class="metric-icon">📈</div>
              <div class="metric-content">
                <div class="metric-value" style="color: {getScoreColor(productivityScore)}">
                  {productivityScore}
                </div>
                <div class="metric-label">{getScoreLabel(productivityScore)}</div>
                <div class="metric-sublabel">Productivity Score</div>
              </div>
            </div>
          </div>

          <!-- Charts Section -->
          <div class="charts-section">
            <!-- Accuracy Chart -->
            <div class="chart-container">
              <div class="chart-header">
                <h3 class="chart-title">Estimation Accuracy Trends</h3>
                <div class="chart-controls">
                  <select bind:value={accuracyType} class="control-select">
                    <option value="both">Both</option>
                    <option value="time">Time Only</option>
                    <option value="intensity">Intensity Only</option>
                  </select>
                </div>
              </div>
              <AccuracyChart 
                {tasks} 
                chartType={accuracyType}
                {timeRange}
              />
            </div>

            <!-- Time Chart -->
            <div class="chart-container">
              <div class="chart-header">
                <h3 class="chart-title">Time Tracking</h3>
                <div class="chart-controls">
                  <select bind:value={timeChartType} class="control-select">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="project">By Project</option>
                  </select>
                </div>
              </div>
              <TimeChart 
                {tasks}
                {projects}
                chartType={timeChartType}
                {timeRange}
              />
            </div>
          </div>

          <!-- Insights Section -->
          {#if completedTasks.length > 0}
            <div class="insights-section">
              <h3 class="insights-title">Insights & Recommendations</h3>
              <div class="insights-grid">
                {#if averageAccuracy.time < 70}
                  <div class="insight-card warning">
                    <div class="insight-icon">⏰</div>
                    <div class="insight-content">
                      <h4>Time Estimation Needs Work</h4>
                      <p>Your time estimates are off by an average of {Math.round(100 - averageAccuracy.time)}%. Try breaking down tasks into smaller chunks.</p>
                    </div>
                  </div>
                {/if}

                {#if averageAccuracy.intensity < 70}
                  <div class="insight-card warning">
                    <div class="insight-icon">💪</div>
                    <div class="insight-content">
                      <h4>Intensity Estimation Could Improve</h4>
                      <p>Consider the complexity and your energy levels when rating task intensity.</p>
                    </div>
                  </div>
                {/if}

                {#if productivityScore >= 80}
                  <div class="insight-card success">
                    <div class="insight-icon">🎉</div>
                    <div class="insight-content">
                      <h4>Great Job!</h4>
                      <p>You're maintaining excellent productivity with consistent estimation accuracy.</p>
                    </div>
                  </div>
                {/if}

                {#if completedTasks.length < 5}
                  <div class="insight-card info">
                    <div class="insight-icon">▲</div>
                    <div class="insight-content">
                      <h4>More Data Needed</h4>
                      <p>Complete more tasks with time tracking to get better insights and recommendations.</p>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .analytics-modal {
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

  .analytics-content {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-default);
    width: 100%;
    max-width: 1200px;
    margin: var(--space-md) 0;
    box-shadow: var(--shadow-xl);
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 2rem);
  }

  .analytics-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-lg);
    border-bottom: 1px solid var(--border-subtle);
    background: var(--bg-secondary);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .analytics-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  .close-btn {
    background: var(--nord2);
    border: 1px solid var(--nord3);
    color: var(--nord6);
    font-size: 1.25rem;
    font-weight: bold;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: all 0.2s ease;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
  }

  .close-btn:hover {
    background: var(--nord11);
    border-color: var(--nord11);
    color: var(--nord6);
    transform: scale(1.05);
  }

  .analytics-body {
    flex: 1;
    padding: var(--space-lg);
    overflow-y: auto;
  }

  .loading-state,
  .error-state {
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

  .error-icon {
    font-size: 3rem;
    margin-bottom: var(--space-md);
  }

  .btn-retry {
    padding: var(--space-sm) var(--space-lg);
    background: var(--color-primary);
    color: var(--nord0);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-normal);
  }

  .btn-retry:hover {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
  }

  .analytics-controls {
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
  }

  .control-select {
    padding: var(--space-xs) var(--space-sm);
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-md);
    margin-bottom: var(--space-xl);
  }

  .metric-card {
    background: var(--bg-elevated);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    border: 1px solid var(--border-default);
    display: flex;
    align-items: center;
    gap: var(--space-md);
    transition: all var(--transition-normal);
  }

  .metric-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .metric-card.productivity-score {
    grid-column: span 1;
    background: linear-gradient(135deg, var(--bg-elevated) 0%, rgba(136, 192, 208, 0.1) 100%);
  }

  .metric-icon {
    font-size: 1.5rem;
    opacity: 0.8;
  }

  .metric-content {
    flex: 1;
  }

  .metric-value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  }

  .metric-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-weight: var(--font-weight-medium);
  }

  .metric-sublabel {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    margin-top: var(--space-xs);
  }

  .charts-section {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-xl);
    margin-bottom: var(--space-xl);
  }

  .chart-container {
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    border: 1px solid var(--border-default);
  }

  .chart-header {
    display: flex;
    justify-content: between;
    align-items: center;
    margin-bottom: var(--space-lg);
  }

  .chart-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  .chart-controls {
    display: flex;
    gap: var(--space-sm);
  }

  .insights-section {
    background: var(--bg-elevated);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    border: 1px solid var(--border-default);
  }

  .insights-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-lg) 0;
  }

  .insights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space-md);
  }

  .insight-card {
    padding: var(--space-md);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-default);
    display: flex;
    gap: var(--space-md);
  }

  .insight-card.success {
    background: rgba(163, 190, 140, 0.1);
    border-color: var(--color-success);
  }

  .insight-card.warning {
    background: rgba(235, 203, 139, 0.1);
    border-color: var(--color-warning);
  }

  .insight-card.info {
    background: rgba(136, 192, 208, 0.1);
    border-color: var(--color-primary);
  }

  .insight-icon {
    font-size: 1.25rem;
    opacity: 0.8;
  }

  .insight-content h4 {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-xs) 0;
  }

  .insight-content p {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin: 0;
    line-height: var(--line-height-normal);
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .analytics-modal {
      padding: 0;
      align-items: stretch;
    }

    .analytics-content {
      margin: 0;
      border-radius: 0;
      max-height: 100vh;
    }

    .analytics-header {
      border-radius: 0;
    }

    .analytics-controls {
      flex-direction: column;
      gap: var(--space-md);
    }

    .metrics-grid {
      grid-template-columns: 1fr;
    }

    .insights-grid {
      grid-template-columns: 1fr;
    }

    .chart-header {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-sm);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .analytics-content,
    .metric-card,
    .chart-container,
    .insights-section {
      border-width: 2px;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .loading-spinner {
      animation: none;
    }

    .metric-card:hover,
    .btn-retry:hover {
      transform: none;
    }
  }
</style>