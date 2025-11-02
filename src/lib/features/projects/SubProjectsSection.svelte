<script lang="ts">
	import type { ProjectWithDetails } from '$lib/types/database';
	import { navigateToProject } from '$lib/utils/navigation';
	import SkeletonLoader from '$lib/ui/loading/skeleton-loader.svelte';

	interface Props {
		subProjects: ProjectWithDetails[];
		loading: boolean;
		canEdit: boolean;
		onAddSubProject: () => void;
	}

	let { subProjects, loading, canEdit, onAddSubProject }: Props = $props();
</script>

<div class="sub-projects-section">
	<h2 class="sub-projects-title">Sub-projects</h2>

	<div class="sub-projects-grid">
		{#if loading}
			{#each Array(3) as _, i (i)}
				<div class="skeleton-project-card">
					<SkeletonLoader variant="card" />
				</div>
			{/each}
		{:else}
			{#each subProjects as subProject (subProject.id)}
				<button
					class="sub-project-card"
					onclick={() => navigateToProject(subProject)}
					title="Navigate to {subProject.name}"
				>
					<div
						class="sub-project-indicator"
						style="background-color: {subProject.color || 'var(--nord8)'}"
					>
						{#if subProject.icon}
							<span class="sub-project-icon">{subProject.icon}</span>
						{:else}
							<div class="sub-project-dot"></div>
						{/if}
					</div>
					<div class="sub-project-content">
						<div class="sub-project-name">{subProject.name}</div>
						{#if subProject.totalTasks && subProject.totalTasks > 0}
							<div class="sub-project-stats">
								{subProject.completedTasks || 0}/{subProject.totalTasks} tasks
							</div>
						{/if}
					</div>
				</button>
			{/each}
		{/if}

		<!-- Add Sub-project Button - shown only when not loading -->
		{#if !loading && canEdit}
			<button class="add-subproject-btn" onclick={onAddSubProject}>
				<div class="add-subproject-indicator">
					<span class="add-subproject-icon">+</span>
				</div>
				<div class="add-subproject-content">
					<div class="add-subproject-name">Add Sub-project</div>
					<div class="add-subproject-description">Create a new sub-project</div>
				</div>
			</button>
		{/if}
	</div>
</div>

<style>
	.sub-projects-section {
		margin-top: 1.5rem;
	}

	.sub-projects-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0 0 1rem;
	}

	.sub-projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
	}

	.skeleton-project-card {
		min-height: 80px;
		border-radius: 0.375rem;
	}

	.sub-project-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--nord2);
		border: 1px solid var(--nord3);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
	}

	.sub-project-card:hover {
		background: var(--nord3);
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.sub-project-card:focus {
		outline: 2px solid var(--nord8);
		outline-offset: -2px;
	}

	.sub-project-indicator {
		width: 2rem;
		height: 2rem;
		border-radius: 0.375rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.sub-project-icon {
		font-size: 1rem;
	}

	.sub-project-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.8);
	}

	.sub-project-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.sub-project-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--nord6);
	}

	.sub-project-stats {
		font-size: 0.75rem;
		color: var(--nord4);
	}

	.add-subproject-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: transparent;
		border: 1px dashed var(--nord3);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		height: auto;
		min-height: 4rem;
		text-align: left;
	}

	.add-subproject-btn:hover {
		border-color: var(--nord8);
		background: rgba(129, 161, 193, 0.05);
		border-style: solid;
	}

	.add-subproject-indicator {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.375rem;
		background: var(--nord3);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.add-subproject-btn:hover .add-subproject-indicator {
		background: var(--nord8);
	}

	.add-subproject-icon {
		font-size: 1.25rem;
		color: var(--nord6);
		font-weight: 300;
	}

	.add-subproject-btn:hover .add-subproject-icon {
		color: white;
	}

	.add-subproject-content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		flex: 1;
	}

	.add-subproject-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--nord4);
		transition: color 0.2s ease;
	}

	.add-subproject-btn:hover .add-subproject-name {
		color: var(--nord8);
	}

	.add-subproject-description {
		font-size: 0.75rem;
		color: var(--nord4);
		opacity: 0.8;
	}

	@media (max-width: 640px) {
		.sub-projects-grid {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}

		.sub-project-card {
			padding: 0.75rem;
		}
	}
</style>
