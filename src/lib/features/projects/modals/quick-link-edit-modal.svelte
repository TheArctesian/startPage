<script lang="ts">
	import type { QuickLink, LinkCategory } from '$lib/types/database';

	let {
		isOpen = false,
		link = null,
		onclose,
		onupdated,
		ondeleted
	} = $props<{
		isOpen?: boolean;
		link?: QuickLink | null;
		onclose?: () => void;
		onupdated?: (event: { link: QuickLink }) => void;
		ondeleted?: (event: { linkId: number }) => void;
	}>();

	// Form state
	let editTitle = $state('');
	let editUrl = $state('');
	let editIcon = $state('');
	let editCategory = $state<LinkCategory>('docs');
	let isUpdating = $state(false);
	let isDeleting = $state(false);
	let showDeleteConfirm = $state(false);

	// Category definitions
	const categories = [
		{ id: 'docs' as LinkCategory, name: 'Documentation', icon: '□', color: 'var(--nord8)' },
		{ id: 'tools' as LinkCategory, name: 'Tools', icon: '△', color: 'var(--nord9)' },
		{ id: 'resources' as LinkCategory, name: 'Resources', icon: '○', color: 'var(--nord10)' },
		{ id: 'other' as LinkCategory, name: 'Other', icon: '◇', color: 'var(--nord4)' }
	] as const;

	// Icon suggestions for different categories
	const iconSuggestions = {
		docs: ['□', '■', '▢', '▣', '▤', '▥'],
		tools: ['△', '▲', '▴', '▵', '▶', '▷'],
		resources: ['○', '●', '◎', '◍', '◌', '◊'],
		other: ['◇', '◈', '◉', '◐', '◑', '◒']
	};

	// Initialize form when link changes
	$effect(() => {
		if (link && isOpen) {
			editTitle = link.title;
			editUrl = link.url;
			editIcon = link.icon || '';
			editCategory = link.category || 'docs';
			showDeleteConfirm = false;
		}
	});

	// Handle backdrop click
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	// Close modal
	function handleClose() {
		if (isUpdating || isDeleting) return;
		showDeleteConfirm = false;
		onclose?.();
	}

	// Handle update submission
	async function handleUpdate() {
		if (!link || !editTitle.trim() || !editUrl.trim() || isUpdating) return;

		isUpdating = true;
		try {
			const updates = {
				title: editTitle.trim(),
				url: normalizeUrl(editUrl.trim()),
				icon: editIcon.trim() || null,
				category: editCategory
			};

			const response = await fetch(`/api/quick-links/${link.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates)
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update quick link');
			}

			const updatedLink = await response.json();
			onupdated?.({ link: updatedLink });
		} catch (error) {
			console.error('Error updating quick link:', error);
			alert('Failed to update quick link. Please try again.');
		} finally {
			isUpdating = false;
		}
	}

	// Handle delete confirmation
	function handleDeleteConfirm() {
		showDeleteConfirm = true;
	}

	// Handle delete execution
	async function handleDelete() {
		if (!link || isDeleting) return;

		isDeleting = true;
		try {
			const response = await fetch(`/api/quick-links/${link.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete quick link');
			}

			ondeleted?.({ linkId: link.id });
		} catch (error) {
			console.error('Error deleting quick link:', error);
			alert('Failed to delete quick link. Please try again.');
		} finally {
			isDeleting = false;
		}
	}

	// Handle form keydown
	function handleFormKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleUpdate();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			handleClose();
		}
	}

	// Set icon from suggestion
	function setIcon(icon: string) {
		editIcon = icon;
	}

	// Extract domain from URL for display
	function getDomainFromUrl(url: string): string {
		try {
			const domain = new URL(url).hostname;
			return domain.replace('www.', '');
		} catch {
			return url;
		}
	}

	// Validate URL format
	function isValidUrl(url: string): boolean {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	// Auto-add protocol if missing
	function normalizeUrl(url: string): string {
		if (!url) return '';
		if (!/^https?:\/\//i.test(url)) {
			return `https://${url}`;
		}
		return url;
	}

	// Update URL as user types
	$effect(() => {
		editUrl = normalizeUrl(editUrl);
	});
</script>

{#if isOpen && link}
	<div
		class="edit-modal-backdrop"
		onclick={handleBackdropClick}
		onkeydown={handleFormKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="edit-modal-title"
		tabindex="-1"
	>
		<div class="edit-modal-content">
			{#if !showDeleteConfirm}
				<!-- Edit Form -->
				<div class="modal-header">
					<h3 id="edit-modal-title" class="modal-title">Edit Quick Link</h3>
					<button
						class="close-btn"
						onclick={handleClose}
						title="Close"
						aria-label="Close dialog"
						disabled={isUpdating}
					>
						✕
					</button>
				</div>

				<div class="modal-body">
					<form
						class="edit-form"
						onsubmit={(e) => {
							e.preventDefault();
							handleUpdate();
						}}
					>
						<!-- Link Title -->
						<div class="form-group">
							<label for="edit-title" class="form-label">Title *</label>
							<input
								bind:value={editTitle}
								type="text"
								id="edit-title"
								class="form-input"
								placeholder="GitHub Repository"
								maxlength="255"
								required
								disabled={isUpdating}
							/>
						</div>

						<!-- Link URL -->
						<div class="form-group">
							<label for="edit-url" class="form-label">URL *</label>
							<input
								bind:value={editUrl}
								type="url"
								id="edit-url"
								class="form-input"
								class:valid={editUrl && isValidUrl(editUrl)}
								class:invalid={editUrl && !isValidUrl(editUrl)}
								placeholder="https://github.com/user/repo"
								required
								disabled={isUpdating}
							/>
							{#if editUrl && !isValidUrl(editUrl)}
								<span class="error-message">Please enter a valid URL</span>
							{/if}
						</div>

						<!-- Category -->
						<div class="form-group">
							<fieldset class="form-fieldset">
								<legend class="form-label">Category</legend>
								<div class="category-options">
									{#each categories as category}
										<button
											type="button"
											class="category-option"
											class:selected={editCategory === category.id}
											onclick={() => (editCategory = category.id)}
											title={category.name}
											disabled={isUpdating}
										>
											<span class="category-option-icon" style="color: {category.color}">
												{category.icon}
											</span>
											<span class="category-option-name">{category.name}</span>
										</button>
									{/each}
								</div>
							</fieldset>
						</div>

						<!-- Link Icon -->
						<div class="form-group">
							<label for="edit-icon" class="form-label">Icon (optional)</label>
							<input
								bind:value={editIcon}
								type="text"
								id="edit-icon"
								class="form-input"
								placeholder="◇"
								maxlength="10"
								disabled={isUpdating}
							/>

							<!-- Icon Suggestions -->
							<div class="icon-suggestions">
								{#each iconSuggestions[editCategory] as icon}
									<button
										type="button"
										class="icon-suggestion"
										class:selected={editIcon === icon}
										onclick={() => setIcon(icon)}
										title="Use {icon} icon"
										disabled={isUpdating}
									>
										{icon}
									</button>
								{/each}
							</div>
						</div>

						<!-- Preview -->
						<div class="form-group">
							<div class="form-label">Preview</div>
							<div class="link-preview">
								<div class="preview-icon">
									{#if editIcon}
										{editIcon}
									{:else}
										{@const selectedCategory = categories.find((c) => c.id === editCategory)}
										<span style="color: {selectedCategory?.color}">
											{selectedCategory?.icon}
										</span>
									{/if}
								</div>
								<div class="preview-details">
									<div class="preview-title">
										{editTitle || 'Link Title'}
									</div>
									<div class="preview-domain">
										{editUrl ? getDomainFromUrl(editUrl) : 'example.com'}
									</div>
								</div>
							</div>
						</div>
					</form>
				</div>

				<!-- Form Actions -->
				<div class="modal-actions">
					<button
						type="button"
						class="btn btn-danger"
						onclick={handleDeleteConfirm}
						disabled={isUpdating}
					>
						Delete Link
					</button>

					<div class="action-buttons">
						<button
							type="button"
							class="btn btn-secondary"
							onclick={handleClose}
							disabled={isUpdating}
						>
							Cancel
						</button>

						<button
							type="button"
							class="btn btn-primary"
							onclick={handleUpdate}
							disabled={!editTitle.trim() ||
								!editUrl.trim() ||
								!isValidUrl(editUrl) ||
								isUpdating}
						>
							{#if isUpdating}
								<span class="loading-spinner"></span>
								Updating...
							{:else}
								Update Link
							{/if}
						</button>
					</div>
				</div>
			{:else}
				<!-- Delete Confirmation -->
				<div class="modal-header">
					<h3 class="modal-title">Delete Quick Link</h3>
					<button
						class="close-btn"
						onclick={() => (showDeleteConfirm = false)}
						title="Close"
						aria-label="Close dialog"
						disabled={isDeleting}
					>
						✕
					</button>
				</div>

				<div class="modal-body">
					<div class="delete-confirmation">
						<div class="delete-icon">⚠️</div>
						<div class="delete-message">
							<p>Are you sure you want to delete this quick link?</p>
							<div class="link-info">
								<strong>{link.title}</strong>
								<span class="link-url">{getDomainFromUrl(link.url)}</span>
							</div>
							<p class="delete-warning">This action cannot be undone.</p>
						</div>
					</div>
				</div>

				<div class="modal-actions">
					<button
						type="button"
						class="btn btn-secondary"
						onclick={() => (showDeleteConfirm = false)}
						disabled={isDeleting}
					>
						Cancel
					</button>

					<button
						type="button"
						class="btn btn-danger"
						onclick={handleDelete}
						disabled={isDeleting}
					>
						{#if isDeleting}
							<span class="loading-spinner"></span>
							Deleting...
						{:else}
							Delete Link
						{/if}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.edit-modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1100;
		padding: 1rem;
	}

	.edit-modal-content {
		background: var(--nord0);
		border: 1px solid var(--nord3);
		border-radius: 0.75rem;
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow: hidden;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
	}

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

	.close-btn:hover:not(:disabled) {
		background: var(--nord2);
		color: var(--nord6);
	}

	.close-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
	}

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

	.form-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.form-input.valid {
		border-color: var(--nord14);
	}

	.form-input.invalid {
		border-color: var(--nord11);
	}

	.error-message {
		font-size: 0.75rem;
		color: var(--nord11);
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

	.category-option:hover:not(:disabled),
	.category-option.selected {
		border-color: var(--nord8);
		background: rgba(129, 161, 193, 0.1);
	}

	.category-option:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.category-option-icon {
		font-size: 1rem;
	}

	.category-option-name {
		font-size: 0.875rem;
		color: var(--nord6);
	}

	.icon-suggestions {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.25rem;
		margin-top: 0.5rem;
	}

	.icon-suggestion {
		width: 2rem;
		height: 2rem;
		border: 1px solid var(--nord3);
		border-radius: 0.25rem;
		background: var(--nord1);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.icon-suggestion:hover:not(:disabled),
	.icon-suggestion.selected {
		border-color: var(--nord8);
		background: var(--nord8);
		color: var(--nord0);
	}

	.icon-suggestion:disabled {
		opacity: 0.6;
		cursor: not-allowed;
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

	.modal-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-top: 1px solid var(--nord3);
		background: var(--nord1);
		flex-shrink: 0;
	}

	.action-buttons {
		display: flex;
		gap: 0.75rem;
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

	.btn-danger {
		background: var(--nord11);
		color: var(--nord0);
	}

	.btn-danger:hover:not(:disabled) {
		background: var(--nord12);
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

	/* Delete Confirmation Styles */
	.delete-confirmation {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 1rem;
		padding: 1rem 0;
	}

	.delete-icon {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}

	.delete-message p {
		margin: 0 0 1rem;
		color: var(--nord6);
	}

	.link-info {
		background: var(--nord1);
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
		padding: 0.75rem;
		margin: 1rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.link-info strong {
		color: var(--nord6);
	}

	.link-url {
		font-size: 0.875rem;
		color: var(--nord4);
	}

	.delete-warning {
		font-size: 0.875rem;
		color: var(--nord11);
		font-weight: 500;
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.category-options {
			grid-template-columns: 1fr;
		}

		.modal-actions {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.action-buttons {
			width: 100%;
		}

		.btn {
			flex: 1;
		}
	}

	/* Accessibility and reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.btn,
		.category-option,
		.icon-suggestion {
			transition: none;
		}

		.loading-spinner {
			animation: none;
		}
	}
</style>
