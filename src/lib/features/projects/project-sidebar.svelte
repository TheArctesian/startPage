<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import {
		projects,
		activeProject,
		projectStats,
		setActiveProject,
		loadProjects
	} from '$lib/stores';
	import ProjectTree from './project-tree/project-tree.svelte';
	import ProjectCreateModal from './modals/project-create-modal.svelte';
	import type {
		Project,
		ProjectWithDetails,
		ProjectTreeData,
		ProjectNode
	} from '$lib/types/database';
	import { buildProjectTree } from '$lib/utils/projectTree';
	import { navigateToProject, navigateToHome } from '$lib/utils/navigation';
	import type { User } from '$lib/types/database';

	export let user: User | null = null;
	export let isAuthenticated: boolean = false;

	const dispatch = createEventDispatcher<{
		projectSelect: { project: Project };
		projectCreate: { project: Project };
		projectEdit: { project: Project };
		collapse: { isCollapsed: boolean };
	}>();

	// Check if user can create projects (authenticated users only)
	$: canCreateProjects = isAuthenticated && user && user.status === 'approved';

	// Component state
	let isCollapsed = false;
	let showCreateModal = false;
	let isLoadingTree = false;
	let treeData: ProjectTreeData | null = null;


	// Reactive values
	$: currentProject = $activeProject;

	// Build tree structure when project stats change
	$: if ($projectStats && $projectStats.length > 0) {
		treeData = buildProjectTree($projectStats);
	}


	// Handle project selection
	async function selectProject(project: Project | ProjectNode) {
		// Set the active project in the store first
		await setActiveProject(project);
		// Navigate to project route
		await navigateToProject(project);
		dispatch('projectSelect', { project });
	}

	// Handle tree project selection
	async function handleTreeProjectSelect(event: CustomEvent<{ project: ProjectNode }>) {
		await selectProject(event.detail.project);
	}

	// Handle tree refresh
	async function handleTreeRefresh() {
		await loadProjectsWithStats();
	}

	// Toggle sidebar collapse
	function toggleCollapse() {
		isCollapsed = !isCollapsed;
		dispatch('collapse', { isCollapsed });
	}

	// Show create project modal
	function showCreateProjectModal() {
		showCreateModal = true;
	}

	// Handle project created
	function handleProjectCreated(event: CustomEvent<{ project: ProjectWithDetails }>) {
		showCreateModal = false;
		// Reload projects with stats to ensure sidebar updates
		loadProjectsWithStats();
		dispatch('projectCreate', { project: event.detail.project });
	}

	// Handle modal close
	function handleModalClose() {
		showCreateModal = false;
	}

	// Format project stats
	function formatStats(project: ProjectWithDetails) {
		const completionRate =
			project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0;

		const totalHours = Math.round((project.totalMinutes / 60) * 10) / 10;

		return {
			completion: completionRate,
			hours: totalHours,
			tasks: project.totalTasks
		};
	}


	// Helper function to load projects with stats
	async function loadProjectsWithStats() {
		isLoadingTree = true;
		try {
			await loadProjects(true); // Load with stats
		} catch (error) {
			console.error('Failed to load projects in sidebar:', error);
		} finally {
			isLoadingTree = false;
		}
	}

	// Load projects on mount
	onMount(async () => {
		await loadProjectsWithStats();
	});
</script>

<aside class="project-sidebar" class:collapsed={isCollapsed} aria-label="Project navigation">
	<!-- Sidebar Header -->
	<div class="sidebar-header">
		<div class="header-content">
			<h2 class="sidebar-title">
				{#if !isCollapsed}
					Projects
				{:else}
					■
				{/if}
			</h2>

			<button
				class="collapse-btn transition-colors hover-scale active-press"
				onclick={toggleCollapse}
				title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			>
				{isCollapsed ? '→' : '←'}
			</button>
		</div>

		{#if !isCollapsed}
			<div class="sidebar-actions">
				<button
					class="home-btn transition-colors hover-scale active-press"
					onclick={() => navigateToHome()}
					title="Go to home dashboard"
					aria-label="Go to home dashboard"
				>
					Home
				</button>
				{#if user?.role === 'admin'}
					<button
						class="admin-btn transition-colors hover-scale active-press"
						onclick={() => window.location.href = '/admin'}
						title="Admin Panel"
						aria-label="Admin Panel"
					>
						Admin Panel
					</button>
				{/if}
				{#if canCreateProjects}
					<button
						class="create-project-btn transition-colors hover-scale active-press"
						onclick={showCreateProjectModal}
						title="Create new project"
						aria-label="Create new project"
					>
						+ New Project
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Project Tree -->
	<div class="projects-tree">
		<ProjectTree
			{treeData}
			activeProjectId={currentProject?.id || null}
			{isCollapsed}
			showStats={true}
			loading={isLoadingTree}
			on:projectSelect={handleTreeProjectSelect}
			on:refresh={handleTreeRefresh}
		/>
	</div>

	<!-- Collapsed Actions -->
	{#if isCollapsed}
		<div class="collapsed-actions">
			<button
				class="collapsed-home-btn"
				onclick={() => navigateToHome()}
				title="Go to home dashboard"
				aria-label="Go to home dashboard"
			>
				/
			</button>
			{#if user?.role === 'admin'}
				<button
					class="collapsed-admin-btn"
					onclick={() => window.location.href = '/admin'}
					title="Admin Panel"
					aria-label="Admin Panel"
				>
					⚙
				</button>
			{/if}
			{#if canCreateProjects}
				<button
					class="collapsed-create-btn"
					onclick={showCreateProjectModal}
					title="Create new project"
					aria-label="Create new project"
				>
					+
				</button>
			{/if}
		</div>
	{/if}
</aside>

<!-- Create Project Modal -->
<ProjectCreateModal
	bind:isOpen={showCreateModal}
	defaultParentId={currentProject?.id || null}
	on:created={handleProjectCreated}
	on:close={handleModalClose}
/>

<style>
	.project-sidebar {
		width: 280px;
		background: var(--nord0);
		border-right: 1px solid var(--nord3);
		display: flex;
		flex-direction: column;
		transition: width 0.3s ease;
		overflow: hidden;
	}

	.project-sidebar.collapsed {
		width: 60px;
	}

	.sidebar-header {
		padding: 1rem;
		border-bottom: 1px solid var(--nord3);
		background: var(--nord1);
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.sidebar-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0;
	}

	.collapse-btn {
		width: 1.5rem;
		height: 1.5rem;
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

	/* Hide collapse button on mobile since header has toggle */
	@media (max-width: 1024px) {
		.collapse-btn {
			display: none;
		}
	}

	.collapse-btn:hover {
		background: var(--nord2);
		color: var(--nord6);
	}

	.sidebar-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.home-btn,
	.admin-btn,
	.create-project-btn {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
		background: transparent;
		color: var(--nord4);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.home-btn:hover,
	.admin-btn:hover,
	.create-project-btn:hover {
		background: var(--nord2);
		border-color: var(--nord4);
		color: var(--nord6);
	}

	.home-btn {
		background: var(--nord8);
		color: var(--nord0);
		border-color: var(--nord8);
	}

	.home-btn:hover {
		background: var(--nord9);
		border-color: var(--nord9);
	}

	.admin-btn {
		background: var(--nord12);
		color: var(--nord0);
		border-color: var(--nord12);
	}

	.admin-btn:hover {
		background: var(--nord11);
		border-color: var(--nord11);
	}

	.projects-tree {
		flex: 1;
		overflow: hidden;
	}

	.collapsed-actions {
		padding: 0.5rem;
		border-top: 1px solid var(--nord3);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.collapsed-home-btn,
	.collapsed-admin-btn,
	.collapsed-create-btn {
		width: 100%;
		height: 2.5rem;
		border: 1px dashed var(--nord3);
		border-radius: 0.375rem;
		background: transparent;
		color: var(--nord4);
		font-size: 1.25rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.collapsed-home-btn:hover,
	.collapsed-admin-btn:hover,
	.collapsed-create-btn:hover {
		border-color: var(--nord8);
		color: var(--nord8);
		background: rgba(129, 161, 193, 0.05);
	}

	.collapsed-home-btn {
		background: var(--nord8);
		color: var(--nord0);
		border-color: var(--nord8);
		border-style: solid;
		font-size: 1rem;
	}

	.collapsed-home-btn:hover {
		background: var(--nord9);
		border-color: var(--nord9);
	}

	.collapsed-admin-btn {
		background: var(--nord12);
		color: var(--nord0);
		border-color: var(--nord12);
		border-style: solid;
		font-size: 1rem;
	}

	.collapsed-admin-btn:hover {
		background: var(--nord11);
		border-color: var(--nord11);
	}


	/* Responsive design */
	@media (max-width: 1024px) {
		.project-sidebar {
			position: fixed;
			top: 0;
			left: 0;
			height: 100vh;
			z-index: 100;
			transform: translateX(-100%);
			width: 280px; /* Fixed width on mobile */
		}

		.project-sidebar.collapsed {
			transform: translateX(-100%); /* Hide when collapsed */
			width: 280px; /* Keep full width when hiding */
		}

		.project-sidebar:not(.collapsed) {
			transform: translateX(0); /* Show when not collapsed */
		}
	}

	/* Accessibility */
	.create-project-btn:focus,
	.collapsed-create-btn:focus {
		outline: 2px solid var(--nord8);
		outline-offset: 2px;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.project-sidebar {
			transition: none;
		}
	}
</style>
