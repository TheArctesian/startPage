<script lang="ts">
	import { onMount } from 'svelte';
	import type { TaskWithDetails } from '$lib/types/database';
	import { isKanbanView, isGridView, isListView } from '$lib/stores/taskView';
	import { taskFilters } from '$lib/stores/taskFilters';
	import TaskBoard from './TaskBoard.svelte';
	import TaskList from './TaskList.svelte';
	import TaskGridView from './task-grid-view.svelte';
	import TaskViewToolbar from './task-view-toolbar.svelte';
	import MinutesPerDayChart from '$lib/features/analytics/minutes-per-day-chart.svelte';
	import TasksPerDayChart from '$lib/features/analytics/tasks-per-day-chart.svelte';

	let {
		tasks = [],
		onEdit = undefined,
		onDelete = undefined,
		onStatusChange = undefined,
		onNewTask = undefined,
		showViewSelector = true,
		canEdit = false,
		isAuthenticated = false
	} = $props<{
		tasks?: TaskWithDetails[];
		onEdit?: ((task: TaskWithDetails) => void) | undefined;
		onDelete?: ((task: TaskWithDetails) => void) | undefined;
		onStatusChange?: ((task: TaskWithDetails, status: string) => void) | undefined;
		onNewTask?: (() => void) | undefined;
		showViewSelector?: boolean;
		canEdit?: boolean;
		isAuthenticated?: boolean;
	}>();

	// Analytics data
	let analyticsData = $state<{ days: Array<{ date: string; minutes: number; tasksCompleted: number }> } | null>(
		null
	);

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

  let filters = $derived($taskFilters);
	let baseFilteredTasks = $derived(tasks.filter(
		(task) => matchesSearch(task, filters.search) && matchesPriority(task, filters.priority)
	));
	let statusFilteredTasks = $derived(
		filters.status === 'all'
			? baseFilteredTasks
			: baseFilteredTasks.filter((task) => task.status === filters.status)
	);

	// For kanban, apply base filters; for grid/list, apply status filters too
  let displayTasks = $derived($isKanbanView ? baseFilteredTasks : statusFilteredTasks);
</script>

<div class="tasks-view">
	{#if showViewSelector}
		<div class="toolbar-wrapper">
			<TaskViewToolbar {canEdit} {onNewTask} />
		</div>
	{/if}

	<div class="tasks-content">
		{#if $isKanbanView}
			<TaskBoard
				tasks={displayTasks}
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
		{:else if $isGridView}
			{#if displayTasks.length === 0}
				<div class="empty-message">
					<span>No tasks match the current filters.</span>
				</div>
			{:else}
				<TaskGridView
					tasks={displayTasks}
					{onEdit}
					{onDelete}
					{onStatusChange}
					{canEdit}
					{isAuthenticated}
				/>
			{/if}
		{:else if $isListView}
			{#if displayTasks.length === 0}
				<div class="empty-message">
					<span>No tasks match the current filters.</span>
				</div>
			{:else}
				<TaskList
					tasks={displayTasks}
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

	.empty-message {
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
		margin: 1rem;
	}

	.analytics-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1.5rem;
		padding: 0 1rem;
	}

	@media (max-width: 640px) {
		.toolbar-wrapper {
			position: static;
		}

		.analytics-section {
			padding: 0 0.5rem;
		}
	}
</style>
