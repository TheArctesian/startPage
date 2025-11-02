<script lang="ts">
	import { updateProject } from '$lib/api/projects';
	import ParentProjectSelector from './ParentProjectSelector.svelte';
	import { toasts } from '$lib/stores/toasts';
	import type { Project } from '$lib/types/database';

	interface Props {
		project: Project;
		onSave: (project: Project) => void;
		onCancel: () => void;
	}

	let { project, onSave, onCancel }: Props = $props();

	let form = $state({
		name: project.name,
		description: project.description || '',
		color: project.color || '--nord8',
		parentId: project.parentId || null,
		isPrivate: !project.isPublic
	});

	let isUpdating = $state(false);
	let errors = $state<Record<string, string>>({});

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

	function validate(): boolean {
		errors = {};
		if (!form.name.trim()) {
			errors.name = 'Name is required';
		}
		if (form.name.length > 255) {
			errors.name = 'Name must be less than 255 characters';
		}
		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
		if (!validate() || isUpdating) return;

		isUpdating = true;
		try {
			const updates = {
				name: form.name.trim(),
				description: form.description.trim() || undefined,
				color: form.color,
				parentId: form.parentId,
				isPublic: !form.isPrivate
			};

			const updated = await updateProject(project.id, updates);
			toasts.success('Project Updated', 'Project has been updated successfully.');
			onSave(updated);
		} catch (error) {
			console.error('Failed to update project:', error);
			toasts.error('Update Failed', 'Failed to update project. Please try again.');
		} finally {
			isUpdating = false;
		}
	}
</script>

<form class="edit-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
	<!-- Project Name -->
	<div class="form-group">
		<label for="project-name" class="form-label">Project Name *</label>
		<input
			bind:value={form.name}
			type="text"
			id="project-name"
			class="form-input"
			class:error={errors.name}
			placeholder="Enter project name..."
			maxlength="255"
			required
		/>
		{#if errors.name}
			<span class="error-message">{errors.name}</span>
		{/if}
	</div>

	<!-- Project Description -->
	<div class="form-group">
		<label for="project-description" class="form-label">Description</label>
		<textarea
			bind:value={form.description}
			id="project-description"
			class="form-textarea"
			placeholder="Describe this project..."
			rows="3"
		></textarea>
	</div>

	<!-- Parent Project -->
	<div class="form-group">
		<label for="project-parent" class="form-label">Parent Project</label>
		<ParentProjectSelector
			currentProjectId={project.id}
			bind:value={form.parentId}
		/>
	</div>

	<!-- Project Color -->
	<div class="form-group">
		<fieldset class="form-fieldset">
			<legend class="form-label">Color</legend>
			<div class="color-options">
				{#each colorOptions as color}
					<button
						type="button"
						class="color-option"
						class:selected={form.color === color.value}
						style="background-color: {color.bg}"
						onclick={() => (form.color = color.value)}
						title={color.name}
						aria-label="Select {color.name} color"
					>
						{#if form.color === color.value}
							✓
						{/if}
					</button>
				{/each}
			</div>
		</fieldset>
	</div>

	<!-- Privacy Setting -->
	<div class="form-group">
		<div class="privacy-section">
			<div class="privacy-control">
				<label class="privacy-label" for="project-privacy">
					<input
						bind:checked={form.isPrivate}
						id="project-privacy"
						type="checkbox"
						class="privacy-checkbox"
					/>
					Private Project
				</label>
			</div>
			<div class="privacy-description">
				{#if form.isPrivate}
					<span class="privacy-text private">
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
							<circle cx="12" cy="16" r="1" />
							<path d="M7 11V7a5 5 0 0 1 10 0v4" />
						</svg>
						Only you and invited users can see this project
					</span>
				{:else}
					<span class="privacy-text public">
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="12" cy="12" r="10" />
							<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
							<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
						</svg>
						All users can see this project
					</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Preview -->
	<div class="form-group">
		<div class="form-label">Preview</div>
		<div class="project-preview">
			<div class="preview-indicator" style="background-color: {form.color}">
				<div class="preview-dot"></div>
			</div>
			<span class="preview-name">
				{form.name || 'Project Name'}
			</span>
			{#if form.isPrivate}
				<div class="preview-privacy" title="Private project">
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
						<circle cx="12" cy="16" r="1" />
						<path d="M7 11V7a5 5 0 0 1 10 0v4" />
					</svg>
				</div>
			{/if}
		</div>
	</div>

	<!-- Form Actions -->
	<div class="form-actions">
		<button type="button" class="btn btn-secondary" onclick={onCancel} disabled={isUpdating}>
			Cancel
		</button>

		<button type="submit" class="btn btn-primary" disabled={!form.name.trim() || isUpdating}>
			{#if isUpdating}
				<span class="loading-spinner"></span>
				Updating...
			{:else}
				Update Project
			{/if}
		</button>
	</div>
</form>

<style>
	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-fieldset {
		border: none;
		padding: 0;
		margin: 0;
	}

	.form-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--nord6);
	}

	.form-input,
	.form-textarea {
		padding: 0.75rem;
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
		background: var(--nord1);
		color: var(--nord6);
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.form-input.error {
		border-color: var(--nord11);
	}

	.form-input:focus,
	.form-textarea:focus {
		outline: none;
		border-color: var(--nord8);
		box-shadow: 0 0 0 3px rgba(129, 161, 193, 0.1);
	}

	.form-textarea {
		resize: vertical;
		min-height: 4rem;
	}

	.error-message {
		font-size: 0.75rem;
		color: var(--nord11);
	}

	.color-options {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
	}

	.color-option {
		width: 3rem;
		height: 2rem;
		border: 2px solid transparent;
		border-radius: 0.375rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.color-option:hover,
	.color-option.selected {
		border-color: var(--nord6);
		transform: scale(1.05);
	}

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

	.project-preview {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
		background: var(--nord1);
	}

	.preview-indicator {
		width: 2rem;
		height: 2rem;
		border-radius: 0.375rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preview-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.8);
	}

	.preview-name {
		font-weight: 500;
		color: var(--nord6);
	}

	.preview-privacy {
		color: var(--nord12);
		opacity: 0.7;
		margin-left: auto;
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		margin-top: 1rem;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: var(--nord3);
		color: var(--nord6);
	}

	.btn-secondary:hover:not(:disabled) {
		background: var(--nord4);
	}

	.btn-primary {
		background: var(--nord8);
		color: var(--nord0);
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--nord9);
		transform: translateY(-1px);
	}

	.loading-spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.color-options {
			grid-template-columns: repeat(3, 1fr);
		}

		.form-actions {
			flex-direction: column;
		}
	}
</style>
