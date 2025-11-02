<script lang="ts">
	import { toasts } from '$lib/stores/toasts';
	import { fly } from 'svelte/transition';

	// Subscribe to toast store
	let toastList = $derived($toasts.toasts);

	// Handle toast dismiss
	function dismissToast(id: string) {
		toasts.removeToast(id);
	}

	// Get icon for toast type
	function getIcon(type: string): string {
		switch (type) {
			case 'error':
				return '✕';
			case 'success':
				return '✓';
			case 'warning':
				return '⚠';
			case 'info':
			default:
				return 'ℹ';
		}
	}
</script>

<!-- Toast Container -->
<div class="toast-container" aria-live="polite">
	{#each toastList as toast (toast.id)}
		<div
			class="toast toast-{toast.type}"
			transition:fly={{ x: 300, duration: 300 }}
			role="alert"
			aria-atomic="true"
		>
			<div class="toast-content">
				<div class="toast-icon">
					{getIcon(toast.type)}
				</div>
				<div class="toast-text">
					<div class="toast-title">{toast.title}</div>
					{#if toast.message}
						<div class="toast-message">{toast.message}</div>
					{/if}
				</div>
				{#if toast.dismissible}
					<button
						class="toast-dismiss"
						onclick={() => dismissToast(toast.id)}
						aria-label="Dismiss notification"
						title="Dismiss"
					>
						✕
					</button>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		pointer-events: none;
		max-width: 24rem;
	}

	.toast {
		pointer-events: auto;
		background: var(--nord1);
		border: 1px solid var(--nord3);
		border-radius: 0.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		padding: 1rem;
		min-width: 20rem;
		max-width: 24rem;
	}

	.toast-content {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.toast-icon {
		font-size: 1.125rem;
		font-weight: 600;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.toast-text {
		flex: 1;
		min-width: 0;
	}

	.toast-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0;
		line-height: 1.4;
	}

	.toast-message {
		font-size: 0.8125rem;
		color: var(--nord4);
		margin-top: 0.25rem;
		line-height: 1.4;
		word-wrap: break-word;
	}

	.toast-dismiss {
		background: transparent;
		border: none;
		color: var(--nord4);
		cursor: pointer;
		font-size: 0.875rem;
		padding: 0.25rem;
		border-radius: 0.25rem;
		flex-shrink: 0;
		transition: all 0.2s ease;
		margin-top: -0.25rem;
		margin-right: -0.25rem;
	}

	.toast-dismiss:hover {
		background: var(--nord3);
		color: var(--nord6);
	}

	.toast-dismiss:focus {
		outline: 2px solid var(--nord8);
		outline-offset: 2px;
	}

	/* Toast Type Styles */
	.toast-error {
		border-left: 4px solid var(--nord11);
	}

	.toast-error .toast-icon {
		color: var(--nord11);
	}

	.toast-success {
		border-left: 4px solid var(--nord14);
	}

	.toast-success .toast-icon {
		color: var(--nord14);
	}

	.toast-warning {
		border-left: 4px solid var(--nord13);
	}

	.toast-warning .toast-icon {
		color: var(--nord13);
	}

	.toast-info {
		border-left: 4px solid var(--nord8);
	}

	.toast-info .toast-icon {
		color: var(--nord8);
	}

	/* Mobile Responsive */
	@media (max-width: 640px) {
		.toast-container {
			top: 0.5rem;
			left: 0.5rem;
			right: 0.5rem;
			max-width: none;
		}

		.toast {
			min-width: auto;
			max-width: none;
			padding: 0.875rem;
		}

		.toast-title {
			font-size: 0.8125rem;
		}

		.toast-message {
			font-size: 0.75rem;
		}
	}

	/* Animation improvements */
	@media (prefers-reduced-motion: reduce) {
		.toast {
			transition: none;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.toast {
			border-width: 2px;
		}

		.toast-error {
			border-left-width: 6px;
		}

		.toast-success {
			border-left-width: 6px;
		}

		.toast-warning {
			border-left-width: 6px;
		}

		.toast-info {
			border-left-width: 6px;
		}
	}
</style>