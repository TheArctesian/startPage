<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fly, scale, fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { quintOut, backOut } from 'svelte/easing';
	import TaskCard from './TaskCard.svelte';
	import TaskForm from './TaskForm.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import LoadingSpinner from '$lib/components/base/LoadingSpinner.svelte';
	import SkeletonLoader from '$lib/components/base/SkeletonLoader.svelte';
	import { todoTasks, inProgressTasks, doneTasks, updateTask, loadingTasks } from '$lib/stores';
	import type { TaskWithDetails, TaskStatus } from '$lib/types/database';

	// Permission props passed from parent
	export let canEdit = false;
	export let isAuthenticated = false;

	const dispatch = createEventDispatcher<{
		taskSelect: { task: TaskWithDetails };
		taskEdit: { task: TaskWithDetails };
		taskComplete: { task: TaskWithDetails };
		taskDelete: { task: TaskWithDetails };
	}>();

	// Subscribe to all task stores at top level
	$: allTodoTasks = $todoTasks;
	$: allInProgressTasks = $inProgressTasks;
	$: allDoneTasks = $doneTasks;

	// Debug logging (remove after fixing)
	$: {
		console.log('📋 KanbanBoard - Todo tasks:', allTodoTasks.length);
		console.log('📋 KanbanBoard - In Progress tasks:', allInProgressTasks.length);
		console.log('📋 KanbanBoard - Done tasks:', allDoneTasks.length);
		if (allTodoTasks.length > 0) {
			console.log('📋 Sample todo task:', allTodoTasks[0]);
		}
	}

	// Mobile detection and swipe state
	let isMobile = false;
	let currentColumnIndex = 0;
	let touchStartX = 0;
	let touchEndX = 0;
	let isSwiping = false;
	let swipeOffset = 0;

	onMount(() => {
		isMobile = window.innerWidth < 768;
		const handleResize = () => {
			isMobile = window.innerWidth < 768;
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	// Column definitions
	const columns = [
		{
			id: 'todo' as TaskStatus,
			title: 'To Do',
			icon: 'circle-empty',
			addButtonText: 'Add Task'
		},
		{
			id: 'in_progress' as TaskStatus,
			title: 'In Progress',
			icon: 'circle-progress',
			addButtonText: 'Start Task'
		},
		{
			id: 'done' as TaskStatus,
			title: 'Done',
			icon: 'circle-check',
			addButtonText: null // No add button for done column
		}
	] as const;

	// Get tasks for column
	function getTasksForColumn(columnId: TaskStatus) {
		switch (columnId) {
			case 'todo':
				return allTodoTasks;
			case 'in_progress':
				return allInProgressTasks;
			case 'done':
				return allDoneTasks;
			default:
				return [];
		}
	}

	// Drag and drop state
	let draggedTask: TaskWithDetails | null = null;
	let draggedOverColumn: TaskStatus | null = null;
	let draggedOverIndex: number = -1;

	// Form state
	let isFormOpen = false;
	let editingTask: TaskWithDetails | null = null;

	// Handle task drag start
	function handleDragStart(task: TaskWithDetails, event: DragEvent) {
		draggedTask = task;
		event.dataTransfer?.setData('text/plain', task.id.toString());
		event.dataTransfer!.effectAllowed = 'move';
	}

	// Handle task drag end
	function handleDragEnd() {
		draggedTask = null;
		draggedOverColumn = null;
		draggedOverIndex = -1;
	}

	// Handle column drag over
	function handleColumnDragOver(event: DragEvent, columnId: TaskStatus) {
		event.preventDefault();
		event.dataTransfer!.dropEffect = 'move';
		draggedOverColumn = columnId;
	}

	// Handle column drop
	async function handleColumnDrop(event: DragEvent, targetStatus: TaskStatus) {
		event.preventDefault();

		if (!draggedTask) return;

		// Don't update if dropping in same column
		if (draggedTask.status === targetStatus) {
			handleDragEnd();
			return;
		}

		try {
			await updateTask(draggedTask.id, {
				status: targetStatus,
				boardColumn: targetStatus
			});
		} catch (error) {
			console.error('Failed to update task status:', error);
		}

		handleDragEnd();
	}

	// Handle task card drop for reordering
	function handleTaskDrop(event: DragEvent, targetTask: TaskWithDetails, targetIndex: number) {
		event.preventDefault();
		event.stopPropagation();

		if (!draggedTask || draggedTask.id === targetTask.id) {
			handleDragEnd();
			return;
		}

		// Handle status change and position reordering
		// For now, just update status - position ordering can be added later
		if (draggedTask.status !== targetTask.status) {
			updateTask(draggedTask.id, {
				status: targetTask.status,
				boardColumn: targetTask.status
			});
		}

		handleDragEnd();
	}

	// Open form for new task
	function openNewTaskForm(status: TaskStatus = 'todo') {
		editingTask = null;
		isFormOpen = true;
	}

	// Open form for editing task
	function openEditTaskForm(task: TaskWithDetails) {
		editingTask = task;
		isFormOpen = true;
		dispatch('taskEdit', { task });
	}

	// Handle task form submit
	function handleTaskFormSubmit(event: CustomEvent<{ task: TaskWithDetails }>) {
		isFormOpen = false;
		editingTask = null;
	}

	// Handle task form cancel
	function handleTaskFormCancel() {
		isFormOpen = false;
		editingTask = null;
	}

	// Handle task selection
	function handleTaskSelect(task: TaskWithDetails) {
		dispatch('taskSelect', { task });
	}

	// Handle task completion
	function handleTaskComplete(task: TaskWithDetails) {
		dispatch('taskComplete', { task });
	}

	// Handle task deletion
	function handleTaskDelete(task: TaskWithDetails) {
		dispatch('taskDelete', { task });
	}

	// Format time display for better UX
	function formatTime(minutes: number): string {
		if (minutes < 60) {
			return `${minutes}m`;
		}
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}

	// Calculate column statistics
	function getColumnStats(tasks: TaskWithDetails[]) {
		const totalTasks = tasks.length;
		const totalTime = tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);

		return {
			count: totalTasks,
			time: totalTime,
			timeFormatted: formatTime(totalTime)
		};
	}

	// Mobile swipe handlers
	function handleTouchStart(e: TouchEvent) {
		if (!isMobile || typeof window === 'undefined') return;
		touchStartX = e.touches[0].clientX;
		isSwiping = true;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isMobile || !isSwiping || typeof window === 'undefined') return;
		const currentX = e.touches[0].clientX;
		swipeOffset = currentX - touchStartX;

		// Add resistance at edges
		if (
			(currentColumnIndex === 0 && swipeOffset > 0) ||
			(currentColumnIndex === columns.length - 1 && swipeOffset < 0)
		) {
			swipeOffset *= 0.3;
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (!isMobile || !isSwiping || typeof window === 'undefined') return;

		touchEndX = e.changedTouches[0].clientX;
		const swipeDistance = touchEndX - touchStartX;
		const threshold = 50; // minimum swipe distance

		if (Math.abs(swipeDistance) > threshold) {
			if (swipeDistance > 0 && currentColumnIndex > 0) {
				currentColumnIndex--;
			} else if (swipeDistance < 0 && currentColumnIndex < columns.length - 1) {
				currentColumnIndex++;
			}
		}

		swipeOffset = 0;
		isSwiping = false;
	}

	function navigateColumn(direction: number) {
		const newIndex = currentColumnIndex + direction;
		if (newIndex >= 0 && newIndex < columns.length) {
			currentColumnIndex = newIndex;
		}
	}

	// Handle task movement from mobile TaskCard
	function handleTaskMove(event: CustomEvent<{ task: TaskWithDetails; newStatus: TaskStatus }>) {
		const { task, newStatus } = event.detail;
		updateTask(task.id, {
			status: newStatus,
			boardColumn: newStatus
		});
	}
</script>

<div class="kanban-board">
	<!-- Board Header Container -->
	<div class="board-header-container">
		<div class="board-header">
			<h2 class="board-title">Task Board</h2>
			{#if canEdit}
				<button
					class="btn btn-primary"
					onclick={() => openNewTaskForm()}
					title="Add new task (Cmd+N)"
				>
					+ New Task
				</button>
			{/if}
		</div>
	</div>

	<!-- Mobile Column Indicators -->
	{#if isMobile}
		<div class="mobile-indicators">
			<div class="mobile-indicators-left">
				{#each columns as column, index}
					{@const columnTasks = getTasksForColumn(column.id)}
					<button
						class="indicator-dot"
						class:active={currentColumnIndex === index}
						onclick={() => (currentColumnIndex = index)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								currentColumnIndex = index;
							}
						}}
						aria-label="{column.title} ({columnTasks.length} tasks)"
						title="{column.title} ({columnTasks.length} tasks)"
					>
						<Icon
							name={column.icon}
							size={16}
							color={currentColumnIndex === index ? 'white' : 'var(--nord4)'}
						/>
						{#if columnTasks.length > 0}
							<span class="indicator-count indicator-count-{column.id}">
								{columnTasks.length}
							</span>
						{/if}
					</button>
				{/each}
			</div>
			{#if canEdit}
				<button
					class="mobile-add-task-btn"
					onclick={() => openNewTaskForm()}
					title="Add new task"
					aria-label="Add new task"
				>
					+
				</button>
			{/if}
		</div>
	{/if}

	<!-- Kanban Wrapper -->
	<div class="kanban-wrapper" class:mobile={isMobile}>
		<div
			class="kanban-columns"
			class:mobile-columns={isMobile}
			style={isMobile
				? `transform: translateX(calc(-${currentColumnIndex * 33.333}% + ${swipeOffset}px))`
				: ''}
			ontouchstart={isMobile && typeof window !== 'undefined' ? handleTouchStart : undefined}
			ontouchmove={isMobile && typeof window !== 'undefined' ? handleTouchMove : undefined}
			ontouchend={isMobile && typeof window !== 'undefined' ? handleTouchEnd : undefined}
		>
			{#each columns as column, index}
				{#key [allTodoTasks, allInProgressTasks, allDoneTasks]}
					{@const columnTasks = getTasksForColumn(column.id)}
					{@const stats = getColumnStats(columnTasks)}
					{#if typeof console !== 'undefined'}
						{@html console.log(
							`🔄 Column ${column.title} - columnTasks:`,
							columnTasks.length,
							columnTasks
						) || ''}
					{/if}

					<!-- Show all columns on desktop, and all columns on mobile for swipe -->
					{#if !isMobile || true}
						<div
							class="kanban-column column-{column.id}"
							class:drag-over={draggedOverColumn === column.id}
							class:active-mobile={isMobile && index === currentColumnIndex}
							role="region"
							aria-label="{column.title} tasks"
							ondragover={(e) => handleColumnDragOver(e, column.id)}
							ondrop={(e) => handleColumnDrop(e, column.id)}
						>
							<!-- Column Header -->
							<div class="column-header">
								<div class="column-title-row">
									<div class="column-title-left">
										<span class="column-icon">
											<Icon name={column.icon} size={20} color="var(--nord6)" />
										</span>
										<h3 class="column-name">{column.title}</h3>
									</div>
									<div class="column-stats-inline">
										<span class="task-count">{stats.count}</span>
										{#if stats.time > 0}
											<span class="time-estimate" title="Total estimated time">
												{stats.timeFormatted}
											</span>
										{/if}
									</div>
								</div>
							</div>

							<!-- Tasks List -->
							<div class="tasks-list" role="list">
								{#if $loadingTasks}
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
									{#each columnTasks as task, index (task.id)}
										<div
											class="task-item kanban-task-card"
											class:moving={draggedTask?.id === task.id}
											role="listitem"
											animate:flip={{ duration: 400, easing: quintOut }}
											in:fly={{ x: -30, duration: 300, easing: backOut }}
											out:fly={{ x: 30, duration: 200, easing: quintOut }}
											ondrop={(e) => handleTaskDrop(e, task, index)}
											ondragover={(e) => e.preventDefault()}
										>
											<TaskCard
												{task}
												{canEdit}
												{isAuthenticated}
												variant="kanban"
												selectable={true}
												draggable={canEdit}
												showTimer={column.id !== 'done'}
												on:select={() => handleTaskSelect(task)}
												on:edit={() => openEditTaskForm(task)}
												on:complete={() => handleTaskComplete(task)}
												on:delete={() => handleTaskDelete(task)}
												on:move={handleTaskMove}
												on:dragstart={(e) => handleDragStart(task, e.detail.event)}
												on:dragend={handleDragEnd}
											/>
										</div>
									{/each}

									<!-- Empty state -->
									{#if columnTasks.length === 0 && !$loadingTasks}
										<div
											class="empty-column"
											in:scale={{ duration: 300, easing: backOut, start: 0.8 }}
											out:scale={{ duration: 200, easing: quintOut, start: 0.8 }}
										>
											<div class="empty-icon">
												<Icon name={column.icon} size={48} color="var(--nord3)" />
											</div>
											<p class="empty-text">No tasks in {column.title.toLowerCase()}</p>
											{#if canEdit && column.addButtonText}
												<button
													class="btn btn-ghost btn-sm hover-scale active-press transition-all"
													onclick={() => openNewTaskForm(column.id)}
												>
													{column.addButtonText}
												</button>
											{/if}
										</div>
									{/if}
								{/if}

								<!-- Add Task Button (for non-empty columns) -->
								{#if canEdit && column.addButtonText && columnTasks.length > 0}
									<button
										class="add-task-btn hover-scale active-press transition-all"
										onclick={() => openNewTaskForm(column.id)}
										title="Add task to {column.title}"
									>
										+ Add Task
									</button>
								{/if}
							</div>
						</div>
					{/if}
				{/key}
			{/each}
		</div>
	</div>

	<!-- Mobile Bottom Navigation -->
	{#if isMobile}
		<div class="mobile-bottom-nav">
			<button
				class="nav-arrow nav-prev"
				disabled={currentColumnIndex === 0}
				onclick={() => navigateColumn(-1)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						navigateColumn(-1);
					}
				}}
				title="Previous column"
				aria-label="Previous column"
			>
				<Icon
					name="arrow-left"
					size={20}
					color={currentColumnIndex === 0 ? 'var(--nord3)' : 'var(--nord6)'}
				/>
			</button>
			<span class="current-column-name">
				{columns[currentColumnIndex].title}
			</span>
			<button
				class="nav-arrow nav-next"
				disabled={currentColumnIndex === columns.length - 1}
				onclick={() => navigateColumn(1)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						navigateColumn(1);
					}
				}}
				title="Next column"
				aria-label="Next column"
			>
				<Icon
					name="arrow-right"
					size={20}
					color={currentColumnIndex === columns.length - 1 ? 'var(--nord3)' : 'var(--nord6)'}
				/>
			</button>
		</div>
	{/if}
</div>

<!-- Task Form Modal -->
<TaskForm
	bind:isOpen={isFormOpen}
	task={editingTask}
	on:submit={handleTaskFormSubmit}
	on:cancel={handleTaskFormCancel}
	on:close={handleTaskFormCancel}
/>

<style>
	.kanban-board {
		display: flex;
		flex-direction: column;
		background: var(--nord0);
		box-sizing: border-box;
		margin: 1rem;
	}

	.board-header-container {
		margin-bottom: 1rem;
	}

	.board-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		background: var(--nord1);
		border: 1px solid var(--nord3);
		border-radius: var(--radius-lg);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		box-sizing: border-box;
	}

	.board-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--nord6);
		letter-spacing: -0.025em;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: var(--radius-lg);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.btn-primary {
		background: var(--nord8);
		color: var(--nord0);
	}

	.btn-primary:hover {
		background: var(--nord9);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(129, 161, 193, 0.3);
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

	.kanban-columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		gap: 1.5rem;
		flex: 1;
		width: 100%;
		min-height: 0;
		padding: 1rem;
		box-sizing: border-box;
	}

	.kanban-column {
		background: var(--nord1);
		border: 1px solid var(--nord3);
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
		overflow: hidden;
	}

	.kanban-column.drag-over {
		border-color: var(--nord8);
		box-shadow: 0 0 0 2px rgba(129, 161, 193, 0.2);
	}

	/* Column-specific grid positioning and styling */
	.column-todo {
		grid-row: 1 / 3; /* Spans both rows (full height) */
		grid-column: 1;
		background: linear-gradient(135deg, var(--nord1) 0%, rgba(129, 161, 193, 0.03) 100%);
		border-color: rgba(129, 161, 193, 0.2);
	}

	.column-in_progress {
		grid-row: 1;
		grid-column: 2;
		background: linear-gradient(135deg, var(--nord1) 0%, rgba(235, 203, 139, 0.03) 100%);
		border-color: rgba(235, 203, 139, 0.2);
	}

	.column-done {
		grid-row: 2;
		grid-column: 2;
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

	/* Loading states */
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

	.kanban-wrapper {
		background: var(--nord1);
		border: 1px solid var(--nord3);
		border-radius: var(--radius-lg);
		flex: 1;
		box-sizing: border-box;
		overflow-x: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	/* Mobile Styles */
	.kanban-wrapper.mobile {
		overflow: hidden;
		position: relative;
		flex: 1;
		padding: 0;
		max-width: 100%;
	}

	.kanban-columns.mobile-columns {
		display: flex;
		transition: transform 0.3s ease-out;
		width: 300%; /* 3 columns × 100% */
		height: 100%;
		grid-template-columns: none;
		grid-template-rows: none;
	}

	.mobile-columns .kanban-column {
		width: 33.333%; /* Each column takes 1/3 of total width */
		grid-row: auto !important;
		grid-column: auto !important;
		height: 100%;
		min-height: 0;
	}

	.mobile-indicators {
		display: none;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		margin: 1rem;
		margin-bottom: 1rem;
		background: var(--nord1);
		border: 1px solid var(--nord3);
		border-radius: var(--radius-lg);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.mobile-indicators-left {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.indicator-dot {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		border: 2px solid var(--nord3);
		background: var(--nord2);
		position: relative;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.indicator-dot.active {
		background: var(--nord8);
		border-color: var(--nord8);
		transform: scale(1.1);
	}

	.indicator-count {
		position: absolute;
		top: -8px;
		right: -8px;
		color: white;
		font-size: 0.75rem;
		padding: 2px 6px;
		border-radius: 10px;
		font-weight: 600;
		min-width: 1.25rem;
		text-align: center;
	}

	/* Color coding for task count badges */
	.indicator-count-todo {
		background: var(--nord12); /* Orange */
	}

	.indicator-count-in_progress {
		background: var(--nord14); /* Green */
	}

	.indicator-count-done {
		background: var(--nord3); /* Gray */
		color: var(--nord6); /* Better contrast for gray background */
	}

	.mobile-add-task-btn {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		background: var(--nord8);
		color: white;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.125rem;
		font-weight: bold;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.mobile-add-task-btn:hover {
		background: var(--nord9);
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.mobile-bottom-nav {
		display: none;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: var(--nord1);
		border-top: 1px solid var(--nord3);
	}

	.nav-arrow {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: var(--nord2);
		border: 1px solid var(--nord3);
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nav-arrow:not(:disabled):hover {
		background: var(--nord3);
		transform: scale(1.05);
	}

	.nav-arrow:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.current-column-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--nord6);
	}

	/* Responsive Breakpoints */
	@media (max-width: 767px) {
		.mobile-indicators {
			display: flex;
			margin-left: 0.5rem;
			margin-right: 0.5rem;
			padding: 0.75rem;
		}

		.mobile-bottom-nav {
			display: flex;
			border-radius: var(--radius-md);
			padding: 0.75rem;
			margin-left: 0.5rem;
			margin-right: 0.5rem;
		}

		/* Hide desktop grid positioning */
		.column-todo {
			grid-row: auto !important;
			grid-column: auto !important;
		}
		.column-in_progress {
			grid-row: auto !important;
			grid-column: auto !important;
		}
		.column-done {
			grid-row: auto !important;
			grid-column: auto !important;
		}

		/* Hide desktop add button on mobile - using inline button instead */
		.board-header .btn-primary {
			display: none;
		}

		.kanban-board {
			overflow-x: hidden;
			margin: 0;
		}

		.board-header-container {
			margin-left: 0.5rem;
			margin-right: 0.5rem;
		}

		.board-header {
			padding: 1rem;
			flex-direction: column;
			align-items: center;
			gap: 0.5rem;
			text-align: center;
		}

		.kanban-wrapper {
			margin-left: 0.5rem;
			margin-right: 0.5rem;
		}

		.kanban-column {
			padding: 0.75rem;
			margin: 0;
		}

		.tasks-list {
			padding: 0.5rem;
			gap: 0.5rem;
		}

		.board-title {
			text-align: center;
			font-size: 1.25rem;
		}

		.mobile-indicators-left {
			gap: 0.5rem;
		}
	}

	/* Tablet - Keep Desktop Grid */
	@media (min-width: 768px) and (max-width: 1024px) {
		.board-header {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.board-title {
			text-align: center;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.kanban-column {
			border-width: 2px;
		}

		.column-header {
			border-bottom-width: 2px;
		}

		.add-task-btn {
			border-width: 3px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.kanban-column,
		.task-item,
		.btn,
		.add-task-btn {
			transition: none;
		}
	}

	/* Focus styles for accessibility */
	.btn:focus,
	.add-task-btn:focus {
		outline: 2px solid var(--nord8);
		outline-offset: 2px;
	}

	/* Print styles */
	@media print {
		.board-header {
			page-break-after: avoid;
		}

		.kanban-columns {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.btn,
		.add-task-btn {
			display: none;
		}
	}
</style>
