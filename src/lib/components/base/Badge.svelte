<script lang="ts">
	export let variant: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' = 'default';
	export let size: 'xs' | 'sm' | 'md' = 'sm';
	export let rounded = true;
	export let icon = '';
	export let color = '';
	export let intensity: number | null = null;

	$: badgeClass = [
		'badge',
		`badge-${variant}`,
		`badge-${size}`,
		rounded && 'badge-rounded',
		intensity && `badge-intensity-${intensity}`
	]
		.filter(Boolean)
		.join(' ');

	$: customStyle = color ? `background-color: ${color}; color: white;` : '';
</script>

<span class={badgeClass} style={customStyle} {...$$restProps}>
	{#if icon}
		<span class="badge-icon">{icon}</span>
	{/if}
	<slot />
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		font-weight: 500;
		line-height: 1;
		border: 1px solid transparent;
		transition: all 0.2s ease;
	}

	/* Size variants */
	.badge-xs {
		padding: 0.125rem 0.375rem;
		font-size: 0.625rem;
		border-radius: var(--radius-sm);
	}

	.badge-sm {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		border-radius: var(--radius-sm);
	}

	.badge-md {
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
		border-radius: var(--radius-md);
	}

	/* Rounded variant */
	.badge-rounded {
		border-radius: 9999px;
	}

	/* Color variants */
	.badge-default {
		background: var(--nord2);
		color: var(--nord6);
		border-color: var(--nord3);
	}

	.badge-primary {
		background: rgba(136, 192, 208, 0.15);
		color: var(--nord8);
		border-color: rgba(136, 192, 208, 0.3);
	}

	.badge-success {
		background: rgba(163, 190, 140, 0.15);
		color: var(--nord14);
		border-color: rgba(163, 190, 140, 0.3);
	}

	.badge-warning {
		background: rgba(235, 203, 139, 0.15);
		color: var(--nord13);
		border-color: rgba(235, 203, 139, 0.3);
	}

	.badge-error {
		background: rgba(191, 97, 106, 0.15);
		color: var(--nord11);
		border-color: rgba(191, 97, 106, 0.3);
	}

	.badge-info {
		background: rgba(129, 161, 193, 0.15);
		color: var(--nord9);
		border-color: rgba(129, 161, 193, 0.3);
	}

	/* Intensity variants */
	.badge-intensity-1 {
		background: rgba(163, 190, 140, 0.15);
		color: var(--intensity-1);
		border-color: rgba(163, 190, 140, 0.3);
	}

	.badge-intensity-2 {
		background: rgba(143, 188, 187, 0.15);
		color: var(--intensity-2);
		border-color: rgba(143, 188, 187, 0.3);
	}

	.badge-intensity-3 {
		background: rgba(136, 192, 208, 0.15);
		color: var(--intensity-3);
		border-color: rgba(136, 192, 208, 0.3);
	}

	.badge-intensity-4 {
		background: rgba(208, 135, 112, 0.15);
		color: var(--intensity-4);
		border-color: rgba(208, 135, 112, 0.3);
	}

	.badge-intensity-5 {
		background: rgba(191, 97, 106, 0.15);
		color: var(--intensity-5);
		border-color: rgba(191, 97, 106, 0.3);
	}

	.badge-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875em;
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.badge {
			border-width: 2px;
		}
	}
</style>