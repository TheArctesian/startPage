<!--
  Kanban Column Component
  
  Single responsibility: Manages one column in the kanban board.
  Handles drop zone logic, task display, and column-specific actions.
  Follows UNIX philosophy: focused, reusable component.
-->

<script lang="ts">
	import { fly, scale, fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { quintOut, backOut } from 'svelte/easing';
	import TaskCard from './task-card/task-card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import SkeletonLoader from '$lib/ui/loading/skeleton-loader.svelte';
	import { formatTime } from '$lib/utils/time';
	import type { TaskWithDetails, TaskStatus } from '$lib/types/database';

	// Props
	let {
		status,
		title,
		tasks = [],
		canEdit = false,
		isAuthenticated = false,
		isLoading = false,
		showAddButton = false,
		ontaskselect,
		ontaskedit,
		ontaskcomplete,
		ontaskdelete,
		ontaskdrop,
		ontaskcreate
	} = $props<{
		status: TaskStatus;
		title: string;
		tasks?: TaskWithDetails[];
		canEdit?: boolean;
		isAuthenticated?: boolean;
		isLoading?: boolean;
		showAddButton?: boolean;
		ontaskselect?: (event: { task: TaskWithDetails }) => void;
		ontaskedit?: (event: { task: TaskWithDetails }) => void;
		ontaskcomplete?: (event: { task: TaskWithDetails }) => void;
		ontaskdelete?: (event: { task: TaskWithDetails }) => void;
		ontaskdrop?: (event: { task: TaskWithDetails; newStatus: TaskStatus }) => void;
		ontaskcreate?: (event: { status: TaskStatus }) => void;
	}>();

	// State
	let isDragOver = $state(false);

	// Drag and drop handlers
	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
		
		const taskId = event.dataTransfer?.getData('text/plain');
		if (!taskId) return;

		const task = findTaskById(taskId);
		if (task && task.status !== status) {
			ontaskdrop?.({ task, newStatus: status });
		}
	}

	function handleTaskSelect(task: TaskWithDetails) {
		ontaskselect?.({ task });
	}

	function handleTaskEdit(task: TaskWithDetails) {
		ontaskedit?.({ task });
	}

	function handleTaskDelete(task: TaskWithDetails) {
		ontaskdelete?.({ task });
	}

	function handleTaskMove(detail: { task: TaskWithDetails; newStatus: TaskStatus }) {
		ontaskdrop?.(detail);
		if (detail.newStatus === 'done') {
			ontaskcomplete?.({ task: detail.task });
		}
	}

	function handleTaskCreateClick() {
		ontaskcreate?.({ status });
	}

	function findTaskById(id: string): TaskWithDetails | null {
		// Find task in current column's tasks
		return tasks.find((task: TaskWithDetails) => task.id.toString() === id) || null;
	}

	// Column stats
const totalTime = $derived(
	tasks.reduce((sum: number, task: TaskWithDetails) => {
		const timeSpent = task.actualMinutes ?? 0;
		return sum + timeSpent;
	}, 0)
);

	const taskCount = $derived(tasks.length);

	// Column styling based on status
const columnClass = $derived(
	({
		todo: 'border-nord-blue-500',
		in_progress: 'border-nord-yellow-500',
		done: 'border-nord-green-500',
		archived: 'border-nord-comment'
	} as Record<TaskStatus, string>)[status as TaskStatus] || 'border-nord-comment'
);

const headerClass = $derived(
	({
		todo: 'text-nord-blue-500',
		in_progress: 'text-nord-yellow-500',
		done: 'text-nord-green-500',
		archived: 'text-nord-comment'
	} as Record<TaskStatus, string>)[status as TaskStatus] || 'text-nord-comment'
);

	function getColumnIcon(status: TaskStatus) {
		switch (status) {
			case 'todo':
				return 'circle-empty';
			case 'in_progress':
				return 'circle-progress';
			case 'done':
				return 'circle-check';
			default:
				return 'circle-empty';
		}
	}
</script>

<div 
	class="kanban-column column-{status}"
	class:drag-over={isDragOver}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	role="region"
	aria-label="{title} tasks"
>
	<!-- Column Header -->
	<div class="column-header">
		<div class="column-title-row">
			<div class="column-title-left">
				<span class="column-icon">
					<Icon name={getColumnIcon(status)} size={20} color="var(--nord6)" />
				</span>
				<h3 class="column-name">{title}</h3>
			</div>
			<div class="column-stats-inline">
				<span class="task-count">{taskCount}</span>
				{#if totalTime > 0}
					<span class="time-estimate" title="Total estimated time">
						{formatTime(totalTime)}
					</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Tasks List -->
	<div class="tasks-list" role="list">
		{#if isLoading}
			<!-- Loading state - show skeleton loaders -->
			<div class="loading-tasks" in:fade={{ duration: 200 }}>
				{#each Array(3) as _, i (i)}
					<div class="skeleton-task-card">
						<SkeletonLoader variant="text" count={1} />
						<SkeletonLoader variant="text" count={1} width="40%" />
					</div>
				{/each}
			</div>
		{:else}
			{#each tasks as task, index (task.id)}
				<div
					class="task-item kanban-task-card"
					role="listitem"
					animate:flip={{ duration: 400, easing: quintOut }}
					in:fly={{ x: -30, duration: 300, easing: quintOut }}
					out:fly={{ x: 30, duration: 200, easing: quintOut }}
				>
					<TaskCard
						{task}
						{canEdit}
						{isAuthenticated}
						variant="kanban"
						selectable={true}
						draggable={canEdit}
						showTimer={status !== 'done'}
						onselect={() => handleTaskSelect(task)}
						onedit={() => handleTaskEdit(task)}
						ondelete={() => handleTaskDelete(task)}
						onmove={handleTaskMove}
					/>
				</div>
			{/each}

			<!-- Empty state -->
			{#if tasks.length === 0 && !isLoading}
				<div
					class="empty-column"
					in:scale={{ duration: 300, easing: quintOut, start: 0.8 }}
					out:scale={{ duration: 200, easing: quintOut, start: 0.8 }}
				>
					<div class="empty-icon">
						<Icon name={getColumnIcon(status)} size={48} color="var(--nord3)" />
					</div>
					<p class="empty-text">No tasks in {title.toLowerCase()}</p>
					{#if canEdit && showAddButton}
						<button
							class="btn btn-ghost btn-sm hover-scale active-press transition-all"
							onclick={handleTaskCreateClick}
						>
							Add Task
						</button>
					{/if}
				</div>
			{/if}
		{/if}

		<!-- Add Task Button (for non-empty columns) -->
		{#if canEdit && showAddButton && tasks.length > 0}
			<button
				class="add-task-btn hover-scale active-press transition-all"
				onclick={handleTaskCreateClick}
				title="Add task to {title}"
			>
				+ Add Task
			</button>
		{/if}
	</div>
</div>

<style>
	.kanban-column {
		background: var(--nord1);
		border: 1px solid var(--nord3);
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
		overflow: hidden;
		flex: 1;
	}

	.kanban-column.drag-over {
		border-color: var(--nord8);
		box-shadow: 0 0 0 2px rgba(129, 161, 193, 0.2);
	}

	/* Column-specific styling */
	.column-todo {
		background: linear-gradient(135deg, var(--nord1) 0%, rgba(129, 161, 193, 0.03) 100%);
		border-color: rgba(129, 161, 193, 0.2);
	}

	.column-in_progress {
		background: linear-gradient(135deg, var(--nord1) 0%, rgba(235, 203, 139, 0.03) 100%);
		border-color: rgba(235, 203, 139, 0.2);
	}

	.column-done {
		background: linear-gradient(135deg, var(--nord1) 0%, rgba(163, 190, 140, 0.03) 100%);
		border-color: rgba(163, 190, 140, 0.2);
	}

	.column-header {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.02);
		backdrop-filter: blur(10px);
	}

	.column-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}

	.column-title-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.column-icon {
		font-size: 1.25rem;
		color: var(--nord4);
		font-weight: 400;
	}

	.column-name {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--nord6);
		margin: 0;
		letter-spacing: -0.01em;
	}

	.column-stats-inline {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.task-count {
		background: var(--nord2);
		color: var(--nord6);
		font-size: 0.8125rem;
		font-weight: 700;
		padding: 0.25rem 0.625rem;
		border-radius: 1rem;
		min-width: 1.5rem;
		text-align: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid var(--nord3);
	}

	.time-estimate {
		color: var(--nord8);
		background: rgba(129, 161, 193, 0.1);
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: 0.8125rem;
	}

	.tasks-list {
		flex: 1;
		padding: 1rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.task-item {
		transition: transform 0.2s ease;
		width: 100%;
	}

	.loading-tasks {
		padding: 0.5rem;
	}

	.skeleton-task-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background: var(--nord1);
		border: 1px solid var(--nord3);
		border-radius: var(--radius-lg);
		margin-bottom: 0.75rem;
	}

	.empty-column {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 2rem 1rem;
		color: var(--nord4);
		flex: 1;
	}

	.empty-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
		opacity: 0.5;
	}

	.empty-text {
		font-size: 0.875rem;
		margin: 0 0 1rem;
	}

	.btn {
		padding: 0.375rem 0.75rem;
		border: none;
		border-radius: var(--radius-lg);
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
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

	.add-task-btn {
		padding: 0.75rem;
		border: 2px dashed var(--nord3);
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--nord4);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-top: 0.5rem;
	}

	.add-task-btn:hover {
		border-color: var(--nord8);
		color: var(--nord8);
		background: rgba(129, 161, 193, 0.05);
	}

	/* Accessibility styles */
	.btn:focus,
	.add-task-btn:focus {
		outline: 2px solid var(--nord8);
		outline-offset: 2px;
	}
</style>
