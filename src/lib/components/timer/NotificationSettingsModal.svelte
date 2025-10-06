<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { scale, fade } from 'svelte/transition';
  import { browser } from '$app/environment';
  import Icon from '../ui/Icon.svelte';

  export let isOpen = false;

  const dispatch = createEventDispatcher<{
    close: void;
    save: { settings: NotificationSettings };
  }>();

  interface NotificationSettings {
    enabled: boolean;
    browserNotifications: boolean;
    estimatedTimeWarning: boolean;
    overtimeAlerts: boolean;
    milestoneNotifications: boolean;
    warningThreshold: number; // percentage (0.5 = 50%)
    milestones: number[]; // minutes
    autoRequestPermission: boolean;
  }

  // Default settings
  let settings: NotificationSettings = {
    enabled: true,
    browserNotifications: true,
    estimatedTimeWarning: true,
    overtimeAlerts: true,
    milestoneNotifications: true,
    warningThreshold: 0.8, // 80%
    milestones: [15, 30, 60], // 15min, 30min, 1hour
    autoRequestPermission: true
  };

  let notificationPermission: NotificationPermission = 'default';
  let customMilestone = '';
  let errors: Record<string, string> = {};

  // Load settings and check permission on mount
  $: if (isOpen && browser) {
    loadSettings();
    checkNotificationPermission();
  }

  function loadSettings() {
    try {
      const stored = localStorage.getItem('timer-notification-settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        settings = { ...settings, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load notification settings:', error);
    }
  }

  function checkNotificationPermission() {
    if ('Notification' in window) {
      notificationPermission = Notification.permission;
    }
  }

  async function requestNotificationPermission() {
    if (!('Notification' in window)) {
      errors.permission = 'Browser notifications are not supported';
      return;
    }

    try {
      notificationPermission = await Notification.requestPermission();
      
      if (notificationPermission === 'granted') {
        settings.browserNotifications = true;
        errors.permission = '';
      } else if (notificationPermission === 'denied') {
        errors.permission = 'Notifications were denied. Please enable them in your browser settings.';
        settings.browserNotifications = false;
      }
    } catch (error) {
      errors.permission = 'Failed to request notification permission';
    }
  }

  function addCustomMilestone() {
    const milestone = parseInt(customMilestone);
    
    if (!milestone || milestone <= 0) {
      errors.milestone = 'Please enter a valid number of minutes';
      return;
    }

    if (settings.milestones.includes(milestone)) {
      errors.milestone = 'This milestone already exists';
      return;
    }

    settings.milestones = [...settings.milestones, milestone].sort((a, b) => a - b);
    customMilestone = '';
    errors.milestone = '';
  }

  function removeMilestone(milestone: number) {
    settings.milestones = settings.milestones.filter(m => m !== milestone);
  }

  function validateSettings(): boolean {
    errors = {};

    if (settings.warningThreshold < 0.1 || settings.warningThreshold > 1) {
      errors.threshold = 'Threshold must be between 10% and 100%';
    }

    if (settings.milestones.length === 0 && settings.milestoneNotifications) {
      errors.milestones = 'At least one milestone is required';
    }

    return Object.keys(errors).length === 0;
  }

  function saveSettings() {
    if (!validateSettings()) return;

    try {
      localStorage.setItem('timer-notification-settings', JSON.stringify(settings));
      dispatch('save', { settings });
      closeModal();
    } catch (error) {
      errors.general = 'Failed to save settings';
    }
  }

  function resetToDefaults() {
    settings = {
      enabled: true,
      browserNotifications: notificationPermission === 'granted',
      estimatedTimeWarning: true,
      overtimeAlerts: true,
      milestoneNotifications: true,
      warningThreshold: 0.8,
      milestones: [15, 30, 60],
      autoRequestPermission: true
    };
    errors = {};
  }

  function closeModal() {
    isOpen = false;
    errors = {};
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  // Disable browser notifications if permission denied
  $: if (notificationPermission === 'denied') {
    settings.browserNotifications = false;
  }

  // Format milestone display
  function formatMilestone(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  }
</script>

{#if isOpen}
  <!-- Modal Backdrop -->
  <div 
    class="modal-backdrop"
    in:fade={{ duration: 200 }}
    out:fade={{ duration: 200 }}
    on:click={handleBackdropClick}
    role="presentation"
  >
    <!-- Modal Container -->
    <div 
      class="modal-container"
      in:scale={{ duration: 300, start: 0.95 }}
      out:scale={{ duration: 200, start: 0.95 }}
      tabindex="-1"
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
      on:keydown={handleKeydown}
    >
      <!-- Modal Header -->
      <div class="modal-header">
        <h2 id="modal-title" class="modal-title">
          <Icon name="bell" size={20} />
          Timer Notifications
        </h2>
        
        <button 
          class="close-btn"
          on:click={closeModal}
          title="Close"
          aria-label="Close notification settings"
        >
          <Icon name="x" size={20} />
        </button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        {#if errors.general}
          <div class="error-message">
            <Icon name="alert-circle" size={16} />
            {errors.general}
          </div>
        {/if}

        <!-- Enable/Disable Notifications -->
        <div class="setting-group">
          <div class="setting-header">
            <h3>General Settings</h3>
          </div>
          
          <label class="setting-item">
            <input 
              type="checkbox" 
              bind:checked={settings.enabled}
              class="setting-checkbox"
            />
            <div class="setting-content">
              <div class="setting-title">Enable Timer Notifications</div>
              <div class="setting-description">Show in-app notifications for timer events</div>
            </div>
          </label>
        </div>

        {#if settings.enabled}
          <!-- Browser Notifications -->
          <div class="setting-group">
            <div class="setting-header">
              <h3>Browser Notifications</h3>
            </div>

            <div class="permission-status">
              <div class="permission-info">
                <Icon name="monitor" size={16} />
                <span>Status: 
                  {#if notificationPermission === 'granted'}
                    <span class="status-granted">Granted</span>
                  {:else if notificationPermission === 'denied'}
                    <span class="status-denied">Denied</span>
                  {:else}
                    <span class="status-default">Not requested</span>
                  {/if}
                </span>
              </div>
              
              {#if notificationPermission !== 'granted'}
                <button 
                  class="btn btn-primary btn-small"
                  on:click={requestNotificationPermission}
                >
                  Request Permission
                </button>
              {/if}
            </div>

            {#if errors.permission}
              <div class="error-text">{errors.permission}</div>
            {/if}

            <label class="setting-item">
              <input 
                type="checkbox" 
                bind:checked={settings.browserNotifications}
                class="setting-checkbox"
                disabled={notificationPermission !== 'granted'}
              />
              <div class="setting-content">
                <div class="setting-title">Browser Notifications</div>
                <div class="setting-description">Show system notifications outside the app</div>
              </div>
            </label>
          </div>

          <!-- Notification Types -->
          <div class="setting-group">
            <div class="setting-header">
              <h3>Notification Types</h3>
            </div>

            <label class="setting-item">
              <input 
                type="checkbox" 
                bind:checked={settings.estimatedTimeWarning}
                class="setting-checkbox"
              />
              <div class="setting-content">
                <div class="setting-title">Estimated Time Warnings</div>
                <div class="setting-description">Alert when approaching estimated task duration</div>
              </div>
            </label>

            <label class="setting-item">
              <input 
                type="checkbox" 
                bind:checked={settings.overtimeAlerts}
                class="setting-checkbox"
              />
              <div class="setting-content">
                <div class="setting-title">Overtime Alerts</div>
                <div class="setting-description">Alert when exceeding estimated task duration</div>
              </div>
            </label>

            <label class="setting-item">
              <input 
                type="checkbox" 
                bind:checked={settings.milestoneNotifications}
                class="setting-checkbox"
              />
              <div class="setting-content">
                <div class="setting-title">Milestone Notifications</div>
                <div class="setting-description">Celebrate focused work intervals</div>
              </div>
            </label>
          </div>

          <!-- Warning Threshold -->
          {#if settings.estimatedTimeWarning}
            <div class="setting-group">
              <div class="setting-header">
                <h3>Warning Threshold</h3>
              </div>

              <div class="form-group">
                <label for="threshold" class="form-label">
                  Warning at {Math.round(settings.warningThreshold * 100)}% of estimated time
                </label>
                <input 
                  id="threshold"
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  bind:value={settings.warningThreshold}
                  class="range-input"
                  class:error={errors.threshold}
                />
                <div class="range-labels">
                  <span>10%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
                {#if errors.threshold}
                  <span class="error-text">{errors.threshold}</span>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Milestone Configuration -->
          {#if settings.milestoneNotifications}
            <div class="setting-group">
              <div class="setting-header">
                <h3>Milestone Intervals</h3>
              </div>

              <div class="milestones-list">
                {#each settings.milestones as milestone (milestone)}
                  <div class="milestone-item">
                    <span class="milestone-label">{formatMilestone(milestone)}</span>
                    <button 
                      class="milestone-remove"
                      on:click={() => removeMilestone(milestone)}
                      title="Remove milestone"
                      aria-label="Remove {formatMilestone(milestone)} milestone"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                {/each}
              </div>

              <div class="add-milestone">
                <div class="form-row">
                  <input 
                    type="number"
                    min="1"
                    step="1"
                    bind:value={customMilestone}
                    placeholder="Minutes"
                    class="milestone-input"
                    class:error={errors.milestone}
                  />
                  <button 
                    type="button"
                    class="btn btn-secondary"
                    on:click={addCustomMilestone}
                    disabled={!customMilestone}
                  >
                    <Icon name="plus" size={14} />
                    Add
                  </button>
                </div>
                {#if errors.milestone}
                  <span class="error-text">{errors.milestone}</span>
                {/if}
                {#if errors.milestones}
                  <span class="error-text">{errors.milestones}</span>
                {/if}
              </div>
            </div>
          {/if}
        {/if}

        <!-- Modal Actions -->
        <div class="modal-actions">
          <button 
            type="button"
            class="btn btn-tertiary"
            on:click={resetToDefaults}
          >
            Reset to Defaults
          </button>
          
          <div class="action-buttons">
            <button 
              type="button"
              class="btn btn-secondary"
              on:click={closeModal}
            >
              Cancel
            </button>
            <button 
              type="button"
              class="btn btn-primary"
              on:click={saveSettings}
            >
              <Icon name="check" size={16} />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .modal-container {
    background: var(--nord0);
    border: 1px solid var(--nord3);
    border-radius: 12px;
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(129, 161, 193, 0.1);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--nord3);
    background: var(--nord1);
  }

  .modal-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--nord4);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    background: var(--nord2);
    color: var(--nord6);
  }

  .modal-content {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(191, 97, 106, 0.1);
    border: 1px solid var(--nord11);
    border-radius: 6px;
    color: var(--nord11);
    font-size: 0.875rem;
  }

  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .setting-header h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0;
  }

  .setting-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid var(--nord3);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .setting-item:hover {
    background: var(--nord1);
    border-color: var(--nord4);
  }

  .setting-checkbox {
    margin: 0;
    accent-color: var(--nord8);
  }

  .setting-content {
    flex: 1;
  }

  .setting-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--nord6);
    margin-bottom: 0.25rem;
  }

  .setting-description {
    font-size: 0.75rem;
    color: var(--nord4);
    line-height: 1.4;
  }

  .permission-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: var(--nord1);
    border: 1px solid var(--nord3);
    border-radius: 6px;
  }

  .permission-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--nord6);
  }

  .status-granted {
    color: var(--nord14);
    font-weight: 500;
  }

  .status-denied {
    color: var(--nord11);
    font-weight: 500;
  }

  .status-default {
    color: var(--nord13);
    font-weight: 500;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--nord6);
  }

  .range-input {
    width: 100%;
    height: 6px;
    background: var(--nord3);
    outline: none;
    border-radius: 3px;
    cursor: pointer;
  }

  .range-input::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    background: var(--nord8);
    border-radius: 50%;
    cursor: pointer;
  }

  .range-input::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: var(--nord8);
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }

  .range-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--nord4);
  }

  .milestones-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .milestone-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    background: var(--nord8);
    color: var(--nord0);
    border-radius: 16px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .milestone-label {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
  }

  .milestone-remove {
    width: 18px;
    height: 18px;
    border: none;
    background: transparent;
    color: currentColor;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .milestone-remove:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .add-milestone {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-row {
    display: flex;
    gap: 0.5rem;
  }

  .milestone-input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--nord3);
    border-radius: 4px;
    background: var(--nord1);
    color: var(--nord6);
    font-size: 0.875rem;
  }

  .milestone-input:focus {
    outline: none;
    border-color: var(--nord8);
  }

  .milestone-input.error {
    border-color: var(--nord11);
  }

  .error-text {
    font-size: 0.75rem;
    color: var(--nord11);
  }

  .modal-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 1rem;
    border-top: 1px solid var(--nord3);
  }

  .action-buttons {
    display: flex;
    gap: 0.75rem;
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-small {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
  }

  .btn-primary {
    background: var(--nord8);
    color: var(--nord0);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--nord9);
  }

  .btn-secondary {
    background: var(--nord2);
    color: var(--nord6);
    border: 1px solid var(--nord3);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--nord3);
  }

  .btn-tertiary {
    background: transparent;
    color: var(--nord4);
    border: 1px solid var(--nord3);
  }

  .btn-tertiary:hover:not(:disabled) {
    background: var(--nord1);
    color: var(--nord6);
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .modal-backdrop {
      padding: 0.5rem;
    }

    .modal-container {
      max-height: 95vh;
    }

    .modal-header {
      padding: 1rem;
    }

    .modal-content {
      padding: 1rem;
    }

    .modal-actions {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .action-buttons {
      justify-content: center;
    }

    .btn {
      justify-content: center;
    }
  }
</style>