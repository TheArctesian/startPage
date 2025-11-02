<script lang="ts">
	import ProjectEditForm from '../ProjectEditForm.svelte';
	import ProjectPermissionsPanel from '../ProjectPermissionsPanel.svelte';
	import type { Project } from '$lib/types/database';

	interface Props {
		isOpen?: boolean;
		project?: Project | null;
		onclose?: () => void;
		onupdated?: (event: { project: Project }) => void;
	}

	let {
		isOpen = $bindable(false),
		project = $bindable(null),
		onclose,
		onupdated
	}: Props = $props();

	let activeTab = $state<'info' | 'permissions'>('info');

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	function handleClose() {
		isOpen = false;
		onclose?.();
		// Reset to info tab when closed
		activeTab = 'info';
	}

	function handleSave(updated: Project) {
		onupdated?.({ project: updated });
		handleClose();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}

	// Reset to info tab when modal opens
	$effect(() => {
		if (isOpen) {
			activeTab = 'info';
		}
	});
</script>

{#if isOpen && project}
	<div
		class="modal-backdrop"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="edit-project-title"
		tabindex="-1"
	>
		<div class="modal-content">
			<!-- Modal Header -->
			<div class="modal-header">
				<h3 id="edit-project-title" class="modal-title">Edit Project</h3>
				<button
					class="close-btn"
					onclick={handleClose}
					title="Close"
					aria-label="Close dialog"
				>
					✕
				</button>
			</div>

			<!-- Tabs -->
			<div class="modal-tabs">
				<button
					class="tab-btn"
					class:active={activeTab === 'info'}
					onclick={() => (activeTab = 'info')}
				>
					Project Info
				</button>
				{#if !project.isPublic}
					<button
						class="tab-btn"
						class:active={activeTab === 'permissions'}
						onclick={() => (activeTab = 'permissions')}
					>
						Permissions
					</button>
				{/if}
			</div>

			<!-- Tab Content -->
			<div class="modal-body">
				{#if activeTab === 'info'}
					<ProjectEditForm {project} onSave={handleSave} onCancel={handleClose} />
				{:else if activeTab === 'permissions'}
					<ProjectPermissionsPanel projectId={project.id} />
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
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
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem 1.5rem 0;
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0;
	}

	.close-btn {
		width: 2rem;
		height: 2rem;
		border: none;
		background: transparent;
		color: var(--nord4);
		cursor: pointer;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		background: var(--nord2);
		color: var(--nord6);
	}

	.modal-tabs {
		display: flex;
		gap: 0.5rem;
		padding: 1rem 1.5rem 0;
		border-bottom: 1px solid var(--nord3);
	}

	.tab-btn {
		padding: 0.5rem 1rem;
		border: none;
		background: transparent;
		color: var(--nord4);
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		border-bottom: 2px solid transparent;
		transition: all 0.2s ease;
	}

	.tab-btn:hover {
		color: var(--nord6);
	}

	.tab-btn.active {
		color: var(--nord8);
		border-bottom-color: var(--nord8);
	}

	.modal-body {
		padding: 1.5rem;
	}

	@media (max-width: 768px) {
		.modal-content {
			margin: 0.5rem;
			max-width: none;
		}

		.modal-header,
		.modal-tabs,
		.modal-body {
			padding-left: 1rem;
			padding-right: 1rem;
		}
	}
</style>
