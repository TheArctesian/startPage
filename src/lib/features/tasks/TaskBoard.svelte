<script lang="ts">
	import TaskCard from './task-card/task-card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import type { TaskWithDetails, TaskStatus } from '$lib/types/database';

	interface Props {
		tasks: TaskWithDetails[];
		onEdit?: (task: TaskWithDetails) => void;
		onDelete?: (task: TaskWithDetails) => void;
		onStatusChange?: (task: TaskWithDetails, status: string) => void;
		canEdit?: boolean;
		isAuthenticated?: boolean;
	}

	let { tasks, onEdit, onDelete, onStatusChange, canEdit = true, isAuthenticated = true }: Props = $props();

	// Drag and drop state
	let draggedTask = $state<TaskWithDetails | null>(null);
	let dragOverColumn = $state<string | null>(null);

	// Column definitions
	const columns = [
		{ status: 'todo' as const, label: 'To Do', icon: 'circle-empty' },
		{ status: 'in_progress' as const, label: 'In Progress', icon: 'circle-progress' },
		{ status: 'done' as const, label: 'Done', icon: 'circle-check' }
	];

	// Filter tasks by status
	function getTasksForColumn(status: TaskStatus) {
		return tasks.filter((t) => t.status === status);
	}

	// Drag and drop handlers
	function handleDragStart(task: TaskWithDetails) {
		if (!canEdit) return;
		draggedTask = task;
	}

	function handleDragEnd() {
		draggedTask = null;
		dragOverColumn = null;
	}

	function handleDragOver(e: DragEvent, columnStatus: string) {
		if (!canEdit || !draggedTask) return;
		e.preventDefault();
		dragOverColumn = columnStatus;
	}

	function handleDragLeave() {
		dragOverColumn = null;
	}

	async function handleDrop(e: DragEvent, newStatus: TaskStatus) {
		if (!canEdit || !draggedTask || !onStatusChange) return;
		e.preventDefault();

		if (draggedTask.status !== newStatus) {
			onStatusChange(draggedTask, newStatus);
		}

		draggedTask = null;
		dragOverColumn = null;
	}

	// Derived task counts (not used in template, just showing they're available)
	// Could be used for debugging or additional features
</script>

<div class="task-board">
	{#each columns as column}
		<div
			class="board-column"
			class:drag-over={dragOverColumn === column.status}
			ondragover={(e) => handleDragOver(e, column.status)}
			ondragleave={handleDragLeave}
			ondrop={(e) => handleDrop(e, column.status)}
			role="region"
			aria-label="{column.label} column"
		>
			<div class="column-header">
				<div class="column-title">
					<Icon name={column.icon} size={16} />
					<h3>{column.label}</h3>
				</div>
				<span class="task-count">
					{getTasksForColumn(column.status).length}
				</span>
			</div>

			<div class="column-content">
				{#if getTasksForColumn(column.status).length === 0}
					<div class="empty-column">
						<span>No tasks</span>
					</div>
				{:else}
					{#each getTasksForColumn(column.status) as task (task.id)}
						<div
							draggable={canEdit}
							ondragstart={() => handleDragStart(task)}
							ondragend={handleDragEnd}
							class="task-card-wrapper"
							role="button"
							tabindex="0"
							aria-label="Drag to move task"
						>
							<TaskCard
								{task}
								{onEdit}
								{onDelete}
								{onStatusChange}
								{canEdit}
								{isAuthenticated}
								variant="kanban"
							/>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	.task-board {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		padding: 1rem;
		height: 100%;
	}

	.board-column {
		display: flex;
		flex-direction: column;
		background: rgba(46, 52, 64, 0.85);
		border: 1px solid rgba(94, 129, 172, 0.35);
		border-radius: 0.75rem;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
		transition:
			transform 0.2s ease,
			border-color 0.2s ease;
		overflow: hidden;
	}

	.board-column.drag-over {
		border-color: var(--nord8);
		transform: translateY(-4px);
		box-shadow: 0 12px 28px rgba(136, 192, 208, 0.3);
	}

	.column-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		background: rgba(67, 76, 94, 0.85);
		border-bottom: 1px solid rgba(76, 86, 106, 0.65);
	}

	.column-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.column-title h3 {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--nord6);
	}

	.task-count {
		background: var(--nord8);
		color: var(--nord0);
		padding: 0.25rem 0.5rem;
		border-radius: 999px;
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
		max-height: calc(100vh - 16rem);
	}

	.task-card-wrapper {
		cursor: grab;
		transition: transform 0.2s ease;
	}

	.task-card-wrapper:active {
		cursor: grabbing;
	}

	.empty-column {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 120px;
		border: 1px dashed rgba(94, 129, 172, 0.4);
		border-radius: 0.5rem;
		color: var(--nord4);
		font-size: 0.875rem;
		background: rgba(46, 52, 64, 0.35);
	}

	/* Responsive breakpoints */
	@media (max-width: 1024px) {
		.task-board {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 768px) {
		.task-board {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.column-content {
			max-height: 50vh;
		}
	}
</style>
