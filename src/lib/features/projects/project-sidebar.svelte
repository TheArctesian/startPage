<script lang="ts">
	import { onMount } from 'svelte';
	import {
		activeProject,
		projectTreeData,
		setActiveProject,
		loadProjectTree
	} from '$lib/stores';
	import ProjectTree from './project-tree/project-tree.svelte';
	import ProjectCreateModal from './modals/project-create-modal.svelte';
	import type {
		Project,
		ProjectWithDetails,
		ProjectNode
	} from '$lib/types/database';
	import { navigateToProject, navigateToHome } from '$lib/utils/navigation';
	import type { User } from '$lib/types/database';
	import { toasts } from '$lib/stores/toasts';

	let {
		user = null,
		isAuthenticated = false,
		onprojectselect,
		onprojectcreate,
		onprojectedit,
		oncollapse
	} = $props<{
		user?: User | null;
		isAuthenticated?: boolean;
		onprojectselect?: (event: { project: Project }) => void;
		onprojectcreate?: (event: { project: Project }) => void;
		onprojectedit?: (event: { project: Project }) => void;
		oncollapse?: (event: { isCollapsed: boolean }) => void;
	}>();

	// Check if user can see private content or create projects (authenticated users only)
	const canViewPrivateProjects = $derived(Boolean(isAuthenticated && user && user.status === 'approved'));
	const canCreateProjects = $derived(canViewPrivateProjects);

	// Component state
	let isCollapsed = $state(false);
	let showCreateModal = $state(false);

	// Reactive values from stores
	const currentProject = $derived($activeProject);
	const treeData = $derived($projectTreeData);

	let lastPermissionState: boolean | null = null;

	$effect(() => {
		const current = canViewPrivateProjects;

		if (lastPermissionState === null) {
			lastPermissionState = current;
			return;
		}

		if (current === lastPermissionState) return;

		lastPermissionState = current;

		if (!current) {
			projectTreeData.set(null);
		}

		loadProjectTree(true);
	});

	// Handle project selection
	async function selectProject(project: Project | ProjectNode) {
		if (!canViewPrivateProjects && project.isPublic === false) {
			toasts.error('Private project', 'Sign in to view this project.');
			return;
		}

		// Set the active project in the store first
		await setActiveProject(project);
		// Navigate to project route
		await navigateToProject(project);
		onprojectselect?.({ project });
	}

	// Handle tree project selection
	async function handleTreeProjectSelect(event: { project: ProjectNode }) {
		await selectProject(event.project);
	}

	// Handle tree refresh
	async function handleTreeRefresh() {
		await loadProjectTree(true);
	}

	// Handle tree bulk expand/collapse events
	function handleTreeBulkChange() {
		// Tree component already updated store via toggleProjectExpanded
		// No action needed here
	}

	// Handle individual project toggle (expand/collapse)
	function handleTreeProjectToggle() {
		// Tree component already updated store via toggleProjectExpanded
		// No action needed here
	}

	// Toggle sidebar collapse
	function toggleCollapse() {
		isCollapsed = !isCollapsed;
		oncollapse?.({ isCollapsed });
	}

	// Show create project modal
	function showCreateProjectModal() {
		showCreateModal = true;
	}

	// Handle project created
	async function handleProjectCreated(event: { project: ProjectWithDetails }) {
		showCreateModal = false;
		// Reload tree to reflect new project
		await loadProjectTree(true);
		onprojectcreate?.({ project: event.project });
	}

	// Handle modal close
	function handleModalClose() {
		showCreateModal = false;
	}

	// Load projects on mount
	onMount(async () => {
		await loadProjectTree(true); // Load tree with stats into projectTreeData store
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
			onprojectselect={handleTreeProjectSelect}
			onprojecttoggle={handleTreeProjectToggle}
			onrefresh={handleTreeRefresh}
			onexpandall={handleTreeBulkChange}
			oncollapseall={handleTreeBulkChange}
			canViewPrivateProjects={canViewPrivateProjects}
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
	oncreated={handleProjectCreated}
	onclose={handleModalClose}
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
