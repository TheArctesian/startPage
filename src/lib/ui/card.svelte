<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let variant: 'default' | 'elevated' | 'outlined' = 'default';
	export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
	export let interactive = false;
	export let selected = false;
	export let draggable = false;
	export let dragging = false;

	const dispatch = createEventDispatcher();

	function handleClick(event: MouseEvent) {
		if (interactive) {
			dispatch('click', event);
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (interactive && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			dispatch('click', event);
		}
	}

	$: cardClass = [
		'card',
		`card-${variant}`,
		`card-padding-${padding}`,
		interactive && 'card-interactive',
		selected && 'card-selected',
		draggable && 'card-draggable',
		dragging && 'card-dragging'
	]
		.filter(Boolean)
		.join(' ');
</script>

<div
	class={cardClass}
	role={interactive ? 'button' : 'article'}
	tabindex={interactive ? 0 : undefined}
	on:click={handleClick}
	on:keydown={handleKeyDown}
	on:mouseenter
	on:mouseleave
	on:focus
	on:blur
	{...$$restProps}
>
	<slot />
</div>

<style>
	/* Base card styles */
	.card {
		background: var(--nord1);
		border-radius: var(--radius-lg);
		box-sizing: border-box;
		position: relative;
		overflow: hidden;
		transition: all 0.2s ease;
	}

	/* Variants */
	.card-default {
		border: 1px solid var(--nord3);
	}

	.card-elevated {
		border: 1px solid var(--nord3);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	.card-outlined {
		border: 2px solid var(--nord3);
		background: transparent;
	}

	/* Padding variants */
	.card-padding-none {
		padding: 0;
	}

	.card-padding-sm {
		padding: var(--space-sm);
	}

	.card-padding-md {
		padding: var(--space-md);
	}

	.card-padding-lg {
		padding: var(--space-lg);
	}

	/* Interactive states */
	.card-interactive {
		cursor: pointer;
	}

	.card-interactive:hover {
		border-color: var(--nord8);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.card-interactive:active {
		transform: translateY(0);
	}

	.card-interactive:focus {
		outline: 2px solid var(--nord8);
		outline-offset: 2px;
	}

	/* Selected state */
	.card-selected {
		border-color: var(--nord8);
		background: rgba(136, 192, 208, 0.05);
		box-shadow: 0 0 0 3px rgba(136, 192, 208, 0.1);
	}

	/* Draggable states */
	.card-draggable {
		cursor: move;
	}

	.card-dragging {
		opacity: 0.7;
		transform: rotate(2deg) scale(1.02);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
		z-index: 1000;
		cursor: grabbing;
	}

	/* Accessibility */
	.card[role='button'] {
		user-select: none;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.card {
			transition: none;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.card {
			border-width: 2px;
		}
	}
</style>