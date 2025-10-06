<script lang="ts">
	import { fade } from 'svelte/transition';

	export let size: 'sm' | 'md' | 'lg' | 'full' = 'md';
	export let overlay = false;
	export let message = '';
	export let color = 'var(--nord8)';

	$: spinnerClass = ['spinner', `spinner-${size}`].join(' ');
	$: containerClass = ['loading-container', overlay && 'loading-overlay'].filter(Boolean).join(' ');
</script>

{#if overlay}
	<div class={containerClass} transition:fade={{ duration: 200 }}>
		<div class="loading-content">
			<div class={spinnerClass} style="--spinner-color: {color}">
				<div class="spinner-ring"></div>
				<div class="spinner-ring"></div>
				<div class="spinner-ring"></div>
				<div class="spinner-ring"></div>
			</div>
			{#if message}
				<p class="loading-message">{message}</p>
			{/if}
		</div>
	</div>
{:else}
	<div class={containerClass}>
		<div class={spinnerClass} style="--spinner-color: {color}">
			<div class="spinner-ring"></div>
			<div class="spinner-ring"></div>
			<div class="spinner-ring"></div>
			<div class="spinner-ring"></div>
		</div>
		{#if message}
			<p class="loading-message">{message}</p>
		{/if}
	</div>
{/if}

<style>
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem;
	}

	.loading-overlay {
		position: absolute;
		inset: 0;
		background: rgba(46, 52, 64, 0.8);
		backdrop-filter: blur(2px);
		z-index: 100;
		border-radius: inherit;
	}

	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.spinner {
		display: inline-block;
		position: relative;
	}

	.spinner-sm {
		width: 24px;
		height: 24px;
	}

	.spinner-md {
		width: 40px;
		height: 40px;
	}

	.spinner-lg {
		width: 64px;
		height: 64px;
	}

	.spinner-full {
		width: 80px;
		height: 80px;
	}

	.spinner-ring {
		position: absolute;
		width: 100%;
		height: 100%;
		border: 3px solid transparent;
		border-radius: 50%;
		animation: spin 2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
		border-color: var(--spinner-color) transparent transparent transparent;
	}

	.spinner-sm .spinner-ring {
		border-width: 2px;
	}

	.spinner-lg .spinner-ring,
	.spinner-full .spinner-ring {
		border-width: 4px;
	}

	.spinner-ring:nth-child(1) {
		animation-delay: -0.45s;
	}

	.spinner-ring:nth-child(2) {
		animation-delay: -0.3s;
	}

	.spinner-ring:nth-child(3) {
		animation-delay: -0.15s;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.loading-message {
		font-size: 0.875rem;
		color: var(--nord4);
		margin: 0;
		text-align: center;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.spinner-ring {
			animation: none;
			border-color: var(--spinner-color) !important;
		}

		.loading-message {
			animation: none;
		}
	}
</style>