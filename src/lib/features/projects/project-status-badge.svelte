<script lang="ts">
  import type { ProjectStatus } from '$lib/types/database';

  let { status } = $props<{ status: ProjectStatus }>();

  const statusConfig = $derived(getStatusConfig(status));

  function getStatusConfig(status: ProjectStatus) {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          icon: '●',
          color: 'var(--nord14)', // Green
          bgColor: 'rgba(163, 190, 140, 0.1)',
          textColor: 'var(--nord14)'
        };
      case 'done':
        return {
          label: 'Done',
          icon: '✓',
          color: 'var(--nord8)', // Blue
          bgColor: 'rgba(129, 161, 193, 0.1)',
          textColor: 'var(--nord8)'
        };
      case 'archived':
        return {
          label: 'Archived',
          icon: '📦',
          color: 'var(--nord4)', // Gray
          bgColor: 'rgba(216, 222, 233, 0.1)',
          textColor: 'var(--nord4)'
        };
      default:
        return {
          label: 'Unknown',
          icon: '?',
          color: 'var(--nord4)',
          bgColor: 'rgba(216, 222, 233, 0.1)',
          textColor: 'var(--nord4)'
        };
    }
  }
</script>

<div 
  class="status-badge"
  style="
    background-color: {statusConfig.bgColor};
    color: {statusConfig.textColor};
    border-color: {statusConfig.color};
  "
  title="Status: {statusConfig.label}"
>
  <span class="status-icon">{statusConfig.icon}</span>
  <span class="status-label">{statusConfig.label}</span>
</div>

<style>
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    border: 1px solid;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  .status-icon {
    font-size: 0.625rem;
    line-height: 1;
  }

  .status-label {
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  /* Mobile adjustments */
  @media (max-width: 640px) {
    .status-badge {
      padding: 0.125rem 0.375rem;
      font-size: 0.625rem;
    }

    .status-label {
      display: none;
    }

    .status-icon {
      font-size: 0.75rem;
    }
  }
</style>
