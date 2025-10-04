<script lang="ts">
	import Timer from '$lib/components/timer/Timer.svelte';
	import QuickLinks from '$lib/components/projects/QuickLinks.svelte';
	import QuickLinkEditModal from '$lib/components/projects/QuickLinkEditModal.svelte';
	import ProjectEditModal from '$lib/components/projects/ProjectEditModal.svelte';
	import ProjectCreateModal from '$lib/components/projects/ProjectCreateModal.svelte';
	import ProjectTree from '$lib/components/projects/ProjectTree.svelte';
	import KanbanBoard from '$lib/components/tasks/KanbanBoard.svelte';
	import ShortcutsHelp from '$lib/components/keyboard/ShortcutsHelp.svelte';
	import TaskCompletionModal from '$lib/components/tasks/TaskCompletionModal.svelte';
	import AnalyticsDashboard from '$lib/components/analytics/AnalyticsDashboard.svelte';
	import ReportsView from '$lib/components/analytics/ReportsView.svelte';
	import { toasts } from '$lib/stores/toasts';
	import {
		setActiveProject,
		setSelectedTask,
		activeProjectQuickLinks,
		deleteTask,
		updateQuickLink,
		deleteQuickLink,
		isTimerRunning,
		selectedTask
	} from '$lib/stores';
	import {
		initializeDefaultShortcuts,
		registerShortcut,
		setKeyboardContext,
		type KeyboardShortcut
	} from '$lib/stores/keyboard';
	import { navigateToProject } from '$lib/utils/navigation';
	import { responsiveActions } from '$lib/stores/sidebar';
	import type {
		TaskWithDetails,
		ProjectWithDetails,
		ProjectStatus,
		QuickLink
	} from '$lib/types/database';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	export let data: PageData;

	// Project data is available but we don't automatically set it as active
	// The user navigated specifically to this project route

	// Permission-related variables from server data
	$: canEdit = data.canEdit;
	$: isAuthenticated = data.isAuthenticated;
	$: userPermission = data.userPermission;

	let showShortcutsHelp = false;
	let showNewTaskModal = false;
	let showCompletionModal = false;
	let showAnalytics = false;
	let showReports = false;
	let showProjectEdit = false;
	let showQuickLinkModal = false;
	let showQuickLinkEdit = false;
	let showSubProjectModal = false;
	let taskToComplete: TaskWithDetails | null = null;
	let linkToEdit: QuickLink | null = null;
	let subProjects: ProjectWithDetails[] = [];

	// Handle task selection from board
	function handleTaskSelect(event: CustomEvent<{ task: TaskWithDetails }>) {
		setSelectedTask(event.detail.task);
	}

	// Handle task completion - will show intensity rating modal
	function handleTaskComplete(event: CustomEvent<{ task: TaskWithDetails }>) {
		taskToComplete = event.detail.task;
		showCompletionModal = true;
		setKeyboardContext('modal');
	}

	// Handle task editing
	function handleTaskEdit(event: CustomEvent<{ task: TaskWithDetails }>) {
		console.log('Edit task:', event.detail.task);
	}

	// Handle task deletion
	async function handleTaskDelete(event: CustomEvent<{ task: TaskWithDetails }>) {
		const task = event.detail.task;

		// Show confirmation dialog
		const confirmed = confirm(
			`Are you sure you want to delete "${task.title}"? This action cannot be undone.`
		);

		if (!confirmed) return;

		try {
			await deleteTask(task.id);
			console.log(`Task "${task.title}" deleted successfully`);
		} catch (error) {
			console.error('Failed to delete task:', error);
			alert('Failed to delete task. Please try again.');
		}
	}

	// Check if we're in mobile mode
	function isMobileMode() {
		return typeof window !== 'undefined' && window.innerWidth <= 1024;
	}

	// Keyboard shortcut handlers
	function handleNewTask() {
		if (data.project) {
			showNewTaskModal = true;
			setKeyboardContext('modal');
		}
	}

	function handleEscape() {
		if (showShortcutsHelp) {
			showShortcutsHelp = false;
		} else if (showCompletionModal) {
			showCompletionModal = false;
			taskToComplete = null;
			setKeyboardContext(null);
		} else if (showNewTaskModal) {
			showNewTaskModal = false;
			setKeyboardContext(null);
		}
	}

	// Handle task completion submission
	async function handleTaskCompleted(
		event: CustomEvent<{
			task: TaskWithDetails;
			actualIntensity: number;
			timeSpent?: number;
		}>
	) {
		const { task, actualIntensity, timeSpent } = event.detail;

		try {
			// Update task with actual values
			const response = await fetch(`/api/tasks/${task.id}/complete`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					actualIntensity,
					actualMinutes: timeSpent,
					status: 'done'
				})
			});

			if (!response.ok) {
				throw new Error('Failed to complete task');
			}

			// Close modal and refresh data
			showCompletionModal = false;
			taskToComplete = null;
			setKeyboardContext(null);

			// Dispatch event to refresh kanban board (browser only)
			if (browser) {
				const refreshEvent = new CustomEvent('task-completed', { detail: { task } });
				document.dispatchEvent(refreshEvent);
			}
		} catch (error) {
			console.error('Error completing task:', error);
			toasts.error('Task Completion Failed', 'Unable to complete the task. Please try again.');
		}
	}

	// Handle completion modal cancel
	function handleCompletionCancel() {
		showCompletionModal = false;
		taskToComplete = null;
		setKeyboardContext(null);
	}

	function handleShowHelp() {
		showShortcutsHelp = !showShortcutsHelp;
	}

	function handleShowAnalytics() {
		showAnalytics = true;
	}

	function handleShowReports() {
		showReports = true;
	}

	function handleShowProjectEdit() {
		if (data.project) {
			showProjectEdit = true;
		}
	}

	function handleShowQuickLinkModal() {
		showQuickLinkModal = true;
	}

	// Handle quick link edit
	function handleQuickLinkEdit(event: CustomEvent<{ link: QuickLink }>) {
		linkToEdit = event.detail.link;
		showQuickLinkEdit = true;
	}

	// Handle quick link updated
	function handleQuickLinkUpdated(event: CustomEvent<{ link: QuickLink }>) {
		showQuickLinkEdit = false;
		linkToEdit = null;
		// The store is automatically updated by the updateQuickLink action
	}

	// Handle quick link deleted
	function handleQuickLinkDeleted(event: CustomEvent<{ linkId: number }>) {
		showQuickLinkEdit = false;
		linkToEdit = null;
		// The store is automatically updated by the deleteQuickLink action
	}

	// Handle show sub-project modal
	function handleShowSubProjectModal() {
		showSubProjectModal = true;
	}

	// Handle sub-project created
	function handleSubProjectCreated(event: CustomEvent<{ project: ProjectWithDetails }>) {
		showSubProjectModal = false;
		// Refresh sub-projects list
		loadSubProjects();
		toasts.success(
			'Sub-project Created',
			`"${event.detail.project.name}" has been added as a sub-project.`
		);
	}

	// Handle sub-project modal close
	function handleSubProjectModalClose() {
		showSubProjectModal = false;
	}

	// Close quick link edit modal
	function handleCloseQuickLinkEdit() {
		showQuickLinkEdit = false;
		linkToEdit = null;
	}

	// Function to extract domain from URL for favicon service
	function getFaviconUrl(url: string): string {
		try {
			const domain = new URL(url).hostname;
			// Using DuckDuckGo's favicon service (more reliable than Google's)
			return `https://external-content.duckduckgo.com/ip3/${domain}.ico`;
		} catch (e) {
			// Fallback to a generic icon if URL parsing fails
			return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23ddd"/><text x="50" y="50" font-family="Arial" font-size="50" text-anchor="middle" dominant-baseline="middle" fill="%23555">?</text></svg>';
		}
	}

	// Load sub-projects for the current project
	async function loadSubProjects() {
		if (!data.project) {
			subProjects = [];
			return;
		}

		try {
			const response = await fetch(`/api/projects?parentId=${data.project.id}`);
			if (response.ok) {
				subProjects = await response.json();
			} else {
				subProjects = [];
			}
		} catch (error) {
			console.error('Failed to load sub-projects:', error);
			subProjects = [];
		}
	}

	// Load sub-projects on mount and when project changes
	onMount(() => {
		if (data.project) {
			loadSubProjects();
		}
	});

	// Reactive statement to reload sub-projects when project changes
	$: if (browser && data.project) {
		loadSubProjects();
	} else {
		subProjects = [];
	}

	// Handle project status changes from the status manager
	async function handleProjectStatusChange(
		event: CustomEvent<{ project: ProjectWithDetails; newStatus: ProjectStatus }>
	) {
		const { project, newStatus } = event.detail;

		try {
			const response = await fetch(`/api/projects/${project.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus })
			});

			if (!response.ok) {
				throw new Error('Failed to update project status');
			}

			// Update the project data if it's the main project
			if (project.id === data.project.id) {
				data.project = { ...data.project, status: newStatus };
			} else {
				// Update sub-project status
				const subProjectIndex = subProjects.findIndex((p) => p.id === project.id);
				if (subProjectIndex !== -1) {
					subProjects[subProjectIndex] = { ...subProjects[subProjectIndex], status: newStatus };
					subProjects = [...subProjects]; // Trigger reactivity
				}
			}
		} catch (error) {
			console.error('Error updating project status:', error);
			toasts.error('Project Update Failed', 'Unable to update project status. Please try again.');
		}
	}

	// Handle project edit from the status manager
	function handleProjectEditFromManager(event: CustomEvent<{ project: ProjectWithDetails }>) {
		// For now, just open the main project edit modal
		// In the future, this could open a specific project edit modal
		showProjectEdit = true;
	}

	// Set active project when component mounts (browser only)
	let projectInitialized = false;

	// Initialize keyboard shortcuts
	onMount(async () => {
		initializeDefaultShortcuts();

		// Set active project (browser only)
		if (data.project && !projectInitialized) {
			try {
				await setActiveProject(data.project);
				projectInitialized = true;
			} catch (error) {
				console.error('Failed to set active project:', error);
			}
		}

		// Register help shortcut
		const helpShortcut: KeyboardShortcut = {
			id: 'show-help',
			key: '?',
			description: 'Show keyboard shortcuts help',
			action: handleShowHelp
		};
		registerShortcut(helpShortcut);

		// Set up custom event listeners for shortcuts (browser only)
		if (browser) {
			document.addEventListener('shortcut:new-task', handleNewTask);
			document.addEventListener('shortcut:escape', handleEscape);
		}
	});

	onDestroy(() => {
		// Clean up event listeners (browser only)
		if (browser) {
			document.removeEventListener('shortcut:new-task', handleNewTask);
			document.removeEventListener('shortcut:escape', handleEscape);
		}
	});

	// Update keyboard context based on active area
	$: {
		if (showNewTaskModal || showCompletionModal) {
			setKeyboardContext('modal');
		} else if (data.project) {
			setKeyboardContext('kanban');
		} else {
			setKeyboardContext(null);
		}
	}
</script>

<svelte:head>
	<title>{data.project?.name || 'Project'} - Dashboard</title>
	<meta name="description" content="Project dashboard for {data.project?.name || 'project'}" />
</svelte:head>

<div class="app-layout page-transition">
	<!-- Fixed Timer Bar (when active) -->
	{#if $isTimerRunning && $selectedTask}
		<div class="fixed-timer-bar">
			<div class="timer-content">
				<div class="timer-task-info">
					<div class="timer-task-title">{$selectedTask.title}</div>
					<div class="timer-task-meta">{$selectedTask.estimatedMinutes}m estimated</div>
				</div>
				<div class="timer-display-wrapper">
					<Timer />
				</div>
			</div>
		</div>
	{/if}

	<!-- Main Content -->
	<main class="main-content">
		<div class="page-content">
			<!-- Project Tree -->
			{#if data.project}
				<div class="project-header">
					<div class="project-title-row">
						<h1 class="project-title">
							<div
								class="project-indicator"
								style="background-color: {data.project.color || 'var(--nord8)'}"
							>
								{#if data.project.icon}
									<span class="project-icon">{data.project.icon}</span>
								{:else}
									<div class="project-dot"></div>
								{/if}
							</div>
							{data.breadcrumb || data.project.name}
						</h1>
						{#if canEdit}
							<button
								class="project-edit-btn"
								onclick={handleShowProjectEdit}
								title="Edit project"
								aria-label="Edit project"
							>
								✎
							</button>
						{/if}
					</div>

					<!-- Project Description -->
					{#if data.project.description}
						<div class="project-description">
							<p>{data.project.description}</p>
						</div>
					{/if}

					<!-- Quick Links Section -->
					<div class="quick-links-section">
						<h3 class="quick-links-title">Quick Links</h3>
						<div class="quick-links-inline">
							<!-- Inline Quick Links Display -->
							{#if $activeProjectQuickLinks.length > 0}
								<div class="inline-links">
									{#each $activeProjectQuickLinks as link (link.id)}
										<button
											class="inline-link"
											onclick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
											title="Open {link.title}"
										>
											<span class="inline-link-icon">
												{#if link.icon}
													{link.icon}
												{:else}
													<img src={getFaviconUrl(link.url)} alt="" class="favicon" />
												{/if}
											</span>
											<span class="inline-link-title">{link.title}</span>
										</button>
									{/each}
									{#if canEdit}
										<button class="inline-add-link" onclick={handleShowQuickLinkModal}>
											+ Add Link
										</button>
									{/if}
								</div>
							{:else}
								<div class="inline-empty">
									<span class="inline-empty-text">No quick links yet</span>
									{#if canEdit}
										<button class="inline-add-link" onclick={handleShowQuickLinkModal}>
											+ Add Link
										</button>
									{/if}
								</div>
							{/if}
						</div>
					</div>

					<!-- Sub-projects Section -->
					<div class="sub-projects-section">
						<h2 class="sub-projects-title">Sub-projects</h2>

						<div class="sub-projects-grid">
							{#each subProjects as subProject (subProject.id)}
								<button
									class="sub-project-card"
									onclick={() => navigateToProject(subProject)}
									title="Navigate to {subProject.name}"
								>
									<div
										class="sub-project-indicator"
										style="background-color: {subProject.color || 'var(--nord8)'}"
									>
										{#if subProject.icon}
											<span class="sub-project-icon">{subProject.icon}</span>
										{:else}
											<div class="sub-project-dot"></div>
										{/if}
									</div>
									<div class="sub-project-content">
										<div class="sub-project-name">{subProject.name}</div>
										{#if subProject.totalTasks && subProject.totalTasks > 0}
											<div class="sub-project-stats">
												{subProject.completedTasks || 0}/{subProject.totalTasks} tasks
											</div>
										{/if}
									</div>
								</button>
							{/each}

							<!-- Add Sub-project Button -->
							{#if canEdit}
								<button class="add-subproject-btn" onclick={handleShowSubProjectModal}>
									<div class="add-subproject-indicator">
										<span class="add-subproject-icon">+</span>
									</div>
									<div class="add-subproject-content">
										<div class="add-subproject-name">Add Sub-project</div>
										<div class="add-subproject-description">Create a new sub-project</div>
									</div>
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- Kanban Board -->
			<KanbanBoard
				{canEdit}
				{isAuthenticated}
				on:taskSelect={handleTaskSelect}
				on:taskEdit={handleTaskEdit}
				on:taskComplete={handleTaskComplete}
				on:taskDelete={handleTaskDelete}
			/>
		</div>
	</main>

	<!-- Keyboard Shortcuts Help Modal -->
	<ShortcutsHelp bind:isOpen={showShortcutsHelp} on:close={() => (showShortcutsHelp = false)} />

	<!-- Task Completion Modal -->
	<TaskCompletionModal
		bind:isOpen={showCompletionModal}
		task={taskToComplete}
		on:complete={handleTaskCompleted}
		on:cancel={handleCompletionCancel}
	/>

	<!-- Analytics Dashboard -->
	<AnalyticsDashboard bind:isOpen={showAnalytics} />

	<!-- Reports View -->
	<ReportsView bind:isOpen={showReports} />

	<!-- Sub-Project Create Modal -->
	<ProjectCreateModal
		bind:isOpen={showSubProjectModal}
		defaultParentId={data.project?.id || null}
		on:created={handleSubProjectCreated}
		on:close={handleSubProjectModalClose}
	/>

	<!-- Project Edit Modal -->
	<ProjectEditModal
		bind:isOpen={showProjectEdit}
		project={data.project}
		on:close={() => (showProjectEdit = false)}
		on:updated={() => {
			// Project will be automatically updated in the store
			showProjectEdit = false;
		}}
	/>

	<!-- QuickLink Edit Modal -->
	<QuickLinkEditModal
		bind:isOpen={showQuickLinkEdit}
		link={linkToEdit}
		on:close={handleCloseQuickLinkEdit}
		on:updated={handleQuickLinkUpdated}
		on:deleted={handleQuickLinkDeleted}
	/>

	<!-- QuickLinks Modal -->
	{#if showQuickLinkModal}
		<div
			class="modal-backdrop"
			onclick={(e) => e.target === e.currentTarget && (showQuickLinkModal = false)}
			onkeydown={(e) => {
				if (e.key === 'Escape') {
					showQuickLinkModal = false;
				}
			}}
			role="dialog"
			aria-modal="true"
			aria-labelledby="quicklinks-modal-title"
			tabindex="-1"
		>
			<div class="quicklinks-modal-content">
				<div class="modal-header">
					<h3 id="quicklinks-modal-title" class="modal-title">Quick Links</h3>
					<button
						class="close-btn"
						onclick={() => (showQuickLinkModal = false)}
						title="Close"
						aria-label="Close dialog"
					>
						✕
					</button>
				</div>
				<div class="quicklinks-wrapper">
					<QuickLinks
						{canEdit}
						{isAuthenticated}
						on:linkEdit={handleQuickLinkEdit}
						on:linkUpdated={handleQuickLinkUpdated}
						on:linkDeleted={handleQuickLinkDeleted}
					/>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.app-layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: var(--nord0);
		color: var(--nord6);
	}

	/* Fixed Timer Bar */
	.fixed-timer-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		background: var(--nord1);
		border-bottom: 2px solid var(--nord8);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		padding: 0.75rem 1rem;
	}

	.timer-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 1200px;
		margin: 0 auto;
	}

	.timer-task-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.timer-task-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--nord6);
	}

	.timer-task-meta {
		font-size: 0.75rem;
		color: var(--nord9);
	}

	.timer-display-wrapper {
		flex-shrink: 0;
	}

	.main-content {
		background: var(--nord0);
		overflow-y: auto;
		position: relative;
		width: 100%;
		height: 100%;
	}

	/* Mobile Styles */
	@media (max-width: 1024px) {
		.timer-content {
			flex-direction: column;
			gap: 0.5rem;
			align-items: center;
			text-align: center;
		}
	}

	/* Project Header Styles */
	.project-header {
		background: var(--nord1);
		border-radius: 0.5rem;
		border: 1px solid var(--nord3);
		padding: 1.5rem;
		margin: 1rem;
		margin-bottom: 0;
	}

	.project-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.project-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0;
	}

	.project-edit-btn {
		width: 2rem;
		height: 2rem;
		border: none;
		background: transparent;
		color: var(--nord4);
		cursor: pointer;
		border-radius: 0.375rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	.project-edit-btn:hover {
		background: var(--nord3);
		color: var(--nord6);
	}

	.project-edit-btn:focus {
		outline: 2px solid var(--nord8);
		outline-offset: 1px;
	}

	.project-indicator {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.project-icon {
		font-size: 1.25rem;
	}

	.project-dot {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.8);
	}

	.project-description {
		margin-bottom: 1.5rem;
	}

	.project-description p {
		font-size: 0.95rem;
		color: var(--nord4);
		margin: 0;
		line-height: 1.5;
	}

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

	/* QuickLinks Modal */
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

	.quicklinks-modal-content {
		background: var(--nord0);
		border: 1px solid var(--nord3);
		border-radius: 0.75rem;
		width: 100%;
		max-width: 600px;
		max-height: 80vh;
		overflow: hidden;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid var(--nord3);
		background: var(--nord1);
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

	.quicklinks-wrapper {
		flex: 1;
		overflow: auto;
		min-height: 0;
	}

	.sub-projects-section {
		margin-top: 1.5rem;
	}

	.sub-projects-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0 0 1rem;
	}

	.sub-projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
	}

	.sub-project-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--nord2);
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
	}

	.sub-project-card:hover {
		background: var(--nord3);
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.sub-project-card:focus {
		outline: 2px solid var(--nord8);
		outline-offset: -2px;
	}

	.sub-project-indicator {
		width: 2rem;
		height: 2rem;
		border-radius: 0.375rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.sub-project-icon {
		font-size: 1rem;
	}

	.sub-project-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.8);
	}

	.sub-project-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.sub-project-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--nord6);
	}

	.sub-project-stats {
		font-size: 0.75rem;
		color: var(--nord4);
	}

	/* Add Sub-project Button Styles */
	.add-subproject-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: transparent;
		border: 1px dashed var(--nord3);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		height: auto;
		min-height: 4rem;
		text-align: left;
	}

	.add-subproject-btn:hover {
		border-color: var(--nord8);
		background: rgba(129, 161, 193, 0.05);
		border-style: solid;
	}

	.add-subproject-indicator {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.375rem;
		background: var(--nord3);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.add-subproject-btn:hover .add-subproject-indicator {
		background: var(--nord8);
	}

	.add-subproject-icon {
		font-size: 1.25rem;
		color: var(--nord6);
		font-weight: 300;
	}

	.add-subproject-btn:hover .add-subproject-icon {
		color: white;
	}

	.add-subproject-content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		flex: 1;
	}

	.add-subproject-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--nord4);
		transition: color 0.2s ease;
	}

	.add-subproject-btn:hover .add-subproject-name {
		color: var(--nord8);
	}

	.add-subproject-description {
		font-size: 0.75rem;
		color: var(--nord4);
		opacity: 0.8;
	}

	.sub-projects-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		text-align: center;
		color: var(--nord4);
		border: 1px dashed var(--nord3);
		border-radius: 0.5rem;
		margin-top: 1rem;
		grid-column: 1 / -1;
	}

	.empty-text {
		font-size: 1rem;
		font-weight: 500;
		color: var(--nord6);
		margin-bottom: 0.5rem;
	}

	.empty-subtext {
		font-size: 0.875rem;
		color: var(--nord4);
		margin-bottom: 1.5rem;
	}

	/* Mobile responsive */
	@media (max-width: 640px) {
		.project-header {
			margin: 1rem;
			padding: 1rem;
		}

		.project-title {
			font-size: 1.5rem;
			gap: 0.5rem;
		}

		.project-indicator {
			width: 2rem;
			height: 2rem;
		}

		.project-edit-btn {
			width: 1.75rem;
			height: 1.75rem;
			font-size: 0.75rem;
		}

		.sub-projects-grid {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}

		.sub-project-card {
			padding: 0.75rem;
		}
	}
</style>
