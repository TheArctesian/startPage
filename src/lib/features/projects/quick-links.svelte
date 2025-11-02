<!--
  Quick Links Component

  Thin wrapper that connects QuickLinksList to project stores.
  UNIX philosophy: simple orchestration layer.
-->

<script lang="ts">
	import { activeProject } from '$lib/stores';
	import QuickLinksList from './quickLinks/QuickLinksList.svelte';

	interface Props {
		canEdit?: boolean;
		isAuthenticated?: boolean;
	}

	let { canEdit = false, isAuthenticated = false }: Props = $props();

	// Get current project ID from store
	let projectId = $derived($activeProject?.id || null);
</script>

<QuickLinksList {projectId} {canEdit} />
