<!--
  Report Summary Component

  Displays key metrics and productivity trend for a report period.
  UNIX philosophy: focused on summary display.
-->

<script lang="ts">
	import { formatHours, formatAverage } from '$lib/utils/analytics/formatting';
	import { getTrendIcon, getTrendColor, type TrendType } from '$lib/utils/analytics/styles';

	interface Props {
		period: string;
		completedTasks: number;
		totalTasks: number;
		totalTimeSpent: number;
		averageTaskTime: number;
		productivityTrend: TrendType;
	}

	let { period, completedTasks, totalTasks, totalTimeSpent, averageTaskTime, productivityTrend }:
		Props = $props();

	let completionRate = $derived(Math.round((completedTasks / Math.max(1, totalTasks)) * 100));
	let trendLabel = $derived(
		productivityTrend === 'up'
			? 'Trending Up'
			: productivityTrend === 'down'
				? 'Trending Down'
				: 'Stable'
	);
</script>

<div class="report-summary">
	<div class="summary-header">
		<h3 class="summary-title">{period}</h3>
		<div class="summary-trend" style:color={getTrendColor(productivityTrend)}>
			<span class="trend-icon">{getTrendIcon(productivityTrend)}</span>
			<span class="trend-label">{trendLabel}</span>
		</div>
	</div>

	<div class="summary-metrics">
		<div class="metric">
			<div class="metric-value">{completedTasks}</div>
			<div class="metric-label">Tasks Completed</div>
		</div>
		<div class="metric">
			<div class="metric-value">{formatHours(totalTimeSpent)}</div>
			<div class="metric-label">Total Time</div>
		</div>
		<div class="metric">
			<div class="metric-value">{formatAverage(averageTaskTime)}</div>
			<div class="metric-label">Avg per Task</div>
		</div>
		<div class="metric">
			<div class="metric-value">{completionRate}%</div>
			<div class="metric-label">Completion Rate</div>
		</div>
	</div>
</div>

<style>
	.report-summary {
		background: var(--bg-elevated);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		border: 1px solid var(--border-default);
		margin-bottom: var(--space-xl);
	}

	.summary-header {
		display: flex;
		justify-content: space-between;
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

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.summary-header {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-sm);
		}

		.summary-metrics {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
