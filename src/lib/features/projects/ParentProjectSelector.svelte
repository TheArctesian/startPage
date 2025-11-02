<script lang="ts">
	import { fetchProjects } from '$lib/api/projects';
	import type { ProjectWithDetails } from '$lib/types/database';
	import { onMount } from 'svelte';

	interface Props {
		currentProjectId?: number;
		value?: number | string | null;
		onChange?: (value: number | null) => void;
	}

	let { currentProjectId, value = $bindable(), onChange }: Props = $props();

	let projects = $state<ProjectWithDetails[]>([]);
	let loading = $state(true);

	// Filter projects to exclude current project and its descendants
	function filterAvailableProjects(
		allProjects: ProjectWithDetails[],
		currentId?: number
	): ProjectWithDetails[] {
		if (!currentId) return allProjects;

		const current = allProjects.find((p) => p.id === currentId);
		if (!current) return allProjects;

		return allProjects.filter((p) => {
			// Exclude self
			if (p.id === currentId) return false;

			// Exclude descendants (projects that have this project in their path)
			if (p.path && current.path) {
				return !p.path.startsWith(current.path + '/') && p.path !== current.path;
			}

			// For root projects, exclude direct children
			if (!current.path || current.path === current.name) {
				return p.parentId !== currentId;
			}

			return true;
		});
	}

	onMount(async () => {
		try {
			const allProjects = await fetchProjects(false);
			projects = filterAvailableProjects(allProjects, currentProjectId);
		} catch (error) {
			console.error('Failed to load projects:', error);
			projects = [];
		} finally {
			loading = false;
		}
	});

	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newValue = target.value === '' ? null : parseInt(target.value);
		value = newValue;
		if (onChange) onChange(newValue);
	}
</script>

<select
	{value}
	onchange={handleChange}
	disabled={loading}
	class="parent-selector"
	aria-label="Select parent project"
>
	<option value="">None (Root Project)</option>
	{#if loading}
		<option disabled>Loading...</option>
	{:else}
		{#each projects as project (project.id)}
			<option value={project.id}>{project.name}</option>
		{/each}
	{/if}
</select>

<style>
	.parent-selector {
		padding: 0.75rem;
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
		background: var(--nord1);
		color: var(--nord6);
		font-size: 0.875rem;
		transition: all 0.2s ease;
		width: 100%;
	}

	.parent-selector:focus {
		outline: none;
		border-color: var(--nord8);
		box-shadow: 0 0 0 3px rgba(129, 161, 193, 0.1);
	}

	.parent-selector:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
