<!--
  Daily Pattern Chart Component

  Displays weekly activity pattern as vertical bars.
  UNIX philosophy: single responsibility.
-->

<script lang="ts">
	import { formatHours } from '$lib/utils/analytics/formatting';

	interface DayData {
		day: string;
		tasks: number;
		time: number; // in minutes
	}

	interface Props {
		data: DayData[];
	}

	let { data }: Props = $props();

	let maxTasks = $derived(Math.max(...data.map((d) => d.tasks), 1));
	let hasData = $derived(data.some((d) => d.tasks > 0));
</script>

{#if hasData}
	<div class="report-section">
		<h4 class="section-title">📅 Daily Pattern</h4>
		<div class="daily-chart">
			{#each data as day}
				<div class="day-column">
					<div class="day-label">{day.day}</div>
					<div class="day-bar">
						<div
							class="day-fill"
							style:height="{Math.max(5, (day.tasks / maxTasks) * 100)}%"
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

<style>
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

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.daily-chart {
			height: 120px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.day-fill {
			transition: none;
		}
	}
</style>
