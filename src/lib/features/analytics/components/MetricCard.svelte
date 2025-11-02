<!--
  Metric Card Component

  Displays a single metric with icon, value, and label.
  UNIX philosophy: single responsibility, reusable.
-->

<script lang="ts">
	interface Props {
		icon: string;
		value: string | number;
		label: string;
		sublabel?: string;
		valueColor?: string;
		class?: string;
	}

	let { icon, value, label, sublabel, valueColor, class: className = '' }: Props = $props();
</script>

<div class="metric-card {className}">
	<div class="metric-icon">{icon}</div>
	<div class="metric-content">
		<div class="metric-value" style:color={valueColor}>{value}</div>
		<div class="metric-label">{label}</div>
		{#if sublabel}
			<div class="metric-sublabel">{sublabel}</div>
		{/if}
	</div>
</div>

<style>
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

	/* Responsive */
	@media (prefers-reduced-motion: reduce) {
		.metric-card:hover {
			transform: none;
		}
	}
</style>
