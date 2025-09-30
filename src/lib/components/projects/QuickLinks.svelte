<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { activeProject, activeProjectQuickLinks, createQuickLink } from '$lib/stores';
	import type { QuickLink, NewQuickLink, LinkCategory } from '$lib/types/database';

	const dispatch = createEventDispatcher<{
		linkClick: { link: QuickLink };
		linkEdit: { link: QuickLink };
		linkDelete: { link: QuickLink };
	}>();

	// Component state
	let showAddForm = false;
	let newLinkTitle = '';
	let newLinkUrl = '';
	let newLinkIcon = '';
	let newLinkCategory: LinkCategory = 'docs';
	let isCreating = false;

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

	// Reactive values
	$: currentProject = $activeProject;
	$: projectLinks = $activeProjectQuickLinks;

	// Show add link form
	function showAddLinkForm() {
		if (!currentProject) return;

		showAddForm = true;
		newLinkTitle = '';
		newLinkUrl = '';
		newLinkIcon = '';
		newLinkCategory = 'docs';
	}

	// Hide add link form
	function hideAddLinkForm() {
		showAddForm = false;
		newLinkTitle = '';
		newLinkUrl = '';
		newLinkIcon = '';
		newLinkCategory = 'docs';
	}

	// Handle create link form submission
	async function handleCreateLink() {
		if (!newLinkTitle.trim() || !newLinkUrl.trim() || !currentProject || isCreating) return;

		isCreating = true;
		try {
			const linkData: NewQuickLink = {
				title: newLinkTitle.trim(),
				url: newLinkUrl.trim(),
				projectId: currentProject.id,
				icon: newLinkIcon || undefined,
				category: newLinkCategory
			};

			await createQuickLink(linkData);
			hideAddLinkForm();
		} catch (error) {
			console.error('Failed to create quick link:', error);
		} finally {
			isCreating = false;
		}
	}

	// Handle link click
	function handleLinkClick(link: QuickLink) {
		window.open(link.url, '_blank', 'noopener,noreferrer');
		dispatch('linkClick', { link });
	}

	// Handle keyboard shortcuts in add form
	function handleAddFormKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleCreateLink();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			hideAddLinkForm();
		}
	}

	// Set icon from suggestion
	function setIcon(icon: string) {
		newLinkIcon = icon;
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
	$: newLinkUrl = normalizeUrl(newLinkUrl);
</script>

<div class="quicklinks-container">
	{#if !showAddForm}
		<!-- Links Grid View -->
		<div class="links-grid-view">
			{#if currentProject}
				{#if projectLinks.length > 0}
					<!-- Links Grid -->
					<div class="links-grid">
						{#each projectLinks as link (link.id)}
							<button
								class="link-card"
								onclick={() => handleLinkClick(link)}
								title="Open {link.title} - {getDomainFromUrl(link.url)}"
								aria-label="Open {link.title}"
							>
								<div class="link-icon">
									{#if link.icon}
										<span class="custom-icon">{link.icon}</span>
									{:else}
										{@const category = categories.find((c) => c.id === (link.category || 'other'))}
										<span class="default-icon" style="color: {category?.color}">
											{category?.icon}
										</span>
									{/if}
								</div>

								<div class="link-details">
									<div class="link-title">{link.title}</div>
									<div class="link-domain">{getDomainFromUrl(link.url)}</div>
								</div>
							</button>
						{/each}

						<!-- Add New Link Button -->
						<button
							class="add-link-card"
							onclick={showAddLinkForm}
							title="Add new quick link"
							aria-label="Add new quick link"
						>
							<div class="add-icon">+</div>
							<div class="add-text">Add New Link</div>
						</button>
					</div>
				{:else}
					<!-- Empty State -->
					<div class="empty-state">
						<div class="empty-icon">○</div>
						<p class="empty-text">No quick links yet</p>
						<p class="empty-subtext">Add links to your favorite tools and resources</p>
						<button class="btn btn-primary" onclick={showAddLinkForm}> Add your first link </button>
					</div>
				{/if}
			{:else}
				<!-- No Project Selected -->
				<div class="no-project-state">
					<div class="no-project-icon">■</div>
					<p class="no-project-text">Select a project to view quick links</p>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Add Link Form -->
		<div class="add-form-container">
			<div class="form-header">
				<h3 class="form-title">Add New Quick Link</h3>
				<button
					class="back-btn"
					onclick={hideAddLinkForm}
					title="Back to links"
					aria-label="Back to links"
				>
					← Back
				</button>
			</div>

			<form
				class="add-form"
				onsubmit={(e) => {
					e.preventDefault();
					handleCreateLink();
				}}
			>
				<!-- Link Title -->
				<div class="form-group">
					<label for="link-title" class="form-label">Title *</label>
					<input
						bind:value={newLinkTitle}
						type="text"
						id="link-title"
						class="form-input"
						placeholder="GitHub Repository"
						maxlength="255"
						required
					/>
				</div>

				<!-- Link URL -->
				<div class="form-group">
					<label for="link-url" class="form-label">URL *</label>
					<input
						bind:value={newLinkUrl}
						type="url"
						id="link-url"
						class="form-input"
						class:valid={newLinkUrl && isValidUrl(newLinkUrl)}
						class:invalid={newLinkUrl && !isValidUrl(newLinkUrl)}
						placeholder="https://github.com/user/repo"
						required
					/>
					{#if newLinkUrl && !isValidUrl(newLinkUrl)}
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
									class:selected={newLinkCategory === category.id}
									onclick={() => (newLinkCategory = category.id)}
									title={category.name}
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
					<label for="link-icon" class="form-label">Icon (optional)</label>
					<input
						bind:value={newLinkIcon}
						type="text"
						id="link-icon"
						class="form-input"
						placeholder="◇"
						maxlength="10"
					/>

					<!-- Icon Suggestions -->
					<div class="icon-suggestions">
						{#each iconSuggestions[newLinkCategory] as icon}
							<button
								type="button"
								class="icon-suggestion"
								class:selected={newLinkIcon === icon}
								onclick={() => setIcon(icon)}
								title="Use {icon} icon"
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
							{#if newLinkIcon}
								{newLinkIcon}
							{:else}
								{@const selectedCategory = categories.find((c) => c.id === newLinkCategory)}
								<span style="color: {selectedCategory?.color}">
									{selectedCategory?.icon}
								</span>
							{/if}
						</div>
						<div class="preview-details">
							<div class="preview-title">
								{newLinkTitle || 'Link Title'}
							</div>
							<div class="preview-domain">
								{newLinkUrl ? getDomainFromUrl(newLinkUrl) : 'example.com'}
							</div>
						</div>
					</div>
				</div>

				<!-- Form Actions -->
				<div class="form-actions">
					<button
						type="button"
						class="btn btn-secondary"
						onclick={hideAddLinkForm}
						disabled={isCreating}
					>
						Cancel
					</button>

					<button
						type="submit"
						class="btn btn-primary"
						disabled={!newLinkTitle.trim() ||
							!newLinkUrl.trim() ||
							!isValidUrl(newLinkUrl) ||
							isCreating}
					>
						{#if isCreating}
							<span class="loading-spinner"></span>
							Adding...
						{:else}
							Add Link
						{/if}
					</button>
				</div>
			</form>
		</div>
	{/if}
</div>

<style>
	.quicklinks-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	/* Grid View Styles */
	.links-grid-view {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
	}

	.links-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
		align-items: start;
	}

	.link-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1.5rem 1rem;
		background: var(--nord1);
		border: 1px solid var(--nord3);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: center;
	}

	.link-card:hover {
		background: var(--nord2);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.link-card:focus {
		outline: 2px solid var(--nord8);
		outline-offset: 2px;
	}

	.link-icon {
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.custom-icon,
	.default-icon {
		font-size: 1.5rem;
	}

	.link-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
		width: 100%;
	}

	.link-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--nord6);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.link-domain {
		font-size: 0.75rem;
		color: var(--nord4);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.add-link-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1.5rem 1rem;
		background: transparent;
		border: 2px dashed var(--nord3);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: center;
		color: var(--nord4);
	}

	.add-link-card:hover {
		border-color: var(--nord8);
		background: rgba(129, 161, 193, 0.05);
		color: var(--nord8);
	}

	.add-icon {
		font-size: 2rem;
		font-weight: 300;
	}

	.add-text {
		font-size: 0.875rem;
		font-weight: 500;
	}

	/* Empty and No Project States */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		text-align: center;
		color: var(--nord4);
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-text {
		font-size: 1rem;
		margin: 0 0 0.5rem;
		color: var(--nord6);
		font-weight: 500;
	}

	.empty-subtext {
		font-size: 0.875rem;
		margin: 0 0 2rem;
		color: var(--nord4);
	}

	.no-project-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		text-align: center;
		color: var(--nord4);
	}

	.no-project-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.no-project-text {
		font-size: 1rem;
		margin: 0;
	}

	/* Add Form Styles */
	.add-form-container {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
	}

	.form-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--nord3);
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

	.add-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 500px;
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

	.icon-suggestion:hover,
	.icon-suggestion.selected {
		border-color: var(--nord8);
		background: var(--nord8);
		color: var(--nord0);
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

	/* Responsive design */
	@media (max-width: 640px) {
		.links-grid {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			gap: 0.75rem;
		}

		.link-card,
		.add-link-card {
			padding: 1rem 0.75rem;
		}

		.category-options {
			grid-template-columns: 1fr;
		}

		.form-actions {
			flex-direction: column;
		}
	}

	/* Accessibility and reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.link-card,
		.add-link-card,
		.btn {
			transition: none;
		}

		.loading-spinner {
			animation: none;
		}
	}
</style>
