<script lang="ts">
	import type { ProjectWithDetails, TaskWithDetails, QuickLink } from '$lib/types/database';
	import TaskForm from '$lib/features/tasks/task-form.svelte';
	import TaskCompletionModal from '$lib/features/tasks/task-completion-modal.svelte';
	import ProjectEditModal from '$lib/features/projects/modals/project-edit-modal.svelte';
	import ProjectCreateModal from '$lib/features/projects/modals/project-create-modal.svelte';
	import QuickLinkEditModal from '$lib/features/projects/modals/quick-link-edit-modal.svelte';
	import QuickLinks from '$lib/features/projects/quick-links.svelte';
	import AnalyticsDashboard from '$lib/features/analytics/analytics-dashboard.svelte';
	import ReportsView from '$lib/features/analytics/reports-view.svelte';
	import ShortcutsHelp from '$lib/features/keyboard/shortcuts-help.svelte';
	import { setKeyboardContext } from '$lib/stores/keyboard';

	export interface ModalState {
		type:
			| 'none'
			| 'newTask'
			| 'editTask'
			| 'completeTask'
			| 'editProject'
			| 'newSubProject'
			| 'quickLinks'
			| 'editQuickLink'
			| 'analytics'
			| 'reports'
			| 'shortcuts';
		data?: {
			task?: TaskWithDetails;
			link?: QuickLink;
		};
	}

	interface Props {
		modalState: ModalState;
		project: ProjectWithDetails;
		canEdit: boolean;
		isAuthenticated: boolean;
		onClose: (options?: { revertPendingCompletion?: boolean }) => void;
		onTaskCreated: () => void;
		onTaskUpdated: () => void;
		onTaskCompleted: (event: {
			task: TaskWithDetails;
			actualIntensity: number;
			timeSpent?: number;
		}) => void;
		onProjectUpdated: () => void;
		onSubProjectCreated: (event: CustomEvent<{ project: ProjectWithDetails }>) => void;
		onQuickLinkUpdated: () => void;
		onQuickLinkDeleted: () => void;
		onQuickLinkEdit: (event: CustomEvent<{ link: QuickLink }>) => void;
	}

	let {
		modalState,
		project,
		canEdit,
		isAuthenticated,
		onClose,
		onTaskCreated,
		onTaskUpdated,
		onTaskCompleted,
		onProjectUpdated,
		onSubProjectCreated,
		onQuickLinkUpdated,
		onQuickLinkDeleted,
		onQuickLinkEdit
	}: Props = $props();

	// Derived modal open states
	const isNewTaskOpen = $derived(modalState.type === 'newTask');
	const isEditTaskOpen = $derived(modalState.type === 'editTask');
	const isCompleteTaskOpen = $derived(modalState.type === 'completeTask');
	const isEditProjectOpen = $derived(modalState.type === 'editProject');
	const isNewSubProjectOpen = $derived(modalState.type === 'newSubProject');
	const isEditQuickLinkOpen = $derived(modalState.type === 'editQuickLink');
	const isAnalyticsOpen = $derived(modalState.type === 'analytics');
	const isReportsOpen = $derived(modalState.type === 'reports');
	const isShortcutsOpen = $derived(modalState.type === 'shortcuts');

	// Update keyboard context when modal state changes
	$effect(() => {
		if (modalState.type !== 'none') {
			setKeyboardContext('modal');
		} else {
			setKeyboardContext(null);
		}
	});

	function handleTaskCreated(event: CustomEvent) {
		onTaskCreated();
	}

	function handleTaskUpdated(event: CustomEvent) {
		onTaskUpdated();
	}

	function handleTaskCompleted(event: {
		task: TaskWithDetails;
		actualIntensity: number;
		timeSpent?: number;
	}) {
		onTaskCompleted(event);
	}

	function handleProjectUpdated() {
		onProjectUpdated();
	}

	function handleSubProjectCreated(event: CustomEvent<{ project: ProjectWithDetails }>) {
		onSubProjectCreated(event);
	}

	function handleQuickLinkUpdated(event: CustomEvent) {
		onQuickLinkUpdated();
	}

	function handleQuickLinkDeleted(event: CustomEvent) {
		onQuickLinkDeleted();
	}

	function handleQuickLinkEdit(event: CustomEvent<{ link: QuickLink }>) {
		onQuickLinkEdit(event);
	}
</script>

<!-- New Task Modal -->
<TaskForm
	isOpen={isNewTaskOpen}
	onsubmit={handleTaskCreated}
	oncancel={() => onClose()}
	onclose={() => onClose()}
/>

<!-- Edit Task Modal -->
<TaskForm
	isOpen={isEditTaskOpen}
	task={modalState.data?.task}
	onsubmit={handleTaskUpdated}
	oncancel={() => onClose()}
	onclose={() => onClose()}
/>

<!-- Task Completion Modal -->
<TaskCompletionModal
	isOpen={isCompleteTaskOpen}
	task={modalState.data?.task}
	oncomplete={handleTaskCompleted}
	oncancel={() => onClose({ revertPendingCompletion: true })}
/>

<!-- Project Edit Modal -->
<ProjectEditModal
	isOpen={isEditProjectOpen}
	{project}
	onclose={() => onClose()}
	onupdated={handleProjectUpdated}
/>

<!-- Sub-Project Create Modal -->
<ProjectCreateModal
	isOpen={isNewSubProjectOpen}
	defaultParentId={project.id}
	oncreated={handleSubProjectCreated}
	onclose={() => onClose()}
/>

<!-- Quick Links Modal -->
{#if modalState.type === 'quickLinks'}
	<div
		class="modal-backdrop"
		onclick={(e) => e.target === e.currentTarget && onClose()}
		onkeydown={(e) => {
			if (e.key === 'Escape') onClose();
		}}
		role="dialog"
		aria-modal="true"
		aria-labelledby="quicklinks-modal-title"
		tabindex="-1"
	>
		<div class="quicklinks-modal-content">
			<div class="modal-header">
				<h3 id="quicklinks-modal-title" class="modal-title">Quick Links</h3>
				<button class="close-btn" onclick={() => onClose()} title="Close" aria-label="Close dialog">
					✕
				</button>
			</div>
			<div class="quicklinks-wrapper">
				<QuickLinks
					{canEdit}
					{isAuthenticated}
					on:linkEdit={handleQuickLinkEdit}
					on:linkUpdated={handleQuickLinkUpdated}
					on:linkDeleted={handleQuickLinkDeleted}
				/>
			</div>
		</div>
	</div>
{/if}

<!-- Quick Link Edit Modal -->
<QuickLinkEditModal
	isOpen={isEditQuickLinkOpen}
	link={modalState.data?.link}
	onclose={() => onClose()}
	onupdated={handleQuickLinkUpdated}
	ondeleted={handleQuickLinkDeleted}
/>

<!-- Analytics Dashboard -->
<AnalyticsDashboard isOpen={isAnalyticsOpen} />

<!-- Reports View -->
<ReportsView isOpen={isReportsOpen} />

<!-- Keyboard Shortcuts Help -->
<ShortcutsHelp isOpen={isShortcutsOpen} onclose={onClose} />

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.quicklinks-modal-content {
		background: var(--nord0);
		border: 1px solid var(--nord3);
		border-radius: 0.75rem;
		width: 100%;
		max-width: 600px;
		max-height: 80vh;
		overflow: hidden;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid var(--nord3);
		background: var(--nord1);
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0;
	}

	.close-btn {
		width: 2rem;
		height: 2rem;
		border: none;
		background: transparent;
		color: var(--nord4);
		cursor: pointer;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		background: var(--nord2);
		color: var(--nord6);
	}

	.quicklinks-wrapper {
		flex: 1;
		overflow: auto;
		min-height: 0;
	}
</style>
