<!--
  Intensity Chart Component

  Displays task intensity distribution with horizontal bars.
  UNIX philosophy: single responsibility.
-->

<script lang="ts">
	import { getIntensityColor } from '$lib/utils/analytics/styles';

	interface IntensityData {
		level: number;
		count: number;
		percentage: number;
	}

	interface Props {
		data: IntensityData[];
	}

	let { data }: Props = $props();
</script>

{#if data.length > 0}
	<div class="report-section">
		<h4 class="section-title">💪 Task Intensity</h4>
		<div class="intensity-chart">
			{#each data as intensity}
				<div class="intensity-bar">
					<div class="intensity-label">
						Level {intensity.level}
					</div>
					<div class="intensity-visual">
						<div
							class="intensity-fill"
							style:width="{intensity.percentage}%"
							style:background-color={getIntensityColor(intensity.level)}
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

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.intensity-bar {
			grid-template-columns: 1fr;
			gap: var(--space-xs);
			text-align: center;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.intensity-fill {
			transition: none;
		}
	}
</style>
