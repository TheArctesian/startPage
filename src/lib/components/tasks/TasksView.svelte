<script lang="ts">
	import type { Task } from '$lib/types/task';
	import { taskViewMode, isKanbanView, isGridView, isListView } from '$lib/stores/taskView';
	import Icon from '../ui/Icon.svelte';
	import TaskCard from './TaskCard.svelte';
	import TaskGridView from './TaskGridView.svelte';
	import TaskListView from './TaskListView.svelte';

	export let tasks: Task[] = [];
	export let onEdit: ((task: Task) => void) | undefined = undefined;
	export let onDelete: ((task: Task) => void) | undefined = undefined;
	export let onStatusChange: ((task: Task, status: string) => void) | undefined = undefined;
	export let onNewTask: (() => void) | undefined = undefined;
	export let showViewSelector = true;
	export let canEdit = false;
	export let isAuthenticated = false;
	
	// Debug: Track when canEdit changes
	$: if (canEdit !== undefined) {
		console.log('TasksView canEdit changed:', canEdit, 'onNewTask:', !!onNewTask);
	}

	// Kanban columns
	$: todoTasks = tasks.filter(task => task.status === 'todo');
	$: inProgressTasks = tasks.filter(task => task.status === 'in_progress');
	$: doneTasks = tasks.filter(task => task.status === 'done');

	// Drag and drop state
	let draggedTask: Task | null = null;
	let dragOverColumn: string | null = null;

	// Drag and drop handlers
	function handleDragStart(task: Task) {
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
		<div class="view-selector">
			<div class="view-options">
				<button
					type="button"
					class="view-option"
					class:active={$isKanbanView}
					onclick={() => taskViewMode.setKanban()}
					title="Kanban view"
				>
					<Icon name="columns" size={16} />
					<span>Kanban</span>
				</button>
				
				<button
					type="button"
					class="view-option"
					class:active={$isGridView}
					onclick={() => taskViewMode.setGrid()}
					title="Grid view"
				>
					<Icon name="grid" size={16} />
					<span>Grid</span>
				</button>
				
				<button
					type="button"
					class="view-option"
					class:active={$isListView}
					onclick={() => taskViewMode.setList()}
					title="List view"
				>
					<Icon name="list" size={16} />
					<span>List</span>
				</button>
				
				{#if canEdit && onNewTask}
					<button
						type="button"
						class="view-option add-task-option"
						onclick={onNewTask}
						title="Add new task"
					>
						<span class="plus-icon">+</span>
						<span>Add Task</span>
					</button>
				{/if}
			</div>
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
					</div>
				</div>
			</div>
		{:else if $isGridView}
			<TaskGridView
				{tasks}
				{onEdit}
				{onDelete}
				{onStatusChange}
				{canEdit}
				{isAuthenticated}
			/>
		{:else if $isListView}
			<TaskListView
				{tasks}
				{onEdit}
				{onDelete}
				{onStatusChange}
				{canEdit}
				{isAuthenticated}
			/>
		{/if}
	</div>
</div>

<style>
	.tasks-view {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.view-selector {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border-bottom: 1px solid var(--nord3);
		background: var(--nord1);
	}

	.view-options {
		display: flex;
		gap: 0.5rem;
		background: var(--nord2);
		border-radius: 8px;
		padding: 4px;
	}

	.view-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border: none;
		background: transparent;
		color: var(--nord4);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.view-option:hover {
		background: var(--nord3);
		color: var(--nord6);
	}

	.view-option.active {
		background: var(--nord0);
		color: var(--nord6);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.view-option span {
		display: inline;
	}

	.add-task-option {
		background: var(--nord8) !important;
		color: white !important;
	}

	.add-task-option:hover {
		background: var(--nord9) !important;
		color: white !important;
	}

	.plus-icon {
		font-size: 16px;
		font-weight: 300;
		line-height: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
	}

	.tasks-content {
		flex: 1;
		overflow: hidden;
	}

	.kanban-board {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		height: 100%;
		padding: 1rem;
		overflow: hidden;
	}

	.kanban-column {
		display: flex;
		flex-direction: column;
		background: var(--nord1);
		border: 1px solid var(--nord3);
		border-radius: 8px;
		overflow: hidden;
		transition: all 0.2s ease;
	}

	.kanban-column.drag-over {
		border-color: var(--nord8);
		background: rgba(136, 192, 208, 0.05);
		transform: scale(1.01);
		box-shadow: 0 4px 12px rgba(136, 192, 208, 0.2);
	}

	.column-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: var(--nord2);
		border-bottom: 1px solid var(--nord3);
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
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		min-width: 1.5rem;
		text-align: center;
	}

	.column-content {
		flex: 1;
		padding: 1rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* Mobile Column Navigation */
	.mobile-column-nav {
		display: none;
		flex-direction: row;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: var(--nord1);
		border-bottom: 1px solid var(--nord3);
		overflow-x: auto;
	}

	.column-nav-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--nord3);
		background: var(--nord0);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		color: var(--nord6);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.column-nav-btn:hover {
		background: var(--nord2);
		border-color: var(--nord4);
	}

	.column-nav-btn:active {
		background: var(--nord3);
		transform: scale(0.98);
	}

	.nav-count {
		background: var(--nord8);
		color: var(--nord0);
		padding: 0.125rem 0.375rem;
		border-radius: 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		min-width: 1.25rem;
		text-align: center;
	}

	/* Responsive design */

	@media (max-width: 768px) {
		.mobile-column-nav {
			display: flex;
		}

		.kanban-board {
			display: flex;
			overflow-x: auto;
			overflow-y: hidden;
		}

		.kanban-column {
			min-width: 320px;
			width: 320px;
			min-height: 300px;
			flex-shrink: 0;
			transition: width 0.3s ease;
		}

		.kanban-column.focused-column {
			width: calc(100vw - 3rem);
			min-width: calc(100vw - 3rem);
		}

		.column-content {
			max-height: 400px;
		}
	}

	@media (max-width: 640px) {
		.mobile-column-nav {
			display: flex;
		}

		.view-selector {
			padding: 0.75rem;
		}

		.view-options {
			gap: 0.25rem;
			padding: 2px;
		}

		.view-option {
			padding: 0.5rem;
		}

		.add-task-option span:not(.plus-icon) {
			display: none;
		}

		.kanban-board {
			display: flex;
			overflow-x: auto;
			overflow-y: hidden;
			padding: 0.75rem;
			gap: 0.75rem;
			scroll-snap-type: x mandatory;
		}

		.kanban-column {
			min-width: calc(100vw - 3rem);
			width: calc(100vw - 3rem);
			transition: width 0.3s ease;
			scroll-snap-align: start;
			flex-shrink: 0;
		}

		.kanban-column.focused-column {
			width: calc(100vw - 3rem);
			min-width: calc(100vw - 3rem);
		}

		.column-header {
			padding: 0.75rem;
		}

		.column-content {
			padding: 0.75rem;
			gap: 0.5rem;
			max-height: 60vh;
			overflow-y: auto;
		}
	}
</style>