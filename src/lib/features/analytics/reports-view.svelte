<!--
  Reports View

  Daily/weekly/monthly summaries and productivity reports.
  Follows UNIX philosophy: focused on report generation and display.
-->

<script lang="ts">
	import type { TaskWithDetails, Project } from '$lib/types/database';
	import type { ReportType } from '$lib/utils/analytics/calculations';
	import { generateReport } from '$lib/utils/analytics/calculations';
	import { fetchTasks } from '$lib/api/tasks';
	import { fetchProjects } from '$lib/api/projects';
	import ReportSummary from './components/ReportSummary.svelte';
	import ProjectBreakdown from './components/ProjectBreakdown.svelte';
	import IntensityChart from './components/IntensityChart.svelte';
	import DailyPatternChart from './components/DailyPatternChart.svelte';
	import InsightsList from './components/InsightsList.svelte';

	interface Props {
		isOpen?: boolean;
	}

	let { isOpen = $bindable(false) }: Props = $props();

	let tasks = $state<TaskWithDetails[]>([]);
	let projects = $state<Project[]>([]);
	let loading = $state(true);
	let reportType = $state<ReportType>('weekly');
	let selectedDate = $state(new Date().toISOString().split('T')[0]);

	// Generate report from utilities
	let reportData = $derived(generateReport(tasks, projects, reportType, new Date(selectedDate)));

	// Load data when opened
	$effect(() => {
		if (isOpen) {
			loadData();
		}
	});

	async function loadData() {
		loading = true;
		try {
			[tasks, projects] = await Promise.all([fetchTasks(), fetchProjects(true)]);
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

          <!-- Report Summary -->
          <ReportSummary
            period={reportData.period}
            completedTasks={reportData.completedTasks}
            totalTasks={reportData.totalTasks}
            totalTimeSpent={reportData.totalTimeSpent}
            averageTaskTime={reportData.averageTaskTime}
            productivityTrend={reportData.productivityTrend}
          />

          <!-- Report Sections -->
          <div class="report-sections">
            <ProjectBreakdown projects={reportData.topProjects} />
            <IntensityChart data={reportData.intensityBreakdown} />
            {#if reportType !== 'daily'}
              <DailyPatternChart data={reportData.dailyPattern} />
            {/if}
            <InsightsList insights={reportData.insights} />
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

  .report-sections {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
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
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .reports-content {
      border-width: 2px;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .loading-spinner {
      animation: none;
    }
  }
</style>