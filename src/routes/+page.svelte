<script lang="ts">
	import HomePage from '$lib/components/dashboard/HomePage.svelte';
	import ShortcutsHelp from '$lib/components/keyboard/ShortcutsHelp.svelte';
	import TaskCompletionModal from '$lib/components/tasks/TaskCompletionModal.svelte';
	import AnalyticsDashboard from '$lib/components/analytics/AnalyticsDashboard.svelte';
	import ReportsView from '$lib/components/analytics/ReportsView.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';
	import { setSelectedTask } from '$lib/stores';
	import { toasts } from '$lib/stores/toasts';
	import { responsiveActions } from '$lib/stores/sidebar';
	import {
		initializeDefaultShortcuts,
		registerShortcut,
		setKeyboardContext,
		type KeyboardShortcut
	} from '$lib/stores/keyboard';
	import type { TaskWithDetails } from '$lib/types/database';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	// Modal and state management
	let showShortcutsHelp = false;
	let showCompletionModal = false;
	let showAnalytics = false;
	let showReports = false;
	let showDeleteConfirmation = false;
	let taskToComplete: TaskWithDetails | null = null;
	let taskToDelete: TaskWithDetails | null = null;

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
	function handleTaskDelete(event: CustomEvent<{ task: TaskWithDetails }>) {
		taskToDelete = event.detail.task;
		showDeleteConfirmation = true;
		setKeyboardContext('modal');
	}

	// Keyboard shortcut handlers
	function handleNewTask() {
		// No active project concept - tasks are created within specific project routes
		console.log('Create new task - navigate to a project first');
	}


	function handleEscape() {
		if (showShortcutsHelp) {
			showShortcutsHelp = false;
		} else if (showCompletionModal) {
			showCompletionModal = false;
			taskToComplete = null;
			setKeyboardContext(null);
		} else if (showDeleteConfirmation) {
			showDeleteConfirmation = false;
			taskToDelete = null;
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

	// Handle delete confirmation
	async function handleDeleteConfirm() {
		if (!taskToDelete) return;

		try {
			const response = await fetch(`/api/tasks/${taskToDelete.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to delete task');
			}

			toasts.success('Task Deleted', `"${taskToDelete.title}" has been deleted successfully.`);
			
			// Dispatch event to refresh data
			if (browser) {
				const refreshEvent = new CustomEvent('task-deleted', { detail: { taskId: taskToDelete.id } });
				document.dispatchEvent(refreshEvent);
			}
		} catch (error) {
			console.error('Error deleting task:', error);
			toasts.error('Delete Failed', 'Unable to delete the task. Please try again.');
		} finally {
			showDeleteConfirmation = false;
			taskToDelete = null;
			setKeyboardContext(null);
		}
	}

	// Handle delete confirmation cancel
	function handleDeleteCancel() {
		showDeleteConfirmation = false;
		taskToDelete = null;
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
		// No active project to edit on dashboard
		console.log('Project editing is available on individual project pages');
	}


	// Initialize keyboard shortcuts
	onMount(() => {
		initializeDefaultShortcuts();

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
		if (showCompletionModal) {
			setKeyboardContext('modal');
		} else {
			// Always dashboard context on home page
			setKeyboardContext('dashboard');
		}
	}
</script>

<!-- Home Page Content -->
<div class="home-page">
	<!-- Header with Tools -->
	<header class="page-header">
		<!-- Dashboard Title -->
		<div class="header-title">
			<div class="dashboard-title">
				<span class="dashboard-icon">/</span>
				<span class="dashboard-name">Dashboard</span>
			</div>
		</div>

		<!-- Analytics and Reports -->
		<div class="header-tools">
			<button class="tool-btn transition-colors hover-scale active-press" onclick={handleShowAnalytics} title="Analytics Dashboard">
				<span class="tool-icon">◧</span>
			</button>

			<button class="tool-btn transition-colors hover-scale active-press" onclick={handleShowReports} title="Productivity Reports">
				<span class="tool-icon">▲</span>
			</button>

			<button
				class="tool-btn help-toggle transition-colors hover-scale active-press"
				onclick={handleShowHelp}
				title="Keyboard shortcuts (Press ?)"
			>
				<span class="tool-icon">?</span>
			</button>
		</div>
	</header>

	<!-- Page Content -->
	<div class="page-content">
		<HomePage
			onProjectSelect={() => {
				// Close mobile sidebar when project is selected
				responsiveActions.handleNavigation();
			}}
		/>
	</div>

	<!-- Keyboard Shortcuts Help Modal -->
	<ShortcutsHelp bind:isOpen={showShortcutsHelp} on:close={() => (showShortcutsHelp = false)} />

	<!-- Task Completion Modal -->
	<TaskCompletionModal
		bind:isOpen={showCompletionModal}
		task={taskToComplete}
		on:complete={handleTaskCompleted}
		on:cancel={handleCompletionCancel}
	/>

	<!-- Delete Confirmation Modal -->
	<ConfirmationModal
		bind:isOpen={showDeleteConfirmation}
		title="Delete Task"
		message={taskToDelete ? `Are you sure you want to delete "${taskToDelete.title}"? This action cannot be undone.` : 'Are you sure you want to delete this task?'}
		confirmText="Delete"
		cancelText="Cancel"
		confirmVariant="danger"
		icon="🗑"
		on:confirm={handleDeleteConfirm}
		on:cancel={handleDeleteCancel}
	/>

	<!-- Analytics Dashboard -->
	<AnalyticsDashboard bind:isOpen={showAnalytics} />

	<!-- Reports View -->
	<ReportsView bind:isOpen={showReports} />
</div>

<style>
	.home-page {
		height: 100%;
		display: flex;
		flex-direction: column;
		background: var(--nord0);
	}

	/* Page Header */
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		background: var(--nord0);
		border-bottom: 1px solid var(--nord3);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.header-title {
		display: flex;
		align-items: center;
	}

	.dashboard-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--nord2);
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
	}

	.dashboard-icon {
		font-size: 1rem;
		color: var(--nord9);
	}

	.dashboard-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--nord6);
	}

	.header-tools {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.tool-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		background: transparent;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		border-radius: 0.375rem;
	}

	.tool-btn:hover {
		background: var(--nord2);
	}

	.tool-btn:focus {
		outline: 2px solid var(--focus-ring);
		outline-offset: 2px;
	}

	.tool-icon {
		font-size: 1rem;
		color: var(--nord4);
		filter: grayscale(1);
		transition: filter var(--anim-fast) var(--ease-out);
	}

	.tool-btn:hover .tool-icon {
		filter: none;
		color: var(--nord6);
	}

	/* Page Content */
	.page-content {
		flex: 1;
		overflow-y: auto;
		padding: 0;
	}

	/* Mobile Responsive */
	@media (max-width: 640px) {
		.page-header {
			padding: 0.75rem 1rem;
		}

		.header-tools {
			gap: 0.25rem;
		}

		.tool-btn {
			width: 1.75rem;
			height: 1.75rem;
		}

		.dashboard-title {
			padding: 0.375rem 0.5rem;
		}

		.dashboard-name {
			font-size: 0.8rem;
		}
	}
</style>

