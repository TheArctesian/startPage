<script lang="ts">
	import { onMount } from 'svelte';
	import { projects, projectStats, loadProjects } from '$lib/stores';
	import { setSelectedTask } from '$lib/stores/actions';
	import { navigateToProject } from '$lib/utils/navigation';
	import { formatTime, calculateTimeSpent } from '$lib/utils/time';
	import { getPriorityColor } from '$lib/utils/task';
	import ProjectsTable from '$lib/components/projects/ProjectsTable.svelte';
	import ProjectEditModal from '$lib/components/projects/ProjectEditModal.svelte';
	import TaskCard from '$lib/components/tasks/TaskCard.svelte';
	import ActiveTimersSection from '$lib/components/timer/ActiveTimersSection.svelte';
	import { toasts } from '$lib/stores/toasts';
	import type { ProjectWithDetails, ProjectStatus, TaskWithDetails } from '$lib/types/database';

	export let onProjectSelect: (project: ProjectWithDetails) => void = () => {};
	export let user: any = null;
	export let isAuthenticated: boolean = false;
	export let canEdit: boolean = false;
	export let isAnonymous: boolean = false;

	let isLoadingProjects = false;
	let isLoadingTasks = false;
	let inProgressTasks: TaskWithDetails[] = [];
	let showProjectEdit = false;
	let projectToEdit: ProjectWithDetails | null = null;

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
		event: CustomEvent<{ project: ProjectWithDetails; newStatus: ProjectStatus }>
	) {
		const { project, newStatus } = event.detail;

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

	function handleProjectEdit(event: CustomEvent<{ project: ProjectWithDetails }>) {
		const { project } = event.detail;
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
				on:statusChange={handleStatusChange}
				on:projectEdit={handleProjectEdit}
			/>
		</section>

		<!-- Active Timers Section -->
		<ActiveTimersSection />

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
							<div class="task-project-indicator">
								<div
									class="project-color-dot"
									style="background-color: {task.project?.color || 'var(--nord4)'}"
									title="Project: {task.project?.name}"
								></div>
								<span class="project-name">{task.project?.name}</span>
							</div>

							<TaskCard
								{task}
								variant="compact"
								selectable={false}
								showTimer={false}
								showProject={false}
								draggable={false}
								{canEdit}
								{isAuthenticated}
							/>

							<div class="task-meta">
								<div class="task-time-info">
									<span class="time-estimate">Est: {formatTime(task.estimatedMinutes || 0)}</span>
									{#if calculateTimeSpent(task) > 0}
										<span class="time-spent">Spent: {formatTime(calculateTimeSpent(task))}</span>
									{/if}
								</div>

								<div
									class="priority-indicator"
									style="color: {getPriorityColor(task.priority)}"
									title="Priority: {task.priority}"
								>
									{task.priority === 'high' ? '!' : task.priority === 'medium' ? '•' : '·'}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
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
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
		height: 100%;
		overflow-y: auto;
	}

	.homepage-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.homepage-title {
		font-size: 2.5rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0 0 0.5rem;
	}

	.homepage-subtitle {
		font-size: 1.125rem;
		color: var(--nord4);
		margin: 0;
	}

	.homepage-content {
		display: flex;
		flex-direction: column;
		gap: 3rem;
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

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
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
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1rem;
	}

	.task-wrapper {
		background: var(--nord0);
		border: 1px solid var(--nord3);
		border-radius: 0.75rem;
		padding: 0;
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

	.task-project-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem 0.5rem;
		background: var(--nord1);
		border-bottom: 1px solid var(--nord3);
	}

	.project-color-dot {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.project-name {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--nord4);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.task-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem 0.75rem;
		background: var(--nord1);
		border-top: 1px solid var(--nord3);
	}

	.task-time-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.75rem;
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
		font-size: 1rem;
		font-weight: bold;
		flex-shrink: 0;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.homepage {
			padding: 1rem;
		}

		.homepage-title {
			font-size: 2rem;
		}

		.homepage-subtitle {
			font-size: 1rem;
		}

		.tasks-grid {
			grid-template-columns: 1fr;
		}

		.task-wrapper {
			margin-bottom: 0.5rem;
		}
	}

	/* Large screens - add columns for better layout */
	@media (min-width: 1200px) {
		.homepage-content {
			display: grid;
			grid-template-columns: 2fr 1fr;
			gap: 3rem;
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

