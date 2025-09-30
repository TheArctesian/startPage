<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import ProjectSidebar from '$lib/components/projects/ProjectSidebar.svelte';
	import Timer from '$lib/components/timer/Timer.svelte';
	import { 
		sidebarState, 
		sidebarActions, 
		isCollapsed, 
		isMobileOpen, 
		responsiveActions 
	} from '$lib/stores/sidebar';
	import { isTimerRunning, selectedTask } from '$lib/stores';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	
	let { children } = $props();

	// Handle mobile sidebar toggle
	function toggleMobileSidebar() {
		sidebarActions.toggleMobileOpen();
	}

	// Handle sidebar collapse
	function handleSidebarCollapse(event: CustomEvent<{ isCollapsed: boolean }>) {
		sidebarActions.setCollapsed(event.detail.isCollapsed);
	}

	// Close mobile sidebar when clicking outside
	function handleOverlayClick() {
		sidebarActions.closeMobile();
	}

	// Setup responsive behavior
	onMount(() => {
		if (browser) {
			// Handle navigation events to close mobile sidebar
			window.addEventListener('popstate', responsiveActions.handleNavigation);
			
			return () => {
				window.removeEventListener('popstate', responsiveActions.handleNavigation);
			};
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-root">
	<!-- Timer Widget (when active) -->
	{#if $isTimerRunning && $selectedTask}
		<div class="timer-widget fade-in">
			<div class="timer-content">
				<div class="timer-task-info">
					<div class="timer-task-title">{$selectedTask.title}</div>
					<div class="timer-task-meta">{$selectedTask.estimatedMinutes}m estimated</div>
				</div>
				<div class="timer-display">
					<Timer />
				</div>
			</div>
		</div>
	{/if}

	<!-- Main App Layout -->
	<div 
		class="app-layout"
		class:sidebar-collapsed={$isCollapsed}
	>
		<!-- Persistent Sidebar -->
		<aside 
			class="app-sidebar sidebar-transition"
			class:collapsed={$isCollapsed}
			class:mobile-open={$isMobileOpen}
		>
			<ProjectSidebar on:collapse={handleSidebarCollapse} />
		</aside>

		<!-- Main Content Area -->
		<main class="app-main">
			<!-- Mobile Header Controls -->
			<div class="mobile-header">
				<button
					class="mobile-toggle transition-colors hover-scale active-press"
					class:active={$isMobileOpen}
					onclick={toggleMobileSidebar}
					aria-label="Toggle sidebar"
				>
					<span class="hamburger-line"></span>
					<span class="hamburger-line"></span>
					<span class="hamburger-line"></span>
				</button>
			</div>

			<!-- Page Content -->
			<div class="page-wrapper">
				{@render children?.()}
			</div>
		</main>

		<!-- Mobile Overlay -->
		{#if $isMobileOpen}
			<div 
				class="mobile-overlay modal-backdrop"
				role="button"
				tabindex="0"
				onclick={handleOverlayClick}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						handleOverlayClick();
					}
				}}
				aria-label="Close sidebar"
			></div>
		{/if}
	</div>
</div>

<style>
	.app-root {
		height: 100vh;
		overflow: hidden;
		background: var(--nord0);
		color: var(--nord6);
	}

	/* Timer Widget Styles */
	.timer-widget {
		background: var(--nord1);
		border-bottom: 2px solid var(--nord8);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		padding: 0.75rem 1rem;
		z-index: 50;
	}

	.timer-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 1200px;
		margin: 0 auto;
	}

	.timer-task-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.timer-task-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--nord6);
	}

	.timer-task-meta {
		font-size: 0.75rem;
		color: var(--nord9);
	}

	.timer-display {
		flex-shrink: 0;
	}

	/* Main Layout */
	.app-layout {
		display: grid;
		grid-template-columns: 280px 1fr;
		height: 100vh;
		transition: grid-template-columns var(--anim-normal) var(--ease-out);
	}

	.app-layout.sidebar-collapsed {
		grid-template-columns: 0 1fr;
	}

	/* Sidebar */
	.app-sidebar {
		background: var(--nord1);
		border-right: 1px solid var(--nord3);
		overflow-y: auto;
		overflow-x: hidden;
		z-index: 20;
		opacity: 1;
		visibility: visible;
	}

	.app-sidebar.collapsed {
		opacity: 0;
		visibility: hidden;
	}

	/* Main Content */
	.app-main {
		background: var(--nord0);
		overflow-y: auto;
		position: relative;
		min-height: 0;
	}

	.mobile-header {
		display: none;
		padding: 1rem;
		background: var(--nord1);
		border-bottom: 1px solid var(--nord3);
	}

	.mobile-toggle {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		justify-content: center;
		align-items: center;
		width: 2rem;
		height: 2rem;
		background: transparent;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		border-radius: 0.375rem;
	}

	.hamburger-line {
		width: 1rem;
		height: 2px;
		background: var(--nord4);
		transition: all var(--anim-fast) var(--ease-out);
	}

	.mobile-toggle.active .hamburger-line:nth-child(1) {
		transform: rotate(45deg) translate(3px, 3px);
	}

	.mobile-toggle.active .hamburger-line:nth-child(2) {
		opacity: 0;
	}

	.mobile-toggle.active .hamburger-line:nth-child(3) {
		transform: rotate(-45deg) translate(3px, -3px);
	}

	.page-wrapper {
		height: 100%;
		overflow-y: auto;
	}

	/* Mobile Overlay */
	.mobile-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 15;
	}

	/* Mobile Responsive */
	@media (max-width: 1024px) {
		.app-layout {
			grid-template-columns: 1fr;
		}

		.app-layout.sidebar-collapsed {
			grid-template-columns: 1fr;
		}

		.mobile-header {
			display: block;
		}

		.app-sidebar {
			position: fixed;
			top: 0;
			left: 0;
			bottom: 0;
			width: 280px;
			transform: translateX(-100%);
			transition: transform var(--anim-normal) var(--ease-out);
			z-index: 20;
		}

		.app-sidebar.mobile-open {
			transform: translateX(0);
		}

		.app-sidebar.collapsed {
			opacity: 1;
			visibility: visible;
		}

		.timer-content {
			flex-direction: column;
			gap: 0.5rem;
			align-items: center;
			text-align: center;
		}
	}

	@media (max-width: 640px) {
		.app-sidebar {
			width: 100vw;
			max-width: 320px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.app-layout,
		.app-sidebar,
		.hamburger-line {
			transition: none;
		}
	}
</style>
