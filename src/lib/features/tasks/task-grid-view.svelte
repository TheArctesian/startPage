<script lang="ts">
	import type { TaskWithDetails } from '$lib/types/database';
	import TaskCard from './task-card/task-card.svelte';

	interface Props {
		tasks?: TaskWithDetails[];
		onEdit?: ((task: TaskWithDetails) => void) | undefined;
		onDelete?: ((task: TaskWithDetails) => void) | undefined;
		onStatusChange?: ((task: TaskWithDetails, status: string) => void) | undefined;
		canEdit?: boolean;
		isAuthenticated?: boolean;
	}

	let {
		tasks = [],
		onEdit = undefined,
		onDelete = undefined,
		onStatusChange = undefined,
		canEdit = false,
		isAuthenticated = false
	}: Props = $props();

	// Drag and drop state
	let dragOverSection = $state<string | null>(null);

	function handleDragOver(event: DragEvent, section: string) {
		if (!canEdit) return;
		event.preventDefault();
		dragOverSection = section;
	}

	function handleDragLeave() {
		dragOverSection = null;
	}

	function handleDrop(event: DragEvent, newStatus: 'todo' | 'in_progress' | 'done') {
		if (!canEdit) return;
		event.preventDefault();
		dragOverSection = null;
		
		// Extract task ID from drag data
		const taskId = event.dataTransfer?.getData('text/plain');
		if (taskId && onStatusChange) {
			const task = tasks.find(t => t.id === parseInt(taskId));
			if (task && task.status !== newStatus) {
				onStatusChange(task, newStatus);
			}
		}
	}

	// Group tasks by status
	let todoTasks = $derived(tasks.filter(task => task.status === 'todo'));
	let inProgressTasks = $derived(tasks.filter(task => task.status === 'in_progress'));
	let doneTasks = $derived(tasks.filter(task => task.status === 'done'));
</script>

<div class="grid-container">
	<!-- Todo Section -->
	{#if todoTasks.length > 0}
		<div
			class="status-section"
			class:drag-over={dragOverSection === 'todo'}
			ondragover={(e) => handleDragOver(e, 'todo')}
			ondragleave={handleDragLeave}
			ondrop={(e) => handleDrop(e, 'todo')}
			role="region"
			aria-label="To Do tasks section"
		>
			<h3 class="status-header">
				<span class="status-title">To Do</span>
				<span class="task-count">{todoTasks.length}</span>
			</h3>
			<div class="task-grid">
				{#each todoTasks as task (task.id)}
					<TaskCard
						{task}
						{onEdit}
						{onDelete}
						{onStatusChange}
						{canEdit}
						{isAuthenticated}
						draggable={canEdit}
						variant="detailed"
					/>
				{/each}
			</div>
		</div>
	{/if}

	<!-- In Progress Section -->
	{#if inProgressTasks.length > 0}
		<div
			class="status-section"
			class:drag-over={dragOverSection === 'in_progress'}
			ondragover={(e) => handleDragOver(e, 'in_progress')}
			ondragleave={handleDragLeave}
			ondrop={(e) => handleDrop(e, 'in_progress')}
			role="region"
			aria-label="In Progress tasks section"
		>
			<h3 class="status-header">
				<span class="status-title">In Progress</span>
				<span class="task-count">{inProgressTasks.length}</span>
			</h3>
			<div class="task-grid">
				{#each inProgressTasks as task (task.id)}
					<TaskCard
						{task}
						{onEdit}
						{onDelete}
						{onStatusChange}
						{canEdit}
						{isAuthenticated}
						draggable={canEdit}
						variant="detailed"
					/>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Done Section -->
	{#if doneTasks.length > 0}
		<div
			class="status-section"
			class:drag-over={dragOverSection === 'done'}
			ondragover={(e) => handleDragOver(e, 'done')}
			ondragleave={handleDragLeave}
			ondrop={(e) => handleDrop(e, 'done')}
			role="region"
			aria-label="Done tasks section"
		>
			<h3 class="status-header">
				<span class="status-title">Done</span>
				<span class="task-count">{doneTasks.length}</span>
			</h3>
			<div class="task-grid">
				{#each doneTasks as task (task.id)}
					<TaskCard
						{task}
						{onEdit}
						{onDelete}
						{onStatusChange}
						{canEdit}
						{isAuthenticated}
						draggable={canEdit}
						variant="detailed"
					/>
				{/each}
			</div>
		</div>
	{/if}
	
	{#if tasks.length === 0}
		<div class="empty-state">
			<p>No tasks found</p>
		</div>
	{/if}
</div>

<style>
	.grid-container {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		overflow-y: auto;
	}

	.status-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		transition: all 0.2s ease;
		border-radius: 8px;
		padding: 0.5rem;
		margin: -0.5rem;
	}

	.status-section.drag-over {
		background: rgba(136, 192, 208, 0.05);
		border: 2px dashed var(--nord8);
		transform: scale(1.01);
	}

	.status-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 0;
		padding: 0.75rem 1rem;
		background: var(--nord2);
		border: 1px solid var(--nord3);
		border-radius: 8px;
	}

	.status-title {
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

	.task-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1rem;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		color: var(--nord4);
		font-style: italic;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.grid-container {
			padding: 0.75rem;
			gap: 1.5rem;
		}

		.task-grid {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}

		.status-header {
			padding: 0.5rem 0.75rem;
		}
	}

	@media (min-width: 1400px) {
		.task-grid {
			grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
			gap: 1.25rem;
		}
	}
</style>
