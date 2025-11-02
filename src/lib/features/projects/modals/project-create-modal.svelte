<script lang="ts">
	import { createProject, loadProjects, projects } from '$lib/stores';
	import { toasts } from '$lib/stores/toasts';
	import type { NewProject, ProjectWithDetails } from '$lib/types/database';

	let {
		isOpen = $bindable(false),
		defaultParentId = null,
		onclose,
		oncreated
	} = $props<{
		isOpen?: boolean;
		defaultParentId?: number | null;
		onclose?: () => void;
		oncreated?: (event: { project: ProjectWithDetails }) => void;
	}>();

	// Form state
	let projectName = $state('');
	let projectDescription = $state('');
	let projectColor = $state('--nord8');
	let projectParentId = $state<number | null>(null);
	let isPrivate = $state(false);
	let isCreating = $state(false);
	let errorMessage = $state('');

	// Color options for projects
	const colorOptions = [
		{ name: 'Blue', value: '--nord8', bg: 'var(--nord8)' },
		{ name: 'Cyan', value: '--nord7', bg: 'var(--nord7)' },
		{ name: 'Teal', value: '--nord9', bg: 'var(--nord9)' },
		{ name: 'Purple', value: '--nord10', bg: 'var(--nord10)' },
		{ name: 'Green', value: '--nord14', bg: 'var(--nord14)' },
		{ name: 'Orange', value: '--nord12', bg: 'var(--nord12)' },
		{ name: 'Red', value: '--nord11', bg: 'var(--nord11)' },
		{ name: 'Yellow', value: '--nord13', bg: 'var(--nord13)' }
	];


	// Get available parent projects
	const availableParents = $derived($projects.filter(p => p.id !== defaultParentId));

	// Reset form when modal opens
	$effect(() => {
		if (isOpen) {
			projectName = '';
			projectDescription = '';
			projectColor = '--nord8';
			projectParentId = defaultParentId;
			isPrivate = false;
			errorMessage = '';
		}
	});

	// Handle backdrop click
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	// Handle close
	function handleClose() {
		isOpen = false;
		onclose?.();
	}

	// Handle create project form submission
	async function handleCreateProject() {
		if (!projectName.trim() || isCreating) return;

		isCreating = true;
		errorMessage = '';

		try {
			// Clean the data to ensure only valid project properties are sent
			let cleanParentId: number | null = null;
			if (projectParentId && typeof projectParentId === 'number') {
				cleanParentId = projectParentId;
			} else if (
				projectParentId &&
				typeof projectParentId === 'string' &&
				projectParentId !== ''
			) {
				const parsed = parseInt(projectParentId);
				if (!isNaN(parsed)) {
					cleanParentId = parsed;
				}
			}

			const projectData: NewProject = {
				name: projectName.trim(),
				description: projectDescription.trim() || undefined,
				color: projectColor,
				isActive: true,
				isPublic: !isPrivate,
				parentId: cleanParentId
			};

			console.log('🚀 Creating project with data:', projectData);

			const project = await createProject(projectData);

			// Show success toast
			toasts.success('Project Created', `"${project.name}" has been created successfully.`);

			// Reload projects to ensure proper hierarchy
			await loadProjects(true);

			oncreated?.({ project });
			handleClose();
		} catch (error) {
			console.error('Failed to create project:', error);
			errorMessage = error instanceof Error ? error.message : 'Failed to create project';
			toasts.error('Project Creation Failed', errorMessage);
		} finally {
			isCreating = false;
		}
	}

	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (!isOpen) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			handleClose();
		} else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			handleCreateProject();
		}
	}


	// Focus management
	let nameInput = $state<HTMLInputElement>();
	$effect(() => {
		if (isOpen && nameInput) {
			const timeoutId = setTimeout(() => nameInput?.focus(), 100);
			return () => clearTimeout(timeoutId);
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<div
		class="modal-backdrop"
		onclick={handleBackdropClick}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				handleClose();
			}
		}}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="-1"
	>
		<div class="modal-content">
			<div class="modal-header">
				<h2 id="modal-title" class="modal-title">
					{defaultParentId ? 'Create Sub-project' : 'Create New Project'}
				</h2>
				<button
					class="modal-close"
					onclick={handleClose}
					aria-label="Close modal"
					title="Close"
				>
					✕
				</button>
			</div>

			<div class="modal-body">
				<form class="project-form" onsubmit={(e) => { e.preventDefault(); handleCreateProject(); }}>
					<!-- Project Name -->
					<div class="form-group">
						<label for="project-name" class="form-label">Project Name</label>
						<input
							bind:this={nameInput}
							bind:value={projectName}
							id="project-name"
							type="text"
							class="form-input"
							placeholder="Enter project name"
							required
							autocomplete="off"
						/>
					</div>

					<!-- Project Description -->
					<div class="form-group">
						<label for="project-description" class="form-label">Description (Optional)</label>
						<textarea
							bind:value={projectDescription}
							id="project-description"
							class="form-textarea"
							placeholder="Brief project description"
							rows="3"
						></textarea>
					</div>

					<!-- Parent Project -->
					{#if availableParents.length > 0}
						<div class="form-group">
							<label for="project-parent" class="form-label">Parent Project</label>
							<select
								bind:value={projectParentId}
								id="project-parent"
								class="form-select"
							>
								<option value="">No parent (root project)</option>
								{#each availableParents as parent (parent.id)}
									<option value={parent.id}>{parent.name}</option>
								{/each}
							</select>
						</div>
					{/if}

					<!-- Privacy Setting -->
					<div class="form-group">
						<div class="privacy-section">
							<div class="privacy-control">
								<label class="privacy-label" for="project-privacy">
									<input
										bind:checked={isPrivate}
										id="project-privacy"
										type="checkbox"
										class="privacy-checkbox"
									/>
									<span class="checkmark"></span>
									Private Project
								</label>
								<div class="privacy-info" title="Private projects are only visible to you and users you invite">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<circle cx="12" cy="12" r="10"/>
										<path d="M9,9h6v2H9V9z M12,17h0.01"/>
									</svg>
								</div>
							</div>
							<div class="privacy-description">
								{#if isPrivate}
									<span class="privacy-text private">
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
											<circle cx="12" cy="16" r="1"/>
											<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
										</svg>
										Only you and invited users can see this project
									</span>
								{:else}
									<span class="privacy-text public">
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<circle cx="12" cy="12" r="10"/>
											<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
											<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
										</svg>
										All users can see this project
									</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- Color Selection -->
					<div class="form-group">
						<div id="color-label" class="form-label">Color</div>
						<div class="color-grid" role="radiogroup" aria-labelledby="color-label">
							{#each colorOptions as color (color.value)}
								<button
									type="button"
									class="color-option"
									class:selected={projectColor === color.value}
									style="background-color: {color.bg}"
									onclick={() => (projectColor = color.value)}
									title={color.name}
									role="radio"
									aria-checked={projectColor === color.value}
									aria-label="Select {color.name} color"
								></button>
							{/each}
						</div>
					</div>


					<!-- Error Message -->
					{#if errorMessage}
						<div class="error-message">
							{errorMessage}
						</div>
					{/if}
				</form>
			</div>

			<div class="modal-footer">
				<button
					type="button"
					class="btn btn-secondary"
					onclick={handleClose}
					disabled={isCreating}
				>
					Cancel
				</button>
				<button
					type="button"
					class="btn btn-primary"
					onclick={handleCreateProject}
					disabled={!projectName.trim() || isCreating}
				>
					{#if isCreating}
						Creating...
					{:else}
						Create Project
					{/if}
				</button>
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
		max-width: 32rem;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
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
		justify-content: space-between;
		padding: 1.5rem 1.5rem 0;
		border-bottom: 1px solid var(--nord3);
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0;
	}

	.modal-close {
		background: transparent;
		border: none;
		color: var(--nord4);
		cursor: pointer;
		font-size: 1.125rem;
		padding: 0.25rem;
		border-radius: 0.25rem;
		transition: all 0.2s ease;
	}

	.modal-close:hover {
		background: var(--nord3);
		color: var(--nord6);
	}

	.modal-body {
		padding: 0 1.5rem;
	}

	.project-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--nord6);
	}

	.form-input,
	.form-textarea,
	.form-select {
		padding: 0.75rem;
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
		background: var(--nord1);
		color: var(--nord6);
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.form-input:focus,
	.form-textarea:focus,
	.form-select:focus {
		outline: none;
		border-color: var(--nord8);
		box-shadow: 0 0 0 3px rgba(129, 161, 193, 0.1);
	}

	.form-textarea {
		resize: vertical;
		min-height: 4rem;
	}

	.color-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
	}

	.color-option {
		width: 2.5rem;
		height: 2.5rem;
		border: 2px solid transparent;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		position: relative;
	}

	.color-option:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.color-option.selected {
		border-color: var(--nord6);
		box-shadow: 0 0 0 2px var(--nord0), 0 0 0 4px var(--nord8);
	}


	.modal-footer {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		padding: 1.5rem;
		border-top: 1px solid var(--nord3);
		margin-top: 1.5rem;
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

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: transparent;
		border-color: var(--nord3);
		color: var(--nord4);
	}

	.btn-secondary:hover:not(:disabled) {
		background: var(--nord2);
		border-color: var(--nord4);
		color: var(--nord6);
	}

	.btn-primary {
		background: var(--nord8);
		border-color: var(--nord8);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #7394b0;
		border-color: #7394b0;
	}

	.error-message {
		color: var(--nord11);
		font-size: 0.8125rem;
		padding: 0.75rem;
		background: rgba(191, 97, 106, 0.1);
		border: 1px solid rgba(191, 97, 106, 0.2);
		border-radius: 0.375rem;
	}

	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.modal-backdrop {
			padding: 0.5rem;
		}

		.modal-header,
		.modal-body,
		.modal-footer {
			padding-left: 1rem;
			padding-right: 1rem;
		}

		.color-grid {
			grid-template-columns: repeat(4, 1fr);
		}


		.modal-footer {
			gap: 0.5rem;
		}

		.btn {
			flex: 1;
			min-width: auto;
		}
	}

	/* Privacy section styles */
	.privacy-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.privacy-control {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.privacy-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		user-select: none;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--nord6);
	}

	.privacy-checkbox {
		appearance: none;
		width: 1.25rem;
		height: 1.25rem;
		border: 2px solid var(--nord3);
		border-radius: 0.25rem;
		background: var(--nord0);
		cursor: pointer;
		position: relative;
		transition: all 0.2s ease;
	}

	.privacy-checkbox:checked {
		background: var(--nord8);
		border-color: var(--nord8);
	}

	.privacy-checkbox:checked::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 0.5rem;
		height: 0.5rem;
		background: white;
		border-radius: 0.125rem;
	}

	.privacy-checkbox:focus {
		outline: 2px solid var(--nord8);
		outline-offset: 2px;
	}

	.privacy-info {
		color: var(--nord4);
		cursor: help;
		opacity: 0.7;
		transition: opacity 0.2s ease;
	}

	.privacy-info:hover {
		opacity: 1;
	}

	.privacy-description {
		margin-left: 1.75rem;
	}

	.privacy-text {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		border: 1px solid;
		transition: all 0.2s ease;
	}

	.privacy-text.private {
		color: var(--nord12);
		background: rgba(235, 203, 139, 0.1);
		border-color: rgba(235, 203, 139, 0.2);
	}

	.privacy-text.public {
		color: var(--nord14);
		background: rgba(163, 190, 140, 0.1);
		border-color: rgba(163, 190, 140, 0.2);
	}

	/* Accessibility improvements */
	@media (prefers-reduced-motion: reduce) {
		.modal-content {
			animation: none;
		}

		.color-option:hover {
			transform: none;
		}
	}

	@media (prefers-contrast: high) {
		.modal-content {
			border-width: 2px;
		}

		.form-input,
		.form-textarea,
		.form-select {
			border-width: 2px;
		}
	}
</style>
