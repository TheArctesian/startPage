<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	export let isOpen = false;
	export let title = '';
	export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
	export let closeOnOverlay = true;
	export let showClose = true;
	export let showHeader = true;
	export let showFooter = false;

	const dispatch = createEventDispatcher();

	let modalElement: HTMLDivElement;
	let previousActiveElement: HTMLElement | null = null;

	function handleClose() {
		dispatch('close');
	}

	function handleOverlayClick(event: MouseEvent) {
		if (closeOnOverlay && event.target === event.currentTarget) {
			handleClose();
		}
	}

	function handleEscape(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			handleClose();
		}
	}

	function trapFocus(event: FocusEvent) {
		if (!modalElement || !isOpen) return;

		const focusableElements = modalElement.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		const firstElement = focusableElements[0] as HTMLElement;
		const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

		if (event.target === lastElement && !event.shiftKey) {
			event.preventDefault();
			firstElement?.focus();
		} else if (event.target === firstElement && event.shiftKey) {
			event.preventDefault();
			lastElement?.focus();
		}
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleEscape);
			
			if (isOpen) {
				previousActiveElement = document.activeElement as HTMLElement;
				// Focus the modal for accessibility
				setTimeout(() => modalElement?.focus(), 100);
			}
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleEscape);
			
			// Restore focus to previous element
			if (previousActiveElement) {
				previousActiveElement.focus();
			}
		}
	});

	$: modalClass = ['modal-content', `modal-${size}`].join(' ');

	// Lock body scroll when modal is open
	$: if (typeof document !== 'undefined') {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
	}
</script>

{#if isOpen}
	<div
		class="modal-overlay"
		on:click={handleOverlayClick}
		on:keydown={trapFocus}
		transition:fade={{ duration: 200 }}
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? 'modal-title' : undefined}
	>
		<div
			bind:this={modalElement}
			class={modalClass}
			transition:scale={{ duration: 200, start: 0.95 }}
			tabindex="-1"
		>
			{#if showHeader}
				<div class="modal-header">
					{#if title}
						<h2 id="modal-title" class="modal-title">{title}</h2>
					{:else}
						<slot name="header" />
					{/if}
					{#if showClose}
						<button
							class="modal-close"
							on:click={handleClose}
							aria-label="Close modal"
							type="button"
						>
							✕
						</button>
					{/if}
				</div>
			{/if}

			<div class="modal-body">
				<slot name="body">
					<slot />
				</slot>
			</div>

			{#if showFooter || $$slots.footer}
				<div class="modal-footer">
					<slot name="footer" />
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
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
		border-radius: var(--radius-lg);
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		outline: none;
	}

	/* Size variants */
	.modal-sm {
		max-width: 400px;
	}

	.modal-md {
		max-width: 600px;
	}

	.modal-lg {
		max-width: 800px;
	}

	.modal-xl {
		max-width: 1200px;
	}

	/* Header */
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid var(--nord3);
		background: var(--nord1);
		flex-shrink: 0;
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0;
	}

	.modal-close {
		width: 2rem;
		height: 2rem;
		border: none;
		background: transparent;
		color: var(--nord4);
		cursor: pointer;
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		font-size: 1.125rem;
		line-height: 1;
		padding: 0;
	}

	.modal-close:hover {
		background: var(--nord2);
		color: var(--nord6);
	}

	.modal-close:focus {
		outline: 2px solid var(--nord8);
		outline-offset: 2px;
	}

	/* Body */
	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		min-height: 0;
	}

	/* Footer */
	.modal-footer {
		padding: 1.5rem;
		border-top: 1px solid var(--nord3);
		background: var(--nord1);
		flex-shrink: 0;
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	/* Mobile responsive */
	@media (max-width: 640px) {
		.modal-overlay {
			padding: 0;
			align-items: flex-end;
		}

		.modal-content {
			max-width: 100%;
			width: 100%;
			max-height: 95vh;
			border-radius: var(--radius-lg) var(--radius-lg) 0 0;
			margin: 0;
		}

		.modal-body {
			padding: 1rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.modal-overlay,
		.modal-content {
			animation: none;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.modal-content {
			border-width: 2px;
		}

		.modal-header,
		.modal-footer {
			border-width: 2px;
		}
	}
</style>