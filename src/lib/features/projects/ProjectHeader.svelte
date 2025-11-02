<script lang="ts">
	import type { ProjectWithDetails } from '$lib/types/database';

	interface Props {
		project: ProjectWithDetails;
		breadcrumb?: string;
		canEdit: boolean;
		onEdit: () => void;
	}

	let { project, breadcrumb, canEdit, onEdit }: Props = $props();
</script>

<div class="project-header">
	<div class="project-title-row">
		<h1 class="project-title">
			<div
				class="project-indicator"
				style="background-color: {project.color || 'var(--nord8)'}"
			>
				<div class="project-dot"></div>
			</div>
			{breadcrumb || project.name}
		</h1>
		{#if canEdit}
			<button
				class="project-edit-btn"
				onclick={onEdit}
				title="Edit project"
				aria-label="Edit project"
			>
				✎
			</button>
		{/if}
	</div>

	{#if project.description}
		<div class="project-description">
			<p>{project.description}</p>
		</div>
	{/if}
</div>

<style>
	.project-header {
		background: var(--nord1);
		border-radius: var(--radius-lg);
		border: 1px solid var(--nord3);
		padding: 1.5rem;
		margin: 1rem;
		margin-bottom: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.project-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.project-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0;
	}

	.project-edit-btn {
		width: 2rem;
		height: 2rem;
		border: none;
		background: transparent;
		color: var(--nord4);
		cursor: pointer;
		border-radius: 0.375rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	.project-edit-btn:hover {
		background: var(--nord3);
		color: var(--nord6);
	}

	.project-edit-btn:focus {
		outline: 2px solid var(--nord8);
		outline-offset: 1px;
	}

	.project-indicator {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.project-dot {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.8);
	}

	.project-description {
		margin-top: 0.75rem;
	}

	.project-description p {
		font-size: 0.95rem;
		color: var(--nord4);
		margin: 0;
		line-height: 1.5;
	}

	@media (max-width: 640px) {
		.project-header {
			margin: 1rem;
			padding: 1rem;
		}

		.project-title {
			font-size: 1.5rem;
			gap: 0.5rem;
		}

		.project-indicator {
			width: 2rem;
			height: 2rem;
		}

		.project-edit-btn {
			width: 1.75rem;
			height: 1.75rem;
			font-size: 0.75rem;
		}
	}
</style>
