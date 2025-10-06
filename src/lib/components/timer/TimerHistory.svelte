<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import Icon from '../ui/Icon.svelte';
  import type { TimeSessionWithDetails } from '$lib/types/database';

  export let projectId: number | null = null;
  export let taskId: number | null = null;
  export let limit = 20;
  export let showActions = true;

  let sessions: TimeSessionWithDetails[] = [];
  let isLoading = false;
  let error: string | null = null;
  let selectedDateRange = '7d'; // 1d, 7d, 30d, all

  // Date range options
  const dateRanges = {
    '1d': { label: 'Last 24 hours', days: 1 },
    '7d': { label: 'Last 7 days', days: 7 },
    '30d': { label: 'Last 30 days', days: 30 },
    'all': { label: 'All time', days: null }
  };

  async function loadTimeSessions() {
    isLoading = true;
    error = null;

    try {
      const params = new URLSearchParams({
        details: 'true',
        limit: limit.toString()
      });

      if (projectId) params.append('project', projectId.toString());
      if (taskId) params.append('task', taskId.toString());

      // Add date range filter
      if (selectedDateRange !== 'all') {
        const days = dateRanges[selectedDateRange as keyof typeof dateRanges].days!;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        params.append('startDate', startDate.toISOString());
      }

      const response = await fetch(`/api/time-sessions?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load time sessions');
      }

      sessions = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error loading time sessions:', err);
    } finally {
      isLoading = false;
    }
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds || seconds <= 0) return '0m';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  function formatDateTime(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  }

  function getTotalDuration(): number {
    return sessions.reduce((total, session) => total + (session.duration || 0), 0);
  }

  function getSessionsByDate() {
    const grouped = sessions.reduce((acc, session) => {
      const date = new Date(session.startTime).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(session);
      return acc;
    }, {} as Record<string, TimeSessionWithDetails[]>);

    return Object.entries(grouped).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  }

  onMount(() => {
    loadTimeSessions();
  });

  $: if (selectedDateRange) {
    loadTimeSessions();
  }
</script>

<div class="timer-history">
  <!-- Header -->
  <div class="history-header">
    <div class="header-info">
      <h3 class="history-title">
        <Icon name="clock" size={16} />
        Time History
      </h3>
      {#if sessions.length > 0}
        <span class="total-duration">
          {formatDuration(getTotalDuration())} total
        </span>
      {/if}
    </div>

    <!-- Date Range Filter -->
    <div class="date-filter">
      {#each Object.entries(dateRanges) as [key, range]}
        <button
          class="filter-btn"
          class:active={selectedDateRange === key}
          on:click={() => selectedDateRange = key}
        >
          {range.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Content -->
  <div class="history-content">
    {#if isLoading}
      <div class="loading-state">
        <Icon name="loader" size={20} />
        <span>Loading sessions...</span>
      </div>
    {:else if error}
      <div class="error-state">
        <Icon name="alert-circle" size={20} />
        <span>{error}</span>
        <button class="retry-btn" on:click={loadTimeSessions}>
          Try Again
        </button>
      </div>
    {:else if sessions.length === 0}
      <div class="empty-state">
        <Icon name="clock" size={32} />
        <h4>No time sessions found</h4>
        <p>Start timing tasks to see your history here.</p>
      </div>
    {:else}
      <!-- Sessions by Date -->
      <div class="sessions-list">
        {#each getSessionsByDate() as [dateStr, dateSessions]}
          <div class="date-group" in:fly={{ y: 20, duration: 200 }}>
            <div class="date-header">
              <h4 class="date-title">{new Date(dateStr).toLocaleDateString([], { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}</h4>
              <span class="date-total">
                {formatDuration(dateSessions.reduce((sum, s) => sum + (s.duration || 0), 0))}
              </span>
            </div>

            <div class="sessions">
              {#each dateSessions as session (session.id)}
                <div class="session-item" in:fly={{ x: -20, duration: 200 }}>
                  <div class="session-time">
                    {formatDateTime(session.startTime)}
                    {#if session.endTime}
                      - {formatDateTime(session.endTime)}
                    {:else}
                      <span class="active-badge">Active</span>
                    {/if}
                  </div>

                  <div class="session-details">
                    {#if session.task}
                      <div class="task-info">
                        <Icon name="check-square" size={14} />
                        <span class="task-title">{session.task.title}</span>
                      </div>
                    {/if}

                    {#if session.project}
                      <div class="project-info">
                        <Icon name="folder" size={14} />
                        <span class="project-name">{session.project.name}</span>
                      </div>
                    {/if}

                    {#if session.description}
                      <div class="session-description">
                        {session.description}
                      </div>
                    {/if}
                  </div>

                  <div class="session-duration">
                    <span class="duration-value">
                      {formatDuration(session.duration)}
                    </span>
                    {#if session.isActive}
                      <div class="active-indicator"></div>
                    {/if}
                  </div>

                  {#if showActions}
                    <div class="session-actions">
                      <button
                        class="action-btn edit-btn"
                        title="Edit session"
                        on:click={() => console.log('Edit session:', session.id)}
                      >
                        <Icon name="edit" size={14} />
                      </button>
                      <button
                        class="action-btn delete-btn"
                        title="Delete session"
                        on:click={() => console.log('Delete session:', session.id)}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .timer-history {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 600px;
  }

  .history-header {
    padding: 1rem;
    border-bottom: 1px solid var(--nord3);
    background: var(--nord1);
  }

  .header-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .history-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0;
  }

  .total-duration {
    font-size: 0.875rem;
    color: var(--nord9);
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
  }

  .date-filter {
    display: flex;
    gap: 0.25rem;
    background: var(--nord2);
    border-radius: 6px;
    padding: 2px;
  }

  .filter-btn {
    padding: 0.375rem 0.75rem;
    border: none;
    background: transparent;
    color: var(--nord4);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .filter-btn:hover {
    background: var(--nord3);
    color: var(--nord6);
  }

  .filter-btn.active {
    background: var(--nord0);
    color: var(--nord6);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .history-content {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    color: var(--nord4);
    gap: 0.75rem;
  }

  .retry-btn {
    padding: 0.5rem 1rem;
    border: 1px solid var(--nord3);
    background: var(--nord0);
    color: var(--nord6);
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .retry-btn:hover {
    background: var(--nord2);
    border-color: var(--nord4);
  }

  .sessions-list {
    padding: 1rem;
  }

  .date-group {
    margin-bottom: 1.5rem;
  }

  .date-group:last-child {
    margin-bottom: 0;
  }

  .date-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--nord3);
  }

  .date-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0;
  }

  .date-total {
    font-size: 0.75rem;
    color: var(--nord8);
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
  }

  .sessions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .session-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--nord1);
    border: 1px solid var(--nord3);
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .session-item:hover {
    background: var(--nord2);
    border-color: var(--nord4);
  }

  .session-time {
    font-size: 0.75rem;
    color: var(--nord4);
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    min-width: 80px;
    flex-shrink: 0;
  }

  .active-badge {
    background: var(--nord14);
    color: var(--nord0);
    padding: 0.125rem 0.375rem;
    border-radius: 10px;
    font-size: 0.625rem;
    font-weight: 600;
    margin-left: 0.25rem;
  }

  .session-details {
    flex: 1;
    min-width: 0;
  }

  .task-info,
  .project-info {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
  }

  .task-title {
    color: var(--nord6);
    font-weight: 500;
  }

  .project-name {
    color: var(--nord8);
  }

  .session-description {
    font-size: 0.75rem;
    color: var(--nord4);
    font-style: italic;
    margin-top: 0.25rem;
  }

  .session-duration {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .duration-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--nord9);
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
  }

  .active-indicator {
    width: 8px;
    height: 8px;
    background: var(--nord14);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .session-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .action-btn {
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
  }

  .action-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .edit-btn:hover {
    color: var(--nord8);
  }

  .delete-btn:hover {
    color: var(--nord11);
  }

  /* Scrollbar styling */
  .history-content::-webkit-scrollbar {
    width: 6px;
  }

  .history-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .history-content::-webkit-scrollbar-thumb {
    background: var(--nord3);
    border-radius: 3px;
  }

  .history-content::-webkit-scrollbar-thumb:hover {
    background: var(--nord4);
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .session-item {
      flex-direction: column;
      gap: 0.5rem;
    }

    .session-time {
      min-width: auto;
    }

    .session-duration {
      align-self: flex-end;
    }

    .session-actions {
      align-self: flex-end;
    }

    .date-filter {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.25rem;
    }
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .active-indicator {
      animation: none;
    }

    .session-item,
    .action-btn,
    .filter-btn {
      transition: none;
    }
  }
</style>