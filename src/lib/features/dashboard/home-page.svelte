<script lang="ts">
	import { onMount } from 'svelte';
	import { projects, projectStats, loadProjects, setSelectedTask } from '$lib/stores';
	import { navigateToProject } from '$lib/utils/navigation';
	import { formatTime, calculateTimeSpent } from '$lib/utils/time';
	import { getPriorityColor } from '$lib/utils/task';
	import ProjectsTable from '$lib/features/projects/projects-table.svelte';
	import ProjectEditModal from '$lib/features/projects/modals/project-edit-modal.svelte';
	import TaskCard from '$lib/features/tasks/task-card/task-card.svelte';
	import { toasts } from '$lib/stores/toasts';
	import MinutesPerDayChart from '$lib/features/analytics/minutes-per-day-chart.svelte';
	import TasksPerDayChart from '$lib/features/analytics/tasks-per-day-chart.svelte';
	import type { ProjectWithDetails, ProjectStatus, TaskWithDetails } from '$lib/types/database';

	let {
		onProjectSelect = () => {},
		user = null,
		isAuthenticated = false,
		canEdit = false,
		isAnonymous = false
	} = $props<{
		onProjectSelect?: (project: ProjectWithDetails) => void;
		user?: any;
		isAuthenticated?: boolean;
		canEdit?: boolean;
		isAnonymous?: boolean;
	}>();

	let isLoadingProjects = $state(false);
	let isLoadingTasks = $state(false);
	let inProgressTasks = $state<TaskWithDetails[]>([]);
	let showProjectEdit = $state(false);
	let projectToEdit = $state<ProjectWithDetails | null>(null);

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		isLoadingProjects = true;
		isLoadingTasks = true;

		try {
			// Load projects with stats
			await loadProjects(true);

			// Load in-progress tasks from all projects
			const response = await fetch('/api/tasks/in-progress?limit=20');
			if (response.ok) {
				inProgressTasks = await response.json();
			}
		} catch (error) {
			console.error('Failed to load homepage data:', error);
		} finally {
			isLoadingProjects = false;
			isLoadingTasks = false;
		}
	}

	async function handleProjectClick(project: ProjectWithDetails) {
		// Navigate to project route instead of setting active project
		await navigateToProject(project);
		onProjectSelect(project);
	}

	async function handleTaskClick(task: TaskWithDetails) {
		// Navigate to the task's project and select the task
		if (task.project) {
			await navigateToProject(task.project);
			setSelectedTask(task);
			onProjectSelect(task.project);
		}
	}

	async function handleStatusChange(
		event: { project: ProjectWithDetails; newStatus: ProjectStatus }
	) {
		const { project, newStatus } = event;

		try {
			const response = await fetch(`/api/projects/${project.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus })
			});

			if (!response.ok) {
				throw new Error('Failed to update project status');
			}

			// Update the project status in the store
			// This will trigger a reactivity update in the ProjectsTable
			await loadProjects(true);
		} catch (error) {
			console.error('Error updating project status:', error);
			toasts.error('Project Update Failed', 'Unable to update project status. Please try again.');
		}
	}

	function handleProjectEdit(event: { project: ProjectWithDetails }) {
		const { project } = event;
		projectToEdit = project;
		showProjectEdit = true;
	}

	function handleProjectEditClose() {
		showProjectEdit = false;
		projectToEdit = null;
	}

	async function handleProjectUpdated() {
		// Reload projects to reflect the changes
		await loadProjects(true);
		showProjectEdit = false;
		projectToEdit = null;
	}

	// Functions now imported from utils
</script>

<div class="homepage">
	<div class="homepage-header">
		<h1 class="homepage-title">Dashboard</h1>
		<p class="homepage-subtitle">peepoo</p>
	</div>

	<div class="homepage-content">
		<!-- Projects Section -->
		<section class="projects-section">
			<div class="section-header">
				<h2 class="section-title">Projects</h2>
				{#if !isLoadingProjects && $projectStats.length > 0}
					<span class="section-count">{$projectStats.length}</span>
				{/if}
			</div>

			<ProjectsTable
				projects={$projectStats}
				isLoading={isLoadingProjects}
				{canEdit}
				{isAuthenticated}
				onstatuschange={handleStatusChange}
				onprojectedit={handleProjectEdit}
			/>
		</section>

		<!-- In-Progress Tasks Section -->
		<section class="tasks-section">
			<div class="section-header">
				<h2 class="section-title">Tasks in Progress</h2>
				{#if !isLoadingTasks && inProgressTasks.length > 0}
					<span class="section-count">{inProgressTasks.length}</span>
				{/if}
			</div>

			{#if isLoadingTasks}
				<div class="loading-state">
					<div class="loading-spinner loading-spinner">◐</div>
					<p>Loading tasks...</p>
				</div>
			{:else if inProgressTasks.length === 0}
				<div class="empty-state">
					<div class="empty-icon">▶</div>
					<h3 class="empty-title">No tasks in progress</h3>
					<p class="empty-description">
						Start working on tasks from your projects to see them here
					</p>
				</div>
			{:else}
				<div class="tasks-grid stagger-children">
					{#each inProgressTasks as task (task.id)}
						<div
							class="task-wrapper hover-lift transition-all"
							role="button"
							tabindex="0"
							onclick={() => handleTaskClick(task)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									handleTaskClick(task);
								}
							}}
						>
							<div class="task-content">
								<div class="task-header">
									<div class="project-info">
										<div
											class="project-color-dot"
											style="background-color: {task.project?.color || 'var(--nord4)'}"
											title="Project: {task.project?.name}"
										></div>
										<span class="project-name">{task.project?.name}</span>
									</div>
									<div
										class="priority-indicator"
										style="color: {getPriorityColor(task.priority)}"
										title="Priority: {task.priority}"
									>
										{task.priority === 'high' ? '!' : task.priority === 'medium' ? '•' : '·'}
									</div>
								</div>

								<div class="task-title">{task.title}</div>

								<div class="task-time-info">
									<span class="time-estimate">Est: {formatTime(task.estimatedMinutes || 0)}</span>
									{#if calculateTimeSpent(task) > 0}
										<span class="time-spent">Spent: {formatTime(calculateTimeSpent(task))}</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Analytics Section -->
		<section class="analytics-section">
			<MinutesPerDayChart />
			<TasksPerDayChart />
		</section>
	</div>

	<!-- Project Edit Modal -->
	<ProjectEditModal
		bind:isOpen={showProjectEdit}
		project={projectToEdit}
		on:close={handleProjectEditClose}
		on:updated={handleProjectUpdated}
	/>
</div>

<style>
	.homepage {
		padding: 1rem 1.5rem;
		max-width: 1400px;
		margin: 0 auto;
		height: 100%;
		overflow-y: auto;
	}

	.homepage-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.homepage-title {
		font-size: 2rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0 0 0.25rem;
	}

	.homepage-subtitle {
		font-size: 1rem;
		color: var(--nord4);
		margin: 0;
	}

	.homepage-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.projects-section {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.tasks-section {
		width: 100%;
	}

	.analytics-section {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.projects-section .section-header {
		align-self: flex-start;
		width: 100%;
		max-width: 1200px;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0;
	}

	.section-count {
		font-size: 0.875rem;
		color: var(--nord4);
		background: var(--nord3);
		padding: 0.25rem 0.5rem;
		border-radius: 1rem;
		min-width: 1.5rem;
		text-align: center;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		gap: 1rem;
		color: var(--nord4);
	}

	.loading-spinner {
		font-size: 2rem;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		text-align: center;
		color: var(--nord4);
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.6;
		filter: grayscale(1);
	}

	.empty-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0 0 0.5rem;
	}

	.empty-description {
		font-size: 1rem;
		color: var(--nord4);
		max-width: 32rem;
		margin: 0;
		line-height: 1.5;
	}

	.tasks-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 0.75rem;
	}

	.task-wrapper {
		background: var(--nord0);
		border: 1px solid var(--nord3);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		overflow: hidden;
		position: relative;
	}

	.task-wrapper:hover {
		border-color: var(--nord8);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.task-wrapper:focus {
		outline: 2px solid var(--nord8);
		outline-offset: 2px;
	}

	.task-content {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.task-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.project-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.project-color-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.project-name {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--nord6);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.task-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--nord5);
		line-height: 1.3;
		margin: 0;
	}

	.task-time-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.75rem;
		margin-top: 0.25rem;
	}

	.time-estimate {
		color: var(--nord8);
		font-weight: 600;
	}

	.time-spent {
		color: var(--nord4);
		font-weight: 500;
	}

	.priority-indicator {
		font-size: 0.875rem;
		font-weight: bold;
		flex-shrink: 0;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.homepage {
			padding: 0.75rem 1rem;
		}

		.homepage-header {
			margin-bottom: 1rem;
		}

		.homepage-title {
			font-size: 1.75rem;
		}

		.homepage-subtitle {
			font-size: 0.875rem;
		}

		.homepage-content {
			gap: 1.5rem;
		}

		.section-header {
			margin-bottom: 0.75rem;
		}

		.tasks-grid {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.task-wrapper {
			margin-bottom: 0;
		}
	}

	/* Large screens - add columns for better layout */
	@media (min-width: 1200px) {
		.homepage-content {
			display: grid;
			grid-template-columns: 2fr 1fr;
			gap: 2rem;
			align-items: start;
		}

		.tasks-grid {
			grid-template-columns: 1fr;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.task-wrapper,
		.loading-spinner {
			transition: none;
			animation: none;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.task-wrapper {
			border-width: 2px;
		}
	}
</style>
