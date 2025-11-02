<!--
  Project Breakdown Component

  Displays top projects with task count and time spent bars.
  UNIX philosophy: single responsibility.
-->

<script lang="ts">
	interface ProjectStat {
		name: string;
		tasks: number;
		time: number; // in hours
	}

	interface Props {
		projects: ProjectStat[];
	}

	let { projects }: Props = $props();

	let maxTime = $derived(Math.max(...projects.map((p) => p.time), 1));
</script>

{#if projects.length > 0}
	<div class="report-section">
		<h4 class="section-title">📊 Project Breakdown</h4>
		<div class="project-list">
			{#each projects as project}
				<div class="project-item">
					<div class="project-info">
						<div class="project-name">{project.name}</div>
						<div class="project-stats">
							{project.tasks} tasks • {project.time}h
						</div>
					</div>
					<div class="project-bar">
						<div class="project-fill" style:width="{(project.time / maxTime) * 100}%"></div>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.report-section {
		background: var(--bg-elevated);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		border: 1px solid var(--border-default);
	}

	.section-title {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
		margin: 0 0 var(--space-lg) 0;
	}

	.project-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.project-item {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.project-info {
		flex: 1;
		min-width: 0;
	}

	.project-name {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.project-stats {
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
	}

	.project-bar {
		width: 100px;
		height: 8px;
		background: var(--bg-secondary);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.project-fill {
		height: 100%;
		background: var(--color-primary);
		border-radius: var(--radius-full);
		transition: width var(--transition-normal);
	}

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.project-item {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-sm);
		}

		.project-bar {
			width: 100%;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.project-fill {
			transition: none;
		}
	}
</style>
