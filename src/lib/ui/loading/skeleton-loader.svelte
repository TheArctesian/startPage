<script lang="ts">
	let {
		variant = 'text',
		width = '100%',
		height = 'auto',
		count = 1,
		animate = true,
		rounded = false
	} = $props<{
		variant?: 'text' | 'card' | 'button' | 'avatar' | 'custom';
		width?: string;
		height?: string;
		count?: number;
		animate?: boolean;
		rounded?: boolean;
	}>();

	let skeletonClass = $derived([
		'skeleton',
		`skeleton-${variant}`,
		animate && 'skeleton-animate',
		rounded && 'skeleton-rounded'
	]
		.filter(Boolean)
		.join(' '));

	let customStyle = $derived(variant === 'custom' ? `width: ${width}; height: ${height};` : '');
</script>

<div class="skeleton-container">
	{#each Array(count) as _, i (i)}
		<div class={skeletonClass} style={customStyle} aria-hidden="true">
			<span class="skeleton-content"></span>
		</div>
	{/each}
</div>

<style>
	.skeleton-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}

	.skeleton {
		position: relative;
		overflow: hidden;
		background: var(--nord2);
		border-radius: var(--radius-sm);
	}

	.skeleton-rounded {
		border-radius: var(--radius-lg);
	}

	/* Variant styles */
	.skeleton-text {
		height: 1rem;
		width: 100%;
		margin: 0.25rem 0;
	}

	.skeleton-text:last-child {
		width: 60%;
	}

	.skeleton-card {
		height: 120px;
		width: 100%;
		border-radius: var(--radius-lg);
		border: 1px solid var(--nord3);
	}

	.skeleton-button {
		height: 2.5rem;
		width: 120px;
		border-radius: var(--radius-lg);
	}

	.skeleton-avatar {
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.skeleton-custom {
		/* Width and height set via inline styles */
	}

	/* Animation */
	.skeleton-animate::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(136, 192, 208, 0.1),
			transparent
		);
		transform: translateX(-100%);
		animation: shimmer 2s infinite;
	}

	@keyframes shimmer {
		100% {
			transform: translateX(100%);
		}
	}

	/* Task card skeleton specific */
	.skeleton-task-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background: var(--nord1);
		border: 1px solid var(--nord3);
		border-radius: var(--radius-lg);
		margin-bottom: 0.75rem;
	}

	/* Column skeleton */
	.skeleton-column {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 200px;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.skeleton-animate::before {
			animation: none;
			background: rgba(136, 192, 208, 0.05);
		}
	}
</style>
