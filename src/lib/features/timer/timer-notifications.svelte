<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { activeTimers } from '$lib/stores';
  import { fly, fade } from 'svelte/transition';
  import Icon from '$lib/ui/icon.svelte';
  import type { ActiveTimer } from '$lib/types/timer';

  // Notification state
  let notifications: TimerNotification[] = [];
  let notificationPermission: NotificationPermission = 'default';
  let checkInterval: NodeJS.Timeout | null = null;

  interface TimerNotification {
    id: string;
    type: 'warning' | 'overtime' | 'milestone';
    timerId: string;
    taskTitle: string;
    message: string;
    timestamp: Date;
    dismissed: boolean;
  }

  // Notification thresholds (in seconds)
  const NOTIFICATION_THRESHOLDS = {
    WARNING_PERCENT: 0.8, // 80% of estimated time
    MILESTONE_INTERVALS: [15 * 60, 30 * 60, 60 * 60], // 15min, 30min, 1hour
  };

  // Track which notifications have been sent to avoid duplicates
  let sentNotifications = new Set<string>();

  onMount(async () => {
    if (browser) {
      // Request notification permission
      if ('Notification' in window) {
        notificationPermission = Notification.permission;
        if (notificationPermission === 'default') {
          notificationPermission = await Notification.requestPermission();
        }
      }

      // Start checking for notification triggers
      startNotificationChecker();
    }
  });

  onDestroy(() => {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
  });

  function startNotificationChecker() {
    if (checkInterval) clearInterval(checkInterval);
    
    // Check every 30 seconds
    checkInterval = setInterval(() => {
      checkTimerNotifications();
    }, 30000);
  }

  function checkTimerNotifications() {
    if (!browser) return;

    const now = new Date();
    
    $activeTimers.forEach(timer => {
      if (!timer.isRunning || timer.pausedAt) return;

      const elapsedSeconds = timer.elapsedSeconds + 
        Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);
      
      // Check for estimated time warnings
      if (timer.task?.estimatedMinutes) {
        checkEstimatedTimeNotifications(timer, elapsedSeconds);
      }

      // Check for milestone notifications
      checkMilestoneNotifications(timer, elapsedSeconds);
    });
  }

  function checkEstimatedTimeNotifications(timer: ActiveTimer, elapsedSeconds: number) {
    if (!timer.task?.estimatedMinutes) return;

    const estimatedSeconds = timer.task.estimatedMinutes * 60;
    const warningThreshold = estimatedSeconds * NOTIFICATION_THRESHOLDS.WARNING_PERCENT;

    // Warning at 80% of estimated time
    const warningKey = `warning-${timer.id}`;
    if (elapsedSeconds >= warningThreshold && !sentNotifications.has(warningKey)) {
      const remainingMinutes = Math.ceil((estimatedSeconds - elapsedSeconds) / 60);
      
      sendNotification({
        id: generateNotificationId(),
        type: 'warning',
        timerId: timer.id,
        taskTitle: timer.task?.title || 'Task',
        message: `${remainingMinutes} minutes remaining of estimated time`,
        timestamp: new Date(),
        dismissed: false
      });
      
      sentNotifications.add(warningKey);
    }

    // Overtime notification
    const overtimeKey = `overtime-${timer.id}`;
    if (elapsedSeconds > estimatedSeconds && !sentNotifications.has(overtimeKey)) {
      const overtimeMinutes = Math.ceil((elapsedSeconds - estimatedSeconds) / 60);
      
      sendNotification({
        id: generateNotificationId(),
        type: 'overtime',
        timerId: timer.id,
        taskTitle: timer.task?.title || 'Task',
        message: `${overtimeMinutes} minutes over estimated time`,
        timestamp: new Date(),
        dismissed: false
      });
      
      sentNotifications.add(overtimeKey);
    }
  }

  function checkMilestoneNotifications(timer: ActiveTimer, elapsedSeconds: number) {
    NOTIFICATION_THRESHOLDS.MILESTONE_INTERVALS.forEach(milestone => {
      const milestoneKey = `milestone-${timer.id}-${milestone}`;
      
      if (elapsedSeconds >= milestone && !sentNotifications.has(milestoneKey)) {
        const milestoneMinutes = milestone / 60;
        
        sendNotification({
          id: generateNotificationId(),
          type: 'milestone',
          timerId: timer.id,
          taskTitle: timer.task?.title || 'Task',
          message: `${milestoneMinutes} minutes of focused work completed`,
          timestamp: new Date(),
          dismissed: false
        });
        
        sentNotifications.add(milestoneKey);
      }
    });
  }

  function sendNotification(notification: TimerNotification) {
    // Add to in-app notifications
    notifications = [notification, ...notifications.slice(0, 4)]; // Keep max 5 notifications

    // Send browser notification if permission granted
    if (notificationPermission === 'granted' && 'Notification' in window) {
      const browserNotification = new Notification(`Timer: ${notification.taskTitle}`, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.timerId, // Replace existing notifications for same timer
        requireInteraction: false,
        silent: false
      });

      // Auto-close browser notification after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);

      // Handle notification click
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };
    }

    // Auto-dismiss in-app notification after 10 seconds
    setTimeout(() => {
      dismissNotification(notification.id);
    }, 10000);
  }

  function dismissNotification(notificationId: string) {
    notifications = notifications.filter(n => n.id !== notificationId);
  }

  function dismissAllNotifications() {
    notifications = [];
  }

  function generateNotificationId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  function getNotificationIcon(type: TimerNotification['type']): string {
    switch (type) {
      case 'warning': return 'alert-triangle';
      case 'overtime': return 'alert-circle';
      case 'milestone': return 'check-circle';
      default: return 'bell';
    }
  }

  function getNotificationColor(type: TimerNotification['type']): string {
    switch (type) {
      case 'warning': return 'var(--nord13)';
      case 'overtime': return 'var(--nord11)';
      case 'milestone': return 'var(--nord14)';
      default: return 'var(--nord8)';
    }
  }

  // Clean up sent notifications when timers are stopped
  $: {
    const activeTimerIds = new Set($activeTimers.map(t => t.id));
    const keysToRemove: string[] = [];
    
    sentNotifications.forEach(key => {
      const timerId = key.split('-').slice(1, -1).join('-'); // Extract timer ID from key
      if (!activeTimerIds.has(timerId)) {
        keysToRemove.push(key);
      }
    });
    
    keysToRemove.forEach(key => {
      sentNotifications.delete(key);
    });
  }
</script>

<!-- In-app Notifications Container -->
{#if notifications.length > 0}
  <div class="notifications-container">
    {#each notifications as notification (notification.id)}
      <div 
        class="notification notification-{notification.type}"
        in:fly={{ x: 300, duration: 300 }}
        out:fly={{ x: 300, duration: 200 }}
        style="--notification-color: {getNotificationColor(notification.type)}"
      >
        <div class="notification-content">
          <div class="notification-icon">
            <Icon name={getNotificationIcon(notification.type)} size={16} />
          </div>
          
          <div class="notification-text">
            <div class="notification-title">{notification.taskTitle}</div>
            <div class="notification-message">{notification.message}</div>
          </div>
        </div>

        <button 
          class="notification-dismiss"
          on:click={() => dismissNotification(notification.id)}
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <Icon name="x" size={14} />
        </button>
      </div>
    {/each}

    <!-- Dismiss All Button (if multiple notifications) -->
    {#if notifications.length > 1}
      <div class="notification-actions" in:fade={{ duration: 200 }}>
        <button 
          class="dismiss-all-btn"
          on:click={dismissAllNotifications}
        >
          <Icon name="x" size={14} />
          Dismiss All
        </button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .notifications-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1001; /* Above timer widget */
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 350px;
    pointer-events: none; /* Allow clicks through empty space */
  }

  .notification {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(46, 52, 64, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid var(--nord3);
    border-left: 4px solid var(--notification-color);
    border-radius: 8px;
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(129, 161, 193, 0.1);
    pointer-events: auto; /* Re-enable clicks for notification */
    transition: all 0.2s ease;
  }

  .notification:hover {
    transform: translateY(-1px);
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(129, 161, 193, 0.2);
  }

  .notification-content {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    flex: 1;
    min-width: 0;
  }

  .notification-icon {
    flex-shrink: 0;
    color: var(--notification-color);
    margin-top: 0.125rem;
  }

  .notification-text {
    flex: 1;
    min-width: 0;
  }

  .notification-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--nord6);
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .notification-message {
    font-size: 0.75rem;
    color: var(--nord4);
    line-height: 1.4;
  }

  .notification-dismiss {
    flex-shrink: 0;
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

  .notification-dismiss:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--nord6);
  }

  .notification-dismiss:active {
    transform: scale(0.9);
  }

  .notification-actions {
    display: flex;
    justify-content: flex-end;
    pointer-events: auto;
  }

  .dismiss-all-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--nord3);
    background: rgba(46, 52, 64, 0.95);
    backdrop-filter: blur(10px);
    color: var(--nord4);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .dismiss-all-btn:hover {
    background: var(--nord2);
    color: var(--nord6);
    border-color: var(--nord4);
  }

  /* Notification type styles */
  .notification-warning {
    border-left-color: var(--nord13);
  }

  .notification-overtime {
    border-left-color: var(--nord11);
  }

  .notification-milestone {
    border-left-color: var(--nord14);
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .notifications-container {
      top: 10px;
      right: 10px;
      left: 10px;
      max-width: none;
    }

    .notification {
      padding: 0.75rem;
    }

    .notification-title {
      font-size: 0.8125rem;
    }

    .notification-message {
      font-size: 0.6875rem;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .notification {
      background: var(--nord0);
      border: 2px solid var(--nord6);
    }

    .dismiss-all-btn {
      background: var(--nord0);
      border: 2px solid var(--nord6);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .notification,
    .notification-dismiss,
    .dismiss-all-btn {
      transition: none;
    }

    .notification:hover {
      transform: none;
    }
  }

  /* Dark mode adjustments */
  @media (prefers-color-scheme: dark) {
    .notification {
      background: rgba(46, 52, 64, 0.98);
    }

    .dismiss-all-btn {
      background: rgba(46, 52, 64, 0.98);
    }
  }
</style>