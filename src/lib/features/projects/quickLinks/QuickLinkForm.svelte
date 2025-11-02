<!--
  Quick Link Form Component

  Form for creating/editing quick links.
  UNIX philosophy: focused on form management and validation.
-->

<script lang="ts">
	import type { QuickLink, LinkCategory } from '$lib/types/database';
	import { createQuickLink, updateQuickLink } from '$lib/api/quickLinks';
	import { LINK_CATEGORIES } from './constants';
	import { isValidUrl, normalizeUrl, getDomainFromUrl } from './utils';

	interface Props {
		link?: QuickLink;
		projectId: number;
		onSave: () => void;
		onCancel: () => void;
	}

	let { link, projectId, onSave, onCancel }: Props = $props();

	// Form state
	let form = $state({
		title: link?.title || '',
		url: link?.url || '',
		category: (link?.category || 'docs') as LinkCategory
	});

	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	// Normalize URL as user types
	$effect(() => {
		if (form.url) {
			form.url = normalizeUrl(form.url);
		}
	});

	// Get selected category for preview
	let selectedCategory = $derived(LINK_CATEGORIES.find((c) => c.id === form.category));

	// Form validation
	function validate(): boolean {
		if (!form.title.trim()) {
			error = 'Title is required';
			return false;
		}
		if (!form.url.trim()) {
			error = 'URL is required';
			return false;
		}
		if (!isValidUrl(form.url)) {
			error = 'Please enter a valid URL';
			return false;
		}
		error = null;
		return true;
	}

	// Handle form submission
	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!validate() || isSubmitting) return;

		isSubmitting = true;
		error = null;

		try {
			const data = {
				title: form.title.trim(),
				url: form.url.trim(),
				category: form.category,
				projectId
			};

			if (link) {
				await updateQuickLink(link.id, data);
			} else {
				await createQuickLink(data);
			}

			onSave();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save link';
			console.error('Error saving quick link:', err);
		} finally {
			isSubmitting = false;
		}
	}

	// Handle keyboard shortcuts
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			onCancel();
		}
	}
</script>

<div class="form-container" role="dialog" aria-labelledby="form-title">
	<div class="form-header">
		<h3 id="form-title" class="form-title">
			{link ? 'Edit' : 'Add New'} Quick Link
		</h3>
		<button class="back-btn" onclick={onCancel} title="Back to links" aria-label="Back to links">
			← Back
		</button>
	</div>

	<form class="form" onsubmit={handleSubmit} onkeydown={handleKeydown}>
		<!-- Title -->
		<div class="form-group">
			<label for="link-title" class="form-label">Title *</label>
			<input
				bind:value={form.title}
				type="text"
				id="link-title"
				class="form-input"
				placeholder="GitHub Repository"
				maxlength="255"
				required
			/>
		</div>

		<!-- URL -->
		<div class="form-group">
			<label for="link-url" class="form-label">URL *</label>
			<input
				bind:value={form.url}
				type="url"
				id="link-url"
				class="form-input"
				class:valid={form.url && isValidUrl(form.url)}
				class:invalid={form.url && !isValidUrl(form.url)}
				placeholder="https://github.com/user/repo"
				required
			/>
		</div>

		<!-- Category -->
		<div class="form-group">
			<fieldset class="form-fieldset">
				<legend class="form-label">Category</legend>
				<div class="category-options">
					{#each LINK_CATEGORIES as category}
						<button
							type="button"
							class="category-option"
							class:selected={form.category === category.id}
							onclick={() => (form.category = category.id)}
							title={category.name}
						>
							<span class="category-option-icon" style:color={category.color}>
								{category.icon}
							</span>
							<span class="category-option-name">{category.name}</span>
						</button>
					{/each}
				</div>
			</fieldset>
		</div>

		<!-- Preview -->
		<div class="form-group">
			<div class="form-label">Preview</div>
			<div class="link-preview">
				<div class="preview-icon">
					<span style:color={selectedCategory?.color}>
						{selectedCategory?.icon}
					</span>
				</div>
				<div class="preview-details">
					<div class="preview-title">
						{form.title || 'Link Title'}
					</div>
					<div class="preview-domain">
						{form.url ? getDomainFromUrl(form.url) : 'example.com'}
					</div>
				</div>
			</div>
		</div>

		<!-- Error message -->
		{#if error}
			<div class="error-message" role="alert">
				{error}
			</div>
		{/if}

		<!-- Form Actions -->
		<div class="form-actions">
			<button type="button" class="btn btn-secondary" onclick={onCancel} disabled={isSubmitting}>
				Cancel
			</button>

			<button
				type="submit"
				class="btn btn-primary"
				disabled={!form.title.trim() ||
					!form.url.trim() ||
					!isValidUrl(form.url) ||
					isSubmitting}
			>
				{#if isSubmitting}
					<span class="loading-spinner"></span>
					{link ? 'Updating...' : 'Adding...'}
				{:else}
					{link ? 'Update' : 'Add'} Link
				{/if}
			</button>
		</div>
	</form>
</div>

<style>
	.form-container {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
	}

	.form-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--nord3);
		padding: 1.5rem 1.5rem 1rem;
	}

	.form-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0;
	}

	.back-btn {
		padding: 0.5rem 1rem;
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
		background: transparent;
		color: var(--nord4);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.back-btn:hover {
		background: var(--nord2);
		border-color: var(--nord4);
		color: var(--nord6);
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 0 1.5rem 1.5rem;
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

	.form-input {
		padding: 0.75rem;
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
		background: var(--nord1);
		color: var(--nord6);
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.form-input:focus {
		outline: none;
		border-color: var(--nord8);
		box-shadow: 0 0 0 3px rgba(129, 161, 193, 0.1);
	}

	.form-input.valid {
		border-color: var(--nord14);
	}

	.form-input.invalid {
		border-color: var(--nord11);
	}

	.category-options {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.category-option {
		padding: 0.75rem;
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
		background: var(--nord1);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s ease;
		text-align: left;
	}

	.category-option:hover,
	.category-option.selected {
		border-color: var(--nord8);
		background: rgba(129, 161, 193, 0.1);
	}

	.category-option-icon {
		font-size: 1rem;
	}

	.category-option-name {
		font-size: 0.875rem;
		color: var(--nord6);
	}

	.link-preview {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
		background: var(--nord1);
	}

	.preview-icon {
		width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
	}

	.preview-details {
		flex: 1;
	}

	.preview-title {
		font-weight: 500;
		color: var(--nord6);
		margin-bottom: 0.125rem;
	}

	.preview-domain {
		font-size: 0.75rem;
		color: var(--nord4);
	}

	.error-message {
		font-size: 0.875rem;
		color: var(--nord11);
		padding: 0.75rem;
		background: rgba(191, 97, 106, 0.1);
		border-radius: 0.375rem;
		border: 1px solid var(--nord11);
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

	/* Responsive */
	@media (max-width: 640px) {
		.category-options {
			grid-template-columns: 1fr;
		}

		.form-actions {
			flex-direction: column;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.btn {
			transition: none;
		}

		.loading-spinner {
			animation: none;
		}
	}
</style>
