<script lang="ts">
	import TaskCard from './task-card/task-card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import type { TaskWithDetails } from '$lib/types/database';

	interface Props {
		tasks: TaskWithDetails[];
		onEdit?: (task: TaskWithDetails) => void;
		onDelete?: (task: TaskWithDetails) => void;
		onStatusChange?: (task: TaskWithDetails, status: string) => void;
		canEdit?: boolean;
		isAuthenticated?: boolean;
	}

	let { tasks, onEdit, onDelete, onStatusChange, canEdit = true, isAuthenticated = true }: Props =
		$props();
</script>

<div class="task-list">
	{#if tasks.length === 0}
		<div class="empty-state">
			<Icon name="circle-empty" size={48} color="var(--nord4)" />
			<h3>No tasks found</h3>
			<p>Tasks will appear here once created</p>
		</div>
	{:else}
		<div class="tasks-container">
			{#each tasks as task (task.id)}
				<div class="task-item">
					<TaskCard
						{task}
						{onEdit}
						{onDelete}
						{onStatusChange}
						{canEdit}
						{isAuthenticated}
						variant="compact"
					/>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.task-list {
		display: flex;
		flex-direction: column;
		gap: 0;
		background: var(--nord0);
		border-radius: 0.75rem;
		border: 1px solid var(--nord3);
		padding: 1rem;
		margin: 1rem;
		min-height: 400px;
	}

	.tasks-container {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.task-item {
		transition: transform 0.2s ease;
	}

	.task-item:hover {
		transform: translateX(4px);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		color: var(--nord4);
		flex: 1;
	}

	.empty-state h3 {
		margin: 1rem 0 0.5rem;
		color: var(--nord6);
		font-size: 1.125rem;
		font-weight: 500;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--nord4);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.task-list {
			margin: 0.5rem;
			padding: 0.75rem;
		}

		.tasks-container {
			gap: 0.5rem;
		}
	}
</style>
