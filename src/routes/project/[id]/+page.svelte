<script lang="ts">
	import ProjectHeader from '$lib/features/projects/ProjectHeader.svelte';
	import QuickLinksSection from '$lib/features/projects/QuickLinksSection.svelte';
	import SubProjectsSection from '$lib/features/projects/SubProjectsSection.svelte';
	import ProjectModals, {
		type ModalState
	} from '$lib/features/projects/ProjectModals.svelte';
	import TasksView from '$lib/features/tasks/tasks-view.svelte';
	import { toasts } from '$lib/stores/toasts';
	import { completeTask } from '$lib/api/tasks';
	import {
		setActiveProject,
		setSelectedTask,
		activeProjectQuickLinks,
		deleteTask,
		loadingQuickLinks,
		loadingSubProjects
	} from '$lib/stores';
	import {
		initializeDefaultShortcuts,
		registerShortcut,
		setKeyboardContext,
		type KeyboardShortcut
	} from '$lib/stores/keyboard';
	import { taskViewMode } from '$lib/stores/taskView';
	import type {
		TaskWithDetails,
		TaskStatus,
		ProjectWithDetails,
		ProjectStatus,
		QuickLink
	} from '$lib/types/database';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	// Permission-related variables from server data
	const canEdit = $derived(data.canEdit);
	const isAuthenticated = $derived(data.isAuthenticated);
	const userPermission = $derived(data.userPermission);

	// Consolidated modal state (replacing 12+ boolean flags)
	type TaskWithBoard = TaskWithDetails & { boardColumn?: TaskStatus };

	let modalState: ModalState = $state({ type: 'none' });
	let subProjects: ProjectWithDetails[] = $state([]);
	let tasks: TaskWithDetails[] = $state([]);
	let projectInitialized = false;
	let pendingCompletion = $state<{
		taskId: number;
		previousStatus: TaskStatus;
		previousColumn?: TaskStatus;
	} | null>(null);
	let isCompletingTask = $state(false);

	// Modal control functions
	function openModal(type: ModalState['type'], data?: ModalState['data']) {
		modalState = { type, data };
	}

	function closeModal(options?: { revertPendingCompletion?: boolean }) {
		if (options?.revertPendingCompletion && pendingCompletion) {
			const { taskId, previousStatus, previousColumn } = pendingCompletion;
			tasks = tasks.map((t) => {
				if (t.id !== taskId) return t;
				const reverted = { ...(t as TaskWithBoard), status: previousStatus } as TaskWithBoard;
				reverted.boardColumn = previousColumn ?? previousStatus;
				return reverted;
			});
			pendingCompletion = null;
		}

		modalState = { type: 'none' };
		setKeyboardContext(data.project ? 'kanban' : null);
	}

	// Data loading functions
	async function loadTasks() {
		if (!data.project) {
			tasks = [];
			return;
		}

		try {
			const response = await fetch(`/api/tasks?project=${data.project.id}&details=true`);
			if (response.ok) {
				tasks = await response.json();
			} else {
				tasks = [];
			}
		} catch (error) {
			console.error('Failed to load tasks:', error);
			tasks = [];
		}
	}

	async function loadSubProjects() {
		if (!data.project) {
			subProjects = [];
			return;
		}

		loadingSubProjects.set(true);
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
		} finally {
			loadingSubProjects.set(false);
		}
	}

	// Task handlers
	function handleTaskEdit(task: TaskWithDetails) {
		openModal('editTask', { task });
	}

	async function handleTaskDelete(task: TaskWithDetails) {
		const confirmed = confirm(
			`Are you sure you want to delete "${task.title}"? This action cannot be undone.`
		);
		if (!confirmed) return;

		try {
			await deleteTask(task.id);
			await loadTasks();
			toasts.success('Task Deleted', `"${task.title}" has been deleted.`);
		} catch (error) {
			console.error('Failed to delete task:', error);
			toasts.error('Delete Failed', 'Failed to delete task. Please try again.');
		}
	}

	async function handleTaskStatusChange(task: TaskWithDetails, status: string) {
		try {
			// Show completion modal for tasks being marked as done
			if (status === 'done') {
				const currentTask = task as TaskWithBoard;
				const updatedTask: TaskWithBoard = {
					...currentTask,
					status,
					boardColumn: status
				};

				pendingCompletion = {
					taskId: task.id,
					previousStatus: currentTask.status,
					previousColumn: currentTask.boardColumn
				};

				tasks = tasks.map((t) => (t.id === task.id ? updatedTask : t));

				openModal('completeTask', { task: updatedTask });
				return;
			}

			// For other status changes, update immediately
			const response = await fetch(`/api/tasks/${task.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status })
			});

			if (!response.ok) throw new Error('Failed to update task status');
			await loadTasks();
		} catch (error) {
			console.error('Failed to update task status:', error);
			toasts.error('Status Update Failed', 'Unable to update task status. Please try again.');
		}
	}

	// Modal event handlers
	function handleTaskCreated() {
		closeModal();
		window.location.reload();
	}

	function handleTaskUpdated() {
		closeModal();
		window.location.reload();
	}

	async function handleTaskCompleted(event: {
		task: TaskWithDetails;
		actualIntensity: number;
		timeSpent?: number;
	}) {
		const { task, actualIntensity, timeSpent } = event;

		if (isCompletingTask) {
			return;
		}

		isCompletingTask = true;

		try {
			const actualMinutes =
				typeof timeSpent === 'number' && !Number.isNaN(timeSpent) ? timeSpent : undefined;

			await completeTask(task.id, actualIntensity as import('$lib/types/database').IntensityLevel, actualMinutes);
			toasts.success('Task Completed', `"${task.title}" marked as done.`);
			pendingCompletion = null;
			closeModal();
			await loadTasks();
		} catch (error) {
			console.error('Failed to complete task:', error);
			toasts.error(
				'Task Completion Failed',
				'Unable to complete the task. Please try again.'
			);
		}
		isCompletingTask = false;
	}

	function handleProjectUpdated() {
		closeModal();
	}

function handleSubProjectCreated(event: { project: ProjectWithDetails }) {
	closeModal();
	loadSubProjects();
	toasts.success(
		'Sub-project Created',
		`"${event.project.name}" has been added as a sub-project.`
	);
}

	function handleQuickLinkUpdated() {
		// Store is automatically updated
	}

	function handleQuickLinkDeleted() {
		// Store is automatically updated
	}

	function handleQuickLinkEdit(event: CustomEvent<{ link: QuickLink }>) {
		openModal('editQuickLink', { link: event.detail.link });
	}

	// Keyboard shortcut handlers
	function handleNewTask() {
		if (data.project) openModal('newTask');
	}

	function handleShowHelp() {
		openModal('shortcuts');
	}

	function handleEscape() {
		if (modalState.type !== 'none') {
			closeModal();
		}
	}

	// Initialize component
	onMount(async () => {
		if (data.project) {
			loadTasks();
			loadSubProjects();

			// Set active project
			if (!projectInitialized) {
				try {
					await setActiveProject(data.project);
					projectInitialized = true;
				} catch (error) {
					console.error('Failed to set active project:', error);
				}
			}
		}

		// Initialize keyboard shortcuts
		initializeDefaultShortcuts();

		registerShortcut({
			id: 'show-help',
			key: '?',
			description: 'Show keyboard shortcuts help',
			action: handleShowHelp
		});

		registerShortcut({
			id: 'switch-kanban',
			key: '1',
			description: 'Switch to kanban view',
			action: () => taskViewMode.setKanban()
		});

		registerShortcut({
			id: 'switch-grid',
			key: '2',
			description: 'Switch to grid view',
			action: () => taskViewMode.setGrid()
		});

		registerShortcut({
			id: 'switch-list',
			key: '3',
			description: 'Switch to list view',
			action: () => taskViewMode.setList()
		});

		if (browser) {
			document.addEventListener('shortcut:new-task', handleNewTask);
			document.addEventListener('shortcut:escape', handleEscape);
		}
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('shortcut:new-task', handleNewTask);
			document.removeEventListener('shortcut:escape', handleEscape);
		}
	});

	// Reactive data reloading
	$effect(() => {
		if (browser && data.project) {
			loadTasks();
			loadSubProjects();
		} else {
			tasks = [];
			subProjects = [];
		}
	});
</script>

<svelte:head>
	<title>{data.project?.name || 'Project'} - Dashboard</title>
	<meta name="description" content="Project dashboard for {data.project?.name || 'project'}" />
</svelte:head>

<div class="app-layout page-transition">
	<main class="main-content">
		<div class="page-content">
			{#if data.project}
				<div class="project-wrapper">
					<ProjectHeader
						project={data.project}
						breadcrumb={data.breadcrumb}
						{canEdit}
						onEdit={() => openModal('editProject')}
					/>

					<div class="project-content">
						<QuickLinksSection
							quickLinks={$activeProjectQuickLinks}
							loading={$loadingQuickLinks}
							{canEdit}
							onAddLink={() => openModal('quickLinks')}
							onEditLink={(link) => openModal('editQuickLink', { link })}
						/>

						<SubProjectsSection
							{subProjects}
							loading={$loadingSubProjects}
							{canEdit}
							onAddSubProject={() => openModal('newSubProject')}
						/>
					</div>
				</div>
			{/if}

			<!-- Tasks View -->
			<TasksView
				{tasks}
				onEdit={handleTaskEdit}
				onDelete={handleTaskDelete}
				onStatusChange={handleTaskStatusChange}
				onNewTask={handleNewTask}
				{canEdit}
				{isAuthenticated}
			/>
		</div>
	</main>

	<!-- All modals consolidated -->
	<ProjectModals
		{modalState}
		project={data.project}
		{canEdit}
		{isAuthenticated}
		onClose={closeModal}
		onTaskCreated={handleTaskCreated}
		onTaskUpdated={handleTaskUpdated}
		onTaskCompleted={handleTaskCompleted}
		onProjectUpdated={handleProjectUpdated}
		onSubProjectCreated={handleSubProjectCreated}
		onQuickLinkUpdated={handleQuickLinkUpdated}
		onQuickLinkDeleted={handleQuickLinkDeleted}
		onQuickLinkEdit={handleQuickLinkEdit}
	/>
</div>

<style>
	.app-layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: var(--nord0);
		color: var(--nord6);
	}

	.main-content {
		background: var(--nord0);
		overflow-y: auto;
		position: relative;
		width: 100%;
		height: 100%;
	}

	.page-content {
		padding: 0;
	}

	.project-wrapper {
		margin-bottom: 1rem;
	}

	.project-content {
		background: var(--nord1);
		border-radius: var(--radius-lg);
		border: 1px solid var(--nord3);
		padding: 1.5rem;
		margin: 0 1rem 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 640px) {
		.project-content {
			margin: 0 1rem 1rem;
			padding: 1rem;
		}
	}
</style>
