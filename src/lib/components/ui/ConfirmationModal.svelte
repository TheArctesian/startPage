<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let isOpen = false;
	export let title = 'Confirm Action';
	export let message = 'Are you sure you want to continue?';
	export let confirmText = 'Confirm';
	export let cancelText = 'Cancel';
	export let confirmVariant: 'danger' | 'primary' = 'danger';
	export let icon = '⚠';

	const dispatch = createEventDispatcher<{
		confirm: void;
		cancel: void;
		close: void;
	}>();

	// Handle backdrop click
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleCancel();
		}
	}

	// Handle confirm action
	function handleConfirm() {
		dispatch('confirm');
		isOpen = false;
	}

	// Handle cancel action
	function handleCancel() {
		dispatch('cancel');
		isOpen = false;
	}

	// Handle keyboard events
	function handleKeydown(event: KeyboardEvent) {
		if (!isOpen) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			handleCancel();
		} else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			handleConfirm();
		}
	}

	// Focus management
	let confirmButton: HTMLButtonElement;
	$: if (isOpen && confirmButton) {
		setTimeout(() => confirmButton?.focus(), 100);
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div
		class="confirmation-modal"
		onclick={handleBackdropClick}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				dispatch('cancel');
			}
		}}
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirmation-title"
		aria-describedby="confirmation-message"
		tabindex="-1"
	>
		<div class="modal-content">
			<div class="modal-header">
				<div class="modal-icon {confirmVariant}">
					{icon}
				</div>
				<h2 id="confirmation-title" class="modal-title">
					{title}
				</h2>
			</div>

			<div class="modal-body">
				<p id="confirmation-message" class="modal-message">
					{message}
				</p>
			</div>

			<div class="modal-footer">
				<button
					class="btn btn-secondary"
					onclick={handleCancel}
					type="button"
				>
					{cancelText}
				</button>
				<button
					bind:this={confirmButton}
					class="btn btn-{confirmVariant}"
					onclick={handleConfirm}
					type="button"
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.confirmation-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(2px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: var(--nord0);
		border: 1px solid var(--nord3);
		border-radius: 0.75rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
					0 10px 10px -5px rgba(0, 0, 0, 0.04);
		max-width: 28rem;
		width: 100%;
		animation: modal-appear 0.2s ease-out;
	}

	@keyframes modal-appear {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(-10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem 1.5rem 1rem;
	}

	.modal-icon {
		font-size: 1.5rem;
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.modal-icon.danger {
		background: rgba(191, 97, 106, 0.1);
		color: var(--nord11);
	}

	.modal-icon.primary {
		background: rgba(129, 161, 193, 0.1);
		color: var(--nord8);
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0;
		line-height: 1.4;
	}

	.modal-body {
		padding: 0 1.5rem 1rem;
	}

	.modal-message {
		font-size: 0.875rem;
		color: var(--nord4);
		line-height: 1.5;
		margin: 0;
	}

	.modal-footer {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		padding: 1rem 1.5rem 1.5rem;
		border-top: 1px solid var(--nord3);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.375rem;
		border: 1px solid;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 5rem;
	}

	.btn:focus {
		outline: 2px solid var(--nord8);
		outline-offset: 2px;
	}

	.btn-secondary {
		background: transparent;
		border-color: var(--nord3);
		color: var(--nord4);
	}

	.btn-secondary:hover {
		background: var(--nord2);
		border-color: var(--nord4);
		color: var(--nord6);
	}

	.btn-danger {
		background: var(--nord11);
		border-color: var(--nord11);
		color: white;
	}

	.btn-danger:hover {
		background: #b84c5c;
		border-color: #b84c5c;
	}

	.btn-primary {
		background: var(--nord8);
		border-color: var(--nord8);
		color: white;
	}

	.btn-primary:hover {
		background: #7394b0;
		border-color: #7394b0;
	}

	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.confirmation-modal {
			padding: 0.5rem;
		}

		.modal-content {
			max-width: none;
		}

		.modal-header {
			padding: 1rem 1rem 0.75rem;
			gap: 0.75rem;
		}

		.modal-icon {
			width: 2.5rem;
			height: 2.5rem;
			font-size: 1.25rem;
		}

		.modal-title {
			font-size: 1rem;
		}

		.modal-body {
			padding: 0 1rem 0.75rem;
		}

		.modal-footer {
			padding: 0.75rem 1rem 1rem;
			gap: 0.5rem;
		}

		.btn {
			flex: 1;
			min-width: auto;
		}
	}

	/* Accessibility improvements */
	@media (prefers-reduced-motion: reduce) {
		.modal-content {
			animation: none;
		}
	}

	@media (prefers-contrast: high) {
		.modal-content {
			border-width: 2px;
		}

		.btn {
			border-width: 2px;
		}
	}
</style>