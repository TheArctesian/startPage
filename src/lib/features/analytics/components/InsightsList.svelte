<!--
  Insights List Component

  Displays productivity insights and recommendations.
  UNIX philosophy: focused on insights display.
-->

<script lang="ts">
	interface Props {
		insights: string[];
	}

	let { insights }: Props = $props();
</script>

<div class="report-section">
	<h4 class="section-title">💡 Insights & Recommendations</h4>
	<div class="insights-list">
		{#each insights as insight}
			<div class="insight-item">
				<div class="insight-icon">•</div>
				<div class="insight-text">{insight}</div>
			</div>
		{/each}
	</div>
</div>

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
</style>
