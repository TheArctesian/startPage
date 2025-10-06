<!--
  Kanban Mobile Navigation Component
  
  Single responsibility: Handles mobile/tablet navigation for kanban columns.
  Manages swipe gestures and column indicators.
  Follows UNIX philosophy: focused mobile interaction component.
-->

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Icon from '$lib/ui/icon.svelte';

	// Props
	export let currentIndex = 0;
	export let totalColumns = 3;
	export let columnTitles: string[] = ['Todo', 'In Progress', 'Done'];

	const dispatch = createEventDispatcher<{
		navigate: { index: number };
	}>();

	// Touch/swipe state
	let touchStartX = 0;
	let touchEndX = 0;
	let isSwiping = false;
	let swipeOffset = 0;

	// Navigation handlers
	function goToColumn(index: number) {
		if (index >= 0 && index < totalColumns) {
			currentIndex = index;
			dispatch('navigate', { index });
		}
	}

	function goToPrevious() {
		goToColumn(currentIndex - 1);
	}

	function goToNext() {
		goToColumn(currentIndex + 1);
	}

	// Touch handlers
	function handleTouchStart(event: TouchEvent) {
		touchStartX = event.touches[0].clientX;
		isSwiping = true;
		swipeOffset = 0;
	}

	function handleTouchMove(event: TouchEvent) {
		if (!isSwiping) return;
		
		touchEndX = event.touches[0].clientX;
		swipeOffset = touchEndX - touchStartX;
		
		// Prevent default scrolling during swipe
		if (Math.abs(swipeOffset) > 10) {
			event.preventDefault();
		}
	}

	function handleTouchEnd() {
		if (!isSwiping) return;
		
		isSwiping = false;
		const swipeThreshold = 50;
		
		if (swipeOffset > swipeThreshold) {
			goToPrevious();
		} else if (swipeOffset < -swipeThreshold) {
			goToNext();
		}
		
		swipeOffset = 0;
	}
</script>

<!-- Mobile Column Navigation -->
<div class="md:hidden">
	<!-- Swipe Area -->
	<div 
		class="relative touch-pan-y"
		on:touchstart={handleTouchStart}
		on:touchmove={handleTouchMove}
		on:touchend={handleTouchEnd}
		role="tablist"
		aria-label="Kanban columns"
	>
		<!-- Column Indicators -->
		<div class="flex justify-center items-center gap-4 mb-4 px-4">
			<!-- Previous Button -->
			<button
				class="p-2 rounded-lg border border-nord-comment hover:border-nord-frost-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				disabled={currentIndex === 0}
				on:click={goToPrevious}
				aria-label="Previous column"
			>
				<Icon name="chevron-left" size="sm" />
			</button>

			<!-- Column Title and Counter -->
			<div class="flex-1 text-center">
				<h2 class="text-lg font-semibold text-nord-snow">
					{columnTitles[currentIndex] || 'Column'}
				</h2>
				<div class="flex justify-center gap-2 mt-2">
					{#each Array(totalColumns) as _, index}
						<button
							class="w-2 h-2 rounded-full transition-all duration-200"
							class:bg-nord-frost-500={index === currentIndex}
							class:bg-nord-comment={index !== currentIndex}
							on:click={() => goToColumn(index)}
							aria-label="Go to {columnTitles[index] || `column ${index + 1}`}"
							role="tab"
							aria-selected={index === currentIndex}
						/>
					{/each}
				</div>
			</div>

			<!-- Next Button -->
			<button
				class="p-2 rounded-lg border border-nord-comment hover:border-nord-frost-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				disabled={currentIndex === totalColumns - 1}
				on:click={goToNext}
				aria-label="Next column"
			>
				<Icon name="chevron-right" size="sm" />
			</button>
		</div>

		<!-- Swipe Hint -->
		{#if swipeOffset !== 0}
			<div class="text-center text-sm text-nord-comment mb-2">
				{swipeOffset > 0 ? '← Swipe to go back' : 'Swipe to continue →'}
			</div>
		{/if}
	</div>
</div>

<style>
	.touch-pan-y {
		touch-action: pan-y;
	}
</style>