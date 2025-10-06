<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import ProjectSidebar from '$lib/features/projects/project-sidebar.svelte';
	import FloatingTimerWidget from '$lib/features/timer/floating-timer-widget.svelte';
	import TimerBar from '$lib/features/timer/timer-bar.svelte';
	import TimerNotifications from '$lib/features/timer/timer-notifications.svelte';
	import Toast from '$lib/ui/toast.svelte';
	import PWAInstallPrompt from '$lib/features/pwa-install-prompt.svelte';
	import { 
		sidebarState, 
		sidebarActions, 
		isCollapsed, 
		isMobileOpen, 
		responsiveActions 
	} from '$lib/stores/sidebar';
	import { hasActiveTimers, TimerManager } from '$lib/stores';
	import { userStateActions, userState, isAuthenticated, isAnonymous, currentUser } from '$lib/stores/user-state';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	
	let { children, data } = $props();

	// Initialize user state from server data
	$effect(() => {
		userStateActions.initialize({
			user: data.user,
			isAuthenticated: data.isAuthenticated,
			isAnonymous: data.isAnonymous,
			canEdit: data.canEdit,
			sessionId: data.sessionId
		});
	});

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
			
			// Initialize timers when app loads
			TimerManager.loadActiveTimers();
			
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
	<!-- Floating Timer Widget -->
	<FloatingTimerWidget />

	<!-- Timer Notifications -->
	<TimerNotifications />

	<!-- Guest Banner -->
	{#if $isAnonymous}
		<div class="guest-banner">
			<div class="guest-banner-content">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
					<circle cx="12" cy="12" r="3"/>
				</svg>
				<span>Viewing in read-only mode</span>
				<a href="/login" class="guest-signin-link">Sign in to edit</a>
			</div>
		</div>
	{/if}

	<!-- Main App Layout -->
	<div 
		class="app-layout"
		class:sidebar-collapsed={$isCollapsed}
		class:has-guest-banner={$isAnonymous}
	>
		<!-- Persistent Sidebar -->
		<aside 
			class="app-sidebar sidebar-transition"
			class:collapsed={$isCollapsed}
			class:mobile-open={$isMobileOpen}
		>
			<ProjectSidebar user={$currentUser} isAuthenticated={$isAuthenticated} on:collapse={handleSidebarCollapse} />
		</aside>

		<!-- Main Content Area -->
		<main class="app-main">
			<!-- Timer Bar -->
			<TimerBar />
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
				
				<!-- Auth Status -->
				<div class="auth-status">
					{#if $currentUser}
						<div class="user-info">
							<span class="username">{$currentUser.username}</span>
							{#if $currentUser.role === 'admin'}
								<span class="role-badge admin">Admin</span>
							{/if}
						</div>
						<a href="/logout" class="auth-link authenticated" data-sveltekit-reload>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
								<polyline points="16,17 21,12 16,7"/>
								<line x1="21" y1="12" x2="9" y2="12"/>
							</svg>
							Logout
						</a>
					{:else if $isAnonymous}
						<div class="guest-info">
							<span class="guest-label">Viewing as Guest</span>
						</div>
						<a href="/login" class="auth-link">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
								<circle cx="12" cy="16" r="1"/>
								<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
							</svg>
							Sign In
						</a>
					{:else}
						<a href="/login" class="auth-link">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
								<circle cx="12" cy="16" r="1"/>
								<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
							</svg>
							Sign In
						</a>
					{/if}
				</div>
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

	<!-- Global Toast Notifications -->
	<Toast />

	<!-- PWA Install Prompt -->
	<PWAInstallPrompt />
</div>

<style>
	.app-root {
		height: 100vh;
		overflow: hidden;
		background: var(--nord0);
		color: var(--nord6);
	}

	/* Floating timer widget styles are in the component */

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
		justify-content: space-between;
		align-items: center;
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

	.auth-status {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.username {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--nord6);
	}

	.role-badge {
		font-size: 0.75rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.role-badge.admin {
		background: var(--nord11);
		color: var(--nord0);
	}

	.guest-info {
		display: flex;
		align-items: center;
	}

	.guest-label {
		font-size: 0.75rem;
		color: var(--nord4);
		font-style: italic;
	}

	.auth-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--nord4);
		border: 1px solid var(--nord3);
		background: var(--nord0);
		transition: all 0.2s ease;
	}

	.auth-link:hover {
		color: var(--nord6);
		border-color: var(--nord8);
		background: var(--nord1);
	}

	.auth-link.authenticated {
		color: var(--nord14);
		border-color: var(--nord14);
	}

	.auth-link.authenticated:hover {
		background: rgba(163, 190, 140, 0.1);
	}

	/* Guest Banner */
	.guest-banner {
		background: var(--nord2);
		border-bottom: 1px solid var(--nord3);
		padding: 0.5rem 1rem;
		z-index: 50;
	}

	.guest-banner-content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		max-width: 1200px;
		margin: 0 auto;
		font-size: 0.875rem;
		color: var(--nord4);
	}

	.guest-signin-link {
		color: var(--nord8);
		text-decoration: none;
		font-weight: 500;
		margin-left: 0.5rem;
	}

	.guest-signin-link:hover {
		color: var(--nord9);
		text-decoration: underline;
	}

	/* Layout adjustments for guest banner */
	.app-layout.has-guest-banner {
		height: calc(100vh - 2.5rem); /* Adjust for banner height */
	}

	/* Mobile layout adjustments */
	@media (max-width: 1024px) {
		.app-layout.has-guest-banner {
			height: calc(100vh - 2.5rem - 4rem); /* Adjust for banner and mobile header */
		}
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
			display: flex;
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

		/* Mobile timer widget adjustments handled in component */
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
