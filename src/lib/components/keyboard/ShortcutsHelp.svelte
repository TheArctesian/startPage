<!--
  Keyboard Shortcuts Help Modal
  
  Displays all available keyboard shortcuts organized by category.
  Follows UNIX philosophy: focused on single responsibility of showing help.
-->

<script lang="ts">
  import { shortcutCategories, formatKeyCombo, isMac } from '$lib/stores/keyboard';
  import { createEventDispatcher } from 'svelte';

  export let isOpen = false;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  function handleClose() {
    dispatch('close');
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  // Get platform-specific modifier name
  $: modifierKey = isMac ? '⌘' : 'Ctrl';
</script>

<!-- Modal backdrop -->
{#if isOpen}
  <div 
    class="shortcuts-modal"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="shortcuts-title"
  >
    <div class="shortcuts-content">
      <!-- Header -->
      <div class="shortcuts-header">
        <h2 id="shortcuts-title" class="shortcuts-title">
          Keyboard Shortcuts
        </h2>
        <button 
          class="close-btn"
          onclick={handleClose}
          aria-label="Close shortcuts help"
        >
          ✕
        </button>
      </div>

      <!-- Content -->
      <div class="shortcuts-body">
        {#each Object.entries($shortcutCategories) as [category, shortcuts]}
          {#if shortcuts.length > 0}
            <div class="shortcut-category">
              <h3 class="category-title">{category}</h3>
              <div class="shortcut-list">
                {#each shortcuts as shortcut}
                  <div class="shortcut-item">
                    <div class="shortcut-description">
                      {shortcut.description}
                    </div>
                    <div class="shortcut-keys">
                      {formatKeyCombo(shortcut)}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {/each}

        <!-- Tips section -->
        <div class="shortcuts-tips">
          <h3 class="category-title">Tips</h3>
          <ul class="tips-list">
            <li>Press <kbd>Space</kbd> to quickly start/pause the timer</li>
            <li>Use <kbd>{modifierKey} + N</kbd> to create tasks faster</li>
            <li>Press <kbd>Escape</kbd> to close modals and cancel actions</li>
            <li>Shortcuts work globally except when typing in text fields</li>
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <div class="shortcuts-footer">
        <p class="shortcuts-note">
          Press <kbd>?</kbd> to toggle this help dialog
        </p>
      </div>
    </div>
  </div>
{/if}

<style>
  .shortcuts-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(46, 52, 64, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
    padding: var(--space-md);
    backdrop-filter: blur(4px);
  }

  .shortcuts-content {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-default);
    width: 100%;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: var(--shadow-xl);
    display: flex;
    flex-direction: column;
  }

  .shortcuts-header {
    display: flex;
    justify-content: between;
    align-items: center;
    padding: var(--space-lg);
    border-bottom: 1px solid var(--border-subtle);
    background: var(--bg-secondary);
  }

  .shortcuts-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: var(--font-size-lg);
    cursor: pointer;
    padding: var(--space-xs);
    border-radius: var(--radius-sm);
    transition: all var(--transition-normal);
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    background: var(--hover-bg);
    color: var(--text-primary);
  }

  .close-btn:focus {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .shortcuts-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-lg);
  }

  .shortcut-category {
    margin-bottom: var(--space-xl);
  }

  .shortcut-category:last-child {
    margin-bottom: 0;
  }

  .category-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 var(--space-md) 0;
    padding-bottom: var(--space-sm);
    border-bottom: 1px solid var(--border-subtle);
  }

  .shortcut-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .shortcut-item {
    display: flex;
    justify-content: between;
    align-items: center;
    padding: var(--space-sm);
    background: var(--bg-elevated);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-default);
  }

  .shortcut-description {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    flex: 1;
  }

  .shortcut-keys {
    font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--text-secondary);
    background: var(--bg-highest);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    white-space: nowrap;
  }

  .shortcuts-tips {
    margin-top: var(--space-xl);
    padding-top: var(--space-lg);
    border-top: 1px solid var(--border-subtle);
  }

  .tips-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .tips-list li {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    padding: var(--space-sm);
    background: var(--bg-elevated);
    border-radius: var(--radius-md);
    border-left: 3px solid var(--color-info);
  }

  .shortcuts-footer {
    padding: var(--space-md) var(--space-lg);
    border-top: 1px solid var(--border-subtle);
    background: var(--bg-secondary);
    text-align: center;
  }

  .shortcuts-note {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    margin: 0;
  }

  kbd {
    font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    background: var(--bg-highest);
    padding: 0.125rem var(--space-xs);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .shortcuts-modal {
      padding: var(--space-sm);
    }

    .shortcuts-content {
      max-height: 90vh;
    }

    .shortcuts-header,
    .shortcuts-body,
    .shortcuts-footer {
      padding: var(--space-md);
    }

    .shortcut-item {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-xs);
    }

    .shortcut-keys {
      align-self: flex-end;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .shortcuts-content {
      border-width: 2px;
    }

    .shortcut-item,
    kbd {
      border-width: 2px;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .close-btn {
      transition: none;
    }
  }

  /* Focus styles for accessibility */
  .shortcuts-modal:focus {
    outline: none;
  }

  .shortcut-item:focus-within {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }
</style>