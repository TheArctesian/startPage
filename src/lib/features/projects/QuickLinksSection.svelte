<script lang="ts">
	import type { QuickLink } from '$lib/types/database';
	import type { Writable } from 'svelte/store';
	import SkeletonLoader from '$lib/ui/loading/skeleton-loader.svelte';

	interface Props {
		quickLinks: QuickLink[];
		loading: boolean;
		canEdit: boolean;
		onAddLink: () => void;
		onEditLink: (link: QuickLink) => void;
	}

	let { quickLinks, loading, canEdit, onAddLink, onEditLink }: Props = $props();

	// Extract domain from URL for favicon service
	function getFaviconUrl(url: string): string {
		try {
			const domain = new URL(url).hostname;
			// Using DuckDuckGo's favicon service
			return `https://external-content.duckduckgo.com/ip3/${domain}.ico`;
		} catch (e) {
			// Fallback to a generic icon if URL parsing fails
			return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23ddd"/><text x="50" y="50" font-family="Arial" font-size="50" text-anchor="middle" dominant-baseline="middle" fill="%23555">?</text></svg>';
		}
	}

	function handleLinkClick(url: string) {
		window.open(url, '_blank', 'noopener,noreferrer');
	}
</script>

<div class="quick-links-section">
	<h3 class="quick-links-title">Quick Links</h3>
	<div class="quick-links-inline">
		{#if loading}
			<div class="inline-links">
				{#each Array(3) as _, i (i)}
					<div class="skeleton-link">
						<SkeletonLoader variant="button" />
					</div>
				{/each}
			</div>
		{:else if quickLinks.length > 0}
			<div class="inline-links">
				{#each quickLinks as link (link.id)}
					<button
						class="inline-link"
						onclick={() => handleLinkClick(link.url)}
						title="Open {link.title}"
					>
						<span class="inline-link-icon">
							<img src={getFaviconUrl(link.url)} alt="" class="favicon" />
						</span>
						<span class="inline-link-title">{link.title}</span>
					</button>
				{/each}
				{#if canEdit}
					<button class="inline-add-link" onclick={onAddLink}> + Add Link </button>
				{/if}
			</div>
		{:else}
			<div class="inline-empty">
				<span class="inline-empty-text">No quick links yet</span>
				{#if canEdit}
					<button class="inline-add-link" onclick={onAddLink}> + Add Link </button>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.quick-links-section {
		margin-bottom: 1.5rem;
	}

	.quick-links-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0 0 0.75rem;
	}

	.inline-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.skeleton-link {
		display: inline-block;
		min-width: 100px;
	}

	.inline-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--nord2);
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
		color: var(--nord6);
	}

	.inline-link:hover {
		background: var(--nord3);
		transform: translateY(-1px);
	}

	.inline-link-icon {
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.favicon {
		width: 16px;
		height: 16px;
		object-fit: contain;
	}

	.inline-link-title {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.inline-add-link {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: 1px dashed var(--nord3);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
		color: var(--nord4);
	}

	.inline-add-link:hover {
		border-color: var(--nord8);
		color: var(--nord8);
		background: rgba(129, 161, 193, 0.05);
	}

	.inline-empty {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.inline-empty-text {
		font-size: 0.875rem;
		color: var(--nord4);
	}
</style>
