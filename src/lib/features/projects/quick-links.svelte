<!--
  Quick Links Component

  Thin wrapper that connects QuickLinksList to project stores.
  UNIX philosophy: simple orchestration layer.
-->

<script lang="ts">
	import { activeProject } from '$lib/stores';
	import QuickLinksList from './quickLinks/QuickLinksList.svelte';
	import { createEventDispatcher } from 'svelte';
	import type { QuickLink } from '$lib/types/database';

	interface Props {
		canEdit?: boolean;
		isAuthenticated?: boolean;
	}

	let { canEdit = false, isAuthenticated = false }: Props = $props();

	const dispatch = createEventDispatcher<{
		linkEdit: { link: QuickLink };
		linkUpdated: void;
		linkDeleted: { linkId: number };
	}>();

	function handleLinkEdit(link: QuickLink) {
		dispatch('linkEdit', { link });
	}

	function handleLinkUpdated() {
		dispatch('linkUpdated');
	}

	function handleLinkDeleted(linkId: number) {
		dispatch('linkDeleted', { linkId });
	}

	// Get current project ID from store
	let projectId = $derived($activeProject?.id || null);
</script>

<QuickLinksList
	{projectId}
	{canEdit}
	onLinkEdit={handleLinkEdit}
	onLinkUpdated={handleLinkUpdated}
	onLinkDeleted={handleLinkDeleted}
/>
