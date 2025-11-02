<script lang="ts">
	import { onMount } from 'svelte';
	import { formatTime } from '$lib/utils/time';
	import KanbanColumn from './kanban-column.svelte';
	import KanbanMobileNav from './kanban-mobile-nav.svelte';
	import TaskForm from './task-form.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import { todoTasks, inProgressTasks, doneTasks, updateTask, loadingTasks } from '$lib/stores';
	import type { TaskWithDetails, TaskStatus } from '$lib/types/database';

	// Permission props passed from parent
	let {
		canEdit = false,
		isAuthenticated = false,
		ontaskselect,
		ontaskedit,
		ontaskcomplete,
		ontaskdelete
	} = $props<{
		canEdit?: boolean;
		isAuthenticated?: boolean;
		ontaskselect?: (event: { task: TaskWithDetails }) => void;
		ontaskedit?: (event: { task: TaskWithDetails }) => void;
		ontaskcomplete?: (event: { task: TaskWithDetails }) => void;
		ontaskdelete?: (event: { task: TaskWithDetails }) => void;
	}>();

	// Subscribe to all task stores at top level
	const allTodoTasks = $derived($todoTasks);
	const allInProgressTasks = $derived($inProgressTasks);
	const allDoneTasks = $derived($doneTasks);

	// Mobile and tablet detection
	let isMobile = $state(false);
	let isTablet = $state(false);
	let currentColumnIndex = $state(0);

	onMount(() => {
		const updateBreakpoints = () => {
			const width = window.innerWidth;
			isMobile = width < 768;
			isTablet = width >= 768 && width <= 1024;
		};
		updateBreakpoints();
		const handleResize = () => updateBreakpoints();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	// Column definitions
	const columns = [
		{
			id: 'todo' as TaskStatus,
			title: 'To Do',
			icon: 'circle-empty',
			addButtonText: 'Add Task'
		},
		{
			id: 'in_progress' as TaskStatus,
			title: 'In Progress',
			icon: 'circle-progress',
			addButtonText: 'Start Task'
		},
		{
			id: 'done' as TaskStatus,
			title: 'Done',
			icon: 'circle-check',
			addButtonText: null // No add button for done column
		}
	] as const;

	// Get tasks for column
	function getTasksForColumn(columnId: TaskStatus) {
		switch (columnId) {
			case 'todo':
				return allTodoTasks;
			case 'in_progress':
				return allInProgressTasks;
			case 'done':
				return allDoneTasks;
			default:
				return [];
		}
	}

// Form state
let isFormOpen = $state(false);
let editingTask = $state<TaskWithDetails | null>(null);

	// Task operation handlers
async function handleTaskDrop(detail: { task: TaskWithDetails; newStatus: TaskStatus }) {
	const { task, newStatus } = detail;
		
		if (task.status === newStatus) return;

		try {
			await updateTask(task.id, {
				status: newStatus,
				boardColumn: newStatus
			});
		} catch (error) {
			console.error('Failed to update task status:', error);
		}
	}

function handleTaskCreate(detail: { status: TaskStatus }) {
	editingTask = null;
	isFormOpen = true;
}

function handleTaskSelect(detail: { task: TaskWithDetails }) {
	ontaskselect?.(detail);
}

function handleTaskEdit(detail: { task: TaskWithDetails }) {
	editingTask = detail.task;
	isFormOpen = true;
	ontaskedit?.(detail);
}

function handleTaskComplete(detail: { task: TaskWithDetails }) {
	ontaskcomplete?.(detail);
}

function handleTaskDelete(detail: { task: TaskWithDetails }) {
	ontaskdelete?.(detail);
}

	// Task form handlers
function handleTaskFormSubmit(detail: { task: TaskWithDetails }) {
	isFormOpen = false;
	editingTask = null;
}

function handleTaskFormCancel() {
		isFormOpen = false;
		editingTask = null;
	}

	// Mobile navigation handlers
	function handleMobileNavigate(event: { index: number }) {
		currentColumnIndex = event.index;
	}

	// Calculate column statistics
	function getColumnStats(tasks: TaskWithDetails[]) {
		const totalTasks = tasks.length;
		const totalTime = tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);

		return {
			count: totalTasks,
			time: totalTime,
			timeFormatted: formatTime(totalTime)
		};
	}
</script>

<div class="kanban-board">
	<!-- Board Header Container -->
	<div class="board-header-container">
		<div class="board-header">
			<h2 class="board-title">Task Board</h2>
			{#if canEdit}
				<button
					class="btn btn-primary"
					onclick={() => handleTaskCreate({ status: 'todo' })}
					title="Add new task (Cmd+N)"
				>
					+ New Task
				</button>
			{/if}
		</div>
	</div>

	<!-- Mobile Navigation -->
	{#if isMobile || isTablet}
		<KanbanMobileNav
			currentIndex={currentColumnIndex}
			totalColumns={columns.length}
			columnTitles={columns.map(col => col.title)}
			onnavigate={handleMobileNavigate}
		/>
	{/if}

	<!-- Kanban Wrapper -->
	<div class="kanban-wrapper" class:mobile={isMobile} class:tablet={isTablet}>
		<div
			class="kanban-columns"
			class:mobile-columns={isMobile}
			class:tablet-columns={isTablet}
			style={(isMobile || isTablet)
				? `transform: translateX(-${currentColumnIndex * 33.333}%)`
				: ''}
		>
			{#each columns as column, index}
				{@const columnTasks = getTasksForColumn(column.id)}
				{@const showColumn = !isMobile || index === currentColumnIndex}
				
				{#if showColumn}
					<div class="column-wrapper column-{column.id}">
						<KanbanColumn
							status={column.id}
							title={column.title}
							tasks={columnTasks}
							{canEdit}
							{isAuthenticated}
							isLoading={$loadingTasks}
							showAddButton={column.addButtonText !== null}
							ontaskselect={handleTaskSelect}
							ontaskedit={handleTaskEdit}
							ontaskcomplete={handleTaskComplete}
							ontaskdelete={handleTaskDelete}
							ontaskdrop={handleTaskDrop}
							ontaskcreate={handleTaskCreate}
						/>
					</div>
				{/if}
			{/each}
		</div>
	</div>
</div>

<!-- Task Form Modal -->
<TaskForm
	isOpen={isFormOpen}
	task={editingTask}
	onsubmit={handleTaskFormSubmit}
	oncancel={handleTaskFormCancel}
	onclose={handleTaskFormCancel}
/>

<style>
	.kanban-board {
		display: flex;
		flex-direction: column;
		background: var(--nord0);
		box-sizing: border-box;
		margin: 1rem;
	}

	.board-header-container {
		margin-bottom: 1rem;
	}

	.board-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		background: var(--nord1);
		border: 1px solid var(--nord3);
		border-radius: var(--radius-lg);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		box-sizing: border-box;
	}

	.board-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--nord6);
		letter-spacing: -0.025em;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: var(--radius-lg);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.btn-primary {
		background: var(--nord8);
		color: var(--nord0);
	}

	.btn-primary:hover {
		background: var(--nord9);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(129, 161, 193, 0.3);
	}

	.kanban-wrapper {
		background: var(--nord1);
		border: 1px solid var(--nord3);
		border-radius: var(--radius-lg);
		flex: 1;
		box-sizing: border-box;
		overflow-x: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.kanban-columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		gap: 1.5rem;
		flex: 1;
		width: 100%;
		min-height: 0;
		padding: 1rem;
		box-sizing: border-box;
	}

	.column-wrapper {
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	/* Column-specific grid positioning */
	.column-wrapper.column-todo {
		grid-row: 1 / 3; /* Spans both rows (full height) */
		grid-column: 1;
	}

	.column-wrapper.column-in_progress {
		grid-row: 1;
		grid-column: 2;
	}

	.column-wrapper.column-done {
		grid-row: 2;
		grid-column: 2;
	}

	/* Mobile Styles */
	.kanban-wrapper.mobile {
		overflow: hidden;
		position: relative;
		flex: 1;
		padding: 0;
		max-width: 100%;
	}

	.kanban-columns.mobile-columns {
		display: flex;
		transition: transform 0.3s ease-out;
		width: 300%; /* 3 columns × 100% */
		height: 100%;
		grid-template-columns: none;
		grid-template-rows: none;
	}

	.mobile-columns .column-wrapper {
		width: 33.333%; /* Each column takes 1/3 of total width */
		grid-row: auto !important;
		grid-column: auto !important;
		height: 100%;
		min-height: 0;
	}

	/* Tablet Styles */
	.kanban-wrapper.tablet {
		padding: 0;
		margin: 0;
	}

	.tablet-columns {
		display: flex;
		width: 300%;
		transition: transform 0.3s ease;
	}

	.tablet-columns .column-wrapper {
		width: 33.333%;
		flex-shrink: 0;
		height: auto;
		min-height: auto;
		max-height: none;
		margin: 0;
		padding: 1rem;
		box-sizing: border-box;
	}

	/* Responsive Breakpoints */
	@media (max-width: 767px) {
		.board-header .btn-primary {
			display: none;
		}

		.kanban-board {
			overflow-x: hidden;
			margin: 0;
		}

		.board-header-container {
			margin-left: 0.5rem;
			margin-right: 0.5rem;
		}

		.board-header {
			padding: 1rem;
			flex-direction: column;
			align-items: center;
			gap: 0.5rem;
			text-align: center;
		}

		.kanban-wrapper {
			margin-left: 0.5rem;
			margin-right: 0.5rem;
		}

		.board-title {
			text-align: center;
			font-size: 1.25rem;
		}

		.column-wrapper.column-todo,
		.column-wrapper.column-in_progress,
		.column-wrapper.column-done {
			grid-row: auto !important;
			grid-column: auto !important;
		}
	}

	/* Tablet Responsive */
	@media (min-width: 768px) and (max-width: 1024px) {
		.board-header {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.board-title {
			text-align: center;
		}
	}

	/* Accessibility and print styles */
	.btn:focus {
		outline: 2px solid var(--nord8);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.btn {
			transition: none;
		}
	}

	@media print {
		.board-header {
			page-break-after: avoid;
		}

		.kanban-columns {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.btn {
			display: none;
		}
	}
</style>
