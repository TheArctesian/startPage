<script lang="ts">
	import { onMount } from 'svelte';
	import type { TaskWithDetails } from '$lib/types/database';
	import { isKanbanView, isGridView, isListView } from '$lib/stores/taskView';
	import { taskFilters } from '$lib/stores/taskFilters';
	import Icon from '$lib/ui/icon.svelte';
	import TaskCard from './task-card/task-card.svelte';
	import TaskGridView from './task-grid-view.svelte';
	import TaskListView from './task-list-view.svelte';
	import TaskViewToolbar from './task-view-toolbar.svelte';
	import MinutesPerDayChart from '$lib/features/analytics/minutes-per-day-chart.svelte';
	import TasksPerDayChart from '$lib/features/analytics/tasks-per-day-chart.svelte';

	export let tasks: TaskWithDetails[] = [];
	export let onEdit: ((task: TaskWithDetails) => void) | undefined = undefined;
	export let onDelete: ((task: TaskWithDetails) => void) | undefined = undefined;
	export let onStatusChange: ((task: TaskWithDetails, status: string) => void) | undefined = undefined;
	export let onNewTask: (() => void) | undefined = undefined;
	export let showViewSelector = true;
	export let canEdit = false;
	export let isAuthenticated = false;

	// Analytics data
	let analyticsData: { days: Array<{ date: string; minutes: number; tasksCompleted: number }> } | null = null;

	async function fetchAnalytics() {
		try {
			const response = await fetch('/api/analytics/daily?days=7');
			if (response.ok) {
				analyticsData = await response.json();
			}
		} catch (error) {
			console.error('Failed to fetch analytics:', error);
		}
	}

	onMount(() => {
		fetchAnalytics();
	});

	function matchesSearch(task: TaskWithDetails, term: string) {
		if (!term) return true;
		const normalised = term.toLowerCase();
		return (
			task.title?.toLowerCase().includes(normalised) ||
			task.description?.toLowerCase().includes(normalised)
		);
	}

	function matchesPriority(task: TaskWithDetails, priorityFilter: string) {
		if (priorityFilter === 'all') return true;
		return task.priority === priorityFilter;
	}

	$: filters = $taskFilters;
	$: baseFilteredTasks = tasks.filter(
		(task) => matchesSearch(task, filters.search) && matchesPriority(task, filters.priority)
	);
	$: statusFilteredTasks =
		filters.status === 'all'
			? baseFilteredTasks
			: baseFilteredTasks.filter((task) => task.status === filters.status);

	// Kanban columns respect search + priority filters; status filter narrows to matching column
	$: todoTasks = baseFilteredTasks.filter(
		(task) => task.status === 'todo' && (filters.status === 'all' || filters.status === 'todo')
	);
	$: inProgressTasks = baseFilteredTasks.filter(
		(task) =>
			task.status === 'in_progress' && (filters.status === 'all' || filters.status === 'in_progress')
	);
	$: doneTasks = baseFilteredTasks.filter(
		(task) => task.status === 'done' && (filters.status === 'all' || filters.status === 'done')
	);

	$: gridAndListTasks = $isKanbanView ? baseFilteredTasks : statusFilteredTasks;

	// Drag and drop state
	let draggedTask: TaskWithDetails | null = null;
	let dragOverColumn: string | null = null;

	// Drag and drop handlers
	function handleDragStart(task: TaskWithDetails) {
		if (!canEdit) return;
		draggedTask = task;
	}

	function handleDragEnd() {
		draggedTask = null;
		dragOverColumn = null;
	}

	function handleDragOver(event: DragEvent, column: string) {
		if (!canEdit || !draggedTask) return;
		event.preventDefault();
		dragOverColumn = column;
	}

	function handleDragLeave() {
		dragOverColumn = null;
	}

	function handleDrop(event: DragEvent, newStatus: 'todo' | 'in_progress' | 'done') {
		if (!canEdit || !draggedTask || !onStatusChange) return;
		event.preventDefault();
		
		if (draggedTask.status !== newStatus) {
			onStatusChange(draggedTask, newStatus);
		}
		
		draggedTask = null;
		dragOverColumn = null;
	}

	// Mobile column navigation
	function scrollToColumn(columnType: 'todo' | 'in_progress' | 'done') {
		const kanbanBoard = document.querySelector('.kanban-board');
		if (!kanbanBoard) return;

		const columns = kanbanBoard.querySelectorAll('.kanban-column');
		
		// Reset all columns to normal width first
		columns.forEach((col, index) => {
			(col as HTMLElement).classList.remove('focused-column');
		});

		// Find and focus the target column
		let targetIndex = -1;
		if (columnType === 'todo') targetIndex = 0;
		else if (columnType === 'in_progress') targetIndex = 1;
		else if (columnType === 'done') targetIndex = 2;

		if (targetIndex >= 0 && columns[targetIndex]) {
			const targetColumn = columns[targetIndex] as HTMLElement;
			
			// Add focused class to expand the column
			targetColumn.classList.add('focused-column');
			
			// Scroll to show the focused column
			targetColumn.scrollIntoView({ 
				behavior: 'smooth', 
				block: 'nearest', 
				inline: 'start' 
			});
		}
	}
</script>

<div class="tasks-view">
	{#if showViewSelector}
		<div class="toolbar-wrapper">
			<TaskViewToolbar {canEdit} {onNewTask} />
		</div>
	{/if}

	<div class="tasks-content">
		{#if $isKanbanView}
			<!-- Mobile Column Navigation -->
			<div class="mobile-column-nav">
				<button 
					class="column-nav-btn"
					onclick={() => scrollToColumn('todo')}
					title="Go to To Do"
				>
					<Icon name="circle-empty" size={16} />
					<span>To Do</span>
					<span class="nav-count">{todoTasks.length}</span>
				</button>
				<button 
					class="column-nav-btn"
					onclick={() => scrollToColumn('in_progress')}
					title="Go to In Progress"
				>
					<Icon name="circle-progress" size={16} />
					<span>In Progress</span>
					<span class="nav-count">{inProgressTasks.length}</span>
				</button>
				<button 
					class="column-nav-btn"
					onclick={() => scrollToColumn('done')}
					title="Go to Done"
				>
					<Icon name="circle-check" size={16} />
					<span>Done</span>
					<span class="nav-count">{doneTasks.length}</span>
				</button>
			</div>
			<div class="kanban-board">
				<div 
					class="kanban-column"
					class:drag-over={dragOverColumn === 'todo'}
					ondragover={(e) => handleDragOver(e, 'todo')}
					ondragleave={handleDragLeave}
					ondrop={(e) => handleDrop(e, 'todo')}
				>
					<div class="column-header">
						<h3>To Do</h3>
						<span class="task-count">{todoTasks.length}</span>
					</div>
					<div class="column-content">
						{#if todoTasks.length === 0}
							<div class="empty-column">
								<span>No tasks match the current filters.</span>
							</div>
						{:else}
							{#each todoTasks as task (task.id)}
								<TaskCard
									{task}
									{onEdit}
									{onDelete}
									{onStatusChange}
									{canEdit}
									{isAuthenticated}
									draggable={canEdit}
									variant="kanban"
									on:dragstart={(e) => handleDragStart(e.detail.task)}
									on:dragend={handleDragEnd}
								/>
							{/each}
						{/if}
					</div>
				</div>

				<div 
					class="kanban-column"
					class:drag-over={dragOverColumn === 'in_progress'}
					ondragover={(e) => handleDragOver(e, 'in_progress')}
					ondragleave={handleDragLeave}
					ondrop={(e) => handleDrop(e, 'in_progress')}
				>
					<div class="column-header">
						<h3>In Progress</h3>
						<span class="task-count">{inProgressTasks.length}</span>
					</div>
					<div class="column-content">
						{#if inProgressTasks.length === 0}
							<div class="empty-column">
								<span>No tasks match the current filters.</span>
							</div>
						{:else}
							{#each inProgressTasks as task (task.id)}
								<TaskCard
									{task}
									{onEdit}
									{onDelete}
									{onStatusChange}
									{canEdit}
									{isAuthenticated}
									draggable={canEdit}
									variant="kanban"
									on:dragstart={(e) => handleDragStart(e.detail.task)}
									on:dragend={handleDragEnd}
								/>
							{/each}
						{/if}
					</div>
				</div>

				<div 
					class="kanban-column"
					class:drag-over={dragOverColumn === 'done'}
					ondragover={(e) => handleDragOver(e, 'done')}
					ondragleave={handleDragLeave}
					ondrop={(e) => handleDrop(e, 'done')}
				>
					<div class="column-header">
						<h3>Done</h3>
						<span class="task-count">{doneTasks.length}</span>
					</div>
					<div class="column-content">
						{#if doneTasks.length === 0}
							<div class="empty-column">
								<span>No tasks match the current filters.</span>
							</div>
						{:else}
							{#each doneTasks as task (task.id)}
								<TaskCard
									{task}
									{onEdit}
									{onDelete}
									{onStatusChange}
									{canEdit}
									{isAuthenticated}
									draggable={canEdit}
									variant="kanban"
									on:dragstart={(e) => handleDragStart(e.detail.task)}
									on:dragend={handleDragEnd}
								/>
							{/each}
						{/if}
					</div>
				</div>
			</div>

			<!-- Analytics Charts -->
			{#if analyticsData && analyticsData.days.length > 0}
				<div class="analytics-section">
					<MinutesPerDayChart days={analyticsData.days} />
					<TasksPerDayChart days={analyticsData.days} />
				</div>
			{/if}
		{:else if $isGridView}
			{#if gridAndListTasks.length === 0}
				<div class="empty-grid">
					<span>No tasks match the current filters.</span>
				</div>
			{:else}
				<TaskGridView
					tasks={gridAndListTasks}
					{onEdit}
					{onDelete}
					{onStatusChange}
					{canEdit}
					{isAuthenticated}
				/>
			{/if}
		{:else if $isListView}
			{#if gridAndListTasks.length === 0}
				<div class="empty-grid">
					<span>No tasks match the current filters.</span>
				</div>
			{:else}
				<TaskListView
					tasks={gridAndListTasks}
					{onEdit}
					{onDelete}
					{onStatusChange}
					{canEdit}
					{isAuthenticated}
				/>

				<!-- Analytics Charts -->
				{#if analyticsData && analyticsData.days.length > 0}
					<div class="analytics-section">
						<MinutesPerDayChart days={analyticsData.days} />
						<TasksPerDayChart days={analyticsData.days} />
					</div>
				{/if}
			{/if}
		{/if}
	</div>
</div>

<style>
	.tasks-view {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		height: 100%;
	}

	.toolbar-wrapper {
		position: sticky;
		top: 0;
		z-index: 5;
	}

	.tasks-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		flex: 1;
		min-height: 0;
	}

	.kanban-board {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.75rem;
		padding: 0.5rem;
	}

	.kanban-column {
		display: flex;
		flex-direction: column;
		background: rgba(46, 52, 64, 0.85);
		border: 1px solid rgba(94, 129, 172, 0.35);
		border-radius: 0.85rem;
		box-shadow: 0 10px 24px rgba(15, 23, 42, 0.25);
		transition: transform 0.2s ease, border-color 0.2s ease;
	}

	.kanban-column.drag-over {
		border-color: var(--nord8);
		transform: translateY(-4px);
		box-shadow: 0 16px 32px rgba(136, 192, 208, 0.2);
	}

	.column-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.1rem;
		background: rgba(67, 76, 94, 0.85);
		border-bottom: 1px solid rgba(76, 86, 106, 0.65);
		border-radius: 0.85rem 0.85rem 0 0;
	}

	.column-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--nord6);
	}

	.task-count {
		background: var(--nord8);
		color: var(--nord0);
		padding: 0.25rem 0.55rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		min-width: 1.5rem;
		text-align: center;
	}

	.column-content {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		padding: 1rem 1.1rem 1.25rem;
		max-height: 60vh;
		overflow-y: auto;
	}

	.empty-column {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 130px;
		border: 1px dashed rgba(94, 129, 172, 0.4);
		border-radius: 0.75rem;
		color: var(--nord4);
		font-size: 0.85rem;
		background: rgba(46, 52, 64, 0.35);
	}

	.empty-grid {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4rem 1rem;
		border-radius: 0.75rem;
		border: 1px dashed rgba(94, 129, 172, 0.35);
		color: var(--nord4);
		background: rgba(46, 52, 64, 0.45);
		font-size: 0.95rem;
		text-align: center;
	}

	.analytics-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1.5rem;
		padding: 0 0.5rem;
	}

	.kanban-column .task-card {
		background: var(--nord0);
		border-radius: 0.75rem;
		padding: 1rem;
		border: 1px solid rgba(136, 192, 208, 0.2);
		box-shadow: 0 12px 24px rgba(15, 23, 42, 0.18);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.kanban-column .task-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 18px 32px rgba(136, 192, 208, 0.22);
	}

	.mobile-column-nav {
		display: none;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: rgba(46, 52, 64, 0.9);
		border: 1px solid rgba(76, 86, 106, 0.45);
		border-radius: 0.75rem;
	}

	.column-nav-btn {
		display: flex !important;
		align-items: center !important;
		gap: 0.45rem !important;
		padding: 0.5rem 0.75rem !important;
		border: 1px solid rgba(94, 129, 172, 0.35) !important;
		background: rgba(46, 52, 64, 0.9) !important;
		border-radius: 0.65rem !important;
		font-size: 0.85rem !important;
		color: var(--nord6) !important;
		cursor: pointer !important;
		transition: background 0.2s ease, border-color 0.2s ease !important;
	}

	.column-nav-btn:hover {
		background: rgba(76, 86, 106, 0.65) !important;
		border-color: rgba(136, 192, 208, 0.4) !important;
	}

	.nav-count {
		background: var(--nord8);
		color: var(--nord0);
		padding: 0.1rem 0.4rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	:global(.column-nav-btn svg) {
		stroke: currentColor !important;
		fill: none !important;
	}

	@media (max-width: 1100px) {
		.kanban-board {
			grid-template-columns: repeat(2, 1fr);
			gap: 1.25rem;
		}
	}

	@media (max-width: 820px) {
		.kanban-board {
			display: flex;
			gap: 1rem;
			overflow-x: auto;
			scroll-snap-type: x mandatory;
			padding: 0.75rem 0.5rem;
		}

		.kanban-column {
			min-width: min(360px, 85vw);
			scroll-snap-align: start;
		}

		.mobile-column-nav {
			display: flex;
		}
	}

	@media (max-width: 640px) {
		.toolbar-wrapper {
			position: static;
		}

		.column-content {
			max-height: none;
		}
	}
</style>
