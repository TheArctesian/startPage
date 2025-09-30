<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface $$Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		loading?: boolean;
		fullWidth?: boolean;
	}

	export let variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled = false;
	export let loading = false;
	export let fullWidth = false;
	export let type: HTMLButtonAttributes['type'] = 'button';

	const dispatch = createEventDispatcher();

	function handleClick(event: MouseEvent) {
		if (!disabled && !loading) {
			dispatch('click', event);
		}
	}

	$: buttonClass = [
		'btn',
		`btn-${variant}`,
		`btn-${size}`,
		fullWidth && 'btn-full',
		loading && 'btn-loading',
		disabled && 'btn-disabled'
	]
		.filter(Boolean)
		.join(' ');
</script>

<button
	{type}
	class={buttonClass}
	{disabled}
	on:click={handleClick}
	on:keydown
	on:keyup
	on:mouseenter
	on:mouseleave
	on:focus
	on:blur
	{...$$restProps}
>
	{#if loading}
		<span class="btn-spinner" aria-hidden="true" />
		<span class="sr-only">Loading...</span>
	{/if}
	<span class="btn-content" class:invisible={loading}>
		<slot />
	</span>
</button>

<style>
	/* Base button styles */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		border: none;
		border-radius: var(--radius-lg);
		font-weight: 600;
		cursor: pointer;
		position: relative;
		transition: all 0.2s ease;
		outline: none;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	/* Size variants */
	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
	}

	.btn-md {
		padding: 0.75rem 1.5rem;
		font-size: 0.875rem;
	}

	.btn-lg {
		padding: 1rem 2rem;
		font-size: 1rem;
	}

	/* Color variants */
	.btn-primary {
		background: var(--nord8);
		color: var(--nord0);
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--nord9);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(129, 161, 193, 0.3);
	}

	.btn-primary:active:not(:disabled) {
		transform: translateY(0);
	}

	.btn-secondary {
		background: var(--nord3);
		color: var(--nord6);
	}

	.btn-secondary:hover:not(:disabled) {
		background: var(--nord2);
		transform: translateY(-1px);
	}

	.btn-ghost {
		background: transparent;
		color: var(--nord4);
		border: 1px solid var(--nord3);
	}

	.btn-ghost:hover:not(:disabled) {
		background: var(--nord2);
		border-color: var(--nord4);
		color: var(--nord6);
	}

	.btn-danger {
		background: var(--nord11);
		color: var(--nord6);
	}

	.btn-danger:hover:not(:disabled) {
		background: #c14651;
		transform: translateY(-1px);
	}

	/* States */
	.btn:disabled,
	.btn-disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none !important;
	}

	.btn-full {
		width: 100%;
	}

	.btn:focus-visible {
		outline: 2px solid var(--nord8);
		outline-offset: 2px;
	}

	/* Loading state */
	.btn-loading {
		color: transparent;
		pointer-events: none;
	}

	.btn-spinner {
		position: absolute;
		width: 1rem;
		height: 1rem;
		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	.btn-content {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.invisible {
		visibility: hidden;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.btn {
			transition: none;
		}
		.btn-spinner {
			animation: none;
		}
	}
</style>