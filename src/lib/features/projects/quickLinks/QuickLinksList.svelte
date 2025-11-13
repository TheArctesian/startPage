<!--
  Quick Links List Component

  Orchestrates display of quick links with create/edit/delete operations.
  UNIX philosophy: focused on list management.
-->

<script lang="ts">
	import type { QuickLink } from '$lib/types/database';
	import { fetchQuickLinks, deleteQuickLink } from '$lib/api/quickLinks';
	import QuickLinkCard from './QuickLinkCard.svelte';
	import QuickLinkForm from './QuickLinkForm.svelte';

interface Props {
	projectId: number | null;
	canEdit?: boolean;
	onLinkEdit?: (link: QuickLink) => void;
	onLinkUpdated?: () => void;
	onLinkDeleted?: (linkId: number) => void;
}

let {
	projectId,
	canEdit = false,
	onLinkEdit,
	onLinkUpdated,
	onLinkDeleted
}: Props = $props();

	let links = $state<QuickLink[]>([]);
	let loading = $state(true);
	let showAddForm = $state(false);
	let editingLink = $state<QuickLink | null>(null);

	// Load links when project changes
	$effect(() => {
		if (projectId) {
			loadLinks();
		} else {
			links = [];
			loading = false;
		}
	});

	async function loadLinks() {
		if (!projectId) return;

		loading = true;
		try {
			links = await fetchQuickLinks(projectId);
		} catch (err) {
			console.error('Failed to load quick links:', err);
			links = [];
		} finally {
			loading = false;
		}
	}

async function handleDelete(linkId: number) {
	try {
		await deleteQuickLink(linkId);
		links = links.filter((l) => l.id !== linkId);
		onLinkDeleted?.(linkId);
	} catch (err) {
		console.error('Failed to delete quick link:', err);
	}
}

function handleEdit(link: QuickLink) {
	editingLink = link;
	showAddForm = false;
	onLinkEdit?.(link);
}

function handleSave() {
	showAddForm = false;
	editingLink = null;
	loadLinks();
	onLinkUpdated?.();
}

	function handleCancel() {
		showAddForm = false;
		editingLink = null;
	}
</script>

<div class="quicklinks-container">
	{#if showAddForm && projectId}
		<QuickLinkForm {projectId} onSave={handleSave} onCancel={handleCancel} />
	{:else if editingLink && projectId}
		<QuickLinkForm link={editingLink} {projectId} onSave={handleSave} onCancel={handleCancel} />
	{:else}
		<div class="links-grid-view">
			{#if !projectId}
				<!-- No Project Selected -->
				<div class="no-project-state">
					<div class="no-project-icon">■</div>
					<p class="no-project-text">Select a project to view quick links</p>
				</div>
			{:else if loading}
				<!-- Loading State -->
				<div class="loading-state">
					<div class="loading-spinner"></div>
					<p>Loading links...</p>
				</div>
			{:else if links.length === 0}
				<!-- Empty State -->
				<div class="empty-state">
					<div class="empty-icon">○</div>
					<p class="empty-text">No quick links yet</p>
					<p class="empty-subtext">Add links to your favorite tools and resources</p>
					{#if canEdit}
						<button class="btn btn-primary" onclick={() => (showAddForm = true)}>
							Add your first link
						</button>
					{/if}
				</div>
			{:else}
				<!-- Links Grid -->
				<div class="links-grid">
					{#each links as link (link.id)}
						<QuickLinkCard {link} {canEdit} onEdit={handleEdit} onDelete={handleDelete} />
					{/each}

					<!-- Add New Link Button -->
					{#if canEdit}
						<button
							class="add-link-card"
							onclick={() => (showAddForm = true)}
							title="Add new quick link"
							aria-label="Add new quick link"
						>
							<div class="add-icon">+</div>
							<div class="add-text">Add New Link</div>
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.quicklinks-container {
		display: flex;
		flex-direction: column;
		min-height: 100%;
		overflow: visible;
	}

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
	.empty-state,
	.no-project-state,
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		text-align: center;
		color: var(--nord4);
	}

	.empty-icon,
	.no-project-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-text,
	.no-project-text {
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

	.loading-spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid var(--nord3);
		border-top: 3px solid var(--nord8);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-primary {
		background: var(--nord8);
		color: var(--nord0);
	}

	.btn-primary:hover {
		background: var(--nord9);
		transform: translateY(-1px);
	}

	/* Responsive */
	@media (max-width: 640px) {
		.links-grid {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			gap: 0.75rem;
		}

		.add-link-card {
			padding: 1rem 0.75rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.add-link-card,
		.btn {
			transition: none;
		}

		.loading-spinner {
			animation: none;
		}
	}
</style>
