<!--
  Quick Link Card Component

  Displays a single quick link with icon, title, and domain.
  UNIX philosophy: focused on link display.
-->

<script lang="ts">
	import type { QuickLink } from '$lib/types/database';
	import { getCategoryIcon, getCategoryColor } from './constants';
	import { getDomainFromUrl } from './utils';

	interface Props {
		link: QuickLink;
		canEdit?: boolean;
		onEdit?: (link: QuickLink) => void;
		onDelete?: (linkId: number) => void;
	}

	let { link, canEdit = false, onEdit, onDelete }: Props = $props();

	function handleClick(e: MouseEvent) {
		// Don't open link if clicking edit button
		if ((e.target as HTMLElement)?.closest('.edit-btn')) {
			return;
		}
		window.open(link.url, '_blank', 'noopener,noreferrer');
	}

	function handleEdit(e: MouseEvent) {
		e.stopPropagation();
		onEdit?.(link);
	}

	function handleDelete(e: MouseEvent) {
		e.stopPropagation();
		if (confirm(`Delete "${link.title}"?`)) {
			onDelete?.(link.id);
		}
	}
</script>

<div class="link-card-wrapper">
	<button
		class="link-card"
		onclick={handleClick}
		title="Open {link.title} - {getDomainFromUrl(link.url)}"
		aria-label="Open {link.title}"
	>
		<div class="link-icon">
			<span class="default-icon" style:color={getCategoryColor(link.category || 'other')}>
				{getCategoryIcon(link.category || 'other')}
			</span>
		</div>

		<div class="link-details">
			<div class="link-title">{link.title}</div>
			<div class="link-domain">{getDomainFromUrl(link.url)}</div>
		</div>
	</button>

	{#if canEdit}
		<button
			class="edit-btn"
			onclick={handleEdit}
			title="Edit {link.title}"
			aria-label="Edit {link.title}"
		>
			✎
		</button>
	{/if}
</div>

<style>
	.link-card-wrapper {
		position: relative;
		display: flex;
		flex-direction: column;
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
		width: 100%;
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

	.edit-btn {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 1.75rem;
		height: 1.75rem;
		border: none;
		border-radius: 0.25rem;
		background: rgba(0, 0, 0, 0.6);
		color: white;
		cursor: pointer;
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: all 0.2s ease;
		z-index: 2;
	}

	.link-card-wrapper:hover .edit-btn {
		opacity: 1;
	}

	.edit-btn:hover {
		background: var(--nord8);
		transform: scale(1.1);
	}

	.edit-btn:focus {
		opacity: 1;
		outline: 2px solid var(--nord8);
		outline-offset: 2px;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.link-card {
			padding: 1rem 0.75rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.link-card,
		.edit-btn {
			transition: none;
		}
	}
</style>
