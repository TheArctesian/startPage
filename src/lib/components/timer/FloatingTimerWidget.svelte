<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { fly, scale } from 'svelte/transition';
  import { activeTimers, newSelectedTimerId as selectedTimerId, TimerManager } from '$lib/stores';
  import TimerDisplay from './TimerDisplay.svelte';
  import MultiTimerPanel from './MultiTimerPanel.svelte';
  import TimerHistoryModal from './TimerHistoryModal.svelte';
  import ManualTimeEntryModal from './ManualTimeEntryModal.svelte';
  import NotificationSettingsModal from './NotificationSettingsModal.svelte';
  import type { ActiveTimer, ManualTimeEntry } from '$lib/types/timer';

  // Widget state
  let isExpanded = false;
  let isDragging = false;
  let position = { x: 20, y: 20 }; // Default position from bottom-right
  let dragStart = { x: 0, y: 0, startX: 0, startY: 0 };

  // History modal state
  let showHistoryModal = false;
  let historyProjectId: number | null = null;
  let historyTaskId: number | null = null;

  // Manual time entry modal state
  let showManualTimeModal = false;
  let manualTimeTask: any = null;
  let manualTimeProject: any = null;
  let availableProjects: any[] = [];

  // Notification settings modal state
  let showNotificationSettingsModal = false;

  // Reactive values
  $: hasActiveTimers = $activeTimers.length > 0;
  $: selectedTimer = $activeTimers.find(t => t.id === $selectedTimerId) || $activeTimers[0];

  // Widget position management
  function startDrag(event: MouseEvent) {
    if (event.target && (event.target as HTMLElement).closest('.timer-controls')) {
      return; // Don't drag when interacting with controls
    }
    
    isDragging = true;
    dragStart = {
      x: event.clientX,
      y: event.clientY,
      startX: position.x,
      startY: position.y
    };
    
    if (browser) {
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', stopDrag);
    }
  }

  function drag(event: MouseEvent) {
    if (!isDragging || !browser) return;
    
    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;
    
    position = {
      x: Math.max(0, Math.min(window.innerWidth - 300, dragStart.startX + deltaX)),
      y: Math.max(0, Math.min(window.innerHeight - 100, dragStart.startY + deltaY))
    };
  }

  function stopDrag() {
    isDragging = false;
    if (browser) {
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDrag);
      
      // Save position to localStorage
      localStorage.setItem('timer-widget-position', JSON.stringify(position));
    }
  }

  function toggleExpanded() {
    isExpanded = !isExpanded;
  }

  function handleOpenHistory(event: CustomEvent<{ projectId?: number; taskId?: number }>) {
    historyProjectId = event.detail.projectId || null;
    historyTaskId = event.detail.taskId || null;
    showHistoryModal = true;
  }

  async function handleAddManualTime(event: CustomEvent<{ timerId?: string }>) {
    if (event.detail.timerId) {
      const timer = $activeTimers.find(t => t.id === event.detail.timerId);
      if (timer) {
        manualTimeTask = timer.task;
        manualTimeProject = await getProjectById(timer.projectId);
      } else {
        manualTimeTask = null;
        manualTimeProject = null;
      }
    } else {
      // General manual time entry (no specific timer)
      manualTimeTask = null;
      manualTimeProject = null;
    }
    
    await loadAvailableProjects();
    showManualTimeModal = true;
  }

  async function getProjectById(projectId: number | null): Promise<any> {
    if (!projectId) return null;
    
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    }
    return null;
  }

  async function loadAvailableProjects() {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        availableProjects = await response.json();
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      availableProjects = [];
    }
  }

  async function handleManualTimeSubmit(event: CustomEvent<{ entry: ManualTimeEntry }>) {
    try {
      await TimerManager.addManualTime(event.detail.entry);
      showManualTimeModal = false;
    } catch (error) {
      console.error('Failed to add manual time entry:', error);
      // The modal will show the error
    }
  }

  // Load saved position on mount
  onMount(() => {
    if (browser) {
      const saved = localStorage.getItem('timer-widget-position');
      if (saved) {
        try {
          position = JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse saved timer position');
        }
      }
    }
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDrag);
    }
  });
</script>

{#if hasActiveTimers}
  <div 
    class="floating-timer-widget"
    class:expanded={isExpanded}
    class:dragging={isDragging}
    style="transform: translate({position.x}px, {position.y}px)"
    in:fly={{ x: 300, duration: 300 }}
    out:scale={{ duration: 200 }}
  >
    <!-- Widget Header (always visible) -->
    <div 
      class="widget-header"
      on:mousedown={startDrag}
      role="button"
      tabindex="0"
      aria-label="Drag to move timer widget"
    >
      <div class="timer-summary">
        {#if $activeTimers.length === 1}
          <TimerDisplay timer={selectedTimer} variant="compact" />
        {:else}
          <div class="multi-timer-summary">
            <span class="timer-count">{$activeTimers.length}</span>
            <span class="timer-label">active</span>
          </div>
        {/if}
      </div>

      <!-- Header Controls -->
      <div class="header-controls">
        <button 
          class="control-btn settings-btn"
          on:click={() => showNotificationSettingsModal = true}
          title="Timer Notification Settings"
        >
          ⚙
        </button>
        
        {#if $activeTimers.length > 1}
          <button 
            class="control-btn cycle-btn"
            on:click={() => {
              const currentIndex = $activeTimers.findIndex(t => t.id === $selectedTimerId);
              const nextIndex = (currentIndex + 1) % $activeTimers.length;
              selectedTimerId.set($activeTimers[nextIndex].id);
            }}
            title="Cycle through timers"
          >
            ↻
          </button>
        {/if}
        
        <button 
          class="control-btn expand-btn"
          on:click={toggleExpanded}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>
    </div>

    <!-- Expanded Content -->
    {#if isExpanded}
      <div 
        class="widget-content"
        transition:fly={{ y: -20, duration: 200 }}
      >
        <MultiTimerPanel 
          timers={$activeTimers}
          selectedTimerId={$selectedTimerId}
          on:selectTimer={(e) => selectedTimerId.set(e.detail.timerId)}
          on:stopTimer={(e) => TimerManager.stopTimer(e.detail.timerId)}
          on:pauseTimer={(e) => TimerManager.pauseTimer(e.detail.timerId)}
          on:resumeTimer={(e) => TimerManager.resumeTimer(e.detail.timerId)}
          on:addManualTime={handleAddManualTime}
          on:openHistory={handleOpenHistory}
        />
      </div>
    {/if}
  </div>
{/if}

<!-- History Modal -->
<TimerHistoryModal 
  bind:isOpen={showHistoryModal}
  projectId={historyProjectId}
  taskId={historyTaskId}
  title={historyTaskId ? 'Task Time History' : historyProjectId ? 'Project Time History' : 'Timer History'}
  on:close={() => showHistoryModal = false}
/>

<!-- Manual Time Entry Modal -->
<ManualTimeEntryModal
  bind:isOpen={showManualTimeModal}
  task={manualTimeTask}
  project={manualTimeProject}
  projects={availableProjects}
  on:close={() => showManualTimeModal = false}
  on:submit={handleManualTimeSubmit}
/>

<!-- Notification Settings Modal -->
<NotificationSettingsModal
  bind:isOpen={showNotificationSettingsModal}
  on:close={() => showNotificationSettingsModal = false}
/>

<style>
  .floating-timer-widget {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    min-width: 300px;
    max-width: 420px;
    background: rgba(46, 52, 64, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid var(--nord3);
    border-radius: 12px;
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(129, 161, 193, 0.1);
    font-family: inherit;
    user-select: none;
    transition: all 0.2s ease;
    overflow: hidden;
  }

  .floating-timer-widget:hover {
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(129, 161, 193, 0.2);
  }

  .floating-timer-widget.dragging {
    transform-origin: center;
    transition: none;
    cursor: grabbing;
  }

  .floating-timer-widget.expanded {
    max-height: 500px;
  }

  .widget-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: grab;
    border-radius: 12px 12px 0 0;
    background: linear-gradient(135deg, 
      rgba(129, 161, 193, 0.1) 0%, 
      rgba(94, 129, 172, 0.1) 100%
    );
    min-height: 48px;
  }

  .widget-header:hover {
    background: linear-gradient(135deg, 
      rgba(129, 161, 193, 0.15) 0%, 
      rgba(94, 129, 172, 0.15) 100%
    );
  }

  .timer-summary {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .multi-timer-summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--nord6);
    white-space: nowrap;
  }

  .timer-count {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--nord8);
  }

  .timer-label {
    font-size: 0.875rem;
    color: var(--nord4);
  }

  .header-controls {
    display: flex;
    gap: 0.25rem;
    margin-left: 1rem;
  }

  .control-btn {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--nord4);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
  }

  .control-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--nord6);
  }

  .control-btn:active {
    transform: scale(0.9);
  }

  .widget-content {
    border-top: 1px solid var(--nord3);
    max-height: 400px;
    overflow-y: auto;
  }

  /* Scrollbar styling */
  .widget-content::-webkit-scrollbar {
    width: 4px;
  }

  .widget-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .widget-content::-webkit-scrollbar-thumb {
    background: var(--nord3);
    border-radius: 2px;
  }

  .widget-content::-webkit-scrollbar-thumb:hover {
    background: var(--nord4);
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .floating-timer-widget {
      position: fixed;
      bottom: 80px; /* Above mobile nav if present */
      right: 10px;
      left: 10px;
      min-width: auto;
      max-width: none;
    }
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .floating-timer-widget,
    .control-btn {
      transition: none;
    }
  }

  @media (prefers-contrast: high) {
    .floating-timer-widget {
      background: var(--nord0);
      border: 2px solid var(--nord6);
    }
  }
</style>