<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import {
		projects,
		activeProject,
		projectStats,
		setActiveProject,
		createProject,
		loadProjects
	} from '$lib/stores';
	import ProjectTree from './ProjectTree.svelte';
	import type {
		Project,
		ProjectWithDetails,
		NewProject,
		ProjectTreeData,
		ProjectNode
	} from '$lib/types/database';
	import { buildProjectTree } from '$lib/utils/projectTree';
	import { navigateToProject, navigateToHome } from '$lib/utils/navigation';

	const dispatch = createEventDispatcher<{
		projectSelect: { project: Project };
		projectCreate: { project: Project };
		projectEdit: { project: Project };
		collapse: { isCollapsed: boolean };
	}>();

	// Component state
	let isCollapsed = false;
	let showCreateForm = false;
	let newProjectName = '';
	let newProjectDescription = '';
	let newProjectIcon = '';
	let newProjectColor = '--nord8';
	let newProjectParentId: string | number | null = null;
	let isCreating = false;
	let isLoadingTree = false;
	let treeData: ProjectTreeData | null = null;

	// Color options for projects
	const colorOptions = [
		{ name: 'Blue', value: '--nord8', bg: 'var(--nord8)' },
		{ name: 'Cyan', value: '--nord7', bg: 'var(--nord7)' },
		{ name: 'Teal', value: '--nord9', bg: 'var(--nord9)' },
		{ name: 'Purple', value: '--nord10', bg: 'var(--nord10)' },
		{ name: 'Green', value: '--nord14', bg: 'var(--nord14)' },
		{ name: 'Orange', value: '--nord12', bg: 'var(--nord12)' },
		{ name: 'Red', value: '--nord11', bg: 'var(--nord11)' },
		{ name: 'Yellow', value: '--nord13', bg: 'var(--nord13)' }
	];

	// Icon suggestions
	const iconSuggestions = [
		'■',
		'□',
		'▲',
		'△',
		'▶',
		'▷',
		'◆',
		'◇',
		'○',
		'●',
		'◎',
		'◍',
		'★',
		'☆',
		'◈',
		'◉'
	];

	// Reactive values
	$: allProjects = $projects;
	$: currentProject = $activeProject;
	$: statsData = $projectStats;

	// Build tree structure when project stats change
	$: if ($projectStats && $projectStats.length > 0) {
		treeData = buildProjectTree($projectStats);
	}

	// Get possible parent projects for creation form
	$: possibleParents = treeData ? Array.from(treeData.flatMap.values()) : [];

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

	// Show create project form
	function showCreateProjectForm(parentId: number | null = null) {
		showCreateForm = true;
		newProjectName = '';
		newProjectDescription = '';
		newProjectIcon = '';
		newProjectColor = '--nord8';
		newProjectParentId = parentId || null;
	}

	// Hide create project form
	function hideCreateProjectForm() {
		showCreateForm = false;
		newProjectName = '';
		newProjectDescription = '';
		newProjectIcon = '';
		newProjectColor = '--nord8';
		newProjectParentId = null;
	}

	// Handle create project form submission
	async function handleCreateProject() {
		if (!newProjectName.trim() || isCreating) return;

		isCreating = true;
		try {
			// Clean the data to ensure only valid project properties are sent
			// Ensure parentId is properly typed (number or null)
			let cleanParentId: number | null = null;
			if (newProjectParentId && typeof newProjectParentId === 'number') {
				cleanParentId = newProjectParentId;
			} else if (
				newProjectParentId &&
				typeof newProjectParentId === 'string' &&
				newProjectParentId !== ''
			) {
				const parsed = parseInt(newProjectParentId);
				if (!isNaN(parsed)) {
					cleanParentId = parsed;
				}
			}

			const projectData: NewProject = {
				name: newProjectName.trim(),
				description: newProjectDescription.trim() || undefined,
				icon: newProjectIcon || undefined,
				color: newProjectColor,
				isActive: true,
				parentId: cleanParentId
			};

			// Log for debugging
			console.log('🚀 Creating project with data:', projectData);

			const project = await createProject(projectData);

			// Reload projects with stats to ensure sidebar updates
			await loadProjectsWithStats();

			dispatch('projectCreate', { project });
			hideCreateProjectForm();
		} catch (error) {
			console.error('Failed to create project:', error);
		} finally {
			isCreating = false;
		}
	}

	// Handle keyboard shortcuts in create form
	function handleCreateFormKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleCreateProject();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			hideCreateProjectForm();
		}
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

	// Set icon from suggestion
	function setIcon(icon: string) {
		newProjectIcon = icon;
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
				<button
					class="create-project-btn transition-colors hover-scale active-press"
					onclick={showCreateProjectForm}
					title="Create new project"
					aria-label="Create new project"
				>
					+ New Project
				</button>
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
			<button
				class="collapsed-create-btn"
				onclick={showCreateProjectForm}
				title="Create new project"
				aria-label="Create new project"
			>
				+
			</button>
		</div>
	{/if}
</aside>

<!-- Create Project Modal -->
{#if showCreateForm}
	<div
		class="modal-backdrop modal-backdrop"
		onclick={(e) => e.target === e.currentTarget && hideCreateProjectForm()}
		onkeydown={handleCreateFormKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="create-project-title"
		tabindex="-1"
	>
		<div class="modal-content modal-content">
			<!-- Modal Header -->
			<div class="modal-header">
				<h3 id="create-project-title" class="modal-title">Create New Project</h3>
				<button
					class="close-btn"
					onclick={hideCreateProjectForm}
					title="Close"
					aria-label="Close dialog"
				>
					✕
				</button>
			</div>

			<!-- Form -->
			<form
				class="create-form"
				onsubmit={(e) => {
					e.preventDefault();
					handleCreateProject();
				}}
			>
				<!-- Project Name -->
				<div class="form-group">
					<label for="project-name" class="form-label">Project Name *</label>
					<input
						bind:value={newProjectName}
						type="text"
						id="project-name"
						class="form-input transition-colors focus-ring-animation"
						placeholder="Enter project name..."
						maxlength="255"
						required
					/>
				</div>

				<!-- Project Description -->
				<div class="form-group">
					<label for="project-description" class="form-label">Description</label>
					<textarea
						bind:value={newProjectDescription}
						id="project-description"
						class="form-textarea"
						placeholder="Describe this project..."
						rows="3"
					></textarea>
				</div>

				<!-- Parent Project -->
				<div class="form-group">
					<label for="project-parent" class="form-label">Parent Project (optional)</label>
					<select bind:value={newProjectParentId} id="project-parent" class="form-input transition-colors focus-ring-animation">
						<option value="">None (Root Project)</option>
						{#each possibleParents as parentOption}
							<option value={parentOption.id}>
								{parentOption.breadcrumb}
							</option>
						{/each}
					</select>
				</div>

				<!-- Project Icon -->
				<div class="form-group">
					<label for="project-icon" class="form-label">Icon (optional)</label>
					<input
						bind:value={newProjectIcon}
						type="text"
						id="project-icon"
						class="form-input transition-colors focus-ring-animation"
						placeholder="◆"
						maxlength="10"
					/>

					<!-- Icon Suggestions -->
					<div class="icon-suggestions">
						{#each iconSuggestions as icon}
							<button
								type="button"
								class="icon-suggestion"
								class:selected={newProjectIcon === icon}
								onclick={() => setIcon(icon)}
								title="Use {icon} icon"
							>
								{icon}
							</button>
						{/each}
					</div>
				</div>

				<!-- Project Color -->
				<div class="form-group">
					<fieldset class="form-fieldset">
						<legend class="form-label">Color</legend>
						<div class="color-options">
							{#each colorOptions as color}
								<button
									type="button"
									class="color-option"
									class:selected={newProjectColor === color.value}
									style="background-color: {color.bg}"
									onclick={() => (newProjectColor = color.value)}
									title={color.name}
									aria-label="Select {color.name} color"
								>
									{#if newProjectColor === color.value}
										✓
									{/if}
								</button>
							{/each}
						</div>
					</fieldset>
				</div>

				<!-- Preview -->
				<div class="form-group">
					<div class="form-label">Preview</div>
					<div class="project-preview">
						<div class="preview-indicator" style="background-color: {newProjectColor}">
							{#if newProjectIcon}
								<span class="preview-emoji">{newProjectIcon}</span>
							{:else}
								<div class="preview-dot"></div>
							{/if}
						</div>
						<span class="preview-name">
							{newProjectName || 'Project Name'}
						</span>
					</div>
				</div>

				<!-- Form Actions -->
				<div class="form-actions">
					<button
						type="button"
						class="btn btn-secondary"
						onclick={hideCreateProjectForm}
						disabled={isCreating}
					>
						Cancel
					</button>

					<button
						type="submit"
						class="btn btn-primary"
						disabled={!newProjectName.trim() || isCreating}
					>
						{#if isCreating}
							<span class="loading-spinner"></span>
							Creating...
						{:else}
							Create Project
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

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

	/* Modal Styles */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: var(--nord0);
		border: 1px solid var(--nord3);
		border-radius: 0.75rem;
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem 1.5rem 0;
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

	.close-btn:hover {
		background: var(--nord2);
		color: var(--nord6);
	}

	.create-form {
		padding: 1.5rem;
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

	.form-input,
	.form-textarea {
		padding: 0.75rem;
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
		background: var(--nord1);
		color: var(--nord6);
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.form-input:focus,
	.form-textarea:focus {
		outline: none;
		border-color: var(--nord8);
		box-shadow: 0 0 0 3px rgba(129, 161, 193, 0.1);
	}

	.form-textarea {
		resize: vertical;
		min-height: 4rem;
	}

	.icon-suggestions {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
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

	.color-options {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
	}

	.color-option {
		width: 3rem;
		height: 2rem;
		border: 2px solid transparent;
		border-radius: 0.375rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.color-option:hover,
	.color-option.selected {
		border-color: var(--nord6);
		transform: scale(1.05);
	}

	.project-preview {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
		background: var(--nord1);
	}

	.preview-indicator {
		width: 2rem;
		height: 2rem;
		border-radius: 0.375rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preview-emoji {
		font-size: 1rem;
	}

	.preview-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.8);
	}

	.preview-name {
		font-weight: 500;
		color: var(--nord6);
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

	.btn-ghost {
		background: transparent;
		color: var(--nord4);
		border: 1px solid var(--nord3);
	}

	.btn-ghost:hover {
		background: var(--nord2);
		border-color: var(--nord4);
	}

	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
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
	.project-item:focus,
	.create-project-btn:focus,
	.collapsed-create-btn:focus {
		outline: 2px solid var(--nord8);
		outline-offset: 2px;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.project-sidebar,
		.project-item,
		.progress-fill,
		.btn {
			transition: none;
		}

		.loading-spinner {
			animation: none;
		}
	}
</style>
